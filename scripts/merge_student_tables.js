import { sequelize } from '../config/database.js';

async function migrateData() {
    const transaction = await sequelize.transaction();
    try {
        console.log('Starting migration: Merging student_personal_details into students...');

        // 1. Add missing columns to students table
        const columnsToAdd = [
            { name: 'father_occupation', type: 'VARCHAR(255)' },
            { name: 'father_annual_income', type: 'VARCHAR(100)' },
            { name: 'mother_occupation', type: 'VARCHAR(255)' },
            { name: 'family_annual_income', type: 'VARCHAR(100)' },
            { name: 'income_certificate_no', type: 'VARCHAR(255)' },
            { name: 'mailing_address', type: 'TEXT' },
            { name: 'mailing_state', type: 'VARCHAR(255)' },
            { name: 'mailing_district', type: 'VARCHAR(255)' },
            { name: 'mailing_tehsil', type: 'VARCHAR(255)' },
            { name: 'mailing_pincode', type: 'VARCHAR(10)' },
            { name: 'permanent_address', type: 'TEXT' },
            { name: 'permanent_state', type: 'VARCHAR(255)' },
            { name: 'permanent_district', type: 'VARCHAR(255)' },
            { name: 'permanent_tehsil', type: 'VARCHAR(255)' },
            { name: 'permanent_pincode', type: 'VARCHAR(10)' },
            { name: 'bank_name', type: 'VARCHAR(255)' },
            { name: 'bank_account_no', type: 'VARCHAR(255)' },
            { name: 'ifsc_code', type: 'VARCHAR(50)' }
        ];

        const [existingColumns] = await sequelize.query('SHOW COLUMNS FROM students');
        const existingColumnNames = existingColumns.map(c => c.Field);

        for (const col of columnsToAdd) {
            if (!existingColumnNames.includes(col.name)) {
                console.log(`Adding column ${col.name}...`);
                await sequelize.query(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type} NULL`, { transaction });
            }
        }

        // 2. Migrate data from student_personal_details to students
        console.log('Migrating data...');
        const [details] = await sequelize.query('SELECT * FROM student_personal_details');

        for (const detail of details) {
            await sequelize.query(`
        UPDATE students SET
          father_occupation = :father_occupation,
          father_annual_income = :father_annual_income,
          mother_occupation = :mother_occupation,
          family_annual_income = :family_annual_income,
          income_certificate_no = :income_certificate_no,
          mailing_address = :mailing_address,
          mailing_state = :mailing_state,
          mailing_district = :mailing_district,
          mailing_tehsil = :mailing_tehsil,
          mailing_pincode = :mailing_pincode,
          permanent_address = :permanent_address,
          permanent_state = :permanent_state,
          permanent_district = :permanent_district,
          permanent_tehsil = :permanent_tehsil,
          permanent_pincode = :permanent_pincode,
          bank_name = :bank_name,
          bank_account_no = :bank_account_no,
          ifsc_code = :ifsc_code
        WHERE user_id = :user_id
      `, {
                replacements: {
                    user_id: detail.user_id,
                    father_occupation: detail.father_occupation,
                    father_annual_income: detail.father_annual_income,
                    mother_occupation: detail.mother_occupation,
                    family_annual_income: detail.family_annual_income,
                    income_certificate_no: detail.income_certificate_no,
                    mailing_address: detail.mailing_address,
                    mailing_state: detail.mailing_state,
                    mailing_district: detail.mailing_district,
                    mailing_tehsil: detail.mailing_tehsil,
                    mailing_pincode: detail.mailing_pincode,
                    permanent_address: detail.permanent_address,
                    permanent_state: detail.permanent_state,
                    permanent_district: detail.permanent_district,
                    permanent_tehsil: detail.permanent_tehsil,
                    permanent_pincode: detail.permanent_pincode,
                    bank_name: detail.bank_name,
                    bank_account_no: detail.bank_account_no,
                    ifsc_code: detail.ifsc_code
                },
                transaction
            });
        }

        // 3. Drop student_personal_details table
        console.log('Dropping table student_personal_details...');
        await sequelize.query('DROP TABLE student_personal_details', { transaction });

        await transaction.commit();
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateData();
