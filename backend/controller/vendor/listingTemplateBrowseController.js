import ListingTemplate from '../../models/ListingTemplate.js';

/** Vendors can browse active admin listing templates to clone into their own products. */
export const listListingTemplatesForVendor = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const listingTemplates = await ListingTemplate.find({ isActive: true })
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
    const doc = await ListingTemplate.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();

    if (!doc) {
      return res.status(404).json({ message: 'Listing template not found' });
    }

    res.json({ listingTemplate: doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
