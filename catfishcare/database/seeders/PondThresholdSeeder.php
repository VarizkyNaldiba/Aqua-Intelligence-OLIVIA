<?php

namespace Database\Seeders;

use App\Models\Esp;
use App\Models\Kolam;
use App\Models\PondThreshold;
use Illuminate\Database\Seeder;

class PondThresholdSeeder extends Seeder
{
    /**
     * Paper Default Threshold values (CatfishCare Paper 2026 Table 10).
     */
    public static function getDefaultPaperThresholds(): array
    {
        return [
            'ph' => [
                'normal_min' => 6.5,
                'normal_max' => 8.2,
                'warning_min' => 6.0,
                'warning_max' => 9.0,
                'high_min' => 5.5,
                'high_max' => 9.5,
                'critical_min' => 0.0,
                'critical_max' => 14.0,
            ],
            'suhu' => [
                'normal_min' => 25.0,
                'normal_max' => 30.0,
                'warning_min' => 23.0,
                'warning_max' => 32.0,
                'high_min' => 20.0,
                'high_max' => 35.0,
                'critical_min' => 0.0,
                'critical_max' => 100.0,
            ],
            'turbidity' => [
                'normal_min' => 0.0,
                'normal_max' => 25.0,
                'warning_min' => 25.0,
                'warning_max' => 50.0,
                'high_min' => 50.0,
                'high_max' => 100.0,
                'critical_min' => 100.0,
                'critical_max' => 1000.0,
            ],
            'tds' => [
                'normal_min' => 0.0,
                'normal_max' => 500.0,
                'warning_min' => 500.0,
                'warning_max' => 800.0,
                'high_min' => 800.0,
                'high_max' => 1200.0,
                'critical_min' => 1200.0,
                'critical_max' => 5000.0,
            ],
            'water_level_dev' => [
                'normal_min' => 0.0,
                'normal_max' => 5.0,
                'warning_min' => 5.0,
                'warning_max' => 10.0,
                'high_min' => 10.0,
                'high_max' => 20.0,
                'critical_min' => 20.0,
                'critical_max' => 100.0,
            ],
            'sfr' => [
                'normal_min' => 0.0,
                'normal_max' => 0.10,
                'warning_min' => 0.10,
                'warning_max' => 0.20,
                'high_min' => 0.20,
                'high_max' => 0.35,
                'critical_min' => 0.35,
                'critical_max' => 1.00,
            ],
        ];
    }

    /**
     * Seed default thresholds for ponds.
     */
    public function run(): void
    {
        // Ensure default Esp and Kolam exist
        $esp = Esp::firstOrCreate(
            ['id' => 1],
            ['uuid' => 'ESP32-CATFISHCARE-001']
        );

        $kolam = Kolam::firstOrCreate(
            ['id' => 1],
            [
                'esp_id' => $esp->id,
                'nama' => 'Kolam TFS 1',
                'jumlah_iwak' => 1000,
            ]
        );

        $defaults = self::getDefaultPaperThresholds();

        foreach ($defaults as $param => $vals) {
            PondThreshold::updateOrCreate(
                [
                    'kolam_id' => $kolam->id,
                    'parameter' => $param,
                ],
                array_merge($vals, [
                    'version' => 1,
                ])
            );
        }
    }
}
