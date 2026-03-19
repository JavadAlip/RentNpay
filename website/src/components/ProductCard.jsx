import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { _id, productName, image, price, type, category, subCategory, stock } =
    product;

  return (
    <Link
      to={`/products/${_id}`}
      className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={image}
          alt={productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;gap:8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#d1d5db">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span style="font-size:12px;color:#9ca3af;">No Image</span>
              </div>`;
          }}
        />
      </div>

      {/* Details */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-500 transition-colors">
          {productName}
        </h3>

        {/* Category / Subcategory */}
        <p className="text-xs text-gray-400 mt-1">
          {category}
          {subCategory ? ` › ${subCategory}` : ''}
        </p>

        {/* Price + Type badge */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-orange-500 font-bold text-base">₹{price}</p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              type === 'Rental'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-green-50 text-green-600'
            }`}
          >
            {type}
          </span>
        </div>

        {/* Stock */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-green-400' : 'bg-red-400'}`}
          />
          <span className="text-xs text-gray-500">
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
