<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EspController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes for API endpoints (POST, PUT, DELETE, etc.) that return JSON
| responses. These are separate from web routes which handle Inertia page
| navigation. API routes are prefixed with /api and use Sanctum token auth.
|
*/

// Public API routes (no authentication required)
Route::post('/login', [AuthController::class, 'login'])->name('api.login');

// ESP management API routes
Route::get('/esp', [EspController::class, 'index'])->name('api.esp.index');
Route::post('/esp', [EspController::class, 'store'])->name('api.esp.store');
Route::put('/esp/{id}', [EspController::class, 'update'])->name('api.esp.update');
Route::delete('/esp/{id}', [EspController::class, 'destroy'])->name('api.esp.destroy');

// Protected API routes (require valid Sanctum token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/profile', [ProfileController::class, 'show'])->name('api.profile.show');
    Route::put('/profile', [ProfileController::class, 'updateApi'])->name('api.profile.update');
});
