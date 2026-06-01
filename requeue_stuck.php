<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$stuckDocs = App\Models\Document::whereIn('status', ['uploaded', 'processing', 'failed'])->get();
echo "Found " . $stuckDocs->count() . " stuck docs.\n";

foreach ($stuckDocs as $d) {
    if ($d->status === 'failed') {
        $d->update(['status' => 'uploaded', 'error_message' => null]);
    }

    // Dispatch every stuck doc
    App\Jobs\ProcessPdfDocument::dispatch($d);
    echo "Dispatched Doc ID: {$d->id} (" . $d->title . ")\n";
}
