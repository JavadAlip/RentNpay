import React from 'react';
import ServiceBannerSection from '../components/ServicePage/ServiceBannerSection';
import NeedHelpSection from '../components/ServicePage/NeedHelpSection';
import PopularServicesSection from '../components/ServicePage/PopularServicesSection';
import LovedByLocals from '../components/BuyPage/LovedByLocals';
import SaleBanner from '../components/RentPage/SaleBanner';

const ServicePage = () => {
  return (
    <>
      <ServiceBannerSection />
      <NeedHelpSection />
      <SaleBanner />
      <PopularServicesSection />
      <LovedByLocals />
    </>
  );
};

export default ServicePage;
