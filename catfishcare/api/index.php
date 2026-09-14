<?php
// Override SCRIPT_NAME and PHP_SELF to prevent Symfony/Laravel from stripping /api prefix on Vercel requests
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// Force SQLite database configuration on Vercel serverless environment
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=/tmp/database.sqlite');
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = '/tmp/database.sqlite';
$_SERVER['DB_CONNECTION'] = 'sqlite';
$_SERVER['DB_DATABASE'] = '/tmp/database.sqlite';

// Copy initial SQLite database to /tmp so it is writable on Vercel
$dbSource = __DIR__ . '/../database/database.sqlite';
$dbTarget = '/tmp/database.sqlite';

if (!file_exists($dbTarget)) {
    // Ensure the folder exists
    if (!file_exists('/tmp')) {
        mkdir('/tmp', 0777, true);
    }
    // Copy the database file if it exists in the source
    if (file_exists($dbSource)) {
        copy($dbSource, $dbTarget);
    } else {
        // Create an empty sqlite database if source doesn't exist
        touch($dbTarget);
    }
}

// Forward Vercel requests to Laravel's public/index.php
require __DIR__ . '/../public/index.php';
