<?php

require_once "../config/db.php";
require_once "../middleware/verify.php";

header("Content-Type: application/json");

/* Verify User */
$user = verifyToken();

/* Admin Only */
if ($user["role"] !== "admin") {
    http_response_code(403);
    echo json_encode([
        "status" => "error",
        "message" => "Access denied"
    ]);
    exit;
}

/* Get Request Body */
$data = json_decode(
    file_get_contents("php://input"),
    true
);

/* Validation */
// 'id' is required to know WHICH record to update
$requiredFields = [
    "id", 
    "employee_id",
    "name",
    "dob",
    "department",
    "employment_type",
    "experience",
    "doj",
    "pay_type",
    "salary"
];

foreach ($requiredFields as $field) {
    if (
        !isset($data[$field]) ||
        trim((string)$data[$field]) === ""
    ) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "{$field} is required"
        ]);
        exit;
    }
}

/* Check if the Employee Record exists first */
$existStmt = $conn->prepare("
    SELECT id 
    FROM employees 
    WHERE id = ?
");
$existStmt->bind_param("i", $data["id"]);
$existStmt->execute();

if ($existStmt->get_result()->num_rows === 0) {
    http_response_code(404);
    echo json_encode([
        "status" => "error",
        "message" => "Employee record not found"
    ]);
    exit;
}

/* Check if NEW Employee ID is already taken by another employee */
$checkStmt = $conn->prepare("
    SELECT id 
    FROM employees 
    WHERE employee_id = ? AND id != ?
");
$checkStmt->bind_param(
    "si",
    $data["employee_id"],
    $data["id"]
);
$checkStmt->execute();

if ($checkStmt->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "status" => "error",
        "message" => "Employee ID already exists"
    ]);
    exit;
}

/* Update Employee */
$stmt = $conn->prepare("
    UPDATE employees 
    SET 
        employee_id = ?, 
        name = ?, 
        dob = ?, 
        department = ?, 
        employment_type = ?, 
        experience = ?, 
        doj = ?, 
        pay_type = ?, 
        salary = ?
    WHERE id = ?
");

// Note the extra 'i' at the end of the types string for the WHERE id = ?
$stmt->bind_param(
    "sssssdsidi",
    $data["employee_id"],
    $data["name"],
    $data["dob"],
    $data["department"],
    $data["employment_type"],
    $data["experience"],
    $data["doj"],
    $data["pay_type"],
    $data["salary"],
    $data["id"]
);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "Employee updated successfully"
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update employee record"
    ]);
}