const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'client' },
  
  // --- NUEVOS CAMPOS PARA RECUPERACIÓN ---
  recoveryCode: { type: String, default: null },
  recoveryExpires: { type: Date, default: null }
});

// Truco: Convertir _id a id para el frontend
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { 
      delete ret._id; 
      delete ret.password;
      delete ret.recoveryCode; // Por seguridad no devolvemos el código en el JSON del usuario
      delete ret.recoveryExpires;
  }
});

module.exports = mongoose.model('User', userSchema);