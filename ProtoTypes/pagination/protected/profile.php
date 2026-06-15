<?php

require_once "../middleware/verify.php";

header("Content-Type: application/json");

$user = verifyToken();

echo json_encode([
    "status" => "success",
    "data" => [
        "username" => $user["username"],
        "role" => $user["role"]
    ]
]);