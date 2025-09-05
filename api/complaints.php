<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../includes/functions.php';

$database = new Database();
$db = $database->getConnection();

$user = getUserFromToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$complaint_id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($complaint_id) {
            // Get single complaint with history
            $query = "SELECT c.*, cat.name as category_name, u.full_name as user_name, u.email as user_email,
                             t.full_name as technician_name
                      FROM complaints c 
                      JOIN categories cat ON c.category_id = cat.id 
                      JOIN users u ON c.user_id = u.id 
                      LEFT JOIN users t ON c.technician_id = t.id 
                      WHERE c.id = ?";
            
            if ($user['role'] !== 'admin') {
                $query .= " AND c.user_id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$complaint_id, $user['id']]);
            } else {
                $stmt = $db->prepare($query);
                $stmt->execute([$complaint_id]);
            }
            
            $complaint = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($complaint) {
                // Get history
                $historyQuery = "SELECT ch.*, u.full_name as changed_by_name 
                                FROM complaint_history ch 
                                JOIN users u ON ch.changed_by = u.id 
                                WHERE ch.complaint_id = ? 
                                ORDER BY ch.changed_at DESC";
                $historyStmt = $db->prepare($historyQuery);
                $historyStmt->execute([$complaint_id]);
                $complaint['history'] = $historyStmt->fetchAll(PDO::FETCH_ASSOC);
                
                sendResponse(['complaint' => $complaint]);
            } else {
                sendResponse(['error' => 'Complaint not found'], 404);
            }
        } else {
            // Get complaints list
            $status = $_GET['status'] ?? '';
            $category = $_GET['category'] ?? '';
            
            $query = "SELECT c.*, cat.name as category_name, u.full_name as user_name 
                      FROM complaints c 
                      JOIN categories cat ON c.category_id = cat.id 
                      JOIN users u ON c.user_id = u.id";
            $params = [];
            $conditions = [];
            
            if ($user['role'] === 'student') {
                $conditions[] = "c.user_id = ?";
                $params[] = $user['id'];
            } elseif ($user['role'] === 'technician') {
                $conditions[] = "c.technician_id = ?";
                $params[] = $user['id'];
            }
            
            if ($status) {
                $conditions[] = "c.status = ?";
                $params[] = $status;
            }
            
            if ($category) {
                $conditions[] = "c.category_id = ?";
                $params[] = $category;
            }
            
            if ($conditions) {
                $query .= " WHERE " . implode(" AND ", $conditions);
            }
            
            $query .= " ORDER BY c.created_at DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse(['complaints' => $complaints]);
        }
        break;
        
    case 'POST':
        // Create new complaint
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "INSERT INTO complaints (user_id, category_id, title, description, priority, location) 
                  VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute([
            $user['id'],
            $data['category_id'],
            $data['title'],
            $data['description'],
            $data['priority'],
            $data['location'] ?? null
        ])) {
            $complaint_id = $db->lastInsertId();
            
            // Add to history
            $historyQuery = "INSERT INTO complaint_history (complaint_id, changed_by, new_status, comments) 
                            VALUES (?, ?, 'open', 'Complaint submitted')";
            $historyStmt = $db->prepare($historyQuery);
            $historyStmt->execute([$complaint_id, $user['id']]);
            
            sendResponse(['success' => true, 'complaint_id' => $complaint_id]);
        } else {
            sendResponse(['success' => false, 'error' => 'Failed to create complaint'], 500);
        }
        break;
        
    case 'PUT':
        // Update complaint status
        if (!$complaint_id) {
            sendResponse(['error' => 'Complaint ID required'], 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Get current complaint
        $query = "SELECT * FROM complaints WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$complaint_id]);
        $complaint = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$complaint) {
            sendResponse(['error' => 'Complaint not found'], 404);
        }
        
        // Update status
        $updateQuery = "UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $updateStmt = $db->prepare($updateQuery);
        
        if ($updateStmt->execute([$data['status'], $complaint_id])) {
            // Add to history
            $historyQuery = "INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, comments) 
                            VALUES (?, ?, ?, ?, ?)";
            $historyStmt = $db->prepare($historyQuery);
            $historyStmt->execute([
                $complaint_id,
                $user['id'],
                $complaint['status'],
                $data['status'],
                $data['comments'] ?? ''
            ]);
            
            sendResponse(['success' => true]);
        } else {
            sendResponse(['success' => false, 'error' => 'Failed to update complaint'], 500);
        }
        break;
        
    default:
        sendResponse(['error' => 'Method not allowed'], 405);
}
?>