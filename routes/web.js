import express from 'express';
import * as LoginController from '../controllers/LoginController.js';
import * as PaymentController from '../controllers/PaymentController.js';
import * as ReprintController from '../controllers/ReprintController.js';
import * as AdminLoginController from '../controllers/admin/AdminLoginController.js';
import * as HomeController from '../controllers/admin/HomeController.js';
import * as CourseController from '../controllers/admin/CourseController.js';
import * as FormVerificationController from '../controllers/admin/FormVerificationController.js';
import * as SubjectController from '../controllers/admin/SubjectController.js';
import * as SemesterController from '../controllers/admin/SemesterController.js';
import * as ClassController from '../controllers/admin/ClassController.js';
import * as CourseTypeController from '../controllers/admin/CourseTypeController.js';
import * as CourseSemesterController from '../controllers/admin/CourseSemesterController.js';
import * as WeightageController from '../controllers/admin/WeightageController.js';
import * as SkillController from '../controllers/admin/SkillController.js';
import * as CocurricularController from '../controllers/admin/CocurricularController.js';
import * as UserController from '../controllers/admin/UserController.js';
import * as RoleController from '../controllers/admin/RoleController.js';
import * as RegisterStudentController from '../controllers/admin/RegisterStudentController.js';
import * as FeeMaintenanceController from '../controllers/admin/FeeMaintenanceController.js';
import * as DocumentTypeController from '../controllers/admin/DocumentTypeController.js';
import * as CourseSemesterDocumentController from '../controllers/admin/CourseSemesterDocumentController.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { isSuperAdmin } from '../middleware/isSuperAdmin.js';
import { checkAdmissionLogin } from '../middleware/checkAdmissionLogin.js';
import * as StudentAdmissionController from '../controllers/StudentAdmissionController.js';
import * as StudentDashboardController from '../controllers/student/StudentDashboardController.js';
import * as AdmissionFeeController from '../controllers/student/AdmissionFeeController.js';
import * as ReRegistrationController from '../controllers/student/ReRegistrationController.js';
import * as LocationController from '../controllers/LocationController.js';
import { admissionUpload } from '../middleware/uploadMiddleware.js';
import { AcademicYear } from '../models/index.js';
import fieldLabels from '../config/fieldLabels.js';

const router = express.Router();

// Helper functions for views
const setActive = (path, routes) => {
  // Normalize path - remove leading slash for comparison
  const normalizedPath = path.replace(/^\//, '');
  const routesArray = Array.isArray(routes) ? routes : [routes];
  return routesArray.some(route => {
    // Remove leading slash and convert wildcard pattern to regex
    const normalizedRoute = route.replace(/^\//, '');
    const pattern = normalizedRoute.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(normalizedPath);
  }) ? 'active' : '';
};

const setMenuOpen = (path, routes) => {
  // Normalize path - remove leading slash for comparison
  const normalizedPath = path.replace(/^\//, '');
  const routesArray = Array.isArray(routes) ? routes : [routes];
  return routesArray.some(route => {
    // Remove leading slash and convert wildcard pattern to regex
    const normalizedRoute = route.replace(/^\//, '');
    const pattern = normalizedRoute.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(normalizedPath);
  }) ? 'menu-open' : '';
};

// Make helpers available to views
router.use((req, res, next) => {
  res.locals.set_active = (routes) => setActive(req.path, routes);
  res.locals.set_menu_open = (routes) => setMenuOpen(req.path, routes);
  res.locals.fieldLabels = fieldLabels;
  next();
});

// Frontend routes
router.get('/', async (req, res) => {
  try {
    const activeAcademicYear = await AcademicYear.findOne({ where: { status: 'Active' } });
    res.render('frontend/home/index', { 
      title: 'Home',
      activeAcademicYear: activeAcademicYear
    });
  } catch (error) {
    console.error('Error fetching active academic year for home page:', error);
    res.render('frontend/home/index', { title: 'Home' });
  }
});

router.get('/get-course/:type_id', LoginController.coursesByType);
router.get('/get-semester/:courseId', LoginController.getSemester);
router.get('/get-student/:registration_no', LoginController.getStudentByRegistrationNo);
router.get('/registration_fees_payment', LoginController.registration_fees_payment);
router.post('/registration_fees_payment_post', LoginController.registration_fees_payment_post);
router.post('/payment/initiate', LoginController.initiatePayment);
router.post('/payment/response', PaymentController.paymentResponse);
router.get('/payment/response', PaymentController.paymentResponse); // Handle GET redirects from payment gateway
router.get('/payment/receipt', PaymentController.paymentReceipt); // Payment receipt page
router.get('/payment/success', PaymentController.paymentSuccess);
router.get('/payment/failed', PaymentController.paymentFailed);

router.get('/admission_login', LoginController.admission_login);
router.post('/admission_login_post', LoginController.admission_login_post);

// Reprint routes
router.get('/reprint_payment_receipt', ReprintController.reprintPaymentReceipt);
router.post('/reprint_payment_receipt_', ReprintController.showPaymentReceipt);
router.get('/know_your_registration', ReprintController.knowYourRegistration);
router.get('/print_application_form', ReprintController.printApplicationForm);
router.get('/print_application_form_show', ReprintController.showApplicationForm);

// Student routes (protected)
router.get('/student/dashboard', checkAdmissionLogin, StudentDashboardController.index);

router.get('/student/admission_logout', checkAdmissionLogin, LoginController.admission_logout);

// Student Admission Form routes
router.get('/student/registration', checkAdmissionLogin, StudentAdmissionController.registrationForm);
router.post('/student/personal_details_post', checkAdmissionLogin, StudentAdmissionController.personalDetailsPost);
router.post('/student/address_details_post', checkAdmissionLogin, StudentAdmissionController.addressDetailsPost);
router.post('/student/educational_details_post', checkAdmissionLogin, StudentAdmissionController.educationalDetailsPost);
router.post('/student/subject_details_post', checkAdmissionLogin, StudentAdmissionController.subjectDetailsPost);
router.post('/student/other_details_post', checkAdmissionLogin, StudentAdmissionController.otherDetailsPost);
router.post('/student/weightage_details_post', checkAdmissionLogin, StudentAdmissionController.weightageDetailsPost);
router.post('/student/photograph_sign_details_post', checkAdmissionLogin, admissionUpload, StudentAdmissionController.photoSignPost);
router.post('/student/declaration_details_post', checkAdmissionLogin, StudentAdmissionController.declarationPost);

// Student Print routes
router.get('/student/print_application_form', checkAdmissionLogin, StudentAdmissionController.printApplicationForm);
router.get('/student/show_receipt', checkAdmissionLogin, StudentAdmissionController.printReceipt);

// Admission Fee Payment routes
router.get('/student/fees_payment', checkAdmissionLogin, AdmissionFeeController.initiatePayment);
router.post('/student/admission_payment_response', AdmissionFeeController.paymentResponse);
router.get('/student/admission_payment_response', AdmissionFeeController.paymentResponse);
router.get('/student/admission_receipt', checkAdmissionLogin, AdmissionFeeController.generateReceipt);

// Re-Registration route
router.get('/student/re_register', checkAdmissionLogin, ReRegistrationController.reRegister);

// Location Proxy Routes
router.get('/locations/states', LocationController.getStates);
router.get('/locations/districts', LocationController.getDistricts);

// Admin routes
router.get('/login', AdminLoginController.adminLogin);
router.post('/login', AdminLoginController.adminLoginPost);

router.get('/admin/dashboard', isAdmin, HomeController.adminHome);

// Admin Course routes
router.get('/admin/courses', isSuperAdmin, CourseController.index);
router.get('/admin/courses/create', isSuperAdmin, CourseController.create);
router.post('/admin/courses', isSuperAdmin, CourseController.store);
router.get('/admin/courses/:id/edit', isSuperAdmin, CourseController.edit);
router.put('/admin/courses/:id', isSuperAdmin, CourseController.update);
router.delete('/admin/courses/:id', isSuperAdmin, CourseController.destroy);
// Fallback POST handler for PUT and DELETE (in case method-override doesn't work)
router.post('/admin/courses/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return CourseController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return CourseController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/courses');
});
// Redirect direct GET requests to courses list (safeguard - prevents 404)
router.get('/admin/courses/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a course.');
  res.redirect('/admin/courses');
});

// Admin Subject routes
router.get('/admin/subjects', isSuperAdmin, SubjectController.index);
router.get('/admin/subjects/create', isSuperAdmin, SubjectController.create);
router.post('/admin/subjects', isSuperAdmin, SubjectController.store);
router.get('/admin/subjects/:id/edit', isSuperAdmin, SubjectController.edit);
router.put('/admin/subjects/:id', isSuperAdmin, SubjectController.update);
router.delete('/admin/subjects/:id', isSuperAdmin, SubjectController.destroy);
// Fallback POST handler for PUT and DELETE (in case method-override doesn't work)
router.post('/admin/subjects/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return SubjectController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return SubjectController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/subjects');
});
// Redirect direct GET requests to subjects list (safeguard - prevents 404)
router.get('/admin/subjects/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a subject.');
  res.redirect('/admin/subjects');
});

// Admin Semester routes
router.get('/admin/semesters', isSuperAdmin, SemesterController.index);
router.get('/admin/semesters/create', isSuperAdmin, SemesterController.create);
router.post('/admin/semesters', isSuperAdmin, SemesterController.store);
router.get('/admin/semesters/:id/edit', isSuperAdmin, SemesterController.edit);
router.put('/admin/semesters/:id', isSuperAdmin, SemesterController.update);
router.delete('/admin/semesters/:id', isSuperAdmin, SemesterController.destroy);
// Fallback POST handler for PUT and DELETE (in case method-override doesn't work)
router.post('/admin/semesters/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return SemesterController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return SemesterController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/semesters');
});
// Redirect direct GET requests to semesters list (safeguard - prevents 404)
router.get('/admin/semesters/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a semester.');
  res.redirect('/admin/semesters');
});

// Admin Course Type routes
router.get('/admin/course_types', isSuperAdmin, CourseTypeController.index);
router.get('/admin/course_types/create', isSuperAdmin, CourseTypeController.create);
router.post('/admin/course_types', isSuperAdmin, CourseTypeController.store);
router.get('/admin/course_types/:id/edit', isSuperAdmin, CourseTypeController.edit);
router.put('/admin/course_types/:id', isSuperAdmin, CourseTypeController.update);
router.delete('/admin/course_types/:id', isSuperAdmin, CourseTypeController.destroy);
// Fallback POST handler for PUT and DELETE (in case method-override doesn't work)
router.post('/admin/course_types/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return CourseTypeController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return CourseTypeController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/course_types');
});
// Redirect direct GET requests to course types list (safeguard - prevents 404)
router.get('/admin/course_types/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a course type.');
  res.redirect('/admin/course_types');
});

// Admin Qualification routes
router.get('/admin/qualifications', isSuperAdmin, ClassController.index);
router.get('/admin/qualifications/create', isSuperAdmin, ClassController.create);
router.post('/admin/qualifications', isSuperAdmin, ClassController.store);
router.get('/admin/qualifications/:id/edit', isSuperAdmin, ClassController.edit);
router.put('/admin/qualifications/:id', isSuperAdmin, ClassController.update);
router.delete('/admin/qualifications/:id', isSuperAdmin, ClassController.destroy);
// Fallback POST handler for PUT and DELETE (in case method-override doesn't work)
router.post('/admin/qualifications/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    // Call destroy method directly
    return ClassController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    // Call update method directly
    return ClassController.update(req, res, next);
  }
  // If not a PUT or DELETE request, redirect to qualifications list
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/qualifications');
});
// Redirect direct GET requests to qualifications list (safeguard - prevents 404)
router.get('/admin/qualifications/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a qualification.');
  res.redirect('/admin/qualifications');
});

// Admin Registration Qualifications routes
router.get('/admin/registration_qualifications', isSuperAdmin, CourseSemesterController.index);
router.get('/admin/registration_qualifications/create', isSuperAdmin, CourseSemesterController.create);
router.post('/admin/registration_qualifications', isSuperAdmin, CourseSemesterController.store);
router.get('/admin/registration_qualifications/get-qualifications', isSuperAdmin, CourseSemesterController.getQualifications);
router.get('/admin/registration_qualifications/:id/edit', isSuperAdmin, CourseSemesterController.edit);
router.put('/admin/registration_qualifications/:id', isSuperAdmin, CourseSemesterController.update);
router.delete('/admin/registration_qualifications/:id', isSuperAdmin, CourseSemesterController.destroy);
// Fallback POST handler for PUT and DELETE (in case method-override doesn't work)
router.post('/admin/registration_qualifications/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return CourseSemesterController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return CourseSemesterController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/registration_qualifications');
});
// Redirect direct GET requests to registration qualifications list (safeguard - prevents 404)
router.get('/admin/registration_qualifications/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a registration qualification.');
  res.redirect('/admin/registration_qualifications');
});

// Admin Weightage routes
router.get('/admin/weightages', isSuperAdmin, WeightageController.index);
router.get('/admin/weightages/create', isSuperAdmin, WeightageController.create);
router.post('/admin/weightages', isSuperAdmin, WeightageController.store);
router.get('/admin/weightages/:id/edit', isSuperAdmin, WeightageController.edit);
router.put('/admin/weightages/:id', isSuperAdmin, WeightageController.update);
router.delete('/admin/weightages/:id', isSuperAdmin, WeightageController.destroy);
// Fallback POST handler for PUT and DELETE
router.post('/admin/weightages/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return WeightageController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return WeightageController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/weightages');
});

// Admin Skill routes
router.get('/admin/skills', isSuperAdmin, SkillController.index);
router.get('/admin/skills/create', isSuperAdmin, SkillController.create);
router.post('/admin/skills', isSuperAdmin, SkillController.store);
router.get('/admin/skills/:id/edit', isSuperAdmin, SkillController.edit);
router.put('/admin/skills/:id', isSuperAdmin, SkillController.update);
router.delete('/admin/skills/:id', isSuperAdmin, SkillController.destroy);
// Fallback POST handler for PUT and DELETE
router.post('/admin/skills/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return SkillController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return SkillController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/skills');
});
// Redirect direct GET requests
router.get('/admin/skills/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a skill.');
  res.redirect('/admin/skills');
});

// Admin Co-curricular routes
router.get('/admin/cocurricular', isSuperAdmin, CocurricularController.index);
router.get('/admin/cocurricular/create', isSuperAdmin, CocurricularController.create);
router.post('/admin/cocurricular', isSuperAdmin, CocurricularController.store);
router.get('/admin/cocurricular/:id/edit', isSuperAdmin, CocurricularController.edit);
router.put('/admin/cocurricular/:id', isSuperAdmin, CocurricularController.update);
router.delete('/admin/cocurricular/:id', isSuperAdmin, CocurricularController.destroy);
// Fallback POST handler for PUT and DELETE
router.post('/admin/cocurricular/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return CocurricularController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return CocurricularController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/cocurricular');
});
// Redirect direct GET requests
router.get('/admin/cocurricular/:id', isSuperAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the delete button to remove a co-curricular course.');
  res.redirect('/admin/cocurricular');
});

// Admin User routes
router.get('/admin/users', isAdmin, UserController.index);
router.get('/admin/users/create', isAdmin, UserController.create);
router.post('/admin/users', isAdmin, UserController.store);
router.get('/admin/users/:id/edit', isAdmin, UserController.edit);
router.put('/admin/users/:id', isAdmin, UserController.update);
router.delete('/admin/users/:id', isAdmin, UserController.destroy);
// Fallback POST handler for PUT and DELETE
router.post('/admin/users/:id', isAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return UserController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return UserController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/users');
});
// Redirect direct GET requests
router.get('/admin/users/:id', isAdmin, (req, res) => {
  req.flash('error', 'Invalid request. Please use the edit or delete buttons.');
  res.redirect('/admin/users');
});

router.post('/admin/logout', isAdmin, AdminLoginController.adminLogout);

// Admin Registered Students routes
router.get('/admin/register_student_list', isAdmin, RegisterStudentController.index);
router.get('/admin/admitted_student_list', isAdmin, RegisterStudentController.admittedStudents);
router.get('/admin/export_admitted_students', isAdmin, RegisterStudentController.exportAdmittedStudents);
router.get('/admin/fee_payment_report', isAdmin, RegisterStudentController.feePaymentStatusReport);
router.get('/admin/students/:id', isAdmin, RegisterStudentController.show);
router.get('/admin/students/:id/edit', isAdmin, RegisterStudentController.edit);
router.post('/admin/students/:id/update', isAdmin, RegisterStudentController.update);
router.post('/admin/students/:id/update-status', isAdmin, RegisterStudentController.updateStatus);

// Admin Form Verification routes
router.get('/admin/form_verification', isAdmin, FormVerificationController.index);
router.post('/admin/form_verification_post/:registration_no', isAdmin, FormVerificationController.updateStatus);

// Admin Role routes
router.get('/admin/roles', isSuperAdmin, RoleController.index);
router.get('/admin/roles/create', isSuperAdmin, RoleController.create);
router.post('/admin/roles', isSuperAdmin, RoleController.store);
router.get('/admin/roles/:id/edit', isSuperAdmin, RoleController.edit);
router.put('/admin/roles/:id', isSuperAdmin, RoleController.update);
router.delete('/admin/roles/:id', isSuperAdmin, RoleController.destroy);
// Fallback POST handler
router.post('/admin/roles/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return RoleController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return RoleController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/roles');
});

// Admin Fee Maintenance routes
router.get('/admin/fee_maintenance', isSuperAdmin, FeeMaintenanceController.index);
router.get('/admin/fee_maintenance/create', isSuperAdmin, FeeMaintenanceController.create);
router.get('/admin/fee_maintenance/:id', isSuperAdmin, FeeMaintenanceController.show);
router.post('/admin/fee_maintenance', isSuperAdmin, FeeMaintenanceController.store);
router.get('/admin/fee_maintenance/:id/edit', isSuperAdmin, FeeMaintenanceController.edit);
router.put('/admin/fee_maintenance/:id', isSuperAdmin, FeeMaintenanceController.update);
router.delete('/admin/fee_maintenance/:id', isSuperAdmin, FeeMaintenanceController.destroy);
// Dynamic semester fetching API
router.get('/admin/fee_maintenance/get-semesters/:courseId', isSuperAdmin, FeeMaintenanceController.getSemestersByCourse);
// Fallback POST handler
router.post('/admin/fee_maintenance/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') {
    return FeeMaintenanceController.destroy(req, res, next);
  } else if (req.body._method === 'PUT') {
    return FeeMaintenanceController.update(req, res, next);
  }
  req.flash('error', 'Invalid request.');
  res.redirect('/admin/fee_maintenance');
});

// Admin Document Type routes
router.get('/admin/document_types', isSuperAdmin, DocumentTypeController.index);
router.get('/admin/document_types/create', isSuperAdmin, DocumentTypeController.create);
router.post('/admin/document_types', isSuperAdmin, DocumentTypeController.store);
router.get('/admin/document_types/:id/edit', isSuperAdmin, DocumentTypeController.edit);
router.put('/admin/document_types/:id', isSuperAdmin, DocumentTypeController.update);
router.delete('/admin/document_types/:id', isSuperAdmin, DocumentTypeController.destroy);
router.post('/admin/document_types/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') return DocumentTypeController.destroy(req, res, next);
  if (req.body._method === 'PUT') return DocumentTypeController.update(req, res, next);
  res.redirect('/admin/document_types');
});

// Admin Course Semester Document Mapping routes
router.get('/admin/course_semester_documents', isSuperAdmin, CourseSemesterDocumentController.index);
router.get('/admin/course_semester_documents/create', isSuperAdmin, CourseSemesterDocumentController.create);
router.post('/admin/course_semester_documents', isSuperAdmin, CourseSemesterDocumentController.store);
router.get('/admin/course_semester_documents/:id/edit', isSuperAdmin, CourseSemesterDocumentController.edit);
router.put('/admin/course_semester_documents/:id', isSuperAdmin, CourseSemesterDocumentController.update);
router.delete('/admin/course_semester_documents/:id', isSuperAdmin, CourseSemesterDocumentController.destroy);
router.get('/admin/course_semester_documents/get-semesters/:courseId', isSuperAdmin, CourseSemesterDocumentController.getSemesters);
router.get('/admin/course_semester_documents/get-mappings/:courseId/:semesterId', isSuperAdmin, CourseSemesterDocumentController.getExistingMappings);
router.post('/admin/course_semester_documents/:id', isSuperAdmin, (req, res, next) => {
  if (req.body._method === 'DELETE') return CourseSemesterDocumentController.destroy(req, res, next);
  if (req.body._method === 'PUT') return CourseSemesterDocumentController.update(req, res, next);
  res.redirect('/admin/course_semester_documents');
});

export default router;


