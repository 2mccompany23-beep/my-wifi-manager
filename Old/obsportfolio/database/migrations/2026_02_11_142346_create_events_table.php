<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            
            // Titres bilingues
            $table->string('title_fr');
            $table->string('title_en');
            
            // Descriptions bilingues
            $table->text('description_fr');
            $table->text('description_en');
            
            // Catégorie
            $table->string('category');
            $table->boolean('is_new_category')->default(false);
            
            // Image vedette
            $table->string('featured_image');
            
            // Slug pour URL
            $table->string('slug')->unique();
            
            // Ordre d'affichage
            $table->integer('order')->default(0);
            
            // Statut
            $table->boolean('is_published')->default(true);
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('events');
    }
};