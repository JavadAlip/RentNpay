"use client";

import Protected from "@/Admin/Components/Protected";
import AdminLayout from "@/Admin/Components/AdminLayout";

export default function ProtectedAdminLayout({ children }) {
  return (
    <Protected>
      <AdminLayout>{children}</AdminLayout>
    </Protected>
  );
}
