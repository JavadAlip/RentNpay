import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity } from '../store/slices/cartSlice';

const Cart = () => {
  const { items } = useSelector((s) => s.cart);
  const dispatch = useDispatch();

  const total = items.reduce((sum, i) => sum + i.pricePerDay * i.quantity, 0);

  const imgSrc = (src) => {
    if (!src) return 'https://via.placeholder.com/100?text=No+Image';
    return src.startsWith('http') ? src : (import.meta.env.VITE_API_URL || '') + src;
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
        <Link to="/products" className="text-primary font-medium hover:underline">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
              <img src={imgSrc(item.image)} alt="" className="w-24 h-24 object-cover rounded-lg" onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-primary font-semibold">${item.pricePerDay}/day</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(item.pricePerDay * item.quantity).toFixed(2)}</p>
                <button
                  onClick={() => dispatch(removeFromCart(item.productId))}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Summary</h2>
            <p className="text-gray-600">Total rental (per day): <span className="font-bold text-primary">${total.toFixed(2)}</span></p>
            <p className="text-sm text-gray-500 mt-2">Final amount depends on rental duration at checkout.</p>
            <Link
              to="/checkout"
              className="mt-6 block w-full py-3 bg-primary text-white text-center font-medium rounded-lg hover:bg-primary-700"
            >
              Proceed to Checkout
            </Link>
            <Link to="/products" className="mt-3 block text-center text-primary text-sm hover:underline">Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
