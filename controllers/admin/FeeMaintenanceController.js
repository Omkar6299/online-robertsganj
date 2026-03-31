import { Course, Semester, FeeMaintenance } from '../../models/index.js';
import { createFeeMaintenanceSchema, updateFeeMaintenanceSchema } from '../../validations/feeMaintenanceValidation.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { Op, col } from 'sequelize';

export const index = async (req, res) => {
  try {
    const { course_id, semester_id } = req.query;
    const whereClause = {};
    if (course_id) whereClause.Course = course_id;
    if (semester_id) whereClause.semester = semester_id;

    const fees = await FeeMaintenance.findAll({
      where: whereClause,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name'] },
        { model: Semester, as: 'semesterInfo', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const courses = await Course.findAll({ where: { status: '1' }, order: [['name', 'ASC']] });
    
    // Get semesters if course is selected for the filter
    let semesters = [];
    if (course_id) {
        semesters = await Semester.findAll({
            where: { course_id: course_id, status: 1 },
            order: [['order', 'ASC']]
        });
    }

    res.render('admin_panel/fee_maintenance/index', {
      title: 'Fee Maintenance',
      fees: fees,
      courses: courses,
      semesters: semesters,
      selectedCourseId: course_id || '',
      selectedSemesterId: semester_id || ''
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading fees.', '/admin/dashboard');
  }
};

export const show = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await FeeMaintenance.findByPk(id, {
      include: [
        { model: Course, as: 'course' },
        { model: Semester, as: 'semesterInfo' }
      ]
    });

    if (!fee) {
      return flashErrorAndRedirect(req, res, 'Fee record not found.', '/admin/fee_maintenance');
    }

    res.render('admin_panel/fee_maintenance/show', {
      title: 'Fee Maintenance Details',
      fee: fee
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the fee details.', '/admin/fee_maintenance');
  }
};

export const create = async (req, res) => {
  try {
    const courses = await Course.findAll({ where: { status: '1' }, order: [['name', 'ASC']] });
    res.render('admin_panel/fee_maintenance/create', {
      title: 'Add Fee Maintenance',
      courses: courses
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/fee_maintenance');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createFeeMaintenanceSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      const courses = await Course.findAll({ where: { status: '1' }, order: [['name', 'ASC']] });
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/fee_maintenance/create', {
        title: 'Add Fee Maintenance',
        courses: courses,
        oldInput: req.body
      });
    }

    // Auto-populate User with admin name
    value.User = req.user.name;

    await FeeMaintenance.create(value);
    flashSuccessAndRedirect(req, res, 'Fee maintenance record created successfully.', '/admin/fee_maintenance');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while saving the fee record.', '/admin/fee_maintenance');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await FeeMaintenance.findByPk(id);
    if (!fee) return flashErrorAndRedirect(req, res, 'Fee record not found.', '/admin/fee_maintenance');

    const courses = await Course.findAll({ where: { status: '1' }, order: [['name', 'ASC']] });
    const semesters = await Semester.findAll({ where: { course_id: fee.Course, status: 1 }, order: [['order', 'ASC']] });

    res.render('admin_panel/fee_maintenance/edit', {
      title: 'Edit Fee Maintenance',
      fee: fee,
      courses: courses,
      semesters: semesters
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the fee record.', '/admin/fee_maintenance');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await FeeMaintenance.findByPk(id);
    if (!fee) return flashErrorAndRedirect(req, res, 'Fee record not found.', '/admin/fee_maintenance');

    // Cast body value to Boolean for Sequelize
    const bodyForValidation = { 
      ...req.body,
      is_late_fee_applicable: req.body.is_late_fee_applicable ? 1 : 0 
    };

    const { error, value } = updateFeeMaintenanceSchema.validate(bodyForValidation, { abortEarly: false });
    if (error) {
       const errors = error.details.map(detail => detail.message);
       req.flash('errors', errors);
       return res.redirect(`/admin/fee_maintenance/${id}/edit`);
    }

    // Update User with admin name who updated it
    value.User = req.user.name;

    await fee.update(value);
    flashSuccessAndRedirect(req, res, 'Fee maintenance record updated successfully.', '/admin/fee_maintenance');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the fee record.', '/admin/fee_maintenance');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await FeeMaintenance.findByPk(id);
    if (!fee) return flashErrorAndRedirect(req, res, 'Fee record not found.', '/admin/fee_maintenance');

    await fee.destroy();
    flashSuccessAndRedirect(req, res, 'Fee maintenance record deleted successfully.', '/admin/fee_maintenance');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the fee record.', '/admin/fee_maintenance');
  }
};

// API for dynamic dropdown
export const getSemestersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const semesters = await Semester.findAll({
      where: { course_id: courseId, status: 1 },
      order: [['order', 'ASC']],
      attributes: ['id', 'name']
    });
    res.json({ semesters });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
};
