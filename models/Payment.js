import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: true
  },
  merchant_txn_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payment_payload: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bank_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  atom_txn_id: {
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
  transaction_date: {
    type: DataTypes.STRING,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  fee_type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'form_fee',
    comment: 'Type of fee: form_fee, admission_fee, etc.'
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default Payment;

