<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scenarios', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->enum('type', ['cold_call', 'product_pitch', 'objection_handling', 'closing']);
            // Instruksi yang ditampilkan ke user sebelum simulasi dimulai, dan
            // juga dipakai sebagai bagian dari system prompt AI untuk berperan
            // sebagai customer/prospect sesuai skenario ini.
            $table->text('instruction');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scenarios');
    }
};
