const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --- 1. VALIDACIÓN DE CONTRASEÑA SEGURA ---
    // Regex: Al menos 1 Mayúscula, al menos 1 Número, mínimo 5 caracteres
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{5,}$/;
    
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            error: 'La contraseña es muy débil. Debe tener al menos 5 caracteres, una mayúscula y un número.' 
        });
    }

    // --- 2. ENCRIPTAR ---
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // --- 3. CREAR USUARIO ---
    // Nota: MongoDB validará si el email es único gracias al esquema
    const user = await User.create({ name, email, password: hashedPassword });
    
    res.status(201).json({ message: 'Usuario creado exitosamente' });

  } catch (error) {
    // Manejo de error específico de Mongo para duplicados (E11000)
    if (error.code === 11000) {
        return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
    }
    console.error("Error en registro:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const user = await User.findOne({ email });

    // Validar usuario y contraseña
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar Token
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
    console.error("Error en login:", error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};