<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'plan',
        'plan_expires_at',
        'daily_mock_count',
        'last_mock_date',
        'phone',
        'is_admin',
        'otp',
        'otp_expires_at',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'plan_expires_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'last_mock_date' => 'date',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function mockTests(): HasMany
    {
        return $this->hasMany(MockTest::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    public function isPro(): bool
    {
        if ($this->plan !== 'pro')
            return false;
        if ($this->plan_expires_at && $this->plan_expires_at->isPast())
            return false;
        return true;
    }

    public function canTakeMockToday(): bool
    {
        if ($this->isPro())
            return true;

        $today = now()->toDateString();
        if ($this->last_mock_date?->toDateString() !== $today) {
            return true;
        }

        return $this->daily_mock_count < 3;
    }

    public function incrementMockCount(): void
    {
        $today = now()->toDateString();
        if ($this->last_mock_date?->toDateString() !== $today) {
            $this->update(['daily_mock_count' => 1, 'last_mock_date' => $today]);
        } else {
            $this->increment('daily_mock_count');
        }
    }

    /** Generate a 6-digit OTP valid for 10 minutes and save it. */
    public function generateAndSaveOtp(): string
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->update([
            'otp' => $otp,
            'otp_expires_at' => now()->addMinutes(10),
        ]);
        return $otp;
    }

    public function isOtpValid(string $otp): bool
    {
        return $this->otp === $otp
            && $this->otp_expires_at
            && $this->otp_expires_at->isFuture();
    }

    public function clearOtp(): void
    {
        $this->update(['otp' => null, 'otp_expires_at' => null]);
    }
}
