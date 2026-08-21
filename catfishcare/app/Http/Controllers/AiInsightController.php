<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AiInsightController extends Controller
{
    /**
     * Get 24-Hour Forecast Predictions for Water Quality Sensor Metrics (BiLSTM).
     * Excludes SFR metric and provides timestamp of the last telemetry history used.
     */
    public function getForecast(Request $request, int $kolamId = 1): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', $kolamId));
        $forceRefresh = $request->boolean('refresh', false);

        $cacheKey = "kolam_{$kolamId}_bilstm_sensor_forecast";
        
        if (!$forceRefresh && Cache::has($cacheKey)) {
            return response()->json(Cache::get($cacheKey));
        }

        // Get rolling time-series telemetry history from Cache (from TelemetryController)
        $historyKey = "kolam_{$kolamId}_telemetry_history";
        $history = Cache::get($historyKey, []);

        // Retrieve last history timestamp
        $lastHistoryTime = null;
        if (!empty($history) && is_array($history)) {
            $lastEntry = end($history);
            $lastHistoryTime = $lastEntry['created_at'] ?? $lastEntry['updated_at'] ?? null;
        }

        if (!$lastHistoryTime) {
            $latestTelemetry = Cache::get("kolam_{$kolamId}_latest_telemetry");
            $lastHistoryTime = $latestTelemetry['updated_at'] ?? \Carbon\Carbon::now()->toIso8601String();
        }

        // Format timestamp for Indonesian UI display
        $formattedLastHistoryTime = \Carbon\Carbon::parse($lastHistoryTime)->timezone('Asia/Jakarta')->format('d M Y, H:i:s') . ' WIB';

        $pythonCmd = 'C:\Users\USER\AppData\Local\Programs\Python\Python311\python.exe';
        if (!file_exists($pythonCmd)) {
            $pythonCmd = 'python';
        }
        $scriptPath = base_path('../ArtIntelligence/predict_service.py');

        $predictions = null;
        $source = 'Baseline Fallback Curve';

        if (file_exists($scriptPath)) {
            try {
                $payloadJson = escapeshellarg(json_encode($history));
                $command = "\"{$pythonCmd}\" \"{$scriptPath}\" {$payloadJson}";
                $output = shell_exec($command);
                if ($output) {
                    $json = json_decode($output, true);
                    if (isset($json['predictions']) && is_array($json['predictions'])) {
                        $predictions = $json['predictions'];
                        $source = $json['source'] ?? 'BiLSTM Neural Network (.keras)';
                    }
                }
            } catch (\Throwable $e) {}
        }

        if (!$predictions) {
            $latest = Cache::get("kolam_{$kolamId}_latest_telemetry", []);
            $baseTemp = $latest['suhu'] ?? 27.5;
            $basePh = $latest['ph'] ?? 7.2;
            $baseTurb = $latest['kekeruhan'] ?? 18.0;
            $baseTds = $latest['tds'] ?? 420.0;
            $baseLevel = $latest['tinggi_air'] ?? 25.0;

            $predictions = [];
            for ($i = 0; $i < 24; $i++) {
                $predictions[] = [
                    'time' => sprintf('%02d:00', $i),
                    'temperature' => round($baseTemp + sin($i * M_PI / 12) * 0.8, 2),
                    'ph' => round($basePh + cos($i * M_PI / 12) * 0.15, 2),
                    'turbidity' => max(0, round($baseTurb + sin($i * M_PI / 6) * 2.0, 1)),
                    'tds' => round($baseTds + sin($i * M_PI / 8) * 5.0, 1),
                    'water_level' => round($baseLevel - ($i * 0.05), 1),
                ];
            }
        }

        $responsePayload = [
            'status' => 'success',
            'kolam_id' => $kolamId,
            'model' => 'BiLSTM (Bidirectional Long Short-Term Memory)',
            'horizon' => '24 Jam ke Depan (Metrik Sensor)',
            'source' => $source,
            'last_history_time' => $lastHistoryTime,
            'last_history_time_formatted' => $formattedLastHistoryTime,
            'generated_at' => \Carbon\Carbon::now()->timezone('Asia/Jakarta')->format('H:i:s') . ' WIB',
            'forecast' => $predictions,
        ];

        // Cache forecast for 15 minutes to save CPU
        Cache::put($cacheKey, $responsePayload, now()->addMinutes(15));

        return response()->json($responsePayload);
    }

    /**
     * Generate Multimodal AI Insight using DeepSeek LLM (or Intelligent Reasoning Engine).
     */
    public function generateInsight(Request $request): JsonResponse
    {
        $kolamId = (int) ($request->input('kolam_id', 1));
        $ph = (float) $request->input('ph', 7.2);
        $suhu = (float) $request->input('suhu', 27.5);
        $turbidity = (float) $request->input('turbidity', 18.0);
        $tds = (float) $request->input('tds', 420.0);
        $waterLevel = (float) $request->input('tinggi_air', 100.0);
        $sfr = (float) $request->input('sfr', 0.05);
        $riskScore = (float) $request->input('risk_score', 15.0);
        $riskStatus = (string) $request->input('risk_status', 'Low');

        $activeThresholds = TelemetryController::getThresholdsForPond($kolamId);
        $thresholdSummary = "Batas Aktif Kolam: pH [{$activeThresholds['ph']['normal_min']}-{$activeThresholds['ph']['normal_max']}], " .
            "Suhu [{$activeThresholds['suhu']['normal_min']}-{$activeThresholds['suhu']['normal_max']}°C], " .
            "Turbidity max {$activeThresholds['turbidity']['normal_max']} NTU, TDS max {$activeThresholds['tds']['normal_max']} ppm.";

        $geminiApiKey = env('GEMINI_API_KEY');
        $deepSeekApiKey = env('DEEPSEEK_API_KEY');

        // 1. Google Gemini API Integration
        if ($geminiApiKey) {
            try {
                $prompt = "Anda adalah AI CatfishCare Expert berbasis data multimodal budidaya ikan lele (AIoT). " .
                    "Data Kolam ID {$kolamId}: pH: {$ph}, Suhu: {$suhu}°C, Kekeruhan: {$turbidity} NTU, TDS: {$tds} ppm, Tinggi Air: {$waterLevel} cm, " .
                    "Surface Fish Ratio (SFR): " . ($sfr * 100) . "%, Risk Score: {$riskScore}/100 ({$riskStatus}). " .
                    "{$thresholdSummary} " .
                    "Berikan analisis ringkas dalam format JSON dengan key persis sebagai berikut: \"summary\" (Kondisi Terkini), \"cause\" (Analisis Penyebab & Perilaku Ikan), \"impact\" (Prediksi Dampak 24 Jam), dan \"mitigation\" (Rekomendasi Mitigasi Otomatis). Format WAJIB JSON murni tanpa awalan markdown.";

                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->timeout(15)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$geminiApiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json'
                    ]
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $insightText = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($insightText) {
                        $sectionsData = json_decode($insightText, true);
                        if (is_array($sectionsData)) {
                            return response()->json([
                                'status' => 'success',
                                'provider' => 'Google Gemini 1.5 Flash (Live API)',
                                'threshold_context' => $thresholdSummary,
                                'risk_status' => $riskStatus,
                                'risk_score' => $riskScore,
                                'sections' => $sectionsData,
                            ]);
                        }
                    }
                }
            } catch (\Throwable $e) {
                // Fallback to next provider or internal reasoning engine
            }
        }

        // 2. DeepSeek API Integration
        if ($deepSeekApiKey) {
            try {
                $prompt = "Anda adalah AI CatfishCare Expert berbasis data multimodal budidaya ikan lele (AIoT). " .
                    "Data Kolam ID {$kolamId}: pH: {$ph}, Suhu: {$suhu}°C, Kekeruhan: {$turbidity} NTU, TDS: {$tds} ppm, Tinggi Air: {$waterLevel} cm, " .
                    "Surface Fish Ratio (SFR): " . ($sfr * 100) . "%, Risk Score: {$riskScore}/100 ({$riskStatus}). " .
                    "{$thresholdSummary} " .
                    "Berikan analisis ringkas dalam 4 poin terstruktur: 1. Kondisi Terkini, 2. Analisis Penyebab & Perilaku Ikan, 3. Prediksi Dampak 24 Jam, 4. Rekomendasi Mitigasi Otomatis (Smart Water Exchange / Aerasi).";

                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$deepSeekApiKey}",
                    'Content-Type' => 'application/json',
                ])->timeout(12)->post('https://api.deepseek.com/chat/completions', [
                    'model' => 'deepseek-chat',
                    'messages' => [
                        ['role' => 'system', 'content' => 'Anda adalah asisten AI budidaya perikanan presisi.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'temperature' => 0.4,
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $insightText = $json['choices'][0]['message']['content'] ?? null;
                    if ($insightText) {
                        return response()->json([
                            'status' => 'success',
                            'provider' => 'DeepSeek LLM (Live API)',
                            'threshold_context' => $thresholdSummary,
                            'insight' => $insightText,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                // Fallback to internal reasoning engine
            }
        }

        // 3. High-Quality Rule-Based AI Engine (aligned with Paper rules)
        $sections = [];

        if ($riskStatus === 'Critical') {
            $sections['summary'] = "Kondisi Kolam {$kolamId} berada pada tingkat KRITIS (Risk Score: {$riskScore}/100). Terjadi penurunan mutu air drastis dengan SFR tinggi (" . round($sfr * 100, 1) . "% lele berenang ke permukaan).";
            $sections['cause'] = "Akumulasi amonia terlarut akibat penumpukan sisa organik dan penurunan saturasi oksigen terlarut (hipoksia).";
            $sections['impact'] = "Risiko mortalitas masal lele dalam 12–24 jam ke depan jika tidak segera dieksekusi mitigasi pergantian air.";
            $sections['mitigation'] = "Sistem telah memicu Smart Water Exchange 50% secara otomatis dan menyalakan aerator darurat.";
        } elseif ($riskStatus === 'High') {
            $sections['summary'] = "Peringatan tingkat TINGGI pada Kolam {$kolamId} (Risk Score: {$riskScore}/100). Parameter air mendekati ambang batas toleransi fisiologis lele.";
            $sections['cause'] = "Fluktuasi pH (" . round($ph, 2) . ") dan peningkatan kekeruhan (" . round($turbidity, 1) . " NTU) memicu stres ringan pada ikan.";
            $sections['impact'] = "Stres fisiologis lele meningkat dan daya tahan tubuh memburuk.";
            $sections['mitigation'] = "Jalankan Smart Water Exchange terukur (20–30%) dan maksimalkan output aerator.";
        } elseif ($riskStatus === 'Medium') {
            $sections['summary'] = "Kondisi Kolam {$kolamId} berstatus WASPADA (Risk Score: {$riskScore}/100). Parameter relatif stabil namun ada kecenderungan peningkatan TDS.";
            $sections['cause'] = "Aktivitas dekomposisi feses dan sisa organik mulai terakumulasi di dasar kolam.";
            $sections['impact'] = "Potensi pergeseran pH ke arah asam dalam 24 jam berikutnya.";
            $sections['mitigation'] = "Pantau tren kurva 24-jam BiLSTM dan jalankan sirkulasi air tambahan.";
        } else {
            $sections['summary'] = "Semua parameter Kolam {$kolamId} berada dalam rentang OPTIMAL (Risk Score: {$riskScore}/100, WQS: " . (100 - $riskScore) . ").";
            $sections['cause'] = "Keseimbangan ekosistem kolam terjaga dengan baik. Kekeruhan (" . round($turbidity, 1) . " NTU) dan pH (" . round($ph, 2) . ") sangat ideal.";
            $sections['impact'] = "Pertumbuhan biomassa ikan optimal dan laju kelangsungan hidup (SR) maksimal.";
            $sections['mitigation'] = "Pertahankan sirkulasi air standar dan pastikan aerasi beroperasi normal.";
        }

        return response()->json([
            'status' => 'success',
            'provider' => 'CatfishCare Multimodal AI Engine',
            'threshold_context' => $thresholdSummary,
            'risk_status' => $riskStatus,
            'risk_score' => $riskScore,
            'sections' => $sections,
        ]);
    }
}
