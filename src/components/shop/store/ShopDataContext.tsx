// Gives the canvas the shop's admin data, so the store page can list the exported products.
// null outside an Online Shop project.
import { createContext, useContext } from 'react';
import type { ShopAdminData } from '../shopTypes';

export const ShopDataContext = createContext<ShopAdminData | null>(null);

export const useShopData = () => useContext(ShopDataContext);
