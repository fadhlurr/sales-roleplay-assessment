<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

// Replika persis middleware/requireAuth.js di backend Express: dua cabang
// saja (header hilang/salah format, atau token invalid/expired), bukan
// middleware auth bawaan Laravel/tymon supaya pesan error match persis.
class JwtAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');

        if (! $header || ! str_starts_with($header, 'Bearer ')) {
            return response()->json(['error' => 'Unauthorized: missing or invalid token'], 401);
        }

        $token = substr($header, 7);

        try {
            $payload = JWTAuth::setToken($token)->getPayload();
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Unauthorized: invalid or expired token'], 401);
        }

        $request->attributes->set('authUser', (object) [
            'userId' => $payload->get('userId'),
            'email' => $payload->get('email'),
            'role' => $payload->get('role'),
            'name' => $payload->get('name'),
        ]);

        return $next($request);
    }
}
