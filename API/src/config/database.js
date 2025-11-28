const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Esto se conecta a la Nube (Atlas) usando la URL de tu archivo .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas Conectado Exitosamente');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  }
};

module.exports = connectDB;