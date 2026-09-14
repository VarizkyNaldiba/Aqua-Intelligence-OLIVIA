<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    protected ?string $credentialsPath;

    public function __construct()
    {
        $this->credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'storage/app/firebase-credentials.json'));
    }

    /**
     * Get OAuth2 Access Token for Google Drive API using Service Account JSON.
     * Scope: https://www.googleapis.com/auth/drive.file
     */
    public function getAccessToken(): ?string
    {
        return Cache::remember('google_drive_access_token', 3000, function () {
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
                Log::warning("[GoogleDriveService] Service account credentials not found.");
                return null;
            }

            $now = time();
            $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
            $claim = json_encode([
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
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
                Log::error("[GoogleDriveService] OpenSSL failed to sign JWT assertion.");
                return null;
            }

            $jwt = $signatureInput . '.' . $this->base64UrlEncode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if ($response->successful()) {
                return $response->json()['access_token'] ?? null;
            }

            Log::error("[GoogleDriveService] Failed to obtain access token: " . $response->body());
            return null;
        });
    }

    /**
     * Upload CSV content directly to Google Drive.
     */
    public function uploadCsvToDrive(string $fileName, string $csvContent): array
    {
        $token = $this->getAccessToken();
        if (!$token) {
            return [
                'success' => false,
                'message' => 'Credentials Service Account Google Drive tidak ditemukan.',
            ];
        }

        try {
            // Multipart upload endpoint for Google Drive API v3
            $metadata = [
                'name' => $fileName,
                'mimeType' => 'text/csv',
            ];

            $boundary = '-------314159265358979323846';
            $delimiter = "\r\n--" . $boundary . "\r\n";
            $closeDelimiter = "\r\n--" . $boundary . "--";

            $multipartResponseBody =
                $delimiter .
                "Content-Type: application/json; charset=UTF-8\r\n\r\n" .
                json_encode($metadata) .
                $delimiter .
                "Content-Type: text/csv\r\n\r\n" .
                $csvContent .
                $closeDelimiter;

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$token}",
                'Content-Type' => 'multipart/related; boundary=' . $boundary,
            ])->withBody($multipartResponseBody, 'multipart/related; boundary=' . $boundary)
              ->post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');

            if ($response->successful()) {
                $data = $response->json();
                $fileId = $data['id'] ?? null;
                $webUrl = "https://drive.google.com/file/d/{$fileId}/view";

                Log::info("[GoogleDriveService] File CSV {$fileName} berhasil diunggah ke Drive (ID: {$fileId})");

                return [
                    'success' => true,
                    'file_id' => $fileId,
                    'drive_link' => $webUrl,
                    'message' => "File {$fileName} berhasil disimpan ke Google Drive!",
                ];
            }

            Log::error("[GoogleDriveService] Failed upload to Google Drive: " . $response->body());
            return [
                'success' => false,
                'message' => 'Gagal mengunggah ke Google Drive API: ' . $response->body(),
            ];
        } catch (\Throwable $e) {
            Log::error("[GoogleDriveService] Exception uploading to Drive: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Exception Google Drive: ' . $e->getMessage(),
            ];
        }
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
