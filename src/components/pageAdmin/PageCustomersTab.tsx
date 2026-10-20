// «مشتركو الصفحة» in the shop and car showroom admins: the visitors who joined the page with their Weelink
// account (the restaurant has its own «زبائن الموقع»), for the page the admin has open.
import React, { useContext } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { PageCustomersList } from '../customers/PageCustomersList';

export const PageCustomersTab: React.FC<unknown> = () => {
  const page = useContext(BookingPageContext);
  return page ? <PageCustomersList ownerUid={page.owner} isOwner /> : null;
};
