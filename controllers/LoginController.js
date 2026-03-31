import User from '../models/User.js';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import CourseType from '../models/CourseType.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import AcademicYear from '../models/AcademicYear.js';

import { hashPassword } from '../utils/helpers.js';
import { admissionLoginSchema, registrationFeesPaymentSchema } from '../validations/authValidation.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect, sendErrorResponse } from '../utils/responseHelper.js';
import { sequelize } from '../config/database.js';
import siteconfig from '../config/siteconfig.js';
import { Op } from 'sequelize';
import PaymentService from '../utils/services/PaymentService.js';

export const admission_login = (req, res) => {
  // Get pre-filled values from query parameters (for redirect after payment)
  const oldInput = {
    transaction_id: req.query.transaction_id || '',
    phone: req.query.phone || ''
  };

  res.render('frontend/auth/admission_login', {
    title: 'Apply Online - Student Login',
    oldInput: oldInput
  });
};

export const admission_login_post = async (req, res) => {
  try {
    const { error, value } = admissionLoginSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'frontend/auth/admission_login', {
        title: 'Admission Login'
      });
    }

    const { phone, transaction_id } = value;

    console.log('=== ADMISSION LOGIN ATTEMPT ===');
    console.log('Transaction ID:', transaction_id);
    console.log('Phone:', phone);

    // Step 1: Find user by transaction_id and phone
    const user = await User.findOne({
      where: {
        transaction_id: transaction_id,
        phone: phone
      }
    });

    if (!user) {
      console.log('User not found with transaction_id and phone');
      req.flash('error', 'Invalid Transaction ID or Mobile Number.');
      return res.render('frontend/auth/admission_login', {
        title: 'Admission Login',
        oldInput: req.body
      });
    }

    console.log('User found:', { user_id: user.id, name: user.name });

    // Step 2: Get active academic year
    const activeAcademicYear = await AcademicYear.findOne({
      where: { status: 'Active' }
    });

    if (!activeAcademicYear) {
      console.error('No active academic year found');
      req.flash('error', 'No active academic year found. Please contact administrator.');
      return res.render('frontend/auth/admission_login', {
        title: 'Admission Login',
        oldInput: req.body
      });
    }

    console.log('Active academic year:', activeAcademicYear.id);

    // Step 3: Check if payment record exists with status 'Success' for this transaction_id and active academic year
    const payment = await Payment.findOne({
      where: {
        merchant_txn_id: transaction_id,
        user_id: String(user.id),
        status: 'Success'
      }
    });

    if (!payment) {
      console.log('=== PAYMENT CHECK FAILED ===');
      console.log('Payment record not found or not successful');
      console.log('Payment check criteria:', {
        transaction: transaction_id,
        user_id: user.id,
        status: 'Success'
      });

      // Check if payment exists but with different status
      const paymentCheck = await Payment.findOne({
        where: {
          merchant_txn_id: transaction_id,
          user_id: String(user.id)
        }
      });

      if (paymentCheck) {
        console.log('Payment found but status is:', paymentCheck.status);
        req.flash('error', `Payment found but status is '${paymentCheck.status}'. Payment must be successful to proceed with admission.`);
      } else {
        req.flash('error', 'Payment not found for this transaction ID. Please ensure your payment was completed successfully.');
      }

      return res.render('frontend/auth/admission_login', {
        title: 'Admission Login',
        oldInput: req.body
      });
    }

    console.log('=== PAYMENT CHECK PASSED ===');
    console.log('Payment record found:', {
      payment_id: payment.id,
      merchant_txn_id: payment.merchant_txn_id,
      status: payment.status,
      amount: payment.amount,
      user_id: payment.user_id
    });

    // Step 3.5: Verify payment is for active academic year (check registration data in payment_payload)
    if (payment.payment_payload) {
      try {
        const registrationData = JSON.parse(payment.payment_payload);
        const paymentAcademicYear = String(registrationData.academic_year || '');
        const activeAcademicYearId = String(activeAcademicYear.id);

        console.log('Payment academic year check:', {
          payment_academic_year: paymentAcademicYear,
          active_academic_year: activeAcademicYearId,
          match: paymentAcademicYear === activeAcademicYearId
        });

        if (paymentAcademicYear && paymentAcademicYear !== activeAcademicYearId) {
          console.log('Payment is for different academic year');
          req.flash('error', `This payment is for a different academic session. Please register for the current active academic session.`);
          return res.render('frontend/auth/admission_login', {
            title: 'Admission Login',
            oldInput: req.body
          });
        }
      } catch (parseError) {
        console.warn('Could not parse payment registration data for academic year check:', parseError);
        // Continue with other checks even if parsing fails
      }
    }

    // Step 4: Check if student record exists for this user_id and active academic year
    const student = await Student.findOne({
      where: {
        user_id: String(user.id),
        academic_year: String(activeAcademicYear.id)
      }
    });

    if (!student) {
      console.log('Student record not found for active academic year');
      console.log('Student check:', {
        user_id: user.id,
        academic_year: activeAcademicYear.id
      });
      req.flash('error', 'Student record not found for the active academic session. Please contact support.');
      return res.render('frontend/auth/admission_login', {
        title: 'Admission Login',
        oldInput: req.body
      });
    }

    console.log('Student record found:', {
      student_id: student.id,
      registration_no: student.registration_no,
      academic_year: student.academic_year
    });

    // All checks passed - allow login
    console.log('=== ALL CHECKS PASSED - LOGIN SUCCESSFUL ===');
    console.log('User ID:', user.id);
    console.log('Student ID:', student.id);
    console.log('Registration Number:', student.registration_no);

    req.session.admission_user_id = user.id;
    req.session.admission_name = user.name;
    flashSuccessAndRedirect(req, res, 'Login successful! You can now proceed with your admission form.', '/student/dashboard');
  } catch (error) {
    console.error('=== ADMISSION LOGIN ERROR ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    handleError(req, res, error, 'An error occurred. Please try again.', null, 'frontend/auth/admission_login', {
      title: 'Admission Login'
    });
  }
};

export const admission_logout = (req, res) => {
  req.session.admission_user_id = null;
  req.session.admission_name = null;
  flashSuccessAndRedirect(req, res, 'Logged out successfully.', '/admission_login');
};

// Helper function to format date to DD-MM-YYYY
const formatDateDDMMYYYY = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to get DOB date restrictions
const getDobDateRestrictions = () => {
  // Calculate maximum date (oldest date) based on minimum age
  // This is the latest date a student can be born to meet the minimum age requirement
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - siteconfig.min_student_age, today.getMonth(), today.getDate());
  const maxDateString = maxDate.toISOString().split('T')[0];
  const maxDateFormatted = formatDateDDMMYYYY(maxDateString);

  // Calculate minimum date (newest date) - typically 100 years ago as a reasonable limit
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const minDobDate = minDate.toISOString().split('T')[0];

  return { minDobDate, maxDobDate: maxDateString, maxDobDateFormatted: maxDateFormatted };
};

export const registration_fees_payment = async (req, res) => {
  try {
    console.log('\n=== REGISTRATION FEES PAYMENT PAGE (GET) ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);

    // Get flash messages
    // Note: Global middleware in server.js (lines 52-59) already consumes flash messages
    // and sets res.locals.success, res.locals.error, res.locals.errors
    // So we use res.locals instead of calling req.flash() again
    const oldInputArray = req.flash('oldInput') || [];

    // Use res.locals for flash messages (already set by global middleware)
    const errors = res.locals.errors || [];
    const errorMessages = res.locals.error || [];
    const successMessages = res.locals.success || [];

    console.log('Flash messages retrieved:', {
      success: successMessages,
      error: errorMessages,
      errors: errors,
      oldInput: oldInputArray.length > 0 ? 'Present' : 'Empty',
      errorMessagesLength: errorMessages.length,
      errorMessagesContent: errorMessages,
      resLocalsError: res.locals.error,
      resLocalsErrors: res.locals.errors
    });

    const courseTypes = await CourseType.findAll();
    const activeAcademicYear = await AcademicYear.findOne({
      where: { status: 'Active' }
    });

    const { minDobDate, maxDobDate, maxDobDateFormatted } = getDobDateRestrictions();

    console.log('Rendering registration form page');
    // Note: error, errors, and success are already in res.locals from global middleware
    // We only need to pass oldInput explicitly
    res.render('frontend/auth/registration_fees_payment', {
      title: 'Registration Fees Payment',
      courseTypes: courseTypes,
      activeAcademicYear: activeAcademicYear,
      minDobDate: minDobDate,
      maxDobDate: maxDobDate,
      maxDobDateFormatted: maxDobDateFormatted,
      is_first_time_college: siteconfig.is_first_time_college || false,
      oldInput: Array.isArray(oldInputArray) && oldInputArray.length > 0 ? (typeof oldInputArray[0] === 'object' ? oldInputArray[0] : {}) : {}
    });
  } catch (error) {
    console.error('Error in registration_fees_payment (GET):', error);
    handleError(req, res, error, 'An error occurred.', '/');
  }
};

export const coursesByType = async (req, res) => {
  try {
    const { type_id } = req.params;

    // Get all courses by course_type_id
    const courses = await Course.findAll({
      where: {
        course_type_id: String(type_id),
        status: '1' // Only active courses
      }
    });

    // If no courses found for this type, return empty array
    if (courses.length === 0) {
      return res.json([]);
    }

    // Get course IDs that have registration enabled semesters
    const enabledSemesters = await Semester.findAll({
      where: {
        registration_enabled: { [Op.in]: [1] },
        status: 1
      },
      attributes: ['course_id'],
      raw: true
    });

    // If there are courses with registration enabled semesters, filter to only show those
    if (enabledSemesters.length > 0) {
      // Create a set of enabled course IDs
      const enabledCourseIdsSet = new Set();
      enabledSemesters.forEach(sem => {
        const courseId = typeof sem.course_id === 'string' ? parseInt(sem.course_id) : sem.course_id;
        if (!isNaN(courseId)) {
          enabledCourseIdsSet.add(courseId);
        }
      });

      // Filter courses to only include those with registration enabled semesters
      const filteredCourses = courses.filter(course => {
        return enabledCourseIdsSet.has(course.id);
      });

      return res.json(filteredCourses);
    }

    // If no registration enabled semesters found, return all courses by type
    // This ensures courses still show even if course_semesters table is not set up yet
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses by type:', error);
    console.error('Error details:', error.message);
    sendErrorResponse(res, 'An error occurred while fetching courses.', 500);
  }
};

export const getSemester = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get semesters with registration_enabled = 1 for this course
    const semesters = await Semester.findAll({
      where: {
        course_id: String(courseId),
        status: 1,
        registration_enabled: 1
      },
      order: [['order', 'ASC']]
    });

    res.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
    console.error('Error details:', error.message);
    sendErrorResponse(res, 'An error occurred while fetching semesters.', 500);
  }
};

export const getStudentByRegistrationNo = async (req, res) => {
  try {
    const { registration_no } = req.params;

    const student = await Student.findOne({
      where: { registration_no: registration_no },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!student) {
      return res.json({ success: false, message: 'Student not found with this registration number.' });
    }

    // Get the active academic year
    const activeAcademicYear = await AcademicYear.findOne({
      where: { status: 'Active' }
    });

    res.json({
      success: true,
      data: {
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        father_name: student.father_name,
        mother_name: student.mother_name,
        dob: student.dob,
        course_type_id: parseInt(student.course_type_id) || student.course_type_id,
        course_id: parseInt(student.course_id) || student.course_id,
        semester_id: parseInt(student.year) || student.year, // year field stores semester_id
        academic_year: activeAcademicYear ? (parseInt(activeAcademicYear.id) || activeAcademicYear.id) : null
      }
    });
  } catch (error) {
    console.error('Error fetching student by registration number:', error);
    sendErrorResponse(res, 'An error occurred while fetching student data.', 500);
  }
};

export const registration_fees_payment_post = async (req, res) => {
  try {
    console.log('=== REGISTRATION FEES PAYMENT POST STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    // Sanitize empty strings to undefined for proper validation
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.course_id === '' || sanitizedBody.course_id === null) {
      sanitizedBody.course_id = undefined;
    }
    if (sanitizedBody.semester_id === '' || sanitizedBody.semester_id === null) {
      sanitizedBody.semester_id = undefined;
    }
    if (sanitizedBody.course_type_id === '' || sanitizedBody.course_type_id === null) {
      sanitizedBody.course_type_id = undefined;
    }

    console.log('Sanitized body:', JSON.stringify(sanitizedBody, null, 2));

    const { error, value } = registrationFeesPaymentSchema.validate(sanitizedBody, { abortEarly: false });

    if (error) {
      console.log('=== VALIDATION ERRORS ===');
      console.log('Validation errors:', JSON.stringify(error.details, null, 2));
      const errors = error.details.map(detail => detail.message);
      console.log('Error messages:', errors);

      // Flash errors and redirect back to registration form
      // This ensures URL stays as /registration_fees_payment
      req.flash('errors', errors);
      req.flash('oldInput', req.body);
      return res.redirect('/registration_fees_payment');
    }

    console.log('Validation passed. Proceeding with registration...');
    console.log('Validated values:', JSON.stringify(value, null, 2));

    // If previous_registration_no is provided, it should take precedence for finding existing student
    if (value.previous_registration_no && value.previous_registration_no.trim() !== '') {
      value.registration_no = value.previous_registration_no.trim();
      console.log('Using previous_registration_no as primary registration_no:', value.registration_no);
    }

    // Convert dob from Date object or ISO string to string format (YYYY-MM-DD)
    if (value.dob instanceof Date) {
      const year = value.dob.getFullYear();
      const month = String(value.dob.getMonth() + 1).padStart(2, '0');
      const day = String(value.dob.getDate()).padStart(2, '0');
      value.dob = `${year}-${month}-${day}`;
      console.log('Converted dob from Date to string:', value.dob);
    } else if (typeof value.dob === 'string') {
      // Handle ISO string format (e.g., "2006-02-07T00:00:00.000Z")
      if (value.dob.includes('T')) {
        value.dob = value.dob.split('T')[0];
        console.log('Converted dob from ISO string to date string:', value.dob);
      } else {
        // If it's already a string, ensure it's in YYYY-MM-DD format
        const dateMatch = value.dob.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          value.dob = dateMatch[1];
        }
        console.log('dob is already string:', value.dob);
      }
    }

    const t = await sequelize.transaction();
    console.log('Transaction started');

    try {
      const merchTxnId = await generateUniqueTransactionId(t);
      console.log('Generated unique 10-digit transaction ID:', merchTxnId);
      const amount = siteconfig.registration_amount;
      const login = siteconfig.atom_login;
      const password = siteconfig.atom_password;
      const prod_id = siteconfig.atom_product_id;
      const encRequestKey = siteconfig.atom_encryption_key;
      const decResponseKey = siteconfig.atom_decryption_key;
      const api_url = siteconfig.atom_api_url;

      const hashedPassword = await hashPassword(value.phone);
      let user;
      let student;

      // Get current active academic year
      const currentAcademicYear = await AcademicYear.findOne({
        where: { status: 'Active' }
      }, { transaction: t });

      if (!currentAcademicYear) {
        await t.rollback();
        req.flash('error', 'No active academic year found. Please contact administrator.');
        req.flash('oldInput', req.body);
        return res.redirect('/registration_fees_payment');
      }

      // Fetch selected semester to check for re-registration validation
      const activeSemester = await Semester.findByPk(value.semester_id, { transaction: t });
      if (!activeSemester) {
        await t.rollback();
        req.flash('error', 'Selected semester not found.');
        req.flash('oldInput', req.body);
        return res.redirect('/registration_fees_payment');
      }

      const isReRegistration = activeSemester.order !== '1';

      // Re-registration specific validation
      // Skip this if it's a first-time college setup
      if (isReRegistration && !siteconfig.is_first_time_college) {
        if (!value.registration_no || value.registration_no.trim() === '') {
          await t.rollback();
          req.flash('error', 'Registration number is required for re-registration (Semester > I).');
          req.flash('oldInput', req.body);
          return res.redirect('/registration_fees_payment');
        }

        // Verify registration number exists for the SAME COURSE in a PREVIOUS academic year
        const previousRecord = await Student.findOne({
          where: {
            registration_no: value.registration_no.trim(),
            course_id: String(value.course_id),
            academic_year: { [Op.ne]: String(currentAcademicYear.id) }
          },
          transaction: t
        });

        if (!previousRecord) {
          await t.rollback();
          req.flash('error', 'No previous academic record found for this registration number and course. If you are a new student, please select Semester 1.');
          req.flash('oldInput', req.body);
          return res.redirect('/registration_fees_payment');
        }
      }

      // Check for duplicate email in students table for current academic year (for new registrations)
      // Only students with successful payment should block re-registration
      if (!value.registration_no || value.registration_no.trim() === '') {
        // Check if student exists with this email for current academic year
        const existingStudentForYear = await Student.findOne({
          include: [{
            model: User,
            as: 'user',
            where: { email: value.email }
          }],
          where: { academic_year: String(currentAcademicYear.id) },
          transaction: t
        });

        if (existingStudentForYear) {
          // Check if payment was successful for this student
          const successfulPayment = await Payment.findOne({
            where: {
              user_id: String(existingStudentForYear.user_id),
              status: 'Success'
            },
            transaction: t
          });

          if (successfulPayment) {
            // Payment was successful, don't allow re-registration
            await t.rollback();
            req.flash('error', 'This email address is already registered. If you are a returning student, please enter your registration number.');
            req.flash('oldInput', req.body);
            return res.redirect('/registration_fees_payment');
          } else {
            // Payment not successful, allow re-registration by deleting old records
            console.log('Payment not successful for existing student (new registration), allowing re-registration');
            console.log('Deleting old student record for email:', value.email, 'academic_year:', currentAcademicYear.id);

            // Delete old student record for this academic year
            await Student.destroy({
              where: {
                user_id: String(existingStudentForYear.user_id),
                academic_year: String(currentAcademicYear.id)
              },
              transaction: t
            });

            // Delete old payment records for this user that are not successful
            await Payment.destroy({
              where: {
                user_id: String(existingStudentForYear.user_id),
                status: { [Op.ne]: 'Success' }
              },
              transaction: t
            });

            console.log('Cleaned up old incomplete registration records, proceeding with new registration');
            // Continue with registration flow below
          }
        }
      }

      // Prepare variables for student ID
      let finalStudentId = null;
      let existingStudent = null;

      // Check if this is an existing student (has registration number)
      if (value.registration_no && value.registration_no.trim() !== '') {
        // Find existing student by registration number (from any academic year)
        existingStudent = await Student.findOne({
          where: { registration_no: value.registration_no },
          include: [{
            model: User,
            as: 'user'
          }],
          transaction: t
        });

        if (!existingStudent) {
          await t.rollback();
          req.flash('error', 'Student record not found for the provided registration number. If you are a new student, please leave the registration number blank.');
          req.flash('oldInput', req.body);
          return res.redirect('/registration_fees_payment');
        }

        finalStudentId = existingStudent.student_id || existingStudent.registration_no;

        // Check if student already registered for current academic year (with success payment)
        const currentYearStudent = await Student.findOne({
          where: {
            registration_no: value.registration_no,
            academic_year: String(currentAcademicYear.id)
          },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id']
          }],
          transaction: t
        });

        if (currentYearStudent) {
          // Check if payment was successful for this student
          const successfulPayment = await Payment.findOne({
            where: {
              user_id: String(currentYearStudent.user_id),
              status: 'Success'
            },
            transaction: t
          });

          if (successfulPayment) {
            await t.rollback();
            req.flash('error', `You have already registered for academic year ${currentAcademicYear.session}. Please login with your original transaction ID.`);
            req.flash('oldInput', req.body);
            return res.redirect('/registration_fees_payment');
          } else {
            // Clean up incomplete record to allow fresh registration
            await Student.destroy({
              where: {
                registration_no: value.registration_no,
                academic_year: String(currentAcademicYear.id)
              },
              transaction: t
            });
            if (currentYearStudent.user) {
              await Payment.destroy({
                where: { user_id: String(currentYearStudent.user.id), status: { [Op.ne]: 'Success' } },
                transaction: t
              });
            }
          }
        }

        // DECOUPLING FIX: Always create a NEW user for the new session
        // This ensures the current registration doesn't overwrite old academic year user data
        user = await User.create({
          name: value.name,
          email: existingStudent.user.email, // Keep consistent email
          phone: value.phone,
          password: hashedPassword,
          transaction_id: merchTxnId,
          role: 'Student',
          academic_year: String(currentAcademicYear.id)
        }, { transaction: t });

      } else {
        // New student registration
        // Check if email already used for THIS year
        const existingStudentForYear = await Student.findOne({
          include: [{
            model: User,
            as: 'user',
            where: { email: value.email }
          }],
          where: { academic_year: String(currentAcademicYear.id) },
          transaction: t
        });

        if (existingStudentForYear) {
          const succPayment = await Payment.findOne({
            where: { user_id: String(existingStudentForYear.user_id), status: 'Success' },
            transaction: t
          });
          if (succPayment) {
            await t.rollback();
            req.flash('error', 'This email is already registered for the current session.');
            req.flash('oldInput', req.body);
            return res.redirect('/registration_fees_payment');
          }
          // Clean up if not successful
          await Student.destroy({ where: { user_id: String(existingStudentForYear.user_id) }, transaction: t });
        }

        // DECOUPLING FIX: Always create a NEW user for the new session
        user = await User.create({
          name: value.name,
          email: value.email,
          phone: value.phone,
          password: hashedPassword,
          transaction_id: merchTxnId,
          role: 'Student',
          academic_year: String(currentAcademicYear.id)
        }, { transaction: t });
      }

      // Generate registration number for new students (if not provided)
      let registrationNo;
      if (value.registration_no && value.registration_no.trim() !== '') {
        registrationNo = value.registration_no; // Use existing registration number
      } else {
        // Generate new registration number for new student
        registrationNo = await generateRegistrationNumber(value.course_id, t);
      }

      // Convert dob to string format if it's a Date object
      let dobString = value.dob;
      if (dobString instanceof Date) {
        const year = dobString.getFullYear();
        const month = String(dobString.getMonth() + 1).padStart(2, '0');
        const day = String(dobString.getDate()).padStart(2, '0');
        dobString = `${year}-${month}-${day}`;
      } else if (typeof dobString === 'string' && dobString.includes('T')) {
        // If it's an ISO string, extract just the date part
        dobString = dobString.split('T')[0];
      }

      // Verify user exists before proceeding
      if (!user || !user.id) {
        console.error('=== CRITICAL ERROR: USER IS NULL OR HAS NO ID ===');
        console.error('User object:', user);
        await t.rollback();
        req.flash('error', 'Failed to create user account. Please try again.');
        return res.redirect('/registration_fees_payment');
      }

      console.log('=== VERIFYING USER BEFORE PAYMENT CREATION ===');
      console.log('User ID:', user.id);
      console.log('User Name:', user.name);
      console.log('User Email:', user.email);
      console.log('User Phone:', user.phone);
      console.log('User Transaction ID:', user.transaction_id);

      // Store student registration data in Payment record temporarily
      // Student record will be created only after payment success
      const studentRegistrationData = {
        registration_no: value.registration_no || registrationNo,
        student_id: finalStudentId || value.registration_no || registrationNo,
        course_type_id: String(value.course_type_id),
        course_id: String(value.course_id),
        semester_id: String(value.semester_id),
        academic_year: String(currentAcademicYear.id),
        father_name: value.father_name,
        mother_name: value.mother_name,
        dob: dobString,
        name: value.name,
        email: value.email,
        phone: value.phone,
        photo: existingStudent ? existingStudent.photo : null,
        sign: existingStudent ? existingStudent.sign : null,
        photographsign_status: existingStudent ? (existingStudent.photo && existingStudent.sign ? '1' : '0') : '0'
      };

      console.log('=== CREATING PAYMENT RECORD ===');
      console.log('Payment data:', {
        user_id: String(user.id),
        transaction: merchTxnId,
        amount: amount,
        payment_method: 'atom',
        status: 'initiated'
      });

      const paymentRecord = await Payment.create({
        user_id: String(user.id),
        merchant_txn_id: merchTxnId,
        amount: amount,
        payment_method: 'atom',
        status: 'initiated',
        academic_year: String(currentAcademicYear.id),
        fee_type: 'form_fee',
        // Store registration data in payment_payload field temporarily (JSON string)
        payment_payload: JSON.stringify(studentRegistrationData)
      }, { transaction: t });

      console.log('=== PAYMENT RECORD CREATED ===');
      console.log('Payment ID:', paymentRecord.id);
      console.log('Payment User ID:', paymentRecord.user_id);
      console.log('Payment Transaction:', paymentRecord.transaction);

      // Commit transaction - registration is complete
      console.log('=== COMMITTING TRANSACTION ===');
      await t.commit();
      console.log('=== TRANSACTION COMMITTED SUCCESSFULLY ===');

      console.log('=== REGISTRATION DATA STORED (WAITING FOR PAYMENT) ===');
      console.log('User ID:', user.id);
      console.log('User Name:', user.name);
      console.log('User Email:', user.email);
      console.log('Transaction ID:', merchTxnId);
      console.log('Academic Year:', currentAcademicYear.id);
      console.log('Registration Number:', studentRegistrationData.registration_no);

      // Verify user exists in database after commit
      const verifyUser = await User.findByPk(user.id);
      if (!verifyUser) {
        console.error('=== CRITICAL: USER NOT FOUND IN DATABASE AFTER COMMIT ===');
        console.error('Expected User ID:', user.id);
        req.flash('error', 'User account was not created. Please try again.');
        return res.redirect('/registration_fees_payment');
      }
      console.log('=== USER VERIFIED IN DATABASE ===');
      console.log('Verified User ID:', verifyUser.id);
      console.log('Verified User Email:', verifyUser.email);

      // Verify payment exists in database after commit
      const verifyPayment = await Payment.findOne({
        where: { merchant_txn_id: merchTxnId }
      });
      if (!verifyPayment) {
        console.error('=== CRITICAL: PAYMENT NOT FOUND IN DATABASE AFTER COMMIT ===');
        console.error('Expected Transaction ID:', merchTxnId);
        req.flash('error', 'Payment record was not created. Please try again.');
        return res.redirect('/registration_fees_payment');
      }
      console.log('=== PAYMENT VERIFIED IN DATABASE ===');
      console.log('Verified Payment ID:', verifyPayment.id);
      console.log('Verified Payment Merchant Txn ID:', verifyPayment.merchant_txn_id);

      // Fetch course and semester details for display
      // Convert string IDs to integers for findByPk (primary keys are still integers)
      const courseIdInt = typeof value.course_id === 'string' ? parseInt(value.course_id) : value.course_id;
      const semesterIdInt = typeof value.semester_id === 'string' ? parseInt(value.semester_id) : value.semester_id;
      const courseTypeIdInt = typeof value.course_type_id === 'string' ? parseInt(value.course_type_id) : value.course_type_id;

      const course = await Course.findByPk(courseIdInt);
      const semester = await Semester.findByPk(semesterIdInt);
      const courseType = await CourseType.findByPk(courseTypeIdInt);
      const activeAcademicYear = await AcademicYear.findOne({
        where: { status: 'Active' }
      });

      // Prepare registration data for confirmation page
      const registrationDisplayData = {
        name: value.name,
        email: value.email,
        phone: value.phone,
        course_name: course ? course.name : 'N/A',
        semester_name: semester ? semester.name : 'N/A',
        course_type_name: courseType ? courseType.name : 'N/A',
        academic_year: activeAcademicYear ? activeAcademicYear.session : 'N/A',
        transaction_id: merchTxnId,
        amount: amount
      };

      // Render payment confirmation page
      res.render('frontend/auth/payment_confirmation', {
        title: 'Payment Confirmation',
        registrationData: registrationDisplayData
      });
    } catch (err) {
      console.error('=== TRANSACTION ERROR (Inner Catch) ===');
      console.error('Error in transaction:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      await t.rollback();
      throw err;
    }
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Error details:', JSON.stringify(error.errors, null, 2));
    }

    // Handle specific error types
    let errorMessage = 'Registration failed. Please try again.';

    // Check for SequelizeValidationError
    if (error.name === 'SequelizeValidationError') {
      const validationError = error.errors && error.errors[0] ? error.errors[0] : null;

      if (validationError) {
        const field = validationError.path;
        const message = validationError.message;

        console.error('Validation error field:', field);
        console.error('Validation error message:', message);

        if (field === 'dob') {
          if (message.includes('cannot be an array or an object')) {
            errorMessage = 'Invalid date of birth format. Please enter a valid date in YYYY-MM-DD format.';
          } else {
            errorMessage = 'Invalid date of birth. Please check the date and try again.';
          }
        } else if (field === 'email') {
          errorMessage = 'Invalid email address format. Please enter a valid email address.';
        } else if (field === 'phone') {
          errorMessage = 'Invalid phone number format. Please enter a valid 10-digit phone number.';
        } else if (field === 'name' || field === 'father_name' || field === 'mother_name') {
          errorMessage = `Invalid ${field.replace('_', ' ')}. Please check the field and try again.`;
        } else {
          errorMessage = `Validation error in ${field}: ${message}. Please check the field and try again.`;
        }
      } else {
        errorMessage = 'Data validation failed. Please check all fields and try again.';
      }
    }
    // Check for duplicate constraint error (shouldn't happen now, but keep as fallback)
    else if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Duplicate constraint error detected');
      const duplicateField = error.errors && error.errors[0] ? error.errors[0].path : null;

      if (duplicateField === 'email') {
        // This should not happen now since we check students table and reuse users
        // But if it does, check if it's a student for current academic year
        errorMessage = 'This email address is already registered for this academic year. If you are a returning student, please enter your registration number to continue.';
      } else if (duplicateField === 'phone') {
        errorMessage = 'This phone number is already registered. If you are a returning student, please enter your registration number to continue.';
      } else {
        errorMessage = 'This information is already registered. If you are a returning student, please enter your registration number to continue.';
      }
    }
    // Handle other database errors
    else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = 'Database error occurred. Please try again or contact support.';
    }
    // Handle connection errors
    else if (error.name === 'SequelizeConnectionError') {
      errorMessage = 'Database connection error. Please try again later.';
    }

    // Flash error and redirect back to registration form
    // This ensures URL stays as /registration_fees_payment and error is visible
    console.error('Redirecting to registration form with error:', errorMessage);
    console.log('Setting flash messages - error:', errorMessage);
    console.log('Setting flash messages - oldInput:', JSON.stringify(req.body));

    // Set flash messages
    req.flash('error', errorMessage);
    req.flash('oldInput', req.body);

    // Debug: Check if flash messages were set
    console.log('Flash messages after setting:', {
      error: req.session?.flash?.error || 'not set',
      oldInput: req.session?.flash?.oldInput ? 'set' : 'not set'
    });

    return res.redirect('/registration_fees_payment');
  }
};

export const initiatePayment = async (req, res) => {
  try {
    const { transaction_id } = req.body;

    console.log('InitiatePayment called with transaction_id:', transaction_id);
    console.log('Request body:', req.body);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    if (!transaction_id || transaction_id.trim() === '') {
      console.error('Transaction ID is missing or empty');
      req.flash('error', 'Transaction ID is required.');
      return res.redirect('/registration_fees_payment');
    }

    // Find payment record
    const payment = await Payment.findOne({
      where: { merchant_txn_id: transaction_id }
    });

    if (!payment) {
      req.flash('error', 'Payment record not found.');
      return res.redirect('/registration_fees_payment');
    }

    // Find user record - convert string to integer for findByPk
    const userIdInt = typeof payment.user_id === 'string' ? parseInt(payment.user_id) : payment.user_id;
    const user = await User.findByPk(userIdInt);

    if (!user) {
      console.error('User not found for user_id:', payment.user_id);
      req.flash('error', 'User record not found.');
      return res.redirect('/registration_fees_payment');
    }

    // Parse registration data from payment record
    // Registration data is stored in payment_payload field as JSON string
    let registrationData;
    try {
      if (!payment.payment_payload) {
        throw new Error('Registration data not found in payment record');
      }
      registrationData = JSON.parse(payment.payment_payload);
      console.log('Registration data parsed from payment record:', registrationData);
    } catch (parseError) {
      console.error('Failed to parse registration data from payment record:', parseError);
      req.flash('error', 'Failed to retrieve registration data. Please contact support.');
      return res.redirect('/registration_fees_payment');
    }

    // Verify active academic year exists
    const activeAcademicYear = await AcademicYear.findOne({
      where: { status: 'Active' }
    });

    if (!activeAcademicYear) {
      req.flash('error', 'No active academic year found. Please contact administrator.');
      return res.redirect('/registration_fees_payment');
    }

    console.log('Using registration data from payment record:', {
      registration_no: registrationData.registration_no,
      course_id: registrationData.course_id,
      academic_year: registrationData.academic_year,
      user_id: payment.user_id
    });

    // Prepare payment data using PaymentService
    const amount = siteconfig.registration_amount;
    // Get APP_URL and ensure no trailing slash, then append route
    const baseUrl = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
    const returnUrl = `${baseUrl}/payment/response`;

    console.log('Return URL configured:', returnUrl);

    const payData = PaymentService.preparePaymentData({
      transactionId: transaction_id,
      amount: amount,
      email: registrationData.email || user.email || 'dummy@email.com',
      mobile: registrationData.phone || user.phone || '9999999999',
      returnUrl: returnUrl,
      udf1: registrationData.registration_no || '',                        // Registration No
      udf2: transaction_id,                                                  // Merchant Transaction ID
      udf3: String(user.id || ''),                                           // User ID
      udf4: registrationData.name || user.name || '',                        // Student Name
      udf5: registrationData.phone || user.phone || ''                       // Mobile Number
    });

    console.log('Payment data prepared:', {
      login: payData.login,
      amount: payData.amount,
      txnId: payData.txnId,
      date: payData.date,
      prod_id: payData.prod_id
    });

    // Create token for payment gateway using PaymentService
    let atomTokenId;
    try {
      atomTokenId = await PaymentService.createTokenId(payData);
    } catch (error) {
      console.error('Error calling PaymentService.createTokenId:', error);

      // Provide specific error messages based on error type
      let errorMessage = 'Payment gateway initialization failed. Please try again or contact support.';

      if (error.code === 'ENOTFOUND') {
        errorMessage = 'Unable to connect to payment gateway. Please check your internet connection and try again.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Payment gateway connection refused. Please try again later or contact support.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Payment gateway request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = `Payment gateway error: ${error.message}. Please try again or contact support.`;
      }

      req.flash('error', errorMessage);
      return res.redirect('/registration_fees_payment');
    }

    if (!atomTokenId) {
      req.flash('error', 'Payment gateway initialization failed. Please try again or contact support.');
      return res.redirect('/registration_fees_payment');
    }

    // Render payment gateway redirect page (using frontend payment initiate page)
    res.render('frontend/payment/payment_initiate', {
      title: 'Redirecting to Payment Gateway',
      data: payData,
      atomTokenId: atomTokenId,
      atomEnvironment: siteconfig.atom_environment || 'demo'
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    console.error('Error stack:', error.stack);
    req.flash('error', `An error occurred while initiating payment: ${error.message}. Please try again or contact support.`);
    res.redirect('/registration_fees_payment');
  }
};

// Helper function to generate unique 10-digit transaction ID
const generateUniqueTransactionId = async (transaction = null) => {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random 10-digit number
    // Range: 1000000000 to 9999999999 (ensures exactly 10 digits)
    const min = 1000000000;
    const max = 9999999999;
    const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
    const transactionId = String(randomId);

    // Check if this transaction ID already exists in Payment table
    const existingPayment = await Payment.findOne({
      where: { merchant_txn_id: transactionId },
      transaction
    });

    // Also check if it exists in User table (transaction_id field)
    const existingUser = await User.findOne({
      where: { transaction_id: transactionId },
      transaction
    });

    // If not found, it's unique - return it
    if (!existingPayment && !existingUser) {
      console.log(`Generated unique 10-digit transaction ID: ${transactionId} (attempt ${attempts + 1})`);
      return transactionId;
    }

    attempts++;
    console.warn(`Transaction ID ${transactionId} already exists, generating new one... (attempt ${attempts})`);
  }

  // Fallback: use timestamp-based ID if random generation fails after max attempts
  console.error('Failed to generate unique transaction ID after max attempts, using timestamp-based fallback');
  const timestamp = Date.now().toString();
  // Take last 10 digits of timestamp, pad if needed
  const fallbackId = timestamp.slice(-10).padStart(10, '0');
  return fallbackId;
};

// Helper function to generate registration number
const generateRegistrationNumber = async (courseId, transaction = null) => {
  try {
    // Get course details - courseId might be string or number, convert to int for findByPk
    const courseIdInt = typeof courseId === 'string' ? parseInt(courseId) : courseId;
    const course = await Course.findByPk(courseIdInt, { transaction });
    if (!course) {
      throw new Error('Course not found');
    }

    // Extract prefix from course name (first 3-4 uppercase letters)
    // Example: "Bachelor of Computer Applications" -> "BCA"
    const courseName = course.name || '';
    const words = courseName.split(' ').filter(w => w.length > 0);
    let prefix = '';

    if (words.length >= 1) {
      // Take first letter of first word and first 2-3 letters of subsequent words
      prefix = words[0].substring(0, 1).toUpperCase();
      if (words.length > 1) {
        prefix += words.slice(1, 3).map(w => w.substring(0, 1).toUpperCase()).join('');
      }
      // If still short, use first 3-4 letters of first word
      if (prefix.length < 3) {
        prefix = courseName.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
      }
      prefix = prefix.substring(0, 4).toUpperCase();
    } else {
      prefix = 'STU'; // Default prefix
    }

    // Find last registration number with this prefix
    const lastStudent = await Student.findOne({
      where: {
        registration_no: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['id', 'DESC']],
      transaction
    });

    let newNumber;
    if (lastStudent && lastStudent.registration_no) {
      // Extract numeric part
      const numericPart = lastStudent.registration_no.replace(/\D/g, '');
      const lastNumber = parseInt(numericPart) || 1000000;
      newNumber = lastNumber + 1;
    } else {
      newNumber = 1000001; // Start from 1000001
    }

    // Format: PREFIX + 7-digit zero-padded number
    const registrationNo = `${prefix}${String(newNumber).padStart(7, '0')}`;

    return registrationNo;
  } catch (error) {
    console.error('Error generating registration number:', error);
    // Fallback: Use timestamp-based registration number
    const timestamp = Date.now().toString().slice(-7);
    return `STU${timestamp}`;
  }
};

// Payment token creation is now handled by PaymentService
// This function is kept for backward compatibility but delegates to PaymentService
const createTokenId = async (data) => {
  return await PaymentService.createTokenId(data);
};

