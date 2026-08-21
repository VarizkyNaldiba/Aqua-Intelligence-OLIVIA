<?php

namespace App\Http\Controllers;

use App\Models\PondThreshold;
use Database\Seeders\PondThresholdSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PondThresholdController extends Controller
{
    /**
     * Get current active thresholds for a given pond.
     */
    public function getThresholds(int $kolamId = 1): JsonResponse
    {
        $defaults = PondThresholdSeeder::getDefaultPaperThresholds();
        $customRows = PondThreshold::where('kolam_id', $kolamId)->get()->keyBy('parameter');

        $isCustom = false;
        $thresholds = [];

        foreach ($defaults as $param => $paperVals) {
            if (isset($customRows[$param])) {
                $row = $customRows[$param];
                $thresholds[$param] = [
                    'normal_min' => (float)$row->normal_min,
                    'normal_max' => (float)$row->normal_max,
                    'warning_min' => (float)$row->warning_min,
                    'warning_max' => (float)$row->warning_max,
                    'high_min' => (float)$row->high_min,
                    'high_max' => (float)$row->high_max,
                    'critical_min' => (float)$row->critical_min,
                    'critical_max' => (float)$row->critical_max,
                    'version' => (int)$row->version,
                ];
                $isCustom = true;
            } else {
                $thresholds[$param] = array_merge($paperVals, ['version' => 1]);
            }
        }

        return response()->json([
            'kolam_id' => $kolamId,
            'is_custom' => $isCustom,
            'source' => $isCustom ? 'Custom Pond Configuration' : 'Paper Default (CatfishCare 2026)',
            'thresholds' => $thresholds,
            'units' => [
                'ph' => 'pH',
                'suhu' => '°C',
                'turbidity' => 'NTU',
                'tds' => 'ppm',
                'water_level_dev' => 'cm',
                'sfr' => '%',
            ]
        ]);
    }

    /**
     * Update custom threshold configuration for a pond.
     */
    public function updateThresholds(Request $request): JsonResponse
    {
        $kolamId = (int)$request->input('kolam_id', 1);
        $thresholdData = $request->input('thresholds', []);

        if (empty($thresholdData) || !is_array($thresholdData)) {
            return response()->json(['error' => 'Payload thresholds tidak valid atau kosong.'], 422);
        }

        // Validate backend bounds
        foreach ($thresholdData as $param => $vals) {
            if (!in_array($param, ['ph', 'suhu', 'turbidity', 'tds', 'water_level_dev', 'sfr'])) {
                continue;
            }

            $normalMin = isset($vals['normal_min']) ? (float)$vals['normal_min'] : null;
            $normalMax = isset($vals['normal_max']) ? (float)$vals['normal_max'] : null;

            if ($normalMin !== null && $normalMax !== null && $normalMin >= $normalMax) {
                return response()->json([
                    'error' => "Batas normal untuk {$param} tidak valid (min harus < max)."
                ], 422);
            }
        }

        DB::transaction(function () use ($kolamId, $thresholdData) {
            foreach ($thresholdData as $param => $vals) {
                if (!in_array($param, ['ph', 'suhu', 'turbidity', 'tds', 'water_level_dev', 'sfr'])) {
                    continue;
                }

                $existing = PondThreshold::where('kolam_id', $kolamId)
                    ->where('parameter', $param)
                    ->first();

                $version = $existing ? ($existing->version + 1) : 1;

                PondThreshold::updateOrCreate(
                    [
                        'kolam_id' => $kolamId,
                        'parameter' => $param,
                    ],
                    [
                        'normal_min' => isset($vals['normal_min']) ? (float)$vals['normal_min'] : null,
                        'normal_max' => isset($vals['normal_max']) ? (float)$vals['normal_max'] : null,
                        'warning_min' => isset($vals['warning_min']) ? (float)$vals['warning_min'] : null,
                        'warning_max' => isset($vals['warning_max']) ? (float)$vals['warning_max'] : null,
                        'high_min' => isset($vals['high_min']) ? (float)$vals['high_min'] : null,
                        'high_max' => isset($vals['high_max']) ? (float)$vals['high_max'] : null,
                        'critical_min' => isset($vals['critical_min']) ? (float)$vals['critical_min'] : null,
                        'critical_max' => isset($vals['critical_max']) ? (float)$vals['critical_max'] : null,
                        'version' => $version,
                    ]
                );
            }
        });

        // Forget cache so TelemetryController will reload immediately
        Cache::forget("kolam_{$kolamId}_thresholds");

        return response()->json([
            'status' => 'success',
            'message' => "Ambang batas (threshold) untuk Kolam {$kolamId} berhasil diperbarui.",
        ]);
    }

    /**
     * Reset custom threshold configuration back to Paper Default.
     */
    public function resetThresholds(Request $request): JsonResponse
    {
        $kolamId = (int)$request->input('kolam_id', 1);

        PondThreshold::where('kolam_id', $kolamId)->delete();
        Cache::forget("kolam_{$kolamId}_thresholds");

        // Seed paper defaults again to ensure DB rows match defaults
        $seeder = new PondThresholdSeeder();
        $seeder->run();

        return response()->json([
            'status' => 'success',
            'message' => "Konfigurasi threshold Kolam {$kolamId} telah dikembalikan ke Paper Default (CatfishCare 2026).",
        ]);
    }
}
