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
        // database/migrations/[timestamp]_create_about_sections_table.php
        Schema::create('about_sections', function (Blueprint $table) {
            $table->id();
            $table->string('section_key')->unique(); // 'intro', 'main_photo', 'bio', etc.
            $table->string('title_fr')->nullable();
            $table->string('title_en')->nullable();
            $table->text('content_fr')->nullable();
            $table->text('content_en')->nullable();
            $table->string('image')->nullable();
            $table->string('video_url')->nullable();
            $table->json('stats')->nullable(); // pour les chiffres clés
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('about_sections');
    }
};
