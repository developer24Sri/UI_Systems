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

$department = isset($_GET["department"])
    ? trim($_GET["department"])
    : "";

$sortBy = $_GET["sortBy"] ?? "id";
$sortOrder = $_GET["sortOrder"] ?? "ASC";

$allowedColumns = [
    "id",
    "employee_id",
    "name",
    "department"
];

if (!in_array($sortBy, $allowedColumns)) {
    $sortBy = "id";
}

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
    AND (? = '' OR department = ?)
");

$searchTerm = "%{$search}%";

$countStmt->bind_param(
    "sss",
    $searchTerm,
    $department,
    $department
);

$countStmt->execute();

$totalEmployees = $countStmt
    ->get_result()
    ->fetch_assoc()["total"];

$sortOrder =
    strtoupper($sortOrder) === "DESC"
    ? "DESC"
    : "ASC";

/* Paginated employees */

$query = "
SELECT *
FROM employees
WHERE name LIKE ?
AND (? = '' OR department = ?)
ORDER BY $sortBy $sortOrder
LIMIT ?
OFFSET ?
";

$stmt = $conn->prepare($query);

$stmt->bind_param(
    "sssii",
    $searchTerm,
    $department,
    $department,
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
