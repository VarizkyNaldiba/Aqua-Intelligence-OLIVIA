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
        Schema::create('pond_thresholds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kolam_id')->constrained('kolam')->onDelete('cascade');
            $table->string('parameter'); // 'ph', 'suhu', 'turbidity', 'tds', 'water_level_dev', 'sfr'
            $table->double('normal_min')->nullable();
            $table->double('normal_max')->nullable();
            $table->double('warning_min')->nullable();
            $table->double('warning_max')->nullable();
            $table->double('high_min')->nullable();
            $table->double('high_max')->nullable();
            $table->double('critical_min')->nullable();
            $table->double('critical_max')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();

            $table->unique(['kolam_id', 'parameter']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pond_thresholds');
    }
};
