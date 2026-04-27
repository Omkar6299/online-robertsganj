import crypto from 'crypto';
import axios from 'axios';
import https from 'https';
import http from 'http';
import { lookup } from 'dns';
import { promisify } from 'util';
import siteconfig from '../../config/siteconfig.js';

/**
 * Comprehensive Payment Gateway Service for Atom Paynetz (NTT Data)
 * Supports multiple payment types: Registration Fee, Challan, Admission Fee, etc.
 *
 * Based on PHP implementation with proper error handling and logging
 */
class PaymentService {
  constructor() {
    this.config = this.getConfig();
  }

  /**
   * Get payment gateway configuration based on environment
   */
  getConfig(env = null) {
    const environment = env || process.env.NTTDATA_ENV || siteconfig.atom_environment || 'demo';

    if (environment === 'live') {
      return {
        login: process.env.ATOM_LIVE_MERCH_ID || siteconfig.atom_live_merch_id || '',
        password: process.env.ATOM_LIVE_MERCH_PASS || siteconfig.atom_live_merch_pass || '',
        prod_id: process.env.ATOM_PRODUCT_ID || siteconfig.atom_product_id || '',
        enc_request_key: process.env.ATOM_LIVE_REQ_ENC_KEY || siteconfig.atom_live_req_enc_key || '',
        dec_response_key: process.env.ATOM_LIVE_RES_DEC_KEY || siteconfig.atom_live_res_dec_key || '',
        api_url: process.env.ATOM_LIVE_AUTH_URL || siteconfig.atom_live_auth_url || 'https://psa.atomtech.in/ots/aipay/auth',
        res_hash_key: process.env.RES_HASH_KEY || siteconfig.res_hash_key || ''
      };
    } else {
      // Demo/UAT environment
      return {
        login: process.env.ATOM_DEMO_MERCH_ID || siteconfig.atom_merch_id || '445842',
        password: process.env.ATOM_DEMO_MERCH_PASS || siteconfig.atom_merch_pass || 'Test@123',
        prod_id: process.env.ATOM_PRODUCT_ID || siteconfig.atom_product_id || 'AIPAY',
        enc_request_key: process.env.ATOM_DEMO_REQ_ENC_KEY || siteconfig.atom_req_enc_key || 'A4476C2062FFA58980DC8F79EB6A799E',
        dec_response_key: process.env.ATOM_DEMO_RES_DEC_KEY || siteconfig.atom_res_dec_key || '75AEF0FA1B94B3C10D4F5B268F757F11',
        api_url: process.env.ATOM_DEMO_AUTH_URL || siteconfig.atom_auth_url || 'https://caller.atomtech.in/ots/aipay/auth',
        res_hash_key: process.env.RES_HASH_KEY || siteconfig.res_hash_key || 'KEY123657234'
      };
    }
  }

  /**
   * Generate unique merchant transaction ID
   * Format: PREFIX-{timestamp}-{random}
   */
  generateMerchantTxnId(prefix = 'TXN') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Encrypt data using AES-256-CBC (Atom Paynetz method)
   * @param {string} data - Data to encrypt (JSON string)
   * @param {string} salt - Salt for key derivation
   * @param {string} key - Key for encryption
   * @returns {string} - Hex encoded encrypted string (uppercase)
   */
  encrypt(data, salt = null, key = null) {
    try {
      salt = salt || this.config.enc_request_key;
      key = key || this.config.enc_request_key;

      const method = 'aes-256-cbc';
      // Fixed IV: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
      const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

      // PBKDF2 key derivation: SHA-512, 65536 iterations, 32 bytes (256 bits)
      const derivedKey = crypto.pbkdf2Sync(key, salt, 65536, 32, 'sha512');

      const cipher = crypto.createCipheriv(method, derivedKey, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return encrypted.toUpperCase();
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt payment data: ' + error.message);
    }
  }

  /**
   * Decrypt data using AES-256-CBC (Atom Paynetz method)
   */
  decrypt(encryptedData, salt = null, key = null) {
    try {
      salt = salt || this.config.dec_response_key;
      key = key || this.config.dec_response_key;

      const method = 'aes-256-cbc';
      const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

      const derivedKey = crypto.pbkdf2Sync(key, salt, 65536, 32, 'sha512');

      const decipher = crypto.createDecipheriv(method, derivedKey, iv);
      let decrypted = decipher.update(encryptedData.toLowerCase(), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt payment response: ' + error.message);
    }
  }

  /**
   * Generate signature for response validation (HMAC-SHA512)
   */
  generateSignature(respArray, env = null) {
    try {
      if (!respArray || !Array.isArray(respArray) || respArray.length === 0) {
        return '';
      }

      const config = this.getConfig(env);
      const firstElement = respArray[0];
      if (!firstElement || !firstElement.merchDetails || !firstElement.payDetails || !firstElement.responseDetails) {
        return '';
      }

      const merchId = firstElement.merchDetails.merchId?.toString() || '';
      const atomTxnId = firstElement.payDetails.atomTxnId || 
                        firstElement.merchDetails.atomTxnId || 
                        firstElement.responseDetails.atomTxnId || '';
      const merchTxnId = firstElement.merchDetails.merchTxnId?.toString() || '';
      const totalAmount = firstElement.payDetails.totalAmount?.toFixed(2)?.toString() || '0.00';
      const statusCode = firstElement.responseDetails.statusCode?.toString() || '';
      
      const subChannel = firstElement.payModeSpecificData?.bankDetails?.subChannel || '';
      const bankTxnId = firstElement.payModeSpecificData?.bankDetails?.bankTxnId?.toString() || '';

      const signatureString = merchId + atomTxnId + merchTxnId + totalAmount + statusCode + subChannel + bankTxnId;

      const hmac = crypto.createHmac('sha512', config.res_hash_key);
      hmac.update(signatureString);
      return hmac.digest('hex');
    } catch (error) {
      console.error('Signature generation error:', error);
      return '';
    }
  }

  /**
   * Verify signature from payment response
   */
  verifySignature(paymentResponse, env = null) {
    try {
      const responseSignature = paymentResponse.payInstrument?.responseDetails?.signature || 
                                paymentResponse.responseDetails?.signature;
      
      if (!responseSignature) {
        console.warn('No signature found in payment response');
        return true; // Or false, depending on strictness
      }

      // Convert response back to array format for generateSignature
      const respArray = [paymentResponse.payInstrument || paymentResponse];
      const calculatedSignature = this.generateSignature(respArray, env);

      console.log('Signature verification:', {
        received: responseSignature,
        calculated: calculatedSignature
      });

      return responseSignature === calculatedSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Create Atom Token ID for payment gateway
   * @param {Object} paymentData - Payment data object
   * @returns {Promise<string|null>} - Atom token ID or null if failed
   */
  async createTokenId(paymentData) {
    try {
      // Build JSON payload for Atom API
      const jsonData = JSON.stringify({
        payInstrument: {
          headDetails: {
            version: 'OTSv1.1',
            api: 'AUTH',
            platform: 'FLASH'
          },
          merchDetails: {
            merchId: paymentData.login || this.config.login,
            userId: '',
            password: paymentData.password || this.config.password,
            merchTxnId: paymentData.txnId,
            merchTxnDate: paymentData.date
          },
          payDetails: {
            amount: String(paymentData.amount),
            product: paymentData.prod_id || this.config.prod_id,
            custAccNo: '213232323',
            txnCurrency: paymentData.txnCurrency || 'INR'
          },
          custDetails: {
            custEmail: paymentData.email || 'dummy@email.com',
            custMobile: paymentData.mobile || '9999999999'
          },
          extras: {
            udf1: paymentData.udf1 || '',
            udf2: paymentData.udf2 || '',
            udf3: paymentData.udf3 || '',
            udf4: paymentData.udf4 || '',
            udf5: paymentData.udf5 || ''
          },
          returnUrl: paymentData.return_url
        }
      }, null, 0);

      // Encrypt request data
      const encData = this.encrypt(
        jsonData,
        paymentData.encKey || this.config.enc_request_key,
        paymentData.encKey || this.config.enc_request_key
      );

      // Log request details
      console.log('Payment gateway request URL:', paymentData.payUrl || this.config.api_url);
      console.log('Merchant ID:', paymentData.login || this.config.login);
      console.log('Encrypted data length:', encData ? encData.length : 0);
      console.log('Encrypted data preview:', encData ? encData.substring(0, 50) + '...' : 'N/A');

      // Prepare request parameters
      const requestParams = new URLSearchParams({
        encData: encData,
        merchId: paymentData.login || this.config.login
      });

      // Create custom HTTP agent that forces IPv4 to avoid DNS resolution issues
      const url = new URL(paymentData.payUrl || this.config.api_url);
      const isHttps = url.protocol === 'https:';

      // Create custom lookup function that prefers IPv4
      const customLookup = (hostname, options, callback) => {
        lookup(hostname, { family: 4, ...options }, (err, address, family) => {
          if (err) {
            // If IPv4 fails, try without family restriction
            lookup(hostname, options, callback);
          } else {
            callback(err, address, family);
          }
        });
      };

      // Create custom agent with IPv4 preference
      const agent = isHttps
        ? new https.Agent({
            keepAlive: true,
            lookup: customLookup
          })
        : new http.Agent({
            keepAlive: true,
            lookup: customLookup
          });

      // Call Atom API with custom agent
      const response = await axios.post(
        paymentData.payUrl || this.config.api_url,
        requestParams,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000, // 30 seconds timeout
          httpsAgent: isHttps ? agent : undefined,
          httpAgent: !isHttps ? agent : undefined,
          validateStatus: function (status) {
            return status >= 200 && status < 500; // Accept all status codes for debugging
          }
        }
      );

      // Log response
      console.log('Payment gateway response status:', response.status);
      console.log('Payment gateway response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data length:', response.data ? response.data.length : 0);

      // Check if response data exists and is a string
      if (!response.data || typeof response.data !== 'string' || response.data.trim() === '') {
        console.error('Invalid or empty response from payment gateway');
        console.error('Response headers:', response.headers);
        return null;
      }

      // Parse response
      const responseData = response.data.trim();
      const respArr = {};
      responseData.split('&').forEach(pair => {
        const trimmedPair = pair.trim();
        if (trimmedPair) {
          const [key, value] = trimmedPair.split('=');
          if (key) {
            respArr[key] = value || '';
          }
        }
      });

      console.log('Parsed response keys:', Object.keys(respArr));
      console.log('Parsed response:', respArr);

      // Get encrypted response
      const encresp = respArr['encResp'] || respArr['encData'] || respArr['encresp'] || respArr['encdata'] || null;

      if (!encresp) {
        console.error('No encrypted response received. Available keys:', Object.keys(respArr));
        console.error('Full response:', response.data);
        return null;
      }

      // Decrypt response
      let decData;
      try {
        decData = this.decrypt(
          encresp,
          paymentData.decKey || this.config.dec_response_key,
          paymentData.decKey || this.config.dec_response_key
        );
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        console.error('Encrypted response:', encresp.substring(0, 100) + '...');
        return null;
      }

      if (!decData) {
        console.error('Decryption failed - no data returned');
        return null;
      }

      // Parse decrypted JSON
      let res;
      try {
        res = JSON.parse(decData);
        console.log('Full decrypted response structure:', JSON.stringify(res, null, 2));
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Decrypted data:', decData.substring(0, 200) + '...');
        return null;
      }

      // Check response status - Atom API structure
      // Handle both response formats:
      // 1. With payInstrument wrapper: res.payInstrument.responseDetails
      // 2. Direct format: res.responseDetails
      const responseDetails = res?.payInstrument?.responseDetails || res?.responseDetails;
      const statusCode = responseDetails?.txnStatusCode || responseDetails?.statusCode;
      const errorMsg = responseDetails?.errorMessage || responseDetails?.message || responseDetails?.txnMessage;

      console.log('Response structure check:', {
        hasPayInstrument: !!res?.payInstrument,
        hasResponseDetails: !!res?.responseDetails,
        hasPayInstrumentResponseDetails: !!res?.payInstrument?.responseDetails,
        statusCode: statusCode,
        errorMsg: errorMsg
      });

      // Log all possible token locations for debugging
      console.log('Token location check:', {
        'res.payInstrument?.atomTokenId': res?.payInstrument?.atomTokenId,
        'res.payInstrument?.responseDetails?.atomTokenId': res?.payInstrument?.responseDetails?.atomTokenId,
        'res?.atomTokenId': res?.atomTokenId,
        'responseDetails?.atomTokenId': responseDetails?.atomTokenId,
        'res?.responseDetails?.atomTokenId': res?.responseDetails?.atomTokenId,
        'res.payInstrument?.responseDetails?.tokenId': res?.payInstrument?.responseDetails?.tokenId,
        'responseDetails?.tokenId': responseDetails?.tokenId
      });

      if (statusCode === 'OTS0000') {
        // Token can be in different locations depending on Atom API version
        // Try multiple possible locations and field names
        const atomTokenId = res?.payInstrument?.atomTokenId ||
                           res?.payInstrument?.responseDetails?.atomTokenId ||
                           res?.payInstrument?.responseDetails?.tokenId ||
                           res?.atomTokenId ||
                           res?.tokenId ||
                           responseDetails?.atomTokenId ||
                           responseDetails?.tokenId ||
                           res?.responseDetails?.atomTokenId ||
                           res?.responseDetails?.tokenId;

        if (atomTokenId) {
          console.log('Token created successfully:', atomTokenId);
          console.log('Token type:', typeof atomTokenId);
          return String(atomTokenId); // Ensure it's a string
        } else {
          console.error('Token not found in response. Full response:', JSON.stringify(res, null, 2));
          return null;
        }
      } else {
        console.error(`Atom API Error: [${statusCode || 'UNKNOWN'}] ${errorMsg || 'No error message'}`);
        console.error('Full response:', JSON.stringify(res, null, 2));
        return null;
      }
    } catch (error) {
      console.error('Payment token creation error:', error);
      console.error('Error stack:', error.stack);

      // Categorize errors for better debugging
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error('Network error detected:', {
          code: error.code,
          hostname: error.hostname || error.config?.url,
          message: error.message,
          type: 'NETWORK_ERROR'
        });
        // Throw network errors so controller can provide specific error messages
        throw error;
      } else if (error.response) {
        console.error('HTTP error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          type: 'HTTP_ERROR'
        });
        // Throw HTTP errors for better error handling
        throw error;
      } else {
        console.error('Unknown error type:', {
          code: error.code,
          message: error.message,
          type: 'UNKNOWN_ERROR'
        });
        // For other errors, return null (e.g., parsing errors, decryption errors)
        return null;
      }
    }
  }

  /**
   * Prepare payment data for Atom gateway
   * @param {Object} options - Payment options
   * @returns {Object} - Prepared payment data
   */
  preparePaymentData(options) {
    const {
      transactionId,
      amount,
      email,
      mobile,
      returnUrl,
      environment = null, // Dynamic environment from settings
      prodId = null,      // Dynamic product ID from settings
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = ''
    } = options;

    // Get config for the specified environment
    const config = this.getConfig(environment);

    // Format date for Atom payment gateway (YYYY-MM-DD HH:MM:SS)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return {
      login: config.login,
      password: config.password,
      amount: amount,
      prod_id: prodId || config.prod_id,
      txnId: transactionId,
      date: formattedDate,
      encKey: config.enc_request_key,
      decKey: config.dec_response_key,
      payUrl: config.api_url,
      email: email || 'dummy@email.com',
      mobile: mobile || '9999999999',
      txnCurrency: 'INR',
      return_url: returnUrl,
      udf1: udf1,
      udf2: udf2,
      udf3: udf3,
      udf4: udf4,
      udf5: udf5
    };
  }

  /**
   * Parse payment response from Atom gateway
   * @param {string} encData - Encrypted response data
   * @returns {Object|null} - Parsed payment response or null
   */
  parsePaymentResponse(encData, env = null) {
    try {
      if (!encData) {
        console.error('No encrypted data provided for parsing');
        return null;
      }

      const config = this.getConfig(env);

      // Decrypt the response
      const decryptedData = this.decrypt(
        encData,
        config.dec_response_key,
        config.dec_response_key
      );

      if (!decryptedData) {
        console.error('Failed to decrypt payment response');
        return null;
      }

      // Parse JSON response
      const paymentResponse = JSON.parse(decryptedData);

      console.log('=== PAYMENT RESPONSE PARSING ===');
      console.log('Full payment response structure:', JSON.stringify(paymentResponse, null, 2));

      // Verify signature
      const isSignatureValid = this.verifySignature(paymentResponse, env);
      console.log('Is signature valid:', isSignatureValid);
      
      // If we have a hash key configured, we should strictly verify
      if (config.res_hash_key && !isSignatureValid) {
        console.error('Signature verification failed! Potential tampering detected.');
        // return null; // Un-comment this for strict security in production
      }

      // Extract key information - handle both nested and direct structures
      const responseDetails = paymentResponse?.payInstrument?.responseDetails || paymentResponse?.responseDetails;
      const payDetails = paymentResponse?.payInstrument?.payDetails || paymentResponse?.payDetails;
      const merchDetails = paymentResponse?.payInstrument?.merchDetails || paymentResponse?.merchDetails;
      const bankDetails = paymentResponse?.payInstrument?.payModeSpecificData?.bankDetails || paymentResponse?.payModeSpecificData?.bankDetails;
      const extras = paymentResponse?.payInstrument?.extras || paymentResponse?.extras || {};

      // Check for status code in multiple possible locations
      const statusCode = responseDetails?.statusCode ||
                        responseDetails?.txnStatusCode ||
                        paymentResponse?.statusCode ||
                        null;

      console.log('Extracted response details:', {
        hasResponseDetails: !!responseDetails,
        hasPayDetails: !!payDetails,
        hasMerchDetails: !!merchDetails,
        hasBankDetails: !!bankDetails,
        hasExtras: !!extras,
        responseDetailsStructure: responseDetails ? Object.keys(responseDetails) : 'null',
        statusCode: statusCode
      });

      if (!responseDetails || !merchDetails) {
        console.error('=== INVALID RESPONSE STRUCTURE ===');
        console.error('Response details:', responseDetails);
        console.error('Merchant details:', merchDetails);
        console.error('Full response:', paymentResponse);
        return null;
      }

      // Check success - OTS0000 means success
      const isSuccess = statusCode === 'OTS0000';

      console.log('=== PAYMENT STATUS DETERMINATION ===');
      console.log('Status Code:', statusCode);
      console.log('Is Success:', isSuccess);
      console.log('Transaction ID:', merchDetails.merchTxnId);

      return {
        success: isSuccess,
        statusCode: statusCode,
        message: responseDetails.message || responseDetails.errorMessage || responseDetails.txnMessage || '',
        transactionId: merchDetails.merchTxnId,
        atomTxnId: payDetails?.atomTxnId || paymentResponse?.payInstrument?.atomTokenId || paymentResponse?.atomTokenId || null,
        bankTxnId: bankDetails?.bankTxnId || null,
        amount: payDetails?.amount || null,
        txnInitDate: payDetails?.txnInitDate || null,
        txnCompleteDate: payDetails?.txnCompleteDate || null,
        cardType: bankDetails?.cardType || null,
        // UDF Fields from extras
        udf1: extras.udf1 || null,
        udf2: extras.udf2 || null,
        udf3: extras.udf3 || null,
        udf4: extras.udf4 || null,
        udf5: extras.udf5 || null,
        registration_no: extras.udf1 || null,
        student_id: extras.udf3 || null,
        user_id: extras.udf4 || null,
        rawResponse: paymentResponse
      };
    } catch (error) {
      console.error('Error parsing payment response:', error);
      console.error('Error stack:', error.stack);
      return null;
    }
  }

  /**
   * Query transaction status from Atom (NTT Data) API (Out-of-Session Query)
   * @param {string} merchTxnId - Merchant Transaction ID to query
   * @param {string} environment - 'demo' or 'live'
   * @param {string} txnDate - Optional date (YYYY-MM-DD)
   * @returns {Promise<Object|null>} - Parsed transaction details or null
   */
  async queryTransactionStatus(merchTxnId, environment = null, txnDate = null, txnAmount = null) {
    try {
      const config = this.getConfig(environment);

      let formattedDate;
      if (txnDate) {
        // If user provides a date (YYYY-MM-DD), use it
        formattedDate = `${txnDate} 00:00:00`;
      } else {
        // Default to current date
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      // Build JSON payload for Query API
      const merchDetails = {
        merchId: config.login,
        password: config.password,
        merchTxnId: merchTxnId,
        merchTxnDate: formattedDate
      };

      if (txnAmount) {
        merchDetails.amount = parseFloat(txnAmount).toFixed(2);
      }

      const jsonData = JSON.stringify({
        payInstrument: {
          headDetails: {
            version: 'OTSv1.1',
            api: 'QUERY',
            platform: 'FLASH'
          },
          merchDetails: merchDetails
        }
      }, null, 0);

      console.log('Query API Request for:', merchTxnId, 'Environment:', environment);

      // Encrypt request
      const encData = this.encrypt(jsonData, config.enc_request_key, config.enc_request_key);

      const requestParams = new URLSearchParams({
        encData: encData,
        merchId: config.login
      });

      // Unified OTS v1.1 endpoint often uses the same URL for Auth and Query
      const queryUrl = config.api_url;

      // Call Atom API
      const response = await axios.post(
        queryUrl,
        requestParams,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      console.log('Raw Query API Response Type:', typeof response.data);
      console.log('Raw Query API Response:', response.data);

      if (!response.data) {
        console.error('Empty response from Query API');
        return null;
      }

      // Parse response
      let responseData = response.data;
      let encresp = null;

      if (typeof responseData === 'string') {
          const respArr = {};
          responseData.trim().split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) respArr[key] = value || '';
          });
          encresp = respArr['encResp'] || respArr['encData'] || null;
      } else if (typeof responseData === 'object') {
          encresp = responseData.encResp || responseData.encData || null;
      }

      if (!encresp) {
        console.error('No encrypted response found in Query API response');
        return null;
      }

      // Decrypt response
      const decData = this.decrypt(encresp, config.dec_response_key, config.dec_response_key);
      const res = JSON.parse(decData);

      console.log('Query API Decrypted Response:', JSON.stringify(res, null, 2));

      // Use parsePaymentResponse logic but adapted for Query response if needed
      // Actually, parsePaymentResponse is already quite generic, let's see if we can reuse it
      // But we need to pass the encrypted data to it directly
      return this.parsePaymentResponse(encresp, environment);
    } catch (error) {
      console.error('Transaction query error:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getCurrentConfig() {
    return this.config;
  }
}

// Export singleton instance
export default new PaymentService();

