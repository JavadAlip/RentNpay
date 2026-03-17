import RentalCategories from '../components/RentPage/RentalCategories';
import RentMain from '../components/RentPage/RentMain';
import SaleBanner from '../components/RentPage/SaleBanner';
import Trending from '../components/HomePage/Trending';
import ShopsAsPerNeeds from '../components/HomePage/ShopsAsPerNeeds';
import WorkFlow from '../components/RentPage/WorkFlow';
import Discount from '../components/RentPage/Discount';
import CostumerReview from '../components/RentPage/CostumerReview';

const Home = () => {
  return (
    <>
      <RentMain />
      <RentalCategories />
      <SaleBanner />
      <ShopsAsPerNeeds />
      <Trending />
      <WorkFlow />
      <Discount />
      <CostumerReview />
    </>
  );
};

export default Home;
