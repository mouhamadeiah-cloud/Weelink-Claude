// Gives the canvas the investment company's admin data, so its pages can list the projects, and a
// way to hand in a visitor's investment request from a project's page.
import { createContext, useContext } from 'react';
import type { InvestAdminData, InvestRequestInput } from '../investTypes';

export const InvestDataContext = createContext<InvestAdminData | null>(null);

export const useInvestData = () => useContext(InvestDataContext);

export const InvestRequestContext = createContext<((r: InvestRequestInput) => void) | null>(null);

export const useInvestRequest = () => useContext(InvestRequestContext);
