<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kolam extends Model
{
    use HasFactory;

    protected $table = 'kolam';
    public $timestamps = false;

    protected $fillable = [
        'esp_id',
        'nama',
        'jumlah_iwak',
    ];

    public function esp(): BelongsTo
    {
        return $this->belongsTo(Esp::class, 'esp_id');
    }

    public function thresholds(): HasMany
    {
        return $this->hasMany(PondThreshold::class, 'kolam_id');
    }
}
