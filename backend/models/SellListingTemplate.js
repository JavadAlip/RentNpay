import mongoose from 'mongoose';

const labelValueSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '' },
    value: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    variantName: { type: String, trim: true, default: '' },
    images: { type: [String], default: [] },
    variantSpecs: { type: [labelValueSchema], default: [] },
    price: { type: String, trim: true, default: '' },
    stock: { type: Number, default: 0 },
    color: { type: String, trim: true, default: '' },
    storage: { type: String, trim: true, default: '' },
    ram: { type: String, trim: true, default: '' },
    condition: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const sellListingTemplateSchema = new mongoose.Schema(
  {
    sku: { type: String, default: '', trim: true },
    productName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
    price: { type: String, required: true },
    type: { type: String, default: 'Sell', enum: ['Sell'] },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    brand: { type: String, default: '' },
    condition: {
      type: String,
      enum: ['Brand New', 'Like New', 'Good', 'Fair'],
      default: 'Good',
    },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
    productCustomSpecs: { type: [labelValueSchema], default: [] },
    variants: { type: [variantSchema], default: [] },
    salesConfiguration: {
      type: {
        allowVendorEditSalePrice: { type: Boolean, default: true },
        salePrice: { type: Number, default: 0 },
        mrpPrice: { type: Number, default: 0 },
      },
      default: {},
    },
    stock: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Low Stock', 'Out of Stock'],
      default: 'Active',
    },
  },
  { timestamps: true },
);

export default mongoose.model('SellListingTemplate', sellListingTemplateSchema);
