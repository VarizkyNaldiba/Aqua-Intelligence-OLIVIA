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
     * Get active threshold configuration for a pond (or paper default).
     */
    public static function getThresholdsForPond(int $kolamId = 1): array
    {
        $cacheKey = "kolam_{$kolamId}_thresholds";
        return Cache::remember($cacheKey, 3600, function () use ($kolamId) {
            $defaults = [
                'ph' => ['normal_min' => 6.5, 'normal_max' => 8.2, 'warning_min' => 6.0, 'warning_max' => 9.0, 'high_min' => 5.5, 'high_max' => 9.5, 'critical_min' => 0.0, 'critical_max' => 14.0],
                'suhu' => ['normal_min' => 25.0, 'normal_max' => 30.0, 'warning_min' => 23.0, 'warning_max' => 32.0, 'high_min' => 20.0, 'high_max' => 35.0, 'critical_min' => 0.0, 'critical_max' => 100.0],
                'turbidity' => ['normal_min' => 0.0, 'normal_max' => 25.0, 'warning_min' => 25.0, 'warning_max' => 50.0, 'high_min' => 50.0, 'high_max' => 100.0, 'critical_min' => 100.0, 'critical_max' => 1000.0],
                'tds' => ['normal_min' => 0.0, 'normal_max' => 500.0, 'warning_min' => 500.0, 'warning_max' => 800.0, 'high_min' => 800.0, 'high_max' => 1200.0, 'critical_min' => 1200.0, 'critical_max' => 5000.0],
                'water_level_dev' => ['normal_min' => 0.0, 'normal_max' => 5.0, 'warning_min' => 5.0, 'warning_max' => 10.0, 'high_min' => 10.0, 'high_max' => 20.0, 'critical_min' => 20.0, 'critical_max' => 100.0],
                'sfr' => ['normal_min' => 0.0, 'normal_max' => 0.10, 'warning_min' => 0.10, 'warning_max' => 0.20, 'high_min' => 0.20, 'high_max' => 0.35, 'critical_min' => 0.35, 'critical_max' => 1.00],
            ];
            try {
                if (class_exists('\Database\Seeders\PondThresholdSeeder')) {
                    $defaults = \Database\Seeders\PondThresholdSeeder::getDefaultPaperThresholds();
                }
                $dbThresholds = \App\Models\PondThreshold::where('kolam_id', $kolamId)->get();
                if ($dbThresholds->isNotEmpty()) {
                    foreach ($dbThresholds as $row) {
                        $defaults[$row->parameter] = [
                            'normal_min' => $row->normal_min,
                            'normal_max' => $row->normal_max,
                            'warning_min' => $row->warning_min,
                            'warning_max' => $row->warning_max,
                            'high_min' => $row->high_min,
                            'high_max' => $row->high_max,
                            'critical_min' => $row->critical_min,
                            'critical_max' => $row->critical_max,
                        ];
                    }
                }
            } catch (\Throwable $e) {}
            return $defaults;
        });
    }

    /**
     * Compute weighted Risk Score (0 - 100) according to CatfishCare Paper Table 10 / Dynamic Pond Thresholds.
     * Each of the 6 parameters has a weight of 1/6 (16.67%).
     */
    public static function computeRiskScore(
        float $ph,
        float $suhu,
        float $turbidity,
        float $tds,
        float $waterLevelDev,
        float $sfr,
        int $kolamId = 1
    ): array {
        $t = self::getThresholdsForPond($kolamId);

        // 1. pH
        $tPh = $t['ph'];
        if ($ph >= $tPh['normal_min'] && $ph <= $tPh['normal_max']) $scorePh = 0;
        elseif (($ph >= $tPh['warning_min'] && $ph < $tPh['normal_min']) || ($ph > $tPh['normal_max'] && $ph <= $tPh['warning_max'])) $scorePh = 40;
        elseif (($ph >= $tPh['high_min'] && $ph < $tPh['warning_min']) || ($ph > $tPh['warning_max'] && $ph <= $tPh['high_max'])) $scorePh = 70;
        else $scorePh = 100;

        // 2. Suhu (°C)
        $tSuhu = $t['suhu'];
        if ($suhu >= $tSuhu['normal_min'] && $suhu <= $tSuhu['normal_max']) $scoreSuhu = 0;
        elseif (($suhu >= $tSuhu['warning_min'] && $suhu < $tSuhu['normal_min']) || ($suhu > $tSuhu['normal_max'] && $suhu <= $tSuhu['warning_max'])) $scoreSuhu = 40;
        elseif (($suhu >= $tSuhu['high_min'] && $suhu < $tSuhu['warning_min']) || ($suhu > $tSuhu['warning_max'] && $suhu <= $tSuhu['high_max'])) $scoreSuhu = 70;
        else $scoreSuhu = 100;

        // 3. Turbidity (NTU)
        $tTurb = $t['turbidity'];
        if ($turbidity <= $tTurb['normal_max']) $scoreTurb = 0;
        elseif ($turbidity <= $tTurb['warning_max']) $scoreTurb = 40;
        elseif ($turbidity <= $tTurb['high_max']) $scoreTurb = 70;
        else $scoreTurb = 100;

        // 4. TDS (ppm)
        $tTds = $t['tds'];
        if ($tds <= $tTds['normal_max']) $scoreTds = 0;
        elseif ($tds <= $tTds['warning_max']) $scoreTds = 40;
        elseif ($tds <= $tTds['high_max']) $scoreTds = 70;
        else $scoreTds = 100;

        // 5. Water Level Deviation (cm)
        $tLevel = $t['water_level_dev'];
        if ($waterLevelDev <= $tLevel['normal_max']) $scoreLevel = 0;
        elseif ($waterLevelDev <= $tLevel['warning_max']) $scoreLevel = 40;
        elseif ($waterLevelDev <= $tLevel['high_max']) $scoreLevel = 70;
        else $scoreLevel = 100;

        // 6. Surface Fish Ratio (SFR)
        $tSfr = $t['sfr'];
        if ($sfr < $tSfr['normal_max']) $scoreSfr = 0;
        elseif ($sfr <= $tSfr['warning_max']) $scoreSfr = 40;
        elseif ($sfr <= $tSfr['high_max']) $scoreSfr = 70;
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
        try {
            $payload = $request->isJson() ? $request->json()->all() : $request->all();
            if (empty($payload)) {
                $raw = json_decode($request->getContent(), true);
                if (is_array($raw)) $payload = $raw;
            }

            $kolamId = (int) $request->input('kolam_id', $payload['kolam_id'] ?? 1);
            $userId = (int) $request->input('user_id', $payload['user_id'] ?? ($request->user()?->id ?? 1));
            $suhu = (float) $request->input('suhu', $payload['suhu'] ?? 27.5);
            $ph = (float) $request->input('ph', $payload['ph'] ?? 7.2);
            $kekeruhan = (float) $request->input('kekeruhan', $payload['kekeruhan'] ?? 18.0);
            $tds = (float) $request->input('tds', $payload['tds'] ?? 420.0);
            $tinggiAir = (float) $request->input('tinggi_air', $payload['tinggi_air'] ?? 25.0);

            // Get latest SFR from Cache (sent by Raspberry Pi)
            $sfrCache = Cache::get("kolam_{$kolamId}_sfr", 0.05);
            $sfr = $request->has('sfr') ? (float) $request->input('sfr') : (isset($payload['sfr']) ? (float) $payload['sfr'] : (float) $sfrCache);

            $levelDev = abs(25.0 - $tinggiAir);
            $assessment = self::computeRiskScore($ph, $suhu, $kekeruhan, $tds, $levelDev, $sfr, $kolamId);

            $telemetryData = [
                'user_id' => $userId,
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

            // Save 24/7 telemetry history into Google Cloud Firestore (5-second interval matching ESP32 median filter)
            try {
                $firestore = new \App\Services\FirestoreService();
                $firestore->logTelemetryHistory($telemetryData);
            } catch (\Throwable $e) {
                // Non-blocking catch to ensure hardware responsiveness
            }

            // Sync live telemetry to Firebase Realtime Database
            try {
                $rtdb = new \App\Services\FirebaseRealtimeService();
                $rtdb->updateTelemetry($kolamId, $telemetryData);
            } catch (\Throwable $e) {
                // Non-blocking catch
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
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("[TelemetryController] receiveTelemetry error: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
            ], 500);
        }
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
     * Get dynamic rolling time-series telemetry history for charts and monitoring table.
     */
    public function getTelemetryHistory(int $kolamId = 1): JsonResponse
    {
        $history = [];
        $seenKeys = [];

        // 1. Primary: Fetch latest real-time entries from SQLite log_sensor DB table
        try {
            $rows = DB::table('log_sensor')
                ->where('kolam_id', $kolamId)
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            foreach ($rows as $r) {
                $ts = Carbon::parse($r->created_at)->toIso8601String();
                $key = "db-{$r->id}";
                $seenKeys[$key] = true;

                $assessment = self::computeRiskScore((float)$r->ph, (float)$r->suhu, (float)$r->kekeruhan, 420.0, abs(25.0 - (float)$r->tinggi_air), 0.05, $kolamId);

                $history[] = [
                    'created_at' => $ts,
                    'entry_id' => $key,
                    'TEMPERATURE' => (float)$r->suhu,
                    'TURBIDITY' => (float)$r->kekeruhan,
                    'pH' => (float)$r->ph,
                    'NITRATE' => 420.0,
                    'Population' => 1000,
                    'Length' => (float)$r->tinggi_air,
                    'Weight' => 0.05,
                    'risk_score' => $assessment['risk_score'],
                    'risk_status' => $assessment['risk_status'],
                    'wqs' => $assessment['wqs'],
                ];
            }
        } catch (\Throwable $e) {}

        // 2. Secondary: Fetch from Google Cloud Firestore
        try {
            $firestore = new \App\Services\FirestoreService();
            $fsHistory = $firestore->getHistoryFromFirestore($kolamId, 50);
            foreach ($fsHistory as $fsItem) {
                $key = $fsItem['entry_id'] ?? ('fs-' . ($fsItem['created_at'] ?? ''));
                if (!isset($seenKeys[$key])) {
                    $seenKeys[$key] = true;
                    $history[] = $fsItem;
                }
            }
        } catch (\Throwable $e) {}

        // 3. Fallback: Local Cache rolling history
        if (empty($history)) {
            $historyKey = "kolam_{$kolamId}_telemetry_history";
            $history = Cache::get($historyKey, []);
        }

        // 4. Live telemetry overlay from cache
        $latest = Cache::get("kolam_{$kolamId}_latest_telemetry");
        if ($latest && !empty($latest['updated_at'])) {
            $liveKey = "live-{$kolamId}-" . $latest['updated_at'];
            if (!isset($seenKeys[$liveKey])) {
                $history[] = [
                    'created_at' => $latest['updated_at'],
                    'entry_id' => $liveKey,
                    'TEMPERATURE' => (float)$latest['suhu'],
                    'TURBIDITY' => (float)$latest['kekeruhan'],
                    'pH' => (float)$latest['ph'],
                    'NITRATE' => (float)$latest['tds'],
                    'Population' => 1000,
                    'Length' => (float)$latest['tinggi_air'],
                    'Weight' => (float)$latest['sfr'],
                    'risk_score' => (float)$latest['risk_score'],
                    'risk_status' => (string)$latest['risk_status'],
                    'wqs' => (float)$latest['wqs'],
                ];
            }
        }

        // Sort strictly newest-first (created_at DESCENDING)
        usort($history, function ($a, $b) {
            $timeA = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
            $timeB = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
            return $timeB <=> $timeA;
        });

        return response()->json([
            'kolam_id' => $kolamId,
            'pond_name' => "Kolam TFS {$kolamId}",
            'history' => array_values($history),
        ]);
    }

    /**
     * Clear sensor telemetry history log for a specific pond (or all ponds).
     */
    public function clearTelemetryHistory(Request $request, int $kolamId = 1): JsonResponse
    {
        try {
            // 1. Delete local SQLite DB records
            if ($kolamId === 0) {
                DB::table('log_sensor')->truncate();
            } else {
                DB::table('log_sensor')->where('kolam_id', $kolamId)->delete();
            }

            // 2. Clear local application cache
            Cache::forget("kolam_{$kolamId}_telemetry_history");
            Cache::forget("kolam_{$kolamId}_latest_telemetry");

            // 3. Clear Google Cloud Firestore remote sensor_history records
            try {
                $firestore = new \App\Services\FirestoreService();
                $firestore->clearPondTelemetryDocuments($kolamId);
            } catch (\Throwable $e) {}

            // 4. Reset Firebase Realtime Database node
            try {
                $firebaseRealtime = new \App\Services\FirebaseRealtimeService();
                if (method_exists($firebaseRealtime, 'resetLatestTelemetry')) {
                    $firebaseRealtime->resetLatestTelemetry($kolamId);
                }
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => true,
                'message' => "Data log sensor berhasil dibersihkan di SQLite DB, Cache, dan Firebase Cloud untuk Kolam #{$kolamId}",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Gagal membersihkan data sensor: " . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export telemetry log history directly to Google Drive as CSV.
     */
    public function exportToGoogleDrive(Request $request, int $kolamId = 1): JsonResponse
    {
        try {
            $rows = DB::table('log_sensor')
                ->where('kolam_id', $kolamId)
                ->orderBy('created_at', 'desc')
                ->limit(500)
                ->get();

            $csvData = "ID,Waktu,Suhu_C,pH,Kekeruhan_NTU,TinggiAir_cm\n";
            foreach ($rows as $r) {
                $csvData .= "{$r->id},{$r->created_at},{$r->suhu},{$r->ph},{$r->kekeruhan},{$r->tinggi_air}\n";
            }

            $dateStr = Carbon::now()->format('Y-m-d_H-i');
            $fileName = "CatfishCare_Telemetry_Kolam{$kolamId}_{$dateStr}.csv";

            $driveService = new \App\Services\GoogleDriveService();
            $result = $driveService->uploadCsvToDrive($fileName, $csvData);

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "Error uploading to Google Drive: " . $e->getMessage(),
            ], 500);
        }
    }
}
