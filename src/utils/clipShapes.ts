// The image's artistic clipping shapes (values are the CSS classes the canvas applies).
export const CLIP_GROUPS: { label: string; options: [string, string][] }[] = [
  {
    label: '📐 أشكال هندسية معروفة',
    options: [
      ['clip-shape-geo-circle', '⚪ دائرة مثالية منتظمة'],
      ['clip-shape-geo-capsule', '💊 كبسولة مستديرة الأطراف'],
      ['clip-shape-geo-hexagon', '⬡ سداسي أضلاع متناسق'],
      ['clip-shape-geo-octagon', '🛑 ثماني أضلاع معماري'],
      ['clip-shape-geo-triangle', '🔺 مثلث متساوي الأضلاع'],
      ['clip-shape-geo-three-quarters', '🍰 ثلاث أرباع الدائرة'],
      ['clip-shape-geo-leaf-opposite', '🍃 حواف منحنية متعاكسة (ورقة شجر)'],
    ],
  },
  {
    label: '🧩 أشكال بازل (Puzzle & Bezier)',
    options: [
      ['clip-shape-geo-puzzle-a', '🧩 قطعة أحجية كلاسيكية'],
      ['clip-shape-geo-puzzle-b', '🧩 قطعة أحجية بارزة ثلاثية الأبعاد'],
    ],
  },
  {
    label: '🏛️ أقواس وعمارة فاخرة',
    options: [
      ['clip-shape-arch-classic', '🏛️ قوس كلاسيكي'],
      ['clip-shape-arch-gothic', '🛕 قوس قوطي مدبب'],
      ['clip-shape-window-arch', '🪟 نافذة مقوسة مزدوجة'],
      ['clip-shape-arch-dome', '🕌 قبة إسلامية دائرية'],
      ['clip-shape-mosque', '🕌 قبة مسجد مدببة'],
    ],
  },
  {
    label: '🎨 ضربات فرشاة خشنة وأطراف عشوائية',
    options: [
      ['clip-shape-brush-messy', '🖌️ ضربة فرشاة فوضوية خشنة'],
      ['clip-shape-brush-scratch', '⚡ مسحة خدش حادة'],
      ['clip-shape-brush-dripping', '💧 أطراف متقطرة منسابة'],
      ['clip-shape-brush-corona', '☀️ وهج فرشاة عشوائي متموج'],
      ['clip-shape-brush-splodge', '🎨 بقعة طلاء فنية حرة'],
      ['clip-shape-brush-watercolor', '🎨 ضربة فرشاة ألوان مائية ناعمة'],
      ['clip-shape-brush-splatter', '🌌 بقعة حبر متناثرة'],
      ['clip-shape-brush-swipe', '🖌️ مسحة فرشاة عريضة'],
    ],
  },
  {
    label: '🌿 الطبيعة والجماليات',
    options: [
      ['clip-shape-dew-drop', '💧 قطرة الندى'],
      ['clip-shape-leaf-classic', '🍃 ورقة شجر كلاسيكية'],
      ['clip-shape-petal', '🌸 بتلة زهرة ناعمة'],
      ['clip-shape-lotus', '🪷 زهرة اللوتس الفاخرة'],
      ['clip-shape-blob-splash', '💦 بقعة مائية متموجة (Blob)'],
      ['clip-shape-blob-org-a', '🌊 تموج مائي منساب A'],
      ['clip-shape-blob-org-b', '🌊 تموج مائي منساب B'],
      ['clip-shape-blob-cloud', '☁️ سحابة كرتونية لطيفة'],
      ['clip-shape-blob-bubble', '🫧 فقاعة ناعمة دائرية'],
      ['clip-shape-blob-amoeba', '🦠 بقعة أميبية حرة'],
      ['clip-shape-heart', '❤️ قلب رومانسي دافئ'],
      ['clip-shape-crescent-moon', '🌙 هلال ناعم فريد'],
    ],
  },
];
