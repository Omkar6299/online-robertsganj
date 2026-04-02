import {
  Payment,
  User,
  Student,
  AcademicYear,
  Course,
  Semester,
  CourseType,
  Educational,
  Qualification,
  Weightage,
  Subject,
  Skills,
  Cocurricular,
  StudentDocument,
  DocumentType
} from '../models/index.js';

/**
 * Show know your registration number form
 */
export const knowYourRegistration = async (req, res) => {
  try {
    const { transaction_id, phone } = req.query;

    // If query parameters exist, try to find registration number
    if (transaction_id && phone) {
      // Validate inputs
      if (!/^[0-9]{8,15}$/.test(transaction_id)) {
        return res.render('frontend/reprint/know_your_registration', {
          title: 'Know Your Registration Number',
          errors: ['Invalid Transaction ID format. Transaction ID must be numeric (8-15 digits).'],
          oldInput: { transaction_id, phone }
        });
      }

      if (!/^[0-9]{10}$/.test(phone)) {
        return res.render('frontend/reprint/know_your_registration', {
          title: 'Know Your Registration Number',
          errors: ['Invalid Mobile Number format. Mobile Number must be exactly 10 digits.'],
          oldInput: { transaction_id, phone }
        });
      }

      console.log('=== KNOW YOUR REGISTRATION REQUEST ===');
      console.log('Transaction ID:', transaction_id);
      console.log('Phone:', phone);

      // Find user by transaction_id and phone
      const user = await User.findOne({
        where: {
          transaction_id: transaction_id,
          phone: phone
        }
      });

      if (!user) {
        return res.render('frontend/reprint/know_your_registration', {
          title: 'Know Your Registration Number',
          errors: ['No record found with the provided Transaction ID and Mobile Number.'],
          oldInput: { transaction_id, phone }
        });
      }

      // Find payment
      const payment = await Payment.findOne({
        where: {
          merchant_txn_id: transaction_id,
          user_id: user.id.toString(),
          status: 'Success'
        }
      });

      if (!payment) {
        return res.render('frontend/reprint/know_your_registration', {
          title: 'Know Your Registration Number',
          errors: ['Payment not found or payment was not successful.'],
          oldInput: { transaction_id, phone }
        });
      }

      // Parse registration data
      let registrationData = null;
      if (payment.payment_payload) {
        try {
          registrationData = JSON.parse(payment.payment_payload);
        } catch (parseError) {
          console.log('Could not parse payment_payload:', parseError.message);
        }
      }

      // Find student record
      let student = null;
      if (registrationData && registrationData.academic_year) {
        student = await Student.findOne({
          where: {
            user_id: user.id.toString(),
            academic_year: registrationData.academic_year.toString()
          }
        });
      } else {
        student = await Student.findOne({
          where: {
            user_id: user.id.toString()
          },
          order: [['created_at', 'DESC']]
        });
      }

      const registrationNo = student?.registration_no || registrationData?.registration_no || null;

      if (registrationNo) {
        return res.render('frontend/reprint/know_your_registration', {
          title: 'Know Your Registration Number',
          registrationNo: registrationNo,
          oldInput: { transaction_id, phone }
        });
      } else {
        return res.render('frontend/reprint/know_your_registration', {
          title: 'Know Your Registration Number',
          errors: ['Registration number not found. Please contact support.'],
          oldInput: { transaction_id, phone }
        });
      }
    }

    // Show form without query parameters
    return res.render('frontend/reprint/know_your_registration', {
      title: 'Know Your Registration Number',
      errors: req.flash('error'),
      oldInput: req.query || {}
    });
  } catch (error) {
    console.error('Error in know your registration:', error);
    req.flash('error', 'An error occurred. Please try again.');
    return res.render('frontend/reprint/know_your_registration', {
      title: 'Know Your Registration Number',
      errors: ['An error occurred. Please try again.'],
      oldInput: req.query || {}
    });
  }
};

/**
 * Show reprint payment receipt form
 */
export const reprintPaymentReceipt = async (req, res) => {
  try {
    const CourseType = (await import('../models/CourseType.js')).default;
    const courseTypes = await CourseType.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    const academicYears = await AcademicYear.findAll({
      order: [['session', 'DESC']]
    });

    return res.render('frontend/reprint/reprint_payment_receipt', {
      title: 'Reprint Payment Receipt',
      errors: req.flash('error'),
      courseTypes: courseTypes,
      academicYears: academicYears,
      oldInput: req.query || {}
    });
  } catch (error) {
    console.error('Error rendering reprint payment receipt form:', error);
    req.flash('error', 'An error occurred. Please try again.');
    return res.redirect('/');
  }
};

/**
 * Show payment receipt based on course type, course, semester, DOB, and phone
 */
export const showPaymentReceipt = async (req, res) => {
  try {
    const { academic_year, course_type_id, course_id, semester_id, dob, phone } = req.body;

    // Validate inputs
    if (!academic_year || !course_type_id || !course_id || !semester_id || !dob || !phone) {
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const academicYears = await AcademicYear.findAll({
        order: [['session', 'DESC']]
      });

      req.flash('error', 'All fields are required.');
      return res.render('frontend/reprint/reprint_payment_receipt', {
        title: 'Reprint Payment Receipt',
        errors: ['All fields are required.'],
        courseTypes: courseTypes,
        academicYears: academicYears,
        oldInput: req.body || {}
      });
    }

    // Validate phone format
    if (!/^[0-9]{10}$/.test(phone)) {
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const academicYears = await AcademicYear.findAll({
        order: [['session', 'DESC']]
      });

      req.flash('error', 'Invalid Mobile Number format. Mobile Number must be exactly 10 digits.');
      return res.render('frontend/reprint/reprint_payment_receipt', {
        title: 'Reprint Payment Receipt',
        errors: ['Invalid Mobile Number format. Mobile Number must be exactly 10 digits.'],
        courseTypes: courseTypes,
        academicYears: academicYears,
        oldInput: req.body || {}
      });
    }

    console.log('Academic Year ID:', academic_year);
    console.log('Course Type ID:', course_type_id);
    console.log('Course ID:', course_id);
    console.log('Semester ID:', semester_id);
    console.log('DOB:', dob);
    console.log('Phone:', phone);

    // Format DOB for comparison (convert to YYYY-MM-DD format)
    let dobFormatted = dob;
    if (dob.includes('/')) {
      const parts = dob.split('/');
      dobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (dob.includes('-')) {
      // Already in correct format or needs adjustment
      const parts = dob.split('-');
      if (parts[0].length === 2) {
        // DD-MM-YYYY format
        dobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    console.log('Formatted DOB:', dobFormatted);

    // Find user by phone
    const user = await User.findOne({
      where: {
        phone: phone
      }
    });

    if (!user) {
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const academicYears = await AcademicYear.findAll({
        order: [['session', 'DESC']]
      });

      console.log('User not found with phone:', phone);
      req.flash('error', 'No payment found with the provided details.');
      return res.render('frontend/reprint/reprint_payment_receipt', {
        title: 'Reprint Payment Receipt',
        errors: ['No payment found with the provided details.'],
        courseTypes: courseTypes,
        academicYears: academicYears,
        oldInput: req.body || {}
      });
    }

    console.log('User found:', user.id, user.name, user.email);

    // Find all students for this user to check DOB format
    const allStudents = await Student.findAll({
      where: {
        user_id: user.id.toString()
      }
    });

    console.log('All students for user:', allStudents.length);
    allStudents.forEach(s => {
      console.log(`Student ID: ${s.id}, DOB: ${s.dob}, Course Type: ${s.course_type_id}, Course: ${s.course_id}, Year: ${s.year}`);
    });

    // Try to find student record matching the criteria - try multiple DOB formats
    let student = await Student.findOne({
      where: {
        user_id: user.id.toString(),
        academic_year: String(academic_year),
        course_type_id: String(course_type_id),
        course_id: String(course_id),
        year: String(semester_id), // year field stores semester_id
        dob: dobFormatted
      }
    });

    // If not found, try with original DOB format
    if (!student && dob !== dobFormatted) {
      console.log('Trying with original DOB format:', dob);
      student = await Student.findOne({
        where: {
          user_id: user.id.toString(),
          academic_year: String(academic_year),
          course_type_id: String(course_type_id),
          course_id: String(course_id),
          year: String(semester_id),
          dob: dob
        }
      });
    }

    // If still not found, try without DOB match (less strict)
    if (!student) {
      console.log('Trying without DOB match...');
      student = await Student.findOne({
        where: {
          user_id: user.id.toString(),
          academic_year: String(academic_year),
          course_type_id: String(course_type_id),
          course_id: String(course_id),
          year: String(semester_id)
        }
      });
    }

    if (!student) {
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const academicYears = await AcademicYear.findAll({
        order: [['session', 'DESC']]
      });

      console.log('Student not found with provided criteria');
      console.log('Search criteria:', {
        user_id: user.id.toString(),
        academic_year: String(academic_year),
        course_type_id: String(course_type_id),
        course_id: String(course_id),
        year: String(semester_id),
        dob: dobFormatted
      });
      req.flash('error', 'No payment found with the provided details. Please verify your information.');
      return res.render('frontend/reprint/reprint_payment_receipt', {
        title: 'Reprint Payment Receipt',
        errors: ['No payment found with the provided details. Please verify your information.'],
        courseTypes: courseTypes,
        academicYears: academicYears,
        oldInput: req.body || {}
      });
    }

    console.log('Student found:', student.id, student.registration_no, 'DOB:', student.dob);

    // Find all successful payments for this user in this academic year
    const payments = await Payment.findAll({
      where: {
        user_id: user.id.toString(),
        academic_year: String(academic_year),
        status: 'Success',
        fee_type: 'form_fee'
      },
      order: [['created_at', 'DESC']]
    });

    if (!payments || payments.length === 0) {
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const academicYears = await AcademicYear.findAll({
        order: [['session', 'DESC']]
      });

      console.log('No successful payments found for user in this academic year');
      req.flash('error', 'Payment not found or payment was not successful.');
      return res.render('frontend/reprint/reprint_payment_receipt', {
        title: 'Reprint Payment Receipt',
        errors: ['Payment not found or payment was not successful.'],
        courseTypes: courseTypes,
        academicYears: academicYears,
        oldInput: req.body || {}
      });
    }

    console.log(`Found ${payments.length} successful payments for user. Searching for matching payload...`);

    let matchingPayment = null;
    let registrationData = null;

    for (const p of payments) {
      if (!p.payment_payload) continue;

      try {
        const payload = JSON.parse(p.payment_payload);

        // Match ALL criteria: semester, course, and course type
        // Note: Some payloads (like admission fee) might not have course_id/course_type_id
        if (payload.semester_id === String(semester_id) &&
          payload.course_id === String(course_id) &&
          payload.course_type_id === String(course_type_id)) {

          matchingPayment = p;
          registrationData = payload;
          console.log('Found matching payment ID:', p.id);
          break;
        }
      } catch (parseError) {
        console.log(`Could not parse payment_payload for payment ${p.id}:`, parseError.message);
      }
    }

    // If still not found, try a looser match (just semester_id and registration_no if available)
    if (!matchingPayment) {
      console.log('No perfect match found. Trying loose match (semester only)...');
      for (const p of payments) {
        if (!p.payment_payload) continue;
        try {
          const payload = JSON.parse(p.payment_payload);
          if (payload.semester_id === String(semester_id)) {
            matchingPayment = p;
            registrationData = payload;
            console.log('Found loose matching payment ID:', p.id);
            break;
          }
        } catch (e) { }
      }
    }

    if (!matchingPayment) {
      const courseTypes = await CourseType.findAll({
        where: { status: '1' },
        order: [['name', 'ASC']]
      });
      const academicYears = await AcademicYear.findAll({
        order: [['session', 'DESC']]
      });

      console.log('No payment found matching the provided course details');
      req.flash('error', 'Payment found but does not match the provided course details. Please verify your information.');
      return res.render('frontend/reprint/reprint_payment_receipt', {
        title: 'Reprint Payment Receipt',
        errors: ['Payment found but does not match the provided course details. Please verify your information.'],
        courseTypes: courseTypes,
        academicYears: academicYears,
        oldInput: req.body || {}
      });
    }

    const payment = matchingPayment;
    console.log('Using payment:', payment.id, 'Amount:', payment.amount, 'Status:', payment.status);

    // Fetch course, semester, academic year, and course type details
    let course = null;
    let semester = null;
    let courseType = null;
    let academicYear = null;

    if (registrationData) {
      const courseIdInt = typeof registrationData.course_id === 'string' ? parseInt(registrationData.course_id) : registrationData.course_id;
      const semesterIdInt = typeof registrationData.semester_id === 'string' ? parseInt(registrationData.semester_id) : registrationData.semester_id;
      const courseTypeIdInt = typeof registrationData.course_type_id === 'string' ? parseInt(registrationData.course_type_id) : registrationData.course_type_id;

      if (courseIdInt) {
        course = await Course.findByPk(courseIdInt);
      }
      if (semesterIdInt) {
        semester = await Semester.findByPk(semesterIdInt);
      }
      if (courseTypeIdInt) {
        courseType = await CourseType.findByPk(courseTypeIdInt);
      }
    }

    // Fetch AcademicYear details
    if (payment.academic_year) {
      academicYear = await AcademicYear.findByPk(payment.academic_year);
    }

    // Format payment date
    let paymentDate = '-';
    let paymentTime = '';
    if (payment.txnCompleteDate) {
      const dateObj = new Date(payment.txnCompleteDate);
      paymentDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      paymentTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (payment.transaction_date) {
      const dateObj = new Date(payment.transaction_date);
      paymentDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      paymentTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else if (payment.created_at) {
      const dateObj = new Date(payment.created_at);
      paymentDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      paymentTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    console.log('Payment data prepared:', {
      transaction_id: payment.merchant_txn_id,
      user_name: user.name,
      user_email: user.email,
      user_phone: user.phone,
      course: course?.name,
      semester: semester?.name,
      courseType: courseType?.name
    });

    return res.render('frontend/reprint/registration_fee_receipt', {
      title: 'Registration Fee Receipt',
      payment: payment,
      registrationData: registrationData,
      user: user,
      course: course,
      semester: semester,
      courseType: courseType,
      academicYear: academicYear,
      paymentDate: paymentDate,
      paymentTime: paymentTime,
      layout: 'frontend'
    });

  } catch (error) {
    console.error('Error showing payment receipt:', error);
    const courseTypes = await CourseType.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });
    const academicYears = await AcademicYear.findAll({
      order: [['session', 'DESC']]
    });

    req.flash('error', 'An error occurred while retrieving the payment receipt. Please try again.');
    return res.render('frontend/reprint/reprint_payment_receipt', {
      title: 'Reprint Payment Receipt',
      errors: ['An error occurred while retrieving the payment receipt. Please try again.'],
      courseTypes: courseTypes,
      academicYears: academicYears,
      oldInput: req.body || {}
    });
  }
};


/**
 * Show print application form
 */
export const printApplicationForm = async (req, res) => {
  try {
    const academicYears = await AcademicYear.findAll({
      order: [['session', 'DESC']]
    });

    const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });

    return res.render('frontend/reprint/print_application_form', {
      title: 'Print Application Form',
      errors: req.flash('error'),
      academicYears: academicYears,
      activeAcademicYear: activeAcademicYear,
      oldInput: req.query || {}
    });
  } catch (error) {
    console.error('Error rendering print application form:', error);
    req.flash('error', 'An error occurred. Please try again.');
    return res.redirect('/');
  }
};

/**
 * Process and show application form for printing
 */
export const showApplicationForm = async (req, res) => {
  try {
    const { academic_year, registration_no, dob } = req.query;

    if (!academic_year || !registration_no || !dob) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/print_application_form');
    }

    // Format DOB for comparison
    let dobFormatted = dob;
    if (dob.includes('/')) {
      const parts = dob.split('/');
      dobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else if (dob.includes('-')) {
      const parts = dob.split('-');
      if (parts[0].length === 2) {
        dobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    // Find student record
    const student = await Student.findOne({
      where: {
        registration_no: registration_no,
        academic_year: String(academic_year),
        dob: dobFormatted
      },
      include: [
        { model: User, as: 'user' },
        { model: Course, as: 'courseName' },
        { model: Semester, as: 'semsterName' },
        { model: Subject, as: 'major1' },
        { model: Subject, as: 'major2' },
        { model: Subject, as: 'minor' },
        { model: Skills, as: 'skill' },
        { model: Cocurricular, as: 'cocurricular' },
        { 
          model: StudentDocument, 
          as: 'documents',
          include: [{ model: DocumentType, as: 'documentType' }]
        }
      ]
    });

    if (!student) {
      req.flash('error', 'No application found with the provided details.');
      return res.redirect('/print_application_form');
    }

    // Fetch associated data needed for the preview
    const educationals = await Educational.findAll({
      where: { registration_no: student.registration_no },
      include: [{ model: Qualification, as: 'qualification' }]
    });

    const weightages = await Weightage.findAll();

    const payment = await Payment.findOne({
      where: { 
        user_id: String(student.user_id), 
        academic_year: String(academic_year),
        status: 'Success' 
      },
      order: [['created_at', 'DESC']]
    });

    const activeAcademicYear = await AcademicYear.findByPk(academic_year);

    return res.render('student_panel/admission/form_preview/registration_form_preview', {
      title: 'Print Application Form',
      student,
      user: student.user,
      activeAcademicYear,
      educationals,
      weightages,
      payment,
      layout: 'frontend'
    });

  } catch (error) {
    console.error('Error showing application form:', error);
    req.flash('error', 'An error occurred while retrieving the application form.');
    return res.redirect('/print_application_form');
  }
};
