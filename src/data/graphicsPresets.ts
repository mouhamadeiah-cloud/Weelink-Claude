export interface GalleryImageItem {
  id: string;
  title: string;
  category: string;
  thumbUrl: string;
  fullUrl: string;
  photographer?: string;
  photographerUrl?: string;
  downloadLocation?: string;
  unsplashId?: string;
  color?: string;
  width?: number;
  height?: number;
}

export interface GraphicItem {
  id: string;
  title: string;
  subCategory: 'stickers' | 'vector-icons' | 'claymation' | 'undraw';
  url: string;
  previewUrl: string;
  width?: number;
  height?: number;
  tags: string[];
}

// ----------------------------------------------------
// 1. Unsplash Curated Photo Gallery (من المعرض)
// ----------------------------------------------------
export const GALLERY_CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'خلفيات', label: 'خلفيات' },
  { id: 'رخام', label: 'رخام' },
  { id: 'طعام', label: 'طعام' },
  { id: 'بورتريه', label: 'بورتريه' },
  { id: 'طبيعة', label: 'طبيعة' },
  { id: 'أعمال', label: 'أعمال' },
  { id: 'معمار', label: 'معمار' },
  { id: 'تقنية', label: 'تقنية' },
] as const;

export const UNSPLASH_GALLERY_PHOTOS: GalleryImageItem[] = [
  // --- رخام (Marble) ---
  {
    id: 'm1',
    title: 'رخام أبيض كارارا الإيطالي',
    category: 'رخام',
    thumbUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Annie Spratt',
  },
  {
    id: 'm2',
    title: 'رخام أسود مع عروق ذهبية',
    category: 'رخام',
    thumbUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Spacejoy',
  },
  {
    id: 'm3',
    title: 'رخام رمادي كلاسيكي متموج',
    category: 'رخام',
    thumbUrl: 'https://images.unsplash.com/photo-1564951434112-64d74cc2a2d7?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1564951434112-64d74cc2a2d7?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Milad Fakurian',
  },
  {
    id: 'm4',
    title: 'رخام ناعم بألوان الباستيل',
    category: 'رخام',
    thumbUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
    photographer: 'R Architecture',
  },

  // --- خلفيات (Backgrounds) ---
  {
    id: 'bg1',
    title: 'تدرج ضوئي أثيري حالم',
    category: 'خلفيات',
    thumbUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Lucas Hoang',
  },
  {
    id: 'bg2',
    title: 'أمواج مجردة سائلة بتدرجات زرقاء',
    category: 'خلفيات',
    thumbUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Pawel Czerwinski',
  },
  {
    id: 'bg3',
    title: 'جدار أسمنتي مينيمالستيك',
    category: 'خلفيات',
    thumbUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Henry & Co.',
  },
  {
    id: 'bg4',
    title: 'تموجات قماش حريري دافئ',
    category: 'خلفيات',
    thumbUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Hunters Race',
  },

  // --- طعام (Food) ---
  {
    id: 'f1',
    title: 'قهوة مختصة لاتيه آرت',
    category: 'طعام',
    thumbUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Devin Avery',
  },
  {
    id: 'f2',
    title: 'مخبوزات وكرواسون فرنسي طازج',
    category: 'طعام',
    thumbUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Mae Mu',
  },
  {
    id: 'f3',
    title: 'أطباق طعام صحي وفاكهة استوائية',
    category: 'طعام',
    thumbUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Brooke Lark',
  },
  {
    id: 'f4',
    title: 'عصير منعش مع فواكه حمضية',
    category: 'طعام',
    thumbUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Eiliv Aceron',
  },

  // --- بورتريه (Portrait) ---
  {
    id: 'p1',
    title: 'بورتريه شبابي مبتسم',
    category: 'بورتريه',
    thumbUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Aiony Haust',
  },
  {
    id: 'p2',
    title: 'رجل أعمال في بيئة عمل احترافية',
    category: 'بورتريه',
    thumbUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Joseph Gonzalez',
  },
  {
    id: 'p3',
    title: 'فتاة بنظرة إيجابية واستوديو ناعم',
    category: 'بورتريه',
    thumbUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Michael Dam',
  },
  {
    id: 'p4',
    title: 'مبدع رقمي ومصمم في مكتب حديث',
    category: 'بورتريه',
    thumbUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Jurica Koletić',
  },

  // --- طبيعة (Nature) ---
  {
    id: 'n1',
    title: 'شروق شمس بين الجبال الخضراء',
    category: 'طبيعة',
    thumbUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Bailey Zindel',
  },
  {
    id: 'n2',
    title: 'رمال صحراوية ذهبية نجدية',
    category: 'طبيعة',
    thumbUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Jeremy Bishop',
  },
  {
    id: 'n3',
    title: 'أمواج بحر فيروزية متلاطمة',
    category: 'طبيعة',
    thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Sean Oulashin',
  },
  {
    id: 'n4',
    title: 'غابة استوائية هادئة برذاذ الضباب',
    category: 'طبيعة',
    thumbUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Sebastian Unrau',
  },

  // --- أعمال (Business) ---
  {
    id: 'b1',
    title: 'فريق عمل في اجتماع استراتيجي',
    category: 'أعمال',
    thumbUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Annie Spratt',
  },
  {
    id: 'b2',
    title: 'مكتب عصري مرتب مع حاسوب وشاشة',
    category: 'أعمال',
    thumbUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Luca Bravo',
  },
  {
    id: 'b3',
    title: 'لوحة تحكم وتحليلات بيانات رسومية',
    category: 'أعمال',
    thumbUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Carlos Muza',
  },

  // --- معمار (Architecture) ---
  {
    id: 'a1',
    title: 'برج أعمال زجاجي شاهق',
    category: 'معمار',
    thumbUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=85',
    photographer: 'David Rodrigo',
  },
  {
    id: 'a2',
    title: 'عمارة هندسية بتدرجات بيضاء مينيمال',
    category: 'معمار',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Samson',
  },
  {
    id: 'a3',
    title: 'متحف بتصميم انسيابي فائق الحداثة',
    category: 'معمار',
    thumbUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Simone Hutsch',
  },

  // --- تقنية (Technology) ---
  {
    id: 't1',
    title: 'شبكات بيانات سحابية وذكاء اصطناعي',
    category: 'تقنية',
    thumbUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Markus Spiske',
  },
  {
    id: 't2',
    title: 'لوحة إلكترونية دقيقة بتوهج نيون',
    category: 'تقنية',
    thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Alexandre Debiève',
  },
  {
    id: 't3',
    title: 'تفاعل الواقع المعزز والهولوجرام',
    category: 'تقنية',
    thumbUrl: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Alev Takil',
  },
  {
    id: 't4',
    title: 'أكواد برمجية على شاشة مظلمة',
    category: 'تقنية',
    thumbUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=85',
    photographer: 'Fotis Fotopoulos',
  },
];

// Helper to search Unsplash dynamic collection or query
export const getUnsplashSearchUrl = (query: string, page = 1) => {
  const clean = encodeURIComponent(query.trim() || 'minimal');
  return `https://images.unsplash.com/photo-${clean}?auto=format&fit=crop&w=1000&q=80`;
};

// ----------------------------------------------------
// 2. Graphics Library (جرافيك: ستيكرز، أيقونات فيكتور، كلايميشن)
// ----------------------------------------------------

export const GRAPHIC_CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'stickers', label: 'ملصقات Stickers' },
  { id: 'vector-icons', label: 'أيقونات Vector' },
  { id: 'claymation', label: 'كلايميشن Claymation' },
  { id: 'undraw', label: 'رسومات unDraw 🎨' },
] as const;

export const GRAPHICS_ITEMS: GraphicItem[] = [
  // ==========================================
  // A. STICKERS (ملصقات ثلاثية الأبعاد وفلات مبهجة)
  // ==========================================
  {
    id: 'stk-rocket',
    title: 'صاروخ الانطلاق 3D',
    subCategory: 'stickers',
    url: 'https://images.unsplash.com/photo-1517976487507-58037307044c?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1517976487507-58037307044c?auto=format&fit=crop&w=300&q=80',
    tags: ['صاروخ', 'انطلاق', 'rocket', 'startup', 'بداية', 'ستيكر'],
    width: 200,
    height: 200,
  },
  {
    id: 'stk-star',
    title: 'نجمة ذهبية لامعة',
    subCategory: 'stickers',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=80',
    tags: ['نجمة', 'تميز', 'star', 'gold', 'أفضل', 'تقييم'],
    width: 180,
    height: 180,
  },
  {
    id: 'stk-cup',
    title: 'كأس الإنجاز والتفوق',
    subCategory: 'stickers',
    url: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=300&q=80',
    tags: ['كأس', 'فوز', 'trophy', 'winner', 'نجاح'],
    width: 180,
    height: 180,
  },
  {
    id: 'stk-gift',
    title: 'هدية ومفاجأة وردية',
    subCategory: 'stickers',
    url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80',
    tags: ['هدية', 'مفاجأة', 'gift', 'present', 'عرض'],
    width: 190,
    height: 190,
  },
  {
    id: 'stk-fire',
    title: 'شعلة حماسية وترند',
    subCategory: 'stickers',
    url: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=300&q=80',
    tags: ['نار', 'ترند', 'fire', 'hot', 'شعلة', 'حماس'],
    width: 180,
    height: 180,
  },
  {
    id: 'stk-badge',
    title: 'شارة ثقة وضمان معتمدة',
    subCategory: 'stickers',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=80',
    tags: ['شارة', 'ضمان', 'badge', 'verified', 'أمان'],
    width: 190,
    height: 190,
  },

  // ==========================================
  // B. VECTOR ICONS (أيقونات فيكتور ملونة وأنيقة)
  // ==========================================
  {
    id: 'vec-analytics',
    title: 'مخطط بياني تحليلي نمو',
    subCategory: 'vector-icons',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=300&q=80',
    tags: ['رسم', 'بيانات', 'تحليل', 'chart', 'analytics', 'نمو'],
    width: 220,
    height: 180,
  },
  {
    id: 'vec-cloud',
    title: 'سحابة رقمية وتخزين',
    subCategory: 'vector-icons',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80',
    tags: ['سحابة', 'سيرفر', 'cloud', 'storage', 'شبكة'],
    width: 200,
    height: 170,
  },
  {
    id: 'vec-shield',
    title: 'درع الحماية السيبرانية',
    subCategory: 'vector-icons',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
    tags: ['أمان', 'درع', 'security', 'shield', 'حماية', 'خصوصية'],
    width: 180,
    height: 200,
  },
  {
    id: 'vec-payment',
    title: 'بطاقة دفع وتجارة إلكترونية',
    subCategory: 'vector-icons',
    url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=300&q=80',
    tags: ['دفع', 'بطاقة', 'credit', 'payment', 'شراء', 'متجر'],
    width: 210,
    height: 170,
  },
  {
    id: 'vec-chat',
    title: 'فقاعة محادثة وتواصل ذكي',
    subCategory: 'vector-icons',
    url: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=300&q=80',
    tags: ['شات', 'محادثة', 'chat', 'message', 'رسالة', 'دعم'],
    width: 190,
    height: 180,
  },
  {
    id: 'vec-gear',
    title: 'ترس الإعدادات والضبط التقني',
    subCategory: 'vector-icons',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
    tags: ['إعدادات', 'ترس', 'settings', 'gear', 'تخصيص'],
    width: 180,
    height: 180,
  },

  // ==========================================
  // C. CLAYMATION (تصاميم كلايميشن وصلصال ثلاثي الأبعاد)
  // ==========================================
  {
    id: 'clay-like',
    title: 'إبهام إعجاب صلصالي 3D',
    subCategory: 'claymation',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    tags: ['إعجاب', 'لايك', 'like', 'thumb', 'صلصال', 'clay', '3d'],
    width: 200,
    height: 200,
  },
  {
    id: 'clay-shapes',
    title: 'مجسمات هندسية ناعمة كاندي',
    subCategory: 'claymation',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&q=80',
    tags: ['مجسمات', 'أشكال', 'clay', 'shapes', 'pastel', '3d'],
    width: 220,
    height: 200,
  },
  {
    id: 'clay-bell',
    title: 'جرس تنبيهات صلصال ثلاثي الأبعاد',
    subCategory: 'claymation',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    tags: ['جرس', 'إشعار', 'bell', 'alert', 'clay', 'تنبيه'],
    width: 190,
    height: 190,
  },
  {
    id: 'clay-heart',
    title: 'قلب أحمر صلصالي ناعم',
    subCategory: 'claymation',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=80',
    tags: ['قلب', 'حب', 'heart', 'love', 'clay', '3d'],
    width: 190,
    height: 190,
  },
  {
    id: 'clay-plant',
    title: 'نبتة مكتبية صلصالية حيوية',
    subCategory: 'claymation',
    url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80',
    tags: ['نبتة', 'طبيعة', 'plant', 'clay', 'مكتب', 'ديكور'],
    width: 180,
    height: 220,
  },
  {
    id: 'clay-sphere',
    title: 'تكوين كروي كوزميك سريالي',
    subCategory: 'claymation',
    url: 'https://images.unsplash.com/photo-1633493106185-84631368566e?auto=format&fit=crop&w=600&q=85',
    previewUrl: 'https://images.unsplash.com/photo-1633493106185-84631368566e?auto=format&fit=crop&w=300&q=80',
    tags: ['كرة', 'سريالي', 'sphere', 'abstract', 'clay', 'art'],
    width: 210,
    height: 210,
  },
  // ==========================================
  // D. unDraw Vector Illustrations
  // ==========================================
  {
    id: 'g-undraw-team-collaboration',
    title: 'العمل الجماعي والتعاون 👥',
    subCategory: 'undraw',
    url: '/graphics/undraw/team-collaboration.svg',
    previewUrl: '/graphics/undraw/team-collaboration.svg',
    tags: ['تعاون', 'عمل جماعي', 'team', 'collaboration', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-web-development',
    title: 'تطوير المواقع والويب 💻',
    subCategory: 'undraw',
    url: '/graphics/undraw/web-development.svg',
    previewUrl: '/graphics/undraw/web-development.svg',
    tags: ['برمجة', 'موقع', 'ويب', 'web', 'development', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-brainstorming',
    title: 'العصف الفكري والابتكار 🧠',
    subCategory: 'undraw',
    url: '/graphics/undraw/brainstorming.svg',
    previewUrl: '/graphics/undraw/brainstorming.svg',
    tags: ['تفكير', 'عصف ذهني', 'ابتكار', 'brainstorming', 'idea', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-analytics',
    title: 'تحليل البيانات والمؤشرات 📊',
    subCategory: 'undraw',
    url: '/graphics/undraw/analytics.svg',
    previewUrl: '/graphics/undraw/analytics.svg',
    tags: ['تحليل', 'بيانات', 'مؤشر', 'analytics', 'data', 'chart', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-business-decisions',
    title: 'القرارات المهنية الذكية 📈',
    subCategory: 'undraw',
    url: '/graphics/undraw/business-decisions.svg',
    previewUrl: '/graphics/undraw/business-decisions.svg',
    tags: ['قرار', 'أعمال', 'نمو', 'business', 'decision', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-feeling-proud',
    title: 'الفخر والوصول للقمة 🏆',
    subCategory: 'undraw',
    url: '/graphics/undraw/feeling-proud.svg',
    previewUrl: '/graphics/undraw/feeling-proud.svg',
    tags: ['فخر', 'قمة', 'نجاح', 'كأس', 'proud', 'success', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-programmer',
    title: 'المبرمج والمطور النشط ⌨️',
    subCategory: 'undraw',
    url: '/graphics/undraw/programmer.svg',
    previewUrl: '/graphics/undraw/programmer.svg',
    tags: ['برمجة', 'كود', 'مبرمج', 'programmer', 'code', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-investing',
    title: 'الاستثمار والنمو المالي 💰',
    subCategory: 'undraw',
    url: '/graphics/undraw/investing.svg',
    previewUrl: '/graphics/undraw/investing.svg',
    tags: ['استثمار', 'مال', 'نمو', 'money', 'investing', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-education',
    title: 'التربية والتعليم الأكاديمي 📚',
    subCategory: 'undraw',
    url: '/graphics/undraw/education.svg',
    previewUrl: '/graphics/undraw/education.svg',
    tags: ['تعليم', 'كتب', 'دراسة', 'education', 'books', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-marketing',
    title: 'الإعلانات والتسويق الرقمي 📢',
    subCategory: 'undraw',
    url: '/graphics/undraw/marketing.svg',
    previewUrl: '/graphics/undraw/marketing.svg',
    tags: ['تسويق', 'إعلان', 'مكبر صوت', 'marketing', 'ads', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-innovative',
    title: 'الأفكار والحلول الابتكارية 💡',
    subCategory: 'undraw',
    url: '/graphics/undraw/innovative.svg',
    previewUrl: '/graphics/undraw/innovative.svg',
    tags: ['فكرة', 'مصباح', 'ابتكار', 'idea', 'innovative', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-project-completed',
    title: 'إتمام وإنجاز المشاريع ✅',
    subCategory: 'undraw',
    url: '/graphics/undraw/project-completed.svg',
    previewUrl: '/graphics/undraw/project-completed.svg',
    tags: ['إنجاز', 'اكتمال', 'مشروع', 'completed', 'done', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-searching',
    title: 'البحث والتحري الذكي 🔍',
    subCategory: 'undraw',
    url: '/graphics/undraw/searching.svg',
    previewUrl: '/graphics/undraw/searching.svg',
    tags: ['بحث', 'مكبر', 'تحري', 'search', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-chating',
    title: 'المحادثة والتواصل الاجتماعي 💬',
    subCategory: 'undraw',
    url: '/graphics/undraw/chatting.svg',
    previewUrl: '/graphics/undraw/chatting.svg',
    tags: ['دردشة', 'تواصل', 'محادثة', 'chat', 'social', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-conference-call',
    title: 'الاجتماعات والمكالمات الجماعية 📞',
    subCategory: 'undraw',
    url: '/graphics/undraw/conference-call.svg',
    previewUrl: '/graphics/undraw/conference-call.svg',
    tags: ['اجتماع', 'فيديو', 'اتصال', 'meeting', 'conference', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-science',
    title: 'البحوث والعلوم الدقيقة 🧪',
    subCategory: 'undraw',
    url: '/graphics/undraw/science.svg',
    previewUrl: '/graphics/undraw/science.svg',
    tags: ['علم', 'مختبر', 'تحليل', 'science', 'research', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-launch-day',
    title: 'يوم الإطلاق والتدشين 🚀',
    subCategory: 'undraw',
    url: '/graphics/undraw/launch-day.svg',
    previewUrl: '/graphics/undraw/launch-day.svg',
    tags: ['إطلاق', 'صاروخ', 'تدشين', 'launch', 'day', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-goals',
    title: 'تحديد الأهداف والإنجاز الفردي 🎯',
    subCategory: 'undraw',
    url: '/graphics/undraw/goals.svg',
    previewUrl: '/graphics/undraw/goals.svg',
    tags: ['أهداف', 'هدف', 'صيد', 'goals', 'target', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-developer-activity',
    title: 'تطوير الحلول التقنية المتقدمة 🌐',
    subCategory: 'undraw',
    url: '/graphics/undraw/developer-activity.svg',
    previewUrl: '/graphics/undraw/developer-activity.svg',
    tags: ['تطوير', 'برمجة', 'تقنية', 'developer', 'activity', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
  {
    id: 'g-undraw-startup-life',
    title: 'حياة رواد الأعمال والشركات الناشئة 🏢',
    subCategory: 'undraw',
    url: '/graphics/undraw/startup-life.svg',
    previewUrl: '/graphics/undraw/startup-life.svg',
    tags: ['ريادة', 'شركات ناشئة', 'عمل', 'startup', 'life', 'undraw', 'رسوم'],
    width: 280,
    height: 210,
  },
];
