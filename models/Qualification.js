import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Qualification = sequelize.define('Qualification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: '1'
  }
}, {
  tableName: 'qualifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default Qualification;

