<?php

require_once "../config/db.php";
require_once "../middleware/verify.php";

header("Content-Type: application/json");

/* Verify User */
$user = verifyToken();

/* Admin Only */
if($user->role !== "admin") {
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

$requiredFields = [
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

foreach($requiredFields as $field) {

    if(
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

/* Check Employee ID already exists */

$checkStmt = $conn->prepare("
    SELECT id
    FROM employees
    WHERE employee_id = ?
");

$checkStmt->bind_param(
    "s",
    $data["employee_id"]
);

$checkStmt->execute();

if($checkStmt->get_result()->num_rows > 0) {

    http_response_code(409);

    echo json_encode([
        "status" => "error",
        "message" => "Employee ID already exists"
    ]);

    exit;
}

/* Insert Employee */

$stmt = $conn->prepare("
    INSERT INTO employees (
        employee_id,
        name,
        dob,
        department,
        employment_type,
        experience,
        doj,
        pay_type,
        salary
    )
    VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
");

$stmt->bind_param(
    "sssssdsid",
    $data["employee_id"],
    $data["name"],
    $data["dob"],
    $data["department"],
    $data["employment_type"],
    $data["experience"],
    $data["doj"],
    $data["pay_type"],
    $data["salary"]
);

$stmt->execute();

echo json_encode([
    "status" => "success",
    "message" => "Employee created successfully",
    "employeeId" => $conn->insert_id
]);