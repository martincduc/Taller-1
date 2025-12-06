const mongoose = require('mongoose');
const { Product, Order, User } = require('./src/models');
require('dotenv').config();

const productos = [
  { nombre: "Pan Molde Artesanal", precio: 5890, stock: 20, cat: "Pan", img: "https://leonthebaker.com/cdn/shop/files/fit-bread-pan-de-proteinas-rebanado.jpg?v=1762259008&width=2497" },
  { nombre: "Baguette Rústica", precio: 2190, stock: 15, cat: "Pan", img: "https://abmauri.es/wp-content/uploads/2019/04/baguete-rustica-pt.jpg" },
  { nombre: "Galletas de Avena", precio: 3390, stock: 50, cat: "Snacks", img: "https://supermercado.eroski.es//images/26135657.jpg" },
  { nombre: "Brownie Vegano", precio: 5490, stock: 12, cat: "Snacks", img: "https://jumbocl.vtexassets.com/arquivos/ids/367499-900-900?width=900&height=900&aspect=true" },
  { nombre: "Pack Desayuno", precio: 30490, stock: 5, cat: "Pack", img: "https://desayunosadomicilioensantiago.cl/wp-content/uploads/2024/02/DADS_225.jpg" },
  { nombre: "Muffin Arándanos", precio: 3990, stock: 0, cat: "Snacks", img: "https://www.kiosclub.com/cdn/shop/files/willowminiarandanoMesadetrabajo10-100.jpg?v=1757506941&width=900" }
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