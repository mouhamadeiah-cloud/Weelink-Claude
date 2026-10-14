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
console.log(`${out.length} pages${only ? ' (preview only)' : ''}, ${problems.length} problems`);
