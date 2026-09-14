<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FirebaseRealtimeService
{
    protected string $projectId;
    protected string $rtdbUrl;
    protected ?string $credentialsPath;

    public function __construct()
    {
        $this->projectId = env('FIREBASE_PROJECT_ID', 'explora-be1a0');
        $defaultUrl = env('FIREBASE_RTDB_URL', "https://{$this->projectId}-default-rtdb.firebaseio.com");
        $this->rtdbUrl = rtrim($defaultUrl, '/');
        $this->credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'storage/app/firebase-credentials.json'));
    }

    /**
     * Get OAuth2 Access Token for Firebase using Service Account JSON.
     */
    protected function getAccessToken(): ?string
    {
        return Cache::remember('firebase_rtdb_access_token', 3000, function () {
            $credentials = null;

            $envJson = env('FIREBASE_CREDENTIALS_JSON');
            $envBase64 = env('FIREBASE_CREDENTIALS_BASE64');

            if (!empty($envJson)) {
                $credentials = json_decode($envJson, true);
            } elseif (!empty($envBase64)) {
                $credentials = json_decode(base64_decode($envBase64), true);
            } elseif (file_exists($this->credentialsPath)) {
                $credentials = json_decode(file_get_contents($this->credentialsPath), true);
            }

            if (!$credentials || !isset($credentials['private_key'], $credentials['client_email'])) {
                Log::warning("[FirebaseRealtimeService] Valid credentials not found.");
                return null;
            }

            try {
                $now = time();
                $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
                $claim = $this->base64UrlEncode(json_encode([
                    'iss' => $credentials['client_email'],
                    'scope' => 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/datastore',
                    'aud' => 'https://oauth2.googleapis.com/token',
                    'exp' => $now + 3600,
                    'iat' => $now,
                ]));

                $signatureInput = $header . '.' . $claim;
                $signature = '';
                if (!openssl_sign($signatureInput, $signature, $credentials['private_key'], 'SHA256')) {
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
            } catch (\Throwable $e) {
                Log::error("[FirebaseRealtimeService] Token exception: " . $e->getMessage());
            }

            return null;
        });
    }

    protected function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Push or update live telemetry to Firebase Realtime Database.
     * Target path: /telemetry/kolam_{id}.json
     */
    public function updateTelemetry(int $kolamId, array $telemetry): bool
    {
        $accessToken = $this->getAccessToken();
        $url = "{$this->rtdbUrl}/telemetry/kolam_{$kolamId}.json";
        
        $payload = array_merge($telemetry, [
            'kolam_id' => $kolamId,
            'updated_at' => Carbon::now()->toIso8601String(),
            'timestamp_ms' => (int)(microtime(true) * 1000),
        ]);

        try {
            $req = Http::timeout(4);
            if ($accessToken) {
                $req = $req->withToken($accessToken);
            }

            $res = $req->patch($url, $payload);

            if ($res->successful()) {
                Log::info("[FirebaseRealtimeService] Telemetry updated for pond {$kolamId} in Realtime Database.");
                return true;
            }

            // Also update /latest_telemetry.json for fast single-node queries
            $latestUrl = "{$this->rtdbUrl}/latest_telemetry/kolam_{$kolamId}.json";
            $req->patch($latestUrl, $payload);

            if ($res->status() === 404) {
                Log::info("[FirebaseRealtimeService] Realtime Database node not active yet or URL requires setup: {$url}");
            } else {
                Log::warning("[FirebaseRealtimeService] RTDB update status {$res->status()}: " . $res->body());
            }
        } catch (\Throwable $e) {
            Log::error("[FirebaseRealtimeService] Exception updating RTDB telemetry: " . $e->getMessage());
        }

        return false;
    }

    /**
     * Update actuator states in Firebase Realtime Database.
     * Target path: /actuators/kolam_{id}.json
     */
    public function updateActuators(int $kolamId, array $actuators): bool
    {
        $accessToken = $this->getAccessToken();
        $url = "{$this->rtdbUrl}/actuators/kolam_{$kolamId}.json";

        $payload = array_merge($actuators, [
            'kolam_id' => $kolamId,
            'updated_at' => Carbon::now()->toIso8601String(),
        ]);

        try {
            $req = Http::timeout(4);
            if ($accessToken) {
                $req = $req->withToken($accessToken);
            }

            $res = $req->patch($url, $payload);
            return $res->successful();
        } catch (\Throwable $e) {
            Log::error("[FirebaseRealtimeService] Exception updating RTDB actuators: " . $e->getMessage());
        }

        return false;
    }

    /**
     * Sync user record into Firebase Realtime Database.
     * Target path: /users/user_{id}.json
     */
    public function syncUser(array $user): bool
    {
        $accessToken = $this->getAccessToken();
        $userId = $user['id'] ?? 1;
        $url = "{$this->rtdbUrl}/users/user_{$userId}.json";

        $payload = [
            'id' => (int)$userId,
            'name' => (string)($user['name'] ?? 'Pak Fii'),
            'email' => (string)($user['email'] ?? 'pakfii@catfishcare.app'),
            'role' => (string)($user['role'] ?? 'admin'),
            'avatar' => (string)($user['avatar'] ?? ''),
            'updated_at' => Carbon::now()->toIso8601String(),
        ];

        try {
            $req = Http::timeout(4);
            if ($accessToken) {
                $req = $req->withToken($accessToken);
            }

            $res = $req->patch($url, $payload);
            return $res->successful();
        } catch (\Throwable $e) {
            Log::error("[FirebaseRealtimeService] Exception syncing RTDB user: " . $e->getMessage());
        }

        return false;
    }

    /**
     * Read telemetry node from Firebase Realtime Database.
     */
    public function getTelemetry(int $kolamId = 1): ?array
    {
        $accessToken = $this->getAccessToken();
        $url = "{$this->rtdbUrl}/telemetry/kolam_{$kolamId}.json";

        try {
            $req = Http::timeout(4);
            if ($accessToken) {
                $req = $req->withToken($accessToken);
            }

            $res = $req->get($url);
            if ($res->successful()) {
                return $res->json();
            }
        } catch (\Throwable $e) {
            Log::error("[FirebaseRealtimeService] Exception getting RTDB telemetry: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Clear / reset telemetry node in Firebase Realtime Database.
     */
    public function resetLatestTelemetry(int $kolamId = 1): bool
    {
        $accessToken = $this->getAccessToken();
        $url = "{$this->rtdbUrl}/telemetry/kolam_{$kolamId}.json";

        try {
            $req = Http::timeout(4);
            if ($accessToken) {
                $req = $req->withToken($accessToken);
            }
            $res = $req->delete($url);
            return $res->successful();
        } catch (\Throwable $e) {
            Log::error("[FirebaseRealtimeService] Exception resetting RTDB telemetry: " . $e->getMessage());
        }

        return false;
    }
}
