// Gives the canvas the restaurant's menu (from the admin window), so the menu and cart elements can
// show it, and a way to hand a visitor's order in to the admin window's orders.
import { createContext, useContext } from 'react';
import type { OrderInput, RestaurantAdminData } from '../restaurantTypes';

export const RestaurantDataContext = createContext<RestaurantAdminData | null>(null);

export const useRestaurantData = () => useContext(RestaurantDataContext);

export const RestaurantOrderContext = createContext<((o: OrderInput) => void) | null>(null);

export const useRestaurantOrder = () => useContext(RestaurantOrderContext);
