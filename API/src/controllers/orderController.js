const { Order, Product } = require('../models');

// 1. CREAR PEDIDO
exports.createOrder = async (req, res) => {
  try {
    // Recibimos nuevos datos: deliveryMethod y commune
    const { items, total, address, deliveryMethod, commune } = req.body;
    const userId = req.user.id;

    // Validación de Stock
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

    // Crear orden con los nuevos datos
    const order = await Order.create({
        user: userId,
        total,
        address: deliveryMethod === 'pickup' ? 'Retiro en Tienda (Av. Siempre Viva 123)' : address,
        commune: deliveryMethod === 'pickup' ? 'Santiago' : commune,
        deliveryMethod,
        items: orderItems
    });

    res.status(201).json({ message: 'Pedido creado', orderId: order._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error procesando pedido' });
  }
};

// 2. OBTENER MIS PEDIDOS
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pedidos' });
  }
};

// 3. ACTUALIZAR ESTADO (Pago)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (status === 'Pagado' && order.status !== 'Pagado') {
        console.log(`Pago confirmado #${id}. Descontando stock...`);
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                // Descontar
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
            }
        }
    }

    // Devolución de stock si falla (opcional, buena práctica)
    if ((status === 'Rechazado' || status === 'Error') && order.status === 'Pagado') {
         // Lógica inversa si fuera necesaria
    }

    order.status = status;
    await order.save();

    res.json({ message: `Estado actualizado a ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando' });
  }
};