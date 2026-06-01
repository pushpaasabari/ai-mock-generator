<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attempt;
use App\Models\MockTest;
use App\Models\QuestionBank;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttemptController extends Controller
{
    public function start(Request $request, MockTest $mockTest): JsonResponse
    {
        $user = $request->user();
        $this->authorize('view', $mockTest);

        if (!$user->canTakeMockToday()) {
            return response()->json([
                'error' => 'Daily mock limit reached. Upgrade to Pro for unlimited mocks.',
                'limit_reached' => true,
            ], 403);
        }

        // Check for existing in-progress attempt
        $existing = Attempt::where('mock_test_id', $mockTest->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->latest()
            ->first();

        if ($existing) {
            return response()->json([
                'attempt' => $existing,
                'message' => 'Resuming existing attempt',
                'resumed' => true,
            ]);
        }

        $attempt = Attempt::create([
            'mock_test_id' => $mockTest->id,
            'user_id' => $user->id,
            'answers' => [],
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        $user->incrementMockCount();

        return response()->json([
            'attempt' => $attempt,
            'message' => 'Attempt started',
            'resumed' => false,
        ], 201);
    }

    public function submit(Request $request, Attempt $attempt): JsonResponse
    {
        $this->authorize('update', $attempt);

        if ($attempt->status !== 'in_progress') {
            return response()->json(['error' => 'Attempt already submitted'], 422);
        }

        $validated = $request->validate([
            'answers' => 'present|array',
            'time_taken_seconds' => 'required|integer|min:0',
            'timed_out' => 'nullable|boolean',
        ]);

        $mockTest = $attempt->mockTest;
        $questions = QuestionBank::whereIn('id', $mockTest->question_ids)
            ->get(['id', 'correct_answer'])
            ->keyBy('id');

        $answers = $validated['answers'] ?? [];
        $correct = 0;
        $wrong = 0;
        $skipped = 0;
        $negativeMarkFactor = $mockTest->negative_marking;

        foreach ($mockTest->question_ids as $qId) {
            if (!isset($answers[$qId]) || $answers[$qId] === null || $answers[$qId] === '') {
                $skipped++;
            } elseif (strtoupper($answers[$qId]) === $questions[$qId]->correct_answer) {
                $correct++;
            } else {
                $wrong++;
            }
        }

        $rawScore = $correct - ($wrong * $negativeMarkFactor);
        $maxScore = $mockTest->total_questions;
        $finalScore = max(0, $rawScore);
        $percentage = $maxScore > 0 ? round(($finalScore / $maxScore) * 100, 2) : 0;

        $attempt->update([
            'answers' => $answers,
            'correct_count' => $correct,
            'wrong_count' => $wrong,
            'skipped_count' => $skipped,
            'raw_score' => $rawScore,
            'final_score' => $finalScore,
            'percentage' => $percentage,
            'time_taken_seconds' => $validated['time_taken_seconds'],
            'status' => $validated['timed_out'] ? 'timed_out' : 'completed',
            'submitted_at' => now(),
        ]);

        return response()->json([
            'attempt' => $attempt->fresh(),
            'result' => [
                'correct' => $correct,
                'wrong' => $wrong,
                'skipped' => $skipped,
                'raw_score' => $rawScore,
                'final_score' => $finalScore,
                'percentage' => $percentage,
                'grade' => $this->getGrade($percentage),
                'time_taken' => gmdate('H:i:s', $validated['time_taken_seconds']),
            ]
        ]);
    }

    public function result(Request $request, Attempt $attempt): JsonResponse
    {
        $this->authorize('view', $attempt);

        if ($attempt->status === 'in_progress') {
            return response()->json(['error' => 'Attempt not yet submitted'], 422);
        }

        // Load questions with correct answers for review
        $mockTest = $attempt->mockTest;
        $questions = QuestionBank::whereIn('id', $mockTest->question_ids)
            ->get(['id', 'question', 'options', 'correct_answer', 'explanation', 'topic', 'difficulty']);

        $answers = $attempt->answers ?? [];
        $questionReview = $questions->map(function ($q) use ($answers) {
            $selected = $answers[$q->id] ?? null;
            return [
                'id' => $q->id,
                'question' => $q->question,
                'options' => $q->options,
                'correct_answer' => $q->correct_answer,
                'explanation' => $q->explanation,
                'topic' => $q->topic,
                'difficulty' => $q->difficulty,
                'selected_answer' => $selected,
                'is_correct' => $selected && strtoupper($selected) === $q->correct_answer,
                'is_skipped' => !$selected,
            ];
        })->values();

        $topicAnalysis = $questionReview->groupBy('topic')->map(function ($items, $topic) {
            $total = $items->count();
            $correct = $items->where('is_correct', true)->count();
            return [
                'topic' => $topic ?: 'General',
                'total' => $total,
                'correct' => $correct,
                'wrong' => $items->where('is_correct', false)->where('is_skipped', false)->count(),
                'skipped' => $items->where('is_skipped', true)->count(),
                'accuracy' => $total > 0 ? round(($correct / $total) * 100, 1) : 0,
            ];
        })->values();

        return response()->json([
            'attempt' => $attempt,
            'mock_test' => $mockTest->only(['id', 'title', 'duration_minutes', 'negative_marking']),
            'result_summary' => [
                'correct' => (int) $attempt->correct_count,
                'wrong' => (int) $attempt->wrong_count,
                'skipped' => (int) $attempt->skipped_count,
                'final_score' => (float) $attempt->final_score,
                'percentage' => (float) $attempt->percentage,
                'grade' => $this->getGrade($attempt->percentage),
                'time_taken' => gmdate('H:i:s', $attempt->time_taken_seconds),
            ],
            'topic_analysis' => $topicAnalysis,
            'questions' => $questionReview
        ]);
    }

    public function downloadPdf(Request $request, Attempt $attempt)
    {
        $this->authorize('view', $attempt);

        if ($attempt->status === 'in_progress') {
            return response()->json(['error' => 'Attempt not yet submitted'], 422);
        }

        $mockTest = $attempt->mockTest;
        $questions = QuestionBank::whereIn('id', $mockTest->question_ids)
            ->get(['id', 'question', 'options', 'correct_answer', 'explanation', 'topic', 'difficulty']);

        $answers = $attempt->answers ?? [];
        $questionReview = $questions->map(function ($q) use ($answers, $questions) {
            $selected = $answers[$q->id] ?? null;
            if ($questions->first()->id === $q->id) {
                \Log::debug('FIRST QUESTION RAW: ' . $q->question);
            }
            return [
                'id' => $q->id,
                'question' => $q->question,
                'options' => $q->options,
                'correct_answer' => $q->correct_answer,
                'explanation' => $q->explanation,
                'topic' => $q->topic,
                'difficulty' => $q->difficulty,
                'selected_answer' => $selected,
                'is_correct' => $selected && strtoupper($selected) === $q->correct_answer,
                'is_skipped' => !$selected,
            ];
        })->values();

        $topicAnalysis = $questionReview->groupBy('topic')->map(function ($items, $topic) {
            $total = $items->count();
            $correct = $items->where('is_correct', true)->count();
            return [
                'topic' => $topic ?: 'General',
                'total' => $total,
                'correct' => $correct,
                'wrong' => $items->where('is_correct', false)->where('is_skipped', false)->count(),
                'skipped' => $items->where('is_skipped', true)->count(),
                'accuracy' => $total > 0 ? round(($correct / $total) * 100, 1) : 0,
            ];
        })->values();

        $viewData = [
            'attempt' => $attempt,
            'mockTest' => $mockTest,
            'questions' => $questionReview,
            'topicAnalysis' => $topicAnalysis,
            'grade' => $this->getGrade($attempt->percentage)
        ];

        $pdf = Pdf::loadView('pdf.test-result', $viewData)->setOptions([
            'defaultFont' => 'DejaVu Sans',
            'isRemoteEnabled' => false,
            'isHtml5ParserEnabled' => true,
        ]);

        $fileName = 'Test_Result_' . preg_replace('/[^A-Za-z0-9]/', '_', $mockTest->title) . '.pdf';

        return $pdf->download($fileName);
    }

    public function history(Request $request): JsonResponse
    {
        $attempts = $request->user()
            ->attempts()
            ->with('mockTest:id,title,total_questions,duration_minutes')
            ->whereIn('status', ['completed', 'timed_out'])
            ->orderByDesc('submitted_at')
            ->paginate(10);

        return response()->json($attempts);
    }

    private function getGrade(float $percentage): string
    {
        return match (true) {
            $percentage >= 90 => 'A+',
            $percentage >= 80 => 'A',
            $percentage >= 70 => 'B+',
            $percentage >= 60 => 'B',
            $percentage >= 50 => 'C',
            $percentage >= 40 => 'D',
            default => 'F'
        };
    }
}
