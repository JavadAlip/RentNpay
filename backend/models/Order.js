import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  pricePerDay: { type: Number, required: true },
  /** Snapshot: total refundable deposit for this line (per-unit deposit × quantity). */
  refundableDeposit: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [orderItemSchema],
  rentalDuration: { type: Number, required: true },
  /** How `rentalDuration` is interpreted: calendar months vs day count (matches cart / checkout). */
  tenureUnit: {
    type: String,
    enum: ['month', 'day'],
  },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
