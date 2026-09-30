// Background colors and gradients as specified in user's architectural sketch:
// 1. Mandatory 5 background colors (الألوان الإلزامية)
// 2. 50 solid colors ordered harmoniously (منحدر لوني 50 لون)
// 3. 25 gradient presets (25 لون تدريجي نماذج)
// 4. Curated Unsplash background wallpapers

export const MANDATORY_BG_COLORS = [
  { name: 'شفاف', value: 'transparent', border: true },
  { name: 'أبيض ناصع', value: '#ffffff', border: true },
  { name: 'رمادي فاتح', value: '#f5f5f7', border: false },
  { name: 'فحم داكن', value: '#18181b', border: false },
  { name: 'أزرق أساسي', value: '#0071e3', border: false },
];

export const FIFTY_SOLID_COLORS = [
  // 1-5: Whites & Light Neutrals
  '#ffffff', '#fafafa', '#f5f5f7', '#e5e5ea', '#d1d1d6',
  // 6-10: Cool Greys & Slates
  '#c7c7cc', '#aeaeb2', '#8e8e93', '#636366', '#48484a',
  // 11-15: Deep Greys & Darks
  '#3a3a3c', '#2c2c2e', '#1c1c1e', '#18181b', '#09090b',
  // 16-20: Warm Sands & Creams (Desert / Najd)
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24',
  // 21-25: Ambers & Warm Oranges
  '#fff7ed', '#ffedd5', '#fed7aa', '#fb923c', '#ea580c',
  // 26-30: Rose, Coral & Reds
  '#fff1f2', '#ffe4e6', '#fecdd3', '#f43f5e', '#e11d48',
  // 31-35: Pinks & Magentas
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#ec4899', '#be185d',
  // 36-40: Purples & Violets
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#a855f7', '#7c3aed',
  // 41-45: Sky & Azure Blues
  '#f0f9ff', '#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7',
  // 46-50: Emeralds & Teals
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#34d399', '#059669',
];

export interface GradientPreset {
  id: string;
  name: string;
  value: string; // CSS linear-gradient string with multi-stops
  category?: 'pastel' | 'sunset' | 'neon' | 'ocean' | 'metallic' | 'dark' | 'vibrant';
}

// 1. Top row soft pastel multi-tone gradients (كما في الصف العلوي بصورة كانفا)
export const PASTEL_SOFT_GRADIENTS: GradientPreset[] = [
  { id: 'p1', name: 'خوخ كريمي', category: 'pastel', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'p2', name: 'شفق وردي ناعم', category: 'pastel', value: 'linear-gradient(135deg, #ffc3a0 0%, #ffafbd 50%, #e0c3fc 100%)' },
  { id: 'p3', name: 'شاي أخضر وزهر', category: 'pastel', value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 45%, #fff9c4 100%)' },
  { id: 'p4', name: 'مينت وسماء', category: 'pastel', value: 'linear-gradient(135deg, #bbf7d0 0%, #bae6fd 50%, #ddd6fe 100%)' },
  { id: 'p5', name: 'سماوي ولافندر', category: 'pastel', value: 'linear-gradient(135deg, #e0f2fe 0%, #cbebff 50%, #f3e8ff 100%)' },
  { id: 'p6', name: 'بنفسج وحرير وردي', category: 'pastel', value: 'linear-gradient(135deg, #e9d5ff 0%, #fce7f3 50%, #fff1f2 100%)' },
  { id: 'p7', name: 'قطن سحابي متعدد', category: 'pastel', value: 'linear-gradient(135deg, #fdfbf7 0%, #ebedee 50%, #dae1e7 100%)' },
];

// 2. Comprehensive Multi-Color Gradients (جميع التدرجات الملونة مثل كانفا Alle Farbverläufe)
export const RICH_MULTI_GRADIENTS: GradientPreset[] = [
  // --- الصف 1: مونوكروم، داكن وأزرق نيلي وفضي ---
  { id: 'g_m1', name: 'فضي بلاتيني تيتانيوم', category: 'metallic', value: 'linear-gradient(135deg, #e0e0e0 0%, #b0bec5 50%, #eceff1 100%)' },
  { id: 'g_m2', name: 'رمادي حجري متدرج', category: 'dark', value: 'linear-gradient(135deg, #9e9e9e 0%, #616161 50%, #424242 100%)' },
  { id: 'g_m3', name: 'فحم وكربون غرافيت', category: 'dark', value: 'linear-gradient(135deg, #48484a 0%, #2c2c2e 50%, #1c1c1e 100%)' },
  { id: 'g_m4', name: 'نيلي ملكي داكن مع سيان', category: 'ocean', value: 'linear-gradient(135deg, #001f3f 0%, #0074d9 60%, #7fdbff 100%)' },
  { id: 'g_m5', name: 'برونز ميتاليك دافئ', category: 'metallic', value: 'linear-gradient(135deg, #3e2723 0%, #8d6e63 50%, #d7ccc8 100%)' },
  { id: 'g_m6', name: 'بنفسج ليلي مع أزرق كوبالت', category: 'neon', value: 'linear-gradient(135deg, #311b92 0%, #512da8 45%, #0288d1 100%)' },
  { id: 'g_m7', name: 'توت داكن مع مرجاني', category: 'sunset', value: 'linear-gradient(135deg, #4a148c 0%, #880e4f 50%, #e91e63 100%)' },

  // --- الصف 2: خلط الباستيل وقوس قزح ناعم ---
  { id: 'g_r1', name: 'قوس قزح باستيل لؤلؤي', category: 'pastel', value: 'linear-gradient(135deg, #ffc3a0 0%, #ffafbd 30%, #e0c3fc 70%, #8ec5fc 100%)' },
  { id: 'g_r2', name: 'شمس خوخية وبحر سماوي', category: 'vibrant', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 50%, #8fd3f4 100%)' },
  { id: 'g_r3', name: 'أصفر مشرق مع فيروزي وبنفسج', category: 'vibrant', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 40%, #667eea 100%)' },
  { id: 'g_r4', name: 'أكوا مينت وتوت ناعم', category: 'ocean', value: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 50%, #a18cd1 100%)' },
  { id: 'g_r5', name: 'أمواج سيان وأرجواني حالم', category: 'neon', value: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 50%, #d299c2 100%)' },
  { id: 'g_r6', name: 'وردي وبنفسج فضاء', category: 'vibrant', value: 'linear-gradient(135deg, #c471ed 0%, #f64f59 50%, #12c2e9 100%)' },
  { id: 'g_r7', name: 'شفق مغربي متعدد الألوان', category: 'sunset', value: 'linear-gradient(135deg, #ff7eb3 0%, #ff758c 35%, #ff9472 70%, #feca57 100%)' },

  // --- الصف 3: توت ومرجان وغروب ناري ---
  { id: 'g_s1', name: 'توت ملكي مع شفق برتقالي', category: 'sunset', value: 'linear-gradient(135deg, #780206 0%, #061161 50%, #e056fd 100%)' },
  { id: 'g_s2', name: 'شعلة نارية برتقالية وزرقاء', category: 'vibrant', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 45%, #00c6ff 100%)' },
  { id: 'g_s3', name: 'أصفر عنبري مع أخضر ليموني وسيان', category: 'vibrant', value: 'linear-gradient(135deg, #f9d423 0%, #ff4e50 45%, #00f2fe 100%)' },
  { id: 'g_s4', name: 'غابة استوائية خضراء وفيروزية', category: 'ocean', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 40%, #00c6ff 100%)' },
  { id: 'g_s5', name: 'أورورا شمسية برتقالية وزمرّد', category: 'vibrant', value: 'linear-gradient(135deg, #ea580c 0%, #facc15 50%, #10b981 100%)' },
  { id: 'g_s6', name: 'كهرباء أزرق لافندر ووردي نيون', category: 'neon', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 45%, #f093fb 100%)' },
  { id: 'g_s7', name: 'نيون ديسكو متعدد الأطياف', category: 'neon', value: 'linear-gradient(135deg, #f72585 0%, #7209b7 35%, #3a0ca3 65%, #4cc9f0 100%)' },

  // --- الصف 4: تدرجات التباين والعمق اللوني ---
  { id: 'g_d1', name: 'غروب هافانا وردي وبرتقالي محروق', category: 'sunset', value: 'linear-gradient(135deg, #ec008c 0%, #fc6767 50%, #f77062 100%)' },
  { id: 'g_d2', name: 'تباين رملي ذهبي وأزرق سماوي', category: 'vibrant', value: 'linear-gradient(135deg, #ffb88c 0%, #de6262 50%, #06beb6 100%)' },
  { id: 'g_d3', name: 'حقول زعفران وزيتون ربيعي', category: 'vibrant', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 45%, #48bb78 100%)' },
  { id: 'g_d4', name: 'مياه المالديف العميقة والمرجان', category: 'ocean', value: 'linear-gradient(135deg, #13547a 0%, #80d0c7 50%, #ff9966 100%)' },
  { id: 'g_d5', name: 'محيط كاريبي فيروزي وكوبالت', category: 'ocean', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 50%, #43e97b 100%)' },
  { id: 'g_d6', name: 'أمواج ليلية كحلية مع أرجوان', category: 'dark', value: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 60%, #302b63 100%)' },
  { id: 'g_d7', name: 'شفق قطبي متوهج فيوليت وسيان', category: 'neon', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 45%, #f093fb 80%, #4facfe 100%)' },

  // --- الصف 5: نيون حيوي وألوان قوس قزح المشبعة ---
  { id: 'g_n1', name: 'طيف نيون قرمزي وأزرق كهربائي', category: 'neon', value: 'linear-gradient(135deg, #f857a6 0%, #ff5858 45%, #4facfe 100%)' },
  { id: 'g_n2', name: 'طيف ثلاثي: خوخ، ليمون، فيروزي', category: 'vibrant', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #30cfd0 100%)' },
  { id: 'g_n3', name: 'أصفر شمسي، ليموني وزمردي', category: 'vibrant', value: 'linear-gradient(135deg, #ffe000 0%, #799f0c 50%, #00416a 100%)' },
  { id: 'g_n4', name: 'أورورا خضراء فاقعة وليموني', category: 'vibrant', value: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 50%, #00cdac 100%)' },
  { id: 'g_n5', name: 'موجة سيان وليموني مضيء', category: 'neon', value: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 40%, #00e676 100%)' },
  { id: 'g_n6', name: 'أزرق سايبر متلألئ مع وردي', category: 'neon', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 50%, #ee9ca7 100%)' },
  { id: 'g_n7', name: 'مجرة ليلية كوزميك سديمية', category: 'neon', value: 'linear-gradient(135deg, #2b5876 0%, #4e4376 50%, #e14fad 100%)' },

  // --- الصف 6: ألوان ميتاليك وفخامة ملكية ---
  { id: 'g_x1', name: 'ذهب ملكي ميتاليك متدرج', category: 'metallic', value: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)' },
  { id: 'g_x2', name: 'روز غولد نحاسي وردي فخم', category: 'metallic', value: 'linear-gradient(135deg, #e0c3fc 0%, #fbc2eb 35%, #fed7aa 70%, #f43f5e 100%)' },
  { id: 'g_x3', name: 'برونز نحاسي عتيق مع كهرمان', category: 'metallic', value: 'linear-gradient(135deg, #8a5024 0%, #d4a373 50%, #fefae0 100%)' },
  { id: 'g_x4', name: 'كروم وتيتانيوم أزرق معدني', category: 'metallic', value: 'linear-gradient(135deg, #4b6cb7 0%, #182848 50%, #6a82fb 100%)' },
  { id: 'g_x5', name: 'صلب داكن مع أزرق محيطي معدني', category: 'metallic', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 'g_x6', name: 'زمرد ياقوتي ملكي داكن مع ذهب', category: 'metallic', value: 'linear-gradient(135deg, #051937 0%, #004d7a 35%, #008793 70%, #00bf72 100%)' },
  { id: 'g_x7', name: 'فحم بلاتيني ملكي بلمعة مخملية', category: 'metallic', value: 'linear-gradient(135deg, #232526 0%, #414345 50%, #2c3e50 100%)' },

  // --- الصف 7: غروب ناري ودرجات دافئة ثلاثية ورباعية الألوان ---
  { id: 'g_w1', name: 'شفق كالي الساحر الرباعي', category: 'sunset', value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 35%, #fbc2eb 70%, #a18cd1 100%)' },
  { id: 'g_w2', name: 'شمس حمراء وقرمزي وكهرمان', category: 'sunset', value: 'linear-gradient(135deg, #f85032 0%, #e73827 35%, #f16f5c 70%, #f7971e 100%)' },
  { id: 'g_w3', name: 'غروب الصحراء كراميل ونحاس', category: 'sunset', value: 'linear-gradient(135deg, #e65c00 0%, #f9d423 50%, #ff4e50 100%)' },
  { id: 'g_w4', name: 'فيروزي عميق مع أزرق بحري وزمرد', category: 'ocean', value: 'linear-gradient(135deg, #0575e6 0%, #00f260 50%, #00c6ff 100%)' },
  { id: 'g_w5', name: 'أزرق المحيط المتجمد الشمالي', category: 'ocean', value: 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 50%, #ffffff 100%)' },
  { id: 'g_w6', name: 'غسق باريسي بنفسجي ووردي ونحاسي', category: 'sunset', value: 'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)' },
  { id: 'g_w7', name: 'سديم كوني متعدد الألوان المتلألئة', category: 'neon', value: 'linear-gradient(135deg, #ff007f 0%, #7928ca 35%, #00dfd8 70%, #ffbe0b 100%)' },
];

// Combine all gradients for backward compatibility and full export
export const TWENTY_FIVE_GRADIENTS: GradientPreset[] = [
  ...PASTEL_SOFT_GRADIENTS,
  ...RICH_MULTI_GRADIENTS
];


export interface UnsplashPreset {
  id: string;
  title: string;
  category: string;
  thumbUrl: string;
  fullUrl: string;
  photographer: string;
}

export const CURATED_UNSPLASH_PHOTOS: UnsplashPreset[] = [
  {
    id: 'u1',
    title: 'عمارة زجاجية حديثة',
    category: 'معمار',
    thumbUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Simone Hutsch',
  },
  {
    id: 'u2',
    title: 'كثبان رملية ذهبية',
    category: 'طبيعة',
    thumbUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Jeremy Bishop',
  },
  {
    id: 'u3',
    title: 'مكتب عمل تقني أنيق',
    category: 'أعمال',
    thumbUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Alesia Kazantceva',
  },
  {
    id: 'u4',
    title: 'تجريدي أمواج سائلة ملونة',
    category: 'تجريدي',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Milad Fakurian',
  },
  {
    id: 'u5',
    title: 'أفق مدينة الرياض ليلاً',
    category: 'مدن',
    thumbUrl: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Ahmad Odeh',
  },
  {
    id: 'u6',
    title: 'رخام أبيض نقي',
    category: 'خلفيات',
    thumbUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Annie Spratt',
  },
  {
    id: 'u7',
    title: 'تكنولوجيا وشبكات ضوئية',
    category: 'تكنولوجيا',
    thumbUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Markus Spiske',
  },
  {
    id: 'u8',
    title: 'أمواج بحر فيروزية نقية',
    category: 'طبيعة',
    thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Sean Oulashin',
  },
  {
    id: 'u9',
    title: 'برج تجاري دبي فخم',
    category: 'فخامة',
    thumbUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=85',
    photographer: 'David Rodrigo',
  },
  {
    id: 'u10',
    title: 'سماء ليلية نجوم ومجرة',
    category: 'طبيعة',
    thumbUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=85',
    photographer: 'NASA',
  },
  {
    id: 'u11',
    title: 'هندسة معمارية إسلامية',
    category: 'معمار',
    thumbUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Sufyan',
  },
  {
    id: 'u12',
    title: 'سطح خرساني ناعم وبسيط',
    category: 'خلفيات',
    thumbUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1920&q=85',
    photographer: 'Henry & Co.',
  },
];
