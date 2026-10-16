// The brand lists of «إضافة سيارة»: passenger cars (brand → models) and «شاحنات ومعدات» (category →
// brands and body types; the model is typed by hand). Both come from src/data/vehicles and are
// loaded only when the car entry opens, so the published showroom does not carry them.
import { useEffect, useState } from 'react';

export interface PassengerBrand {
  brand: string;
  models: string[];
}

interface NamedItem {
  name_ar: string;
  name_de: string;
}

export interface CommercialCategory {
  id: string;
  name_ar: string;
  brands: NamedItem[];
  types: NamedItem[];
}

export interface VehicleLists {
  passenger: PassengerBrand[];
  commercial: CommercialCategory[];
}

// «غير ذلك» / «Andere» in the lists means "not in the list": the field then takes any typed text.
const OTHER = 'غير ذلك';
export const isOther = (name: string) => name === OTHER || name === 'Andere';

let cache: Promise<VehicleLists> | null = null;
const loadVehicleLists = () =>
  (cache ||= Promise.all([
    import('../../data/vehicles/passengerCars.json'),
    import('../../data/vehicles/commercialVehicles.json'),
  ]).then(([p, c]) => ({
    passenger: (p.default as PassengerBrand[]).filter((b) => !isOther(b.brand)),
    commercial: (c.default as { categories: CommercialCategory[] }).categories,
  })).catch((err) => {
    cache = null;
    throw err;
  }));

export const useVehicleLists = () => {
  const [lists, setLists] = useState<VehicleLists | null>(null);
  useEffect(() => {
    let alive = true;
    loadVehicleLists().then((l) => alive && setLists(l)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return lists;
};
