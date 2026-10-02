<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Model implements JWTSubject
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'password_hash', 'role'];

    protected $hidden = ['password_hash'];

    public function roleplaySessions(): HasMany
    {
        return $this->hasMany(RoleplaySession::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'userId' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'name' => $this->name,
        ];
    }
}
