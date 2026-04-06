import Counter from '../models/Counter.js';
import User from '../models/userAuthModel.js';

/**
 * Backfill `customerNumber` for users created before the field existed,
 * and sync the Counter so new signups continue the sequence.
 */
export default async function ensureUserCustomerNumbers() {
  const missing = await User.find({
    $or: [{ customerNumber: { $exists: false } }, { customerNumber: null }],
  })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();

  if (!missing.length) {
    const maxDoc = await User.findOne({ customerNumber: { $gt: 0 } })
      .sort({ customerNumber: -1 })
      .select('customerNumber')
      .lean();
    const maxNum = maxDoc?.customerNumber || 0;
    if (maxNum > 0) {
      const c = await Counter.findById('userCustomerSeq').lean();
      if (!c || c.seq < maxNum) {
        await Counter.findByIdAndUpdate(
          'userCustomerSeq',
          { $set: { seq: maxNum } },
          { upsert: true },
        );
      }
    }
    return;
  }

  let seq =
    (
      await User.findOne({ customerNumber: { $gt: 0 } })
        .sort({ customerNumber: -1 })
        .select('customerNumber')
        .lean()
    )?.customerNumber || 0;

  for (const u of missing) {
    seq += 1;
    await User.updateOne({ _id: u._id }, { $set: { customerNumber: seq } });
  }

  await Counter.findByIdAndUpdate(
    'userCustomerSeq',
    { $set: { seq } },
    { upsert: true },
  );
}
