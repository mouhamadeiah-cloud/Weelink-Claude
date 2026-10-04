// Gives the canvas the car showroom's admin data, so the showroom page can list its cars, and a way to
// hand in a visitor's request (test drive or the car) from a car's page.
import { createContext, useContext } from 'react';
import type { CarAdminData } from '../carTypes';
import type { RequestInput } from '../carMoney';

export const CarDataContext = createContext<CarAdminData | null>(null);

export const useCarData = () => useContext(CarDataContext);

export const CarRequestContext = createContext<((r: RequestInput) => void) | null>(null);

export const useCarRequest = () => useContext(CarRequestContext);
