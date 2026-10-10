// زبائن الموقع: the visitors who joined the restaurant's site with their Weelink account.
import React from 'react';
import { PageCustomersList } from '../../customers/PageCustomersList';
import { restaurantSiteUrl } from '../restaurantCloud';
import { RestaurantTabProps } from './shared';

export const CustomersTab: React.FC<RestaurantTabProps> = ({ ownerUid }) => (
  <PageCustomersList ownerUid={ownerUid} isOwner siteUrl={restaurantSiteUrl(ownerUid)} />
);
