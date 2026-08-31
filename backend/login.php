<?php
// backend/login.php
// Handles user login and generates a secure JWT token.

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils/jwt.php';

// Enable CORS and JSON headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed. Use POST."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

if (!isset($input['roll_or_email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing credentials: roll_or_email and password."]);
    exit();
}

$credential = trim((string)$input['roll_or_email']);
$password = $input['password'];

$db = Database::getConnection();

// Fetch user and institute details
$query = "
    SELECT u.*, i.name as institute_name 
    FROM users u
    JOIN institutes i ON u.institute_id = i.id
    WHERE u.roll_no = ? OR u.email = ?
";
$stmt = $db->prepare($query);
$stmt->execute([$credential, $credential]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid roll number, email, or password."]);
    exit();
}

if ($user['status'] !== 'active') {
    http_response_code(403);
    echo json_encode(["error" => "Your account is currently {$user['status']}. Contact administration."]);
    exit();
}

// Generate token payload
$expiry = time() + (24 * 60 * 60 * 30); // 30 days session persistence for user-friendly mobile experience
$payload = [
    "id" => intval($user['id']),
    "institute_id" => intval($user['institute_id']),
    "institute_name" => $user['institute_name'],
    "name" => $user['name'],
    "email" => $user['email'],
    "phone" => $user['phone'],
    "roll_no" => intval($user['roll_no']),
    "department" => $user['department'],
    "session" => $user['session'],
    "semester" => "5th", // Default semester mapping
    "role" => $user['role'],
    "exp" => $expiry
];

$jwt = JWT::encode($payload, JWT_SECRET);

echo json_encode([
    "success" => true,
    "token" => $jwt,
    "user" => [
        "id" => intval($user['id']),
        "name" => $user['name'],
        "email" => $user['email'],
        "phone" => $user['phone'],
        "rollNo" => intval($user['roll_no']),
        "department" => $user['department'],
        "session" => $user['session'],
        "semester" => "5th",
        "instituteName" => $user['institute_name'],
        "instituteId" => intval($user['institute_id'])
    ]
]);
