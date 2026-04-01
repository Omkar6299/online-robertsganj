import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const DocumentType = sequelize.define('DocumentType', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'document_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default DocumentType;
