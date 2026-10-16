// The packages each kind of page comes in (Eyad's plan and prices, 12 Oct), shown on the start page
// right after the kind is chosen; the questions start once a package is picked. Prices live here only.
// Nothing is charged or enforced yet; the choice is remembered for the subscriptions phase.
import type { ProjectType } from '../components/shop/shopTypes';

export type Plan = {
  id: string;
  name: string;
  // Monthly price in Syrian pounds; 0 = free.
  monthly: number;
  // Which picture explains it (PlanArt): how many devices and screens come with it.
  art: 'page' | 'pagePro' | 'phone' | 'phoneTablet' | 'team';
  tagline: string;
  features: string[];
  popular?: boolean;
};

export type AddOn = { name: string; price: string };

// Paying a year ahead is always 10% cheaper (Eyad), rounded to a thousand pounds, with the page's own
// domain included.
export const YEARLY_DISCOUNT = 0.1;
export const yearlyPrice = (monthly: number) => Math.round((monthly * 12 * (1 - YEARLY_DISCOUNT)) / 1000) * 1000;
export const formatPounds = (n: number) => `${n.toLocaleString('ar-SY')} ل.س`;

// One more tablet or screen for the restaurant (cashier, kitchen, bar, waiter), each month.
const EXTRA_DEVICE = 75000;

const FREE_SLIDES = 'واجهة بصورة، من نحن، الأسعار، معرض صور، التواصل، الشروط والخصوصية';

export const PLANS: Record<ProjectType, Plan[]> = {
  page: [
    {
      id: 'page-free',
      name: 'مجانية',
      monthly: 0,
      art: 'page',
      tagline: 'كل اللي بتحتاجه لتعرّف بشغلك.',
      features: [FREE_SLIDES, 'معرض حتى 5 صور', 'رابط مجاني على testweelink.de', '«ابن صفحتي» مرة وحدة'],
    },
    {
      id: 'page-pro',
      name: 'Pro',
      monthly: 199000,
      art: 'pagePro',
      tagline: 'لمين بدو صفحة أكبر وأقوى.',
      features: ['كل شي بالمجانية', 'شرائح الفريق والفيديو والخدمات', 'حجز مواعيد من الصفحة', 'كل أنواع الشرائح الجاهزة', 'معرض حتى 15 صورة', '«ابن صفحتي» حتى 5 مرات باليوم'],
      popular: true,
    },
  ],
  restaurant: [
    {
      id: 'restaurant-30',
      name: '30',
      monthly: 299000,
      art: 'phone',
      tagline: 'مطعم صغير بمنيو قصير.',
      features: ['كل شرائح الصفحة المجانية', 'طلب أونلاين من الموبايل', 'شريحة العروض المميزة', 'منيو حتى 30 صنف'],
    },
    {
      id: 'restaurant-60',
      name: '60',
      monthly: 499000,
      art: 'phoneTablet',
      tagline: 'مطعم بمنيو أكبر وكاشير.',
      features: ['كل شي بباقة 30', 'منيو حتى 60 صنف', 'كاشير محدود: تابلت واحد للمطبخ والكاشير', 'طاولات QR'],
      popular: true,
    },
    {
      id: 'restaurant-pro',
      name: 'Pro',
      monthly: 999000,
      art: 'team',
      tagline: 'مطعم كامل بفريق.',
      features: ['كل شي بباقة 60', 'منيو بلا حدود', 'تابلت لكل دور: كاشير، مطبخ، بار', 'تابلت للجرسون', '«ابن صفحتي» حتى 5 مرات باليوم'],
    },
  ],
  shop: [
    {
      id: 'shop-30',
      name: '30',
      monthly: 299000,
      art: 'phone',
      tagline: 'متجر صغير يبدأ.',
      features: ['كل شرائح الصفحة المجانية', 'سلة وطلب من الموبايل', 'شريحة العروض المميزة', 'حتى 30 منتج'],
    },
    {
      id: 'shop-60',
      name: '60',
      monthly: 499000,
      art: 'phoneTablet',
      tagline: 'متجر عم يكبر.',
      features: ['كل شي بباقة 30', 'حتى 60 منتج', 'مستودع وحسابات'],
      popular: true,
    },
    {
      id: 'shop-pro',
      name: 'Pro',
      monthly: 999000,
      art: 'team',
      tagline: 'متجر بلا حدود.',
      features: ['كل شي بباقة 60', 'منتجات بلا حدود', 'معرض حتى 15 صورة', '«ابن صفحتي» حتى 5 مرات باليوم'],
    },
  ],
  cars: [
    {
      id: 'cars-30',
      name: '30',
      monthly: 299000,
      art: 'phone',
      tagline: 'معرض صغير.',
      features: ['كل شرائح الصفحة المجانية', 'طلبات تجربة وتواصل', 'شريحة العروض المميزة', 'حتى 30 سيارة'],
    },
    {
      id: 'cars-60',
      name: '60',
      monthly: 499000,
      art: 'phoneTablet',
      tagline: 'معرض متوسط.',
      features: ['كل شي بباقة 30', 'حتى 60 سيارة', 'مصاريف وربح كل سيارة'],
      popular: true,
    },
    {
      id: 'cars-pro',
      name: 'Pro',
      monthly: 999000,
      art: 'team',
      tagline: 'معرض كبير.',
      features: ['كل شي بباقة 60', 'سيارات بلا حدود', 'معرض حتى 15 صورة', '«ابن صفحتي» حتى 5 مرات باليوم'],
    },
  ],
};

// Extras bought on top of a package.
const DOMAIN: AddOn = { name: 'دومين خاص باسم صفحتك', price: 'مجاني مع الاشتراك السنوي' };
export const ADD_ONS: Record<ProjectType, AddOn[]> = {
  page: [DOMAIN],
  restaurant: [{ name: 'كل جهاز إضافي (كاشير، مطبخ، بار، جرسون)', price: `${formatPounds(EXTRA_DEVICE)} بالشهر` }, DOMAIN],
  shop: [DOMAIN],
  cars: [DOMAIN],
};

const planKey = (owner: string, kind: ProjectType) => `weelink_plan_${owner}_${kind}`;

export const readPlan = (owner: string, kind: ProjectType): string | null => {
  try {
    return localStorage.getItem(planKey(owner, kind));
  } catch {
    return null;
  }
};

export const savePlan = (owner: string, kind: ProjectType, planId: string) => {
  try {
    localStorage.setItem(planKey(owner, kind), planId);
  } catch {
    // storage unavailable: the choice is asked again next time
  }
};
