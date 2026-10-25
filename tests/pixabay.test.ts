import test from 'node:test';
import assert from 'node:assert/strict';
import photos from '../api/photos';
import { fetchPixabay, pixabayErrorText } from '../src/services/pixabayService';

const req = (qs: string) => new Request(`https://x.test/api/photos?src=pixabay&${qs}`);
const realFetch = globalThis.fetch;
const stub = (fn: (u: string) => Response) => {
  globalThis.fetch = (async (u: unknown) => fn(String(u))) as typeof fetch;
};

test('pixabay search says not_configured without a key', async () => {
  delete process.env.PIXABAY_API_KEY;
  const res = await photos.fetch(req('type=photo&q=coffee'));
  assert.equal(res.status, 503);
  assert.equal(((await res.json()) as { error: string }).error, 'not_configured');
});

test('3d and vector are image_type searches and video uses the videos endpoint', async () => {
  process.env.PIXABAY_API_KEY = 'k';
  const urls: string[] = [];
  stub((u) => {
    urls.push(u);
    return new Response(JSON.stringify({ hits: [], totalHits: 0 }), { status: 200 });
  });
  try {
    await photos.fetch(req('type=3d&q=car'));
    await photos.fetch(req('type=vector&q=car'));
    await photos.fetch(req('type=video&q=car'));
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.match(urls[0], /image_type=illustration/);
  assert.match(urls[0].toLowerCase(), /3d/);
  assert.match(urls[1], /image_type=vector/);
  assert.match(urls[2], /\/api\/videos\//);
  assert.doesNotMatch(urls[2], /image_type/);
});

test('a video hit is mapped and the answer is cached a day', async () => {
  process.env.PIXABAY_API_KEY = 'k';
  stub(() => new Response(JSON.stringify({
    totalHits: 1,
    hits: [{ id: 7, tags: 'sea', user: 'ann', user_id: 3, pageURL: 'https://pixabay.com/videos/x-7/', picture_id: 'abc', duration: 9, videos: { small: { url: 'https://cdn.pixabay.com/v.mp4', width: 960, height: 540, size: 1000 } } }],
  }), { status: 200 }));
  try {
    const res = await photos.fetch(req('type=video&q=sea'));
    assert.match(res.headers.get('cache-control') || '', /s-maxage=86400/);
    const body = (await res.json()) as { items: Array<Record<string, unknown>> };
    assert.equal(body.items[0].kind, 'video');
    assert.equal(body.items[0].videoUrl, 'https://cdn.pixabay.com/v.mp4');
    assert.equal(body.items[0].photographer, 'ann');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('the client reports an error instead of throwing', async () => {
  stub(() => new Response(JSON.stringify({ error: 'not_configured' }), { status: 503 }));
  try {
    const r = await fetchPixabay({ type: 'photo', query: 'zzz-unique' });
    assert.deepEqual(r.items, []);
    assert.match(pixabayErrorText(r.error), /PIXABAY_API_KEY/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('an Arabic word the list lacks is put into English by Gemini, once, and the search uses it', async () => {
  process.env.PIXABAY_API_KEY = 'k';
  process.env.GEMINI_API_KEY = 'g';
  const calls: string[] = [];
  stub((u) => {
    calls.push(u);
    if (u.includes('generativelanguage')) {
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"زعتر":"thyme"}' }] } }] }), { status: 200 });
    }
    return new Response(JSON.stringify({ hits: [], totalHits: 0 }), { status: 200 });
  });
  try {
    await photos.fetch(req('type=photo&q=' + encodeURIComponent('زعتر')));
    await photos.fetch(req('type=photo&q=' + encodeURIComponent('زعتر')));
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.GEMINI_API_KEY;
  }
  assert.equal(calls.filter((u) => u.includes('generativelanguage')).length, 1);
  assert.ok(calls.filter((u) => u.includes('pixabay.com/api')).every((u) => /q=thyme/.test(u)));
});

test('without Gemini the Arabic word is sent as it is', async () => {
  process.env.PIXABAY_API_KEY = 'k';
  delete process.env.GEMINI_API_KEY;
  const calls: string[] = [];
  stub((u) => {
    calls.push(u);
    return new Response(JSON.stringify({ hits: [], totalHits: 0 }), { status: 200 });
  });
  try {
    await photos.fetch(req('type=photo&q=' + encodeURIComponent('كركديه')));
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.match(calls[0], /q=%D9%83/);
});
