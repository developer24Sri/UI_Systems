<?php
// register.php
require_once "./config/db.php";
require_once "./auth/jwt.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

// 1. Basic Validation
if (strlen($username) < 3 || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid input length"]);
    exit;
}

// 2. Check if username exists already
$checkStmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$checkStmt->bind_param("s", $username);
$checkStmt->execute();
if ($checkStmt->get_result()->num_rows > 0) {
    http_response_code(409); // 409 Conflict
    echo json_encode(["status" => "error", "message" => "Username already taken"]);
    exit;
}

// 3. Hash the password (using default BCRYPT)
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// 4. INSERT the user
$stmt = $conn->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')");
$stmt->bind_param("ss", $username, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "User registered successfully. Please login."
    ]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Registration failed"]);
}