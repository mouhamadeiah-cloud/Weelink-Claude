// Developer preview of the admin's «مراجعة الشرائح» with a stand-in for /api/admin: the staged Weelink pages as rows.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import { SlidesReviewView } from '../src/components/admin/SlidesReviewView';

const found = import.meta.glob('../src/data/galleryPages/preview.json', { eager: true, import: 'default' }) as Record<string, any[]>;
const pages: any[] = Object.values(found)[0] || [];
const fill = (v: any): any => (typeof v === 'string' && v.startsWith('photo:') ? '' : Array.isArray(v) ? v.map(fill) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) : v);
const rows = pages.slice(0, 3).map((p, i) => ({ id: `weelink-ai_${p.key}`, name: p.name, category: p.category, designerUid: 'weelink-ai', designerName: 'Weelink AI', status: 'pending', lawVersion: 0, acceptedAt: '', createdAt: 1000 - i, reason: '', reviewedBy: '', official: true, editedBy: '', kind: 'page', slide: fill(p.page.slides[0]), page: fill(p.page), elements: fill(p.elements) }));
const edit = { ...rows[0], isEdit: true, designerUid: 'des1', designerName: 'سارة', official: false, name: `${rows[0].name} (تعديل)` };

const real = window.fetch.bind(window);
window.fetch = (async (url: any, init: any) => {
  if (String(url).includes('/api/admin')) {
    const body = JSON.parse(init?.body || '{}');
    (window as any).__calls = [...((window as any).__calls || []), body.action];
    const json = (o: any) => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (body.action === 'slides-review-list') return json({ rows: [edit, ...rows], counts: { pending: rows.length + 1 } });
    if (body.action === 'gallery-seed-status') return json({ total: 20, published: 0, staged: 3, searchesLeft: 30, unsplash: true });
    return json({ ok: true });
  }
  return real(url, init);
}) as typeof fetch;

createRoot(document.getElementById('root')!).render(<SlidesReviewView onSessionEnd={() => {}} />);
