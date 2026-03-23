'use client';

import { useEffect, useState } from 'react';
import {
  useAuthModal,
  HOME_AUTH_PROMPT_SESSION_KEY,
} from '@/contexts/AuthModalContext';
import BotherSection from '../components/HomePage/BotherSection';
import FeaturedCategories from '../components/HomePage/FeaturedCategories';
import ShopsAsPerNeeds from '../components/HomePage/ShopsAsPerNeeds';
import Trending from '../components/HomePage/Trending';
import UsersReviews from '../components/HomePage/UsersReviews';
import NavbarSecondary from '../components/NavbarSecondary';
import HomeMain from '../components/HomePage/HomeMain';

const Home = () => {
  const { openAuth } = useAuthModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Skip if already logged in
    if (localStorage.getItem('userToken')) {
      console.log('[Modal] Skipped — user has token');
      return;
    }

    // Clear any stale session key and always show for non-logged-in users
    sessionStorage.removeItem(HOME_AUTH_PROMPT_SESSION_KEY);

    console.log('[Modal] Showing in 500ms...');
    const timer = setTimeout(() => {
      console.log('[Modal] openAuth called');
      openAuth('login');
    }, 500);

    return () => clearTimeout(timer);
  }, [mounted, openAuth]);

  return (
    <>
      <NavbarSecondary />
      <HomeMain />
      <FeaturedCategories />
      <BotherSection />
      <Trending />
      <ShopsAsPerNeeds />
      <UsersReviews />
    </>
  );
};

export default Home;
