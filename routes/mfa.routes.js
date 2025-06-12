const express = require('express');
const { generateMFA, verifyMFA } = require('../controllers/mfa.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/generate', auth, generateMFA);
router.post('/verify', auth, verifyMFA);

module.exports = router;
