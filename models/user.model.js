// models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type : String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['cliente', 'negocio', 'admin'], default: 'cliente' },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String } // Aquí se guarda el secreto TOTP
});

module.exports = mongoose.model('User', UserSchema);
