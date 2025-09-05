<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../includes/functions.php';

$database = new Database();
$db = $database->getConnection();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "SELECT * FROM users WHERE email = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($data['password'], $user['password_hash'])) {
            unset($user['password_hash']);
            $token = generateJWT($user['id']);
            
            sendResponse([
                'success' => true,
                'token' => $token,
                'user' => $user
            ]);
        } else {
            sendResponse(['success' => false, 'error' => 'Invalid credentials'], 401);
        }
        break;
        
    case 'register':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if user already exists
        $query = "SELECT id FROM users WHERE email = ? OR username = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$data['email'], $data['username']]);
        
        if ($stmt->fetch()) {
            sendResponse(['success' => false, 'error' => 'User already exists'], 400);
        }
        
        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (full_name, username, email, password_hash, department, phone) 
                  VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute([
            $data['full_name'],
            $data['username'],
            $data['email'],
            $password_hash,
            $data['department'] ?? null,
            $data['phone'] ?? null
        ])) {
            $user_id = $db->lastInsertId();
            $user = [
                'id' => $user_id,
                'full_name' => $data['full_name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'role' => 'student',
                'department' => $data['department'] ?? null,
                'phone' => $data['phone'] ?? null
            ];
            
            $token = generateJWT($user_id);
            
            sendResponse([
                'success' => true,
                'token' => $token,
                'user' => $user
            ]);
        } else {
            sendResponse(['success' => false, 'error' => 'Registration failed'], 500);
        }
        break;
        
    case 'verify':
        $user = getUserFromToken();
        if ($user) {
            unset($user['password_hash']);
            sendResponse(['success' => true, 'user' => $user]);
        } else {
            sendResponse(['success' => false, 'error' => 'Invalid token'], 401);
        }
        break;
        
    default:
        sendResponse(['error' => 'Invalid action'], 400);
}
?>