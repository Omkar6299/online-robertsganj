import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_type_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
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
  },
  is_major1_required: {
    type: DataTypes.STRING,
    defaultValue: '1'
  },
  is_major2_required: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  is_minor_required: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default Course;

