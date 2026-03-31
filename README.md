# Online Admission System (OAS)

A robust, full-stack online admission management platform designed for educational institutions. This system streamlines the entire admission process, from student registration and fee payment to administrative validation and reporting.

## 🚀 Key Features

### For Students
- **Online Registration**: Easy-to-use registration form with multi-step validation.
- **Secure Login**: Access to personal dashboards for application tracking.
- **Multi-Semester Support**: Seamless re-registration for higher semesters.
- **Fee Payment**: Integrated payment gateway support (e.g., Atom) for registration and admission fees.
- **Document Management**: Upload and manage photographs, signatures, and educational certificates.
- **Application Reprint**: Reprint application forms and payment receipts at any time.

### For Administrators
- **Comprehensive Dashboard**: Real-time overview of registrations, admissions, and revenue.
- **Form Verification**: Efficient workflow for verifying and approving student applications.
- **Academic Management**: Manage courses, subjects, semesters, and course types.
- **Fee Maintenance**: Dynamic configuration of fee structures per course and semester.
- **Weightage System**: Automated calculation of merit marks based on configurable weightage criteria.
- **Advanced Reporting**: Export admitted student data to Excel with detailed academic and personal information.
- **Role-Based Access Control (RBAC)**: Manage users and permissions for secure system access.
- **First-Time College Mode**: Specialized mode for institutions transitioning to the system, allowing for clean-slate student registration.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS (Embedded JavaScript templates), Vanilla CSS, JavaScript
- **Database**: MySQL with Sequelize ORM
- **Validation**: Joi, Express-validator
- **File Storage**: Local filesystem and AWS S3 integration
- **Authentication**: Express-session with Sequelize store, BcryptJS
- **Reporting**: ExcelJS for dynamic data exports

## 📂 Project Structure

```text
├── config/             # Database and application configuration
├── controllers/        # Business logic for frontend and admin routes
├── database/           # SQL migration scripts and stored procedures
├── middleware/         # Authentication, validation, and file upload middleware
├── models/             # Sequelize database models
├── public/             # Static assets (CSS, JS, images)
├── routes/             # Express route definitions
├── utils/              # Helper functions and utilities
├── validations/        # Joi validation schemas
├── views/              # EJS templates for all pages
├── server.js           # Application entry point
└── package.json        # Project dependencies and scripts
```

## ⚙️ Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root directory and configure the following variables (refer to `.env.example`):
   ```env
   # Database Configuration
   DB_CONNECTION=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=online_admission
   DB_USERNAME=root
   DB_PASSWORD=your_password

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your_secure_secret_key
   APP_URL=http://localhost:3000

   # AWS S3 Configuration (Optional)
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=
   AWS_BUCKET=
   ```

4. **Database Setup**:
   - Create a database in MySQL named `online_admission`.
   - Import the database structure and stored procedures from `database/structure.sql`.
   - Ensure the stored procedures in `database/stored_procedures/` are also executed.

5. **Start the Application**:
   - For development (with auto-reload):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

## 🔗 Access URLs

- **Frontend Home**: `http://localhost:3000/`
- **Student Login**: `http://localhost:3000/admission_login`
- **Admin Login**: `http://localhost:3000/login`

## 📝 License

This project is licensed under the ISC License.

