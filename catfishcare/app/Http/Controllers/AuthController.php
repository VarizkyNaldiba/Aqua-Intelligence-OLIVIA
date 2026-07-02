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

        $user = User::where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau kata sandi salah.'],
            ]);
        }

        // Log the user into the Laravel session (for Web/Inertia auth middleware)
        Auth::login($user);

        // Revoke previous tokens for security (one active token per user)
        $user->tokens()->delete();

        $token = $user->createToken('olivia-auth-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
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
