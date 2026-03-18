import React from 'react';
import RentpayAdvantage from '../components/BuyPage/RentpayAdvantage';
import LovedByLocals from '../components/BuyPage/LovedByLocals';
import BuyBannerSection from '../components/BuyPage/BuyMain';
import BuyCategories from '../components/BuyPage/BuyCategories';
import SimilarRental from '../components/RentPrdctDetail/SimilarRental';
import WorkFlow from '../components/RentPage/WorkFlow';

const BuyPage = () => {
  return (
    <>
      <BuyBannerSection />
      <BuyCategories />
      <SimilarRental />
      <WorkFlow />
      <RentpayAdvantage />
      <LovedByLocals />
    </>
  );
};

export default BuyPage;
