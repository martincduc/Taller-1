const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTRO
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{5,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Contraseña débil: Mín 5 chars, 1 Mayúscula, 1 Número.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Correo ya registrado.' });
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// 2. LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
        { id: user._id, name: user.name }, 
        process.env.JWT_SECRET || 'secreto_super_seguro_mongo', 
        { expiresIn: '2h' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// 3. ACTUALIZAR PERFIL (Protegido)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id; 
    const user = await User.findByIdAndUpdate(userId, { name, email }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Perfil actualizado', user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Ese correo ya está en uso.' });
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// 4. OLVIDÉ CONTRASEÑA (Generar Código)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ error: 'Correo no registrado' });

    // Generar código simple de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Guardar código y expiración (15 mins)
    user.recoveryCode = code;
    user.recoveryExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    // Enviar código al frontend (Simulación de Email)
    res.json({ message: 'Código generado', debugCode: code });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar código' });
  }
};

// 5. RESTABLECER CONTRASEÑA (Usar Código)
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validar seguridad de nueva contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{5,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ error: 'Nueva contraseña débil (Mín 5 chars, 1 Mayus, 1 Num).' });
    }

    // Buscar usuario con ese email, ese código y que no haya expirado
    const user = await User.findOne({ 
        email, 
        recoveryCode: code,
        recoveryExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ error: 'Código inválido o expirado' });

    // Guardar nueva contraseña encriptada
    user.password = await bcrypt.hash(newPassword, 10);
    user.recoveryCode = null; // Borrar código usado
    user.recoveryExpires = null;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};