// A project's key. An account's first project of each kind keeps the kind as its key ('page', 'shop',
// 'cars', 'restaurant'), so everything saved before keeps working. Every project made after that gets
// its own key, the kind and a short id ('restaurant-k3x9q2'), and lives in designs/{uid}/projects/{key}.
import type { ProjectType } from '../components/shop/shopTypes';

export const PROJECT_KINDS: ProjectType[] = ['page', 'shop', 'cars', 'restaurant'];

const KEY = /^(page|shop|cars|restaurant)(-[a-z0-9]{4,12})?$/;

export const isProjectKey = (s: unknown): s is string => typeof s === 'string' && KEY.test(s);

export const kindOf = (key: string): ProjectType => key.split('-')[0] as ProjectType;

/** The account's first project of its kind, saved in designs/{uid} itself. */
export const isFirstOfKind = (key: string) => !key.includes('-');

export const newProjectKey = (kind: ProjectType, rand: () => number = Math.random) => {
  let id = '';
  for (let i = 0; i < 6; i++) id += '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(rand() * 36)];
  return `${kind}-${id}`;
};

// The local copies of a project (pages, elements, admin data). The first of each kind keeps the
// prefixes it always had.
const FIRST_PREFIX: Record<ProjectType, string> = { page: 'weelink_', shop: 'weelink_shop_', cars: 'weelink_cars_', restaurant: 'weelink_restaurant_' };

export const localPrefixOf = (key: string) => (isFirstOfKind(key) ? FIRST_PREFIX[kindOf(key)] : `weelink_${key.replace('-', '_')}_`);
