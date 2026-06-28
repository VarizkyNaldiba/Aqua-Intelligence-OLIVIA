<?php

namespace App\Http\Controllers;

use App\Models\Esp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EspController extends Controller
{
    /**
     * Get all ESP records.
     */
    public function index(): JsonResponse
    {
        return response()->json(Esp::orderBy('id')->get());
    }

    /**
     * Create a new ESP record.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'uuid' => ['required', 'string', 'max:255', 'unique:esp,uuid'],
        ]);

        $esp = Esp::create([
            'uuid' => $request->uuid,
        ]);

        return response()->json($esp, 201);
    }

    /**
     * Update an existing ESP record.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $esp = Esp::findOrFail($id);

        $request->validate([
            'uuid' => ['required', 'string', 'max:255', 'unique:esp,uuid,' . $id],
        ]);

        $esp->update([
            'uuid' => $request->uuid,
        ]);

        return response()->json($esp);
    }

    /**
     * Delete an ESP record.
     */
    public function destroy(int $id): JsonResponse
    {
        $esp = Esp::findOrFail($id);
        $esp->delete();

        return response()->json(['message' => 'ESP berhasil dihapus.']);
    }
}
