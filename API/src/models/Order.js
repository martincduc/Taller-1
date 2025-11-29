const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  qty: Number,
  price: Number
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: Number,
  
  // --- NUEVOS CAMPOS ---
  deliveryMethod: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  commune: { type: String, default: '' },
  address: { type: String, default: '' }, // Dirección física (calle y número)
  
  status: { type: String, default: 'Pendiente de pago' }
}, { timestamps: true });

orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { 
      delete ret._id; 
      ret.id = doc._id.toString();
  }
});

module.exports = mongoose.model('Order', orderSchema);