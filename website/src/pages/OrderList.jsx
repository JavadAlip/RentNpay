import React from 'react';
import {
  Search,
  Truck,
  Calendar,
  AlertCircle,
  CreditCard,
  Box,
} from 'lucide-react';

const OrderList = () => {
  return (
    <div className="min-h-screen bg-[#F4F6FB] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Orders</h1>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            placeholder="Search by Order ID or Item"
            className="w-full outline-none text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 rounded-xl p-2 flex flex-wrap gap-2 mb-6 text-sm">
          <button className="bg-orange-500 text-white px-4 py-1.5 rounded-lg flex gap-2">
            All <span className="bg-white/30 px-2 rounded">15</span>
          </button>
          <button className="px-4 py-1.5 text-gray-600 flex gap-2">
            Active Rentals <span className="bg-gray-200 px-2 rounded">3</span>
          </button>
          <button className="px-4 py-1.5 text-gray-600 flex gap-2">
            Delivered <span className="bg-gray-200 px-2 rounded">8</span>
          </button>
          <button className="px-4 py-1.5 text-gray-600 flex gap-2">
            Services <span className="bg-gray-200 px-2 rounded">2</span>
          </button>
          <button className="px-4 py-1.5 text-gray-600 flex gap-2">
            Cancelled <span className="bg-gray-200 px-2 rounded">2</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* ORDER 1 – Shipped */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  Order #12345
                </span>
                <p>Placed on: 12 Feb 2026</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                Shipped
              </span>
            </div>

            <div className="flex gap-4 p-4 items-center">
              <img
                src="https://images.unsplash.com/photo-1582582494700-cd3b1b2d6f59"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  Ergonomic Mesh Chair (Black)
                </h3>
                <p className="text-orange-500 font-semibold">₹4,999</p>
                <p className="text-xs text-gray-500">
                  Qty: 1 | Expected Delivery: 15 Feb 2026
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 px-4 pb-4 pt-0">
              <button className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg flex items-center justify-center gap-2">
                <Truck size={16} />
                Track Order
              </button>
              <button className="text-xs sm:text-sm text-gray-500 hover:underline whitespace-nowrap">
                Need Help?
              </button>
            </div>
          </div>

          {/* ACTIVE RENTAL */}
          <div className="bg-white border border-emerald-300 rounded-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  Order #12346
                </span>
                <p>Rent Started: 10 Jan 2026</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full">
                Active Rental
              </span>
            </div>

            <div className="flex gap-4 p-4 items-center">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  Samsung Top Load 6.5kg
                </h3>
                <p className="text-orange-500 font-semibold">₹1,200/month</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={14} />
                  Next Rent Due: 10 Mar 2026
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-orange-500 mt-1">
                  <AlertCircle size={12} />
                  Payment Due in 8 days
                </span>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center justify-between gap-3 sm:gap-4">
              <button className="flex-1 border border-orange-500 text-orange-500 py-2.5 rounded-lg flex items-center justify-center gap-2">
                <CreditCard size={14} />
                Pay Rent
              </button>
              <button className="text-xs text-gray-500 whitespace-nowrap">
                Request Pickup / Close Rental
              </button>
            </div>
          </div>

          {/* CANCELLED */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  Order #12347
                </span>
                <p>Placed on: 5 Feb 2026</p>
              </div>
              <span className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full">
                Cancelled
              </span>
            </div>

            <div className="flex gap-4 p-4 items-center">
              <img
                src="https://images.unsplash.com/photo-1585659722983-3a675dabf23d"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-medium text-gray-900">
                  Microwave Oven (20L)
                </h3>
                <p className="text-sm text-emerald-600">
                  Refund Processed: ₹899 to Source
                </p>
                <p className="text-xs text-gray-400">
                  Cancelled by you on 6 Feb 2026
                </p>
              </div>
            </div>

            <div className="px-4 pb-4">
              <button className="text-xs text-gray-500 underline">
                View Refund Details
              </button>
            </div>
          </div>

          {/* DELIVERED – PRODUCT */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  Order #12348
                </span>
                <p>Delivered on: 1 Feb 2026</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                Delivered
              </span>
            </div>

            <div className="flex gap-4 p-4 items-center">
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  Smart Watch (Black)
                </h3>
                <p className="text-orange-500 font-semibold">₹2,499</p>
                <p className="text-xs text-gray-500">
                  Qty: 1 | Payment: Prepaid | Delivered successfully
                </p>
              </div>
            </div>

            <div className="px-4 pb-4 pt-0 flex justify-between items-center gap-3">
              <button className="flex-1 border border-gray-300 rounded-full py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50">
                Rate &amp; Review
              </button>
              <button className="text-xs text-gray-500 hover:underline whitespace-nowrap">
                Return or Exchange
              </button>
            </div>
          </div>

          {/* SCHEDULED SERVICE */}
          <div className="bg-white border border-blue-200 rounded-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  Order #12349
                </span>
                <p>Booked on: 6 Feb 2026</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                Scheduled
              </span>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <Box size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    Home Deep Cleaning
                  </h3>
                  <p className="text-orange-500 font-semibold">₹1,999</p>
                  <p className="text-xs text-gray-500">
                    Scheduled: Tomorrow, 10:00 AM
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Professional: Rajan Kumar (Contact: +91 98765 43210)
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-blue-100 pt-3">
                <button className="flex-1 border border-blue-400 text-blue-600 rounded-full py-2 text-xs sm:text-sm hover:bg-blue-50">
                  Reschedule
                </button>
                <button className="text-xs text-gray-500 hover:underline whitespace-nowrap">
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-4 mt-8 text-sm">
          <button className="text-gray-400">Previous</button>
          <button className="w-8 h-8 bg-orange-500 text-white rounded flex items-center justify-center">
            1
          </button>
          <button className="w-8 h-8 border rounded flex items-center justify-center">
            2
          </button>
          <button className="w-8 h-8 border rounded flex items-center justify-center">
            3
          </button>
          <button>Next</button>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
