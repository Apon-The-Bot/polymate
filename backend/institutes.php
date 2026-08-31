<?php
// backend/institutes.php
// Returns a list of all registered institutes for registration selection dropdown.

require_once __DIR__ . '/config/db.php';

// Enable CORS and JSON headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $db = Database::getConnection();
    
    // Fetch all institutes sorted alphabetically by name
    $stmt = $db->query("SELECT id, name, code, district FROM institutes ORDER BY name ASC");
    $institutes = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "institutes" => $institutes
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to load institutes: " . $e->getMessage()]);
}
