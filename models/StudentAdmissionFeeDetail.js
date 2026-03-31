import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const StudentAdmissionFeeDetail = sequelize.define('StudentAdmissionFeeDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  registration_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  semester_type: {
    type: DataTypes.ENUM('Even', 'Odd'),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  merchant_txn_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  bank_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  atom_txn_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Success'
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'student_admission_fee_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default StudentAdmissionFeeDetail;
