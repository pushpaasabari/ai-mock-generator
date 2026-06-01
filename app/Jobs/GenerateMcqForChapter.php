<?php

namespace App\Jobs;

use App\Models\Chapter;
use App\Models\Document;
use App\Services\McqGeneratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateMcqForChapter implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 6;

    /**
     * How long (seconds) to wait before each retry attempt.
     * Laravel will use these delays between retry attempts.
     */
    public function backoff(): array
    {
        return [30, 60, 120, 240, 300]; // 30s, 1m, 2m, 4m, 5m
    }

    public function __construct(public Chapter $chapter)
    {
    }

    public function handle(McqGeneratorService $mcqService): void
    {
        set_time_limit(0);

        // Skip if already done by a previous attempt
        $this->chapter->refresh();
        if ($this->chapter->status === 'done') {
            return;
        }

        $result = $mcqService->generateForChapter($this->chapter);

        if (!$result['success']) {
            $isRateLimit = str_contains(strtolower($result['error'] ?? ''), 'rate limit');
            if ($isRateLimit && $this->attempts() < $this->tries) {
                // Re-throw so Laravel's backoff() handles the delay and retry
                throw new \RuntimeException("Rate limited: " . $result['error']);
            }
        }

        // After this chapter is done, check if the whole document is now complete
        $document = $this->chapter->document;
        if ($document) {
            $pendingCount = $document->chapters()->whereIn('status', ['pending', 'generating'])->count();
            $failedCount = $document->chapters()->where('status', 'failed')->count();
            $doneCount = $document->chapters()->where('status', 'done')->count();
            $totalCount = $document->chapters()->count();

            if ($pendingCount === 0) {
                $document->update([
                    'status' => $failedCount > 0 && $doneCount === 0 ? 'failed' : 'processed',
                    'total_questions' => $document->questions()->count(),
                    'error_message' => $failedCount > 0 && $doneCount === 0
                        ? 'MCQ generation failed for all chapters due to rate limits.'
                        : null,
                ]);
                Log::info("Document {$document->id} finalized: {$doneCount}/{$totalCount} chapters done.");
            }
        }
    }

    /**
     * When all retries are exhausted, mark the chapter as failed and check document status.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Chapter {$this->chapter->id} MCQ generation failed after all retries: " . $exception->getMessage());
        $this->chapter->update(['status' => 'failed']);

        $document = $this->chapter->document;
        if ($document) {
            $pendingCount = $document->chapters()->whereIn('status', ['pending', 'generating'])->count();
            if ($pendingCount === 0) {
                $document->update([
                    'status' => 'failed',
                    'error_message' => 'MCQ Generation failed: Request rate limit has been exceeded.',
                ]);
            }
        }
    }
}
