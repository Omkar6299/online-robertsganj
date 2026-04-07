import { Setting } from '../models/index.js';
import siteconfig from '../config/siteconfig.js';
import dotenv from 'dotenv';

dotenv.config();

const seedSettings = async () => {
  try {
    console.log('Seeding settings...');

    const initialSettings = [
      {
        key: 'is_first_time_college',
        value: process.env.IS_FIRST_TIME_COLLEGE || 'true',
        display_name: 'Is First Time College',
        description: 'Set to true if the college is using the system for the first time.',
        type: 'boolean'
      },
      {
        key: 'registration_amount',
        value: String(siteconfig.registration_amount || '100.00'),
        display_name: 'Registration Amount',
        description: 'The fee amount for student registration.',
        type: 'number'
      },
      {
        key: 'min_student_age',
        value: String(siteconfig.min_student_age || '10'),
        display_name: 'Minimum Student Age',
        description: 'The minimum age required for a student to register.',
        type: 'number'
      },
      {
        key: 'atom_environment',
        value: siteconfig.atom_environment || 'demo',
        display_name: 'Atom Payment Environment',
        description: 'Payment gateway environment: demo or live.',
        type: 'select'
      }
    ];

    for (const setting of initialSettings) {
      await Setting.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
      console.log(`Setting [${setting.key}] ensured.`);
    }

    console.log('Settings seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding settings:', error);
    process.exit(1);
  }
};

seedSettings();
