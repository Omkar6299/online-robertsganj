import { AcademicYear } from '../models/index.js';

async function check() {
  try {
    const activeYear = await AcademicYear.findOne({ where: { status: 'Active' } });
    console.log('Active Academic Year:', activeYear ? activeYear.toJSON() : 'NONE');
    
    const allYears = await AcademicYear.findAll();
    console.log('All Academic Years:', allYears.map(y => y.toJSON()));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
