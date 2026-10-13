// «المواعيد» in the shop, car showroom and restaurant admins: the page's appointments, for the page
// the editor (or the owner's view of the page) has open.
import React, { useContext } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { BookingsSection } from './BookingsSection';

export const BookingsTab: React.FC<unknown> = () => {
  const page = useContext(BookingPageContext);
  return page ? <BookingsSection owner={page.owner} project={page.project} /> : null;
};
