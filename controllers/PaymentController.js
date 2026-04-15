import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import AcademicYear from '../models/AcademicYear.js';
import Course from '../models/Course.js';
import Semester from '../models/Semester.js';
import CourseType from '../models/CourseType.js';
import { sequelize } from '../config/database.js';
import PaymentService from '../utils/services/PaymentService.js';
import { generateRegistrationNumber } from './LoginController.js';
import { handleError, flashSuccessAndRedirect, flashErrorAndRedirect } from '../utils/responseHelper.js';

export const paymentResponse = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log('=== PAYMENT CALLBACK RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Request query:', req.query);

    // Atom sends encrypted response
    const encData = req.body.encData || req.body.encResp || req.query.encData || req.query.encResp;

    if (!encData) {
      console.error('No encrypted data received from payment gateway');
      await t.rollback();
      req.flash('error', 'Invalid payment response. Please contact support.');
      return res.redirect('/registration_fees_payment');
    }

    // Parse payment response using PaymentService
    const parsedResponse = PaymentService.parsePaymentResponse(encData);

    if (!parsedResponse) {
      console.error('Failed to parse payment response');
      await t.rollback();
      req.flash('error', 'Failed to process payment response. Please contact support.');
      return res.redirect('/registration_fees_payment');
    }

    console.log('=== PARSED PAYMENT RESPONSE ===');
    console.log('Full parsed response:', JSON.stringify(parsedResponse, null, 2));
    console.log('Raw response structure:', JSON.stringify(parsedResponse.rawResponse, null, 2));

    // Determine payment status
    const statusCode = parsedResponse.statusCode || parsedResponse.txnStatusCode || '';
    const isSuccess = parsedResponse.success || statusCode === 'OTS0000' || parsedResponse.message === 'SUCCESS';
    const isPending = statusCode === 'OTS0551' || parsedResponse.message === 'PENDING';

    console.log('=== PAYMENT STATUS ===');
    console.log('Status Code:', statusCode);
    // Explicitly check success/pending/failed
    let finalStatus = 'Failed';
    if (isSuccess) {
      finalStatus = 'Success';
    } else if (isPending) {
      finalStatus = 'Pending';
    }

    console.log('Final Status:', finalStatus);

    // Use transaction ID from payment record (merchant transaction ID) as primary source
    // Fallback to parsed response if payment record not found initially
    let transactionId = null;

    // Try to find payment record first to get the merchant transaction ID
    const paymentCheck = await Payment.findOne({
      where: {
        merchant_txn_id: parsedResponse.transactionId || req.body.transaction || req.query.transaction
      },
      transaction: t
    });

    if (paymentCheck) {
      transactionId = paymentCheck.merchant_txn_id;
    } else {
      // Try alternative transaction ID formats
      const altTransactionId = parsedResponse.transactionId || req.body.transaction || req.query.transaction;
      if (altTransactionId) {
        const paymentAlt = await Payment.findOne({
          where: {
            merchant_txn_id: altTransactionId
          },
          transaction: t
        });
        if (paymentAlt) {
          transactionId = paymentAlt.merchant_txn_id;
        }
      }
    }

    if (!transactionId) {
      console.error('Could not find payment record with transaction ID:', parsedResponse.transactionId);
      await t.rollback();
      req.flash('error', 'Payment record not found. Please contact support.');
      return res.redirect('/registration_fees_payment');
    }

    // Find payment record
    const payment = await Payment.findOne({
      where: { merchant_txn_id: transactionId },
      transaction: t
    });

    if (!payment) {
      console.error('Payment record not found for transaction:', transactionId);
      await t.rollback();
      req.flash('error', 'Payment record not found. Please contact support.');
      return res.redirect('/registration_fees_payment');
    }

    console.log('=== PAYMENT RECORD FOUND ===');
    console.log('Payment ID:', payment.id);
    console.log('Payment Merchant Txn ID:', payment.merchant_txn_id);
    console.log('Payment Status:', payment.status);
    console.log('Payment User ID:', payment.user_id);

    // Update payment record
    await payment.update({
      status: finalStatus,
      atom_txn_id: parsedResponse.atomTxnId || null,
      bank_transaction_id: parsedResponse.bankTxnId || null,
      txnInitDate: parsedResponse.txnInitDate || null,
      txnCompleteDate: parsedResponse.txnCompleteDate || null,
      transaction_date: parsedResponse.txnCompleteDate || null
    }, { transaction: t });

    // If payment successful, create Student record and update user transaction_id
    if (isSuccess) {
      console.log('=== PAYMENT SUCCESSFUL - PROCESSING STUDENT CREATION ===');

      // Parse registration data from payment_payload
      let registrationData = null;
      try {
        if (!payment.payment_payload) {
          throw new Error('payment_payload is null or undefined in payment record');
        }

        console.log('Raw payment_payload to parse:', payment.payment_payload);
        registrationData = JSON.parse(payment.payment_payload);
        console.log('Registration data parsed successfully:', {
          registration_no: registrationData.registration_no,
          user_id: payment.user_id,
          academic_year: registrationData.academic_year,
          name: registrationData.name,
          details: registrationData
        });

        // Safety check for academic_year
        if (!registrationData.academic_year) {
          console.error('CRITICAL: academic_year is missing in registration data');
        }
      } catch (parseError) {
        console.error('=== FAILED TO PARSE REGISTRATION DATA ===');
        console.error('Parse error:', parseError.message);
        console.error('payment_payload value:', payment.payment_payload);
        await t.rollback();
        req.flash('error', `Payment successful, but failed to retrieve registration data: ${parseError.message}. Please contact support with transaction ID ${transactionId}.`);
        return res.redirect('/registration_fees_payment');
      }

      console.log('Checking for existing student with:', {
        user_id: payment.user_id,
        academic_year: registrationData.academic_year
      });

      const existingStudent = await Student.findOne({
        where: {
          user_id: String(payment.user_id),
          academic_year: String(registrationData.academic_year || '')
        },
        transaction: t
      });

      if (existingStudent) {
        console.log('=== STUDENT ALREADY EXISTS ===');
        console.log('Student ID:', existingStudent.id);
        console.log('Registration Number:', existingStudent.registration_no);
        console.warn('Skipping student creation');
      } else {
        let finalRegistrationNo = String(registrationData.registration_no);

        // CHECK FOR REGISTRATION NUMBER COLLISION (Within the same session)
        // This handles race conditions where multiple students pay for the same number at once.
        const collisionCheck = await Student.findOne({
          where: {
            registration_no: finalRegistrationNo,
            academic_year: String(registrationData.academic_year)
          },
          transaction: t
        });

        if (collisionCheck) {
          console.warn(`Registration number collision detected for ${finalRegistrationNo} in session ${registrationData.academic_year}`);
          
          // Only regenerate if it's a NEW student. 
          // If it's a returning student re-using their ID, it should have been caught by existingStudent check.
          // But as a failsafe, we regenerate to ensure the record is created.
          const newRegNo = await generateRegistrationNumber(registrationData.course_id, t);
          console.log(`Regenerated new registration number: ${newRegNo}`);
          finalRegistrationNo = newRegNo;
        }

        const studentData = {
          user_id: parseInt(payment.user_id), 
          student_id: registrationData.student_id ? String(registrationData.student_id) : null,
          registration_no: finalRegistrationNo, // Use the verified/regenerated number
          course_type_id: parseInt(registrationData.course_type_id),
          course_id: parseInt(registrationData.course_id),
          year: String(registrationData.semester_id),
          academic_year: String(registrationData.academic_year),
          father_name: String(registrationData.father_name),
          mother_name: String(registrationData.mother_name),
          dob: String(registrationData.dob),
          photo: registrationData.photo || null,
          sign: registrationData.sign || null,
          photographsign_status: registrationData.photographsign_status || '0'
        };

        console.log('=== PREPARING TO CREATE STUDENT RECORD ===');
        console.log('Processed Student Data:', JSON.stringify(studentData, null, 2));

        try {
          // Create Student record
          const student = await Student.create(studentData, { transaction: t });

          console.log('=== STUDENT RECORD CREATED SUCCESSFULLY ===');
          console.log('Student ID:', student.id);
          console.log('Registration Number:', student.registration_no);
        } catch (createError) {
          console.error('=== FAILED TO CREATE STUDENT RECORD ===');
          console.error('Error Details:', {
            name: createError.name,
            message: createError.message,
            errors: createError.errors ? JSON.stringify(createError.errors, null, 2) : 'No details'
          });
          
          await t.rollback();
          req.flash('error', `Failed to create student record: ${createError.message}. Please contact support.`);
          return res.redirect('/registration_fees_payment');
        }
      }

      // Update user's transaction_id
      const user = await User.findByPk(payment.user_id, { transaction: t });
      if (user) {
        await user.update({ transaction_id: payment.merchant_txn_id }, { transaction: t });
        console.log('User transaction_id updated:', payment.merchant_txn_id);
      }
    } else {
      console.log('=== PAYMENT FAILED - STUDENT RECORD NOT CREATED ===');
      const errorMessage = parsedResponse.message || 'Payment failed';
      console.log('Payment status:', isSuccess);
      console.log('Status code:', statusCode);
      console.log('Error message:', errorMessage);
    }

    // Commit transaction
    await t.commit();

    // Reload payment with updated data
    await payment.reload();

    // Parse registration data for display
    let registrationData = null;
    try {
      if (payment.payment_payload) {
        registrationData = JSON.parse(payment.payment_payload);
      }
    } catch (parseError) {
      console.warn('Could not parse registration data for display:', parseError);
    }

    // Render success, pending or failed page based on payment status
    if (isSuccess) {
      // RESTORE SESSION: If session was lost due to cross-site POST (SameSite issue),
      // we backfill it using the user_id linked to this payment.
      if (!req.session.admission_user_id) {
        const user = await User.findByPk(payment.user_id);
        if (user) {
          req.session.admission_user_id = user.id;
          req.session.admission_name = user.name;
          
          // Also restore student ID if possible
          const student = await Student.findOne({ where: { user_id: String(user.id) }, order: [['id', 'DESC']] });
          if (student) {
            req.session.admission_student_id = student.id;
            req.session.admission_registration_no = student.registration_no;
          }
          
          console.log('Session restored after registration payment for User ID:', user.id);
        }
      }

      // Redirect to receipt page instead of success page
      const merchantTransactionId = payment.merchant_txn_id;
      const redirectUrl = `/payment/receipt?transaction_id=${encodeURIComponent(merchantTransactionId)}`;

      return flashSuccessAndRedirect(req, res, 'Registration fee paid successfully!', redirectUrl);
    } else if (isPending) {
      return res.render('frontend/payment/payment_failed', {
        title: 'Payment Pending',
        payment: payment,
        registrationData: registrationData,
        transactionId: transactionId,
        errorMessage: 'Your payment is currently under verification (PENDING). Please check back later.'
      });
    } else {
      return res.render('frontend/payment/payment_failed', {
        title: 'Payment Failed',
        payment: payment,
        registrationData: registrationData,
        transactionId: transactionId,
        errorMessage: parsedResponse.message || 'Unknown error'
      });
    }

  } catch (error) {
    await t.rollback();
    console.error('Payment callback error:', error);
    console.error('Error stack:', error.stack);
    req.flash('error', 'An error occurred while processing payment. Please contact support.');
    return res.redirect('/registration_fees_payment');
  }
};

export const paymentReceipt = async (req, res) => {
  try {
    const { transaction_id } = req.query;

    if (!transaction_id) {
      req.flash('error', 'Transaction ID is required.');
      return res.redirect('/registration_fees_payment');
    }

    console.log('=== PAYMENT RECEIPT REQUEST ===');
    console.log('Transaction ID:', transaction_id);

    // Find payment record
    const payment = await Payment.findOne({
      where: {
        merchant_txn_id: transaction_id,
        status: 'Success'
      }
    });

    if (!payment) {
      req.flash('error', 'Payment not found or payment was not successful.');
      return res.redirect('/registration_fees_payment');
    }

    // Find user
    const user = await User.findByPk(payment.user_id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/registration_fees_payment');
    }

    // Parse registration data
    let registrationData = null;
    try {
      if (payment.payment_payload) {
        registrationData = JSON.parse(payment.payment_payload);
      }
    } catch (parseError) {
      console.error('Could not parse registration data:', parseError);
      req.flash('error', 'Could not retrieve registration details.');
      return res.redirect('/registration_fees_payment');
    }

    if (!registrationData) {
      req.flash('error', 'Registration data not found.');
      return res.redirect('/registration_fees_payment');
    }

    // Fetch course, semester, and course type details
    const courseIdInt = typeof registrationData.course_id === 'string' ? parseInt(registrationData.course_id) : registrationData.course_id;
    const semesterIdInt = typeof registrationData.semester_id === 'string' ? parseInt(registrationData.semester_id) : registrationData.semester_id;
    const courseTypeIdInt = typeof registrationData.course_type_id === 'string' ? parseInt(registrationData.course_type_id) : registrationData.course_type_id;

    const course = await Course.findByPk(courseIdInt);
    const semester = await Semester.findByPk(semesterIdInt);
    const courseType = await CourseType.findByPk(courseTypeIdInt);

    // Fetch AcademicYear details
    let academicYear = null;
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

    return res.render('frontend/reprint/registration_fee_receipt', {
      title: 'Registration Fee Receipt',
      payment: payment,
      user: user,
      registrationData: registrationData,
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
    req.flash('error', 'An error occurred while retrieving the payment receipt.');
    return res.redirect('/registration_fees_payment');
  }
};

export const paymentSuccess = async (req, res) => {
  try {
    const { transaction_id } = req.query;

    if (!transaction_id) {
      req.flash('error', 'Transaction ID is required.');
      return res.redirect('/registration_fees_payment');
    }

    // Redirect to receipt page
    return res.redirect(`/payment/receipt?transaction_id=${encodeURIComponent(transaction_id)}`);
  } catch (error) {
    console.error('Error in payment success:', error);
    req.flash('error', 'An error occurred.');
    return res.redirect('/registration_fees_payment');
  }
};

export const paymentFailed = async (req, res) => {
  try {
    const { transaction_id } = req.query;

    if (!transaction_id) {
      req.flash('error', 'Transaction ID is required.');
      return res.redirect('/registration_fees_payment');
    }

    const payment = await Payment.findOne({
      where: { merchant_txn_id: transaction_id }
    });

    let registrationData = null;
    if (payment && payment.payment_payload) {
      try {
        registrationData = JSON.parse(payment.payment_payload);
      } catch (parseError) {
        console.warn('Could not parse registration data:', parseError);
      }
    }

    return res.render('frontend/payment/payment_failed', {
      title: 'Payment Failed',
      payment: payment,
      registrationData: registrationData,
      transactionId: transaction_id,
      errorMessage: 'Payment was not successful'
    });
  } catch (error) {
    console.error('Error in payment failed:', error);
    req.flash('error', 'An error occurred.');
    return res.redirect('/registration_fees_payment');
  }
};
