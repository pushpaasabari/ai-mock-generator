<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $attempts = $user->attempts()
            ->with('mockTest:id,title')
            ->whereIn('status', ['completed', 'timed_out'])
            ->orderBy('submitted_at')
            ->get();

        // Performance trend
        $trend = $attempts->map(fn($a) => [
            'date' => $a->submitted_at?->format('d M'),
            'score' => $a->percentage,
            'test' => $a->mockTest?->title,
        ]);

        // Topic-wise performance
        $topicPerformance = [];
        foreach ($attempts as $attempt) {
            if (!$attempt->answers)
                continue;
            $questions = $attempt->mockTest?->questions ?? [];
        }

        // Scores distribution
        $distribution = [
            '90-100' => $attempts->where('percentage', '>=', 90)->count(),
            '80-89' => $attempts->whereBetween('percentage', [80, 89])->count(),
            '70-79' => $attempts->whereBetween('percentage', [70, 79])->count(),
            '60-69' => $attempts->whereBetween('percentage', [60, 69])->count(),
            '50-59' => $attempts->whereBetween('percentage', [50, 59])->count(),
            'Below 50' => $attempts->where('percentage', '<', 50)->count(),
        ];

        $totalAttempts = $attempts->count();
        $avgScore = $totalAttempts > 0 ? round($attempts->avg('percentage'), 2) : 0;
        $bestScore = $totalAttempts > 0 ? $attempts->max('percentage') : 0;
        $totalTime = $attempts->sum('time_taken_seconds');

        return response()->json([
            'summary' => [
                'total_attempts' => $totalAttempts,
                'avg_score' => $avgScore,
                'best_score' => $bestScore,
                'total_time_minutes' => round($totalTime / 60, 1),
                'rank_grade' => $this->getGrade($avgScore),
            ],
            'trend' => $trend,
            'distribution' => $distribution,
            'recent_attempts' => $attempts->take(5)->values(),
        ]);
    }

    public function leaderboard(Request $request): JsonResponse
    {
        $mockTestId = $request->query('mock_test_id');

        $query = Attempt::query()
            ->with('user:id,name')
            ->whereIn('status', ['completed', 'timed_out'])
            ->when($mockTestId, fn($q) => $q->where('mock_test_id', $mockTestId))
            ->orderByDesc('percentage')
            ->orderBy('time_taken_seconds')
            ->limit(20);

        $leaderboard = $query->get()->map(fn($a, $i) => [
            'rank' => $i + 1,
            'user_name' => $a->user->name,
            'score' => $a->percentage,
            'grade' => $this->getGrade($a->percentage),
            'time_taken' => gmdate('H:i:s', $a->time_taken_seconds),
            'submitted_at' => $a->submitted_at?->format('d M Y'),
        ]);

        return response()->json(['leaderboard' => $leaderboard]);
    }

    private function getGrade(float $pct): string
    {
        return match (true) {
            $pct >= 90 => 'A+',
            $pct >= 80 => 'A',
            $pct >= 70 => 'B+',
            $pct >= 60 => 'B',
            $pct >= 50 => 'C',
            $pct >= 40 => 'D',
            default => 'F'
        };
    }
}
