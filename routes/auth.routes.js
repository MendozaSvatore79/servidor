const express = require('express');
const authController = require('../controllers/auth.controller'); // <- Aquí importa todo el controlador
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login/mfa', authController.loginWithMFA); // <- Aquí ya funciona

router.get('/protected', auth, (req, res) => {
  res.json({ message: 'Accediste a una ruta protegida', userId: req.userId });
});

module.exports = router;
