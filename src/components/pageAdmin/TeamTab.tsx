// «فريق العمل» in the shop and car showroom admins: the account's people, for the page the editor
// (or the owner's view of the page) has open.
import React, { useContext } from 'react';
import { BookingPageContext } from '../../services/bookings';
import { TeamSection } from './TeamSection';

export const TeamTab: React.FC<unknown> = () => {
  const page = useContext(BookingPageContext);
  return page ? <TeamSection owner={page.owner} /> : null;
};
