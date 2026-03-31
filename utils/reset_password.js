import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const resetPassword = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'superadmin@gmail.com';
        const newPassword = 'admin123';

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        console.log(`Password for ${email} has been updated to: ${newPassword}`);
        process.exit(0);
    } catch (error) {
        console.error('Password reset failed:', error);
        process.exit(1);
    }
};

resetPassword();
