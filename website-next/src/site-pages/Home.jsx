// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { api } from '../api/axios';
// import CategorySection from '../components/CategorySection';
// import ProductCard from '../components/ProductCard';

// const Home = () => {
//   const [categories, setCategories] = useState([]);
//   const [featured, setFeatured] = useState([]);
//   const [popular, setPopular] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [catRes, prodRes] = await Promise.all([
//           api.get('/api/categories'),
//           api.get('/api/products?limit=8')
//         ]);
//         setCategories(catRes.data);
//         setFeatured(prodRes.data.products || []);
//         setPopular(prodRes.data.products?.slice(0, 4) || []);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (search.trim()) window.location.href = `/products?search=${encodeURIComponent(search.trim())}`;
//   };

//   return (
//     <div>
//       <section className="bg-primary-50 border-b border-primary-100">
//         <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
//           <div className="text-center max-w-2xl mx-auto">
//             <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Rent what you need</h1>
//             <p className="mt-4 text-lg text-gray-600">Furniture, electronics, and more. Flexible daily rental.</p>
//             <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
//               <input
//                 type="text"
//                 placeholder="Search rentals..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
//               />
//               <button type="submit" className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-700">
//                 Search
//               </button>
//             </form>
//           </div>
//         </div>
//       </section>

//       <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
//         {loading ? (
//           <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
//         ) : (
//           <>
//             {categories.length > 0 && <CategorySection categories={categories} title="Featured categories" />}
//             <section className="py-12">
//               <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured products</h2>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//                 {featured.map((p) => <ProductCard key={p._id} product={p} />)}
//               </div>
//               <div className="mt-6 text-center">
//                 <Link to="/products" className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700">View all</Link>
//               </div>
//             </section>
//             <section className="py-12">
//               <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular rental items</h2>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//                 {popular.map((p) => <ProductCard key={p._id} product={p} />)}
//               </div>
//             </section>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Home;

'use client';

import BotherSection from '../components/HomePage/BotherSection';
import FeaturedCategories from '../components/HomePage/FeaturedCategories';
import ShopsAsPerNeeds from '../components/HomePage/ShopsAsPerNeeds';
import Trending from '../components/HomePage/Trending';
import UsersReviews from '../components/HomePage/UsersReviews';
import NavbarSecondary from '../components/NavbarSecondary';
import HomeMain from './../components/HomePage/HomeMain';

const Home = () => {
  return (
    <>
      <NavbarSecondary />
      <HomeMain />
      <FeaturedCategories />
      <BotherSection />
      <Trending />
      <ShopsAsPerNeeds />
      <UsersReviews />
    </>
  );
};

export default Home;
