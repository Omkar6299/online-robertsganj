import multer from 'multer';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { Student, DocumentType } from '../models/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from project root in case imports happen before server.js config
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { AcademicYear } from '../models/index.js';
import fs from 'fs';

const fsPromises = fs.promises;
export { DeleteObjectCommand } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Local Storage configuration
const localStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const userId = req.session.admission_user_id;
            const student = await Student.findOne({ where: { user_id: String(userId) }, include: [{ model: AcademicYear, as: 'academicYear' }] });
            const session = student && student.academicYear ? student.academicYear.session : 'unknown_session';
            const regNo = student ? student.registration_no : 'unknown_reg';
            
            const uploadPath = path.join(process.cwd(), 'public', 'uploads', session.replace(/\//g, '-'), regNo);
            
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}${ext}`);
    }
});

// Validate environment variables
if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('ERROR: AWS S3 Environment variables are missing. File uploads will fail.');
}

const s3Storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME || 'placeholder-bucket',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: async function (req, file, cb) {
        try {
            const userId = req.session.admission_user_id;
            const student = await Student.findOne({ 
                where: { user_id: String(userId) },
                include: [{ model: AcademicYear, as: 'academicYear' }]
            });
            
            if (!student || !student.registration_no) {
                return cb(new Error('Student registration number not found.'));
            }

            const session = student.academicYear ? student.academicYear.session : 'unknown_session';
            const regNo = student.registration_no;
            const ext = path.extname(file.originalname);
            
            // Look up document type name for folder structure
            const docType = await DocumentType.findOne({ where: { code: file.fieldname } });
            let docName = file.fieldname; // Fallback to code if name not found
            
            if (docType) {
                docName = docType.name;
            } else if (file.fieldname === 'photo') {
                docName = 'Photograph';
            } else if (file.fieldname === 'signature' || file.fieldname === 'sign') {
                docName = 'Signature';
            }

            // Clean docName for URL (keep spaces as user requested "Caste Certificate", but strip special chars)
            const safeDocName = docName.replace(/[<>:"/\\|?*]/g, '');
            
            // Format: AWS_FOLDER/session/document_name/registration_no.ext
            const folderPrefix = process.env.AWS_FOLDER ? `${process.env.AWS_FOLDER}/` : '';
            const filename = `${folderPrefix}${session.replace(/\//g, '-')}/${safeDocName}/${regNo}${ext}`;
            cb(null, filename);
        } catch (error) {
            cb(error);
        }
    }
});

// Force S3 storage as requested
const storage = s3Storage;

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|jfif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPEG/JPG/PNG/JFIF) and PDF files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Increased to 5MB
    fileFilter: fileFilter
});

export const admissionUpload = (req, res, next) => {
    // Note: In dynamic mode, we use .any() or catch all fields because we don't know the field names in advance
    // The controller will then validate which ones were uploaded
    const uploadAny = upload.any();

    uploadAny(req, res, (err) => {
        if (err) {
            let errorMessage = err.message;
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = 'File too large! Max allowed size is 5MB per file.';
                } else {
                    errorMessage = `Upload error: ${err.message}`;
                }
            }

            // Check if it's an AJAX request
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(400).json({ success: false, message: errorMessage });
            }

            req.flash('error', errorMessage);
            return res.redirect('/student/registration?tab=photo');
        }
        next();
    });
};
