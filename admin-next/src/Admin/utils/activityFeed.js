export function formatRelativeTime(dateValue) {
  if (!dateValue) return 'just now';
  const now = Date.now();
  const then = new Date(dateValue).getTime();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function buildActivityFeed({ users = [], vendors = [], products = [], orders = [] }) {
  const items = [];

  users.forEach((u) => {
    items.push({
      id: `user_${u._id}`,
      type: 'user',
      createdAt: u.createdAt,
      title: 'New user account created',
      subtitle: `${u.fullName || u.emailAddress || 'User'} joined`,
    });
  });

  vendors.forEach((v) => {
    items.push({
      id: `vendor_${v._id}`,
      type: 'vendor',
      createdAt: v.createdAt,
      title: 'New vendor registered',
      subtitle: `${v.fullName || v.emailAddress || 'Vendor'} signed up`,
    });
  });

  products.forEach((p) => {
    items.push({
      id: `product_${p._id}`,
      type: 'product',
      createdAt: p.createdAt,
      title: 'New product listed',
      subtitle: p.productName || 'Product added',
    });
  });

  orders.forEach((o) => {
    const firstProduct = o.products?.[0]?.product?.productName || 'a product';
    items.push({
      id: `order_${o._id}`,
      type: 'order',
      createdAt: o.createdAt,
      title: 'New order placed',
      subtitle: `${o.user?.fullName || o.user?.emailAddress || 'User'} ordered ${firstProduct}`,
    });
  });

  return items
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);
}

