<?php

require_once "../config/db.php";

header("Content-Type: application/json");

/* 1. Check if cookie exists */
if (isset($_COOKIE["refreshToken"])) {

    $refreshToken = $_COOKIE["refreshToken"];
    $tokenHash = hash('sha256', $refreshToken);

    /* 2. Delete refresh token from DB */
    $stmt = $conn->prepare("DELETE FROM refresh_tokens WHERE token_hash = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
}

/* 3. Clear cookie */
setcookie(
    "refreshToken",
    "",
    [
        "expires" => time() - 3600,
        "path" => "/",
        "httponly" => true,
        "secure" => false, // true in production (HTTPS)
        "samesite" => "Strict"
    ]
);

echo json_encode([
    "status" => "success",
    "message" => "Logged out"
]);