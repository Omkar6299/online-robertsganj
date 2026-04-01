import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CourseSemesterDocument = sequelize.define('CourseSemesterDocument', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  document_type_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  is_required: {
    type: DataTypes.ENUM('Required', 'Optional', 'Hidden'),
    defaultValue: 'Required'
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'course_semester_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['course_id', 'semester_id', 'document_type_id']
    }
  ]
});

export default CourseSemesterDocument;
