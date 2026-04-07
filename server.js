import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';
import flashMiddleware from './middleware/flash.js';
import methodOverride from 'method-override';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import './models/index.js'; // Initialize model associations
import webRoutes from './routes/web.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MySQLStore = SequelizeStore(session.Store);
const sessionStore = new MySQLStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000, // 15 minutes
  expiration: 24 * 60 * 60 * 1000 // 24 hours
});

// Trust proxy for secure cookies on Vercel/proxies
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper functions will be set in routes middleware

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Method override - must be after body parser to read _method from body
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Required for secure cookies on Vercel
  cookie: {
    secure: process.env.NODE_ENV === 'production' || !!process.env.VERCEL,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages (custom middleware to avoid deprecated APIs)
app.use(flashMiddleware);

// Global variables for views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.errors = req.flash('errors');
  res.locals.user = req.session.user || null;
  res.locals.admission_user_id = req.session.admission_user_id || null;
  res.locals.admission_name = req.session.admission_name || null;
  next();
});

// Helper functions will be set in routes

// Routes
app.use('/', webRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('\n========== GLOBAL ERROR HANDLER ==========');
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', JSON.stringify(req.body, null, 2));
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  if (err.errors) {
    console.error('Error Details:', JSON.stringify(err.errors, null, 2));
  }
  console.error('==========================================\n');

  res.status(err.status || 500).render('errors/500', {
    title: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Ensure session table is created/updated
    await sessionStore.sync();

    // Sync database (use with caution in production)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
    }

    // Start server (only if not on Vercel)
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    } else {
      console.log('Vercel environment detected. Skipping app.listen().');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Only exit if not on Vercel
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

startServer();

export default app;

