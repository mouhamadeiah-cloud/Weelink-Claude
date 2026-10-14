// 8. Furniture shop. Look «ذهبي فاتح»; a living-room photo hero; a navbar that scrolls away with the page;
// product cards with price tags; an offers ribbon.
import { Kit, look, rgba, type PageSpec } from '../dsl';

const L = look('gold');
const k = new Kit(L);
const A = L.accent;
const DARK = '#2A2418';

const hero = [
  k.shape({ x: 0, y: 0, width: 1280, height: 720 }, { backgroundColor: 'linear-gradient(180deg, rgba(42,36,24,0.25) 0%, rgba(42,36,24,0.72) 100%)' }, 'تعتيم'),
  k.heading({ x: 140, y: 190, width: 1000, height: 110 }, 'أثاث يجعل بيتك أجمل', 80, { textAlign: 'center', color: '#FFFFFF', textEffect: 'shadow-soft', textEffectColor: '#000000', textEffectIntensity: 50, animation: 'fade', animationTrigger: 'once' }),
  k.text({ x: 290, y: 318, width: 700, height: 64 }, 'غرف جلوس ونوم وسفرة بتصاميم عصرية وكلاسيكية وأسعار واضحة وتوصيل وتركيب.', 20, { textAlign: 'center', color: 'rgba(255,255,255,0.92)' }),
  ...['غرف جلوس', 'غرف نوم', 'سفرة', 'مكاتب', 'ديكور'].map((c, i) => k.badge({ x: 880 - i * 152, y: 420, width: 136, height: 40 }, c, { backgroundColor: 'rgba(255,255,255,0.16)', color: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderStyle: 'solid', fontSize: 15 })),
  k.button({ x: 540, y: 520, width: 200, height: 56 }, 'تصفح المنتجات', { slide: 2 }, { backgroundColor: A, color: '#FFFFFF', glowColor: '#F5D58A', glowIntensity: 14 }),
  k.line({ x: 340, y: 628, width: 600, height: 2 }, 'line-glow', '#F5D58A'),
];

const products = [
  k.eyebrow({ x: 884, y: 70, width: 300, height: 24 }, 'الأكثر طلباً'),
  k.heading({ x: 484, y: 98, width: 700, height: 64 }, 'قطع اخترناها لك', 46),
  ...[['كنبة زاوية مخمل', '1,250$', 'velvet corner sofa living room'], ['سرير خشب مع تسريحة', '980$', 'wooden bed bedroom furniture'], ['طاولة سفرة 6 كراسي', '760$', 'dining table chairs set']].flatMap(([name, price, q], i) => {
    const x = 840 - i * 372;
    return [
      k.card({ x, y: 210, width: 344, height: 470 }, { borderRadius: 6, borderWidth: 2, borderColor: '#EADFC6', shadow: 'md', animation: 'slide-up', animationTrigger: 'once' }),
      k.image({ x: x + 12, y: 222, width: 320, height: 290 }, q, { borderRadius: 4, animation: 'scale-up', animationTrigger: 'hover' }),
      k.badge({ x: x + 22, y: 232, width: 90, height: 30 }, i === 1 ? 'جديد' : 'عرض', { backgroundColor: DARK, color: '#F5D58A', borderRadius: 4, fontSize: 13 }),
      k.heading({ x: x + 20, y: 532, width: 304, height: 36 }, name, 22),
      k.heading({ x: x + 20, y: 590, width: 150, height: 44 }, price, 30, { color: A }),
      k.button({ x: x + 184, y: 598, width: 140, height: 44 }, 'اطلب الآن', { slide: 3 }, { fontSize: 15 }),
      k.line({ x: x + 20, y: 576, width: 304, height: 2 }, 'line-dotted', '#EADFC6'),
    ];
  }),
  k.shape({ x: 0, y: 740, width: 1280, height: 80 }, { backgroundColor: DARK }, 'شريط عروض'),
  k.heading({ x: 96, y: 756, width: 1088, height: 48 }, 'خصم 20% على غرف النوم حتى نهاية الشهر', 28, { color: '#F5D58A', textAlign: 'center', animation: 'jello', animationTrigger: 'loop', animationDuration: 4 }),
];

const visit = [
  k.shape({ x: 0, y: 0, width: 1280, height: 760 }, { backgroundColor: L.soft }, 'خلفية'),
  k.heading({ x: 484, y: 70, width: 700, height: 64 }, 'زوروا معرضنا', 46),
  k.gallery({ x: 96, y: 170, width: 620, height: 520 }, 'left-thumbnails', ['furniture showroom interior', 'sofa fabric samples', 'wooden furniture workshop', 'living room decor'], { borderRadius: 8, borderWidth: 4, borderColor: '#EADFC6', borderStyle: 'solid' }, 10, 6),
  ...[['mdi:truck-delivery-outline', 'توصيل لكل المحافظات'], ['mdi:tools', 'تركيب مجاني'], ['mdi:shield-check-outline', 'ضمان سنتين'], ['mdi:credit-card-outline', 'تقسيط مريح']].flatMap(([ic, t], i) => [
    k.shape({ x: 744, y: 170 + i * 98, width: 440, height: 80 }, { backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#EADFC6', borderStyle: 'solid' }, 'شريط'),
    k.icon({ x: 1130, y: 190 + i * 98, width: 40, height: 40 }, ic, A),
    k.text({ x: 764, y: 196 + i * 98, width: 340, height: 30 }, t, 19, { color: DARK, fontWeight: 'bold' }),
  ]),
  k.button({ x: 934, y: 590, width: 250, height: 58 }, 'احجز زيارة للمعرض', undefined, { backgroundColor: DARK, color: '#F5D58A' }),
];

const page: PageSpec = {
  key: 'furniture',
  name: 'محل أثاث',
  category: 'p-shop',
  look: L,
  navbar: { brand: 'معرض الوجيه للأثاث', items: [{ label: 'المنتجات', slide: 2 }, { label: 'زيارة المعرض', slide: 3 }], cta: { label: 'تواصل معنا', slide: 3 }, bg: '#FBF8F1', text: '#2A2418', accent: '#A67C2E', sticky: false, borderColor: '#EADFC6', borderWidth: 1, itemsAlign: 'center' },
  slides: [
    { name: 'المدخل', height: 720, bg: { image: 'luxury living room sofa interior', fixed: true }, divider: 'curve-down', elements: hero },
    { name: 'المنتجات', height: 840, bg: { color: L.bg }, divider: 'straight', elements: products },
    { name: 'المعرض', height: 760, bg: { color: L.soft }, divider: 'straight', elements: visit },
  ],
};
export default page;
