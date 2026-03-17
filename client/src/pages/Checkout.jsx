import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { api } from '../api/axios';
import { clearCart } from '../store/slices/cartSlice';

const Checkout = () => {
  const { items } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rentalDuration, setRentalDuration] = useState(7);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPerDay = items.reduce((s, i) => s + i.pricePerDay * i.quantity, 0);
  const total = totalPerDay * rentalDuration;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill name, phone and address.');
      return;
    }
    setLoading(true);
    try {
      const orderProducts = items.map((i) => ({
        product: i.productId,
        quantity: i.quantity,
        pricePerDay: i.pricePerDay
      }));
      await api.post('/api/orders', {
        products: orderProducts,
        rentalDuration,
        address: address.trim(),
        phone: phone.trim(),
        name: name.trim()
      });
      dispatch(clearCart());
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Order failed.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rental duration (days)</label>
            <input type="number" min={1} value={rentalDuration} onChange={(e) => setRentalDuration(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
              <option value="card">Card (placeholder)</option>
              <option value="cod">Cash on delivery (placeholder)</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Placing order...' : 'Place order'}
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">Order summary</h2>
          <ul className="space-y-2 mb-4">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between text-sm">
                <span>{i.title} × {i.quantity}</span>
                <span>${(i.pricePerDay * i.quantity * rentalDuration).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="border-t pt-4 flex justify-between font-semibold">
            <span>Total ({rentalDuration} days)</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
