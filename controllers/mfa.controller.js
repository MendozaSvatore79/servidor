const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/user.model');

// Generar MFA y QR
const qrcodeTerminal = require('qrcode-terminal');

const generateMFA = async (req, res) => {
    const userId = req.userId; // Id del usuario autenticado
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  
    // ✅ No regenerar el secret si ya existe
    if (user.mfaEnabled && user.mfaSecret) {
      return res.status(400).json({ message: 'MFA ya está habilitado para este usuario' });
    }
  
    const secret = speakeasy.generateSecret({
      name: `STYLEHUB (${user.email})`
    });
  
    user.mfaSecret = secret.base32;
    user.mfaEnabled = true;
    await user.save();
  
    console.log('MFA Secret (base32):', secret.base32);
  
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });
    console.log('MFA Token actual:', token);
  
    console.log('OTPAuth URL:', secret.otpauth_url);
  
    // Imprimir QR en la terminal con caracteres ASCII
    qrcodeTerminal.generate(secret.otpauth_url, { small: true }, (qr) => {
      console.log(qr);
    });
  
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ message: 'Error generando QR' });
      res.json({ qr: data_url });
    });
  };
  


// Verificar MFA
const verifyMFA = async (req, res) => {
    const { email, mfa: token } = req.body;
  
    if (!email || !token) {
      return res.status(400).json({ message: 'Email y token MFA son requeridos' });
    }
  
    const user = await User.findOne({ email });
    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA no está habilitado para este usuario' });
    }
  
    // 🔍 Imprime el secreto para verificar que está bien guardado
    console.log('mfaSecret:', user.mfaSecret);
  
    const verified = require('speakeasy').totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 10
    });
  
    if (!verified) {
      return res.status(401).json({ message: 'Código MFA inválido' });
    }
  
    res.json({ message: 'MFA verificado correctamente' });
  };
  
module.exports = {
  generateMFA,
  verifyMFA
};
