import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Skills = sequelize.define('Skills', {
  id: {
    type: DataTypes.INTEGER,
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
  course_type_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
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
  tableName: 'skills',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default Skills;

