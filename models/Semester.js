import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Semester = sequelize.define('Semester', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
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
    unique: false // Not globally unique, but unique per course
  },
  order: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  registration_enabled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Enable registration for this semester (only one can be enabled per course)'
  },
  fee_payment_enabled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Enable fee payment for this semester (only one can be enabled per course)'
  },
  is_skill_required: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Is skill selection required for this semester'
  },
  is_cocurricular_required: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Is co-curricular selection required for this semester'
  },
  approval_required: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '0: Not required (default), 1: Required'
  }
}, {
  tableName: 'semesters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['course_id', 'order'],
      name: 'unique_course_order'
    },
    {
      unique: true,
      fields: ['course_id', 'slug'],
      name: 'unique_course_slug'
    }
  ]
});

export default Semester;

