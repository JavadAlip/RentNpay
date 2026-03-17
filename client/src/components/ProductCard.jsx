import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const img = product.images?.[0] || '/placeholder.png';
  const imgSrc = img.startsWith('http') || img.startsWith('/') ? (img.startsWith('/') ? import.meta.env.VITE_API_URL + img : img) : img;

  return (
    <Link to={`/products/${product._id}`} className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={imgSrc}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=No+Image'; }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary">{product.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{product.category?.name}</p>
        <p className="mt-2 text-primary font-bold">${product.pricePerDay}/day</p>
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${product.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {product.availability}
        </span>
      </div>
    </Link>
  );
};

export default ProductCard;
