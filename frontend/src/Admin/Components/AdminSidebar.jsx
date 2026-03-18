import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { adminLogout } from '../../redux/slices/adminSlice';

const AdminSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const logout = async () => {
    await dispatch(adminLogout());
    navigate('/admin-login');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/products', label: 'Products' },
    { to: '/categories', label: 'Categories' },
    { to: '/orders', label: 'Orders' },
    { to: '/users', label: 'Users' },
  ];

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-56' : 'w-16'
      } bg-gray-900 text-white flex-shrink-0 transition-all flex flex-col min-h-screen`}
    >
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-primary truncate">
          Rentpay Admin
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
      <nav className="mt-4 flex-1">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="block px-4 py-3 hover:bg-gray-700 text-gray-200"
          >
            {sidebarOpen ? l.label : l.label.charAt(0)}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full py-2 text-left text-red-400 hover:bg-gray-700 rounded px-4"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
