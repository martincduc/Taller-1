const { Order, Product } = require('../models');

// 1. CREAR (Valida stock pero NO descuenta)
exports.createOrder = async (req, res) => {
  try {
    const { items, total, address } = req.body;
    const userId = req.user.id;

    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) return res.status(404).json({ error: `Producto no encontrado` });
      
      if (product.stock < item.qty) {
        return res.status(400).json({ 
          error: `Stock insuficiente: ${product.nombre}. Quedan ${product.stock}.` 
        });
      }
    }

    const orderItems = items.map(i => ({ product: i.id, qty: i.qty, price: i.price }));

    const order = await Order.create({
        user: userId,
        total,
        address,
        items: orderItems
    });

    res.status(201).json({ message: 'Pedido creado', orderId: order._id });

  } catch (error) {
    res.status(500).json({ error: 'Error creando pedido' });
  }
};

// 2. OBTENER
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pedidos' });
  }
};

// 3. ACTUALIZAR (Descuenta stock solo si Status = Pagado)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (status === 'Pagado' && order.status !== 'Pagado') {
        console.log(`Pago confirmado #${id}. Descontando stock en Mongo...`);
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                // Descontar usando inc negativo
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
            }
        }
    }

    order.status = status;
    await order.save();

    res.json({ message: `Estado actualizado a ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error actualizando' });
  }
};