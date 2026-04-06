import mongoose from 'mongoose';

/** Atomic sequence for stable customer IDs (CUST-001, …). */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
