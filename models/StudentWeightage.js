import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const StudentWeightage = sequelize.define('StudentWeightage', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    registration_no: {
        type: DataTypes.STRING,
        allowNull: false
    },
    weightage_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'student_weightages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: false
});

export default StudentWeightage;
