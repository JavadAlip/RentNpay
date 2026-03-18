import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const Protected = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.admin);

  // Optional: show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default Protected;
