<?php
// backend/controllers/ExpenseController.php
// Controller handling personal finances (expenses, income, budgets) and sticky notes.

require_once __DIR__ . '/../config/db.php';

class ExpenseController {
    /**
     * Fetch user budget limit and computed stats for the current month.
     */
    public static function getBudget($userId) {
        $db = Database::getConnection();

        // 1. Get or create budget limit
        $stmt = $db->prepare("SELECT monthly_limit FROM personal_budgets WHERE user_id = ?");
        $stmt->execute([$userId]);
        $budget = $stmt->fetch();
        
        $limit = 5000.00;
        if (!$budget) {
            // Insert default budget limit
            $stmt = $db->prepare("INSERT INTO personal_budgets (user_id, monthly_limit) VALUES (?, ?)");
            $stmt->execute([$userId, $limit]);
        } else {
            $limit = floatval($budget['monthly_limit']);
        }

        // 2. Compute total spent this month (current month and year)
        $currentMonth = date('Y-m');
        $stmt = $db->prepare("
            SELECT SUM(amount) as spent 
            FROM personal_expenses 
            WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(date, '%Y-%m') = ?
        ");
        $stmt->execute([$userId, $currentMonth]);
        $spentData = $stmt->fetch();
        $spent = floatval($spentData['spent'] ?? 0);

        // 3. Compute total income this month
        $stmt = $db->prepare("
            SELECT SUM(amount) as income 
            FROM personal_expenses 
            WHERE user_id = ? AND type = 'income' AND DATE_FORMAT(date, '%Y-%m') = ?
        ");
        $stmt->execute([$userId, $currentMonth]);
        $incomeData = $stmt->fetch();
        $income = floatval($incomeData['income'] ?? 0);

        echo json_encode([
            "monthlyLimit" => $limit,
            "spentThisMonth" => $spent,
            "incomeThisMonth" => $income
        ]);
    }

    /**
     * Update budget limit.
     */
    public static function updateBudgetLimit($userId, $newLimit) {
        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO personal_budgets (user_id, monthly_limit) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE monthly_limit = ?
        ");
        $stmt->execute([$userId, $newLimit, $newLimit]);

        echo json_encode(["success" => true, "message" => "Monthly budget limit updated."]);
    }

    /**
     * Fetch user's transaction logs.
     */
    public static function getExpenses($userId) {
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id, title, amount, type, category, date, notes FROM personal_expenses WHERE user_id = ? ORDER BY date DESC, id DESC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        $formatted = [];
        foreach ($rows as $row) {
            $formatted[] = [
                "id" => intval($row['id']),
                "userId" => intval($userId),
                "title" => $row['title'],
                "amount" => floatval($row['amount']),
                "type" => $row['type'],
                "category" => $row['category'],
                "expenseDate" => $row['date'],
                "notes" => $row['notes']
            ];
        }

        echo json_encode($formatted);
    }

    /**
     * Record a new personal transaction.
     */
    public static function addExpense($userId, $title, $amount, $type, $category, $expenseDate, $notes) {
        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO personal_expenses (user_id, title, amount, type, category, date, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $title,
            $amount,
            $type,
            $category,
            $expenseDate,
            $notes
        ]);

        $itemId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "id" => intval($itemId),
            "message" => "Transaction recorded successfully."
        ]);
    }

    // ----------------------------------------------------------------------------
    // Sticky Notes API Actions
    // ----------------------------------------------------------------------------

    /**
     * Fetch user sticky notes.
     */
    public static function getNotes($userId) {
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id, title, content, text_align, font_size, created_at FROM personal_notes WHERE user_id = ? ORDER BY id DESC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        $formatted = [];
        foreach ($rows as $row) {
            $formatted[] = [
                "id" => intval($row['id']),
                "userId" => intval($userId),
                "title" => $row['title'],
                "content" => $row['content'],
                "textAlign" => $row['text_align'],
                "fontSize" => intval($row['font_size'] ?? 14),
                "createdAt" => substr($row['created_at'], 0, 10)
            ];
        }

        echo json_encode($formatted);
    }

    /**
     * Create sticky note.
     */
    public static function addNote($userId, $title, $content, $textAlign, $fontSize) {
        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO personal_notes (user_id, title, content, text_align, font_size) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $title,
            $content,
            $textAlign,
            $fontSize
        ]);

        $itemId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "id" => intval($itemId),
            "message" => "Sticky note created successfully."
        ]);
    }

    /**
     * Update sticky note.
     */
    public static function updateNote($userId, $noteId, $title, $content, $textAlign, $fontSize) {
        $db = Database::getConnection();

        // Verify owner
        $stmt = $db->prepare("SELECT id FROM personal_notes WHERE id = ? AND user_id = ?");
        $stmt->execute([$noteId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Note not found or you are not the owner."]);
            exit();
        }

        $stmt = $db->prepare("
            UPDATE personal_notes 
            SET title = ?, content = ?, text_align = ?, font_size = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            $title,
            $content,
            $textAlign,
            $fontSize,
            $noteId
        ]);

        echo json_encode(["success" => true, "message" => "Sticky note updated successfully."]);
    }

    /**
     * Delete sticky note.
     */
    public static function deleteNote($userId, $noteId) {
        $db = Database::getConnection();

        // Verify owner
        $stmt = $db->prepare("SELECT id FROM personal_notes WHERE id = ? AND user_id = ?");
        $stmt->execute([$noteId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Note not found or you are not the owner."]);
            exit();
        }

        $stmt = $db->prepare("DELETE FROM personal_notes WHERE id = ?");
        $stmt->execute([$noteId]);

        echo json_encode(["success" => true, "message" => "Sticky note deleted successfully."]);
    }
}
