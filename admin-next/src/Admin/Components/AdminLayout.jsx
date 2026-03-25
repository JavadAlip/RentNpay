'use client';

import Sidebar from './AdminSidebar';
import TopBar from './AdminTopbar';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
