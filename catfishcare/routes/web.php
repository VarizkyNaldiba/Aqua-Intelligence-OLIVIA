<?php

use App\Models\Esp;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Dashboard');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

Route::get('/esp', function () {
    return Inertia::render('EspPage', [
        'espList' => Esp::orderBy('id')->get(),
    ]);
})->name('esp');

require __DIR__ . '/auth.php';
