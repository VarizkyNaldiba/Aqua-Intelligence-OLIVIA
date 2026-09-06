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
        $this->projectId = env('FIREBASE_PROJECT_ID', 'catfishcare-2daa2');
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

        // Enforce 1 minute throttle unless forced
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
                // Set 60-second throttle flag for this pond
                Cache::put($throttleKey, true, 60);
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
            $response = Http::withToken($accessToken)->post($queryUrl, [
                'structuredQuery' => [
                    'from' => [['collectionId' => 'sensor_history']],
                    'where' => [
                        'fieldFilter' => [
                            'field' => ['fieldPath' => 'kolam_id'],
                            'op' => 'EQUAL',
                            'value' => ['integerValue' => $kolamId],
                        ]
                    ],
                    'orderBy' => [
                        ['field' => ['fieldPath' => 'timestamp'], 'direction' => 'DESCENDING']
                    ],
                    'limit' => $limit,
                ]
            ]);

            if (!$response->successful()) {
                Log::error("[FirestoreService] Error querying Firestore history: " . $response->body());
                return [];
            }

            $items = $response->json();
            $results = [];

            if (is_array($items)) {
                foreach ($items as $item) {
                    if (!isset($item['document']['fields'])) continue;
                    $f = $item['document']['fields'];
                    $ts = $f['timestamp']['timestampValue'] ?? now()->toIso8601String();

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

            // Return in chronological order (oldest first for charts)
            return array_reverse($results);
        } catch (\Throwable $e) {
            Log::error("[FirestoreService] Exception querying Firestore: " . $e->getMessage());
            return [];
        }
    }
}

