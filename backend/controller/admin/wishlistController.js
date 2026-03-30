import Wishlist from '../../models/Wishlist.js';

export const getWishlistAnalytics = async (req, res) => {
  try {
    const topProducts = await Wishlist.aggregate([
      {
        $group: {
          _id: '$productId',
          totalWishlists: { $sum: 1 },
          latestAt: { $max: '$createdAt' },
        },
      },
      { $sort: { totalWishlists: -1, latestAt: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'vendors',
          localField: 'product.vendorId',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      {
        $addFields: {
          vendorName: {
            $ifNull: [{ $arrayElemAt: ['$vendor.fullName', 0] }, 'Vendor'],
          },
        },
      },
      {
        $project: {
          _id: 0,
          productId: '$product._id',
          totalWishlists: 1,
          productName: '$product.productName',
          productImage: '$product.image',
          category: '$product.category',
          price: '$product.price',
          stock: '$product.stock',
          vendorName: 1,
        },
      },
    ]);

    const topUsers = await Wishlist.aggregate([
      {
        $group: {
          _id: '$userId',
          totalWishlists: { $sum: 1 },
          latestAt: { $max: '$createdAt' },
        },
      },
      { $sort: { totalWishlists: -1, latestAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          fullName: '$user.fullName',
          emailAddress: '$user.emailAddress',
          totalWishlists: 1,
        },
      },
    ]);

    const totalWishlistedItems = await Wishlist.countDocuments();

    const topCategoryAgg = await Wishlist.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const mostWishlistedCategory = topCategoryAgg[0]?._id || '—';
    const mostWishlistedCategoryCount = topCategoryAgg[0]?.count || 0;

    return res.json({
      summary: {
        totalWishlistedItems,
        mostWishlistedCategory,
        mostWishlistedCategoryCount,
        topWishlistUsers: topUsers.length,
      },
      topProducts,
      topUsers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

