-- Migration: Dynamic Document Upload Section
-- Date: 2026-04-01

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- Table structure for DocumentTypes
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `document_types`;
CREATE TABLE IF NOT EXISTS `document_types` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(255) NOT NULL UNIQUE,
  `status` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial document types
INSERT INTO `document_types` (`name`, `code`) VALUES
('Photograph', 'photo'),
('Signature', 'signature'),
('High School Marksheet', 'high_school_marksheet'),
('Intermediate Marksheet', 'intermediate_marksheet'),
('Aadhaar Card', 'aadhar'),
('Caste Certificate', 'caste_certificate'),
('Income Certificate', 'income_certificate'),
('Transfer Certificate', 'tc'),
('Migration Certificate', 'migration_certificate');

-- ---------------------------------------------------------
-- Table structure for CourseSemesterDocuments
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `course_semester_documents`;
CREATE TABLE IF NOT EXISTS `course_semester_documents` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `semester_id` BIGINT UNSIGNED NOT NULL,
  `document_type_id` BIGINT UNSIGNED NOT NULL,
  `is_required` ENUM('Required', 'Optional', 'Hidden') DEFAULT 'Required',
  `status` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX (`course_id`, `semester_id`, `document_type_id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`semester_id`) REFERENCES `semesters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- Table structure for StudentDocuments
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `student_documents`;
CREATE TABLE IF NOT EXISTS `student_documents` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `registration_no` VARCHAR(255) NOT NULL,
  `document_type_id` BIGINT UNSIGNED NOT NULL,
  `file_path` TEXT NOT NULL,
  `storage_type` ENUM('Local', 'S3') DEFAULT 'S3',
  `academic_year` VARCHAR(255) NOT NULL,
  `semester_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`student_id`),
  INDEX (`registration_no`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`semester_id`) REFERENCES `semesters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
