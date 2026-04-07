import AcademicYear from '../../models/AcademicYear.js';
import { createAcademicYearSchema, updateAcademicYearSchema } from '../../validations/academicYearValidation.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';

export const index = async (req, res) => {
  try {
    const academicYears = await AcademicYear.findAll({
      order: [['created_at', 'DESC']]
    });

    res.render('admin_panel/academic_years/index', {
      title: 'Session Management',
      academicYears: academicYears
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading academic years.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    res.render('admin_panel/academic_years/create', {
      title: 'Create Session'
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/academic-years');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = createAcademicYearSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/academic_years/create', {
        title: 'Create Session'
      });
    }

    const { session, status } = value;

    if (status === 'Active') {
      await AcademicYear.update({ status: 'Inactive' }, { where: {} });
    }

    await AcademicYear.create({
      session,
      status: status || 'Inactive'
    });

    flashSuccessAndRedirect(req, res, 'Session created successfully.', '/admin/academic-years');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the session.', '/admin/academic-years');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const academicYear = await AcademicYear.findByPk(id);

    if (!academicYear) {
      return flashErrorAndRedirect(req, res, 'Session not found.', '/admin/academic-years');
    }

    res.render('admin_panel/academic_years/edit', {
      title: 'Edit Session',
      academicYear: academicYear
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the session.', '/admin/academic-years');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const academicYear = await AcademicYear.findByPk(id);

    if (!academicYear) {
      return flashErrorAndRedirect(req, res, 'Session not found.', '/admin/academic-years');
    }

    const bodyForValidation = { ...req.body };
    delete bodyForValidation._method;

    const { error, value } = updateAcademicYearSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/academic-years/${id}/edit`);
    }

    const { session, status } = value;

    if (status === 'Active' && academicYear.status !== 'Active') {
      await AcademicYear.update({ status: 'Inactive' }, { where: {} });
    }

    await academicYear.update({
      session,
      status: status || academicYear.status
    });

    flashSuccessAndRedirect(req, res, 'Session updated successfully.', '/admin/academic-years');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the session.', '/admin/academic-years');
  }
};

export const activate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deactivate all first
    await AcademicYear.update({ status: 'Inactive' }, { where: {} });
    
    // Activate the chosen one
    const academicYear = await AcademicYear.findByPk(id);
    if (!academicYear) {
      return flashErrorAndRedirect(req, res, 'Session not found.', '/admin/academic-years');
    }
    
    await academicYear.update({ status: 'Active' });
    
    flashSuccessAndRedirect(req, res, 'Session activated successfully. All other sessions have been inactivated.', '/admin/academic-years');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while activating the session.', '/admin/academic-years');
  }
};
