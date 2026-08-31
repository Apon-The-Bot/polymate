<?php
// backend/controllers/MarketplaceController.php
// Controller handling Student Marketplace API logistics with dynamic location tags and institute filtering.

require_once __DIR__ . '/../config/db.php';

class MarketplaceController {
    /**
     * Fetch all active marketplace listings with optional institute filtering.
     */
    public static function getListings($userInstituteId, $filter = 'my') {
        $db = Database::getConnection();

        $useFilter = ($filter === 'my' && $userInstituteId !== null);

        $query = "
            SELECT 
                m.id,
                m.title,
                m.description,
                m.price,
                m.condition,
                m.category,
                m.images,
                m.status,
                m.created_at,
                m.pickup_location,
                u.name as seller_name,
                u.phone as seller_phone,
                COALESCE(i.name, 'Other') as institute_name,
                COALESCE(i.code, 'OTH') as institute_code
            FROM marketplace_items m
            JOIN users u ON m.seller_id = u.id
            LEFT JOIN institutes i ON m.institute_id = i.id
            WHERE " . ($useFilter ? "m.institute_id = ? AND " : "") . " m.status = 'available'
            ORDER BY m.created_at DESC
        ";

        $stmt = $db->prepare($query);
        if ($useFilter) {
            $stmt->execute([$userInstituteId]);
        } else {
            $stmt->execute();
        }
        
        $items = $stmt->fetchAll();

        // Convert types appropriately
        $formatted = [];
        foreach ($items as $item) {
            $formatted[] = [
                "id" => intval($item['id']),
                "title" => $item['title'],
                "description" => $item['description'],
                "price" => floatval($item['price']),
                "condition" => $item['condition'],
                "category" => $item['category'],
                "images" => json_decode($item['images'] ?? '[]'),
                "status" => $item['status'],
                "createdAt" => $item['created_at'],
                "pickupLocation" => $item['pickup_location'],
                "sellerName" => $item['seller_name'],
                "sellerPhone" => $item['seller_phone'],
                "instituteName" => $item['institute_name'],
                "instituteCode" => $item['institute_code']
            ];
        }

        echo json_encode($formatted);
    }

    /**
     * Create a new product listing.
     */
    public static function createListing($sellerId, $title, $description, $price, $condition, $category, $instituteId, $pickupLocation = null) {
        $db = Database::getConnection();

        $query = "
            INSERT INTO marketplace_items (institute_id, seller_id, title, description, price, `condition`, category, pickup_location, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([
            $instituteId,
            $sellerId,
            $title,
            $description,
            $price,
            $condition,
            $category,
            $pickupLocation
        ]);

        $itemId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "id" => intval($itemId),
            "message" => "Marketplace listing created successfully."
        ]);
    }

    /**
     * Delete a product listing (verifies owner).
     */
    public static function deleteListing($itemId, $sellerId, $instituteId) {
        $db = Database::getConnection();

        // Verify ownership
        $stmt = $db->prepare("SELECT id FROM marketplace_items WHERE id = ? AND seller_id = ?");
        $stmt->execute([$itemId, $sellerId]);
        $item = $stmt->fetch();

        if (!$item) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Listing not found or you are not the owner."]);
            exit();
        }

        $stmt = $db->prepare("DELETE FROM marketplace_items WHERE id = ?");
        $stmt->execute([$itemId]);

        echo json_encode(["success" => true, "message" => "Marketplace listing deleted successfully."]);
    }
}
