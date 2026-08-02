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
        // database/migrations/[timestamp]_create_service_domains_table.php
        Schema::create('service_domains', function (Blueprint $table) {
            $table->id();
            $table->string('name_fr');
            $table->string('name_en')->nullable();
            $table->text('description_fr');
            $table->text('description_en')->nullable();
            $table->string('icon')->nullable(); // classe FontAwesome ou chemin d'icône
            $table->string('image');
            $table->string('slug')->unique();
            $table->string('color')->default('#00D4FF'); // couleur associée
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_domains');
    }
};
