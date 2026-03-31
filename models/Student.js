import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    index: true
  },
  student_id: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true,
    comment: 'Common unique identifier for a student across all academic years'
  },
  registration_no: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true
  },
  course_type_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  course_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  year: {
    type: DataTypes.STRING,
    allowNull: false
  },
  academic_year: {
    type: DataTypes.STRING,
    allowNull: true
  },
  father_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mother_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dob: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sub_category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  caste_certificate_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  religion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  weightage: {
    type: DataTypes.JSON,
    allowNull: true
  },
  whatsapp_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  aadhar_card_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  samarth_registration_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sign: {
    type: DataTypes.STRING,
    allowNull: true
  },
  personal_status: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  weightage_status: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  educational_status: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  address_status: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  additional_status: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  subject_status: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photographsign_status: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  declaration_status: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  admission_status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Disapproved'),
    defaultValue: 'Pending'
  },
  major1_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  major2_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  minor_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  skill_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  cocurricular_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true
  },
  caste: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cast_certificate_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  blood_group: {
    type: DataTypes.STRING,
    allowNull: true
  },
  computer_literate: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'No'
  },
  extracurricular_activity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_previous_student: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'No'
  },
  is_18_plus: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'No'
  },
  epic_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  disability_percentage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  samarth_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year_gap: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'No'
  },
  year_gap_after_inter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gap_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adhar_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  local_guadian: {
    type: DataTypes.STRING,
    allowNull: true
  },
  local_guadian_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  guadian_contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  father_occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  father_annual_income: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mother_occupation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  family_annual_income: {
    type: DataTypes.STRING,
    allowNull: true
  },
  income_certificate_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mailing_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mailing_state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mailing_district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mailing_tehsil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mailing_pincode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permanent_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permanent_state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permanent_district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permanent_tehsil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permanent_pincode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bank_account_no: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ifsc_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
}, {
  tableName: 'students',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false
});

export default Student;