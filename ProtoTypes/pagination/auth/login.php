<?php

require_once "../config/db.php";
require_once "../auth/jwt.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$username = $data["username"] ?? "";
$password = $data["password"] ?? "";

if (!$username || !$password) {

    echo json_encode([
        "status" => "error",
        "message" => "Username and password required"
    ]);
    exit;
}

/* Find user */
$stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {

    echo json_encode([
        "status" => "error",
        "message" => "User not found"
    ]);
    exit;
}

$user = $result->fetch_assoc();

/* Verify password */
if (!password_verify($password, $user["password"])) {

    echo json_encode([
        "status" => "error",
        "message" => "Invalid credientials"
    ]);
    exit;
}

/* Generate access token(JWT) & refresh token */

$accessToken = createJWT([
    "user_id" => $user["id"],
    "username" => $user["username"],
    "role" => $user["role"]
], 60 * 15); //you can change it to 10 -> 10sec to test the refresh of 401.

// Generate random refresh token (NOT JWT)
$refreshToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $refreshToken);

$expiresAt = date("Y-m-d H:i:s", time() + (60 * 60 * 24 * 7)); // 7 days

/* Enforce single active session per user [if u want multi session then remove the delete query and keep alone insert query]*/
// DELETE all previous refresh tokens for this user
$deleteStmt = $conn->prepare("DELETE FROM refresh_tokens WHERE user_id = ?");
$deleteStmt->bind_param("i", $user["id"]);
$deleteStmt->execute();

$stmt = $conn->prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)");
$stmt->bind_param("iss", $user["id"], $tokenHash, $expiresAt);
$stmt->execute();


/* Store refresh token in httpOnly cookie */
setcookie(
    "refreshToken",
    $refreshToken,
    [
        "expires" => time() + (60 * 60 * 24 * 7),
        "path" => "/",
        "httponly" => true,
        "secure" => false,
        "samesite" => "Strict"
    ]
);

/* Send only access token in response */
echo json_encode([
    "status" => "success",
    "message" => "Login successful",
    "data" => [
        "accessToken" => $accessToken
    ]
]);


?>
