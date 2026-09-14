<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Services\FirestoreService;

class ArchiveTelemetryLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telemetry:archive {--hours=12 : Number of hours of data to retain before archiving}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive sensor telemetry logs into a CSV dataset file and purge old Firestore/DB records';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $cutoff = Carbon::now()->subHours($hours);

        $this->info("Starting telemetry archive for records older than {$hours} hours (before {$cutoff->toDateTimeString()})...");

        // 1. Fetch records to archive from log_sensor DB table
        $rows = collect([]);
        try {
            $rows = DB::table('log_sensor')
                ->where('created_at', '<', $cutoff)
                ->orderBy('created_at', 'asc')
                ->get();
        } catch (\Throwable $e) {
            $this->warn("Database table log_sensor query warning: " . $e->getMessage());
        }

        if ($rows->isEmpty()) {
            $this->info("No database sensor records older than {$hours} hours found to archive.");
        } else {
            // 2. Generate CSV Content
            $filename = "archives/telemetry_archive_" . Carbon::now()->format('Y-m-d_H-i-s') . ".csv";
            $csvHeader = "timestamp,kolam_id,suhu,ph,kekeruhan,tinggi_air,created_at\n";
            $csvLines = [];

            foreach ($rows as $r) {
                $csvLines[] = sprintf(
                    '"%s",%d,%.2f,%.2f,%.2f,%.2f,"%s"',
                    $r->created_at,
                    $r->kolam_id ?? 1,
                    $r->suhu ?? 0,
                    $r->ph ?? 0,
                    $r->kekeruhan ?? 0,
                    $r->tinggi_air ?? 0,
                    $r->created_at ?? ''
                );
            }

            $csvContent = $csvHeader . implode("\n", $csvLines);

            // Save to storage/app/archives
            Storage::disk('local')->put($filename, $csvContent);
            $fullPath = storage_path("app/{$filename}");
            $this->info("Saved " . count($rows) . " dataset rows to archive CSV: {$fullPath}");

            // Purge archived DB records
            $deletedDb = DB::table('log_sensor')->where('created_at', '<', $cutoff)->delete();
            $this->info("Purged {$deletedDb} rows from log_sensor database table.");
        }

        // 3. Purge Firestore old documents
        $this->info("Purging old Firestore documents...");
        $firestore = new FirestoreService();
        $deletedFs = $firestore->deleteOldTelemetryDocuments($hours);
        $this->info("Purged {$deletedFs} documents from Firestore.");

        $this->info("Telemetry archiving completed successfully!");
        return Command::SUCCESS;
    }
}
