import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const StudentFeeDetail = sequelize.define('StudentFeeDetail', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  course_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  semester_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester_type: {
    type: DataTypes.ENUM('Even', 'Odd'),
    allowNull: true
  },
  challan_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  payment_mode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transaction_date: {
    type: DataTypes.STRING,
    allowNull: true
  },
  txnInitDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  txnCompleteDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bank_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  merchant_txn_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  atom_txn_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'student_fees_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default StudentFeeDetail;
