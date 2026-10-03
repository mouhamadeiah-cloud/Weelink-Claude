import { ShopAdminData } from '../shopTypes';

export interface AdminTabProps {
  data: ShopAdminData;
  update: (fn: (d: ShopAdminData) => ShopAdminData) => void;
}
