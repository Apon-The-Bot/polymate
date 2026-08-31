<?php
// backend/controllers/RoomController.php
// Controller handling Mess & Room Finder API listings with dynamic location context and institute filtering.

require_once __DIR__ . '/../config/db.php';

class RoomController {
    /**
     * Fetch all available rooms/seats with optional type, maxRent, and institute filters.
     */
    public static function getRooms($userInstituteId, $filter = 'my', $type = null, $maxRent = null) {
        $db = Database::getConnection();

        $useFilter = ($filter === 'my' && $userInstituteId !== null);

        $sql = "
            SELECT 
                r.id,
                r.title,
                r.description,
                r.rent_amount,
                r.location,
                r.type,
                r.seat_count,
                r.contact_phone,
                r.images,
                r.status,
                r.created_at,
                u.name as host_name,
                COALESCE(i.name, 'Other') as institute_name,
                COALESCE(i.code, 'OTH') as institute_code
            FROM mess_rooms r
            JOIN users u ON r.host_user_id = u.id
            LEFT JOIN institutes i ON r.institute_id = i.id
            WHERE r.status = 'available'
        ";

        $params = [];

        if ($useFilter) {
            $sql .= " AND r.institute_id = ? ";
            $params[] = $userInstituteId;
        }

        if ($type !== null && !empty($type)) {
            $sql .= " AND r.type = ? ";
            $params[] = $type;
        }

        if ($maxRent !== null && is_numeric($maxRent)) {
            $sql .= " AND r.rent_amount <= ? ";
            $params[] = floatval($maxRent);
        }

        $sql .= " ORDER BY r.created_at DESC ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        $formatted = [];
        foreach ($items as $item) {
            $formatted[] = [
                "id" => intval($item['id']),
                "instituteId" => intval($item['institute_id'] ?? 0),
                "hostName" => $item['host_name'],
                "title" => $item['title'],
                "description" => $item['description'],
                "rentAmount" => floatval($item['rent_amount']),
                "location" => $item['location'],
                "type" => $item['type'],
                "seatCount" => intval($item['seat_count']),
                "contactPhone" => $item['contact_phone'],
                "images" => json_decode($item['images'] ?? '[]'),
                "status" => $item['status'],
                "createdAt" => substr($item['created_at'], 0, 10),
                "instituteName" => $item['institute_name'],
                "instituteCode" => $item['institute_code']
            ];
        }

        echo json_encode($formatted);
    }
}
