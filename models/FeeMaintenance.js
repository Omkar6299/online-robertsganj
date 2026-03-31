import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const FeeMaintenance = sequelize.define('FeeMaintenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Course: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  User: {
    type: DataTypes.CHAR(45),
    allowNull: true
  },
  Total_Fee_Amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Fee_Name: {
    type: DataTypes.CHAR(100),
    allowNull: true
  },
  General_fee_Amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Girls_fee_Amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Minority_Fee_Amount: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  OBC_fee_Amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  SC_fee_Amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ST_fee_Amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  Practical_Fee: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  late_fee: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_late_fee_applicable: {
    type: DataTypes.TINYINT,
    defaultValue: 0
  },
  fee_Type: {
    type: DataTypes.CHAR(5),
    allowNull: true
  },
  fee_Active: {
    type: DataTypes.CHAR(10),
    allowNull: true
  },
  Student_Type: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  Ex_Student: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  Lab_Fee_Type: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'fee_maintenance',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default FeeMaintenance;
