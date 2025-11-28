const mongoose = require('mongoose');
const { Product, Order, User } = require('./src/models');
require('dotenv').config();

const productos = [
  { nombre: "Pan Molde Artesanal", precio: 4500, stock: 20, cat: "Pan", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500" },
  { nombre: "Baguette Rústica", precio: 2800, stock: 15, cat: "Pan", img: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500" },
  { nombre: "Galletas de Avena", precio: 3200, stock: 50, cat: "Snacks", img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500" },
  { nombre: "Brownie Vegano", precio: 2500, stock: 12, cat: "Snacks", img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500" },
  { nombre: "Pack Desayuno", precio: 9990, stock: 5, cat: "Pack", img: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=500" },
  { nombre: "Muffin Arándanos", precio: 1800, stock: 0, cat: "Snacks", img: "https://images.unsplash.com/photo-1558401391-7899b4bd5bbf?w=500" }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a Atlas para Seed...');
    
    await Product.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});
    
    await Product.insertMany(productos);
    console.log('✅ Datos cargados en la Nube');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();