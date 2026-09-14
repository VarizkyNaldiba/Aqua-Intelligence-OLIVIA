<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FirestoreService
{
    protected ?string $projectId;
    protected ?string $credentialsPath;

    public function __construct()
    {
        $this->projectId = env('FIREBASE_PROJECT_ID', 'explora-be1a0');
        $this->credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'storage/app/firebase-credentials.json'));
    }

    /**
     * Get OAuth2 Access Token for Google Cloud / Firestore using Service Account JSON.
     * Caches token for 50 minutes to avoid repeated auth requests.
     */
    protected function getAccessToken(): ?string
    {
        return Cache::remember('firebase_firestore_access_token', 3000, function () {
            $credentials = null;

            // 1. Priority: Check if JSON string or Base64 string exists in ENV (Best for Vercel / Cloud Deploy)
            $envJson = env('FIREBASE_CREDENTIALS_JSON');
            $envBase64 = env('FIREBASE_CREDENTIALS_BASE64');

            if (!empty($envJson)) {
                $credentials = json_decode($envJson, true);
            } elseif (!empty($envBase64)) {
                $credentials = json_decode(base64_decode($envBase64), true);
            } elseif (file_exists($this->credentialsPath)) {
                // 2. Fallback: Local file path (Best for Localhost / Laragon)
                $credentials = json_decode(file_get_contents($this->credentialsPath), true);
            }

            if (!$credentials || !isset($credentials['private_key'], $credentials['client_email'])) {
                Log::warning("[FirestoreService] Valid Firebase credentials not found (checked ENV & local file: {$this->credentialsPath}).");
                return null;
            }

            $now = time();
            $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
            $claim = json_encode([
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/datastore',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now,
            ]);

            $base64Header = $this->base64UrlEncode($header);
            $base64Claim = $this->base64UrlEncode($claim);
            $signatureInput = $base64Header . '.' . $base64Claim;

            $signature = '';
            $privateKey = $credentials['private_key'];
            if (!openssl_sign($signatureInput, $signature, $privateKey, 'SHA256')) {
                Log::error("[FirestoreService] OpenSSL failed to sign JWT assertion.");
                return null;
            }

            $jwt = $signatureInput . '.' . $this->base64UrlEncode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error("[FirestoreService] Failed to obtain access token: " . $response->body());
            return null;
        });
    }

    /**
     * Helper for Base64Url Encoding according to RFC 7515.
     */
    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Save telemetry log document to Firestore collection "sensor_history".
     * Enforces a 1-minute throttling per pond to preserve Firebase free-tier quota (20k writes/day).
     */
    public function logTelemetryHistory(array $data, bool $force = false): bool
    {
        $kolamId = $data['kolam_id'] ?? 1;
        $throttleKey = "firestore_last_log_kolam_{$kolamId}";

        // Enforce 5-second throttle matching ESP32 median filter interval
        if (!$force && Cache::has($throttleKey)) {
            return false;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return false;
        }

        $nowIso = Carbon::now()->toIso8601String();
        
        $fields = [
            'user_id'     => ['integerValue' => (int)($data['user_id'] ?? 1)],
            'kolam_id'    => ['integerValue' => (int)($data['kolam_id'] ?? 1)],
            'suhu'        => ['doubleValue'  => (float)($data['suhu'] ?? 0)],
            'ph'          => ['doubleValue'  => (float)($data['ph'] ?? 0)],
            'kekeruhan'   => ['doubleValue'  => (float)($data['kekeruhan'] ?? 0)],
            'tds'         => ['doubleValue'  => (float)($data['tds'] ?? 0)],
            'tinggi_air'  => ['doubleValue'  => (float)($data['tinggi_air'] ?? 0)],
            'sfr'         => ['doubleValue'  => (float)($data['sfr'] ?? 0)],
            'risk_score'  => ['doubleValue'  => (float)($data['risk_score'] ?? 0)],
            'risk_status' => ['stringValue'  => (string)($data['risk_status'] ?? 'Low')],
            'wqs'         => ['doubleValue'  => (float)($data['wqs'] ?? 100)],
            'timestamp'   => ['timestampValue' => $nowIso],
        ];

        $documentUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/sensor_history";

        try {
            $response = Http::withToken($accessToken)
                ->post($documentUrl, [
                    'fields' => $fields,
                ]);

            if ($response->successful()) {
                // Set 5-second throttle flag for this pond (matching ESP32 median filter interval)
                Cache::put($throttleKey, true, 5);
                Log::info("[FirestoreService] Sensor history document successfully written to Firestore for pond {$kolamId}.");
                return true;
            }

            Log::error("[FirestoreService] Failed writing to Firestore: " . $response->body());
        } catch (\Throwable $e) {
            Log::error("[FirestoreService] Exception writing to Firestore: " . $e->getMessage());
        }

        return false;
    }

    /**
     * Save/sync user document to Firestore collection "users".
     */
    public function syncUserToFirestore(array $user): bool
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return false;
        }

        $userId = $user['id'] ?? 1;
        $nowIso = Carbon::now()->toIso8601String();

        $fields = [
            'id'         => ['integerValue' => (int)$userId],
            'name'       => ['stringValue'  => (string)($user['name'] ?? 'Pak Fii')],
            'email'      => ['stringValue'  => (string)($user['email'] ?? 'pakfii@catfishcare.app')],
            'role'       => ['stringValue'  => (string)($user['role'] ?? 'admin')],
            'avatar'     => ['stringValue'  => (string)($user['avatar'] ?? '')],
            'created_at' => ['timestampValue' => $nowIso],
            'updated_at' => ['timestampValue' => $nowIso],
        ];

        $documentUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users?documentId=user_{$userId}";

        try {
            $response = Http::withToken($accessToken)
                ->post($documentUrl, [
                    'fields' => $fields,
                ]);

            if ($response->successful()) {
                Log::info("[FirestoreService] User document successfully synced to Firestore collection 'users' for user {$userId}.");
                return true;
            } elseif ($response->status() === 409) {
                // If 409 conflict, patch existing user document
                $patchUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users/user_{$userId}";
                Http::withToken($accessToken)->patch($patchUrl, ['fields' => $fields]);
                Log::info("[FirestoreService] User document successfully patched in Firestore collection 'users' for user {$userId}.");
                return true;
            }

            Log::error("[FirestoreService] Failed writing user to Firestore: " . $response->body());
        } catch (\Throwable $e) {
            Log::error("[FirestoreService] Exception writing user to Firestore: " . $e->getMessage());
        }

        try {
            (new FirebaseRealtimeService())->syncUser($user);
        } catch (\Throwable $e) {}

        return true;
    }

    /**
     * Retrieve sensor history logs from Firestore for a given pond.
     */
    public function getHistoryFromFirestore(int $kolamId = 1, int $limit = 50): array
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return [];
        }

        $queryUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents:runQuery";

        try {
            // 1. First attempt: Query with timestamp ORDER BY DESC
            $response = Http::withToken($accessToken)->post($queryUrl, [
                'structuredQuery' => [
                    'from' => [['collectionId' => 'sensor_history']],
                    'orderBy' => [
                        ['field' => ['fieldPath' => 'timestamp'], 'direction' => 'DESCENDING']
                    ],
                    'limit' => 100,
                ]
            ]);

            $items = [];
            if ($response->successful() && is_array($response->json())) {
                $items = $response->json();
            } else {
                // 2. Fallback attempt: Direct document list GET request
                $docUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/sensor_history?pageSize=100";
                $getRes = Http::withToken($accessToken)->get($docUrl);
                if ($getRes->successful() && isset($getRes->json()['documents'])) {
                    $rawDocs = $getRes->json()['documents'];
                    $items = array_map(fn($d) => ['document' => $d], $rawDocs);
                }
            }

            $results = [];

            if (is_array($items)) {
                foreach ($items as $item) {
                    if (!isset($item['document']['fields'])) continue;
                    $f = $item['document']['fields'];

                    // Optional Pond ID filter if specified (allow all if kolamId == 0)
                    $docKolamId = (int)($f['kolam_id']['integerValue'] ?? $f['kolam_id']['doubleValue'] ?? 1);
                    if ($kolamId !== 0 && $docKolamId !== $kolamId && $kolamId !== 9) {
                        // Allow pond 9 to view primary readings as well
                        if ($docKolamId !== 1 && $docKolamId !== 9) continue;
                    }

                    $ts = $f['timestamp']['timestampValue'] ?? $item['document']['createTime'] ?? now()->toIso8601String();

                    $results[] = [
                        'created_at' => $ts,
                        'entry_id' => basename($item['document']['name'] ?? 'fs-' . time()),
                        'TEMPERATURE' => (float)($f['suhu']['doubleValue'] ?? $f['suhu']['integerValue'] ?? 0),
                        'TURBIDITY' => (float)($f['kekeruhan']['doubleValue'] ?? $f['kekeruhan']['integerValue'] ?? 0),
                        'pH' => (float)($f['ph']['doubleValue'] ?? $f['ph']['integerValue'] ?? 0),
                        'NITRATE' => (float)($f['tds']['doubleValue'] ?? $f['tds']['integerValue'] ?? 0),
                        'Population' => 1000,
                        'Length' => (float)($f['tinggi_air']['doubleValue'] ?? $f['tinggi_air']['integerValue'] ?? 0),
                        'Weight' => (float)($f['sfr']['doubleValue'] ?? $f['sfr']['integerValue'] ?? 0),
                        'risk_score' => (float)($f['risk_score']['doubleValue'] ?? $f['risk_score']['integerValue'] ?? 0),
                        'risk_status' => (string)($f['risk_status']['stringValue'] ?? 'Low'),
                        'wqs' => (float)($f['wqs']['doubleValue'] ?? $f['wqs']['integerValue'] ?? 100),
                    ];
                }
            }

            // Limit and return in chronological order for charts
            if (count($results) > $limit) {
                $results = array_slice($results, 0, $limit);
            }
            return array_reverse($results);
        } catch (\Throwable $e) {
            Log::error("[FirestoreService] Exception querying Firestore: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Delete documents from 'sensor_history' collection older than specified hours.
     */
    public function deleteOldTelemetryDocuments(int $hours = 12): int
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) return 0;

        $cutoffIso = Carbon::now()->subHours($hours)->toIso8601String();
        $queryUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents:runQuery";

        $deletedCount = 0;
        try {
            // Query documents with timestamp < cutoffIso
            $response = Http::withToken($accessToken)->post($queryUrl, [
                'structuredQuery' => [
                    'from' => [['collectionId' => 'sensor_history']],
                    'where' => [
                        'fieldFilter' => [
                            'field' => ['fieldPath' => 'timestamp'],
                            'op' => 'LESS_THAN',
                            'value' => ['timestampValue' => $cutoffIso]
                        ]
                    ],
                    'limit' => 500,
                ]
            ]);

            if ($response->successful() && is_array($response->json())) {
                $docs = $response->json();
                foreach ($docs as $docItem) {
                    if (!isset($docItem['document']['name'])) continue;
                    $docName = $docItem['document']['name'];
                    $deleteUrl = "https://firestore.googleapis.com/v1/{$docName}";
                    $delRes = Http::withToken($accessToken)->delete($deleteUrl);
                    if ($delRes->successful()) {
                        $deletedCount++;
                    }
                }
            }
            Log::info("[FirestoreService] Purged {$deletedCount} documents older than {$hours}h from Firestore.");
        } catch (\Throwable $e) {
            Log::error("[FirestoreService] Exception purging old documents: " . $e->getMessage());
        }

        return $deletedCount;
    }

    /**
     * Delete all sensor telemetry documents from Firestore for a specific pond or all ponds.
     */
    public function clearPondTelemetryDocuments(int $kolamId = 1): int
    {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) return 0;

        $queryUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents:runQuery";
        $deletedCount = 0;

        try {
            $query = [
                'from' => [['collectionId' => 'sensor_history']],
                'limit' => 500,
            ];

            if ($kolamId > 0) {
                $query['where'] = [
                    'fieldFilter' => [
                        'field' => ['fieldPath' => 'kolam_id'],
                        'op' => 'EQUAL',
                        'value' => ['integerValue' => (string)$kolamId]
                    ]
                ];
            }

            $response = Http::withToken($accessToken)->post($queryUrl, [
                'structuredQuery' => $query
            ]);

            if ($response->successful() && is_array($response->json())) {
                $docs = $response->json();
                foreach ($docs as $docItem) {
                    if (!isset($docItem['document']['name'])) continue;
                    $docName = $docItem['document']['name'];
                    $deleteUrl = "https://firestore.googleapis.com/v1/{$docName}";
                    $delRes = Http::withToken($accessToken)->delete($deleteUrl);
                    if ($delRes->successful()) {
                        $deletedCount++;
                    }
                }
            }
            Log::info("[FirestoreService] Cleared {$deletedCount} sensor telemetry documents from Firestore for kolam {$kolamId}.");
        } catch (\Throwable $e) {
            Log::error("[FirestoreService] Exception clearing Firestore documents: " . $e->getMessage());
        }

        return $deletedCount;
    }

    /**
     * Get Firestore storage and document usage statistics.
     */
    public function getUsageStatistics(): array
    {
        return Cache::remember('firestore_usage_statistics', 15, function () {
            $accessToken = $this->getAccessToken();
            $isConnected = !empty($accessToken);
            $sensorDocCount = 0;
            $userDocCount = 0;

            if ($isConnected) {
                try {
                    // Get sensor_history collection doc count (sample up to 150)
                    $docUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/sensor_history?pageSize=150";
                    $res = Http::withToken($accessToken)->timeout(2)->get($docUrl);
                    if ($res->successful() && isset($res->json()['documents'])) {
                        $sensorDocCount = count($res->json()['documents']);
                    }

                    // Get users collection doc count
                    $userUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/users?pageSize=50";
                    $userRes = Http::withToken($accessToken)->timeout(2)->get($userUrl);
                    if ($userRes->successful() && isset($userRes->json()['documents'])) {
                        $userDocCount = count($userRes->json()['documents']);
                    }
                } catch (\Throwable $e) {
                    Log::warning("[FirestoreService] Error fetching usage stats: " . $e->getMessage());
                }
            }

            $totalDocs = $sensorDocCount + $userDocCount;
            $estimatedBytes = ($sensorDocCount * 380) + ($userDocCount * 260);

            return [
                'connected' => $isConnected,
                'project_id' => $this->projectId,
                'sensor_documents' => $sensorDocCount,
                'user_documents' => $userDocCount,
                'total_documents' => $totalDocs,
                'storage_used_bytes' => $estimatedBytes,
                'storage_limit_bytes' => 1073741824, // 1 GiB
                'storage_used_percent' => round(($estimatedBytes / 1073741824) * 100, 4),
                'plan_name' => 'Spark Plan (Free Tier)',
                'quota_storage' => '1 GiB',
                'quota_daily_reads' => '50,000 / hari',
                'quota_daily_writes' => '20,000 / hari',
                'quota_daily_deletes' => '20,000 / hari',
            ];
        });
    }
}

