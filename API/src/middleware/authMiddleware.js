const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const h = req.headers['authorization'];
  const token = h && h.split(' ')[1];
  
  if (!token) return res.status(403).json({ error: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro_mongo', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};