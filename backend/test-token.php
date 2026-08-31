<?php
// backend/test-token.php
// Temporary script to generate a valid development JWT token for testing database integration.

require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/config/db.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// Generate a payload for the test user (ID = 1, Institute ID = 1)
$payload = [
    "id" => 1,
    "institute_id" => 1,
    "role" => "student",
    "name" => "Rahat Islam",
    "exp" => time() + (3600 * 24 * 30) // Token valid for 30 days
];

$token = JWT::encode($payload, JWT_SECRET);

echo json_encode([
    "success" => true,
    "message" => "Test token generated successfully! Copy the token string below and paste it in useMessData.ts.",
    "token" => $token
], JSON_PRETTY_PRINT);
