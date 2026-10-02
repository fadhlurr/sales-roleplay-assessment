<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Replika persis middleware/requireRole.js. Dipasang SETELAH JwtAuthenticate
// (token yang sah belum tentu berhak) — pakai alias `role:hr,admin` dst.
class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $authUser = $request->attributes->get('authUser');

        if (! $authUser || ! in_array($authUser->role, $roles, true)) {
            return response()->json(['error' => 'Akses ditolak untuk peran ini'], 403);
        }

        return $next($request);
    }
}
