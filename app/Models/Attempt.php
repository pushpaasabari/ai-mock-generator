<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'mock_test_id',
        'user_id',
        'answers',
        'correct_count',
        'wrong_count',
        'skipped_count',
        'raw_score',
        'final_score',
        'percentage',
        'time_taken_seconds',
        'status',
        'started_at',
        'submitted_at',
    ];

    protected $casts = [
        'answers' => 'array',
        'correct_count' => 'integer',
        'wrong_count' => 'integer',
        'skipped_count' => 'integer',
        'time_taken_seconds' => 'integer',
        'raw_score' => 'float',
        'final_score' => 'float',
        'percentage' => 'float',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function mockTest(): BelongsTo
    {
        return $this->belongsTo(MockTest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
