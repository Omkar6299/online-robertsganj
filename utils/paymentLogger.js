import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'payment.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

export const logPayment = (message, level = 'INFO', data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
        timestamp,
        level,
        message,
        ...data
    });
    
    fs.appendFileSync(logFile, `${logEntry}\n`, 'utf8');
};

export const logPaymentError = (message, error = {}, context = {}) => {
    logPayment(message, 'ERROR', {
        errorMessage: error.message || error,
        stack: error.stack,
        ...context
    });
};
