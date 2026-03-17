import { Link } from 'react-router-dom';

const CategorySection = ({ categories, title = 'Featured categories' }) => (
  <section className="py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat._id}
          to={`/products?category=${cat._id}`}
          className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:border-primary hover:bg-primary-50 transition-all"
        >
          <span className="text-lg font-medium text-gray-900">{cat.name}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default CategorySection;
