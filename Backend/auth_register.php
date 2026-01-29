<?php
require 'db.php';
$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['username']) && !empty($data['email'])) {
    $pass = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    try {
        $stmt->execute([$data['username'], $data['email'], $pass]);
        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "User already exists"]);
    }
}
?>