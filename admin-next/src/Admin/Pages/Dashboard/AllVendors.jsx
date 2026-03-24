'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllVendors } from '../../../redux/slices/adminSlice';

const AllVendors = () => {
  const dispatch = useDispatch();
  const { vendors, vendorsLoading, error } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(getAllVendors());
  }, [dispatch]);

  if (vendorsLoading) {
    return <div className="p-6 text-sm text-gray-600">Loading vendors...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">All Vendors</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-gray-500">
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Products</th>
              <th className="px-4 py-2 text-left font-medium">Verified</th>
              <th className="px-4 py-2 text-right font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v._id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-800">{v.fullName}</td>
                <td className="px-4 py-2 text-gray-600">{v.emailAddress}</td>
                <td className="px-4 py-2 text-gray-700 font-medium">
                  {v.productsCount ?? 0}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      v.isVerified
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}
                  >
                    {v.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-gray-500 text-xs">
                  {v.createdAt
                    ? new Date(v.createdAt).toLocaleDateString()
                    : '-'}
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  No vendors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllVendors;
