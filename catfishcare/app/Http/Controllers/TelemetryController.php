<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TelemetryController extends Controller
{
    /**
     * Compute weighted Risk Score (0 - 100) according to CatfishCare Paper Table 10.
     * Each of the 6 parameters has a weight of 1/6 (16.67%).
     */
    public static function computeRiskScore(
        float $ph,
        float $suhu,
        float $turbidity,
        float $tds,
        float $waterLevelDev,
        float $sfr
    ): array {
        // 1. pH
        if ($ph >= 6.5 && $ph <= 8.2) $scorePh = 0;
        elseif (($ph >= 6.0 && $ph < 6.5) || ($ph > 8.2 && $ph <= 9.0)) $scorePh = 40;
        elseif (($ph >= 5.5 && $ph < 6.0) || ($ph > 9.0 && $ph <= 9.5)) $scorePh = 70;
        else $scorePh = 100;

        // 2. Suhu (°C)
        if ($suhu >= 25.0 && $suhu <= 30.0) $scoreSuhu = 0;
        elseif (($suhu >= 23.0 && $suhu < 25.0) || ($suhu > 30.0 && $suhu <= 32.0)) $scoreSuhu = 40;
        elseif (($suhu >= 20.0 && $suhu < 23.0) || ($suhu > 32.0 && $suhu <= 35.0)) $scoreSuhu = 70;
        else $scoreSuhu = 100;

        // 3. Turbidity (NTU)
        if ($turbidity <= 25.0) $scoreTurb = 0;
        elseif ($turbidity <= 50.0) $scoreTurb = 40;
        elseif ($turbidity <= 100.0) $scoreTurb = 70;
        else $scoreTurb = 100;

        // 4. TDS (ppm)
        if ($tds <= 500.0) $scoreTds = 0;
        elseif ($tds <= 800.0) $scoreTds = 40;
        elseif ($tds <= 1200.0) $scoreTds = 70;
        else $scoreTds = 100;

        // 5. Water Level Deviation (cm)
        if ($waterLevelDev <= 5.0) $scoreLevel = 0;
        elseif ($waterLevelDev <= 10.0) $scoreLevel = 40;
        elseif ($waterLevelDev <= 20.0) $scoreLevel = 70;
        else $scoreLevel = 100;

        // 6. Surface Fish Ratio (SFR)
        if ($sfr < 0.10) $scoreSfr = 0;
        elseif ($sfr <= 0.20) $scoreSfr = 40;
        elseif ($sfr <= 0.35) $scoreSfr = 70;
        else $scoreSfr = 100;

        $totalScore = ($scorePh + $scoreSuhu + $scoreTurb + $scoreTds + $scoreLevel + $scoreSfr) / 6.0;

        if ($totalScore <= 25.0) {
            $status = 'Low';
            $exchangeTarget = 0; // Tidak perlu pergantian air
        } elseif ($totalScore <= 50.0) {
            $status = 'Medium';
            $exchangeTarget = 0;
        } elseif ($totalScore <= 75.0) {
            $status = 'High';
            $exchangeTarget = 25; // 20-30% pergantian air
        } else {
            $status = 'Critical';
            $exchangeTarget = 50; // 50% pergantian air
        }

        // Water Quality Score (WQS) = 100 - Risk Score
        $wqs = max(0, min(100, 100 - $totalScore));

        return [
            'risk_score' => round($totalScore, 2),
            'risk_status' => $status,
            'wqs' => round($wqs, 1),
            'exchange_target_percent' => $exchangeTarget,
            'breakdown' => [
                'ph' => ['val' => $ph, 'score' => $scorePh],
                'suhu' => ['val' => $suhu, 'score' => $scoreSuhu],
                'turbidity' => ['val' => $turbidity, 'score' => $scoreTurb],
                'tds' => ['val' => $tds, 'score' => $scoreTds],
                'water_level_dev' => ['val' => $waterLevelDev, 'score' => $scoreLevel],
                'sfr' => ['val' => $sfr, 'score' => $scoreSfr],
            ]
        ];
    }

    /**
     * Receive IoT Sensor Telemetry from ESP32.
     */
    public function receiveTelemetry(Request $request): JsonResponse
    {
        $payload = $request->isJson() ? $request->json()->all() : $request->all();
        if (empty($payload)) {
            $raw = json_decode($request->getContent(), true);
            if (is_array($raw)) $payload = $raw;
        }

        $kolamId = (int) $request->input('kolam_id', $payload['kolam_id'] ?? 1);
        $suhu = (float) $request->input('suhu', $payload['suhu'] ?? 27.5);
        $ph = (float) $request->input('ph', $payload['ph'] ?? 7.2);
        $kekeruhan = (float) $request->input('kekeruhan', $payload['kekeruhan'] ?? 18.0);
        $tds = (float) $request->input('tds', $payload['tds'] ?? 420.0);
        $tinggiAir = (float) $request->input('tinggi_air', $payload['tinggi_air'] ?? 25.0);

        // Get latest SFR from Cache (sent by Raspberry Pi)
        $sfrCache = Cache::get("kolam_{$kolamId}_sfr", 0.05);
        $sfr = $request->has('sfr') ? (float) $request->input('sfr') : (isset($payload['sfr']) ? (float) $payload['sfr'] : (float) $sfrCache);

        $levelDev = abs(25.0 - $tinggiAir);
        $assessment = self::computeRiskScore($ph, $suhu, $kekeruhan, $tds, $levelDev, $sfr);

        $telemetryData = [
            'kolam_id' => $kolamId,
            'suhu' => $suhu,
            'ph' => $ph,
            'kekeruhan' => $kekeruhan,
            'tds' => $tds,
            'tinggi_air' => $tinggiAir,
            'sfr' => $sfr,
            'risk_score' => $assessment['risk_score'],
            'risk_status' => $assessment['risk_status'],
            'wqs' => $assessment['wqs'],
            'exchange_target_percent' => $assessment['exchange_target_percent'],
            'drain_pump' => (bool) $request->input('drain_pump', $payload['drain_pump'] ?? false),
            'fill_pump' => (bool) $request->input('fill_pump', $payload['fill_pump'] ?? false),
            'aerator' => (bool) $request->input('aerator', $payload['aerator'] ?? false),
            'updated_at' => Carbon::now()->toIso8601String(),
        ];

        // Store latest telemetry in Cache for fast web reads (6 hours)
        Cache::put("kolam_{$kolamId}_latest_telemetry", $telemetryData, now()->addHours(6));

        // Append to rolling time-series history cache for dynamic web charts
        $historyKey = "kolam_{$kolamId}_telemetry_history";
        $history = Cache::get($historyKey, []);
        $history[] = [
            'created_at' => Carbon::now()->toIso8601String(),
            'entry_id' => 'live-' . $kolamId . '-' . time(),
            'TEMPERATURE' => $suhu,
            'TURBIDITY' => $kekeruhan,
            'pH' => $ph,
            'NITRATE' => $tds,
            'Population' => 1000,
            'Length' => $tinggiAir,
            'Weight' => $sfr,
            'risk_score' => $assessment['risk_score'],
            'risk_status' => $assessment['risk_status'],
            'wqs' => $assessment['wqs'],
        ];
        if (count($history) > 40) {
            $history = array_slice($history, -40);
        }
        Cache::put($historyKey, $history, 3600);

        // Save into log_sensor database table if available
        try {
            DB::table('log_sensor')->insert([
                'kolam_id' => $kolamId,
                'suhu' => $suhu,
                'ph' => $ph,
                'kekeruhan' => $kekeruhan,
                'tinggi_air' => $tinggiAir,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Non-blocking log if DB schema is in-memory or not seeded
        }

        // Check if there is a pending actuator action commanded from the web
        $pendingAction = Cache::pull("kolam_{$kolamId}_pending_action");

        $response = [
            'status' => 'success',
            'assessment' => $assessment,
        ];

        if ($pendingAction) {
            $response['action'] = $pendingAction['action'];
            $response['amount'] = $pendingAction['amount'] ?? 100;
        } elseif ($assessment['risk_status'] === 'High' || $assessment['risk_status'] === 'Critical') {
            $response['action'] = 'water_exchange';
            $response['target_percent'] = $assessment['exchange_target_percent'];
        }

        return response()->json($response);
    }

    /**
     * Receive Surface Fish Ratio (SFR) from Raspberry Pi Vision Service.
     */
    public function updateSfr(Request $request): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', 9));
        $sfr = (float) $request->input('sfr', 0.05);
        $totalFish = (int) $request->input('total_fish', 15);
        $surfaceFish = (int) $request->input('surface_fish', 1);

        Cache::put("kolam_{$kolamId}_sfr", $sfr, 60);
        Cache::put("kolam_{$kolamId}_sfr_details", [
            'sfr' => $sfr,
            'total_fish' => $totalFish,
            'surface_fish' => $surfaceFish,
            'updated_at' => Carbon::now()->toIso8601String(),
        ], 60);

        return response()->json([
            'status' => 'success',
            'kolam_id' => $kolamId,
            'sfr' => $sfr,
            'surface_fish' => $surfaceFish,
            'total_fish' => $totalFish,
        ]);
    }

    /**
     * Get latest telemetry and risk data for a given pond.
     */
    public function getLatestTelemetry(int $kolamId = 1): JsonResponse
    {
        $cached = Cache::get("kolam_{$kolamId}_latest_telemetry");

        if (!$cached) {
            // Check if there is data in log_sensor database table
            try {
                $lastDb = DB::table('log_sensor')
                    ->where('kolam_id', $kolamId)
                    ->orderBy('created_at', 'desc')
                    ->first();
                if ($lastDb) {
                    $assessment = self::computeRiskScore((float)$lastDb->ph, (float)$lastDb->suhu, (float)$lastDb->kekeruhan, 420.0, abs(25.0 - (float)$lastDb->tinggi_air), 0.05);
                    $cached = [
                        'kolam_id' => $kolamId,
                        'pond_name' => 'Kolam TFS 1',
                        'suhu' => (float)$lastDb->suhu,
                        'ph' => (float)$lastDb->ph,
                        'kekeruhan' => (float)$lastDb->kekeruhan,
                        'tds' => 420.0,
                        'tinggi_air' => (float)$lastDb->tinggi_air,
                        'sfr' => 0.05,
                        'risk_score' => $assessment['risk_score'],
                        'risk_status' => $assessment['risk_status'],
                        'wqs' => $assessment['wqs'],
                        'exchange_target_percent' => 0,
                        'drain_pump' => false,
                        'fill_pump' => false,
                        'aerator' => true,
                        'updated_at' => Carbon::parse($lastDb->created_at)->toIso8601String(),
                        'is_simulated' => false,
                    ];
                }
            } catch (\Throwable $e) {}
        }

        if (!$cached) {
            // Default baseline values if hardware is currently offline
            $assessment = self::computeRiskScore(7.2, 27.5, 18.0, 420.0, 0.0, 0.05);
            $cached = [
                'kolam_id' => $kolamId,
                'pond_name' => 'Kolam TFS 1',
                'suhu' => 27.5,
                'ph' => 7.2,
                'kekeruhan' => 18.0,
                'tds' => 420.0,
                'tinggi_air' => 25.0,
                'sfr' => 0.05,
                'risk_score' => $assessment['risk_score'],
                'risk_status' => $assessment['risk_status'],
                'wqs' => $assessment['wqs'],
                'exchange_target_percent' => 0,
                'drain_pump' => false,
                'fill_pump' => false,
                'aerator' => true,
                'updated_at' => Carbon::now()->toIso8601String(),
                'is_simulated' => true,
            ];
        }

        $sfrDetails = Cache::get("kolam_{$kolamId}_sfr_details", [
            'sfr' => $cached['sfr'] ?? 0.05,
            'total_fish' => 15,
            'surface_fish' => 1,
            'updated_at' => Carbon::now()->toIso8601String(),
        ]);

        return response()->json([
            'telemetry' => $cached,
            'sfr_details' => $sfrDetails,
        ]);
    }

    /**
     * Get dynamic rolling time-series telemetry history for charts.
     */
    public function getTelemetryHistory(int $kolamId = 1): JsonResponse
    {
        $historyKey = "kolam_{$kolamId}_telemetry_history";
        $history = Cache::get($historyKey, []);

        if (empty($history)) {
            // Provide realistic baseline time-series history
            $latest = Cache::get("kolam_{$kolamId}_latest_telemetry");
            $baseTemp = $latest['suhu'] ?? 27.5;
            $basePh = $latest['ph'] ?? 7.2;
            $baseTurb = $latest['kekeruhan'] ?? 18.0;
            $baseTds = $latest['tds'] ?? 420.0;
            $baseLevel = $latest['tinggi_air'] ?? 25.0;
            $baseSfr = $latest['sfr'] ?? 0.05;

            $now = Carbon::now();
            for ($i = 15; $i >= 0; $i--) {
                $time = $now->copy()->subSeconds($i * 10);
                $history[] = [
                    'created_at' => $time->toIso8601String(),
                    'entry_id' => 'init-' . $kolamId . '-' . $time->timestamp,
                    'TEMPERATURE' => round($baseTemp + sin($i * 0.5) * 0.15, 2),
                    'TURBIDITY' => round($baseTurb + cos($i * 0.4) * 0.8, 1),
                    'pH' => round($basePh + sin($i * 0.3) * 0.05, 2),
                    'NITRATE' => round($baseTds + sin($i * 0.2) * 3, 0),
                    'Population' => 1000,
                    'Length' => round($baseLevel + cos($i * 0.2) * 0.1, 1),
                    'Weight' => $baseSfr,
                    'risk_score' => 15,
                    'risk_status' => 'Low',
                    'wqs' => 92,
                ];
            }
            Cache::put($historyKey, $history, 3600);
        }

        return response()->json([
            'kolam_id' => $kolamId,
            'pond_name' => 'Kolam TFS 1',
            'history' => $history,
        ]);
    }
}
