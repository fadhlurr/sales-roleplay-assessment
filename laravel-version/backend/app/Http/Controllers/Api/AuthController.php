<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');

        if (! $email || ! $password) {
            return response()->json(['error' => 'email dan password wajib diisi'], 400);
        }

        $user = User::where('email', strtolower(trim($email)))->first();

        // Pesan sengaja dibuat sama untuk akun tidak ada dan password salah,
        // supaya tidak bocor akun mana yang terdaftar.
        if (! $user || ! Hash::check($password, $user->password_hash)) {
            return response()->json(['error' => 'Email atau password salah'], 401);
        }

        AuditLogger::log($user->id, 'user.login', "{$user->email} login sebagai {$user->role}");

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function me(Request $request)
    {
        $user = User::find($request->attributes->get('authUser')->userId);

        if (! $user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        return new UserResource($user);
    }

    // Hanya admin & HR yang boleh membuat akun baru (recruiter membuat akun
    // kandidat, admin membuat akun sales/manager/hr lain).
    public function register(Request $request)
    {
        $authUser = $request->attributes->get('authUser');
        $name = $request->input('name');
        $email = $request->input('email');
        $password = $request->input('password');
        $role = $request->input('role');

        if (! $name || ! $email || ! $password || ! $role) {
            return response()->json(['error' => 'name, email, password, dan role wajib diisi'], 400);
        }

        if (strlen($password) < 8) {
            return response()->json(['error' => 'Password minimal 8 karakter'], 400);
        }

        if (! in_array($role, ['candidate', 'sales', 'hr', 'manager', 'admin'], true)) {
            return response()->json(['error' => 'Role tidak valid'], 400);
        }

        // Hanya admin yang boleh membuat akun hr/manager/admin lain; HR hanya
        // boleh membuat akun candidate untuk keperluan screening.
        if ($authUser->role === 'hr' && $role !== 'candidate') {
            return response()->json(['error' => 'HR hanya boleh membuat akun candidate'], 403);
        }

        $email = strtolower(trim($email));

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'Email sudah terdaftar'], 409);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password_hash' => Hash::make($password),
            'role' => $role,
        ]);

        AuditLogger::log($authUser->userId, 'user.created', "{$authUser->email} membuat akun {$user->email} ({$role})");

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
