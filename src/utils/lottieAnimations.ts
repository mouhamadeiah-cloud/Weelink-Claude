// Weelink's own animations for the «رسوم متحركة» element. Each one is drawn here, in code, as a
// Lottie file (the format LottieFiles uses) built from its colours, so they cost nothing to load,
// belong to us and take the page's colours. The player that draws them is loaded only on pages
// that have one (see components/LottiePlayer).

export type LottieGroupId = 'loading' | 'status' | 'icons' | 'business' | 'decor';

export const LOTTIE_GROUPS: { id: LottieGroupId; name: string }[] = [
  { id: 'status', name: 'حالات' },
  { id: 'icons', name: 'أيقونات متحركة' },
  { id: 'business', name: 'للمهن' },
  { id: 'decor', name: 'زينة وخلفيات' },
  { id: 'loading', name: 'تحميل' },
];

export interface LottieDef {
  id: string;
  name: string;
  group: LottieGroupId;
  color: string;
  color2?: string;
  build: (c1: string, c2: string) => object;
}

// ---- A small Lottie writer -------------------------------------------------------------------

type Prop = { a: 0 | 1; k: unknown };
type Val = number | number[] | Shape | Prop;
interface Shape {
  i: number[][];
  o: number[][];
  v: number[][];
  c: boolean;
}

const isProp = (v: unknown): v is Prop => !!v && typeof v === 'object' && 'a' in (v as object) && 'k' in (v as object);
const P = (v: Val): Prop => (isProp(v) ? v : { a: 0, k: v });

// Keyframes: [frame, value] pairs, eased in and out unless told otherwise.
const SMOOTH = [0.42, 0, 0.58, 1];
const LINEAR = [0.33, 0.33, 0.67, 0.67];
const POP = [0.3, 0, 0.2, 1.4];
const K = (frames: [number, number | number[] | Shape][], ease: number[] = SMOOTH): Prop => ({
  a: 1,
  k: frames.map(([t, v], i) => {
    const s = Array.isArray(v) ? v : [v];
    return i < frames.length - 1 ? { t, s, o: { x: [ease[0]], y: [ease[1]] }, i: { x: [ease[2]], y: [ease[3]] } } : { t, s };
  }),
});

const rgba = (hex: string): number[] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

const el = (size: Val, p: Val = [0, 0]) => ({ ty: 'el', d: 1, s: P(typeof size === 'number' ? [size, size] : size), p: P(p) });
const rc = (size: Val, r: Val = 0, p: Val = [0, 0]) => ({ ty: 'rc', d: 1, s: P(size), p: P(p), r: P(r) });
const sh = (shape: Shape | Prop) => ({ ty: 'sh', d: 1, ks: P(shape) });
const fill = (color: string, o: Val = 100) => ({ ty: 'fl', c: P(rgba(color)), o: P(o), r: 1 });
const stroke = (color: string, w: Val, o: Val = 100) => ({ ty: 'st', c: P(rgba(color)), o: P(o), w: P(w), lc: 2, lj: 2, ml: 4 });
const trim = (s: Val, e: Val, o: Val = 0) => ({ ty: 'tm', s: P(s), e: P(e), o: P(o), m: 1 });

interface Tr {
  p?: Val;
  a?: Val;
  s?: Val;
  r?: Val;
  o?: Val;
}
const tr = (t: Tr = {}) => ({
  ty: 'tr',
  p: P(t.p ?? [0, 0]),
  a: P(t.a ?? [0, 0]),
  s: P(t.s ?? [100, 100]),
  r: P(t.r ?? 0),
  o: P(t.o ?? 100),
  sk: P(0),
  sa: P(0),
});
const gr = (items: object[], t: Tr = {}) => ({ ty: 'gr', it: [...items, tr(t)] });

// Straight lines through the points.
const poly = (pts: number[][], closed = false): Shape => ({ v: pts, i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]), c: closed });
// Curves written like an SVG path: a start point, then [control 1, control 2, end] per segment.
const bez = (start: number[], segs: number[][][], closed = true): Shape => {
  const ends = segs.map((s) => s[2]);
  const last = ends[ends.length - 1];
  const loopsBack = closed && last[0] === start[0] && last[1] === start[1];
  const v = [start, ...(loopsBack ? ends.slice(0, -1) : ends)];
  const n = v.length;
  const i = v.map(() => [0, 0]);
  const o = v.map(() => [0, 0]);
  segs.forEach(([c1, c2], k) => {
    const from = v[k];
    const toIdx = (k + 1) % n;
    const to = loopsBack || k + 1 < n ? v[toIdx] : segs[k][2];
    o[k] = [c1[0] - from[0], c1[1] - from[1]];
    if (loopsBack || k + 1 < n) i[toIdx] = [c2[0] - to[0], c2[1] - to[1]];
  });
  return { v, i, o, c: closed };
};
// A circle's arc as a curve (degrees, 0 = right, clockwise), for waves and rings.
const arc = (r: number, from: number, to: number): Shape => {
  const steps = Math.max(1, Math.ceil(Math.abs(to - from) / 90));
  const d = (to - from) / steps;
  const pts: number[][] = [];
  const ins: number[][] = [];
  const outs: number[][] = [];
  const h = (4 / 3) * Math.tan(((d * Math.PI) / 180) / 4) * r;
  for (let s = 0; s <= steps; s++) {
    const a = ((from + d * s) * Math.PI) / 180;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    pts.push([x, y]);
    const tx = -Math.sin(a) * h;
    const ty = Math.cos(a) * h;
    outs.push([tx, ty]);
    ins.push([-tx, -ty]);
  }
  return { v: pts, i: ins, o: outs, c: false };
};

let layerIndex = 0;
interface LayerOpts extends Tr {
  ip?: number;
  op?: number;
}
const layer = (shapes: object[], op: number, t: LayerOpts = {}) => ({
  ddd: 0,
  ind: ++layerIndex,
  ty: 4,
  nm: `l${layerIndex}`,
  sr: 1,
  ks: { o: P(t.o ?? 100), r: P(t.r ?? 0), p: P(t.p ?? [100, 100]), a: P(t.a ?? [0, 0]), s: P(t.s ?? [100, 100]) },
  ao: 0,
  shapes,
  ip: t.ip ?? 0,
  op: t.op ?? op,
  st: 0,
  bm: 0,
});
// A whole animation: 200 × 200, 30 frames a second. Layers listed first are drawn on top.
const anim = (op: number, layers: object[]) => ({ v: '5.7.4', fr: 30, ip: 0, op, w: 200, h: 200, nm: 'weelink', ddd: 0, assets: [], layers });

// A value that goes a → b → a over one loop, starting at `at`.
const pulse = (op: number, a: number | number[], b: number | number[], at = 0, len = op / 2, ease = SMOOTH): Prop => {
  const t0 = Math.max(0, Math.min(at, op - 1));
  const frames: [number, number | number[]][] = [];
  if (t0 > 0) frames.push([0, a]);
  frames.push([t0, a], [Math.min(op, t0 + len / 2), b], [Math.min(op, t0 + len), a]);
  if (t0 + len < op) frames.push([op, a]);
  return K(frames, ease);
};

// A value that moves from `from` to `to` once per loop at a steady pace, `shift` frames ahead,
// so several copies can follow one another (ripples, bubbles).
const lerp = (a: number | number[], b: number | number[], f: number): number | number[] =>
  Array.isArray(a) ? a.map((x, k) => x + ((b as number[])[k] - x) * f) : a + ((b as number) - a) * f;
const phased = (op: number, from: number | number[], to: number | number[], shift: number): Prop => {
  if (!shift) return K([[0, from], [op, to]], LINEAR);
  const mid = lerp(from, to, shift / op);
  return K([[0, mid], [op - shift, to], [op - shift + 0.01, from], [op, mid]], LINEAR);
};

// ---- Shapes reused below ---------------------------------------------------------------------

const HEART = bez([0, 34], [
  [[-62, -6], [-34, -58], [0, -24]],
  [[34, -58], [62, -6], [0, 34]],
]);
const star = (outer: number, inner: number, points = 5): Shape =>
  poly(
    Array.from({ length: points * 2 }, (_, k) => {
      const r = k % 2 === 0 ? outer : inner;
      const a = (Math.PI / points) * k - Math.PI / 2;
      return [Math.cos(a) * r, Math.sin(a) * r];
    }),
    true
  );
const sparkle = (r: number): Shape =>
  bez([0, -r], [
    [[0, -r * 0.2], [r * 0.2, 0], [r, 0]],
    [[r * 0.2, 0], [0, r * 0.2], [0, r]],
    [[0, r * 0.2], [-r * 0.2, 0], [-r, 0]],
    [[-r * 0.2, 0], [0, -r * 0.2], [0, -r]],
  ]);
const PIN = bez([0, 46], [
  [[-10, 32], [-34, 8], [-34, -12]],
  [[-34, -32], [-19, -48], [0, -48]],
  [[19, -48], [34, -32], [34, -12]],
  [[34, 8], [10, 32], [0, 46]],
]);
const BELL = bez([-32, 22], [
  [[-26, 14], [-24, 6], [-24, -6]],
  [[-24, -24], [-13, -36], [0, -36]],
  [[13, -36], [24, -24], [24, -6]],
  [[24, 6], [26, 14], [32, 22]],
  [[32, 22], [-32, 22], [-32, 22]],
]);
const FLAME = (w: number, h: number, lean: number): Shape =>
  bez([0, h * 0.5], [
    [[-w * 0.6, h * 0.5], [-w * 0.75, 0], [-w * 0.35, -h * 0.15]],
    [[-w * 0.2, -h * 0.3], [lean - w * 0.15, -h * 0.4], [lean, -h * 0.55]],
    [[lean + w * 0.4, -h * 0.3], [w * 0.75, -h * 0.05], [w * 0.55, h * 0.2]],
    [[w * 0.45, h * 0.45], [w * 0.2, h * 0.5], [0, h * 0.5]],
  ]);
const blob = (r: number, k: number[]): Shape => {
  const n = k.length;
  const v: number[][] = [];
  const i: number[][] = [];
  const o: number[][] = [];
  for (let s = 0; s < n; s++) {
    const a = (Math.PI * 2 * s) / n - Math.PI / 2;
    const rr = r * k[s];
    const h = (4 / 3) * Math.tan(Math.PI / (2 * n)) * rr;
    v.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    o.push([-Math.sin(a) * h, Math.cos(a) * h]);
    i.push([Math.sin(a) * h, -Math.cos(a) * h]);
  }
  return { v, i, o, c: true };
};
const wave = (amp: number, len: number, count: number, y = 0): Shape => {
  const segs: number[][][] = [];
  const start = [-len * count, y];
  for (let s = 0; s < count * 4; s++) {
    const x0 = start[0] + (s * len) / 2;
    const dir = s % 2 === 0 ? -1 : 1;
    segs.push([
      [x0 + len / 6, y + dir * amp],
      [x0 + len / 3, y + dir * amp],
      [x0 + len / 2, y],
    ]);
  }
  return bez(start, segs, false);
};

// ---- The animations --------------------------------------------------------------------------

const L = 60; // two seconds
const L3 = 90; // three seconds

export const LOTTIE_ANIMATIONS: LottieDef[] = [
  // Status
  {
    id: 'success',
    name: 'تم بنجاح',
    group: 'status',
    color: '#16a34a',
    color2: '#ffffff',
    build: (c1, c2) =>
      anim(L3, [
        layer([gr([sh(poly([[-26, 2], [-8, 20], [28, -18]])), trim(0, K([[18, 0], [40, 100]])), stroke(c2, 12)])], L3),
        layer([gr([el(120), fill(c1)], { s: K([[0, [0, 0]], [16, [108, 108]], [24, [100, 100]]], POP) })], L3),
        layer([gr([el(K([[10, [110, 110]], [40, [190, 190]]])), stroke(c1, K([[10, 10], [40, 0]]), K([[10, 60], [40, 0]]))])], L3),
      ]),
  },
  {
    id: 'error',
    name: 'خطأ',
    group: 'status',
    color: '#dc2626',
    color2: '#ffffff',
    build: (c1, c2) =>
      anim(L3, [
        layer(
          [
            gr([sh(poly([[-20, -20], [20, 20]])), trim(0, K([[14, 0], [28, 100]])), stroke(c2, 12)]),
            gr([sh(poly([[20, -20], [-20, 20]])), trim(0, K([[24, 0], [38, 100]])), stroke(c2, 12)]),
          ],
          L3
        ),
        layer([gr([el(120), fill(c1)], { s: K([[0, [0, 0]], [16, [108, 108]], [24, [100, 100]]], POP) })], L3, {
          r: K([[30, 0], [35, -8], [40, 8], [45, -5], [50, 0]]),
        }),
      ]),
  },
  {
    id: 'warning',
    name: 'تنبيه',
    group: 'status',
    color: '#f59e0b',
    color2: '#ffffff',
    build: (c1, c2) =>
      anim(L, [
        layer(
          [
            gr([rc([12, 40], 6, [0, -2]), fill(c2)]),
            gr([el(13, [0, 32]), fill(c2)]),
            gr([sh(bez([0, -58], [
              [[6, -58], [9, -54], [12, -49]],
              [[12, -49], [58, 40], [58, 40]],
              [[63, 50], [57, 56], [48, 56]],
              [[48, 56], [-48, 56], [-48, 56]],
              [[-57, 56], [-63, 50], [-58, 40]],
              [[-58, 40], [-12, -49], [-12, -49]],
              [[-9, -54], [-6, -58], [0, -58]],
            ])), fill(c1)]),
          ],
          L,
          { p: [100, 104], r: K([[0, 0], [5, -7], [10, 7], [15, -5], [20, 4], [25, 0], [60, 0]]) }
        ),
      ]),
  },
  {
    id: 'heart-beat',
    name: 'قلب ينبض',
    group: 'status',
    color: '#ef4444',
    build: (c1) =>
      anim(L, [
        layer([gr([sh(HEART), fill(c1)])], L, {
          p: [100, 104],
          s: K([[0, [100, 100]], [8, [122, 122]], [16, [100, 100]], [24, [114, 114]], [34, [100, 100]], [60, [100, 100]]]),
        }),
      ]),
  },
  {
    id: 'star-pop',
    name: 'نجمة',
    group: 'status',
    color: '#f59e0b',
    color2: '#fde68a',
    build: (c1, c2) =>
      anim(L3, [
        layer([gr([sh(star(50, 22)), fill(c1)], { s: K([[0, [0, 0]], [18, [115, 115]], [28, [100, 100]], [70, [100, 100]], [90, [0, 0]]], POP), r: K([[0, -40], [28, 0], [70, 0], [90, 30]]) })], L3),
        ...[0, 60, 120, 180, 240, 300].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return layer([gr([el(10), fill(c2)])], L3, {
            p: K([[10, [100, 100]], [34, [100 + Math.cos(a) * 80, 100 + Math.sin(a) * 80]]]),
            o: K([[10, 0], [14, 100], [34, 0]]),
          });
        }),
      ]),
  },

  // Icons
  {
    id: 'pin',
    name: 'موقعنا',
    group: 'icons',
    color: '#ef4444',
    color2: '#ffffff',
    build: (c1, c2) =>
      anim(L, [
        layer([gr([el(26, [0, -12]), fill(c2)]), gr([sh(PIN), fill(c1)])], L, {
          p: K([[0, [100, 78]], [14, [100, 96]], [20, [100, 90]], [26, [100, 96]], [60, [100, 78]]]),
        }),
        layer([gr([el([60, 14]), fill('#000000', 18)])], L, { p: [100, 150], s: K([[0, [60, 60]], [14, [110, 110]], [26, [100, 100]], [60, [60, 60]]]) }),
      ]),
  },
  {
    id: 'bell',
    name: 'جرس إشعار',
    group: 'icons',
    color: '#f59e0b',
    color2: '#ef4444',
    build: (c1, c2) =>
      anim(L, [
        layer([gr([el(22), fill(c2)])], L, { p: [128, 62], s: K([[0, [0, 0]], [10, [120, 120]], [16, [100, 100]]], POP) }),
        layer([gr([sh(BELL), fill(c1)]), gr([el(16, [0, 30]), fill(c1)]), gr([el(10, [0, -40]), fill(c1)])], L, {
          p: [100, 60],
          a: [0, -40],
          r: K([[0, 0], [6, 16], [12, -14], [18, 10], [24, -6], [30, 0], [60, 0]]),
        }),
      ]),
  },
  {
    id: 'mail',
    name: 'رسالة',
    group: 'icons',
    color: '#0071e3',
    color2: '#ffffff',
    build: (c1, c2) =>
      anim(L, [
        layer(
          [
            gr([sh(poly([[-44, -28], [0, 6], [44, -28]])), stroke(c2, 7)]),
            gr([rc([96, 66], 10), fill(c1)]),
          ],
          L,
          { p: K([[0, [100, 104]], [30, [100, 94]], [60, [100, 104]]]), r: K([[0, -4], [30, 4], [60, -4]]) }
        ),
      ]),
  },
  {
    id: 'phone',
    name: 'اتصل بنا',
    group: 'icons',
    color: '#16a34a',
    build: (c1) =>
      anim(L, [
        ...[0, 1].map((k) =>
          layer([gr([sh(arc(30 + k * 16, -45, 45)), stroke(c1, 6)]), gr([sh(arc(30 + k * 16, 135, 225)), stroke(c1, 6)])], L, {
            o: K([[k * 8, 0], [10 + k * 8, 100], [30 + k * 8, 0]]),
          })
        ),
        layer([gr([rc([10, 3], 2, [0, -26]), fill('#ffffff')]), gr([rc([40, 70], 10), fill(c1)])], L, {
          r: K([[0, 0], [4, -12], [8, 12], [12, -12], [16, 12], [20, 0], [60, 0]]),
        }),
      ]),
  },
  {
    id: 'cart',
    name: 'سلة مشتريات',
    group: 'icons',
    color: '#0071e3',
    color2: '#f59e0b',
    build: (c1, c2) =>
      anim(L, [
        layer([gr([rc([22, 22], 5), fill(c2)])], L, {
          p: K([[0, [108, 20]], [18, [108, 82]], [60, [108, 82]]], [0.5, 0, 0.9, 0.6]),
          o: K([[0, 0], [4, 100], [40, 100], [50, 0]]),
          r: K([[0, -30], [18, 0]]),
        }),
        layer(
          [
            gr([sh(poly([[-46, -32], [-32, -32], [-20, 16], [30, 16], [40, -16], [-26, -16]])), stroke(c1, 8)]),
            gr([el(14, [-14, 32]), fill(c1)]),
            gr([el(14, [24, 32]), fill(c1)]),
          ],
          L,
          { p: K([[0, [100, 106]], [18, [100, 106]], [22, [100, 112]], [28, [100, 106]]]) }
        ),
      ]),
  },
  {
    id: 'bag',
    name: 'كيس تسوق',
    group: 'icons',
    color: '#db2777',
    color2: '#ffffff',
    build: (c1, c2) =>
      anim(L, [
        layer(
          [
            gr([sh(arc(10, 0, 180)), stroke(c2, 5)], { p: [0, -12] }),
            gr([sh(arc(20, 180, 360)), stroke(c1, 7)], { p: [0, -30] }),
            gr([rc([80, 74], 10, [0, 8]), fill(c1)]),
          ],
          L,
          {
            p: K([[0, [100, 104]], [10, [100, 90]], [20, [100, 104]], [26, [100, 98]], [32, [100, 104]]]),
            s: K([[0, [100, 100]], [10, [96, 104]], [20, [104, 96]], [32, [100, 100]]]),
          }
        ),
      ]),
  },
  {
    id: 'clock',
    name: 'ساعة',
    group: 'icons',
    color: '#1d1d1f',
    color2: '#0071e3',
    build: (c1, c2) =>
      anim(L3, [
        layer([gr([el(10), fill(c1)])], L3),
        layer([gr([sh(poly([[0, 0], [0, -38]])), stroke(c2, 6)])], L3, { r: K([[0, 0], [90, 360]], LINEAR) }),
        layer([gr([sh(poly([[0, 0], [0, -24]])), stroke(c1, 7)])], L3, { r: K([[0, 0], [90, 30]], LINEAR) }),
        layer([gr([el(116), stroke(c1, 8)])], L3),
      ]),
  },
  {
    id: 'scroll-down',
    name: 'انزل لتحت',
    group: 'icons',
    color: '#0071e3',
    build: (c1) =>
      anim(40, [
        ...[0, 1].map((k) =>
          layer([gr([sh(poly([[-24, -10], [0, 12], [24, -10]])), stroke(c1, 9)])], 40, {
            p: K([[k * 10, [100, 70 + k * 30]], [30 + k * 10, [100, 90 + k * 30]]]),
            o: K([[k * 10, 0], [12 + k * 10, 100], [30 + k * 10, 0]]),
          })
        ),
      ]),
  },
  {
    id: 'chat',
    name: 'محادثة',
    group: 'icons',
    color: '#25d366',
    color2: '#ffffff',
    build: (c1, c2) =>
      anim(L, [
        ...[-22, 0, 22].map((x, k) =>
          layer([gr([el(14), fill(c2)])], L, {
            p: K([[k * 6, [100 + x, 96]], [10 + k * 6, [100 + x, 86]], [20 + k * 6, [100 + x, 96]]]),
          })
        ),
        layer([gr([sh(poly([[-30, 20], [-40, 46], [-8, 26]], true)), fill(c1)]), gr([rc([120, 74], 37, [0, -4]), fill(c1)])], L, { p: [100, 100] }),
      ]),
  },
  {
    id: 'wifi',
    name: 'إشارة',
    group: 'icons',
    color: '#0071e3',
    build: (c1) =>
      anim(L, [
        layer([gr([el(16), fill(c1)])], L, { p: [100, 140] }),
        ...[30, 56, 82].map((r, k) =>
          layer([gr([sh(arc(r, -135, -45)), stroke(c1, 10)])], L, {
            p: [100, 140],
            o: K([[0, 15], [8 + k * 8, 15], [14 + k * 8, 100], [44, 100], [52, 15]]),
          })
        ),
      ]),
  },

  // Trades
  {
    id: 'coffee',
    name: 'قهوة ساخنة',
    group: 'business',
    color: '#92400e',
    color2: '#a8a29e',
    build: (c1, c2) =>
      anim(L3, [
        ...[-16, 0, 16].map((x, k) =>
          layer([gr([sh(bez([0, 0], [[[-10, -8], [10, -16], [0, -24]], [[-10, -32], [10, -40], [0, -48]]], false)), stroke(c2, 5)])], L3, {
            p: K([[k * 20, [100 + x, 92]], [60 + k * 10, [100 + x, 62]]], LINEAR),
            o: K([[k * 20, 0], [k * 20 + 15, 100], [60 + k * 10, 0]]),
          })
        ),
        layer(
          [
            gr([el([26, 30], [38, 112]), stroke(c1, 7)]),
            gr([sh(bez([-34, 96], [[[-34, 96], [34, 96], [34, 96]], [[30, 130], [20, 138], [8, 138]], [[8, 138], [-8, 138], [-8, 138]], [[-20, 138], [-30, 130], [-34, 96]]])), fill(c1)]),
            gr([rc([96, 8], 4, [0, 146]), fill(c1, 50)]),
          ],
          L3,
          { p: [96, 0] }
        ),
      ]),
  },
  {
    id: 'fire',
    name: 'نار مشاوي',
    group: 'business',
    color: '#f97316',
    color2: '#fde047',
    build: (c1, c2) =>
      anim(L, [
        layer([gr([sh(K([[0, FLAME(36, 60, -4)], [15, FLAME(34, 66, 6)], [30, FLAME(38, 58, -6)], [45, FLAME(34, 64, 4)], [60, FLAME(36, 60, -4)]])), fill(c2)])], L, { p: [100, 128] }),
        layer([gr([sh(K([[0, FLAME(64, 110, 6)], [15, FLAME(60, 118, -8)], [30, FLAME(66, 108, 8)], [45, FLAME(60, 116, -6)], [60, FLAME(64, 110, 6)]])), fill(c1)])], L, { p: [100, 110] }),
      ]),
  },
  {
    id: 'truck',
    name: 'توصيل',
    group: 'business',
    color: '#0071e3',
    color2: '#f59e0b',
    build: (c1, c2) =>
      anim(L, [
        ...[0, 1, 2].map((k) =>
          layer([gr([rc([30 - k * 6, 5], 3), fill(c1, 60)])], L, {
            p: K([[k * 8, [40, 82 + k * 16]], [20 + k * 8, [10, 82 + k * 16]]], LINEAR),
            o: K([[k * 8, 0], [6 + k * 8, 100], [20 + k * 8, 0]]),
          })
        ),
        layer(
          [
            gr([el(20, [-26, 30]), fill('#1d1d1f')]),
            gr([el(20, [34, 30]), fill('#1d1d1f')]),
            gr([rc([16, 12], 3, [42, -2]), fill('#ffffff')]),
            gr([sh(poly([[24, -16], [42, -16], [60, 8], [60, 26], [24, 26]], true)), fill(c2)]),
            gr([rc([76, 54], 6, [-18, -2]), fill(c1)]),
          ],
          L,
          { p: K([[0, [96, 104]], [8, [96, 101]], [16, [96, 104]], [24, [96, 101]], [32, [96, 104]], [40, [96, 101]], [48, [96, 104]], [60, [96, 104]]], LINEAR) }
        ),
      ]),
  },
  {
    id: 'gift',
    name: 'هدية',
    group: 'business',
    color: '#db2777',
    color2: '#fbbf24',
    build: (c1, c2) =>
      anim(L, [
        layer(
          [
            gr([el([20, 16], [-12, -10]), stroke(c2, 6)]),
            gr([el([20, 16], [12, -10]), stroke(c2, 6)]),
            gr([rc([14, 22], 0, [0, 6]), fill(c2)]),
            gr([rc([96, 22], 6, [0, 6]), fill(c1)]),
          ],
          L,
          { p: K([[0, [100, 64]], [10, [100, 46]], [20, [100, 64]], [60, [100, 64]]]), r: K([[0, 0], [10, -8], [20, 0]]) }
        ),
        layer([gr([rc([14, 62], 0), fill(c2)]), gr([rc([84, 62], 6), fill(c1)])], L, { p: [100, 112] }),
      ]),
  },

  // Decor
  {
    id: 'confetti',
    name: 'احتفال',
    group: 'decor',
    color: '#0071e3',
    color2: '#ef4444',
    build: (c1, c2) => {
      const colors = [c1, c2, '#f59e0b', '#10b981'];
      return anim(L3, [
        ...Array.from({ length: 16 }, (_, k) => {
          const a = (Math.PI * 2 * k) / 16 + (k % 2 ? 0.2 : 0);
          const dist = 60 + (k % 3) * 18;
          const piece = k % 2 ? rc([10, 16], 2) : el(11);
          return layer([gr([piece, fill(colors[k % 4])])], L3, {
            p: K([[0, [100, 100]], [26, [100 + Math.cos(a) * dist, 100 + Math.sin(a) * dist]], [86, [100 + Math.cos(a) * dist * 1.1, 100 + Math.sin(a) * dist + 40]]], [0.1, 0.6, 0.4, 1]),
            r: K([[0, 0], [86, k % 2 ? 360 : -300]], LINEAR),
            o: K([[0, 0], [2, 100], [70, 100], [86, 0]]),
          });
        }),
      ]);
    },
  },
  {
    id: 'sparkles',
    name: 'لمعان',
    group: 'decor',
    color: '#f59e0b',
    color2: '#fde68a',
    build: (c1, c2) =>
      anim(L, [
        ...[
          [100, 100, 46, 0, c1],
          [52, 56, 22, 20, c2],
          [150, 146, 26, 36, c1],
        ].map(([x, y, r, at, col]) =>
          layer([gr([sh(sparkle(r as number)), fill(col as string)])], L, {
            p: [x as number, y as number],
            s: pulse(L, [30, 30], [110, 110], at as number, 40),
            r: K([[0, 0], [60, 90]], LINEAR),
          })
        ),
      ]),
  },
  {
    id: 'blob',
    name: 'شكل سائل',
    group: 'decor',
    color: '#0071e3',
    color2: '#93c5fd',
    build: (c1, c2) => {
      const a = blob(66, [1, 0.9, 1.05, 0.85, 1, 0.92]);
      const b = blob(66, [0.88, 1.06, 0.9, 1.04, 0.86, 1.02]);
      const c = blob(66, [1.04, 0.86, 1, 0.94, 1.06, 0.88]);
      return anim(L3 * 2, [
        layer([gr([sh(K([[0, a], [60, b], [120, c], [180, a]])), fill(c1)])], L3 * 2, { r: K([[0, 0], [180, 60]], LINEAR) }),
        layer([gr([sh(K([[0, c], [60, a], [120, b], [180, c]])), fill(c2)])], L3 * 2, { p: [108, 92], s: [112, 112], r: K([[0, 0], [180, -40]], LINEAR) }),
      ]);
    },
  },
  {
    id: 'bubbles',
    name: 'فقاعات',
    group: 'decor',
    color: '#38bdf8',
    build: (c1) =>
      anim(L3, [
        ...[
          [50, 18, 0],
          [92, 28, 20],
          [140, 14, 40],
          [70, 12, 55],
          [160, 22, 10],
          [118, 16, 70],
        ].map(([x, size, at]) =>
          layer([gr([el(size), stroke(c1, 3), fill(c1, 25)])], L3, { p: phased(L3, [x, 215], [x + 10, -15], at) })
        ),
      ]),
  },
  {
    id: 'waves',
    name: 'أمواج',
    group: 'decor',
    color: '#0071e3',
    color2: '#7dd3fc',
    build: (c1, c2) =>
      anim(L, [
        layer([gr([sh(wave(12, 100, 4)), stroke(c1, 8)])], L, { p: K([[0, [100, 92]], [60, [200, 92]]], LINEAR) }),
        layer([gr([sh(wave(10, 100, 4)), stroke(c2, 8)])], L, { p: K([[0, [150, 120]], [60, [50, 120]]], LINEAR) }),
      ]),
  },
  {
    id: 'sunburst',
    name: 'أشعة',
    group: 'decor',
    color: '#f59e0b',
    color2: '#fbbf24',
    build: (c1, c2) =>
      anim(L3 * 2, [
        layer([gr([el(64), fill(c1)])], L3 * 2, { s: pulse(L3 * 2, [100, 100], [110, 110], 0, 90) }),
        layer(
          Array.from({ length: 12 }, (_, k) => gr([rc([10, 34], 5, [0, -66]), fill(c2)], { r: k * 30 })),
          L3 * 2,
          { r: K([[0, 0], [180, 120]], LINEAR) }
        ),
      ]),
  },
  {
    id: 'hearts',
    name: 'قلوب طائرة',
    group: 'decor',
    color: '#ef4444',
    color2: '#f9a8d4',
    build: (c1, c2) =>
      anim(L3, [
        ...[
          [70, 0.5, 0, c1],
          [120, 0.35, 30, c2],
          [96, 0.28, 55, c1],
          [140, 0.42, 15, c2],
        ].map(([x, sc, at, col]) =>
          layer([gr([sh(HEART), fill(col as string)])], L3, {
            p: phased(L3, [x as number, 235], [(x as number) - 16, -35], at as number),
            s: [(sc as number) * 100, (sc as number) * 100],
          })
        ),
      ]),
  },

  // Loading
  {
    id: 'spinner',
    name: 'دوّار',
    group: 'loading',
    color: '#0071e3',
    color2: '#e5e7eb',
    build: (c1, c2) =>
      anim(L, [
        // The arc grows, then shrinks from its tail; the turn makes up for where it ends so the loop is seamless.
        layer([gr([el(110), trim(K([[0, 0], [30, 0], [60, 75]]), K([[0, 10], [30, 85], [60, 85]])), stroke(c1, 14)])], L, { r: K([[0, 0], [60, 450]], LINEAR) }),
        layer([gr([el(110), stroke(c2, 14)])], L),
      ]),
  },
  {
    id: 'dots-bounce',
    name: 'نقاط تقفز',
    group: 'loading',
    color: '#0071e3',
    build: (c1) =>
      anim(L, [
        ...[-40, 0, 40].map((x, k) =>
          layer([gr([el(26), fill(c1)])], L, {
            p: K([[k * 8, [100 + x, 112]], [12 + k * 8, [100 + x, 78]], [24 + k * 8, [100 + x, 112]]]),
          })
        ),
      ]),
  },
  {
    id: 'dots-pulse',
    name: 'نقاط تنبض',
    group: 'loading',
    color: '#7c3aed',
    build: (c1) =>
      anim(L, [
        ...[-40, 0, 40].map((x, k) =>
          layer([gr([el(28), fill(c1)])], L, { p: [100 + x, 100], s: pulse(L, [50, 50], [110, 110], k * 10, 30), o: pulse(L, 40, 100, k * 10, 30) })
        ),
      ]),
  },
  {
    id: 'bars',
    name: 'أعمدة',
    group: 'loading',
    color: '#0071e3',
    build: (c1) =>
      anim(L, [
        ...[-48, -24, 0, 24, 48].map((x, k) => layer([gr([rc([14, 70], 7), fill(c1)])], L, { p: [100 + x, 100], s: pulse(L, [100, 35], [100, 100], k * 6, 30) })),
      ]),
  },
  {
    id: 'orbit',
    name: 'مدار',
    group: 'loading',
    color: '#0071e3',
    color2: '#f59e0b',
    build: (c1, c2) =>
      anim(L, [
        layer([gr([el(18, [0, -60]), fill(c2)])], L, { r: K([[0, 0], [60, 360]], LINEAR) }),
        layer([gr([el(14, [0, 38]), fill(c1)])], L, { r: K([[0, 0], [60, -720]], LINEAR) }),
        layer([gr([el(120), stroke(c2, 2, 40)]), gr([el(76), stroke(c1, 2, 40)]), gr([el(26), fill(c1)])], L),
      ]),
  },
  {
    id: 'ripple',
    name: 'موجات دائرية',
    group: 'loading',
    color: '#0071e3',
    build: (c1) =>
      anim(L3, [
        layer([gr([el(30), fill(c1)])], L3),
        ...[0, 30, 60].map((shift) =>
          layer([gr([el(phased(L3, [30, 30], [180, 180], shift)), stroke(c1, 5, phased(L3, 100, 0, shift))])], L3)
        ),
      ]),
  },
  {
    id: 'dual-ring',
    name: 'حلقتان',
    group: 'loading',
    color: '#0071e3',
    color2: '#ef4444',
    build: (c1, c2) =>
      anim(L, [
        layer([gr([el(76), trim(0, 30), stroke(c2, 10)])], L, { r: K([[0, 0], [60, -360]], LINEAR) }),
        layer([gr([el(124), trim(0, 30), stroke(c1, 10)])], L, { r: K([[0, 0], [60, 360]], LINEAR) }),
      ]),
  },
  {
    id: 'progress',
    name: 'شريط تقدم',
    group: 'loading',
    color: '#0071e3',
    color2: '#e5e7eb',
    build: (c1, c2) =>
      anim(L3, [
        layer([gr([sh(poly([[-70, 0], [70, 0]])), trim(0, K([[0, 0], [70, 100], [90, 100]], [0.5, 0, 0.3, 1])), stroke(c1, 16)])], L3, { o: K([[0, 100], [76, 100], [90, 0]]) }),
        layer([gr([sh(poly([[-70, 0], [70, 0]])), stroke(c2, 16)])], L3),
      ]),
  },
];

export const FEATURED_LOTTIE = ['success', 'heart-beat', 'pin', 'coffee', 'truck', 'confetti', 'spinner'];

export const lottieById = (id?: string): LottieDef | undefined => (id ? LOTTIE_ANIMATIONS.find((d) => d.id === id) : undefined);

// The animation's file with the chosen colours (built once per colour pair).
const cache = new Map<string, object>();
export const buildLottie = (def: LottieDef, color?: string, color2?: string): object => {
  const c1 = color || def.color;
  const c2 = color2 || def.color2 || def.color;
  const key = `${def.id}|${c1}|${c2}`;
  let data = cache.get(key);
  if (!data) {
    layerIndex = 0;
    data = def.build(c1, c2);
    cache.set(key, data);
  }
  // The player changes the file it is handed, so each player gets its own copy.
  return JSON.parse(JSON.stringify(data));
};
