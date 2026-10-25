// The accounts of a Pro page (Eyad, 25 Oct): the hand entries the owner adds (income and expenses) next to
// the booking deposits the owner confirmed (bookingDeposits, written by api/booking.ts).
//   pageLedger/{owner}/items/{id}  { project, kind, amount, category, note, date, createdAt }; the owner and members read and write it
import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { ProjectKey } from '../utils/projectKeys';

export interface PageEntry {
  id: string;
  kind: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string; // yyyy-mm-dd
}

export const PAGE_INCOME = ['خدمات', 'مبيعات', 'إيرادات أخرى'];
export const PAGE_EXPENSE = ['إيجار', 'رواتب', 'مواد', 'تسويق', 'مصاريف أخرى'];

export const normalizeEntry = (id: string, d: any): PageEntry => ({
  id,
  kind: d?.kind === 'expense' ? 'expense' : 'income',
  amount: Math.max(0, Number(d?.amount) || 0),
  category: String(d?.category ?? '').slice(0, 60),
  note: String(d?.note ?? '').slice(0, 200),
  date: /^\d{4}-\d{2}-\d{2}$/.test(String(d?.date)) ? String(d.date) : '',
});

export const addPageEntry = (owner: string, project: ProjectKey, e: Omit<PageEntry, 'id'>) =>
  addDoc(collection(db, 'pageLedger', owner, 'items'), { ...e, project, createdAt: new Date().toISOString() });

export const deletePageEntry = (owner: string, id: string) => deleteDoc(doc(db, 'pageLedger', owner, 'items', id));

export const usePageEntries = (owner: string, project: ProjectKey) => {
  const [state, setState] = useState<{ items: PageEntry[]; error: boolean }>({ items: [], error: false });
  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'pageLedger', owner, 'items'), where('project', '==', project)),
        (snap) => setState({ items: snap.docs.map((d) => normalizeEntry(d.id, d.data())).filter((e) => e.date && e.amount > 0).sort((a, b) => b.date.localeCompare(a.date)), error: false }),
        () => setState({ items: [], error: true })
      ),
    [owner, project]
  );
  return state;
};
