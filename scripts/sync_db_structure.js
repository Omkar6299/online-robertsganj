// scripts/sync_db_structure.js
import { sequelize } from '../config/database.js';

async function syncStructure() {
    try {
        console.log('--- Starting Database Structure Sync ---');

        // 1. Add missing columns to 'students' table
        const studentAlterations = [
            { name: 'research_project_id', type: 'BIGINT UNSIGNED', after: 'cocurricular_id' }
        ];

        for (const col of studentAlterations) {
            try {
                // Check if column exists first to be safer, but ALTER TABLE with error handling is also fine
                await sequelize.query(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type} AFTER ${col.after};`);
                console.log(`[OK] Added ${col.name} to students table.`);
            } catch (err) {
                if (err.parent && (err.parent.code === 'ER_DUP_COLUMN_NAMES' || err.parent.errno === 1060)) {
                    console.log(`[SKIP] Column ${col.name} already exists in students table.`);
                } else {
                    console.error(`[ERROR] ${col.name}:`, err.message);
                }
            }
        }

        // 2. Add missing configuration columns to 'semesters' table
        const semesterAlterations = [
            { name: 'is_major1_enabled', type: 'INT DEFAULT 1', after: 'is_cocurricular_required' },
            { name: 'is_major2_enabled', type: 'INT DEFAULT 1', after: 'is_major1_enabled' },
            { name: 'is_minor_enabled', type: 'INT DEFAULT 1', after: 'is_major2_enabled' },
            { name: 'is_research_project_enabled', type: 'INT DEFAULT 0', after: 'is_minor_enabled' }
        ];

        for (const col of semesterAlterations) {
            try {
                await sequelize.query(`ALTER TABLE semesters ADD COLUMN ${col.name} ${col.type} AFTER ${col.after};`);
                console.log(`[OK] Added ${col.name} to semesters table.`);
            } catch (err) {
                if (err.parent && (err.parent.code === 'ER_DUP_COLUMN_NAMES' || err.parent.errno === 1060)) {
                    console.log(`[SKIP] Column ${col.name} already exists in semesters table.`);
                } else {
                    console.error(`[ERROR] ${col.name}:`, err.message);
                }
            }
        }

        console.log('--- Database Sync Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('--- Database Sync Failed ---', error);
        process.exit(1);
    }
}

syncStructure();
