<?php
// backend/middleware/auth.php
// Middleware to authenticate JWT and enforce multi-tenant isolation parameters.

require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../config/db.php';

function authenticate() {
    // Enable CORS
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

    // Handle OPTIONS requests (CORS preflight)
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    $headers = apache_request_headers();
    
    // Fallback if Apache headers doesn't capture Authorization (common in some Apache setups)
    $authHeader = null;
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(["error" => "Access denied. Authorization header missing."]);
        exit();
    }

    // Extract bearer token
    list($jwt) = sscanf($authHeader, 'Bearer %s');

    if (!$jwt) {
        http_response_code(401);
        echo json_encode(["error" => "Malformed authorization header. Use: Bearer [token]"]);
        exit();
    }

    $decoded = JWT::decode($jwt, JWT_SECRET);

    if (!$decoded) {
        http_response_code(403);
        echo json_encode(["error" => "Session expired or invalid token."]);
        exit();
    }

    // Return the validated token payload (contains id, institute_id, role, name, etc.)
    return $decoded;
}
