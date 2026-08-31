# PolyMate: Technical Architecture & Feature Guide (Presentation Blueprint)

This document provides a highly detailed, A-Z technical breakdown of the **PolyMate** application. It covers core system architecture, data models, logic flow, math equations, and includes a slide-by-slide blueprint designed to help you build a professional presentation.

---

## 1. Core System Architecture & Multi-Tenancy

PolyMate is engineered as a secure, light-weight, **Multi-Tenant mobile platform** dedicated to polytechnic students. It is designed to run efficiently on standard hosting environments while maintaining complete data isolation between different institutes.

### A. Tenant Isolation Model
*   **The Tenant Key:** Every user record is bound to an `institute_id` (representing polytechnics like Dhaka Polytechnic Institute, Barishal Polytechnic Institute, etc.).
*   **Data Scoping:** Queries (such as searching for a mess, looking up roommates, browsing notes, or campus listings) are strictly constrained by the active user's `institute_id`. 
*   **Benefits:** A student from Barishal Polytechnic will never see messes, study materials, or buy-and-sell listings from Dhaka Polytechnic, maintaining local campus relevance.

### B. Backend Architecture
*   **REST API Engine:** Built using PHP. It uses a custom **flexible path-part router** in `index.php` that intercepts URL requests, parses path segments, and delegates to controller classes.
*   **CORS & Preflight Handling:** Features a robust middleware handler that automatically processes preflight `OPTIONS` requests and sets necessary headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`).
*   **Stateless Authentication:** All secured routes invoke an `authenticate()` function. It decodes and verifies a JWT (JSON Web Token) sent in the request's `Authorization: Bearer <Token>` header. If invalid or missing, it halts execution and returns a `401 Unauthorized` response.

### C. Frontend State & Cache Architecture
*   **Zustand (Global Client State):** Manages local session states (`token`, active `user` profiles, and login views). Session details are persisted natively using `expo-secure-store` (on iOS/Android) and fallback to `localStorage` (on Web).
*   **React Query (Data Sync & Cache):** Handles API server communications. It caches data endpoints, manages loading/error states, and automatically refetches queries (like bazaar approvals or check-handle availability) in the background to ensure real-time consistency.

---

## 2. Exhaustive Feature-by-Feature Logic Breakdown

### 📁 1. Authentication & Session Module (`auth`)
*   **Registration Logic:** Validates unique inputs at the institute level. A unique composite key constraint `(institute_id, roll_no, registration_no)` prevents duplicate student accounts in the same polytechnic. Passwords are encrypted using the industry-standard **bcrypt** algorithm.
*   **Login Logic:** Verifies the user credentials and generates a signed JWT payload containing the user's ID, role, and institute context.
*   **Token Refresh & Auto-Login:** Upon app launch, the Zustand store attempts to load a saved JWT from the secure storage hardware. If present, it checks validity and logs the user in automatically without requiring credential re-entry.

### 🏢 2. Mess Manager Module (`mess-manager`)
This is the core module of the application. It acts as a collaborative, multi-member ledger for student shared housing (messes).

*   **Tenant-Isolated Search & Join:** Users search messes by name or username (handle) within their institute. Joining is request-based; a user inputs the mess's 6-character alphanumeric `join_code` or handle, creating a membership row with a `status = 'pending'` flag.
*   **Single-Manager Constraints:** Only **one active manager** can exist for a mess. Handled via atomic SQL transactions:
    1. Update the current manager's role in the database to `member`.
    2. Update the new manager's role to `manager`.
*   **Bazaar Planner:** The manager schedules duty dates mapped to users in the `mess_bazaar_schedule` table. Multiple members can be assigned to the same date.
*   **Bazaar Expense Tracker & Approval Flow:**
    *   Assigned members submit costs (title, amount, receipt details).
    *   If submitted by a member, it is inserted with `status = 'pending'` and queued in the manager's approvals portal.
    *   If submitted by the manager, it is auto-approved (`status = 'approved'`).
    *   If a member edits their submitted cost later, its status automatically reverts to `pending` to prevent fraud.
*   **Meals Spreadsheet & Manager Logs:**
    *   A grid lists daily meal counts for all members.
    *   To maintain strict transparency, any modification made by the manager to a meal count writes a row to `mess_meal_logs` (storing `changed_by_id`, `old_count`, `new_count`, and `timestamp`). This prevents disputes about "who changed my meals."
*   **Mess Financial Calculations:**
    The system dynamically computes the following indicators on every request:
    
    1.  **Meal Rate (\(R\)):**
        \[R = \frac{\sum \text{Approved Expenses}}{\sum \text{Total Meals of All Members}}\]
        
    2.  **Allocated Cost (\(C_u\)) for User \(u\):**
        \[C_u = \text{Total Meals of User } u \times R\]
        
    3.  **Net Standing / Balance (\(B_u\)) for User \(u\):**
        \[B_u = \text{Deposits of User } u - C_u\]
        
        *   If \(B_u \ge 0\), the member is in **surplus (Receive)**.
        *   If \(B_u < 0\), the member is in **deficit (Pay)**.

### 🏠 3. Room & Mess Finder Module (`room-finder`)
*   **Search Filters:** Allows students to browse roommate requests or mess rooms for rent. Filters include rent budget, accommodation types, and location.
*   **Verified Listings:** Only registered student accounts can post room ads. Listings contain contact buttons (phone/SMS) to immediately connect peers.

### 📚 4. Study Hub & Document Center Module (`study-hub`)
*   **Academic Segmentation:** Document listings are categorized dynamically based on the student's academic path: `department` (e.g., Computer, Civil, Mechanical) and `semester` (1st to 8th).
*   **Notes Sharing:** Students upload lecture notes, board exam questions, and study suggestions, which are organized and filtered instantly.

### 🛒 5. Student Marketplace Module (`marketplace`)
*   **P2P Buy & Sell:** A classified section for buying/selling used academic goods (textbooks, drawing instruments, calculators, electronics).
*   **Search & Condition Filters:** Listings are categorized by price, item condition (e.g. New, Like New, Used), and date posted.

### 💳 6. Personal Expense Tracker Module (`expense-tracker`)
This module acts as an isolated personal ledger, allowing students to track their non-mess daily transactions.
*   **Calculations & Budget Thresholds:**
    The system compares the user's total spending against their custom monthly limit to return a visual threat level:
    
    1.  **Monthly Spent Calculation (\(S_m\)):**
        \[S_m = \sum \text{Expenses where Month(date) } = \text{ Current Month}\]
        
    2.  **Budget Threshold Levels:**
        *   **Normal Level (Teal):** If \(S_m < 0.80 \times \text{Budget Limit}\).
        *   **Warning Level (Orange):** If \(0.80 \times \text{Budget Limit} \le S_m < 1.00 \times \text{Budget Limit}\).
        *   **Critical Level (Red):** If \(S_m \ge 1.00 \times \text{Budget Limit}\).
*   **Categories:** Supported expense classification includes: `Commute`, `Food`, `Tuition`, `Mess Rent`, `Books & Stationery`, and `Others`.
*   **Data Isolation:** All personal expense inputs are linked to the specific `user_id`, meaning they are hidden from other mess members and managers.

### 🔍 7. Campus Lost & Found Module (`lost-found`)
A campus bulletin notice board helping students recover lost property.
*   **Institute Level Scoping:** To prevent cluttered boards, posts are queried with a `WHERE institute_id = <User_Institute_ID>` filter, isolating posts so they only show items lost or found within the user's specific polytechnic.
*   **Post Status States:** Listings are flagged with an enum status of either `lost` (seeking item) or `found` (recovered item).
*   **Image Assets:** The backend accepts multipart form uploads, saving images into public storage paths, and serving relative URLs back to the mobile application's UI cards.

---

## 3. Database Schema Overview

```sql
-- 1. Institutes Table (Tenants)
CREATE TABLE `institutes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL UNIQUE,
    `code` VARCHAR(10) NOT NULL,
    `district` VARCHAR(50) NOT NULL
);

-- 2. Users Table (Multi-tenant isolated by institute_id)
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(15) NOT NULL,
    `roll_no` INT UNSIGNED NOT NULL,
    `registration_no` INT UNSIGNED NOT NULL,
    `department` VARCHAR(50) NOT NULL,
    `session` VARCHAR(15) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'admin', 'moderator') DEFAULT 'student',
    `current_address` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('pending', 'active', 'suspended') DEFAULT 'active',
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_roll_reg` (`institute_id`, `roll_no`, `registration_no`)
);

-- 3. Messes Table
CREATE TABLE `messes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `handle` VARCHAR(50) NULL UNIQUE,
    `join_code` VARCHAR(10) NOT NULL UNIQUE,
    `created_by_id` BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- 4. Personal Expenses Table
CREATE TABLE `personal_expenses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `category` ENUM('Commute', 'Food', 'Tuition', 'Mess Rent', 'Books & Stationery', 'Others') NOT NULL,
    `date` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- 5. Personal Budgets Table
CREATE TABLE `personal_budgets` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `monthly_limit` DECIMAL(10, 2) NOT NULL,
    `month_year` VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `user_month` (`user_id`, `month_year`)
);

-- 6. Lost & Found Items Table
CREATE TABLE `lost_found_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `reporter_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('lost', 'found') NOT NULL,
    `location` VARCHAR(150) NOT NULL,
    `contact_phone` VARCHAR(15) NOT NULL,
    `image_url` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

---

## 4. Presentation Slide Blueprint (Slide-by-Slide Outline)

Here is a 10-slide outline you can use to structure your presentation deck.

### Slide 1: Title Slide
*   **Title:** PolyMate: Smart Polytechnic Student Assistant
*   **Subtitle:** A Multi-Tenant Collaboration & Ledger Platform for Student Communities

### Slide 2: The Problem Statement
*   **Points:**
    *   Polytechnic students face severe fragmentation when managing shared resources (shared mess meals, room hunting, academic notes, campus items).
    *   Traditional mess calculations are paper-based, leading to human errors, disputes, and transparency issues.
    *   No dedicated local campus marketplace or study repository exists for polytechnic institutions.

### Slide 3: Introducing PolyMate (The Solution)
*   **Points:**
    *   A mobile companion that integrates all campus needs into a single dashboard.
    *   **Core Pillars:** Mess Ledger, Room Finder, Study Hub, Peer-to-Peer Marketplace, Campus Lost & Found, and Personal Expense Tracker.
    *   High-performance, secure, and fully optimized for mobile devices.

### Slide 4: Multi-Tenant Architecture
*   **Points:**
    *   **Tenant Key:** Isolated by Polytechnic (`institute_id`).
    *   **Secure Access:** Lightweight JWT (JSON Web Tokens) verification.
    *   **High Performance:** Optimized REST API backend written in PHP, communicating with a MySQL database.
    *   **Reliable Client State:** Managed by Zustand state stores and React Query caches.

### Slide 5: Deep Dive: Mess Manager (Core Module)
*   **Points:**
    *   **Role Separation:** Manager vs Member dashboard layouts.
    *   **Duty Scheduling:** Assigns shoppers to specific bazaar dates.
    *   **Expense Approvals:** Members submit costs, which go through a pending approval queue controlled by the manager.
    *   **Real-time Username Verification:** Checks handle uniqueness (e.g. `@engineers.mess`) in real-time.

### Slide 6: Mess Calculations & Transparency
*   **Points:**
    *   **Dispute Prevention:** Changes to meal counts are logged in `mess_meal_logs` showing exactly who changed what.
    *   **Dynamically Computed Indicators:**
        *   **Meal Rate:** Total Approved Cost ÷ Total Meals.
        *   **Allocated Cost:** Individual Meals × Meal Rate.
        *   **Net Standing:** Deposited Amount − Allocated Cost.
    *   Surplus members show positive balance, deficit members show negative balance.

### Slide 7: Academic Hubs (Study Hub & Room Finder)
*   **Points:**
    *   **Study Hub:** Automatically groups resources by student's department and semester. Shared lecture notes and exam recommendations are updated in real-time.
    *   **Room Finder:** Clean ads list available hostel rooms and mess seats, verification gated by student credentials.

### Slide 8: Student Utility (Marketplace, Lost & Found, Expense Tracker)
*   **Points:**
    *   **Classifieds Marketplace:** Buy/sell textbooks and drawing tools directly between students.
    *   **Lost & Found:** Scoped at the institute level to report lost keys, ID cards, and books.
    *   **Personal Budgeting:** Set threshold limits on daily spending with dynamic warn thresholds (80% for Warning, 100% for Exceeded).

### Slide 9: Technical Implementation & Security
*   **Points:**
    *   **TypeScript Type-Safety:** Verified using strict build checks.
    *   **Secure Storage:** Storing authentication tokens using native keychain access (`expo-secure-store`).
    *   **Database Constraints:** Composite unique keys prevent duplicate registration or handle collision.

### Slide 10: Conclusion & Q&A
*   **Points:**
    *   PolyMate builds a centralized, secure digital home for polytechnic student communities.
    *   Open for questions and feedback.
