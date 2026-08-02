<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('statistics', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // ex: 'experience_years', 'competitions', 'countries', 'event_name'
            $table->string('value'); // ex: '7+', '5+', '15', 'CAN 25'
            $table->string('label_fr'); // ex: "Ans d'expérience"
            $table->string('label_en')->nullable(); // ex: "Years of experience"
            $table->string('color')->default('#00D4FF'); // couleur personnalisable
            $table->string('icon')->nullable(); // classe FontAwesome ou chemin d'icône
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('statistics');
    }
};
