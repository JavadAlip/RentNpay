// import React, { useState } from 'react';

// const VendorSignup = ({ onClose, onSignIn, onSuccess }) => {
//   const [form, setForm] = useState({
//     fullName: '',
//     email: '',
//     password: '',
//   });
//   const [showPassword, setShowPassword] = useState(false);

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = () => {
//     if (!form.fullName || !form.email || !form.password) return;
//     if (onSuccess) onSuccess(form.email);
//   };

//   return (
//     <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-gray-100 px-9 py-10 flex flex-col items-center relative max-h-[90vh] overflow-y-auto">
//       {/* Close button */}
//       <button
//         onClick={() =>
//           onClose ? onClose() : (window.location.href = '/vendor-main')
//         }
//         className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
//       >
//         <svg
//           width="14"
//           height="14"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2.2"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             d="M6 18L18 6M6 6l12 12"
//           />
//         </svg>
//       </button>

//       <h1 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
//         Create Partner Account
//       </h1>

//       <div className="w-full flex flex-col gap-6">
//         {/* Full Name */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Owner's Full Name
//           </label>
//           <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
//             <svg
//               className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.7"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
//               />
//             </svg>
//             <input
//               type="text"
//               name="fullName"
//               value={form.fullName}
//               onChange={handleChange}
//               placeholder="e.g., Rajesh Kumar"
//               className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
//             />
//           </div>
//         </div>

//         {/* Email */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Business Email Address
//           </label>
//           <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
//             <svg
//               className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.7"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
//               />
//             </svg>
//             <input
//               type="email"
//               name="email"
//               value={form.email}
//               onChange={handleChange}
//               placeholder="yourname@gmail.com"
//               className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
//             />
//           </div>
//         </div>

//         {/* Password */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Set a strong password
//           </label>
//           <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
//             <svg
//               className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.7"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
//               />
//             </svg>
//             <input
//               type={showPassword ? 'text' : 'password'}
//               name="password"
//               value={form.password}
//               onChange={handleChange}
//               placeholder="Min. 8 characters"
//               className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="text-gray-400 hover:text-gray-600 transition ml-2"
//             >
//               {showPassword ? (
//                 <svg
//                   width="16"
//                   height="16"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.7"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
//                   />
//                 </svg>
//               ) : (
//                 <svg
//                   width="16"
//                   height="16"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.7"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
//                   />
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                   />
//                 </svg>
//               )}
//             </button>
//           </div>
//         </div>

//         <p className="text-xs text-gray-400 text-center">
//           By joining, you agree to our{' '}
//           <span className="text-orange-500 font-medium cursor-pointer hover:underline">
//             Partner Terms
//           </span>
//           .
//         </p>

//         <button
//           onClick={handleSubmit}
//           className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm font-semibold shadow-sm transition-all"
//         >
//           Create Account
//         </button>

//         <div className="flex justify-center pb-1">
//           <button
//             onClick={() =>
//               onSignIn ? onSignIn() : (window.location.href = '/vendor-login')
//             }
//             className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
//           >
//             Already a partner?{' '}
//             <span className="text-blue-600 font-medium">Sign In</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VendorSignup;

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { vendorSignup, clearError } from '../../../redux/slices/vendorSlice';

const VendorSignup = ({ onClose, onSignIn, onSuccess }) => {
  const dispatch = useDispatch();
  const { loading, error, pendingEmail } = useSelector((state) => state.vendor);

  const [form, setForm] = useState({
    fullName: '',
    emailAddress: '', // ← matches backend field name
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Once pendingEmail is set in Redux, signup succeeded → go to OTP screen
  useEffect(() => {
    if (pendingEmail) {
      if (onSuccess) onSuccess(pendingEmail);
    }
  }, [pendingEmail]);

  // Clear any stale errors when the component mounts
  useEffect(() => {
    dispatch(clearError());
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.fullName || !form.emailAddress || !form.password) return;
    dispatch(vendorSignup(form));
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_40px_rgba(15,23,42,0.10)] border border-gray-100 px-9 py-10 flex flex-col items-center relative max-h-[90vh] overflow-y-auto">
      {/* Close button */}
      <button
        onClick={() =>
          onClose ? onClose() : (window.location.href = '/vendor-main')
        }
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
      >
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
        Create Partner Account
      </h1>

      {/* API error banner */}
      {error && (
        <div className="w-full mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <div className="w-full flex flex-col gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Owner's Full Name
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
            <svg
              className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g., Rajesh Kumar"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Email — name changed to emailAddress to match backend */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Email Address
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
            <svg
              className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <input
              type="email"
              name="emailAddress"
              value={form.emailAddress}
              onChange={handleChange}
              placeholder="yourname@gmail.com"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Set a strong password
          </label>
          <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition">
            <svg
              className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition ml-2"
            >
              {showPassword ? (
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          By joining, you agree to our{' '}
          <span className="text-orange-500 font-medium cursor-pointer hover:underline">
            Partner Terms
          </span>
          .
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]
            ${loading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="flex justify-center pb-1">
          <button
            onClick={() =>
              onSignIn ? onSignIn() : (window.location.href = '/vendor-login')
            }
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            Already a partner?{' '}
            <span className="text-blue-600 font-medium">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;
