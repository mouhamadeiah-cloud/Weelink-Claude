// A page's ratings (Eyad, 13 Oct). A visitor rates with stars and words, confirms their email with
// a code (/api/rating), and the rating shows on the page; the owner answers it or reports it, but
// can't delete it. The page's average and count sit in one small document for the stars under its name.
//   ratings/{owner}/items/{id}        { project, stars, text, name, createdAt, reply?: { text, at } }
//   ratingSummary/{owner}_{project}   { count, sum, s1..s5 }
import { createContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { ProjectType } from '../components/shop/shopTypes';

export interface Rating {
  id: string;
  project: ProjectType;
  stars: number;
  text: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  reply?: { text: string; at: string } | null;
  reported?: boolean;
}

export interface RatingSummary {
  count: number;
  average: number;
  byStars: Record<1 | 2 | 3 | 4 | 5, number>;
}

export const EMPTY_SUMMARY: RatingSummary = { count: 0, average: 0, byStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

const toSummary = (d: any): RatingSummary => {
  const count = Math.max(0, Number(d?.count) || 0);
  return {
    count,
    average: count ? (Number(d?.sum) || 0) / count : 0,
    byStars: { 1: Number(d?.s1) || 0, 2: Number(d?.s2) || 0, 3: Number(d?.s3) || 0, 4: Number(d?.s4) || 0, 5: Number(d?.s5) || 0 },
  };
};

export const watchSummary = (owner: string, project: ProjectType, onData: (s: RatingSummary) => void) =>
  onSnapshot(doc(db, 'ratingSummary', `${owner}_${project}`), (snap) => onData(toSummary(snap.data())), () => onData(EMPTY_SUMMARY));

export const watchRatings = (owner: string, project: ProjectType, onData: (rows: Rating[]) => void, onError: () => void) =>
  onSnapshot(
    query(collection(db, 'ratings', owner, 'items'), where('project', '==', project)),
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Rating, 'id'>) }));
      rows.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onData(rows);
    },
    onError
  );

export const useRatingSummary = (owner?: string, project?: ProjectType) => {
  const [summary, setSummary] = useState<RatingSummary>(EMPTY_SUMMARY);
  useEffect(() => {
    if (!owner || !project) return setSummary(EMPTY_SUMMARY);
    return watchSummary(owner, project, setSummary);
  }, [owner, project]);
  return summary;
};

export const useRatings = (owner?: string, project?: ProjectType, on = true) => {
  const [rows, setRows] = useState<Rating[] | null | 'error'>(null);
  useEffect(() => {
    if (!owner || !project || !on) return;
    setRows(null);
    return watchRatings(owner, project, setRows, () => setRows('error'));
  }, [owner, project, on]);
  return rows;
};

const post = async (body: object, withToken = false) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withToken) {
    const user = auth.currentUser;
    if (!user) return { error: 'signed_out' };
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  try {
    const res = await fetch('/api/rating', { method: 'POST', headers, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    return res.ok ? out : { error: out.error || 'error', ...out };
  } catch {
    return { error: 'offline' };
  }
};

export const startRating = (r: { owner: string; project: ProjectType; pageName: string; stars: number; text: string; name: string; email: string }) =>
  post({ action: 'start', ...r }) as Promise<{ id?: string; error?: string; waitSeconds?: number }>;
export const verifyRating = (id: string, code: string) => post({ action: 'verify', id, code }) as Promise<{ ok?: boolean; error?: string; attemptsLeft?: number }>;
export const replyToRating = (owner: string, id: string, text: string) => post({ action: 'reply', owner, id, text }, true);
export const reportRating = (owner: string, id: string, text: string) => post({ action: 'report', owner, id, text }, true);

export const ratingErrorText = (e?: string, extra?: { waitSeconds?: number; attemptsLeft?: number }) => {
  if (e === 'missing_name') return 'اكتب اسمك.';
  if (e === 'bad_email') return 'تأكد من الإيميل.';
  if (e === 'too_soon') return `انتظر ${extra?.waitSeconds || 60} ثانية قبل ما تطلب رمز جديد.`;
  if (e === 'send_failed') return 'ما قدرنا نبعت الرمز لهذا الإيميل. تأكد منه.';
  if (e === 'expired') return 'انتهت صلاحية الرمز. ابعت التقييم مرة ثانية.';
  if (e === 'wrong_code') return extra?.attemptsLeft ? `الرمز غلط. بقي ${extra.attemptsLeft} محاولات.` : 'الرمز غلط. ابعت التقييم مرة ثانية.';
  if (e === 'too_many_attempts') return 'محاولات كتيرة غلط. ابعت التقييم مرة ثانية.';
  return 'ما زبط. تأكد من الإنترنت وجرّب مرة ثانية.';
};

// The editor tells the admins whether the page has its ratings slide, and adds it on request.
export const RatingsSlideContext = createContext<{ has: boolean; add: () => void } | null>(null);
