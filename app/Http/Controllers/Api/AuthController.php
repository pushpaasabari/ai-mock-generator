<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ──────────────────────────────────────────────────────────────────
    // REGISTER — create user (unverified), send OTP
    // ──────────────────────────────────────────────────────────────────
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:15',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'plan' => 'free',
            'email_verified_at' => null, // unverified until OTP confirmed
        ]);

        $otp = $user->generateAndSaveOtp();
        Mail::to($user->email)->send(new OtpMail($otp, 'verification', $user->name));

        return response()->json([
            'requires_verification' => true,
            'email' => $user->email,
            'message' => 'Account created! Please check your email for the OTP to verify your account.',
        ], 201);
    }

    // ──────────────────────────────────────────────────────────────────
    // VERIFY EMAIL — submit OTP after registration
    // ──────────────────────────────────────────────────────────────────
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified. Please login.'], 422);
        }

        if (!$user->isOtpValid($request->otp)) {
            return response()->json(['error' => 'Invalid or expired OTP. Please request a new one.'], 422);
        }

        $user->update(['email_verified_at' => now()]);
        $user->clearOtp();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->userResource($user),
            'token' => $token,
            'message' => 'Email verified successfully! Welcome aboard 🎉',
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // RESEND OTP — resend signup verification OTP
    // ──────────────────────────────────────────────────────────────────
    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 422);
        }

        // Rate limit: only resend if previous OTP is expired or doesn't exist
        if ($user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $secondsLeft = now()->diffInSeconds($user->otp_expires_at);
            return response()->json([
                'error' => 'An OTP was recently sent. Please wait before requesting another.',
                'retry_after' => $secondsLeft,
            ], 429);
        }

        $otp = $user->generateAndSaveOtp();
        Mail::to($user->email)->send(new OtpMail($otp, 'verification', $user->name));

        return response()->json(['message' => 'A new OTP has been sent to your email.']);
    }

    // ──────────────────────────────────────────────────────────────────
    // LOGIN — block unverified users
    // ──────────────────────────────────────────────────────────────────
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($validated)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();

        if (!$user->email_verified_at) {
            Auth::logout();
            return response()->json([
                'error' => 'Please verify your email before logging in.',
                'requires_verification' => true,
                'email' => $user->email,
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->userResource($user),
            'token' => $token,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD — send reset OTP
    // ──────────────────────────────────────────────────────────────────
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Rate limit: prevent spamming
        if ($user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $secondsLeft = now()->diffInSeconds($user->otp_expires_at);
            return response()->json([
                'error' => 'An OTP was recently sent. Please wait before requesting another.',
                'retry_after' => $secondsLeft,
            ], 429);
        }

        $otp = $user->generateAndSaveOtp();
        Mail::to($user->email)->send(new OtpMail($otp, 'password_reset', $user->name));

        return response()->json([
            'message' => 'Password reset OTP sent to your email.',
            'email' => $user->email,
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // RESET PASSWORD — verify OTP and set new password
    // ──────────────────────────────────────────────────────────────────
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user->isOtpValid($request->otp)) {
            return response()->json(['error' => 'Invalid or expired OTP.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->clearOtp();

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return response()->json(['message' => 'Password reset successfully. Please login with your new password.']);
    }

    // ──────────────────────────────────────────────────────────────────
    // LOGOUT
    // ──────────────────────────────────────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    // ──────────────────────────────────────────────────────────────────
    // ME
    // ──────────────────────────────────────────────────────────────────
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('documents');

        return response()->json([
            'user' => $this->userResource($user),
            'stats' => [
                'total_documents' => $user->documents->count(),
                'total_attempts' => $user->attempts()->count(),
                'avg_score' => $user->attempts()->where('status', 'completed')->avg('percentage') ?? 0,
            ]
        ]);
    }

    // ──────────────────────────────────────────────────────────────────
    // HELPER
    // ──────────────────────────────────────────────────────────────────
    private function userResource(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $user->plan,
            'plan_expires_at' => $user->plan_expires_at,
            'is_pro' => $user->isPro(),
            'is_admin' => $user->is_admin,
            'daily_mock_count' => $user->daily_mock_count,
            'can_take_mock' => $user->canTakeMockToday(),
            'email_verified' => (bool) $user->email_verified_at,
            'created_at' => $user->created_at,
        ];
    }
}
