import ListingTemplate from '../../models/ListingTemplate.js';
import SellListingTemplate from '../../models/SellListingTemplate.js';

const vendorTemplateActiveQuery = () => ({
  /** Admin “toggle off” sets `isActive: false`; hide those from vendor catalog. */
  isActive: { $ne: false },
});

/** Vendors can browse admin listing templates that are still enabled for vendors. */
export const listListingTemplatesForVendor = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const requestedType = String(req.query.type || '').trim().toLowerCase();
    const Model = requestedType === 'sell' ? SellListingTemplate : ListingTemplate;
    const listingTemplates = await Model.find(vendorTemplateActiveQuery())
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    let filtered = listingTemplates;
    if (q) {
      filtered = listingTemplates.filter((t) => {
        const name = String(t.productName || '').toLowerCase();
        const sku = String(t.sku || '').toLowerCase();
        const cat = String(t.category || '').toLowerCase();
        const sub = String(t.subCategory || '').toLowerCase();
        return (
          name.includes(q) ||
          sku.includes(q) ||
          cat.includes(q) ||
          sub.includes(q)
        );
      });
    }

    res.json({ listingTemplates: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getListingTemplateForVendor = async (req, res) => {
  try {
    const requestedType = String(req.query.type || '').trim().toLowerCase();
    const active = vendorTemplateActiveQuery();
    let doc = null;
    if (requestedType === 'sell') {
      doc = await SellListingTemplate.findOne({
        _id: req.params.id,
        ...active,
      }).lean();
    } else if (requestedType === 'rental') {
      doc = await ListingTemplate.findOne({
        _id: req.params.id,
        ...active,
      }).lean();
    } else {
      doc = await ListingTemplate.findOne({
        _id: req.params.id,
        ...active,
      }).lean();
      if (!doc) {
        doc = await SellListingTemplate.findOne({
          _id: req.params.id,
          ...active,
        }).lean();
      }
    }

    if (!doc) {
      return res.status(404).json({ message: 'Listing template not found' });
    }

    res.json({ listingTemplate: doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
