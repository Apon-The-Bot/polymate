-- ============================================================================
-- DB Schema for "My Polytechnic" (PolyMate)
-- Target Database: MySQL (Shared Hosting / phpMyAdmin compatible)
-- Description: Multi-tenant isolated database schema for polytechnic institutes.
-- All queries MUST filter by `institute_id` which is indexed for scalability.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `mypolytechnic` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mypolytechnic`;

-- 1. Institutes Table
CREATE TABLE `institutes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE, -- E.g., 'DPI' for Dhaka Polytechnic Institute
    `district` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `roll_no` INT UNSIGNED NOT NULL,
    `registration_no` INT UNSIGNED NOT NULL,
    `department` VARCHAR(50) NOT NULL, -- E.g., 'Computer', 'Civil', 'Electrical'
    `session` VARCHAR(15) NOT NULL,     -- E.g., '2020-21'
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'admin', 'moderator') DEFAULT 'student',
    `status` ENUM('pending', 'active', 'suspended') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY `unique_email` (`email`),
    UNIQUE KEY `unique_roll_reg` (`institute_id`, `roll_no`, `registration_no`),
    CONSTRAINT `fk_users_institute` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for multi-tenant isolation
CREATE INDEX `idx_users_institute` ON `users` (`institute_id`);

-- 3. Mess & Room Finder Table
CREATE TABLE `mess_rooms` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `host_user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `rent_amount` DECIMAL(10, 2) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `type` ENUM('mess_seat', 'single_room', 'sublet', 'apartment') NOT NULL,
    `seat_count` INT DEFAULT 1,
    `contact_phone` VARCHAR(15) NOT NULL,
    `images` JSON DEFAULT NULL, -- Stores array of image URLs
    `status` ENUM('available', 'occupied', 'archived') DEFAULT 'available',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_mess_rooms_institute` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mess_rooms_host` FOREIGN KEY (`host_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXES for tenant filtering and filtering/sorting by price or type
CREATE INDEX `idx_mess_rooms_institute_status` ON `mess_rooms` (`institute_id`, `status`);
CREATE INDEX `idx_mess_rooms_rent` ON `mess_rooms` (`rent_amount`);

-- 4. Study Hub Table (Lecture Notes & Question Papers)
CREATE TABLE `study_hub_docs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `uploader_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `category` ENUM('note', 'lecture_pdf', 'board_question', 'syllabus') NOT NULL,
    `semester` ENUM('1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th') NOT NULL,
    `department` VARCHAR(50) NOT NULL,
    `subject_code` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_study_hub_institute` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_study_hub_uploader` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXES for quick multi-tenant filtering by category, department, and semester
CREATE INDEX `idx_study_hub_institute_filter` ON `study_hub_docs` (`institute_id`, `department`, `semester`, `category`);

-- 5. Student Marketplace Table
CREATE TABLE `marketplace_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `seller_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `condition` ENUM('new', 'like_new', 'good', 'fair') NOT NULL,
    `category` ENUM('books', 'drawing_instruments', 'electronics', 'other') NOT NULL,
    `images` JSON DEFAULT NULL,
    `status` ENUM('available', 'sold', 'archived') DEFAULT 'available',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_marketplace_institute` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_marketplace_seller` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEXES for tenant filtering and sorting
CREATE INDEX `idx_marketplace_institute_status` ON `marketplace_items` (`institute_id`, `status`);
CREATE INDEX `idx_marketplace_price` ON `marketplace_items` (`price`);

-- 6. Personal Expense Tracker Table (No direct institute filter since it is 100% private to a user)
CREATE TABLE `personal_expenses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `category` VARCHAR(50) NOT NULL, -- E.g., 'Food', 'Rent', 'Books', 'Transport'
    `date` DATE NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `fk_personal_expenses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for user history lookup
CREATE INDEX `idx_personal_expenses_user_date` ON `personal_expenses` (`user_id`, `date`);

-- 7. Messes Table (Mess Manager Feature Group)
CREATE TABLE `messes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `join_code` VARCHAR(10) NOT NULL UNIQUE, -- Generated unique alphanumeric code to join
    `created_by_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_messes_institute` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messes_creator` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for tenant filtering
CREATE INDEX `idx_messes_institute` ON `messes` (`institute_id`);

-- 8. Mess Members Table
CREATE TABLE `mess_members` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mess_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role` ENUM('manager', 'member') DEFAULT 'member',
    `status` ENUM('pending', 'active', 'declined') DEFAULT 'pending',
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY `unique_mess_user` (`mess_id`, `user_id`),
    CONSTRAINT `fk_mess_members_mess` FOREIGN KEY (`mess_id`) REFERENCES `messes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mess_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for user-mess checking
CREATE INDEX `idx_mess_members_user` ON `mess_members` (`user_id`);

-- 9. Mess Meals Table
CREATE TABLE `mess_meals` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mess_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `meal_date` DATE NOT NULL,
    `meal_count` DECIMAL(4, 2) NOT NULL DEFAULT 0.00, -- Can be fractional, e.g., 0.5, 1.5, 2.0
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `unique_member_meal_date` (`mess_id`, `user_id`, `meal_date`),
    CONSTRAINT `fk_mess_meals_mess` FOREIGN KEY (`mess_id`) REFERENCES `messes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mess_meals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for querying monthly meals
CREATE INDEX `idx_mess_meals_date` ON `mess_meals` (`mess_id`, `meal_date`);

-- 10. Mess Expenses Table
CREATE TABLE `mess_expenses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mess_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL, -- Who paid the expense
    `title` VARCHAR(150) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `expense_date` DATE NOT NULL,
    `category` ENUM('bazaar', 'utilities', 'rent', 'other') DEFAULT 'bazaar',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `fk_mess_expenses_mess` FOREIGN KEY (`mess_id`) REFERENCES `messes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mess_expenses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for monthly expense sums
CREATE INDEX `idx_mess_expenses_date` ON `mess_expenses` (`mess_id`, `expense_date`);

-- 11. Mess Deposits Table
CREATE TABLE `mess_deposits` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `mess_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL, -- Who deposited the money
    `amount` DECIMAL(10, 2) NOT NULL,
    `deposit_date` DATE NOT NULL,
    `notes` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `fk_mess_deposits_mess` FOREIGN KEY (`mess_id`) REFERENCES `messes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mess_deposits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for monthly deposits
CREATE INDEX `idx_mess_deposits_date` ON `mess_deposits` (`mess_id`, `deposit_date`);

-- 12. Lost & Found Table
CREATE TABLE `lost_found_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `institute_id` INT UNSIGNED NOT NULL,
    `reporter_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('lost', 'found') NOT NULL,
    `last_seen_location` VARCHAR(255) NOT NULL,
    `contact_phone` VARCHAR(15) NOT NULL,
    `images` JSON DEFAULT NULL,
    `status` ENUM('active', 'resolved', 'archived') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_lost_found_institute` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_lost_found_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INDEX for tenant filtering
CREATE INDEX `idx_lost_found_institute_status` ON `lost_found_items` (`institute_id`, `status`);
