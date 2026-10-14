// The platform admin site's calls to /api/admin (see api/admin.ts). The session token lives in
// sessionStorage only, so closing the tab signs the admin out.
export interface AdminInfo {
  username: string;
  name: string;
  role: string;
  mustChange: boolean;
}

export type SubscriberStatus = 'active' | 'frozen' | 'cancelled';

export interface SubscriberRow {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt: number;
  lastActive: number;
  verified: boolean;
  disabled: boolean;
  status: SubscriberStatus;
  active: boolean;
  sites: { name: string; project: string }[];
}

export interface SubscribersResult {
  rows: SubscriberRow[];
  matched: number;
  summary: { total: number; active: number; sleeping: number; withPage: number; sleepingAfterDays: number };
}

export interface SubscriberQuery {
  q: string;
  state: 'all' | 'active' | 'sleeping';
  published: 'all' | 'yes' | 'no';
  verified: 'all' | 'yes' | 'no';
  status: 'all' | SubscriberStatus;
}

const KEY = 'weelink_admin_token';
export const getAdminToken = () => {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
};
export const setAdminToken = (token: string) => {
  try {
    if (token) sessionStorage.setItem(KEY, token);
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable: the admin signs in again after a reload
  }
};

export class AdminError extends Error {
  constructor(public code: string, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

const call = async <T,>(body: Record<string, unknown>): Promise<T> => {
  const token = getAdminToken();
  let res: Response;
  try {
    res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AdminError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminError(String(data.error || 'failed'), data);
  return data as T;
};

export const adminLogin = (username: string, password: string) => call<{ token: string; admin: AdminInfo }>({ action: 'login', username, password });
export const adminMe = () => call<{ admin: AdminInfo }>({ action: 'me' });
export const adminChangePassword = (current: string, next: string) => call<{ token: string; admin: AdminInfo }>({ action: 'change-password', current, next });
export const adminSubscribers = (query: SubscriberQuery) => call<SubscribersResult>({ action: 'subscribers', ...query });

export interface SubscriberDetail {
  profile: { uid: string; name: string; email: string; phone: string; verified: boolean; createdAt: number; lastActive: number; providers: string[] };
  status: { status: SubscriberStatus; reason: string; at: number; by: string };
  sites: { name: string; project: string; publishedAt: string }[];
  events: { id: string; at: number; admin: string; type: 'status' | 'note' | string; text: string; status: string }[];
}
export const adminSubscriber = (uid: string) => call<SubscriberDetail>({ action: 'subscriber', uid });
export const adminSetStatus = (uid: string, status: SubscriberStatus, reason: string) => call<{ status: SubscriberStatus }>({ action: 'set-status', uid, status, reason });
export const adminAddNote = (uid: string, text: string) => call<{ ok: true }>({ action: 'add-note', uid, text });
