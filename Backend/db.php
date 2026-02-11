<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

$host = 'db'; // เชื่อมไปยังชื่อ service ใน docker
$db   = 'newgen_db';
$user = 'root';
$pass = 'rootpassword';

try {
     $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
     $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
     die(json_encode(["status" => "error", "message" => "DB Connection failed"]));
}

// จัดการ Preflight request (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}

?>