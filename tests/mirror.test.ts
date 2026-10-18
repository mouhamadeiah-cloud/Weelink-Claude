import test from 'node:test';
import assert from 'node:assert/strict';
import { mirrorMedia } from '../src/services/mirror';

test('Unsplash photos and library videos in published content point to /media', () => {
  const out: any = mirrorMedia({
    imageUrl: 'https://images.unsplash.com/photo-1?auto=format&w=400',
    backgroundVideo: '/bg-videos/856662.mp4',
    style: "url('https://images.unsplash.com/photo-2?w=900') center",
    link: 'https://wa.me/963',
    list: ['/graphics/a.svg'],
    n: 3,
  });
  assert.equal(out.imageUrl, `/media?u=${encodeURIComponent('https://images.unsplash.com/photo-1?auto=format&w=400')}`);
  assert.equal(out.backgroundVideo, `/media?u=${encodeURIComponent('/bg-videos/856662.mp4')}`);
  assert.ok(out.style.startsWith("url('/media?u=") && out.style.endsWith("') center"));
  assert.equal(out.link, 'https://wa.me/963');
  assert.equal(out.list[0], `/media?u=${encodeURIComponent('/graphics/a.svg')}`);
  assert.equal(out.n, 3);
});

test('an already mirrored link is left as it is', () => {
  const once: any = mirrorMedia({ a: '/bg-videos/x.mp4' });
  assert.equal(mirrorMedia(once).a, once.a);
});
