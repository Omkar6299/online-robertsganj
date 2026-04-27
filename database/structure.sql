-- Sardar Vallabhbhai Online Admission System
-- Consolidated Database Structure Migration File
-- Generated on: 2026-04-07

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- Table structure for AcademicYears
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `academic_years`;
CREATE TABLE IF NOT EXISTS `academic_years` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session` VARCHAR(255) NOT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Inactive',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `academic_years` (`id`, `session`, `status`, `created_at`, `updated_at`) VALUES
(1, '2024-2025', 'Inactive', NOW(), NOW()),
(2, '2025-2026', 'Inactive', NOW(), NOW()),
(3, '2026-2027', 'Inactive', NOW(), NOW());

-- ---------------------------------------------------------
-- Table structure for Admins
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255),
  `role` VARCHAR(255) NOT NULL DEFAULT 'Admin',
  `remember_token` VARCHAR(255),
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Passwords:
-- Super Admin: admin123
-- College: college123
INSERT INTO `admins` (`id`, `name`, `email`, `password`, `phone`, `role`, `created_at`, `updated_at`) VALUES
(12, 'College Profile', 'college@gmail.com', '$2a$10$bTW85qsHdtjGAt31iUITYezaQTZN5WUYBQgnIbFzFd/K5V.Cb7C.i', '9999999990', 'College', '2025-09-25 12:04:59', '2026-03-24 09:34:44'),
(14, 'Super Admin', 'superadmin@gmail.com', '$2a$10$BXgYGPqhY.w.XFmP09PsjuQUPUiA1jCMsxKkVDRK5x8f/N0MA9D8u', '9999999999', 'Super Admin', '2025-09-26 08:13:14', '2026-03-24 09:34:44');

-- ---------------------------------------------------------
-- Table structure for Users
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` DATETIME DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) NOT NULL,
  `transaction_id` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(255) DEFAULT 'Student',
  `remember_token` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `academic_year` VARCHAR(255) DEFAULT NULL,
  INDEX (`phone`),
  INDEX (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Students
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `student_id` VARCHAR(255) DEFAULT NULL COMMENT 'Common unique identifier across years',
  `registration_no` VARCHAR(255),
  `course_type_id` BIGINT UNSIGNED NOT NULL,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `year` VARCHAR(255) NOT NULL,
  `academic_year` VARCHAR(255),
  `father_name` VARCHAR(255) NOT NULL,
  `mother_name` VARCHAR(255) NOT NULL,
  `gender` VARCHAR(255),
  `dob` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255),
  `sub_category` VARCHAR(255),
  `caste_certificate_number` VARCHAR(255),
  `religion` VARCHAR(255),
  `weightage` JSON,
  `whatsapp_number` VARCHAR(255),
  `aadhar_card_no` VARCHAR(255),
  `samarth_registration_no` VARCHAR(255),
  `photo` VARCHAR(255),
  `sign` VARCHAR(255),
  `personal_status` VARCHAR(255) DEFAULT '0',
  `weightage_status` VARCHAR(255) DEFAULT '0',
  `educational_status` VARCHAR(255) DEFAULT '0',
  `address_status` VARCHAR(255) DEFAULT '0',
  `additional_status` VARCHAR(255) DEFAULT '0',
  `subject_status` VARCHAR(255),
  `photographsign_status` VARCHAR(255) DEFAULT '0',
  `declaration_status` VARCHAR(255) DEFAULT '0',
  `admission_status` ENUM('Pending', 'Approved', 'Disapproved') DEFAULT 'Pending',
  `major1_id` BIGINT UNSIGNED,
  `major2_id` BIGINT UNSIGNED,
  `minor_id` BIGINT UNSIGNED,
  `skill_id` BIGINT UNSIGNED,
  `cocurricular_id` BIGINT UNSIGNED,
  `research_project_id` BIGINT UNSIGNED,
  `caste` VARCHAR(255),
  `cast_certificate_no` VARCHAR(255),
  `blood_group` VARCHAR(255),
  `computer_literate` VARCHAR(255) DEFAULT 'No',
  `extracurricular_activity` VARCHAR(255),
  `is_previous_student` VARCHAR(255) DEFAULT 'No',
  `is_18_plus` VARCHAR(255) DEFAULT 'No',
  `epic_no` VARCHAR(255),
  `disability_percentage` VARCHAR(255),
  `samarth_no` VARCHAR(255),
  `year_gap` VARCHAR(255) DEFAULT 'No',
  `year_gap_after_inter` VARCHAR(255),
  `gap_reason` TEXT,
  `adhar_no` VARCHAR(255),
  `local_guadian` VARCHAR(255),
  `local_guadian_address` TEXT,
  `guadian_contact` VARCHAR(255),
  `father_occupation` VARCHAR(255),
  `father_annual_income` VARCHAR(255),
  `mother_occupation` VARCHAR(255),
  `family_annual_income` VARCHAR(255),
  `income_certificate_no` VARCHAR(255),
  `mailing_address` TEXT,
  `mailing_state` VARCHAR(255),
  `mailing_district` VARCHAR(255),
  `mailing_tehsil` VARCHAR(255),
  `mailing_pincode` VARCHAR(255),
  `permanent_address` TEXT,
  `permanent_state` VARCHAR(255),
  `permanent_district` VARCHAR(255),
  `permanent_tehsil` VARCHAR(255),
  `permanent_pincode` VARCHAR(255),
  `bank_name` VARCHAR(255),
  `bank_account_no` VARCHAR(255),
  `ifsc_code` VARCHAR(255),
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  INDEX (`user_id`),
  INDEX (`registration_no`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Weightages
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `weightages`;
CREATE TABLE IF NOT EXISTS `weightages` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `weightage_mark` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for StudentWeightages
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `student_weightages`;
CREATE TABLE IF NOT EXISTS `student_weightages` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `registration_no` VARCHAR(255),
  `weightage_id` BIGINT UNSIGNED NOT NULL,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Courses
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE IF NOT EXISTS `courses` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_type_id` BIGINT UNSIGNED,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `status` VARCHAR(255) DEFAULT '1',
  `is_major1_required` VARCHAR(255) DEFAULT '1',
  `is_major2_required` VARCHAR(255) DEFAULT '0',
  `is_minor_required` VARCHAR(255) DEFAULT '0',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  INDEX (`course_type_id`),
  FOREIGN KEY (`course_type_id`) REFERENCES `course_types`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for CourseTypes
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `course_types`;
CREATE TABLE IF NOT EXISTS `course_types` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `status` VARCHAR(255) DEFAULT '1',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Semesters
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `semesters`;
CREATE TABLE IF NOT EXISTS `semesters` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `order` VARCHAR(255) NOT NULL,
  `status` INT DEFAULT 1,
  `registration_enabled` INT DEFAULT 0 COMMENT 'Enable registration flag',
  `fee_payment_enabled` INT DEFAULT 0 COMMENT 'Enable fee payment flag',
  `is_skill_required` INT DEFAULT 0,
  `is_cocurricular_required` INT DEFAULT 0,
  `is_major1_enabled` INT DEFAULT 1,
  `is_major2_enabled` INT DEFAULT 1,
  `is_minor_enabled` INT DEFAULT 1,
  `is_research_project_enabled` INT DEFAULT 0,
  `approval_required` TINYINT DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  UNIQUE INDEX (`course_id`, `slug`),
  UNIQUE INDEX (`course_id`, `order`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Subjects
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `subject_name` VARCHAR(255) NOT NULL,
  `is_practical` TINYINT(1) DEFAULT 0,
  `status` VARCHAR(255) DEFAULT '1',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  UNIQUE INDEX (`course_id`, `subject_name`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Educationals
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `educationals`;
CREATE TABLE IF NOT EXISTS `educationals` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `registration_no` VARCHAR(255),
  `class_name` VARCHAR(255) NOT NULL,
  `board_name` VARCHAR(255) NOT NULL,
  `school_name` VARCHAR(255),
  `year_of_passing` VARCHAR(255) NOT NULL,
  `division` VARCHAR(255),
  `roll_no` VARCHAR(255) NOT NULL,
  `percentage` VARCHAR(255),
  `total_marks` VARCHAR(255),
  `obtained_marks` VARCHAR(255),
  `mark_type` ENUM('Percentage', 'CGPA'),
  `cgpa` VARCHAR(255),
  `max_cgpa` VARCHAR(255) DEFAULT '10',
  `subject_details` VARCHAR(255),
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Qualifications
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `qualifications`;
CREATE TABLE IF NOT EXISTS `qualifications` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) DEFAULT '1',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for SemesterQualifications
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `semester_qualifications`;
CREATE TABLE IF NOT EXISTS `semester_qualifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `semester_id` BIGINT UNSIGNED,
  `qualification_id` BIGINT UNSIGNED,
  `required_optional_hidden` ENUM('required', 'optional', 'hidden') DEFAULT 'required',
  `max_year_gap` INT DEFAULT NULL,
  `is_skill_required` VARCHAR(255) DEFAULT '0',
  `is_cocurricular_required` VARCHAR(255) DEFAULT '0',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  UNIQUE INDEX (`semester_id`, `qualification_id`),
  INDEX (`semester_id`),
  INDEX (`qualification_id`),
  FOREIGN KEY (`semester_id`) REFERENCES `semesters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`qualification_id`) REFERENCES `qualifications`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for FeeMaintenance
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `fee_maintenance`;
CREATE TABLE IF NOT EXISTS `fee_maintenance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `Course` INT NOT NULL,
  `semester` INT NOT NULL,
  `User` VARCHAR(45),
  `Total_Fee_Amount` INT DEFAULT 0,
  `Fee_Name` VARCHAR(100),
  `General_fee_Amount` INT DEFAULT 0,
  `Girls_fee_Amount` INT DEFAULT 0,
  `Minority_Fee_Amount` VARCHAR(45),
  `OBC_fee_Amount` INT DEFAULT 0,
  `SC_fee_Amount` INT DEFAULT 0,
  `ST_fee_Amount` INT DEFAULT 0,
  `Practical_Fee` INT DEFAULT 0,
  `late_fee` INT DEFAULT 0,
  `is_late_fee_applicable` TINYINT(1) DEFAULT 0,
  `fee_Type` VARCHAR(45),
  `fee_Active` VARCHAR(45),
  `Student_Type` VARCHAR(45),
  `Ex_Student` VARCHAR(45),
  `Lab_Fee_Type` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for StudentAdmissionFeeDetails
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `student_admission_fee_details`;
CREATE TABLE IF NOT EXISTS `student_admission_fee_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `student_id` INT NOT NULL,
  `registration_no` VARCHAR(255) NOT NULL,
  `transaction_id` VARCHAR(255) COMMENT 'Initial registration transaction ID',
  `merchant_txn_id` VARCHAR(255) UNIQUE,
  `bank_transaction_id` VARCHAR(255),
  `atom_txn_id` VARCHAR(255),
  `amount` DECIMAL(10, 2) NOT NULL,
  `academic_year` VARCHAR(255) NOT NULL,
  `semester_id` VARCHAR(255),
  `semester_type` ENUM('Even', 'Odd'),
  `payment_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
  `response_data` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Payments
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `merchant_txn_id` VARCHAR(255) UNIQUE,
  `payment_payload` TEXT,
  `bank_transaction_id` VARCHAR(255),
  `atom_txn_id` VARCHAR(255),
  `txnInitDate` VARCHAR(255),
  `txnCompleteDate` VARCHAR(255),
  `transaction_date` VARCHAR(255),
  `amount` DECIMAL(10, 2),
  `payment_method` VARCHAR(255),
  `status` VARCHAR(255),
  `fee_type` VARCHAR(255) DEFAULT 'form_fee' COMMENT 'Type of fee: form_fee, admission_fee, etc.',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `academic_year` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for StudentFeesDetails
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `student_fees_details`;
CREATE TABLE IF NOT EXISTS `student_fees_details` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED,
  `course_id` VARCHAR(255) NOT NULL,
  `semester_id` VARCHAR(255) NOT NULL,
  `semester_type` ENUM('Even', 'Odd'),
  `challan_id` VARCHAR(255) NOT NULL,
  `academic_year` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2),
  `payment_mode` VARCHAR(255),
  `payment_method` VARCHAR(255),
  `status` VARCHAR(255) NOT NULL,
  `transaction_date` VARCHAR(255) NOT NULL,
  `txnInitDate` VARCHAR(255),
  `txnCompleteDate` VARCHAR(255),
  `payment_transaction_id` VARCHAR(255),
  `bank_transaction_id` VARCHAR(255),
  `merchant_txn_id` VARCHAR(255),
  `atom_txn_id` VARCHAR(255),
  `remark` VARCHAR(255),
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Roles
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `guard_name` VARCHAR(255) DEFAULT 'web',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `name`, `guard_name`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'web', NOW(), NOW()),
(2, 'College', 'web', NOW(), NOW()),
(4, 'Student', 'web', '2026-03-24 12:19:51', '2026-03-24 12:20:04');

-- ---------------------------------------------------------
-- Table structure for States
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `states`;
CREATE TABLE IF NOT EXISTS `states` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(255),
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `states` (`id`, `name`, `code`, `created_at`, `updated_at`) VALUES
(1, 'Andhra Pradesh', 'AP', '2026-02-05 08:10:52', '2026-02-05 08:10:52'),
(2, 'Arunachal Pradesh', 'AR', '2026-02-05 08:10:52', '2026-02-05 08:10:52'),
(3, 'Assam', 'AS', '2026-02-05 08:10:53', '2026-02-05 08:10:53'),
(4, 'Bihar', 'BR', '2026-02-05 08:10:53', '2026-02-05 08:10:53'),
(5, 'Chandigarh (UT)', 'CHA', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(6, 'Chhattisgarh', 'CG', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(7, 'Dadra and Nagar Haveli (UT)', 'DN', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(8, 'Daman and Diu (UT)', 'DD', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(9, 'Delhi (NCT)', 'DL', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(10, 'Goa', 'GA', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(11, 'Gujarat', 'GJ', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(12, 'Haryana', 'HR', '2026-02-05 08:10:54', '2026-02-05 08:10:54'),
(13, 'Himachal Pradesh', 'HP', '2026-02-05 08:10:55', '2026-02-05 08:10:55'),
(14, 'Jammu and Kashmir', 'JK', '2026-02-05 08:10:55', '2026-02-05 08:10:55'),
(15, 'Jharkhand', 'JH', '2026-02-05 08:10:55', '2026-02-05 08:10:55'),
(16, 'Karnataka', 'KA', '2026-02-05 08:10:55', '2026-02-05 08:10:55'),
(17, 'Kerala', 'KL', '2026-02-05 08:10:56', '2026-02-05 08:10:56'),
(18, 'Lakshadweep (UT)', 'LD', '2026-02-05 08:10:56', '2026-02-05 08:10:56'),
(19, 'Madhya Pradesh', 'MP', '2026-02-05 08:10:56', '2026-02-05 08:10:56'),
(20, 'Maharashtra', 'MH', '2026-02-05 08:10:57', '2026-02-05 08:10:57'),
(21, 'Manipur', 'MN', '2026-02-05 08:10:57', '2026-02-05 08:10:57'),
(22, 'Meghalaya', 'ML', '2026-02-05 08:10:57', '2026-02-05 08:10:57'),
(23, 'Mizoram', 'MZ', '2026-02-05 08:10:57', '2026-02-05 08:10:57'),
(24, 'Nagaland', 'NL', '2026-02-05 08:10:57', '2026-02-05 08:10:57'),
(25, 'Odisha', 'OR', '2026-02-05 08:10:57', '2026-02-05 08:10:57'),
(26, 'Puducherry (UT)', 'PY', '2026-02-05 08:10:58', '2026-02-05 08:10:58'),
(27, 'Punjab', 'PB', '2026-02-05 08:10:58', '2026-02-05 08:10:58'),
(28, 'Rajasthan', 'RJ', '2026-02-05 08:10:58', '2026-02-05 08:10:58'),
(29, 'Sikkim', 'SK', '2026-02-05 08:10:58', '2026-02-05 08:10:58'),
(30, 'Tamil Nadu', 'TN', '2026-02-05 08:10:58', '2026-02-05 08:10:58'),
(31, 'Telangana', 'TS', '2026-02-05 08:10:59', '2026-02-05 08:10:59'),
(32, 'Tripura', 'TR', '2026-02-05 08:10:59', '2026-02-05 08:10:59'),
(33, 'Uttarakhand', 'UK', '2026-02-05 08:10:59', '2026-02-05 08:10:59'),
(34, 'Uttar Pradesh', 'UP', '2026-02-05 08:10:59', '2026-02-05 08:10:59'),
(35, 'West Bengal', 'WB', '2026-02-05 08:11:00', '2026-02-05 08:11:00');

-- ---------------------------------------------------------
-- Table structure for Districts
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `districts`;
CREATE TABLE IF NOT EXISTS `districts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `state_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  INDEX (`state_id`),
  FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `districts` (`id`, `state_id`, `name`, `created_at`, `updated_at`) VALUES
(1, 1, 'Anantapur', NOW(), NOW()), (2, 1, 'Chittoor', NOW(), NOW()), (3, 1, 'East Godavari', NOW(), NOW()), (4, 1, 'Guntur', NOW(), NOW()), (5, 1, 'Krishna', NOW(), NOW()), (6, 1, 'Kurnool', NOW(), NOW()), (7, 1, 'Nellore', NOW(), NOW()), (8, 1, 'Prakasam', NOW(), NOW()), (9, 1, 'Srikakulam', NOW(), NOW()), (10, 1, 'Visakhapatnam', NOW(), NOW()), (11, 1, 'Vizianagaram', NOW(), NOW()), (12, 1, 'West Godavari', NOW(), NOW()), (13, 1, 'YSR Kadapa', NOW(), NOW()),
(14, 2, 'Anjaw', NOW(), NOW()), (15, 2, 'Changlang', NOW(), NOW()), (16, 2, 'Dibang Valley', NOW(), NOW()), (17, 2, 'East Kameng', NOW(), NOW()), (18, 2, 'East Siang', NOW(), NOW()), (19, 2, 'Kamle', NOW(), NOW()), (20, 2, 'Kra Daadi', NOW(), NOW()), (21, 2, 'Kurung Kumey', NOW(), NOW()), (22, 2, 'Lepa Rada', NOW(), NOW()), (23, 2, 'Lohit', NOW(), NOW()), (24, 2, 'Longding', NOW(), NOW()), (25, 2, 'Lower Dibang Valley', NOW(), NOW()), (26, 2, 'Lower Siang', NOW(), NOW()), (27, 2, 'Lower Subansiri', NOW(), NOW()), (28, 2, 'Namsai', NOW(), NOW()), (29, 2, 'Pakke Kessang', NOW(), NOW()), (30, 2, 'Papum Pare', NOW(), NOW()), (31, 2, 'Shi Yomi', NOW(), NOW()), (32, 2, 'Siang', NOW(), NOW()), (33, 2, 'Tawang', NOW(), NOW()), (34, 2, 'Tirap', NOW(), NOW()), (35, 2, 'Upper Siang', NOW(), NOW()), (36, 2, 'Upper Subansiri', NOW(), NOW()), (37, 2, 'West Kameng', NOW(), NOW()), (38, 2, 'West Siang', NOW(), NOW()),
(39, 3, 'Baksa', NOW(), NOW()), (40, 3, 'Barpeta', NOW(), NOW()), (41, 3, 'Biswanath', NOW(), NOW()), (42, 3, 'Bongaigaon', NOW(), NOW()), (43, 3, 'Cachar', NOW(), NOW()), (44, 3, 'Charaideo', NOW(), NOW()), (45, 3, 'Chirang', NOW(), NOW()), (46, 3, 'Darrang', NOW(), NOW()), (47, 3, 'Dhemaji', NOW(), NOW()), (48, 3, 'Dhubri', NOW(), NOW()), (49, 3, 'Dibrugarh', NOW(), NOW()), (50, 3, 'Dima Hasao', NOW(), NOW()), (51, 3, 'Goalpara', NOW(), NOW()), (52, 3, 'Golaghat', NOW(), NOW()), (53, 3, 'Hailakandi', NOW(), NOW()), (54, 3, 'Hojai', NOW(), NOW()), (55, 3, 'Jorhat', NOW(), NOW()), (56, 3, 'Kamrup', NOW(), NOW()), (57, 3, 'Kamrup Metropolitan', NOW(), NOW()), (58, 3, 'Karbi Anglong', NOW(), NOW()), (59, 3, 'Karimganj', NOW(), NOW()), (60, 3, 'Kokrajhar', NOW(), NOW()), (61, 3, 'Lakhimpur', NOW(), NOW()), (62, 3, 'Majuli', NOW(), NOW()), (63, 3, 'Morigaon', NOW(), NOW()), (64, 3, 'Nagaon', NOW(), NOW()), (65, 3, 'Nalbari', NOW(), NOW()), (66, 3, 'Sivasagar', NOW(), NOW()), (67, 3, 'Sonitpur', NOW(), NOW()), (68, 3, 'South Salmara-Mankachar', NOW(), NOW()), (69, 3, 'Tinsukia', NOW(), NOW()), (70, 3, 'Udalguri', NOW(), NOW()), (71, 3, 'West Karbi Anglong', NOW(), NOW()),
(72, 4, 'Araria', NOW(), NOW()), (73, 4, 'Arwal', NOW(), NOW()), (74, 4, 'Aurangabad', NOW(), NOW()), (75, 4, 'Banka', NOW(), NOW()), (76, 4, 'Begusarai', NOW(), NOW()), (77, 4, 'Bhagalpur', NOW(), NOW()), (78, 4, 'Bhojpur', NOW(), NOW()), (79, 4, 'Buxar', NOW(), NOW()), (80, 4, 'Darbhanga', NOW(), NOW()), (81, 4, 'East Champaran (Motihari)', NOW(), NOW()), (82, 4, 'Gaya', NOW(), NOW()), (83, 4, 'Gopalganj', NOW(), NOW()), (84, 4, 'Jamui', NOW(), NOW()), (85, 4, 'Jehanabad', NOW(), NOW()), (86, 4, 'Kaimur (Bhabua)', NOW(), NOW()), (87, 4, 'Katihar', NOW(), NOW()), (88, 4, 'Khagaria', NOW(), NOW()), (89, 4, 'Kishanganj', NOW(), NOW()), (90, 4, 'Lakhisarai', NOW(), NOW()), (91, 4, 'Madhepura', NOW(), NOW()), (92, 4, 'Madhubani', NOW(), NOW()), (93, 4, 'Munger (Monghyr)', NOW(), NOW()), (94, 4, 'Muzaffarpur', NOW(), NOW()), (95, 4, 'Nalanda', NOW(), NOW()), (96, 4, 'Nawada', NOW(), NOW()), (97, 4, 'Patna', NOW(), NOW()), (98, 4, 'Purnia (Purnea)', NOW(), NOW()), (99, 4, 'Rohtas', NOW(), NOW()), (100, 4, 'Saharsa', NOW(), NOW()), (101, 4, 'Samastipur', NOW(), NOW()), (102, 4, 'Saran', NOW(), NOW()), (103, 4, 'Sheikhpura', NOW(), NOW()), (104, 4, 'Sheohar', NOW(), NOW()), (105, 4, 'Sitamarhi', NOW(), NOW()), (106, 4, 'Siwan', NOW(), NOW()), (107, 4, 'Supaul', NOW(), NOW()), (108, 4, 'Vaishali', NOW(), NOW()), (109, 4, 'West Champaran', NOW(), NOW()),
(110, 5, 'Chandigarh', NOW(), NOW()),
(111, 6, 'Balod', NOW(), NOW()), (112, 6, 'Baloda Bazar', NOW(), NOW()), (113, 6, 'Balrampur', NOW(), NOW()), (114, 6, 'Bastar', NOW(), NOW()), (115, 6, 'Bemetara', NOW(), NOW()), (116, 6, 'Bijapur', NOW(), NOW()), (117, 6, 'Bilaspur', NOW(), NOW()), (118, 6, 'Dantewada (South Bastar)', NOW(), NOW()), (119, 6, 'Dhamtari', NOW(), NOW()), (120, 6, 'Durg', NOW(), NOW()), (121, 6, 'Gariyaband', NOW(), NOW()), (122, 6, 'Janjgir-Champa', NOW(), NOW()), (123, 6, 'Jashpur', NOW(), NOW()), (124, 6, 'Kabirdham (Kawardha)', NOW(), NOW()), (125, 6, 'Kanker (North Bastar)', NOW(), NOW()), (126, 6, 'Kondagaon', NOW(), NOW()), (127, 6, 'Korba', NOW(), NOW()), (128, 6, 'Korea (Koriya)', NOW(), NOW()), (129, 6, 'Mahasamund', NOW(), NOW()), (130, 6, 'Mungeli', NOW(), NOW()), (131, 6, 'Narayanpur', NOW(), NOW()), (132, 6, 'Raigarh', NOW(), NOW()), (133, 6, 'Raipur', NOW(), NOW()), (134, 6, 'Rajnandgaon', NOW(), NOW()), (135, 6, 'Sukma', NOW(), NOW()), (136, 6, 'Surajpur', NOW(), NOW()), (137, 6, 'Surguja', NOW(), NOW()),
(138, 7, 'Dadra & Nagar Haveli', NOW(), NOW()),
(139, 8, 'Daman', NOW(), NOW()), (140, 8, 'Diu', NOW(), NOW()),
(141, 9, 'Central Delhi', NOW(), NOW()), (142, 9, 'East Delhi', NOW(), NOW()), (143, 9, 'New Delhi', NOW(), NOW()), (144, 9, 'North Delhi', NOW(), NOW()), (145, 9, 'North East Delhi', NOW(), NOW()), (146, 9, 'North West Delhi', NOW(), NOW()), (147, 9, 'Shahdara', NOW(), NOW()), (148, 9, 'South Delhi', NOW(), NOW()), (149, 9, 'South East Delhi', NOW(), NOW()), (150, 9, 'South West Delhi', NOW(), NOW()), (151, 9, 'West Delhi', NOW(), NOW()),
(152, 10, 'North Goa', NOW(), NOW()), (153, 10, 'South Goa', NOW(), NOW()),
(154, 11, 'Ahmedabad', NOW(), NOW()), (155, 11, 'Amreli', NOW(), NOW()), (156, 11, 'Anand', NOW(), NOW()), (157, 11, 'Aravalli', NOW(), NOW()), (158, 11, 'Banaskantha (Palanpur)', NOW(), NOW()), (159, 11, 'Bharuch', NOW(), NOW()), (160, 11, 'Bhavnagar', NOW(), NOW()), (161, 11, 'Botad', NOW(), NOW()), (162, 11, 'Chhota Udepur', NOW(), NOW()), (163, 11, 'Dahod', NOW(), NOW()), (164, 11, 'Dang (Ahwa)', NOW(), NOW()), (165, 11, 'Devbhoomi Dwarka', NOW(), NOW()), (166, 11, 'Gandhinagar', NOW(), NOW()), (167, 11, 'Gir Somnath', NOW(), NOW()), (168, 11, 'Jamnagar', NOW(), NOW()), (169, 11, 'Junagadh', NOW(), NOW()), (170, 11, 'Kachchh', NOW(), NOW()), (171, 11, 'Kheda (Nadiad)', NOW(), NOW()), (172, 11, 'Mahisagar', NOW(), NOW()), (173, 11, 'Mehsana', NOW(), NOW()), (174, 11, 'Morbi', NOW(), NOW()), (175, 11, 'Narmada (Rajpipla)', NOW(), NOW()), (176, 11, 'Navsari', NOW(), NOW()), (177, 11, 'Panchmahal (Godhra)', NOW(), NOW()), (178, 11, 'Patan', NOW(), NOW()), (179, 11, 'Porbandar', NOW(), NOW()), (180, 11, 'Rajkot', NOW(), NOW()), (181, 11, 'Sabarkantha (Himmatnagar)', NOW(), NOW()), (182, 11, 'Surat', NOW(), NOW()), (183, 11, 'Surendranagar', NOW(), NOW()), (184, 11, 'Tapi (Vyara)', NOW(), NOW()), (185, 11, 'Vadodara', NOW(), NOW()), (186, 11, 'Valsad', NOW(), NOW()),
(187, 12, 'Ambala', NOW(), NOW()), (188, 12, 'Bhiwani', NOW(), NOW()), (189, 12, 'Charkhi Dadri', NOW(), NOW()), (190, 12, 'Faridabad', NOW(), NOW()), (191, 12, 'Fatehabad', NOW(), NOW()), (192, 12, 'Gurugram (Gurgaon)', NOW(), NOW()), (193, 12, 'Hisar', NOW(), NOW()), (194, 12, 'Jhajjar', NOW(), NOW()), (195, 12, 'Jind', NOW(), NOW()), (196, 12, 'Kaithal', NOW(), NOW()), (197, 12, 'Karnal', NOW(), NOW()), (198, 12, 'Kurukshetra', NOW(), NOW()), (199, 12, 'Mahendragarh', NOW(), NOW()), (200, 12, 'Nuh', NOW(), NOW()), (201, 12, 'Palwal', NOW(), NOW()), (202, 12, 'Panchkula', NOW(), NOW()), (203, 12, 'Panipat', NOW(), NOW()), (204, 12, 'Rewari', NOW(), NOW()), (205, 12, 'Rohtak', NOW(), NOW()), (206, 12, 'Sirsa', NOW(), NOW()), (207, 12, 'Sonipat', NOW(), NOW()), (208, 12, 'Yamunanagar', NOW(), NOW()),
(209, 13, 'Bilaspur', NOW(), NOW()), (210, 13, 'Chamba', NOW(), NOW()), (211, 13, 'Hamirpur', NOW(), NOW()), (212, 13, 'Kangra', NOW(), NOW()), (213, 13, 'Kinnaur', NOW(), NOW()), (214, 13, 'Kullu', NOW(), NOW()), (215, 13, 'Lahaul & Spiti', NOW(), NOW()), (216, 13, 'Mandi', NOW(), NOW()), (217, 13, 'Shimla', NOW(), NOW()), (218, 13, 'Sirmaur (Sirmour)', NOW(), NOW()), (219, 13, 'Solan', NOW(), NOW()), (220, 13, 'Una', NOW(), NOW()),
(221, 14, 'Anantnag', NOW(), NOW()), (222, 14, 'Bandipore', NOW(), NOW()), (223, 14, 'Baramulla', NOW(), NOW()), (224, 14, 'Budgam', NOW(), NOW()), (225, 14, 'Doda', NOW(), NOW()), (226, 14, 'Ganderbal', NOW(), NOW()), (227, 14, 'Jammu', NOW(), NOW()), (228, 14, 'Kargil', NOW(), NOW()), (229, 14, 'Kathua', NOW(), NOW()), (230, 14, 'Kishtwar', NOW(), NOW()), (231, 14, 'Kulgam', NOW(), NOW()), (232, 14, 'Kupwara', NOW(), NOW()), (233, 14, 'Leh', NOW(), NOW()), (234, 14, 'Poonch', NOW(), NOW()), (235, 14, 'Pulwama', NOW(), NOW()), (236, 14, 'Rajouri', NOW(), NOW()), (237, 14, 'Ramban', NOW(), NOW()), (238, 14, 'Reasi', NOW(), NOW()), (239, 14, 'Samba', NOW(), NOW()), (240, 14, 'Shopian', NOW(), NOW()), (241, 14, 'Srinagar', NOW(), NOW()), (242, 14, 'Udhampur', NOW(), NOW()),
(243, 15, 'Bokaro', NOW(), NOW()), (244, 15, 'Chatra', NOW(), NOW()), (245, 15, 'Deoghar', NOW(), NOW()), (246, 15, 'Dhanbad', NOW(), NOW()), (247, 15, 'Dumka', NOW(), NOW()), (248, 15, 'East Singhbhum', NOW(), NOW()), (249, 15, 'Garhwa', NOW(), NOW()), (250, 15, 'Giridih', NOW(), NOW()),
(251, 15, 'Gumla', NOW(), NOW()), (252, 15, 'Hazaribagh', NOW(), NOW()), (253, 15, 'Jamtara', NOW(), NOW()), (254, 15, 'Khunti', NOW(), NOW()), (255, 15, 'Koderma', NOW(), NOW()), (256, 15, 'Latehar', NOW(), NOW()), (257, 15, 'Lohardaga', NOW(), NOW()), (258, 15, 'Pakur', NOW(), NOW()), (259, 15, 'Palamu', NOW(), NOW()), (260, 15, 'Ramgarh', NOW(), NOW()), (261, 15, 'Ranchi', NOW(), NOW()), (262, 15, 'Sahibganj', NOW(), NOW()), (263, 15, 'Seraikela-Kharsawan', NOW(), NOW()), (264, 15, 'Simdega', NOW(), NOW()), (265, 15, 'West Singhbhum', NOW(), NOW()),
(266, 16, 'Bagalkot', NOW(), NOW()), (267, 16, 'Ballari (Bellary)', NOW(), NOW()), (268, 16, 'Belagavi (Belgaum)', NOW(), NOW()), (269, 16, 'Bengaluru Rural', NOW(), NOW()), (270, 16, 'Bengaluru Urban', NOW(), NOW()), (271, 16, 'Bidar', NOW(), NOW()), (272, 16, 'Chamarajanagar', NOW(), NOW()), (273, 16, 'Chikkaballapur', NOW(), NOW()), (274, 16, 'Chikkamagaluru (Chikmagalur)', NOW(), NOW()), (275, 16, 'Chitradurga', NOW(), NOW()), (276, 16, 'Dakshina Kannada', NOW(), NOW()), (277, 16, 'Davanagere', NOW(), NOW()), (278, 16, 'Dharwad', NOW(), NOW()), (279, 16, 'Gadag', NOW(), NOW()), (280, 16, 'Hassan', NOW(), NOW()), (281, 16, 'Haveri', NOW(), NOW()), (282, 16, 'Kalaburagi (Gulbarga)', NOW(), NOW()), (283, 16, 'Kodagu', NOW(), NOW()), (284, 16, 'Kolar', NOW(), NOW()), (285, 16, 'Koppal', NOW(), NOW()), (286, 16, 'Mandya', NOW(), NOW()), (287, 16, 'Mysuru (Mysore)', NOW(), NOW()), (288, 16, 'Raichur', NOW(), NOW()), (289, 16, 'Ramanagara', NOW(), NOW()), (290, 16, 'Shivamogga (Shimoga)', NOW(), NOW()), (291, 16, 'Tumakuru (Tumkur)', NOW(), NOW()), (292, 16, 'Udupi', NOW(), NOW()), (293, 16, 'Uttara Kannada (Karwar)', NOW(), NOW()), (294, 16, 'Vijayapura (Bijapur)', NOW(), NOW()), (295, 16, 'Yadgir', NOW(), NOW()),
(296, 17, 'Alappuzha', NOW(), NOW()), (297, 17, 'Ernakulam', NOW(), NOW()), (298, 17, 'Idukki', NOW(), NOW()), (299, 17, 'Kannur', NOW(), NOW()), (300, 17, 'Kasaragod', NOW(), NOW()), (301, 17, 'Kollam', NOW(), NOW()), (302, 17, 'Kottayam', NOW(), NOW()), (303, 17, 'Kozhikode', NOW(), NOW()), (304, 17, 'Malappuram', NOW(), NOW()), (305, 17, 'Palakkad', NOW(), NOW()), (306, 17, 'Pathanamthitta', NOW(), NOW()), (307, 17, 'Thiruvananthapuram', NOW(), NOW()), (308, 17, 'Thrissur', NOW(), NOW()), (309, 17, 'Wayanad', NOW(), NOW()),
(310, 18, 'Agatti', NOW(), NOW()), (311, 18, 'Amini', NOW(), NOW()), (312, 18, 'Androth', NOW(), NOW()), (313, 18, 'Bithra', NOW(), NOW()), (314, 18, 'Chethlath', NOW(), NOW()), (315, 18, 'Kavaratti', NOW(), NOW()), (316, 18, 'Kadmath', NOW(), NOW()), (317, 18, 'Kalpeni', NOW(), NOW()), (318, 18, 'Kilthan', NOW(), NOW()), (319, 18, 'Minicoy', NOW(), NOW()),
(320, 19, 'Agar Malwa', NOW(), NOW()), (321, 19, 'Alirajpur', NOW(), NOW()), (322, 19, 'Anuppur', NOW(), NOW()), (323, 19, 'Ashoknagar', NOW(), NOW()), (324, 19, 'Balaghat', NOW(), NOW()), (325, 19, 'Barwani', NOW(), NOW()), (326, 19, 'Betul', NOW(), NOW()), (327, 19, 'Bhind', NOW(), NOW()), (328, 19, 'Bhopal', NOW(), NOW()), (329, 19, 'Burhanpur', NOW(), NOW()), (330, 19, 'Chhatarpur', NOW(), NOW()), (331, 19, 'Chhindwara', NOW(), NOW()), (332, 19, 'Damoh', NOW(), NOW()), (333, 19, 'Datia', NOW(), NOW()), (334, 19, 'Dewas', NOW(), NOW()), (335, 19, 'Dhar', NOW(), NOW()), (336, 19, 'Dindori', NOW(), NOW()), (337, 19, 'Guna', NOW(), NOW()), (338, 19, 'Gwalior', NOW(), NOW()), (339, 19, 'Harda', NOW(), NOW()), (340, 19, 'Hoshangabad', NOW(), NOW()), (341, 19, 'Indore', NOW(), NOW()), (342, 19, 'Jabalpur', NOW(), NOW()), (343, 19, 'Jhabua', NOW(), NOW()), (344, 19, 'Katni', NOW(), NOW()), (345, 19, 'Khandwa', NOW(), NOW()), (346, 19, 'Khargone', NOW(), NOW()), (347, 19, 'Mandla', NOW(), NOW()), (348, 19, 'Mandsaur', NOW(), NOW()), (349, 19, 'Morena', NOW(), NOW()), (350, 19, 'Narsinghpur', NOW(), NOW()), (351, 19, 'Neemuch', NOW(), NOW()), (352, 19, 'Panna', NOW(), NOW()), (353, 19, 'Raisen', NOW(), NOW()), (354, 19, 'Rajgarh', NOW(), NOW()), (355, 19, 'Ratlam', NOW(), NOW()), (356, 19, 'Rewa', NOW(), NOW()), (357, 19, 'Sagar', NOW(), NOW()), (358, 19, 'Satna', NOW(), NOW()), (359, 19, 'Sehore', NOW(), NOW()), (360, 19, 'Seoni', NOW(), NOW()), (361, 19, 'Shahdol', NOW(), NOW()), (362, 19, 'Shajapur', NOW(), NOW()), (363, 19, 'Sheopur', NOW(), NOW()), (364, 19, 'Shivpuri', NOW(), NOW()), (365, 19, 'Sidhi', NOW(), NOW()), (366, 19, 'Singrauli', NOW(), NOW()), (367, 19, 'Tikamgarh', NOW(), NOW()), (368, 19, 'Ujjain', NOW(), NOW()), (369, 19, 'Umaria', NOW(), NOW()), (370, 19, 'Vidisha', NOW(), NOW()),
(371, 20, 'Ahmednagar', NOW(), NOW()), (372, 20, 'Akola', NOW(), NOW()), (373, 20, 'Amravati', NOW(), NOW()), (374, 20, 'Aurangabad', NOW(), NOW()), (375, 20, 'Beed', NOW(), NOW()), (376, 20, 'Bhandara', NOW(), NOW()), (377, 20, 'Buldhana', NOW(), NOW()), (378, 20, 'Chandrapur', NOW(), NOW()), (379, 20, 'Dhule', NOW(), NOW()), (380, 20, 'Gadchiroli', NOW(), NOW()), (381, 20, 'Gondia', NOW(), NOW()), (382, 20, 'Hingoli', NOW(), NOW()), (383, 20, 'Jalgaon', NOW(), NOW()), (384, 20, 'Jalna', NOW(), NOW()), (385, 20, 'Kolhapur', NOW(), NOW()), (386, 20, 'Latur', NOW(), NOW()), (387, 20, 'Mumbai City', NOW(), NOW()), (388, 20, 'Mumbai Suburban', NOW(), NOW()), (389, 20, 'Nagpur', NOW(), NOW()), (390, 20, 'Nanded', NOW(), NOW()), (391, 20, 'Nandurbar', NOW(), NOW()), (392, 20, 'Nashik', NOW(), NOW()), (393, 20, 'Osmanabad', NOW(), NOW()), (394, 20, 'Palghar', NOW(), NOW()), (395, 20, 'Parbhani', NOW(), NOW()), (396, 20, 'Pune', NOW(), NOW()), (397, 20, 'Raigad', NOW(), NOW()), (398, 20, 'Ratnagiri', NOW(), NOW()), (399, 20, 'Sangli', NOW(), NOW()), (400, 20, 'Satara', NOW(), NOW()), (401, 20, 'Sindhudurg', NOW(), NOW()), (402, 20, 'Solapur', NOW(), NOW()), (403, 20, 'Thane', NOW(), NOW()), (404, 20, 'Wardha', NOW(), NOW()), (405, 20, 'Washim', NOW(), NOW()), (406, 20, 'Yavatmal', NOW(), NOW()),
(407, 21, 'Bishnupur', NOW(), NOW()), (408, 21, 'Chandel', NOW(), NOW()), (409, 21, 'Churachandpur', NOW(), NOW()), (410, 21, 'Imphal East', NOW(), NOW()), (411, 21, 'Imphal West', NOW(), NOW()), (412, 21, 'Jiribam', NOW(), NOW()), (413, 21, 'Kakching', NOW(), NOW()), (414, 21, 'Kamjong', NOW(), NOW()), (415, 21, 'Kangpokpi', NOW(), NOW()), (416, 21, 'Noney', NOW(), NOW()), (417, 21, 'Pherzawl', NOW(), NOW()), (418, 21, 'Sena pati', NOW(), NOW()), (419, 21, 'Tamenglong', NOW(), NOW()), (420, 21, 'Tengnoupal', NOW(), NOW()), (421, 21, 'Thoubal', NOW(), NOW()), (422, 21, 'Ukhrul', NOW(), NOW()),
(423, 22, 'East Garo Hills', NOW(), NOW()), (424, 22, 'East Jaintia Hills', NOW(), NOW()), (425, 22, 'East Khasi Hills', NOW(), NOW()), (426, 22, 'North Garo Hills', NOW(), NOW()), (427, 22, 'Ri Bhoi', NOW(), NOW()), (428, 22, 'South Garo Hills', NOW(), NOW()), (429, 22, 'South West Garo Hills ', NOW(), NOW()), (430, 22, 'South West Khasi Hills', NOW(), NOW()), (431, 22, 'West Garo Hills', NOW(), NOW()), (432, 22, 'West Jaintia Hills', NOW(), NOW()), (433, 22, 'West Khasi Hills', NOW(), NOW()),
(434, 23, 'Aizawl', NOW(), NOW()), (435, 23, 'Champhai', NOW(), NOW()), (436, 23, 'Kolasib', NOW(), NOW()), (437, 23, 'Lawngtlai', NOW(), NOW()), (438, 23, 'Lunglei', NOW(), NOW()), (439, 23, 'Mamit', NOW(), NOW()), (440, 23, 'Saiha', NOW(), NOW()), (441, 23, 'Serchhip', NOW(), NOW()),
(442, 24, 'Dimapur', NOW(), NOW()), (443, 24, 'Kiphire', NOW(), NOW()), (444, 24, 'Kohima', NOW(), NOW()), (445, 24, 'Longleng', NOW(), NOW()), (446, 24, 'Mokokchung', NOW(), NOW()), (447, 24, 'Mon', NOW(), NOW()), (448, 24, 'Peren', NOW(), NOW()), (449, 24, 'Phek', NOW(), NOW()), (450, 24, 'Tuensang', NOW(), NOW()), (451, 24, 'Wokha', NOW(), NOW()), (452, 24, 'Zunheboto', NOW(), NOW()),
(453, 25, 'Angul', NOW(), NOW()), (454, 25, 'Balangir', NOW(), NOW()), (455, 25, 'Balasore', NOW(), NOW()), (456, 25, 'Bargarh', NOW(), NOW()), (457, 25, 'Bhadrak', NOW(), NOW()), (458, 25, 'Boudh', NOW(), NOW()), (459, 25, 'Cuttack', NOW(), NOW()), (460, 25, 'Deogarh', NOW(), NOW()), (461, 25, 'Dhenkanal', NOW(), NOW()), (462, 25, 'Gajapati', NOW(), NOW()), (463, 25, 'Ganjam', NOW(), NOW()), (464, 25, 'Jagatsinghapur', NOW(), NOW()), (465, 25, 'Jajpur', NOW(), NOW()), (466, 25, 'Jharsuguda', NOW(), NOW()), (467, 25, 'Kalahandi', NOW(), NOW()), (468, 25, 'Kandhamal', NOW(), NOW()), (469, 25, 'Kendrapara', NOW(), NOW()), (470, 25, 'Kendujhar (Keonjhar)', NOW(), NOW()), (471, 25, 'Khordha', NOW(), NOW()), (472, 25, 'Koraput', NOW(), NOW()), (473, 25, 'Malkangiri', NOW(), NOW()), (474, 25, 'Mayurbhanj', NOW(), NOW()), (475, 25, 'Nabarangpur', NOW(), NOW()), (476, 25, 'Nayagarh', NOW(), NOW()), (477, 25, 'Nuapada', NOW(), NOW()), (478, 25, 'Puri', NOW(), NOW()), (479, 25, 'Rayagada', NOW(), NOW()), (480, 25, 'Sambalpur', NOW(), NOW()), (481, 25, 'Sonepur', NOW(), NOW()), (482, 25, 'Sundargarh', NOW(), NOW()),
(483, 26, 'Karaikal', NOW(), NOW()), (484, 26, 'Mahe', NOW(), NOW()), (485, 26, 'Pondicherry', NOW(), NOW()), (486, 26, 'Yanam', NOW(), NOW()),
(487, 27, 'Amritsar', NOW(), NOW()), (488, 27, 'Barnala', NOW(), NOW()), (489, 27, 'Bathinda', NOW(), NOW()), (490, 27, 'Faridkot', NOW(), NOW()), (491, 27, 'Fatehgarh Sahib', NOW(), NOW()), (492, 27, 'Fazilka', NOW(), NOW()), (493, 27, 'Ferozepur', NOW(), NOW()), (494, 27, 'Gurdaspur', NOW(), NOW()), (495, 27, 'Hoshiarpur', NOW(), NOW()), (496, 27, 'Jalandhar', NOW(), NOW()), (497, 27, 'Kapurthala', NOW(), NOW()), (498, 27, 'Ludhiana', NOW(), NOW()), (499, 27, 'Mansa', NOW(), NOW()), (500, 27, 'Moga', NOW(), NOW()), (501, 27, 'Muktsar', NOW(), NOW()), (502, 27, 'Nawanshahr (Shahid Bhagat Singh Nagar)', NOW(), NOW()), (503, 27, 'Pathankot', NOW(), NOW()), (504, 27, 'Patiala', NOW(), NOW()), (505, 27, 'Rupnagar', NOW(), NOW()), (506, 27, 'Sahibzada Ajit Singh Nagar (Mohali)', NOW(), NOW()), (507, 27, 'Sangrur', NOW(), NOW()), (508, 27, 'Tarn Taran', NOW(), NOW()),
(509, 28, 'Ajmer', NOW(), NOW()), (510, 28, 'Alwar', NOW(), NOW()), (511, 28, 'Banswara', NOW(), NOW()), (512, 28, 'Baran', NOW(), NOW()), (513, 28, 'Barmer', NOW(), NOW()), (514, 28, 'Bharatpur', NOW(), NOW()), (515, 28, 'Bhilwara', NOW(), NOW()), (516, 28, 'Bikaner', NOW(), NOW()), (517, 28, 'Bundi', NOW(), NOW()), (518, 28, 'Chittorgarh', NOW(), NOW()), (519, 28, 'Churu', NOW(), NOW()), (520, 28, 'Dausa', NOW(), NOW()), (521, 28, 'Dholpur', NOW(), NOW()), (522, 28, 'Dungarpur', NOW(), NOW()), (523, 28, 'Hanumangarh', NOW(), NOW()), (524, 28, 'Jaipur', NOW(), NOW()), (525, 28, 'Jaisalmer', NOW(), NOW()), (526, 28, 'Jalore', NOW(), NOW()), (527, 28, 'Jhalawar', NOW(), NOW()), (528, 28, 'Jhunjhunu', NOW(), NOW()), (529, 28, 'Jodhpur', NOW(), NOW()), (530, 28, 'Karauli', NOW(), NOW()), (531, 28, 'Kota', NOW(), NOW()), (532, 28, 'Nagaur', NOW(), NOW()), (533, 28, 'Pali', NOW(), NOW()), (534, 28, 'Pratapgarh', NOW(), NOW()), (535, 28, 'Rajsamand', NOW(), NOW()), (536, 28, 'Sawai Madhopur', NOW(), NOW()), (537, 28, 'Sikar', NOW(), NOW()), (538, 28, 'Sirohi', NOW(), NOW()), (539, 28, 'Sri Ganganagar', NOW(), NOW()), (540, 28, 'Tonk', NOW(), NOW()), (541, 28, 'Udaipur', NOW(), NOW()),
(542, 29, 'East Sikkim', NOW(), NOW()), (543, 29, 'North Sikkim', NOW(), NOW()), (544, 29, 'South Sikkim', NOW(), NOW()), (545, 29, 'West Sikkim', NOW(), NOW()),
(546, 30, 'Ariyalur', NOW(), NOW()), (547, 30, 'Chennai', NOW(), NOW()), (548, 30, 'Coimbatore', NOW(), NOW()), (549, 30, 'Cuddalore', NOW(), NOW()), (550, 30, 'Dharmapuri', NOW(), NOW()), (551, 30, 'Dindigul', NOW(), NOW()), (552, 30, 'Erode', NOW(), NOW()), (553, 30, 'Kanchipuram', NOW(), NOW()), (554, 30, 'Kanyakumari', NOW(), NOW()), (555, 30, 'Karur', NOW(), NOW()), (556, 30, 'Krishnagiri', NOW(), NOW()), (557, 30, 'Madurai', NOW(), NOW()), (558, 30, 'Nagapattinam', NOW(), NOW()), (559, 30, 'Namakkal', NOW(), NOW()), (560, 30, 'Nilgiris', NOW(), NOW()), (561, 30, 'Perambalur', NOW(), NOW()), (562, 30, 'Pudukkottai', NOW(), NOW()), (563, 30, 'Ramanathapuram', NOW(), NOW()), (564, 30, 'Salem', NOW(), NOW()), (565, 30, 'Sivaganga', NOW(), NOW()), (566, 30, 'Thanjavur', NOW(), NOW()), (567, 30, 'Theni', NOW(), NOW()), (568, 30, 'Thoothukudi (Tuticorin)', NOW(), NOW()), (569, 30, 'Tiruchirappalli', NOW(), NOW()), (570, 30, 'Tirunelveli', NOW(), NOW()), (571, 30, 'Tiruppur', NOW(), NOW()), (572, 30, 'Tiruvallur', NOW(), NOW()), (573, 30, 'Tiruvannamalai', NOW(), NOW()), (574, 30, 'Tiruvarur', NOW(), NOW()), (575, 30, 'Vellore', NOW(), NOW()), (576, 30, 'Viluppuram', NOW(), NOW()), (577, 30, 'Virudhunagar', NOW(), NOW()),
(578, 31, 'Adilabad', NOW(), NOW()), (579, 31, 'Bhadradri Kothagudem', NOW(), NOW()), (580, 31, 'Hyderabad', NOW(), NOW()), (581, 31, 'Jagtial', NOW(), NOW()), (582, 31, 'Jangaon', NOW(), NOW()), (583, 31, 'Jayashankar Bhoopalpally', NOW(), NOW()), (584, 31, 'Jogulamba Gadwal', NOW(), NOW()), (585, 31, 'Kamareddy', NOW(), NOW()), (586, 31, 'Karimnagar', NOW(), NOW()), (587, 31, 'Khammam', NOW(), NOW()), (588, 31, 'Komaram Bheem Asifabad', NOW(), NOW()), (589, 31, 'Mahabubabad', NOW(), NOW()), (590, 31, 'Mahabubnagar', NOW(), NOW()), (591, 31, 'Mancherial', NOW(), NOW()), (592, 31, 'Medak', NOW(), NOW()), (593, 31, 'Medchal', NOW(), NOW()), (594, 31, 'Nagarkurnool', NOW(), NOW()), (595, 31, 'Nalgonda', NOW(), NOW()), (596, 31, 'Nirmal', NOW(), NOW()), (597, 31, 'Nizamabad', NOW(), NOW()), (598, 31, 'Peddapalli', NOW(), NOW()), (599, 31, 'Rajanna Sircilla', NOW(), NOW()), (600, 31, 'Rangareddy', NOW(), NOW()), (601, 31, 'Sangareddy', NOW(), NOW()), (602, 31, 'Siddipet', NOW(), NOW()), (603, 31, 'Suryapet', NOW(), NOW()), (604, 31, 'Vikarabad', NOW(), NOW()), (605, 31, 'Wanaparthy', NOW(), NOW()), (606, 31, 'Warangal (Rural)', NOW(), NOW()), (607, 31, 'Warangal (Urban)', NOW(), NOW()), (608, 31, 'Yadadri Bhuvanagiri', NOW(), NOW()),
(609, 32, 'Dhalai', NOW(), NOW()), (610, 32, 'Gomati', NOW(), NOW()), (611, 32, 'Khowai', NOW(), NOW()), (612, 32, 'North Tripura', NOW(), NOW()), (613, 32, 'Sepahijala', NOW(), NOW()), (614, 32, 'South Tripura', NOW(), NOW()), (615, 32, 'Unakoti', NOW(), NOW()), (616, 32, 'West Tripura', NOW(), NOW()),
(617, 33, 'Almora', NOW(), NOW()), (618, 33, 'Bageshwar', NOW(), NOW()), (619, 33, 'Chamoli', NOW(), NOW()), (620, 33, 'Champawat', NOW(), NOW()), (621, 33, 'Dehradun', NOW(), NOW()), (622, 33, 'Haridwar', NOW(), NOW()), (623, 33, 'Nainital', NOW(), NOW()), (624, 33, 'Pauri Garhwal', NOW(), NOW()), (625, 33, 'Pithoragarh', NOW(), NOW()), (626, 33, 'Rudraprayag', NOW(), NOW()), (627, 33, 'Tehri Garhwal', NOW(), NOW()), (628, 33, 'Udham Singh Nagar', NOW(), NOW()), (629, 33, 'Uttarkashi', NOW(), NOW()),
(630, 34, 'Agra', NOW(), NOW()), (631, 34, 'Aligarh', NOW(), NOW()), (632, 34, 'Allahabad', NOW(), NOW()), (633, 34, 'Ambedkar Nagar', NOW(), NOW()), (634, 34, 'Amethi (Chatrapati Sahuji Mahraj Nagar)', NOW(), NOW()), (635, 34, 'Amroha (J.P. Nagar)', NOW(), NOW()), (636, 34, 'Auraiya', NOW(), NOW()), (637, 34, 'Azamgarh', NOW(), NOW()), (638, 34, 'Baghpat', NOW(), NOW()), (639, 34, 'Bahraich', NOW(), NOW()), (640, 34, 'Ballia', NOW(), NOW()), (641, 34, 'Balrampur', NOW(), NOW()), (642, 34, 'Banda', NOW(), NOW()), (643, 34, 'Barabanki', NOW(), NOW()), (644, 34, 'Bareilly', NOW(), NOW()), (645, 34, 'Basti', NOW(), NOW()), (646, 34, 'Bhadohi', NOW(), NOW()), (647, 34, 'Bijnor', NOW(), NOW()), (648, 34, 'Budaun', NOW(), NOW()), (649, 34, 'Bulandshahr', NOW(), NOW()), (650, 34, 'Chandauli', NOW(), NOW()), (651, 34, 'Chitrakoot', NOW(), NOW()), (652, 34, 'Deoria', NOW(), NOW()), (653, 34, 'Etah', NOW(), NOW()), (654, 34, 'Etawah', NOW(), NOW()), (655, 34, 'Faizabad', NOW(), NOW()), (656, 34, 'Farrukhabad', NOW(), NOW()), (657, 34, 'Fatehpur', NOW(), NOW()), (658, 34, 'Firozabad', NOW(), NOW()), (659, 34, 'Gautam Buddha Nagar', NOW(), NOW()), (660, 34, 'Ghaziabad', NOW(), NOW()), (661, 34, 'Ghazipur', NOW(), NOW()), (662, 34, 'Gonda', NOW(), NOW()), (663, 34, 'Gorakhpur', NOW(), NOW()), (664, 34, 'Hamirpur', NOW(), NOW()), (665, 34, 'Hapur (Panchsheel Nagar)', NOW(), NOW()), (666, 34, 'Hardoi', NOW(), NOW()), (667, 34, 'Hathras', NOW(), NOW()), (668, 34, 'Jalaun', NOW(), NOW()), (669, 34, 'Jaunpur', NOW(), NOW()), (670, 34, 'Jhansi', NOW(), NOW()), (671, 34, 'Kannauj', NOW(), NOW()), (672, 34, 'Kanpur Dehat', NOW(), NOW()), (673, 34, 'Kanpur Nagar', NOW(), NOW()), (674, 34, 'Kanshiram Nagar (Kasganj)', NOW(), NOW()), (675, 34, 'Kaushambi', NOW(), NOW()), (676, 34, 'Kushinagar (Padrauna)', NOW(), NOW()), (677, 34, 'Lakhimpur - Kheri', NOW(), NOW()), (678, 34, 'Lalitpur', NOW(), NOW()), (679, 34, 'Lucknow', NOW(), NOW()), (680, 34, 'Maharajganj', NOW(), NOW()), (681, 34, 'Mahoba', NOW(), NOW()), (682, 34, 'Mainpuri', NOW(), NOW()), (683, 34, 'Mathura', NOW(), NOW()), (684, 34, 'Mau', NOW(), NOW()), (685, 34, 'Meerut', NOW(), NOW()), (686, 34, 'Mirzapur', NOW(), NOW()), (687, 34, 'Moradabad', NOW(), NOW()), (688, 34, 'Muzaffarnagar', NOW(), NOW()), (689, 34, 'Pilibhit', NOW(), NOW()), (690, 34, 'Pratapgarh', NOW(), NOW()), (691, 34, 'RaeBareli', NOW(), NOW()), (692, 34, 'Rampur', NOW(), NOW()), (693, 34, 'Saharanpur', NOW(), NOW()), (694, 34, 'Sambhal (Bhim Nagar)', NOW(), NOW()), (695, 34, 'Sant Kabir Nagar', NOW(), NOW()), (696, 34, 'Shahjahanpur', NOW(), NOW()), (697, 34, 'Shamali (Prabuddh Nagar)', NOW(), NOW()), (698, 34, 'Shravasti', NOW(), NOW()), (699, 34, 'Siddharth Nagar', NOW(), NOW()), (700, 34, 'Sitapur', NOW(), NOW()), (701, 34, 'Sonbhadra', NOW(), NOW()), (702, 34, 'Sultanpur', NOW(), NOW()), (703, 34, 'Unnao', NOW(), NOW()), (704, 34, 'Varanasi', NOW(), NOW()),
(705, 35, 'Alipurduar', NOW(), NOW()), (706, 35, 'Bankura', NOW(), NOW()), (707, 35, 'Birbhum', NOW(), NOW()), (708, 35, 'Burdwan (Bardhaman)', NOW(), NOW()), (709, 35, 'Cooch Behar', NOW(), NOW()), (710, 35, 'Dakshin Dinajpur (South Dinajpur)', NOW(), NOW()), (711, 35, 'Darjeeling', NOW(), NOW()), (712, 35, 'Hooghly', NOW(), NOW()), (713, 35, 'Howrah', NOW(), NOW()), (714, 35, 'Jalpaiguri', NOW(), NOW()), (715, 35, 'Kalimpong', NOW(), NOW()), (716, 35, 'Kolkata', NOW(), NOW()), (717, 35, 'Malda', NOW(), NOW()), (718, 35, 'Murshidabad', NOW(), NOW()), (719, 35, 'Nadia', NOW(), NOW()), (720, 35, 'North 24 Parganas', NOW(), NOW()), (721, 35, 'Paschim Medinipur (West Medinipur)', NOW(), NOW()), (722, 35, 'Purba Medinipur (East Medinipur)', NOW(), NOW()), (723, 35, 'Purulia', NOW(), NOW()), (724, 35, 'South 24 Parganas', NOW(), NOW()), (725, 35, 'Uttar Dinajpur (North Dinajpur)', NOW(), NOW());

-- ---------------------------------------------------------
-- Table structure for Skills
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `skills`;
CREATE TABLE IF NOT EXISTS `skills` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_type_id` BIGINT UNSIGNED,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `semester_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) DEFAULT '1',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for Cocurriculars
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `cocurriculars`;
CREATE TABLE IF NOT EXISTS `cocurriculars` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_type_id` BIGINT UNSIGNED,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `semester_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) DEFAULT '1',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Stored Procedures
-- ---------------------------------------------------------

DROP PROCEDURE IF EXISTS GetAdmittedStudentsReport;

DELIMITER //

CREATE PROCEDURE GetAdmittedStudentsReport(
    IN p_academic_year_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_course_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_semester_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_registration_no VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_gender VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_category VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_start_date DATETIME,
    IN p_end_date DATETIME
)
BEGIN
    SELECT
        ANY_VALUE(s.id) as id, ANY_VALUE(s.user_id) as user_id, s.registration_no, ANY_VALUE(s.gender) as gender, ANY_VALUE(s.category) as category, ANY_VALUE(s.sub_category) as sub_category,
        ANY_VALUE(s.father_name) as father_name, ANY_VALUE(s.mother_name) as mother_name, ANY_VALUE(s.dob) as dob, ANY_VALUE(s.religion) as religion, ANY_VALUE(s.caste) as caste, ANY_VALUE(s.adhar_no) as adhar_no,
        ANY_VALUE(s.samarth_no) as samarth_no, ANY_VALUE(s.whatsapp_number) as whatsapp_number, ANY_VALUE(s.blood_group) as blood_group, ANY_VALUE(s.mailing_address) as mailing_address,
        ANY_VALUE(s.mailing_state) as mailing_state, ANY_VALUE(s.mailing_district) as mailing_district, ANY_VALUE(s.mailing_tehsil) as mailing_tehsil, ANY_VALUE(s.mailing_pincode) as mailing_pincode,
        ANY_VALUE(s.permanent_address) as permanent_address, ANY_VALUE(s.permanent_state) as permanent_state, ANY_VALUE(s.permanent_district) as permanent_district,
        ANY_VALUE(s.permanent_tehsil) as permanent_tehsil, ANY_VALUE(s.permanent_pincode) as permanent_pincode, ANY_VALUE(s.bank_name) as bank_name, ANY_VALUE(s.bank_account_no) as bank_account_no,
        ANY_VALUE(s.ifsc_code) as ifsc_code, ANY_VALUE(s.admission_status) as admission_status, ANY_VALUE(s.created_at) AS student_created_at,
        ANY_VALUE(u.name) AS student_name, ANY_VALUE(u.phone) AS student_phone, ANY_VALUE(u.email) AS student_email,
        ANY_VALUE(c.name) AS course_name, ANY_VALUE(sem.name) AS semester_name, ay.session AS academic_session,
        ANY_VALUE(sub1.subject_name) AS major1_name, ANY_VALUE(sub2.subject_name) AS major2_name,
        ANY_VALUE(sub3.subject_name) AS minor_name, ANY_VALUE(f.created_at) AS admission_date,
        ANY_VALUE(f.amount) AS paid_amount, ANY_VALUE(u.name) AS `user.name`, ANY_VALUE(u.phone) AS `user.phone`,
        ANY_VALUE(u.email) AS `user.email`, ANY_VALUE(c.name) AS `courseName.name`, ANY_VALUE(sem.name) AS `semsterName.name`
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN semesters sem ON s.year = sem.id
    LEFT JOIN academic_years ay ON s.academic_year = ay.id
    LEFT JOIN subjects sub1 ON s.major1_id = sub1.id
    LEFT JOIN subjects sub2 ON s.major2_id = sub2.id
    LEFT JOIN subjects sub3 ON s.minor_id = sub3.id
    JOIN student_admission_fee_details f ON s.id = f.student_id AND f.status = 'Success' AND f.semester_type = 'Odd'
    WHERE 1=1
        AND (p_academic_year_id IS NULL OR p_academic_year_id = '' OR s.academic_year COLLATE utf8mb4_unicode_ci = p_academic_year_id)
        AND (p_course_id IS NULL OR p_course_id = '' OR s.course_id = p_course_id)
        AND (p_semester_id IS NULL OR p_semester_id = '' OR s.year COLLATE utf8mb4_unicode_ci = p_semester_id)
        AND (p_registration_no IS NULL OR p_registration_no = '' OR s.registration_no COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', p_registration_no, '%') COLLATE utf8mb4_unicode_ci)
        AND (p_gender IS NULL OR p_gender = '' OR s.gender COLLATE utf8mb4_unicode_ci = p_gender)
        AND (p_category IS NULL OR p_category = '' OR s.category COLLATE utf8mb4_unicode_ci = p_category)
        AND (p_start_date IS NULL OR f.created_at >= p_start_date)
        AND (p_end_date IS NULL OR f.created_at <= p_end_date)
    GROUP BY s.registration_no, ay.id
    ORDER BY ANY_VALUE(f.created_at) DESC;
END //

DROP PROCEDURE IF EXISTS getFeeAmount //

CREATE PROCEDURE getFeeAmount(
    IN p_course_id INT,
    IN p_semester_id INT,
    IN p_category VARCHAR(50),
    IN p_gender VARCHAR(50),
    IN p_subject_ids TEXT
)
BEGIN
    DECLARE v_base_amount INT DEFAULT 0;
    DECLARE v_practical_count INT DEFAULT 0;
    DECLARE v_practical_fee INT DEFAULT 0;
    DECLARE v_total_practical_fee INT DEFAULT 0;
    DECLARE v_late_fee_to_add INT DEFAULT 0;
    DECLARE v_is_late_fee_applicable TINYINT DEFAULT 0;
    DECLARE v_late_fee_amount INT DEFAULT 0;
    DECLARE v_total_fee_amount INT DEFAULT 0;
    DECLARE v_general_fee INT DEFAULT 0;
    DECLARE v_girls_fee INT DEFAULT 0;
    DECLARE v_obc_fee INT DEFAULT 0;
    DECLARE v_sc_fee INT DEFAULT 0;
    DECLARE v_st_fee INT DEFAULT 0;
    DECLARE v_minority_fee_str VARCHAR(45);
    DECLARE v_minority_fee INT DEFAULT 0;

    SELECT
        Total_Fee_Amount, General_fee_Amount, Girls_fee_Amount, Minority_Fee_Amount,
        OBC_fee_Amount, SC_fee_Amount, ST_fee_Amount, Practical_Fee,
        late_fee, is_late_fee_applicable
    INTO
        v_total_fee_amount, v_general_fee, v_girls_fee, v_minority_fee_str,
        v_obc_fee, v_sc_fee, v_st_fee, v_practical_fee,
        v_late_fee_amount, v_is_late_fee_applicable
    FROM fee_maintenance
    WHERE Course = p_course_id AND semester = p_semester_id
    LIMIT 1;

    IF p_gender = 'Female' THEN
        SET v_base_amount = v_girls_fee;
    ELSE
        IF p_category = 'General' THEN
            SET v_base_amount = v_general_fee;
        ELSEIF p_category = 'OBC' THEN
            SET v_base_amount = v_obc_fee;
        ELSEIF p_category = 'SC' THEN
            SET v_base_amount = v_sc_fee;
        ELSEIF p_category = 'ST' THEN
            SET v_base_amount = v_st_fee;
        ELSEIF p_category = 'Minority' THEN
            SET v_base_amount = CAST(v_minority_fee_str AS UNSIGNED);
        ELSE
            SET v_base_amount = v_total_fee_amount;
        END IF;
    END IF;

    IF p_subject_ids IS NOT NULL AND p_subject_ids != '' THEN
        SELECT COUNT(*) INTO v_practical_count FROM subjects
        WHERE FIND_IN_SET(id, p_subject_ids) AND is_practical = 1;
    ELSE
        SET v_practical_count = 0;
    END IF;

    SET v_total_practical_fee = v_practical_count * v_practical_fee;

    IF v_is_late_fee_applicable = 1 THEN
        SET v_late_fee_to_add = v_late_fee_amount;
    ELSE
        SET v_late_fee_to_add = 0;
    END IF;

    SELECT (v_base_amount + v_total_practical_fee + v_late_fee_to_add) AS total_fee_amount;
END //

-- ---------------------------------------------------------
-- Table structure for Sessions
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `Sessions`;
CREATE TABLE IF NOT EXISTS `Sessions` (
  `sid` VARCHAR(36) NOT NULL,
  `expires` DATETIME DEFAULT NULL,
  `data` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER ;

-- ---------------------------------------------------------
-- Table structure for Settings
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `value` TEXT,
  `display_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` ENUM('text', 'number', 'boolean', 'select') DEFAULT 'text',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`key`, `value`, `display_name`, `description`, `type`, `created_at`, `updated_at`) VALUES
('is_first_time_college', 'true', 'Is First Time College', 'Set to true if the college is using the system for the first time.', 'boolean', NOW(), NOW()),
('registration_amount', '100.00', 'Registration Amount', 'The fee amount for student registration.', 'number', NOW(), NOW()),
('min_student_age', '10', 'Minimum Student Age', 'The minimum age required for a student to register.', 'number', NOW(), NOW()),
('atom_environment', 'demo', 'Atom Payment Environment', 'Payment gateway environment: demo or live.', 'select', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
