<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DatasetController;
use App\Http\Controllers\EspController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\ActuatorController;
use App\Http\Controllers\AiInsightController;
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
Route::middleware(['web'])->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.login');
});

// ESP management API routes
Route::get('/esp', [EspController::class, 'index'])->name('api.esp.index');
Route::post('/esp', [EspController::class, 'store'])->name('api.esp.store');
Route::put('/esp/{id}', [EspController::class, 'update'])->name('api.esp.update');
Route::delete('/esp/{id}', [EspController::class, 'destroy'])->name('api.esp.destroy');

// Telemetry & Risk Assessment API (from ESP32 and Raspberry Pi)
Route::post('/telemetry', [TelemetryController::class, 'receiveTelemetry'])->name('api.telemetry.receive');
Route::post('/sfr/update', [TelemetryController::class, 'updateSfr'])->name('api.sfr.update');
Route::get('/telemetry/latest/{kolam_id?}', [TelemetryController::class, 'getLatestTelemetry'])->name('api.telemetry.latest');
Route::get('/telemetry/history/{kolam_id?}', [TelemetryController::class, 'getTelemetryHistory'])->name('api.telemetry.history');

// Smart Water Exchange & Actuators API
Route::get('/actuators/status/{kolam_id?}', [ActuatorController::class, 'getStatus'])->name('api.actuators.status');
Route::post('/actuators/water-exchange/trigger', [ActuatorController::class, 'triggerWaterExchange'])->name('api.actuators.water_exchange');
Route::post('/actuators/aerator/toggle', [ActuatorController::class, 'toggleAerator'])->name('api.actuators.aerator');
Route::post('/actuators/manual', [ActuatorController::class, 'manualControl'])->name('api.actuators.manual');

// AI Predictions (BiLSTM) & AI Insight (DeepSeek LLM)
Route::get('/predictions/{kolam_id?}', [AiInsightController::class, 'getForecast'])->name('api.predictions.forecast');
Route::post('/ai/insight', [AiInsightController::class, 'generateInsight'])->name('api.ai.insight');

// Dataset collection receiver API (from Raspberry Pi)
Route::post('/dataset/receive', [DatasetController::class, 'receiveFrame'])->name('api.dataset.receive');
Route::get('/dataset/stats', [DatasetController::class, 'getDatasetStats'])->name('api.dataset.stats');

// Protected API routes (require valid Sanctum token)
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/profile', [ProfileController::class, 'show'])->name('api.profile.show');
    Route::put('/profile', [ProfileController::class, 'updateApi'])->name('api.profile.update');
});
