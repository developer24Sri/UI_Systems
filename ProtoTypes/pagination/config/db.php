<?php

$host = "localhost:3307";
$user = "root";
$pass = "root";
$db   = "employee_management";  

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Database connection failed");
}
