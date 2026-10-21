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
  { id: 'bio', name: 'نبذة شخصية', desc: 'بطاقة سيرة ذاتية وبروفايل سريع', icon: '👤' },
  { id: 'shop', name: 'منتجات المتجر', desc: 'واجهات، عرض منتجات، بحث وأشرطة متحركة لمتجرك', icon: '🛍️' },
  { id: 'cars', name: 'معرض السيارات', desc: 'واجهات، عرض السيارات، بحث وأشرطة متحركة لمعرضك', icon: '🚗' },
  { id: 'restaurant', name: 'المطعم', desc: 'واجهات، المنيو بعدة أشكال، سلة الطلب وأشرطة متحركة لمطعمك', icon: '🍽️' },
  { id: 'services', name: 'خدماتنا', desc: 'تفاصيل الخدمات والحلول المتاحة', icon: '🛠️' },
  { id: 'projects', name: 'آخر مشاريعنا', desc: 'ألبوم وصور من إنجازاتك السابقة', icon: '🏗️' },
  { id: 'partners', name: 'شركاؤنا', desc: 'شعارات الشركاء ومواقع صديقة', icon: '🌐' },
  { id: 'map', name: 'عنوان وخرائط', desc: 'العنوان الجغرافي وخارطة الوصول', icon: '🗺️' },
  { id: 'privacy', name: 'قوانين وخصوصية', desc: 'الشروط والأحكام وسياسة الخصوصية', icon: '🔒' }
];

// Their slides read live shop, showroom or menu data, or are the platform's own contact and booking blocks: they stay in
// the code and the admin cannot add a gallery design to them (Eyad, 21 Oct).
export const FIXED_READY_CATEGORIES = ['shop', 'cars', 'restaurant', 'booking', 'contact'];
export const GALLERY_READY_CATEGORIES = READY_SLIDE_CATEGORIES.filter((c) => !FIXED_READY_CATEGORIES.includes(c.id));
