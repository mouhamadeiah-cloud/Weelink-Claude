// The categories of the editor's ready slides («شرائح جاهزة»): the add panel lists them, and the admin site adds a
// gallery design to one of them (server/readySlides.ts). Kept apart from the slide generators so the server can read it.
export const READY_SLIDE_CATEGORIES = [
  { id: 'intro', name: 'مدخل', desc: 'الترحيب بالزوار وجذب الانتباه', icon: '🚀' },
  { id: 'about', name: 'من نحن', desc: 'تعريف مبسط بكيانك ورؤيتك', icon: '✨' },
  { id: 'special_offer', name: 'عرض خاص', desc: 'عروض حصرية وحسومات مغرية', icon: '🎁' },
  { id: 'prices', name: 'قائمة أسعار', desc: 'أسعار الخدمات والمنتجات بوضوح', icon: '🏷️' },
  { id: 'team', name: 'فريق العمل', desc: 'التعريف بمهندسي النجاح خلف الكواليس', icon: '👥' },
  { id: 'contact', name: 'تواصل', desc: 'روابط الاتصال السريع ومواقع السوشيال', icon: '📞' },
  { id: 'booking', name: 'حجز مواعيد', desc: 'حجز مواعيد واستشارات مباشرة', icon: '📅' },
  { id: 'features', name: 'مميزات', desc: 'أهم مميزات وخصائص خدماتك', icon: '💡' },
  { id: 'gallery', name: 'معرض صور', desc: 'استعراض الصور والأعمال بشكل منسق', icon: '🖼️' },
  { id: 'table', name: 'جدول', desc: 'بيانات مقارنة وجداول إحصائية', icon: '📊' },
  { id: 'video', name: 'فيديو', desc: 'عرض مقاطع مرئية وتوضيحية', icon: '🎥' },
  { id: 'shop', name: 'منتجات المتجر', desc: 'واجهات، عرض منتجات، بحث وأشرطة متحركة لمتجرك', icon: '🛍️' },
  { id: 'cars', name: 'معرض السيارات', desc: 'واجهات، عرض السيارات، بحث وأشرطة متحركة لمعرضك', icon: '🚗' },
  { id: 'restaurant', name: 'المطعم', desc: 'واجهات، المنيو بعدة أشكال، سلة الطلب وأشرطة متحركة لمطعمك', icon: '🍽️' },
  { id: 'featured', name: 'عروض مميزة', desc: 'بطاقات العناصر المعلَّمة «مميز»: شريط متحرك وبطاقات باهتزاز لأي نوع صفحة', icon: '⭐' },
  { id: 'search', name: 'شرائح البحث', desc: 'شريط بحث ضيق مع بحث متقدم لكل نوع صفحة: مطعم، متجر، سيارات، تأجير، فنادق', icon: '🔎' },
  { id: 'services', name: 'خدماتنا', desc: 'تفاصيل الخدمات والحلول المتاحة', icon: '🛠️' },
  { id: 'projects', name: 'آخر مشاريعنا', desc: 'ألبوم وصور من إنجازاتك السابقة', icon: '🏗️' },
  { id: 'privacy', name: 'قوانين وخصوصية', desc: 'الشروط والأحكام وسياسة الخصوصية', icon: '🔒' }
];

// Their slides read live shop, showroom or menu data: they stay in the code and the admin cannot add a gallery design to them
// (Eyad, 21 Oct). The contact, booking and gallery blocks are elements like any other, so a designer can design those slides too.
export const FIXED_READY_CATEGORIES = ['shop', 'cars', 'restaurant', 'featured', 'search'];
export const GALLERY_READY_CATEGORIES = READY_SLIDE_CATEGORIES.filter((c) => !FIXED_READY_CATEGORIES.includes(c.id));
