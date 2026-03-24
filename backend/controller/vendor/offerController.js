import Offer from '../../models/Offer.js';
import Product from '../../models/Product.js';

export const getVendorOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ vendorId: req.vendor._id })
      .populate('productId', 'productName image price stock type status')
      .sort({ updatedAt: -1 });
    res.json({ offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertVendorOffer = async (req, res) => {
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
      // Date-only values from <input type="date"> should cover full day range.
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

    const product = await Product.findOne({
      _id: productId,
      vendorId: req.vendor._id,
    });
    if (!product) {
      return res
        .status(404)
        .json({ message: 'Product not found for this vendor' });
    }

    const offer = await Offer.findOneAndUpdate(
      { vendorId: req.vendor._id, productId },
      {
        discountPercent: Number(discountPercent),
        sticker: sticker || '',
        startDate: startAt,
        endDate: endAt,
        isActive: Boolean(isActive),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('productId', 'productName image price stock type status');

    res.status(200).json({ message: 'Offer saved', offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVendorOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findOneAndDelete({
      _id: id,
      vendorId: req.vendor._id,
    });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.json({ message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .populate('productId', 'productName image price stock type status category subCategory')
      .sort({ updatedAt: -1 });

    const mapped = offers
      .filter((o) => o.productId)
      .map((o) => ({
        _id: o._id,
        productId: o.productId._id,
        discountPercent: o.discountPercent,
        sticker: o.sticker,
        startDate: o.startDate,
        endDate: o.endDate,
        isActive: o.isActive,
        product: o.productId,
      }));

    res.json({ offers: mapped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

