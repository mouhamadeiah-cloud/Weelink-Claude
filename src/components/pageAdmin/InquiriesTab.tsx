// «الرسائل» in the shop, car showroom and restaurant admins: the messages sent from the page's
// «نموذج تواصل», for the page the editor (or the owner's view of the page) has open.
import React, { useContext } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { InquiriesSection } from './InquiriesSection';

export const InquiriesTab: React.FC<unknown> = () => {
  const page = useContext(BookingPageContext);
  return page ? <InquiriesSection owner={page.owner} project={page.project} /> : null;
};
