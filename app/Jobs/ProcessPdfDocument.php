<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\PdfProcessingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPdfDocument implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;
    public int $tries = 2;

    public function __construct(public Document $document)
    {
    }

    public function handle(PdfProcessingService $pdfService): void
    {
        set_time_limit(0);

        $result = $pdfService->processDocument($this->document);

        if ($result['success']) {
            // Dispatch one small job per chapter, staggered by 10s each
            // so we don't hit OpenAI rate limits by firing all at once.
            $chapters = $this->document->chapters()->where('status', 'pending')->get();

            foreach ($chapters as $index => $chapter) {
                GenerateMcqForChapter::dispatch($chapter)
                    ->delay(now()->addSeconds($index * 10));
            }
        }
    }
}

