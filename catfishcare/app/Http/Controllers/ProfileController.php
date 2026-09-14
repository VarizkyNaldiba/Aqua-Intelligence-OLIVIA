<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Return the authenticated user's data as JSON.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Update the authenticated user's profile via API.
     */
    public function updateApi(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            $user = \App\Models\User::first() ?? new \App\Models\User(['id' => 1, 'username' => 'Pak Fii', 'jabatan' => 'Admin CatfishCare']);
        }

        $validated = $request->validate([
            'username' => ['sometimes', 'string', 'max:255'],
            'name'     => ['sometimes', 'string', 'max:255'],
            'jabatan'  => ['sometimes', 'string', 'max:255'],
            'role'     => ['sometimes', 'string', 'max:255'],
        ]);

        if (isset($validated['name'])) $user->username = $validated['name'];
        elseif (isset($validated['username'])) $user->username = $validated['username'];

        if (isset($validated['role'])) $user->jabatan = $validated['role'];
        elseif (isset($validated['jabatan'])) $user->jabatan = $validated['jabatan'];

        if ($user->exists) {
            $user->save();
        }

        // Sync to Firebase Firestore & Realtime DB
        try {
            $userData = [
                'id' => $user->id ?? 1,
                'name' => $user->username,
                'email' => $request->input('email', 'pakfii@catfishcare.app'),
                'role' => $user->jabatan,
            ];
            (new \App\Services\FirestoreService())->syncUserToFirestore($userData);
            (new \App\Services\FirebaseRealtimeService())->syncUser($userData);
        } catch (\Throwable $e) {}

        return response()->json($user);
    }
}
