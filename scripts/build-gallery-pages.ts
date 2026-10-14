// `npm run gallery-pages`: builds the 20 «Weelink AI» gallery pages (scripts/gallery/pages/*.ts) into
// src/data/galleryPages/pages.json, which the admin site's «نشر نماذج Weelink» publishes. It also checks
// each page against the gallery's rules, so a page that would be refused (or looks broken) fails here.
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildPage, type PageSpec } from './gallery/dsl';
import { findContactInfo, findNavbarContact } from '../src/utils/contactCheck';
import { SCRIPTABLE_TYPES } from '../src/utils/safeHtml';
import { PAGE_MAX_SLIDES } from '../src/data/slideCategories';

const dir = new URL('./gallery/pages/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.ts')).sort();
const only = process.argv[2];

const problems: string[] = [];
const out: ReturnType<typeof buildPage>[] = [];
for (const f of files) {
  const spec: PageSpec = (await import(pathToFileURL(join(dir.pathname, f)).href)).default;
  if (only && !f.includes(only)) continue;
  const built = buildPage(spec);
  const bad = (m: string) => problems.push(`${spec.key}: ${m}`);
  if (built.page.slides.length > PAGE_MAX_SLIDES) bad(`more than ${PAGE_MAX_SLIDES} slides`);
  for (const s of built.page.slides) {
    const els = built.elements.filter((e) => e.slideId === s.id);
    // The constitution's limit is 18 elements a slide, a group (a card with what is on it) counting as one.
    const boxes = els.filter((e) => e.isGroupContainer);
    const inGroup = els.filter((e) => !e.isGroupContainer && boxes.some((g) => e.x >= g.x && e.y >= g.y && e.x + e.width <= g.x + g.width && e.y + e.height <= g.y + g.height)).length;
    const units = els.length - inGroup;
    if (units > 18) bad(`${s.name}: ${units} elements (${els.length} with their groups' contents)`);
    for (const e of els) {
      if (SCRIPTABLE_TYPES.includes(e.type)) bad(`${s.name}: html element`);
      if (e.type !== 'shape' && (e.x < -2 || e.y < -2 || e.x + e.width > 1282 || e.y + e.height > s.height + 2)) bad(`${s.name}: «${e.name}» (${e.content?.slice(0, 20)}) outside the slide (${e.x},${e.y},${e.width}x${e.height})`);
    }
  }
  for (const c of [...findContactInfo(built.elements), ...findNavbarContact(built.page.navbar)]) bad(`contact info: ${c.kind} in ${c.elementName}`);
  out.push(built);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
}
mkdirSync(new URL('../src/data/galleryPages/', import.meta.url), { recursive: true });
if (!only) writeFileSync(new URL('../src/data/galleryPages/pages.json', import.meta.url), JSON.stringify(out));
// The developer preview (preview/gallery-preview.html) reads this one; it is not committed.
writeFileSync(new URL('../src/data/galleryPages/preview.json', import.meta.url), JSON.stringify(out));
if (!only) {
  // What the set covers, against the brief (20 pages; effects, motion, frames, shapes, transparency, lights, dividers, ratings, galleries).
  const all = out.flatMap((p) => p.elements.map((e) => ({ ...e, page: p.key })));
  const pagesWith = (f: (e: any) => boolean) => new Set(all.filter(f).map((e) => e.page)).size;
  const a = (e: any, k: string) => e.styles?.[k];
  const heroes = out.map((p) => { const s0: any = p.page.slides[0]; return s0.backgroundVideo ? 'video' : s0.backgroundImage ? 'image' : 'color'; });
  const rgbaAlpha = (v: unknown) => typeof v === 'string' && /rgba\([^)]*,\s*0?\.\d+\)/.test(v);
  console.log([
    `heroes: ${heroes.filter((h) => h === 'video').length} video, ${heroes.filter((h) => h === 'image').length} image, ${heroes.filter((h) => h === 'color').length} colour`,
    `text effects: ${pagesWith((e) => a(e, 'textEffect'))} pages (${[...new Set(all.map((e) => a(e, 'textEffect')).filter(Boolean))].join(', ')})`,
    `animations: ${all.filter((e) => a(e, 'animation')).length} elements (${[...new Set(all.map((e) => a(e, 'animation')).filter(Boolean))].join(', ')})`,
    `frames: ${all.filter((e) => a(e, 'borderWidth') > 0).length} elements, widths ${[...new Set(all.map((e) => a(e, 'borderWidth')).filter(Boolean))].sort((x, y) => x - y).join('/')}`,
    `shapes: ${all.filter((e) => e.type === 'shape' && !e.content).length}, lines: ${all.filter((e) => e.type === 'shape' && e.content).length} (${[...new Set(all.filter((e) => e.type === 'shape' && e.content).map((e) => e.content))].join(', ')})`,
    `transparency: ${all.filter((e) => rgbaAlpha(a(e, 'backgroundColor')) || a(e, 'opacity') < 1).length} elements`,
    `glows: ${all.filter((e) => a(e, 'glowIntensity') > 0).length} elements in ${[...new Set(all.filter((e) => a(e, 'glowIntensity') > 0).map((e) => a(e, 'glowColor')))].length} colours; slide inner lights: ${out.flatMap((p) => p.page.slides).filter((s: any) => s.innerGlowIntensity).length}`,
    `dividers: ${[...new Set(out.flatMap((p) => p.page.slides.map((s: any) => s.dividerShape)))].sort().join(', ')}`,
    `ratings on ${pagesWith((e) => e.type === 'ratings')} pages; galleries on ${pagesWith((e) => e.type === 'gallery' || e.galleryConfig)}; calendar on ${pagesWith((e) => e.type === 'calendar')}; table on ${pagesWith((e) => e.type === 'table')}`,
    `navbars: ${out.map((p) => `${p.key}:${(p.page.navbar as any).layout || 'bar'}${(p.page.navbar as any).posY !== undefined ? '/float' : ''}`).join(' ')}`,
    `looks: ${[...new Set(out.map((p) => p.lookId))].join(', ')}`,
    `categories: ${['p-business', 'p-restaurant', 'p-cars', 'p-shop'].map((c) => `${c} ${out.filter((p) => p.category === c).length}`).join(', ')}`,
  ].join('\n'));
}
console.log(`${out.length} pages${only ? ' (preview only)' : ''}, ${problems.length} problems`);
