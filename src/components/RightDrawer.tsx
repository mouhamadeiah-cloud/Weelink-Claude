import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Type, 
  Square, 
  Image as ImageIcon, 
  CreditCard, 
  AlignLeft, 
  AlignRight, 
  AlignCenter, 
  Italic, 
  Bold, 
  Underline, 
  List, 
  ListOrdered, 
  FormInput, 
  Minus, 
  Grid3X3, 
  SlidersHorizontal, 
  Lock, 
  Unlock, 
  Copy, 
  Sparkles, 
  PaintRoller, 
  Check, 
  Wand2, 
  FolderTree, 
  Folder, 
  FolderOpen, 
  Component, 
  FileText, 
  Sun, 
  ExternalLink, 
  Globe, 
  Trash2,
  ArrowUp,
  ArrowDown,
  Shapes,
  Video,
  Layers,
  MapPin,
  Navigation,
  Loader2,
  Calendar,
  Code,
  Tag,
  Plus,
  Play,
  Stethoscope,
  RotateCw,
  RotateCcw,
  Images,
  Upload,
  Download,
  Search,
  BadgeCheck,
  Smile,
  ArrowUpToLine,
  ArrowDownToLine
} from 'lucide-react';
import { Slide, ElementType, CanvasElement, NavbarConfig, Page, SlideDividerShape, getGlowShadowStyle, getLightGradientStyle, ContactType } from '../types';
import { MASK_SHAPES } from '../utils/maskShapes';
import { Icon } from '@iconify/react';
import { TWENTY_PAGE_PALETTES } from '../data/palettes';
import { SLIDE_DIVIDER_OPTIONS } from './SlideDividers';
import { BackgroundDrawerSection } from './BackgroundDrawerSection';
import { ImageDrawerSection } from './ImageDrawerSection';
import { ColorSwatchPicker, Slider, PillTabs, SectionHeader } from './ui/SharedControls';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { fetchUnsplashPhotos } from '../services/unsplashService';
import { 
  MANDATORY_BG_COLORS, 
  FIFTY_SOLID_COLORS, 
  PASTEL_SOFT_GRADIENTS, 
  RICH_MULTI_GRADIENTS 
} from '../data/backgroundPresets';
import { WeeAIChat } from './WeeAIChat';

const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const uploadGalleryImageToStorage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawDataUrl = e.target?.result as string;
        const blob = dataURLtoBlob(rawDataUrl);
        const timestamp = Date.now();
        const fileRef = ref(storage, `gallery/${timestamp}_${file.name.replace(/\s+/g, '_')}`);
        const snapshot = await uploadBytes(fileRef, blob);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        resolve(downloadUrl);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export type DrawerSection = 
  | 'elements' 
  | 'add-text'
  | 'add-image'
  | 'slides'
  | 'navbar'
  | 'navbar-settings'
  | 'color'
  | 'background' 
  | 'border' 
  | 'opacity' 
  | 'lighting' 
  | 'shadow' 
  | 'format' 
  | 'format-painter'
  | 'alignment' 
  | 'typography' 
  | 'fontSize' 
  | 'fontFamily' 
  | 'list' 
  | 'animation' 
  | 'layers' 
  | 'link' 
  | 'grid' 
  | 'grouping' 
  | 'wee-ai' 
  | 'page-settings'
  | 'gallery';

interface RightDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  activeSection: DrawerSection;
  onSelectSection: (section: DrawerSection) => void;
  pages: Page[];
  currentPage: Page;
  onSelectPage: (pageId: string) => void;
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (slideId: string) => void;
  onAddSlide: () => void;
  onAddPage: (name: string) => void;
  onDeletePage: (pageId: string) => void;
  onMovePage: (pageId: string, direction: 'up' | 'down') => void;
  onMoveSlide: (slideId: string, direction: 'up' | 'down') => void;
  onCopyCurrentSlide?: (slideId: string) => void;
  onCopyCurrentPage?: (pageId: string) => void;
  onAddSlideTemplate?: (template: any) => void;
  onAddPageTemplate?: (template: any) => void;
  onApplyFreeStarterTemplate?: () => void;
  onDeleteSlide: (slideId: string) => void;
  onUpdateSlideHeight: (slideId: string, height: number) => void;
  onAddElement: (type: ElementType, customContent?: string, customStyles?: any, extraData?: Partial<CanvasElement>) => void;
  onAddGroup?: (containerShape: Partial<CanvasElement>, childElements: Partial<CanvasElement>[]) => void;
  navbar: NavbarConfig;
  onUpdateNavbar: (newNav: Partial<NavbarConfig>) => void;
  isNavbarSelected?: boolean;
  selectedElement: CanvasElement | null;
  elements: CanvasElement[];
  onSelectElement: (id: string | null) => void;
  onUpdateElementStyles: (styles: Partial<CanvasElement['styles']>) => void;
  onUpdateElement: (data: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onToggleLock: () => void;
  onUpdatePage: (updates: Partial<Page>) => void;
  onApplyPagePalette: (palette: [string, string, string, string, string]) => void;
  onUpdateSlideDivider: (slideId: string, shape: SlideDividerShape) => void;
  onUpdateSlideBackground: (
    slideId: string, 
    bg: { backgroundColor?: string; backgroundImage?: string; backgroundSize?: 'cover' | 'contain' | 'auto'; backgroundPosition?: string; backgroundRepeat?: string; backgroundAttachment?: 'scroll' | 'fixed' }
  ) => void;
  onUpdateSlideBorder: (
    slideId: string,
    border: { borderColor?: string; borderWidth?: number; borderRadius?: number; borderStyle?: string }
  ) => void;
  onUpdateSlideOpacity?: (
    slideId: string,
    opacity: { opacity?: number; backgroundOpacity?: number }
  ) => void;
  onUpdateSlideGlow?: (
    slideId: string,
    glow: { 
      glowColor?: string; 
      glowIntensity?: number; 
      glowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
      innerGlowColor?: string; 
      innerGlowIntensity?: number; 
      innerGlowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    }
  ) => void;
  isFormatCopied?: boolean;
  onMoveLayerUp?: () => void;
  onMoveLayerDown?: () => void;
  onMoveLayerToFront?: () => void;
  onMoveLayerToBack?: () => void;
  isPreviewActive?: boolean;
  userId?: string;
  userEmail?: string;
  onCompleteChat?: (collectedData: any) => void;
  onStepChange?: (stepNum: number) => void;
  isWeeAiChatCollapsed?: boolean;
  onToggleWeeAiChat?: () => void;
}

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

// (old primitive SLIDE_TEMPLATES / PAGE_TEMPLATES removed — replaced by the free starter template in src/data/freeStarterTemplate.ts)

export const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onToggle,
  onClose,
  activeSection,
  onSelectSection,
  pages,
  currentPage,
  onSelectPage,
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onAddPage,
  onDeletePage,
  onMovePage,
  onMoveSlide,
  onCopyCurrentSlide,
  onCopyCurrentPage,
  onAddSlideTemplate,
  onAddPageTemplate,
  onApplyFreeStarterTemplate,
  onDeleteSlide,
  onAddElement,
  onAddGroup,
  selectedElement,
  elements,
  onSelectElement,
  onUpdateElementStyles,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onToggleLock,
  onUpdatePage,
  onApplyPagePalette,
  onUpdateSlideDivider,
  onUpdateSlideBackground,
  onUpdateSlideBorder,
  onUpdateSlideOpacity,
  onUpdateSlideGlow,
  isFormatCopied,
  onMoveLayerUp,
  onMoveLayerDown,
  onMoveLayerToFront,
  onMoveLayerToBack,
  isPreviewActive = false,
  userId,
  userEmail,
  onCompleteChat,
  onStepChange,
  isWeeAiChatCollapsed: externalIsWeeAiChatCollapsed,
  onToggleWeeAiChat: externalOnToggleWeeAiChat,
  navbar,
  onUpdateNavbar,
  isNavbarSelected = false,
}) => {
  // Wee AI chat container collapse state inside the control panel
  // (controlled from the parent when provided, e.g. to auto-open for new users; falls back to local state otherwise)
  const [internalWeeAiChatCollapsed, setInternalWeeAiChatCollapsed] = useState<boolean>(true);
  const isWeeAiChatCollapsed = externalIsWeeAiChatCollapsed !== undefined ? externalIsWeeAiChatCollapsed : internalWeeAiChatCollapsed;
  const toggleWeeAiChat = externalOnToggleWeeAiChat || (() => setInternalWeeAiChatCollapsed(prev => !prev));

  // Shared handler for ImageDrawerSection's onAddImage — used by BOTH call sites
  // (add-new-image entry point and add-image/replace-existing entry point) so the
  // insertion behavior can never drift between them.
  const handleAddImageElement = (imageUrl: string, title: string, width: number, height: number, isGraphic: boolean) => {
    const finalWidth = isGraphic ? 140 : 200;
    const finalHeight = isGraphic ? 140 : 130;

    onAddElement(
      'image',
      title || 'صورة مضافة',
      {
        borderRadius: isGraphic ? 16 : 20,
        shadow: isGraphic ? 'none' : 'apple',
        objectFit: isGraphic ? 'contain' : 'cover',
        backgroundColor: isGraphic ? 'transparent' : undefined,
      },
      {
        name: title || (isGraphic ? 'عنصر جرافيك' : 'صورة مضافة'),
        width: finalWidth,
        height: finalHeight,
        imageUrl,
      }
    );
  };

  // Ref to aside element to detect clicking outside and handle automatic scrolling
  const asideRef = useRef<HTMLElement>(null);

  // Effect to collapse/close the drawer when clicking outside the panel (and not clicking the toggle button)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (asideRef.current && !asideRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        
        // Skip closing if the click is on a popup dialog, modal, color picker, select dropdown or toast
        if (
          target.closest('.color-picker-container') ||
          target.closest('input[type="color"]') ||
          target.closest('.Toastify') ||
          target.closest('[role="dialog"]')
        ) {
          return;
        }

        const clickedToggle = target.closest('[aria-label="إغلاق لوحة التحكم"]') || 
                            target.closest('[aria-label="فتح لوحة التحكم"]') || 
                            target.closest('.toggle-drawer-btn') ||
                            target.closest('#control-bar-trigger');
                            
        if (!clickedToggle) {
          onClose();
        }
      }
    };

    const timer = setTimeout(() => {
      // Use mousedown and true (capture phase) to bypass stopPropagation from other components
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  // Screen size state to calculate drawer scale factor dynamically on mobile/tablet
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Compute dynamic scale for control panel (made 20% more compact on small screens)
  let drawerScale = 1;
  if (windowWidth < 480) {
    drawerScale = 0.6;   // 20% smaller for mobile screens
  } else if (windowWidth < 768) {
    drawerScale = 0.64;  // highly compact on small tablets
  } else if (windowWidth < 1024) {
    drawerScale = 0.72;  // compact on medium tablets
  } else if (windowWidth < 1280) {
    drawerScale = 0.8;   // compact on small laptops
  }

  // Tabs at top as in user sketch:
  // Tab 1: "الهيكل" (Structure)
  // Tab 2: "[اسم الأداة الحالية]" (e.g. "تعديل الصفحة", "الظلال", "الألوان", etc.)
  const [activeTab, setActiveTab] = useState<'structure' | 'tool'>('structure');

  // Automatically switch tab to 'tool' when activeSection changes (unless it is structural/elements)
  useEffect(() => {
    if (activeSection && !['structure', 'elements'].includes(activeSection)) {
      setActiveTab('tool');
    }
  }, [activeSection]);

  // When activeSlideId changes, reset the tab back to 'structure' so the slides list returns
  useEffect(() => {
    if (activeSlideId) {
      setActiveTab('structure');
    }
  }, [activeSlideId]);

  // Effect to automatically scroll all panels to the top when the drawer is opened/reopened or tab/section changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const scrollables = asideRef.current?.querySelectorAll('.overflow-y-auto');
        if (scrollables) {
          scrollables.forEach((el) => {
            el.scrollTop = 0;
          });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, activeSection]);
  const [addMenuMode, setAddMenuMode] = useState<'element' | 'slide' | 'page'>('element');
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string | null>(null);

  // --- Draggable & Minimization States & Handlers for Control Panel ---
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left-click
    if (e.button !== 0) return;
    
    // Prevent default selection, text highlight, etc.
    e.preventDefault();
    
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: position.x, y: position.y };
  };

  const handleTouchStartDrag = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    initialPos.current = { x: position.x, y: position.y };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      setPosition({
        x: initialPos.current.x + deltaX,
        y: initialPos.current.y + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.current.x;
      const deltaY = touch.clientY - dragStart.current.y;
      setPosition({
        x: initialPos.current.x + deltaX,
        y: initialPos.current.y + deltaY
      });
    };

    const handleTouchEndDrag = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEndDrag);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEndDrag);
    };
  }, [isDragging]);

  // Reset minimization when the drawer is closed / opened
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const baseTransform = isMinimized
    ? 'translate3d(100%, 0, 0)'
    : isOpen
      ? `translate3d(${position.x}px, ${position.y}px, 0)`
      : 'translate3d(100%, 0, 0)';

  const asideStyle: React.CSSProperties = {
    transform: `${baseTransform} scale(${drawerScale})`,
    transformOrigin: 'top right',
    transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease-out',
    height: `calc((100vh - 104px) / ${drawerScale})`,
    bottom: 'auto',
  };

  // Page Colors sub-tab: 'default' (افتراضي) | 'custom' (شخصي)
  const [pageColorMode, setPageColorMode] = useState<'default' | 'custom'>('default');

  // Text Sub Section: 'size' (حجم الخط) | 'family' (نوع الخط)
  const [textSubSection, setTextSubSection] = useState<'size' | 'family'>('size');

  // Font Search & Filter States
  const [fontLangFilter, setFontLangFilter] = useState<'all' | 'ar' | 'lat'>('all');
  const [fontSearch, setFontSearch] = useState<string>('');

  // Add Elements State (Grid of Squares -> Detail View with Subcategories Bar)
  const [activeAddCategory, setActiveAddCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  
  // Iconify Search states
  const [iconifySearch, setIconifySearch] = useState('');
  const [iconifyResults, setIconifyResults] = useState<string[]>([]);
  const [isSearchingIconify, setIsSearchingIconify] = useState(false);

  useEffect(() => {
    if (!iconifySearch.trim()) {
      setIconifyResults([]);
      return;
    }
    const controller = new AbortController();
    const delayDebounce = setTimeout(async () => {
      setIsSearchingIconify(true);
      try {
        const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(iconifySearch)}&limit=80`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.icons)) {
            setIconifyResults(data.icons);
          } else {
            setIconifyResults([]);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error searching Iconify:', err);
        }
      } finally {
        setIsSearchingIconify(false);
      }
    }, 450);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [iconifySearch]);
  const [videoAddUrl, setVideoAddUrl] = useState<string>('');
  const [mapAddLocation, setMapAddLocation] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationDetectError, setLocationDetectError] = useState<string | null>(null);

  // Calendar Add Configuration States (Setup before adding to page)
  const [calAddTitle, setCalAddTitle] = useState<string>('حجز موعد استشارة جديدة');
  const [calAddAccentColor, setCalAddAccentColor] = useState<string>('#0071e3');
  const [calAddWorkingDays, setCalAddWorkingDays] = useState<string[]>(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);
  const [calAddHolidays, setCalAddHolidays] = useState<string[]>(['friday', 'saturday']);
  const [calAddWorkStart, setCalAddWorkStart] = useState<string>('09:00');
  const [calAddWorkEnd, setCalAddWorkEnd] = useState<string>('17:00');
  const [calAddBreakStart, setCalAddBreakStart] = useState<string>('12:00');
  const [calAddBreakEnd, setCalAddBreakEnd] = useState<string>('13:00');
  const [calAddInterval, setCalAddInterval] = useState<'10' | '15' | '30' | '60' | 'day' | 'manual'>('30');
  const [calAddIntervalMins, setCalAddIntervalMins] = useState<number>(30);
  const [calAddNeedsConfirmation, setCalAddNeedsConfirmation] = useState<boolean>(true);
  const [calAddMeetingTypes, setCalAddMeetingTypes] = useState<string[]>(['personal', 'phone', 'whatsapp']);
  const [calAddNameLabel, setCalAddNameLabel] = useState<string>('الاسم الكامل');
  const [calAddAddressLabel, setCalAddAddressLabel] = useState<string>('العنوان / مكان الإقامة');
  const [calAddPhoneLabel, setCalAddPhoneLabel] = useState<string>('رقم الهاتف المتنقل');
  const [calAddEmailLabel, setCalAddEmailLabel] = useState<string>('البريد الإلكتروني للعميل');
  const [calAddDescLabel, setCalAddDescLabel] = useState<string>('تفاصيل ووصف الطلب');
  const [calAddSlotsText, setCalAddSlotsText] = useState<string>('09:00 ص, 11:30 ص, 02:00 م, 04:30 م');
  const [calAddSettingsOpen, setCalAddSettingsOpen] = useState<boolean>(true);

  const handleDetectUserLocation = (onSuccess: (locStr: string) => void) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationDetectError('المتصفح لا يدعم خدمة تحديد الموقع الجغرافي.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationDetectError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detected = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        try {
          // Free reverse geocoding via OpenStreetMap Nominatim (No API key needed)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data?.address) {
              const parts = [
                data.address.road || data.address.neighbourhood || data.address.suburb,
                data.address.city || data.address.town || data.address.county || data.address.state,
                data.address.country
              ].filter(Boolean);
              if (parts.length > 0) {
                detected = parts.join('، ');
              } else if (data.display_name) {
                detected = data.display_name.split('،').slice(0, 3).join('،');
              }
            }
          }
        } catch {
          // Fallback to accurate GPS coordinates string
        }

        setIsDetectingLocation(false);
        onSuccess(detected);
      },
      (err) => {
        setIsDetectingLocation(false);
        let msg = 'تعذر الحصول على الموقع الجغرافي.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'يرجى السماح للمتصفح بالوصول إلى الموقع عند طلب الإذن.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'إشارة الـ GPS غير متوفرة حالياً.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'انتهت مهلة جلب الموقع، يرجى المحاولة مجدداً.';
        }
        setLocationDetectError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  const subCategoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollSubCategories = (dir: 'left' | 'right') => {
    if (subCategoryScrollRef.current) {
      subCategoryScrollRef.current.scrollBy({
        left: dir === 'left' ? -130 : 130,
        behavior: 'smooth'
      });
    }
  };

  // Reset to squares grid whenever elements tool is newly opened
  useEffect(() => {
    if (activeSection === 'elements') {
      setActiveAddCategory(null);
      setSelectedSubCategory('all');
    } else if (activeSection === 'add-text') {
      setActiveAddCategory('text');
      setSelectedSubCategory('all');
      setActiveTab('tool');
    } else if (activeSection === 'add-image') {
      setActiveAddCategory('image');
      setSelectedSubCategory('all');
      setActiveTab('tool');
    }
  }, [activeSection]);

  // Auto switch text sub-section based on incoming activeSection
  useEffect(() => {
    if (activeSection === 'fontFamily') {
      setTextSubSection('family');
    } else if (activeSection === 'fontSize' || activeSection === 'typography') {
      setTextSubSection('size');
    }
  }, [activeSection]);

  // Element gradient category filter state
  const [elementGradientCategory, setElementGradientCategory] = useState<string>('الكل');

  // Border Target state: 'element' | 'slide'
  const [borderTarget, setBorderTarget] = useState<'element' | 'slide'>('element');

  // Opacity Target state: 'element' | 'slide'
  const [opacityTarget, setOpacityTarget] = useState<'element' | 'slide'>('element');
  // Opacity Part state: 'element' | 'background' (العنصر / الخلفية)
  const [opacityPart, setOpacityPart] = useState<'element' | 'background'>('element');

  // Lighting Target state: 'element' | 'slide'
  const [lightingTarget, setLightingTarget] = useState<'element' | 'slide'>('element');

  // Shadow Target state: 'element' | 'slide'
  const [shadowTarget, setShadowTarget] = useState<'element' | 'slide'>('element');

  // Gallery Settings States
  const [unsplashPickerIndex, setUnsplashPickerIndex] = useState<number | null>(null);
  const [unsplashSearchQuery, setUnsplashSearchQuery] = useState('طبيعة');
  const [unsplashPhotos, setUnsplashPhotos] = useState<any[]>([]);
  const [isUnsplashLoading, setIsUnsplashLoading] = useState(false);
  const [galleryUploadingIndex, setGalleryUploadingIndex] = useState<number | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [galleryTargetReplaceIndex, setGalleryTargetReplaceIndex] = useState<number | null>(null);

  const handleLoadUnsplashForGallery = async (query: string) => {
    setIsUnsplashLoading(true);
    try {
      const res = await fetchUnsplashPhotos({ query, perPage: 16 });
      setUnsplashPhotos(res.items || []);
    } catch (e) {
      console.error('Failed to load unsplash photos for gallery', e);
    } finally {
      setIsUnsplashLoading(false);
    }
  };

  // Link Section State: 'page' (صفحة) | 'slide' (شريحة) | 'url' (URL) | 'contact' (تواصل)
  const [linkSubSection, setLinkSubSection] = useState<'page' | 'slide' | 'url' | 'contact'>('contact');
  const [contactMethod, setContactMethod] = useState<ContactType>('whatsapp');
  const [contactInputValue, setContactInputValue] = useState<string>('');
  const [urlInputValue, setUrlInputValue] = useState<string>('');

  // Sync link state with selectedElement
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.linkType) {
        setLinkSubSection(selectedElement.linkType);
      }
      if (selectedElement.contactType) {
        setContactMethod(selectedElement.contactType);
      }
      if (selectedElement.contactValue !== undefined) {
        setContactInputValue(selectedElement.contactValue);
      } else if (selectedElement.linkType === 'contact' && selectedElement.linkUrl) {
        setContactInputValue(selectedElement.linkUrl);
      }
      if (selectedElement.linkUrl && selectedElement.linkType === 'url') {
        setUrlInputValue(selectedElement.linkUrl);
      }
    }
  }, [selectedElement?.id, activeSection]);

  // Auto switch border target, opacity target, lighting target, and shadow target based on selection
  useEffect(() => {
    if (selectedElement) {
      setBorderTarget('element');
      setOpacityTarget('element');
      setLightingTarget('element');
      setShadowTarget('element');
    } else {
      setBorderTarget('slide');
      setOpacityTarget('slide');
      setLightingTarget('slide');
      setShadowTarget('slide');
    }
  }, [selectedElement]);

  // Custom Palette Slot Selection (1: bg, 2: card, 3: border, 4: text, 5: accent)
  const [customSlotIndex, setCustomSlotIndex] = useState<number>(0);

  // Custom Palette local state
  const defaultPalette: [string, string, string, string, string] = currentPage.colorPalette || [
    '#fbfbfd', '#ffffff', '#e5e5ea', '#1d1d1f', '#0071e3'
  ];
  const [customColors, setCustomColors] = useState<[string, string, string, string, string]>(defaultPalette);
  const [customBrightness, setCustomBrightness] = useState<number>(100);

  // When an icon/section is selected from outside, switch to 'tool' tab automatically
  useEffect(() => {
    setActiveTab('tool');
  }, [activeSection]);

  // Sync custom colors when page palette changes
  useEffect(() => {
    if (currentPage.colorPalette) {
      setCustomColors(currentPage.colorPalette);
    }
  }, [currentPage.colorPalette]);

  // Structure tree expansion states
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({
    [currentPage.id]: true,
  });

  const [expandedSlides, setExpandedSlides] = useState<Record<string, boolean>>({
    [activeSlideId]: true,
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'grp-hero': true,
  });

  // Table custom generator states
  const [tableAddColor, setTableAddColor] = useState<string>('#0071e3');
  const [tableAddRows, setTableAddRows] = useState<number>(3);
  const [tableAddCols, setTableAddCols] = useState<number>(3);
  const [tableAddColWidth, setTableAddColWidth] = useState<number>(120);
  const [tableAddRowHeight, setTableAddRowHeight] = useState<number>(40);
  const [tableAddHeaderRow, setTableAddHeaderRow] = useState<boolean>(true);
  const [tableAddIndexCol, setTableAddIndexCol] = useState<boolean>(false);

  // Touch gesture support for mobile swipe
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 50 && isOpen) {
      onClose();
    } else if (diff < -50 && !isOpen) {
      onToggle();
    }
    touchStartX.current = null;
  };

  const togglePageExpand = (pageId: string) => {
    setExpandedPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
    onSelectPage(pageId);
  };

  const toggleSlideExpand = (slideId: string) => {
    setExpandedSlides(prev => ({ ...prev, [slideId]: !prev[slideId] }));
    onSelectSlide(slideId);
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const slideElements = elements.filter(el => el.slideId === activeSlideId);
  const styles = selectedElement?.styles || {};

  // Group elements logic
  const groupContainers = slideElements.filter(el => el.type === 'shape' && el.isGroupContainer);
  
  // Construct dynamic children lists for each container
  const containerChildrenMap: Record<string, CanvasElement[]> = {};
  const allGroupedChildIds = new Set<string>();

  groupContainers.forEach(container => {
    const containerIndex = elements.findIndex(el => el.id === container.id);
    if (containerIndex !== -1) {
      const children = elements.filter((el, idx) => {
        if (el.slideId !== container.slideId) return false;
        if (idx <= containerIndex) return false;
        if (el.isLocked) return false;
        if (el.id === container.id) return false;
        if (el.type === 'shape' && el.isGroupContainer) return false;
        
        // Bounds check
        return (
          el.x >= container.x &&
          el.x + el.width <= container.x + container.width &&
          el.y >= container.y &&
          el.y + el.height <= container.y + container.height
        );
      });
      containerChildrenMap[container.id] = children;
      children.forEach(c => allGroupedChildIds.add(c.id));
    }
  });

  const groupsMap = groupContainers.reduce<Record<string, { name: string; elements: CanvasElement[]; container?: CanvasElement }>>((acc, container) => {
    acc[container.id] = {
      name: container.name || 'مجموعة عناصر',
      elements: containerChildrenMap[container.id] || [],
      container: container
    };
    return acc;
  }, {});

  // صورة مصغرة حقيقية لمحتوى المجموعة كما ستبدو فعلياً على الصفحة:
  // نرسم الحاوية وعناصرها بأحجامها وألوانها وأشكالها ونصوصها الحقيقية (بمقاسها الكامل)
  // ثم نصغّر اللوحة بأكملها عبر CSS transform:scale — فتكون معاينة أمينة لنفس
  // التصميم الفعلي (مو رموزاً أو أشرطة تخمينية)، وتعمل مع أي مجموعة حقيقية على الشريحة.
  const renderGroupChildPreview = (el: CanvasElement, offsetX: number, offsetY: number) => {
    const st = el.styles || {};
    const clip = el.clipPath ? `url(#${el.clipPath})` : undefined;
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: el.x - offsetX,
      top: el.y - offsetY,
      width: el.width,
      height: el.height,
      borderRadius: el.clipPath ? undefined : (typeof st.borderRadius === 'string' ? st.borderRadius : `${st.borderRadius || 0}px`),
      clipPath: clip,
      overflow: 'hidden',
    };

    if (el.type === 'image' || el.type === 'video') {
      return (
        <div key={el.id} style={{ ...baseStyle, backgroundColor: '#d1d5db' }}>
          {el.imageUrl && (
            <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      );
    }

    if (el.type === 'button' || el.type === 'badge' || el.type === 'input') {
      return (
        <div
          key={el.id}
          style={{
            ...baseStyle,
            backgroundColor: st.backgroundColor || (el.type === 'input' ? '#ffffff' : '#0071e3'),
            border: el.type === 'input' ? `1px solid ${st.borderColor || '#d1d5db'}` : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: st.textAlign === 'left' ? 'flex-start' : st.textAlign === 'center' ? 'center' : 'flex-end',
            color: st.color || '#ffffff',
            fontSize: st.fontSize || 14,
            fontWeight: st.fontWeight === 'bold' ? 'bold' : 'normal',
            whiteSpace: 'nowrap',
            padding: '0 4px',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{el.content}</span>
        </div>
      );
    }

    // shape زخرفي، أو عنوان/فقرة نصية
    const isShape = el.type === 'shape';
    return (
      <div
        key={el.id}
        style={{
          ...baseStyle,
          backgroundColor: isShape ? (st.backgroundColor || '#cbd5e1') : 'transparent',
          color: st.color || '#1d1d1f',
          fontSize: st.fontSize || 14,
          fontWeight: st.fontWeight === 'bold' ? 'bold' : 'normal',
          textAlign: st.textAlign || 'right',
          lineHeight: 1.15,
        }}
      >
        {!isShape && el.content}
      </div>
    );
  };

  const renderGroupThumb = (container: CanvasElement | undefined, groupChildren: CanvasElement[]) => {
    const cw = container?.width || 300;
    const ch = container?.height || 200;
    const outerW = 34;
    const outerH = 26;
    const scale = Math.min(outerW / cw, outerH / ch);
    const containerClip = container?.clipPath;
    const containerBgRaw = container?.styles?.backgroundColor;
    const containerBg = containerBgRaw && containerBgRaw !== 'transparent' ? containerBgRaw : 'transparent';
    const offsetX = container?.x || 0;
    const offsetY = container?.y || 0;

    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-[6px] border border-dashed border-black/10"
        style={{ width: outerW, height: outerH }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: cw,
            height: ch,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundColor: containerBg,
            borderRadius: containerClip ? undefined : 10,
            clipPath: containerClip ? `url(#${containerClip})` : undefined,
            border: container && !containerClip && containerBg !== 'transparent' ? `1px solid ${container.styles?.borderColor || 'rgba(0,0,0,0.08)'}` : undefined,
          }}
        >
          {groupChildren.map(child => renderGroupChildPreview(child, offsetX, offsetY))}
        </div>
      </div>
    );
  };

  const ungroupedElements = slideElements.filter(el =>
    !allGroupedChildIds.has(el.id) &&
    !(el.type === 'shape' && el.isGroupContainer)
  );

  // Update a single slot in the custom palette
  const handleUpdateCustomColorSlot = (slotIdx: number, newColor: string) => {
    const updated: [string, string, string, string, string] = [...customColors] as [string, string, string, string, string];
    updated[slotIdx] = newColor;
    setCustomColors(updated);
    onApplyPagePalette(updated);
  };

  // Helper title for current active adjustments section
  const getToolTitle = () => {
    switch (activeSection) {
      case 'page-settings': return 'تعديل الصفحة';
      case 'add-text': return 'اضافة نص';
      case 'add-image': return 'اضافة صورة';
      case 'elements':
        if (activeAddCategory === 'text') return 'اضافة نص';
        if (activeAddCategory === 'image') return 'اضافة صورة';
        return activeAddCategory ? `اضافة ${activeAddCategory}` : 'اضافة عناصر';
      case 'slides': return 'الشرائح';
      case 'navbar': return 'النافبار';
      case 'color': return 'الألوان';
      case 'background': return 'تعديل الخلفية';
      case 'border': return 'الإطار';
      case 'opacity': return 'الشفافية';
      case 'lighting': return 'الإضاءة';
      case 'shadow': return 'الظلال';
      case 'format': return 'التنسيق';
      case 'format-painter': return 'رول الدهان';
      case 'alignment':
      case 'typography':
      case 'fontSize':
      case 'fontFamily':
      case 'list': 
        return 'تعديل النص';
      case 'animation': return 'الحركات';
      case 'layers': return 'الطبقات';
      case 'link': return 'إضافة رابط';
      case 'grid': return 'الجدول';
      case 'gallery': return 'إعدادات المعرض';
      case 'grouping': return 'المجموعات';
      case 'wee-ai': return 'Wee AI';
      default: return 'التعديلات';
    }
  };

  const getElementIcon = (type: ElementType) => {
    switch (type) {
      case 'heading': return <Type size={12} className="text-[#0071e3]" />;
      case 'paragraph': return <AlignLeft size={12} className="text-neutral-500" />;
      case 'button': return <Square size={12} className="text-[#0071e3]" />;
      case 'card': return <CreditCard size={12} className="text-purple-500" />;
      case 'image': return <ImageIcon size={12} className="text-emerald-500" />;
      case 'input': return <FormInput size={12} className="text-amber-500" />;
      case 'table': return <Grid3X3 size={12} className="text-blue-500" />;
      case 'gallery': return <Images size={12} className="text-pink-500" />;
      case 'divider': return <Minus size={12} className="text-neutral-400" />;
      case 'shape': return <Shapes size={12} className="text-indigo-500" />;
      case 'badge': return <BadgeCheck size={12} className="text-amber-500" />;
      case 'icon': return <Smile size={12} className="text-fuchsia-500" />;
      case 'video': return <Video size={12} className="text-rose-500" />;
      case 'map': return <MapPin size={12} className="text-emerald-600" />;
      case 'pricing': return <Tag size={12} className="text-amber-600" />;
      case 'calendar': return <Calendar size={12} className="text-blue-600" />;
      case 'html': return <Code size={12} className="text-violet-600" />;
      default: return <Component size={12} className="text-neutral-400" />;
    }
  };

  const slotLabels = ['الخلفية', 'الصناديق', 'الإطارات', 'النصوص', 'البراند'];

  if (isPreviewActive) {
    return null;
  }

  return (
    <>
      {/* Floating Edge Arrow Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-32 right-0 z-[101] w-7 h-11 bg-white/95 backdrop-blur-md border border-r-0 border-neutral-300 rounded-l-xl shadow-[-3px_2px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-neutral-600 hover:text-[#0071e3] transition-all hover:w-8 active:scale-95 group focus:outline-none"
        title={isOpen ? "إغلاق لوحة التحكم" : "فتح لوحة التحكم"}
        aria-label={isOpen ? "إغلاق لوحة التحكم" : "فتح لوحة التحكم"}
      >
        {isOpen ? (
          <ChevronRight size={16} strokeWidth={2.4} className="text-neutral-500 group-hover:text-[#0071e3] transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft size={16} strokeWidth={2.4} className="text-neutral-500 group-hover:text-[#0071e3] transition-transform group-hover:-translate-x-0.5" />
        )}
      </button>

      {/* 
        Control Panel Drawer (~20% of page)
        Enclosed in distinct outer border as shown in sketch
        2 Top Tabs: [الهيكل] and [تعديل الصفحة / أداة التعديل]
      */}
      <aside
        ref={asideRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={asideStyle}
        className={`fixed top-26 right-0 bottom-0 z-[100] w-[320px] sm:w-[350px] md:w-[24vw] min-w-[290px] max-w-[430px] bg-white border-l-2 border-t-2 border-b-2 border-neutral-300 shadow-[-16px_0_40px_rgba(0,0,0,0.12)] rounded-l-2xl flex flex-col select-none text-right overflow-visible ${
          isOpen && !isMinimized ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        dir="rtl"
      >
        {/* Striped Drag Handle Bar */}
        <div 
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStartDrag}
          className="h-6 w-full bg-neutral-100 bg-[repeating-linear-gradient(-45deg,#d4d4d8,#d4d4d8_2px,transparent_2px,transparent_6px)] cursor-grab active:cursor-grabbing border-b border-neutral-300 flex items-center justify-between px-3.5 relative select-none shrink-0"
          title="اسحب لوحة التحكم من هنا لتحريكها فوق مساحة العمل ✦"
        >
          {/* Small Curved Arrow to Reset position */}
          {(position.x !== 0 || position.y !== 0) ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPosition({ x: 0, y: 0 });
              }}
              className="w-4 h-4 rounded bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-600 hover:text-[#0071e3] flex items-center justify-center transition-all shadow-3xs cursor-pointer focus:outline-none active:scale-95"
              title="إعادة لوحة التحكم إلى موقعها الافتراضي"
            >
              <RotateCcw size={10} strokeWidth={2.8} />
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}
          
          <div className="text-[9px] font-bold text-neutral-500 tracking-wide select-none">
            اسحب للتحريك ✦ DRAG HANDLE
          </div>

          <div className="w-4 h-4" />
        </div>

        {/* Top Header with Close & Minimize Buttons */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1.5 bg-[#f5f5f7] border-b border-neutral-200 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0071e3] animate-pulse" />
            <span className="text-[11.5px] font-bold text-neutral-800">
              لوحة التحكم
            </span>
            {/* AI Toggle Button next to name */}
            <button
              type="button"
              onClick={toggleWeeAiChat}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9.5px] font-black transition-all cursor-pointer ${
                isWeeAiChatCollapsed 
                  ? 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20 hover:bg-[#0071e3]/25' 
                  : 'bg-green-600/10 text-green-600 border-green-600/20 hover:bg-green-600/25'
              }`}
              title={isWeeAiChatCollapsed ? "فتح مساعد الذكاء الاصطناعي" : "طي مساعد الذكاء الاصطناعي"}
            >
              <Sparkles size={11} className={isWeeAiChatCollapsed ? 'text-[#0071e3]' : 'text-green-600 animate-pulse'} />
              <span>wee ai</span>
              {isWeeAiChatCollapsed ? (
                <ChevronDown size={11} strokeWidth={2.8} />
              ) : (
                <ChevronUp size={11} strokeWidth={2.8} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Minimize button */}
            <button
              onClick={() => setIsMinimized(true)}
              className="w-6 h-6 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-600 hover:text-black flex items-center justify-center transition-all focus:outline-none cursor-pointer"
              title="تصغير اللوحة لأيقونة عائمة"
            >
              <Minus size={12} strokeWidth={2.5} />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-600 hover:text-red-600 flex items-center justify-center transition-all focus:outline-none cursor-pointer"
              title="إغلاق اللوحة"
            >
              <X size={12} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* 
          TABS AT THE TOP (Exact Match to User Drawing 1):
          Right Tab: الهيكل
          Left Tab: تعديل الصفحة (أو الأداة الحالية)
        */}
        <div className="flex items-end px-3 pt-1 border-b-2 border-neutral-300 bg-[#f5f5f7] gap-2">
          {/* Tab 1: الهيكل */}
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-t-xl transition-all border-t-2 border-x-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'structure'
                ? 'bg-white border-neutral-300 text-[#1d1d1f] shadow-xs relative -mb-[2px] z-10'
                : 'bg-neutral-200/80 border-transparent text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <FolderTree size={13} />
            <span>الهيكل</span>
          </button>

          {/* Tab 2: تعديل الصفحة أو التعديل الحالي */}
          <button
            onClick={() => setActiveTab('tool')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-t-xl transition-all border-t-2 border-x-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'tool'
                ? 'bg-white border-neutral-300 text-[#0071e3] shadow-xs relative -mb-[2px] z-10'
                : 'bg-neutral-200/80 border-transparent text-neutral-600 hover:text-black hover:bg-neutral-200'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span className="truncate">{getToolTitle()}</span>
          </button>
        </div>

        {/* TAB 1: الهيكل (Structure) */}
        {activeTab === 'structure' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-white text-right">
            {pages.map((p) => {
              const isPageExpanded = !!expandedPages[p.id];
              const isCurrentPage = p.id === currentPage.id;

              return (
                <div key={p.id} className="space-y-2">
                  {/* 1. الصفحات الرئيسية ضمن كبسولات رمادية */}
                  <div
                    className={`group w-full py-2 px-4 rounded-full flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                      isCurrentPage
                        ? 'bg-neutral-300 text-neutral-900 font-bold ring-1 ring-neutral-400/60'
                        : 'bg-neutral-200 hover:bg-neutral-300/80 text-neutral-800 font-semibold'
                    }`}
                    title="انقر لفتح شرائح الصفحة"
                  >
                    <div 
                      onClick={() => togglePageExpand(p.id)}
                      className="flex items-center gap-2 truncate flex-1 py-0.5"
                    >
                      <FileText size={14} className="text-neutral-700 shrink-0" />
                      <span className="text-xs truncate">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-500 shrink-0">
                      {/* عدد الشرائح بالوضع الطبيعي */}
                      <span className="text-[10px] opacity-75 font-mono group-hover:hidden">
                        {p.slides.length} شريحة
                      </span>
                      
                      {/* أزرار السهام والحذف عند التمرير */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onMovePage(p.id, 'up'); }}
                          className="p-1 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                          title="تحريك لأعلى"
                        >
                          <ArrowUp size={11} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onMovePage(p.id, 'down'); }}
                          className="p-1 text-neutral-600 hover:text-blue-600 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown size={11} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDeletePage(p.id); }}
                          className="p-1 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          title="حذف الصفحة"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      <ChevronDown 
                        size={13} 
                        className={`transition-transform duration-200 ${isPageExpanded ? 'rotate-180' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); togglePageExpand(p.id); }}
                      />
                    </div>
                  </div>

                  {/* 2. الشرائح التي تضمها الصفحة (كبسولات أقصر قليلاً وبلون أفتح) */}
                  {isPageExpanded && (
                    <div className="pr-3 pl-1 space-y-2 border-r-2 border-neutral-200 mr-4 mt-1">
                      {p.slides.map((s) => {
                        const isSlideActive = s.id === activeSlideId;
                        const isSlideExpanded = !!expandedSlides[s.id];
                        const slideItemElements = elements.filter(el => el.slideId === s.id);

                        return (
                          <div key={s.id} className="space-y-1.5">
                            <div
                              className={`group w-full py-1.5 px-3.5 rounded-full flex items-center justify-between transition-all cursor-pointer border ${
                                isSlideActive
                                  ? 'bg-white border-[#0071e3] text-[#0071e3] shadow-xs font-bold'
                                  : 'bg-neutral-100 hover:bg-neutral-200/60 border-neutral-200 text-neutral-700 font-medium'
                              }`}
                              title="انقر لعرض المجموعات والعناصر"
                            >
                              <div 
                                onClick={() => {
                                  onSelectSlide(s.id);
                                  toggleSlideExpand(s.id);
                                }}
                                className="flex items-center gap-2 truncate flex-1 py-0.5"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSlideActive ? 'bg-[#0071e3]' : 'bg-neutral-400'}`} />
                                <span className="text-[11px] truncate">{s.name}</span>
                              </div>

                              <div className="flex items-center gap-1 text-neutral-400 shrink-0">
                                {/* الارتفاع بالوضع الطبيعي */}
                                <span className="text-[9px] font-mono group-hover:hidden">{s.height}px</span>
                                
                                {/* أزرار السهام والحذف للشريحة عند التمرير */}
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity duration-150">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onMoveSlide(s.id, 'up'); }}
                                    className="p-0.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                                    title="تحريك لأعلى"
                                  >
                                    <ArrowUp size={11} strokeWidth={2.2} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onMoveSlide(s.id, 'down'); }}
                                    className="p-0.5 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                                    title="تحريك لأسفل"
                                  >
                                    <ArrowDown size={11} strokeWidth={2.2} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onDeleteSlide(s.id); }}
                                    className="p-0.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                    title="حذف الشريحة"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>

                                <ChevronDown 
                                  size={11} 
                                  className={`transition-transform duration-200 ${isSlideExpanded ? 'rotate-180' : ''}`} 
                                  onClick={(e) => { e.stopPropagation(); toggleSlideExpand(s.id); }}
                                />
                              </div>
                            </div>

                            {/* محتويات الشريحة: المجموعات المميزة بصرياً، وتحتها باقي العناصر بدون إطارات */}
                            {isSlideExpanded && isSlideActive && (
                              <div className="pr-3 space-y-1.5 mr-2 mt-1">
                                {Object.entries(groupsMap).map(([gId, grp]) => {
                                  const isGroupExpanded = !!expandedGroups[gId];

                                  return (
                                    <div key={gId} className="space-y-1">
                                      <button
                                        onClick={() => {
                                          toggleGroupExpand(gId);
                                          if (grp.container) {
                                            onSelectElement(grp.container.id);
                                          }
                                        }}
                                        className="w-full py-1.5 px-3 rounded-2xl bg-blue-50/90 hover:bg-blue-100/90 border border-blue-200/80 text-blue-900 flex items-center justify-between transition-all cursor-pointer shadow-3xs"
                                        title="مجموعة عناصر"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          {renderGroupThumb(grp.container, grp.elements)}
                                          <span className="text-[10.5px] font-bold truncate">
                                            {grp.name}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-blue-600/70 shrink-0">
                                          <span className="text-[9px]">({grp.elements.length})</span>
                                          <ChevronDown 
                                            size={10} 
                                            className={`transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`} 
                                          />
                                        </div>
                                      </button>

                                      {/* العناصر داخل المجموعة: بدون إطارات */}
                                      {isGroupExpanded && (
                                        <div className="pr-3 space-y-0.5">
                                          {grp.elements.map((el) => {
                                            const isSelected = el.id === selectedElement?.id;

                                            return (
                                              <div
                                                key={el.id}
                                                className={`group w-full text-right py-1 px-2.5 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                                                  isSelected
                                                    ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold'
                                                    : 'text-neutral-600 hover:text-black hover:bg-black/[0.04]'
                                                }`}
                                              >
                                                <div 
                                                  onClick={() => onSelectElement(el.id)}
                                                  className="flex items-center gap-2 truncate flex-1 py-0.5"
                                                >
                                                  {getElementIcon(el.type)}
                                                  <span className="text-[11px] truncate">{el.name}</span>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-opacity duration-150 cursor-pointer"
                                                    title="حذف العنصر"
                                                  >
                                                    <Trash2 size={10} />
                                                  </button>
                                                  {el.isLocked ? (
                                                    <Lock size={10} className="text-amber-500 shrink-0" />
                                                  ) : null}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* وتحت المجموعات باقي العناصر: بدون إطارات */}
                                {ungroupedElements.map((el) => {
                                  const isSelected = el.id === selectedElement?.id;

                                  return (
                                    <div
                                      key={el.id}
                                      className={`group w-full text-right py-1 px-2.5 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold'
                                          : 'text-neutral-600 hover:text-black hover:bg-black/[0.04]'
                                      }`}
                                    >
                                      <div 
                                        onClick={() => onSelectElement(el.id)}
                                        className="flex items-center gap-2 truncate flex-1 py-0.5"
                                      >
                                        {getElementIcon(el.type)}
                                        <span className="text-[11px] truncate">{el.name}</span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }}
                                          className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-opacity duration-150 cursor-pointer"
                                          title="حذف العنصر"
                                        >
                                          <Trash2 size={10} />
                                        </button>
                                        {el.isLocked ? (
                                          <Lock size={10} className="text-amber-500 shrink-0" />
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })}

                                {slideItemElements.length === 0 && (
                                  <div className="text-[10px] text-neutral-400 py-1 pr-1">
                                    لا توجد عناصر في هذه الشريحة حالياً
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: تعديل الصفحة / أداة التعديل */}
        {activeTab === 'tool' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-white text-right">

            {/* ============================================================== */}
            {/* SPECIAL SECTION: تعديل الصفحة (PAGE SETTINGS) AS IN USER DRAWINGS */}
            {/* ============================================================== */}
            {activeSection === 'page-settings' && (
              <div className="space-y-4">

                {/* 1. اسم الصفحة (كما في الصورة الأولى) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800 block">
                    اسم الصفحة:
                  </label>
                  <input
                    type="text"
                    value={currentPage.name}
                    onChange={(e) => onUpdatePage({ name: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-300 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
                    placeholder="اسم الصفحة..."
                  />
                </div>

                {/* 2. ألوان الصفحة (تحت اسم الصفحة - خيارين: افتراضي وشخصي) */}
                <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      ألوان الصفحة:
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      (خلفية، صناديق، إطارات، نصوص، براند)
                    </span>
                  </div>

                  {/* Sub-tabs: افتراضي | شخصي (كما في الصورة الأولى) */}
                  <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-200 gap-1">
                    <button
                      onClick={() => setPageColorMode('default')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        pageColorMode === 'default'
                          ? 'bg-white text-[#0071e3] shadow-xs'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      افتراضي
                    </button>
                    <button
                      onClick={() => setPageColorMode('custom')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        pageColorMode === 'custom'
                          ? 'bg-white text-[#0071e3] shadow-xs'
                          : 'text-neutral-600 hover:text-black'
                      }`}
                    >
                      شخصي
                    </button>
                  </div>

                  {/* MODE A: افتراضي - 20 خيار لألوان متناسقة كل خيار فيه 5 ألوان */}
                  {pageColorMode === 'default' && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[10.5px] text-neutral-500 font-medium leading-relaxed">
                        اختر مجموعة ألوان متناسقة لتطبيقها فوراً على كامل الصفحة وعناصرها (20 مجموعة):
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {TWENTY_PAGE_PALETTES.map((pal) => {
                          const isCurrentActive = 
                            currentPage.colorPalette && 
                            currentPage.colorPalette[0] === pal.colors[0] &&
                            currentPage.colorPalette[4] === pal.colors[4];

                          return (
                            <button
                              key={pal.id}
                              onClick={() => {
                                onApplyPagePalette(pal.colors);
                                setCustomColors(pal.colors);
                              }}
                              className={`w-full p-2 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                                isCurrentActive
                                  ? 'border-[#0071e3] bg-[#0071e3]/5 ring-1 ring-[#0071e3]'
                                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80'
                              }`}
                            >
                              <span className="text-[11px] font-bold text-neutral-800 truncate">
                                {pal.name}
                              </span>

                              {/* 5 Color Circles */}
                              <div className="flex items-center gap-1 shrink-0">
                                {pal.colors.map((c, i) => (
                                  <span
                                    key={i}
                                    className="w-4 h-4 rounded-full border border-black/15 shadow-3xs"
                                    style={{ backgroundColor: c }}
                                    title={`${slotLabels[i]}: ${c}`}
                                  />
                                ))}
                                {isCurrentActive && (
                                  <Check size={12} className="text-[#0071e3] mr-1" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* MODE B: شخصي - كما في الرسم السفلي بالصورة الأولى */}
                  {pageColorMode === 'custom' && (
                    <div className="space-y-3 pt-1">
                      {/* 5 Circles at the top */}
                      <div className="flex items-center justify-around p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        {customColors.map((c, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCustomSlotIndex(idx)}
                            className={`flex flex-col items-center gap-1 group transition-transform ${
                              customSlotIndex === idx ? 'scale-110' : 'opacity-85 hover:opacity-100'
                            }`}
                          >
                            <span 
                              className={`w-7 h-7 rounded-full border border-black/15 shadow-xs flex items-center justify-center ${
                                customSlotIndex === idx ? 'ring-2 ring-[#0071e3] ring-offset-2' : ''
                              }`}
                              style={{ backgroundColor: c }}
                            >
                              {customSlotIndex === idx && (
                                <Check size={12} className={c === '#ffffff' || c === '#fbfbfd' ? 'text-black' : 'text-white'} />
                              )}
                            </span>
                            <span className="text-[9px] font-medium text-neutral-500">
                              {slotLabels[idx]}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* غامق / فاتح (Dark / Light Buttons) */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            const lightPal: [string, string, string, string, string] = [
                              '#fbfbfd', '#ffffff', '#e5e5ea', '#1d1d1f', customColors[4] || '#0071e3'
                            ];
                            setCustomColors(lightPal);
                            onApplyPagePalette(lightPal);
                          }}
                          className="py-1.5 px-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 text-center"
                        >
                          فاتح (Light)
                        </button>
                        <button
                          onClick={() => {
                            const darkPal: [string, string, string, string, string] = [
                              '#0f172a', '#1e293b', '#334155', '#f8fafc', customColors[4] || '#38bdf8'
                            ];
                            setCustomColors(darkPal);
                            onApplyPagePalette(darkPal);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-neutral-900 text-white hover:bg-black text-xs font-semibold text-center"
                        >
                          غامق (Dark)
                        </button>
                      </div>

                      {/* الإضاءة (Brightness with Sun Icon) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-neutral-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Sun size={13} className="text-amber-500" />
                            الإضاءة:
                          </span>
                          <span className="font-mono">{customBrightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={customBrightness}
                          onChange={(e) => setCustomBrightness(Number(e.target.value))}
                          className="w-full accent-[#0071e3]"
                        />
                      </div>

                      {/* Numbered Pill Selector: ( 1 ) ( 2 ) ( 3 ) ( 4 ) ( 5 ) */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-neutral-700 block">
                          تحديد رقم اللون للتعديل:
                        </span>
                        <div className="flex items-center rounded-full bg-neutral-100 p-1 border border-neutral-200">
                          {[0, 1, 2, 3, 4].map((idx) => (
                            <button
                              key={idx}
                              onClick={() => setCustomSlotIndex(idx)}
                              className={`flex-1 py-1 text-xs font-bold rounded-full transition-all ${
                                customSlotIndex === idx
                                  ? 'bg-[#0071e3] text-white shadow-2xs'
                                  : 'text-neutral-600 hover:text-black'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* مربع اختيار اللون العام (Color Picker Box) */}
                      <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-800">
                            اختيار اللون للخانة ({customSlotIndex + 1}: {slotLabels[customSlotIndex]}):
                          </span>
                          <span 
                            className="w-5 h-5 rounded-md border border-black/10" 
                            style={{ backgroundColor: customColors[customSlotIndex] }} 
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColors[customSlotIndex]}
                            onChange={(e) => handleUpdateCustomColorSlot(customSlotIndex, e.target.value)}
                            className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={customColors[customSlotIndex]}
                            onChange={(e) => handleUpdateCustomColorSlot(customSlotIndex, e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 3. أشكال تداخل الشرائح مع بعضها (كما في الصورة الثانية - 12 خيار على الأقل) */}
                <div className="space-y-2.5 pt-3 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      أمثلة تداخل الشرائح:
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      (تداخل الشريحة النشطة)
                    </span>
                  </div>

                  <div className="text-[10.5px] text-neutral-500 font-medium">
                    مربعات صغيرة بلونين توضح طريقة تداخل الشريحة الحالية مع الشريحة التي تليها (12 خياراً):
                  </div>

                  {/* 12 Mini Two-Tone Transition Preview Squares */}
                  <div className="grid grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {SLIDE_DIVIDER_OPTIONS.map((divOpt) => {
                      const isSelected = (activeSlide.dividerShape || 'straight') === divOpt.id;

                      return (
                        <button
                          key={divOpt.id}
                          onClick={() => onUpdateSlideDivider(activeSlide.id, divOpt.id)}
                          className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0071e3] bg-[#0071e3]/5 ring-2 ring-[#0071e3]/40 shadow-xs'
                              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                          title={divOpt.name}
                        >
                          {/* Mini 2-tone Preview Box */}
                          <div className="w-full h-11 border border-black/10 rounded-md overflow-hidden shadow-2xs">
                            {divOpt.renderPreview(isSelected)}
                          </div>

                          <span className={`text-[9.5px] truncate w-full ${
                            isSelected ? 'font-bold text-[#0071e3]' : 'text-neutral-600'
                          }`}>
                            {divOpt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ============================================================== */}
            {/* OTHER TOOL SECTIONS */}
            {/* ============================================================== */}

            {/* TOOL: Color (الألوان - لون صلب، وتدرج لوني يطبق على النص/العنصر نفسه) */}
            {activeSection === 'color' && isNavbarSelected && navbar && (
              <div className="space-y-4 text-right" dir="rtl">
                <SectionHeader title="لون نصوص النافبار" />
                <ColorSwatchPicker
                  swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
                  selectedValue={navbar.textColor}
                  onSelect={(color) => onUpdateNavbar({ textColor: color })}
                />
              </div>
            )}

            {activeSection === 'color' && !isNavbarSelected && (
              <div className="space-y-4 text-right" dir="rtl">

                {(selectedElement?.type === 'image' || selectedElement?.type === 'gallery') ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
                      <span className="text-[11px] font-bold text-[#0071e3]">
                        {selectedElement.type === 'gallery' ? 'تعديل ألوان وفلاتر صور المعرض: ' : 'تعديل ألوان وفلاتر الصورة: '}
                        {selectedElement.name}
                      </span>
                    </div>

                    {/* 1. فلاتر وتأثيرات ألوان الصورة */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          فلاتر وتأثيرات الألوان الجاهزة:
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (فلاتر بصرية)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                        {[
                          { id: 'none', name: 'أصلي (الطبيعي)', preview: '🖼️' },
                          { id: 'grayscale', name: 'أبيض وأسود', preview: '🌗' },
                          { id: 'warm', name: 'عتيق دافئ', preview: '🌅' },
                          { id: 'cool', name: 'أزرق بارد', preview: '❄️' },
                          { id: 'vintage', name: 'كلاسيكي قديم', preview: '🕰️' },
                          { id: 'technicolor', name: 'سينمائي زاهي', preview: '🎬' },
                          { id: 'invert', name: 'عكس الألوان', preview: '🧩' },
                          { id: 'blur', name: 'تغبيش / ضبابي', preview: '🌫️' }
                        ].map((filterOpt) => {
                          const isSelected = (styles.imageFilter || 'none') === filterOpt.id;
                          return (
                            <button
                              key={filterOpt.id}
                              type="button"
                              onClick={() => onUpdateElementStyles({ imageFilter: filterOpt.id === 'none' ? undefined : filterOpt.id })}
                              className={`p-2 rounded-xl border text-[11px] font-semibold text-right transition-all flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]'
                                  : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              <span className="text-sm select-none">{filterOpt.preview}</span>
                              <span className="truncate">{filterOpt.name}</span>
                              {isSelected && <Check size={12} className="text-[#0071e3] mr-auto shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. تلوين مخصص من مكتبة الخمسين لون الأساسية */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          تغيير ألوان الصورة من الـ 50 لوناً الأساسية:
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (صبغ وتلوين دمج)
                        </span>
                      </div>

                      <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
                        <div className="grid grid-cols-10 gap-1.5 justify-items-center">
                          {FIFTY_SOLID_COLORS.map((hex, idx) => {
                            const isSelected = styles.imageTintColor?.toLowerCase() === hex.toLowerCase();
                            return (
                              <button
                                key={`image-tint-fifty-${idx}-${hex}`}
                                type="button"
                                onClick={() => onUpdateElementStyles({ imageTintColor: hex })}
                                className={`w-5.5 h-5.5 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                                  isSelected ? 'ring-2 ring-[#0071e3] ring-offset-1 scale-110 z-10' : ''
                                }`}
                                style={{ backgroundColor: hex }}
                                title={`تلوين: ${hex}`}
                              >
                                {isSelected && (
                                  <Check 
                                    size={10} 
                                    className={['#ffffff', '#fafafa', '#f5f5f7'].includes(hex) ? 'text-black' : 'text-white'} 
                                    strokeWidth={3} 
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* إزالة التلوين */}
                      {styles.imageTintColor && (
                        <button
                          type="button"
                          onClick={() => onUpdateElementStyles({ imageTintColor: undefined })}
                          className="w-full py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-red-200/55"
                        >
                          <span>إزالة تلوين الصورة ✕</span>
                        </button>
                      )}
                    </div>

                    {/* 3. شريط كثافة التلوين (إذا كان مفعلاً) */}
                    {styles.imageTintColor && (
                      <>
                        <div className="space-y-1.5 pt-1 border-t border-neutral-200/80">
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-700 font-bold">كثافة صبغ الألوان (Tint Intensity):</span>
                            <span className="font-mono text-[#0071e3] font-bold">{styles.imageTintOpacity ?? 50}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={styles.imageTintOpacity ?? 50}
                            onChange={(e) => onUpdateElementStyles({ imageTintOpacity: Number(e.target.value) })}
                            className="w-full accent-[#0071e3]"
                          />
                        </div>

                        {/* 4. نمط دمج الألوان */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs font-bold text-neutral-800 block">
                            نمط دمج وصبغ الألوان (Blend Mode):
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { id: 'multiply', label: 'مضاعفة ✦' },
                              { id: 'color', label: 'تلوين كامل' },
                              { id: 'overlay', label: 'تراكب' },
                              { id: 'screen', label: 'شاشة' }
                            ].map((blend) => {
                              const isSelected = (styles.imageTintBlendMode || 'multiply') === blend.id;
                              return (
                                <button
                                  key={blend.id}
                                  type="button"
                                  onClick={() => onUpdateElementStyles({ imageTintBlendMode: blend.id })}
                                  className={`py-1.5 px-0.5 rounded-lg border text-[10px] font-semibold text-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]'
                                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600'
                                  }`}
                                >
                                  {blend.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 1. الألوان الإلزامية */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          الألوان الإلزامية للعنصر:
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (أساسيات التصميم)
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200/70">
                        {MANDATORY_BG_COLORS.map((item) => {
                          const isSelected = styles.color === item.value;
                          return (
                            <button
                              key={`element-mandatory-${item.name}`}
                              onClick={() => onUpdateElementStyles({ color: item.value })}
                              className="group relative flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                              title={item.name}
                            >
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                  item.border ? 'border border-neutral-300' : 'border border-black/15'
                                } ${
                                  isSelected 
                                    ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-105 shadow-xs' 
                                    : 'shadow-2xs'
                                }`}
                                style={{
                                  backgroundColor: item.value === 'transparent' ? '#ffffff' : item.value,
                                  backgroundImage: item.value === 'transparent' 
                                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' 
                                    : undefined,
                                  backgroundSize: item.value === 'transparent' ? '8px 8px' : undefined,
                                }}
                              >
                                {isSelected && (
                                  <Check 
                                    size={14} 
                                    className={item.value === '#18181b' ? 'text-white' : 'text-[#0071e3]'} 
                                    strokeWidth={2.8}
                                  />
                                )}
                              </div>
                              <span className="text-[9.5px] font-medium text-neutral-600 truncate max-w-[48px]">
                                {item.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. منحدر لوني - 50 لون */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          منحدر لوني (50 لون):
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (ألوان صلبة دقيقة)
                        </span>
                      </div>

                      <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
                        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                          {FIFTY_SOLID_COLORS.map((hex, idx) => {
                            const isSelected = styles.color?.toLowerCase() === hex.toLowerCase();
                            return (
                              <button
                                key={`element-fifty-${idx}-${hex}`}
                                onClick={() => onUpdateElementStyles({ color: hex })}
                                className={`w-6 h-6 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                                  isSelected ? 'ring-2 ring-[#0071e3] ring-offset-1 scale-110 z-10' : ''
                                }`}
                                style={{ backgroundColor: hex }}
                                title={`لون ${idx + 1}: ${hex}`}
                              >
                                {isSelected && (
                                  <Check 
                                    size={11} 
                                    className={['#ffffff', '#fafafa', '#f5f5f7', '#e5e5ea', '#fffbeb', '#fef3c7'].includes(hex) ? 'text-black' : 'text-white'} 
                                    strokeWidth={3} 
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. ألوان تدريجية متنوعة مخلطة */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      تدرجات لونية عصرية للعنصر:
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      (تطبق على النص أو العنصر)
                    </span>
                  </div>

                  {/* الصف العلوي: باستيل ناعم */}
                  <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/60 space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-500 mb-1">
                      باستيل ناعم متعدد النغمات:
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                      {PASTEL_SOFT_GRADIENTS.map((grad) => {
                        const isSelected = styles.color === grad.value;
                        return (
                          <button
                            key={`element-pastel-${grad.id}`}
                            onClick={() => onUpdateElementStyles({ color: grad.value })}
                            className={`w-7 h-7 rounded-full border border-black/10 shadow-3xs flex items-center justify-center transition-all hover:scale-125 cursor-pointer ${
                              isSelected ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-110 z-10' : ''
                            }`}
                            style={{ background: grad.value }}
                            title={grad.name}
                          >
                            {isSelected && (
                              <Check size={12} className="text-neutral-800" strokeWidth={3} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* تصنيفات التدرج للفلترة */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                    {[
                      { id: 'الكل', label: 'الكل' },
                      { id: 'sunset', label: 'شفق وغروب' },
                      { id: 'neon', label: 'نيون وكوزميك' },
                      { id: 'ocean', label: 'طبيعة وبحر' },
                      { id: 'metallic', label: 'ميتاليك وفخامة' },
                      { id: 'dark', label: 'ليلي داكن' },
                    ].map((filterTab) => (
                      <button
                        key={`element-filter-${filterTab.id}`}
                        onClick={() => setElementGradientCategory(filterTab.id)}
                        className={`text-[9.5px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                          elementGradientCategory === filterTab.id
                            ? 'bg-[#0071e3] text-white shadow-2xs'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-black'
                        }`}
                      >
                        {filterTab.label}
                      </button>
                    ))}
                  </div>

                  {/* شبكة التدرجات */}
                  <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-48 overflow-y-auto pr-1">
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 justify-items-center">
                      {RICH_MULTI_GRADIENTS
                        .filter(g => elementGradientCategory === 'الكل' || g.category === elementGradientCategory)
                        .map((grad) => {
                          const isSelected = styles.color === grad.value;
                          return (
                            <button
                              key={`element-grad-${grad.id}`}
                              onClick={() => onUpdateElementStyles({ color: grad.value })}
                              className={`w-7 h-7 rounded-full border border-black/10 shadow-2xs flex items-center justify-center transition-all hover:scale-125 cursor-pointer ${
                                isSelected ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-110 z-10' : 'hover:z-10'
                              }`}
                              style={{ background: grad.value }}
                              title={grad.name}
                            >
                              {isSelected && (
                                <Check size={12} className="text-white drop-shadow-md" strokeWidth={3} />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* منتقي مخصص مع الإدخال */}
                <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
                    <input
                      type="color"
                      value={styles.color?.startsWith('#') ? styles.color : '#ffffff'}
                      onChange={(e) => onUpdateElementStyles({ color: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={styles.color || '#1d1d1f'}
                      onChange={(e) => onUpdateElementStyles({ color: e.target.value })}
                      placeholder="#1d1d1f"
                      className="flex-1 text-xs px-2 py-1 bg-white rounded-md border border-neutral-200 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TOOL: Shadow (الظلال) */}
            {activeSection === 'shadow' && isNavbarSelected && navbar && (
              <div className="space-y-5 text-right" dir="rtl">
                <SectionHeader title="ظلال النافبار الخارجية" />
                <Slider
                  label="شدة الظل"
                  value={navbar.glowIntensity ?? 0}
                  min={0}
                  max={100}
                  onChange={(v) => onUpdateNavbar({ glowIntensity: v })}
                  formatValue={(v) => `${v}%`}
                />
                <ColorSwatchPicker
                  swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
                  selectedValue={navbar.glowColor || '#1d1d1f'}
                  onSelect={(color) => onUpdateNavbar({ glowColor: color })}
                />
              </div>
            )}

            {activeSection === 'shadow' && !isNavbarSelected && (() => {
              const isTargetElement = shadowTarget === 'element' && !!selectedElement;

              // Read values based on target (glowIntensity/glowColor/glowPosition maps to outer shadow/glow)
              const activeShadowIntensity = isTargetElement 
                ? (styles.glowIntensity ?? 0) 
                : (activeSlide?.glowIntensity ?? 0);
              const activeShadowColor = isTargetElement 
                ? (styles.glowColor || '#1d1d1f') 
                : (activeSlide?.glowColor || '#1d1d1f');
              const activeShadowPosition = isTargetElement 
                ? (styles.glowPosition || 'center') 
                : (activeSlide?.glowPosition || 'center');

              // Update functions
              const updateShadowIntensity = (intensity: number) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ glowIntensity: intensity });
                } else if (activeSlide) {
                  onUpdateSlideGlow?.(activeSlide.id, { glowIntensity: intensity });
                }
              };

              const updateShadowColor = (color: string) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ glowColor: color });
                } else if (activeSlide) {
                  onUpdateSlideGlow?.(activeSlide.id, { glowColor: color });
                }
              };

              const updateShadowPosition = (pos: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
                if (isTargetElement) {
                  onUpdateElementStyles({ glowPosition: pos });
                } else if (activeSlide) {
                  onUpdateSlideGlow?.(activeSlide.id, { glowPosition: pos });
                }
              };

              // 50 basic colors
              const BASIC_50_COLORS = [
                '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
                '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412',
                '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#854d0e',
                '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d',
                '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59',
                '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75',
                '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
                '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8',
                '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d',
                '#ffffff', '#f3f4f6', '#e5e7eb', '#4b5563', '#111827'
              ];

              // 9 Directions
              const DIRECTION_CELLS = [
                { id: 'top-left', label: 'أعلى يسار', name: 'زاوية علوية يسار' },
                { id: 'top', label: 'أعلى', name: 'أعلى الوسط' },
                { id: 'top-right', label: 'أعلى يمين', name: 'زاوية علوية يمين' },
                { id: 'left', label: 'يسار', name: 'الوسط يسار' },
                { id: 'center', label: 'الوسط', name: 'من جميع الجهات' },
                { id: 'right', label: 'يمين', name: 'الوسط يمين' },
                { id: 'bottom-left', label: 'أسفل يسار', name: 'زاوية سفلية يسار' },
                { id: 'bottom', label: 'أسفل', name: 'أسفل الوسط' },
                { id: 'bottom-right', label: 'أسفل يمين', name: 'زاوية سفلية يمين' },
              ] as const;

              return (
                <div className="space-y-4 text-right" dir="rtl">
                  
                  {/* Target Scope Switcher */}
                  {selectedElement && (
                    <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                      <button
                        onClick={() => setShadowTarget('element')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          shadowTarget === 'element' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        العنصر المختار
                      </button>
                      <button
                        onClick={() => setShadowTarget('slide')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          shadowTarget === 'slide' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        الشريحة الحالية
                      </button>
                    </div>
                  )}

                  <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-[#0071e3]">
                      {isTargetElement 
                        ? `تعديل ظل العنصر: ${selectedElement.name}` 
                        : `تعديل ظل الشريحة: ${activeSlide?.name || 'الشريحة الحالية'}`}
                    </span>
                  </div>

                  {/* أولاً: درجة الظلال الخارجي */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-700 font-bold">درجة وشدة الظل (Shadow Intensity):</span>
                      <span className="font-mono text-[#0071e3] font-bold">{activeShadowIntensity}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={activeShadowIntensity}
                      onChange={(e) => updateShadowIntensity(Number(e.target.value))}
                      className="w-full accent-[#0071e3] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>إيقاف (0px)</span>
                      <span>متوسط (25px)</span>
                      <span>شديد (50px)</span>
                    </div>
                  </div>

                  {/* ثانياً: لون الظل */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-800 block">
                      لون الظل الخارجي (Shadow Color):
                    </span>

                    {/* أ. ألوان الصفحة الافتراضية */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block">
                        ألوان الصفحة الافتراضية:
                      </span>
                      <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-200/65">
                        {customColors.map((hex, idx) => {
                          const isSelected = activeShadowColor.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={`shadow-palette-color-${idx}-${hex}`}
                              onClick={() => updateShadowColor(hex)}
                              className={`w-7 h-7 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                                isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                              }`}
                              style={{ backgroundColor: hex }}
                              title={`لون الصفحة ${idx + 1}: ${hex}`}
                            >
                              {isSelected && (
                                <Check 
                                  size={12} 
                                  className={['#ffffff', '#e5e5ea', '#f5f5f7'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                                  strokeWidth={3} 
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ب. الخمسين لون الأساسية */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-neutral-400 font-semibold block">
                          الخمسون لوناً الأساسية:
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">50 basic colors</span>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-40 overflow-y-auto pr-1">
                        <div className="grid grid-cols-10 gap-1.5">
                          {BASIC_50_COLORS.map((hex, idx) => {
                            const isSelected = activeShadowColor.toLowerCase() === hex.toLowerCase();
                            return (
                              <button
                                key={`shadow-basic-color-${idx}-${hex}`}
                                onClick={() => updateShadowColor(hex)}
                                className={`w-5 h-5 rounded-md border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-4xs flex items-center justify-center ${
                                  isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                                }`}
                                style={{ backgroundColor: hex }}
                                title={hex}
                              >
                                {isSelected && (
                                  <Check 
                                    size={10} 
                                    className={['#ffffff', '#f3f4f6', '#e5e7eb'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                                    strokeWidth={3} 
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* منتقي لون حر مخصص */}
                    <div className="flex items-center gap-1.5 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
                      <input
                        type="color"
                        value={activeShadowColor.startsWith('#') ? activeShadowColor : '#1d1d1f'}
                        onChange={(e) => updateShadowColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0 shadow-3xs"
                      />
                      <input
                        type="text"
                        value={activeShadowColor}
                        onChange={(e) => updateShadowColor(e.target.value)}
                        placeholder="اختر لوناً حراً"
                        className="flex-1 text-[11px] px-2 py-1 bg-white rounded-md border border-neutral-200 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* ثالثاً: مربعات خفيفة تبرز مربعات رمادية مطبق عليها الظلال من الخارج */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-neutral-800 block">
                      توجيه اتجاه وزاوية الظل (Shadow Position):
                    </span>
                    <p className="text-[10px] text-neutral-500 leading-tight">
                      انقر على المربع لتوجيه الظل في الاتجاه المرغوب. تبرز المعاينات شكل الظل الخارجي المطبق على مربع رمادي افتراضي:
                    </p>

                    {/* 3x3 Grid of Direction Previews */}
                    <div className="bg-neutral-100 p-3 rounded-2xl border border-neutral-200/80 flex justify-center items-center">
                      <div className="grid grid-cols-3 gap-3.5 max-w-[240px] w-full">
                        {DIRECTION_CELLS.map((cell) => {
                          const isSelected = activeShadowPosition === cell.id;
                          const previewIntensity = activeShadowIntensity > 0 ? Math.min(activeShadowIntensity, 16) : 10;
                          const boxPreviewShadow = getGlowShadowStyle(previewIntensity, activeShadowColor, cell.id, false);

                          return (
                            <button
                              key={`shadow-dir-${cell.id}`}
                              onClick={() => updateShadowPosition(cell.id)}
                              className={`relative aspect-square rounded-xl p-1 transition-all flex flex-col items-center justify-center cursor-pointer border-2 bg-white ${
                                isSelected
                                  ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs scale-105 z-10'
                                  : 'border-transparent hover:border-neutral-300'
                              }`}
                              title={cell.name}
                            >
                              <div 
                                className="w-9 h-9 rounded-lg bg-neutral-300 transition-all flex items-center justify-center border border-neutral-300/40"
                                style={{ boxShadow: boxPreviewShadow }}
                              >
                                {isSelected ? (
                                  <span className="w-4 h-4 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold shadow-4xs shrink-0 z-20">
                                    <Check size={10} strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span className="text-[8.5px] font-bold text-neutral-500/80 pointer-events-none select-none z-10">
                                    {cell.label}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* TOOL: Background (تعديل الخلفية - لون، الصورة، المعرض كالمخطط اليدوي) */}
            {activeSection === 'background' && isNavbarSelected && navbar && (
              <BackgroundDrawerSection
                targetType="navbar"
                targetName="النافبار"
                currentBgColor={navbar.bgColor}
                currentBgImage={navbar.backgroundImage}
                currentBgSize={navbar.backgroundSize}
                currentBgAttachment="scroll"
                onApplyColor={(color) => onUpdateNavbar({ bgColor: color, backgroundImage: undefined })}
                onApplyGradient={(gradientCss) => onUpdateNavbar({ bgColor: gradientCss, backgroundImage: undefined })}
                onApplyImage={(imageUrl, size = 'cover') => onUpdateNavbar({ backgroundImage: imageUrl, backgroundSize: size })}
                onRemoveImage={() => onUpdateNavbar({ backgroundImage: undefined })}
              />
            )}

            {activeSection === 'background' && !isNavbarSelected && (
              <BackgroundDrawerSection
                targetType={selectedElement ? 'element' : 'slide'}
                targetName={selectedElement ? selectedElement.name : (activeSlide ? activeSlide.name : 'شريحة')}
                currentBgColor={selectedElement ? styles.backgroundColor : (activeSlide?.backgroundColor || '#ffffff')}
                currentBgImage={selectedElement ? styles.backgroundImage : activeSlide?.backgroundImage}
                currentBgSize={selectedElement ? (styles.backgroundSize as any) : activeSlide?.backgroundSize}
                currentBgAttachment={selectedElement ? (styles.backgroundAttachment as any) : activeSlide?.backgroundAttachment}
                onApplyColor={(color) => {
                  if (selectedElement) {
                    onUpdateElementStyles({ backgroundColor: color, backgroundImage: undefined });
                  } else if (activeSlide) {
                    onUpdateSlideBackground(activeSlide.id, { backgroundColor: color, backgroundImage: undefined });
                  }
                }}
                onApplyGradient={(gradientCss) => {
                  if (selectedElement) {
                    onUpdateElementStyles({ backgroundColor: gradientCss, backgroundImage: undefined });
                  } else if (activeSlide) {
                    onUpdateSlideBackground(activeSlide.id, { backgroundColor: gradientCss, backgroundImage: undefined });
                  }
                }}
                onApplyImage={(imageUrl, size = 'cover') => {
                  if (selectedElement) {
                    onUpdateElementStyles({ backgroundImage: imageUrl, backgroundSize: size });
                  } else if (activeSlide) {
                    onUpdateSlideBackground(activeSlide.id, { backgroundImage: imageUrl, backgroundSize: size });
                  }
                }}
                onRemoveImage={() => {
                  if (selectedElement) {
                    onUpdateElementStyles({ backgroundImage: undefined });
                  } else if (activeSlide) {
                    onUpdateSlideBackground(activeSlide.id, { backgroundImage: undefined });
                  }
                }}
                onApplyAttachment={(attachment) => {
                  if (selectedElement) {
                    onUpdateElementStyles({ backgroundAttachment: attachment });
                  } else if (activeSlide) {
                    onUpdateSlideBackground(activeSlide.id, { backgroundAttachment: attachment });
                  }
                }}
              />
            )}

            {/* TOOL: Border (تعديل الإطار للعنصر أو الشريحة) */}
            {activeSection === 'border' && isNavbarSelected && navbar && (
              <div className="space-y-5 text-right" dir="rtl">
                <SectionHeader title="إطار النافبار" />
                <Slider
                  label="سمك الإطار"
                  value={navbar.borderWidth ?? 0}
                  min={0}
                  max={20}
                  onChange={(v) => onUpdateNavbar({ borderWidth: v, borderStyle: (navbar.borderStyle || 'none') === 'none' ? 'solid' : navbar.borderStyle })}
                  formatValue={(v) => `${v}px`}
                />
                <Slider
                  label="تدوير الحواف"
                  value={navbar.borderRadius ?? 0}
                  min={0}
                  max={60}
                  onChange={(v) => onUpdateNavbar({ borderRadius: v })}
                  formatValue={(v) => `${v}px`}
                />
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-neutral-800 block">نمط الإطار</span>
                  <PillTabs
                    className="w-full"
                    value={(navbar.borderStyle || 'none') as string}
                    options={[
                      { value: 'none', label: 'بدون' },
                      { value: 'solid', label: 'متصل' },
                      { value: 'dashed', label: 'متقطع' },
                      { value: 'dotted', label: 'منقط' },
                    ]}
                    onChange={(v) => onUpdateNavbar({ borderStyle: v, borderWidth: v === 'none' ? 0 : (navbar.borderWidth || 2) })}
                  />
                </div>
                <ColorSwatchPicker
                  swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
                  selectedValue={navbar.borderColor || 'transparent'}
                  onSelect={(color) => onUpdateNavbar({ borderColor: color, borderStyle: (navbar.borderStyle || 'none') === 'none' ? 'solid' : navbar.borderStyle })}
                />
              </div>
            )}

            {activeSection === 'border' && !isNavbarSelected && (() => {
              // Determine current targets and styles
              const isTargetElement = borderTarget === 'element' && !!selectedElement;
              const activeBorderWidth = isTargetElement 
                ? (styles.borderWidth ?? 0) 
                : (activeSlide?.borderWidth ?? 0);
              const activeBorderRadius = isTargetElement 
                ? (styles.borderRadius ?? 0) 
                : (activeSlide?.borderRadius ?? 0);
              const activeBorderColor = isTargetElement 
                ? (styles.borderColor || 'transparent') 
                : (activeSlide?.borderColor || 'transparent');
              const activeBorderStyle = isTargetElement 
                ? (styles.borderStyle || 'none') 
                : (activeSlide?.borderStyle || 'none');

              // Functions to apply modifications
              const updateWidth = (w: number) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ borderWidth: w, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
                } else if (activeSlide) {
                  onUpdateSlideBorder(activeSlide.id, { borderWidth: w, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
                }
              };

              const updateRadius = (r: number) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ borderRadius: r });
                } else if (activeSlide) {
                  onUpdateSlideBorder(activeSlide.id, { borderRadius: r });
                }
              };

              const updateColor = (c: string) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ borderColor: c, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
                } else if (activeSlide) {
                  onUpdateSlideBorder(activeSlide.id, { borderColor: c, borderStyle: activeBorderStyle === 'none' ? 'solid' : activeBorderStyle });
                }
              };

              const updateStyle = (s: string) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ borderStyle: s, borderWidth: s === 'none' ? 0 : (activeBorderWidth || 2) });
                } else if (activeSlide) {
                  onUpdateSlideBorder(activeSlide.id, { borderStyle: s, borderWidth: s === 'none' ? 0 : (activeBorderWidth || 2) });
                }
              };

              const applyPreset = (presetStyle: any) => {
                if (isTargetElement) {
                  onUpdateElementStyles(presetStyle);
                } else if (activeSlide) {
                  onUpdateSlideBorder(activeSlide.id, presetStyle);
                }
              };

              // Grid of 20 high-quality border design presets
              const BORDER_PRESETS_20 = [
                { id: 'b_solid_thin', label: 'متصل رفيع', name: 'إطار كلاسيكي رفيع متصل', style: { borderStyle: 'solid', borderWidth: 1, borderRadius: 8, borderColor: '#e5e5ea' } },
                { id: 'b_solid_thick', label: 'متصل سميك', name: 'إطار كلاسيكي سميك', style: { borderStyle: 'solid', borderWidth: 4, borderRadius: 12, borderColor: '#1d1d1f' } },
                { id: 'b_dashed_thin', label: 'متقطع ناعم', name: 'إطار تقني متقطع', style: { borderStyle: 'dashed', borderWidth: 1.5, borderRadius: 8, borderColor: '#0071e3' } },
                { id: 'b_dashed_thick', label: 'متقطع بارز', name: 'إطار متقطع سميك', style: { borderStyle: 'dashed', borderWidth: 3.5, borderRadius: 16, borderColor: '#dc2626' } },
                { id: 'b_dotted_thin', label: 'منقط ناعم', name: 'إطار طابع بريدي ناعم', style: { borderStyle: 'dotted', borderWidth: 2, borderRadius: 6, borderColor: '#6b7280' } },
                { id: 'b_dotted_thick', label: 'منقط سميك', name: 'إطار منقط عريض', style: { borderStyle: 'dotted', borderWidth: 5, borderRadius: 20, borderColor: '#4f46e5' } },
                { id: 'b_double_classic', label: 'خط مزدوج', name: 'إطار ملكي مزدوج كلاسيكي', style: { borderStyle: 'double', borderWidth: 4, borderRadius: 10, borderColor: '#1d1d1f' } },
                { id: 'b_double_thick', label: 'مزدوج عريض', name: 'إطار مزدوج عريض وفخم', style: { borderStyle: 'double', borderWidth: 7, borderRadius: 14, borderColor: '#d97706' } },
                { id: 'b_groove_3d', label: 'أخدود ثلاثي', name: 'إطار منقوش غائر ثلاثي الأبعاد', style: { borderStyle: 'groove', borderWidth: 4, borderRadius: 12, borderColor: '#059669' } },
                { id: 'b_ridge_3d', label: 'بروز ثلاثي', name: 'إطار بارز منقوش ثلاثي الأبعاد', style: { borderStyle: 'ridge', borderWidth: 4, borderRadius: 12, borderColor: '#2563eb' } },
                { id: 'b_inset_3d', label: 'داخل غائر', name: 'حواف غائرة للداخل ثلاثية الأبعاد', style: { borderStyle: 'inset', borderWidth: 4, borderRadius: 8, borderColor: '#dc2626' } },
                { id: 'b_outset_3d', label: 'خارج بارز', name: 'حواف بارزة للخارج ثلاثية الأبعاد', style: { borderStyle: 'outset', borderWidth: 4, borderRadius: 8, borderColor: '#7c3aed' } },
                { id: 'b_retro_neobrutal', label: 'بروتاليست حاد', name: 'نيوبروتاليست حاد الحواف', style: { borderStyle: 'solid', borderWidth: 3, borderRadius: 0, borderColor: '#000000' } },
                { id: 'b_retro_curved', label: 'بروتاليست دافئ', name: 'نيوبروتاليست دافئ الحواف', style: { borderStyle: 'solid', borderWidth: 3, borderRadius: 16, borderColor: '#000000' } },
                { id: 'b_gold_royal', label: 'ذهبي ملكي', name: 'إطار ذهبي ملكي كلاسيكي', style: { borderStyle: 'double', borderWidth: 5, borderRadius: 4, borderColor: '#d4af37' } },
                { id: 'b_neon_cyan', label: 'نيون متوهج', name: 'إطار سيان نيون مضيء', style: { borderStyle: 'solid', borderWidth: 2, borderRadius: 12, borderColor: '#00f2fe' } },
                { id: 'b_glass_light', label: 'زجاجي ناعم', name: 'إطار زجاجي شفاف ناعم', style: { borderStyle: 'solid', borderWidth: 1, borderRadius: 20, borderColor: 'rgba(120,120,120,0.4)' } },
                { id: 'b_badge_corner', label: 'حواف بطاقة', name: 'إطار مخصص للشارات والبطاقات', style: { borderStyle: 'solid', borderWidth: 2, borderRadius: 24, borderColor: '#e0c3fc' } },
                { id: 'b_stitch_gray', label: 'خياطة رمادية', name: 'نمط خياطة رمادية ناعمة', style: { borderStyle: 'dashed', borderWidth: 1, borderRadius: 10, borderColor: '#9e9e9e' } },
                { id: 'b_thick_charcoal', label: 'فحم عريض', name: 'إطار فحمي عريض جداً', style: { borderStyle: 'solid', borderWidth: 8, borderRadius: 16, borderColor: '#1c1c1e' } },
              ];

              return (
                <div className="space-y-4 text-right" dir="rtl">
                  
                  {/* Target Toggle Tab (إذا كان هناك عنصر محدد، يتيح الاختيار بين تعديل إطار العنصر أو الشريحة) */}
                  {selectedElement && (
                    <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                      <button
                        onClick={() => setBorderTarget('element')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          borderTarget === 'element' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        العنصر المختار
                      </button>
                      <button
                        onClick={() => setBorderTarget('slide')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          borderTarget === 'slide' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        الشريحة الحالية
                      </button>
                    </div>
                  )}

                  <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-[#0071e3]">
                      {isTargetElement 
                        ? `تعديل إطار العنصر: ${selectedElement.name}` 
                        : `تعديل إطار الشريحة: ${activeSlide?.name || 'الشريحة الحالية'}`}
                    </span>
                  </div>

                  {/* 1. سمك الإطار */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-700 font-bold">سمك الإطار (Border Width):</span>
                      <span className="font-mono text-[#0071e3] font-bold">{activeBorderWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={activeBorderWidth}
                      onChange={(e) => updateWidth(Number(e.target.value))}
                      className="w-full accent-[#0071e3]"
                    />
                  </div>

                  {/* 2. درجة تدوير الحواف */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-700 font-bold">تدوير الحواف (Border Radius):</span>
                      <span className="font-mono text-[#0071e3] font-bold">{activeBorderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeBorderRadius}
                      onChange={(e) => updateRadius(Number(e.target.value))}
                      className="w-full accent-[#0071e3]"
                    />
                  </div>

                  {/* 3. نوع الإطار */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-800 block">
                      خيارات نمط الإطار (Border Style):
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'none', label: 'بدون إطار' },
                        { id: 'solid', label: 'متصل ──' },
                        { id: 'dashed', label: 'متقطع ╌╌' },
                        { id: 'dotted', label: 'منقط ┈┈' },
                      ].map((item) => {
                        const isSelected = activeBorderStyle === item.id;
                        return (
                          <button
                            key={`border-style-${item.id}`}
                            onClick={() => updateStyle(item.id)}
                            className={`py-2 px-1 rounded-xl border text-[10.5px] font-semibold text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]'
                                : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. لون الإطار */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-800 block">
                      لون الإطار (Border Color):
                    </span>
                    
                    {/* لوحة الألوان القياسية */}
                    <div className="grid grid-cols-10 gap-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200/70">
                      {['#ffffff', '#000000', '#0071e3', '#1d1d1f', '#e5e5ea', '#dc2626', '#059669', '#d97706', '#7c3aed', '#f43f5e'].map((hex) => {
                        const isSelected = activeBorderColor.toLowerCase() === hex.toLowerCase();
                        return (
                          <button
                            key={`border-color-std-${hex}`}
                            onClick={() => updateColor(hex)}
                            className={`w-5.5 h-5.5 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                              isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                            }`}
                            style={{ backgroundColor: hex }}
                            title={hex}
                          >
                            {isSelected && (
                              <Check 
                                size={10} 
                                className={['#ffffff', '#e5e5ea'].includes(hex) ? 'text-black' : 'text-white'} 
                                strokeWidth={3} 
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* منتقي لون مخصص */}
                    <div className="flex items-center gap-1.5 bg-neutral-50 p-1 rounded-lg border border-neutral-200">
                      <input
                        type="color"
                        value={activeBorderColor.startsWith('#') ? activeBorderColor : '#1d1d1f'}
                        onChange={(e) => updateColor(e.target.value)}
                        className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={activeBorderColor}
                        onChange={(e) => updateColor(e.target.value)}
                        placeholder="اختر لوناً"
                        className="flex-1 text-[10px] px-1.5 py-0.5 bg-white rounded border border-neutral-200 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* 5. ٢٠ إطاراً شكل ومقترح مبتكر */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800">
                        معرض ٢٠ شكلاً وتصميماً ملهماً للإطارات:
                      </span>
                      <span className="text-[9.5px] text-neutral-400">
                        (تطبيق بنقرة واحدة)
                      </span>
                    </div>

                    <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-56 overflow-y-auto pr-1">
                      <div className="grid grid-cols-2 gap-2">
                        {BORDER_PRESETS_20.map((preset) => {
                          const isCurrent = activeBorderStyle === preset.style.borderStyle && 
                                            activeBorderWidth === preset.style.borderWidth &&
                                            activeBorderColor.toLowerCase() === preset.style.borderColor.toLowerCase();
                          return (
                            <button
                              key={preset.id}
                              onClick={() => applyPreset(preset.style)}
                              className={`p-2 rounded-xl border text-right transition-all cursor-pointer relative group flex flex-col gap-1 ${
                                isCurrent 
                                  ? 'border-[#0071e3] bg-[#0071e3]/10 ring-1 ring-[#0071e3]' 
                                  : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] font-bold text-neutral-700">
                                  {preset.label}
                                </span>
                                {isCurrent && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#0071e3] flex items-center justify-center shrink-0">
                                    <Check size={8} className="text-white" strokeWidth={3} />
                                  </span>
                                )}
                              </div>
                              
                              {/* مظهر معاينة مصغر للإطار */}
                              <div 
                                className="w-full h-5 rounded-md mt-0.5" 
                                style={{
                                  borderStyle: preset.style.borderStyle,
                                  borderWidth: `${Math.min(preset.style.borderWidth, 3)}px`,
                                  borderColor: preset.style.borderColor,
                                  borderRadius: `${Math.min(preset.style.borderRadius, 6)}px`,
                                  backgroundColor: 'rgba(0,0,0,0.02)'
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* TOOL: Opacity (الشفافية: خيار العنصر وخيار الخلفية) */}
            {activeSection === 'opacity' && isNavbarSelected && navbar && (
              <div className="space-y-5 text-right" dir="rtl">
                <SectionHeader title="شفافية النافبار" />
                <Slider
                  label="شفافية الخلفية"
                  value={Math.round((navbar.backgroundOpacity ?? 1) * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => onUpdateNavbar({ backgroundOpacity: v / 100 })}
                  formatValue={(v) => `${v}%`}
                />
                <Slider
                  label="شفافية النصوص"
                  value={Math.round((navbar.textOpacity ?? 1) * 100)}
                  min={0}
                  max={100}
                  onChange={(v) => onUpdateNavbar({ textOpacity: v / 100 })}
                  formatValue={(v) => `${v}%`}
                />
              </div>
            )}

            {activeSection === 'opacity' && !isNavbarSelected && (() => {
              const isTargetElement = opacityTarget === 'element' && !!selectedElement;
              
              // Check if element has background
              const elementHasBg = Boolean(
                (styles.backgroundColor && styles.backgroundColor !== 'transparent' && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
                styles.backgroundImage
              );
              
              // Check if slide has background
              const slideHasBg = Boolean(
                (activeSlide?.backgroundColor && activeSlide.backgroundColor !== 'transparent' && activeSlide.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
                activeSlide?.backgroundImage
              );

              const currentHasBg = isTargetElement ? elementHasBg : slideHasBg;

              // Effective opacityPart (fallback to element if background is not available)
              const effectivePart = (opacityPart === 'background' && !currentHasBg) ? 'element' : opacityPart;

              // Read current opacity value based on target and part
              let currentOpacity = 1;
              if (isTargetElement) {
                if (effectivePart === 'background') {
                  currentOpacity = styles.backgroundOpacity ?? 1;
                } else {
                  currentOpacity = styles.contentOpacity ?? styles.opacity ?? 1;
                }
              } else {
                if (effectivePart === 'background') {
                  currentOpacity = activeSlide?.backgroundOpacity ?? 1;
                } else {
                  currentOpacity = activeSlide?.opacity ?? 1;
                }
              }

              // Handler to update opacity
              const handleOpacityChange = (val: number) => {
                const roundedVal = Math.round(val * 100) / 100;
                if (isTargetElement) {
                  if (effectivePart === 'background') {
                    onUpdateElementStyles({ backgroundOpacity: roundedVal });
                  } else {
                    onUpdateElementStyles({ contentOpacity: roundedVal, opacity: roundedVal });
                  }
                } else if (activeSlide) {
                  if (effectivePart === 'background') {
                    onUpdateSlideOpacity?.(activeSlide.id, { backgroundOpacity: roundedVal });
                  } else {
                    onUpdateSlideOpacity?.(activeSlide.id, { opacity: roundedVal });
                  }
                }
              };

              return (
                <div className="space-y-4 text-right" dir="rtl">
                  {/* Target Scope Switcher (العنصر المختار / الشريحة الحالية) */}
                  {selectedElement && (
                    <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                      <button
                        onClick={() => setOpacityTarget('element')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          opacityTarget === 'element' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        العنصر المختار
                      </button>
                      <button
                        onClick={() => setOpacityTarget('slide')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          opacityTarget === 'slide' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        الشريحة الحالية
                      </button>
                    </div>
                  )}

                  {/* Main Pill Selector (كما في الرسم اليدوي: الخلفية / العنصر) */}
                  <div className="p-1 bg-neutral-100 rounded-2xl border border-neutral-200/80 flex items-center gap-1 shadow-2xs">
                    {/* خيار العنصر */}
                    <button
                      onClick={() => setOpacityPart('element')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        effectivePart === 'element'
                          ? 'bg-white text-[#0071e3] shadow-sm ring-1 ring-black/[0.04]'
                          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50'
                      }`}
                    >
                      <span>العنصر</span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {isTargetElement ? '(النص والمحتوى)' : '(المحتوى)'}
                      </span>
                    </button>

                    {/* خيار الخلفية - معطل في حال كان العنصر أو الشريحة بلا خلفية */}
                    <button
                      onClick={() => {
                        if (currentHasBg) {
                          setOpacityPart('background');
                        }
                      }}
                      disabled={!currentHasBg}
                      title={!currentHasBg ? 'هذا العنصر بلا لون أو صورة خلفية حالياً' : 'تعديل شفافية الخلفية'}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        !currentHasBg
                          ? 'opacity-40 cursor-not-allowed bg-neutral-200/40 text-neutral-400'
                          : effectivePart === 'background'
                            ? 'bg-white text-[#0071e3] shadow-sm ring-1 ring-black/[0.04] cursor-pointer'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50 cursor-pointer'
                      }`}
                    >
                      <span>الخلفية</span>
                      {!currentHasBg && (
                        <span className="text-[9.5px] px-1 py-0.2 bg-neutral-300/60 rounded text-neutral-500 font-normal">
                          معطل
                        </span>
                      )}
                    </button>
                  </div>

                  {/* تنبيه تعطيل خيار الخلفية إذا لم تكن هناك خلفية */}
                  {!currentHasBg && (
                    <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start gap-2 animate-fadeIn">
                      <span className="text-amber-500 text-sm shrink-0">ℹ️</span>
                      <div className="leading-tight">
                        <p className="font-bold text-[11px]">
                          {isTargetElement ? 'العنصر بدون خلفية (شفافة)' : 'الشريحة بدون خلفية'}
                        </p>
                        <p className="text-[10px] text-amber-700/85 mt-0.5">
                          تم تعطيل خيار شفافية الخلفية لعدم وجود لون أو صورة خلفية. يمكنك تعيين خلفية من قسم «تعديل الخلفية» لتفعيله.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* بطاقة معلومات النمط النشط وقيمة الشفافية */}
                  <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#0071e3]">
                        {effectivePart === 'element'
                          ? (isTargetElement ? 'شفافية العنصر نفسه (النص/المحتوى)' : 'شفافية عناصر ومحتوى الشريحة')
                          : (isTargetElement ? 'شفافية خلفية العنصر' : 'شفافية خلفية الشريحة')}
                      </span>
                      <span className="font-mono text-[#0071e3] font-extrabold text-sm">
                        {Math.round(currentOpacity * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      {effectivePart === 'element'
                        ? 'تطبيق الشفافية على النص أو المحتوى مع بقاء الخلفية واضحة كما هي.'
                        : 'تطبيق الشفافية على لون أو صورة الخلفية فقط مع بقاء النص واضحاً ومقروءاً.'}
                    </p>
                  </div>

                  {/* شريط السحب لتعديل الشفافية */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentOpacity}
                      onChange={(e) => handleOpacityChange(Number(e.target.value))}
                      className="w-full accent-[#0071e3] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>0% (شفاف)</span>
                      <span>50%</span>
                      <span>100% (معتم)</span>
                    </div>
                  </div>

                  {/* أزرار سريعة للنسب المئوية */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-neutral-600 block">
                      نسب جاهزة وسريعة:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 0.75, 0.5, 0.25, 0.1].map((val) => {
                        const isSelected = Math.abs(currentOpacity - val) < 0.03;
                        return (
                          <button
                            key={val}
                            onClick={() => handleOpacityChange(val)}
                            className={`py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0071e3] text-white border-[#0071e3] font-bold shadow-xs'
                                : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            {Math.round(val * 100)}%
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TOOL: Lighting (الإضاءة) */}
            {activeSection === 'lighting' && isNavbarSelected && navbar && (
              <div className="space-y-5 text-right" dir="rtl">
                <SectionHeader title="إضاءة النافبار" />
                <Slider
                  label="شدة الإضاءة"
                  value={navbar.innerGlowIntensity ?? 0}
                  min={0}
                  max={100}
                  onChange={(v) => onUpdateNavbar({ innerGlowIntensity: v })}
                  formatValue={(v) => `${v}%`}
                />
                <ColorSwatchPicker
                  swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
                  selectedValue={navbar.innerGlowColor || '#0071e3'}
                  onSelect={(color) => onUpdateNavbar({ innerGlowColor: color })}
                />
              </div>
            )}

            {activeSection === 'lighting' && !isNavbarSelected && (() => {
              const isTargetElement = lightingTarget === 'element' && !!selectedElement;

              // Read values based on target (innerGlowIntensity/innerGlowColor/innerGlowPosition maps to inner lighting)
              const activeLightIntensity = isTargetElement 
                ? (styles.innerGlowIntensity ?? 0) 
                : (activeSlide?.innerGlowIntensity ?? 0);
              const activeLightColor = isTargetElement 
                ? (styles.innerGlowColor || '#0071e3') 
                : (activeSlide?.innerGlowColor || '#0071e3');
              const activeLightPosition = isTargetElement 
                ? (styles.innerGlowPosition || 'center') 
                : (activeSlide?.innerGlowPosition || 'center');
              const activeBrightness = isTargetElement 
                ? (styles.brightness || 100) 
                : 100;

              // Update functions
              const updateLightIntensity = (intensity: number) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ innerGlowIntensity: intensity });
                } else if (activeSlide) {
                  onUpdateSlideGlow?.(activeSlide.id, { innerGlowIntensity: intensity });
                }
              };

              const updateLightColor = (color: string) => {
                if (isTargetElement) {
                  onUpdateElementStyles({ innerGlowColor: color });
                } else if (activeSlide) {
                  onUpdateSlideGlow?.(activeSlide.id, { innerGlowColor: color });
                }
              };

              const updateLightPosition = (pos: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
                if (isTargetElement) {
                  onUpdateElementStyles({ innerGlowPosition: pos });
                } else if (activeSlide) {
                  onUpdateSlideGlow?.(activeSlide.id, { innerGlowPosition: pos });
                }
              };

              // 50 basic colors (10 rows of 5 colors each, representing key spectral/design system colors)
              const BASIC_50_COLORS = [
                '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
                '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412',
                '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#854d0e',
                '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d',
                '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59',
                '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75',
                '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
                '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8',
                '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d',
                '#ffffff', '#f3f4f6', '#e5e7eb', '#4b5563', '#111827'
              ];

              // 9 Directions mapping to labels and CSS styles
              const DIRECTION_CELLS = [
                { id: 'top-left', label: 'أعلى يسار', name: 'زاوية علوية يسار' },
                { id: 'top', label: 'أعلى', name: 'أعلى الوسط' },
                { id: 'top-right', label: 'أعلى يمين', name: 'زاوية علوية يمين' },
                { id: 'left', label: 'يسار', name: 'الوسط يسار' },
                { id: 'center', label: 'الوسط', name: 'من جميع الجهات' },
                { id: 'right', label: 'يمين', name: 'الوسط يمين' },
                { id: 'bottom-left', label: 'أسفل يسار', name: 'زاوية سفلية يسار' },
                { id: 'bottom', label: 'أسفل', name: 'أسفل الوسط' },
                { id: 'bottom-right', label: 'أسفل يمين', name: 'زاوية سفلية يمين' },
              ] as const;

              return (
                <div className="space-y-4 text-right" dir="rtl">
                  
                  {/* Target Scope Switcher (تعديل إضاءة العنصر أو الشريحة) */}
                  {selectedElement && (
                    <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                      <button
                        onClick={() => setLightingTarget('element')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          lightingTarget === 'element' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        العنصر المختار
                      </button>
                      <button
                        onClick={() => setLightingTarget('slide')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          lightingTarget === 'slide' 
                            ? 'bg-white text-[#0071e3] shadow-xs' 
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        الشريحة الحالية
                      </button>
                    </div>
                  )}

                  <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-[#0071e3]">
                      {isTargetElement 
                        ? `تعديل إضاءة العنصر: ${selectedElement.name}` 
                        : `تعديل إضاءة الشريحة: ${activeSlide?.name || 'الشريحة الحالية'}`}
                    </span>
                  </div>

                  {/* أولاً: درجة السطوع الأساسية (للعناصر فقط) */}
                  {isTargetElement && (
                    <div className="space-y-1.5 pb-2 border-b border-neutral-200/70">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-700 font-bold">سطوع العنصر (Brightness):</span>
                        <span className="font-mono text-neutral-500 font-bold">{activeBrightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        step="5"
                        value={activeBrightness}
                        onChange={(e) => onUpdateElementStyles({ brightness: Number(e.target.value) })}
                        className="w-full accent-[#0071e3]"
                      />
                    </div>
                  )}

                  {/* أولاً: درجة الإضاءة (Intensity / Spread / Glow Radius) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-700 font-bold">شدة ومدى الإضاءة الداخلية (Lighting Intensity):</span>
                      <span className="font-mono text-[#0071e3] font-bold">{activeLightIntensity}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={activeLightIntensity}
                      onChange={(e) => updateLightIntensity(Number(e.target.value))}
                      className="w-full accent-[#0071e3] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>إيقاف (0px)</span>
                      <span>متوسط (25px)</span>
                      <span>شديد (50px)</span>
                    </div>
                  </div>

                  {/* ثانياً: لون الإضاءة */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-800 block">
                      لون الإضاءة والتوهج الداخلي (Light Color):
                    </span>

                    {/* أ. ألوان الصفحة الافتراضية */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block">
                        ألوان الصفحة الافتراضية:
                      </span>
                      <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-200/65">
                        {customColors.map((hex, idx) => {
                          const isSelected = activeLightColor.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={`light-palette-color-${idx}-${hex}`}
                              onClick={() => updateLightColor(hex)}
                              className={`w-7 h-7 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                                isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                              }`}
                              style={{ backgroundColor: hex }}
                              title={`لون الصفحة ${idx + 1}: ${hex}`}
                            >
                              {isSelected && (
                                <Check 
                                  size={12} 
                                  className={['#ffffff', '#e5e5ea', '#f5f5f7'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                                  strokeWidth={3} 
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ب. الخمسين لون الأساسية */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-neutral-400 font-semibold block">
                          الخمسون لوناً الأساسية:
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">50 basic colors</span>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-40 overflow-y-auto pr-1">
                        <div className="grid grid-cols-10 gap-1.5">
                          {BASIC_50_COLORS.map((hex, idx) => {
                            const isSelected = activeLightColor.toLowerCase() === hex.toLowerCase();
                            return (
                              <button
                                key={`light-basic-color-${idx}-${hex}`}
                                onClick={() => updateLightColor(hex)}
                                className={`w-5 h-5 rounded-md border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-4xs flex items-center justify-center ${
                                  isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                                }`}
                                style={{ backgroundColor: hex }}
                                title={hex}
                              >
                                {isSelected && (
                                  <Check 
                                    size={10} 
                                    className={['#ffffff', '#f3f4f6', '#e5e7eb'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} 
                                    strokeWidth={3} 
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* منتقي لون حر مخصص */}
                    <div className="flex items-center gap-1.5 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
                      <input
                        type="color"
                        value={activeLightColor.startsWith('#') ? activeLightColor : '#0071e3'}
                        onChange={(e) => updateLightColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0 shadow-3xs"
                      />
                      <input
                        type="text"
                        value={activeLightColor}
                        onChange={(e) => updateLightColor(e.target.value)}
                        placeholder="اختر لوناً حراً"
                        className="flex-1 text-[11px] px-2 py-1 bg-white rounded-md border border-neutral-200 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* ثالثاً: مربعات خفيفة تبرز مربعات رمادية مطبق عليها الإضاءة من الداخل */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-neutral-800 block">
                      توجيه اتجاه وزاوية الإضاءة الداخلية (Light Position):
                    </span>
                    <p className="text-[10px] text-neutral-500 leading-tight">
                      انقر على المربع لتوجيه الإضاءة في الاتجاه المرغوب. تبرز المعاينات شكل الإضاءة الداخلية (inset) المطبقة على مربع رمادي افتراضي:
                    </p>

                    {/* 3x3 Grid of Direction Previews (using isInset = true) */}
                    <div className="bg-neutral-100 p-3 rounded-2xl border border-neutral-200/80 flex justify-center items-center">
                      <div className="grid grid-cols-3 gap-3.5 max-w-[240px] w-full">
                        {DIRECTION_CELLS.map((cell) => {
                          const isSelected = activeLightPosition === cell.id;
                          const previewIntensity = activeLightIntensity > 0 ? Math.min(activeLightIntensity, 16) : 10;
                          const boxPreviewShadow = getGlowShadowStyle(previewIntensity, activeLightColor, cell.id, true);

                          return (
                            <button
                              key={`light-dir-${cell.id}`}
                              onClick={() => updateLightPosition(cell.id)}
                              className={`relative aspect-square rounded-xl p-1 transition-all flex flex-col items-center justify-center cursor-pointer border-2 bg-white ${
                                isSelected
                                  ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs scale-105 z-10'
                                  : 'border-transparent hover:border-neutral-300'
                              }`}
                              title={cell.name}
                            >
                              {/* Gray square with the specific glow direction applied inwardly (inset) */}
                              <div 
                                className="w-9 h-9 rounded-lg bg-neutral-300 relative overflow-hidden transition-all flex items-center justify-center border border-neutral-300/40"
                              >
                                {/* Gradual Fading Inset Glow Preview Layer */}
                                <div 
                                  className="absolute inset-0 pointer-events-none mix-blend-screen"
                                  style={getLightGradientStyle(previewIntensity, activeLightColor, cell.id)}
                                />

                                {isSelected ? (
                                  <span className="w-4 h-4 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold shadow-4xs shrink-0 z-20">
                                    <Check size={10} strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span className="text-[8.5px] font-bold text-[#1d1d1f] pointer-events-none select-none z-10 bg-white/40 px-1 rounded-sm">
                                    {cell.label}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* TOOL: Format (التنسيق) */}
            {(activeSection === 'format' || activeSection === 'gallery') && (
              <div className="space-y-4">
                {selectedElement ? (
                  <>
                    {/* إعدادات معرض الصور (Gallery Settings) */}
                    {selectedElement.type === 'gallery' && (() => {
                      const config = selectedElement.galleryConfig || {
                        layout: 'top-main',
                        activeImageIndex: 0,
                        showThumbnails: true,
                        gap: 8,
                        borderRadius: 12,
                        objectFit: 'cover',
                        items: [
                          { id: '1', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', title: 'طبيعة بحيرة وجبال' },
                          { id: '2', url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&auto=format&fit=crop&q=80', title: 'قمم الثلوج' },
                          { id: '3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80', title: 'غابة الصنوبر' },
                          { id: '4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80', title: 'شروق الشمس' },
                          { id: '5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80', title: 'تلال وسهول' }
                        ]
                      };

                      const items = config.items || [];
                      const layout = config.layout || 'top-main';

                      const updateGalleryConfig = (partial: Partial<typeof config>) => {
                        onUpdateElement({
                          galleryConfig: {
                            ...config,
                            ...partial
                          }
                        });
                      };

                      const handleMoveUp = (idx: number) => {
                        if (idx <= 0) return;
                        const newItems = [...items];
                        const temp = newItems[idx];
                        newItems[idx] = newItems[idx - 1];
                        newItems[idx - 1] = temp;
                        updateGalleryConfig({ items: newItems });
                      };

                      const handleMoveDown = (idx: number) => {
                        if (idx >= items.length - 1) return;
                        const newItems = [...items];
                        const temp = newItems[idx];
                        newItems[idx] = newItems[idx + 1];
                        newItems[idx + 1] = temp;
                        updateGalleryConfig({ items: newItems });
                      };

                      const handleTriggerDeviceUpload = (idx: number) => {
                        setGalleryTargetReplaceIndex(idx);
                        galleryFileInputRef.current?.click();
                      };

                      const handleDeviceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (!file || galleryTargetReplaceIndex === null) return;
                        setGalleryUploadingIndex(galleryTargetReplaceIndex);
                        try {
                          const downloadUrl = await uploadGalleryImageToStorage(file);
                          const newItems = [...items];
                          if (galleryTargetReplaceIndex === -1) {
                            newItems.push({
                              id: `img-${Date.now()}`,
                              url: downloadUrl,
                              title: file.name.replace(/\.[^/.]+$/, '')
                            });
                          } else {
                            newItems[galleryTargetReplaceIndex] = {
                              ...newItems[galleryTargetReplaceIndex],
                              url: downloadUrl,
                              title: file.name.replace(/\.[^/.]+$/, '')
                            };
                          }
                          updateGalleryConfig({ items: newItems });
                        } catch (err) {
                          console.error('Failed to upload image to Firebase Storage, using local data URL fallback', err);
                          const reader = new FileReader();
                          reader.onload = (readerEvent) => {
                            const localUrl = readerEvent.target?.result as string;
                            if (localUrl) {
                              const newItems = [...items];
                              if (galleryTargetReplaceIndex === -1) {
                                newItems.push({
                                  id: `img-${Date.now()}`,
                                  url: localUrl,
                                  title: file.name.replace(/\.[^/.]+$/, '')
                                });
                              } else {
                                newItems[galleryTargetReplaceIndex] = {
                                  ...newItems[galleryTargetReplaceIndex],
                                  url: localUrl,
                                  title: file.name.replace(/\.[^/.]+$/, '')
                                };
                              }
                              updateGalleryConfig({ items: newItems });
                            }
                          };
                          reader.readAsDataURL(file);
                        } finally {
                          setGalleryUploadingIndex(null);
                          setGalleryTargetReplaceIndex(null);
                          if (e.target) e.target.value = '';
                        }
                      };

                      const handleOpenUnsplashPicker = (idx: number) => {
                        setUnsplashPickerIndex(idx);
                        handleLoadUnsplashForGallery(unsplashSearchQuery);
                      };

                      const handleSelectUnsplashPhoto = (photoUrl: string, title?: string) => {
                        if (unsplashPickerIndex === null) return;
                        const newItems = [...items];
                        if (unsplashPickerIndex === -1) {
                          newItems.push({
                            id: `img-${Date.now()}`,
                            url: photoUrl,
                            title: title || 'صورة من Unsplash'
                          });
                        } else {
                          newItems[unsplashPickerIndex] = {
                            ...newItems[unsplashPickerIndex],
                            url: photoUrl,
                            title: title || newItems[unsplashPickerIndex].title
                          };
                        }
                        updateGalleryConfig({ items: newItems });
                        setUnsplashPickerIndex(null);
                      };

                      const handleDownloadImage = async (url: string, name?: string) => {
                        try {
                          const res = await fetch(url);
                          const blob = await res.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = `${name || 'gallery-photo'}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(url, '_blank');
                        }
                      };

                      const handleDeleteImage = (idx: number) => {
                        if (items.length <= 2) {
                          alert('يجب أن يحتوي المعرض على صورتين على الأقل');
                          return;
                        }
                        const newItems = items.filter((_, i) => i !== idx);
                        const newActive = config.activeImageIndex && config.activeImageIndex >= newItems.length ? 0 : config.activeImageIndex;
                        updateGalleryConfig({ items: newItems, activeImageIndex: newActive });
                      };

                      return (
                        <div className="space-y-4 p-3 bg-white rounded-2xl border border-neutral-200 text-right select-none shadow-2xs" dir="rtl">
                          <input
                            type="file"
                            ref={galleryFileInputRef}
                            onChange={handleDeviceFileChange}
                            accept="image/*"
                            className="hidden"
                          />

                          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                                <Images size={16} />
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-neutral-900">إعدادات معرض الصور (٥ صور)</h3>
                                <p className="text-[10px] text-neutral-500">تحكم بالصور، الترتيب، والتنسيقات الأربعة</p>
                              </div>
                            </div>
                          </div>

                          {/* 1. SECTION: Gallery Layouts */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-800 flex items-center justify-between">
                              <span>تنسيق المعرض (الرسم التخطيطي 1 - 4):</span>
                              <span className="text-[10px] text-[#0071e3] font-medium">٤ تنسيقات</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {/* Layout 1 */}
                              <button
                                type="button"
                                onClick={() => updateGalleryConfig({ layout: 'top-main' })}
                                className={`p-2 rounded-xl border text-right transition-all flex flex-col gap-1.5 cursor-pointer ${
                                  layout === 'top-main'
                                    ? 'border-[#0071e3] bg-[#0071e3]/10 ring-1 ring-[#0071e3]'
                                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                }`}
                              >
                                <div className="w-full h-11 bg-neutral-100 rounded-lg p-1 flex flex-col justify-between">
                                  <div className="h-6 bg-neutral-300 rounded-xs flex items-center justify-center text-[7px] text-neutral-600 font-bold">شاشة العرض</div>
                                  <div className="h-2.5 grid grid-cols-4 gap-0.5">
                                    <div className="bg-[#0071e3] rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-neutral-800">١. شاشة أعلى ومصغرات أسفل</span>
                              </button>

                              {/* Layout 2 */}
                              <button
                                type="button"
                                onClick={() => updateGalleryConfig({ layout: 'left-thumbnails' })}
                                className={`p-2 rounded-xl border text-right transition-all flex flex-col gap-1.5 cursor-pointer ${
                                  layout === 'left-thumbnails'
                                    ? 'border-[#0071e3] bg-[#0071e3]/10 ring-1 ring-[#0071e3]'
                                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                }`}
                              >
                                <div className="w-full h-11 bg-neutral-100 rounded-lg p-1 flex flex-row gap-1">
                                  <div className="w-4.5 h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                                    <div className="bg-[#0071e3] rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                  </div>
                                  <div className="flex-1 bg-neutral-300 rounded-xs flex items-center justify-center text-[7px] text-neutral-600 font-bold">شاشة العرض</div>
                                </div>
                                <span className="text-[11px] font-bold text-neutral-800">٢. شبكة مصغرات يسار</span>
                              </button>

                              {/* Layout 3 */}
                              <button
                                type="button"
                                onClick={() => updateGalleryConfig({ layout: 'right-thumbnails' })}
                                className={`p-2 rounded-xl border text-right transition-all flex flex-col gap-1.5 cursor-pointer ${
                                  layout === 'right-thumbnails'
                                    ? 'border-[#0071e3] bg-[#0071e3]/10 ring-1 ring-[#0071e3]'
                                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                }`}
                              >
                                <div className="w-full h-11 bg-neutral-100 rounded-lg p-1 flex flex-row gap-1">
                                  <div className="flex-1 bg-neutral-300 rounded-xs flex items-center justify-center text-[7px] text-neutral-600 font-bold">شاشة العرض</div>
                                  <div className="w-4.5 h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                                    <div className="bg-[#0071e3] rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                    <div className="bg-neutral-400 rounded-2xs" />
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-neutral-800">٣. شبكة مصغرات يمين</span>
                              </button>

                              {/* Layout 4 */}
                              <button
                                type="button"
                                onClick={() => updateGalleryConfig({ layout: 'left-main-row' })}
                                className={`p-2 rounded-xl border text-right transition-all flex flex-col gap-1.5 cursor-pointer ${
                                  layout === 'left-main-row'
                                    ? 'border-[#0071e3] bg-[#0071e3]/10 ring-1 ring-[#0071e3]'
                                    : 'border-neutral-200 bg-white hover:bg-neutral-50'
                                }`}
                              >
                                <div className="w-full h-11 bg-neutral-100 rounded-lg p-1 flex flex-row gap-1">
                                  <div className="w-8 bg-neutral-300 rounded-xs flex items-center justify-center text-[7px] text-neutral-600 font-bold">شاشة العرض</div>
                                  <div className="flex-1 flex flex-col justify-between gap-0.5">
                                    <div className="h-1.5 bg-[#0071e3] rounded-2xs" />
                                    <div className="h-1.5 bg-neutral-400 rounded-2xs" />
                                    <div className="h-1.5 bg-neutral-400 rounded-2xs" />
                                    <div className="h-1.5 bg-neutral-400 rounded-2xs" />
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-neutral-800">٤. شاشة يسار ومصغرات صف</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. SECTION: Photos List */}
                          <div className="space-y-2 pt-2 border-t border-neutral-100">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-neutral-800">
                                صور المعرض ({items.length} صور):
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleTriggerDeviceUpload(-1)}
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-bold flex items-center gap-1 border border-emerald-200/60 cursor-pointer"
                                >
                                  <Upload size={10} />
                                  <span>رفع صورة (+)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUnsplashPicker(-1)}
                                  className="text-[10px] text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-lg font-bold flex items-center gap-1 border border-purple-200/60 cursor-pointer"
                                >
                                  <Sparkles size={10} />
                                  <span>Unsplash (+)</span>
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {items.map((item, idx) => {
                                const isUploadingThis = galleryUploadingIndex === idx;
                                return (
                                  <div
                                    key={item.id || idx}
                                    className="p-2 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center gap-2 transition-all hover:border-neutral-300"
                                  >
                                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300 relative">
                                      {isUploadingThis ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black/40">
                                          <Loader2 size={14} className="text-white animate-spin" />
                                        </div>
                                      ) : (
                                        <img
                                          src={item.url}
                                          alt={item.title || `صورة ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      )}
                                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-bold px-1 rounded-xs">
                                        {idx + 1}
                                      </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <input
                                        type="text"
                                        value={item.title || ''}
                                        onChange={(e) => {
                                          const newItems = [...items];
                                          newItems[idx] = { ...newItems[idx], title: e.target.value };
                                          updateGalleryConfig({ items: newItems });
                                        }}
                                        placeholder={`صورة رقم ${idx + 1}`}
                                        className="w-full text-xs font-semibold text-neutral-800 bg-transparent outline-none truncate border-b border-transparent hover:border-neutral-200 focus:border-[#0071e3]"
                                      />
                                      <div className="flex items-center gap-1 mt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleTriggerDeviceUpload(idx)}
                                          disabled={isUploadingThis}
                                          className="text-[9.5px] text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                                          title="استبدال برفع صورة من جهازك إلى Firebase Storage"
                                        >
                                          <Upload size={9} />
                                          <span>من الجهاز</span>
                                        </button>
                                        <span className="text-neutral-300 text-[9px]">|</span>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenUnsplashPicker(idx)}
                                          className="text-[9.5px] text-neutral-600 hover:text-purple-700 hover:bg-purple-50 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                                          title="استبدال بصورة من Unsplash"
                                        >
                                          <Sparkles size={9} />
                                          <span>Unsplash</span>
                                        </button>
                                        <span className="text-neutral-300 text-[9px]">|</span>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadImage(item.url, item.title)}
                                          className="text-[9.5px] text-neutral-600 hover:text-[#0071e3] hover:bg-blue-50 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                                          title="تنزيل الصورة الحالية لجهازك"
                                        >
                                          <Download size={9} />
                                          <span>تنزيل</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-1 shrink-0">
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleMoveUp(idx)}
                                          disabled={idx === 0}
                                          className="w-5 h-5 rounded flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-200/80 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                          title="تقديم لأعلى"
                                        >
                                          <ArrowUp size={11} strokeWidth={2.2} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleMoveDown(idx)}
                                          disabled={idx === items.length - 1}
                                          className="w-5 h-5 rounded flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-200/80 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                          title="تأخير لأسفل"
                                        >
                                          <ArrowDown size={11} strokeWidth={2.2} />
                                        </button>
                                      </div>
                                      {items.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteImage(idx)}
                                          className="w-full text-center text-[9px] text-red-500 hover:text-red-700 py-0.5 rounded hover:bg-red-50 cursor-pointer"
                                          title="حذف هذه الصورة"
                                        >
                                          حذف
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. SECTION: Visual Settings */}
                          <div className="space-y-2 pt-2 border-t border-neutral-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-neutral-600">نمط ملء شاشة العرض:</span>
                              <div className="flex gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                                <button
                                  type="button"
                                  onClick={() => updateGalleryConfig({ objectFit: 'cover' })}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    config.objectFit !== 'contain'
                                      ? 'bg-white text-[#0071e3] shadow-xs'
                                      : 'text-neutral-600 hover:text-black'
                                  }`}
                                >
                                  ملء وتناسق (Cover)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateGalleryConfig({ objectFit: 'contain' })}
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    config.objectFit === 'contain'
                                      ? 'bg-white text-[#0071e3] shadow-xs'
                                      : 'text-neutral-600 hover:text-black'
                                  }`}
                                >
                                  احتواء (Contain)
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-neutral-600">
                                <span>انحناء زوايا الصور:</span>
                                <span className="font-mono font-bold text-[#0071e3]">{config.borderRadius ?? 12}px</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="32"
                                value={config.borderRadius ?? 12}
                                onChange={(e) => updateGalleryConfig({ borderRadius: Number(e.target.value) })}
                                className="w-full accent-[#0071e3] cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-neutral-600">
                                <span>المسافة بين المصغرات:</span>
                                <span className="font-mono font-bold text-[#0071e3]">{config.gap ?? 8}px</span>
                              </div>
                              <input
                                type="range"
                                min="2"
                                max="20"
                                value={config.gap ?? 8}
                                onChange={(e) => updateGalleryConfig({ gap: Number(e.target.value) })}
                                className="w-full accent-[#0071e3] cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* 4. SECTION: Image Filters (تعديل صور المعرض كالصور العادية) */}
                          <div className="space-y-2 pt-2 border-t border-neutral-100">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-neutral-800">
                                تأثيرات وفلاتر صور المعرض:
                              </label>
                              <span className="text-[10px] text-neutral-400">
                                (فلاتر بصرية جاهزة)
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { id: 'none', name: 'أصلي', icon: '🖼️' },
                                { id: 'grayscale', name: 'أبيض وأسود', icon: '🌗' },
                                { id: 'warm', name: 'دافئ', icon: '🌅' },
                                { id: 'cool', name: 'بارد', icon: '❄️' },
                                { id: 'vintage', name: 'كلاسيكي', icon: '🕰️' },
                                { id: 'technicolor', name: 'سينمائي', icon: '🎬' },
                                { id: 'invert', name: 'معكوس', icon: '🧩' },
                                { id: 'blur', name: 'ضبابي', icon: '🌫️' }
                              ].map((f) => {
                                const isCurrent = (styles.imageFilter || 'none') === f.id;
                                return (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => onUpdateElementStyles({ imageFilter: f.id === 'none' ? undefined : f.id })}
                                    className={`py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                      isCurrent
                                        ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3]'
                                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                                    }`}
                                  >
                                    <span className="text-xs">{f.icon}</span>
                                    <span className="text-[9px] font-bold truncate max-w-full">{f.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 5. Quick Actions */}
                          <div className="flex gap-2 pt-2 border-t border-neutral-100">
                            <button
                              type="button"
                              onClick={() => onDuplicateElement(selectedElement.id)}
                              className="flex-1 py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Copy size={13} />
                              <span>مضاعفة (Copy)</span>
                            </button>
                            <button
                              type="button"
                              onClick={onToggleLock}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                selectedElement.isLocked
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700'
                                  : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700'
                              }`}
                            >
                              {selectedElement.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                              <span>{selectedElement.isLocked ? 'إلغاء القفل' : 'قفل المعرض'}</span>
                            </button>
                          </div>

                          {/* Unsplash Picker Modal Dialog */}
                          {unsplashPickerIndex !== null && (
                            <div 
                              className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                              onClick={() => setUnsplashPickerIndex(null)}
                            >
                              <div 
                                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden text-right"
                                onClick={(e) => e.stopPropagation()}
                                dir="rtl"
                              >
                                <div className="p-3.5 border-b border-neutral-200 flex items-center justify-between">
                                  <div>
                                    <h4 className="text-xs font-bold text-neutral-900">اختر صورة من مكتبة Unsplash</h4>
                                    <p className="text-[10px] text-neutral-500">
                                      {unsplashPickerIndex === -1 ? 'إضافة صورة جديدة للمعرض' : `استبدال الصورة رقم ${unsplashPickerIndex + 1}`}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setUnsplashPickerIndex(null)}
                                    className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>

                                <div className="p-2.5 border-b border-neutral-100 bg-neutral-50 flex gap-2">
                                  <input
                                    type="text"
                                    value={unsplashSearchQuery}
                                    onChange={(e) => setUnsplashSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleLoadUnsplashForGallery(unsplashSearchQuery);
                                    }}
                                    placeholder="ابحث: طبيعة، فنادق، سيارات، أطعمة..."
                                    className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#0071e3]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleLoadUnsplashForGallery(unsplashSearchQuery)}
                                    className="px-3 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  >
                                    بحث
                                  </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2.5 min-h-[220px]">
                                  {isUnsplashLoading ? (
                                    <div className="w-full h-36 flex flex-col items-center justify-center gap-2 text-neutral-500">
                                      <Loader2 size={22} className="animate-spin text-[#0071e3]" />
                                      <span className="text-[11px]">جاري جلب الصور...</span>
                                    </div>
                                  ) : unsplashPhotos.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                      {unsplashPhotos.map((photo: any, pIdx: number) => (
                                        <div
                                          key={photo.id || pIdx}
                                          onClick={() => handleSelectUnsplashPhoto(photo.url, photo.title)}
                                          className="group/photo relative aspect-4/3 rounded-lg overflow-hidden cursor-pointer border border-neutral-200 hover:border-[#0071e3] transition-all"
                                        >
                                          <img
                                            src={photo.url}
                                            alt={photo.title || 'صورة'}
                                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-200"
                                            loading="lazy"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/30 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                                            <span className="bg-[#0071e3] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                              اختيار
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="w-full h-36 flex items-center justify-center text-xs text-neutral-400">
                                      لم يتم العثور على صور، جرب كلمة بحث أخرى.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                      {/* إعدادات وتخصيص التقويم المتقدمة (حجز مواعيد متقدم) */}
                    {selectedElement.type === 'calendar' && (() => {
                      const title = selectedElement.calendarTitle || '';
                      const nameLabel = selectedElement.calendarNameLabel || 'الاسم الكامل';
                      const addressLabel = selectedElement.calendarAddressLabel || 'العنوان / مكان الإقامة';
                      const phoneLabel = selectedElement.calendarPhoneLabel || 'رقم الهاتف المتنقل';
                      const emailLabel = selectedElement.calendarEmailLabel || 'البريد الإلكتروني للعميل';
                      const descLabel = selectedElement.calendarDescLabel || 'تفاصيل ووصف الطلب';

                      const workingDays = selectedElement.calendarWorkingDays || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
                      const holidays = selectedElement.calendarHolidays || ['friday', 'saturday'];
                      const workStart = selectedElement.calendarWorkStart || '09:00';
                      const workEnd = selectedElement.calendarWorkEnd || '17:00';
                      const breakStart = selectedElement.calendarBreakStart || '12:00';
                      const breakEnd = selectedElement.calendarBreakEnd || '13:00';
                      const interval = selectedElement.calendarInterval || '30';
                      const intervalMins = selectedElement.calendarIntervalMinutes || 30;
                      const needsConfirmation = selectedElement.calendarNeedsConfirmation ?? true;
                      const accentColor = selectedElement.calendarAccentColor || '#0071e3';
                      const slots = selectedElement.calendarSlots || ['09:00 ص', '11:30 ص', '02:00 م', '04:30 م'];

                      // Supported meeting types as list (can select multiple!)
                      const meetingTypes = selectedElement.calendarMeetingTypes || [selectedElement.calendarMeetingType || 'phone'];

                      const daysList = [
                        { id: 'sunday', name: 'الأحد' },
                        { id: 'monday', name: 'الإثنين' },
                        { id: 'tuesday', name: 'الثلاثاء' },
                        { id: 'wednesday', name: 'الأربعاء' },
                        { id: 'thursday', name: 'الخميس' },
                        { id: 'friday', name: 'الجمعة' },
                        { id: 'saturday', name: 'السبت' },
                      ];

                      const handleToggleDay = (dayId: string) => {
                        let newWorking = [...workingDays];
                        let newHolidays = [...holidays];

                        if (workingDays.includes(dayId)) {
                          // Change to holiday
                          newWorking = newWorking.filter(d => d !== dayId);
                          if (!newHolidays.includes(dayId)) {
                            newHolidays.push(dayId);
                          }
                        } else {
                          // Change to working day
                          newHolidays = newHolidays.filter(d => d !== dayId);
                          if (!newWorking.includes(dayId)) {
                            newWorking.push(dayId);
                          }
                        }

                        onUpdateElement({
                          calendarWorkingDays: newWorking,
                          calendarHolidays: newHolidays,
                        });
                      };

                      const handleToggleMeetingType = (typeId: string) => {
                        let newTypes = [...meetingTypes];
                        if (newTypes.includes(typeId)) {
                          // Don't allow empty list
                          if (newTypes.length > 1) {
                            newTypes = newTypes.filter(t => t !== typeId);
                          }
                        } else {
                          newTypes.push(typeId);
                        }
                        
                        onUpdateElement({
                          calendarMeetingTypes: newTypes,
                          calendarMeetingType: newTypes[0] as any // maintain single value fallback
                        });
                      };

                      const presetColors = [
                        { hex: '#0071e3', name: 'أزرق آبل' },
                        { hex: '#10b981', name: 'زمردي' },
                        { hex: '#ec4899', name: 'وردي' },
                        { hex: '#8b5cf6', name: 'بنفسجي' },
                        { hex: '#f97316', name: 'برتقالي' },
                        { hex: '#ef4444', name: 'أحمر قاني' },
                        { hex: '#111827', name: 'فحمي' }
                      ];

                      return (
                        <div className="space-y-4 p-3.5 bg-blue-50/40 rounded-2xl border border-blue-200/50 text-right select-none shadow-2xs" dir="rtl">
                          {/* Section Header */}
                          <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
                            <div 
                              className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold shadow-xs transition-colors"
                              style={{ backgroundColor: accentColor }}
                            >
                              📅
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-neutral-900">ضبط إعدادات حجز المواعيد</h3>
                              <p className="text-[10px] text-neutral-500">قم بضبط أوقات العمل واللون والتحقق والمدد</p>
                            </div>
                          </div>

                          {/* 1. عنوان التقويم الرئيسي */}
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold text-neutral-800 block">عنوان التقويم ورأس النموذج:</label>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => onUpdateElement({ calendarTitle: e.target.value, content: e.target.value })}
                              placeholder="مثال: حجز موعد استشارة جديدة"
                              className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-neutral-300 focus:outline-none transition-all"
                            />
                          </div>

                          {/* 2. اللون الرئيسي / ألوان البطاقة */}
                          <div className="space-y-1.5 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">لون البطاقة والتفاعل النشط (Accent Color):</span>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {presetColors.map((color) => {
                                const isSelected = accentColor.toLowerCase() === color.hex.toLowerCase();
                                return (
                                  <button
                                    key={color.hex}
                                    type="button"
                                    onClick={() => onUpdateElement({ calendarAccentColor: color.hex })}
                                    className={`w-6 h-6 rounded-full border transition-all relative flex items-center justify-center cursor-pointer ${
                                      isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500 border-transparent' : 'border-neutral-200 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                  >
                                    {isSelected && <span className="text-[9px] text-white">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-neutral-500">رمز اللون المخصص (Hex):</span>
                              <input
                                type="text"
                                value={accentColor}
                                onChange={(e) => onUpdateElement({ calendarAccentColor: e.target.value })}
                                placeholder="#0071e3"
                                className="w-24 p-1 bg-white rounded-lg border border-neutral-300 font-mono text-center text-xs focus:outline-none uppercase"
                              />
                            </div>
                          </div>

                          {/* 3. أيام العمل والعطل الأسبوعية */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">أيام العمل والعطل الأسبوعية:</span>
                            <p className="text-[9.5px] text-neutral-400">اضغط على اليوم للتبديل بين يوم عمل (لون ملون) أو عطلة (رمادي):</p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {daysList.map((day) => {
                                const isWork = workingDays.includes(day.id);
                                return (
                                  <button
                                    key={day.id}
                                    type="button"
                                    onClick={() => handleToggleDay(day.id)}
                                    className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                                      isWork
                                        ? 'text-white border-transparent'
                                        : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200'
                                    }`}
                                    style={{ backgroundColor: isWork ? accentColor : undefined }}
                                  >
                                    {day.name}
                                    <div className="text-[7.5px] font-normal opacity-85 mt-0.5">
                                      {isWork ? 'عمل' : 'عطلة'}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 4. أوقات الدوام الرسمي اليومي */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">ساعات الدوام اليومي الرسمي:</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-neutral-500 block mb-0.5">بداية العمل:</span>
                                <input
                                  type="time"
                                  value={workStart}
                                  onChange={(e) => onUpdateElement({ calendarWorkStart: e.target.value })}
                                  className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-500 block mb-0.5">نهاية العمل:</span>
                                <input
                                  type="time"
                                  value={workEnd}
                                  onChange={(e) => onUpdateElement({ calendarWorkEnd: e.target.value })}
                                  className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 5. أوقات الاستراحة اليومية */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">أوقات الاستراحة (تُستثنى من الحجوزات):</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-neutral-500 block mb-0.5">بداية الاستراحة:</span>
                                <input
                                  type="time"
                                  value={breakStart}
                                  onChange={(e) => onUpdateElement({ calendarBreakStart: e.target.value })}
                                  className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-500 block mb-0.5">نهاية الاستراحة:</span>
                                <input
                                  type="time"
                                  value={breakEnd}
                                  onChange={(e) => onUpdateElement({ calendarBreakEnd: e.target.value })}
                                  className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 6. وتيرة تكرار المواعيد (Interval) */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">مدة الفترة المتاحة لكل موعد:</span>
                            <select
                              value={interval}
                              onChange={(e) => onUpdateElement({ calendarInterval: e.target.value as any })}
                              className="w-full text-xs font-semibold p-2 bg-white rounded-xl border border-neutral-300 focus:outline-none cursor-pointer"
                            >
                              <option value="10">موعد كل ١٠ دقائق</option>
                              <option value="15">موعد كل ١٥ دقيقة</option>
                              <option value="30">موعد كل ٣٠ دقيقة (نصف ساعة)</option>
                              <option value="60">موعد كل ساعة كاملة</option>
                              <option value="day">موعد واحد فقط طوال اليوم</option>
                              <option value="manual">تخصيص يدوي بالدقائق...</option>
                            </select>

                            {interval === 'manual' && (
                              <div className="space-y-1 mt-1.5 animate-fadeIn">
                                <label className="text-[10px] text-neutral-500 block">أدخل الوقت بالدقائق يدوياً:</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={480}
                                    value={intervalMins}
                                    onChange={(e) => onUpdateElement({ calendarIntervalMinutes: Math.max(1, Number(e.target.value)) })}
                                    className="w-24 p-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                  />
                                  <span className="text-xs text-neutral-500 font-semibold">دقيقة</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 7. هل يتطلب تأكيد مسبق */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">آلية الموافقة وتأكيد الموعد:</span>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={needsConfirmation}
                                onChange={(e) => onUpdateElement({ calendarNeedsConfirmation: e.target.checked })}
                                className="w-4 h-4 cursor-pointer"
                                style={{ accentColor: accentColor }}
                              />
                              <span className="text-xs font-medium text-neutral-700">يتطلب موافقة وتأكيد الإدارة أولاً (⏳ معلّق)</span>
                            </label>
                            <p className="text-[9px] text-neutral-400 mr-6">
                              في حال عدم التفعيل، سيتم تأكيد الموعد للمستخدم مباشرة (✅ فوري).
                            </p>
                          </div>

                          {/* 8. نوع الموعد (حضور شخصي، هاتفي، اتصال فيديو واتساب) - متعدد الخيارات! */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">طريقة ومكان إجراء المقابلة (اختر خياراً أو أكثر):</span>
                            <p className="text-[9.5px] text-neutral-400">ستتاح للمتصفح إمكانية الاختيار بين الخيارات المحددة فقط:</p>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { id: 'personal', name: '👤 شخصي', title: 'حضور شخصي بالمقر' },
                                { id: 'phone', name: '📞 هاتفي', title: 'مكالمة هاتفية صوتية' },
                                { id: 'whatsapp', name: '📹 فيديو', title: 'اتصال فيديو واتساب' },
                              ].map((type) => {
                                const isSel = meetingTypes.includes(type.id);
                                return (
                                  <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => handleToggleMeetingType(type.id)}
                                    className={`py-1.5 rounded-lg text-[9.5px] font-bold border transition-all text-center cursor-pointer ${
                                      isSel
                                        ? 'text-white border-transparent font-black'
                                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                                    }`}
                                    style={{ backgroundColor: isSel ? accentColor : undefined }}
                                    title={type.title}
                                  >
                                    {type.name}
                                    {isSel && <span className="mr-0.5 text-[8px]">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 9. تخصيص عناوين حقول الإدخال */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">تخصيص عناوين حقول النموذج:</span>
                            <p className="text-[9.5px] text-neutral-400">تحكم بأسماء الحقول الظاهرة للزوار للتوافق مع نشاطك:</p>
                            
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">اسم حقل الاسم:</span>
                                <input
                                  type="text"
                                  value={nameLabel}
                                  onChange={(e) => onUpdateElement({ calendarNameLabel: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none font-semibold"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">اسم حقل العنوان/المقر:</span>
                                <input
                                  type="text"
                                  value={addressLabel}
                                  onChange={(e) => onUpdateElement({ calendarAddressLabel: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none font-semibold"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">اسم حقل الهاتف:</span>
                                <input
                                  type="text"
                                  value={phoneLabel}
                                  onChange={(e) => onUpdateElement({ calendarPhoneLabel: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none font-semibold"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">اسم حقل البريد الإلكتروني:</span>
                                <input
                                  type="text"
                                  value={emailLabel}
                                  onChange={(e) => onUpdateElement({ calendarEmailLabel: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none font-semibold"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-neutral-400 block mb-0.5">اسم حقل وصف الطلب:</span>
                                <input
                                  type="text"
                                  value={descLabel}
                                  onChange={(e) => onUpdateElement({ calendarDescLabel: e.target.value })}
                                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none font-semibold"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 10. قائمة فترات الموعد المتاحة (كخيار احتياطي يدوي) */}
                          <div className="space-y-2 border-t border-blue-100/50 pt-2">
                            <span className="text-[10.5px] font-bold text-neutral-800 block">الفترات الزمنية الاحتياطية (في حال عدم جيلها تلقائياً):</span>
                            <textarea
                              value={slots.join(', ')}
                              onChange={(e) => {
                                const newSlots = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                onUpdateElement({ calendarSlots: newSlots });
                              }}
                              rows={2}
                              placeholder="مثال: 09:00 ص, 11:30 ص, 02:00 م, 04:30 م"
                              className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-neutral-300 text-xs focus:outline-none font-mono text-left font-semibold"
                              dir="ltr"
                            />
                            <p className="text-[9px] text-neutral-400 leading-relaxed text-right" dir="rtl">
                              تُستخدم هذه الفترات في حال رغبت بتجاوز الحساب التلقائي، اكتب الساعات مفصولة بفواصل.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* إعدادات مشغل الفيديو مخصصة */}
                    {selectedElement.type === 'video' && (
                      <div className="space-y-2.5 p-3.5 bg-red-50/50 rounded-2xl border border-red-200/60 text-right" dir="rtl">
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <Play size={14} className="text-red-600 shrink-0" />
                          <span>إعدادات مشغل الفيديو:</span>
                        </span>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-500 block">رابط الفيديو (YouTube أو TikTok):</label>
                          <input
                            type="url"
                            value={selectedElement.videoUrl || ''}
                            onChange={(e) => onUpdateElement({ videoUrl: e.target.value })}
                            placeholder="https://www.youtube.com/watch?v=..."
                            dir="ltr"
                            className="w-full px-3 py-2 bg-white rounded-lg border border-neutral-300 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-500 block">عنوان الفيديو أو وصفه:</label>
                          <input
                            type="text"
                            value={selectedElement.content || ''}
                            onChange={(e) => onUpdateElement({ content: e.target.value })}
                            placeholder="مثال: فيديو تعريفي للشركة"
                            className="w-full px-3 py-2 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          />
                        </div>

                        <div className="flex gap-1.5 pt-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateElement({ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })}
                            className="text-[9px] bg-red-100/50 hover:bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-200 font-bold font-mono transition-colors cursor-pointer"
                          >
                            YouTube تجريبي
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateElement({ videoUrl: 'https://www.tiktok.com/@tiktok/video/7106362547144887554' })}
                            className="text-[9px] bg-neutral-900 text-white px-2 py-1 rounded-md border border-neutral-800 font-bold font-mono hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            TikTok تجريبي
                          </button>
                        </div>
                      </div>
                    )}

                    {/* إعدادات الخريطة مخصصة */}
                    {selectedElement.type === 'map' && (
                      <div className="space-y-2.5 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200/60 text-right" dir="rtl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                            <MapPin size={14} className="text-blue-600 shrink-0" />
                            <span>إعدادات موقع الخريطة:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDetectUserLocation((loc) => onUpdateElement({ mapLocation: loc, content: loc }))}
                            disabled={isDetectingLocation}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-3xs transition-all cursor-pointer disabled:opacity-50"
                            title="تحديد الموقع الجغرافي الحالي تلقائياً وتثبيت الدبوس عليه"
                          >
                            {isDetectingLocation ? (
                              <>
                                <Loader2 size={11} className="animate-spin text-blue-600" />
                                <span>جاري التحديد...</span>
                              </>
                            ) : (
                              <>
                                <Navigation size={11} className="text-blue-600" />
                                <span>موقعي الحالي 📍</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-500 block">العنوان أو المكان المستهدف:</label>
                          <input
                            type="text"
                            value={selectedElement.mapLocation || selectedElement.content || ''}
                            onChange={(e) => onUpdateElement({ mapLocation: e.target.value, content: e.target.value })}
                            placeholder="مثال: الرياض، برج المملكة أو إحداثيات GPS"
                            className="w-full px-3 py-2 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          {locationDetectError && (
                            <p className="text-[10px] text-red-600 font-semibold mt-1">⚠️ {locationDetectError}</p>
                          )}
                          <p className="text-[9.5px] text-neutral-400 leading-snug">
                            اكتب اسم المعلم أو المدينة أو اضغط زر "موقعي الحالي" وسيتم وضع الدبوس وتحديث الخريطة فوراً.
                          </p>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          {[
                            { name: 'برج خليفة', loc: 'دبي، برج خليفة، الإمارات العربية المتحدة' },
                            { name: 'برج المملكة', loc: 'الرياض، برج المملكة، المملكة العربية السعودية' },
                            { name: 'المعادي', loc: 'القاهرة، المعادي، مصر' }
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => onUpdateElement({ mapLocation: preset.loc, content: preset.loc })}
                              className="text-[9px] bg-blue-100/50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-200 font-bold transition-colors cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* إعدادات وتخصيص الجدول مخصصة */}
                    {selectedElement.type === 'table' && (
                      <div className="space-y-3.5 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 text-right" dir="rtl">
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <Grid3X3 size={14} className="text-emerald-600 shrink-0" />
                          <span>إعدادات وتصميم الجدول:</span>
                        </span>

                        {/* 10 Coordinated Colors Palette */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-neutral-500 block">لون الجدول (السطر الأول والإطارات):</label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[
                              { label: 'أزرق', value: '#0071e3' },
                              { label: 'أخضر', value: '#10b981' },
                              { label: 'أحمر', value: '#ef4444' },
                              { label: 'أصفر', value: '#f59e0b' },
                              { label: 'بنفسجي', value: '#6366f1' },
                              { label: 'وردي', value: '#ec4899' },
                              { label: 'رمادي', value: '#475569' },
                              { label: 'مائي', value: '#14b8a6' },
                              { label: 'برتقالي', value: '#f97316' },
                              { label: 'فحمي', value: '#1f2937' },
                            ].map((color) => {
                              const isSelected = selectedElement.tableConfig?.themeColor === color.value;
                              return (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => {
                                    const currentConfig = selectedElement.tableConfig || {
                                      rows: 3,
                                      cols: 3,
                                      themeColor: '#0071e3',
                                      headerRow: true,
                                      indexCol: false,
                                      colWidths: [120, 120, 120],
                                      rowHeights: [40, 40, 40],
                                      cells: [['', '', ''], ['', '', ''], ['', '', '']]
                                    };
                                    onUpdateElement({
                                      tableConfig: {
                                        ...currentConfig,
                                        themeColor: color.value
                                      }
                                    });
                                  }}
                                  className="relative h-6 rounded-md cursor-pointer transition-all border border-black/[0.05]"
                                  style={{ backgroundColor: color.value }}
                                  title={color.label}
                                >
                                  {isSelected && (
                                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rows and columns spinners */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">عدد السطور:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={selectedElement.tableConfig?.rows || 3}
                                onChange={(e) => {
                                  const newRows = Math.max(1, Number(e.target.value));
                                  const currentConfig = selectedElement.tableConfig || {
                                    rows: 3,
                                    cols: 3,
                                    themeColor: '#0071e3',
                                    headerRow: true,
                                    indexCol: false,
                                    colWidths: [120, 120, 120],
                                    rowHeights: [40, 40, 40],
                                    cells: [['', '', ''], ['', '', ''], ['', '', '']]
                                  };
                                  let newCells = [...currentConfig.cells];
                                  if (newRows > currentConfig.rows) {
                                    for (let r = currentConfig.rows; r < newRows; r++) {
                                      newCells.push(Array(currentConfig.cols).fill(''));
                                    }
                                  } else if (newRows < currentConfig.rows) {
                                    newCells = newCells.slice(0, newRows);
                                  }
                                  const newRowHeights = [...currentConfig.rowHeights];
                                  if (newRowHeights.length < newRows) {
                                    for (let r = newRowHeights.length; r < newRows; r++) {
                                      newRowHeights.push(40);
                                    }
                                  }
                                  onUpdateElement({
                                    tableConfig: {
                                      ...currentConfig,
                                      rows: newRows,
                                      cells: newCells,
                                      rowHeights: newRowHeights
                                    }
                                  });
                                }}
                                className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">عدد الأعمدة:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                max={15}
                                value={selectedElement.tableConfig?.cols || 3}
                                onChange={(e) => {
                                  const newCols = Math.max(1, Number(e.target.value));
                                  const currentConfig = selectedElement.tableConfig || {
                                    rows: 3,
                                    cols: 3,
                                    themeColor: '#0071e3',
                                    headerRow: true,
                                    indexCol: false,
                                    colWidths: [120, 120, 120],
                                    rowHeights: [40, 40, 40],
                                    cells: [['', '', ''], ['', '', ''], ['', '', '']]
                                  };
                                  let newCells = currentConfig.cells.map(row => {
                                    let newRow = [...row];
                                    if (newCols > currentConfig.cols) {
                                      return newRow.concat(Array(newCols - currentConfig.cols).fill(''));
                                    } else {
                                      return newRow.slice(0, newCols);
                                    }
                                  });
                                  const newColWidths = [...currentConfig.colWidths];
                                  if (newColWidths.length < newCols) {
                                    for (let c = newColWidths.length; c < newCols; c++) {
                                      newColWidths.push(120);
                                    }
                                  }
                                  onUpdateElement({
                                    tableConfig: {
                                      ...currentConfig,
                                      cols: newCols,
                                      cells: newCells,
                                      colWidths: newColWidths
                                    }
                                  });
                                }}
                                className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Col Width and Row Height spinners */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">عرض الأعمدة الافتراضي:</span>
                            <input
                              type="number"
                              min={30}
                              max={300}
                              value={selectedElement.tableConfig?.colWidths[0] || 120}
                              onChange={(e) => {
                                const w = Math.max(30, Number(e.target.value));
                                const currentConfig = selectedElement.tableConfig || {
                                  rows: 3,
                                  cols: 3,
                                  themeColor: '#0071e3',
                                  headerRow: true,
                                  indexCol: false,
                                  colWidths: [120, 120, 120],
                                  rowHeights: [40, 40, 40],
                                  cells: [['', '', ''], ['', '', ''], ['', '', '']]
                                };
                                onUpdateElement({
                                  tableConfig: {
                                    ...currentConfig,
                                    colWidths: currentConfig.colWidths.map(() => w)
                                  }
                                });
                              }}
                              className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">ارتفاع الأسطر الافتراضي:</span>
                            <input
                              type="number"
                              min={20}
                              max={150}
                              value={selectedElement.tableConfig?.rowHeights[0] || 40}
                              onChange={(e) => {
                                const h = Math.max(20, Number(e.target.value));
                                const currentConfig = selectedElement.tableConfig || {
                                  rows: 3,
                                  cols: 3,
                                  themeColor: '#0071e3',
                                  headerRow: true,
                                  indexCol: false,
                                  colWidths: [120, 120, 120],
                                  rowHeights: [40, 40, 40],
                                  cells: [['', '', ''], ['', '', ''], ['', '', '']]
                                };
                                onUpdateElement({
                                  tableConfig: {
                                    ...currentConfig,
                                    rowHeights: currentConfig.rowHeights.map(() => h)
                                  }
                                });
                              }}
                              className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Toggles (Header, Index Numbering) */}
                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedElement.tableConfig?.headerRow ?? true}
                              onChange={(e) => {
                                const currentConfig = selectedElement.tableConfig || {
                                  rows: 3,
                                  cols: 3,
                                  themeColor: '#0071e3',
                                  headerRow: true,
                                  indexCol: false,
                                  colWidths: [120, 120, 120],
                                  rowHeights: [40, 40, 40],
                                  cells: [['', '', ''], ['', '', ''], ['', '', '']]
                                };
                                onUpdateElement({
                                  tableConfig: {
                                    ...currentConfig,
                                    headerRow: e.target.checked
                                  }
                                });
                              }}
                              className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs text-neutral-700">تفعيل سطر العناوين (أول سطر)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedElement.tableConfig?.indexCol ?? false}
                              onChange={(e) => {
                                const currentConfig = selectedElement.tableConfig || {
                                  rows: 3,
                                  cols: 3,
                                  themeColor: '#0071e3',
                                  headerRow: true,
                                  indexCol: false,
                                  colWidths: [120, 120, 120],
                                  rowHeights: [40, 40, 40],
                                  cells: [['', '', ''], ['', '', ''], ['', '', '']]
                                };
                                onUpdateElement({
                                  tableConfig: {
                                    ...currentConfig,
                                    indexCol: e.target.checked
                                  }
                                });
                              }}
                              className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs text-neutral-700">تفعيل عمود التعداد يميناً (1، 2، 3...)</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* أبعاد العنصر */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-neutral-800 block">أبعاد العنصر:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5">العرض (W):</span>
                          <input
                            type="number"
                            value={selectedElement.width}
                            onChange={(e) => onUpdateElement({ width: Math.max(20, Number(e.target.value)) })}
                            className="w-full p-2 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-center focus:border-[#0071e3] focus:outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block mb-0.5">الارتفاع (H):</span>
                          <input
                            type="number"
                            value={selectedElement.height}
                            onChange={(e) => onUpdateElement({ height: Math.max(20, Number(e.target.value)) })}
                            className="w-full p-2 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-center focus:border-[#0071e3] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* تدوير العنصر في مركزه (Center Rotation) */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <RotateCw size={13} className="text-[#0071e3]" />
                          <span>تدوير العنصر في مركزه:</span>
                        </span>
                        <div className="flex items-center gap-1 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200 font-mono text-xs font-bold text-[#0071e3]">
                          <span>{Math.round(selectedElement.rotation || 0)}°</span>
                        </div>
                      </div>

                      {/* شريط السحب الزاوي Slider */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={selectedElement.rotation || 0}
                          onChange={(e) => onUpdateElement({ rotation: Number(e.target.value) })}
                          className="w-full accent-[#0071e3] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono px-0.5">
                          <span>0°</span>
                          <span>90°</span>
                          <span>180°</span>
                          <span>270°</span>
                          <span>360°</span>
                        </div>
                      </div>

                      {/* أزرار التدوير السريع */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[
                          { deg: 0, label: '0°' },
                          { deg: 90, label: '90°' },
                          { deg: 180, label: '180°' },
                          { deg: 270, label: '270°' },
                        ].map((btn) => (
                          <button
                            key={btn.deg}
                            type="button"
                            onClick={() => onUpdateElement({ rotation: btn.deg })}
                            className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                              (selectedElement.rotation || 0) === btn.deg
                                ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-xs'
                                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* درجات إزاحة إضافية */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const current = selectedElement.rotation || 0;
                            const next = (current - 45 + 360) % 360;
                            onUpdateElement({ rotation: next });
                          }}
                          className="py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 text-neutral-700 transition-colors"
                        >
                          <RotateCcw size={12} />
                          <span>-45° يسار</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = selectedElement.rotation || 0;
                            const next = (current + 45) % 360;
                            onUpdateElement({ rotation: next });
                          }}
                          className="py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 text-neutral-700 transition-colors"
                        >
                          <RotateCw size={12} />
                          <span>+45° يمين</span>
                        </button>
                      </div>
                    </div>

                    {/* إجراءات سريعة: تكرار وقفل */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-200/80">
                      <button
                        onClick={() => onDuplicateElement(selectedElement.id)}
                        className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Copy size={13} />
                        <span>تكرار العنصر</span>
                      </button>
                      <button
                        onClick={onToggleLock}
                        className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {selectedElement.isLocked ? <Lock size={13} className="text-amber-600" /> : <Unlock size={13} />}
                        <span>{selectedElement.isLocked ? 'مقفل' : 'قفل العنصر'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-neutral-400 py-6 text-center">حدد عنصراً لضبط أبعاده وتدويره.</div>
                )}
              </div>
            )}

            {/* TOOL: Format Painter (رول الدهان) */}
            {activeSection === 'format-painter' && (
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-[#0071e3]/20 text-xs text-[#0071e3] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <PaintRoller size={16} />
                  <span>{isFormatCopied ? 'تم نسخ التنسيق بنجاح!' : 'جاهز لنسخ التنسيق'}</span>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  انقر الآن على أي عنصر آخر لتطبيق اللون والإطار والحجم عليه مباشرة.
                </p>
              </div>
            )}

            {/* TOOL: Unified Text Editing (تعديل النص كالمخطط اليدوي تماماً) */}
            {(activeSection === 'typography' || activeSection === 'fontSize' || activeSection === 'fontFamily' || activeSection === 'alignment' || activeSection === 'list') && (() => {
              const isBold = styles.fontWeight === 'bold';
              const isItalic = styles.fontStyle === 'italic';
              const isUnderline = styles.textDecoration === 'underline';
              const isBulletList = styles.listStyle === 'bullet';
              const isNumericList = styles.listStyle === 'numeric';
              const textAlign = styles.textAlign || 'right';
              const currentFontSize = styles.fontSize || 16;
              const currentFontFamily = styles.fontFamily || 'Readex Pro';

              const toggleBold = () => {
                onUpdateElementStyles({ fontWeight: isBold ? 'normal' : 'bold' });
              };
              const toggleItalic = () => {
                onUpdateElementStyles({ fontStyle: isItalic ? 'normal' : 'italic' });
              };
              const toggleUnderline = () => {
                onUpdateElementStyles({ textDecoration: isUnderline ? 'none' : 'underline' });
              };
              const cycleAlignment = () => {
                const next = textAlign === 'right' ? 'center' : (textAlign === 'center' ? 'left' : 'right');
                onUpdateElementStyles({ textAlign: next });
              };
              const toggleBulletList = () => {
                onUpdateElementStyles({ listStyle: isBulletList ? 'none' : 'bullet' });
              };
              const toggleNumericList = () => {
                onUpdateElementStyles({ listStyle: isNumericList ? 'none' : 'numeric' });
              };

              return (
                <div className="space-y-4">
                  {/* Top Oval Container / Capsule Toolbar - Exact Match to Sketch */}
                  <div className="w-full p-1.5 bg-neutral-100 rounded-full border border-neutral-300 shadow-2xs flex items-center justify-between px-2 gap-0.5 select-none">
                    {/* محاذاة النص */}
                    <button
                      type="button"
                      onClick={cycleAlignment}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-700 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer"
                      title={`محاذاة النص: ${textAlign === 'right' ? 'يمين' : textAlign === 'center' ? 'وسط' : 'يسار'}`}
                    >
                      {textAlign === 'right' && <AlignRight size={14} strokeWidth={2} />}
                      {textAlign === 'center' && <AlignCenter size={14} strokeWidth={2} />}
                      {textAlign === 'left' && <AlignLeft size={14} strokeWidth={2} />}
                    </button>

                    {/* ميلان النص */}
                    <button
                      type="button"
                      onClick={toggleItalic}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isItalic 
                          ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                          : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                      }`}
                      title="ميلان النص (Italic)"
                    >
                      <Italic size={14} strokeWidth={2} />
                    </button>

                    {/* سمك الخط */}
                    <button
                      type="button"
                      onClick={toggleBold}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isBold 
                          ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                          : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                      }`}
                      title="سمك الخط (Bold)"
                    >
                      <Bold size={14} strokeWidth={2.4} />
                    </button>

                    {/* تسطير النص */}
                    <button
                      type="button"
                      onClick={toggleUnderline}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isUnderline 
                          ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                          : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                      }`}
                      title="تسطير النص (Underline)"
                    >
                      <Underline size={14} strokeWidth={2} />
                    </button>

                    {/* تعداد نقطي */}
                    <button
                      type="button"
                      onClick={toggleBulletList}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isBulletList 
                          ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                          : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                      }`}
                      title="تعداد نقطي"
                    >
                      <List size={14} strokeWidth={2} />
                    </button>

                    {/* تعداد رقمي */}
                    <button
                      type="button"
                      onClick={toggleNumericList}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isNumericList 
                          ? 'bg-[#0071e3]/15 text-[#0071e3] font-bold' 
                          : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                      }`}
                      title="تعداد رقمي"
                    >
                      <ListOrdered size={14} strokeWidth={2} />
                    </button>

                    <div className="h-4 w-px bg-neutral-300 mx-0.5" />

                    {/* نوع الخط (aA) - محاط بدائرة عند التفعيل كما في الرسم */}
                    <button
                      type="button"
                      onClick={() => setTextSubSection('family')}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        textSubSection === 'family'
                          ? 'bg-white text-[#0071e3] ring-2 ring-[#0071e3] shadow-xs font-bold'
                          : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                      }`}
                      title="نوع وشكل الخط (aA)"
                    >
                      <span className="font-sans text-[12px] font-bold flex items-baseline select-none">
                        <span>a</span>
                        <span className="text-[10px] font-extrabold -mr-0.5 text-[#0071e3]">A</span>
                      </span>
                    </button>

                    {/* حجم الخط (T) - محاط بدائرة عند التفعيل كما في الرسم */}
                    <button
                      type="button"
                      onClick={() => setTextSubSection('size')}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        textSubSection === 'size'
                          ? 'bg-white text-[#0071e3] ring-2 ring-[#0071e3] shadow-xs font-bold'
                          : 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                      }`}
                      title="حجم الخط (T)"
                    >
                      <span className="font-serif text-[14px] font-bold leading-none select-none">
                        T
                      </span>
                    </button>
                  </div>

                  {/* فرع حجم الخط: سلايدر + 4 مربعات رئيسية */}
                  {textSubSection === 'size' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-800 font-bold text-sm">حجم الخط:</span>
                        <span className="font-mono text-[#0071e3] font-bold text-sm bg-[#0071e3]/10 px-2.5 py-0.5 rounded-lg border border-[#0071e3]/20">
                          {currentFontSize}px
                        </span>
                      </div>

                      {/* شريط السحب (Slider) */}
                      <div className="px-1 space-y-1">
                        <input
                          type="range"
                          min="10"
                          max="140"
                          value={currentFontSize}
                          onChange={(e) => onUpdateElementStyles({ fontSize: Number(e.target.value) })}
                          className="w-full accent-[#0071e3] h-2 bg-neutral-200 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                          <span>10px</span>
                          <span>70px</span>
                          <span>140px</span>
                        </div>
                      </div>

                      {/* المربعات الأربعة السريعة كما في المخطط اليدوي: [140] [100] [48] [24] */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] text-neutral-500 block font-medium">أحجام شائعة سريعة:</span>
                        <div className="grid grid-cols-4 gap-2">
                          {[140, 100, 48, 24].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => onUpdateElementStyles({ fontSize: sz })}
                              className={`py-2.5 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                                currentFontSize === sz
                                  ? 'border-[#0071e3] bg-[#0071e3]/15 text-[#0071e3] ring-2 ring-[#0071e3]/50 shadow-xs'
                                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800 shadow-2xs'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>

                        {/* صف إضافي لأحجام النصوص الدقيقة */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {[14, 18, 32, 64].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => onUpdateElementStyles({ fontSize: sz })}
                              className={`py-1.5 rounded-lg border text-center font-semibold text-xs transition-all cursor-pointer ${
                                currentFontSize === sz
                                  ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {sz}px
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* فرع نوع الخط: قائمة بالخطوط العربية والأجنبية */}
                  {textSubSection === 'family' && (() => {
                    const filteredFonts = SIXTY_FONTS.filter(f => {
                      if (fontLangFilter === 'ar' && f.lang !== 'ar') return false;
                      if (fontLangFilter === 'lat' && f.lang !== 'lat') return false;
                      if (fontSearch.trim()) {
                        const query = fontSearch.toLowerCase();
                        return f.name.toLowerCase().includes(query) || f.font.toLowerCase().includes(query);
                      }
                      return true;
                    });

                    return (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-800 font-bold">نوع الخط:</span>
                          <span className="text-neutral-400 text-[10px] font-mono">({filteredFonts.length} خط)</span>
                        </div>

                        {/* شريط البحث المدمج والكبسولات الذكية */}
                        <div className="space-y-1.5">
                          <div className="relative">
                            <input
                              type="text"
                              value={fontSearch}
                              onChange={(e) => setFontSearch(e.target.value)}
                              placeholder="ابحث عن خط..."
                              className="w-full px-2.5 py-1.5 bg-neutral-100 focus:bg-white border border-neutral-300 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] rounded-lg text-xs text-right placeholder:text-neutral-400 focus:outline-none transition-all"
                              dir="rtl"
                            />
                            {fontSearch && (
                              <button
                                type="button"
                                onClick={() => setFontSearch('')}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs focus:outline-none"
                              >
                                ✖
                              </button>
                            )}
                          </div>

                          <div className="flex gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-300">
                            {[
                              { id: 'all' as const, label: 'الكل' },
                              { id: 'ar' as const, label: 'عربي' },
                              { id: 'lat' as const, label: 'لاتيني' },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setFontLangFilter(tab.id)}
                                className={`flex-1 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                                  fontLangFilter === tab.id
                                    ? 'bg-white text-[#0071e3] shadow-3xs'
                                    : 'text-neutral-500 hover:text-neutral-800'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* قائمة الخطوط - خفيفة وبدون شرح */}
                        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-0.5 scroll-smooth border border-neutral-200/50 rounded-xl p-1 bg-neutral-50/50">
                          {filteredFonts.map((f) => {
                            const isSelected = currentFontFamily === f.font;
                            return (
                              <button
                                key={f.font}
                                type="button"
                                onClick={() => onUpdateElementStyles({ fontFamily: f.font })}
                                className={`w-full py-2 px-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] font-bold shadow-2xs ring-1 ring-[#0071e3]/30'
                                    : 'border-neutral-200/60 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800'
                                }`}
                              >
                                <span
                                  className="text-[13px] truncate"
                                  style={{ fontFamily: f.font }}
                                >
                                  {f.name}
                                </span>
                                {isSelected && (
                                  <div className="w-4 h-4 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                                    <Check size={10} strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}

                          {filteredFonts.length === 0 && (
                            <div className="text-center py-8 text-xs text-neutral-400 bg-white rounded-lg border border-neutral-100">
                              لا توجد خطوط مطابقة للبحث
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* TOOL: Animation */}
            {activeSection === 'animation' && (() => {
              const currentAnimation = styles.animation || 'none';
              const currentTrigger = styles.animationTrigger || 'once';
              const currentDuration = styles.animationDuration || (
                ['spin-slow'].includes(currentAnimation) ? 10 :
                ['marquee-rtl', 'marquee-ltr'].includes(currentAnimation) ? 12 :
                ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'scale-down'].includes(currentAnimation) ? 1.2 :
                ['pulse', 'brightness', 'shake', 'bounce', 'flash', 'float', 'heartbeat', 'rubberband', 'swing', 'jello'].includes(currentAnimation) ? 2 : 1.5
              );

              const ANIMATIONS_LIST = [
                { id: 'none', name: 'بدون حركة ✕', desc: 'إيقاف الحركة بالكامل', arrow: '▫️', delay: 1.5 },
                { id: 'fade', name: 'تلاشي ناعم', desc: 'ظهور تدريجي من الشفافية', arrow: '▫️ ➔ ⬜', delay: 1.2 },
                { id: 'slide-up', name: 'انزلاق لأعلى', desc: 'دخول انسيابي للأعلى', arrow: '⬆️', delay: 1.2 },
                { id: 'slide-down', name: 'انزلاق لأسفل', desc: 'دخول انسيابي للأسفل', arrow: '⬇️', delay: 1.2 },
                { id: 'slide-left', name: 'انزلاق لليسار', desc: 'دخول من اليمين لليسار', arrow: '⬅️', delay: 1.2 },
                { id: 'slide-right', name: 'انزلاق لليمين', desc: 'دخول من اليسار لليمين', arrow: '➡️', delay: 1.2 },
                { id: 'marquee-rtl', name: 'شريط متكرر ⇠ يسار', desc: 'شريط متحرك كالنشرات الإخبارية', arrow: '⇠ ⇠ ⇠', delay: 12 },
                { id: 'marquee-ltr', name: 'شريط متكرر ⇢ يمين', desc: 'شريط متحرك لجهة اليمين', arrow: '⇢ ⇢ ⇢', delay: 12 },
                { id: 'pulse', name: 'نبض مستمر', desc: 'تكبير وتصغير متكرر هادئ', arrow: '⤾ ⤿', delay: 2 },
                { id: 'brightness', name: 'وميض سطوع', desc: 'توهج ضوئي دوري لافت', arrow: '✨ 💡', delay: 2 },
                { id: 'scale-up', name: 'تكبير تدريجي', desc: 'نمو سلس من نقطة الصفر', arrow: '🔍 ↗️', delay: 1.2 },
                { id: 'scale-down', name: 'تصغير تدريجي', desc: 'دخول عملاق ثم يستقر', arrow: '🔎 ↙️', delay: 1.2 },
                { id: 'shake', name: 'اهتزاز لافت', desc: 'اهتزاز يمين ويسار للتنبيه', arrow: '⇎ 🫨', delay: 2 },
                { id: 'bounce', name: 'ارتداد نطاطي', desc: 'ارتداد مرن لأعلى وأسفل', arrow: '⇅ 🏀', delay: 2 },
                { id: 'rotate', name: 'دوران 360', desc: 'دوران كامل حول المركز', arrow: '🔄', delay: 2.5 },
                { id: 'spin-slow', name: 'دوران هادئ', desc: 'دوران بطيء جداً للخلفيات', arrow: '🌀 ⟳', delay: 10 },
                { id: 'flash', name: 'وميض خاطف', desc: 'وميض متقطع سريع ومثير', arrow: '⚡ ⌁', delay: 2 },
                { id: 'float', name: 'طفو مائي', desc: 'تحليق خفيف طافٍ بالهواء', arrow: '🎈 ≁', delay: 2.5 },
                { id: 'heartbeat', name: 'خفقان سريع', desc: 'نبضتان سريعتان كنبض القلب', arrow: '💗 ❤️', delay: 2 },
                { id: 'rubberband', name: 'مطاط مرن', desc: 'تمطط جانبي مرن ومرح', arrow: '↔️ 🎗️', delay: 2 },
                { id: 'swing', name: 'تأرجح مائل', desc: 'أرجوحة لطيفة من الأعلى', arrow: '⤾ 📐', delay: 2 },
                { id: 'jello', name: 'تموج هلامي', desc: 'تموج مائل مرتعش وممتع', arrow: '🍮 〰️', delay: 2 }
              ];

              return (
                <div className="space-y-4 text-right animate-fade" dir="rtl">
                  {/* Header info */}
                  <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-3 rounded-xl">
                    <span className="text-[11px] font-bold text-[#0071e3] block mb-1">
                      لوحة الحركات والأنيميشن التفاعلي:
                    </span>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      اختر نمط الحركة والسرعة والحدث المناسب لتنشيط وتحريك العناصر والشرائط الإخبارية على الصفحة.
                    </p>
                  </div>

                  {/* 1. Trigger Selection */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-800 block">
                      تنشيط التأثير وحالة التشغيل:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200">
                      {[
                        { id: 'hover', label: 'مرور الماوس 🖱️' },
                        { id: 'once', label: 'فتح الصفحة 🔄' },
                        { id: 'loop', label: 'مستمر دائم 🔁' }
                      ].map((trig) => {
                        const isSelected = currentTrigger === trig.id;
                        return (
                          <button
                            key={trig.id}
                            type="button"
                            onClick={() => onUpdateElementStyles({ animationTrigger: trig.id as any })}
                            className={`py-2 px-1 rounded-lg text-[10px] font-extrabold text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
                                : 'text-neutral-600 hover:text-black hover:bg-white/45'
                            }`}
                          >
                            {trig.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Speed Slider */}
                  {currentAnimation !== 'none' && (
                    <div className="space-y-1.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-700">مدة وسرعة الحركة:</span>
                        <span className="font-mono text-[#0071e3] font-bold bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                          {currentDuration} ثانية
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="20"
                        step="0.1"
                        value={currentDuration}
                        onChange={(e) => onUpdateElementStyles({ animationDuration: Number(e.target.value) })}
                        className="w-full accent-[#0071e3] h-1.5 bg-neutral-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                        <span>0.3ث (سريع)</span>
                        <span>10ث</span>
                        <span>20ث (بطيء)</span>
                      </div>
                    </div>
                  )}

                  {/* 3. Animations Grid */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-bold text-neutral-800 block">
                      اختر حركة من الحركات الـ ٢٠+ المبتكرة:
                    </span>
                    <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                      {ANIMATIONS_LIST.map((animItem) => {
                        const isSelected = currentAnimation === animItem.id;
                        return (
                          <button
                            key={animItem.id}
                            type="button"
                            onClick={() => {
                              onUpdateElementStyles({ 
                                animation: animItem.id,
                                animationDuration: animItem.id === 'none' ? undefined : animItem.delay
                              });
                            }}
                            className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1.5 relative group ${
                              isSelected
                                ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-sm ring-1 ring-[#0071e3]'
                                : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                            }`}
                          >
                            {/* Title & select indicator */}
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold text-neutral-800">
                                {animItem.name}
                              </span>
                              {isSelected && (
                                <div className="w-3.5 h-3.5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                                  <Check size={9} strokeWidth={3} />
                                </div>
                              )}
                            </div>

                            {/* Mini descriptive graphic diagram (عنصر رمادي وأبيض وأسهم الحركة) */}
                            <div className="w-full h-8 bg-neutral-100 rounded-lg border border-neutral-200/50 flex items-center justify-center relative overflow-hidden select-none">
                              {/* Background gray element container */}
                              <div className="w-11/12 h-6 bg-neutral-200/40 rounded border border-dashed border-neutral-300 flex items-center justify-between px-1.5">
                                {/* white core animated block */}
                                <div className="w-5 h-3 bg-white rounded shadow-3xs border border-neutral-200 flex items-center justify-center text-[7px] text-neutral-400 font-bold shrink-0">
                                  ▫️
                                </div>
                                {/* Motion explanation arrows */}
                                <span className="text-[9px] font-mono text-[#0071e3] font-bold shrink-0">
                                  {animItem.arrow}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <span className="text-[9px] text-neutral-400 font-medium truncate">
                              {animItem.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TOOL: Add Elements (+) - Step 1: Squares Grid (الصورة رقم ١) | Step 2: Detail with Subcategories Bar (الصورة رقم ٢) */}
            {(activeSection === 'elements' || activeSection === 'add-text') && (() => {
              const ADD_CATEGORIES = [
                { id: 'text', name: 'نص', icon: <Type size={18} /> },
                { id: 'image', name: 'صورة', icon: <ImageIcon size={18} /> },
                { id: 'button', name: 'زر', icon: <Square size={18} /> },
                { id: 'icons', name: 'أيقونات جاهزة 🌟', icon: <Sparkles size={18} /> },
                { id: 'iconify', name: 'أيقونات Iconify العالمية 🔍', icon: <Globe size={18} /> },
                { id: 'shape', name: 'اشكال هندسية وجرافيك', icon: <Shapes size={18} /> },
                { id: 'video', name: 'فيديو', icon: <Video size={18} /> },
                { id: 'map', name: 'خرائط جوجل', icon: <MapPin size={18} /> },
                { id: 'pricing', name: 'حاوية اسعار', icon: <Tag size={18} /> },
                { id: 'calendar', name: 'Kalender حجز مواعيد', icon: <Calendar size={18} /> },
                { id: 'sheet', name: 'جدول sheet', icon: <Grid3X3 size={18} /> },
                { id: 'html', name: 'Html container', icon: <Code size={18} /> },
                { id: 'gallery', name: 'معرض صور 🖼️', icon: <Images size={18} /> },
                { id: 'group-templates', name: 'بطاقات ومجموعات جاهزة 📁', icon: <FolderOpen size={18} /> },
              ];

              const SUBCATEGORIES_MAP: Record<string, { id: string; label: string }[]> = {
                gallery: [
                  { id: 'all', label: 'كافة التنسيقات' },
                  { id: 'top-main', label: 'شاشة علوية ومصغرات سفلية' },
                  { id: 'left-thumbnails', label: 'شبكة مصغرات يسار' },
                  { id: 'right-thumbnails', label: 'شبكة مصغرات يمين' },
                  { id: 'left-main-row', label: 'شاشة يسار ومصغرات صف' },
                ],
                'group-templates': [
                  { id: 'all', label: 'الكل' },
                  { id: 'empty', label: 'مجموعات فارغة' },
                  { id: 'team', label: 'فريق وأشخاص' },
                  { id: 'steps', label: 'خطوات' },
                  { id: 'features', label: 'ميزات' },
                  { id: 'stats', label: 'إحصائيات' },
                  { id: 'basic', label: 'صناديق بسيطة' },
                  { id: 'pricing', label: 'باقات' },
                  { id: 'forms', label: 'تواصل' },
                ],
                text: [
                  { id: 'heading', label: 'عنوان' },
                  { id: 'sub', label: 'نص فرعي' },
                  { id: 'main', label: 'نص رئيسي' },
                  { id: 'lead', label: 'نص تعريفي' },
                  { id: 'input', label: 'حقل ادخال' },
                  { id: 'compound', label: 'نصوص مركبة' },
                  { id: 'all', label: 'الكل' },
                ],
                image: [
                  { id: 'hero', label: 'صورة عريضة' },
                  { id: 'framed', label: 'إطار منحني' },
                  { id: 'avatar', label: 'أفاتار دائري' },
                  { id: 'gallery', label: 'معرض صور' },
                  { id: 'all', label: 'الكل' },
                ],
                button: [
                  { id: 'primary', label: 'رئيسي وعصري' },
                  { id: 'pill', label: 'كبسولة Capsule' },
                  { id: 'gradients', label: 'تدرج Gradient' },
                  { id: 'glass', label: 'زجاجي Glass' },
                  { id: 'outline', label: 'إطار Outline' },
                  { id: 'all', label: 'الكل' },
                ],
                shape: [
                  { id: 'boxes', label: 'أشكال وهياكل 🟥' },
                  { id: 'masks', label: 'ماسكات الصور 🖼️' },
                  { id: 'lines', label: 'خطوط وفواصل ⚡' },
                  { id: 'undraw', label: 'رسومات unDraw 🎨' },
                  { id: 'all', label: 'الكل' }
                ],
                icons: [
                  { id: 'social', label: 'وسائل تواصل 📲' },
                  { id: 'utility', label: 'أيقونات عامة ⚙️' },
                  { id: 'separators', label: 'فواصل وعلامات 🔗' },
                  { id: 'all', label: 'الكل' },
                ],
                video: [
                  { id: 'all', label: 'جميع مشغلات الفيديو 🎬' },
                ],

                map: [
                  { id: 'full', label: 'خريطة كاملة' },
                  { id: 'card', label: 'خريطة مع بطاقة' },
                  { id: 'mini', label: 'خريطة مصغرة' },
                  { id: 'all', label: 'الكل' },
                ],
                pricing: [
                  { id: 'single', label: 'باقة الأعمال' },
                  { id: 'starter', label: 'باقة الانطلاق' },
                  { id: 'table', label: 'جدول مقارنة' },
                  { id: 'all', label: 'الكل' },
                ],
                calendar: [
                  { id: 'month', label: 'تقويم شهري' },
                  { id: 'slots', label: 'حجز ساعات' },
                  { id: 'confirm', label: 'تأكيد موعد' },
                  { id: 'all', label: 'الكل' },
                ],
                sheet: [
                  { id: 'data', label: 'جدول بيانات' },
                  { id: 'pricing', label: 'جدول تكاليف' },
                  { id: 'tasks', label: 'جدول مهام' },
                  { id: 'all', label: 'الكل' },
                ],
                html: [
                  { id: 'custom', label: 'كود مخصص' },
                  { id: 'embed', label: 'إطار مدمج' },
                  { id: 'widget', label: 'عنصر واجهة' },
                  { id: 'all', label: 'الكل' },
                ],
              };

              interface TemplateItem {
                id: string;
                title: string;
                sub: string;
                subCategories: string[];
                type: ElementType;
                preview: React.ReactNode;
                action: () => void;
              }

              const TEMPLATES_MAP: Record<string, TemplateItem[]> = {
                'group-templates': [
                  {
                    id: 'grp-team-member',
                    title: 'بطاقة عضو فريق',
                    sub: 'صورة شخصية مع الاسم والمسمى الوظيفي ونبذة قصيرة',
                    subCategories: ['team'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex gap-1.5 border border-neutral-200">
                        <div className="w-8 h-full bg-neutral-200 rounded-lg shrink-0" />
                        <div className="flex-1 flex flex-col justify-center gap-1">
                          <div className="h-2 bg-neutral-400 rounded-md w-3/4" />
                          <div className="h-1.5 bg-blue-400 rounded-md w-1/2" />
                          <div className="h-1.5 bg-neutral-200 rounded-md w-full" />
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة عضو فريق',
                        width: 340,
                        height: 150,
                        styles: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', glowIntensity: 20, glowColor: 'rgba(0,0,0,0.12)', glowPosition: 'bottom' }
                      }, [
                        { type: 'image', name: 'صورة العضو', x: 16, y: 16, width: 112, height: 112, styles: { borderRadius: 14 } },
                        { type: 'heading', name: 'الاسم', content: 'اسم عضو الفريق', x: 146, y: 18, width: 178, height: 28, styles: { fontSize: 16, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' } },
                        { type: 'paragraph', name: 'المسمى الوظيفي', content: 'المسمى الوظيفي', x: 146, y: 50, width: 178, height: 22, styles: { fontSize: 12, fontWeight: '600', color: '#0071e3', textAlign: 'right' } },
                        { type: 'paragraph', name: 'نبذة مختصرة', content: 'سطر قصير يوضح خبرة هذا الشخص ودوره في الفريق.', x: 146, y: 76, width: 178, height: 56, styles: { fontSize: 11, color: '#4b5563', textAlign: 'right' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-process-step',
                    title: 'خطوة ضمن عملية',
                    sub: 'رقم متسلسل مع عنوان ونص وزر، لعرض خطوات عمل أو مراحل خدمة',
                    subCategories: ['steps'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-col justify-between">
                        <div className="text-blue-500 font-bold text-sm leading-none">01</div>
                        <div className="h-2 bg-neutral-400 rounded-md w-3/4" />
                        <div className="h-4 bg-blue-500 rounded-md w-1/3" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'خطوة ضمن عملية',
                        width: 300,
                        height: 210,
                        styles: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 }
                      }, [
                        { type: 'heading', name: 'رقم الخطوة', content: '01', x: 16, y: 10, width: 90, height: 50, styles: { fontSize: 36, fontWeight: 'bold', color: '#0071e3', textAlign: 'right' } },
                        { type: 'heading', name: 'عنوان الخطوة', content: 'اسم الخطوة', x: 16, y: 68, width: 268, height: 32, styles: { fontSize: 16, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' } },
                        { type: 'paragraph', name: 'شرح الخطوة', content: 'وصف مختصر وواضح لما يحدث في هذه الخطوة.', x: 16, y: 104, width: 268, height: 48, styles: { fontSize: 12, color: '#4b5563', textAlign: 'right' } },
                        { type: 'button', name: 'رابط الخطوة', content: 'اقرأ المزيد', x: 16, y: 160, width: 130, height: 38, styles: { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 10, fontWeight: 'bold', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-feature-photo',
                    title: 'بطاقة ميزة بصورة',
                    sub: 'صورة مع عنوان ووصف قصير، لعرض ميزة أو خدمة واحدة',
                    subCategories: ['features'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-col justify-between border border-neutral-200">
                        <div className="h-9 bg-neutral-200 rounded-lg" />
                        <div className="h-2 bg-neutral-400 rounded-md w-2/3 mx-auto" />
                        <div className="h-1.5 bg-neutral-200 rounded-md w-full" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة ميزة بصورة',
                        width: 300,
                        height: 260,
                        styles: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', glowIntensity: 20, glowColor: 'rgba(0,0,0,0.12)', glowPosition: 'bottom' }
                      }, [
                        { type: 'image', name: 'صورة الميزة', x: 16, y: 16, width: 268, height: 130, clipPath: 'clip-shape-brush-splatter' },
                        { type: 'heading', name: 'عنوان الميزة', content: 'اسم الميزة أو الخدمة', x: 16, y: 158, width: 268, height: 30, styles: { fontSize: 16, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'center' } },
                        { type: 'paragraph', name: 'وصف الميزة', content: 'شرح قصير يوضح فائدة هذه الميزة للعميل.', x: 16, y: 192, width: 268, height: 50, styles: { fontSize: 12, color: '#4b5563', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-stat-circle',
                    title: 'بطاقة إحصائية دائرية',
                    sub: 'رقم كبير داخل دائرة بسيطة مع توصيف قصير',
                    subCategories: ['stats'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex flex-col items-center justify-center">
                          <span className="text-blue-600 font-bold text-[10px]">+120</span>
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة إحصائية دائرية',
                        width: 220,
                        height: 220,
                        clipPath: 'clip-shape-geo-circle',
                        styles: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }
                      }, [
                        { type: 'heading', name: 'الرقم', content: '+120', x: 40, y: 62, width: 140, height: 50, styles: { fontSize: 34, fontWeight: 'bold', color: '#0071e3', textAlign: 'center' } },
                        { type: 'paragraph', name: 'توصيف الرقم', content: 'وصف قصير للرقم', x: 30, y: 118, width: 160, height: 46, styles: { fontSize: 12, color: '#475569', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-simple-box-button',
                    title: 'صندوق بسيط مع زر',
                    sub: 'عنوان ونص وزر واحد داخل صندوق بحدود رفيعة، للاستخدام العام',
                    subCategories: ['basic'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-col justify-between border border-neutral-300">
                        <div className="h-2.5 bg-neutral-400 rounded-md w-2/3" />
                        <div className="h-3 bg-neutral-200 rounded-md w-full" />
                        <div className="h-4 bg-blue-500 rounded-md w-1/3" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'صندوق بسيط مع زر',
                        width: 300,
                        height: 200,
                        styles: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' }
                      }, [
                        { type: 'heading', name: 'العنوان', content: 'عنوان مختصر وواضح', x: 18, y: 18, width: 264, height: 32, styles: { fontSize: 16, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' } },
                        { type: 'paragraph', name: 'الوصف', content: 'نص توضيحي قصير يشرح الفكرة أو الخدمة المعروضة هنا.', x: 18, y: 54, width: 264, height: 68, styles: { fontSize: 12, color: '#4b5563', textAlign: 'right' } },
                        { type: 'button', name: 'الزر', content: 'اعرف المزيد', x: 18, y: 132, width: 140, height: 42, styles: { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 10, fontWeight: 'bold', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-pricing-card',
                    title: 'بطاقة باقة أو تسعير',
                    sub: 'اسم الباقة والسعر ووصف قصير وزر اشتراك',
                    subCategories: ['pricing'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-col justify-between border border-neutral-200">
                        <div className="h-2 bg-neutral-400 rounded-md w-1/2" />
                        <div className="h-5 bg-blue-100 rounded-md w-2/3" />
                        <div className="h-4 bg-blue-500 rounded-md w-full" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة باقة أو تسعير',
                        width: 300,
                        height: 300,
                        styles: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', glowIntensity: 20, glowColor: 'rgba(0,0,0,0.12)', glowPosition: 'bottom' }
                      }, [
                        { type: 'heading', name: 'اسم الباقة', content: 'اسم الباقة', x: 18, y: 18, width: 264, height: 28, styles: { fontSize: 15, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' } },
                        { type: 'heading', name: 'السعر', content: 'السعر الشهري', x: 18, y: 52, width: 264, height: 44, styles: { fontSize: 30, fontWeight: 'bold', color: '#0071e3', textAlign: 'right' } },
                        { type: 'paragraph', name: 'وصف الباقة', content: 'أهم ما تتضمنه هذه الباقة بجملة واحدة.', x: 18, y: 104, width: 264, height: 50, styles: { fontSize: 12, color: '#4b5563', textAlign: 'right' } },
                        { type: 'button', name: 'زر الاشتراك', content: 'اختر هذه الباقة', x: 18, y: 220, width: 264, height: 44, styles: { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 12, fontWeight: 'bold', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-quick-contact',
                    title: 'بطاقة تواصل سريع',
                    sub: 'عنوان وحقل بريد وزر إرسال، لجمع طلبات التواصل',
                    subCategories: ['forms'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-full p-2 flex flex-col justify-center gap-1 border border-neutral-200">
                        <div className="h-2 bg-neutral-400 rounded-md w-1/2 mx-auto" />
                        <div className="h-4 bg-white border border-neutral-300 rounded-md" />
                        <div className="h-4 bg-blue-500 rounded-md" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة تواصل سريع',
                        width: 320,
                        height: 230,
                        clipPath: 'clip-shape-geo-capsule',
                        styles: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }
                      }, [
                        { type: 'heading', name: 'عنوان النموذج', content: 'تواصل معنا', x: 40, y: 26, width: 240, height: 30, styles: { fontSize: 16, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'center' } },
                        { type: 'input', name: 'حقل البريد', content: 'بريدك الإلكتروني', x: 40, y: 64, width: 240, height: 40, styles: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' } },
                        { type: 'button', name: 'زر الإرسال', content: 'إرسال', x: 40, y: 112, width: 240, height: 42, styles: { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 10, fontWeight: 'bold', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-feature-overlap-label',
                    title: 'بطاقة ميزة بصورة عائمة فوق تسمية',
                    sub: 'الصورة تطفو فوق شكل ملون، مع نص داخل التسمية ووصف أسفلها',
                    subCategories: ['features'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-900 rounded-xl p-1.5 flex flex-col items-center">
                        <div className="relative w-full h-10">
                          <div className="absolute inset-x-2 bottom-0 h-6 bg-amber-500 rounded-md" />
                          <div className="absolute inset-x-0 top-0 h-8 bg-neutral-300 rounded-md mx-1" />
                        </div>
                        <div className="h-1.5 bg-neutral-500 rounded-md w-2/3 mt-1.5" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة ميزة بصورة عائمة',
                        width: 260,
                        height: 270,
                        styles: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 }
                      }, [
                        { type: 'shape', name: 'شكل التسمية', x: 20, y: 120, width: 220, height: 80, styles: { backgroundColor: '#f5a623', borderRadius: 8 } },
                        { type: 'image', name: 'صورة الميزة', x: 10, y: 10, width: 240, height: 140, styles: { borderRadius: 10 } },
                        { type: 'paragraph', name: 'نص التسمية', content: 'نص قصير داخل الشكل', x: 40, y: 156, width: 180, height: 36, styles: { fontSize: 13, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
                        { type: 'paragraph', name: 'وصف الميزة', content: 'وصف مختصر يوضح الفكرة بجملة واحدة.', x: 10, y: 214, width: 240, height: 46, styles: { fontSize: 11, color: '#6b7280', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-team-pocket',
                    title: 'بطاقة عضو فريق بشكل جيب ملون',
                    sub: 'صورة دائرية تطفو فوق شكل ملون يحمل الاسم والمسمى الوظيفي',
                    subCategories: ['team'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex flex-col items-center justify-center gap-0.5 p-1">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-x-0 bottom-0 h-7 bg-orange-500 rounded-md" />
                          <div className="absolute inset-x-1.5 top-0 w-7 h-7 bg-neutral-300 rounded-full" />
                        </div>
                        <div className="h-1.5 bg-neutral-400 rounded-md w-1/2" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة عضو فريق بشكل جيب',
                        width: 180,
                        height: 215,
                        styles: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 }
                      }, [
                        { type: 'shape', name: 'الجيب الملون', x: 10, y: 60, width: 160, height: 140, styles: { backgroundColor: '#e8832f', borderRadius: 20 } },
                        { type: 'image', name: 'صورة العضو', x: 40, y: 10, width: 100, height: 100, clipPath: 'clip-shape-geo-circle' },
                        { type: 'heading', name: 'الاسم', content: 'اسم العضو', x: 20, y: 120, width: 140, height: 28, styles: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' } },
                        { type: 'paragraph', name: 'المسمى الوظيفي', content: 'المسمى الوظيفي', x: 20, y: 150, width: 140, height: 40, styles: { fontSize: 11, color: '#fff7ed', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'grp-team-accent-bar',
                    title: 'بطاقة عضو فريق بشريط ملون',
                    sub: 'صورة دائرية تطفو فوق شريط ملون رفيع، مع الاسم والوصف على خلفية بيضاء',
                    subCategories: ['team'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl flex flex-col items-center justify-center gap-0.5 p-1 border border-neutral-200">
                        <div className="relative w-10 h-9">
                          <div className="absolute inset-x-0 bottom-1 h-3 bg-amber-400 rounded-sm" />
                          <div className="absolute inset-x-1.5 top-0 w-7 h-7 bg-neutral-300 rounded-full" />
                        </div>
                        <div className="h-1.5 bg-neutral-500 rounded-md w-1/2" />
                        <div className="h-1 bg-neutral-200 rounded-md w-2/3" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'بطاقة عضو فريق بشريط ملون',
                        width: 180,
                        height: 225,
                        styles: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 }
                      }, [
                        { type: 'shape', name: 'الشريط الملون', x: 10, y: 85, width: 160, height: 55, styles: { backgroundColor: '#f5c518', borderRadius: 4 } },
                        { type: 'image', name: 'صورة العضو', x: 50, y: 15, width: 80, height: 80, clipPath: 'clip-shape-geo-circle' },
                        { type: 'heading', name: 'الاسم', content: 'اسم العضو', x: 10, y: 150, width: 160, height: 26, styles: { fontSize: 14, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'center' } },
                        { type: 'paragraph', name: 'الوصف', content: 'وصف قصير أو دور العضو هنا.', x: 10, y: 178, width: 160, height: 40, styles: { fontSize: 11, color: '#4b5563', textAlign: 'center' } }
                      ]);
                    }
                  }
                ],
                text: [
                  {
                    id: 'bold-heading',
                    title: 'عنوان رئيسي عريض',
                    sub: 'ترويسة رئيسية بخط عريض وواضح',
                    subCategories: ['heading', 'main'],
                    type: 'heading',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-2 flex items-center justify-center border border-neutral-200/80 text-right">
                        <span className="font-extrabold text-neutral-800 text-xs leading-snug text-center">
                          بناء مواقع المستقبل بهوية عربية فاخرة
                        </span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('heading', 'بناء مواقع المستقبل بهوية عربية فاخرة', { fontSize: 32, fontWeight: 'bold', color: '#1d1d1f' }, { name: 'عنوان رئيسي عريض', width: 500, height: 80 });
                    }
                  },
                  {
                    id: 'body-sub',
                    title: 'نص فرعي وشرح',
                    sub: 'فقرة للمعلومات والتفاصيل التكميلية',
                    subCategories: ['sub'],
                    type: 'paragraph',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-2 flex flex-col justify-center gap-1.5 border border-neutral-200/80 text-right">
                        <span className="text-[10px] text-neutral-500 leading-snug">
                          تصميم متوافق مع كافة أحجام الشاشات وتجربة مستخدم مدروسة بعناية فائقة.
                        </span>
                      </div>
                    ),
                    action: () => {
                      onAddElement(
                        'paragraph',
                        'تصميم متوافق بالكامل مع كافة أحجام الشاشات وتجربة مستخدم مدروسة بعناية فائقة لضمان سرعة الوصول.',
                        { fontSize: 13, color: '#6b7280' },
                        { name: 'نص فرعي وشرح', width: 420, height: 60 }
                      );
                    }
                  },
                  {
                    id: 'lead-text',
                    title: 'نص تعريفي جذاب',
                    sub: 'مقدمة مميزة للخدمات والمنتجات',
                    subCategories: ['lead', 'main'],
                    type: 'paragraph',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-2 flex flex-col justify-center gap-1.5 border border-neutral-200/80 text-right">
                        <div className="w-full h-2 bg-neutral-300 rounded" />
                        <div className="w-4/5 h-2 bg-neutral-300 rounded" />
                        <div className="w-3/5 h-2 bg-neutral-200 rounded" />
                      </div>
                    ),
                    action: () => {
                      onAddElement(
                        'paragraph',
                        'منصة Weelink توفر لك مساحة عمل حرة متكاملة لبناء صفحات ويب سريعة وجذابة بكل مرونة واحترافية وبأعلى المعايير.',
                        { fontSize: 16, color: '#4b5563', lineHeight: 1.6 },
                        { name: 'نص تعريفي جذاب', width: 480, height: 90 }
                      );
                    }
                  },
                  {
                    id: 'doctor-page',
                    title: 'صفحة الدكتور',
                    sub: 'بطاقة عيادة ومعلومات الطبيب',
                    subCategories: ['compound'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-linear-to-br from-blue-50 to-indigo-50/50 rounded-xl p-2 flex flex-col justify-between border border-blue-100/80 text-right">
                        <div className="flex items-center justify-between">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                            <Stethoscope size={10} />
                          </div>
                          <span className="text-[10px] font-bold text-blue-900">د. أحمد السعيد</span>
                        </div>
                        <p className="text-[9px] text-blue-700/80 truncate">استشاري جراحة وباطنية - عيادات وي لينك</p>
                        <div className="flex justify-end">
                          <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">احجز استشارة</span>
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'صفحة الدكتور',
                        width: 320,
                        height: 220,
                        styles: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#0071e320', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }
                      }, [
                        { type: 'shape', name: 'شارة دائرية', x: 20, y: 20, width: 40, height: 40, clipPath: 'clip-shape-geo-circle', styles: { backgroundColor: '#0071e3' } },
                        { type: 'heading', name: 'اسم الطبيب', content: 'اسم الطبيب أو الأخصائي', x: 72, y: 24, width: 228, height: 32, styles: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', textAlign: 'right' } },
                        { type: 'paragraph', name: 'التخصص', content: 'التخصص الطبي والمؤهلات', x: 20, y: 74, width: 280, height: 26, styles: { fontSize: 12, fontWeight: '600', color: '#1d4ed8', textAlign: 'right' } },
                        { type: 'paragraph', name: 'الوصف', content: 'نبذة قصيرة عن الخدمة الطبية المقدمة وأهم ما يميزها.', x: 20, y: 104, width: 280, height: 46, styles: { fontSize: 12, color: '#4b5563', textAlign: 'right' } },
                        { type: 'button', name: 'زر الحجز', content: 'احجز موعدك الآن', x: 20, y: 160, width: 280, height: 42, styles: { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 12, fontWeight: 'bold', textAlign: 'center' } }
                      ]);
                    }
                  },
                  {
                    id: 'testimonial-quote',
                    title: 'اقتباس وشهادة عميل',
                    sub: 'عرض آراء العملاء وتجاربهم',
                    subCategories: ['compound'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-amber-50/50 rounded-xl p-2 flex flex-col justify-between border border-amber-200/60 text-right">
                        <span className="text-amber-500 text-xs font-serif">❝</span>
                        <p className="text-[9px] text-neutral-700 italic truncate">«تجربة لا مثيل لها، أنجزنا الموقع في دقائق»</p>
                        <span className="text-[8px] text-amber-700 font-bold">محمد الحربي</span>
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'اقتباس وشهادة عميل',
                        width: 320,
                        height: 150,
                        styles: { backgroundColor: '#fffbeb', borderRadius: 20, borderWidth: 1, borderColor: '#f59e0b30' }
                      }, [
                        { type: 'paragraph', name: 'نص الاقتباس', content: 'نص اقتباس أو رأي عميل حقيقي يوضح تجربته مع الخدمة.', x: 20, y: 20, width: 280, height: 66, styles: { fontSize: 13, color: '#78350f', fontStyle: 'italic', textAlign: 'right' } },
                        { type: 'heading', name: 'اسم العميل', content: 'اسم العميل', x: 20, y: 96, width: 280, height: 30, styles: { fontSize: 13, fontWeight: 'bold', color: '#92400e', textAlign: 'right' } }
                      ]);
                    }
                  },
                  {
                    id: 'input-field',
                    title: 'حقل ادخال',
                    sub: 'استقبال البريد أو رقم الهاتف',
                    subCategories: ['input'],
                    type: 'input',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-2 flex items-center border border-neutral-200/80">
                        <div className="w-full bg-white border border-neutral-300 rounded-lg px-2 py-1 text-[10px] text-neutral-400 flex items-center justify-between">
                          <span>أدخل بريدك...</span>
                          <span className="text-[#0071e3] font-bold">إرسال</span>
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('input', 'أدخل بريدك الإلكتروني ليصلك كل جديد...', { borderRadius: 14 }, { name: 'حقل ادخال بريد', width: 320, height: 48 });
                    }
                  },
                ],
                image: [
                  {
                    id: 'hero-banner',
                    title: 'صورة واجهة رئيسية',
                    sub: 'بانر عريض لترويسة الصفحة',
                    subCategories: ['hero'],
                    type: 'image',
                    preview: (
                      <div className="w-full h-18 bg-neutral-900 rounded-xl flex items-center justify-center text-white overflow-hidden relative">
                        <span className="text-lg">🌄</span>
                        <span className="absolute bottom-1 right-2 text-[9px] text-white/80 font-mono">Hero Banner</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'بانر ترويسة رئيسي', { borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'صورة واجهة رئيسية', width: 560, height: 260, imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop' });
                    }
                  },
                  {
                    id: 'framed-card',
                    title: 'صورة بإطار فاخر',
                    sub: 'إطار منحني مع ظلال ناعمة',
                    subCategories: ['framed'],
                    type: 'image',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl p-1 flex items-center justify-center border border-neutral-200">
                        <div className="w-full h-full bg-linear-to-tr from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs">
                          🖼️
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'إطار صورة عصري', { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'صورة بإطار فاخر', width: 380, height: 240, imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop' });
                    }
                  },
                  {
                    id: 'avatar-img',
                    title: 'أفاتار دائري',
                    sub: 'صورة شخصية دائرية للملف',
                    subCategories: ['avatar'],
                    type: 'image',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <div className="w-11 h-11 rounded-full bg-[#0071e3] text-white flex items-center justify-center font-bold text-xs shadow-md">
                          👤
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'صورة الملف الشخصي', { borderRadius: 9999, borderWidth: 3, borderColor: '#0071e3', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'أفاتار شخصي', width: 140, height: 140, imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop' });
                    }
                  },
                  {
                    id: 'gallery-preview',
                    title: 'معرض صور مصغر',
                    sub: 'شبكة 3 صور متناسقة',
                    subCategories: ['gallery'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-1 grid grid-cols-3 gap-1 border border-neutral-200">
                        <div className="bg-sky-200 rounded" />
                        <div className="bg-indigo-200 rounded" />
                        <div className="bg-purple-200 rounded" />
                      </div>
                    ),
                    action: () => {
                      onAddGroup?.({
                        name: 'معرض صور',
                        width: 440,
                        height: 220,
                        styles: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' }
                      }, [
                        { type: 'image', name: 'صورة المعرض 1', x: 16, y: 16, width: 125, height: 188, styles: { borderRadius: 12 } },
                        { type: 'image', name: 'صورة المعرض 2', x: 157, y: 16, width: 125, height: 188, styles: { borderRadius: 12 } },
                        { type: 'image', name: 'صورة المعرض 3', x: 298, y: 16, width: 126, height: 188, styles: { borderRadius: 12 } }
                      ]);
                    }
                  },
                ],
                button: [
                  // --- 10 PRIMARY BUTTONS ---
                  {
                    id: 'btn-p-1',
                    title: 'زر آبل الأزرق',
                    sub: 'أزرق كلاسيكي متفاعل مع الظلال',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#0071e3] text-white rounded-lg text-[11px] font-bold shadow-xs">آبل أزرق ✦</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'ابدأ تجربتك الآن ✦', { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر آبل الأزرق', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-2',
                    title: 'زر أسود نيتشر',
                    sub: 'أسود معتم أنيق ذو حافة ناعمة',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#1d1d1f] text-white rounded-lg text-[11px] font-bold">أسود داكن ↗</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'اكتشف الميزات ↗', { backgroundColor: '#1d1d1f', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر أسود نيتشر', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-3',
                    title: 'زر أخضر زمردي',
                    sub: 'أخضر غني هادئ للتأكيدات والمبيعات',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#10b981] text-white rounded-lg text-[11px] font-bold">أخضر زمردي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'اشترك الآن 🟢', { backgroundColor: '#10b981', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر أخضر زمردي', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-4',
                    title: 'زر بنفسجي ديسكورد',
                    sub: 'بنفسجي حيوي لافت للمجتمعات',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#5865F2] text-white rounded-lg text-[11px] font-bold">بنفسجي تفاعلي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'انضم إلينا 👾', { backgroundColor: '#5865F2', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر بنفسجي ديسكورد', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-5',
                    title: 'زر كرزي قرمزي',
                    sub: 'أحمر فاخر وجذاب للعروض الساخنة',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#dc2626] text-white rounded-lg text-[11px] font-bold">أحمر قرمزي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'احجز مقعدك 🔥', { backgroundColor: '#dc2626', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر كرزي قرمزي', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-6',
                    title: 'زر شمسي دافئ',
                    sub: 'برتقالي مشع يبعث على الطاقة والسرعة',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#f97316] text-white rounded-lg text-[11px] font-bold">برتقالي دافئ</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'سجل الآن مجاناً', { backgroundColor: '#f97316', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر شمسي دافئ', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-7',
                    title: 'زر تيل هادئ',
                    sub: 'أخضر فيروزي مريح للعين',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#14b8a6] text-white rounded-lg text-[11px] font-bold">تيل مريح</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تصفح الخدمات 🗺️', { backgroundColor: '#14b8a6', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر تيل هادئ', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-8',
                    title: 'زر وردي فوشيا',
                    sub: 'وردي عصري للموضة والجمال',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#db2777] text-white rounded-lg text-[11px] font-bold">وردي فوشيا</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تسوقي الجديد ✨', { backgroundColor: '#db2777', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر وردي فوشيا', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-9',
                    title: 'زر أزرق نيلي',
                    sub: 'أزرق ملكي كلاسيكي للمؤسسات',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#4338ca] text-white rounded-lg text-[11px] font-bold">أزرق نيلي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تحميل الكتيب 📥', { backgroundColor: '#4338ca', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر أزرق نيلي', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-p-10',
                    title: 'زر بحري نيون',
                    sub: 'سيان مشع ومستقبل متطور',
                    subCategories: ['primary'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#06b6d4] text-white rounded-lg text-[11px] font-bold">سيان نيون</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'انطلق للمستقبل', { backgroundColor: '#06b6d4', color: '#ffffff', borderRadius: 12, fontWeight: 'bold' }, { name: 'زر بحري نيون', width: 170, height: 46 });
                    }
                  },

                  // --- 10 PILL BUTTONS (CAPSULE) ---
                  {
                    id: 'btn-c-1',
                    title: 'كبسولة كحلي داكن',
                    sub: 'تصميم عريض مستدير بالكامل كحلي',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#1e3a8a] text-white rounded-full text-[11px] font-bold">كبسولة كحلي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تواصل معنا الآن 📞', { backgroundColor: '#1e3a8a', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'كبسولة كحلي داكن', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-2',
                    title: 'كبسولة ذهبية ملكية',
                    sub: 'ذهبي كلاسيكي مستدير بلمعان خفيف',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#d97706] text-white rounded-full text-[11px] font-bold">كبسولة ذهبي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'العضوية الذهبية 👑', { backgroundColor: '#d97706', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'كبسولة ذهبية ملكية', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-3',
                    title: 'كبسولة فحمي معدني',
                    sub: 'رمادي فحمي ذو وقار وفخامة',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#374151] text-white rounded-full text-[11px] font-bold">كبسولة فحمي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'عرض التفاصيل 🔎', { backgroundColor: '#374151', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة فحمي معدني', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-4',
                    title: 'كبسولة ليموني مشع',
                    sub: 'لون جريء يشد الانتباه للمتاجر',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#84cc16] text-white rounded-full text-[11px] font-bold text-neutral-900">كبسولة ليموني</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'خصم مذهل اليوم! ⚡', { backgroundColor: '#84cc16', color: '#111827', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة ليموني مشع', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-5',
                    title: 'كبسولة عنبري غامق',
                    sub: 'برتقالي عنبري دافئ وناعم',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#b45309] text-white rounded-full text-[11px] font-bold">كبسولة عنبري</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'انضم للمجموعة 👥', { backgroundColor: '#b45309', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة عنبري غامق', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-6',
                    title: 'كبسولة سماوي منعش',
                    sub: 'لون السماء الصافية مريح وبارد',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#0ea5e9] text-white rounded-full text-[11px] font-bold">كبسولة سماوي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'ابدأ مجاناً ☁️', { backgroundColor: '#0ea5e9', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة سماوي منعش', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-7',
                    title: 'كبسولة رصاصية هادئة',
                    sub: 'رمادي محايد فائق الأناقة',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#64748b] text-white rounded-full text-[11px] font-bold">كبسولة رصاصي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'اقرأ الدليل 📑', { backgroundColor: '#64748b', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة رصاصية هادئة', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-8',
                    title: 'كبسولة برونزية عتيقة',
                    sub: 'بني عسلي عتيق يمنح رونق الفخامة',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#a21caf] text-white rounded-full text-[11px] font-bold">كبسولة أرجوانية</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'طلب حجز خاص 💎', { backgroundColor: '#a21caf', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة أرجوانية', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-9',
                    title: 'كبسولة حمراء ناصعة',
                    sub: 'أحمر ملفت للغاية لعروض عاجلة',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#e11d48] text-white rounded-full text-[11px] font-bold">كبسولة أحمر</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'شاهد البث الآن 🎥', { backgroundColor: '#e11d48', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة حمراء ناصعة', width: 180, height: 44 });
                    }
                  },
                  {
                    id: 'btn-c-10',
                    title: 'كبسولة الخردل الملكي',
                    sub: 'أصفر خردلي مميز يطبع الذاكرة',
                    subCategories: ['pill'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-[#ca8a04] text-white rounded-full text-[11px] font-bold">كبسولة خردلي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'شراء باقة كبار السن', { backgroundColor: '#ca8a04', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold' }, { name: 'كبسولة خردلي', width: 180, height: 44 });
                    }
                  },

                  // --- 10 GRADIENT BUTTONS ---
                  {
                    id: 'btn-g-1',
                    title: 'تدرج الغروب Sunset',
                    sub: 'تدرج فخم من البرتقالي للوردي',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-[11px] font-bold">تدرج الغروب</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'ابدأ رحلتك الممتعة 🌅', { backgroundGradient: 'linear-gradient(90deg, #f97316 0%, #ec4899 100%)', color: '#ffffff', borderRadius: 14, fontWeight: 'bold', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'تدرج الغروب', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-2',
                    title: 'تدرج المحيط Ocean',
                    sub: 'أزرق ملكي عميق إلى سماوي منير',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-400 text-white rounded-xl text-[11px] font-bold">تدرج المحيط</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تسجيل الدخول الآمن 🔑', { backgroundGradient: 'linear-gradient(90deg, #2563eb 0%, #22d3ee 100%)', color: '#ffffff', borderRadius: 14, fontWeight: 'bold', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'تدرج المحيط', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-3',
                    title: 'تدرج الشفق Aurora',
                    sub: 'تدرج كوني خلاب من الأخضر للأزرق',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl text-[11px] font-bold">تدرج الشفق</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'استكشف التقارير 📊', { backgroundGradient: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)', color: '#ffffff', borderRadius: 14, fontWeight: 'bold' }, { name: 'تدرج الشفق', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-4',
                    title: 'تدرج السديم Nebula',
                    sub: 'بنفسجي باهر مع فوشيا لإطلالة تقنية',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-[11px] font-bold">تدرج السديم</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'عالم المبدعين 🎨', { backgroundGradient: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)', color: '#ffffff', borderRadius: 14, fontWeight: 'bold', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'تدرج السديم', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-5',
                    title: 'تدرج النار Burning Fire',
                    sub: 'لهب مستعر أحمر مع برتقالي صارخ',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-amber-500 text-white rounded-xl text-[11px] font-bold">تدرج النار</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'عروض التصفية الأخيرة 🚨', { backgroundGradient: 'linear-gradient(90deg, #dc2626 0%, #f59e0b 100%)', color: '#ffffff', borderRadius: 14, fontWeight: 'bold' }, { name: 'تدرج النار', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-6',
                    title: 'تدرج الغابات Forest',
                    sub: 'أخضر داكن إلى ليموني متألق',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-800 to-lime-400 text-white rounded-xl text-[11px] font-bold">تدرج الغابة</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'الطبيعة والجمال 🍃', { backgroundGradient: 'linear-gradient(90deg, #064e3b 0%, #a3e635 100%)', color: '#ffffff', borderRadius: 14, fontWeight: 'bold' }, { name: 'تدرج الغابة', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-7',
                    title: 'تدرج الملك المذهب',
                    sub: 'ذهبي ملوكي فاخر ممتد',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-300 text-white rounded-xl text-[11px] font-bold">تدرج ذهبي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'الاشتراك الملكي 💎', { backgroundGradient: 'linear-gradient(90deg, #ca8a04 0%, #fde047 100%)', color: '#78350f', borderRadius: 14, fontWeight: 'bold', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'تدرج ذهبي ملكي', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-8',
                    title: 'تدرج كوتن كاندي',
                    sub: 'ألوان باستيل ناعمة غزل بنات',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-pink-300 to-blue-300 text-neutral-800 rounded-xl text-[11px] font-bold">غزل البنات</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'منتجات الأطفال والترفيه 🎈', { backgroundGradient: 'linear-gradient(90deg, #fbcfe8 0%, #bfdbfe 100%)', color: '#1f2937', borderRadius: 14, fontWeight: 'bold' }, { name: 'تدرج كوتن كاندي', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-9',
                    title: 'تدرج المينت والثلج',
                    sub: 'نعناع منعش مع ثلج ناصع',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-teal-400 to-emerald-200 text-teal-950 rounded-xl text-[11px] font-bold">تدرج النعناع</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'شرب الماء والصحة 💧', { backgroundGradient: 'linear-gradient(90deg, #2dd4bf 0%, #a7f3d0 100%)', color: '#115e59', borderRadius: 14, fontWeight: 'bold' }, { name: 'تدرج المينت', width: 180, height: 46 });
                    }
                  },
                  {
                    id: 'btn-g-10',
                    title: 'تدرج نيون سايبر',
                    sub: 'تداخل رقمي صارخ وفائق الحداثة',
                    subCategories: ['gradients'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl text-[11px] font-bold">نيون سايبر</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'دخول عالم الميتافيرس 🤖', { backgroundGradient: 'linear-gradient(90deg, #06b6d4 0%, #d946ef 100%)', color: '#ffffff', borderRadius: 14, fontWeight: 'bold', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'تدرج نيون سايبر', width: 180, height: 46 });
                    }
                  },

                  // --- 10 GLASSMORPHISM BUTTONS ---
                  {
                    id: 'btn-gl-1',
                    title: 'زجاجي أبيض ناصع',
                    sub: 'شبه شفاف بلوري أبيض',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-blue-600 rounded-xl flex items-center justify-center border border-blue-500">
                        <span className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-[11px] font-bold border border-white/40">زجاجي أبيض</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تفاصيل إضافية ▫️', { backgroundColor: 'rgba(255, 255, 255, 0.22)', color: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.45)', fontWeight: 'bold' }, { name: 'زجاجي أبيض', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-2',
                    title: 'زجاجي أزرق بحري',
                    sub: 'شفاف أزرق يعزز الهدوء والعمق',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-indigo-900 rounded-xl flex items-center justify-center border border-indigo-800">
                        <span className="px-4 py-1.5 bg-blue-500/30 text-blue-200 rounded-xl text-[11px] font-bold border border-blue-400/40">زجاجي أزرق</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'البحث السريع 🔍', { backgroundColor: 'rgba(59, 130, 246, 0.28)', color: '#93c5fd', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.45)', fontWeight: 'bold' }, { name: 'زجاجي أزرق', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-3',
                    title: 'زجاجي داكن غامض',
                    sub: 'أسود شبحي مناسب للصور الساطعة',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-300 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-black/40 text-black rounded-xl text-[11px] font-bold border border-black/30">زجاجي أسود</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'إغلاق النافذة ✕', { backgroundColor: 'rgba(0, 0, 0, 0.45)', color: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', fontWeight: 'bold' }, { name: 'زجاجي داكن', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-4',
                    title: 'زجاجي زمردي فخم',
                    sub: 'تأثير زجاجي أخضر ساحر',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-emerald-900 rounded-xl flex items-center justify-center border border-emerald-800">
                        <span className="px-4 py-1.5 bg-emerald-500/30 text-emerald-300 rounded-xl text-[11px] font-bold border border-emerald-400/40">زجاجي زمردي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'الموافقة والإرسال ✔️', { backgroundColor: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.4)', fontWeight: 'bold' }, { name: 'زجاجي زمردي', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-5',
                    title: 'زجاجي بنفسجي حالم',
                    sub: 'بنفسجي مضيء خيالي شفاف',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-purple-950 rounded-xl flex items-center justify-center border border-purple-900">
                        <span className="px-4 py-1.5 bg-purple-500/30 text-purple-200 rounded-xl text-[11px] font-bold border border-purple-400/40">زجاجي بنفسجي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'العالم الرقمي 👾', { backgroundColor: 'rgba(139, 92, 246, 0.26)', color: '#d8b4fe', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.4)', fontWeight: 'bold' }, { name: 'زجاجي بنفسجي', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-6',
                    title: 'زجاجي وردي شاحب',
                    sub: 'وردي لطيف مهدئ مخصص للجمال',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-pink-900 rounded-xl flex items-center justify-center border border-pink-800">
                        <span className="px-4 py-1.5 bg-pink-500/30 text-pink-200 rounded-xl text-[11px] font-bold border border-pink-400/40">زجاجي وردي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'احجز جلسة 🌸', { backgroundColor: 'rgba(236, 72, 153, 0.24)', color: '#fbcfe8', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(244, 114, 182, 0.4)', fontWeight: 'bold' }, { name: 'زجاجي وردي', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-7',
                    title: 'زجاجي أصفر كهرماني',
                    sub: 'توهج كهرماني دافئ ملائم للأنوار الخفيفة',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-amber-950 rounded-xl flex items-center justify-center border border-amber-900">
                        <span className="px-4 py-1.5 bg-amber-500/30 text-amber-200 rounded-xl text-[11px] font-bold border border-amber-400/40">زجاجي كهرماني</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'قائمة التخفيضات 🏷️', { backgroundColor: 'rgba(245, 158, 11, 0.25)', color: '#fde047', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.4)', fontWeight: 'bold' }, { name: 'زجاجي كهرماني', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-8',
                    title: 'زجاجي سيان ثلجي',
                    sub: 'سيان متجمد مناسب لتصاميم الشتاء والبرود',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-cyan-900 rounded-xl flex items-center justify-center border border-cyan-800">
                        <span className="px-4 py-1.5 bg-cyan-500/30 text-cyan-200 rounded-xl text-[11px] font-bold border border-cyan-400/40">زجاجي سيان</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'الباقة الاقتصادية ❄️', { backgroundColor: 'rgba(6, 182, 212, 0.24)', color: '#cffafe', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(34, 211, 238, 0.4)', fontWeight: 'bold' }, { name: 'زجاجي سيان', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-9',
                    title: 'زجاجي برتقالي ناعم',
                    sub: 'توهج برتقالي شفاف متزن وجذاب',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-orange-950 rounded-xl flex items-center justify-center border border-orange-900">
                        <span className="px-4 py-1.5 bg-orange-500/30 text-orange-200 rounded-xl text-[11px] font-bold border border-orange-400/40">زجاجي برتقالي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'شراء العملات 🪙', { backgroundColor: 'rgba(249, 115, 22, 0.25)', color: '#fed7aa', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.4)', fontWeight: 'bold' }, { name: 'زجاجي برتقالي', width: 170, height: 46 });
                    }
                  },
                  {
                    id: 'btn-gl-10',
                    title: 'زجاجي فيروزي دافئ',
                    sub: 'فيروزي مائي بلوري ناعم',
                    subCategories: ['glass'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-teal-900 rounded-xl flex items-center justify-center border border-teal-800">
                        <span className="px-4 py-1.5 bg-teal-500/30 text-teal-200 rounded-xl text-[11px] font-bold border border-teal-400/40">زجاجي فيروزي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'اترك رسالة 💬', { backgroundColor: 'rgba(20, 184, 166, 0.24)', color: '#ccfbf1', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(45, 212, 191, 0.4)', fontWeight: 'bold' }, { name: 'زجاجي فيروزي', width: 170, height: 46 });
                    }
                  },

                  // --- 10 OUTLINE BUTTONS ---
                  {
                    id: 'btn-o-1',
                    title: 'إطار أزرق دقيق',
                    sub: 'إطار ناعم بلون البحر مع خلفية شفافة',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-[#0071e3] text-[#0071e3] rounded-xl text-[11px] font-bold">إطار أزرق</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'العودة للخلف', { backgroundColor: 'transparent', color: '#0071e3', borderWidth: 1, borderColor: '#0071e3', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار أزرق دقيق', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-2',
                    title: 'إطار أسود كلاسيكي',
                    sub: 'إطار محايد بسيط لكل الاستخدامات',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-black text-black rounded-xl text-[11px] font-bold">إطار أسود</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'رؤية المزيد ➕', { backgroundColor: 'transparent', color: '#1d1d1f', borderWidth: 1, borderColor: '#1d1d1f', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار أسود كلاسيكي', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-3',
                    title: 'إطار أحمر تحذيري',
                    sub: 'أحمر منبه مناسب للإلغاء والرفض',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-red-500 text-red-500 rounded-xl text-[11px] font-bold">إطار أحمر</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'إلغاء الاشتراك ✕', { backgroundColor: 'transparent', color: '#ef4444', borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار أحمر تحذيري', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-4',
                    title: 'إطار أخضر للنجاح',
                    sub: 'أخضر يمنح الشعور بالأمان والموافقة',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-emerald-500 text-emerald-500 rounded-xl text-[11px] font-bold">إطار أخضر</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تأكيد الحجز ✔️', { backgroundColor: 'transparent', color: '#10b981', borderWidth: 1, borderColor: '#10b981', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار أخضر نجاح', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-5',
                    title: 'إطار بنفسجي ملكي',
                    sub: 'تصميم بنفسجي لافت وبسيط في آن واحد',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-purple-500 text-purple-500 rounded-xl text-[11px] font-bold">إطار بنفسجي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'مشاهدة المعرض 🌌', { backgroundColor: 'transparent', color: '#a855f7', borderWidth: 1, borderColor: '#a855f7', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار بنفسجي ملكي', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-6',
                    title: 'إطار ذهبي فاخر',
                    sub: 'إطار أصفر ذهبي جذاب ومشرق',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-amber-500 text-amber-500 rounded-xl text-[11px] font-bold">إطار ذهبي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'طلب السعر المخصص 🏷️', { backgroundColor: 'transparent', color: '#d97706', borderWidth: 1, borderColor: '#d97706', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار ذهبي فاخر', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-7',
                    title: 'إطار وردي أنيق',
                    sub: 'إطار رقيق ملائم لقوائم الهدايا والمكياج',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-pink-500 text-pink-500 rounded-xl text-[11px] font-bold">إطار وردي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'صندوق الهدايا 🎁', { backgroundColor: 'transparent', color: '#ec4899', borderWidth: 1, borderColor: '#ec4899', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار وردي أنيق', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-8',
                    title: 'إطار فيروزي دافئ',
                    sub: 'إطار فيروزي عميق وجذاب للعين',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-teal-500 text-teal-500 rounded-xl text-[11px] font-bold">إطار فيروزي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'اقرأ التقييمات ⭐', { backgroundColor: 'transparent', color: '#0d9488', borderWidth: 1, borderColor: '#0d9488', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار فيروزي دافئ', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-9',
                    title: 'إطار لافندر ساحر',
                    sub: 'لون بنفسجي لافندر غاية في الأنوثة والنعومة',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-indigo-400 text-indigo-400 rounded-xl text-[11px] font-bold">لافندر</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تصفح الكتالوج الجديد 📖', { backgroundColor: 'transparent', color: '#818cf8', borderWidth: 1, borderColor: '#818cf8', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار لافندر ساحر', width: 160, height: 44 });
                    }
                  },
                  {
                    id: 'btn-o-10',
                    title: 'إطار رمادي رصين',
                    sub: 'إطار حيادي غامق جداً وبسيط',
                    subCategories: ['outline'],
                    type: 'button',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-4 py-1.5 bg-transparent border border-neutral-400 text-neutral-500 rounded-xl text-[11px] font-bold">إطار رمادي</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('button', 'تراجع وإلغاء ✕', { backgroundColor: 'transparent', color: '#737373', borderWidth: 1, borderColor: '#a3a3a3', borderRadius: 12, fontWeight: 'bold' }, { name: 'إطار رمادي رصين', width: 160, height: 44 });
                    }
                  },
                ],
                shape: [
                                    // ==========================================
                  // 1. THREE SQUARES (٣ مربعات)
                  // ==========================================
                  {
                    id: 'box-square-white',
                    title: 'بطاقة مربعة ناصعة 🔲',
                    sub: 'مربعة متساوية الأضلاع بظل ناعم وحواف منحنية',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-white border border-neutral-300 rounded-xl shadow-xs" />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بطاقة مربعة ناصعة', width: 180, height: 180 });
                    }
                  },
                  {
                    id: 'box-square-dark',
                    title: 'بطاقة مربعة كحلي فاخرة ⬛',
                    sub: 'مربعة كلاسيكية داكنة للهويات الفاخرة والعصرية',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-[#0f172a] rounded-xl shadow-xs" />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#0f172a', borderRadius: 18, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بطاقة مربعة كحلي', width: 180, height: 180 });
                    }
                  },
                  {
                    id: 'box-square-glass',
                    title: 'بطاقة مربعة زجاجية 🪟',
                    sub: 'مربعة بتأثير زجاجي شفاف فاخر Frosted Glass',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-200 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-white/70 backdrop-blur-md border border-white/90 rounded-xl shadow-xs flex items-center justify-center text-[10px] text-neutral-600 font-bold">زجاجي</div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بطاقة مربعة زجاجية', width: 180, height: 180 });
                    }
                  },

                  // ==========================================
                  // 2. THREE CIRCLES (٣ دوائر)
                  // ==========================================
                  {
                    id: 'box-circle-white',
                    title: 'بطاقة دائرية بيضاء ⚪',
                    sub: 'حاوية دائرية ناصعة بقطر متساوٍ وظل راقٍ',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-white border border-neutral-300 rounded-full shadow-xs" />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#ffffff', borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بطاقة دائرية بيضاء', width: 180, height: 180 });
                    }
                  },
                  {
                    id: 'box-circle-gradient',
                    title: 'بطاقة دائرية متدرجة 🟣',
                    sub: 'حاوية دائرية فخمة بتدرج لوني كخلفية تفاعلية',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#4f46e5] to-[#7c3aed] rounded-full shadow-xs" />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 9999, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بطاقة دائرية متدرجة', width: 180, height: 180 });
                    }
                  },
                  {
                    id: 'box-oval-yellow',
                    title: 'صندوق بيضاوي ناعم 🟡',
                    sub: 'شكل بيضاوي متوازن وعصري للصور والشعارات',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-14 h-10 bg-[#facc15] shadow-xs" style={{ borderRadius: '50% / 60%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#facc15', borderRadius: '50% / 60%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'صندوق بيضاوي ناعم', width: 170, height: 200 });
                    }
                  },

                  // ==========================================
                  // 3. BLOBS (أشكال بقع مختلفة)
                  // ==========================================
                  {
                    id: 'sh-blob-splash',
                    title: 'بقعة مائية ديناميكية 🌊',
                    sub: 'بقعة ماء حيوية ومنسابة بشكل عصري غير متماثل',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#0284c7] to-[#0369a1] shadow-xs" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #0284c7, #0369a1)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بقعة مائية ديناميكية', width: 160, height: 160 });
                    }
                  },
                  {
                    id: 'sh-blob-org-a',
                    title: 'بقعة عضوية منسابة 🎨',
                    sub: 'شكل خلية منساب مثالي كخلفية مبهجة تحت الصور',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#ec4899] to-[#f43f5e] shadow-xs" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #ec4899, #f43f5e)', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بقعة عضوية منسابة', width: 160, height: 160 });
                    }
                  },
                  {
                    id: 'sh-blob-org-b',
                    title: 'بقعة طاقة متوهجة 🔮',
                    sub: 'انحناء انسيابي مختلف يضفي حيوية بصرية استثنائية',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#8b5cf6] to-[#d946ef] shadow-xs" style={{ borderRadius: '40% 60% 60% 40% / 60% 60% 40% 40%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #8b5cf6, #d946ef)', borderRadius: '40% 60% 60% 40% / 60% 60% 40% 40%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بقعة طاقة متوهجة', width: 160, height: 160 });
                    }
                  },

                  // ==========================================
                  // 4. BRUSH STROKES (ضربات فرشاة طولية وعرضية)
                  // ==========================================
                  {
                    id: 'sh-brush-horiz',
                    title: 'ضربة فرشاة عرضية 🖌️',
                    sub: 'مسحة فرشاة عريضة وممتدة أفقياً لكتابة العناوين عليها',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <div className="w-16 h-6 bg-linear-to-r from-[#ef4444] to-[#f97316]" style={{ clipPath: 'polygon(10% 0%, 100% 12%, 95% 85%, 0% 100%, 8% 50%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'عنوان إبداعي', { backgroundColor: 'linear-gradient(90deg, #ef4444, #f97316)', color: '#ffffff', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom', fontSize: 13, fontWeight: 'bold' }, { clipPath: 'polygon(10% 0%, 100% 12%, 95% 85%, 0% 100%, 8% 50%)', name: 'ضربة فرشاة عرضية', width: 230, height: 60 });
                    }
                  },
                  {
                    id: 'sh-brush-vert',
                    title: 'ضربة فرشاة طولية 🖌️',
                    sub: 'مسحة فرشاة ممتدة عمودياً كفاصل تفاعلي أو خلفية أيقونة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <div className="w-6 h-14 bg-linear-to-b from-[#3b82f6] to-[#06b6d4]" style={{ clipPath: 'polygon(12% 10%, 85% 0%, 100% 90%, 0% 95%, 50% 100%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(180deg, #3b82f6, #06b6d4)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(12% 10%, 85% 0%, 100% 90%, 0% 95%, 50% 100%)', name: 'ضربة فرشاة طولية', width: 70, height: 220 });
                    }
                  },

                  // ==========================================
                  // 5. GEOMETRIC (الأشكال الهندسية المعروفة)
                  // ==========================================
                  {
                    id: 'geo-triangle',
                    title: 'مثلث متساوي الأضلاع 🔺',
                    sub: 'مثلث هندسي نقي متناسق ومستقر',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#ef4444] to-[#dc2626] shadow-sm" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #ef4444, #dc2626)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', name: 'مثلث متساوي الأضلاع', width: 150, height: 150 });
                    }
                  },
                  {
                    id: 'geo-diamond',
                    title: 'معين هندسي متناظر 🔶',
                    sub: 'شكل ماسي متوازن الأضلاع بتدرج جذاب',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#8b5cf6] to-[#7c3aed] shadow-sm" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', name: 'معين هندسي متناظر', width: 150, height: 150 });
                    }
                  },
                  {
                    id: 'geo-hexagon',
                    title: 'سداسي الأضلاع منتظم ⬡',
                    sub: 'شكل خلية نحل سداسية متناسقة وجذابة للغاية',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-13 h-11 bg-linear-to-tr from-[#06b6d4] to-[#0891b2] shadow-sm" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #06b6d4, #0891b2)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', name: 'سداسي الأضلاع', width: 160, height: 140 });
                    }
                  },
                  {
                    id: 'geo-octagon',
                    title: 'ثماني الأضلاع معماري 🛑',
                    sub: 'شكل ثماني كلاسيكي متقن ومحكم الأركان',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#10b981] to-[#059669] shadow-sm" style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #10b981, #059669)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', name: 'ثماني الأضلاع', width: 150, height: 150 });
                    }
                  },
                  {
                    id: 'geo-pentagon',
                    title: 'خماسي الأضلاع منتظم ⬟',
                    sub: 'مضلع خماسي متناسق للهويات والرموز المبتكرة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#8b5cf6] to-[#6d28d9] shadow-sm" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', name: 'خماسي الأضلاع', width: 150, height: 150 });
                    }
                  },
                  {
                    id: 'geo-parallelogram',
                    title: 'متوازي أضلاع عصري ▱',
                    sub: 'شكل مائل بزاوية ديناميكية للمؤشرات والبطاقات المائلة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-14 h-10 bg-linear-to-tr from-[#3b82f6] to-[#2563eb] shadow-sm" style={{ clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #3b82f6, #2563eb)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)', name: 'متوازي أضلاع عصري', width: 180, height: 120 });
                    }
                  },

                  // ==========================================
                  // 6. SPECIAL GEOMETRIC SHAPES
                  // ==========================================
                  {
                    id: 'geo-star-8',
                    title: 'نجمة ثمانية إسلامية 🌟',
                    sub: 'نجمة هندسية ثمانية الرؤوس متناظرة للزخارف والأوسمة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#f59e0b] to-[#d97706] shadow-sm" style={{ clipPath: 'polygon(50% 0%, 65% 20%, 90% 10%, 80% 35%, 100% 50%, 80% 65%, 90% 90%, 65% 80%, 50% 100%, 35% 80%, 10% 90%, 20% 65%, 0% 50%, 20% 35%, 10% 10%, 35% 20%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #f59e0b, #d97706)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(50% 0%, 65% 20%, 90% 10%, 80% 35%, 100% 50%, 80% 65%, 90% 90%, 65% 80%, 50% 100%, 35% 80%, 10% 90%, 20% 65%, 0% 50%, 20% 35%, 10% 10%, 35% 20%)', name: 'نجمة ثمانية إسلامية', width: 150, height: 150 });
                    }
                  },
                  {
                    id: 'geo-heart-shape',
                    title: 'قلب حب متناسق ❤️',
                    sub: 'شكل قلب رومانسي متكامل ومتقن الحواف للتقييمات المميزة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-12 bg-linear-to-tr from-[#ef4444] to-[#e11d48] shadow-sm" style={{ clipPath: 'polygon(50% 15%, 80% 0%, 100% 20%, 100% 50%, 50% 95%, 0% 50%, 0% 20%, 20% 0%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #ef4444, #e11d48)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { clipPath: 'polygon(50% 15%, 80% 0%, 100% 20%, 100% 50%, 50% 95%, 0% 50%, 0% 20%, 20% 0%)', name: 'قلب حب متناسق', width: 140, height: 140 });
                    }
                  },
                  {
                    id: 'geo-leaf-organic',
                    title: 'ورقة شجر طبيعية 🌿',
                    sub: 'شكل ورقة شجر عضوية بأطراف مائلة منسابة للأقسام الطبيعية',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-14 h-12 bg-[#10b981] shadow-xs" style={{ borderRadius: '48px 0px 48px 0px' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#10b981', borderRadius: '48px 0px 48px 0px', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'ورقة شجر طبيعية', width: 180, height: 140 });
                    }
                  },

                  // ==========================================
                  // 7. ARCHES (أقواس مختلفة مغربية وشامية وأندلسية)
                  // ==========================================
                  {
                    id: 'arch-moroccan',
                    title: 'قوس مغربي فخم 🕌',
                    sub: 'بوابة مقوسة مغربية بنمط القواطع الأثرية العريقة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-14 bg-linear-to-tr from-[#d97706] to-[#b45309]" style={{ borderRadius: '50% 50% 4px 4px / 60% 60% 0% 0%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #d97706, #b45309)', borderRadius: '120px 120px 12px 12px / 160px 160px 0% 0%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'قوس مغربي فخم', width: 180, height: 230 });
                    }
                  },
                  {
                    id: 'arch-levantine',
                    title: 'قوس شامي مدبب 🏛️',
                    sub: 'قوس مدبب علوي مستوحى من القناطر الشامية العريقة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-14 bg-[#3b82f6] shadow-xs" style={{ clipPath: 'polygon(50% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)', borderRadius: '40% 40% 0% 0% / 10% 10% 0% 0%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#3b82f6', clipPath: 'polygon(50% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'قوس شامي مدبب', width: 170, height: 220 });
                    }
                  },
                  {
                    id: 'arch-andalusian',
                    title: 'قوس أندلسي عريق 🪟',
                    sub: 'قوس نصف دائري أنيق مستوحى من قباب غرناطة وقرطبة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-14 bg-linear-to-tr from-[#10b981] to-[#047857]" style={{ borderRadius: '40% 40% 0px 0px' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #10b981, #047857)', borderRadius: '120px 120px 12px 12px', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'قوس أندلسي عريق', width: 180, height: 240 });
                    }
                  },

                  // ==========================================
                  // 8. WATER DROPS & WAVY CARDS
                  // ==========================================
                  {
                    id: 'sh-water-drop-large',
                    title: 'قطرة ماء كبيرة 💧',
                    sub: 'بقعة قطرة دمعة كبيرة ومنسابة ثلاثية الأركان الدائرية',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-11 h-11 bg-[#0ea5e9] shadow-xs" style={{ borderRadius: '50% 50% 50% 0' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#0ea5e9', borderRadius: '50% 50% 50% 0', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'قطرة ماء كبيرة', width: 160, height: 160 });
                    }
                  },
                  {
                    id: 'card-melting-bottom',
                    title: 'بطاقة تسيل أطرافها 🩸',
                    sub: 'بطاقة إبداعية فريدة تسيل وتتساقط حوافها السفلية بسلاسة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-14 h-12 bg-linear-to-b from-[#ef4444] to-[#b91c1c]" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 90% 75%, 80% 70%, 70% 85%, 60% 75%, 50% 70%, 40% 90%, 30% 75%, 20% 70%, 10% 80%, 0% 70%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(180deg, #ef4444, #b91c1c)', clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 90% 75%, 80% 70%, 70% 85%, 60% 75%, 50% 70%, 40% 90%, 30% 75%, 20% 70%, 10% 80%, 0% 70%)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بطاقة تسيل أطرافها', width: 220, height: 180 });
                    }
                  },
                  {
                    id: 'card-sine-wave-top',
                    title: 'بطاقة بمنحنى جيبي 🌊',
                    sub: 'بطاقة رأسها العلوي متموج كمنحنى جيبي انسيابي وساحر',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-14 h-12 bg-linear-to-tr from-[#3b82f6] to-[#0ea5e9]" style={{ clipPath: 'polygon(0% 20%, 25% 10%, 50% 20%, 75% 30%, 100% 20%, 100% 100%, 0% 100%)' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', clipPath: 'polygon(0% 20%, 25% 10%, 50% 20%, 75% 30%, 100% 20%, 100% 100%, 0% 100%)', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'بطاقة بمنحنى جيبي علوي', width: 240, height: 180 });
                    }
                  },

                  // ==========================================
                  // 9. DOMES (قبب مختلفة)
                  // ==========================================
                  {
                    id: 'dome-oriental',
                    title: 'قبة شرقية بصلية 🕌',
                    sub: 'قبة بصلية عريضة مدببة الرأس كالمعالم التراثية القديمة',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-14 bg-linear-to-tr from-[#ca8a04] to-[#f59e0b]" style={{ borderRadius: '60% 60% 6px 6px / 100% 100% 0% 0%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #ca8a04, #f59e0b)', borderRadius: '90px 90px 12px 12px / 160px 160px 0% 0%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'قبة شرقية بصلية', width: 180, height: 210 });
                    }
                  },
                  {
                    id: 'dome-taj',
                    title: 'قبة تاج محل الفخمة 🕌',
                    sub: 'قبة مشدودة الجوانب بنحوت هندسية تضفي بعداً فنياً فاخراً',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-12 h-14 bg-linear-to-tr from-[#7c3aed] to-[#a855f7]" style={{ borderRadius: '50% 50% 12px 12px / 80% 80% 0% 0%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: 'linear-gradient(135deg, #7c3aed, #a855f7)', borderRadius: '80px 80px 16px 16px / 120px 120px 0% 0%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'قبة تاج محل', width: 180, height: 220 });
                    }
                  },
                  {
                    id: 'dome-persian',
                    title: 'قبة فارسية مدببة 🕌',
                    sub: 'قبة دقيقة الرأس ممدودة الأطراف مستوحاة من عمارة أصفهان',
                    subCategories: ['boxes'],
                    type: 'shape',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2">
                        <div className="w-11 h-14 bg-[#059669]" style={{ borderRadius: '70% 70% 8px 8px / 120% 120% 0% 0%' }} />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', '', { backgroundColor: '#059669', borderRadius: '75px 75px 12px 12px / 150px 150px 0% 0%', glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'قبة فارسية مدببة', width: 170, height: 230 });
                    }
                  },
                  // 20 Creative Visual Cutout Masks with direct live photo preview
                  ...MASK_SHAPES.map(mask => ({
                    id: `mask-item-${mask.id}`,
                    title: `ماسك: ${mask.name}`,
                    sub: `إطار مفرغ لقص الصور على شكل ${mask.name.replace(/[^أ-ي\s]/g, '').trim()} أنيق ومميز`,
                    subCategories: ['masks'], // 🖼️ ASSIGNED TO MASKS CATEGORY TAB
                    type: 'mask' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center p-2 relative overflow-hidden border border-neutral-200 shadow-2xs">
                        <img 
                          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=80&q=40" 
                          className="absolute inset-2 object-cover rounded-lg w-13 h-13 opacity-90" 
                          alt="cutout-preview" 
                        />
                        <div className="absolute inset-2 w-13 h-13 z-10 pointer-events-none">
                          {mask.svg('#ffffff')}
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('mask', mask.id, { backgroundColor: '#ffffff' }, { name: `ماسك ${mask.name.replace(/[^أ-ي\s]/g, '').trim()}`, width: 220, height: 220 });
                    }
                  })),

                  // 10 Creative Lines for Separation and Design
                  {
                    id: 'line-dotted',
                    title: 'خط منقط هندسي ⚪',
                    sub: 'خط تزييني منقط ناعم للفصل بين الفقرات والأقسام',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 10" width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="0" y1="5" x2="100" y2="5" stroke="#0071e3" strokeWidth="4" strokeDasharray="1,6" strokeLinecap="round" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-dotted', { backgroundColor: '#0071e3' }, { name: 'خط منقط هندسي', width: 300, height: 30 });
                    }
                  },
                  {
                    id: 'line-dashed',
                    title: 'خط متقطع متوازن ➖',
                    sub: 'خط تزييني متقطع متناسق للفصل والتقسيم',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 10" width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="0" y1="5" x2="100" y2="5" stroke="#0071e3" strokeWidth="3" strokeDasharray="8,6" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-dashed', { backgroundColor: '#0071e3' }, { name: 'خط متقطع متوازن', width: 300, height: 30 });
                    }
                  },
                  {
                    id: 'line-glow',
                    title: 'خط نيوم مضيء ✨',
                    sub: 'خط متوهج بفلتر ضوئي مشرق للتصميم العصري',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-900 rounded-xl flex items-center justify-center p-3 border border-neutral-800">
                        <svg viewBox="0 0 100 12" width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="0" y1="6" x2="100" y2="6" stroke="#00c6ff" strokeWidth="3.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 3px #00c6ff)' }} />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-glow', { backgroundColor: '#0071e3' }, { name: 'خط نيوم مضيء', width: 300, height: 30 });
                    }
                  },
                  {
                    id: 'line-curve-up',
                    title: 'خط مقوس للأعلى ⌒',
                    sub: 'خط منساب بقوس ناعم لجمع وتأطير المحتويات',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                          <path d="M 2,18 Q 50,2 98,18" fill="none" stroke="#0071e3" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-curve-up', { backgroundColor: '#0071e3' }, { name: 'خط مقوس للأعلى', width: 300, height: 35 });
                    }
                  },
                  {
                    id: 'line-wavy',
                    title: 'خط متموج انسيابي 〰️',
                    sub: 'تموج جيبي ناعم وجميل للفصل العضوي',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                          <path d="M 0,10 Q 12.5,2 25,10 T 50,10 T 75,10 T 100,10" fill="none" stroke="#0071e3" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-wavy', { backgroundColor: '#0071e3' }, { name: 'خط متموج انسيابي', width: 300, height: 35 });
                    }
                  },
                  {
                    id: 'line-double',
                    title: 'خط مزدوج متوازي ═',
                    sub: 'خطان متوازيان ومتقاربان لإبراز العناوين والأقسام',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 10" width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="0" y1="2" x2="100" y2="2" stroke="#0071e3" strokeWidth="2" />
                          <line x1="0" y1="8" x2="100" y2="8" stroke="#0071e3" strokeWidth="2" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-double', { backgroundColor: '#0071e3' }, { name: 'خط مزدوج متوازي', width: 300, height: 30 });
                    }
                  },
                  {
                    id: 'line-gradient',
                    title: 'خط متدرج لوني فخم 🌈',
                    sub: 'تدرج لوني انسيابي ومشرق يعبر عن الحداثة والتميز',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full" />
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-gradient', { backgroundColor: '#0071e3' }, { name: 'خط متدرج لوني', width: 300, height: 30 });
                    }
                  },
                  {
                    id: 'line-3d',
                    title: 'خط ثلاثي الأبعاد بظل 🧱',
                    sub: 'خط ببروز واقعي وظل خلفي يعطي انطباع البعد الثالث',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 14" width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="0" y1="8" x2="100" y2="8" stroke="rgba(0,0,0,0.15)" strokeWidth="3.5" strokeLinecap="round" />
                          <line x1="0" y1="5" x2="100" y2="5" stroke="#0071e3" strokeWidth="3.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-3d', { backgroundColor: '#0071e3' }, { name: 'خط ثلاثي الأبعاد', width: 300, height: 30 });
                    }
                  },
                  {
                    id: 'line-arrow',
                    title: 'خط الإشارة والاتجاه ➔',
                    sub: 'خط دلالي ينتهي بسهم لتوجيه انتباه القارئ',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 12" width="100%" height="100%" preserveAspectRatio="none">
                          <line x1="0" y1="6" x2="90" y2="6" stroke="#0071e3" strokeWidth="3" />
                          <path d="M 88 2 L 98 6 L 88 10 z" fill="#0071e3" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-arrow', { backgroundColor: '#0071e3' }, { name: 'خط الإشارة بسهم', width: 300, height: 30 });
                    }
                  },
                  {
                    id: 'line-zigzag',
                    title: 'خط متعرج حاد ⚡',
                    sub: 'خط زجزاج حاد ومميز لإبراز البيانات والتحفيز البصري',
                    subCategories: ['lines'], // ⚡ ASSIGNED TO LINES CATEGORY TAB
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-3 border border-neutral-200">
                        <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                          <path d="M 0,10 L 10,2 L 20,18 L 30,2 L 40,18 L 50,2 L 60,18 L 70,2 L 80,18 L 90,2 L 100,10" fill="none" stroke="#0071e3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ),
                    action: () => {
                      onAddElement('shape', 'line-zigzag', { backgroundColor: '#0071e3' }, { name: 'خط متعرج حاد', width: 300, height: 35 });
                    }
                  },

                  // ==========================================
                  // 20 GORGEOUS unDraw ILLUSTRATIONS
                  // ==========================================
                  {
                    id: 'undraw-team-collaboration',
                    title: 'العمل الجماعي والتعاون 👥',
                    sub: 'رسم توضيحي يعبر عن التناغم وبناء الأفكار الجماعية',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_team_collaboration_re_ow69.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_team_collaboration_re_ow69.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تعاون الفريق', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_team_collaboration_re_ow69.svg' });
                    }
                  },
                  {
                    id: 'undraw-web-development',
                    title: 'تطوير المواقع والويب 💻',
                    sub: 'بناء واجهات برمجية ذكية وتطبيقات متكاملة',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_web_development_w29c.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_web_development_w29c.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تطوير الويب', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_web_development_w29c.svg' });
                    }
                  },
                  {
                    id: 'undraw-brainstorming',
                    title: 'العصف الفكري والابتكار 🧠',
                    sub: 'توليد أفكار ريادية ومناقشة الحلول الخلاقة',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_brainstorming_re_135g.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_brainstorming_re_135g.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: العصف الذهني', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_brainstorming_re_135g.svg' });
                    }
                  },
                  {
                    id: 'undraw-analytics',
                    title: 'تحليل البيانات والمؤشرات 📊',
                    sub: 'دراسة الرسوم البيانية وإحصائيات الأداء السنوية',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_analytics_re_ywgo.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_analytics_re_ywgo.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تحليل البيانات', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_analytics_re_ywgo.svg' });
                    }
                  },
                  {
                    id: 'undraw-business-decisions',
                    title: 'القرارات المهنية الذكية 📈',
                    sub: 'تحديد الاتجاه وبناء خطط العمل الإستراتيجية',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_business_decisions_re_849n.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_business_decisions_re_849n.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: قرارات الأعمال', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_business_decisions_re_849n.svg' });
                    }
                  },
                  {
                    id: 'undraw-feeling-proud',
                    title: 'الفخر والوصول للقمة 🏆',
                    sub: 'تحقيق الأهداف والمشاعر الإيجابية بالإنجاز',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_feeling_proud_qne1.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_feeling_proud_qne1.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: فخر الإنجاز', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_feeling_proud_qne1.svg' });
                    }
                  },
                  {
                    id: 'undraw-programmer',
                    title: 'المبرمج والمطور النشط ⌨️',
                    sub: 'كتابة الأكواد والحلول البرمجية بمنتهى التركيز',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_programmer_re_g6ob.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_programmer_re_g6ob.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: مبرمج', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_programmer_re_g6ob.svg' });
                    }
                  },
                  {
                    id: 'undraw-investing',
                    title: 'الاستثمار والنمو المالي 💰',
                    sub: 'بناء الأصول وتنمية رأس المال بشكل آمن ومدروس',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_investing_re_b7kn.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_investing_re_b7kn.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: استثمار مالي', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_investing_re_b7kn.svg' });
                    }
                  },
                  {
                    id: 'undraw-education',
                    title: 'التربية والتعليم الأكاديمي 📚',
                    sub: 'اكتساب المهارات والتطور المعرفي المستمر',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_education_f8ru.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_education_f8ru.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تعليم ومعرفة', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_education_f8ru.svg' });
                    }
                  },
                  {
                    id: 'undraw-marketing',
                    title: 'الإعلانات والتسويق الرقمي 📢',
                    sub: 'إيصال الرسالة التسويقية والوصول للفئة المستهدفة',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_marketing_re_7060.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_marketing_re_7060.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: حملة تسويقية', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_marketing_re_7060.svg' });
                    }
                  },
                  {
                    id: 'undraw-innovative',
                    title: 'الأفكار والحلول الابتكارية 💡',
                    sub: 'استكشاف آفاق جديدة وتطوير حلول ثورية',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_innovative_re_asrj.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_innovative_re_asrj.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: ابتكار إبداعي', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_innovative_re_asrj.svg' });
                    }
                  },
                  {
                    id: 'undraw-project-completed',
                    title: 'إتمام وإنجاز المشاريع ✅',
                    sub: 'الاحتفال بالوصول لخط النهاية وتسليم المشروع',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_project_completed_w0sq.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_project_completed_w0sq.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: إنجاز المشروع', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_project_completed_w0sq.svg' });
                    }
                  },
                  {
                    id: 'undraw-searching',
                    title: 'البحث والتحري الذكي 🔍',
                    sub: 'التنقيب عن البيانات والمعلومات بدقة وعناية',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_searching_p59q.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_searching_p59q.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: بحث سريع', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_searching_p59q.svg' });
                    }
                  },
                  {
                    id: 'undraw-chating',
                    title: 'المحادثة والتواصل الاجتماعي 💬',
                    sub: 'تبادل الأفكار والنقاش الفعال عن بعد',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_chating_re_9980.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_chating_re_9980.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: محادثة وتواصل', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_chating_re_9980.svg' });
                    }
                  },
                  {
                    id: 'undraw-conference-call',
                    title: 'الاجتماعات والمكالمات الجماعية 📞',
                    sub: 'عقد اللقاءات الافتراضية المباشرة مع الفريق والعملاء',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_conference_call_re_u0ba.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_conference_call_re_u0ba.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: مكالمة مؤتمر', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_conference_call_re_u0ba.svg' });
                    }
                  },
                  {
                    id: 'undraw-science',
                    title: 'البحوث والعلوم الدقيقة 🧪',
                    sub: 'التجارب المخبرية والتفكير والتحليل العلمي والمنهجي',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_science_re_87m4.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_science_re_87m4.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تحليل وبحوث علمية', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_science_re_87m4.svg' });
                    }
                  },
                  {
                    id: 'undraw-launch-day',
                    title: 'يوم الإطلاق والتدشين 🚀',
                    sub: 'دفع المنتج الجديد إلى السوق والاحتفال بالانطلاقة الحية',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_launch_day_re_453a.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_launch_day_re_453a.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: يوم الإطلاق السعيد', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_launch_day_re_453a.svg' });
                    }
                  },
                  {
                    id: 'undraw-goals',
                    title: 'تحديد الأهداف والإنجاز الفردي 🎯',
                    sub: 'التركيز على تحقيق الطموحات وإنجاز الخطط في أوقاتها',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_goals_re_g1tz.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_goals_re_g1tz.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: أهداف منجزة', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_goals_re_g1tz.svg' });
                    }
                  },
                  {
                    id: 'undraw-developer-activity',
                    title: 'تطوير الحلول التقنية المتقدمة 🌐',
                    sub: 'البرمجة المركبة والحلول الرقمية وإدارة قواعد البيانات',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_developer_activity_re_3e78.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_developer_activity_re_3e78.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تطوير برمجي مكثف', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_developer_activity_re_3e78.svg' });
                    }
                  },
                  {
                    id: 'undraw-startup-life',
                    title: 'حياة رواد الأعمال والشركات الناشئة 🏢',
                    sub: 'المرونة والعمل السريع الدؤوب لتحويل الفكرة لواقع',
                    subCategories: ['undraw'],
                    type: 'shape' as const,
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center p-2 border border-neutral-200">
                        <img 
                          src="https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_startup_life_re_809q.svg" 
                          className="w-14 h-14 object-contain"
                          alt="undraw-preview" 
                        />
                      </div>
                    ),
                    action: () => {
                      onAddElement('image', 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_startup_life_re_809q.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: حياة الشركات الناشئة', width: 280, height: 210, imageUrl: 'https://raw.githubusercontent.com/balazser/undraw-svg-collection/master/svg/undraw_startup_life_re_809q.svg' });
                    }
                  },
                ],
                icons: [
                  // --- 50 CUSTOM ICONS ---
                  // 1. Social Icons (15)
                  {
                    id: 'icon-whatsapp',
                    title: 'أيقونة واتساب',
                    sub: 'أيقونة مراسلة فورية خضراء دائرية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center text-xl shadow-xs">💬</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '💬', { backgroundColor: '#25D366', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'واتساب', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-instagram',
                    title: 'أيقونة انستجرام',
                    sub: 'أيقونة وردية دائرية لعرض الصور',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#E1306C] text-white rounded-full flex items-center justify-center text-xl shadow-xs">📸</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '📸', { backgroundColor: '#E1306C', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'انستجرام', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-snapchat',
                    title: 'أيقونة سناب شات',
                    sub: 'أيقونة سناب شات صفراء مرحة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#FFFC00] text-black rounded-full flex items-center justify-center text-xl shadow-xs">👻</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '👻', { backgroundColor: '#FFFC00', color: '#000000', borderRadius: 9999, fontSize: 24 }, { name: 'سناب شات', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-tiktok',
                    title: 'أيقونة تيك توك',
                    sub: 'أيقونة سوداء عصرية للمقاطع القصيرة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-xl shadow-xs">🎵</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🎵', { backgroundColor: '#000000', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'تيك توك', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-youtube',
                    title: 'أيقونة يوتيوب',
                    sub: 'أيقونة يوتيوب الحمراء لعرض الفيديو',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#FF0000] text-white rounded-full flex items-center justify-center text-xl shadow-xs">🎥</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🎥', { backgroundColor: '#FF0000', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'يوتيوب', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-twitter',
                    title: 'أيقونة تويتر / إكس',
                    sub: 'أيقونة زرقاء كلاسيكية لمجتمع تويتر',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center text-xl shadow-xs">🐦</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🐦', { backgroundColor: '#1DA1F2', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'تويتر', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-facebook',
                    title: 'أيقونة فيسبوك',
                    sub: 'أيقونة فيسبوك دائرية زرقاء داكنة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center text-xl shadow-xs">👥</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '👥', { backgroundColor: '#1877F2', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'فيسبوك', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-linkedin',
                    title: 'أيقونة لينكد إن',
                    sub: 'أيقونة زرقاء رسمية للشبكات المهنية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#0A66C2] text-white rounded-full flex items-center justify-center text-xl shadow-xs">💼</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '💼', { backgroundColor: '#0A66C2', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'لينكد إن', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-telegram',
                    title: 'أيقونة تيليجرام',
                    sub: 'أيقونة زرقاء سماوية للمجموعات والدردشة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#0088cc] text-white rounded-full flex items-center justify-center text-xl shadow-xs">✈️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '✈️', { backgroundColor: '#0088cc', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'تيليجرام', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-pinterest',
                    title: 'أيقونة بنترست',
                    sub: 'أيقونة دائرية حمراء لحفظ اللوحات',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#BD081C] text-white rounded-full flex items-center justify-center text-xl shadow-xs">📌</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '📌', { backgroundColor: '#BD081C', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'بنترست', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-github',
                    title: 'أيقونة جيت هاب',
                    sub: 'أيقونة للمطورين والمشاريع البرمجية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#24292e] text-white rounded-full flex items-center justify-center text-xl shadow-xs">🐙</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🐙', { backgroundColor: '#24292e', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'جيت هاب', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-discord',
                    title: 'أيقونة ديسكورد',
                    sub: 'أيقونة بنفسجية تفاعلية للاعبين',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#5865F2] text-white rounded-full flex items-center justify-center text-xl shadow-xs">👾</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '👾', { backgroundColor: '#5865F2', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'ديسكورد', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-reddit',
                    title: 'أيقونة ريديت',
                    sub: 'أيقونة برتقالية دائرية لمجتمعات النقاش',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#FF4500] text-white rounded-full flex items-center justify-center text-xl shadow-xs">🤖</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🤖', { backgroundColor: '#FF4500', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'ريديت', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-skype',
                    title: 'أيقونة سكايب',
                    sub: 'أيقونة زرقاء كلاسيكية لمكالمات الفيديو',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#00AFF0] text-white rounded-full flex items-center justify-center text-xl shadow-xs">🌐</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🌐', { backgroundColor: '#00AFF0', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'سكايب', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-spotify',
                    title: 'أيقونة سبوتيفاي',
                    sub: 'أيقونة خضراء دائرية للاستماع والصوتيات',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-[#1DB954] text-white rounded-full flex items-center justify-center text-xl shadow-xs">🎧</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🎧', { backgroundColor: '#1DB954', color: '#ffffff', borderRadius: 9999, fontSize: 24 }, { name: 'سبوتيفاي', width: 55, height: 55 });
                    }
                  },

                  // 2. Utility Icons (20)
                  {
                    id: 'icon-home',
                    title: 'الرئيسية 🏠',
                    sub: 'أيقونة المنزل الكلاسيكية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-lg flex items-center justify-center text-xl">🏠</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🏠', { backgroundColor: '#f3f4f6', color: '#1f2937', borderRadius: 12 }, { name: 'الرئيسية', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-phone',
                    title: 'هاتف 📞',
                    sub: 'أيقونة الهاتف الكلاسيكية للاتصال',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center text-xl">📞</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '📞', { backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: 12 }, { name: 'هاتف', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-mail',
                    title: 'مراسلة ✉️',
                    sub: 'أيقونة ظرف البريد الإلكتروني',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-purple-100 text-purple-800 rounded-lg flex items-center justify-center text-xl">✉️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '✉️', { backgroundColor: '#f3e8ff', color: '#6b21a8', borderRadius: 12 }, { name: 'بريد', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-user',
                    title: 'مستخدم 👤',
                    sub: 'رمز حساب العضو الشخصي',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-neutral-100 text-neutral-800 rounded-lg flex items-center justify-center text-xl">👤</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '👤', { backgroundColor: '#f3f4f6', color: '#374151', borderRadius: 12 }, { name: 'مستخدم', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-calendar',
                    title: 'تقويم 📅',
                    sub: 'أيقونة مواعيد وحجوزات',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center text-xl">📅</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '📅', { backgroundColor: '#fef3c7', color: '#92400e', borderRadius: 12 }, { name: 'تقويم', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-clock',
                    title: 'ساعة وقت ⏰',
                    sub: 'أيقونة تدل على الساعات وأوقات العمل',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-rose-100 text-rose-800 rounded-lg flex items-center justify-center text-xl">⏰</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '⏰', { backgroundColor: '#ffe4e6', color: '#9f1239', borderRadius: 12 }, { name: 'ساعة', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-search',
                    title: 'بحث 🔍',
                    sub: 'عدسة تكبير للبحث والتحقق',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-sky-100 text-sky-800 rounded-lg flex items-center justify-center text-xl">🔍</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🔍', { backgroundColor: '#e0f2fe', color: '#075985', borderRadius: 12 }, { name: 'بحث', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-settings',
                    title: 'ترس ⚙️',
                    sub: 'أيقونة التعديل والإعدادات والخيارات',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-neutral-100 text-neutral-800 rounded-lg flex items-center justify-center text-xl">⚙️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '⚙️', { backgroundColor: '#f3f4f6', color: '#4b5563', borderRadius: 12 }, { name: 'إعدادات', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-lock',
                    title: 'قفل 🔒',
                    sub: 'رمز الحماية والأمان والخصوصية المغلقة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center text-xl">🔒</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🔒', { backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 12 }, { name: 'أمان مغلق', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-unlock',
                    title: 'حرية 🔓',
                    sub: 'رمز الأمان المفتوح والصلاحية المفتوحة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-orange-100 text-orange-800 rounded-lg flex items-center justify-center text-xl">🔓</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🔓', { backgroundColor: '#ffedd5', color: '#9a3412', borderRadius: 12 }, { name: 'أمان مفتوح', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-trash',
                    title: 'سلة 🗑️',
                    sub: 'أيقونة الحذف وإفراغ الملفات',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-red-100 text-red-800 rounded-lg flex items-center justify-center text-xl">🗑️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🗑️', { backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 12 }, { name: 'سلة مهملات', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-edit',
                    title: 'قلم ✏️',
                    sub: 'أيقونة الكتابة والتعديل والرسم',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-teal-100 text-teal-800 rounded-lg flex items-center justify-center text-xl">✏️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '✏️', { backgroundColor: '#ccfbf1', color: '#0f766e', borderRadius: 12 }, { name: 'قلم تعديل', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-save',
                    title: 'حفظ 💾',
                    sub: 'أيقونة القرص المرن للحفظ والأرشفة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-indigo-100 text-indigo-800 rounded-lg flex items-center justify-center text-xl">💾</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '💾', { backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: 12 }, { name: 'حفظ', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-download',
                    title: 'تحميل 📥',
                    sub: 'أيقونة صندوق التنزيل والاستلام',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-neutral-100 text-neutral-800 rounded-lg flex items-center justify-center text-xl">📥</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '📥', { backgroundColor: '#f3f4f6', color: '#111827', borderRadius: 12 }, { name: 'تحميل', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-upload',
                    title: 'رفع 📤',
                    sub: 'أيقونة صندوق التصدير والإرسال والرفع',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-neutral-100 text-neutral-800 rounded-lg flex items-center justify-center text-xl">📤</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '📤', { backgroundColor: '#f3f4f6', color: '#111827', borderRadius: 12 }, { name: 'رفع ملف', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-share',
                    title: 'مشاركة 🔗',
                    sub: 'أيقونة الرابط والمشاركة والنشر',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center text-xl">🔗</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🔗', { backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: 12 }, { name: 'رابط مشاركة', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-heart',
                    title: 'قلب ❤️',
                    sub: 'أيقونة المفضلة والإعجاب والإنسانية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-xl">❤️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '❤️', { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 12 }, { name: 'إعجاب', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-star',
                    title: 'نجمة ⭐',
                    sub: 'أيقونة التقييم والمميز والأولية والامتياز',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center text-xl">⭐</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '⭐', { backgroundColor: '#fffbeb', color: '#d97706', borderRadius: 12 }, { name: 'تقييم مفضلة', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-info',
                    title: 'معلومات ℹ️',
                    sub: 'أيقونة تفاصيل إضافية وتعليمات',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">ℹ️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', 'ℹ️', { backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: 12 }, { name: 'ملاحظة', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-check',
                    title: 'تأكيد صح ✅',
                    sub: 'رمز إتمام المهمة بنجاح وبشكل سليم',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl">✅</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '✅', { backgroundColor: '#ecfdf5', color: '#059669', borderRadius: 12 }, { name: 'علامة تأكيد', width: 50, height: 50 });
                    }
                  },

                  // 3. Spacers, Price Tags, Marks & Syrian Pound Price (15)
                  {
                    id: 'icon-syrian-pound',
                    title: 'سعر بالليرة السورية 💰',
                    sub: 'سعر خاص بالليرة السورية ل.س',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold rounded-lg text-xs shadow-xs">ل.س</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', 'ل.س 💰', { backgroundColor: '#16a34a', color: '#ffffff', borderRadius: 8, fontWeight: 'bold', fontSize: 18 }, { name: 'سعر ليرة سورية', width: 90, height: 42 });
                    }
                  },
                  {
                    id: 'icon-exclamation',
                    title: 'علامة تعجب ⚠️',
                    sub: 'إشارة تعجب صفراء للتنبيهات العاجلة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-xl font-black">⚠️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '⚠️', { backgroundColor: '#fef3c7', color: '#d97706', borderRadius: 9999, fontSize: 24 }, { name: 'إشارة تعجب تنبيه', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-question',
                    title: 'علامة استفهام ❓',
                    sub: 'أيقونة حمراء للسؤال والتعليمات الشائعة',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xl font-black">❓</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '❓', { backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 9999, fontSize: 24 }, { name: 'استفهام', width: 55, height: 55 });
                    }
                  },
                  {
                    id: 'icon-price-tag',
                    title: 'بطاقة سعر 🏷️',
                    sub: 'أيقونة تدل على المنتجات والخصومات والعروض',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center text-xl">🏷️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🏷️', { backgroundColor: '#dbeafe', color: '#2563eb', borderRadius: 12 }, { name: 'بطاقة عرض السعر', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-sep-stars',
                    title: 'فاصل النجوم الثلاثة ✨★✨',
                    sub: 'فاصل أنيق للغاية يفصل بين فقرات الشرح',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="text-amber-500 font-bold text-xs">✨  ★  ★  ★  ✨</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '✨  ★  ★  ★  ✨', { backgroundColor: 'transparent', color: '#f59e0b', fontSize: 18, fontWeight: 'bold' }, { name: 'فاصل نجوم', width: 220, height: 40 });
                    }
                  },
                  {
                    id: 'icon-sep-diamond',
                    title: 'فاصل المعين المذهب ✦──✦',
                    sub: 'فاصل فاخر وممتد بين الأقسام الرئيسية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="text-neutral-500 text-xs">✦  ────  ✦</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '✦  ──────────────  ✦', { backgroundColor: 'transparent', color: '#4b5563', fontSize: 16, fontWeight: 'bold' }, { name: 'فاصل المعين', width: 340, height: 40 });
                    }
                  },
                  {
                    id: 'icon-sep-wave',
                    title: 'فاصل متموج 〰️〰️〰️',
                    sub: 'فاصل ناعم ومرح',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="text-neutral-400 font-bold text-xs">〰️  〰️  〰️</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '〰️  〰️  〰️  〰️  〰️', { backgroundColor: 'transparent', color: '#9ca3af', fontSize: 16 }, { name: 'فاصل متموج', width: 200, height: 40 });
                    }
                  },
                  {
                    id: 'icon-sep-dots',
                    title: 'فاصل النقاط الثلاث ⚫⚫⚫',
                    sub: 'فاصل بسيط محايد للفقرات',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="text-neutral-400 font-bold text-xs">⚫  ⚫  ⚫</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '⚫   ⚫   ⚫', { backgroundColor: 'transparent', color: '#9ca3af', fontSize: 14 }, { name: 'فاصل نقاط', width: 180, height: 40 });
                    }
                  },
                  {
                    id: 'icon-alert',
                    title: 'تنبيه خطر 🚨',
                    sub: 'أيقونة دورية الشرطة والعروض الحارة القوية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-xl">🚨</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🚨', { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 12 }, { name: 'تنبيه خطر', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-gift',
                    title: 'هدية ومفاجأة 🎁',
                    sub: 'أيقونة هدية العروض والمكافآت والجوائز',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-pink-100 text-pink-800 rounded-lg flex items-center justify-center text-xl">🎁</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🎁', { backgroundColor: '#fce7f3', color: '#be185d', borderRadius: 12 }, { name: 'هدية مفاجأة', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-fire',
                    title: 'عرض ساخن 🔥',
                    sub: 'أيقونة عروض مميزة وحارة جداً',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xl">🔥</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🔥', { backgroundColor: '#fffbeb', color: '#ea580c', borderRadius: 12 }, { name: 'عرض ساخن ناري', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-crown',
                    title: 'تاج التميز 👑',
                    sub: 'رمز القيادة والمميز والعضويات الملكية',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center text-xl">👑</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '👑', { backgroundColor: '#fefce8', color: '#ca8a04', borderRadius: 12 }, { name: 'تاج الملك التميز', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-trophy',
                    title: 'كأس فوز 🏆',
                    sub: 'رمز التكريم والفوز والريادة للأعمال',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-xl">🏆</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🏆', { backgroundColor: '#fef3c7', color: '#b45309', borderRadius: 12 }, { name: 'كأس فوز', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-bell',
                    title: 'إشعارات جرس 🔔',
                    sub: 'أيقونة التنبيه والتذكير بالأخبار والجديد',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center text-xl">🔔</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '🔔', { backgroundColor: '#fefce8', color: '#ca8a04', borderRadius: 12 }, { name: 'إشعار جرس', width: 50, height: 50 });
                    }
                  },
                  {
                    id: 'icon-dollar',
                    title: 'دولار 💵',
                    sub: 'أيقونة عملة الدولار والتعامل المالي الشامل',
                    subCategories: ['icons'],
                    type: 'badge',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xl">💵</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('badge', '💵', { backgroundColor: '#ecfdf5', color: '#059669', borderRadius: 12 }, { name: 'عملة دولار', width: 50, height: 50 });
                    }
                  },
                ],
                 video: [
                  {
                    id: 'video-horizontal',
                    title: 'مشغل فيديو عرضي (أفقي) 🎬',
                    sub: 'مناسب لمقاطع اليوتيوب والعروض العريضة (16:9)',
                    subCategories: ['all'],
                    type: 'video',
                    preview: (
                      <div className="w-full h-18 bg-neutral-900 rounded-xl flex flex-col items-center justify-center text-white relative">
                        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px]">▶</div>
                        <span className="text-[9px] text-white/80 mt-1 font-mono">أفقي 16:9</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('video', 'مشغل فيديو عرضي تفاعلي', { borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'مشغل فيديو عرضي', videoUrl: videoAddUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', width: 480, height: 270 });
                    }
                  },
                  {
                    id: 'video-vertical',
                    title: 'مشغل فيديو طولي (عمودي) 📱',
                    sub: 'مناسب لمقاطع تيك توك، ريلز، والـ Shorts الطولية (9:16)',
                    subCategories: ['all'],
                    type: 'video',
                    preview: (
                      <div className="w-full h-18 bg-neutral-900 rounded-xl flex items-center justify-center text-white relative">
                        <div className="w-4 h-7 bg-neutral-800 rounded-xs border border-neutral-700 flex items-center justify-center text-[8px] text-white">📱</div>
                        <span className="text-[9px] text-white/80 mt-1 font-mono">طولي 9:16</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('video', 'مشغل فيديو طولي تفاعلي', { borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'مشغل فيديو طولي', videoUrl: videoAddUrl || 'https://www.tiktok.com/@tiktok/video/7106362547144887554', width: 220, height: 380 });
                    }
                  },
                ],

                map: [
                  {
                    id: 'full-map',
                    title: 'خريطة تفاعلية كاملة',
                    sub: 'موقعك مع مؤشر الموقع الدقيق',
                    subCategories: ['full'],
                    type: 'map',
                    preview: (
                      <div className="w-full h-18 bg-emerald-50/60 rounded-xl flex items-center justify-center relative overflow-hidden border border-emerald-200/60">
                        <span className="text-xl">📍</span>
                        <span className="absolute bottom-1 right-2 text-[9px] text-neutral-600 font-mono">Maps</span>
                      </div>
                    ),
                    action: () => {
                      const loc = mapAddLocation || 'الرياض، المملكة العربية السعودية';
                      onAddElement('map', loc, { borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'خرائط جوجل', mapLocation: loc, width: 420, height: 250 });
                    }
                  },
                  {
                    id: 'card-map',
                    title: 'خريطة مع بطاقة العنوان',
                    sub: 'معلومات الفرع وأوقات العمل',
                    subCategories: ['card'],
                    type: 'map',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl p-1.5 flex flex-col justify-between border border-neutral-200 text-right">
                        <span className="text-[9px] font-bold text-neutral-800 truncate">فرع دبي - شارع الشيخ زايد</span>
                        <span className="text-[8px] text-neutral-500">مفتوح: 09:00 ص - 10:00 م</span>
                        <span className="text-[8px] text-[#0071e3] font-bold">عرض الاتجاهات ↗</span>
                      </div>
                    ),
                    action: () => {
                      const loc = mapAddLocation || 'دبي، شارع الشيخ زايد، الإمارات العربية المتحدة';
                      onAddElement('map', loc, { borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'خريطة فرع دبي', mapLocation: loc, width: 440, height: 260 });
                    }
                  },
                  {
                    id: 'mini-map',
                    title: 'خريطة مصغرة',
                    sub: 'عنصر ويدجت صغير للموقع',
                    subCategories: ['mini'],
                    type: 'map',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center border border-neutral-200">
                        <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-neutral-200 flex items-center justify-center text-xs">🗺️</div>
                      </div>
                    ),
                    action: () => {
                      const loc = mapAddLocation || 'القاهرة، المعادي، مصر';
                      onAddElement('map', loc, { borderRadius: 16, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'خريطة مصغرة', mapLocation: loc, width: 280, height: 180 });
                    }
                  },
                ],
                pricing: [
                  {
                    id: 'pro-plan',
                    title: 'باقة الأعمال الاحترافية',
                    sub: 'الباقة الأكثر طلباً للشركات',
                    subCategories: ['single'],
                    type: 'pricing',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-1.5 flex flex-col justify-between border border-neutral-200 text-right">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-[#0071e3]">الباقة المتقدمة</span>
                          <span className="text-[10px] font-black">199 ر.س</span>
                        </div>
                        <span className="text-[8px] text-neutral-500 truncate">✓ استضافة سريعة ✓ نطاق مجاني</span>
                        <span className="text-[8px] bg-[#0071e3] text-white py-0.5 rounded text-center font-bold">اشترك</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('pricing', 'الحل المتكامل لرواد الأعمال والمشاريع الطموحة.', { backgroundColor: '#ffffff', borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'حاوية أسعار متقدمة', pricingPlan: 'باقة الأعمال الاحترافية', pricingPrice: '199 ر.س', pricingPeriod: 'شهرياً', pricingFeatures: ['تصميم متجاوب كامل مع الجوال', 'دعم فني واستشارات متواصلة', 'سيرفرات سريعة ونطاق مجاني', 'شهادة أمان SSL مدمجة'], width: 320, height: 380 });
                    }
                  },
                  {
                    id: 'starter-plan',
                    title: 'باقة الانطلاق للأفراد',
                    sub: 'الخيار المثالي للبدايات',
                    subCategories: ['starter'],
                    type: 'pricing',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-1.5 flex flex-col justify-between border border-neutral-200 text-right">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-neutral-700">باقة البداية</span>
                          <span className="text-[10px] font-black">79 ر.س</span>
                        </div>
                        <span className="text-[8px] text-neutral-500">✓ قالب أساسي ✓ دعم فني</span>
                        <span className="text-[8px] bg-neutral-800 text-white py-0.5 rounded text-center font-bold">اختر الباقة</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('pricing', 'بداية ممتازة لتأسيس وجودك الرقمي بأقل تكلفة.', { backgroundColor: '#ffffff', borderRadius: 24, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'باقة الانطلاق', pricingPlan: 'باقة البداية', pricingPrice: '79 ر.س', pricingPeriod: 'شهرياً', pricingFeatures: ['موقع صفحة واحدة سريعة', 'دعم فني عبر البريد', 'شهادة أمان SSL مجانية'], width: 300, height: 340 });
                    }
                  },
                ],
                calendar: [
                  {
                    id: 'horizontal-full-booking',
                    title: 'بطاقة حجز مواعيد عرضية متكاملة 🌟',
                    sub: 'تنسيق عرضي فاخر يجمع التقويم الشهري والساعات ونموذج الحجز جنباً إلى جنب',
                    subCategories: ['confirm', 'month', 'slots', 'all'],
                    type: 'calendar',
                    preview: (
                      <div className="w-full h-22 bg-gradient-to-r from-blue-50/80 via-white to-neutral-50 rounded-xl p-2 flex flex-col justify-between border-2 border-[#0071e3]/30 text-right shadow-2xs">
                        <div className="flex justify-between items-center text-[9.5px] font-bold">
                          <span className="text-[#0071e3] flex items-center gap-1">
                            <span>📅</span>
                            <span>بطاقة حجز عرضية متكاملة</span>
                          </span>
                          <span className="bg-[#0071e3] text-white text-[8px] px-1.5 py-0.5 rounded font-bold">تنسيق عرضي فاخر</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 my-1">
                          <div className="bg-white/80 border border-neutral-200 rounded p-1 text-[7.5px] text-neutral-600 space-y-0.5">
                            <div>• حقول: الاسم، الهاتف، العنوان</div>
                            <div>• طرق المقابلة: شخصي / اتصال</div>
                          </div>
                          <div className="bg-blue-50/60 border border-blue-200 rounded p-1 text-[7.5px] text-blue-900 space-y-0.5">
                            <div>• تقويم شهري تفاعلي مدمج</div>
                            <div>• فترات ساعات مقسمة بذكاء</div>
                          </div>
                        </div>
                        <span className="text-[8.5px] bg-[#0071e3] text-white py-1 rounded-lg text-center font-bold shadow-3xs">
                          إضافة البطاقة العرضية للكانفاس (780 × 440)
                        </span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('calendar', calAddTitle, { 
                        backgroundColor: '#ffffff', 
                        borderRadius: 24, 
                        glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' 
                      }, { 
                        name: 'بطاقة حجز مواعيد عرضية', 
                        calendarTitle: calAddTitle, 
                        calendarAccentColor: calAddAccentColor,
                        calendarSlots: calAddSlotsText.split(',').map(s => s.trim()).filter(Boolean),
                        width: 780, 
                        height: 440,
                        calendarWorkingDays: calAddWorkingDays,
                        calendarHolidays: calAddHolidays,
                        calendarWorkStart: calAddWorkStart,
                        calendarWorkEnd: calAddWorkEnd,
                        calendarBreakStart: calAddBreakStart,
                        calendarBreakEnd: calAddBreakEnd,
                        calendarInterval: calAddInterval,
                        calendarIntervalMinutes: calAddIntervalMins,
                        calendarNeedsConfirmation: calAddNeedsConfirmation,
                        calendarMeetingTypes: calAddMeetingTypes,
                        calendarMeetingType: calAddMeetingTypes[0] as any,
                        calendarNameLabel: calAddNameLabel,
                        calendarAddressLabel: calAddAddressLabel,
                        calendarPhoneLabel: calAddPhoneLabel,
                        calendarEmailLabel: calAddEmailLabel,
                        calendarDescLabel: calAddDescLabel
                      });
                    }
                  },
                  {
                    id: 'horizontal-consultation',
                    title: 'بطاقة حجز استشارات طبية ومهنية 🩺',
                    sub: 'تنسيق عرضي مخصص للاستشارات وجلسات العمل مع خيارات اللقاء',
                    subCategories: ['month', 'confirm', 'all'],
                    type: 'calendar',
                    preview: (
                      <div className="w-full h-20 bg-emerald-50/60 rounded-xl p-2 flex flex-col justify-between border border-emerald-300 text-right">
                        <div className="flex justify-between items-center text-[9px] font-bold text-emerald-950">
                          <span>🩺 حجز استشارة أو جلسة خاصة</span>
                          <span className="text-emerald-700 bg-emerald-100 text-[7.5px] px-1.5 py-0.5 rounded">عرضي تفاعلي</span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-neutral-600 px-1">
                          <span>👤 حضور شخصي بالمقر</span>
                          <span>📹 اتصال فيديو واتساب</span>
                        </div>
                        <span className="text-[8px] bg-emerald-600 text-white py-0.5 rounded text-center font-bold">
                          إضافة بطاقة الاستشارة (780 × 440)
                        </span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('calendar', 'حجز موعد استشارة متخصصة', { 
                        backgroundColor: '#ffffff', 
                        borderRadius: 24, 
                        glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' 
                      }, { 
                        name: 'بطاقة استشارة مهنية', 
                        calendarTitle: 'حجز موعد استشارة متخصصة', 
                        calendarAccentColor: '#10b981',
                        calendarSlots: ['09:00 ص', '10:30 ص', '12:00 م', '03:00 م'],
                        width: 780, 
                        height: 440,
                        calendarWorkingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
                        calendarHolidays: ['friday', 'saturday'],
                        calendarWorkStart: '09:00',
                        calendarWorkEnd: '17:00',
                        calendarBreakStart: '12:00',
                        calendarBreakEnd: '13:00',
                        calendarInterval: '30',
                        calendarNeedsConfirmation: true,
                        calendarMeetingTypes: ['personal', 'whatsapp'],
                        calendarMeetingType: 'personal',
                        calendarNameLabel: 'اسم المستشير',
                        calendarAddressLabel: 'المدينة / الفرع',
                        calendarPhoneLabel: 'رقم هاتف التواصل',
                        calendarEmailLabel: 'البريد الإلكتروني',
                        calendarDescLabel: 'موضوع الاستشارة المطلوب'
                      });
                    }
                  },
                  {
                    id: 'horizontal-quick-slots',
                    title: 'بطاقة اختيار الساعات السريعة ⏱️',
                    sub: 'عرض أفقي رشيق يركز على حجز الفترة الزمنية فوراً',
                    subCategories: ['slots', 'all'],
                    type: 'calendar',
                    preview: (
                      <div className="w-full h-18 bg-purple-50/50 rounded-xl p-1.5 flex flex-col justify-between border border-purple-200 text-right">
                        <span className="text-[9px] font-bold text-purple-950">⏱️ حجز فترات ومواعيد سريعة</span>
                        <div className="grid grid-cols-4 gap-1 text-[7.5px] text-center font-semibold text-purple-700">
                          <span className="bg-white border border-purple-200 rounded py-0.5">09:00 ص</span>
                          <span className="bg-white border border-purple-200 rounded py-0.5">11:30 ص</span>
                          <span className="bg-white border border-purple-200 rounded py-0.5">02:00 م</span>
                          <span className="bg-white border border-purple-200 rounded py-0.5">04:30 م</span>
                        </div>
                        <span className="text-[8px] bg-purple-600 text-white py-0.5 rounded text-center font-bold">
                          إضافة بطاقة الساعات (720 × 400)
                        </span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('calendar', 'اختر توقيت زيارتك المفضل', { 
                        backgroundColor: '#ffffff', 
                        borderRadius: 20, 
                        glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' 
                      }, { 
                        name: 'حجز فترات وساعات', 
                        calendarTitle: 'اختر توقيت زيارتك المفضل', 
                        calendarAccentColor: '#8b5cf6',
                        calendarSlots: ['09:00 ص', '11:30 ص', '02:00 م', '04:30 م'], 
                        width: 720, 
                        height: 400,
                        calendarInterval: '15'
                      });
                    }
                  },
                ],
                sheet: [
                  {
                    id: 'data-table',
                    title: 'جدول بيانات متطور (Sheet)',
                    sub: 'أعمدة وصفوف مع حالات الخدمة',
                    subCategories: ['data'],
                    type: 'table',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1 flex flex-col justify-between border border-neutral-200 text-right text-[8px]">
                        <div className="bg-neutral-100 p-1 rounded font-bold flex justify-between">
                          <span>الخدمة</span>
                          <span>الحالة</span>
                          <span>السعر</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 px-1">
                          <span>تصميم موقع</span>
                          <span className="text-emerald-600">مكتمل</span>
                          <span>$500</span>
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('table', 'جدول متابعة الخدمات والمشاريع', { borderRadius: 16, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'جدول sheet', width: 420, height: 200 });
                    }
                  },
                  {
                    id: 'cost-table',
                    title: 'جدول تكاليف وتسعير',
                    sub: 'عرض تفصيلي لأسعار الخدمات',
                    subCategories: ['pricing'],
                    type: 'table',
                    preview: (
                      <div className="w-full h-18 bg-neutral-50 rounded-xl p-1.5 flex flex-col justify-between border border-neutral-200 text-right text-[8px]">
                        <span className="font-bold text-neutral-800">قائمة الأسعار الرسمية</span>
                        <div className="space-y-0.5">
                          <div className="flex justify-between border-b pb-0.5">
                            <span>الاستضافة السحابية</span>
                            <span className="font-mono">$120</span>
                          </div>
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('table', 'جدول أسعار الخدمات والحلول البرمجية', { borderRadius: 16, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'جدول تكاليف', width: 400, height: 180 });
                    }
                  },
                ],
                html: [
                  {
                    id: 'custom-html',
                    title: 'حاوية كود HTML مخصص',
                    sub: 'إمكانية إدراج أي كود HTML/CSS',
                    subCategories: ['custom'],
                    type: 'html',
                    preview: (
                      <div className="w-full h-18 bg-neutral-900 rounded-xl p-1.5 flex flex-col justify-between font-mono text-white text-right">
                        <span className="text-[8px] text-emerald-400">&lt;div class="custom"&gt;</span>
                        <span className="text-[8px] text-sky-300">محتوى مخصص</span>
                        <span className="text-[8px] text-emerald-400">&lt;/div&gt;</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('html', '<div style="padding: 20px; text-align: center; color: #0071e3; font-weight: bold; font-family: sans-serif;">محتوى كود HTML مخصص ✦</div>', { borderRadius: 16, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'حاوية Html مخصصة', width: 380, height: 180 });
                    }
                  },
                  {
                    id: 'embed-module',
                    title: 'تضمين إطار خارجي (iFrame)',
                    sub: 'تضمين ويدجت ونماذج خارجية',
                    subCategories: ['embed'],
                    type: 'html',
                    preview: (
                      <div className="w-full h-18 bg-neutral-100 rounded-xl flex items-center justify-center border border-neutral-200">
                        <span className="text-[10px] font-mono text-neutral-600">&lt;iframe src="..." /&gt;</span>
                      </div>
                    ),
                    action: () => {
                      onAddElement('html', '<div style="padding: 16px; background: #f8fafc; border-radius: 12px; text-align: center; color: #334155; font-size: 13px;">إطار خارجي مدمج iFrame</div>', { borderRadius: 16 }, { name: 'إطار مدمج iFrame', width: 420, height: 220 });
                    }
                  },
                ],
                gallery: [
                  {
                    id: 'gallery-layout-1',
                    title: 'تنسيق ١: شاشة علوية ومصغرات سفلية',
                    sub: 'شاشة عرض رئيسية مع شريط ٥ مصغرات بالأسفل (المخطط ١)',
                    subCategories: ['top-main', 'all'],
                    type: 'gallery',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-col justify-between border border-neutral-200">
                        <div className="flex-1 bg-neutral-200/90 rounded-md flex items-center justify-center text-[8px] font-bold text-neutral-600">
                          شاشة عرض رئيسية 🖼️
                        </div>
                        <div className="h-3.5 grid grid-cols-5 gap-1 mt-1">
                          <div className="bg-[#0071e3] rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('gallery', 'معرض صور رئيسي', { borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, {
                        name: 'معرض صور 🖼️',
                        width: 540,
                        height: 380,
                        galleryConfig: {
                          layout: 'top-main',
                          activeImageIndex: 0,
                          showThumbnails: true,
                          gap: 8,
                          borderRadius: 12,
                          objectFit: 'cover',
                          items: [
                            { id: '1', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', title: 'طبيعة بحيرة وجبال' },
                            { id: '2', url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&auto=format&fit=crop&q=80', title: 'قمم الثلوج' },
                            { id: '3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80', title: 'غابة الصنوبر' },
                            { id: '4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80', title: 'شروق الشمس' },
                            { id: '5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80', title: 'تلال وسهول' }
                          ]
                        }
                      });
                    }
                  },
                  {
                    id: 'gallery-layout-2',
                    title: 'تنسيق ٢: شبكة مصغرات يسار وشاشة يمين',
                    sub: 'شبكة ٢×٢ من المصغرات باليسار وشاشة عرض باليمين (المخطط ٢)',
                    subCategories: ['left-thumbnails', 'all'],
                    type: 'gallery',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-row gap-1 border border-neutral-200">
                        <div className="w-[36%] h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                          <div className="bg-[#0071e3] rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                        </div>
                        <div className="flex-1 bg-neutral-200/90 rounded-md flex items-center justify-center text-[8px] font-bold text-neutral-600">
                          شاشة العرض
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('gallery', 'معرض مصغرات يسار', { borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, {
                        name: 'معرض صور شبكة يسار',
                        width: 560,
                        height: 380,
                        galleryConfig: {
                          layout: 'left-thumbnails',
                          activeImageIndex: 0,
                          showThumbnails: true,
                          gap: 8,
                          borderRadius: 12,
                          objectFit: 'cover',
                          items: [
                            { id: '1', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', title: 'طبيعة بحيرة وجبال' },
                            { id: '2', url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&auto=format&fit=crop&q=80', title: 'قمم الثلوج' },
                            { id: '3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80', title: 'غابة الصنوبر' },
                            { id: '4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80', title: 'شروق الشمس' },
                            { id: '5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80', title: 'تلال وسهول' }
                          ]
                        }
                      });
                    }
                  },
                  {
                    id: 'gallery-layout-3',
                    title: 'تنسيق ٣: شاشة يسار وشبكة مصغرات يمين',
                    sub: 'شاشة عرض باليسار وشبكة ٢×٢ مصغرات باليمين (المخطط ٣)',
                    subCategories: ['right-thumbnails', 'all'],
                    type: 'gallery',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-row gap-1 border border-neutral-200">
                        <div className="flex-1 bg-neutral-200/90 rounded-md flex items-center justify-center text-[8px] font-bold text-neutral-600">
                          شاشة العرض
                        </div>
                        <div className="w-[36%] h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                          <div className="bg-[#0071e3] rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                          <div className="bg-neutral-300 rounded-xs" />
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('gallery', 'معرض مصغرات يمين', { borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, {
                        name: 'معرض صور شبكة يمين',
                        width: 560,
                        height: 380,
                        galleryConfig: {
                          layout: 'right-thumbnails',
                          activeImageIndex: 0,
                          showThumbnails: true,
                          gap: 8,
                          borderRadius: 12,
                          objectFit: 'cover',
                          items: [
                            { id: '1', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', title: 'طبيعة بحيرة وجبال' },
                            { id: '2', url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&auto=format&fit=crop&q=80', title: 'قمم الثلوج' },
                            { id: '3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80', title: 'غابة الصنوبر' },
                            { id: '4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80', title: 'شروق الشمس' },
                            { id: '5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80', title: 'تلال وسهول' }
                          ]
                        }
                      });
                    }
                  },
                  {
                    id: 'gallery-layout-4',
                    title: 'تنسيق ٤: شاشة يسار ومصغرات رأسية',
                    sub: 'شاشة عرض عريضة مع عمود مصغرات متتالي (المخطط ٤)',
                    subCategories: ['left-main-row', 'all'],
                    type: 'gallery',
                    preview: (
                      <div className="w-full h-18 bg-white rounded-xl p-1.5 flex flex-row gap-1 border border-neutral-200">
                        <div className="w-[60%] bg-neutral-200/90 rounded-md flex items-center justify-center text-[8px] font-bold text-neutral-600">
                          شاشة العرض
                        </div>
                        <div className="flex-1 flex flex-col justify-between gap-0.5">
                          <div className="flex-1 bg-[#0071e3] rounded-xs" />
                          <div className="flex-1 bg-neutral-300 rounded-xs" />
                          <div className="flex-1 bg-neutral-300 rounded-xs" />
                          <div className="flex-1 bg-neutral-300 rounded-xs" />
                        </div>
                      </div>
                    ),
                    action: () => {
                      onAddElement('gallery', 'معرض مصغرات عمودي', { borderRadius: 20, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, {
                        name: 'معرض صور عمودي',
                        width: 540,
                        height: 380,
                        galleryConfig: {
                          layout: 'left-main-row',
                          activeImageIndex: 0,
                          showThumbnails: true,
                          gap: 8,
                          borderRadius: 12,
                          objectFit: 'cover',
                          items: [
                            { id: '1', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', title: 'طبيعة بحيرة وجبال' },
                            { id: '2', url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&auto=format&fit=crop&q=80', title: 'قمم الثلوج' },
                            { id: '3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80', title: 'غابة الصنوبر' },
                            { id: '4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80', title: 'شروق الشمس' },
                            { id: '5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80', title: 'تلال وسهول' }
                          ]
                        }
                      });
                    }
                  },
                ],
              };

              // ==========================================
              // VIEW 1: Grid of Squares & Slide/Page Tabs
              // ==========================================
              if (!activeAddCategory) {
                return (
                  <div className="space-y-4 pb-6 text-right">
                    {/* Top Segment Control */}
                    <div className="flex bg-neutral-100 p-1 rounded-xl border border-black/[0.04] mb-3">
                      <button
                        type="button"
                        onClick={() => setAddMenuMode('element')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          addMenuMode === 'element'
                            ? 'bg-white text-[#0071e3] shadow-2xs'
                            : 'text-neutral-500 hover:text-black'
                        }`}
                      >
                        إضافة عنصر
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddMenuMode('slide')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          addMenuMode === 'slide'
                            ? 'bg-white text-[#0071e3] shadow-2xs'
                            : 'text-neutral-500 hover:text-black'
                        }`}
                      >
                        إضافة شريحة
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddMenuMode('page')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          addMenuMode === 'page'
                            ? 'bg-white text-[#0071e3] shadow-2xs'
                            : 'text-neutral-500 hover:text-black'
                        }`}
                      >
                        إضافة صفحة
                      </button>
                    </div>

                    {/* RENDER MODE: element */}
                    {addMenuMode === 'element' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-neutral-600">
                            اختر عنصراً لإضافته أو تخصيصه:
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-400">
                            12 عنصر متوفر
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {ADD_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setActiveAddCategory(cat.id);
                                const firstSub = SUBCATEGORIES_MAP[cat.id]?.[0]?.id || 'all';
                                setSelectedSubCategory(firstSub);
                              }}
                              className="aspect-square bg-white hover:bg-neutral-50/80 border-2 border-neutral-200/90 hover:border-[#0071e3] rounded-2xl p-3 flex flex-col items-center justify-center gap-2 shadow-2xs hover:shadow-md transition-all active:scale-95 cursor-pointer group text-center"
                            >
                              <div className="w-11 h-11 rounded-xl bg-neutral-100/80 group-hover:bg-[#0071e3]/10 text-neutral-700 group-hover:text-[#0071e3] flex items-center justify-center transition-colors">
                                {React.cloneElement(cat.icon as React.ReactElement<any>, { size: 22, strokeWidth: 2 })}
                              </div>
                              <span className="text-xs font-bold text-neutral-800 group-hover:text-[#0071e3] transition-colors leading-tight line-clamp-2 px-1">
                                {cat.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RENDER MODE: slide */}
                    {addMenuMode === 'slide' && (
                      <div className="space-y-4">
                        {/* 1. Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onAddSlide()}
                            className="flex flex-col items-center justify-center p-3 bg-[#0071e3]/5 hover:bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-2xl transition-all cursor-pointer font-bold text-xs gap-1.5 shadow-2xs active:scale-95 text-center"
                          >
                            <Plus size={16} strokeWidth={2.5} />
                            <span>إضافة شريحة فارغة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCopyCurrentSlide && onCopyCurrentSlide(activeSlideId)}
                            className="flex flex-col items-center justify-center p-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80 rounded-2xl transition-all cursor-pointer font-bold text-xs gap-1.5 shadow-2xs active:scale-95 text-center"
                          >
                            <Copy size={15} />
                            <span>نسخ الشريحة (Copy)</span>
                          </button>
                        </div>

                        {/* 2. Ready Slides Section */}
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-black text-neutral-500 border-b border-neutral-100 pb-1.5 px-1 tracking-wide">
                            اختر فئة لتصفح الشرائح المصممة مسبقاً:
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {READY_SLIDE_CATEGORIES.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveTemplateCategory(cat.id)}
                                className={`p-2.5 rounded-xl border-2 text-right transition-all hover:shadow-sm active:scale-97 cursor-pointer flex flex-col gap-1 text-right ${
                                  activeTemplateCategory === cat.id
                                    ? 'border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3]'
                                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-800'
                                }`}
                              >
                                <div className="text-lg mb-0.5">{cat.icon}</div>
                                <span className="text-[11px] font-black leading-tight">
                                  {cat.name}
                                </span>
                                <span className="text-[9px] text-neutral-400 font-medium leading-normal line-clamp-2">
                                  {cat.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RENDER MODE: page */}
                    {addMenuMode === 'page' && (
                      <div className="space-y-4">
                        {/* 1. Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const pageName = prompt('أدخل اسم الصفحة الجديدة:');
                              if (pageName) onAddPage(pageName);
                            }}
                            className="flex flex-col items-center justify-center p-3 bg-[#0071e3]/5 hover:bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-2xl transition-all cursor-pointer font-bold text-xs gap-1.5 shadow-2xs active:scale-95 text-center"
                          >
                            <Plus size={16} strokeWidth={2.5} />
                            <span>إضافة صفحة فارغة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onCopyCurrentPage && onCopyCurrentPage(currentPage.id)}
                            className="flex flex-col items-center justify-center p-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80 rounded-2xl transition-all cursor-pointer font-bold text-xs gap-1.5 shadow-2xs active:scale-95 text-center"
                          >
                            <Copy size={15} />
                            <span>نسخ الصفحة (Copy)</span>
                          </button>
                        </div>

                        {/* 2. Ready Site Template Section */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-neutral-700 border-b border-neutral-100 pb-1.5 px-1">
                            موقع جاهز للتعديل والاستخدام:
                          </h4>
                          <button
                            type="button"
                            onClick={() => onApplyFreeStarterTemplate && onApplyFreeStarterTemplate()}
                            className="w-full bg-gradient-to-br from-[#1F5D50]/5 to-[#1F5D50]/[0.02] hover:from-[#1F5D50]/10 hover:to-[#1F5D50]/5 border border-[#1F5D50]/20 hover:border-[#1F5D50] rounded-2xl p-3.5 flex flex-col text-right transition-all hover:shadow-xs active:scale-99 cursor-pointer group gap-1.5"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-neutral-800 group-hover:text-[#1F5D50] transition-colors">
                                القالب الأساسي: موقع تعريفي بخمس صفحات
                              </span>
                              <span className="text-[10px] text-[#1F5D50] font-semibold bg-[#1F5D50]/10 border border-[#1F5D50]/15 px-1.5 py-0.5 rounded-md">
                                5 صفحات
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                              مدخل، من نحن، أعمالنا، الأسعار، واتصل بنا — كل صفحة مرتبطة بالأخرى عبر شريط التنقل العلوي. سيستبدل هذا كل صفحات موقعك الحالية.
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // ==========================================
              // SPECIAL VIEW: إضافة صورة (الأبواب الثلاثة كما في الرسومات اليدوية)
              // ==========================================
              if (activeAddCategory === 'image') {
                return (
                  <ImageDrawerSection
                    onAddImage={handleAddImageElement}
                    onBack={() => setActiveAddCategory(null)}
                    canvasElements={elements}
                  />
                );
              }

              // ==========================================
              // SPECIAL VIEW: إضافة نص (كما في الرسم اليدوي للمستخدم تماماً)
              // ==========================================
              if (activeAddCategory === 'text') {
                return (
                  <div className="space-y-4 pb-8" dir="rtl">
                    {/* Top Bar: Title "اضافة نص" & Back Button */}
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setActiveAddCategory(null)}
                        className="flex items-center gap-1 text-xs font-bold text-[#0071e3] hover:text-[#005bb5] bg-[#0071e3]/10 hover:bg-[#0071e3]/15 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <ChevronRight size={15} strokeWidth={2.4} />
                        <span>رجوع للعناصر</span>
                      </button>

                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                        <Type size={16} className="text-[#0071e3]" />
                        <span>اضافة نص</span>
                      </h3>
                    </div>

                    {/* Notice bar: فقط النصوص الممكنة اضافتها */}
                    <div className="bg-neutral-50/90 border border-neutral-200/80 px-3 py-1.5 rounded-xl flex items-center justify-between">
                      <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                        <span>✦</span>
                        <span>فقط النصوص الممكنة إضافتها:</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono font-semibold">
                        4 أحجام أساسية
                      </span>
                    </div>

                    {/* The 4 Core Text Blocks (as in sketch with pixel side tags) */}
                    <div className="space-y-2.5">
                      {/* 1. عنوان رئيسي - 40 PXL */}
                      <div className="flex items-stretch gap-2.5">
                        <div className="w-14 shrink-0 bg-neutral-100/90 border border-neutral-300 rounded-xl flex flex-col items-center justify-center text-center p-1 select-none shadow-3xs">
                          <span className="font-mono font-black text-sm text-[#1d1d1f] leading-none">40</span>
                          <span className="font-mono font-bold text-[9px] text-neutral-500 tracking-wider mt-0.5">PXL</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddElement(
                              'heading',
                              'عنوان رئيسي كبير',
                              { fontSize: 40, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' },
                              { name: 'عنوان رئيسي (40px)', width: 560, height: 75 }
                            );
                          }}
                          className="flex-1 bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right transition-all shadow-2xs hover:shadow-md cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg sm:text-xl font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors leading-tight">
                              عنوان رئيسي
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              + إضافة
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            ترويسة عريضة وبارزة للموقع والشاشات الرئيسية
                          </p>
                        </button>
                      </div>

                      {/* 2. عنوان فرعي - 25 PXL */}
                      <div className="flex items-stretch gap-2.5">
                        <div className="w-14 shrink-0 bg-neutral-100/90 border border-neutral-300 rounded-xl flex flex-col items-center justify-center text-center p-1 select-none shadow-3xs">
                          <span className="font-mono font-black text-sm text-[#1d1d1f] leading-none">25</span>
                          <span className="font-mono font-bold text-[9px] text-neutral-500 tracking-wider mt-0.5">PXL</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddElement(
                              'heading',
                              'عنوان فرعي تكميلي',
                              { fontSize: 25, fontWeight: '600', color: '#1d1d1f', textAlign: 'right' },
                              { name: 'عنوان فرعي (25px)', width: 440, height: 55 }
                            );
                          }}
                          className="flex-1 bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right transition-all shadow-2xs hover:shadow-md cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors leading-tight">
                              عنوان فرعي
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              + إضافة
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            عنوان للأقسام والفقرات الداخلية
                          </p>
                        </button>
                      </div>

                      {/* 3. مسند نصي - 15 PXL */}
                      <div className="flex items-stretch gap-2.5">
                        <div className="w-14 shrink-0 bg-neutral-100/90 border border-neutral-300 rounded-xl flex flex-col items-center justify-center text-center p-1 select-none shadow-3xs">
                          <span className="font-mono font-black text-sm text-[#1d1d1f] leading-none">15</span>
                          <span className="font-mono font-bold text-[9px] text-neutral-500 tracking-wider mt-0.5">PXL</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddElement(
                              'paragraph',
                              'هذا مسند نصي لتفاصيل الشرح والمعلومات التكميلية، يمكنك استبداله أو تعديله بكل مرونة.',
                              { fontSize: 15, fontWeight: 'normal', color: '#4b5563', textAlign: 'right', lineHeight: 1.6 },
                              { name: 'مسند نصي (15px)', width: 460, height: 75 }
                            );
                          }}
                          className="flex-1 bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right transition-all shadow-2xs hover:shadow-md cursor-pointer group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-normal text-neutral-800 group-hover:text-[#0071e3] transition-colors leading-tight">
                              مسند نصي
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              + إضافة
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            فقرة نصية لشرح وتفصيل المحتوى
                          </p>
                        </button>
                      </div>

                      {/* 4. حقل ادخال - 15 PXL مع السهم والملاحظة من الرسم اليدوي */}
                      <div className="space-y-1.5">
                        <div className="flex items-stretch gap-2.5">
                          <div className="w-14 shrink-0 bg-neutral-100/90 border border-neutral-300 rounded-xl flex flex-col items-center justify-center text-center p-1 select-none shadow-3xs">
                            <span className="font-mono font-black text-sm text-[#1d1d1f] leading-none">15</span>
                            <span className="font-mono font-bold text-[9px] text-neutral-500 tracking-wider mt-0.5">PXL</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onAddElement(
                                'input',
                                'أدخل بريدك الإلكتروني أو بياناتك هنا...',
                                { fontSize: 15, borderRadius: 12 },
                                { name: 'حقل إدخال (15px)', width: 340, height: 48 }
                              );
                            }}
                            className="flex-1 bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right transition-all shadow-2xs hover:shadow-md cursor-pointer group active:scale-[0.99]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-neutral-800 group-hover:text-[#0071e3] transition-colors leading-tight">
                                حقل ادخال
                              </span>
                              <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                + إضافة
                              </span>
                            </div>
                            <div className="mt-1.5 px-2.5 py-1 bg-neutral-100 rounded-lg border border-neutral-200 text-[11px] text-neutral-400 font-normal">
                              حقل إدخال تفاعلي...
                            </div>
                          </button>
                        </div>

                        {/* Note callout as handwritten in sketch with arrow */}
                        <div className="mr-16 bg-amber-50/80 border border-amber-200/90 rounded-xl p-2.5 text-right flex items-start gap-2 shadow-3xs">
                          <span className="text-amber-600 text-sm font-bold shrink-0">↙</span>
                          <div className="text-[11px] text-amber-900 leading-snug">
                            <span className="font-bold block text-amber-950 mb-0.5">
                              حقل إدخال نص تفاعلي:
                            </span>
                            حقل ادخال نص في حالة المعاينة أو على ويب لأخذ معلومات من المتصفح
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="pt-2 border-t border-neutral-200" />

                    {/* Compound texts section: وعرض بعض النصوص المركبة بتنسيقات مختلفة */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-right px-0.5">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">
                            نصوص مركبة بتنسيقات مختلفة:
                          </h4>
                          <p className="text-[10px] text-neutral-400">
                            تراكيب نصوص منسقة جاهزة للإضافة بنقرة واحدة
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full font-bold">
                          7 نماذج
                        </span>
                      </div>

                      {/* Compound items list */}
                      <div className="space-y-2.5">
                        {/* 1. Hero Title + Subtitle */}
                        <div 
                          onClick={() => {
                            onAddElement(
                              'heading',
                              'بناء مواقع المستقبل بهوية عربية فاخرة',
                              { fontSize: 30, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' },
                              {
                                name: 'ترويسة مع نص وصفي',
                                width: 560,
                                height: 110,
                                compoundType: 'hero',
                                subContent: 'مساحة عمل حرة تمنحك السيطرة المطلقة على كل تفصيلة في التصميم بدقة وسرعة فائقة.'
                              }
                            );
                          }}
                          className="bg-white hover:bg-neutral-50/80 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right cursor-pointer transition-all shadow-2xs hover:shadow-md group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400">
                              ترويسة وعنوان مع شرح
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                              + إضافة
                            </span>
                          </div>
                          <div className="space-y-1 pr-1 border-r-2 border-[#0071e3]/40">
                            <div className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors leading-tight">
                              بناء مواقع المستقبل بهوية فاخرة
                            </div>
                            <div className="text-[10.5px] text-neutral-500 leading-snug">
                              مساحة عمل حرة تمنحك السيطرة المطلقة على كل تفصيلة...
                            </div>
                          </div>
                        </div>

                        {/* 2. Badge Tag + Heading */}
                        <div 
                          onClick={() => {
                            onAddElement(
                              'heading',
                              'انطلاقة الجيل الجديد من تصاميم الويب',
                              { fontSize: 26, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' },
                              {
                                name: 'شارة ترويجية مع عنوان',
                                width: 480,
                                height: 95,
                                compoundType: 'badge-heading',
                                badgeText: '✦ جديد وحصري'
                              }
                            );
                          }}
                          className="bg-white hover:bg-neutral-50/80 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right cursor-pointer transition-all shadow-2xs hover:shadow-md group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400">
                              شارة تعريفية مع عنوان
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                              + إضافة
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0071e3]/10 text-[#0071e3]">
                              ✦ جديد وحصري
                            </span>
                            <div className="text-sm font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors leading-tight">
                              انطلاقة الجيل الجديد من تصاميم الويب
                            </div>
                          </div>
                        </div>

                        {/* 3. Quote + Author Citation */}
                        <div 
                          onClick={() => {
                            onAddElement(
                              'paragraph',
                              '«البساطة والتصميم المتقن هما جوهر التجربة الرقمية الناجحة.»',
                              { fontSize: 16, fontStyle: 'italic', color: '#1d1d1f', textAlign: 'right' },
                              {
                                name: 'اقتباس مع اسم الكاتب',
                                width: 440,
                                height: 100,
                                compoundType: 'quote',
                                authorText: '— ستيف جوبز'
                              }
                            );
                          }}
                          className="bg-white hover:bg-neutral-50/80 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right cursor-pointer transition-all shadow-2xs hover:shadow-md group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400">
                              اقتباس مع اسم الكاتب
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                              + إضافة
                            </span>
                          </div>
                          <div className="flex items-start gap-2 pr-1 border-r-3 border-amber-400">
                            <span className="text-xl text-amber-500 font-serif leading-none select-none">❝</span>
                            <div className="flex-1 space-y-0.5">
                              <div className="text-xs italic text-neutral-800 leading-snug">
                                «البساطة والتصميم المتقن هما جوهر التجربة الرقمية...»
                              </div>
                              <div className="text-[10px] font-semibold text-neutral-500">
                                — ستيف جوبز
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4. Stat Number + Label */}
                        <div 
                          onClick={() => {
                            onAddElement(
                              'heading',
                              '+99.9%',
                              { fontSize: 38, fontWeight: 'bold', color: '#0071e3', textAlign: 'right' },
                              {
                                name: 'رقم إحصائي مع تسمية',
                                width: 280,
                                height: 90,
                                compoundType: 'stat',
                                subContent: 'نسبة رضا وثقة العملاء في استقرار الخدمة'
                              }
                            );
                          }}
                          className="bg-white hover:bg-neutral-50/80 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right cursor-pointer transition-all shadow-2xs hover:shadow-md group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400">
                              رقم إحصائي بارز
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                              + إضافة
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono font-black text-2xl text-[#0071e3] leading-none">
                              +99.9%
                            </span>
                            <span className="text-xs font-semibold text-neutral-600 truncate">
                              نسبة رضا وثقة العملاء
                            </span>
                          </div>
                        </div>

                        {/* 5. Feature Checklist */}
                        <div 
                          onClick={() => {
                            onAddElement(
                              'paragraph',
                              'أهم المزايا والمواصفات',
                              { fontSize: 18, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' },
                              {
                                name: 'ترويسة ميزات مع نقاط',
                                width: 400,
                                height: 125,
                                compoundType: 'checklist',
                                subContent: '✓ سرعة تحميل فائقة وتوافق كامل\n✓ خوادم سحابية آمنة مع نسخ دوري\n✓ دعم فني مباشر واستشارات مجانية'
                              }
                            );
                          }}
                          className="bg-white hover:bg-neutral-50/80 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right cursor-pointer transition-all shadow-2xs hover:shadow-md group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400">
                              ترويسة مع قائمة نقاط
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                              + إضافة
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-neutral-900">أهم المزايا والمواصفات</div>
                            <div className="text-[10.5px] text-neutral-600 space-y-0.5">
                              <div>✓ سرعة تحميل فائقة وتوافق كامل</div>
                              <div>✓ خوادم سحابية آمنة مع نسخ دوري</div>
                            </div>
                          </div>
                        </div>

                        {/* 6. Accent Bordered Headline */}
                        <div 
                          onClick={() => {
                            onAddElement(
                              'heading',
                              'رؤيتنا للمستقبل والريادة',
                              { fontSize: 22, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' },
                              {
                                name: 'عنوان جانبي مع خط ملون',
                                width: 420,
                                height: 85,
                                compoundType: 'accent-border',
                                subContent: 'تمكين رواد الأعمال والمصممين من ابتكار تجارب ويب فريدة وغير مسبوقة.'
                              }
                            );
                          }}
                          className="bg-white hover:bg-neutral-50/80 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right cursor-pointer transition-all shadow-2xs hover:shadow-md group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400">
                              عنوان جانبي مع خط بارز
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                              + إضافة
                            </span>
                          </div>
                          <div className="pr-2 border-r-3 border-[#0071e3] space-y-0.5">
                            <div className="text-xs font-bold text-neutral-900 group-hover:text-[#0071e3] transition-colors">
                              رؤيتنا للمستقبل والريادة
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              تمكين رواد الأعمال والمصممين من ابتكار تجارب ويب فريدة...
                            </div>
                          </div>
                        </div>

                        {/* 7. Product Title + Price Tag */}
                        <div 
                          onClick={() => {
                            onAddElement(
                              'card',
                              'باقة الانطلاق للأعمال',
                              { fontSize: 15, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' },
                              {
                                name: 'ترويسة منتج مع سعر',
                                width: 320,
                                height: 105,
                                compoundType: 'price-tag',
                                badgeText: '١٩٩ ر.س / شهرياً',
                                subContent: 'اشتراك شهري شامل كافة الخصائص والدعم الفني.'
                              }
                            );
                          }}
                          className="bg-white hover:bg-neutral-50/80 border-2 border-neutral-200 hover:border-[#0071e3] rounded-2xl p-3 text-right cursor-pointer transition-all shadow-2xs hover:shadow-md group active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-neutral-400">
                              عنوان منتج مع سعر
                            </span>
                            <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md">
                              + إضافة
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-900">
                              باقة الانطلاق للأعمال
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 font-bold text-[10px] rounded-md">
                              ١٩٩ ر.س / شهرياً
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ==========================================
              // VIEW 2: Detail with Subcategories Bar (كما في الصورة رقم ٢)
              // ==========================================
              const currentCategoryObj = ADD_CATEGORIES.find(c => c.id === activeAddCategory);
              const currentSubCats = SUBCATEGORIES_MAP[activeAddCategory] || [{ id: 'all', label: 'الكل' }];
              const currentTemplates = (TEMPLATES_MAP[activeAddCategory] || []).filter(t => {
                if (activeAddCategory === 'shape') {
                  if (selectedSubCategory === 'all') {
                    return !t.subCategories.includes('undraw');
                  }
                  if (selectedSubCategory === 'undraw') {
                    return t.subCategories.includes('undraw');
                  }
                  if (selectedSubCategory === 'boxes') {
                    return t.subCategories.includes('boxes') || t.subCategories.includes('cards');
                  }
                  if (selectedSubCategory === 'text-boxes') {
                    return t.subCategories.includes('text-boxes');
                  }
                  if (selectedSubCategory === 'geometric') {
                    return t.subCategories.includes('geometric');
                  }
                  if (selectedSubCategory === 'organic') {
                    return t.subCategories.includes('organic') || t.subCategories.includes('shapes') || t.subCategories.includes('badges');
                  }
                  if (selectedSubCategory === 'fluid') {
                    return t.subCategories.includes('fluid') || t.subCategories.includes('graphic') || t.subCategories.includes('dividers') || t.subCategories.includes('brush');
                  }
                }
                if (activeAddCategory === 'icons') {
                  if (selectedSubCategory === 'all') return true;
                  if (selectedSubCategory === 'social') {
                    const socialIds = [
                      'icon-whatsapp', 'icon-instagram', 'icon-snapchat', 'icon-tiktok', 'icon-youtube',
                      'icon-twitter', 'icon-facebook', 'icon-linkedin', 'icon-telegram', 'icon-pinterest',
                      'icon-github', 'icon-discord', 'icon-reddit', 'icon-skype', 'icon-spotify'
                    ];
                    return socialIds.includes(t.id);
                  }
                  if (selectedSubCategory === 'utility') {
                    const utilityIds = [
                      'icon-home', 'icon-phone', 'icon-mail', 'icon-user', 'icon-calendar', 'icon-clock',
                      'icon-search', 'icon-settings', 'icon-lock', 'icon-unlock', 'icon-trash', 'icon-edit',
                      'icon-save', 'icon-download', 'icon-upload', 'icon-share', 'icon-heart', 'icon-star',
                      'icon-info', 'icon-check'
                    ];
                    return utilityIds.includes(t.id);
                  }
                  if (selectedSubCategory === 'separators') {
                    const separatorIds = [
                      'icon-syrian-pound', 'icon-exclamation', 'icon-question', 'icon-price-tag',
                      'icon-sep-stars', 'icon-sep-diamond', 'icon-sep-wave', 'icon-sep-dots',
                      'icon-alert', 'icon-gift', 'icon-fire', 'icon-crown', 'icon-trophy', 'icon-bell', 'icon-dollar'
                    ];
                    return separatorIds.includes(t.id);
                  }
                }
                return selectedSubCategory === 'all' || t.subCategories.includes(selectedSubCategory);
              });

              if (activeAddCategory === 'iconify') {
                const popularIcons = [
                  'lucide:home', 'lucide:user', 'lucide:settings', 'lucide:search', 'lucide:bell', 'lucide:mail',
                  'lucide:phone', 'lucide:calendar', 'lucide:check-circle', 'lucide:alert-circle', 'lucide:info', 'lucide:help-circle',
                  'lucide:shopping-cart', 'lucide:heart', 'lucide:star', 'lucide:map-pin', 'lucide:camera', 'lucide:video',
                  'lucide:folder', 'lucide:download', 'lucide:upload', 'lucide:share-2', 'lucide:lock', 'lucide:unlock',
                  'tabler:brand-whatsapp', 'tabler:brand-instagram', 'tabler:brand-youtube', 'tabler:brand-facebook', 'tabler:brand-linkedin', 'tabler:brand-tiktok'
                ];
                const activeResults = iconifySearch.trim() ? iconifyResults : popularIcons;

                return (
                  <div className="space-y-3.5 pb-6 text-right" dir="rtl">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAddCategory(null);
                          setIconifySearch('');
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-[#0071e3] hover:text-[#005bb5] bg-[#0071e3]/10 hover:bg-[#0071e3]/15 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <ChevronRight size={15} strokeWidth={2.4} />
                        <span>رجوع للعناصر</span>
                      </button>

                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                        <span className="text-[#0071e3]">🔍</span>
                        <span>مكتبة أيقونات Iconify</span>
                      </h3>
                    </div>

                    {/* Description */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-1">
                      <h4 className="text-xs font-bold text-blue-900">ابحث عن ملايين الأيقونات العالمية</h4>
                      <p className="text-[10px] text-blue-700 leading-normal">
                        اكتب اسم أي موضوع بالإنجليزية (مثل: <code className="bg-white px-1 py-0.5 rounded border font-mono">user</code>، <code className="bg-white px-1 py-0.5 rounded border font-mono">arrow</code>، <code className="bg-white px-1 py-0.5 rounded border font-mono">heart</code>) للبحث الفوري في كافة المكتبات العالمية!
                      </p>
                    </div>

                    {/* Live Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={iconifySearch}
                        onChange={(e) => setIconifySearch(e.target.value)}
                        placeholder="ابحث بالأجنبية... (مثال: heart, user, search)"
                        className="w-full text-xs font-semibold px-3 py-2.5 pr-8 bg-white rounded-xl border border-neutral-300 focus:border-[#0071e3] focus:outline-none transition-all shadow-3xs text-right"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        {isSearchingIconify ? (
                          <div className="w-4 h-4 border-2 border-neutral-300 border-t-[#0071e3] rounded-full animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}
                      </div>
                    </div>

                    {/* Results Label */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-neutral-500">
                        {iconifySearch.trim() ? `نتائج البحث لـ "${iconifySearch}"` : 'أيقونات شائعة ومقترحة:'}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {activeResults.length} أيقونة معروضة
                      </span>
                    </div>

                    {/* Icons Grid */}
                    {activeResults.length === 0 && !isSearchingIconify ? (
                      <div className="py-10 text-center text-xs text-neutral-400 font-medium">
                        لا توجد أيقونات تطابق بحثك. جرب كلمات أخرى مثل chart, star, phone.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {activeResults.map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              const simpleName = iconName.split(':').pop() || 'أيقونة';
                              onAddElement(
                                'icon', 
                                'iconify:' + iconName, 
                                { color: '#0071e3' }, 
                                { name: `أيقونة ${simpleName}`, width: 64, height: 64 }
                              );
                            }}
                            className="bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-[#0071e3] rounded-xl p-2.5 aspect-square flex flex-col items-center justify-center gap-1.5 shadow-3xs hover:shadow-sm transition-all active:scale-95 cursor-pointer group text-center"
                            title={`إدراج ${iconName}`}
                          >
                            <div className="text-2xl text-neutral-700 group-hover:text-[#0071e3] transition-colors flex items-center justify-center w-8 h-8">
                              <Icon icon={iconName} />
                            </div>
                            <span className="text-[8px] text-neutral-400 group-hover:text-neutral-700 font-mono truncate max-w-full block" dir="ltr">
                              {iconName.split(':').pop()}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3.5 pb-6">
                  {/* Top Bar: Title "اضافة نص" (as handwritten in sketch) & Back Button */}
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setActiveAddCategory(null)}
                      className="flex items-center gap-1 text-xs font-bold text-[#0071e3] hover:text-[#005bb5] bg-[#0071e3]/10 hover:bg-[#0071e3]/15 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronRight size={15} strokeWidth={2.4} />
                      <span>رجوع للعناصر</span>
                    </button>

                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                      <span className="text-[#0071e3]">{currentCategoryObj?.icon}</span>
                      <span>اضافة {currentCategoryObj?.name}</span>
                    </h3>
                  </div>

                  {/* Horizontal Capsule Bar (كما في الصورة رقم ٢ تماماً مع سهم عند عدم الاتساع) */}
                  <div className="relative flex items-center border-2 border-neutral-300 bg-white rounded-full p-1 shadow-2xs">
                    {/* Left Arrow Button (سهم التمرير لليسار كما في الصورة رقم ٢) */}
                    <button
                      type="button"
                      onClick={() => scrollSubCategories('left')}
                      className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs"
                      title="تمرير لليسار لرؤية المزيد"
                      aria-label="تمرير لليسار"
                    >
                      <ChevronLeft size={15} strokeWidth={2.4} />
                    </button>

                    {/* Scrollable Subcategories Pills Track */}
                    <div
                      ref={subCategoryScrollRef}
                      className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-1 scroll-smooth flex-1"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {currentSubCats.map((sub) => {
                        const isSubActive = selectedSubCategory === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSelectedSubCategory(sub.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              isSubActive
                                ? 'bg-[#0071e3] text-white shadow-xs font-bold'
                                : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Arrow Button */}
                    <button
                      type="button"
                      onClick={() => scrollSubCategories('right')}
                      className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-2xs"
                      title="تمرير لليمين"
                      aria-label="تمرير لليمين"
                    >
                      <ChevronRight size={15} strokeWidth={2.4} />
                    </button>
                  </div>

                  {/* Templates & Examples Grid */}
                  <div className="space-y-2.5">
                    {activeAddCategory === 'calendar' && (
                      <div className="p-3.5 bg-gradient-to-b from-blue-50/80 to-indigo-50/40 border-2 border-[#0071e3]/30 rounded-2xl text-right space-y-3.5 shadow-sm" dir="rtl">
                        {/* Header with expand/collapse toggle */}
                        <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
                              style={{ backgroundColor: calAddAccentColor }}
                            >
                              ⚙️
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-neutral-900">ضبط إعدادات بطاقة التقويم قبل الإضافة</h4>
                              <p className="text-[10px] text-neutral-500">حدد ساعات الدوام، العطل، الألوان وحقول الحجز</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCalAddSettingsOpen(prev => !prev)}
                            className="text-[10px] font-bold text-[#0071e3] bg-white px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            {calAddSettingsOpen ? 'طي الإعدادات ▲' : 'توسيع الإعدادات ▼'}
                          </button>
                        </div>

                        {calAddSettingsOpen && (
                          <div className="space-y-3 pt-1 text-xs">
                            {/* 1. عنوان التقويم الرئيسي */}
                            <div className="space-y-1">
                              <label className="text-[10.5px] font-bold text-neutral-800 block">عنوان التقويم ورأس النموذج:</label>
                              <input
                                type="text"
                                value={calAddTitle}
                                onChange={(e) => setCalAddTitle(e.target.value)}
                                placeholder="مثال: حجز موعد استشارة جديدة"
                                className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-neutral-300 focus:outline-none transition-all shadow-3xs"
                              />
                            </div>

                            {/* 2. اللون الرئيسي للبطاقة */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">ألوان البطاقة والتفاعل النشط (Accent Color):</span>
                              <div className="flex flex-wrap gap-1.5 mb-1.5">
                                {[
                                  { hex: '#0071e3', name: 'أزرق آبل' },
                                  { hex: '#10b981', name: 'زمردي' },
                                  { hex: '#ec4899', name: 'وردي' },
                                  { hex: '#8b5cf6', name: 'بنفسجي' },
                                  { hex: '#f97316', name: 'برتقالي' },
                                  { hex: '#ef4444', name: 'أحمر قاني' },
                                  { hex: '#111827', name: 'فحمي' }
                                ].map((color) => {
                                  const isSelected = calAddAccentColor.toLowerCase() === color.hex.toLowerCase();
                                  return (
                                    <button
                                      key={color.hex}
                                      type="button"
                                      onClick={() => setCalAddAccentColor(color.hex)}
                                      className={`w-6 h-6 rounded-full border transition-all relative flex items-center justify-center cursor-pointer ${
                                        isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500 border-transparent' : 'border-neutral-200 hover:scale-105'
                                      }`}
                                      style={{ backgroundColor: color.hex }}
                                      title={color.name}
                                    >
                                      {isSelected && <span className="text-[9px] text-white">✓</span>}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-neutral-500">رمز اللون المخصص (Hex):</span>
                                <input
                                  type="text"
                                  value={calAddAccentColor}
                                  onChange={(e) => setCalAddAccentColor(e.target.value)}
                                  placeholder="#0071e3"
                                  className="w-24 p-1 bg-white rounded-lg border border-neutral-300 font-mono text-center text-xs focus:outline-none uppercase"
                                />
                              </div>
                            </div>

                            {/* 3. أيام العمل والعطل الأسبوعية */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">أيام العمل والعطل الأسبوعية:</span>
                              <p className="text-[9.5px] text-neutral-500">اضغط على اليوم للتبديل بين يوم عمل متاح (ملوّن) أو عطلة (رمادي):</p>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { id: 'sunday', name: 'الأحد' },
                                  { id: 'monday', name: 'الإثنين' },
                                  { id: 'tuesday', name: 'الثلاثاء' },
                                  { id: 'wednesday', name: 'الأربعاء' },
                                  { id: 'thursday', name: 'الخميس' },
                                  { id: 'friday', name: 'الجمعة' },
                                  { id: 'saturday', name: 'السبت' },
                                ].map((day) => {
                                  const isWork = calAddWorkingDays.includes(day.id);
                                  return (
                                    <button
                                      key={day.id}
                                      type="button"
                                      onClick={() => {
                                        let newW = [...calAddWorkingDays];
                                        let newH = [...calAddHolidays];
                                        if (newW.includes(day.id)) {
                                          newW = newW.filter(d => d !== day.id);
                                          if (!newH.includes(day.id)) newH.push(day.id);
                                        } else {
                                          newH = newH.filter(d => d !== day.id);
                                          if (!newW.includes(day.id)) newW.push(day.id);
                                        }
                                        setCalAddWorkingDays(newW);
                                        setCalAddHolidays(newH);
                                      }}
                                      className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                                        isWork
                                          ? 'text-white border-transparent'
                                          : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200'
                                      }`}
                                      style={{ backgroundColor: isWork ? calAddAccentColor : undefined }}
                                    >
                                      {day.name}
                                      <div className="text-[7.5px] font-normal opacity-85 mt-0.5">
                                        {isWork ? 'عمل' : 'عطلة'}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 4. ساعات الدوام الرسمي اليومي */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">ساعات الدوام اليومي الرسمي:</span>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-neutral-500 block mb-0.5">بداية العمل:</span>
                                  <input
                                    type="time"
                                    value={calAddWorkStart}
                                    onChange={(e) => setCalAddWorkStart(e.target.value)}
                                    className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-neutral-500 block mb-0.5">نهاية العمل:</span>
                                  <input
                                    type="time"
                                    value={calAddWorkEnd}
                                    onChange={(e) => setCalAddWorkEnd(e.target.value)}
                                    className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 5. أوقات الاستراحة اليومية */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">أوقات الاستراحة (تُستثنى من الحجوزات):</span>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] text-neutral-500 block mb-0.5">بداية الاستراحة:</span>
                                  <input
                                    type="time"
                                    value={calAddBreakStart}
                                    onChange={(e) => setCalAddBreakStart(e.target.value)}
                                    className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-neutral-500 block mb-0.5">نهاية الاستراحة:</span>
                                  <input
                                    type="time"
                                    value={calAddBreakEnd}
                                    onChange={(e) => setCalAddBreakEnd(e.target.value)}
                                    className="w-full p-2 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 6. وتيرة تكرار المواعيد (Interval) */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">مدة الفترة المتاحة لكل موعد:</span>
                              <select
                                value={calAddInterval}
                                onChange={(e) => setCalAddInterval(e.target.value as any)}
                                className="w-full text-xs font-semibold p-2 bg-white rounded-xl border border-neutral-300 focus:outline-none cursor-pointer"
                              >
                                <option value="10">موعد كل ١٠ دقائق</option>
                                <option value="15">موعد كل ١٥ دقيقة</option>
                                <option value="30">موعد كل ٣٠ دقيقة (نصف ساعة)</option>
                                <option value="60">موعد كل ساعة كاملة</option>
                                <option value="day">موعد واحد فقط طوال اليوم</option>
                                <option value="manual">تخصيص يدوي بالدقائق...</option>
                              </select>

                              {calAddInterval === 'manual' && (
                                <div className="space-y-1 mt-1.5">
                                  <label className="text-[10px] text-neutral-500 block">أدخل الوقت بالدقائق يدوياً:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={1}
                                      max={480}
                                      value={calAddIntervalMins}
                                      onChange={(e) => setCalAddIntervalMins(Math.max(1, Number(e.target.value)))}
                                      className="w-24 p-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-center focus:outline-none"
                                    />
                                    <span className="text-xs text-neutral-500 font-semibold">دقيقة</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 7. آلية الموافقة وتأكيد الموعد */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">آلية الموافقة وتأكيد الموعد:</span>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={calAddNeedsConfirmation}
                                  onChange={(e) => setCalAddNeedsConfirmation(e.target.checked)}
                                  className="w-4 h-4 cursor-pointer"
                                  style={{ accentColor: calAddAccentColor }}
                                />
                                <span className="text-xs font-medium text-neutral-700">يتطلب موافقة وتأكيد الإدارة أولاً (⏳ معلّق)</span>
                              </label>
                            </div>

                            {/* 8. طرق إجراء المقابلة المتاحة */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">طريقة ومكان إجراء المقابلة (اختر خياراً أو أكثر):</span>
                              <div className="grid grid-cols-3 gap-1">
                                {[
                                  { id: 'personal', name: '👤 شخصي', title: 'حضور شخصي بالمقر' },
                                  { id: 'phone', name: '📞 هاتفي', title: 'مكالمة هاتفية صوتية' },
                                  { id: 'whatsapp', name: '📹 فيديو', title: 'اتصال فيديو واتساب' },
                                ].map((type) => {
                                  const isSel = calAddMeetingTypes.includes(type.id);
                                  return (
                                    <button
                                      key={type.id}
                                      type="button"
                                      onClick={() => {
                                        let newT = [...calAddMeetingTypes];
                                        if (newT.includes(type.id)) {
                                          if (newT.length > 1) newT = newT.filter(t => t !== type.id);
                                        } else {
                                          newT.push(type.id);
                                        }
                                        setCalAddMeetingTypes(newT);
                                      }}
                                      className={`py-1.5 rounded-lg text-[9.5px] font-bold border transition-all text-center cursor-pointer ${
                                        isSel
                                          ? 'text-white border-transparent font-black'
                                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                                      }`}
                                      style={{ backgroundColor: isSel ? calAddAccentColor : undefined }}
                                    >
                                      {type.name}
                                      {isSel && <span className="mr-0.5 text-[8px]">✓</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* 9. تخصيص عناوين حقول النموذج */}
                            <div className="space-y-1.5 border-t border-blue-100 pt-2">
                              <span className="text-[10.5px] font-bold text-neutral-800 block">تخصيص عناوين حقول النموذج:</span>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-[9.5px] text-neutral-500 block mb-0.5">اسم حقل الاسم:</span>
                                  <input
                                    type="text"
                                    value={calAddNameLabel}
                                    onChange={(e) => setCalAddNameLabel(e.target.value)}
                                    className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-neutral-500 block mb-0.5">اسم حقل العنوان:</span>
                                  <input
                                    type="text"
                                    value={calAddAddressLabel}
                                    onChange={(e) => setCalAddAddressLabel(e.target.value)}
                                    className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-neutral-500 block mb-0.5">اسم حقل الهاتف:</span>
                                  <input
                                    type="text"
                                    value={calAddPhoneLabel}
                                    onChange={(e) => setCalAddPhoneLabel(e.target.value)}
                                    className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <span className="text-[9.5px] text-neutral-500 block mb-0.5">اسم حقل البريد:</span>
                                  <input
                                    type="text"
                                    value={calAddEmailLabel}
                                    onChange={(e) => setCalAddEmailLabel(e.target.value)}
                                    className="w-full p-1.5 bg-white rounded-lg border border-neutral-300 text-xs font-semibold focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* زر الإدراج المباشر للبطاقة العرضية الفاخرة */}
                        <button
                          type="button"
                          onClick={() => {
                            onAddElement('calendar', calAddTitle, { 
                              backgroundColor: '#ffffff', 
                              borderRadius: 24, 
                              glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' 
                            }, { 
                              name: 'بطاقة حجز مواعيد عرضية', 
                              calendarTitle: calAddTitle, 
                              calendarAccentColor: calAddAccentColor,
                              calendarSlots: calAddSlotsText.split(',').map(s => s.trim()).filter(Boolean),
                              width: 780, 
                              height: 440,
                              calendarWorkingDays: calAddWorkingDays,
                              calendarHolidays: calAddHolidays,
                              calendarWorkStart: calAddWorkStart,
                              calendarWorkEnd: calAddWorkEnd,
                              calendarBreakStart: calAddBreakStart,
                              calendarBreakEnd: calAddBreakEnd,
                              calendarInterval: calAddInterval,
                              calendarIntervalMinutes: calAddIntervalMins,
                              calendarNeedsConfirmation: calAddNeedsConfirmation,
                              calendarMeetingTypes: calAddMeetingTypes,
                              calendarMeetingType: calAddMeetingTypes[0] as any,
                              calendarNameLabel: calAddNameLabel,
                              calendarAddressLabel: calAddAddressLabel,
                              calendarPhoneLabel: calAddPhoneLabel,
                              calendarEmailLabel: calAddEmailLabel,
                              calendarDescLabel: calAddDescLabel
                            });
                          }}
                          className="w-full py-2.5 px-3 text-white rounded-xl text-xs font-black shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          style={{ backgroundColor: calAddAccentColor }}
                        >
                          <span>➕</span>
                          <span>إدراج بطاقة حجز الموعد العرضية للكانفاس (780 × 440)</span>
                        </button>
                      </div>
                    )}

                    {activeAddCategory === 'video' && (
                      <div className="p-3 bg-red-50/50 border border-red-200/60 rounded-2xl text-right space-y-1.5" dir="rtl">
                        <label className="text-xs font-bold text-neutral-800 block">رابط الفيديو المستهدف (اختياري):</label>
                        <input
                          type="url"
                          value={videoAddUrl}
                          onChange={(e) => setVideoAddUrl(e.target.value)}
                          placeholder="ألصق رابط يوتيوب أو تيك توك هنا..."
                          dir="ltr"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-neutral-300 text-xs font-mono focus:outline-none focus:border-red-500"
                        />
                        <p className="text-[9.5px] text-neutral-400 leading-snug">
                          سيتم تزويد المشغل المختار بهذا الرابط تلقائياً عند إضافته للكانفاس. يمكنك أيضاً تعديل الرابط لاحقاً في أي وقت.
                        </p>
                      </div>
                    )}

                    {activeAddCategory === 'map' && (
                      <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-2xl text-right space-y-2" dir="rtl">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-neutral-800 block">حدد موقع العنوان أو اضغط لتحديده:</label>
                          <button
                            type="button"
                            onClick={() => handleDetectUserLocation((loc) => setMapAddLocation(loc))}
                            disabled={isDetectingLocation}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shadow-3xs transition-all cursor-pointer disabled:opacity-50"
                            title="تحديد موقعك الجغرافي الحالي تلقائياً"
                          >
                            {isDetectingLocation ? (
                              <>
                                <Loader2 size={11} className="animate-spin text-blue-600" />
                                <span>جاري التحديد...</span>
                              </>
                            ) : (
                              <>
                                <Navigation size={11} className="text-blue-600" />
                                <span>موقعي الحالي 📍</span>
                              </>
                            )}
                          </button>
                        </div>

                        <input
                          type="text"
                          value={mapAddLocation}
                          onChange={(e) => setMapAddLocation(e.target.value)}
                          placeholder="مثال: دبي مول أو اضغط 'موقعي الحالي'..."
                          className="w-full px-3 py-2 bg-white rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-blue-500"
                        />

                        {locationDetectError && (
                          <p className="text-[10px] text-red-600 font-semibold">⚠️ {locationDetectError}</p>
                        )}

                        <p className="text-[9.5px] text-neutral-400 leading-snug">
                          سيتم تزويد الخريطة المختارة بهذا الموقع وتثبيت الدبوس عليه وتفعيلها تلقائياً عند إنزالها للكانفاس.
                        </p>
                      </div>
                    )}

                    {activeAddCategory === 'sheet' && (
                      <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl text-right space-y-3" dir="rtl">
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <Grid3X3 size={14} className="text-emerald-600 shrink-0" />
                          <span>تخصيص جدول البيانات الجديد:</span>
                        </span>

                        {/* Theme color selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-500 block">اختر لون الجدول (10 ألوان متناسقة):</label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[
                              { label: 'أزرق', value: '#0071e3' },
                              { label: 'أخضر', value: '#10b981' },
                              { label: 'أحمر', value: '#ef4444' },
                              { label: 'أصفر', value: '#f59e0b' },
                              { label: 'بنفسجي', value: '#6366f1' },
                              { label: 'وردي', value: '#ec4899' },
                              { label: 'رمادي', value: '#475569' },
                              { label: 'مائي', value: '#14b8a6' },
                              { label: 'برتقالي', value: '#f97316' },
                              { label: 'فحمي', value: '#1f2937' },
                            ].map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setTableAddColor(c.value)}
                                className="relative h-6 rounded-md cursor-pointer transition-all border border-black/[0.05]"
                                style={{ backgroundColor: c.value }}
                                title={c.label}
                              >
                                {tableAddColor === c.value && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rows and columns arrow spinners */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">عدد الأسطر (الصفوف):</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setTableAddRows(Math.max(1, tableAddRows - 1))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-mono font-bold text-neutral-800 bg-white border border-neutral-200 py-1 rounded">
                                {tableAddRows}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTableAddRows(Math.min(20, tableAddRows + 1))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">عدد الأعمدة:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setTableAddCols(Math.max(1, tableAddCols - 1))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-mono font-bold text-neutral-800 bg-white border border-neutral-200 py-1 rounded">
                                {tableAddCols}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTableAddCols(Math.min(15, tableAddCols + 1))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Column width and row height spinners */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">عرض العمود (بكسل):</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setTableAddColWidth(Math.max(40, tableAddColWidth - 10))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-mono font-bold text-neutral-800 bg-white border border-neutral-200 py-1 rounded">
                                {tableAddColWidth}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTableAddColWidth(Math.min(300, tableAddColWidth + 10))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block mb-0.5">ارتفاع السطر (بكسل):</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setTableAddRowHeight(Math.max(20, tableAddRowHeight - 5))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="flex-1 text-center font-mono font-bold text-neutral-800 bg-white border border-neutral-200 py-1 rounded">
                                {tableAddRowHeight}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTableAddRowHeight(Math.min(150, tableAddRowHeight + 5))}
                                className="w-7 h-7 rounded bg-white border border-neutral-300 flex items-center justify-center font-bold text-neutral-600 active:bg-neutral-100 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Checkboxes (Header, Indexing) */}
                        <div className="space-y-2 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={tableAddHeaderRow}
                              onChange={(e) => setTableAddHeaderRow(e.target.checked)}
                              className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs text-neutral-700">اضافة سطر العناوين (أول سطر كعنوان مميز)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={tableAddIndexCol}
                              onChange={(e) => setTableAddIndexCol(e.target.checked)}
                              className="accent-emerald-600 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs text-neutral-700">اضافة عمود التعداد يميناً (1، 2، 3...)</span>
                          </label>
                        </div>

                        {/* Add button */}
                        <button
                          type="button"
                          onClick={() => {
                            const cells: string[][] = [];
                            for (let r = 0; r < tableAddRows; r++) {
                              const rowArr: string[] = [];
                              for (let c = 0; c < tableAddCols; c++) {
                                if (r === 0 && tableAddHeaderRow) {
                                  rowArr.push(`عنوان ${c + 1}`);
                                } else if (c === 0 && tableAddIndexCol) {
                                  rowArr.push(`${r}`);
                                } else {
                                  rowArr.push(`خلية ${r + 1}-${c + 1}`);
                                }
                              }
                              cells.push(rowArr);
                            }

                            const calculatedWidth = tableAddCols * tableAddColWidth + (tableAddIndexCol ? 50 : 0);
                            const calculatedHeight = tableAddRows * tableAddRowHeight;

                            onAddElement(
                              'table',
                              'جدول مخصص',
                              { borderRadius: 12, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' },
                              {
                                name: 'جدول مخصص',
                                width: Math.max(300, calculatedWidth),
                                height: Math.max(120, calculatedHeight),
                                tableConfig: {
                                  rows: tableAddRows,
                                  cols: tableAddCols,
                                  themeColor: tableAddColor,
                                  headerRow: tableAddHeaderRow,
                                  indexCol: tableAddIndexCol,
                                  colWidths: Array(tableAddCols).fill(tableAddColWidth),
                                  rowHeights: Array(tableAddRows).fill(tableAddRowHeight),
                                  cells: cells
                                }
                              }
                            );
                          }}
                          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>✨</span>
                          <span>إدراج الجدول المخصص الآن في الشريحة</span>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      {currentTemplates.map((item) => (
                        <div
                          key={item.id}
                          onClick={item.action}
                          className="group bg-white rounded-2xl border-2 border-neutral-200 hover:border-[#0071e3] p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer text-right"
                        >
                          {/* Visual Miniature Preview */}
                          <div className="mb-2">
                            {item.preview}
                          </div>

                          {/* Details & Action */}
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900 group-hover:text-[#0071e3] transition-colors truncate">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                              {item.sub}
                            </p>

                            <div className="mt-2 pt-1.5 border-t border-neutral-100 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-md group-hover:bg-[#0071e3] group-hover:text-white transition-colors">
                                إضافة +
                              </span>
                              <span className="text-[10px] text-neutral-400 group-hover:text-[#0071e3]">
                                ✦
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {currentTemplates.length === 0 && (
                      <div className="py-8 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-neutral-200/60">
                        لا توجد عناصر مطابقة في هذا الفلتر حالياً
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TOOL: Wee AI */}
            {activeSection === 'wee-ai' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center gap-2 font-bold">
                  <Sparkles size={16} className="text-purple-600" />
                  <span>توليد أقسام بالذكاء الاصطناعي</span>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      title: 'قسم الواجهة (Hero Section)',
                      action: () => {
                        onAddElement('heading', 'مرحباً بك في عالم التصميم المتطور', { fontSize: 32, fontWeight: 'bold' });
                        onAddElement('button', 'ابدأ تجربتك الآن ✦', { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 999 });
                      }
                    },
                    {
                      title: 'بطاقات المميزات (Features)',
                      action: () => {
                        onAddGroup?.({
                          name: 'بطاقة ميزة',
                          width: 300,
                          height: 150,
                          styles: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }
                        }, [
                          { type: 'heading', name: 'عنوان الميزة', content: 'أداء فائق السرعة', x: 16, y: 16, width: 268, height: 28, styles: { fontSize: 16, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right' } },
                          { type: 'paragraph', name: 'وصف الميزة', content: 'سرعة متناهية وخوادم سحابية فائقة الثبات.', x: 16, y: 50, width: 268, height: 84, styles: { fontSize: 12, color: '#4b5563', textAlign: 'right' } }
                        ]);
                      }
                    },
                  ].map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={tmpl.action}
                      className="w-full p-2.5 rounded-xl border border-neutral-200 hover:border-purple-300 hover:bg-purple-50/50 text-right text-xs font-medium flex items-center justify-between transition-all"
                    >
                      <span>{tmpl.title}</span>
                      <Wand2 size={13} className="text-purple-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TOOL: Link (إضافة رابط كالمخطط اليدوي تماماً) */}
            {activeSection === 'link' && (() => {
              const contactPlatforms = [
                {
                  type: 'whatsapp' as ContactType,
                  name: 'واتساب',
                  subname: 'WhatsApp',
                  color: '#25D366',
                  bgColor: '#25D36618',
                  placeholder: '0049000000 أو +966500000000',
                  helpText: 'رقم الواتساب مع رمز الدولة (مثال: 0049... أو +966...)',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.77.464 3.498 1.346 5.027L2 22l5.086-1.334A9.97 9.97 0 0 0 12.031 22c5.536 0 10.031-4.495 10.031-10.031C22.062 6.495 17.567 2 12.031 2zm5.836 14.238c-.244.685-1.42 1.258-1.956 1.338-.508.077-1.168.109-3.73-1.025-3.08-1.36-5.074-4.495-5.23-4.7-.152-.206-1.246-1.657-1.246-3.16 0-1.503.788-2.243 1.068-2.533.279-.29.61-.363.814-.363.203 0 .407.002.585.011.19.009.444-.072.695.53.259.62.883 2.152.96 2.308.077.156.128.339.025.545-.102.206-.153.334-.305.513-.153.18-.323.402-.461.54-.153.153-.312.32-.134.626.178.305.79 1.302 1.696 2.109 1.168 1.04 2.152 1.362 2.457 1.515.305.153.484.128.662-.077.178-.206.764-.89 9.68-1.127.204-.238.408-.18.662-.077.255.103 1.616.764 1.895.903.28.14.467.209.535.326.068.118.068.685-.176 1.37z" />
                    </svg>
                  )
                },
                {
                  type: 'phone' as ContactType,
                  name: 'هاتف',
                  subname: 'اتصال هاتفي',
                  color: '#34C759',
                  bgColor: '#34C75918',
                  placeholder: '0049000000 أو 0500000000',
                  helpText: 'رقم الهاتف للاتصال المباشر عند النقر',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  )
                },
                {
                  type: 'email' as ContactType,
                  name: 'إيميل',
                  subname: 'البريد الإلكتروني',
                  color: '#EA4335',
                  bgColor: '#EA433518',
                  placeholder: 'name@example.com',
                  helpText: 'البريد الإلكتروني لفتح تطبيق البريد مباشرة',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  )
                },
                {
                  type: 'facebook' as ContactType,
                  name: 'Facebook',
                  subname: 'فيسبوك',
                  color: '#1877F2',
                  bgColor: '#1877F218',
                  placeholder: 'اسم المستخدم أو رابط فيسبوك',
                  helpText: 'اسم الحساب أو الرابط الكامل لحساب فيسبوك',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )
                },
                {
                  type: 'instagram' as ContactType,
                  name: 'انستغرام',
                  subname: 'Instagram',
                  color: '#E4405F',
                  bgColor: '#E4405F18',
                  placeholder: 'اسم الحساب بدون @ أو الرابط',
                  helpText: 'اسم الحساب أو الرابط على إنستغرام',
                  icon: (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  )
                },
                {
                  type: 'x' as ContactType,
                  name: 'منصة X',
                  subname: 'Twitter',
                  color: '#000000',
                  bgColor: '#00000015',
                  placeholder: 'اسم الحساب بدون @ أو الرابط',
                  helpText: 'اسم الحساب أو الرابط على منصة X',
                  icon: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )
                },
                {
                  type: 'tiktok' as ContactType,
                  name: 'Tiktok',
                  subname: 'تيك توك',
                  color: '#000000',
                  bgColor: '#00000015',
                  placeholder: 'اسم الحساب بدون @ أو الرابط',
                  helpText: 'اسم الحساب أو الرابط على تيك توك',
                  icon: (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v7.94c.01 1.87-.6 3.73-1.74 5.21-1.42 1.83-3.67 2.9-5.98 2.8-2.61-.05-5.01-1.47-6.28-3.75-1.32-2.31-1.28-5.24.12-7.52 1.34-2.22 3.78-3.62 6.36-3.56.32.01.64.04.96.09v4.11c-.4-.14-.83-.22-1.26-.22-1.24-.04-2.47.53-3.15 1.57-.71 1.07-.67 2.49.09 3.52.74 1.01 2.01 1.57 3.26 1.42 1.34-.14 2.47-1.14 2.74-2.47.08-.41.11-.84.11-1.26V.02z" />
                    </svg>
                  )
                }
              ];

              const buildContactUrl = (type: ContactType, val: string) => {
                const clean = val.trim();
                if (!clean) return '';
                switch (type) {
                  case 'whatsapp': {
                    const cleanPhone = clean.replace(/[^0-9]/g, '');
                    return `https://wa.me/${cleanPhone}`;
                  }
                  case 'phone': {
                    const cleanPhone = clean.replace(/[^0-9+]/g, '');
                    return `tel:${cleanPhone}`;
                  }
                  case 'email': {
                    return `mailto:${clean}`;
                  }
                  case 'facebook': {
                    if (clean.startsWith('http')) return clean;
                    return `https://facebook.com/${clean.replace(/^@/, '')}`;
                  }
                  case 'instagram': {
                    if (clean.startsWith('http')) return clean;
                    return `https://instagram.com/${clean.replace(/^@/, '')}`;
                  }
                  case 'x': {
                    if (clean.startsWith('http')) return clean;
                    return `https://x.com/${clean.replace(/^@/, '')}`;
                  }
                  case 'tiktok': {
                    if (clean.startsWith('http')) return clean;
                    return `https://tiktok.com/@${clean.replace(/^@/, '')}`;
                  }
                }
              };

              const handleSelectContactMethod = (type: ContactType) => {
                setContactMethod(type);
                const generated = buildContactUrl(type, contactInputValue);
                onUpdateElement({
                  linkType: 'contact',
                  contactType: type,
                  contactValue: contactInputValue,
                  linkUrl: generated,
                  linkTargetId: undefined,
                });
              };

              const handleContactInputChange = (val: string) => {
                setContactInputValue(val);
                const generated = buildContactUrl(contactMethod, val);
                onUpdateElement({
                  linkType: 'contact',
                  contactType: contactMethod,
                  contactValue: val,
                  linkUrl: generated,
                  linkTargetId: undefined,
                });
              };

              const activePlatform = contactPlatforms.find(p => p.type === contactMethod) || contactPlatforms[0];

              return (
                <div className="space-y-4">
                  {/* Top Capsule / Oval Bar: ( صفحة | شريحة | URL | تواصل ) - كما في الرسم اليدوي */}
                  <div className="w-full p-1 bg-neutral-100 rounded-full border border-neutral-300 shadow-2xs flex items-center justify-between px-1 gap-1 select-none">
                    {[
                      { id: 'page' as const, label: 'صفحة' },
                      { id: 'slide' as const, label: 'شريحة' },
                      { id: 'url' as const, label: 'URL' },
                      { id: 'contact' as const, label: 'تواصل' },
                    ].map((tab) => {
                      const isActive = linkSubSection === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setLinkSubSection(tab.id);
                            if (tab.id === 'page' && pages.length > 0 && selectedElement?.linkType !== 'page') {
                              onUpdateElement({ linkType: 'page', linkTargetId: pages[0].id, linkUrl: `#page-${pages[0].id}`, contactType: undefined, contactValue: undefined });
                            } else if (tab.id === 'slide' && slides.length > 0 && selectedElement?.linkType !== 'slide') {
                              onUpdateElement({ linkType: 'slide', linkTargetId: slides[0].id, linkUrl: `#slide-${slides[0].id}`, contactType: undefined, contactValue: undefined });
                            } else if (tab.id === 'contact' && selectedElement?.linkType !== 'contact') {
                              handleSelectContactMethod(contactMethod);
                            }
                          }}
                          className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-[#0071e3]/30' 
                              : 'text-neutral-600 hover:text-black hover:bg-neutral-200/50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 1. فرع تواصل (Contact) - كما في المخطط اليدوي تماماً */}
                  {linkSubSection === 'contact' && (
                    <div className="space-y-3.5">
                      {/* الشريط البيضاوي لأيقونات وسائل التواصل مع إحاطة الأيقونة المفعلة بدائرة */}
                      <div className="w-full p-1.5 bg-neutral-100 rounded-full border border-neutral-300 shadow-2xs flex items-center justify-between px-2 gap-1 select-none">
                        {contactPlatforms.map((cp) => {
                          const isSelected = contactMethod === cp.type;
                          return (
                            <button
                              key={cp.type}
                              type="button"
                              onClick={() => handleSelectContactMethod(cp.type)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-white shadow-xs scale-110 ring-2' 
                                  : 'hover:bg-white/80 opacity-70 hover:opacity-100'
                              }`}
                              style={{
                                color: cp.color,
                                boxShadow: isSelected ? `0 0 0 2px ${cp.color}` : undefined
                              }}
                              title={`${cp.name} (${cp.subname})`}
                            >
                              {cp.icon}
                            </button>
                          );
                        })}
                      </div>

                      {/* حقل الإدخال كما في المخطط اليدوي [ 0049000000 ] */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-800 font-bold flex items-center gap-1.5">
                            <span style={{ color: activePlatform.color }}>{activePlatform.icon}</span>
                            <span>رقم / حساب {activePlatform.name}:</span>
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {activePlatform.subname}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={contactInputValue}
                          onChange={(e) => handleContactInputChange(e.target.value)}
                          placeholder={activePlatform.placeholder}
                          dir="ltr"
                          className="w-full px-3 py-2.5 bg-white rounded-xl border border-neutral-300 text-xs font-mono text-left focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all shadow-2xs"
                        />
                        <p className="text-[10px] text-neutral-500 pt-0.5">
                          {activePlatform.helpText}
                        </p>
                      </div>


                    </div>
                  )}

                  {/* 2. فرع صفحة (رابط صفحة تفتح صفحات المشروع) */}
                  {linkSubSection === 'page' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-800 font-bold text-sm">صفحات المشروع:</span>
                        <span className="text-[11px] text-neutral-500">اختر صفحة للانتقال إليها</span>
                      </div>
                      <div className="space-y-1.5">
                        {pages.map((p) => {
                          const isSelectedPage = selectedElement?.linkType === 'page' && selectedElement?.linkTargetId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                onUpdateElement({
                                  linkType: 'page',
                                  linkTargetId: p.id,
                                  linkUrl: `#page-${p.id}`,
                                  contactType: undefined,
                                  contactValue: undefined,
                                });
                              }}
                              className={`w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                                isSelectedPage
                                  ? 'border-[#0071e3] bg-[#0071e3]/10 shadow-xs ring-1 ring-[#0071e3]/40'
                                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelectedPage ? 'bg-[#0071e3] text-white' : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                  <FileText size={16} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-neutral-800">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-neutral-500 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono">{p.slug}</span>
                                    <span>•</span>
                                    <span>{p.slides.length} شرائح</span>
                                  </div>
                                </div>
                              </div>
                              {isSelectedPage && (
                                <div className="w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. فرع شريحة (الصفحات غير مفعلة وتحتها الشرائح الموجودة كما في الهيكل) */}
                  {linkSubSection === 'slide' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-800 font-bold text-sm">شرائح المشروع:</span>
                        <span className="text-[11px] text-neutral-500">اختر شريحة مستهدفة</span>
                      </div>
                      <div className="space-y-3">
                        {pages.map((p) => {
                          return (
                            <div key={p.id} className="space-y-1.5">
                              {/* الصفحات غير مفعلة وتحتها الشرائح كما في الهيكل */}
                              <div className="p-2 bg-neutral-100/90 rounded-lg text-neutral-500 font-bold text-xs flex items-center justify-between select-none cursor-not-allowed border border-neutral-200/60">
                                <div className="flex items-center gap-1.5">
                                  <Folder size={14} className="text-neutral-400" />
                                  <span>صفحة: {p.name}</span>
                                </div>
                                <span className="text-[10px] font-normal text-neutral-400">({p.slides.length} شرائح)</span>
                              </div>

                              {/* الشرائح تحت الصفحة مباشرة */}
                              <div className="pr-3 pl-1 space-y-1 border-r-2 border-neutral-200 mr-2">
                                {p.slides.map((s, idx) => {
                                  const isSelectedSlide = selectedElement?.linkType === 'slide' && selectedElement?.linkTargetId === s.id;
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => {
                                        onUpdateElement({
                                          linkType: 'slide',
                                          linkTargetId: s.id,
                                          linkUrl: `#slide-${s.id}`,
                                          contactType: undefined,
                                          contactValue: undefined,
                                        });
                                      }}
                                      className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                                        isSelectedSlide
                                          ? 'border-[#0071e3] bg-[#0071e3]/10 shadow-xs ring-1 ring-[#0071e3]/40'
                                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0 shadow-2xs"
                                          style={{ backgroundColor: s.backgroundColor || '#ffffff' }}
                                        />
                                        <div className="text-xs font-semibold text-neutral-800">
                                          {s.name || `شريحة ${idx + 1}`}
                                        </div>
                                      </div>
                                      {isSelectedSlide && (
                                        <div className="w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                                          <Check size={12} strokeWidth={3} />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. فرع رابط خارجي (URL) */}
                  {linkSubSection === 'url' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-800 font-bold text-sm">رابط خارجي (URL):</span>
                        <span className="text-[11px] text-neutral-500">موقع ويب خارجي</span>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={urlInputValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setUrlInputValue(val);
                            onUpdateElement({
                              linkType: 'url',
                              linkUrl: val,
                              contactType: undefined,
                              contactValue: undefined,
                              linkTargetId: undefined,
                            });
                          }}
                          placeholder="https://example.com"
                          dir="ltr"
                          className="w-full px-3 py-2.5 bg-white rounded-xl border border-neutral-300 text-xs font-mono text-left focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all shadow-2xs"
                        />

                        {/* بادئات واختصارات سريعة */}
                        <div className="flex gap-1.5 pt-1">
                          {['https://', 'https://google.com', 'https://wa.me/'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setUrlInputValue(preset);
                                onUpdateElement({
                                  linkType: 'url',
                                  linkUrl: preset,
                                  contactType: undefined,
                                  contactValue: undefined,
                                  linkTargetId: undefined,
                                });
                              }}
                              className="px-2 py-1 rounded-lg border border-neutral-200 text-[10px] font-mono text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* معاينة الرابط وإزالته عند توفره */}
                  {selectedElement?.linkUrl && (
                    <div className="pt-2 border-t border-neutral-200 space-y-2">
                      <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <ExternalLink size={13} className="text-[#0071e3] shrink-0" />
                          <span className="font-mono text-neutral-700 truncate" dir="ltr">
                            {selectedElement.linkUrl}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setContactInputValue('');
                          setUrlInputValue('');
                          onUpdateElement({
                            linkUrl: undefined,
                            linkType: undefined,
                            linkTargetId: undefined,
                            contactType: undefined,
                            contactValue: undefined,
                          });
                        }}
                        className="w-full py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>إزالة الرابط من هذا العنصر</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TOOL: Layers (إدارة الطبقات) */}
            {activeSection === 'layers' && (() => {
              const slideElements = elements.filter(el => el.slideId === activeSlideId);
              // Render topmost layers first (which are at the end of the slideElements array)
              const layersList = [...slideElements].reverse();

              return (
                <div className="space-y-4 text-right" dir="rtl">
                  
                  {/* أزرار التحكم بالترتيب الفوري للطبقات */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-800 block">
                      خيارات ترتيب الطبقة للعنصر المحدد:
                    </span>
                    
                    {selectedElement ? (
                      <div className="grid grid-cols-4 gap-2 bg-neutral-50 p-2 rounded-2xl border border-neutral-300">
                        {/* 1. أسفل الجميع (Send to absolute bottom) */}
                        <button
                          onClick={onMoveLayerToBack}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
                          title="أسفل الجميع (إرسال للقاع)"
                        >
                          <span className="text-neutral-500 hover:text-black">
                            <ArrowDownToLine size={18} strokeWidth={2.2} />
                          </span>
                          <span className="text-[10px] font-bold">أسفل</span>
                        </button>

                        {/* 2. طبقة للأسفل (Send backward) */}
                        <button
                          onClick={onMoveLayerDown}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
                          title="طبقة للأسفل (تراجع خطوة)"
                        >
                          <span className="text-neutral-500 hover:text-black">
                            <ChevronDown size={18} strokeWidth={2.2} />
                          </span>
                          <span className="text-[10px] font-bold">لأسفل</span>
                        </button>

                        {/* 3. طبقة للأعلى (Bring forward) */}
                        <button
                          onClick={onMoveLayerUp}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
                          title="طبقة للأعلى (تقدم خطوة)"
                        >
                          <span className="text-neutral-500 hover:text-black">
                            <ChevronUp size={18} strokeWidth={2.2} />
                          </span>
                          <span className="text-[10px] font-bold">للأعلى</span>
                        </button>

                        {/* 4. أعلى الجميع (Bring to absolute top) */}
                        <button
                          onClick={onMoveLayerToFront}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
                          title="أعلى الجميع (إحضار للمقدمة)"
                        >
                          <span className="text-neutral-500 hover:text-black">
                            <ArrowUpToLine size={18} strokeWidth={2.2} />
                          </span>
                          <span className="text-[10px] font-bold">أعلى</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-neutral-50 rounded-xl text-center text-xs text-neutral-400 border border-neutral-200">
                        يرجى تحديد عنصر في الساحة لعرض وإجراء خيارات الترتيب.
                      </div>
                    )}
                  </div>

                  {/* قائمة بجميع الطبقات في هذه الشريحة */}
                  <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-800">طبقات الشريحة الحالية:</span>
                      <span className="text-[10px] text-neutral-400 font-mono">({layersList.length} عناصر)</span>
                    </div>

                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                      {layersList.map((el, i) => {
                        const isSelected = selectedElement?.id === el.id;
                        const isLocked = !!el.isLocked;

                        return (
                          <div
                            key={el.id}
                            className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs ring-1 ring-[#0071e3]/30'
                                : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300'
                            }`}
                            onClick={() => onSelectElement(el.id)}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {/* رقم الترتيب / الطبقة بصريًا */}
                              <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-100 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                                {layersList.length - i}
                              </span>
                              {/* أيقونة العنصر */}
                              <span className="shrink-0">
                                {getElementIcon(el.type)}
                              </span>
                              {/* اسم العنصر */}
                              <span className={`text-xs truncate ${isSelected ? 'font-bold text-[#0071e3]' : 'text-neutral-700 font-medium'}`}>
                                {el.name}
                              </span>
                            </div>

                            {/* الإجراءات السريعة على الطبقة */}
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* زر القفل السريع */}
                              <button
                                onClick={() => {
                                  onSelectElement(el.id);
                                  onToggleLock();
                                }}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                  isLocked 
                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                                }`}
                                title={isLocked ? "إلغاء قفل العنصر" : "قفل العنصر"}
                              >
                                {isLocked ? <Lock size={11} strokeWidth={2.4} /> : <Unlock size={11} />}
                              </button>

                              {/* زر التكرار السريع */}
                              <button
                                onClick={() => onDuplicateElement(el.id)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
                                title="تكرار هذه الطبقة"
                              >
                                <Copy size={11} />
                              </button>

                              {/* زر الحذف السريع */}
                              <button
                                onClick={() => onDeleteElement(el.id)}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="حذف الطبقة"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {layersList.length === 0 && (
                        <div className="text-center py-6 text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                          لا توجد عناصر في هذه الشريحة حالياً. أضف عناصر جديدة من القائمة لتبدأ!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* نص توضيحي مفيد */}
                  <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] text-neutral-500 leading-tight">
                    💡 <b>معلومة مفيدة:</b> الطبقات مرتبة من الأعلى للأسفل كبرامج التصميم الاحترافية. لتعديل عنصر مغطى بالكامل خلف عناصر أخرى، حدده مباشرة من هذه القائمة وسيتم تنشيطه على الفور في ساحة العمل.
                  </div>

                </div>
              );
            })()}

            {/* TOOL: Add/Edit Image (تبديل/تعديل الصورة) */}
            {activeSection === 'add-image' && (
              <ImageDrawerSection
                onAddImage={handleAddImageElement}
                onBack={() => {
                  if (selectedElement) {
                    onSelectSection('format');
                  } else {
                    onSelectSection('elements');
                  }
                }}
                canvasElements={elements}
                selectedElement={selectedElement}
                onUpdateElement={onUpdateElement}
              />
            )}

            {/* TOOL: Navbar settings (ترس الإعدادات) — sticky/scroll + hamburger menu mode */}
            {activeSection === 'navbar-settings' && navbar && (
              <div className="space-y-6 text-right" dir="rtl">
                <div className="space-y-2">
                  <SectionHeader title="سلوك النافبار عند التمرير" />
                  <PillTabs
                    options={[
                      { value: 'sticky', label: 'ثابت عائم في الرأس' },
                      { value: 'scroll', label: 'متحرك مع الصفحة' },
                    ]}
                    value={navbar.isSticky ? 'sticky' : 'scroll'}
                    onChange={(v) => onUpdateNavbar({ isSticky: v === 'sticky' })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                  <SectionHeader title="قائمة Hamburger" />
                  <p className="text-[11px] text-neutral-500 -mt-1">
                    تحويل روابط وزر النافبار إلى أيقونة واحدة تفتح وتغلق القائمة.
                  </p>
                  <PillTabs
                    options={[
                      { value: 'off', label: 'غير مفعّلة' },
                      { value: 'on', label: 'مفعّلة' },
                    ]}
                    value={navbar.isHamburgerMode ? 'on' : 'off'}
                    onChange={(v) => onUpdateNavbar({ isHamburgerMode: v === 'on' })}
                    className="w-full"
                  />

                  {navbar.isHamburgerMode && (
                    <div className="pt-2 space-y-2">
                      <span className="text-[11px] font-bold text-neutral-700">اتجاه فتح القائمة:</span>
                      <PillTabs
                        options={[
                          { value: 'vertical', label: 'طولي (قائمة منسدلة)' },
                          { value: 'horizontal', label: 'عرضي (صف واحد)' },
                        ]}
                        value={navbar.hamburgerDirection || 'vertical'}
                        onChange={(v) => onUpdateNavbar({ hamburgerDirection: v as 'vertical' | 'horizontal' })}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Default for other tools */}
            {['grid', 'list', 'slides', 'navbar', 'grouping'].includes(activeSection) && (
              <div className="p-3.5 bg-neutral-50 rounded-xl text-xs text-neutral-600 space-y-1">
                <span className="font-bold block text-neutral-800">خيارات {getToolTitle()}:</span>
                <p className="text-[11px] text-neutral-500">
                  يمكنك تعديل إعدادات هذه الأداة مباشرة على العنصر المحدد في ساحة العمليات.
                </p>
              </div>
            )}

          </div>
        )}

        {/* Wee AI Chat Container inside the control panel */}
        <WeeAIChat
          key={userId || 'guest'}
          userId={userId || ''}
          userEmail={userEmail || ''}
          onCompleteChat={onCompleteChat}
          isCollapsed={isWeeAiChatCollapsed}
          onToggleCollapse={toggleWeeAiChat}
          onStepChange={onStepChange}
        />

        {/* ========================================================
            SLIDE TEMPLATES SUB-SIDEBAR (لوحة الشرائح الجاهزة المنبثقة)
            Positioned at "right-full" to attach perfectly to the left of the control panel!
            ======================================================== */}
        <div 
          className={`absolute top-0 right-full w-[310px] md:w-[350px] h-full bg-[#fbfbfd] border-l-2 border-t-2 border-b-2 border-neutral-300 shadow-[-12px_0_30px_rgba(0,0,0,0.15)] rounded-l-2xl flex flex-col overflow-hidden text-right select-none font-sans transition-all duration-300 z-[150] ${
            activeTemplateCategory 
              ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' 
              : 'opacity-0 translate-x-[20px] scale-95 pointer-events-none'
          }`}
          style={{ height: '100%' }}
        >
          {/* Header of Pop-out Drawer */}
          <div className="h-12 px-3 bg-[#f5f5f7] border-b border-neutral-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-neutral-800">
                {READY_SLIDE_CATEGORIES.find(c => c.id === activeTemplateCategory)?.name || 'الشرائح الجاهزة'}
              </span>
              <span className="text-[10px] text-[#0071e3] font-bold bg-[#0071e3]/5 border border-[#0071e3]/10 px-1.5 py-0.5 rounded-full">
                10 تصاميم
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setActiveTemplateCategory(null)}
              className="w-7 h-7 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-black flex items-center justify-center transition-all cursor-pointer"
              title="إغلاق اللوحة المنبثقة"
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </div>

          {/* Scrollable list of 10 Miniature Slides */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {activeTemplateCategory && Array.from({ length: 10 }).map((_, idx) => {
              const cat = READY_SLIDE_CATEGORIES.find(c => c.id === activeTemplateCategory);
              const catName = cat ? cat.name : 'شريحة';
              const templatePayload = getSlideTemplatePayload(activeTemplateCategory, idx, catName);
              
              // Custom mini layout drawing depending on index
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    if (onAddSlideTemplate) {
                      onAddSlideTemplate(templatePayload);
                    }
                    setActiveTemplateCategory(null);
                  }}
                  className="w-full bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs group cursor-pointer hover:border-[#0071e3] hover:shadow-md transition-all relative"
                >
                  {/* Miniature representation header */}
                  <div className="p-2 border-b border-neutral-100 bg-[#fbfbfd] flex items-center justify-between text-[9px] font-bold text-neutral-400">
                    <span>{catName} — نموذج {idx + 1}</span>
                    <span className="text-[8px] bg-neutral-100 text-neutral-500 px-1 py-0.5 rounded">مصغر</span>
                  </div>

                  {/* MINI SLIDE LAYOUT VIEW (صورة مصغرة حقيقية تعبر عن الهيكل الفعلي للشريحة) */}
                  <div
                    className="w-full h-[135px] relative overflow-hidden"
                    style={{ backgroundColor: templatePayload.backgroundColor || '#ffffff' }}
                  >
                    {/* Background image layer (own opacity, independent of overlaid content) */}
                    {templatePayload.backgroundImage && (
                      <div
                        className="absolute inset-0 pointer-events-none select-none"
                        style={{
                          backgroundImage: `url(${templatePayload.backgroundImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          opacity: templatePayload.backgroundOpacity ?? 1,
                        }}
                      />
                    )}
                    {/* Inner scaled container: 1280px wide and 580px high, scaled down to fit perfectly */}
                    <div
                      className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
                      style={{
                        width: '1280px',
                        height: '580px',
                        transform: 'scale(0.23)',
                      }}
                    >
                      {/* Map through elements of the slide template to render exact miniature representations */}
                      {templatePayload.elements && templatePayload.elements.map((el: any, elIdx: number) => {
                        const elStyle: React.CSSProperties = {
                          position: 'absolute',
                          left: `${el.x}px`,
                          top: `${el.y}px`,
                          width: `${el.width}px`,
                          height: `${el.height}px`,
                          color: el.styles?.color || '#1d1d1f',
                          background: el.styles?.backgroundColor || 'transparent',
                          borderRadius: el.styles?.borderRadius ? `${el.styles.borderRadius}px` : undefined,
                          borderWidth: el.styles?.borderWidth ? `${el.styles.borderWidth}px` : undefined,
                          borderColor: el.styles?.borderColor || 'transparent',
                          borderStyle: el.styles?.borderStyle || 'none',
                          fontSize: el.styles?.fontSize ? `${el.styles.fontSize}px` : '14px',
                          fontWeight: el.styles?.fontWeight || 'normal',
                          textAlign: el.styles?.textAlign || 'right',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: el.styles?.textAlign === 'center' ? 'center' : (el.styles?.textAlign === 'left' ? 'flex-start' : 'flex-end'),
                          padding: '4px 8px',
                          boxShadow: el.styles?.shadow === 'apple' ? '0 4px 12px rgba(0,0,0,0.08)' : undefined,
                          overflow: 'hidden',
                        };

                        if (el.type === 'image') {
                          return (
                            <div key={elIdx} style={{ ...elStyle, padding: 0 }}>
                              <img 
                                src={el.content || el.imageUrl || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80'} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          );
                        }

                        if (el.type === 'shape') {
                          return (
                            <div 
                              key={elIdx} 
                              style={{ 
                                ...elStyle, 
                                padding: 0
                              }}
                            >
                              {el.content && (
                                <span className="p-2 w-full text-center text-xs font-bold">{el.content}</span>
                              )}
                            </div>
                          );
                        }

                        if (el.type === 'button') {
                          return (
                            <button 
                              key={elIdx} 
                              type="button" 
                              style={{ 
                                ...elStyle, 
                                cursor: 'default'
                              }}
                            >
                              <span className="w-full truncate">{el.content || 'زر الإجراء'}</span>
                            </button>
                          );
                        }

                        // Fallback for headings, paragraphs, badges, dividers
                        return (
                          <div key={elIdx} style={elStyle}>
                            <span className="w-full truncate leading-tight">{el.content || el.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* HOVER HOOD OVERLAY (غطاء تفاعلي أنيق عند تمرير الماوس) */}
                  <div className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 select-none z-20">
                    <div className="w-7 h-7 rounded-full bg-[#0071e3] flex items-center justify-center text-white text-xs font-black shadow-lg">
                      ＋
                    </div>
                    <span className="text-[10px] font-bold tracking-wide">انقر لإضافة النموذج للعمليات</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Floating Minimized Widget in the Viewport */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-center select-none" dir="rtl">
          {/* Label tooltip */}
          <span className="bg-neutral-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 shadow-lg border border-white/15 backdrop-blur-md select-none tracking-wide animate-pulse">
            لوحة التحكم نشطة ✦
          </span>
          {/* Floating button */}
          <button
            onClick={() => setIsMinimized(false)}
            className="w-14 h-14 bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white rounded-full shadow-[0_12px_32px_rgba(0,113,227,0.45)] hover:shadow-[0_16px_36px_rgba(0,113,227,0.55)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border-2 border-white/30 hover:border-white focus:outline-none group relative"
            title="انقر لتكبير لوحة التحكم وإظهارها ✦"
          >
            <SlidersHorizontal size={22} className="group-hover:rotate-12 transition-transform duration-300" strokeWidth={2.4} />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border border-white animate-pulse" />
          </button>
        </div>
      )}
    </>
  );
};
