import Offer from '../../models/Offer.js';
import Product from '../../models/Product.js';

export const getAdminOffers = async (_req, res) => {
  try {
    const offers = await Offer.find({})
      .populate('productId', 'productName image price stock type status vendorId')
      .sort({ updatedAt: -1 });
    return res.json({ offers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const upsertAdminOffer = async (req, res) => {
  try {
    const {
      productId,
      discountPercent,
      sticker,
      isActive = true,
      startDate,
      endDate,
    } = req.body;
    if (!productId || !discountPercent) {
      return res
        .status(400)
        .json({ message: 'productId and discountPercent are required' });
    }

    const parseDateForRange = (value, rangeType) => {
      if (!value) return { value: null, invalid: false };
      const raw = String(value).trim();
      const normalized =
        /^\d{4}-\d{2}-\d{2}$/.test(raw)
          ? `${raw}${rangeType === 'end' ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`
          : raw;
      const d = new Date(normalized);
      if (Number.isNaN(d.getTime())) return { value: null, invalid: true };
      return { value: d, invalid: false };
    };

    const startParsed = parseDateForRange(startDate, 'start');
    const endParsed = parseDateForRange(endDate, 'end');
    const startAt = startParsed.value;
    const endAt = endParsed.value;
    if (startParsed.invalid) {
      return res.status(400).json({ message: 'Invalid startDate' });
    }
    if (endParsed.invalid) {
      return res.status(400).json({ message: 'Invalid endDate' });
    }
    if (startAt && endAt && endAt < startAt) {
      return res.status(400).json({ message: 'endDate must be after startDate' });
    }

    const product = await Product.findById(productId).select('vendorId');
    if (!product || !product.vendorId) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const offer = await Offer.findOneAndUpdate(
      { vendorId: product.vendorId, productId },
      {
        discountPercent: Number(discountPercent),
        sticker: sticker || '',
        startDate: startAt,
        endDate: endAt,
        isActive: Boolean(isActive),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('productId', 'productName image price stock type status vendorId');

    return res.status(200).json({ message: 'Offer saved', offer });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteAdminOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    return res.json({ message: 'Offer deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
