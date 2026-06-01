<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Attempt;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'subject',
        'original_filename',
        'file_path',
        'file_size',
        'status',
        'error_message',
        'total_chapters',
        'total_questions',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuestionBank::class);
    }

    public function mockTests(): HasMany
    {
        return $this->hasMany(MockTest::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function (Document $document) {
            // Delete grand-child attempts first
            $mockTestIds = $document->mockTests()->pluck('id');
            if ($mockTestIds->isNotEmpty()) {
                Attempt::whereIn('mock_test_id', $mockTestIds)->delete();
            }

            // Delete child records
            $document->mockTests()->delete();
            $document->questions()->delete();
            $document->chapters()->delete();
        });
    }
}
