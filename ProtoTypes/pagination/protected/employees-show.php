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

$search = isset($_GET["search"])
    ? trim($_GET["search"])
    : "";

if ($page < 1) {
    $page = 1;
}

if ($limit < 1) {
    $limit = 5;
}

$offset = ($page - 1) * $limit;

/* Total employee count */

$countStmt = $conn->prepare("
    SELECT COUNT(*) AS total
    FROM employees
    WHERE name LIKE ?
");

$searchTerm = "%{$search}%";

$countStmt->bind_param(
    "s",
    $searchTerm
);

$countStmt->execute();

$totalEmployees = $countStmt
    ->get_result()
    ->fetch_assoc()["total"];

/* Paginated employees */

$stmt = $conn->prepare("
    SELECT *
    FROM employees
    WHERE name LIKE ?
    LIMIT ?
    OFFSET ?
");

$stmt->bind_param(
    "sii",
    $searchTerm,
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
