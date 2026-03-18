const Topbar = ({ title = 'Master Dashboard' }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          {title}
        </h1>
        <p className="text-xs md:text-sm text-gray-500">
          Real-time platform health &amp; operations
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Live
        </button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300">
          <span className="sr-only">Notifications</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-medium text-gray-700">Super Admin</p>
            <p className="text-[11px] text-gray-400">Rentnpay Portal</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-semibold">
            R
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
