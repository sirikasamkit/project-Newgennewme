<?php
require 'db.php'; // เรียกใช้การตั้งค่าเชื่อมต่อฐานข้อมูล

// รับข้อมูล JSON จาก Frontend
$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['email']) && !empty($data['password'])) {
    $email = $data['email'];
    $password = $data['password'];

    // ค้นหาผู้ใช้จาก Email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // ตรวจสอบรหัสผ่านที่เข้ารหัสไว้
    if ($user && password_verify($password, $user['password'])) {
        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "user" => $user['username']
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Please fill in all fields"]);
}

// เพิ่มการเช็ค !empty($data['password'])
if (!empty($data['username']) && !empty($data['email']) && !empty($data['password'])) {
    $pass = password_hash($data['password'], PASSWORD_DEFAULT);
    // ... logic การ INSERT ข้อมูล ...
} else {
    echo json_encode(["status" => "error", "message" => "กรุณากรอกข้อมูลให้ครบถ้วน"]);
}

?>