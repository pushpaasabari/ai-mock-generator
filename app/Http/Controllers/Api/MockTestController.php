<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\MockTest;
use App\Models\QuestionBank;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MockTestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Show all active mock tests to everyone
        $tests = MockTest::where('status', 'active')
            ->with('document:id,title,subject')
            ->withCount('attempts')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json($tests);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_id' => 'required|exists:documents,id',
            'title' => 'required|string|max:255',
            'total_questions' => 'required|integer|min:5|max:200',
            'duration_minutes' => 'required|integer|min:5|max:300',
            'negative_marking' => 'required|numeric|min:0|max:1',
            'difficulty' => 'nullable|in:easy,medium,hard,mixed',
            'chapter_ids' => 'nullable|array',
            'chapter_ids.*' => 'exists:chapters,id',
        ]);

        $document = Document::findOrFail($validated['document_id']);
        $this->authorize('view', $document);

        // Check if enough questions exist
        $query = QuestionBank::where('document_id', $document->id)->where('is_active', true);

        if (!empty($validated['chapter_ids'])) {
            $query->whereIn('chapter_id', $validated['chapter_ids']);
        }

        if (!empty($validated['difficulty']) && $validated['difficulty'] !== 'mixed') {
            $query->where('difficulty', $validated['difficulty']);
        }

        $availableQuestions = $query->count();

        if ($availableQuestions < 5) {
            return response()->json([
                'error' => "This document only has {$availableQuestions} questions. Please generate at least 5 questions to create a mock test."
            ], 422);
        }

        if ($availableQuestions < $validated['total_questions']) {
            // Auto-adjust to max available if user asked for more
            $validated['total_questions'] = $availableQuestions;
        }

        // Randomly select questions
        $questionIds = $query->inRandomOrder()
            ->limit($validated['total_questions'])
            ->pluck('id')
            ->toArray();

        // Update times_used
        QuestionBank::whereIn('id', $questionIds)->increment('times_used');

        $mockTest = MockTest::create([
            'document_id' => $document->id,
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'total_questions' => $validated['total_questions'],
            'duration_minutes' => $validated['duration_minutes'],
            'negative_marking' => $validated['negative_marking'],
            'question_ids' => $questionIds,
            'status' => 'active',
        ]);

        return response()->json([
            'mock_test' => $mockTest->load('document:id,title,subject'),
            'message' => 'Mock test created successfully!'
        ], 201);
    }

    public function show(Request $request, MockTest $mockTest): JsonResponse
    {
        $this->authorize('view', $mockTest);

        // Don't return correct answers - only return question data for the test
        $questions = QuestionBank::whereIn('id', $mockTest->question_ids)
            ->get(['id', 'question', 'options', 'topic', 'difficulty'])
            ->shuffle()
            ->values();

        return response()->json([
            'mock_test' => [
                'id' => $mockTest->id,
                'title' => $mockTest->title,
                'total_questions' => $mockTest->total_questions,
                'duration_minutes' => $mockTest->duration_minutes,
                'negative_marking' => $mockTest->negative_marking,
                'document' => $mockTest->document->only(['id', 'title', 'subject']),
            ],
            'questions' => $questions
        ]);
    }

    public function destroy(Request $request, MockTest $mockTest): JsonResponse
    {
        $this->authorize('delete', $mockTest);
        $mockTest->delete();

        return response()->json(['message' => 'Mock test deleted successfully']);
    }
}
