<?php
// Override SCRIPT_NAME and PHP_SELF to prevent Symfony/Laravel from stripping /api prefix on Vercel requests
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// Ensure all temporary storage directories exist on Vercel serverless environment
$tmpDirs = [
    '/tmp',
    '/tmp/storage',
    '/tmp/storage/framework',
    '/tmp/storage/framework/views',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/framework/cache',
    '/tmp/storage/logs',
];

foreach ($tmpDirs as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0777, true);
    }
}

// Force SQLite database and storage configuration for Vercel
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=/tmp/database.sqlite');
putenv('VIEW_COMPILED_PATH=/tmp/storage/framework/views');
putenv('APP_CONFIG_CACHE=/tmp/config.php');
putenv('APP_EVENTS_CACHE=/tmp/events.php');
putenv('APP_PACKAGES_CACHE=/tmp/packages.php');
putenv('APP_ROUTES_CACHE=/tmp/routes.php');
putenv('APP_SERVICES_CACHE=/tmp/services.php');

putenv('SESSION_DRIVER=cookie');
putenv('SESSION_FILE_PATH=/tmp/storage/framework/sessions');
$_ENV['SESSION_DRIVER'] = 'cookie';
$_ENV['SESSION_FILE_PATH'] = '/tmp/storage/framework/sessions';
$_SERVER['SESSION_DRIVER'] = 'cookie';
$_SERVER['SESSION_FILE_PATH'] = '/tmp/storage/framework/sessions';

$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = '/tmp/database.sqlite';
$_SERVER['DB_CONNECTION'] = 'sqlite';
$_SERVER['DB_DATABASE'] = '/tmp/database.sqlite';

// Copy initial SQLite database to /tmp so it is writable on Vercel
$dbSource = __DIR__ . '/../database/database.sqlite';
$dbTarget = '/tmp/database.sqlite';

if (!file_exists($dbTarget) || filesize($dbTarget) === 0) {
    if (file_exists($dbSource) && filesize($dbSource) > 0) {
        copy($dbSource, $dbTarget);
    } else {
        touch($dbTarget);
    }
}

// Forward Vercel requests to Laravel's public/index.php
require __DIR__ . '/../public/index.php';
