<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            // unique() menegakkan relasi one-to-one dengan roleplay_sessions
            // (hasOne/belongsTo) di level database.
            $table->foreignId('session_id')->unique()->constrained('roleplay_sessions')->cascadeOnDelete();
            $table->integer('communication_score');
            $table->integer('pitch_score');
            $table->integer('objection_score');
            $table->integer('confidence_score');
            $table->integer('closing_score');
            $table->integer('overall_score');
            $table->text('feedback');
            $table->text('summary')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
