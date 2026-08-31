<?php
// backend/index.php
// Main API Router and Entry point for PolyMate REST API.

require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/controllers/MessController.php';
require_once __DIR__ . '/controllers/MarketplaceController.php';
require_once __DIR__ . '/controllers/ExpenseController.php';
require_once __DIR__ . '/controllers/LostFoundController.php';

// Authenticate JWT on all API requests and extract user payload
// This automatically manages CORS preflight headers as well
$user = authenticate();

// Extract request context
$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Parse path info
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Read JSON input payload for write requests
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Flexible Router Matching
$messIndex = array_search('mess', $pathParts);
$marketplaceIndex = array_search('marketplace', $pathParts);
$personalIndex = array_search('personal', $pathParts);
$lostFoundIndex = array_search('lost-found', $pathParts);

// ----------------------------------------------------------------------------
// 1. MESS ROUTER
// ----------------------------------------------------------------------------
if ($messIndex !== false) {
    if (!isset($pathParts[$messIndex + 1])) {
        http_response_code(400);
        echo json_encode(["error" => "Mess ID parameter is required."]);
        exit();
    }
    
    $messId = intval($pathParts[$messIndex + 1]);
    $action = $pathParts[$messIndex + 2] ?? null;
    
    switch ($action) {
        case 'summary':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(["error" => "Method not allowed. Use GET."]);
                break;
            }
            MessController::getSummary($messId, $user['institute_id']);
            break;
    
        case 'meals':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["error" => "Method not allowed. Use POST."]);
                break;
            }
            if (!isset($input['userId']) || !isset($input['mealDate']) || !isset($input['mealCount'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing required parameters: userId, mealDate, mealCount."]);
                break;
            }
            MessController::recordMeal(
                $messId, 
                intval($input['userId']), 
                $input['mealDate'], 
                floatval($input['mealCount']), 
                $user['institute_id']
            );
            break;
    
        case 'expenses':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["error" => "Method not allowed. Use POST."]);
                break;
            }
            if (!isset($input['title']) || !isset($input['amount']) || !isset($input['category']) || !isset($input['expenseDate'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing parameters: title, amount, category, expenseDate."]);
                break;
            }
            MessController::addExpense(
                $messId, 
                $user['id'], 
                $input['title'], 
                floatval($input['amount']), 
                $input['category'], 
                $input['expenseDate'], 
                $user['institute_id']
            );
            break;
    
        case 'deposits':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["error" => "Method not allowed. Use POST."]);
                break;
            }
            if (!isset($input['userId']) || !isset($input['amount']) || !isset($input['depositDate'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing parameters: userId, amount, depositDate."]);
                break;
            }
            MessController::addDeposit(
                $messId, 
                intval($input['userId']), 
                floatval($input['amount']), 
                $input['depositDate'], 
                $user['institute_id']
            );
            break;
    
        default:
            http_response_code(404);
            echo json_encode(["error" => "Action not found."]);
            break;
    }
    exit();
}

// ----------------------------------------------------------------------------
// 2. MARKETPLACE ROUTER
// ----------------------------------------------------------------------------
if ($marketplaceIndex !== false) {
    $action = $pathParts[$marketplaceIndex + 1] ?? null;
    
    if ($action === 'listings') {
        $itemId = $pathParts[$marketplaceIndex + 2] ?? null;
        
        if ($method === 'GET') {
            MarketplaceController::getListings($user['institute_id']);
        } elseif ($method === 'POST') {
            if (!isset($input['title']) || !isset($input['description']) || !isset($input['price']) || !isset($input['condition']) || !isset($input['category'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing listing parameters."]);
                exit();
            }
            MarketplaceController::createListing(
                $user['id'],
                $input['title'],
                $input['description'],
                floatval($input['price']),
                $input['condition'],
                $input['category'],
                $user['institute_id']
            );
        } elseif ($method === 'DELETE' && $itemId !== null) {
            MarketplaceController::deleteListing(intval($itemId), $user['id'], $user['institute_id']);
        } else {
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed."]);
        }
        exit();
    }
}

// ----------------------------------------------------------------------------
// 3. PERSONAL FINANCES & NOTES ROUTER
// ----------------------------------------------------------------------------
if ($personalIndex !== false) {
    $action = $pathParts[$personalIndex + 1] ?? null;
    
    if ($action === 'budget') {
        if ($method === 'GET') {
            ExpenseController::getBudget($user['id']);
        } elseif ($method === 'PATCH') {
            if (!isset($input['limit'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing parameter: limit."]);
                exit();
            }
            ExpenseController::updateBudgetLimit($user['id'], floatval($input['limit']));
        } else {
            http_response_code(405);
        }
        exit();
    }
    
    if ($action === 'expenses') {
        if ($method === 'GET') {
            ExpenseController::getExpenses($user['id']);
        } elseif ($method === 'POST') {
            if (!isset($input['title']) || !isset($input['amount']) || !isset($input['type']) || !isset($input['category']) || !isset($input['expenseDate'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing transaction parameters."]);
                exit();
            }
            ExpenseController::addExpense(
                $user['id'],
                $input['title'],
                floatval($input['amount']),
                $input['type'],
                $input['category'],
                $input['expenseDate'],
                $input['notes'] ?? null
            );
        } else {
            http_response_code(405);
        }
        exit();
    }
    
    if ($action === 'notes') {
        $noteId = $pathParts[$personalIndex + 2] ?? null;
        
        if ($method === 'GET') {
            ExpenseController::getNotes($user['id']);
        } elseif ($method === 'POST') {
            if (!isset($input['title']) || !isset($input['content'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing note parameters: title, content."]);
                exit();
            }
            ExpenseController::addNote(
                $user['id'],
                $input['title'],
                $input['content'],
                $input['textAlign'] ?? 'left',
                intval($input['fontSize'] ?? 14)
            );
        } elseif ($method === 'PUT' && $noteId !== null) {
            ExpenseController::updateNote(
                $user['id'],
                intval($noteId),
                $input['title'],
                $input['content'],
                $input['textAlign'] ?? 'left',
                intval($input['fontSize'] ?? 14)
            );
        } elseif ($method === 'DELETE' && $noteId !== null) {
            ExpenseController::deleteNote($user['id'], intval($noteId));
        } else {
            http_response_code(405);
        }
        exit();
    }
}

// ----------------------------------------------------------------------------
// 4. CAMPUS LOST & FOUND ROUTER
// ----------------------------------------------------------------------------
if ($lostFoundIndex !== false) {
    $itemId = $pathParts[$lostFoundIndex + 1] ?? null;
    
    if ($method === 'GET') {
        LostFoundController::getItems($user['institute_id']);
    } elseif ($method === 'POST') {
        if (!isset($input['title']) || !isset($input['description']) || !isset($input['type']) || !isset($input['location']) || !isset($input['contactNumber'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing notice parameters."]);
            exit();
        }
        LostFoundController::reportItem(
            $user['id'],
            $input['title'],
            $input['description'],
            $input['type'],
            $input['location'],
            $input['contactNumber'],
            $user['institute_id']
        );
    } elseif ($method === 'PATCH' && $itemId !== null) {
        LostFoundController::toggleStatus(intval($itemId), $user['id'], $user['institute_id']);
    } else {
        http_response_code(405);
    }
    exit();
}

// Default 404
http_response_code(404);
echo json_encode(["error" => "Endpoint not found."]);
