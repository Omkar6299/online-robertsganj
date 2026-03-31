// Import all models
import User from './User.js';
import Admin from './Admin.js';
import Student from './Student.js';
import Course from './Course.js';
import CourseType from './CourseType.js';
import Semester from './Semester.js';
import AcademicYear from './AcademicYear.js';
import Role from './Role.js';

import Payment from './Payment.js';
import Subject from './Subject.js';
import Qualification from './Qualification.js';
import Educational from './Educational.js';
import Weightage from './Weightage.js';
import SemesterQualification from './SemesterQualification.js';
import State from './State.js';
import Skills from './Skills.js';
import Cocurricular from './Cocurricular.js';
import StudentWeightage from './StudentWeightage.js';
import StudentAdmissionFeeDetail from './StudentAdmissionFeeDetail.js';
import StudentFeeDetail from './StudentFeeDetail.js';
import FeeMaintenance from './FeeMaintenance.js';

// Define associations after all models are loaded
// Student associations
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Student.belongsTo(CourseType, { foreignKey: 'course_type_id', as: 'coursetype' });
Student.belongsTo(Course, { foreignKey: 'course_id', as: 'courseName' });
Student.belongsTo(Semester, { foreignKey: 'year', as: 'semsterName', constraints: false });
Student.belongsTo(AcademicYear, { foreignKey: 'academic_year', as: 'academicYear', constraints: false });

Student.belongsTo(Subject, { foreignKey: 'major1_id', as: 'major1' });
Student.belongsTo(Subject, { foreignKey: 'major2_id', as: 'major2' });
Student.belongsTo(Subject, { foreignKey: 'minor_id', as: 'minor' });
Student.belongsTo(Skills, { foreignKey: 'skill_id', as: 'skill' });
Student.belongsTo(Cocurricular, { foreignKey: 'cocurricular_id', as: 'cocurricular' });

Student.hasMany(StudentAdmissionFeeDetail, { foreignKey: 'user_id', sourceKey: 'user_id', as: 'admissionFeeDetails' });
StudentAdmissionFeeDetail.belongsTo(Student, { foreignKey: 'user_id', targetKey: 'user_id', as: 'student' });
StudentAdmissionFeeDetail.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'user' });
StudentAdmissionFeeDetail.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester', constraints: false });

Student.hasMany(StudentFeeDetail, { foreignKey: 'user_id', sourceKey: 'user_id', as: 'feeLogs' });
StudentFeeDetail.belongsTo(Student, { foreignKey: 'user_id', targetKey: 'user_id', as: 'student' });
StudentFeeDetail.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'user' });

Student.hasMany(StudentWeightage, { foreignKey: 'user_id', sourceKey: 'user_id', as: 'studentWeightages' });
StudentWeightage.belongsTo(Student, { foreignKey: 'user_id', targetKey: 'user_id', as: 'student' });
StudentWeightage.belongsTo(Weightage, { foreignKey: 'weightage_id', as: 'weightageInfo' });

// Course associations
Course.belongsTo(CourseType, { foreignKey: 'course_type_id', as: 'courseType' });

// Semester associations
Semester.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });



// SemesterQualification associations
Semester.hasMany(SemesterQualification, { foreignKey: 'semester_id', as: 'qualifications' });
SemesterQualification.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });
SemesterQualification.belongsTo(Qualification, { foreignKey: 'qualification_id', as: 'qualification' });

// Subject associations
Subject.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Skills associations
Skills.belongsTo(CourseType, { foreignKey: 'course_type_id', as: 'courseType', constraints: false });
Skills.belongsTo(Course, { foreignKey: 'course_id', as: 'courseName' });
Skills.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semsterName' });

// Cocurricular associations
Cocurricular.belongsTo(CourseType, { foreignKey: 'course_type_id', as: 'courseType', constraints: false });
Cocurricular.belongsTo(Course, { foreignKey: 'course_id', as: 'courseName' });
Cocurricular.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semsterName' });

Educational.belongsTo(Qualification, { foreignKey: 'class_name', targetKey: 'id', as: 'qualification', constraints: false });

// FeeMaintenance associations
FeeMaintenance.belongsTo(Course, { foreignKey: 'Course', as: 'course' });
FeeMaintenance.belongsTo(Semester, { foreignKey: 'semester', as: 'semesterInfo' });

// Export all models
export {
  User,
  Admin,
  Student,
  Course,
  CourseType,
  Semester,
  AcademicYear,
  Payment,
  Subject,
  Qualification,
  Educational,
  Weightage,
  SemesterQualification,
  State,
  Skills,
  Cocurricular,
  StudentWeightage,
  StudentAdmissionFeeDetail,
  StudentFeeDetail,
  FeeMaintenance,
  Role
};
