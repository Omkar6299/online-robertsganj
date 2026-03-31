import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateUniqueSlug = async (Model, baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let count = 0;

  const whereClause = excludeId
    ? { slug: { [Op.like]: `${slug}%` }, id: { [Op.ne]: excludeId } }
    : { slug: { [Op.like]: `${slug}%` } };

  const existing = await Model.findAll({ where: whereClause });
  count = existing.length;

  if (count > 0) {
    slug = `${baseSlug}-${count + 1}`;
  }

  return slug;
};

export const encrypt = (data, salt, key) => {
  const method = 'aes-256-cbc';
  const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

  const hash = crypto.pbkdf2Sync(key, salt, 65536, 32, 'sha512');
  const cipher = crypto.createCipheriv(method, hash, iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted.toUpperCase();
};

export const decrypt = (data, salt, key) => {
  const encrypted = Buffer.from(data, 'hex');
  const method = 'aes-256-cbc';
  const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

  const hash = crypto.pbkdf2Sync(key, salt, 65536, 32, 'sha512');
  const decipher = crypto.createDecipheriv(method, hash, iv);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
};

