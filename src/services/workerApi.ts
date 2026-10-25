// The worker's own page and the owner's side of it (server/worker.ts, through /api/booking).
import { auth } from './firebase';

export interface WorkerBooking {
  id: string;
  date: string;
  startMin: number;
  slot: string;
  name: string;
  desc: string;
  status: 'new' | 'confirmed' | 'done' | 'cancelled';
  pageName: string;
}
export interface WorkerView {
  person: { id: string; name: string; role: string; color: string };
  today: string;
  bookings: WorkerBooking[];
}

// The address of a business's worker page; the worker types their code there.
export const workerUrl = (owner: string) => `${window.location.origin}/?worker=${encodeURIComponent(owner)}`;

const post = async (body: object, withAuth = false): Promise<{ ok: boolean; status: number; data: any }> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const user = auth.currentUser;
    if (!user) return { ok: false, status: 401, data: { error: 'signed_out' } };
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  try {
    const res = await fetch('/api/booking', { method: 'POST', headers, body: JSON.stringify(body) });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, data: { error: 'offline' } };
  }
};

export const workerPinIds = async (owner: string): Promise<string[]> => {
  const r = await post({ action: 'worker-pins', owner }, true);
  return r.ok && Array.isArray(r.data.ids) ? r.data.ids : [];
};

export const setWorkerPin = async (owner: string, person: string, pin: string): Promise<string> => {
  const r = await post({ action: 'worker-set-pin', owner, person, pin }, true);
  return r.ok ? '' : r.data.error || 'error';
};

export const loadWorkerView = async (owner: string, pin: string): Promise<{ view: WorkerView } | { error: string }> => {
  const r = await post({ action: 'worker-view', owner, pin });
  return r.ok ? { view: r.data } : { error: r.data.error || 'error' };
};

export const markWorkerDone = async (owner: string, pin: string, id: string): Promise<string> => {
  const r = await post({ action: 'worker-done', owner, pin, id });
  return r.ok ? '' : r.data.error || 'error';
};
