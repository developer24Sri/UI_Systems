<?php

require_once "../config/db.php";
require_once "../middleware/verify.php";

header("Content-Type: application/json");

$user = verifyToken();

/*
    page=1
    limit=5

    offset = (page - 1) * limit
*/

$page = isset($_GET["page"])
    ? (int)$_GET["page"]
    : 1;

$limit = isset($_GET["limit"])
    ? (int)$_GET["limit"]
    : 5;

if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 5;
}

$offset = ($page - 1) * $limit;

/* Total employee count */

$countResult = $conn->query("
    SELECT COUNT(*) AS total
    FROM employees
");

$totalEmployees = $countResult
    ->fetch_assoc()["total"];

/* Paginated employees */

$stmt = $conn->prepare("
    SELECT *
    FROM employees
    LIMIT ?
    OFFSET ?
");

$stmt->bind_param(
    "ii",
    $limit,
    $offset
);

$stmt->execute();

$result = $stmt->get_result();

$employees = [];

while ($row = $result->fetch_assoc()) {
    $employees[] = $row;
}

/* Response */

echo json_encode([
    "status" => "success",
    "data" => $employees,

    "pagination" => [
        "currentPage" => $page,
        "limit" => $limit,
        "totalRecords" => (int)$totalEmployees,
        "totalPages" => ceil($totalEmployees / $limit)
    ]
]);