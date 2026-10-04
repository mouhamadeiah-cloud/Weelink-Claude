// Gives the canvas the shop's admin data, so the store page can list the exported products.
// null outside an Online Shop project.
import { createContext, useContext } from 'react';
import type { ShopAdminData } from '../shopTypes';

export const ShopDataContext = createContext<ShopAdminData | null>(null);

export const useShopData = () => useContext(ShopDataContext);

// Lets the store page write to the shop data: the checkout page adds the visitor's order (and
// their customer account). null outside an Online Shop project.
export type ShopDataUpdate = (fn: (d: ShopAdminData) => ShopAdminData) => void;

export const ShopUpdateContext = createContext<ShopDataUpdate | null>(null);

export const useShopUpdate = () => useContext(ShopUpdateContext);
