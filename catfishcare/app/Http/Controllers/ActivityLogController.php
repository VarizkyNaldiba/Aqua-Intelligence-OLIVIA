<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get system activity logs.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search');

        $query = ActivityLog::orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        $logs = $query->limit(100)->get()->map(function ($log) {
            return [
                'id'          => $log->id,
                'user_id'     => $log->user_id,
                'username'    => $log->username ?? 'System',
                'action'      => $log->action,
                'description' => $log->description,
                'ip_address'  => $log->ip_address ?? '127.0.0.1',
                'user_agent'  => $log->user_agent,
                'created_at'  => $log->created_at ? $log->created_at->format('d M Y H:i:s') : '-',
            ];
        });

        return response()->json([
            'logs' => $logs
        ]);
    }
}
