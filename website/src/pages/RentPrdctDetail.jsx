import { SmileIcon } from 'lucide-react';
import RentPrdctDesc from '../components/RentPrdctDetail/RentPrdctDesc';
import RentPrdctMain from '../components/RentPrdctDetail/RentPrdctMain';
import SimilarRental from '../components/RentPrdctDetail/SimilarRental';
import CostumerReview from '../components/RentPage/CostumerReview';
import WorkFlow from '../components/RentPage/WorkFlow';

const RentPrdctDetail = () => {
  return (
    <>
      <RentPrdctMain />
      <RentPrdctDesc />
      <SimilarRental />
      <CostumerReview />
      <WorkFlow />
    </>
  );
};

export default RentPrdctDetail;
