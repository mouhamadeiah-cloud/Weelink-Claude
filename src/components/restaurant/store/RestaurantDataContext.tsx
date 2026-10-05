// Gives the canvas the restaurant's menu (from the admin window), so the menu and cart elements can
// show it, and a way to hand a visitor's order in to the admin window's orders.
import { createContext, useContext } from 'react';
import type { MenuOrder, RestaurantAdminData } from '../restaurantTypes';

export const RestaurantDataContext = createContext<RestaurantAdminData | null>(null);

export const useRestaurantData = () => useContext(RestaurantDataContext);

// Hands a guest's order in; resolves to the order's number of the day when it reached the live orders
// (kitchen, orders list), or null when it did not.
export const RestaurantOrderContext = createContext<((o: MenuOrder) => Promise<number | null>) | null>(null);

export const useRestaurantOrder = () => useContext(RestaurantOrderContext);
