<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AttemptController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\MockTestController;
use Illuminate\Support\Facades\Route;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Documents
    Route::apiResource('documents', DocumentController::class)->except(['update']);
    Route::get('/documents/{document}/status', [DocumentController::class, 'status']);

    // Mock Tests
    Route::apiResource('mock-tests', MockTestController::class)->except(['update']);

    // Attempts
    Route::post('/mock-tests/{mockTest}/start', [AttemptController::class, 'start']);
    Route::post('/attempts/{attempt}/submit', [AttemptController::class, 'submit']);
    Route::get('/attempts/{attempt}/result', [AttemptController::class, 'result']);
    Route::get('/attempts/{attempt}/pdf', [AttemptController::class, 'downloadPdf']);
    Route::get('/attempts/history', [AttemptController::class, 'history']);

    // Analytics
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('/analytics/leaderboard', [AnalyticsController::class, 'leaderboard']);

    // ── Admin Routes (is_admin check done inside controller) ─────────────
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::post('/users/{id}/upgrade', [AdminController::class, 'upgradeUser']);
        Route::post('/users/{id}/downgrade', [AdminController::class, 'downgradeUser']);
        Route::get('/documents', [AdminController::class, 'documents']);
        Route::delete('/documents/{id}', [AdminController::class, 'deleteDocument']);
    });
});
