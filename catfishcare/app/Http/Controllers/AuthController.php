<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

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

        $inputUsername = trim($request->username);
        // Allow entering either 'pakfii' or 'pakfii@gmail.com'
        $extractedUsername = str_contains($inputUsername, '@') ? explode('@', $inputUsername)[0] : $inputUsername;

        try {
            $user = User::where('username', $inputUsername)
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
                'message' => 'Username atau kata sandi salah.',
                'error' => 'Username atau kata sandi salah.',
            ], 422);
        }

        try {
            Auth::login($user);
        } catch (\Throwable $e) {
            // Non-blocking catch for serverless session driver
        }

        $token = 'olivia-token-' . $user->id;
        try {
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
                $token = $user->createToken('olivia-auth-token')->plainTextToken;
            }
        } catch (\Throwable $e) {
            // Non-blocking catch for token generation
        }

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->username,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Handle user logout via API.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        
        // Also log out from web session guard
        Auth::guard('web')->logout();

        return response()->json([
            'message' => 'Berhasil keluar.',
        ]);
    }
}
