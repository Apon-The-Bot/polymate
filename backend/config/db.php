<?php
// backend/config/db.php
// Database configuration using PDO for security and performance.

define('DB_HOST', 'localhost');
define('DB_NAME', 'bhbd_polymate');
define('DB_USER', 'bhbd');
define('DB_PASS', 'YOUR_DATABASE_PASSWORD'); // replace with actual DB password
define('JWT_SECRET', 'your_super_secret_key_change_this_in_production');

class Database {
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn === null) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];
                self::$conn = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Return a clean error without leaking database credentials
                http_response_code(500);
                echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
                exit();
            }
        }
        return self::$conn;
    }
}
