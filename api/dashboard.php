<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization');

require_once '../config/database.php';
require_once '../includes/functions.php';

$database = new Database();
$db = $database->getConnection();

$user = getUserFromToken();
if (!$user) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

// Get statistics
$stats = [];

if ($user['role'] === 'admin') {
    // Admin sees all complaints
    $totalQuery = "SELECT COUNT(*) as total FROM complaints";
    $openQuery = "SELECT COUNT(*) as open FROM complaints WHERE status = 'open'";
    $resolvedQuery = "SELECT COUNT(*) as resolved FROM complaints WHERE status IN ('resolved', 'closed')";
    $recentQuery = "SELECT c.*, cat.name as category_name, u.full_name as user_name 
                   FROM complaints c 
                   JOIN categories cat ON c.category_id = cat.id 
                   JOIN users u ON c.user_id = u.id 
                   ORDER BY c.created_at DESC LIMIT 5";
} else {
    // Users see only their complaints
    $totalQuery = "SELECT COUNT(*) as total FROM complaints WHERE user_id = ?";
    $openQuery = "SELECT COUNT(*) as open FROM complaints WHERE status = 'open' AND user_id = ?";
    $resolvedQuery = "SELECT COUNT(*) as resolved FROM complaints WHERE status IN ('resolved', 'closed') AND user_id = ?";
    $recentQuery = "SELECT c.*, cat.name as category_name, u.full_name as user_name 
                   FROM complaints c 
                   JOIN categories cat ON c.category_id = cat.id 
                   JOIN users u ON c.user_id = u.id 
                   WHERE c.user_id = ?
                   ORDER BY c.created_at DESC LIMIT 5";
}

// Execute queries
$stmt = $db->prepare($totalQuery);
if ($user['role'] !== 'admin') {
    $stmt->execute([$user['id']]);
} else {
    $stmt->execute();
}
$stats['total_complaints'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

$stmt = $db->prepare($openQuery);
if ($user['role'] !== 'admin') {
    $stmt->execute([$user['id']]);
} else {
    $stmt->execute();
}
$stats['open_complaints'] = $stmt->fetch(PDO::FETCH_ASSOC)['open'];

$stmt = $db->prepare($resolvedQuery);
if ($user['role'] !== 'admin') {
    $stmt->execute([$user['id']]);
} else {
    $stmt->execute();
}
$stats['resolved_complaints'] = $stmt->fetch(PDO::FETCH_ASSOC)['resolved'];

// Average resolution time (simplified)
$stats['avg_resolution_time'] = rand(1, 7); // Placeholder

// Recent complaints
$stmt = $db->prepare($recentQuery);
if ($user['role'] !== 'admin') {
    $stmt->execute([$user['id']]);
} else {
    $stmt->execute();
}
$stats['recent_complaints'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(['stats' => $stats]);
?>