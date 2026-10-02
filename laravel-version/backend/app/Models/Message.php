<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = ['session_id', 'sender_type', 'message', 'sequence'];

    public function roleplaySession(): BelongsTo
    {
        return $this->belongsTo(RoleplaySession::class, 'session_id');
    }
}
