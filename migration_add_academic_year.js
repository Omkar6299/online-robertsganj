import { sequelize } from './config/database.js';
import { DataTypes, QueryTypes } from 'sequelize';
import Student from './models/Student.js';

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Add academic_year column if it doesn't exist
        const queryInterface = sequelize.getQueryInterface();

        const edTableInfo = await queryInterface.describeTable('educationals');
        if (!edTableInfo.academic_year) {
            console.log('Adding academic_year to educationals...');
            await queryInterface.addColumn('educationals', 'academic_year', {
                type: DataTypes.STRING,
                allowNull: true
            });
        }

        const swTableInfo = await queryInterface.describeTable('student_weightages');
        if (!swTableInfo.academic_year) {
            console.log('Adding academic_year to student_weightages...');
            await queryInterface.addColumn('student_weightages', 'academic_year', {
                type: DataTypes.STRING,
                allowNull: true
            });
        }

        console.log('Columns added successfully. Starting backfill...');

        // 2. Backfill academic_year by looking up the most recent Student record for the user_id
        const userIdsEd = await sequelize.query('SELECT DISTINCT user_id FROM educationals', { type: QueryTypes.SELECT });
        const userIdsSw = await sequelize.query('SELECT DISTINCT user_id FROM student_weightages', { type: QueryTypes.SELECT });

        const allUserIds = new Set([
            ...userIdsEd.map(r => r.user_id),
            ...userIdsSw.map(r => r.user_id)
        ]);

        console.log(`Found ${allUserIds.size} unique users to backfill.`);

        for (const userId of allUserIds) {
            // Find most recent student record for this user
            const student = await Student.findOne({
                where: { user_id: userId },
                order: [['created_at', 'DESC']]
            });

            if (student && student.academic_year) {
                const acaYear = student.academic_year;

                // Update educationals
                await sequelize.query(
                    'UPDATE educationals SET academic_year = :acaYear WHERE user_id = :userId AND academic_year IS NULL',
                    {
                        replacements: { acaYear, userId },
                        type: QueryTypes.UPDATE
                    }
                );

                // Update student_weightages
                await sequelize.query(
                    'UPDATE student_weightages SET academic_year = :acaYear WHERE user_id = :userId AND academic_year IS NULL',
                    {
                        replacements: { acaYear, userId },
                        type: QueryTypes.UPDATE
                    }
                );
            }
        }

        console.log('Migration and backfill completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
