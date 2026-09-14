<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PondCalibration extends Model
{
    use HasFactory;

    protected $table = 'pond_calibrations';

    protected $fillable = [
        'kolam_id',
        'ph_v7',
        'ph_v4',
        'turbidity_v_clear',
        'tds_factor',
        'pond_height',
        'temp_offset',
        'version',
    ];

    protected $casts = [
        'ph_v7' => 'float',
        'ph_v4' => 'float',
        'turbidity_v_clear' => 'float',
        'tds_factor' => 'float',
        'pond_height' => 'float',
        'temp_offset' => 'float',
        'version' => 'integer',
    ];

    public function kolam(): BelongsTo
    {
        return $this->belongsTo(Kolam::class, 'kolam_id');
    }
}
