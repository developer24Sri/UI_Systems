<?php

require_once "../config/db.php";
require_once "../auth/jwt.php";

header("Content-Type: application/json");

/* 1. Check cookie exists */
if (!isset($_COOKIE["refreshToken"])) {

    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "Refresh token missing"
    ]);
    exit;
}

$refreshToken = $_COOKIE["refreshToken"];
$tokenHash = hash('sha256', $refreshToken);

/* 2. Validate refresh token in DB */
$stmt = $conn->prepare("SELECT user_id, expires_at FROM refresh_tokens WHERE token_hash = ?");
$stmt->bind_param("s", $tokenHash);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {

    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid refresh token"
    ]);
    exit;
}

$row = $result->fetch_assoc();

/* 3. Check expiration */
if (strtotime($row["expires_at"]) < time()) {

    // delete expired token
    $deleteStmt = $conn->prepare("DELETE FROM refresh_tokens WHERE token_hash = ?");
    $deleteStmt->bind_param("s", $tokenHash);
    $deleteStmt->execute();

    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "Refresh token expired"
    ]);
    exit;
}

$userId = $row["user_id"];

/* 4. Fetch user */
$stmt = $conn->prepare("SELECT id, username, role FROM users WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {

    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "User not found"
    ]);
    exit;
}

$user = $result->fetch_assoc();

/* 5. ROTATE refresh token */

// Delete old token
$deleteStmt = $conn->prepare("DELETE FROM refresh_tokens WHERE token_hash = ?");
$deleteStmt->bind_param("s", $tokenHash);
$deleteStmt->execute();

// Generate new refresh token
$newRefreshToken = bin2hex(random_bytes(32));
$newTokenHash = hash('sha256', $newRefreshToken);
$newExpiresAt = date("Y-m-d H:i:s", time() + (60 * 60 * 24 * 7));

$insertStmt = $conn->prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)");
$insertStmt->bind_param("iss", $userId, $newTokenHash, $newExpiresAt);
$insertStmt->execute();

/* 6. Set new refresh cookie */
setcookie(
    "refreshToken",
    $newRefreshToken,
    [
        "expires" => time() + (60 * 60 * 24 * 7),
        "path" => "/",
        "httponly" => true,
        "secure" => false,
        "samesite" => "Strict"
    ]
);

/* 7. Issue new access token */
$newAccessToken = createJWT([
    "user_id" => $user["id"],
    "username" => $user["username"],
    "role" => $user["role"]
], 60 * 15);

/* 8. Send response */
echo json_encode([
    "status" => "success",
    "message" => "Access token refreshed",
    "data" => [
        "accessToken" => $newAccessToken
    ]
]);