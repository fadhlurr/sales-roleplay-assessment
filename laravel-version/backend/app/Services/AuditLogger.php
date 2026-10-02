<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Throwable;

// Replika persis services/auditLogger.js: gagal mencatat log TIDAK BOLEH
// menggagalkan aksi utama, jadi errornya cukup dicatat server-side, tidak
// dilempar ulang.
class AuditLogger
{
    public static function log(?int $userId, string $action, ?string $description = null): void
    {
        try {
            AuditLog::create([
                'user_id' => $userId,
                'action' => $action,
                'description' => $description,
            ]);
        } catch (Throwable $e) {
            Log::error('Gagal mencatat audit log: '.$e->getMessage());
        }
    }
}
