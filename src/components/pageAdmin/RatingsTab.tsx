// «التقييمات» in the shop, car showroom and restaurant admins, for the page the editor has open.
import React, { useContext } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { RatingsSection } from './RatingsSection';

export const RatingsTab: React.FC<unknown> = () => {
  const page = useContext(BookingPageContext);
  return page ? <RatingsSection owner={page.owner} project={page.project} pageName={page.pageName} /> : null;
};
