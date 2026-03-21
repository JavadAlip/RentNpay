'use client';

import React, { useState } from 'react';
import {
  Globe,
  FileText,
  ShoppingBag,
  Wrench,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const activeRentals = [
  {
    id: 1,
    name: '3-Seater Leather Sofa',
    category: 'Furniture',
    price: '₹3,500',
    startDate: 'Dec 1, 2025',
    endDate: 'Jun 1, 2026',
    progress: 66,
    image: null,
  },
  {
    id: 2,
    name: 'Samsung Top Load 6.5kg',
    category: 'Electronics',
    price: '₹3,500',
    startDate: 'Dec 1, 2025',
    endDate: 'Jun 1, 2026',
    progress: 66,
    image:
      'https://images.unsplash.com/photo-1626806787461-102a1bf84e87?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 3,
    name: 'LG Washing Machine',
    category: 'Electronics',
    price: '₹3,500',
    startDate: 'Dec 1, 2025',
    endDate: 'Jun 1, 2026',
    progress: 66,
    image:
      'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=200&q=80',
  },
];

const orderHistory = [
  {
    id: 'TXN-2026-001',
    date: 'Mar 1, 2026',
    amount: '₹3,500',
    type: 'Rent',
    status: 'Success',
  },
  {
    id: 'TXN-2026-002',
    date: 'Feb 28, 2026',
    amount: '₹2,800',
    type: 'Rent',
    status: 'Success',
  },
  {
    id: 'TXN-2026-003',
    date: 'Feb 15, 2026',
    amount: '₹45,000',
    type: 'Buy',
    status: 'Success',
  },
  {
    id: 'TXN-2026-004',
    date: 'Feb 10, 2026',
    amount: '₹599',
    type: 'Service',
    status: 'Success',
  },
  {
    id: 'TXN-2026-005',
    date: 'Feb 5, 2026',
    amount: '₹1,200',
    type: 'Rent',
    status: 'Failed',
  },
];

const PaymentList = () => {
  const [selected, setSelected] = useState([]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Rent':
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />;
      case 'Buy':
        return <ShoppingBag className="w-3.5 h-3.5 text-green-500" />;
      case 'Service':
        return <Wrench className="w-3.5 h-3.5 text-pink-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Rent':
        return 'text-blue-600';
      case 'Buy':
        return 'text-green-600';
      case 'Service':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
          My Payments
        </h1>

        {/* Active Rentals */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-gray-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Active Rentals
            </h2>
          </div>

          <div className="space-y-4">
            {activeRentals.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-1 sm:mt-0 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 shrink-0"
                    />
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {item.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 shrink-0 pl-7 sm:pl-0">
                    <span>{item.price}</span>
                    <span className="ml-1 text-[11px] sm:text-xs font-medium text-gray-500">
                      /month
                    </span>
                  </p>
                </div>

                {/* Timeline bar */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mb-2">
                    <span>
                      START DATE <br />
                      <span className="font-semibold text-gray-900">
                        {item.startDate}
                      </span>
                    </span>
                    <span className="text-right">
                      END DATE <br />
                      <span className="font-semibold text-gray-900">
                        {item.endDate}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm sm:text-base shadow-sm">
            Pay All
          </button>
        </div>

        {/* Order History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Order History
            </h2>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                      Transaction ID
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {row.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.date}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.amount}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-medium ${getTypeColor(row.type)}`}
                        >
                          {getTypeIcon(row.type)}
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium ${
                            row.status === 'Success'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {row.status === 'Success' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {orderHistory.map((row) => (
                <div key={row.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-gray-500">Transaction ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {row.id}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm text-gray-900">{row.date}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-sm font-medium text-gray-900">
                      {row.amount}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500">Type</p>
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${getTypeColor(row.type)}`}
                    >
                      {getTypeIcon(row.type)}
                      {row.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-medium ${
                        row.status === 'Success'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {row.status === 'Success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentList;
