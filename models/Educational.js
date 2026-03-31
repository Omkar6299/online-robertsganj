import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Educational = sequelize.define('Educational', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  registration_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  class_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  board_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  school_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year_of_passing: {
    type: DataTypes.STRING,
    allowNull: false
  },
  division: {
    type: DataTypes.STRING,
    allowNull: true
  },
  roll_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  percentage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total_marks: {
    type: DataTypes.STRING,
    allowNull: true
  },
  obtained_marks: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mark_type: {
    type: DataTypes.ENUM('Percentage', 'CGPA'),
    allowNull: true
  },
  cgpa: {
    type: DataTypes.STRING,
    allowNull: true
  },
  max_cgpa: {
    type: DataTypes.STRING,
    defaultValue: '10'
  },
  subject_details: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'educationals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default Educational;

