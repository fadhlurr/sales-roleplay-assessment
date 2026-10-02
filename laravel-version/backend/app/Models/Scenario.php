<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Scenario extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'type', 'instruction', 'status'];

    public function roleplaySessions(): HasMany
    {
        return $this->hasMany(RoleplaySession::class);
    }
}
