<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DatasetController extends Controller
{
    /**
     * Receive and store a dataset frame and optional YOLO labels from Raspberry Pi.
     */
    public function receiveFrame(Request $request): JsonResponse
    {
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $filename = $image->getClientOriginalName();
            if (!$filename || $filename === 'blob') {
                $filename = 'frame_' . date('Ymd_His') . '_' . uniqid() . '.' . ($image->getClientOriginalExtension() ?: 'jpg');
            }
            
            // 1. Simpan gambar ke storage dataset
            $imagePath = $image->storeAs('dataset/images', $filename, 'public');
            
            // 2. Simpan label jika ada (Format YOLO .txt)
            if ($request->has('labels')) {
                $labelsInput = $request->input('labels');
                $labels = is_array($labelsInput) ? $labelsInput : json_decode($labelsInput, true);
                if (is_array($labels)) {
                    $txtFilename = pathinfo($filename, PATHINFO_FILENAME) . '.txt';
                    Storage::disk('public')->put('dataset/labels/' . $txtFilename, implode("\n", $labels));
                }
            }

            $totalImages = count(Storage::disk('public')->files('dataset/images'));

            return response()->json([
                'status' => 'success',
                'file'   => $filename,
                'path'   => $imagePath,
                'total_saved' => $totalImages
            ]);
        }

        return response()->json(['error' => 'No image uploaded'], 400);
    }

    /**
     * Get statistics of received dataset files.
     */
    public function getDatasetStats(): JsonResponse
    {
        $images = Storage::disk('public')->files('dataset/images');
        $labels = Storage::disk('public')->files('dataset/labels');

        return response()->json([
            'total_images' => count($images),
            'total_labels' => count($labels),
        ]);
    }
}
