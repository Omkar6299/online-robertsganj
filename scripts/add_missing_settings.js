import { sequelize } from '../config/database.js';

async function run() {
    const t = await sequelize.transaction();
    try {
        const settingsToInsert = [
            {
                key: 'atom_reg_product_id',
                value: 'GOVTPGCOLLEGE',
                display_name: 'Registration Product ID',
                description: 'Product ID for student registration fees.',
                type: 'text',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                key: 'atom_adm_product_id',
                value: 'COLLEGE',
                display_name: 'Admission Product ID',
                description: 'Product ID for admission and other fees.',
                type: 'text',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                key: 'enable_payment_process',
                value: 'false',
                display_name: 'Enable Payment Process',
                description: 'If enabled, students will be required to pay registration and admission fees. If disabled, all processes will be free.',
                type: 'boolean',
                created_at: new Date(),
                updated_at: new Date()
            }
        ];

        for (const setting of settingsToInsert) {
            const [results] = await sequelize.query('SELECT id FROM settings WHERE `key` = ?', {
                replacements: [setting.key],
                transaction: t
            });
            if (results.length === 0) {
                await sequelize.query(
                    'INSERT INTO settings (`key`, `value`, `display_name`, `description`, `type`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    {
                        replacements: [setting.key, setting.value, setting.display_name, setting.description, setting.type, setting.created_at, setting.updated_at],
                        transaction: t
                    }
                );
                console.log(`Inserted ${setting.key}`);
            } else {
                console.log(`${setting.key} already exists`);
            }
        }
        await t.commit();
        console.log('Successfully synced missing settings!');
        process.exit(0);
    } catch (error) {
        if (t) await t.rollback();
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
