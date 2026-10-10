// Background video library for slides (the «فيديو» tab of the background drawer).
// Files live in public/bg-videos: each mp4 is 720p, silent, at most 15 seconds and about 1 MB, with a
// small jpg poster of the same name. Keep new videos to that size so pages stay fast on slow connections.
export interface BackgroundVideoPreset {
  id: string;
  title: string;
  category: string;
  src: string;
  poster: string;
  // Tall (9:16) video, made for phone-sized slides.
  portrait?: boolean;
}

export const BACKGROUND_VIDEOS: BackgroundVideoPreset[] = [
  { id: '10004433', title: 'دخان بنفسجي', category: 'تجريدي', src: '/bg-videos/10004433.mp4', poster: '/bg-videos/10004433.jpg' },
  { id: '11933047', title: 'موجات ملونة', category: 'تجريدي', src: '/bg-videos/11933047.mp4', poster: '/bg-videos/11933047.jpg' },
  { id: '12421291', title: 'فقاعات وردية', category: 'تجريدي', src: '/bg-videos/12421291.mp4', poster: '/bg-videos/12421291.jpg' },
  { id: '12802106', title: 'أحمر متموج', category: 'تجريدي', src: '/bg-videos/12802106.mp4', poster: '/bg-videos/12802106.jpg' },
  { id: '13007726', title: 'جبال مضيئة', category: 'تجريدي', src: '/bg-videos/13007726.mp4', poster: '/bg-videos/13007726.jpg' },
  { id: '13820343', title: 'خطوط نيون', category: 'تجريدي', src: '/bg-videos/13820343.mp4', poster: '/bg-videos/13820343.jpg' },
  { id: '17130751', title: 'موجة بنفسجية', category: 'تجريدي', src: '/bg-videos/17130751.mp4', poster: '/bg-videos/17130751.jpg' },
  { id: '13203421', title: 'مكعب زجاجي', category: 'تقنية', src: '/bg-videos/13203421.mp4', poster: '/bg-videos/13203421.jpg' },
  { id: '14683909', title: 'مدينة رقمية', category: 'تقنية', src: '/bg-videos/14683909.mp4', poster: '/bg-videos/14683909.jpg' },
  { id: '15254965', title: 'معالج إلكتروني', category: 'تقنية', src: '/bg-videos/15254965.mp4', poster: '/bg-videos/15254965.jpg' },
  { id: '3141210', title: 'جزيئات مضيئة', category: 'تقنية', src: '/bg-videos/3141210.mp4', poster: '/bg-videos/3141210.jpg' },
  { id: '14554567', title: 'مشاوي على الفحم', category: 'مطاعم', src: '/bg-videos/14554567.mp4', poster: '/bg-videos/14554567.jpg', portrait: true },
  { id: '14682632', title: 'كباب وخبز', category: 'مطاعم', src: '/bg-videos/14682632.mp4', poster: '/bg-videos/14682632.jpg', portrait: true },
  { id: '15318716', title: 'شاورما', category: 'مطاعم', src: '/bg-videos/15318716.mp4', poster: '/bg-videos/15318716.jpg', portrait: true },
  { id: '8480007', title: 'تحضير الطعام', category: 'مطاعم', src: '/bg-videos/8480007.mp4', poster: '/bg-videos/8480007.jpg' },
  { id: '5924988', title: 'كيس تسوق', category: 'متاجر', src: '/bg-videos/5924988.mp4', poster: '/bg-videos/5924988.jpg', portrait: true },
  { id: '5926066', title: 'تخفيضات', category: 'متاجر', src: '/bg-videos/5926066.mp4', poster: '/bg-videos/5926066.jpg', portrait: true },
  { id: '6707573', title: 'عطور وزيوت', category: 'متاجر', src: '/bg-videos/6707573.mp4', poster: '/bg-videos/6707573.jpg' },
  { id: '7568747', title: 'تسوق إلكتروني', category: 'متاجر', src: '/bg-videos/7568747.mp4', poster: '/bg-videos/7568747.jpg' },
  { id: '12984416', title: 'عرض أعمال', category: 'مهن وخدمات', src: '/bg-videos/12984416.mp4', poster: '/bg-videos/12984416.jpg' },
  { id: '4480575', title: 'نجارة', category: 'مهن وخدمات', src: '/bg-videos/4480575.mp4', poster: '/bg-videos/4480575.jpg' },
  { id: '6755020', title: 'عيادة أسنان', category: 'مهن وخدمات', src: '/bg-videos/6755020.mp4', poster: '/bg-videos/6755020.jpg' },
  { id: '7133220', title: 'تجميل ورموش', category: 'مهن وخدمات', src: '/bg-videos/7133220.mp4', poster: '/bg-videos/7133220.jpg', portrait: true },
  { id: '7253934', title: 'صالون شعر', category: 'مهن وخدمات', src: '/bg-videos/7253934.mp4', poster: '/bg-videos/7253934.jpg' },
  { id: '14228182', title: 'معرض سيارات', category: 'سيارات', src: '/bg-videos/14228182.mp4', poster: '/bg-videos/14228182.jpg' },
  { id: '17111226', title: 'حقل وردي', category: 'طبيعة ومدن', src: '/bg-videos/17111226.mp4', poster: '/bg-videos/17111226.jpg' },
  { id: '6772412', title: 'غيوم وسماء', category: 'طبيعة ومدن', src: '/bg-videos/6772412.mp4', poster: '/bg-videos/6772412.jpg' },
  { id: '856662', title: 'برج زجاجي', category: 'طبيعة ومدن', src: '/bg-videos/856662.mp4', poster: '/bg-videos/856662.jpg' },
];
