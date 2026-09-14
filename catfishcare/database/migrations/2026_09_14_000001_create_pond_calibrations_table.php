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
        Schema::create('pond_calibrations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kolam_id');
            $table->float('ph_v7')->default(2.50);
            $table->float('ph_v4')->default(3.05);
            $table->float('turbidity_v_clear')->default(4.20);
            $table->float('tds_factor')->default(0.50);
            $table->float('pond_height')->default(100.0);
            $table->float('temp_offset')->default(0.0);
            $table->integer('version')->default(1);
            $table->timestamps();

            $table->unique('kolam_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pond_calibrations');
    }
};
