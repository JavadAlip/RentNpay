'use client';

import React from 'react';
import BuyPrdctMain from '../components/BuyPrdctDetail/BuyPrdctMain';
import BuyPrdctDesc from '../components/BuyPrdctDetail/BuyPrdctDesc';
import BuySimilarProducts from '../components/BuyPage/BuySimilarProducts';
import CostumerReview from '../components/RentPage/CostumerReview';

const BuyPrdctDetail = ({ product }) => {
  return (
    <>
      <BuyPrdctMain product={product} />
      <BuyPrdctDesc product={product} />
      <BuySimilarProducts />
      <CostumerReview />
    </>
  );
};

export default BuyPrdctDetail;

