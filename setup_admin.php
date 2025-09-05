<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

// Create admin user
$admin_hash = password_hash('admin123', PASSWORD_DEFAULT);
$tech_hash = password_hash('tech123', PASSWORD_DEFAULT);

// Delete existing admin if exists
$db->prepare("DELETE FROM users WHERE email = 'admin@university.edu'")->execute();
$db->prepare("DELETE FROM users WHERE email = 'tech@university.edu'")->execute();

// Insert admin
$stmt = $db->prepare("INSERT INTO users (full_name, username, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute(['System Administrator', 'admin', 'admin@university.edu', $admin_hash, 'admin', 'IT Department']);

// Insert technician
$stmt->execute(['John Technician', 'tech1', 'tech@university.edu', $tech_hash, 'technician', 'Maintenance']);

echo "Admin and technician users created successfully!\n";
echo "Admin: admin@university.edu / admin123\n";
echo "Tech: tech@university.edu / tech123\n";
?>