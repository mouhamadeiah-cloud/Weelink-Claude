// The services of a free page (Eyad, 18 Oct): a trade's services as items, like a shop's products, so the
// Wee search pages can find «تركيب مكيفات» or «استشارة قانونية» and open the page that offers it. The owner
// lists them in the page's admin («خدماتي»); each has Weelink's public number (V-10001, see
// utils/itemNumbers.ts). They live in the project's `pageAdmin` field, and the published copy
// carries the shown ones (components/publish/publicData.ts).
import { newId } from '../shop/shopTypes';

export interface PageService {
  id: string;
  publicNo: number; // V-10001; 0 = not given yet
  name: string;
  description: string;
  price: string; // as the owner writes it: "20$", "حسب الطلب"; '' = no price
  image: string;
  published: boolean; // false = kept in the admin only
  createdAt: string;
}

export interface PageAdminData {
  services: PageService[];
}

export const MAX_SERVICES = 60;

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const emptyService = (): PageService => ({
  id: '',
  publicNo: 0,
  name: '',
  description: '',
  price: '',
  image: '',
  published: true,
  createdAt: '',
});

export const createEmptyPageAdmin = (): PageAdminData => ({ services: [] });

export const normalizePageAdmin = (raw: any): PageAdminData => ({
  services: (Array.isArray(raw?.services) ? raw.services : [])
    .filter((s: any) => str(s?.name))
    .slice(0, MAX_SERVICES)
    .map((s: any): PageService => ({
      id: str(s?.id, 80) || newId('srv'),
      publicNo: Math.max(0, Math.floor(Number(s?.publicNo) || 0)),
      name: str(s?.name, 120),
      description: str(s?.description),
      price: str(s?.price, 60),
      image: typeof s?.image === 'string' ? s.image : '',
      published: s?.published !== false,
      createdAt: str(s?.createdAt, 40) || new Date().toISOString(),
    })),
});

// The services the owner typed in Wee AI's questions («name: price» rows) as items, for a page with none yet.
export const servicesFromAnswers = (rows: unknown): PageService[] => {
  const now = new Date().toISOString();
  return (Array.isArray(rows) ? rows : [])
    .filter((r: any) => str(r?.name))
    .slice(0, MAX_SERVICES)
    .map((r: any) => ({ ...emptyService(), id: newId('srv'), name: str(r.name, 120), price: str(r.price, 60), createdAt: now }));
};

// A service as the published copy shows it: only the ones the owner left shown.
export const publicServices = (admin: PageAdminData) => admin.services.filter((s) => s.published);
