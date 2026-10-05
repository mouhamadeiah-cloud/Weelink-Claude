// Online shop template: a fixed 5-page store site (Home, Products, Cart, How to order, Contact),
// each page reachable from the shared navbar. Every product card is built from regular elements
// (shape + image + heading + paragraph + badge + button), so the user can edit names, prices and
// photos like any other element. Each card's "أضف إلى السلة" button carries the product
// (cartProduct) and adds it to the visitor's cart; the Cart page holds a 'cart' element that lists
// the chosen products and sends the whole order to the shop's WhatsApp. There is no online
// payment: payment is cash on delivery.
// See handleApplyOnlineShopTemplate() in App.tsx.

import type { Page, CanvasElement, NavbarConfig, ElementStyles } from '../types';
import { withTemplateGroups } from '../utils/templateGroups';
import { formatPrice } from '../utils/cartStore';

const WHATSAPP_NUMBER = '963991234567';
const CURRENCY = 'ر.س';

const C = {
  ink: '#2A1F1A',
  body: '#5A4C42',
  muted: '#8A7B70',
  accent: '#B4532A',
  accentSoft: 'rgba(180,83,42,0.10)',
  cream: '#FBF6EF',
  card: '#FFFFFF',
  line: 'rgba(42,31,26,0.08)',
};

const HEADING_FONT = 'El Messiri';
const BODY_FONT = 'IBM Plex Sans Arabic';

const unsplash = (id: string, w = 700) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;

function buildShopNavbar(productsLabel: string): NavbarConfig {
  const link = (id: string, label: string, target: string) => ({
    id,
    label,
    href: '#',
    linkType: 'page' as const,
    linkTargetId: target,
  });
  return {
    brandName: 'اسم متجرك',
    brandSubtext: '',
    items: [
      link('nav-shop-home', 'الرئيسية', 'shop-page-home'),
      link('nav-shop-products', productsLabel, 'shop-page-products'),
      link('nav-shop-cart', 'السلة', 'shop-page-cart'),
      link('nav-shop-order', 'طريقة الطلب', 'shop-page-order'),
      link('nav-shop-contact', 'تواصل معنا', 'shop-page-contact'),
    ],
    ctaText: 'تسوّق الآن',
    ctaHref: '#',
    ctaLinkType: 'page',
    ctaLinkTargetId: 'shop-page-products',
    bgColor: '#FFFFFF',
    textColor: C.ink,
    isSticky: true,
  };
}

type Box = { x: number; y: number; width: number; height: number };

function el(
  id: string,
  type: CanvasElement['type'],
  slideId: string,
  box: Box,
  content: string,
  styles: ElementStyles,
  extra: Partial<CanvasElement> = {}
): CanvasElement {
  return { id, name: type, type, ...box, content, slideId, styles, ...extra };
}

const heading = (id: string, slideId: string, box: Box, text: string, size: number, color = C.ink, align: 'right' | 'center' = 'right') =>
  el(id, 'heading', slideId, box, text, {
    fontSize: size,
    fontWeight: 'bold',
    color,
    fontFamily: HEADING_FONT,
    textAlign: align,
  });

const paragraph = (id: string, slideId: string, box: Box, text: string, size = 15, color = C.body, align: 'right' | 'center' = 'right') =>
  el(id, 'paragraph', slideId, box, text, {
    fontSize: size,
    color,
    fontFamily: BODY_FONT,
    textAlign: align,
  });

export interface Product {
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  tag?: string;
}

export const PRODUCTS: Product[] = [
  { name: 'ساعة يد كلاسيكية', price: 250, oldPrice: 320, image: '1523275335684-37898b6baf30', tag: 'خصم' },
  { name: 'سماعات لاسلكية', price: 180, image: '1505740420928-5e560c06d30e', tag: 'الأكثر طلبًا' },
  { name: 'حذاء رياضي أحمر', price: 210, image: '1542291026-7eec264c27ff' },
  { name: 'نظارة شمسية', price: 120, image: '1572635196237-14b3f281503f', tag: 'جديد' },
  { name: 'عطر فاخر', price: 290, image: '1541643600914-78b084683601' },
  { name: 'كاميرا فورية', price: 340, oldPrice: 390, image: '1526170375885-4d8ecf77b99f', tag: 'خصم' },
  { name: 'حقيبة جلدية', price: 260, image: '1548036328-c9fa89d128fa' },
  { name: 'حذاء كاجوال', price: 195, image: '1491553895911-0055eca6402d', tag: 'جديد' },
];

// One product card: white rounded card, photo, optional tag badge, name, price (+ the old price
// when discounted) and an add-to-cart button carrying the product.
function productCard(prefix: string, slideId: string, p: Product, x: number, y: number): CanvasElement[] {
  const W = 260;
  const out: CanvasElement[] = [
    el(`${prefix}-card`, 'shape', slideId, { x, y, width: W, height: 410 }, '', {
      backgroundColor: C.card,
      borderColor: C.line,
      borderWidth: 1,
      borderRadius: 24,
      glowIntensity: 22,
      glowColor: 'rgba(42,31,26,0.10)',
      glowPosition: 'bottom',
    }),
    el(`${prefix}-img`, 'image', slideId, { x: x + 12, y: y + 12, width: W - 24, height: 220 }, '', {
      borderRadius: 18,
      objectFit: 'cover',
    }, { imageUrl: unsplash(p.image) }),
    heading(`${prefix}-name`, slideId, { x: x + 18, y: y + 246, width: W - 36, height: 32 }, p.name, 18),
    el(`${prefix}-price`, 'paragraph', slideId, { x: x + 18, y: y + 284, width: W - 36, height: 30 }, formatPrice(p.price, CURRENCY), {
      fontSize: 18,
      fontWeight: 'bold',
      color: C.accent,
      fontFamily: BODY_FONT,
      textAlign: 'right',
    }),
    el(`${prefix}-btn`, 'button', slideId, { x: x + 18, y: y + 336, width: W - 36, height: 50 }, 'أضف إلى السلة', {
      backgroundColor: C.accent,
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
      borderRadius: 9999,
      textAlign: 'center',
    }, {
      cartProduct: { name: p.name, price: p.price, currency: CURRENCY, image: unsplash(p.image, 300) },
    }),
  ];
  if (p.oldPrice) {
    out.push(el(`${prefix}-old`, 'paragraph', slideId, { x: x + 18, y: y + 288, width: 120, height: 26 }, `بدل ${formatPrice(p.oldPrice, CURRENCY)}`, {
      fontSize: 14,
      color: C.muted,
      fontFamily: BODY_FONT,
      textAlign: 'left',
    }));
  }
  if (p.tag) {
    out.push(el(`${prefix}-tag`, 'badge', slideId, { x: x + W - 24 - 96, y: y + 24, width: 96, height: 30 }, p.tag, {
      backgroundColor: C.ink,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      borderRadius: 9999,
    }));
  }
  return out;
}

// Lays products out right-to-left: the first product sits in the right-most column.
function productGrid(prefix: string, slideId: string, products: Product[], top: number, cols = 4): CanvasElement[] {
  const W = 260, GAP = 30, ROW = 450;
  const total = cols * W + (cols - 1) * GAP;
  const left = (1280 - total) / 2;
  return products.flatMap((p, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = left + (cols - 1 - col) * (W + GAP);
    return productCard(`${prefix}-${i + 1}`, slideId, p, x, top + row * ROW);
  });
}

// The live product grid of an Online Shop project: lists the products exported from the admin
// panel instead of the fixed demo cards.
const liveGrid = (id: string, slideId: string, box: Box, extra: Partial<CanvasElement> = {}): CanvasElement =>
  el(id, 'shopProducts', slideId, box, '', { color: C.accent }, { name: 'منتجات المتجر', ...extra });

// The home page's featured grid shows one row; the store page lists everything, page by page.
const FEATURED_LIMIT = 4;

const LIVE_GRIDS = [
  { demoPrefix: /^shop-products-\d+-/, slideId: 'shop-products-slide', id: 'shop-products-live', box: { x: 90, y: 170, width: 1100, height: 900 } },
  { demoPrefix: /^shop-featured-\d+-/, slideId: 'shop-home-featured', id: 'shop-featured-live', box: { x: 90, y: 170, width: 1100, height: 430 }, extra: { shopLimit: FEATURED_LIMIT } },
];

// An Online Shop's cart page is its checkout page: the cart summary on the right and, in the
// empty space on its left, the order card (the visitor's details and payment) as its own element.
// Both are styled like any element (background, border, font, text colour) plus an accent.
const CHECKOUT = {
  slideHeight: 1000,
  // The single element of shops made before the order card had its own element.
  cart: { x: 90, y: 160, width: 1100, height: 740 },
  summary: { x: 690, y: 160, width: 500, height: 740 },
  form: { x: 90, y: 160, width: 570, height: 740 },
  continueY: 925,
  subtitle: 'راجع طلبك، أدخل بياناتك واختر طريقة الدفع.',
};

const checkoutCardStyles = { color: C.ink, backgroundColor: '#FFFFFF', borderRadius: 24, borderColor: 'rgba(42,31,26,0.08)', borderWidth: 1 };

const checkoutForm = (slideId: string): CanvasElement =>
  el('shop-checkout', 'checkout', slideId, CHECKOUT.form, '', checkoutCardStyles, { name: 'بطاقة الطلب', shopAccent: C.accent });

// Shops created before the checkout page: enlarge their cart page if it is still as created.
// Then split a one-piece checkout into the cart summary and the order card on its left, and
// move the accent out of the text colour.
export function withCheckoutLayout(pages: Page[], elements: CanvasElement[]): { pages: Page[]; elements: CanvasElement[] } {
  const cart = elements.find((e) => e.id === 'shop-cart');
  if (!cart) return { pages, elements };
  const old = cart.x === 190 && cart.y === 160 && cart.width === 900 && cart.height === 480;
  if (old) {
    pages = pages.map((p) => ({
      ...p,
      slides: p.slides.map((sl) => (sl.id === 'shop-cart-slide' && (sl.height || 0) < CHECKOUT.slideHeight ? { ...sl, height: CHECKOUT.slideHeight } : sl)),
    }));
  }
  const whole = old || (cart.x === CHECKOUT.cart.x && cart.y === CHECKOUT.cart.y && cart.width === CHECKOUT.cart.width && cart.height === CHECKOUT.cart.height);
  const split = whole && !cart.cartSplit && !elements.some((e) => e.type === 'checkout');
  const recolor = !cart.shopAccent;
  if (!old && !split && !recolor) return { pages, elements };
  const next = elements.map((e) => {
    if (e.id === 'shop-cart') {
      return {
        ...e,
        ...(split ? { ...CHECKOUT.summary, cartSplit: true } : old ? CHECKOUT.cart : {}),
        ...(recolor ? { shopAccent: e.styles.color || C.accent, styles: { ...e.styles, ...(split ? checkoutCardStyles : { color: C.ink }) } } : {}),
      };
    }
    if (old && e.id === 'shop-cart-continue' && e.y === 670) return { ...e, y: CHECKOUT.continueY };
    if (old && e.id === 'shop-cart-sub' && e.content === 'راجع طلبك ثم أرسله عبر واتساب. الدفع عند الاستلام.') return { ...e, content: CHECKOUT.subtitle };
    return e;
  });
  return { pages, elements: split ? [...next, checkoutForm(cart.slideId)] : next };
}

// «عروض مميزة»: the products marked as featured in the product editor, as a running strip on the
// home page and as shaking cards above the full list on the store page (new shops only).
const OFFERS = { homeSlide: 'shop-home-offers', storeSlide: 'shop-products-offers' };
const offersElements = (): CanvasElement[] => [
  liveGrid('shop-offers-strip', OFFERS.homeSlide, { x: 0, y: 15, width: 1280, height: 80 }, {
    name: 'عروض مميزة', shopLayout: 'marquee', shopSource: 'featured', shopSpeed: 30,
  }),
  heading('shop-offers-heading', OFFERS.storeSlide, { x: 0, y: 44, width: 1280, height: 50 }, 'عروض مميزة', 32, C.ink, 'center'),
  liveGrid('shop-offers-cards', OFFERS.storeSlide, { x: 90, y: 120, width: 1100, height: 340 }, {
    name: 'عروض مميزة', shopLayout: 'grid', shopSource: 'featured', shopCardAnimation: 'shake', shopLimit: 8,
  }),
];

// Shops created before the live grid existed: swap their demo product cards for it.
// Featured grids made before product slides had pages show one row.
export function withLiveProductGrid(elements: CanvasElement[]): CanvasElement[] {
  if (elements.some((e) => e.type === 'shopProducts')) {
    return elements.map((e) => (e.id === 'shop-featured-live' && e.shopLimit === undefined ? { ...e, shopLimit: FEATURED_LIMIT } : e));
  }
  let next = elements;
  for (const g of LIVE_GRIDS) {
    if (!next.some((e) => g.demoPrefix.test(e.id))) continue;
    next = [...next.filter((e) => !g.demoPrefix.test(e.id)), liveGrid(g.id, g.slideId, g.box, g.extra)];
  }
  return next;
}

// liveProducts: the Online Shop project's version, whose product pages list the products from
// the admin panel. Without it (the free page's shop template) the pages keep demo cards.
export function getOnlineShopTemplate(opts: { liveProducts?: boolean } = {}): { pages: Page[]; elements: CanvasElement[] } {
  const live = !!opts.liveProducts;
  const productsLabel = live ? 'المتجر' : 'المنتجات';
  const buildNavbar = () => buildShopNavbar(productsLabel);
  const pages: Page[] = [
    {
      id: 'shop-page-home',
      name: 'الرئيسية',
      slug: '/',
      navbar: buildNavbar(),
      slides: [
        { id: 'shop-home-hero', name: 'الواجهة', height: 620, backgroundColor: '#2A1F1A', backgroundImage: unsplash('1441986300917-64674bd600d8', 1800), backgroundSize: 'cover', backgroundPosition: 'center', dividerShape: 'straight' },
        ...(live ? [{ id: OFFERS.homeSlide, name: 'عروض مميزة', height: 110, backgroundColor: C.ink, dividerShape: 'straight' as const }] : []),
        { id: 'shop-home-featured', name: 'منتجات مختارة', height: 640, backgroundColor: C.cream, dividerShape: 'straight' },
        { id: 'shop-home-perks', name: 'لماذا نحن', height: 300, backgroundColor: '#FFFFFF', dividerShape: 'straight' },
      ],
    },
    {
      id: 'shop-page-products',
      name: productsLabel,
      slug: '/products',
      navbar: buildNavbar(),
      slides: [
        ...(live ? [{ id: OFFERS.storeSlide, name: 'عروض مميزة', height: 500, backgroundColor: '#FFFFFF', dividerShape: 'straight' as const }] : []),
        { id: 'shop-products-slide', name: 'كل المنتجات', height: 1120, backgroundColor: C.cream, dividerShape: 'straight' },
      ],
    },
    {
      id: 'shop-page-cart',
      name: 'السلة',
      slug: '/cart',
      navbar: buildNavbar(),
      slides: [
        { id: 'shop-cart-slide', name: 'السلة', height: live ? CHECKOUT.slideHeight : 760, backgroundColor: C.cream, dividerShape: 'straight' },
      ],
    },
    {
      id: 'shop-page-order',
      name: 'طريقة الطلب',
      slug: '/how-to-order',
      navbar: buildNavbar(),
      slides: [
        { id: 'shop-order-slide', name: 'طريقة الطلب', height: 640, backgroundColor: '#FFFFFF', dividerShape: 'straight' },
      ],
    },
    {
      id: 'shop-page-contact',
      name: 'تواصل معنا',
      slug: '/contact',
      navbar: buildNavbar(),
      slides: [
        { id: 'shop-contact-slide', name: 'تواصل معنا', height: 560, backgroundColor: C.cream, dividerShape: 'straight' },
      ],
    },
  ];

  const hero = 'shop-home-hero';
  const featured = 'shop-home-featured';
  const perks = 'shop-home-perks';
  const products = 'shop-products-slide';
  const cart = 'shop-cart-slide';
  const order = 'shop-order-slide';
  const contact = 'shop-contact-slide';

  const perkItems = [
    { icon: 'iconify:mdi:truck-fast-outline', title: 'توصيل سريع', text: 'نوصل طلبك إلى باب بيتك خلال 2 إلى 4 أيام.' },
    { icon: 'iconify:mdi:cash-multiple', title: 'الدفع عند الاستلام', text: 'ادفع نقدًا عند وصول الطلب، دون أي دفع مسبق.' },
    { icon: 'iconify:mdi:shield-check-outline', title: 'منتجات أصلية', text: 'كل منتجاتنا أصلية ومضمونة الجودة.' },
  ];

  const steps = [
    { n: '1', title: 'أضف إلى السلة', text: 'تصفح المنتجات واضغط "أضف إلى السلة" تحت ما يعجبك.' },
    { n: '2', title: 'أرسل طلبك', text: 'من صفحة السلة اضغط "إرسال الطلب عبر واتساب" وأخبرنا بعنوانك.' },
    { n: '3', title: 'استلم وادفع', text: 'نؤكد طلبك ونوصله إليك، وتدفع عند الاستلام.' },
  ];

  const contactRows = [
    { icon: 'iconify:mdi:whatsapp', text: '+963 991 234 567', link: { linkType: 'contact' as const, contactType: 'whatsapp' as const, contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` } },
    { icon: 'iconify:mdi:phone', text: '+963 991 234 567', link: { linkType: 'contact' as const, contactType: 'phone' as const, contactValue: '+963 991 234 567', linkUrl: `tel:+${WHATSAPP_NUMBER}` } },
    { icon: 'iconify:mdi:email-outline', text: 'shop@example.com', link: { linkType: 'contact' as const, contactType: 'email' as const, contactValue: 'shop@example.com', linkUrl: 'mailto:shop@example.com' } },
    { icon: 'iconify:mdi:clock-outline', text: 'يوميًا من 10 صباحًا حتى 10 مساءً', link: {} },
  ];

  const elements: CanvasElement[] = withLive(live, [
    // ---------- Home: hero ----------
    el('shop-hero-overlay', 'shape', hero, { x: 0, y: 0, width: 1280, height: 620 }, '', {
      backgroundColor: 'rgba(28,20,16,0.55)',
    }),
    el('shop-hero-badge', 'badge', hero, { x: 1000, y: 150, width: 140, height: 34 }, 'تشكيلة جديدة', {
      backgroundColor: C.accent,
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      borderRadius: 9999,
    }),
    el('shop-hero-heading', 'heading', hero, { x: 540, y: 200, width: 600, height: 130 }, 'كل ما تحبه في متجر واحد', {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
      fontFamily: HEADING_FONT,
      textAlign: 'right',
      animation: 'slide-up',
      animationTrigger: 'once',
      animationDuration: 1.1,
    }),
    paragraph('shop-hero-text', hero, { x: 600, y: 344, width: 540, height: 70 }, 'منتجات مختارة بعناية، أسعار واضحة، أضف ما يعجبك إلى السلة واطلب بسهولة مع توصيل حتى باب بيتك.', 17, 'rgba(255,255,255,0.88)'),
    el('shop-hero-cta', 'button', hero, { x: 940, y: 440, width: 200, height: 54 }, 'تسوّق الآن', {
      backgroundColor: C.accent,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      borderRadius: 9999,
      textAlign: 'center',
      glowIntensity: 26,
      glowColor: 'rgba(180,83,42,0.55)',
      glowPosition: 'bottom',
    }, { linkType: 'page', linkTargetId: 'shop-page-products', linkUrl: '#page-shop-page-products' }),
    el('shop-hero-cta-2', 'button', hero, { x: 720, y: 440, width: 200, height: 54 }, 'تواصل معنا', {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#FFFFFF',
      borderColor: 'rgba(255,255,255,0.5)',
      borderWidth: 1,
      fontSize: 16,
      fontWeight: '600',
      borderRadius: 9999,
      textAlign: 'center',
    }, { linkType: 'contact', contactType: 'whatsapp', contactValue: WHATSAPP_NUMBER, linkUrl: `https://wa.me/${WHATSAPP_NUMBER}` }),

    // ---------- Home: featured products ----------
    heading('shop-featured-heading', featured, { x: 0, y: 56, width: 1280, height: 50 }, 'منتجات مختارة', 32, C.ink, 'center'),
    paragraph('shop-featured-sub', featured, { x: 0, y: 108, width: 1280, height: 32 }, 'الأكثر طلبًا من عملائنا هذا الأسبوع', 15, C.muted, 'center'),
    ...productGrid('shop-featured', featured, PRODUCTS.slice(0, 4), 170),

    // ---------- Home: perks ----------
    ...perkItems.flatMap((perk, i) => {
      const x = 140 + (2 - i) * 333; // three columns, right to left
      return [
        el(`shop-perk-${i + 1}-icon`, 'icon', perks, { x: x + 263, y: 80, width: 40, height: 40 }, perk.icon, { color: C.accent }),
        heading(`shop-perk-${i + 1}-title`, perks, { x: x + 20, y: 132, width: 283, height: 34 }, perk.title, 20),
        paragraph(`shop-perk-${i + 1}-text`, perks, { x: x + 20, y: 172, width: 283, height: 60 }, perk.text, 14.5),
      ];
    }),

    // ---------- Products page ----------
    heading('shop-products-heading', products, { x: 0, y: 50, width: 1280, height: 50 }, 'كل المنتجات', 34, C.ink, 'center'),
    paragraph('shop-products-sub', products, { x: 0, y: 104, width: 1280, height: 32 }, live ? 'اضغط على أي منتج لرؤية تفاصيله وإضافته إلى السلة، ثم أرسل طلبك من صفحة السلة' : 'اضغط "أضف إلى السلة" تحت أي منتج، ثم أرسل طلبك من صفحة السلة', 15, C.muted, 'center'),
    ...productGrid('shop-products', products, PRODUCTS, 170),

    // ---------- Cart ----------
    heading('shop-cart-heading', cart, { x: 0, y: 50, width: 1280, height: 50 }, 'سلة المشتريات', 34, C.ink, 'center'),
    paragraph('shop-cart-sub', cart, { x: 0, y: 104, width: 1280, height: 32 }, live ? CHECKOUT.subtitle : 'راجع طلبك ثم أرسله عبر واتساب. الدفع عند الاستلام.', 15, C.muted, 'center'),
    ...(live
      ? [
          el('shop-cart', 'cart', cart, CHECKOUT.summary, '', checkoutCardStyles, { cartWhatsapp: WHATSAPP_NUMBER, cartSplit: true, shopAccent: C.accent }),
          checkoutForm(cart),
        ]
      : [el('shop-cart', 'cart', cart, { x: 190, y: 160, width: 900, height: 480 }, '', { color: C.accent }, { cartWhatsapp: WHATSAPP_NUMBER })]),
    el('shop-cart-continue', 'button', cart, { x: 520, y: live ? CHECKOUT.continueY : 670, width: 240, height: 50 }, 'متابعة التسوّق', {
      backgroundColor: 'transparent',
      color: C.accent,
      borderColor: C.accent,
      borderWidth: 1,
      fontSize: 15,
      fontWeight: '600',
      borderRadius: 9999,
      textAlign: 'center',
    }, { linkType: 'page', linkTargetId: 'shop-page-products', linkUrl: '#page-shop-page-products' }),

    // ---------- How to order ----------
    heading('shop-order-heading', order, { x: 0, y: 60, width: 1280, height: 50 }, 'كيف تطلب؟', 34, C.ink, 'center'),
    paragraph('shop-order-sub', order, { x: 0, y: 114, width: 1280, height: 32 }, 'ثلاث خطوات بسيطة، بدون حساب وبدون دفع مسبق', 15, C.muted, 'center'),
    ...steps.flatMap((s, i) => {
      const x = 130 + (2 - i) * 350; // three columns, right to left
      return [
        el(`shop-step-${i + 1}-card`, 'shape', order, { x, y: 190, width: 320, height: 260 }, '', {
          backgroundColor: C.cream,
          borderColor: C.line,
          borderWidth: 1,
          borderRadius: 28,
        }),
        el(`shop-step-${i + 1}-num`, 'badge', order, { x: x + 240, y: 220, width: 56, height: 56 }, s.n, {
          backgroundColor: C.accent,
          color: '#FFFFFF',
          fontSize: 24,
          fontWeight: 'bold',
          borderRadius: 9999,
        }),
        heading(`shop-step-${i + 1}-title`, order, { x: x + 24, y: 300, width: 272, height: 36 }, s.title, 22),
        paragraph(`shop-step-${i + 1}-text`, order, { x: x + 24, y: 344, width: 272, height: 80 }, s.text, 15),
      ];
    }),
    el('shop-order-cta', 'button', order, { x: 520, y: 500, width: 240, height: 54 }, 'ابدأ التسوّق', {
      backgroundColor: C.accent,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      borderRadius: 9999,
      textAlign: 'center',
    }, { linkType: 'page', linkTargetId: 'shop-page-products', linkUrl: '#page-shop-page-products' }),

    // ---------- Contact ----------
    heading('shop-contact-heading', contact, { x: 700, y: 60, width: 440, height: 56 }, 'تواصل معنا', 34),
    paragraph('shop-contact-sub', contact, { x: 700, y: 120, width: 440, height: 56 }, 'لأي سؤال عن منتج أو طلب، راسلنا وسنرد عليك بأسرع وقت.', 15),
    el('shop-contact-card', 'shape', contact, { x: 700, y: 200, width: 440, height: 300 }, '', {
      backgroundColor: C.card,
      borderColor: C.line,
      borderWidth: 1,
      borderRadius: 28,
      glowIntensity: 24,
      glowColor: 'rgba(42,31,26,0.08)',
      glowPosition: 'bottom',
    }),
    ...contactRows.flatMap((row, i) => {
      const y = 236 + i * 62;
      return [
        el(`shop-contact-${i + 1}-icon`, 'icon', contact, { x: 1072, y, width: 32, height: 32 }, row.icon, { color: C.accent }),
        el(`shop-contact-${i + 1}-text`, 'paragraph', contact, { x: 736, y, width: 320, height: 32 }, row.text, {
          fontSize: 15,
          color: C.body,
          fontFamily: BODY_FONT,
          textAlign: 'right',
        }, row.link),
      ];
    }),
    el('shop-contact-map', 'map', contact, { x: 140, y: 60, width: 500, height: 440 }, 'دمشق، سوريا', {
      borderRadius: 24,
    }, { mapLocation: 'دمشق، سوريا' }),
  ]);

  return withTemplateGroups(pages, live ? [...elements, ...offersElements()] : elements);
}

const withLive = (live: boolean, elements: CanvasElement[]) => (live ? withLiveProductGrid(elements) : elements);
