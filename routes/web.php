<?php

use Illuminate\Support\Facades\Route;

// Named 'login' route required by Sanctum's unauthenticated error handler.
// Returns JSON 401 since this is a token-based API app.
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Serve React SPA as fallback for all non-matched routes (i.e., non-API routes).
// Route::fallback only fires when nothing else in web.php or api.php matches.
Route::fallback(function () {
    return view('app');
});
