import { Setting } from '../../models/index.js';
import { handleError } from '../../utils/responseHelper.js';

export const index = async (req, res) => {
  try {
    const settings = await Setting.findAll({
      order: [['id', 'ASC']]
    });

    res.render('admin_panel/settings/index', {
      title: 'System Settings',
      settings
    });
  } catch (error) {
    handleError(req, res, error, 'An error occurred while fetching settings.', '/admin/dashboard');
  }
};

export const update = async (req, res) => {
  try {
    const { settings } = req.body; // settings will be an object { key: value }

    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        await Setting.update(
          { value: String(value) },
          { where: { key } }
        );
      }
    }

    req.flash('success', 'Settings updated successfully.');
    res.redirect('/admin/settings');
  } catch (error) {
    handleError(req, res, error, 'An error occurred while updating settings.', '/admin/settings');
  }
};
