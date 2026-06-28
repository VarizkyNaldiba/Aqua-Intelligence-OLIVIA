<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['uuid'])]
class Esp extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'esp';

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;
}
