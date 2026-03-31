import multer from 'multer';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import { Student } from '../models/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from project root in case imports happen before server.js config
dotenv.config({ path: path.join(process.cwd(), '.env') });

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Validate environment variables
if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('ERROR: AWS S3 Environment variables are missing. File uploads will fail.');
}

const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME || 'placeholder-bucket', // Prevent crash on startup if env is missing
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: async function (req, file, cb) {
        try {
            const userId = req.session.admission_user_id;
            if (!userId) {
                return cb(new Error('User verification failed during upload.'));
            }

            const student = await Student.findOne({ where: { user_id: String(userId) } });
            if (!student || !student.registration_no) {
                return cb(new Error('Student registration number not found.'));
            }

            const regNo = student.registration_no;
            const ext = path.extname(file.originalname);
            let filename = '';

            const folder = process.env.AWS_FOLDER ? process.env.AWS_FOLDER + '/' : '';

            if (file.fieldname === 'photograph') {
                filename = `${folder}${regNo}-photo${ext}`;
            } else if (file.fieldname === 'signature') {
                filename = `${folder}${regNo}-sign${ext}`;
            } else {
                filename = `${folder}${regNo}-${file.fieldname}${ext}`;
            }

            cb(null, filename);
        } catch (error) {
            cb(error);
        }
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|jfif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images (JPEG/JPG/PNG/JFIF) are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Increased to 5MB
    fileFilter: fileFilter
});

export const admissionUpload = (req, res, next) => {
    const multiUpload = upload.fields([
        { name: 'photograph', maxCount: 1 },
        { name: 'signature', maxCount: 1 }
    ]);

    multiUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File too large! Max allowed size is 5MB per file.');
            } else {
                req.flash('error', `Upload error: ${err.message}`);
            }
            return res.redirect('/student/registration?tab=photo');
        } else if (err) {
            req.flash('error', err.message);
            return res.redirect('/student/registration?tab=photo');
        }
        next();
    });
};
