import { sequelize } from '../config/database.js';
import StudentWeightage from '../models/StudentWeightage.js';

async function setup() {
    try {
        await StudentWeightage.sync();
        console.log('Successfully synced StudentWeightage table');
    } catch (error) {
        console.error('Error syncing StudentWeightage table:', error);
    } finally {
        process.exit();
    }
}

setup();
