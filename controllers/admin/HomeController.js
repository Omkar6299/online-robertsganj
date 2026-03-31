import { Student, Course, AcademicYear, Payment, StudentAdmissionFeeDetail } from '../../models/index.js';
import { handleError } from '../../utils/responseHelper.js';
import { Op } from 'sequelize';

export const adminHome = async (req, res) => {
  try {
    const { academic_year_id } = req.query;

    // Fetch all academic years for selection
    const academicYears = await AcademicYear.findAll({ order: [['session', 'DESC']] });
    
    // Determine the current year to filter by
    const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
    const currentYearId = academic_year_id || (activeYear ? activeYear.id : null);

    const where = currentYearId ? { academic_year: String(currentYearId) } : {};

    // 1. Total Registered (Paid Form Fee)
    const formFeeSuccessCount = await Payment.count({
      where: {
        ...where,
        fee_type: 'form_fee',
        status: 'Success'
      }
    });

    // 2. Admitted Students (Paid Odd Sem Admission Fee)
    const admittedStudentCount = await StudentAdmissionFeeDetail.count({
      where: {
        ...where,
        semester_type: 'Odd',
        status: 'Success'
      }
    });

    // 3. Pending Applications
    const pendingCount = await Student.count({
      where: { 
        ...where,
        admission_status: 'Pending' 
      }
    });

    // 4. Rejected Applications
    const rejectedCount = await Student.count({
      where: { 
        ...where,
        admission_status: 'Disapproved' 
      }
    });

    const totalCourses = await Course.count();

    // 💰 Form Fees Collected
    const formFeeResult = await Payment.findAll({
      attributes: ['amount'],
      where: {
        ...where,
        fee_type: 'form_fee',
        status: 'Success'
      },
      raw: true
    });
    const totalFormFee = formFeeResult.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    // 💰 Admission Fees Collected
    const admissionFeeResult = await StudentAdmissionFeeDetail.findAll({
      attributes: ['amount'],
      where: {
        ...where,
        status: 'Success'
      },
      raw: true
    });
    const totalAdmissionFee = admissionFeeResult.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    const data = {
      formFeeSuccessCount,
      admittedStudentCount,
      pendingCount,
      rejectedCount,
      totalCourses,
      totalFormFee,
      totalAdmissionFee,
      totalFee: totalFormFee + totalAdmissionFee, // Combined total
      activeYearId: currentYearId
    };

    res.render('admin_panel/home/index', {
      title: 'Admin Dashboard',
      data: data,
      academicYears: academicYears,
      activeYearId: String(currentYearId)
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading dashboard.', '/admin/dashboard');
  }
};

