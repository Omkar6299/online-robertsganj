import { Setting } from '../models/index.js';

const settingMiddleware = async (req, res, next) => {
  try {
    const settingsArr = await Setting.findAll();
    const siteSettings = {};
    
    settingsArr.forEach(setting => {
      let value = setting.value;
      
      // Basic type conversion
      if (setting.type === 'number') {
        value = parseFloat(value);
      } else if (setting.type === 'boolean') {
        value = (value === 'true' || value === '1');
      }
      
      siteSettings[setting.key] = value;
    });

    res.locals.siteSettings = siteSettings;
    next();
  } catch (error) {
    console.error('Error in settingMiddleware:', error);
    // Continue without settings rather than crash
    res.locals.siteSettings = {};
    next();
  }
};

export default settingMiddleware;
