const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a Atlas
connectDB();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/productos', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));

app.listen(PORT, () => {
  console.log(`🚀 Servidor MONGO corriendo en http://localhost:${PORT}`);
});