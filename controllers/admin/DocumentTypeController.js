import DocumentType from '../../models/DocumentType.js';
import { documentTypeSchema } from '../../validations/documentTypeValidation.js';
import { handleError, flashValidationErrorsAndRender, flashErrorAndRedirect, flashSuccessAndRedirect } from '../../utils/responseHelper.js';
import { col } from 'sequelize';

export const index = async (req, res) => {
  try {
    const documentTypes = await DocumentType.findAll({
      order: [[col('created_at'), 'DESC']]
    });

    res.render('admin_panel/document_types/index', {
      title: 'Document Types',
      documentTypes: documentTypes
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading document types.', '/admin/dashboard');
  }
};

export const create = async (req, res) => {
  try {
    res.render('admin_panel/document_types/create', {
      title: 'Create Document Type'
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the form.', '/admin/document_types');
  }
};

export const store = async (req, res) => {
  try {
    const { error, value } = documentTypeSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return flashValidationErrorsAndRender(req, res, errors, 'admin_panel/document_types/create', {
        title: 'Create Document Type'
      });
    }

    const { name, code, status } = value;
    
    await DocumentType.create({
      name,
      code: code.toLowerCase().replace(/\s+/g, '_'),
      status: status === '1' || status === 1 || status === true
    });

    flashSuccessAndRedirect(req, res, 'Document type created successfully.', '/admin/document_types');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while creating the document type.', '/admin/document_types');
  }
};

export const edit = async (req, res) => {
  try {
    const { id } = req.params;
    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      req.flash('error', 'Document type not found.');
      return res.redirect('/admin/document_types');
    }

    res.render('admin_panel/document_types/edit', {
      title: 'Edit Document Type',
      documentType: documentType
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while loading the document type.', '/admin/document_types');
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      return flashErrorAndRedirect(req, res, 'Document type not found.', '/admin/document_types');
    }

    const bodyForValidation = { ...req.body };
    delete bodyForValidation._method;

    const { error, value } = documentTypeSchema.validate(bodyForValidation, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      req.flash('errors', errors);
      return res.redirect(`/admin/document_types/${id}/edit`);
    }

    const { name, code, status } = value;

    await documentType.update({
      name,
      code: code.toLowerCase().replace(/\s+/g, '_'),
      status: status === '1' || status === 1 || status === true
    });

    flashSuccessAndRedirect(req, res, 'Document type updated successfully.', '/admin/document_types');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating the document type.', '/admin/document_types');
  }
};

export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      return flashErrorAndRedirect(req, res, 'Document type not found.', '/admin/document_types');
    }

    await documentType.destroy();
    flashSuccessAndRedirect(req, res, 'Document type deleted successfully.', '/admin/document_types');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while deleting the document type.', '/admin/document_types');
  }
};
