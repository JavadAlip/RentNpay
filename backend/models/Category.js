// import mongoose from 'mongoose';

// const categorySchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   slug: { type: String, required: true, unique: true }
// }, { timestamps: true });

// export default mongoose.model('Category', categorySchema);

import mongoose from 'mongoose';

const operationRuleSchema = new mongoose.Schema(
  {
    commissionRate: { type: Number, default: 0 },
    otherTax: { type: Number, default: 0 },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: '' },
    icon: { type: String, default: '' },
    availableInRent: { type: Boolean, default: true },
    availableInBuy: { type: Boolean, default: false },
    availableInServices: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 0 },
    otherTax: { type: Number, default: 0 },
    operations: { type: [operationRuleSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('Category', categorySchema);
