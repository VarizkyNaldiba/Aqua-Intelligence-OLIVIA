<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Get list of all registered users.
     */
    public function index(): JsonResponse
    {
        $users = User::orderBy('id', 'desc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email ?? "{$u->username}@catfishcare.app",
                'role' => $u->role ?? ($u->jabatan === 'admin' ? 'admin' : 'user'),
                'created_at' => $u->created_at ? $u->created_at->format('d M Y H:i') : '-',
            ];
        });

        return response()->json([
            'users' => $users
        ]);
    }

    /**
     * Store a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role'     => ['required', 'string', 'in:admin,user'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'username' => trim($request->username),
            'email'    => strtolower(trim($request->email)),
            'jabatan'  => $request->role,
            'role'     => $request->role,
            'password' => Hash::make($request->password),
        ]);

        try {
            ActivityLog::create([
                'user_id'     => $request->user()?->id,
                'username'    => $request->user()?->username ?? 'Admin',
                'action'      => 'CREATE_USER',
                'description' => "Menambahkan user baru: {$user->username} ({$user->email}) dengan role [{$user->role}].",
                'ip_address'  => $request->ip(),
                'user_agent'  => substr($request->userAgent() ?? '', 0, 255),
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'status'  => 'success',
            'message' => "User {$user->username} berhasil dibuat.",
            'user'    => $user,
        ], 201);
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username,' . $id],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
            'role'     => ['required', 'string', 'in:admin,user'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $user->username = trim($request->username);
        $user->email    = strtolower(trim($request->email));
        $user->jabatan  = $request->role;
        $user->role     = $request->role;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        try {
            ActivityLog::create([
                'user_id'     => $request->user()?->id,
                'username'    => $request->user()?->username ?? 'Admin',
                'action'      => 'UPDATE_USER',
                'description' => "Memperbarui data user ID {$user->id}: {$user->username} ({$user->role}).",
                'ip_address'  => $request->ip(),
                'user_agent'  => substr($request->userAgent() ?? '', 0, 255),
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'status'  => 'success',
            'message' => "User {$user->username} berhasil diperbarui.",
            'user'    => $user,
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $deletedName = $user->username;

        $user->delete();

        try {
            ActivityLog::create([
                'user_id'     => $request->user()?->id,
                'username'    => $request->user()?->username ?? 'Admin',
                'action'      => 'DELETE_USER',
                'description' => "Menghapus user ID {$id}: {$deletedName}.",
                'ip_address'  => $request->ip(),
                'user_agent'  => substr($request->userAgent() ?? '', 0, 255),
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'status'  => 'success',
            'message' => "User {$deletedName} berhasil dihapus.",
        ]);
    }
}
