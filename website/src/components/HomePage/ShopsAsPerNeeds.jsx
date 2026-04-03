import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mainimg from './../../assets/images/Sub Container.png';
import { apiGetCategories } from '../../helper/api';

const ShopsAsPerNeeds = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await apiGetCategories();
        if (!isMounted) return;
        setCategories(res?.data || []);
      } catch (e) {
        console.error('[ShopsAsPerNeeds] Failed to load categories', e);
        if (!isMounted) return;
        setCategories([]);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const rentCategories = useMemo(() => {
    const isRentEnabled = (c) => {
      const v = c?.availableInRent;
      return (
        v === true ||
        v === 'true' ||
        v === 1 ||
        v === '1' ||
        v === undefined ||
        v === null
      );
    };

    return categories.filter(isRentEnabled);
  }, [categories]);

  const displayed = rentCategories.slice(0, 8);

  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h2 className="text-xl md:text-2xl font-semibold mb-10">
          Shop As Per Your Needs !
        </h2>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                      <img
                        src={mainimg}
                        alt=""
                        className="w-10 h-10 object-contain opacity-60"
                      />
                    </div>
                    <p className="text-xs md:text-sm mt-3 text-gray-700 opacity-40">
                      &nbsp;
                    </p>
                  </div>
                ))
              : displayed.map((c, index) => {
                  const title = c?.name || c?.title || `Category ${index + 1}`;
                  const image = c?.image || c?.icon || mainimg;

                  return (
                    <div
                      key={c?._id || c?.id || `${title}-${index}`}
                      onClick={() =>
                        navigate(`/products?category=${encodeURIComponent(title)}`)
                      }
                      className="flex flex-col items-center text-center cursor-pointer"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                        <img
                          src={image}
                          alt={title}
                          className="w-10 h-10 object-contain"
                        />
                      </div>

                      <p className="text-xs md:text-sm mt-3 text-gray-700">
                        {title}
                      </p>
                    </div>
                  );
                })}
          </div>

          {/* Right Images Layout - hidden on small screens */}
          <div className="hidden md:flex relative w-full h-[380px] items-center justify-center">
            {/* Top Image */}
            <img
              src={mainimg}
              alt="service1"
              className="absolute top-0 left-10 w-[260px] md:w-[300px] rounded-xl shadow-md object-cover"
            />

            {/* Bottom Image */}
            <img
              src={mainimg}
              alt="service2"
              className="absolute bottom-0 right-10 w-[260px] md:w-[300px] rounded-xl shadow-md object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopsAsPerNeeds;
