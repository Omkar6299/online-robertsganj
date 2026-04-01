import Course from '../../models/Course.js';
import Semester from '../../models/Semester.js';
import DocumentType from '../../models/DocumentType.js';
import CourseSemesterDocument from '../../models/CourseSemesterDocument.js';
import { handleError, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col } from 'sequelize';

export const index = async (req, res) => {
  try {
    const { course_id, semester_id } = req.query;
    const where = {};
    if (course_id) where.course_id = course_id;
    if (semester_id) where.semester_id = semester_id;

    const mappings = await CourseSemesterDocument.findAll({
      where,
      include: [
        { model: Course, as: 'course' },
        { model: Semester, as: 'semester' },
        { model: DocumentType, as: 'documentType' }
      ],
      order: [
        [col('course.name'), 'ASC'],
        [col('semester.order'), 'ASC']
      ]
    });

    const courses = await Course.findAll({ where: { status: '1' } });
    let semesters = [];
    if (course_id) {
        semesters = await Semester.findAll({ where: { course_id: course_id }, order: [['order', 'ASC']] });
    }

    res.render('admin_panel/course_semester_documents/index', {
      title: 'Course Semester Document Mapping',
      mappings: mappings,
      courses: courses,
      semesters: semesters,
      selectedCourseId: course_id,
      selectedSemesterId: semester_id
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading mappings.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    const courses = await Course.findAll({ where: { status: '1' } });
    const documentTypes = await DocumentType.findAll({ where: { status: true } });

    res.render('admin_panel/course_semester_documents/create', {
      title: 'Create Mapping',
      courses: courses,
      documentTypes: documentTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/course_semester_documents');
  }
};

export const store = async (req, res) => {
  const transaction = await CourseSemesterDocument.sequelize.transaction();
  try {
    const { course_id, semester_id, document_type_ids } = req.body;

    if (!course_id || !semester_id) {
      req.flash('error', 'Course and Semester are required.');
      return res.redirect('/admin/course_semester_documents/create');
    }

    const docTypeIds = Array.isArray(document_type_ids) ? document_type_ids.map(Number) : (document_type_ids ? [Number(document_type_ids)] : []);

    // Delete mappings for this course/semester that are NOT in the current selection
    await CourseSemesterDocument.destroy({
      where: {
        course_id,
        semester_id,
        document_type_id: {
          [CourseSemesterDocument.sequelize.Sequelize.Op.notIn]: docTypeIds.length > 0 ? docTypeIds : [0]
        }
      },
      transaction
    });

    // Save/Update selected mappings
    for (const docTypeId of docTypeIds) {
      await CourseSemesterDocument.upsert({
        course_id,
        semester_id,
        document_type_id: docTypeId,
        is_required: req.body['is_required_' + docTypeId] || 'Required',
        status: true
      }, { transaction });
    }

    await transaction.commit();
    flashSuccessAndRedirect(req, res, 'Mappings synced successfully.', '/admin/course_semester_documents');
  } catch (error) {
    await transaction.rollback();
    handleError(req, res, error, 'An error occurred while syncing mappings.', '/admin/course_semester_documents');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = await CourseSemesterDocument.findByPk(id, {
        include: [
            { model: Course, as: 'course' },
            { model: Semester, as: 'semester' },
            { model: DocumentType, as: 'documentType' }
        ]
    });

    if (!mapping) {
      req.flash('error', 'Mapping not found.');
      return res.redirect('/admin/course_semester_documents');
    }

    const courses = await Course.findAll();
    const semesters = await Semester.findAll({ where: { course_id: mapping.course_id } });
    const documentTypes = await DocumentType.findAll();

    res.render('admin_panel/course_semester_documents/edit', {
      title: 'Edit Mapping',
      mapping: mapping,
      courses: courses,
      semesters: semesters,
      documentTypes: documentTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the mapping.', '/admin/course_semester_documents');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_required, status } = req.body;
    
    const mapping = await CourseSemesterDocument.findByPk(id);
    if (!mapping) {
        return flashErrorAndRedirect(req, res, 'Mapping not found.', '/admin/course_semester_documents');
    }

    await mapping.update({
      is_required,
      status: status === '1' || status === 1 || status === true
    });

    flashSuccessAndRedirect(req, res, 'Mapping updated successfully.', '/admin/course_semester_documents');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the mapping.', '/admin/course_semester_documents');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = await CourseSemesterDocument.findByPk(id);

    if (!mapping) {
      return flashErrorAndRedirect(req, res, 'Mapping not found.', '/admin/course_semester_documents');
    }

    await mapping.destroy();
    flashSuccessAndRedirect(req, res, 'Mapping deleted successfully.', '/admin/course_semester_documents');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the mapping.', '/admin/course_semester_documents');
  }
};

export const getSemesters = async (req, res) => {
  try {
    const { courseId } = req.params;
    const semesters = await Semester.findAll({ where: { course_id: courseId }, order: [['order', 'ASC']] });
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExistingMappings = async (req, res) => {
  try {
    const { courseId, semesterId } = req.params;
    const mappings = await CourseSemesterDocument.findAll({
      where: {
        course_id: courseId,
        semester_id: semesterId
      }
    });
    res.json(mappings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
