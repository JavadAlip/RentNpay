import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, default: '' },
  condition: { type: String, enum: ['new', 'like-new', 'good', 'fair'], default: 'good' },
  availability: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  images: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
