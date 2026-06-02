<?php

require_once __DIR__ . "/../auth/jwt.php";

function verifyToken() {
    
    $headers = getallheaders();

    if(!isset($headers["Authorization"])) {
        http_response_code(401);

        echo json_encode([
            "status" => "error",
            "message" => "Token missing"
        ]);

        exit;
    }

    $token = str_replace("Bearer ","", $headers["Authorization"]);

    $decoded = verifyJWT($token);

    if(!$decoded) {
        http_response_code(401);

        echo json_encode([
            "status" => "error",
            "message" => "Invalid token"
        ]);

        exit;
    }
    return $decoded;
}

