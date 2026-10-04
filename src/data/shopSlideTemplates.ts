// Ready slides of the "عناصر online Shop" category, offered only in Online Shop projects: two start
// slides, product slides in several layouts (live 'shopProducts' elements reading the store's
// products), two search bars, a running product strip, animated cards and a running text strip.
// Texts are the shop template's own and images come from the platform library (public/Library).
// Coordinates are already on the 1280-wide canvas.

const C = {
  ink: '#2A1F1A',
  body: '#5A4C42',
  muted: '#8A7B70',
  accent: '#B4532A',
  cream: '#FBF6EF',
};
const HEADING_FONT = 'El Messiri';
const BODY_FONT = 'IBM Plex Sans Arabic';
const WHATSAPP_NUMBER = '963991234567';
const LIB = '/Library/compressed';

type Box = { x: number; y: number; width: number; height: number };

const el = (type: string, name: string, box: Box, content: string, styles: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  type,
  name,
  ...box,
  content,
  styles,
  ...extra,
});

const heading = (box: Box, text: string, size: number, color = C.ink, align = 'center') =>
  el('heading', 'عنوان', box, text, { fontSize: size, fontWeight: 'bold', color, fontFamily: HEADING_FONT, textAlign: align });

const paragraph = (box: Box, text: string, size = 15, color = C.muted, align = 'center') =>
  el('paragraph', 'نص', box, text, { fontSize: size, color, fontFamily: BODY_FONT, textAlign: align });

const products = (box: Box, extra: Record<string, unknown>) =>
  el('shopProducts', 'منتجات المتجر', box, '', { color: C.accent }, extra);

const shopButton = (box: Box) =>
  el('button', 'زر', box, 'تسوّق الآن', {
    backgroundColor: C.accent,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 9999,
    textAlign: 'center',
    glowIntensity: 26,
    glowColor: 'rgba(180,83,42,0.55)',
    glowPosition: 'bottom',
  }, { linkType: 'page', linkTargetId: 'shop-page-products', linkUrl: '#page-shop-page-products' });

const badge = (box: Box) =>
  el('badge', 'شارة', box, 'تشكيلة جديدة', {
    backgroundColor: C.accent,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    borderRadius: 9999,
  });

type ShopSlide = {
  name: string;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  elements: ReturnType<typeof el>[];
};

const SLIDES: (() => ShopSlide)[] = [
  // 1. Start: the store's own front slide.
  () => ({
    name: 'ابدأ - واجهة المتجر',
    height: 620,
    backgroundColor: C.ink,
    backgroundImage: `${LIB}/shop-start-bg.jpg`,
    elements: [
      el('shape', 'طبقة داكنة', { x: 0, y: 0, width: 1280, height: 620 }, '', { backgroundColor: 'rgba(28,20,16,0.55)' }),
      badge({ x: 1000, y: 150, width: 140, height: 34 }),
      el('heading', 'عنوان', { x: 540, y: 200, width: 600, height: 130 }, 'كل ما تحبه في متجر واحد', {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: HEADING_FONT,
        textAlign: 'right',
        animation: 'slide-up',
        animationTrigger: 'once',
        animationDuration: 1.1,
      }),
      paragraph({ x: 600, y: 344, width: 540, height: 70 }, 'منتجات مختارة بعناية، أسعار واضحة، أضف ما يعجبك إلى السلة واطلب بسهولة مع توصيل حتى باب بيتك.', 17, 'rgba(255,255,255,0.88)', 'right'),
      shopButton({ x: 940, y: 440, width: 200, height: 54 }),
      el('button', 'زر', { x: 720, y: 440, width: 200, height: 54 }, 'تواصل معنا', {
        backgroundColor: 'rgba(255,255,255,0.12)',
        color: '#FFFFFF',
        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        fontSize: 16,
        fontWeight: '600',
        borderRadius: 9999,
        textAlign: 'center',
      }, { linkType: 'contact', contactType: 'whatsapp', contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` }),
    ],
  }),

  // 2. Start: light and simple, text beside two photos.
  () => ({
    name: 'ابدأ - صورتان',
    height: 600,
    backgroundColor: C.cream,
    elements: [
      el('image', 'صورة', { x: 150, y: 70, width: 300, height: 440 }, '', { borderRadius: 28, objectFit: 'cover' }, { imageUrl: `${LIB}/shop-start-img1.jpg` }),
      el('image', 'صورة', { x: 390, y: 170, width: 250, height: 340 }, '', {
        borderRadius: 28,
        objectFit: 'cover',
        borderColor: C.cream,
        borderWidth: 8,
        borderStyle: 'solid',
        animation: 'float',
        animationTrigger: 'loop',
        animationDuration: 6,
      }, { imageUrl: `${LIB}/shop-start-img2.jpg` }),
      badge({ x: 1000, y: 170, width: 140, height: 34 }),
      heading({ x: 700, y: 220, width: 440, height: 120 }, 'كل ما تحبه في متجر واحد', 46, C.ink, 'right'),
      paragraph({ x: 720, y: 350, width: 420, height: 60 }, 'منتجات مختارة بعناية، أسعار واضحة، أضف ما يعجبك إلى السلة واطلب بسهولة.', 16, C.body, 'right'),
      shopButton({ x: 940, y: 430, width: 200, height: 54 }),
    ],
  }),

  // 3. Products in a zigzag: photo and details alternate sides.
  () => ({
    name: 'منتجات - زجزاج',
    height: 1000,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 0, y: 56, width: 1280, height: 50 }, 'منتجات مختارة', 32),
      paragraph({ x: 0, y: 108, width: 1280, height: 32 }, 'الأكثر طلبًا من عملائنا هذا الأسبوع'),
      products({ x: 140, y: 170, width: 1000, height: 790 }, { shopLayout: 'zigzag', shopLimit: 4 }),
    ],
  }),

  // 4. Wide cards: photo on one side, details on the other.
  () => ({
    name: 'منتجات - بطاقة عرضية',
    height: 760,
    backgroundColor: C.cream,
    elements: [
      heading({ x: 0, y: 50, width: 1280, height: 50 }, 'كل المنتجات', 34),
      paragraph({ x: 0, y: 104, width: 1280, height: 32 }, 'اضغط على أي منتج لرؤية تفاصيله وإضافته إلى السلة'),
      products({ x: 90, y: 160, width: 1100, height: 560 }, { shopLayout: 'wide', shopLimit: 6 }),
    ],
  }),

  // 5. Small cards.
  () => ({
    name: 'منتجات - بطاقات صغيرة',
    height: 640,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 0, y: 50, width: 1280, height: 50 }, 'منتجات مختارة', 32),
      products({ x: 90, y: 130, width: 1100, height: 470 }, { shopLayout: 'small', shopLimit: 12 }),
    ],
  }),

  // 6. Large cards.
  () => ({
    name: 'منتجات - بطاقات كبيرة',
    height: 960,
    backgroundColor: C.cream,
    elements: [
      heading({ x: 0, y: 50, width: 1280, height: 50 }, 'كل المنتجات', 34),
      paragraph({ x: 0, y: 104, width: 1280, height: 32 }, 'اضغط على أي منتج لرؤية تفاصيله وإضافته إلى السلة'),
      products({ x: 90, y: 160, width: 1100, height: 760 }, { shopLayout: 'large', shopLimit: 6 }),
    ],
  }),

  // 7. Search: a plain, very simple bar.
  () => ({
    name: 'ابحث في المتجر - بسيط',
    height: 120,
    backgroundColor: '#FFFFFF',
    elements: [
      el('shopSearch', 'بحث في المتجر', { x: 340, y: 32, width: 600, height: 56 }, 'ابحث عن منتج...', { color: C.accent }, { shopSearchStyle: 'minimal' }),
    ],
  }),

  // 8. Search: a raised bar over a photo.
  () => ({
    name: 'ابحث في المتجر - بخلفية',
    height: 240,
    backgroundColor: '#F6E3E3',
    backgroundImage: `${LIB}/shop-search-bg.jpg`,
    elements: [
      el('shopSearch', 'بحث في المتجر', { x: 290, y: 88, width: 700, height: 64 }, 'ابحث عن منتج...', { color: C.accent }, { shopSearchStyle: 'pill' }),
    ],
  }),

  // 9. A narrow strip of tiny products running right to left.
  () => ({
    name: 'شريط منتجات متحرك',
    height: 100,
    backgroundColor: C.ink,
    elements: [
      products({ x: 0, y: 14, width: 1280, height: 72 }, { shopLayout: 'marquee', shopSpeed: 30 }),
    ],
  }),

  // 10. Cards with attention-catching animation.
  () => ({
    name: 'منتجات بحركة',
    height: 640,
    backgroundColor: C.cream,
    elements: [
      el('heading', 'عنوان', { x: 0, y: 50, width: 1280, height: 50 }, 'منتجات مختارة', {
        fontSize: 32,
        fontWeight: 'bold',
        color: C.ink,
        fontFamily: HEADING_FONT,
        textAlign: 'center',
        animation: 'pulse',
        animationTrigger: 'loop',
        animationDuration: 2.5,
      }),
      paragraph({ x: 0, y: 104, width: 1280, height: 32 }, 'الأكثر طلبًا من عملائنا هذا الأسبوع'),
      products({ x: 90, y: 160, width: 1100, height: 440 }, { shopLayout: 'spotlight', shopLimit: 4, shopCardAnimation: 'float' }),
    ],
  }),

  // 11. Cards that shake every few seconds.
  () => ({
    name: 'منتجات بحركة اهتزاز',
    height: 640,
    backgroundColor: '#FFFFFF',
    elements: [
      heading({ x: 0, y: 50, width: 1280, height: 50 }, 'منتجات مختارة', 32),
      paragraph({ x: 0, y: 104, width: 1280, height: 32 }, 'الأكثر طلبًا من عملائنا هذا الأسبوع'),
      products({ x: 90, y: 160, width: 1100, height: 440 }, { shopLayout: 'grid', shopLimit: 4, shopCardAnimation: 'shake' }),
    ],
  }),

  // 12. A narrow strip of text running left to right.
  () => ({
    name: 'شريط نص متحرك',
    height: 60,
    backgroundColor: C.accent,
    elements: [
      el('paragraph', 'نص متحرك', { x: 0, y: 14, width: 1280, height: 32 }, 'توصيل سريع   •   الدفع عند الاستلام   •   منتجات أصلية   •   تشكيلة جديدة   •   توصيل سريع   •   الدفع عند الاستلام   •   منتجات أصلية   •   تشكيلة جديدة', {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: BODY_FONT,
        textAlign: 'center',
        animation: 'marquee-ltr',
        animationTrigger: 'loop',
        animationDuration: 18,
      }),
    ],
  }),
];

export const SHOP_SLIDE_COUNT = SLIDES.length;

export const getShopSlidePayload = (index: number) => SLIDES[Math.min(Math.max(index, 0), SLIDES.length - 1)]();
