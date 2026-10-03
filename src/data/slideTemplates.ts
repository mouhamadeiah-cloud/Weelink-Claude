// Static font list, ready-slide categories, and the ready-slide template generator.
// Moved verbatim from RightDrawer.tsx.

export const SIXTY_FONTS = [
  // --- ARABIC (30) ---
  { name: 'Cairo (كايرو)', font: 'Cairo', lang: 'ar' },
  { name: 'Tajawal (تجوال)', font: 'Tajawal', lang: 'ar' },
  { name: 'Readex Pro (ريدكس برو)', font: 'Readex Pro', lang: 'ar' },
  { name: 'Almarai (المراعي)', font: 'Almarai', lang: 'ar' },
  { name: 'Amiri (أميري)', font: 'Amiri', lang: 'ar' },
  { name: 'El Messiri (المسيري)', font: 'El Messiri', lang: 'ar' },
  { name: 'Lalezar (لاليزار)', font: 'Lalezar', lang: 'ar' },
  { name: 'Lemonada (ليمونادا)', font: 'Lemonada', lang: 'ar' },
  { name: 'Reem Kufi (ريم كوفي)', font: 'Reem Kufi', lang: 'ar' },
  { name: 'Changa (شانغا)', font: 'Changa', lang: 'ar' },
  { name: 'Alexandria (الإسكندرية)', font: 'Alexandria', lang: 'ar' },
  { name: 'Marhey (مرحي)', font: 'Marhey', lang: 'ar' },
  { name: 'Aref Ruqaa (عارف رقعة)', font: 'Aref Ruqaa', lang: 'ar' },
  { name: 'Markazi Text (المركزي)', font: 'Markazi Text', lang: 'ar' },
  { name: 'IBM Plex Sans Arabic', font: 'IBM Plex Sans Arabic', lang: 'ar' },
  { name: 'Kufam (كوفام)', font: 'Kufam', lang: 'ar' },
  { name: 'Mada (مدى)', font: 'Mada', lang: 'ar' },
  { name: 'Harmattan (هرمتان)', font: 'Harmattan', lang: 'ar' },
  { name: 'Lateef (لطيف)', font: 'Lateef', lang: 'ar' },
  { name: 'Katibeh (كتيبة)', font: 'Katibeh', lang: 'ar' },
  { name: 'Qahiri (قاهري)', font: 'Qahiri', lang: 'ar' },
  { name: 'Ruwudu (روودو)', font: 'Ruwudu', lang: 'ar' },
  { name: 'Alkalami (القلمي)', font: 'Alkalami', lang: 'ar' },
  { name: 'Baloo Bhaijaan 2', font: 'Baloo Bhaijaan 2', lang: 'ar' },
  { name: 'Rakkas (رقاص)', font: 'Rakkas', lang: 'ar' },
  { name: 'Jomhuria (جمهورية)', font: 'Jomhuria', lang: 'ar' },
  { name: 'Mirza (ميرزا)', font: 'Mirza', lang: 'ar' },
  { name: 'Noto Sans Arabic', font: 'Noto Sans Arabic', lang: 'ar' },
  { name: 'Noto Kufi Arabic', font: 'Noto Kufi Arabic', lang: 'ar' },
  { name: 'Noto Naskh Arabic', font: 'Noto Naskh Arabic', lang: 'ar' },

  // --- LATIN (30) ---
  { name: 'Roboto', font: 'Roboto', lang: 'lat' },
  { name: 'Open Sans', font: 'Open Sans', lang: 'lat' },
  { name: 'Lato', font: 'Lato', lang: 'lat' },
  { name: 'Montserrat', font: 'Montserrat', lang: 'lat' },
  { name: 'Inter', font: 'Inter', lang: 'lat' },
  { name: 'Poppins', font: 'Poppins', lang: 'lat' },
  { name: 'Raleway', font: 'Raleway', lang: 'lat' },
  { name: 'Oswald', font: 'Oswald', lang: 'lat' },
  { name: 'Playfair Display', font: 'Playfair Display', lang: 'lat' },
  { name: 'Merriweather', font: 'Merriweather', lang: 'lat' },
  { name: 'Nunito', font: 'Nunito', lang: 'lat' },
  { name: 'Lora', font: 'Lora', lang: 'lat' },
  { name: 'Ubuntu', font: 'Ubuntu', lang: 'lat' },
  { name: 'Quicksand', font: 'Quicksand', lang: 'lat' },
  { name: 'Kanit', font: 'Kanit', lang: 'lat' },
  { name: 'Heebo', font: 'Heebo', lang: 'lat' },
  { name: 'IBM Plex Sans', font: 'IBM Plex Sans', lang: 'lat' },
  { name: 'Josefin Sans', font: 'Josefin Sans', lang: 'lat' },
  { name: 'Fira Sans', font: 'Fira Sans', lang: 'lat' },
  { name: 'Work Sans', font: 'Work Sans', lang: 'lat' },
  { name: 'DM Sans', font: 'DM Sans', lang: 'lat' },
  { name: 'Barlow', font: 'Barlow', lang: 'lat' },
  { name: 'Titillium Web', font: 'Titillium Web', lang: 'lat' },
  { name: 'Prompt', font: 'Prompt', lang: 'lat' },
  { name: 'Cabin', font: 'Cabin', lang: 'lat' },
  { name: 'Plus Jakarta Sans', font: 'Plus Jakarta Sans', lang: 'lat' },
  { name: 'Source Sans Pro', font: 'Source Sans Pro', lang: 'lat' },
  { name: 'PT Sans', font: 'PT Sans', lang: 'lat' },
  { name: 'PT Serif', font: 'PT Serif', lang: 'lat' },
  { name: 'Nanum Gothic', font: 'Nanum Gothic', lang: 'lat' }
];

export const READY_SLIDE_CATEGORIES = [
  { id: 'intro', name: 'شريحة مدخل', desc: 'الترحيب بالزوار وجذب الانتباه', icon: '🚀' },
  { id: 'about', name: 'شريحة من نحن', desc: 'تعريف مبسط بكيانك ورؤيتك', icon: '✨' },
  { id: 'special_offer', name: 'شريحة عرض خاص', desc: 'عروض حصرية وحسومات مغرية', icon: '🎁' },
  { id: 'prices', name: 'شريحة قائمة أسعار', desc: 'أسعار الخدمات والمنتجات بوضوح', icon: '🏷️' },
  { id: 'team', name: 'شريحة فريق العمل', desc: 'التعريف بمهندسي النجاح خلف الكواليس', icon: '👥' },
  { id: 'contact', name: 'شريحة تواصل', desc: 'روابط الاتصال السريع ومواقع السوشيال', icon: '📞' },
  { id: 'booking', name: 'شريحة حجز مواعيد', desc: 'حجز مواعيد واستشارات مباشرة', icon: '📅' },
  { id: 'features', name: 'شريحة تعريفية', desc: 'أهم مميزات وخصائص خدماتك', icon: '💡' },
  { id: 'gallery', name: 'شريحة معرض صور', desc: 'استعراض الصور والأعمال بشكل منسق', icon: '🖼️' },
  { id: 'table', name: 'شريحة جدول', desc: 'بيانات مقارنة وجداول إحصائية', icon: '📊' },
  { id: 'video', name: 'شريحة فيديو', desc: 'عرض مقاطع مرئية وتوضيحية', icon: '🎥' },
  { id: 'bio', name: 'شريحة بطاقة تعريفية', desc: 'بطاقة سيرة ذاتية وبروفايل سريع', icon: '👤' },
  { id: 'shop', name: 'شريحة عناصر online Shop', desc: 'بطاقات المنتجات والتسوق المباشر', icon: '🛍️' },
  { id: 'services', name: 'شريحة خدماتنا', desc: 'تفاصيل الخدمات والحلول المتاحة', icon: '🛠️' },
  { id: 'projects', name: 'شريحة آخر مشاريعنا', desc: 'ألبوم وصور من إنجازاتك السابقة', icon: '🏗️' },
  { id: 'partners', name: 'شريحة صفحات صديقة', desc: 'شعارات الشركاء ومواقع صديقة', icon: '🌐' },
  { id: 'map', name: 'شريحة عنوان وخرائط', desc: 'العنوان الجغرافي وخارطة الوصول', icon: '🗺️' },
  { id: 'privacy', name: 'شريحة قوانين وخصوصية', desc: 'الشروط والأحكام وسياسة الخصوصية', icon: '🔒' }
];

export const customizeElementsForIndex = (elements: any[], categoryId: string, index: number, col: any) => {
  if (categoryId === 'intro') return elements;
  const medicalImages = [
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
  ];

  const restaurantImages = [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
  ];

  const professionalImages = [
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
  ];

  const getProfessionImg = (profIdx: number, imgIdx: number) => {
    if (profIdx === 0) return medicalImages[imgIdx % medicalImages.length];
    if (profIdx === 1) return restaurantImages[imgIdx % restaurantImages.length];
    return professionalImages[imgIdx % professionalImages.length];
  };

  return elements.map((el, elIdx) => {
    let content = el.content || '';
    let imageUrl = el.imageUrl || '';

    // Doctor / Medical (index 0)
    if (index === 0) {
      if (el.type === 'image') {
        imageUrl = getProfessionImg(0, elIdx);
        content = imageUrl;
      }
      if (el.type === 'badge') {
        content = '🩺 الاستشارات الطبية التخصصية';
      }
      if (el.type === 'heading') {
        if (content.includes('هوية') || content.includes('العنوان') || content.includes('مرحباً') || content.includes('محتوى') || content.includes('باقة')) {
          content = 'عيادة النخبة الطبية — رعاية صحية متكاملة تليق بعائلتك';
        } else if (content.includes('خدمة') || content.includes('تطوير')) {
          content = 'استشارات صحية وتشخيص متكامل';
        } else if (content.includes('ميزات') || content.includes('ميزة')) {
          content = 'لماذا تختار مركزنا الطبي المتطور؟';
        } else {
          content = 'العيادة التخصصية الاستشارية';
        }
      }
      if (el.type === 'paragraph') {
        if (content.includes('منصة') || content.includes('تقديم') || content.includes('النص') || content.includes('تفاصيل')) {
          content = 'يقدم مركزنا الطبي نخبة من الأطباء الاستشاريين الحاصلين على أعلى البوردات العالمية لتقديم خدمات التشخيص الدقيق والرعاية الصحية الراقية على مدار الساعة.';
        } else if (content.includes('تصميم') || content.includes('خدمة') || content.includes('عن طريق')) {
          content = 'خدمات الكشف المبكر والفحوصات الدورية بأحدث المعدات والأجهزة الطبية المتوافقة مع معايير الجودة العالمية لضمان سلامتك.';
        } else {
          content = 'رعاية طبية منزلية واستشارات فورية عن بعد للتواصل المباشر مع طبيبك الاستشاري في أي وقت ومن أي مكان.';
        }
      }
      if (el.type === 'button') {
        if (content.includes('تواصل') || content.includes('احجز')) {
          content = '📅 احجز موعد كشف الآن';
        } else {
          content = '📞 اتصل بالعيادة فوراً';
        }
      }
    }

    // Restaurant / Food (index 1)
    else if (index === 1) {
      if (el.type === 'image') {
        imageUrl = getProfessionImg(1, elIdx);
        content = imageUrl;
      }
      if (el.type === 'badge') {
        content = '🍔 نكهات طازجة وفريدة من نوعها';
      }
      if (el.type === 'heading') {
        if (content.includes('هوية') || content.includes('العنوان') || content.includes('مرحباً') || content.includes('محتوى') || content.includes('باقة')) {
          content = 'مطعم لو شيف — تجربة طهي فاخرة تستحق المشاركة';
        } else if (content.includes('خدمة') || content.includes('تطوير')) {
          content = 'أشهى المأكولات الإيطالية والغربية الطازجة';
        } else if (content.includes('ميزات') || content.includes('ميزة')) {
          content = 'أجود المكونات الطازجة من المزرعة للمائدة مباشرة';
        } else {
          content = 'قائمة الطعام والمأكولات الشهية';
        }
      }
      if (el.type === 'paragraph') {
        if (content.includes('منصة') || content.includes('تقديم') || content.includes('النص') || content.includes('تفاصيل')) {
          content = 'نحن في لو شيف نصنع السعادة من خلال ابتكار نكهات غنية وفريدة بأيدي أمهر الطهاة الدوليين، باستخدام لحوم طازجة وخضروات منتقاة بعناية فائقة.';
        } else if (content.includes('تصميم') || content.includes('خدمة') || content.includes('عن طريق')) {
          content = 'تذوق ألذ المأكولات وأطباق الباستا والبيتزا المحضرة في أفراننا الحجرية الخاصة لتستمتع بطعم لا يُنسى مع عائلتك.';
        } else {
          content = 'توصيل سريع وساخن إلى باب منزلك مع الحفاظ على النكهة الطازجة والجودة العالية لأطباقنا المميزة.';
        }
      }
      if (el.type === 'button') {
        if (content.includes('تواصل') || content.includes('احجز')) {
          content = '🛒 اطلب من منيو المطعم';
        } else {
          content = '📍 فرعنا وموقعنا الجغرافي';
        }
      }
    }

    // Professionals / Engineering / Consulting (index 2)
    else if (index === 2) {
      if (el.type === 'image') {
        imageUrl = getProfessionImg(2, elIdx);
        content = imageUrl;
      }
      if (el.type === 'badge') {
        content = '⚡ خدمات صيانة واستشارات هندسية متكاملة';
      }
      if (el.type === 'heading') {
        if (content.includes('هوية') || content.includes('العنوان') || content.includes('مرحباً') || content.includes('محتوى') || content.includes('باقة')) {
          content = 'مكتب المحترف الفني — حلول الهندسة والصيانة السريعة بموثوقية';
        } else if (content.includes('خدمة') || content.includes('تطوير')) {
          content = 'صيانة الأنظمة والتمديدات الكهربائية الذكية';
        } else if (content.includes('ميزات') || content.includes('ميزة')) {
          content = 'خبرة مهنية ممتدة تضمن لك أعلى جودة وأمان لبيتك ومكتبك';
        } else {
          content = 'خدمات الصيانة والحلول الفنية المتكاملة';
        }
      }
      if (el.type === 'paragraph') {
        if (content.includes('منصة') || content.includes('تقديم') || content.includes('النص') || content.includes('تفاصيل')) {
          content = 'يقدم مكتبنا الفني حلولاً هندسية وصيانة شاملة للكهرباء والتكييف والتمديدات الصحية بأيدي فنيين محترفين معتمدين لضمان أعلى درجات الأمان والسلامة.';
        } else if (content.includes('تصميم') || content.includes('خدمة') || content.includes('عن طريق')) {
          content = 'تنفيذ مشاريع الصيانة الوقائية والطارئة على مدار 24 ساعة لضمان استمرارية أعمالك وراحة عائلتك بمنتهى الموثوقية.';
        } else {
          content = 'عقود صيانة سنوية ميسرة للفلل والمكاتب والمجمعات السكنية مع ضمان معتمد على قطع الغيار الأصلية.';
        }
      }
      if (el.type === 'button') {
        if (content.includes('تواصل') || content.includes('احجز')) {
          content = '🛠️ اطلب فني صيانة الآن';
        } else {
          content = '💬 تواصل واتساب مباشر';
        }
      }
    }

    return {
      ...el,
      content,
      imageUrl,
    };
  });
};

export const getSlideTemplatePayload = (categoryId: string, index: number, catName: string) => {
  const title = `${catName} - نموذج ${index + 1}`;
  const height = 580; // slightly taller to accommodate gorgeous overlapping layouts!
  
  // High quality Unsplash image links for different categories
  const imageLibrary: Record<string, string[]> = {
    intro: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
    ],
    about: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    ],
    team: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    ],
    services: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    ],
    projects: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    ]
  };

  const getImg = (cat: string, imgIdx: number) => {
    const list = imageLibrary[cat] || imageLibrary['intro'];
    return list[imgIdx % list.length];
  };

  // Modern Apple & Creative Palette for index % 10
  const colors = [
    { bg: '#ffffff', card: '#f5f5f7', accent: '#0071e3', text: '#1d1d1f', bgShape: '#e6f1fc' },
    { bg: '#1d1d1f', card: '#2d2d2f', accent: '#0071e3', text: '#ffffff', bgShape: '#121212' },
    { bg: '#fafafa', card: '#ffffff', accent: '#34c759', text: '#1d1d1f', bgShape: '#eafaf1' },
    { bg: '#ffffff', card: '#fffbeb', accent: '#ff9500', text: '#1d1d1f', bgShape: '#fef3c7' },
    { bg: '#f5f5f7', card: '#ffffff', accent: '#bf5af2', text: '#1d1d1f', bgShape: '#fae8ff' },
    { bg: '#090a0f', card: '#12131a', accent: '#30d158', text: '#ffffff', bgShape: '#06070a' },
    { bg: '#ffffff', card: '#f0fdf4', accent: '#16a34a', text: '#14532d', bgShape: '#dcfce7' },
    { bg: '#faf5ff', card: '#ffffff', accent: '#7c3aed', text: '#4c1d95', bgShape: '#f3e8ff' },
    { bg: '#fff7ed', card: '#ffffff', accent: '#ea580c', text: '#7c2d12', bgShape: '#ffedd5' },
    { bg: '#f1f5f9', card: '#ffffff', accent: '#475569', text: '#0f172a', bgShape: '#e2e8f0' },
  ];
  const col = colors[index % colors.length];

  let elements: any[] = [];

  // ==========================================
  // INTRO SLIDES (شريحة مدخل)
  // ==========================================
  if (categoryId === 'intro') {
    if (index === 0) {
      // SCHEMA 1 — الخلفية الكاملة: صورة خلفية كاملة + صف بطاقات زجاجية شبه شفافة تطفو فوقها
      elements = [
        {
          type: 'image',
          name: 'خلفية كاملة - الشيما الأولى',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/compressed/intro-schema1-bg.jpg',
          imageUrl: '/Library/compressed/intro-schema1-bg.jpg',
          styles: { objectFit: 'cover', opacity: 1 }
        },
        {
          type: 'heading',
          name: 'عنوان الشيما الأولى',
          x: 60,
          y: 55,
          width: 680,
          height: 70,
          content: 'نرتقي بتجربتك من الفكرة الأولى حتى التنفيذ الكامل',
          styles: { fontSize: 26, color: '#ffffff', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص تعريفي للشيما الأولى',
          x: 110,
          y: 130,
          width: 580,
          height: 36,
          content: 'فريق متكامل يرافقك خطوة بخطوة لتحقيق نتائج تفوق التوقعات.',
          styles: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }
        },
        {
          type: 'button',
          name: 'زر البدء',
          x: 300,
          y: 180,
          width: 200,
          height: 44,
          content: 'ابدأ الآن',
          styles: { fontSize: 13, backgroundColor: '#ffffff', color: '#1d1d1f', borderRadius: 999, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'shape',
          name: 'بطاقة زجاجية 1',
          x: 50,
          y: 270,
          width: 220,
          height: 230,
          styles: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20 }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الزجاجية 1',
          x: 70,
          y: 295,
          width: 180,
          height: 30,
          content: 'جودة لا تقبل المساومة',
          styles: { fontSize: 14, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الزجاجية 1',
          x: 70,
          y: 335,
          width: 180,
          height: 140,
          content: 'نختار الأفضل في كل تفصيلة لنضمن رضاك الكامل.',
          styles: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.6 }
        },
        {
          type: 'shape',
          name: 'بطاقة زجاجية 2',
          x: 290,
          y: 270,
          width: 220,
          height: 230,
          styles: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20 }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الزجاجية 2',
          x: 310,
          y: 295,
          width: 180,
          height: 30,
          content: 'تسليم سريع وفي الموعد',
          styles: { fontSize: 14, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الزجاجية 2',
          x: 310,
          y: 335,
          width: 180,
          height: 140,
          content: 'التزام تام بالمواعيد دون أي تأخير يزعجك.',
          styles: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.6 }
        },
        {
          type: 'shape',
          name: 'بطاقة زجاجية 3',
          x: 530,
          y: 270,
          width: 220,
          height: 230,
          styles: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20 }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الزجاجية 3',
          x: 550,
          y: 295,
          width: 180,
          height: 30,
          content: 'دعم متواصل على مدار الساعة',
          styles: { fontSize: 14, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الزجاجية 3',
          x: 550,
          y: 335,
          width: 180,
          height: 140,
          content: 'فريقنا جاهز للرد على استفساراتك في أي وقت.',
          styles: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.6 }
        }
      ];
    } else if (index === 1) {
      // SCHEMA 2 — الانقسام الصريح: نص تعريفي بجهة، وعوضاً عن صورة واحدة صف من 3 بطاقات عمودية بالجهة الأخرى
      elements = [
        {
          type: 'badge',
          name: 'شارة الشيما الثانية',
          x: 60,
          y: 50,
          width: 220,
          height: 30,
          content: 'لماذا تختارنا',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان الشيما الثانية',
          x: 60,
          y: 95,
          width: 340,
          height: 100,
          content: 'شريك موثوق يحوّل أهدافك إلى إنجازات ملموسة',
          styles: { fontSize: 23, color: col.text, fontWeight: 'bold', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص الشيما الثانية',
          x: 60,
          y: 205,
          width: 340,
          height: 80,
          content: 'نجمع بين الخبرة والدقة لنقدّم لك حلولاً تناسب احتياجك فعلاً، لا مجرد وعود تسويقية.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر خدماتنا',
          x: 60,
          y: 300,
          width: 210,
          height: 44,
          content: 'تعرف على خدماتنا',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'shape',
          name: 'بطاقة عمودية 1',
          x: 430,
          y: 50,
          width: 330,
          height: 150,
          styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 18, glowColor: 'rgba(0,0,0,0.12)', glowPosition: 'bottom' }
        },
        {
          type: 'image',
          name: 'صورة البطاقة العمودية 1',
          x: 450,
          y: 66,
          width: 100,
          height: 118,
          content: '/Library/compressed/intro-schema2-side.jpg',
          imageUrl: '/Library/compressed/intro-schema2-side.jpg',
          styles: { objectFit: 'cover', borderRadius: 14 }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة العمودية 1',
          x: 565,
          y: 70,
          width: 175,
          height: 50,
          content: 'إطلاق سريع لموقعك',
          styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة العمودية 1',
          x: 565,
          y: 122,
          width: 175,
          height: 60,
          content: 'نرافقك من اليوم الأول وحتى الانطلاق الفعلي دون تعقيد.',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.5 }
        },
        {
          type: 'shape',
          name: 'بطاقة عمودية 2',
          x: 430,
          y: 220,
          width: 330,
          height: 150,
          styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 18, glowColor: 'rgba(0,0,0,0.12)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة العمودية 2',
          x: 455,
          y: 240,
          width: 280,
          height: 30,
          content: 'تواصل مباشر وشفاف',
          styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة العمودية 2',
          x: 455,
          y: 275,
          width: 280,
          height: 80,
          content: 'نطلعك أولاً بأول على كل خطوة، دون أي غموض أو مفاجآت.',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'shape',
          name: 'بطاقة عمودية 3',
          x: 430,
          y: 390,
          width: 330,
          height: 150,
          styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 18, glowColor: 'rgba(0,0,0,0.12)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة العمودية 3',
          x: 455,
          y: 410,
          width: 280,
          height: 30,
          content: 'أسعار واضحة بلا مفاجآت',
          styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة العمودية 3',
          x: 455,
          y: 445,
          width: 280,
          height: 80,
          content: 'تعرف على التكلفة الكاملة من البداية دون رسوم خفية لاحقاً.',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        }
      ];
    } else if (index === 2) {
      // SCHEMA 3 — الإطار العائم: بطاقة مركزية كبيرة بارزة وبطاقتان أصغر حولها بزاوية دوران خفيفة
      elements = [
        {
          type: 'heading',
          name: 'عنوان الشيما الثالثة',
          x: 200,
          y: 18,
          width: 400,
          height: 40,
          content: 'اختر الباقة التي تناسبك',
          styles: { fontSize: 20, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'shape',
          name: 'بطاقة جانبية يسار',
          x: 40,
          y: 150,
          width: 200,
          height: 260,
          rotation: -6,
          styles: { backgroundColor: col.card, borderRadius: 22, glowIntensity: 16, glowColor: 'rgba(0,0,0,0.1)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الجانبية اليسرى',
          x: 60,
          y: 180,
          width: 160,
          height: 26,
          content: 'الباقة الأساسية',
          styles: { fontSize: 13, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الجانبية اليسرى',
          x: 60,
          y: 215,
          width: 160,
          height: 90,
          content: 'تغطية أساسية تناسب البدايات.',
          styles: { fontSize: 10, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.5 }
        },
        {
          type: 'shape',
          name: 'بطاقة جانبية يمين',
          x: 560,
          y: 180,
          width: 200,
          height: 260,
          rotation: 6,
          styles: { backgroundColor: col.card, borderRadius: 22, glowIntensity: 16, glowColor: 'rgba(0,0,0,0.1)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الجانبية اليمنى',
          x: 580,
          y: 210,
          width: 160,
          height: 26,
          content: 'الباقة الشاملة',
          styles: { fontSize: 13, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الجانبية اليمنى',
          x: 580,
          y: 245,
          width: 160,
          height: 90,
          content: 'كل ما تحتاجه في باقة واحدة متكاملة.',
          styles: { fontSize: 10, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.5 }
        },
        {
          type: 'shape',
          name: 'البطاقة المركزية البارزة',
          x: 250,
          y: 70,
          width: 300,
          height: 400,
          styles: { backgroundColor: col.card, borderRadius: 28, glowIntensity: 26, glowColor: 'rgba(0,0,0,0.16)', glowPosition: 'bottom', borderWidth: 1, borderColor: col.accent + '30' }
        },
        {
          type: 'image',
          name: 'صورة البطاقة المركزية',
          x: 270,
          y: 90,
          width: 260,
          height: 220,
          content: '/Library/compressed/intro-schema3-floating.jpg',
          imageUrl: '/Library/compressed/intro-schema3-floating.jpg',
          styles: { objectFit: 'cover', borderRadius: 18 }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة المركزية',
          x: 270,
          y: 325,
          width: 260,
          height: 30,
          content: 'الباقة المميزة',
          styles: { fontSize: 16, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة المركزية',
          x: 270,
          y: 360,
          width: 260,
          height: 90,
          content: 'الخيار الأكثر طلباً، يجمع كل مزايانا في تجربة واحدة متكاملة.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.6 }
        }
      ];
    } else if (index === 3) {
      // SCHEMA 4 — التركيز النصي المحوري: عنوان مركزي وتحته صف بطاقات أفقي بعرض متساوٍ
      elements = [
        {
          type: 'heading',
          name: 'عنوان الشيما الرابعة',
          x: 80,
          y: 45,
          width: 640,
          height: 50,
          content: 'كل ما تحتاجه في مكان واحد',
          styles: { fontSize: 25, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص الشيما الرابعة',
          x: 140,
          y: 100,
          width: 520,
          height: 36,
          content: 'باقات مرنة تناسب احتياجك مهما كان حجم مشروعك.',
          styles: { fontSize: 13, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center' }
        },
        {
          type: 'shape',
          name: 'بطاقة أفقية 1',
          x: 60,
          y: 165,
          width: 220,
          height: 330,
          styles: { backgroundColor: col.card, borderRadius: 20, borderWidth: 1, borderColor: col.text + '12' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الأفقية 1',
          x: 80,
          y: 195,
          width: 180,
          height: 28,
          content: 'الأساسية',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الأفقية 1',
          x: 80,
          y: 235,
          width: 180,
          height: 110,
          content: 'تغطية البداية المثالية لمن يريد الانطلاق بثقة.',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر البطاقة الأفقية 1',
          x: 90,
          y: 435,
          width: 160,
          height: 38,
          content: 'اختر الباقة',
          styles: { fontSize: 12, backgroundColor: col.accent, color: '#ffffff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'shape',
          name: 'بطاقة أفقية 2',
          x: 300,
          y: 165,
          width: 220,
          height: 330,
          styles: { backgroundColor: col.card, borderRadius: 20, borderWidth: 1, borderColor: col.accent + '40' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الأفقية 2',
          x: 320,
          y: 195,
          width: 180,
          height: 28,
          content: 'الاحترافية',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الأفقية 2',
          x: 320,
          y: 235,
          width: 180,
          height: 110,
          content: 'مزايا أوسع تناسب الأعمال المتنامية والطموحة.',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر البطاقة الأفقية 2',
          x: 330,
          y: 435,
          width: 160,
          height: 38,
          content: 'اختر الباقة',
          styles: { fontSize: 12, backgroundColor: col.accent, color: '#ffffff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'shape',
          name: 'بطاقة أفقية 3',
          x: 540,
          y: 165,
          width: 220,
          height: 330,
          styles: { backgroundColor: col.card, borderRadius: 20, borderWidth: 1, borderColor: col.text + '12' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الأفقية 3',
          x: 560,
          y: 195,
          width: 180,
          height: 28,
          content: 'المؤسسات',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الأفقية 3',
          x: 560,
          y: 235,
          width: 180,
          height: 110,
          content: 'حلول مخصصة بالكامل تواكب حجم مؤسستك.',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر البطاقة الأفقية 3',
          x: 570,
          y: 435,
          width: 160,
          height: 38,
          content: 'تواصل معنا',
          styles: { fontSize: 12, backgroundColor: col.accent, color: '#ffffff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 4) {
      // SCHEMA 5 — الشبكة التركيبية: شبكة بطاقات موزعة بشكل غير متماثل، بطاقة كبيرة مميزة وبطاقتان أصغر
      elements = [
        {
          type: 'badge',
          name: 'شارة الشيما الخامسة',
          x: 50,
          y: 25,
          width: 200,
          height: 28,
          content: 'مزايا متعددة',
          styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'shape',
          name: 'بطاقة شبكية صغيرة 1',
          x: 50,
          y: 65,
          width: 330,
          height: 220,
          styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 14, glowColor: 'rgba(0,0,0,0.1)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الشبكية 1',
          x: 80,
          y: 95,
          width: 270,
          height: 28,
          content: 'نتائج قابلة للقياس',
          styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الشبكية 1',
          x: 80,
          y: 135,
          width: 270,
          height: 130,
          content: 'تقارير دورية واضحة تُظهر لك أثر كل خطوة نتخذها معك.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'shape',
          name: 'بطاقة شبكية صغيرة 2',
          x: 50,
          y: 305,
          width: 330,
          height: 220,
          styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 14, glowColor: 'rgba(0,0,0,0.1)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الشبكية 2',
          x: 80,
          y: 335,
          width: 270,
          height: 28,
          content: 'فريق عمل متمرس',
          styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الشبكية 2',
          x: 80,
          y: 375,
          width: 270,
          height: 130,
          content: 'خبرات متنوعة تجتمع لخدمة مشروعك من كل الجوانب.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'shape',
          name: 'البطاقة الشبكية الكبيرة المميزة',
          x: 410,
          y: 65,
          width: 340,
          height: 460,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.16)', glowPosition: 'bottom', borderWidth: 1, borderColor: col.accent + '30' }
        },
        {
          type: 'image',
          name: 'صورة البطاقة الشبكية الكبيرة',
          x: 430,
          y: 85,
          width: 300,
          height: 260,
          content: '/Library/compressed/intro-schema5-accent.jpg',
          imageUrl: '/Library/compressed/intro-schema5-accent.jpg',
          styles: { objectFit: 'cover', borderRadius: 18 }
        },
        {
          type: 'heading',
          name: 'عنوان البطاقة الشبكية الكبيرة',
          x: 430,
          y: 365,
          width: 300,
          height: 30,
          content: 'الخيار الأكثر تكاملاً',
          styles: { fontSize: 16, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص البطاقة الشبكية الكبيرة',
          x: 430,
          y: 400,
          width: 300,
          height: 100,
          content: 'يجمع كل ما تحتاجه في تجربة واحدة متكاملة ومصممة حول أهدافك.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.6 }
        }
      ];
    } else if (index === 5) {
      // SCHEMA 6 — البساطة: أقل زخرفة ممكنة، بلا ظل أو حدود بارزة، فقط فواصل رفيعة بين الصفوف
      elements = [
        {
          type: 'heading',
          name: 'عنوان الشيما السادسة',
          x: 100,
          y: 55,
          width: 600,
          height: 50,
          content: 'البساطة في صميم كل ما نقدمه',
          styles: { fontSize: 25, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص الشيما السادسة',
          x: 160,
          y: 110,
          width: 480,
          height: 36,
          content: 'حلول واضحة بلا تعقيد، تركز على ما يهمك فقط.',
          styles: { fontSize: 13, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center' }
        },
        {
          type: 'heading',
          name: 'عنوان الصف 1',
          x: 100,
          y: 190,
          width: 600,
          height: 28,
          content: 'وضوح تام في كل خطوة',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'right' }
        },
        {
          type: 'paragraph',
          name: 'نص الصف 1',
          x: 100,
          y: 222,
          width: 600,
          height: 28,
          content: 'تعرف بالضبط إلى أين تتجه فكرتك من اليوم الأول.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right' }
        },
        {
          type: 'shape',
          name: 'فاصل 1',
          x: 100,
          y: 262,
          width: 600,
          height: 1,
          styles: { backgroundColor: col.text === '#ffffff' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', borderRadius: 0 }
        },
        {
          type: 'heading',
          name: 'عنوان الصف 2',
          x: 100,
          y: 280,
          width: 600,
          height: 28,
          content: 'لا تفاصيل زائدة تشتت انتباهك',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'right' }
        },
        {
          type: 'paragraph',
          name: 'نص الصف 2',
          x: 100,
          y: 312,
          width: 600,
          height: 28,
          content: 'نقدّم فقط ما يخدم هدفك، دون حشو أو إلهاء.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right' }
        },
        {
          type: 'shape',
          name: 'فاصل 2',
          x: 100,
          y: 352,
          width: 600,
          height: 1,
          styles: { backgroundColor: col.text === '#ffffff' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', borderRadius: 0 }
        },
        {
          type: 'heading',
          name: 'عنوان الصف 3',
          x: 100,
          y: 370,
          width: 600,
          height: 28,
          content: 'تواصل بسيط ومباشر معنا',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'right' }
        },
        {
          type: 'paragraph',
          name: 'نص الصف 3',
          x: 100,
          y: 402,
          width: 600,
          height: 28,
          content: 'خطوة واحدة تفصلك عن بدء التعامل معنا.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right' }
        },
        {
          type: 'button',
          name: 'زر البساطة',
          x: 300,
          y: 460,
          width: 200,
          height: 44,
          content: 'ابدأ الآن',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 999, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 6) {
      // خلفية ثابتة (صورة واقعية) + صورة مشروع مميزة + تعريف بالمشروع
      elements = [
        {
          type: 'image',
          name: 'خلفية كاملة - الشيما السابعة',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/compressed/intro-extra-static1.jpg',
          imageUrl: '/Library/compressed/intro-extra-static1.jpg',
          styles: { objectFit: 'cover', opacity: 0.85, backgroundAttachment: 'fixed' }
        },
        {
          type: 'shape',
          name: 'لوحة المحتوى',
          x: 50,
          y: 130,
          width: 380,
          height: 340,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.18)', glowPosition: 'bottom', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
        },
        {
          type: 'badge',
          name: 'شارة تعريف المشروع',
          x: 80,
          y: 160,
          width: 260,
          height: 30,
          content: 'تعرف على مشروعنا',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان تعريف المشروع',
          x: 80,
          y: 205,
          width: 320,
          height: 90,
          content: 'فكرة بسيطة تحولت إلى مشروع نفخر به اليوم',
          styles: { fontSize: 22, color: col.text, fontWeight: 'bold', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص تعريف المشروع',
          x: 80,
          y: 305,
          width: 320,
          height: 90,
          content: 'بدأنا بخطوة صغيرة وإيمان كبير بالفكرة، واليوم نقدّم تجربة متكاملة لعملائنا بثقة وشغف.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر تعرف على القصة',
          x: 80,
          y: 420,
          width: 200,
          height: 44,
          content: 'تعرف على القصة',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'image',
          name: 'صورة المشروع المميزة',
          x: 470,
          y: 80,
          width: 290,
          height: 290,
          content: '/Library/compressed/intro-extra-animated1.jpg',
          imageUrl: '/Library/compressed/intro-extra-animated1.jpg',
          styles: { objectFit: 'cover', borderRadius: 24, borderWidth: 6, borderColor: '#ffffff', glowIntensity: 26, glowColor: 'rgba(0,0,0,0.22)', glowPosition: 'bottom' }
        }
      ];
    } else if (index === 7) {
      // خلفية متحركة (تأثير طفو بطيء) + صورة مشروع مميزة + تعريف بالمشروع
      elements = [
        {
          type: 'image',
          name: 'الطبقة البصرية الرئيسية',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/compressed/intro-extra-animated1.jpg',
          imageUrl: '/Library/compressed/intro-extra-animated1.jpg',
          styles: { objectFit: 'cover', opacity: 0.9, animation: 'float', animationTrigger: 'loop', animationDuration: 6 }
        },
        {
          type: 'image',
          name: 'صورة المشروع المميزة',
          x: 40,
          y: 80,
          width: 290,
          height: 290,
          content: '/Library/compressed/intro-extra-static2.jpg',
          imageUrl: '/Library/compressed/intro-extra-static2.jpg',
          styles: { objectFit: 'cover', borderRadius: 24, borderWidth: 6, borderColor: '#ffffff', glowIntensity: 26, glowColor: 'rgba(0,0,0,0.22)', glowPosition: 'bottom' }
        },
        {
          type: 'shape',
          name: 'لوحة المحتوى',
          x: 370,
          y: 130,
          width: 380,
          height: 340,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.18)', glowPosition: 'bottom', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
        },
        {
          type: 'badge',
          name: 'شارة تعريف المشروع 2',
          x: 400,
          y: 160,
          width: 260,
          height: 30,
          content: 'مشروعنا بين يديك',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان تعريف المشروع 2',
          x: 400,
          y: 205,
          width: 320,
          height: 90,
          content: 'نبني تجربة رقمية تعكس هوية مشروعك بدقة',
          styles: { fontSize: 22, color: col.text, fontWeight: 'bold', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص تعريف المشروع 2',
          x: 400,
          y: 305,
          width: 320,
          height: 90,
          content: 'كل تفصيلة مدروسة لتمنحك حضوراً رقمياً يليق بطموحك.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر ابدأ مشروعك',
          x: 400,
          y: 420,
          width: 200,
          height: 44,
          content: 'ابدأ مشروعك الآن',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 8) {
      // خلفية ثابتة + صورة مشروع علوية + لوحة تعريف سفلية مركزية
      elements = [
        {
          type: 'image',
          name: 'خلفية كاملة - الشيما التاسعة',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/compressed/intro-extra-static2.jpg',
          imageUrl: '/Library/compressed/intro-extra-static2.jpg',
          styles: { objectFit: 'cover', opacity: 0.9, backgroundAttachment: 'scroll' }
        },
        {
          type: 'image',
          name: 'صورة المشروع العلوية',
          x: 250,
          y: 50,
          width: 300,
          height: 260,
          content: '/Library/compressed/intro-extra-animated2.jpg',
          imageUrl: '/Library/compressed/intro-extra-animated2.jpg',
          styles: { objectFit: 'cover', borderRadius: 24, borderWidth: 6, borderColor: '#ffffff', glowIntensity: 26, glowColor: 'rgba(0,0,0,0.22)', glowPosition: 'bottom' }
        },
        {
          type: 'shape',
          name: 'لوحة المحتوى السفلية',
          x: 150,
          y: 340,
          width: 500,
          height: 190,
          styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 22, glowColor: 'rgba(0,0,0,0.16)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'عنوان تعريف المشروع 3',
          x: 180,
          y: 365,
          width: 440,
          height: 40,
          content: 'مشروع وُلد من شغف حقيقي بالتفاصيل',
          styles: { fontSize: 20, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'نص تعريف المشروع 3',
          x: 180,
          y: 410,
          width: 440,
          height: 60,
          content: 'نؤمن أن الجودة تبدأ من الاهتمام بأدق التفاصيل في كل خطوة.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر اكتشف المزيد',
          x: 300,
          y: 480,
          width: 200,
          height: 40,
          content: 'اكتشف المزيد',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 9) {
      // خلفية متحركة (تأثير طفو بطيء) + صورة مشروع دائرية + تعريف بالمشروع
      elements = [
        {
          type: 'image',
          name: 'المشهد البصري المتحرك',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/compressed/intro-extra-animated2.jpg',
          imageUrl: '/Library/compressed/intro-extra-animated2.jpg',
          styles: { objectFit: 'cover', opacity: 0.88, animation: 'float', animationTrigger: 'loop', animationDuration: 5.5 }
        },
        {
          type: 'shape',
          name: 'لوحة المحتوى 4',
          x: 50,
          y: 90,
          width: 360,
          height: 400,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.18)', glowPosition: 'bottom', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
        },
        {
          type: 'badge',
          name: 'شارة تعريف المشروع 4',
          x: 80,
          y: 120,
          width: 260,
          height: 30,
          content: 'هذا ما نقدمه',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان تعريف المشروع 4',
          x: 80,
          y: 165,
          width: 300,
          height: 90,
          content: 'نحوّل الأفكار إلى تجارب رقمية ملموسة',
          styles: { fontSize: 21, color: col.text, fontWeight: 'bold', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص تعريف المشروع 4',
          x: 80,
          y: 265,
          width: 300,
          height: 120,
          content: 'فريقنا يعمل بشغف ليقدّم لك نتيجة تستحق فعلاً أن تحمل اسم مشروعك.',
          styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر تعرف علينا أكثر',
          x: 80,
          y: 410,
          width: 200,
          height: 44,
          content: 'تعرف علينا أكثر',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'image',
          name: 'صورة المشروع الدائرية',
          x: 460,
          y: 130,
          width: 300,
          height: 300,
          content: '/Library/compressed/intro-extra-static1.jpg',
          imageUrl: '/Library/compressed/intro-extra-static1.jpg',
          clipPath: 'clip-shape-geo-circle',
          styles: { objectFit: 'cover' }
        }
      ];
    }
  }


  // ==========================================
  // ABOUT US SLIDES (شريحة من نحن)
  // ==========================================
  else if (categoryId === 'about') {
    if (index === 0) {
      // Tiling / Floor & Wall Tiles (بلاط)
      elements = [
        { type: 'shape', name: 'بلاطة زخرفية 1', x: 610, y: 40, width: 55, height: 55, styles: { backgroundColor: col.accent, borderRadius: 8 } },
        { type: 'shape', name: 'بلاطة زخرفية 2', x: 675, y: 40, width: 55, height: 55, styles: { backgroundColor: col.bgShape, borderRadius: 8 } },
        { type: 'shape', name: 'بلاطة زخرفية 3', x: 610, y: 105, width: 55, height: 55, styles: { backgroundColor: col.bgShape, borderRadius: 8 } },
        { type: 'shape', name: 'بلاطة زخرفية 4', x: 675, y: 105, width: 55, height: 55, styles: { backgroundColor: col.accent, borderRadius: 8 } },
        {
          type: 'shape',
          name: 'إطار دائري حول صورة البلاط',
          x: 460,
          y: 200,
          width: 300,
          height: 300,
          content: 'frame',
          styles: { backgroundColor: 'transparent', borderWidth: 2, borderColor: col.accent, borderRadius: 150 }
        },
        {
          type: 'image',
          name: 'صورة تركيب البلاط',
          x: 480,
          y: 220,
          width: 260,
          height: 260,
          content: '/Library/sufyan-P4UWWE8JcCA-unsplash.jpg',
          imageUrl: '/Library/sufyan-P4UWWE8JcCA-unsplash.jpg',
          clipPath: 'clip-shape-geo-circle',
          styles: { objectFit: 'cover', animation: 'scale-up', animationTrigger: 'once', animationDuration: 1.1 }
        },
        {
          type: 'shape',
          name: 'لوحة قصة البلاط',
          x: 40,
          y: 120,
          width: 400,
          height: 360,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 22, glowColor: 'rgba(0,0,0,0.12)', glowPosition: 'bottom' }
        },
        {
          type: 'badge',
          name: 'شارة الحرفية',
          x: 70,
          y: 150,
          width: 250,
          height: 30,
          content: 'حرفية في تركيب البلاط',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان البلاط',
          x: 70,
          y: 195,
          width: 340,
          height: 90,
          content: 'مؤسسة الحرفة الدقيقة للبلاط — دقة لا تقبل العشوائية',
          styles: { fontSize: 23, color: col.text, fontWeight: 'bold', fontFamily: 'Cairo', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص البلاط',
          x: 70,
          y: 300,
          width: 340,
          height: 110,
          content: 'بدأنا كفريق صغير من الحرفيين المتخصصين في تركيب وتصميم البلاط والسيراميك، واليوم ننفذ مشاريع فلل وشركات كاملة بخبرة تتجاوز خمسة عشر عامًا ودقة قياس بالمليمتر.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'card',
          name: 'بطاقة إحصائية البلاط',
          x: 460,
          y: 400,
          width: 230,
          height: 100,
          content: 'أكثر من 400 مشروع بلاط منفذ بدقة واحترافية عالية.',
          styles: {}
        }
      ];
    } else if (index === 1) {
      // Moving & Transport Services (نقليات)
      elements = [
        {
          type: 'image',
          name: 'خلفية كاملة - خدمات النقليات',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/warren-umoh-aQVnWyP3AYA-unsplash.jpg',
          imageUrl: '/Library/warren-umoh-aQVnWyP3AYA-unsplash.jpg',
          styles: { objectFit: 'cover', opacity: 0.3, backgroundAttachment: 'fixed' }
        },
        {
          type: 'shape',
          name: 'سهم مثلث زخرفي',
          x: 610,
          y: 180,
          width: 150,
          height: 150,
          clipPath: 'clip-shape-geo-triangle',
          content: 'triangle',
          styles: { backgroundColor: 'rgba(0,113,227,0.14)' },
          rotation: 90
        },
        {
          type: 'shape',
          name: 'إطار كبسولة النقل',
          x: 440,
          y: 60,
          width: 340,
          height: 220,
          content: 'frame',
          styles: { backgroundColor: 'transparent', borderWidth: 3, borderColor: col.accent, borderRadius: 40 }
        },
        {
          type: 'image',
          name: 'صورة أسطول النقل',
          x: 460,
          y: 80,
          width: 300,
          height: 200,
          content: '/Library/tim-mossholder-fxB2UAO0dcY-unsplash.jpg',
          imageUrl: '/Library/tim-mossholder-fxB2UAO0dcY-unsplash.jpg',
          clipPath: 'clip-shape-geo-capsule',
          styles: { objectFit: 'cover' }
        },
        {
          type: 'shape',
          name: 'لوحة قصة النقليات',
          x: 40,
          y: 150,
          width: 380,
          height: 320,
          styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 28, glowColor: 'rgba(0,0,0,0.5)', glowPosition: 'bottom', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
        },
        {
          type: 'badge',
          name: 'شارة النقل الآمن',
          x: 70,
          y: 180,
          width: 200,
          height: 30,
          content: 'نقل آمن وسريع',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: '#5aa9ff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان النقليات',
          x: 70,
          y: 225,
          width: 320,
          height: 90,
          content: 'شركة الوصول السريع للنقليات — أمانتك تحت إشرافنا الكامل',
          styles: { fontSize: 22, color: col.text, fontWeight: 'bold', fontFamily: 'Baloo Bhaijaan 2', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص النقليات',
          x: 70,
          y: 325,
          width: 320,
          height: 100,
          content: 'نقدم خدمات نقل العفش والبضائع بين المدن بأسطول مجهز وفريق مدرب على التغليف والتحميل الآمن، مع تتبع مباشر لشحنتك من الباب إلى الباب.',
          styles: { fontSize: 12, color: '#a1a1a6', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر طلب عرض نقل',
          x: 70,
          y: 440,
          width: 220,
          height: 44,
          content: 'اطلب عرض نقل الآن',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold', animation: 'pulse', animationTrigger: 'loop', animationDuration: 2.2 }
        }
      ];
    } else if (index === 2) {
      // Home Furniture Sales (بيع أثاث منزلي)
      elements = [
        {
          type: 'shape',
          name: 'ورقة زخرفية علوية',
          x: -50,
          y: -50,
          width: 260,
          height: 260,
          clipPath: 'clip-shape-leaf-classic',
          content: 'leaf',
          styles: { backgroundColor: col.bgShape }
        },
        {
          type: 'shape',
          name: 'بقعة صورة الأثاث',
          x: 470,
          y: 230,
          width: 300,
          height: 260,
          clipPath: 'clip-shape-blob-org-a',
          content: 'blob',
          styles: { backgroundImage: '/Library/manuel-gast-zIzMHDnFKik-unsplash.jpg', backgroundSize: 'cover' }
        },
        {
          type: 'shape',
          name: 'لوحة قصة الأثاث',
          x: 40,
          y: 130,
          width: 400,
          height: 350,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 20, glowColor: 'rgba(0,0,0,0.1)', glowPosition: 'bottom' }
        },
        {
          type: 'badge',
          name: 'شارة تشكيلة الأثاث',
          x: 70,
          y: 160,
          width: 270,
          height: 30,
          content: 'تشكيلة أثاث منزلي متكاملة',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان الأثاث',
          x: 70,
          y: 205,
          width: 340,
          height: 90,
          content: 'معرض البيت الأنيق للأثاث المنزلي — راحة تدوم وجمال يلفت الأنظار',
          styles: { fontSize: 22, color: col.text, fontWeight: 'bold', fontFamily: 'Almarai', textAlign: 'right', lineHeight: 1.35 }
        },
        {
          type: 'paragraph',
          name: 'نص الأثاث',
          x: 70,
          y: 310,
          width: 340,
          height: 110,
          content: 'نوفر تشكيلة واسعة من الأثاث المنزلي والمكتبي بتصاميم عصرية وخامات متينة تناسب جميع الأذواق والمساحات، مع خدمة تركيب وتوصيل مجانية داخل المدينة.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر تصفح الأثاث',
          x: 70,
          y: 430,
          width: 220,
          height: 40,
          content: 'تصفح تشكيلة الأثاث',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 3) {
      // Home Cooking (طبخ منزلي)
      elements = [
        {
          type: 'image',
          name: 'خلفية كاملة - طبخ منزلي',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/danielle-suijkerbuijk-Eza6E_v2ZYo-unsplash.jpg',
          imageUrl: '/Library/danielle-suijkerbuijk-Eza6E_v2ZYo-unsplash.jpg',
          styles: { objectFit: 'cover', opacity: 0.2 }
        },
        {
          type: 'shape',
          name: 'قلب زخرفي صغير',
          x: 650,
          y: 380,
          width: 90,
          height: 90,
          clipPath: 'clip-shape-heart',
          content: 'heart',
          styles: { backgroundColor: 'rgba(255,149,0,0.18)' }
        },
        {
          type: 'image',
          name: 'صورة طبخ منزلي بإطار أبيض',
          x: 480,
          y: 70,
          width: 270,
          height: 270,
          content: '/Library/mae-mu-rgRbqFweGF0-unsplash.jpg',
          imageUrl: '/Library/mae-mu-rgRbqFweGF0-unsplash.jpg',
          styles: { objectFit: 'cover', borderRadius: 9999, borderWidth: 6, borderColor: '#ffffff', glowIntensity: 22, glowColor: 'rgba(0,0,0,0.16)', glowPosition: 'bottom', animation: 'fade', animationTrigger: 'once', animationDuration: 1 }
        },
        {
          type: 'shape',
          name: 'لوحة قصة الطبخ',
          x: 40,
          y: 150,
          width: 400,
          height: 320,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 18, glowColor: 'rgba(255,149,0,0.14)', glowPosition: 'bottom' }
        },
        {
          type: 'badge',
          name: 'شارة نكهة البيت',
          x: 70,
          y: 180,
          width: 220,
          height: 30,
          content: 'نكهة البيت الأصيلة',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان الطبخ المنزلي',
          x: 70,
          y: 225,
          width: 340,
          height: 90,
          content: 'مطبخ الأصالة المنزلي — طعم بيتنا في بيتك',
          styles: { fontSize: 24, color: col.text, fontWeight: 'bold', fontFamily: 'Marhey', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص الطبخ المنزلي',
          x: 70,
          y: 330,
          width: 340,
          height: 100,
          content: 'نحضّر أطباقنا يوميًا بأيدٍ منزلية خبيرة من مكونات طبيعية طازجة، لنوصل لك نكهة البيت الحقيقية لحفلاتك وولائمك ووجباتك اليومية بثقة وجودة.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر طلب وجبة منزلية',
          x: 70,
          y: 440,
          width: 220,
          height: 44,
          content: 'اطلب وجبتك المنزلية',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 4) {
      // Painter (دهان)
      elements = [
        {
          type: 'shape',
          name: 'لطخة فرشاة صورة الدهان',
          x: 460,
          y: 60,
          width: 320,
          height: 320,
          clipPath: 'clip-shape-brush-splatter',
          content: 'splatter',
          styles: { backgroundImage: '/Library/david-pisnoy-46juD4zY1XA-unsplash.jpg', backgroundSize: 'cover' }
        },
        {
          type: 'shape',
          name: 'عينة لون 1',
          x: 650,
          y: 400,
          width: 50,
          height: 50,
          styles: { backgroundColor: col.accent, borderRadius: 10 }
        },
        {
          type: 'shape',
          name: 'عينة لون 2',
          x: 710,
          y: 400,
          width: 50,
          height: 50,
          styles: { backgroundColor: col.bgShape, borderRadius: 10 }
        },
        {
          type: 'shape',
          name: 'لوحة قصة الدهان',
          x: 40,
          y: 130,
          width: 400,
          height: 350,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 20, glowColor: 'rgba(191,90,242,0.16)', glowPosition: 'bottom' }
        },
        {
          type: 'badge',
          name: 'شارة الدهانات',
          x: 70,
          y: 160,
          width: 270,
          height: 30,
          content: 'دهانات داخلية وخارجية بجودة عالية',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان الدهان',
          x: 70,
          y: 205,
          width: 340,
          height: 90,
          content: 'فرشاة الإبداع للدهانات — ألوان تعيد الحياة لمساحتك',
          styles: { fontSize: 23, color: col.text, fontWeight: 'bold', fontFamily: 'Reem Kufi', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص الدهان',
          x: 70,
          y: 310,
          width: 340,
          height: 110,
          content: 'ننفذ أعمال الدهان الداخلي والخارجي للفلل والشقق والمحال التجارية بأحدث تقنيات الديكورات والدهانات العازلة، مع ضمان جودة التنفيذ ونظافة الموقع بعد الانتهاء.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر معاينة الدهان',
          x: 70,
          y: 430,
          width: 220,
          height: 40,
          content: 'اطلب معاينة مجانية',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    }
 else if (index === 5) {
      // Electronics Repair (صيانة إلكترونيات)
      elements = [
        {
          type: 'image',
          name: 'خلفية كاملة - صيانة إلكترونيات',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/shapelined-iU61cR0uyEw-unsplash.jpg',
          imageUrl: '/Library/shapelined-iU61cR0uyEw-unsplash.jpg',
          styles: { objectFit: 'cover', opacity: 0.2 }
        },
        {
          type: 'shape',
          name: 'إطار سداسي صيانة الإلكترونيات',
          x: 450,
          y: 60,
          width: 300,
          height: 300,
          content: 'frame',
          styles: { backgroundColor: 'transparent', borderWidth: 3, borderColor: col.accent, borderRadius: 20 }
        },
        {
          type: 'image',
          name: 'صورة صيانة الأجهزة',
          x: 470,
          y: 80,
          width: 260,
          height: 260,
          content: '/Library/trophim-laptev-EuT-zxm2RY8-unsplash.jpg',
          imageUrl: '/Library/trophim-laptev-EuT-zxm2RY8-unsplash.jpg',
          clipPath: 'clip-shape-geo-hexagon',
          styles: { objectFit: 'cover' }
        },
        {
          type: 'shape',
          name: 'لوحة قصة الإلكترونيات',
          x: 40,
          y: 140,
          width: 380,
          height: 330,
          styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 26, glowColor: 'rgba(48,209,88,0.2)', glowPosition: 'bottom', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
        },
        {
          type: 'badge',
          name: 'شارة الصيانة الاحترافية',
          x: 70,
          y: 170,
          width: 270,
          height: 30,
          content: 'صيانة احترافية لجميع الأجهزة',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان الإلكترونيات',
          x: 70,
          y: 215,
          width: 320,
          height: 90,
          content: 'مركز التقنية الذكية لصيانة الإلكترونيات — إصلاح دقيق بضمان حقيقي',
          styles: { fontSize: 21, color: '#ffffff', fontWeight: 'bold', fontFamily: 'Harmattan', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص الإلكترونيات',
          x: 70,
          y: 315,
          width: 320,
          height: 110,
          content: 'نصلّح الهواتف والحاسبات والأجهزة المنزلية الإلكترونية على يد فنيين معتمدين باستخدام قطع غيار أصلية، مع فحص مجاني وتسليم سريع خلال نفس اليوم.',
          styles: { fontSize: 12, color: '#a1a1a6', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر طلب فني صيانة إلكترونيات',
          x: 70,
          y: 440,
          width: 190,
          height: 44,
          content: 'اطلب فني صيانة',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold', animation: 'pulse', animationTrigger: 'loop', animationDuration: 2 }
        }
      ];
    } else if (index === 6) {
      // Wholesale Trade (تجارة بالجملة)
      elements = [
        { type: 'shape', name: 'صندوق زخرفي 1', x: -30, y: 440, width: 130, height: 90, styles: { backgroundColor: col.bgShape, borderRadius: 10 } },
        { type: 'shape', name: 'صندوق زخرفي 2', x: 60, y: 480, width: 110, height: 70, styles: { backgroundColor: 'rgba(22,163,74,0.14)', borderRadius: 10 } },
        {
          type: 'shape',
          name: 'كبسولة صورة المستودع',
          x: 460,
          y: 200,
          width: 300,
          height: 240,
          clipPath: 'clip-shape-geo-capsule',
          content: 'capsule',
          styles: { backgroundImage: '/Library/scottsdale-mint-dk067dlyYk4-unsplash.jpg', backgroundSize: 'cover' }
        },
        {
          type: 'shape',
          name: 'لوحة قصة الجملة',
          x: 40,
          y: 120,
          width: 400,
          height: 360,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 18, glowColor: 'rgba(22,163,74,0.15)', glowPosition: 'bottom' }
        },
        {
          type: 'badge',
          name: 'شارة أسعار الجملة',
          x: 70,
          y: 150,
          width: 280,
          height: 30,
          content: 'أسعار جملة تنافسية لكل القطاعات',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان تجارة الجملة',
          x: 70,
          y: 195,
          width: 340,
          height: 90,
          content: 'مستودعات الوفرة للتجارة بالجملة — كمية وثقة بلا حدود',
          styles: { fontSize: 22, color: col.text, fontWeight: 'bold', fontFamily: 'Katibeh', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص تجارة الجملة',
          x: 70,
          y: 300,
          width: 340,
          height: 110,
          content: 'نورّد مختلف أنواع البضائع والمستلزمات التجارية بكميات كبيرة وأسعار تنافسية مباشرة من المصدر، مع خدمة شحن وتوصيل منظمة لكل تجار التجزئة والمشاريع.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر تواصل الجملة',
          x: 70,
          y: 410,
          width: 220,
          height: 40,
          content: 'تواصل لعروض الجملة',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 7) {
      // Social Development Services (تطوير وخدمات اجتماعية)
      elements = [
        {
          type: 'shape',
          name: 'بتلة زخرفية علوية',
          x: -40,
          y: -40,
          width: 250,
          height: 250,
          clipPath: 'clip-shape-petal',
          content: 'petal',
          styles: { backgroundColor: col.bgShape }
        },
        {
          type: 'image',
          name: 'صورة برامج التنمية المجتمعية',
          x: 470,
          y: 200,
          width: 280,
          height: 280,
          content: '/Library/nasser-eledroos-456Ct_hXg7U-unsplash.jpg',
          imageUrl: '/Library/nasser-eledroos-456Ct_hXg7U-unsplash.jpg',
          clipPath: 'clip-shape-geo-circle',
          styles: { objectFit: 'cover' }
        },
        {
          type: 'shape',
          name: 'لوحة قصة التطوير المجتمعي',
          x: 40,
          y: 120,
          width: 400,
          height: 360,
          styles: { backgroundColor: col.card, borderRadius: 26, glowIntensity: 22, glowColor: 'rgba(124,58,237,0.16)', glowPosition: 'bottom', borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.18)' }
        },
        {
          type: 'badge',
          name: 'شارة البرامج المجتمعية',
          x: 70,
          y: 150,
          width: 260,
          height: 30,
          content: 'برامج تطوير وخدمات مجتمعية',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان التطوير المجتمعي',
          x: 70,
          y: 195,
          width: 340,
          height: 90,
          content: 'مؤسسة الأثر الإيجابي للتطوير المجتمعي — نصنع التغيير معًا',
          styles: { fontSize: 22, color: col.text, fontWeight: 'bold', fontFamily: 'Lateef', textAlign: 'right', lineHeight: 1.35 }
        },
        {
          type: 'paragraph',
          name: 'نص التطوير المجتمعي',
          x: 70,
          y: 300,
          width: 340,
          height: 110,
          content: 'نعمل مع الأفراد والمجتمعات المحلية على تصميم وتنفيذ برامج تدريبية وتنموية واجتماعية تخدم الفئات الأكثر حاجة، بشراكات فعالة ونتائج ملموسة على الأرض.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر برامج التطوير',
          x: 70,
          y: 420,
          width: 210,
          height: 44,
          content: 'تعرف على برامجنا',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 8) {
      // Blacksmith (حداد)
      elements = [
        {
          type: 'image',
          name: 'خلفية كاملة - ورشة الحدادة',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          content: '/Library/buddha-elemental-3d-BzJczbqqiBI-unsplash.jpg',
          imageUrl: '/Library/buddha-elemental-3d-BzJczbqqiBI-unsplash.jpg',
          styles: { objectFit: 'cover', opacity: 0.25 }
        },
        {
          type: 'shape',
          name: 'إطار ثماني الحدادة',
          x: 450,
          y: 50,
          width: 320,
          height: 320,
          content: 'frame',
          styles: { backgroundColor: 'transparent', borderWidth: 4, borderColor: col.accent, borderRadius: 24 }
        },
        {
          type: 'image',
          name: 'صورة أعمال الحدادة',
          x: 470,
          y: 70,
          width: 280,
          height: 280,
          content: '/Library/trophim-laptev-tzs6YfTZ2ps-unsplash.jpg',
          imageUrl: '/Library/trophim-laptev-tzs6YfTZ2ps-unsplash.jpg',
          clipPath: 'clip-shape-geo-octagon',
          styles: { objectFit: 'cover' }
        },
        {
          type: 'shape',
          name: 'لوحة قصة الحدادة',
          x: 40,
          y: 140,
          width: 390,
          height: 330,
          styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 22, glowColor: 'rgba(234,88,12,0.18)', glowPosition: 'bottom' }
        },
        {
          type: 'badge',
          name: 'شارة الحدادة الفنية',
          x: 70,
          y: 170,
          width: 230,
          height: 30,
          content: 'أعمال حدادة فنية ودقيقة',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان الحدادة',
          x: 70,
          y: 215,
          width: 330,
          height: 90,
          content: 'ورشة اللهب للحدادة الفنية — قوة الحديد بلمسة إبداعية',
          styles: { fontSize: 23, color: col.text, fontWeight: 'bold', fontFamily: 'Mirza', textAlign: 'right', lineHeight: 1.3 }
        },
        {
          type: 'paragraph',
          name: 'نص الحدادة',
          x: 70,
          y: 320,
          width: 330,
          height: 100,
          content: 'ننفّذ بوابات ودرابزين وأعمال حدادة فنية ومعمارية بدقة واحترافية عالية، من التصميم حتى التركيب النهائي، باستخدام أجود أنواع الحديد والخامات المعتمدة.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر طلب تصميم حدادة',
          x: 70,
          y: 430,
          width: 220,
          height: 40,
          content: 'اطلب تصميم حدادة',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    } else if (index === 9) {
      // Construction Equipment & Tool Rental (معدات بناء وتأجير عدد)
      elements = [
        {
          type: 'shape',
          name: 'مثلث زخرفي زاوية سفلية',
          x: -30,
          y: 440,
          width: 170,
          height: 170,
          clipPath: 'clip-shape-geo-triangle',
          content: 'triangle',
          styles: { backgroundColor: col.bgShape }
        },
        {
          type: 'shape',
          name: 'إطار سداسي معدات البناء',
          x: 440,
          y: 40,
          width: 340,
          height: 340,
          content: 'frame',
          styles: { backgroundColor: 'transparent', borderWidth: 2, borderColor: col.accent, borderRadius: 20 }
        },
        {
          type: 'shape',
          name: 'سداسي صورة المعدات',
          x: 460,
          y: 60,
          width: 300,
          height: 300,
          clipPath: 'clip-shape-geo-hexagon',
          content: 'hexagon',
          styles: { backgroundImage: '/Library/tim-arterbury-hsztMXLuC6s-unsplash.jpg', backgroundSize: 'cover' }
        },
        {
          type: 'shape',
          name: 'لوحة قصة معدات البناء',
          x: 40,
          y: 130,
          width: 400,
          height: 350,
          styles: { backgroundColor: col.card, borderRadius: 22, glowIntensity: 18, glowColor: 'rgba(71,85,105,0.14)', glowPosition: 'bottom', borderWidth: 1, borderColor: 'rgba(71,85,105,0.12)' }
        },
        {
          type: 'badge',
          name: 'شارة تأجير المعدات',
          x: 70,
          y: 160,
          width: 280,
          height: 30,
          content: 'تأجير معدات وعدد بناء متكاملة',
          styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'عنوان معدات البناء',
          x: 70,
          y: 205,
          width: 340,
          height: 90,
          content: 'مجموعة الإنشاء الحديثة لتأجير المعدات — قوة العمل بين يديك',
          styles: { fontSize: 21, color: col.text, fontWeight: 'bold', fontFamily: 'Markazi Text', textAlign: 'right', lineHeight: 1.35 }
        },
        {
          type: 'paragraph',
          name: 'نص معدات البناء',
          x: 70,
          y: 305,
          width: 340,
          height: 110,
          content: 'نوفر تأجير معدات ورافعات وعدد بناء متنوعة بحالة فنية ممتازة لجميع مشاريع الإنشاء والمقاولات، مع صيانة دورية وفرق دعم فني متواجدة على مدار الأسبوع.',
          styles: { fontSize: 12, color: '#636366', textAlign: 'right', lineHeight: 1.6 }
        },
        {
          type: 'button',
          name: 'زر طلب عرض تأجير',
          x: 70,
          y: 420,
          width: 220,
          height: 44,
          content: 'اطلب عرض تأجير',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    }
  }

  // ==========================================
  // SPECIAL OFFER SLIDES (شريحة عرض خاص)
  // ==========================================
  else if (categoryId === 'special_offer') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      // Overlapping shapes to represent discount coupon background (System Layering)
      {
        type: 'shape',
        name: 'شكل تراكبي مدمج ملون',
        x: 60,
        y: 80,
        width: 680,
        height: 420,
        styles: { backgroundColor: col.card, borderRadius: 32, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom', borderColor: col.accent + '30', borderWidth: 1.5 }
      },
      // Dotted/Dashed coupon divider
      {
        type: 'divider',
        name: 'فاصل الكوبون المنقط',
        x: 500,
        y: 110,
        width: 1,
        height: 360,
        styles: { borderColor: col.accent + '40', borderWidth: 2 }
      },
      // Left side of coupon (discount and code)
      {
        type: 'heading',
        name: 'نسبة الحسم',
        x: 520,
        y: 150,
        width: 200,
        height: 80,
        content: '%50 حسم',
        styles: { fontSize: 36, color: col.accent, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'تاريخ الصلاحية',
        x: 520,
        y: 240,
        width: 200,
        height: 40,
        content: 'ساري حتى نهاية الأسبوع الحالي',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center' }
      },
      {
        type: 'shape',
        name: 'رمز الكوبون الإنشائي',
        x: 530,
        y: 290,
        width: 180,
        height: 46,
        styles: { backgroundColor: col.bgShape, borderRadius: 12, borderColor: col.accent + '25', borderWidth: 1 }
      },
      {
        type: 'heading',
        name: 'نص الكوبون',
        x: 540,
        y: 300,
        width: 160,
        height: 30,
        content: 'WEELINK50',
        styles: { fontSize: 15, color: col.accent, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'button',
        name: 'زر نسخ الكوبون',
        x: 530,
        y: 360,
        width: 180,
        height: 44,
        content: 'احجز العرض فوراً 🎁',
        styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
      },
      // Right side of coupon (offer title & description)
      {
        type: 'badge',
        name: 'شارة العرض',
        x: 100,
        y: 130,
        width: 130,
        height: 28,
        content: '✦ عروض حصرية ومغرية',
        styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 8, textAlign: 'center' }
      },
      {
        type: 'heading',
        name: 'عنوان العرض الخاص',
        x: 100,
        y: 175,
        width: 380,
        height: 90,
        content: 'باقة الويب الفضية المتكاملة بنصف السعر!',
        styles: { fontSize: 26, color: col.text, fontWeight: 'bold', textAlign: 'right', lineHeight: 1.3 }
      },
      {
        type: 'paragraph',
        name: 'تفاصيل العرض الخاص',
        x: 100,
        y: 280,
        width: 380,
        height: 140,
        content: 'احصل الآن على تصميم موقعك مع نطاق مجاني، واستضافة سحابية سريعة، وربط مباشر برقم الواتساب والفيسبوك الخاص بمشروعك، بالإضافة لتدريب كامل ومجاني ومستندات حية لتعديل محتوى الصفحة بنقرة إصبع واحدة ميسرة.',
        styles: { fontSize: 13, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
      }
    ];
  }

  // ==========================================
  // PRICE LIST SLIDES (شريحة قائمة أسعار)
  // ==========================================
  else if (categoryId === 'prices') {
    if (index % 2 === 0) {
      // 3 Elegant Pricing Tiers side-by-side (Bronze, Silver, Gold with Bullets)
      elements = [
        {
          type: 'shape',
          name: 'خلفية الصفحة',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          styles: { backgroundColor: col.bg, borderRadius: 0 }
        },
        {
          type: 'badge',
          name: 'شارة التسعير المتاحة',
          x: 280,
          y: 40,
          width: 240,
          height: 30,
          content: '✦ باقات أسعار مدروسة تناسب الجميع',
          styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 8, textAlign: 'center' }
        },
        {
          type: 'heading',
          name: 'عنوان الباقات',
          x: 100,
          y: 80,
          width: 600,
          height: 50,
          content: 'خطط اشتراك شفافة بلا رسوم خفية',
          styles: { fontSize: 22, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        // Tier 1 (Bronze)
        {
          type: 'shape',
          name: 'بطاقة الباقة البرونزية',
          x: 40,
          y: 150,
          width: 220,
          height: 370,
          styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'اسم باقة 1',
          x: 60,
          y: 175,
          width: 180,
          height: 30,
          content: 'الباقة الاقتصادية',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'heading',
          name: 'سعر باقة 1',
          x: 60,
          y: 210,
          width: 180,
          height: 45,
          content: '15,000 ل.س',
          styles: { fontSize: 24, color: col.accent, fontWeight: 'black', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'ميزات باقة 1',
          x: 55,
          y: 265,
          width: 190,
          height: 170,
          content: '✦ شريحة عرض رئيسية واحدة\n✦ ربط مباشر برقم الواتساب\n✦ قالب عصري متناسق الألوان\n✦ تعديل فوري لبياناتك وصورك\n• استضافة مجانية مستقرة',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.8 }
        },
        {
          type: 'button',
          name: 'زر باقة 1',
          x: 60,
          y: 450,
          width: 180,
          height: 44,
          content: 'اختر الباقة الأساسية',
          styles: { fontSize: 12, backgroundColor: col.text + '10', color: col.text, borderRadius: 12, textAlign: 'center' }
        },

        // Tier 2 (Silver - Most Popular, Highlighted Accent)
        {
          type: 'shape',
          name: 'بطاقة الباقة الفضية الأكثر شعبية',
          x: 290,
          y: 135,
          width: 220,
          height: 400,
          styles: { backgroundColor: col.bgShape, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom', borderColor: col.accent + '40', borderWidth: 2 }
        },
        {
          type: 'badge',
          name: 'شارة الأكثر طلباً',
          x: 340,
          y: 150,
          width: 120,
          height: 22,
          content: '🔥 الأكثر شعبية وطلباً',
          styles: { fontSize: 9, backgroundColor: col.accent, color: '#ffffff', borderRadius: 6, textAlign: 'center', fontWeight: 'bold' }
        },
        {
          type: 'heading',
          name: 'اسم باقة 2',
          x: 310,
          y: 185,
          width: 180,
          height: 30,
          content: 'الباقة الاحترافية الفضية',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'heading',
          name: 'سعر باقة 2',
          x: 310,
          y: 220,
          width: 180,
          height: 45,
          content: '30,000 ل.س',
          styles: { fontSize: 24, color: col.accent, fontWeight: 'black', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'ميزات باقة 2',
          x: 305,
          y: 275,
          width: 190,
          height: 170,
          content: '✦ 5 شرائح ويب مسبقة التنسيق\n✦ معرض صور الأعمال وعروضك\n✦ قائمة أسعار تفصيلية منوعة\n✦ دعم سيو (SEO) محركات البحث\n✦ دعم تصفح الأوفلاين السريع',
          styles: { fontSize: 11, color: col.text, textAlign: 'right', lineHeight: 1.8 }
        },
        {
          type: 'button',
          name: 'زر باقة 2',
          x: 310,
          y: 465,
          width: 180,
          height: 46,
          content: 'ابدأ بالباقة الفضية ✦',
          styles: { fontSize: 12, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
        },

        // Tier 3 (Gold)
        {
          type: 'shape',
          name: 'بطاقة الباقة الذهبية الشاملة',
          x: 540,
          y: 150,
          width: 220,
          height: 370,
          styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
        },
        {
          type: 'heading',
          name: 'اسم باقة 3',
          x: 560,
          y: 175,
          width: 180,
          height: 30,
          content: 'الباقة الذهبية الملكية',
          styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'heading',
          name: 'سعر باقة 3',
          x: 560,
          y: 210,
          width: 180,
          height: 45,
          content: '55,000 ل.س',
          styles: { fontSize: 24, color: col.accent, fontWeight: 'black', textAlign: 'center' }
        },
        {
          type: 'paragraph',
          name: 'ميزات باقة 3',
          x: 555,
          y: 265,
          width: 190,
          height: 170,
          content: '✦ عدد صفحات ويب غير محدود\n✦ نموذج تواصل وخارطة مع pin\n✦ ميزة الترقيم وجداول المقارنة\n✦ شهادة حماية وأمان سحابية SSL\n✦ دعم فني هاتفي متاح 24/7',
          styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.8 }
        },
        {
          type: 'button',
          name: 'زر باقة 3',
          x: 560,
          y: 450,
          width: 180,
          height: 44,
          content: 'امتلك الباقة الملكية',
          styles: { fontSize: 12, backgroundColor: col.text + '10', color: col.text, borderRadius: 12, textAlign: 'center' }
        }
      ];
    } else {
      // Pricing Table View (Layout 5)
      elements = [
        {
          type: 'shape',
          name: 'خلفية الشريحة',
          x: 0,
          y: 0,
          width: 800,
          height: 580,
          styles: { backgroundColor: col.bg, borderRadius: 0 }
        },
        {
          type: 'badge',
          name: 'شارة جدول مقارنة الأسعار',
          x: 280,
          y: 40,
          width: 240,
          height: 30,
          content: '📊 جدول تسعير تفصيلي مقارن للخدمات',
          styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 8, textAlign: 'center' }
        },
        {
          type: 'heading',
          name: 'عنوان جدول الأسعار',
          x: 100,
          y: 85,
          width: 600,
          height: 45,
          content: 'قارن ميزات خططنا واختر الأمثل لأعمالك',
          styles: { fontSize: 20, color: col.text, fontWeight: 'bold', textAlign: 'center' }
        },
        {
          type: 'table',
          name: 'جدول مقارنة الأسعار التفصيلي',
          x: 50,
          y: 150,
          width: 700,
          height: 310,
          content: 'الميزات والخدمات المتاحة|الباقة الفضية|الباقة الذهبية الممتازة\nتصميم الصفحات والنماذج|حتى 5 صفحات متصلة|عدد صفحات وشرائح غير محدود\nاستضافة نطاق (.com)|متوفر برسوم سنوية بسيطة|مجاني ومسجل بالكامل للسنة الأولى\nدعم فني وتطوير متكامل|بريد إلكتروني وواتساب|دعم هاتفي ولقاءات زوم مخصصة\nأنظمة الدفع والطلبات|نموذج دفع يدوي بسيط|عربة تسوق وكتالوج منتجات منوع\nقيمة الإشتراك الكلي|30,000 ل.س / ساري|55,000 ل.س / ساري',
          styles: { fontSize: 12, backgroundColor: col.card, borderColor: col.text + '15', borderWidth: 1 }
        },
        {
          type: 'button',
          name: 'زر للتواصل تحت الجدول',
          x: 300,
          y: 490,
          width: 200,
          height: 44,
          content: 'تواصل مع مستشارينا 💬',
          styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
        }
      ];
    }
  }

  // ==========================================
  // OUR TEAM SLIDES (شريحة فريق العمل)
  // ==========================================
  else if (categoryId === 'team') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      {
        type: 'badge',
        name: 'شارة الفريق',
        x: 280,
        y: 50,
        width: 240,
        height: 32,
        content: '👥 العقول المبدعة خلف كواليس نجاحك',
        styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center' }
      },
      {
        type: 'heading',
        name: 'عنوان فريق العمل',
        x: 80,
        y: 100,
        width: 640,
        height: 50,
        content: 'مهندسو البرمجيات ومصممو واجهات المستخدم',
        styles: { fontSize: 24, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      // 3 side-by-side circular executive profiles with same-color overlapping shield background
      {
        type: 'shape',
        name: 'خلفية عضو فريق 1',
        x: 50,
        y: 180,
        width: 220,
        height: 320,
        styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'image',
        name: 'صورة عضو 1',
        x: 100,
        y: 210,
        width: 120,
        height: 120,
        content: getImg('team', 0),
        styles: { borderRadius: 60, objectFit: 'cover' }
      },
      {
        type: 'heading',
        name: 'اسم عضو 1',
        x: 70,
        y: 350,
        width: 180,
        height: 28,
        content: 'المهندس مصطفى الصالح',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'منصب عضو 1',
        x: 70,
        y: 385,
        width: 180,
        height: 80,
        content: 'مدير قسم تطوير الواجهات السحابية\nخبرة 8 سنوات في رياكت والربط السريع للبيانات السحابية.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.5 }
      },

      {
        type: 'shape',
        name: 'خلفية عضو فريق 2',
        x: 290,
        y: 180,
        width: 220,
        height: 320,
        styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'image',
        name: 'صورة عضو 2',
        x: 340,
        y: 210,
        width: 120,
        height: 120,
        content: getImg('team', 1),
        styles: { borderRadius: 60, objectFit: 'cover' }
      },
      {
        type: 'heading',
        name: 'اسم عضو 2',
        x: 310,
        y: 350,
        width: 180,
        height: 28,
        content: 'الآنسة دينا العلي',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'منصب عضو 2',
        x: 310,
        y: 385,
        width: 180,
        height: 80,
        content: 'رئيسة قسم تصميم تجربة المستخدم (UI/UX)\nمهندسة معمارية تدمج الفراغات الجمالية بأرقى تصاميم الويب.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.5 }
      },

      {
        type: 'shape',
        name: 'خلفية عضو فريق 3',
        x: 530,
        y: 180,
        width: 220,
        height: 320,
        styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'image',
        name: 'صورة عضو 3',
        x: 580,
        y: 210,
        width: 120,
        height: 120,
        content: getImg('team', 2),
        styles: { borderRadius: 60, objectFit: 'cover' }
      },
      {
        type: 'heading',
        name: 'اسم عضو 3',
        x: 550,
        y: 350,
        width: 180,
        height: 28,
        content: 'الأستاذ أحمد الحلبي',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'منصب عضو 3',
        x: 550,
        y: 385,
        width: 180,
        height: 80,
        content: 'أخصائي سيو وتسويق رقمي سحابي\nيسهل ظهور موقعك بالصفحات الأولى بمهارة وتطوير متقن.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.5 }
      }
    ];
  }

  // ==========================================
  // CONTACT SLIDES (شريحة تواصل)
  // ==========================================
  else if (categoryId === 'contact') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      // Left side: map element with overlapping pin card
      {
        type: 'map',
        name: 'الموقع الجغرافي وخارطة التواجد',
        x: 40,
        y: 110,
        width: 380,
        height: 380,
        content: 'دمشق، سوريا',
        styles: { borderRadius: 28, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      // Right side: beautiful structured layout (inputs & contact info)
      {
        type: 'badge',
        name: 'شارة اتصل بنا',
        x: 450,
        y: 80,
        width: 140,
        height: 28,
        content: '📞 قنوات اتصال مفتوحة فورا',
        styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 8, textAlign: 'center' }
      },
      {
        type: 'heading',
        name: 'عنوان شريحة تواصل',
        x: 450,
        y: 120,
        width: 310,
        height: 80,
        content: 'لا تتردد في مراسلتنا وسنجيبك في الحال',
        styles: { fontSize: 24, color: col.text, fontWeight: 'bold', textAlign: 'right', lineHeight: 1.3 }
      },
      {
        type: 'paragraph',
        name: 'أرقام وإيميلات تواصلنا',
        x: 450,
        y: 215,
        width: 310,
        height: 110,
        content: '✦ بريدنا الإلكتروني: info@weelink.com\n✦ رقم الواتساب المباشر: +963 993 456 789\n✦ هاتف الدعم الفني السريع: 011 234 5678\n• العنوان: دمشق، ساحة المحافظة، برج النصر التجاري',
        styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 2 }
      },
      // Dynamic WhatsApp Direct CTA button
      {
        type: 'button',
        name: 'زر الواتساب المباشر',
        x: 450,
        y: 350,
        width: 310,
        height: 48,
        content: 'دردش معنا عبر الواتساب الآن 💬',
        styles: { fontSize: 14, backgroundColor: '#25d366', color: '#ffffff', borderRadius: 14, textAlign: 'center', fontWeight: 'bold' }
      },
      {
        type: 'button',
        name: 'زر تواصل تقليدي',
        x: 450,
        y: 415,
        width: 310,
        height: 46,
        content: 'أرسل لنا طلباً مخصصاً ✉️',
        styles: { fontSize: 13, backgroundColor: 'transparent', color: col.text, borderRadius: 14, borderWidth: 1.5, borderColor: col.text + '30', textAlign: 'center' }
      }
    ];
  }

  // ==========================================
  // FEATURES SLIDES (شريحة تعريفية / مميزات)
  // ==========================================
  else if (categoryId === 'features') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      {
        type: 'badge',
        name: 'شارة الميزات',
        x: 280,
        y: 50,
        width: 240,
        height: 32,
        content: '💡 نمنحك كافة حلول النجاح الإلكتروني المتكاملة',
        styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
      },
      {
        type: 'heading',
        name: 'عنوان مميزاتنا',
        x: 80,
        y: 100,
        width: 640,
        height: 50,
        content: 'لماذا يختار رواد الأعمال منصة وي لينك؟',
        styles: { fontSize: 24, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      // Grid of 4 beautifully stylized, overlapping same-color feature boxes (2x2 Column Format)
      {
        type: 'shape',
        name: 'مربع ميزة 1',
        x: 50,
        y: 170,
        width: 330,
        height: 150,
        styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'heading',
        name: 'عنوان ميزة 1',
        x: 70,
        y: 190,
        width: 290,
        height: 30,
        content: '✦ البساطة الفائقة للتعديل المباشر',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
      },
      {
        type: 'paragraph',
        name: 'نص ميزة 1',
        x: 70,
        y: 225,
        width: 290,
        height: 80,
        content: 'المنصة لا تحتاج لأي خبرة سابقة في كتابة الأكواد البرمجية. بالنقر المزدوج البسيط غير كل الكلمات والصور لحظياً.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.5 }
      },

      {
        type: 'shape',
        name: 'مربع ميزة 2',
        x: 420,
        y: 170,
        width: 330,
        height: 150,
        styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'heading',
        name: 'عنوان ميزة 2',
        x: 440,
        y: 190,
        width: 290,
        height: 30,
        content: '✦ سرعة صاروخية تحت أي ضغط شبكي',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
      },
      {
        type: 'paragraph',
        name: 'نص ميزة 2',
        x: 440,
        y: 225,
        width: 290,
        height: 80,
        content: 'خوادمنا السحابية فائقة السرعة تتيح لصفحتك أن تفتح في أقل من ثانية واحدة تحت أي سرعة إنترنت متوفرة بالمنطقة.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.5 }
      },

      {
        type: 'shape',
        name: 'مربع ميزة 3',
        x: 50,
        y: 350,
        width: 330,
        height: 150,
        styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'heading',
        name: 'عنوان ميزة 3',
        x: 70,
        y: 370,
        width: 290,
        height: 30,
        content: '✦ توافقية مطلقة مع كافة الشاشات',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
      },
      {
        type: 'paragraph',
        name: 'نص ميزة 3',
        x: 70,
        y: 405,
        width: 290,
        height: 80,
        content: 'تصميمك يمتد وينكمش تلقائياً وبأقصى درجات الذكاء الهندسي ليكون فائق الجمال على الهواتف اللوحية والحواسب بدقة.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.5 }
      },

      {
        type: 'shape',
        name: 'مربع ميزة 4',
        x: 420,
        y: 350,
        width: 330,
        height: 150,
        styles: { backgroundColor: col.card, borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'heading',
        name: 'عنوان ميزة 4',
        x: 440,
        y: 370,
        width: 290,
        height: 30,
        content: '✦ حماية واستقرار سحابي دائم',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'right' }
      },
      {
        type: 'paragraph',
        name: 'نص ميزة 4',
        x: 440,
        y: 405,
        width: 290,
        height: 80,
        content: 'نؤمن موقعك بشهادات أمان عالمية وجدران نارية لحماية تواصل عملائك مع خوادم جوجل المتطورة بأمان مطلق.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.5 }
      }
    ];
  }

  // ==========================================
  // GALLERY SLIDES (شريحة معرض صور)
  // ==========================================
  else if (categoryId === 'gallery') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      {
        type: 'badge',
        name: 'شارة معرض الصور',
        x: 280,
        y: 40,
        width: 240,
        height: 30,
        content: '🖼️ معرض الصور — استعرض إبداعنا وإنجازاتنا الملموسة',
        styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 8, textAlign: 'center' }
      },
      {
        type: 'heading',
        name: 'عنوان المعرض',
        x: 100,
        y: 85,
        width: 600,
        height: 45,
        content: 'لمحات بصرية من أرشيف أعمالنا المتميزة',
        styles: { fontSize: 22, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      // Beautiful overlapping staggered collage (tilted and structured)
      {
        type: 'image',
        name: 'صورة المعرض اليسرى',
        x: 40,
        y: 150,
        width: 220,
        height: 320,
        content: getImg('gallery', 0),
        styles: { borderRadius: 20, objectFit: 'cover', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'image',
        name: 'صورة المعرض الوسطى المرتفعة الكبيرة',
        x: 280,
        y: 135,
        width: 240,
        height: 350,
        content: getImg('gallery', 1),
        styles: { borderRadius: 24, objectFit: 'cover', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom', borderColor: col.accent, borderWidth: 1.5 }
      },
      {
        type: 'image',
        name: 'صورة المعرض اليمنى',
        x: 540,
        y: 150,
        width: 220,
        height: 320,
        content: getImg('gallery', 2),
        styles: { borderRadius: 20, objectFit: 'cover', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'paragraph',
        name: 'وصف معرض الصور',
        x: 150,
        y: 505,
        width: 500,
        height: 50,
        content: 'يمكنك إدراج صور منوعة لأطباق مطعمك، تصاميمك الهندسية، أو صور لمنتجات متجرك الإلكتروني وتغييرها بلحظات.',
        styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center', lineHeight: 1.4 }
      }
    ];
  }

  // ==========================================
  // TABLE SLIDES (شريحة جدول)
  // ==========================================
  else if (categoryId === 'table') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      {
        type: 'badge',
        name: 'شارة جدول البيانات',
        x: 280,
        y: 50,
        width: 240,
        height: 32,
        content: '📊 جداول الإحصاءات والبيانات والخصائص المقارنة',
        styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
      },
      {
        type: 'heading',
        name: 'العنوان لجدول البيانات',
        x: 80,
        y: 100,
        width: 640,
        height: 50,
        content: 'جدول تفاصيل الباقات والحلول البرمجية المتكاملة',
        styles: { fontSize: 22, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'table',
        name: 'الجدول الرئيسي لبيانات الشريحة',
        x: 50,
        y: 170,
        width: 700,
        height: 300,
        content: 'البند التقني|مستوى التوافق والسرعة|الربط السحابي المتكامل\nلوحة تحكم تفاعلية|متوافق 100% وبسرعة قصوى|مربوط سحابياً بفولدر فايربيس الآمن\nتحديث لحظي فوري|أقل من ثانية واحدة للتنفيذ|تزامن فوري للمتصفح دون إعادة تحميل\nإحصاءات سيو متقدمة|متكامل ومحسن لمحركات البحث|خرائط موقع سيو مولدة سحابياً لعملاء جوجل\nدعم قنوات تواصل واجتماعات|متوفر بكافة الفئات والشرائح|ربط مباشر بنظام حجز وتواصل واستمارات متقدمة\nتكلفة الاشتراك التقني الكلي|مجاني بالفترات التجريبية الأولى|متوفر باشتراكات ترويجية بسيطة ومغرية للجميع',
        styles: { fontSize: 12, backgroundColor: col.card, borderColor: col.text + '15', borderWidth: 1 }
      },
      {
        type: 'button',
        name: 'زر للتواصل',
        x: 300,
        y: 495,
        width: 200,
        height: 44,
        content: 'احجز خطتك الآن ✦',
        styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
      }
    ];
  }

  // ==========================================
  // VIDEO SLIDES (شريحة فيديو)
  // ==========================================
  else if (categoryId === 'video') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      {
        type: 'badge',
        name: 'شارة فيديو',
        x: 280,
        y: 50,
        width: 240,
        height: 32,
        content: '🎥 مقاطع مرئية وتوضيحية لأعمالنا',
        styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center' }
      },
      {
        type: 'heading',
        name: 'عنوان الفيديو',
        x: 80,
        y: 100,
        width: 640,
        height: 50,
        content: 'شاهد الشرح التفصيلي لخدمات وميزات وي لينك',
        styles: { fontSize: 24, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'video',
        name: 'عنصر الفيديو الرئيسي التفاعلي',
        x: 80,
        y: 170,
        width: 640,
        height: 330,
        content: 'https://www.w3schools.com/html/mov_bbb.mp4',
        styles: { borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'paragraph',
        name: 'نص الفيديو',
        x: 100,
        y: 515,
        width: 600,
        height: 40,
        content: 'هذا العنصر يتيح لك ربط وتضمين مقاطع فيديو من يوتيوب، فيميو أو رفع ملف فيديو خارجي لزيادة تفاعل وتجاوب الزوار بمرونة.',
        styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'center' }
      }
    ];
  }

  // ==========================================
  // BIO CARD SLIDES (شريحة بطاقة تعريفية)
  // ==========================================
  else if (categoryId === 'bio') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      // Central Rounded Apple Card
      {
        type: 'shape',
        name: 'البطاقة التعريفية المركزية الدائرية الزوايا',
        x: 200,
        y: 60,
        width: 400,
        height: 460,
        styles: { backgroundColor: col.card, borderRadius: 32, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom', borderColor: col.accent + '20', borderWidth: 1 }
      },
      {
        type: 'image',
        name: 'صورة البروفايل للبطاقة',
        x: 340,
        y: 100,
        width: 120,
        height: 120,
        content: getImg('team', 0),
        styles: { borderRadius: 60, objectFit: 'cover' }
      },
      {
        type: 'heading',
        name: 'اسم صاحب البطاقة',
        x: 220,
        y: 240,
        width: 360,
        height: 35,
        content: 'المهندس رامي الحسين',
        styles: { fontSize: 18, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'وصف صاحب البطاقة والسيرة',
        x: 230,
        y: 285,
        width: 340,
        height: 120,
        content: '✦ مطور أول لتجربة الواجهات البرمجية\n✦ ماجستير علوم الحاسب والربط البرمجي\n• أعمل بشغف لمساعدة الشركات السورية والناشئة على النمو في الأسواق السحابية والحلول البرمجية الذكية الفائقة التطور والمحاذاة.',
        styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.8 }
      },
      {
        type: 'button',
        name: 'زر تواصل مباشر بالبطاقة',
        x: 230,
        y: 425,
        width: 340,
        height: 46,
        content: 'احفظ بيانات الاتصال السريع 👤',
        styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 12, textAlign: 'center', fontWeight: 'bold' }
      }
    ];
  }

  // ==========================================
  // SERVICES SLIDES (شريحة خدماتنا)
  // ==========================================
  else if (categoryId === 'services') {
    elements = [
      {
        type: 'shape',
        name: 'خلفية الشريحة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      {
        type: 'badge',
        name: 'شارة الخدمات العامة',
        x: 280,
        y: 50,
        width: 240,
        height: 32,
        content: '🛠️ خدمات متميزة وباقة حلول ذكية ومتطورة',
        styles: { fontSize: 12, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center' }
      },
      {
        type: 'heading',
        name: 'عنوان خدماتنا',
        x: 80,
        y: 100,
        width: 640,
        height: 50,
        content: 'باقة من أرقى الخدمات المصممة لنمو مشروعك',
        styles: { fontSize: 24, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      // 3 services cards columns side-by-side
      {
        type: 'shape',
        name: 'بطاقة خدمة 1',
        x: 50,
        y: 180,
        width: 220,
        height: 320,
        styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'image',
        name: 'صورة خدمة 1',
        x: 70,
        y: 200,
        width: 180,
        height: 110,
        content: getImg('services', 0),
        styles: { borderRadius: 14, objectFit: 'cover' }
      },
      {
        type: 'heading',
        name: 'عنوان خدمة 1',
        x: 70,
        y: 330,
        width: 180,
        height: 30,
        content: 'تطوير صفحات الهبوط وبنائها',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'وصف خدمة 1',
        x: 70,
        y: 370,
        width: 180,
        height: 110,
        content: 'تصميم واجهات مستخدم مخصصة وجاذبة تزيد من ثقة زوار مشروعك وترفع مبيعاتك بكبسة زر واحدة.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
      },

      {
        type: 'shape',
        name: 'بطاقة خدمة 2',
        x: 290,
        y: 180,
        width: 220,
        height: 320,
        styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'image',
        name: 'صورة خدمة 2',
        x: 310,
        y: 200,
        width: 180,
        height: 110,
        content: getImg('services', 1),
        styles: { borderRadius: 14, objectFit: 'cover' }
      },
      {
        type: 'heading',
        name: 'عنوان خدمة 2',
        x: 310,
        y: 330,
        width: 180,
        height: 30,
        content: 'كتالوج المنتجات السحابي',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'وصف خدمة 2',
        x: 310,
        y: 370,
        width: 180,
        height: 110,
        content: 'قوائم طعام وتصنيفات منتجات ملونة مع ربط بالفيسبوك وإنستقرام ومحركات البحث للوصول لأكبر فئة.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
      },

      {
        type: 'shape',
        name: 'بطاقة خدمة 3',
        x: 530,
        y: 180,
        width: 220,
        height: 320,
        styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      },
      {
        type: 'image',
        name: 'صورة خدمة 3',
        x: 550,
        y: 200,
        width: 180,
        height: 110,
        content: getImg('intro', 2),
        styles: { borderRadius: 14, objectFit: 'cover' }
      },
      {
        type: 'heading',
        name: 'عنوان خدمة 3',
        x: 550,
        y: 330,
        width: 180,
        height: 30,
        content: 'التحليلات والدعم السنوي',
        styles: { fontSize: 14, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'وصف خدمة 3',
        x: 550,
        y: 370,
        width: 180,
        height: 110,
        content: 'متابعة دائمة لموقعك مع إحصاءات حية للزيارات وتحسين نتائج الظهور بمحرك البحث سيو.',
        styles: { fontSize: 11, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.6 }
      }
    ];
  }

  // ==========================================
  // OTHER CATEGORIES (ABOUT, PARTNERS, MAP, PRIVACY)
  // ==========================================
  else {
    // Elegant Fallback layout with rich list and tables to keep 100% functionality and perfect visual style
    elements = [
      {
        type: 'shape',
        name: 'خلفية البطاقة',
        x: 0,
        y: 0,
        width: 800,
        height: 580,
        styles: { backgroundColor: col.bg, borderRadius: 0 }
      },
      {
        type: 'badge',
        name: 'شارة التصنيف الفرعي',
        x: 280,
        y: 60,
        width: 240,
        height: 32,
        content: `✦ ${catName} — نموذج منسق طراز ${index + 1}`,
        styles: { fontSize: 11, backgroundColor: col.bgShape, color: col.accent, borderRadius: 10, textAlign: 'center' }
      },
      {
        type: 'heading',
        name: 'العنوان الرئيسي للشريحة',
        x: 80,
        y: 110,
        width: 640,
        height: 60,
        content: `محتوى ${catName} الجاهزة للتعديل والإطلاق المباشر`,
        styles: { fontSize: 24, color: col.text, fontWeight: 'bold', textAlign: 'center' }
      },
      {
        type: 'paragraph',
        name: 'النص التعريفي المنسق بقائمة تعداد',
        x: 100,
        y: 180,
        width: 600,
        height: 120,
        content: '✦ هذا النص يدعم التعديل والمحاذاة المباشرة لتطويع صفحتك حسب غرض الخدمة المتاح بامتياز.\n✦ ميزة الترقيم التلقائي والتعداد الجيبي تزيد من سهولة تتبع الخطوط العريضة لعملائك ومتابعيك.\n✦ نثق بأن المحتوى المنسق بشكل أنيق ومتوازن مع الفراغات يترك انطباعاً دائماً عن علامتك التجارية.',
        styles: { fontSize: 13, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.8 }
      },
      {
        type: 'shape',
        name: 'بطاقة معلومات سريعة مدمجة',
        x: 100,
        y: 310,
        width: 600,
        height: 150,
        styles: { backgroundColor: col.card, borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom', borderWidth: 1, borderColor: col.text + '10' }
      },
      {
        type: 'heading',
        name: 'عنوان بطاقة المعلومات السريعة المدمجة',
        x: 120,
        y: 330,
        width: 560,
        height: 30,
        content: '💡 هل تود الاستفسار عن ميزات إضافية؟',
        styles: { fontSize: 15, color: col.text, fontWeight: 'bold', textAlign: 'right' }
      },
      {
        type: 'paragraph',
        name: 'تفاصيل بطاقة المعلومات السريعة المدمجة',
        x: 120,
        y: 370,
        width: 560,
        height: 80,
        content: 'منصة وي لينك تدعم إضافة النوافذ المنبثقة، وتضمين أكواد HTML، والخرائط الحية والجداول ليكون موقعك بمثابة تطبيق متكامل يخدم مبيعاتك 24 ساعة دون أي قيود.',
        styles: { fontSize: 12, color: col.text === '#ffffff' ? '#bfbfbf' : '#636366', textAlign: 'right', lineHeight: 1.5 }
      },
      {
        type: 'button',
        name: 'زر للتأكيد السريع',
        x: 300,
        y: 490,
        width: 200,
        height: 44,
        content: 'احجز مكانك الآن ✦',
        styles: { fontSize: 13, backgroundColor: col.accent, color: '#ffffff', borderRadius: 10, textAlign: 'center', fontWeight: 'bold' }
      }
    ];
  }

  // 1. Customize elements for the chosen index (0: doctor, 1: restaurant, 2: professional)
  const customizedElements = customizeElementsForIndex(elements, categoryId, index, col);

  // 2. Scale elements horizontally from 800px to 1280px (1.6x multiplier)
  const scaleX = 1280 / 800;
  const scaledElements = customizedElements.map(el => ({
    ...el,
    x: Math.round((el.x || 0) * scaleX),
    width: Math.round((el.width || 0) * scaleX),
  }));

  // 3. Post-process: Extract large background images and convert them into native slide background properties
  let finalBgImage: string | undefined = undefined;
  let finalBgOpacity: number | undefined = undefined;
  let finalBgAttachment: string | undefined = undefined;

  const filteredElements = scaledElements.filter(el => {
    const isFullWidthBg = el.type === 'image' && 
      el.x === 0 && 
      el.y === 0 && 
      el.width >= 1200 && 
      (el.name?.includes('خلفية') || el.name?.includes('كاملة'));
      
    if (isFullWidthBg) {
      finalBgImage = el.imageUrl || el.content;
      finalBgOpacity = el.styles?.opacity ?? 1;
      finalBgAttachment = el.styles?.backgroundAttachment || (index % 2 === 1 ? 'fixed' : 'scroll');
      return false; // exclude from canvas elements, make it native BG!
    }
    return true;
  });

  // 4. Find the largest remaining image element (main illustration / cover photo)
  let mainImage: any = null;
  let maxArea = 0;
  filteredElements.forEach(el => {
    if (el.type === 'image' && !el.name?.includes('شعار') && !el.name?.includes('لوغو') && !el.name?.includes('لوجو')) {
      const area = (el.width || 0) * (el.height || 0);
      if (area > maxArea) {
        maxArea = area;
        mainImage = el;
      }
    }
  });

  // 5. Reposition Logo to overlay the main image (Facebook profile-on-cover overlay style!) & vary the geometric shape
  const updatedElements = filteredElements.map(el => {
    const isLogo = el.type === 'image' && (el.name?.includes('شعار') || el.name?.includes('لوغو') || el.name?.includes('لوجو'));
    if (isLogo && mainImage) {
      const logoWidth = 90;
      const logoHeight = 90;
      
      // Calculate overlay position (bottom-right overlap of main cover image)
      const logoX = mainImage.x + 20; 
      const logoY = mainImage.y + mainImage.height - 45; 
      
      // Geometric shapes: Circle, Rounded Square, Squircle (Pill), Square
      const shapes = [
        { borderRadius: 9999, borderWidth: 4, borderColor: '#ffffff', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' },
        { borderRadius: 16, borderWidth: 4, borderColor: '#ffffff', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' },
        { borderRadius: 32, borderWidth: 4, borderColor: '#ffffff', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' },
        { borderRadius: 0, borderWidth: 4, borderColor: '#ffffff', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
      ];
      const chosenShape = shapes[index % shapes.length];

      return {
        ...el,
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
        styles: {
          ...el.styles,
          ...chosenShape,
          objectFit: 'cover',
          zIndex: 100
        }
      };
    }
    return el;
  });

  return {
    name: title,
    height,
    backgroundColor: col.bg,
    backgroundImage: finalBgImage,
    backgroundOpacity: finalBgOpacity,
    backgroundAttachment: finalBgAttachment,
    elements: updatedElements
  };
};
