const siteconfig = {
  registration_amount: 100.00,  // Registration fee amount
  admission_amount: 500.00,     // Admission fee amount dummy it's now fetch from table
  min_student_age: 10, // Minimum age in years - min_dob_date will be calculated from this

  // NTT Data Payment (Atom) Configuration
  // Environment: 'demo' or 'live'
  atom_environment: process.env.NTTDATA_ENV || 'demo',

  // Demo Credentials
  atom_merch_id: process.env.ATOM_DEMO_MERCH_ID || "445842",
  atom_merch_pass: process.env.ATOM_DEMO_MERCH_PASS || "Test@123",
  atom_req_enc_key: process.env.ATOM_DEMO_REQ_ENC_KEY || "A4476C2062FFA58980DC8F79EB6A799E",
  atom_res_dec_key: process.env.ATOM_DEMO_RES_DEC_KEY || "75AEF0FA1B94B3C10D4F5B268F757F11",
  atom_auth_url: process.env.ATOM_DEMO_AUTH_URL || "https://paynetzuat.atomtech.in/ots/aipay/auth",

  // Live Credentials
  atom_live_merch_id: process.env.ATOM_LIVE_MERCH_ID || "",
  atom_live_merch_pass: process.env.ATOM_LIVE_MERCH_PASS || "",
  atom_live_req_enc_key: process.env.ATOM_LIVE_REQ_ENC_KEY || "",
  atom_live_res_dec_key: process.env.ATOM_LIVE_RES_DEC_KEY || "",
  atom_live_auth_url: process.env.ATOM_LIVE_AUTH_URL || "https://payment1.atomtech.in/ots/aipay/auth",

  atom_product_id: process.env.ATOM_PRODUCT_ID || "AIPAY",
  res_hash_key: process.env.RES_HASH_KEY || "KEY123657234",

  // System Configuration
  is_first_time_college: process.env.IS_FIRST_TIME_COLLEGE === 'true'
};

export default siteconfig;
