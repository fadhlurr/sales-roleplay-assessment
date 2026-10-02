<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'communication_score', 'pitch_score', 'objection_score',
        'confidence_score', 'closing_score', 'overall_score',
        'feedback', 'summary',
    ];

    public function roleplaySession(): BelongsTo
    {
        return $this->belongsTo(RoleplaySession::class, 'session_id');
    }
}
