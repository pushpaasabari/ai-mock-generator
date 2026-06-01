<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPdfDocument;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Show all documents that are processed to everyone. 
        // If user is admin, show all documents regardless of status.
        $query = Document::query();

        if (!$request->user()->is_admin) {
            $query->where('status', 'processed');
        }

        $documents = $query->withCount(['chapters', 'questions'])
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->is_admin) {
            return response()->json(['error' => 'Only admins can upload documents.'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,gif,webp,bmp|max:30720', // 30MB max
            'title' => 'required|string|max:255',
            'subject' => 'nullable|string|max:100',
        ]);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();
        $isImage = str_starts_with($mimeType, 'image/');

        $path = $file->store('documents/' . $request->user()->id, 'private');

        $document = Document::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'subject' => $request->subject,
            'original_filename' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'status' => 'uploaded',
            'file_type' => $isImage ? 'image' : 'pdf',
        ]);

        // Dispatch processing job (handles both PDF and image)
        ProcessPdfDocument::dispatch($document);

        return response()->json([
            'document' => $document,
            'message' => $isImage
                ? 'Image uploaded. AI is extracting text and generating questions...'
                : 'Document uploaded. Processing started in background.'
        ], 201);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        $this->authorize('view', $document);

        $document->load([
            'chapters' => function ($q) {
                $q->withCount('questions')->orderBy('chapter_number');
            }
        ]);

        return response()->json($document);
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        $this->authorize('delete', $document);

        Storage::disk('private')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }

    public function status(Request $request, Document $document): JsonResponse
    {
        $this->authorize('view', $document);

        $chapters = $document->chapters()->withCount('questions')
            ->orderBy('chapter_number')->get();

        return response()->json([
            'document_status' => $document->status,
            'total_chapters' => $document->total_chapters,
            'total_questions' => $document->fresh()->total_questions,
            'chapters' => $chapters,
        ]);
    }
}
