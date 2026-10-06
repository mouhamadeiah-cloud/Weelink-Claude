// Category list, sub-category tabs and ready-made element templates for the "+" add menu.
// Moved verbatim from RightDrawer.tsx; built per render exactly as before.
import React from 'react';
import { Type, Square, Image as ImageIcon, Sparkles, Globe, Shapes, Video, Clapperboard, MapPin, Tag, Calendar, Grid3X3, Code, Images, FolderOpen, Stethoscope, Minus } from 'lucide-react';
import { ElementType } from '../../types';
import { MASK_SHAPES } from '../../utils/maskShapes';
import { LOTTIE_ANIMATIONS, LOTTIE_GROUPS } from '../../utils/lottieAnimations';
import { LottiePlayer } from '../LottiePlayer';
import { RightDrawerProps } from './types';

export interface AddMenuDataDeps {
  onAddElement: RightDrawerProps['onAddElement'];
  onAddGroup: RightDrawerProps['onAddGroup'];
  videoAddUrl: string;
  mapAddLocation: string;
  calAddTitle: string;
  calAddAccentColor: string;
  calAddWorkingDays: string[];
  calAddHolidays: string[];
  calAddWorkStart: string;
  calAddWorkEnd: string;
  calAddBreakStart: string;
  calAddBreakEnd: string;
  calAddInterval: '10' | '15' | '30' | '60' | 'day' | 'manual';
  calAddIntervalMins: number;
  calAddNeedsConfirmation: boolean;
  calAddMeetingTypes: string[];
  calAddNameLabel: string;
  calAddAddressLabel: string;
  calAddPhoneLabel: string;
  calAddEmailLabel: string;
  calAddDescLabel: string;
  calAddSlotsText: string;
}

export const buildAddMenuData = ({
  onAddElement,
  onAddGroup,
  videoAddUrl,
  mapAddLocation,
  calAddTitle,
  calAddAccentColor,
  calAddWorkingDays,
  calAddHolidays,
  calAddWorkStart,
  calAddWorkEnd,
  calAddBreakStart,
  calAddBreakEnd,
  calAddInterval,
  calAddIntervalMins,
  calAddNeedsConfirmation,
  calAddMeetingTypes,
  calAddNameLabel,
  calAddAddressLabel,
  calAddPhoneLabel,
  calAddEmailLabel,
  calAddDescLabel,
  calAddSlotsText,
}: AddMenuDataDeps) => {
  // The add panel's elements in four groups: the basics, media, business blocks and ready-made blocks.
  const ADD_CATEGORIES = [
    { id: 'text', name: 'نص', group: 'basic', icon: <Type size={18} /> },
    { id: 'image', name: 'صورة', group: 'basic', icon: <ImageIcon size={18} /> },
    { id: 'button', name: 'زر', group: 'basic', icon: <Square size={18} /> },
    { id: 'icons', name: 'أيقونة', group: 'basic', icon: <Sparkles size={18} /> },
    { id: 'shape', name: 'أشكال', group: 'basic', icon: <Shapes size={18} /> },
    { id: 'divider', name: 'خط فاصل', group: 'basic', icon: <Minus size={18} /> },
    { id: 'video', name: 'فيديو', group: 'media', icon: <Video size={18} /> },
    { id: 'lottie', name: 'رسوم متحركة', group: 'media', icon: <Clapperboard size={18} /> },
    { id: 'gallery', name: 'معرض صور', group: 'media', icon: <Images size={18} /> },
    { id: 'map', name: 'خريطة', group: 'media', icon: <MapPin size={18} /> },
    { id: 'calendar', name: 'حجز مواعيد', group: 'business', icon: <Calendar size={18} /> },
    { id: 'pricing', name: 'أسعار', group: 'business', icon: <Tag size={18} /> },
    { id: 'sheet', name: 'جدول', group: 'business', icon: <Grid3X3 size={18} /> },
    { id: 'group-templates', name: 'بطاقات جاهزة', group: 'ready', icon: <FolderOpen size={18} /> },
    { id: 'html', name: 'كود مخصص', group: 'ready', icon: <Code size={18} /> },
    // Opened from inside «أيقونة» (search the big icon library); not a tile of its own.
    { id: 'iconify', name: 'مكتبة الأيقونات', group: 'hidden', icon: <Globe size={18} /> },
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
      { id: 'input', label: 'حقل إدخال' },
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
      { id: 'pill', label: 'كبسولة' },
      { id: 'gradients', label: 'تدرج' },
      { id: 'glass', label: 'زجاجي' },
      { id: 'outline', label: 'إطار' },
      { id: 'all', label: 'الكل' },
    ],
    shape: [
      { id: 'boxes', label: 'أشكال وهياكل' },
      { id: 'masks', label: 'صورة بشكل' },
      { id: 'all', label: 'الكل' }
    ],
    icons: [
      { id: 'social', label: 'وسائل تواصل' },
      { id: 'utility', label: 'أيقونات عامة' },
      { id: 'all', label: 'الكل' },
    ],
    video: [
      { id: 'all', label: 'جميع مشغلات الفيديو' },
    ],
    lottie: [{ id: 'all', label: 'الكل' }, ...LOTTIE_GROUPS.map((g) => ({ id: g.id, label: g.name }))],
    divider: [
      { id: 'all', label: 'الكل' },
      { id: 'lines', label: 'خطوط' },
      { id: 'marks', label: 'علامات' },
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
    // Weelink's own animations (utils/lottieAnimations), each playing in its tile.
    lottie: LOTTIE_ANIMATIONS.map((def) => ({
      id: `lottie-${def.id}`,
      title: def.name,
      sub: LOTTIE_GROUPS.find((g) => g.id === def.group)?.name || '',
      subCategories: [def.group],
      type: 'lottie' as ElementType,
      preview: (
        <div className="w-full h-18 bg-neutral-50 rounded-xl border border-neutral-200 p-1">
          <LottiePlayer animationId={def.id} />
        </div>
      ),
      action: () => onAddElement('lottie', '', {}, { name: def.name, lottieId: def.id, width: 160, height: 160 }),
    })),
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
        title: `صورة بشكل: ${mask.name}`,
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
          onAddElement('mask', mask.id, { backgroundColor: '#ffffff' }, { name: `صورة بشكل ${mask.name.replace(/[^أ-ي\s]/g, '').trim()}`, width: 220, height: 220 });
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
        title: 'خط نيون مضيء ✨',
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
          onAddElement('shape', 'line-glow', { backgroundColor: '#0071e3' }, { name: 'خط نيون مضيء', width: 300, height: 30 });
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
              src="/graphics/undraw/team-collaboration.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/team-collaboration.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تعاون الفريق', width: 280, height: 210, imageUrl: '/graphics/undraw/team-collaboration.svg' });
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
              src="/graphics/undraw/web-development.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/web-development.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تطوير الويب', width: 280, height: 210, imageUrl: '/graphics/undraw/web-development.svg' });
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
              src="/graphics/undraw/brainstorming.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/brainstorming.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: العصف الذهني', width: 280, height: 210, imageUrl: '/graphics/undraw/brainstorming.svg' });
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
              src="/graphics/undraw/analytics.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/analytics.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تحليل البيانات', width: 280, height: 210, imageUrl: '/graphics/undraw/analytics.svg' });
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
              src="/graphics/undraw/business-decisions.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/business-decisions.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: قرارات الأعمال', width: 280, height: 210, imageUrl: '/graphics/undraw/business-decisions.svg' });
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
              src="/graphics/undraw/feeling-proud.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/feeling-proud.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: فخر الإنجاز', width: 280, height: 210, imageUrl: '/graphics/undraw/feeling-proud.svg' });
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
              src="/graphics/undraw/programmer.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/programmer.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: مبرمج', width: 280, height: 210, imageUrl: '/graphics/undraw/programmer.svg' });
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
              src="/graphics/undraw/investing.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/investing.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: استثمار مالي', width: 280, height: 210, imageUrl: '/graphics/undraw/investing.svg' });
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
              src="/graphics/undraw/education.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/education.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تعليم ومعرفة', width: 280, height: 210, imageUrl: '/graphics/undraw/education.svg' });
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
              src="/graphics/undraw/marketing.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/marketing.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: حملة تسويقية', width: 280, height: 210, imageUrl: '/graphics/undraw/marketing.svg' });
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
              src="/graphics/undraw/innovative.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/innovative.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: ابتكار إبداعي', width: 280, height: 210, imageUrl: '/graphics/undraw/innovative.svg' });
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
              src="/graphics/undraw/project-completed.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/project-completed.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: إنجاز المشروع', width: 280, height: 210, imageUrl: '/graphics/undraw/project-completed.svg' });
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
              src="/graphics/undraw/searching.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/searching.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: بحث سريع', width: 280, height: 210, imageUrl: '/graphics/undraw/searching.svg' });
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
              src="/graphics/undraw/chatting.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/chatting.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: محادثة وتواصل', width: 280, height: 210, imageUrl: '/graphics/undraw/chatting.svg' });
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
              src="/graphics/undraw/conference-call.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/conference-call.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: مكالمة مؤتمر', width: 280, height: 210, imageUrl: '/graphics/undraw/conference-call.svg' });
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
              src="/graphics/undraw/science.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/science.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تحليل وبحوث علمية', width: 280, height: 210, imageUrl: '/graphics/undraw/science.svg' });
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
              src="/graphics/undraw/launch-day.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/launch-day.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: يوم الإطلاق السعيد', width: 280, height: 210, imageUrl: '/graphics/undraw/launch-day.svg' });
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
              src="/graphics/undraw/goals.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/goals.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: أهداف منجزة', width: 280, height: 210, imageUrl: '/graphics/undraw/goals.svg' });
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
              src="/graphics/undraw/developer-activity.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/developer-activity.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: تطوير برمجي مكثف', width: 280, height: 210, imageUrl: '/graphics/undraw/developer-activity.svg' });
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
              src="/graphics/undraw/startup-life.svg" 
              className="w-14 h-14 object-contain"
              alt="undraw-preview" 
            />
          </div>
        ),
        action: () => {
          onAddElement('image', '/graphics/undraw/startup-life.svg', { borderRadius: 0 }, { name: 'رسمة unDraw: حياة الشركات الناشئة', width: 280, height: 210, imageUrl: '/graphics/undraw/startup-life.svg' });
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
        title: 'فتح القفل 🔓',
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
        title: 'جدول بيانات متطور',
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
          onAddElement('table', 'جدول متابعة الخدمات والمشاريع', { borderRadius: 16, glowIntensity: 24, glowColor: 'rgba(0,0,0,0.14)', glowPosition: 'bottom' }, { name: 'جدول', width: 420, height: 200 });
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
        title: 'تضمين إطار خارجي',
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

  // «خط فاصل» gathers the shapes' lines and the icons' separator marks in one place.
  const SEPARATOR_ICON_IDS = [
    'icon-sep-stars', 'icon-sep-diamond', 'icon-sep-wave', 'icon-sep-dots',
  ];
  TEMPLATES_MAP.divider = [
    ...(TEMPLATES_MAP.shape || []).filter((t) => t.subCategories.includes('lines')).map((t) => ({ ...t, subCategories: ['lines'] })),
    ...(TEMPLATES_MAP.icons || []).filter((t) => SEPARATOR_ICON_IDS.includes(t.id)).map((t) => ({ ...t, subCategories: ['marks'] })),
  ];
  TEMPLATES_MAP.shape = (TEMPLATES_MAP.shape || []).filter((t) => !t.subCategories.includes('lines'));
  TEMPLATES_MAP.icons = (TEMPLATES_MAP.icons || []).filter((t) => !SEPARATOR_ICON_IDS.includes(t.id));

  return { ADD_CATEGORIES, SUBCATEGORIES_MAP, TEMPLATES_MAP };
};
