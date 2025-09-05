<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../includes/functions.php';

$database = new Database();
$db = $database->getConnection();

$user = getUserFromToken();
if (!$user || $user['role'] !== 'admin') {
    sendResponse(['error' => 'Unauthorized'], 401);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'technicians':
        $query = "SELECT id, full_name, department, email FROM users WHERE role = 'technician'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $technicians = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(['technicians' => $technicians]);
        break;
        
    case 'assign':
        $data = json_decode(file_get_contents('php://input'), true);
        
        $query = "UPDATE complaints SET technician_id = ?, status = 'in_progress' WHERE id = ?";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute([$data['technician_id'], $data['complaint_id']])) {
            // Add to history
            $historyQuery = "INSERT INTO complaint_history (complaint_id, changed_by, old_status, new_status, comments) 
                            VALUES (?, ?, 'open', 'in_progress', 'Assigned to technician')";
            $historyStmt = $db->prepare($historyQuery);
            $historyStmt->execute([$data['complaint_id'], $user['id']]);
            
            sendResponse(['success' => true]);
        } else {
            sendResponse(['success' => false, 'error' => 'Failed to assign technician'], 500);
        }
        break;
        
    default:
        sendResponse(['error' => 'Invalid action'], 400);
}
?>