import React from 'react';
import RentpayAdvantage from '../components/BuyPage/RentpayAdvantage';
import LovedByLocals from '../components/BuyPage/LovedByLocals';
import BuyBannerSection from '../components/BuyPage/BuyMain';
import BuyCategories from '../components/BuyPage/BuyCategories';
import BuySimilarProducts from '../components/BuyPage/BuySimilarProducts';
import BuyOfferBanner from '../components/BuyPage/BuyOfferBanner';
import WorkFlow from '../components/RentPage/WorkFlow';

const BuyPage = () => {
  return (
    <>
      <BuyBannerSection />
      <BuyCategories />
      <BuySimilarProducts />
      <BuyOfferBanner />
      <WorkFlow />
      <RentpayAdvantage />
      <LovedByLocals />
    </>
  );
};

export default BuyPage;
