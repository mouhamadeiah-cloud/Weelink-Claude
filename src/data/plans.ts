// The packages each kind of page comes in (Eyad's plan, 12 Oct), shown under the questions on the
// start page. Prices are placeholders until Eyad sets the real ones: change them here only.
// Nothing is charged or enforced yet; the choice is remembered for the subscriptions phase.
import type { ProjectType } from '../components/shop/shopTypes';

export type Plan = {
  id: string;
  name: string;
  // Monthly price in US dollars; 0 = free.
  monthly: number;
  tagline: string;
  features: string[];
  popular?: boolean;
};

export type AddOn = { name: string; price: string };

// Paying a year ahead: two months free, and the page's own domain is included.
export const yearlyPrice = (monthly: number) => monthly * 10;

const FREE_SLIDES = 'واجهة بصورة، من نحن، الأسعار، معرض صور، التواصل، الشروط والخصوصية';

export const PLANS: Record<ProjectType, Plan[]> = {
  page: [
    {
      id: 'page-free',
      name: 'مجانية',
      monthly: 0,
      tagline: 'كل اللي بتحتاجه لتعرّف بشغلك.',
      features: [FREE_SLIDES, 'معرض حتى 5 صور', 'رابط مجاني على testweelink.de', '«ابن صفحتي» مرة وحدة'],
    },
    {
      id: 'page-pro',
      name: 'Pro',
      monthly: 5,
      tagline: 'لمين بدو صفحة أكبر وأقوى.',
      features: ['كل شي بالمجانية', 'شرائح الفريق والفيديو والخدمات', 'حجز مواعيد من الصفحة', 'كل أنواع الشرائح الجاهزة', 'معرض حتى 15 صورة', '«ابن صفحتي» حتى 5 مرات باليوم'],
      popular: true,
    },
  ],
  restaurant: [
    {
      id: 'restaurant-30',
      name: '30',
      monthly: 10,
      tagline: 'مطعم صغير بمنيو قصير.',
      features: ['كل شرائح الصفحة المجانية', 'طلب أونلاين من الموبايل', 'شريحة العروض المميزة', 'منيو حتى 30 صنف'],
    },
    {
      id: 'restaurant-60',
      name: '60',
      monthly: 18,
      tagline: 'مطعم بمنيو أكبر وكاشير.',
      features: ['كل شي بباقة 30', 'منيو حتى 60 صنف', 'كاشير محدود: تابلت واحد للمطبخ والكاشير', 'طاولات QR'],
      popular: true,
    },
    {
      id: 'restaurant-pro',
      name: 'Pro',
      monthly: 30,
      tagline: 'مطعم كامل بفريق.',
      features: ['كل شي بباقة 60', 'منيو بلا حدود', 'تابلت لكل دور: كاشير، مطبخ، بار', 'تابلت للجرسون', '«ابن صفحتي» حتى 5 مرات باليوم'],
    },
  ],
  shop: [
    {
      id: 'shop-30',
      name: '30',
      monthly: 8,
      tagline: 'متجر صغير يبدأ.',
      features: ['كل شرائح الصفحة المجانية', 'سلة وطلب من الموبايل', 'شريحة العروض المميزة', 'حتى 30 منتج'],
    },
    {
      id: 'shop-60',
      name: '60',
      monthly: 15,
      tagline: 'متجر عم يكبر.',
      features: ['كل شي بباقة 30', 'حتى 60 منتج', 'مستودع وحسابات'],
      popular: true,
    },
    {
      id: 'shop-pro',
      name: 'Pro',
      monthly: 25,
      tagline: 'متجر بلا حدود.',
      features: ['كل شي بباقة 60', 'منتجات بلا حدود', 'معرض حتى 15 صورة', '«ابن صفحتي» حتى 5 مرات باليوم'],
    },
  ],
  cars: [
    {
      id: 'cars-30',
      name: '30',
      monthly: 8,
      tagline: 'معرض صغير.',
      features: ['كل شرائح الصفحة المجانية', 'طلبات تجربة وتواصل', 'شريحة العروض المميزة', 'حتى 30 سيارة'],
    },
    {
      id: 'cars-60',
      name: '60',
      monthly: 15,
      tagline: 'معرض متوسط.',
      features: ['كل شي بباقة 30', 'حتى 60 سيارة', 'مصاريف وربح كل سيارة'],
      popular: true,
    },
    {
      id: 'cars-pro',
      name: 'Pro',
      monthly: 25,
      tagline: 'معرض كبير.',
      features: ['كل شي بباقة 60', 'سيارات بلا حدود', 'معرض حتى 15 صورة', '«ابن صفحتي» حتى 5 مرات باليوم'],
    },
  ],
};

// Extras bought on top of a package (placeholders too).
export const ADD_ONS: Record<ProjectType, AddOn[]> = {
  page: [
    { name: 'دومين خاص باسم صفحتك', price: 'مجاني مع الدفع السنوي، أو 15$ بالسنة' },
    { name: 'رصيد Wee AI إضافي', price: '3$ للباقة' },
  ],
  restaurant: [
    { name: 'تابلت إضافي لدور جديد', price: '3$ بالشهر لكل تابلت' },
    { name: 'تابلت جرسون إضافي', price: '2$ بالشهر لكل تابلت' },
    { name: 'دومين خاص باسم صفحتك', price: 'مجاني مع الدفع السنوي، أو 15$ بالسنة' },
    { name: 'رصيد Wee AI إضافي', price: '3$ للباقة' },
  ],
  shop: [
    { name: '30 منتج إضافي', price: '3$ بالشهر' },
    { name: 'دومين خاص باسم صفحتك', price: 'مجاني مع الدفع السنوي، أو 15$ بالسنة' },
    { name: 'رصيد Wee AI إضافي', price: '3$ للباقة' },
  ],
  cars: [
    { name: '30 سيارة إضافية', price: '3$ بالشهر' },
    { name: 'دومين خاص باسم صفحتك', price: 'مجاني مع الدفع السنوي، أو 15$ بالسنة' },
    { name: 'رصيد Wee AI إضافي', price: '3$ للباقة' },
  ],
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
