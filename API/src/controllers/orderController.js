const { Order, Product } = require('../models');

// 1. CREAR PEDIDO
exports.createOrder = async (req, res) => {
  try {
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

// 2. OBTENER MIS PEDIDOS (MEJORADO)
exports.getMyOrders = async (req, res) => {
  try {
    // AQUI ESTÁ LA MAGIA: .populate('items.product') trae los datos del pan/producto
    const orders = await Order.find({ user: req.user.id })
        .populate('items.product') 
        .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pedidos' });
  }
};

// 3. ACTUALIZAR ESTADO (Pago / Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (status === 'Pagado' && order.status !== 'Pagado') {
        // Descontar stock al pagar
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
        }
    }

    order.status = status;
    await order.save();

    res.json({ message: `Estado actualizado a ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando' });
  }
};

// 4. ANULAR PEDIDO (Usuario) - MEJORADO
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Validar estados finales irreversibles
    if (order.status === 'Anulado' || order.status === 'Entregado') {
        return res.status(400).json({ error: 'Este pedido ya no se puede anular.' });
    }

    // Si estaba pagado, DEVOLVEMOS el stock
    if (order.status === 'Pagado') {
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
        }
    }

    order.status = 'Anulado';
    await order.save();

    res.json({ message: 'Pedido anulado y stock restaurado', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al anular el pedido' });
  }
};