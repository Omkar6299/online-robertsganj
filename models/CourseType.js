import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CourseType = sequelize.define('CourseType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: '1'
  }
}, {
  tableName: 'course_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default CourseType;

