import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  subject_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_practical: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: '1'
  }
}, {
  tableName: 'subjects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['course_id', 'subject_name'],
      name: 'unique_course_subject'
    }
  ]
});

export default Subject;

