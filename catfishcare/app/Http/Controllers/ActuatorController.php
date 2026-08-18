<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ActuatorController extends Controller
{
    /**
     * Get current status of all actuators for a pond.
     */
    public function getStatus(int $kolamId = 9): JsonResponse
    {
        $status = Cache::get("kolam_{$kolamId}_actuators", [
            'drain_pump' => false,
            'fill_pump' => false,
            'aerator' => true,
            'feeder_locked' => false,
            'mode' => 'auto', // 'auto' | 'manual'
            'last_exchange' => Carbon::now()->subHours(6)->toIso8601String(),
            'last_feeding' => Carbon::now()->subHours(2)->toIso8601String(),
            'pending_action' => null,
        ]);

        return response()->json($status);
    }

    /**
     * Trigger Smart Water Exchange sequence.
     */
    public function triggerWaterExchange(Request $request): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', 9));
        $targetPercent = (int) ($request->input('target_percent', 30));

        // Queue action for ESP32
        Cache::put("kolam_{$kolamId}_pending_action", [
            'action' => 'water_exchange',
            'target_percent' => $targetPercent,
            'queued_at' => Carbon::now()->toIso8601String(),
        ], 120);

        // Update local actuator status
        $current = Cache::get("kolam_{$kolamId}_actuators", []);
        $current['drain_pump'] = true;
        $current['feeder_locked'] = true;
        $current['last_exchange'] = Carbon::now()->toIso8601String();
        Cache::put("kolam_{$kolamId}_actuators", $current, 120);

        return response()->json([
            'status' => 'success',
            'message' => "Smart Water Exchange (Target: {$targetPercent}%) berhasil dipicu untuk Kolam {$kolamId}.",
            'action' => 'water_exchange',
            'target_percent' => $targetPercent,
        ]);
    }

    /**
     * Trigger Automatic Feeder Dispense.
     */
    public function triggerFeeder(Request $request): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', 9));
        $amountGrams = (int) ($request->input('amount_grams', 100));

        // Check if feeder is locked due to poor water quality
        $current = Cache::get("kolam_{$kolamId}_actuators", []);
        if (!empty($current['feeder_locked'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pemberian pakan ditolak! Kondisi air kolam sedang dalam level High/Critical.',
            ], 422);
        }

        // Queue action for ESP32
        Cache::put("kolam_{$kolamId}_pending_action", [
            'action' => 'feed',
            'amount' => $amountGrams,
            'queued_at' => Carbon::now()->toIso8601String(),
        ], 60);

        $current['last_feeding'] = Carbon::now()->toIso8601String();
        Cache::put("kolam_{$kolamId}_actuators", $current, 3600);

        return response()->json([
            'status' => 'success',
            'message' => "Pakan {$amountGrams} gram berhasil dikeluarkan untuk Kolam {$kolamId}.",
            'amount_grams' => $amountGrams,
        ]);
    }

    /**
     * Toggle Aerator relay.
     */
    public function toggleAerator(Request $request): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', 9));
        $state = (bool) $request->input('state', true);

        Cache::put("kolam_{$kolamId}_pending_action", [
            'action' => $state ? 'aerator_on' : 'aerator_off',
            'queued_at' => Carbon::now()->toIso8601String(),
        ], 60);

        $current = Cache::get("kolam_{$kolamId}_actuators", []);
        $current['aerator'] = $state;
        Cache::put("kolam_{$kolamId}_actuators", $current, 3600);

        return response()->json([
            'status' => 'success',
            'aerator' => $state,
            'message' => 'Status aerator berhasil diperbarui.',
        ]);
    }
}
