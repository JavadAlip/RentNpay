'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const Profile = () => {
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Account Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Full Name
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {user?.name || user?.fullName || 'Not provided'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Email
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900 break-all">
              {user?.email || user?.emailAddress || 'Not provided'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Mobile Phone
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {user?.mobileNumber ||
                user?.phone ||
                user?.mobile ||
                'Not provided'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
