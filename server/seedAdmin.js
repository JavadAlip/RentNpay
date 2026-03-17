import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2] || 'kaushik@seekneo.net';
const password = process.argv[3] || 'Admin@123';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ name: 'Admin', email, password });
  user.role = 'admin';
  await user.save();
  console.log('Admin user ready:', email);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
