import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const StudentDocument = sequelize.define('StudentDocument', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  registration_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  document_type_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  storage_type: {
    type: DataTypes.ENUM('Local', 'S3'),
    defaultValue: 'S3'
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'student_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default StudentDocument;
