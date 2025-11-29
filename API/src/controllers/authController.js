const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTRO
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validación contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{5,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Contraseña débil: Mín 5 chars, 1 Mayúscula, 1 Número.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Correo ya registrado.' });
    console.error("Register Error:", error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// LOGIN
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

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// ACTUALIZAR PERFIL (La función que faltaba)
exports.updateProfile = async (req, res) => {
  console.log("--> Backend: Petición recibida en updateProfile"); // LOG PARA DEPURAR
  try {
    const { name, email } = req.body;
    const userId = req.user.id; // Viene del token middleware

    const user = await User.findByIdAndUpdate(
      userId, 
      { name, email }, 
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    console.log("--> Backend: Usuario actualizado con éxito");

    res.json({ 
      message: 'Perfil actualizado', 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Ese correo ya está en uso.' });
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};