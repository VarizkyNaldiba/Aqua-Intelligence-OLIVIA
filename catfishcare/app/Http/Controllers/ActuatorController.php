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
    public function getStatus(int $kolamId = 1): JsonResponse
    {
        $status = Cache::get("kolam_{$kolamId}_actuators", [
            'drain_pump' => false,
            'fill_pump' => false,
            'aerator' => true,
            'mode' => 'auto', // 'auto' | 'manual'
            'last_exchange' => Carbon::now()->subHours(6)->toIso8601String(),
            'pending_action' => null,
        ]);

        return response()->json($status);
    }

    /**
     * Trigger Smart Water Exchange sequence.
     */
    public function triggerWaterExchange(Request $request): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', 1));
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

    /**
     * Manual control for water pumps
     */
    public function manualControl(Request $request): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', 1));
        $action = $request->input('action'); // e.g. 'pump_out_on', 'pump_out_off', 'pump_in_on', 'pump_in_off', 'all_pumps_off'

        $validActions = ['pump_out_on', 'pump_out_off', 'pump_in_on', 'pump_in_off', 'all_pumps_off'];
        
        if (!in_array($action, $validActions)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid action.'
            ], 400);
        }

        // Queue action for ESP32
        Cache::put("kolam_{$kolamId}_pending_action", [
            'action' => $action,
            'queued_at' => Carbon::now()->toIso8601String(),
        ], 120);

        // Optimistically update local actuator status cache
        $current = Cache::get("kolam_{$kolamId}_actuators", []);
        if ($action === 'pump_out_on') $current['drain_pump'] = true;
        if ($action === 'pump_out_off') $current['drain_pump'] = false;
        if ($action === 'pump_in_on') $current['fill_pump'] = true;
        if ($action === 'pump_in_off') $current['fill_pump'] = false;
        if ($action === 'all_pumps_off') {
            $current['drain_pump'] = false;
            $current['fill_pump'] = false;
        }
        
        Cache::put("kolam_{$kolamId}_actuators", $current, 120);

        return response()->json([
            'status' => 'success',
            'message' => "Manual command '{$action}' sent to pond {$kolamId}.",
            'action' => $action
        ]);
    }
}
