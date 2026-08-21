<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PondThreshold extends Model
{
    use HasFactory;

    protected $table = 'pond_thresholds';

    protected $fillable = [
        'kolam_id',
        'parameter',
        'normal_min',
        'normal_max',
        'warning_min',
        'warning_max',
        'high_min',
        'high_max',
        'critical_min',
        'critical_max',
        'version',
    ];

    public function kolam(): BelongsTo
    {
        return $this->belongsTo(Kolam::class, 'kolam_id');
    }
}
