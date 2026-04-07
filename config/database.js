import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  dialectModule: mysql2,
  logging: false,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false // Required for some external providers like Aiven
    }
  }
}
);

export { sequelize };
