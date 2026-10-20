// The orders (shop) or car requests that visitors of the published page sent, listed at the top of the
// «الطلبات» / «طلبات الزوار» tab. They are saved as inquiries of that kind (server/contact.ts).
import React, { useContext } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { InquiriesSection } from './InquiriesSection';

export const VisitorRequests: React.FC<{ kind: 'order' | 'car' }> = ({ kind }) => {
  const page = useContext(BookingPageContext);
  return page ? <InquiriesSection owner={page.owner} project={page.project} kind={kind} /> : null;
};
