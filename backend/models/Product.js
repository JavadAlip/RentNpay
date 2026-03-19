// import mongoose from 'mongoose';

// const productSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   description: { type: String, required: true },
//   pricePerDay: { type: Number, required: true },
//   category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
//   brand: { type: String, default: '' },
//   condition: { type: String, enum: ['new', 'like-new', 'good', 'fair'], default: 'good' },
//   availability: { type: String, enum: ['available', 'unavailable'], default: 'available' },
//   images: [{ type: String }]
// }, { timestamps: true });

// export default mongoose.model('Product', productSchema);

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    price: {
      type: String, // "1499/month"
      required: true,
    },

    type: {
      type: String,
      enum: ['Rental', 'Sell'],
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    subCategory: {
      type: String,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Low Stock', 'Out of Stock'],
      default: 'Active',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Product', productSchema);
