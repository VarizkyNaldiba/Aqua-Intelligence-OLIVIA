<?php

namespace App\Http\Controllers;

use App\Models\PondCalibration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PondCalibrationController extends Controller
{
    /**
     * Default hardware calibration values tested for CatfishCare.
     */
    public static function getDefaultCalibration(): array
    {
        return [
            'ph_v7' => 2.50,
            'ph_v4' => 3.05,
            'turbidity_v_clear' => 4.20,
            'tds_factor' => 0.50,
            'pond_height' => 100.0,
            'temp_offset' => 0.0,
            'version' => 1,
        ];
    }

    /**
     * Get active hardware calibration constants for a given pond.
     */
    public function getCalibration(int $kolamId = 1): JsonResponse
    {
        $defaults = self::getDefaultCalibration();
        $row = PondCalibration::where('kolam_id', $kolamId)->first();

        if ($row) {
            $calibration = [
                'ph_v7' => (float)$row->ph_v7,
                'ph_v4' => (float)$row->ph_v4,
                'turbidity_v_clear' => (float)$row->turbidity_v_clear,
                'tds_factor' => (float)$row->tds_factor,
                'pond_height' => (float)$row->pond_height,
                'temp_offset' => (float)$row->temp_offset,
                'version' => (int)$row->version,
            ];
            $isCustom = true;
        } else {
            $calibration = $defaults;
            $isCustom = false;
        }

        return response()->json([
            'kolam_id' => $kolamId,
            'is_custom' => $isCustom,
            'source' => $isCustom ? 'Custom Hardware Calibration' : 'Tested Default Calibration (CatfishCare 2026)',
            'calibration' => $calibration,
            'descriptions' => [
                'ph_v7' => 'Tegangan ADC (Volt) pada larutan buffer pH 7.00',
                'ph_v4' => 'Tegangan ADC (Volt) pada larutan buffer pH 4.01',
                'turbidity_v_clear' => 'Tegangan ADC (Volt) pada air jernih / murni (0 NTU)',
                'tds_factor' => 'Faktor koefisien pengali larutan standar TDS 1413 µS/cm',
                'pond_height' => 'Jarak sensor ultrasonik ke dasar kolam saat air kosong (cm)',
                'temp_offset' => 'Offset koreksi suhu termometer murni (°C)',
            ]
        ]);
    }

    /**
     * Update hardware calibration parameters for a pond.
     */
    public function updateCalibration(Request $request): JsonResponse
    {
        $kolamId = (int)$request->input('kolam_id', 1);
        $calibData = $request->input('calibration', []);

        if (empty($calibData) || !is_array($calibData)) {
            return response()->json(['error' => 'Payload calibration tidak valid atau kosong.'], 422);
        }

        $phV7 = isset($calibData['ph_v7']) ? (float)$calibData['ph_v7'] : 2.50;
        $phV4 = isset($calibData['ph_v4']) ? (float)$calibData['ph_v4'] : 3.05;
        $turbidityVClear = isset($calibData['turbidity_v_clear']) ? (float)$calibData['turbidity_v_clear'] : 4.20;
        $tdsFactor = isset($calibData['tds_factor']) ? (float)$calibData['tds_factor'] : 0.50;
        $pondHeight = isset($calibData['pond_height']) ? (float)$calibData['pond_height'] : 100.0;
        $tempOffset = isset($calibData['temp_offset']) ? (float)$calibData['temp_offset'] : 0.0;

        $existing = PondCalibration::where('kolam_id', $kolamId)->first();
        $version = $existing ? ($existing->version + 1) : 1;

        PondCalibration::updateOrCreate(
            ['kolam_id' => $kolamId],
            [
                'ph_v7' => $phV7,
                'ph_v4' => $phV4,
                'turbidity_v_clear' => $turbidityVClear,
                'tds_factor' => $tdsFactor,
                'pond_height' => $pondHeight,
                'temp_offset' => $tempOffset,
                'version' => $version,
            ]
        );

        Cache::forget("kolam_{$kolamId}_calibration");

        return response()->json([
            'status' => 'success',
            'message' => "Kalibrasi hardware sensor untuk Kolam {$kolamId} berhasil diperbarui.",
        ]);
    }

    /**
     * Reset hardware calibration parameters to tested defaults.
     */
    public function resetCalibration(Request $request): JsonResponse
    {
        $kolamId = (int)$request->input('kolam_id', 1);

        PondCalibration::where('kolam_id', $kolamId)->delete();
        Cache::forget("kolam_{$kolamId}_calibration");

        return response()->json([
            'status' => 'success',
            'message' => "Kalibrasi hardware sensor Kolam {$kolamId} telah dikembalikan ke Tested Default (pH 7.00=2.50V, pH 4.01=3.05V, V_clear=4.20V, TDS=0.50, Height=100cm, Temp=0°C).",
        ]);
    }
}
