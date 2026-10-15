// Developer preview of the gallery pages (scripts/gallery/pages) drawn by the real renderer, for checking
// layout while they are written: `npm run dev`, then /preview/gallery-preview.html?key=<page key>.
// Photos written as `photo:<search>` have no picture offline, so they show as labelled colour blocks.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import { LiveDesign } from '../src/components/gallery/LiveSlide';
import { deserializeElements } from '../src/utils/elementStorage';

// preview.json is written by `npm run gallery-pages` and is not committed.
const found = import.meta.glob('../src/data/galleryPages/preview.json', { eager: true, import: 'default' }) as Record<string, any[]>;
const data: any[] = Object.values(found)[0] || [];

const params = new URLSearchParams(location.search);

const palette = ['#5b7c99', '#8a6f5b', '#6b8f71', '#9a6b8c', '#7c8a96', '#a1885e'];
const placeholder = (q: string) => {
  const c = palette[[...q].reduce((a, ch) => a + ch.charCodeAt(0), 0) % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${c}"/><rect x="0" y="0" width="800" height="600" fill="url(#g)" opacity=".35"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><text x="400" y="300" font-size="38" fill="#fff" text-anchor="middle" font-family="sans-serif">${q.replace(/&/g, '&amp;')}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const fill = (v: any): any => {
  if (typeof v === 'string' && v.startsWith('photo:')) return placeholder(v.slice(6));
  if (Array.isArray(v)) return v.map(fill);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]));
  return v;
};

const only = params.get('key');
const App = () => (
  <div style={{ width: params.get('device') === 'mobile' ? 390 : 1280, margin: '0 auto' }}>
    {data.filter((d) => !only || d.key === only).map((d) => {
      const page = fill(d.page);
      const elements = deserializeElements(fill(d.elements));
      return (
        <section key={d.key} id={`p-${d.key}`} style={{ marginBottom: 40, background: '#fff' }}>
          <div dir="ltr" style={{ padding: 8, font: '14px sans-serif', background: '#222', color: '#fff' }}>{d.key} · {d.name} · {d.lookId}</div>
          <LiveDesign slides={page.slides} elements={elements} navbar={page.navbar} interactive={params.get('interactive') === '1'} device={params.get('device') === 'mobile' ? 'mobile' : 'desktop'} />
        </section>
      );
    })}
  </div>
);
createRoot(document.getElementById('root')!).render(<App />);
