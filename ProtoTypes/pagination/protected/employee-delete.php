<?php

require_once "../config/db.php";
require_once "../middleware/verify.php";

header("Content-Type: application/json");

$user = verifyToken();

/* Admin only */

if ($user["role"] !== "admin") {
    http_response_code(403);

    echo json_encode([
        "status" => "error",
        "message" => "Access denied"
    ]);

    exit;
}

/* Get request body */

$data = json_decode(
    file_get_contents("php://input"),
    true
);

/* Validation */

$id = (int)($_GET["id"] ?? 0);

if ($id <= 0) {
    http_response_code(400);

    echo json_encode([
        "status" => "error",
        "message" => "Valid employee id is required"
    ]);

    exit;
}

/* Check employee exists */

$checkStmt = $conn->prepare("
    SELECT id
    FROM employees
    WHERE id = ?
");

$checkStmt->bind_param(
    "i",
    $id
);

$checkStmt->execute();

$result = $checkStmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);

    echo json_encode([
        "status" => "error",
        "message" => "Employee not found"
    ]);

    exit;
}

/* Delete employee */

$deleteStmt = $conn->prepare("
    DELETE FROM employees
    WHERE id = ?
");

$deleteStmt->bind_param(
    "i",
    $id
);

$deleteStmt->execute();

/* Response */

echo json_encode([
    "status" => "success",
    "message" => "Employee deleted successfully"
]);