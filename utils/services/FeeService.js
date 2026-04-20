import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';
import { logPaymentError, logPayment } from '../paymentLogger.js';

class FeeService {
    /**
     * Calculates the admission fee dynamically using the getFeeAmount stored procedure.
     * 
     * @param {Object} student - Student model instance
     * @param {string|number} semesterId - The semester ID being paid for
     * @returns {Promise<number>} - The calculated total fee amount
     */
    static async getCalculatedFee(student, semesterId) {
        try {
            // Validate basic required student data
            if (!student.course_id || !student.category || !student.gender) {
                const missingFields = [];
                if (!student.course_id) missingFields.push('Course');
                if (!student.category) missingFields.push('Category/Caste');
                if (!student.gender) missingFields.push('Gender');
                
                throw new Error(`Critical student metadata missing: ${missingFields.join(', ')}. Please update your profile.`);
            }

            // Compile subject IDs for practical fee calculation (as per user request: major1, major2, minor)
            const subjectIds = [
                student.major1_id,
                student.major2_id,
                student.minor_id
            ].filter(id => id && id !== '').join(',');

            logPayment('Initiating fee calculation via SP', 'INFO', {
                studentId: student.id,
                registrationNo: student.registration_no,
                courseId: student.course_id,
                semesterId,
                category: student.category,
                gender: student.gender,
                subjectSelection: subjectIds
            });

            // Call the stored procedure
            // CALL getFeeAmount(course_id, semester_id, category, gender, subject_ids)
            const result = await sequelize.query(
                'CALL getFeeAmount(:p_course_id, :p_semester_id, :p_category, :p_gender, :p_subject_ids)',
                {
                    replacements: {
                        p_course_id: parseInt(student.course_id),
                        p_semester_id: parseInt(semesterId),
                        p_category: student.category,
                        p_gender: student.gender,
                        p_subject_ids: subjectIds
                    },
                    type: QueryTypes.RAW
                }
            );

            // Based on the SP definition, it returns a result set with total_fee_amount
            // Result structure for CALL can vary, usually it's [ { total_fee_amount: X } ]
            const feeData = result && result.length > 0 ? result[0] : null;

            if (!feeData || typeof feeData.total_fee_amount === 'undefined') {
                throw new Error('Stored procedure did not return a valid fee amount.');
            }

            const totalAmount = parseFloat(feeData.total_fee_amount);

            if (isNaN(totalAmount) || totalAmount <= 0) {
                throw new Error(`Invalid fee amount calculated: ${totalAmount}. Record might be missing in fee_maintenance.`);
            }

            logPayment('Fee calculation successful', 'SUCCESS', {
                studentId: student.id,
                amount: totalAmount
            });

            return totalAmount;

        } catch (error) {
            logPaymentError('Dynamic fee calculation failed', error, {
                studentId: student?.id,
                courseId: student?.course_id,
                semesterId: semesterId,
                category: student?.category,
                gender: student?.gender
            });
            throw error; // Re-throw to be handled by the controller (to block payment)
        }
    }
}

export default FeeService;
