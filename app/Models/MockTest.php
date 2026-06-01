<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MockTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'user_id',
        'title',
        'total_questions',
        'duration_minutes',
        'negative_marking',
        'question_ids',
        'status',
    ];

    protected $casts = [
        'question_ids' => 'array',
        'negative_marking' => 'float',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function (MockTest $mockTest) {
            $mockTest->attempts()->delete();
        });
    }
}
