<?php

require_once "../config/db.php";
require_once "../middleware/verify.php";

header("Content-Type: application/json");

$user = verifyToken();

$result = $conn->query("
    SELECT DISTINCT department
    FROM employees
    ORDER BY department ASC
");

$departments = [];

while($row = $result->fetch_assoc()) {
    $departments[] = $row["department"];
}

echo json_encode([
    "status" => "success",
    "data" => $departments
]);