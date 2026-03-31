-- Stored Procedure for Admitted Students Report
SET NAMES utf8mb4;
-- This handles filtering by Academic Year, Course, Semester, Registration No, Gender, Category, and Date Range.
-- Using SET NAMES to ensure UTF8MB4 during creation.

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
        ANY_VALUE(s.id) as id,
        ANY_VALUE(s.user_id) as user_id,
        s.registration_no,
        ANY_VALUE(s.gender) as gender,
        ANY_VALUE(s.category) as category,
        ANY_VALUE(s.sub_category) as sub_category,
        ANY_VALUE(s.father_name) as father_name,
        ANY_VALUE(s.mother_name) as mother_name,
        ANY_VALUE(s.dob) as dob,
        ANY_VALUE(s.religion) as religion,
        ANY_VALUE(s.caste) as caste,
        ANY_VALUE(s.adhar_no) as adhar_no,
        ANY_VALUE(s.samarth_no) as samarth_no,
        ANY_VALUE(s.whatsapp_number) as whatsapp_number,
        ANY_VALUE(s.blood_group) as blood_group,
        ANY_VALUE(s.mailing_address) as mailing_address,
        ANY_VALUE(s.mailing_state) as mailing_state,
        ANY_VALUE(s.mailing_district) as mailing_district,
        ANY_VALUE(s.mailing_tehsil) as mailing_tehsil,
        ANY_VALUE(s.mailing_pincode) as mailing_pincode,
        ANY_VALUE(s.permanent_address) as permanent_address,
        ANY_VALUE(s.permanent_state) as permanent_state,
        ANY_VALUE(s.permanent_district) as permanent_district,
        ANY_VALUE(s.permanent_tehsil) as permanent_tehsil,
        ANY_VALUE(s.permanent_pincode) as permanent_pincode,
        ANY_VALUE(s.bank_name) as bank_name,
        ANY_VALUE(s.bank_account_no) as bank_account_no,
        ANY_VALUE(s.ifsc_code) as ifsc_code,
        ANY_VALUE(s.admission_status) as admission_status,
        ANY_VALUE(s.created_at) AS student_created_at,
        ANY_VALUE(u.name) AS student_name,
        ANY_VALUE(u.phone) AS student_phone,
        ANY_VALUE(u.email) AS student_email,
        ANY_VALUE(c.name) AS course_name,
        ANY_VALUE(sem.name) AS semester_name,
        ay.session AS academic_session,
        ANY_VALUE(sub1.subject_name) AS major1_name,
        ANY_VALUE(sub2.subject_name) AS major2_name,
        ANY_VALUE(sub3.subject_name) AS minor_name,
        ANY_VALUE(f.created_at) AS admission_date,
        ANY_VALUE(f.amount) AS paid_amount,
        -- Extra fields to match Sequelize nested structure in controller mapping
        ANY_VALUE(u.name) AS `user.name`,
        ANY_VALUE(u.phone) AS `user.phone`,
        ANY_VALUE(u.email) AS `user.email`,
        ANY_VALUE(c.name) AS `courseName.name`,
        ANY_VALUE(sem.name) AS `semsterName.name`
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN semesters sem ON s.year = sem.id
    LEFT JOIN academic_years ay ON s.academic_year = ay.id
    LEFT JOIN subjects sub1 ON s.major1_id = sub1.id
    LEFT JOIN subjects sub2 ON s.major2_id = sub2.id
    LEFT JOIN subjects sub3 ON s.minor_id = sub3.id
    -- Join with student_admission_fee_details to ensure they have paid (Success status)
    -- Filter for Odd semester only to prevent duplication in yearly report
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

DELIMITER ;
