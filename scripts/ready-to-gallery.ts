// Writes src/data/galleryReady/ready.json: the ready slides of the code (every category but the fixed ones: shop, showroom,
// menu) as gallery slides, so the admin site can copy them into the gallery (server/readyCopy.ts) and the gallery
// becomes the one place designs live (Eyad, 21 Oct; docs/READY_SLIDES_PLAN.md, step 2).
//
//   npm run ready-to-gallery      (the file is committed; run again only if the code's ready slides changed before the copy)
import { mkdirSync, writeFileSync } from 'node:fs';
import { GALLERY_READY_CATEGORIES } from '../src/data/readyCategories';
import { getSlideTemplatePayload, slideTemplateCount } from '../src/data/slideTemplates';

// The gallery's categories (src/data/slideCategories.ts) have no «شركاء» or «فيديو»: the nearest one, or «أخرى».
export const GALLERY_CATEGORY_OF: Record<string, string> = {
  intro: 'hero', about: 'about', special_offer: 'offers', prices: 'services', team: 'team', features: 'services', gallery: 'gallery', table: 'services',
  video: 'other', bio: 'about', services: 'services', projects: 'gallery', partners: 'other', map: 'contact', privacy: 'legal', contact: 'contact', booking: 'booking',
};

const items: any[] = [];
for (const cat of GALLERY_READY_CATEGORIES) {
  const count = slideTemplateCount(cat.id);
  for (let index = 0; index < count; index++) {
    const { elements, ...slide } = getSlideTemplatePayload(cat.id, index, cat.name) as any;
    items.push({
      // A design with an id (the wee ones the galleries were rebuilt as) is keyed by it, so adding or moving others never moves its key.
      key: cat.id === 'gallery' && slide.aiTemplate ? String(slide.aiTemplate) : `${cat.id}-${index + 1}`,
      readyCategory: cat.id,
      index,
      name: `${cat.name} · ${String(slide.name || `نموذج ${index + 1}`).slice(0, 40)}`,
      category: GALLERY_CATEGORY_OF[cat.id] || 'other',
      slide: { ...slide, id: 's1' },
      elements: (elements as any[]).map((e, i) => ({ ...e, id: `e${i + 1}`, slideId: 's1' })),
    });
  }
}
mkdirSync(new URL('../src/data/galleryReady/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/galleryReady/ready.json', import.meta.url), JSON.stringify(items));
console.log(`${items.length} ready slides written`);
