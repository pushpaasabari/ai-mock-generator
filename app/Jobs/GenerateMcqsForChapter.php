<?php

namespace App\Jobs;

use App\Models\Chapter;
use App\Services\McqGeneratorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateMcqsForChapter implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 2;

    public function __construct(public Chapter $chapter)
    {
    }

    public function handle(McqGeneratorService $service): void
    {
        $service->generateForChapter($this->chapter);
    }
}
