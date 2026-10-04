// Gives the canvas the car showroom's admin data, so the showroom page can list its cars.
import { createContext, useContext } from 'react';
import type { CarAdminData } from '../carTypes';

export const CarDataContext = createContext<CarAdminData | null>(null);

export const useCarData = () => useContext(CarDataContext);
