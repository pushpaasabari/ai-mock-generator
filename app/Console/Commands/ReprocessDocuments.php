<?php

namespace App\Console\Commands;

use App\Jobs\ProcessPdfDocument;
use App\Models\Document;
use Illuminate\Console\Command;

class ReprocessDocuments extends Command
{
    protected $signature = 'documents:reprocess {--id= : Reprocess a specific document ID}';
    protected $description = 'Reprocess stuck or failed documents through PDF parsing and MCQ generation';

    public function handle(): void
    {
        $query = Document::query();

        if ($id = $this->option('id')) {
            $query->where('id', $id);
        } else {
            $query->whereIn('status', ['uploaded', 'processing', 'failed']);
        }

        $documents = $query->get();

        if ($documents->isEmpty()) {
            $this->info('No documents to reprocess.');
            return;
        }

        $this->info("Found {$documents->count()} document(s). Processing...");

        foreach ($documents as $doc) {
            $this->line("  → [{$doc->id}] {$doc->title} (status: {$doc->status})");
            $doc->update(['status' => 'uploaded']);
            ProcessPdfDocument::dispatchSync($doc);
            $doc->refresh();
            $this->info("     ✓ Done — status: {$doc->status}, questions: {$doc->total_questions}");
        }

        $this->info('All documents processed!');
    }
}
