<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Auth di app ini stateless JWT (lihat JwtAuthenticate + tymon/jwt-auth),
        // bukan guard session Laravel bawaan — jadi tidak ada email_verified_at,
        // rememberToken, password_reset_tokens, atau tabel sessions. Replika
        // persis User.js (Sequelize) di backend Express.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->enum('role', ['candidate', 'sales', 'hr', 'manager', 'admin'])->default('candidate');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
