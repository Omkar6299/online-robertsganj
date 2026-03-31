import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    // Note: Email uniqueness is enforced at the students table level per academic year
    // Multiple users can have the same email (e.g., failed payment attempts)
    // But only one student per email per academic year
    validate: {
      isEmail: true
    }
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Student'
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remember_token: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default User;

