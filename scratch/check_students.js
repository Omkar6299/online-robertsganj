import { Student, User, AcademicYear } from '../models/index.js';
import { sequelize } from '../config/database.js';

async function checkStudentData() {
    try {
        const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
        console.log('Active Year:', activeYear ? activeYear.id : 'None');

        const students = await Student.findAll({
            where: { academic_year: String(activeYear.id) },
            include: [{ model: User, as: 'user' }]
        });

        console.log('--- Students in Active Year ---');
        students.forEach(s => {
            console.log(`ID: ${s.id}, Name: ${s.user ? s.user.name : 'N/A'}, Reg: ${s.registration_no}`);
            console.log(`  Course: ${s.course_id}, Category: "${s.category}", Gender: "${s.gender}"`);
            const missing = [];
            if (!s.course_id) missing.push('course_id');
            if (!s.category) missing.push('category');
            if (!s.gender) missing.push('gender');
            if (missing.length > 0) {
                console.log(`  ALERT: Missing fields: ${missing.join(', ')}`);
            }
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStudentData();
