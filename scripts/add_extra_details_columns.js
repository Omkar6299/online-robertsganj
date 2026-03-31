import { sequelize } from '../config/database.js';

async function addExtraDetailsColumns() {
    try {
        console.log('Starting migration to add extra details columns...');

        // 1. Columns for 'students' table
        const studentColumns = [
            { name: 'caste', type: 'VARCHAR(100)' },
            { name: 'cast_certificate_no', type: 'VARCHAR(100)' },
            { name: 'blood_group', type: 'VARCHAR(20)' },
            { name: 'computer_literate', type: 'VARCHAR(10)', default: "'No'" },
            { name: 'extracurricular_activity', type: 'VARCHAR(255)' },
            { name: 'is_previous_student', type: 'VARCHAR(10)', default: "'No'" },
            { name: 'is_18_plus', type: 'VARCHAR(10)', default: "'No'" },
            { name: 'epic_no', type: 'VARCHAR(50)' },
            { name: 'disability_percentage', type: 'VARCHAR(20)' },
            { name: 'samarth_no', type: 'VARCHAR(100)' },
            { name: 'year_gap', type: 'VARCHAR(10)', default: "'No'" },
            { name: 'year_gap_after_inter', type: 'VARCHAR(20)' },
            { name: 'gap_reason', type: 'TEXT' },
            { name: 'adhar_no', type: 'VARCHAR(20)' },
            { name: 'local_guadian', type: 'VARCHAR(255)' },
            { name: 'local_guadian_address', type: 'TEXT' },
            { name: 'guadian_contact', type: 'VARCHAR(20)' }
        ];

        for (const col of studentColumns) {
            try {
                await sequelize.query(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type} ${col.default ? 'DEFAULT ' + col.default : ''} AFTER dob;`);
                console.log(`Added ${col.name} to students table.`);
            } catch (err) {
                if (err.parent && err.parent.code === 'ER_DUP_COLUMN_NAMES') {
                    console.log(`Column ${col.name} already exists in students table.`);
                } else {
                    console.error(`Error adding ${col.name} to students table:`, err.message);
                }
            }
        }

        // 2. Columns for 'student_personal_details' table
        const personalDetailColumns = [
            { name: 'mother_occupation', type: 'VARCHAR(255)' },
            { name: 'family_annual_income', type: 'VARCHAR(100)' },
            { name: 'income_certificate_no', type: 'VARCHAR(100)' },
            { name: 'bank_name', type: 'VARCHAR(255)' },
            { name: 'bank_account_no', type: 'VARCHAR(50)' },
            { name: 'ifsc_code', type: 'VARCHAR(50)' }
        ];

        for (const col of personalDetailColumns) {
            try {
                await sequelize.query(`ALTER TABLE student_personal_details ADD COLUMN ${col.name} ${col.type} AFTER father_annual_income;`);
                console.log(`Added ${col.name} to student_personal_details table.`);
            } catch (err) {
                if (err.parent && err.parent.code === 'ER_DUP_COLUMN_NAMES') {
                    console.log(`Column ${col.name} already exists in student_personal_details table.`);
                } else {
                    console.error(`Error adding ${col.name} to student_personal_details table:`, err.message);
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addExtraDetailsColumns();
