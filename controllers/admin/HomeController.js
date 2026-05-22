import { Student, Course, Semester, AcademicYear, Payment, StudentAdmissionFeeDetail } from '../../models/index.js';
import { handleError } from '../../utils/responseHelper.js';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
export const adminHome = async (req, res) => {
  try {
    const { academic_year_id, course_id, semester_id } = { ...req.query, ...req.body };

    // Fetch all academic years for selection
    const academicYears = await AcademicYear.findAll({ order: [['session', 'DESC']] });
    
    // Determine the current year to filter by
    const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
    const currentYearId = academic_year_id || (activeYear ? activeYear.id : null);

    const where = currentYearId ? { academic_year: String(currentYearId) } : {};

    // Get matching students if course or semester filter is applied
    const studentWhere = { ...where };
    if (course_id) studentWhere.course_id = course_id;
    if (semester_id) studentWhere.year = semester_id;

    let userIds = null;
    let studentIds = null;

    if (course_id || semester_id) {
        const students = await Student.findAll({ where: studentWhere, attributes: ['id', 'user_id'] });
        studentIds = students.map(s => s.id);
        userIds = students.map(s => s.user_id);
    }

    const paymentWhere = { ...where, fee_type: 'form_fee', status: 'Success' };
    if (userIds !== null) paymentWhere.user_id = { [Op.in]: userIds };

    const admissionFeeWhere = { ...where, status: 'Success' };
    if (studentIds !== null) admissionFeeWhere.student_id = { [Op.in]: studentIds };

    // 1. Total Registered (Paid Form Fee)
    const formFeeSuccessCount = await Payment.count({
      where: paymentWhere
    });

    // 2. Admitted Students (Paid Odd Sem Admission Fee)
    const admittedStudentCount = await StudentAdmissionFeeDetail.count({
      where: {
        ...admissionFeeWhere,
        semester_type: 'Odd'
      }
    });

    // 3. Pending Applications
    const pendingCount = await Student.count({
      where: { 
        ...studentWhere,
        admission_status: 'Pending' 
      }
    });

    // 4. Rejected Applications
    const rejectedCount = await Student.count({
      where: { 
        ...studentWhere,
        admission_status: 'Disapproved' 
      }
    });

    const totalCourses = await Course.count();

    // 💰 Form Fees Collected
    const formFeeResult = await Payment.findAll({
      attributes: ['amount'],
      where: paymentWhere,
      raw: true
    });
    const totalFormFee = formFeeResult.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    // 💰 Admission Fees Collected
    const admissionFeeResult = await StudentAdmissionFeeDetail.findAll({
      attributes: ['amount'],
      where: admissionFeeWhere,
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

    // Fetch all courses for dropdown
    const courses = await Course.findAll({
      where: { status: '1' },
      order: [['name', 'ASC']]
    });

    // Fetch semesters for the selected course (Odd semesters only)
    let semesters = [];
    if (course_id) {
      semesters = await Semester.findAll({
        where: { 
          course_id: String(course_id), 
          status: 1,
          order: ['1', '3', '5', '7', '9'] // Only odd semesters
        },
        order: [['order', 'ASC']]
      });
    }

    // Summarized Report Query
    const reportData = await sequelize.query(`
        SELECT 
            ct.name AS class,
            c.name AS courseName,
            s.name AS semesterName,
            COUNT(st.id) AS totalRegistered,
            SUM(CASE WHEN st.declaration_status = '1' THEN 1 ELSE 0 END) AS totalApplied,
            SUM(CASE WHEN st.admission_status = 'Approved' THEN 1 ELSE 0 END) AS totalCounselling,
            COUNT(DISTINCT safd.student_id) AS totalAdmitted
        FROM 
            semesters s
        JOIN courses c ON s.course_id = c.id
        JOIN course_types ct ON c.course_type_id = ct.id
        LEFT JOIN students st ON CAST(st.year AS UNSIGNED) = s.id 
            AND (:academic_year IS NULL OR st.academic_year = :academic_year)
        LEFT JOIN student_admission_fee_details safd ON safd.student_id = st.id 
            AND safd.status = 'Success' 
            AND safd.semester_type = 'Odd' 
            AND (:academic_year IS NULL OR safd.academic_year = :academic_year)
        WHERE 
            ct.status = '1' 
            AND c.status = '1' 
            AND s.status = 1
            AND s.order IN ('1', '3', '5', '7', '9')
            AND (:course_id IS NULL OR c.id = :course_id)
            AND (:semester_id IS NULL OR s.id = :semester_id)
        GROUP BY 
            ct.name, c.name, s.name, ct.id, c.id, s.id, s.order
        ORDER BY 
            ct.id, c.name, s.order
    `, {
        replacements: { 
            academic_year: currentYearId || null,
            course_id: course_id || null,
            semester_id: semester_id || null
        },
        type: QueryTypes.SELECT
    });

    res.render('admin_panel/home/index', {
      title: 'Admin Dashboard',
      data: data,
      reportData: reportData,
      academicYears: academicYears,
      courses: courses,
      semesters: semesters,
      activeYearId: String(currentYearId),
      filters: {
        course_id: course_id || '',
        semester_id: semester_id || ''
      }
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading dashboard.', '/admin/dashboard');
  }
};
