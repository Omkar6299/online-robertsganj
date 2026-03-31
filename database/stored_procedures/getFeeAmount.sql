DELIMITER //

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

    -- Fetch fee details for the given Course and Semester
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

    -- Determine Base Amount based on Gender and Category
    IF p_gender = 'Female' THEN
        SET v_base_amount = v_girls_fee;
    ELSE
        -- Male: Pick category-specific amount
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
            -- Fallback to total fee if no category matches
            SET v_base_amount = v_total_fee_amount;
        END IF;
    END IF;

    -- Calculate Practical Multiplier
    IF p_subject_ids IS NOT NULL AND p_subject_ids != '' THEN
        SELECT COUNT(*) INTO v_practical_count FROM subjects 
        WHERE FIND_IN_SET(id, p_subject_ids) AND is_practical = 1;
    ELSE
        SET v_practical_count = 0;
    END IF;

    SET v_total_practical_fee = v_practical_count * v_practical_fee;

    -- Handle Late Fee
    IF v_is_late_fee_applicable = 1 THEN
        SET v_late_fee_to_add = v_late_fee_amount;
    ELSE
        SET v_late_fee_to_add = 0;
    END IF;

    -- Final Return
    SELECT (v_base_amount + v_total_practical_fee + v_late_fee_to_add) AS total_fee_amount;

END //

DELIMITER ;
