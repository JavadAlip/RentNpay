import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const VendorProtected = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.vendor);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/vendor-main" replace />;
  }

  return children;
};

export default VendorProtected;
