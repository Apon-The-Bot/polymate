<?php
// backend/register.php
// Handles user registration for both Students and General Users with dynamic institute creation and address mapping.

require_once __DIR__ . '/config/db.php';

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

// Resolve and validate user role
$role = isset($input['role']) ? trim((string)$input['role']) : 'student';
if (!in_array($role, ['student', 'general'])) {
    $role = 'student';
}

// Define fields required based on role
if ($role === 'general') {
    $required = ['name', 'email', 'phone', 'password'];
} else {
    // If student, require institute selection parameter as well
    $required = ['name', 'email', 'phone', 'roll_no', 'registration_no', 'department', 'session', 'password'];
}

foreach ($required as $field) {
    if (!isset($input[$field]) || empty(trim((string)$input[$field]))) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required registration parameter: {$field}."]);
        exit();
    }
}

$db = Database::getConnection();

// Check if email already exists (always required to be unique)
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$input['email']]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "Email address already registered."]);
    exit();
}

$instituteId = null;
$currentAddress = isset($input['current_address']) ? trim((string)$input['current_address']) : null;

// Student-specific validations and institute resolution
if ($role === 'student') {
    $rawInstituteId = $input['institute_id'] ?? '';
    
    if ($rawInstituteId === 'other' || empty($rawInstituteId) || !is_numeric($rawInstituteId)) {
        // Custom institute name provided
        $customName = isset($input['custom_institute_name']) ? trim((string)$input['custom_institute_name']) : '';
        if (empty($customName)) {
            http_response_code(400);
            echo json_encode(["error" => "Please enter your custom institute name."]);
            exit();
        }
        
        // Check if custom name already exists in database (case-insensitive)
        $stmt = $db->prepare("SELECT id FROM institutes WHERE LOWER(name) = LOWER(?)");
        $stmt->execute([$customName]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            $instituteId = intval($existing['id']);
        } else {
            // Generate a unique code/abbreviation from custom name
            $words = explode(' ', $customName);
            $code = '';
            foreach ($words as $w) {
                $code .= strtoupper(substr($w, 0, 1));
            }
            if (empty($code)) {
                $code = 'INST-' . rand(1000, 9999);
            }
            
            // Check if code is unique, if not append random suffix
            $stmt = $db->prepare("SELECT id FROM institutes WHERE code = ?");
            $stmt->execute([$code]);
            if ($stmt->fetch()) {
                $code .= rand(10, 99);
            }
            
            // Insert new custom institute
            $stmt = $db->prepare("INSERT INTO institutes (name, code, district) VALUES (?, ?, 'Other')");
            $stmt->execute([$customName, $code]);
            $instituteId = intval($db->lastInsertId());
        }
    } else {
        $instituteId = intval($rawInstituteId);
    }
    
    // Check if roll and registration combination already exists in this institute
    $stmt = $db->prepare("SELECT id FROM users WHERE institute_id = ? AND roll_no = ? AND registration_no = ?");
    $stmt->execute([$instituteId, $input['roll_no'], $input['registration_no']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Roll and registration number combination already exists at this institute."]);
        exit();
    }
}

// Map database column values
$rollNo = $role === 'student' ? intval($input['roll_no']) : null;
$registrationNo = $role === 'student' ? intval($input['registration_no']) : null;
$department = $role === 'student' ? $input['department'] : null;
$session = $role === 'student' ? $input['session'] : null;

// Hash password with bcrypt
$passwordHash = password_hash($input['password'], PASSWORD_BCRYPT);

try {
    $stmt = $db->prepare("
        INSERT INTO users (institute_id, name, email, phone, roll_no, registration_no, department, session, password_hash, role, current_address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    ");
    
    $stmt->execute([
        $instituteId,
        $input['name'],
        $input['email'],
        $input['phone'],
        $rollNo,
        $registrationNo,
        $department,
        $session,
        $passwordHash,
        $role,
        $currentAddress
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Registration successful. You can log in now."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Registration failed: " . $e->getMessage()]);
}
