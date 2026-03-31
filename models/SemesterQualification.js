import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SemesterQualification = sequelize.define('SemesterQualification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  semester_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  qualification_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  required_optional_hidden: {
    type: DataTypes.ENUM('required', 'optional', 'hidden'),
    allowNull: false,
    defaultValue: 'required'
  },
  max_year_gap: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  is_skill_required: {
    type: DataTypes.STRING,
    defaultValue: '0',
    // comment: '0 = false, 1 = true'
  },
  is_cocurricular_required: {
    type: DataTypes.STRING,
    defaultValue: '0',
    // comment: '0 = false, 1 = true'
  }
}, {
  tableName: 'semester_qualifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['semester_id', 'qualification_id'],
      name: 'unique_semester_qualification'
    }
  ]
});

export default SemesterQualification;

