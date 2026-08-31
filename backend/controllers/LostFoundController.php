<?php
// backend/controllers/LostFoundController.php
// Controller handling Campus Lost & Found notice board API listings with location details and institute filtering.

require_once __DIR__ . '/../config/db.php';

class LostFoundController {
    /**
     * Fetch all lost & found items with optional institute filtering.
     */
    public static function getItems($userInstituteId, $filter = 'my') {
        $db = Database::getConnection();

        $useFilter = ($filter === 'my' && $userInstituteId !== null);

        $query = "
            SELECT 
                l.id,
                l.title,
                l.description,
                l.type,
                l.last_seen_location,
                l.contact_phone,
                l.images,
                l.status,
                l.created_at,
                u.name as reporter_name,
                COALESCE(i.name, 'Other') as institute_name,
                COALESCE(i.code, 'OTH') as institute_code
            FROM lost_found_items l
            JOIN users u ON l.reporter_id = u.id
            LEFT JOIN institutes i ON l.institute_id = i.id
            WHERE " . ($useFilter ? "l.institute_id = ? AND " : "") . " 1=1
            ORDER BY l.status DESC, l.created_at DESC
        ";

        $stmt = $db->prepare($query);
        if ($useFilter) {
            $stmt->execute([$userInstituteId]);
        } else {
            $stmt->execute();
        }
        
        $items = $stmt->fetchAll();

        $formatted = [];
        foreach ($items as $item) {
            $formatted[] = [
                "id" => intval($item['id']),
                "title" => $item['title'],
                "description" => $item['description'],
                "type" => $item['type'],
                "category" => "others",
                "location" => $item['last_seen_location'],
                "contactNumber" => $item['contact_phone'],
                "images" => json_decode($item['images'] ?? '[]'),
                "status" => $item['status'] === 'active' ? 'unresolved' : 'resolved',
                "reportedDate" => substr($item['created_at'], 0, 10),
                "reporterName" => $item['reporter_name'],
                "instituteName" => $item['institute_name'],
                "instituteCode" => $item['institute_code']
            ];
        }

        echo json_encode($formatted);
    }

    /**
     * Post a new notice.
     */
    public static function reportItem($reporterId, $title, $description, $type, $lastSeenLocation, $contactPhone, $instituteId) {
        $db = Database::getConnection();

        $query = "
            INSERT INTO lost_found_items (institute_id, reporter_id, title, description, type, last_seen_location, contact_phone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([
            $instituteId,
            $reporterId,
            $title,
            $description,
            $type,
            $lastSeenLocation,
            $contactPhone
        ]);

        $itemId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "id" => intval($itemId),
            "message" => "Notice posted successfully."
        ]);
    }

    /**
     * Toggle the status of a notice (resolve/unresolve).
     */
    public static function toggleStatus($itemId, $userId, $instituteId) {
        $db = Database::getConnection();

        // Verify reporter ownership
        $stmt = $db->prepare("SELECT reporter_id, status FROM lost_found_items WHERE id = ?");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch();

        if (!$item) {
            http_response_code(404);
            echo json_encode(["error" => "Notice listing not found."]);
            exit();
        }

        if (intval($item['reporter_id']) !== intval($userId)) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. You are not the owner of this notice."]);
            exit();
        }

        // Toggles status
        $nextStatus = $item['status'] === 'active' ? 'resolved' : 'active';

        $stmt = $db->prepare("UPDATE lost_found_items SET status = ? WHERE id = ?");
        $stmt->execute([$nextStatus, $itemId]);

        echo json_encode([
            "success" => true, 
            "status" => $nextStatus === 'active' ? 'unresolved' : 'resolved',
            "message" => "Notice status toggled."
        ]);
    }
}
