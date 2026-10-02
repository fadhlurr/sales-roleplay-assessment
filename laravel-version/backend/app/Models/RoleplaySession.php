<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RoleplaySession extends Model
{
    use HasFactory;

    protected $table = 'roleplay_sessions';

    protected $fillable = [
        'user_id', 'scenario_id', 'session_type', 'status', 'started_at', 'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(Scenario::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'session_id');
    }

    public function assessment(): HasOne
    {
        return $this->hasOne(Assessment::class, 'session_id');
    }
}
