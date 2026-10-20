// Messages sent from a page's «نموذج تواصل». The server (/api/contact) saves and emails them:
//   inquiries/{owner}/items/{id}   { project, pageName, name, phone, email, message, read, createdAt };
//                                  the owner and members read them, mark them read and delete them.
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { ProjectKey } from '../utils/projectKeys';

export interface Inquiry {
  id: string;
  project: ProjectKey;
  pageName: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  kind?: 'inquiry' | 'order' | 'car';
  read: boolean;
  createdAt: string;
}

export type NewInquiry = { owner: string; project: ProjectKey; pageName: string; name: string; phone: string; email: string; message: string; website: string; kind?: 'inquiry' | 'order' | 'car' | 'restaurant' };

export const sendInquiry = async (m: NewInquiry): Promise<{ ok: true } | { error: string }> => {
  try {
    const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
    const out = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { error: out.error || 'error' };
  } catch {
    return { error: 'offline' };
  }
};

// Tells the page's owner about a visitor's order or request (the server saves it and emails the owner).
export const notifyOwner = (m: Omit<NewInquiry, 'website' | 'email'> & { email?: string }) =>
  sendInquiry({ email: '', ...m, website: '' }).then((out) => {
    if ('error' in out) console.warn('Could not tell the owner:', out.error);
    return out;
  });

export const contactErrorText = (code: string) =>
  ({
    too_many: 'أرسلت عدة رسائل بوقت قصير. جرّب بعد ساعة.',
    missing_fields: 'تأكد من الاسم ورقم الهاتف والرسالة.',
    bad_email: 'الإيميل مش مكتوب صح.',
    offline: 'ما في اتصال بالإنترنت. جرّب مرة ثانية.',
  })[code] || 'ما قدرنا نرسل رسالتك. جرّب بعد شوي.';

// The page's messages, live, newest first.
export const watchInquiries = (owner: string, project: ProjectKey, onData: (rows: Inquiry[]) => void, onError: () => void) =>
  onSnapshot(
    query(collection(db, 'inquiries', owner, 'items'), where('project', '==', project)),
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Inquiry, 'id'>) }));
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(rows);
    },
    onError
  );

export const markInquiryRead = (owner: string, id: string) => updateDoc(doc(db, 'inquiries', owner, 'items', id), { read: true });
export const deleteInquiry = (owner: string, id: string) => deleteDoc(doc(db, 'inquiries', owner, 'items', id));
