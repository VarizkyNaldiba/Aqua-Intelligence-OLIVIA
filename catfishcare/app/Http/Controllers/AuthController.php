<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Handle user login via API.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $input = trim($request->username);
        $extractedUsername = str_contains($input, '@') ? explode('@', $input)[0] : $input;

        try {
            $user = User::where('email', $input)
                ->orWhere('username', $input)
                ->orWhere('username', $extractedUsername)
                ->first();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal terhubung ke database server: ' . $e->getMessage(),
                'error' => 'Database query error',
            ], 500);
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email/Username atau kata sandi salah.',
                'error' => 'Email/Username atau kata sandi salah.',
            ], 422);
        }

        try {
            Auth::login($user);
        } catch (\Throwable $e) {}

        $token = 'olivia-token-' . $user->id;
        try {
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
                $token = $user->createToken('olivia-auth-token')->plainTextToken;
            }
        } catch (\Throwable $e) {}

        // Log login activity
        try {
            ActivityLog::create([
                'user_id' => $user->id,
                'username' => $user->username,
                'action' => 'LOGIN',
                'description' => "User {$user->username} ({$user->role}) berhasil masuk ke sistem.",
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?? '', 0, 255),
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->username,
                'email' => $user->email ?? "{$user->username}@catfishcare.app",
                'role' => $user->role ?? ($user->jabatan === 'admin' ? 'admin' : 'user'),
            ],
            'token' => $token,
        ]);
    }

    /**
     * Handle user logout via API.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            try {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'username' => $user->username,
                    'action' => 'LOGOUT',
                    'description' => "User {$user->username} keluar dari sistem.",
                    'ip_address' => $request->ip(),
                    'user_agent' => substr($request->userAgent() ?? '', 0, 255),
                ]);
            } catch (\Throwable $e) {}

            try {
                $user->currentAccessToken()?->delete();
            } catch (\Throwable $e) {}
        }

        Auth::guard('web')->logout();

        return response()->json([
            'message' => 'Berhasil keluar.',
        ]);
    }
}
