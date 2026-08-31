<?php
// backend/controllers/MessController.php
// Controller handling Mess Manager API logics with strict multi-tenant isolation checks.

require_once __DIR__ . '/../config/db.php';

class MessController {
    /**
     * Search messes by name or handle within same institute.
     */
    public static function searchMess($query, $instituteId) {
        $db = Database::getConnection();
        $query = trim($query);
        
        if (empty($query)) {
            echo json_encode(["success" => true, "messes" => []]);
            exit();
        }

        // Handle search by handle or name
        if (strpos($query, '@') === 0) {
            $stmt = $db->prepare("
                SELECT m.id, m.name, m.handle, m.join_code,
                       (SELECT COUNT(*) FROM mess_members WHERE mess_id = m.id AND status = 'active') as member_count
                FROM messes m
                WHERE m.handle LIKE ? AND m.institute_id = ?
            ");
            $stmt->execute([$query . '%', $instituteId]);
        } else {
            $stmt = $db->prepare("
                SELECT m.id, m.name, m.handle, m.join_code,
                       (SELECT COUNT(*) FROM mess_members WHERE mess_id = m.id AND status = 'active') as member_count
                FROM messes m
                WHERE (m.name LIKE ? OR m.handle LIKE ?) AND m.institute_id = ?
            ");
            $likeQuery = '%' . $query . '%';
            $stmt->execute([$likeQuery, $likeQuery, $instituteId]);
        }

        $messes = $stmt->fetchAll();
        echo json_encode(["success" => true, "messes" => $messes]);
    }

    /**
     * Create a new mess.
     */
    public static function createMess($creatorId, $name, $handle, $instituteId) {
        $db = Database::getConnection();
        $name = trim($name);
        $handle = trim($handle);

        if (empty($name) || empty($handle)) {
            http_response_code(400);
            echo json_encode(["error" => "Name and handle cannot be empty."]);
            exit();
        }

        // Format handle: must start with @
        if (strpos($handle, '@') !== 0) {
            $handle = '@' . $handle;
        }
        $handle = strtolower(str_replace(' ', '_', $handle));

        // Check handle uniqueness
        $stmt = $db->prepare("SELECT id FROM messes WHERE handle = ?");
        $stmt->execute([$handle]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["error" => "Mess handle is already taken."]);
            exit();
        }

        // Generate random 6-character uppercase alphanumeric join code
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $joinCode = '';
        for ($i = 0; $i < 6; $i++) {
            $joinCode .= $characters[rand(0, strlen($characters) - 1)];
        }

        try {
            $db->beginTransaction();

            // Insert mess
            $stmt = $db->prepare("INSERT INTO messes (institute_id, name, handle, join_code, created_by_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$instituteId, $name, $handle, $joinCode, $creatorId]);
            $messId = $db->lastInsertId();

            // Auto-join creator as active manager
            $stmt = $db->prepare("INSERT INTO mess_members (mess_id, user_id, role, status) VALUES (?, ?, 'manager', 'active')");
            $stmt->execute([$messId, $creatorId]);

            $db->commit();

            echo json_encode([
                "success" => true,
                "message" => "Mess created successfully.",
                "mess" => [
                    "id" => intval($messId),
                    "name" => $name,
                    "handle" => $handle,
                    "joinCode" => $joinCode
                ]
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Failed to create mess: " . $e->getMessage()]);
        }
    }

    /**
     * Join an existing mess.
     */
    public static function joinMess($userId, $codeOrHandle) {
        $db = Database::getConnection();
        $codeOrHandle = trim($codeOrHandle);

        if (empty($codeOrHandle)) {
            http_response_code(400);
            echo json_encode(["error" => "Join code or handle is required."]);
            exit();
        }

        // Find mess
        $stmt = $db->prepare("SELECT id, institute_id FROM messes WHERE join_code = ? OR handle = ?");
        $stmt->execute([$codeOrHandle, $codeOrHandle]);
        $mess = $stmt->fetch();

        if (!$mess) {
            http_response_code(404);
            echo json_encode(["error" => "Mess not found with provided code or handle."]);
            exit();
        }

        // Check if user belongs to same institute (tenant isolation)
        $stmt = $db->prepare("SELECT institute_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if ($user['institute_id'] != $mess['institute_id']) {
            http_response_code(403);
            echo json_encode(["error" => "You can only join messes in your own polytechnic."]);
            exit();
        }

        // Check existing member status
        $stmt = $db->prepare("SELECT id, status FROM mess_members WHERE mess_id = ? AND user_id = ?");
        $stmt->execute([$mess['id'], $userId]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ($existing['status'] === 'active') {
                http_response_code(400);
                echo json_encode(["error" => "You are already a member of this mess."]);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "Your join request is already pending or declined."]);
            }
            exit();
        }

        // Insert pending join request
        $stmt = $db->prepare("INSERT INTO mess_members (mess_id, user_id, role, status) VALUES (?, ?, 'member', 'pending')");
        $stmt->execute([$mess['id'], $userId]);

        echo json_encode(["success" => true, "message" => "Join request submitted successfully. Waiting for manager approval."]);
    }

    /**
     * Get summary details for dashboard.
     */
    public static function getSummary($messId, $instituteId, $requestUserId) {
        $db = Database::getConnection();

        // 1. Verify access
        $stmt = $db->prepare("
            SELECT m.id, m.name, m.handle, m.join_code, mm.role, mm.status
            FROM messes m
            JOIN mess_members mm ON m.id = mm.mess_id
            WHERE m.id = ? AND m.institute_id = ? AND mm.user_id = ?
        ");
        $stmt->execute([$messId, $instituteId, $requestUserId]);
        $membership = $stmt->fetch();

        if (!$membership || $membership['status'] !== 'active') {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. You are not an active member of this mess."]);
            exit();
        }

        // 2. Fetch total meals (active approved members only)
        $stmt = $db->prepare("SELECT SUM(meal_count) as total_meals FROM mess_meals WHERE mess_id = ?");
        $stmt->execute([$messId]);
        $mealsData = $stmt->fetch();
        $totalMeals = floatval($mealsData['total_meals'] ?? 0);

        // 3. Fetch total expenses (APPROVED only)
        $stmt = $db->prepare("SELECT SUM(amount) as total_expenses FROM mess_expenses WHERE mess_id = ? AND status = 'approved'");
        $stmt->execute([$messId]);
        $expensesData = $stmt->fetch();
        $totalExpenses = floatval($expensesData['total_expenses'] ?? 0);

        // 4. Calculate meal rate
        $mealRate = $totalMeals > 0 ? ($totalExpenses / $totalMeals) : 0;

        // 5. Fetch total deposits
        $stmt = $db->prepare("SELECT SUM(amount) as total_deposits FROM mess_deposits WHERE mess_id = ?");
        $stmt->execute([$messId]);
        $depositsData = $stmt->fetch();
        $totalDeposits = floatval($depositsData['total_deposits'] ?? 0);

        // 6. Fetch members listing
        $query = "
            SELECT 
                u.id as user_id, 
                u.name,
                mm.role,
                COALESCE((SELECT SUM(meal_count) FROM mess_meals WHERE mess_id = mm.mess_id AND user_id = u.id), 0) as total_meals,
                COALESCE((SELECT SUM(amount) FROM mess_deposits WHERE mess_id = mm.mess_id AND user_id = u.id), 0) as total_deposits
            FROM mess_members mm
            JOIN users u ON mm.user_id = u.id
            WHERE mm.mess_id = ? AND mm.status = 'active'
        ";
        $stmt = $db->prepare($query);
        $stmt->execute([$messId]);
        $members = $stmt->fetchAll();

        // 7. Compute standings
        $membersSummary = [];
        foreach ($members as $m) {
            $userMeals = floatval($m['total_meals']);
            $userDeposits = floatval($m['total_deposits']);
            $allocatedExpense = $userMeals * $mealRate;
            $balance = $userDeposits - $allocatedExpense;

            $membersSummary[] = [
                "userId" => intval($m['user_id']),
                "name" => $m['name'],
                "role" => $m['role'],
                "totalMeals" => $userMeals,
                "totalDeposits" => $userDeposits,
                "allocatedExpense" => round($allocatedExpense, 2),
                "balance" => round($balance, 2)
            ];
        }

        // 8. Fetch pending members list (only visible to manager)
        $pendingMembers = [];
        if ($membership['role'] === 'manager') {
            $stmt = $db->prepare("
                SELECT u.id as user_id, u.name, u.email, u.phone 
                FROM mess_members mm
                JOIN users u ON mm.user_id = u.id
                WHERE mm.mess_id = ? AND mm.status = 'pending'
            ");
            $stmt->execute([$messId]);
            $pendingMembers = $stmt->fetchAll();
        }

        echo json_encode([
            "messId" => intval($messId),
            "messName" => $membership['name'],
            "handle" => $membership['handle'],
            "joinCode" => $membership['join_code'],
            "userRole" => $membership['role'],
            "totalMeals" => $totalMeals,
            "totalExpenses" => $totalExpenses,
            "mealRate" => round($mealRate, 2),
            "totalDeposits" => $totalDeposits,
            "membersSummary" => $membersSummary,
            "pendingMembers" => $pendingMembers
        ]);
    }

    /**
     * Submit bazaar expense.
     * Manager inputs are auto-approved. Member inputs are pending, requiring assignment verification.
     */
    public static function addBazaarExpense($messId, $userId, $title, $amount, $category, $expenseDate, $instituteId) {
        $db = Database::getConnection();

        // Check if user is active member
        $stmt = $db->prepare("SELECT role, status FROM mess_members WHERE mess_id = ? AND user_id = ?");
        $stmt->execute([$messId, $userId]);
        $membership = $stmt->fetch();

        if (!$membership || $membership['status'] !== 'active') {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. You are not a member of this mess."]);
            exit();
        }

        $role = $membership['role'];
        $status = 'pending';

        if ($role === 'manager') {
            // Managers are auto-approved
            $status = 'approved';
        } else {
            // Normal members must be scheduled/assigned for bazaar on that date
            $stmt = $db->prepare("SELECT id FROM mess_bazaar_schedule WHERE mess_id = ? AND user_id = ? AND bazaar_date = ?");
            $stmt->execute([$messId, $userId, $expenseDate]);
            if (!$stmt->fetch()) {
                http_response_code(403);
                echo json_encode(["error" => "You are not assigned to do the bazaar on " . $expenseDate . "."]);
                exit();
            }
        }

        $stmt = $db->prepare("
            INSERT INTO mess_expenses (mess_id, user_id, title, amount, expense_date, category, status, approved_by_id, approved_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $approvedBy = ($status === 'approved') ? $userId : null;
        $approvedAt = ($status === 'approved') ? date('Y-m-d H:i:s') : null;
        
        $stmt->execute([$messId, $userId, $title, $amount, $expenseDate, $category, $status, $approvedBy, $approvedAt]);

        echo json_encode([
            "success" => true,
            "message" => $status === 'approved' ? "Expense added successfully." : "Bazaar expense submitted for manager approval."
        ]);
    }

    /**
     * Edit a bazaar expense.
     * Moves expense back to 'pending' for manager re-approval if previously approved.
     */
    public static function updateBazaarExpense($messId, $userId, $expenseId, $title, $amount, $category, $expenseDate, $instituteId) {
        $db = Database::getConnection();

        // Fetch existing expense
        $stmt = $db->prepare("SELECT id, user_id FROM mess_expenses WHERE id = ? AND mess_id = ?");
        $stmt->execute([$expenseId, $messId]);
        $expense = $stmt->fetch();

        if (!$expense) {
            http_response_code(404);
            echo json_encode(["error" => "Expense not found."]);
            exit();
        }

        // Verify editor is the submitter or the manager
        $isSubmitter = ($expense['user_id'] == $userId);
        
        $stmt = $db->prepare("SELECT role FROM mess_members WHERE mess_id = ? AND user_id = ? AND status = 'active'");
        $stmt->execute([$messId, $userId]);
        $membership = $stmt->fetch();
        $isManager = ($membership && $membership['role'] === 'manager');

        if (!$isSubmitter && !is_null($expense['user_id']) && !$isManager) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. You cannot edit this expense."]);
            exit();
        }

        // If updated by submitter (who is not manager), it resets to pending approval
        $status = ($isManager) ? 'approved' : 'pending';
        $approvedBy = ($isManager) ? $userId : null;
        $approvedAt = ($isManager) ? date('Y-m-d H:i:s') : null;

        $stmt = $db->prepare("
            UPDATE mess_expenses 
            SET title = ?, amount = ?, category = ?, expense_date = ?, status = ?, approved_by_id = ?, approved_at = ?
            WHERE id = ?
        ");
        $stmt->execute([$title, $amount, $category, $expenseDate, $status, $approvedBy, $approvedAt, $expenseId]);

        echo json_encode([
            "success" => true,
            "message" => $isManager ? "Expense updated successfully." : "Expense updated and submitted for manager re-approval."
        ]);
    }

    /**
     * Fetch pending expenses list.
     */
    public static function getPendingExpenses($messId, $userId, $instituteId) {
        $db = Database::getConnection();

        // Check if user is manager
        $stmt = $db->prepare("SELECT role FROM mess_members WHERE mess_id = ? AND user_id = ? AND status = 'active'");
        $stmt->execute([$messId, $userId]);
        $membership = $stmt->fetch();

        if (!$membership || $membership['role'] !== 'manager') {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Only the manager can view pending approvals."]);
            exit();
        }

        $stmt = $db->prepare("
            SELECT e.id, e.user_id, u.name as member_name, e.title, e.amount, e.expense_date, e.category
            FROM mess_expenses e
            JOIN users u ON e.user_id = u.id
            WHERE e.mess_id = ? AND e.status = 'pending'
            ORDER BY e.expense_date DESC
        ");
        $stmt->execute([$messId]);
        $pending = $stmt->fetchAll();

        echo json_encode(["success" => true, "pendingExpenses" => $pending]);
    }

    /**
     * Approve or reject a pending bazaar expense.
     */
    public static function approveBazaarExpense($messId, $managerId, $expenseId, $status, $instituteId) {
        $db = Database::getConnection();

        // Check if user is manager
        $stmt = $db->prepare("SELECT role FROM mess_members WHERE mess_id = ? AND user_id = ? AND status = 'active'");
        $stmt->execute([$messId, $managerId]);
        $membership = $stmt->fetch();

        if (!$membership || $membership['role'] !== 'manager') {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Only the manager can approve expenses."]);
            exit();
        }

        if (!in_array($status, ['approved', 'rejected'])) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid status values. Use 'approved' or 'rejected'."]);
            exit();
        }

        $stmt = $db->prepare("
            UPDATE mess_expenses 
            SET status = ?, approved_by_id = ?, approved_at = ? 
            WHERE id = ? AND mess_id = ?
        ");
        
        $approvedBy = ($status === 'approved') ? $managerId : null;
        $approvedAt = ($status === 'approved') ? date('Y-m-d H:i:s') : null;
        
        $stmt->execute([$status, $approvedBy, $approvedAt, $expenseId, $messId]);

        echo json_encode(["success" => true, "message" => "Expense status updated to " . $status . "."]);
    }

    /**
     * Get Bazaar Schedule.
     */
    public static function getBazaarSchedule($messId, $month, $instituteId) {
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT s.id, s.user_id, u.name as member_name, s.bazaar_date, s.notes
            FROM mess_bazaar_schedule s
            JOIN users u ON s.user_id = u.id
            WHERE s.mess_id = ? AND s.bazaar_date LIKE ?
            ORDER BY s.bazaar_date ASC
        ");
        $stmt->execute([$messId, $month . '-%']);
        $schedule = $stmt->fetchAll();

        echo json_encode(["success" => true, "schedule" => $schedule]);
    }

    /**
     * Assign bazaar duties.
     */
    public static function assignBazaarDuties($messId, $managerId, $assignments, $instituteId) {
        $db = Database::getConnection();

        // Check if user is manager
        $stmt = $db->prepare("SELECT role FROM mess_members WHERE mess_id = ? AND user_id = ? AND status = 'active'");
        $stmt->execute([$messId, $managerId]);
        $membership = $stmt->fetch();

        if (!$membership || $membership['role'] !== 'manager') {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Only the manager can assign duties."]);
            exit();
        }

        try {
            $db->beginTransaction();

            foreach ($assignments as $asn) {
                $userId = intval($asn['userId']);
                $date = $asn['bazaarDate'];
                $notes = $asn['notes'] ?? null;

                // Delete any existing assignments for this user on this day
                $stmt = $db->prepare("DELETE FROM mess_bazaar_schedule WHERE mess_id = ? AND bazaar_date = ?");
                $stmt->execute([$messId, $date]);

                if ($userId > 0) {
                    $stmt = $db->prepare("INSERT INTO mess_bazaar_schedule (mess_id, user_id, bazaar_date, notes) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$messId, $userId, $date, $notes]);
                }
            }

            $db->commit();
            echo json_encode(["success" => true, "message" => "Bazaar duties updated successfully."]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Failed to save bazaar schedule: " . $e->getMessage()]);
        }
    }

    /**
     * Record daily meals (batch input supported).
     * Compares old meal counts and logs any edits in mess_meal_logs.
     */
    public static function recordMeals($messId, $managerId, $meals, $instituteId) {
        $db = Database::getConnection();

        // Check manager status
        $stmt = $db->prepare("SELECT role FROM mess_members WHERE mess_id = ? AND user_id = ? AND status = 'active'");
        $stmt->execute([$messId, $managerId]);
        $membership = $stmt->fetch();

        if (!$membership || $membership['role'] !== 'manager') {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Only the manager can record meals."]);
            exit();
        }

        try {
            $db->beginTransaction();

            foreach ($meals as $m) {
                $userId = intval($m['userId']);
                $date = $m['mealDate'];
                $count = floatval($m['mealCount']);

                // Fetch existing meal
                $stmt = $db->prepare("SELECT id, meal_count FROM mess_meals WHERE mess_id = ? AND user_id = ? AND meal_date = ?");
                $stmt->execute([$messId, $userId, $date]);
                $existing = $stmt->fetch();

                if ($existing) {
                    $old = floatval($existing['meal_count']);
                    if ($old != $count) {
                        // Update and log
                        $stmt = $db->prepare("UPDATE mess_meals SET meal_count = ? WHERE id = ?");
                        $stmt->execute([$count, $existing['id']]);

                        $stmt = $db->prepare("INSERT INTO mess_meal_logs (meal_id, changed_by_id, old_count, new_count) VALUES (?, ?, ?, ?)");
                        $stmt->execute([$existing['id'], $managerId, $old, $count]);
                    }
                } else {
                    // Direct insert
                    $stmt = $db->prepare("INSERT INTO mess_meals (mess_id, user_id, meal_date, meal_count) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$messId, $userId, $date, $count]);
                }
            }

            $db->commit();
            echo json_encode(["success" => true, "message" => "Meals recorded successfully."]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Failed to record meals: " . $e->getMessage()]);
        }
    }

    /**
     * Get Complete tabular meal sheet grid.
     */
    public static function getMealsSheet($messId, $month, $instituteId) {
        $db = Database::getConnection();

        // Get members
        $stmt = $db->prepare("
            SELECT u.id as user_id, u.name 
            FROM mess_members mm
            JOIN users u ON mm.user_id = u.id
            WHERE mm.mess_id = ? AND mm.status = 'active'
        ");
        $stmt->execute([$messId]);
        $members = $stmt->fetchAll();

        // Get meals
        $stmt = $db->prepare("
            SELECT user_id, meal_date, meal_count 
            FROM mess_meals 
            WHERE mess_id = ? AND meal_date LIKE ?
        ");
        $stmt->execute([$messId, $month . '-%']);
        $meals = $stmt->fetchAll();

        // Get edit logs in this month
        $stmt = $db->prepare("
            SELECT l.old_count, l.new_count, l.logged_at, u.name as changer_name, m.user_id, m.meal_date
            FROM mess_meal_logs l
            JOIN mess_meals m ON l.meal_id = m.id
            JOIN users u ON l.changed_by_id = u.id
            WHERE m.mess_id = ? AND m.meal_date LIKE ?
            ORDER BY l.logged_at DESC
        ");
        $stmt->execute([$messId, $month . '-%']);
        $logs = $stmt->fetchAll();

        echo json_encode([
            "success" => true,
            "members" => $members,
            "meals" => $meals,
            "logs" => $logs
        ]);
    }

    /**
     * Transfer manager role to another member.
     */
    public static function transferManager($messId, $currentManagerId, $newManagerId, $instituteId) {
        $db = Database::getConnection();

        // 1. Verify requester is active manager
        $stmt = $db->prepare("SELECT role, status FROM mess_members WHERE mess_id = ? AND user_id = ?");
        $stmt->execute([$messId, $currentManagerId]);
        $membership = $stmt->fetch();

        if (!$membership || $membership['status'] !== 'active' || $membership['role'] !== 'manager') {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. Only the active manager can transfer duties."]);
            exit();
        }

        // 2. Verify new manager is active member in the mess
        $stmt = $db->prepare("SELECT status FROM mess_members WHERE mess_id = ? AND user_id = ?");
        $stmt->execute([$messId, $newManagerId]);
        $newMember = $stmt->fetch();

        if (!$newMember || $newMember['status'] !== 'active') {
            http_response_code(400);
            echo json_encode(["error" => "Selected user is not an active member of this mess."]);
            exit();
        }

        try {
            $db->beginTransaction();

            // Demote old manager to member
            $stmt = $db->prepare("UPDATE mess_members SET role = 'member' WHERE mess_id = ? AND user_id = ?");
            $stmt->execute([$messId, $currentManagerId]);

            // Promote new member to manager
            $stmt = $db->prepare("UPDATE mess_members SET role = 'manager' WHERE mess_id = ? AND user_id = ?");
            $stmt->execute([$messId, $newManagerId]);

            $db->commit();
            echo json_encode(["success" => true, "message" => "Management transferred successfully."]);
        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Failed to transfer role: " . $e->getMessage()]);
        }
    }

    /**
     * Log a member deposit.
     */
    public static function addDeposit($messId, $userId, $amount, $depositDate, $instituteId) {
        $db = Database::getConnection();

        // Verify member belongs to correct mess and institute
        $stmt = $db->prepare("
            SELECT mm.id 
            FROM mess_members mm
            JOIN users u ON mm.user_id = u.id
            WHERE mm.mess_id = ? AND mm.user_id = ? AND u.institute_id = ?
        ");
        $stmt->execute([$messId, $userId, $instituteId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(["error" => "Access denied. User is not a member of this mess."]);
            exit();
        }

        $stmt = $db->prepare("
            INSERT INTO mess_deposits (mess_id, user_id, amount, deposit_date) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$messId, $userId, $amount, $depositDate]);

        echo json_encode(["success" => true, "message" => "Deposit logged successfully."]);
    }
}
