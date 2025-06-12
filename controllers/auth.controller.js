// controllers/auth.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: 'Usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'cliente'  // Si no se envía, será cliente por defecto
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'Usuario registrado', token });
  } catch (err) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

  // Si MFA está habilitado, enviamos mensaje para pedir MFA
  if (user.mfaEnabled) {
    return res.json({ mfaRequired: true, message: 'Se requiere código MFA' });
  }

  // Si no tiene MFA, generar token JWT directo
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
};


const speakeasy = require('speakeasy');

// ...

const loginWithMFA = async (req, res) => {
  const { email, mfa } = req.body;

  if (!email || !mfa) {
    return res.status(400).json({ message: 'Email y código MFA son requeridos' });
  }

  const user = await User.findOne({ email });
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return res.status(400).json({ message: 'MFA no está habilitado para este usuario' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: mfa,
    window: 1
  });

  if (!verified) {
    return res.status(401).json({ message: 'Código MFA inválido' });
  }

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  res.json({ message: 'MFA verificado correctamente', token });
};

module.exports = { register, login,loginWithMFA };
