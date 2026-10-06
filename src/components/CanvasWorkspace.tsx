import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  CanvasElement,
  Slide,
  NavbarConfig,
  DevicePreviewMode,
  getGlowShadowStyle,
  getLightGradientStyle,
  GalleryItem,
  Page
} from '../types';
import { SLIDE_DIVIDER_OPTIONS } from './SlideDividers';
import { compressImageToTargetSize } from '../utils/imageCompressor';
import { MASK_SHAPES } from '../utils/maskShapes';
import { resolveMobileElement, resolveMobileSlideHeight } from '../utils/mobileLayout';
import { addToCart, useCart } from '../utils/cartStore';
import { CartView } from './CartView';
import { ShopProductsView } from './shop/store/ShopProductsView';
import { ShopSearchView } from './shop/store/ShopSearchView';
import { CarListingsView } from './cars/store/CarListingsView';
import { CarSearchView } from './cars/store/CarSearchView';
import { MenuView } from './restaurant/store/MenuView';
import { MenuCartView } from './restaurant/store/MenuCartView';
import { useMenuCart, menuCartCount } from './restaurant/menuCartStore';
import { CheckoutFormCard } from './CartView';
import { Icon } from '@iconify/react';
import { 
  Trash2, 
  Copy, 
  ExternalLink,
  Plus,
  RotateCw,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  Download
} from 'lucide-react';

interface CanvasWorkspaceProps {
  previewMode: DevicePreviewMode;
  slides: Slide[];
  activeSlideId: string;
  elements: CanvasElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onSelectSlide: (slideId: string) => void;
  onSelectPage?: (pageId: string) => void;
  activePageId?: string;
  // The site's full page list — the navbar's page-name links are derived live from this, so a
  // page added or removed anywhere in the app appears/disappears in the navbar automatically.
  allPages?: Page[];
  onUpdateElementPosition: (id: string, x: number, y: number) => void;
  onUpdateElementSize: (id: string, width: number, height: number, x?: number, y?: number) => void;
  onUpdateElementRotation?: (id: string, rotation: number) => void;
  onCommitElementRotation?: (id: string, rotation: number) => void;
  onUpdateElementContent: (id: string, content: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onUpdateElement?: (id: string, data: Partial<CanvasElement>) => void;
  onAddElement?: (
    type: any, 
    customContent?: string, 
    customStyles?: any,
    extraData?: Partial<CanvasElement>
  ) => void;
  navbar: NavbarConfig;
  isPreviewActive?: boolean;
  onUpdateSlideHeight?: (slideId: string, height: number) => void;
  activeTableCell?: { elementId: string; row: number; col: number } | null;
  onSelectTableCell?: (cell: { elementId: string; row: number; col: number } | null) => void;
  isNavbarSelected?: boolean;
  onSelectNavbar?: () => void;
  // The guests' own view of a published site (no editor around it): fills the browser window
  // edge to edge, with no device frame, in desktop or phone layout.
  isPublicSite?: boolean;
  // Height of the editor's bars above the workspace (the edit bar under the top bar, or not).
  chromeHeight?: number;
}

interface InteractiveCalendarWidgetProps {
  elem: CanvasElement;
}

export const InteractiveCalendarWidget: React.FC<InteractiveCalendarWidgetProps> = ({ elem }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Calendar & Form configurations
  const title = elem.calendarTitle || elem.content || 'حجز موعد جديد';
  const nameLabel = elem.calendarNameLabel || 'الاسم الكامل';
  const addressLabel = elem.calendarAddressLabel || 'العنوان / مكان الإقامة';
  const phoneLabel = elem.calendarPhoneLabel || 'رقم الهاتف المتنقل';
  const emailLabel = elem.calendarEmailLabel || 'البريد الإلكتروني للعميل';
  const descLabel = elem.calendarDescLabel || 'تفاصيل ووصف الطلب';

  const workingDays = elem.calendarWorkingDays || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const holidays = elem.calendarHolidays || ['friday', 'saturday'];
  const workStart = elem.calendarWorkStart || '09:00';
  const workEnd = elem.calendarWorkEnd || '17:00';
  const breakStart = elem.calendarBreakStart || '12:00';
  const breakEnd = elem.calendarBreakEnd || '13:00';
  const interval = elem.calendarInterval || '30';
  const intervalMins = elem.calendarIntervalMinutes || 30;
  const needsConfirmation = elem.calendarNeedsConfirmation ?? true;
  const accentColor = elem.calendarAccentColor || '#0071e3';

  const slots = elem.calendarSlots || ['09:00 ص', '11:30 ص', '02:00 م', '04:30 م'];

  // Allowed meeting types
  const allowedMeetingTypes = elem.calendarMeetingTypes || [elem.calendarMeetingType || 'phone'];
  const [selectedMeetingType, setSelectedMeetingType] = useState<string>(allowedMeetingTypes[0] || 'phone');

  // Sync selected meeting type if configurations change
  useEffect(() => {
    if (allowedMeetingTypes.length > 0 && !allowedMeetingTypes.includes(selectedMeetingType)) {
      setSelectedMeetingType(allowedMeetingTypes[0]);
    }
  }, [elem.calendarMeetingTypes, elem.calendarMeetingType]);

  // Calendar Month states (Default to October 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed, so 9 is October

  const monthNamesArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('الرجاء كتابة الاسم ورقم الهاتف على الأقل لتأكيد حجز الموعد.');
      return;
    }
    setSubmitted(true);
  };

  const getDayOfWeekNameOfDate = (dayNum: number) => {
    const date = new Date(currentYear, currentMonth, dayNum);
    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return daysMap[date.getDay()];
  };

  const isDateHoliday = (dayNum: number) => {
    const dayName = getDayOfWeekNameOfDate(dayNum);
    return holidays.includes(dayName) || !workingDays.includes(dayName);
  };

  const intervalTexts: Record<string, string> = {
    '10': 'موعد كل ١٠ دقائق',
    '15': 'موعد كل ١٥ دقيقة',
    '30': 'موعد كل ٣٠ دقيقة',
    '60': 'موعد كل ساعة كاملة',
    'day': 'موعد واحد يومياً',
    'manual': `موعد كل ${intervalMins} دقيقة`
  };

  const meetingTypeTexts: Record<string, string> = {
    personal: '👤 حضور شخصي بالمقر',
    phone: '📞 مكالمة هاتفية صوتية',
    whatsapp: '📹 اتصال فيديو واتساب'
  };

  // Dynamically calculate time slots based on interval & working hours & breaks
  const formatTime = (totalMins: number) => {
    let h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const ampm = h >= 12 ? 'م' : 'ص';
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${ampm}`;
  };

  const computedSlots = useMemo(() => {
    if (interval === 'day') {
      return ['موعد طوال اليوم (فترة واحدة)'];
    }

    const parseTimeToMins = (tStr: string) => {
      const parts = tStr.split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return h * 60 + m;
    };

    const workStartMins = parseTimeToMins(workStart);
    const workEndMins = parseTimeToMins(workEnd);
    const breakStartMins = parseTimeToMins(breakStart);
    const breakEndMins = parseTimeToMins(breakEnd);

    let duration = 30;
    if (interval === '10') duration = 10;
    else if (interval === '15') duration = 15;
    else if (interval === '30') duration = 30;
    else if (interval === '60') duration = 60;
    else if (interval === 'manual') duration = intervalMins;

    const list: string[] = [];
    let current = workStartMins;

    while (current + duration <= workEndMins) {
      const start = current;
      const end = current + duration;

      // Check break overlap
      const overlapsBreak = start < breakEndMins && end > breakStartMins;

      if (!overlapsBreak) {
        list.push(`${formatTime(start)} - ${formatTime(end)}`);
      }
      current += duration;
    }

    return list.length > 0 ? list : slots;
  }, [interval, intervalMins, workStart, workEnd, breakStart, breakEnd, slots]);

  // Keep selectedSlot valid
  useEffect(() => {
    if (computedSlots.length > 0 && (!selectedSlot || !computedSlots.includes(selectedSlot))) {
      setSelectedSlot(computedSlots[0]);
    }
  }, [computedSlots, selectedSlot]);

  // Handle month switching
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(1);
    setSelectedSlot(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(1);
    setSelectedSlot(null);
  };

  // Get total days in selected month and the starting day of week index
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const emptyDaysPrefix = Array.from({ length: startingDayOfWeek }, (_, i) => i);
  const dayNumbers = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  // Auto-set the first available non-holiday day when month changes
  useEffect(() => {
    const firstValidDay = dayNumbers.find(d => !isDateHoliday(d));
    if (firstValidDay) {
      setSelectedDay(firstValidDay);
    } else {
      setSelectedDay(1);
    }
  }, [currentMonth, currentYear, workingDays, holidays]);

  // Detect card text contrast based on background color
  const cardBg = elem.styles.backgroundColor || '#ffffff';
  const isDarkBg = cardBg.startsWith('#') && (() => {
    const hex = cardBg.substring(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) < 140;
    } else if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) < 140;
    }
    return false;
  })();

  const textStyleClasses = isDarkBg ? 'text-white' : 'text-neutral-800';
  const subTextStyleClasses = isDarkBg ? 'text-white/85' : 'text-neutral-600';
  const labelStyleClasses = isDarkBg ? 'text-white/90 font-bold' : 'text-neutral-700 font-bold';

  if (submitted) {
    return (
      <div 
        className="w-full h-full rounded-2xl border p-4 flex flex-col items-center justify-center text-center select-none overflow-y-auto" 
        dir="rtl"
        style={{ backgroundColor: cardBg, borderColor: isDarkBg ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold mb-2 shadow-xs transition-transform"
          style={{ backgroundColor: accentColor }}
        >
          ✓
        </div>
        <h4 className={`text-xs font-bold mb-1 ${textStyleClasses}`}>تم تسجيل طلب الموعد بنجاح!</h4>
        <p className={`text-[10px] max-w-xs leading-relaxed mb-3 ${subTextStyleClasses}`}>
          شكرًا لك <b>{name}</b>. تم حجز الموعد المبدئي يوم <b>{selectedDay} {monthNamesArabic[currentMonth]} {currentYear}</b> في تمام الساعة <b>{selectedSlot || computedSlots[0]}</b>.
        </p>

        <div className={`w-full rounded-xl border p-2.5 text-right space-y-1 text-[9.5px] mb-3 ${isDarkBg ? 'bg-white/10 border-white/25 text-white/90' : 'bg-neutral-50 border-neutral-100 text-neutral-600'}`}>
          <div>• <b>طريقة المقابلة:</b> {meetingTypeTexts[selectedMeetingType] || meetingTypeTexts['phone']}</div>
          {address && <div>• <b>العنوان:</b> {address}</div>}
          <div>• <b>حالة التأكيد:</b> {needsConfirmation ? '⏳ يتطلب تأكيد الإدارة أولاً' : '⚡ تأكيد فوري ومباشر'}</div>
        </div>

        <button 
          type="button"
          onClick={() => {
            setSubmitted(false);
            setName('');
            setAddress('');
            setPhone('');
            setEmail('');
            setDesc('');
            setSelectedSlot(null);
          }}
          className="px-3.5 py-1.5 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs"
          style={{ backgroundColor: accentColor }}
        >
          حجز موعد جديد
        </button>
      </div>
    );
  }

  const isHorizontal = !elem.width || elem.width >= 520;

  return (
    <div 
      className="w-full h-full rounded-2xl border shadow-xl p-4 flex flex-col text-right select-none overflow-y-auto transition-all relative group" 
      dir="rtl"
      style={{ 
        backgroundColor: cardBg, 
        borderColor: isDarkBg ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.09)',
        boxShadow: isDarkBg ? '0 20px 40px -15px rgba(0,0,0,0.7)' : '0 20px 35px -10px rgba(0,0,0,0.07)'
      }}
    >
      {/* Top Accent Stripe for High-End Apple/Visual Distinction */}
      <div 
        className="w-full h-1.5 shrink-0 rounded-t-xl mb-3 shadow-xs" 
        style={{ backgroundColor: accentColor }} 
      />

      {/* Main Header Bar */}
      <div className="flex items-center justify-between border-b pb-2.5 mb-3 shrink-0" style={{ borderColor: isDarkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            📅
          </div>
          <div>
            <h3 className={`text-sm font-black flex items-center gap-1.5 leading-snug ${textStyleClasses}`}>
              {title}
            </h3>
            <p className={`text-[10px] ${subTextStyleClasses}`}>
              اختر اليوم والساعة المناسبة وأدخل بياناتك لتثبيت الحجز
            </p>
          </div>
        </div>

        {/* Global Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${isDarkBg ? 'bg-white/10 text-white/90' : 'bg-neutral-100 text-neutral-600'}`}>
            ⏱️ {intervalTexts[interval] || 'موعد كل ٣٠ دقيقة'}
          </span>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg ${needsConfirmation ? 'text-amber-800 bg-amber-50 border border-amber-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'}`}>
            {needsConfirmation ? '⏳ تأكيد مطلوب' : '⚡ تأكيد فوري'}
          </span>
        </div>
      </div>

      {/* Main Content Area: Horizontal (2 columns side-by-side) or Vertical Stack */}
      <div className={`flex-1 min-h-0 ${isHorizontal ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex flex-col space-y-4'}`}>
        
        {/* ============================================================== */}
        {/* COLUMN 1: INTERACTIVE MONTH CALENDAR & TIME SLOTS PANE */}
        {/* ============================================================== */}
        <div 
          className={`flex flex-col justify-between rounded-2xl p-3 border shadow-2xs space-y-2.5 ${
            isDarkBg ? 'bg-white/5 border-white/10' : 'bg-neutral-50/80 border-neutral-200/80'
          }`}
        >
          {/* Calendar Month Navigation */}
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/[0.05]">
              <span className={`text-[10.5px] font-bold flex items-center gap-1 ${textStyleClasses}`}>
                <span>🗓️</span>
                <span>اختر تاريخ الموعد:</span>
              </span>
              <div className="flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={handlePrevMonth} 
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] hover:bg-black/[0.08] transition-all cursor-pointer ${textStyleClasses}`}
                  title="الشهر السابق"
                >
                  ◀
                </button>
                <span 
                  className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg text-white shadow-3xs"
                  style={{ backgroundColor: accentColor }}
                >
                  {monthNamesArabic[currentMonth]} {currentYear}
                </span>
                <button 
                  type="button" 
                  onClick={handleNextMonth} 
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] hover:bg-black/[0.08] transition-all cursor-pointer ${textStyleClasses}`}
                  title="الشهر التالي"
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className={`grid grid-cols-7 gap-0.5 text-center text-[9px] font-black mb-1 ${isDarkBg ? 'text-white/60' : 'text-neutral-400'}`}>
              <span>أحد</span>
              <span>اثن</span>
              <span>ثلا</span>
              <span>أرب</span>
              <span>خمي</span>
              <span>جمع</span>
              <span>سبت</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-semibold">
              {emptyDaysPrefix.map((emptyIdx) => (
                <div key={`empty-${emptyIdx}`} className="py-1" />
              ))}

              {dayNumbers.map((day) => {
                const holiday = isDateHoliday(day);
                const isSelected = selectedDay === day;
                
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={holiday}
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedSlot(null);
                    }}
                    className={`py-1.5 rounded-lg transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                      holiday 
                        ? isDarkBg 
                          ? 'bg-white/5 text-white/25 line-through opacity-40 cursor-not-allowed' 
                          : 'bg-red-50 text-red-300 line-through cursor-not-allowed opacity-60' 
                        : isSelected 
                          ? 'text-white font-black shadow-xs ring-2 ring-offset-1' 
                          : isDarkBg 
                            ? 'bg-white/10 border border-white/10 text-white hover:bg-white/20' 
                            : 'bg-white border border-neutral-200 text-neutral-800 hover:border-blue-400 hover:bg-blue-50/50 shadow-3xs'
                    }`}
                    style={{ 
                      backgroundColor: (!holiday && isSelected) ? accentColor : undefined,
                      borderColor: (!holiday && isSelected) ? accentColor : undefined
                    }}
                    title={holiday ? 'عطلة أو خارج أيام العمل' : 'يوم عمل متاح للحجز'}
                  >
                    <span>{day}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="space-y-1.5 border-t pt-2 border-black/[0.05]">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className={`flex items-center gap-1 ${textStyleClasses}`}>
                <span>⏰</span>
                <span>الأوقات المتاحة لهذا اليوم ({computedSlots.length} فترات):</span>
              </span>
              <span className="text-[9px] text-neutral-400 font-normal">
                استراحة: {breakStart} - {breakEnd}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-0.5">
              {computedSlots.map((slot: string, sIdx: number) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`text-[9.5px] py-1.5 px-2 rounded-lg text-center font-bold border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-white border-2 shadow-xs' 
                        : isDarkBg 
                          ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' 
                          : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                    style={{ 
                      borderColor: isSelected ? accentColor : undefined, 
                      color: isSelected ? accentColor : undefined,
                      fontWeight: isSelected ? '800' : '600'
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Booking Chip */}
          <div 
            className="w-full py-1.5 px-2.5 rounded-xl border text-[9.5px] font-bold flex items-center justify-between shrink-0"
            style={{ 
              backgroundColor: isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,113,227,0.06)',
              borderColor: isDarkBg ? 'rgba(255,255,255,0.15)' : 'rgba(0,113,227,0.2)'
            }}
          >
            <span className="flex items-center gap-1 truncate text-neutral-700 dark:text-white">
              <span>📍 الموعد المختار:</span>
              <b style={{ color: accentColor }}>
                {selectedDay} {monthNamesArabic[currentMonth]} {currentYear}
              </b>
            </span>
            <span 
              className="text-white text-[9px] px-2 py-0.5 rounded-md font-mono shrink-0 shadow-3xs"
              style={{ backgroundColor: accentColor }}
            >
              {selectedSlot || computedSlots[0]}
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 2: BOOKING FORM & CLIENT DETAILS */}
        {/* ============================================================== */}
        <div className="flex flex-col justify-between space-y-2.5">
          {/* Meeting Type Selection */}
          <div className="space-y-1">
            <label className={`text-[10px] block ${labelStyleClasses}`}>
              طريقة ومكان إجراء اللقاء:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {allowedMeetingTypes.map((typeKey) => {
                const isSelected = selectedMeetingType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setSelectedMeetingType(typeKey)}
                    className={`text-[9.5px] py-1 px-2.5 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      isSelected 
                        ? 'text-white border-transparent shadow-xs' 
                        : isDarkBg 
                          ? 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10' 
                          : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                    }`}
                    style={{ backgroundColor: isSelected ? accentColor : undefined }}
                  >
                    {meetingTypeTexts[typeKey] || typeKey}
                    {isSelected && <span className="mr-1 text-[8px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="space-y-2">
            {/* Name Input */}
            <div className="space-y-0.5">
              <label className={`text-[9.5px] block ${labelStyleClasses}`}>{nameLabel}</label>
              <input 
                type="text"
                required
                placeholder="اكتب اسمك الكامل هنا"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full text-[10.5px] font-medium px-2.5 py-1.5 rounded-xl border focus:bg-white focus:outline-none transition-all ${
                  isDarkBg 
                    ? 'bg-white/10 border-white/20 text-white focus:border-white' 
                    : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400'
                }`}
              />
            </div>

            {/* Address Input */}
            <div className="space-y-0.5">
              <label className={`text-[9.5px] block ${labelStyleClasses}`}>{addressLabel}</label>
              <input 
                type="text"
                placeholder="مثال: الرياض، حي الياسمين"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full text-[10.5px] font-medium px-2.5 py-1.5 rounded-xl border focus:bg-white focus:outline-none transition-all ${
                  isDarkBg 
                    ? 'bg-white/10 border-white/20 text-white focus:border-white' 
                    : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400'
                }`}
              />
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className={`text-[9.5px] block ${labelStyleClasses}`}>{phoneLabel}</label>
                <input 
                  type="tel"
                  required
                  placeholder="05xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full text-[10.5px] font-medium px-2.5 py-1.5 rounded-xl border focus:bg-white focus:outline-none transition-all text-left ${
                    isDarkBg 
                      ? 'bg-white/10 border-white/20 text-white focus:border-white' 
                      : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400'
                  }`}
                  dir="ltr"
                />
              </div>
              <div className="space-y-0.5">
                <label className={`text-[9.5px] block ${labelStyleClasses}`}>{emailLabel}</label>
                <input 
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full text-[10.5px] font-medium px-2.5 py-1.5 rounded-xl border focus:bg-white focus:outline-none transition-all text-left ${
                    isDarkBg 
                      ? 'bg-white/10 border-white/20 text-white focus:border-white' 
                      : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400'
                  }`}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-0.5">
              <label className={`text-[9.5px] block ${labelStyleClasses}`}>{descLabel}</label>
              <textarea 
                placeholder="اكتب هنا تفاصيل طلبك أو استفسارك..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={1}
                className={`w-full text-[10.5px] font-medium px-2.5 py-1.5 rounded-xl border focus:bg-white focus:outline-none transition-all resize-none ${
                  isDarkBg 
                    ? 'bg-white/10 border-white/20 text-white focus:border-white' 
                    : 'bg-neutral-50 border-neutral-200 focus:border-neutral-400'
                }`}
              />
            </div>
          </div>

          {/* Book Appointment CTA Button */}
          <button 
            type="button"
            onClick={handleBookingSubmit}
            className="w-full mt-2 py-2.5 px-3 text-white rounded-xl text-xs font-black shadow-md transition-all text-center cursor-pointer hover:brightness-110 active:scale-98 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: accentColor }}
          >
            <span>📅</span>
            <span>تأكيد حجز الموعد على التقويم</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  previewMode,
  slides: rawSlides,
  activeSlideId,
  elements: rawElements,
  selectedElementId,
  onSelectElement,
  onSelectSlide,
  onSelectPage,
  activePageId,
  allPages,
  onUpdateElementPosition,
  onUpdateElementSize,
  onUpdateElementRotation,
  onCommitElementRotation,
  onUpdateElementContent,
  onDeleteElement,
  onDuplicateElement,
  onUpdateElement,
  onAddElement,
  navbar,
  isPreviewActive = false,
  onUpdateSlideHeight,
  activeTableCell,
  onSelectTableCell,
  isNavbarSelected = false,
  onSelectNavbar,
  isPublicSite = false,
  chromeHeight = 104,
}) => {
  // In mobile view, elements and slides render with their phone layout ("تنسيق الموبايل") when
  // they have one. Everything below works on these resolved values, so dragging/resizing in mobile
  // view reports phone coordinates (App routes those into `element.mobile`).
  const layoutElements = useMemo(
    () => (previewMode === 'mobile' ? rawElements.map(resolveMobileElement) : rawElements),
    [previewMode, rawElements]
  );
  const layoutSlides = useMemo(
    () =>
      previewMode === 'mobile'
        ? rawSlides.map(s => ({ ...s, height: resolveMobileSlideHeight(s, rawElements) }))
        : rawSlides,
    [previewMode, rawSlides, rawElements]
  );

  // On the live page a store products element grows to fit its cards: it reports how much taller
  // than its box they are, and its slide grows by that much, pushing the elements below it down.
  const [shopGrow, setShopGrow] = useState<Record<string, number>>({});
  const shopGrowHandlers = useRef(new Map<string, (extra: number) => void>());
  const shopGrowHandler = (id: string) => {
    let handler = shopGrowHandlers.current.get(id);
    if (!handler) {
      handler = (extra: number) =>
        setShopGrow((g) => ((g[id] || 0) === extra ? g : { ...g, [id]: extra }));
      shopGrowHandlers.current.set(id, handler);
    }
    return handler;
  };
  const growing = isPreviewActive ? layoutElements.filter((e) => (shopGrow[e.id] || 0) > 0) : [];
  const elements = useMemo(() => {
    if (!growing.length) return layoutElements;
    return layoutElements.map((e) => {
      const own = shopGrow[e.id] || 0;
      const shift = growing
        .filter((g) => g.id !== e.id && g.slideId === e.slideId && e.y >= g.y + g.height - 2)
        .reduce((sum, g) => sum + (shopGrow[g.id] || 0), 0);
      return own || shift ? { ...e, y: e.y + shift, height: e.height + own } : e;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutElements, shopGrow, isPreviewActive]);
  const slides = useMemo(() => {
    if (!growing.length) return layoutSlides;
    return layoutSlides.map((sl) => {
      const extra = growing.filter((g) => g.slideId === sl.id).reduce((sum, g) => sum + (shopGrow[g.id] || 0), 0);
      return extra ? { ...sl, height: sl.height + extra } : sl;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutSlides, shopGrow, isPreviewActive]);

  // Hamburger menu of the navbar on phones (navbar.mobileMenu).
  const isNavHamburger = previewMode === 'mobile' && !!navbar.mobileMenu;
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  useEffect(() => {
    if (!isNavHamburger) setIsNavMenuOpen(false);
  }, [isNavHamburger]);

  // Workspace width observer & Scaling calculation
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceWidth, setWorkspaceWidth] = useState(1280);

  const localScaleRef = useRef(1);
  const navbarRef = useRef<HTMLElement>(null);

  // "Fixed" backgrounds (slides and elements). Native `background-attachment: fixed` cannot be
  // used because the canvas lives inside a CSS-transformed (scaled) wrapper. Each fixed background
  // is instead a viewport-sized `.bg-fixed-layer` translated against the scroll so it stays pinned
  // to the visible area.
  //
  // Where the browser supports scroll-driven animations (see `.bg-fixed-layer` in index.css), the
  // translation is a linear animation on the workspace's scroll timeline, run by the compositor in
  // lock-step with scrolling — no JS on scroll, so no shaking. JS only measures the start/end
  // offsets, and does so when layout changes (resize, zoom, re-render), not on every scroll.
  // Older browsers fall back to setting the transform from the scroll event.
  const supportsScrollTimeline =
    typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline', 'scroll()');

  const syncFixedBackgrounds = () => {
    const scrollEl = workspaceRef.current;
    if (!scrollEl) return;
    const viewRect = scrollEl.getBoundingClientRect();
    const currentScale = localScaleRef.current || 1;
    const scrollTop = scrollEl.scrollTop;
    const maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);

    scrollEl.querySelectorAll<HTMLElement>('.bg-fixed-layer').forEach((layer) => {
      const host = layer.parentElement;
      if (!host) return;
      const hostRect = host.getBoundingClientRect();
      // Host top in scroll-content coordinates (screen px), independent of the current scroll.
      const hostTopInContent = hostRect.top - viewRect.top + scrollTop;
      const offsetAt = (scroll: number) => (scroll - hostTopInContent) / currentScale;
      const isXY = layer.dataset.fixedAxis === 'xy';
      const offsetX = isXY ? (viewRect.left - hostRect.left) / currentScale : 0;

      layer.style.height = `${scrollEl.clientHeight / currentScale}px`;
      if (isXY) layer.style.width = `${scrollEl.clientWidth / currentScale}px`;

      if (supportsScrollTimeline) {
        layer.style.setProperty('--fbg-x', `${offsetX}px`);
        layer.style.setProperty('--fbg-from', `${offsetAt(0)}px`);
        layer.style.setProperty('--fbg-to', `${offsetAt(maxScroll)}px`);
      } else {
        layer.style.transform = `translate3d(${offsetX}px, ${offsetAt(scrollTop)}px, 0)`;
      }
    });
  };
  const syncFixedBackgroundsRef = useRef(syncFixedBackgrounds);
  syncFixedBackgroundsRef.current = syncFixedBackgrounds;

  useEffect(() => {
    // Fires on layout changes (and, only in the no-scroll-timeline fallback, on scroll).
    const handleScroll = () => syncFixedBackgroundsRef.current();
    // Note: the navbar does not need any JS-driven scroll handling — it lives outside the device
    // frame's transformed ancestor and uses native CSS `position: sticky` directly.

    const scrollEl = workspaceRef.current;
    const needsScrollListener = !supportsScrollTimeline;
    if (scrollEl && needsScrollListener) {
      scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    if (scrollEl) {
      // Zoom / device-frame changes animate; re-pin once they settle.
      scrollEl.addEventListener('transitionend', handleScroll);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleScroll);
    }

    // The scroll range changes whenever the workspace or its content is resized.
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleScroll) : null;
    if (scrollEl && resizeObserver) {
      resizeObserver.observe(scrollEl);
      Array.from(scrollEl.children).forEach((child) => resizeObserver.observe(child));
    }

    // Direct initialization
    const timer = setTimeout(handleScroll, 100);

    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', handleScroll);
        scrollEl.removeEventListener('transitionend', handleScroll);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleScroll);
      }
    };
  }, []);

  // Re-measure after every render: a slide/element just switched to "fixed", heights changed, or
  // the zoom (scale) changed.
  useEffect(() => {
    syncFixedBackgroundsRef.current();
  });

  const getSlideUnscaledTop = (targetSlideId: string) => {
    let top = navbar.height ?? 60; // navbar height (configurable)
    for (const s of slides) {
      if (s.id === targetSlideId) {
        return top;
      }
      top += s.height;
    }
    return top;
  };

  // Gallery Lightbox modal state (fullscreen viewer)
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    items: GalleryItem[];
    activeIndex: number;
    title?: string;
  } | null>(null);

  useEffect(() => {
    if (!lightboxState?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxState(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxState(prev => {
          if (!prev) return null;
          const nextIdx = (prev.activeIndex + 1) % prev.items.length;
          return { ...prev, activeIndex: nextIdx };
        });
      } else if (e.key === 'ArrowLeft') {
        setLightboxState(prev => {
          if (!prev) return null;
          const prevIdx = (prev.activeIndex - 1 + prev.items.length) % prev.items.length;
          return { ...prev, activeIndex: prevIdx };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState?.isOpen]);

  const handleDownloadLightboxImage = async (url: string, name?: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${name || 'gallery-image'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (!workspaceRef.current) return;
    const handleResize = () => {
      if (workspaceRef.current) {
        setWorkspaceWidth(workspaceRef.current.clientWidth);
      }
    };
    handleResize();
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(workspaceRef.current);
    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const baseWidth = previewMode === 'mobile' ? 380 : (previewMode === 'tablet' ? 768 : 1280);

  // Calculate dynamic scaling factor to fit workspace
  // The full preview and the published site (desktop) show the page at its real size, never
  // blown up: on a window wider than the page the content stays 1280px wide and centered, while
  // the slides' backgrounds, edge-to-edge elements and the navbar stretch to the window's edges.
  const isFluidDesktop = (isPublicSite || isPreviewActive) && previewMode === 'desktop';
  let scaleFactor = 1;
  if (isFluidDesktop) {
    scaleFactor = Math.min(1, workspaceWidth / baseWidth);
  } else if (isPublicSite) {
    scaleFactor = workspaceWidth / baseWidth;
  } else if (previewMode === 'mobile') {
    if (workspaceWidth < 420) {
      scaleFactor = (workspaceWidth - 32) / 380;
    }
  } else if (previewMode === 'tablet') {
    if (workspaceWidth < 810) {
      scaleFactor = (workspaceWidth - 32) / 768;
    }
  } else {
    // Desktop mode
    if (isPreviewActive) {
      scaleFactor = workspaceWidth / 1280;
    } else {
      scaleFactor = Math.min(1, (workspaceWidth - 48) / 1280);
    }
  }
  scaleFactor = Math.max(0.1, scaleFactor);
  localScaleRef.current = scaleFactor;
  // Extra unscaled width on each side of the 1280px page when the window is wider than it.
  const bleed = isFluidDesktop ? Math.max(0, Math.floor((workspaceWidth / scaleFactor - baseWidth) / 2)) : 0;
  const frameWidth = baseWidth + bleed * 2;

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  // Rotating state (تدوير العنصر في مركزه)
  const [isRotating, setIsRotating] = useState(false);
  const [rotatingAngle, setRotatingAngle] = useState<number>(0);

  // Alignment / Snapping Guides State
  const [activeGuides, setActiveGuides] = useState<{
    vertical: { x: number; label?: string } | null;
    horizontal: { y: number; label?: string } | null;
  }>({ vertical: null, horizontal: null });

  // Drag over slide state for direct gallery photo dropping
  const [dragOverSlideId, setDragOverSlideId] = useState<string | null>(null);
  const [isDroppingPhoto, setIsDroppingPhoto] = useState(false);

  // Touch & Direct Edit Focus States for Mobile & Touch Screens
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<{ id: string; time: number } | null>(null);
  const pinchStartRef = useRef<{
    dist: number;
    angle: number;
    width: number;
    height: number;
    rotation: number;
  } | null>(null);

  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Slide height resizing states
  const [resizingSlideId, setResizingSlideId] = useState<string | null>(null);
  const [slideResizeStartY, setSlideResizeStartY] = useState<number>(0);
  const [slideResizeStartHeight, setSlideResizeStartHeight] = useState<number>(0);

  // Slides height resizing global listeners effect
  useEffect(() => {
    if (!resizingSlideId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dy = (e.clientY - slideResizeStartY) / scaleFactor;
      const newHeight = Math.max(200, Math.min(2000, Math.round(slideResizeStartHeight + dy)));
      if (onUpdateSlideHeight) {
        onUpdateSlideHeight(resizingSlideId, newHeight);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dy = (touch.clientY - slideResizeStartY) / scaleFactor;
      const newHeight = Math.max(200, Math.min(2000, Math.round(slideResizeStartHeight + dy)));
      if (onUpdateSlideHeight) {
        onUpdateSlideHeight(resizingSlideId, newHeight);
      }
    };

    const handleMouseUp = () => {
      setResizingSlideId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [resizingSlideId, slideResizeStartY, slideResizeStartHeight, scaleFactor, onUpdateSlideHeight]);

  // Table column/row resizing logic inside CanvasWorkspace.tsx
  const [resizingTableId, setResizingTableId] = useState<string | null>(null);
  const [resizingTableColIdx, setResizingTableColIdx] = useState<number | null>(null);
  const [resizingTableRowIdx, setResizingTableRowIdx] = useState<number | null>(null);
  const [tableResizeStartX, setTableResizeStartX] = useState<number>(0);
  const [tableResizeStartY, setTableResizeStartY] = useState<number>(0);
  const [tableResizeStartWidths, setTableResizeStartWidths] = useState<number[]>([]);
  const [tableResizeStartHeights, setTableResizeStartHeights] = useState<number[]>([]);

  useEffect(() => {
    if (!resizingTableId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const targetElem = elements.find(el => el.id === resizingTableId);
      if (!targetElem || !targetElem.tableConfig) return;

      if (resizingTableColIdx !== null) {
        const dx = (tableResizeStartX - e.clientX) / scaleFactor;
        const startW = tableResizeStartWidths[resizingTableColIdx] || 120;
        const newW = Math.max(35, Math.min(400, Math.round(startW + dx)));
        
        const newWidths = [...targetElem.tableConfig.colWidths];
        newWidths[resizingTableColIdx] = newW;
        
        const totalW = newWidths.reduce((sum, w) => sum + w, 0) + (targetElem.tableConfig.indexCol ? 50 : 0);

        onUpdateElementSize(resizingTableId, Math.max(200, totalW), targetElem.height);
        if (onUpdateElement) {
          onUpdateElement(resizingTableId, {
            tableConfig: {
              ...targetElem.tableConfig,
              colWidths: newWidths
            }
          });
        }
      } else if (resizingTableRowIdx !== null) {
        const dy = (e.clientY - tableResizeStartY) / scaleFactor;
        const startH = tableResizeStartHeights[resizingTableRowIdx] || 40;
        const newH = Math.max(20, Math.min(200, Math.round(startH + dy)));

        const newHeights = [...targetElem.tableConfig.rowHeights];
        newHeights[resizingTableRowIdx] = newH;

        const totalH = newHeights.reduce((sum, h) => sum + h, 0);

        onUpdateElementSize(resizingTableId, targetElem.width, Math.max(80, totalH));
        if (onUpdateElement) {
          onUpdateElement(resizingTableId, {
            tableConfig: {
              ...targetElem.tableConfig,
              rowHeights: newHeights
            }
          });
        }
      }
    };

    const handleMouseUp = () => {
      setResizingTableId(null);
      setResizingTableColIdx(null);
      setResizingTableRowIdx(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTableId, resizingTableColIdx, resizingTableRowIdx, tableResizeStartX, tableResizeStartY, tableResizeStartWidths, tableResizeStartHeights, scaleFactor, elements]);

  // Table action helpers
  const handleTableAddRow = (elemId: string) => {
    const targetElem = elements.find(el => el.id === elemId);
    if (!targetElem || !targetElem.tableConfig) return;

    const currentConfig = targetElem.tableConfig;
    const newRows = currentConfig.rows + 1;
    const newCells = [...currentConfig.cells, Array(currentConfig.cols).fill('')];
    const newHeights = [...currentConfig.rowHeights, 40];

    const calculatedHeight = newHeights.reduce((sum, h) => sum + h, 0);
    onUpdateElementSize(elemId, targetElem.width, Math.max(120, calculatedHeight));
    if (onUpdateElement) {
      onUpdateElement(elemId, {
        tableConfig: {
          ...currentConfig,
          rows: newRows,
          cells: newCells,
          rowHeights: newHeights
        }
      });
    }
  };

  const handleTableAddColumn = (elemId: string) => {
    const targetElem = elements.find(el => el.id === elemId);
    if (!targetElem || !targetElem.tableConfig) return;

    const currentConfig = targetElem.tableConfig;
    const newCols = currentConfig.cols + 1;
    const newCells = currentConfig.cells.map(row => [...row, '']);
    const newWidths = [...currentConfig.colWidths, 120];

    const calculatedWidth = newWidths.reduce((sum, w) => sum + w, 0) + (currentConfig.indexCol ? 50 : 0);
    onUpdateElementSize(elemId, Math.max(300, calculatedWidth), targetElem.height);
    if (onUpdateElement) {
      onUpdateElement(elemId, {
        tableConfig: {
          ...currentConfig,
          cols: newCols,
          cells: newCells,
          colWidths: newWidths
        }
      });
    }
  };

  const handleTableDeleteRow = (elemId: string, rowIndex: number) => {
    const targetElem = elements.find(el => el.id === elemId);
    if (!targetElem || !targetElem.tableConfig) return;

    const currentConfig = targetElem.tableConfig;
    if (currentConfig.rows <= 1) return;

    const newRows = currentConfig.rows - 1;
    const newCells = currentConfig.cells.filter((_, idx) => idx !== rowIndex);
    const newHeights = currentConfig.rowHeights.filter((_, idx) => idx !== rowIndex);

    const calculatedHeight = newHeights.reduce((sum, h) => sum + h, 0);
    onUpdateElementSize(elemId, targetElem.width, Math.max(80, calculatedHeight));
    if (onUpdateElement) {
      onUpdateElement(elemId, {
        tableConfig: {
          ...currentConfig,
          rows: newRows,
          cells: newCells,
          rowHeights: newHeights
        }
      });
    }
  };

  const handleTableDeleteColumn = (elemId: string, colIndex: number) => {
    const targetElem = elements.find(el => el.id === elemId);
    if (!targetElem || !targetElem.tableConfig) return;

    const currentConfig = targetElem.tableConfig;
    if (currentConfig.cols <= 1) return;

    const newCols = currentConfig.cols - 1;
    const newCells = currentConfig.cells.map(row => row.filter((_, idx) => idx !== colIndex));
    const newWidths = currentConfig.colWidths.filter((_, idx) => idx !== colIndex);

    const calculatedWidth = newWidths.reduce((sum, w) => sum + w, 0) + (currentConfig.indexCol ? 50 : 0);
    onUpdateElementSize(elemId, Math.max(200, calculatedWidth), targetElem.height);
    if (onUpdateElement) {
      onUpdateElement(elemId, {
        tableConfig: {
          ...currentConfig,
          cols: newCols,
          cells: newCells,
          colWidths: newWidths
        }
      });
    }
  };

  const handleTableUpdateCell = (elemId: string, rowIndex: number, colIndex: number, text: string) => {
    const targetElem = elements.find(el => el.id === elemId);
    if (!targetElem || !targetElem.tableConfig) return;

    const currentConfig = targetElem.tableConfig;
    const newCells = currentConfig.cells.map((row, rIdx) => {
      if (rIdx !== rowIndex) return row;
      return row.map((cell, cIdx) => (cIdx === colIndex ? text : cell));
    });

    if (onUpdateElement) {
      onUpdateElement(elemId, {
        tableConfig: {
          ...currentConfig,
          cells: newCells
        }
      });
    }
  };

  // Mutable refs to prevent useEffect listener recreation on every frame
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const selectedElementRef = useRef(selectedElement);
  selectedElementRef.current = selectedElement;
  const slidesRef = useRef(slides);
  slidesRef.current = slides;
  const scaleFactorRef = useRef(scaleFactor);
  scaleFactorRef.current = scaleFactor;
  const baseWidthRef = useRef(baseWidth);
  baseWidthRef.current = baseWidth;

  const dragStartRef = useRef(dragStart);
  dragStartRef.current = dragStart;
  const resizeStartRef = useRef(resizeStart);
  resizeStartRef.current = resizeStart;
  const resizeHandleRef = useRef(resizeHandle);
  resizeHandleRef.current = resizeHandle;
  const rotatingAngleRef = useRef(rotatingAngle);
  rotatingAngleRef.current = rotatingAngle;

  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const isResizingRef = useRef(isResizing);
  isResizingRef.current = isResizing;
  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  // Animation frame batching refs for silky smooth 60fps/120fps motion
  const rafIdRef = useRef<number | null>(null);
  const pendingDragPosRef = useRef<{
    id: string;
    x: number;
    y: number;
    guides: { vertical: any; horizontal: any };
  } | null>(null);
  const pendingResizeRef = useRef<{
    id: string;
    w: number;
    h: number;
    x: number;
    y: number;
    guides: { vertical: any; horizontal: any };
  } | null>(null);

  // Handle Dragging elements
  const handleElementMouseDown = (e: React.MouseEvent, elem: CanvasElement) => {
    if (isPreviewActive) return;
    if (elem.isLocked) return;
    e.stopPropagation();

    // Prevent browser native image ghost drag & selection unless interacting with editable text
    const target = e.target as HTMLElement | null;
    const isTextEditable = target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
    if (!isTextEditable) {
      e.preventDefault();
    }

    onSelectElement(elem.id);
    onSelectSlide(elem.slideId);

    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
    });
  };

  // Touch Start on Element (Single tap to select, Double tap for direct edit, Long-press to drag)
  const handleElementTouchStart = (e: React.TouchEvent, elem: CanvasElement) => {
    if (isPreviewActive || elem.isLocked) return;

    // 1. Two fingers on focused element: Enter pinch to resize/rotate
    if (focusedElementId === elem.id && e.touches.length === 2) {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const angle = (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) / Math.PI;

      pinchStartRef.current = {
        dist,
        angle,
        width: elem.width,
        height: elem.height,
        rotation: elem.rotation || 0,
      };
      setIsPinching(true);
      return;
    }

    // 2. Single finger touch
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      // Double-tap detection (< 320ms on same element) -> activates Direct Edit Mode
      const now = Date.now();
      const lastTap = lastTapTimeRef.current;
      if (lastTap && lastTap.id === elem.id && (now - lastTap.time) < 320) {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        setFocusedElementId(elem.id);
        onSelectElement(elem.id);
        onSelectSlide(elem.slideId);
        lastTapTimeRef.current = null;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([25, 40, 25]); } catch {}
        }
        return;
      }
      lastTapTimeRef.current = { id: elem.id, time: now };

      // Single tap selects the element immediately
      onSelectElement(elem.id);
      onSelectSlide(elem.slideId);

      // Long press (260ms) enables drag mode without conflicting with vertical page scrolling
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        setIsTouchDragging(true);
        setIsDragging(true);
        setDragStart({
          mouseX: touch.clientX,
          mouseY: touch.clientY,
          elemX: elem.x,
          elemY: elem.y,
        });
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(45); } catch {}
        }
      }, 260);
    }
  };

  const handleElementTouchMove = (e: React.TouchEvent) => {
    // If finger moves > 8px before 260ms timer fires, user is scrolling page -> cancel long-press
    if (!isTouchDragging && touchStartPosRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - touchStartPosRef.current.x, touch.clientY - touchStartPosRef.current.y);
      if (dist > 8) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }
  };

  const handleElementTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Handle Resizing elements on mouse
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string, elem: CanvasElement) => {
    if (isPreviewActive) return;
    if (elem.isLocked) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: elem.width,
      height: elem.height,
      x: elem.x,
      y: elem.y,
    });
  };

  // Handle Resizing elements on touch
  const handleResizeTouchStart = (e: React.TouchEvent, handle: string, elem: CanvasElement) => {
    if (isPreviewActive || elem.isLocked) return;
    e.stopPropagation();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({
        mouseX: touch.clientX,
        mouseY: touch.clientY,
        width: elem.width,
        height: elem.height,
        x: elem.x,
        y: elem.y,
      });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(20); } catch {}
      }
    }
  };

  // Handle Rotating elements around their center (تدوير العنصر في مركزه)
  const handleRotateMouseDown = (e: React.MouseEvent, elem: CanvasElement) => {
    if (isPreviewActive) return;
    if (elem.isLocked) return;
    e.stopPropagation();
    setIsRotating(true);
    setRotatingAngle(elem.rotation || 0);
  };

  // Global mouse move & up listeners for drag & resize & rotate
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const curSelectedElem = selectedElementRef.current;
      const curDragStart = dragStartRef.current;
      const curScale = scaleFactorRef.current;
      const curSlides = slidesRef.current;
      const curElements = elementsRef.current;
      const curBaseWidth = baseWidthRef.current;

      if (isDraggingRef.current && curDragStart && curSelectedElem) {
        if (e.cancelable) e.preventDefault();
        const dx = (e.clientX - curDragStart.mouseX) / curScale;
        const dy = (e.clientY - curDragStart.mouseY) / curScale;
        const newX = curDragStart.elemX + dx;
        const newY = curDragStart.elemY + dy;

        // Get slide container dimensions
        const slideContainer = document.getElementById(`slide-container-${curSelectedElem.slideId}`);
        const slideWidth = slideContainer ? slideContainer.clientWidth : curBaseWidth;
        const slideHeight = curSlides.find(s => s.id === curSelectedElem.slideId)?.height || 560;

        // Get other elements in the same slide
        const otherElements = curElements.filter(el => el.slideId === curSelectedElem.slideId && el.id !== curSelectedElem.id);

        // Smooth snapping: 6px threshold, can be bypassed completely by holding Shift or Alt
        const bypassSnapping = e.altKey || e.shiftKey;
        const SNAP_THRESHOLD = bypassSnapping ? 0 : 6;
        let snappedX = newX;
        let snappedY = newY;
        let verticalGuide: { x: number; label?: string } | null = null;
        let horizontalGuide: { y: number; label?: string } | null = null;

        if (!bypassSnapping) {
          // --- X Axis (Vertical guides) ---
          const xTargets = [
            { val: slideWidth / 2, label: 'منتصف الساحة' }
          ];
          otherElements.forEach(other => {
            xTargets.push({ val: other.x, label: `${other.name} (يمين)` });
            xTargets.push({ val: other.x + other.width, label: `${other.name} (يسار)` });
            xTargets.push({ val: other.x + other.width / 2, label: `${other.name} (المنتصف)` });
          });

          let bestXDiff = SNAP_THRESHOLD;
          let bestXSnap = null;
          let bestXGuideVal = 0;
          let bestXLabel = '';

          xTargets.forEach(target => {
            // Dragged left alignment
            const diffLeft = Math.abs(newX - target.val);
            if (diffLeft < bestXDiff) {
              bestXDiff = diffLeft;
              bestXSnap = target.val;
              bestXGuideVal = target.val;
              bestXLabel = target.label;
            }
            // Dragged right alignment
            const diffRight = Math.abs((newX + curSelectedElem.width) - target.val);
            if (diffRight < bestXDiff) {
              bestXDiff = diffRight;
              bestXSnap = target.val - curSelectedElem.width;
              bestXGuideVal = target.val;
              bestXLabel = target.label;
            }
            // Dragged center alignment
            const diffCenter = Math.abs((newX + curSelectedElem.width / 2) - target.val);
            if (diffCenter < bestXDiff) {
              bestXDiff = diffCenter;
              bestXSnap = target.val - curSelectedElem.width / 2;
              bestXGuideVal = target.val;
              bestXLabel = target.label;
            }
          });

          if (bestXSnap !== null) {
            snappedX = bestXSnap;
            verticalGuide = { x: bestXGuideVal, label: bestXLabel };
          }

          // --- Y Axis (Horizontal guides) ---
          const yTargets = [
            { val: slideHeight / 2, label: 'منتصف الساحة' }
          ];
          otherElements.forEach(other => {
            xTargets.push({ val: other.y, label: `${other.name} (أعلى)` });
            xTargets.push({ val: other.y + other.height, label: `${other.name} (أسفل)` });
            xTargets.push({ val: other.y + other.height / 2, label: `${other.name} (المنتصف)` });
          });

          let bestYDiff = SNAP_THRESHOLD;
          let bestYSnap = null;
          let bestYGuideVal = 0;
          let bestYLabel = '';

          yTargets.forEach(target => {
            // Dragged top alignment
            const diffTop = Math.abs(newY - target.val);
            if (diffTop < bestYDiff) {
              bestYDiff = diffTop;
              bestYSnap = target.val;
              bestYGuideVal = target.val;
              bestYLabel = target.label;
            }
            // Dragged bottom alignment
            const diffBottom = Math.abs((newY + curSelectedElem.height) - target.val);
            if (diffBottom < bestYDiff) {
              bestYDiff = diffBottom;
              bestYSnap = target.val - curSelectedElem.height;
              bestYGuideVal = target.val;
              bestYLabel = target.label;
            }
            // Dragged center alignment
            const diffCenter = Math.abs((newY + curSelectedElem.height / 2) - target.val);
            if (diffCenter < bestYDiff) {
              bestYDiff = diffCenter;
              bestYSnap = target.val - curSelectedElem.height / 2;
              bestYGuideVal = target.val;
              bestYLabel = target.label;
            }
          });

          if (bestYSnap !== null) {
            snappedY = bestYSnap;
            horizontalGuide = { y: bestYGuideVal, label: bestYLabel };
          }
        }

        // Apply bounds to prevent elements going completely out of slide bounds
        const finalX = Math.max(-curSelectedElem.width + 20, Math.min(slideWidth - 20, snappedX));
        const finalY = Math.max(-curSelectedElem.height + 20, Math.min(slideHeight - 20, snappedY));

        pendingDragPosRef.current = {
          id: curSelectedElem.id,
          x: Math.round(finalX),
          y: Math.round(finalY),
          guides: { vertical: verticalGuide, horizontal: horizontalGuide }
        };

        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            if (pendingDragPosRef.current) {
              const { id, x, y, guides } = pendingDragPosRef.current;
              onUpdateElementPosition(id, x, y);
              setActiveGuides(guides);
              pendingDragPosRef.current = null;
            }
          });
        }

      } else if (isResizing && resizeStart && selectedElement && resizeHandle) {
        const dx = (e.clientX - resizeStart.mouseX) / scaleFactor;
        const dy = (e.clientY - resizeStart.mouseY) / scaleFactor;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = resizeStart.x;
        let newY = resizeStart.y;

        // Get slide container dimensions
        const slideContainer = document.getElementById(`slide-container-${selectedElement.slideId}`);
        const slideWidth = slideContainer ? slideContainer.clientWidth : baseWidth;
        const slideHeight = slides.find(s => s.id === selectedElement.slideId)?.height || 560;

        const otherElements = elements.filter(el => el.slideId === selectedElement.slideId && el.id !== selectedElement.id);

        const SNAP_THRESHOLD = 8;
        let verticalGuide: { x: number; label?: string } | null = null;
        let horizontalGuide: { y: number; label?: string } | null = null;

        if (resizeHandle.includes('e')) {
          let targetWidth = resizeStart.width + dx;
          let calculatedRight = resizeStart.x + targetWidth;

          const xTargets = [
            { val: slideWidth / 2, label: 'منتصف الساحة' }
          ];
          otherElements.forEach(other => {
            xTargets.push({ val: other.x, label: `${other.name} (يمين)` });
            xTargets.push({ val: other.x + other.width, label: `${other.name} (يسار)` });
            xTargets.push({ val: other.x + other.width / 2, label: `${other.name} (المنتصف)` });
          });

          let bestXDiff = SNAP_THRESHOLD;
          let bestXSnap = null;
          let bestXGuideVal = 0;
          let bestXLabel = '';

          xTargets.forEach(target => {
            const diff = Math.abs(calculatedRight - target.val);
            if (diff < bestXDiff) {
              bestXDiff = diff;
              bestXSnap = target.val;
              bestXGuideVal = target.val;
              bestXLabel = target.label;
            }
          });

          if (bestXSnap !== null) {
            targetWidth = bestXSnap - resizeStart.x;
            verticalGuide = { x: bestXGuideVal, label: bestXLabel };
          }
          newWidth = Math.max(40, targetWidth);
        }

        if (resizeHandle.includes('w')) {
          let targetX = resizeStart.x + dx;
          let targetWidth = resizeStart.width - dx;

          const xTargets = [
            { val: slideWidth / 2, label: 'منتصف الساحة' }
          ];
          otherElements.forEach(other => {
            xTargets.push({ val: other.x, label: `${other.name} (يمين)` });
            xTargets.push({ val: other.x + other.width, label: `${other.name} (يسار)` });
            xTargets.push({ val: other.x + other.width / 2, label: `${other.name} (المنتصف)` });
          });

          let bestXDiff = SNAP_THRESHOLD;
          let bestXSnap = null;
          let bestXGuideVal = 0;
          let bestXLabel = '';

          xTargets.forEach(target => {
            const diff = Math.abs(targetX - target.val);
            if (diff < bestXDiff) {
              bestXDiff = diff;
              bestXSnap = target.val;
              bestXGuideVal = target.val;
              bestXLabel = target.label;
            }
          });

          if (bestXSnap !== null) {
            targetX = bestXSnap;
            targetWidth = (resizeStart.x + resizeStart.width) - targetX;
            verticalGuide = { x: bestXGuideVal, label: bestXLabel };
          }

          if (targetWidth > 40) {
            newWidth = targetWidth;
            newX = targetX;
          } else {
            newWidth = 40;
            newX = resizeStart.x + resizeStart.width - 40;
          }
        }

        if (resizeHandle.includes('s')) {
          let targetHeight = resizeStart.height + dy;
          let calculatedBottom = resizeStart.y + targetHeight;

          const yTargets = [
            { val: slideHeight / 2, label: 'منتصف الساحة' }
          ];
          otherElements.forEach(other => {
            yTargets.push({ val: other.y, label: `${other.name} (أعلى)` });
            yTargets.push({ val: other.y + other.height, label: `${other.name} (أسفل)` });
            yTargets.push({ val: other.y + other.height / 2, label: `${other.name} (المنتصف)` });
          });

          let bestYDiff = SNAP_THRESHOLD;
          let bestYSnap = null;
          let bestYGuideVal = 0;
          let bestYLabel = '';

          yTargets.forEach(target => {
            const diff = Math.abs(calculatedBottom - target.val);
            if (diff < bestYDiff) {
              bestYDiff = diff;
              bestYSnap = target.val;
              bestYGuideVal = target.val;
              bestYLabel = target.label;
            }
          });

          if (bestYSnap !== null) {
            targetHeight = bestYSnap - resizeStart.y;
            horizontalGuide = { y: bestYGuideVal, label: bestYLabel };
          }
          newHeight = Math.max(24, targetHeight);
        }

        if (resizeHandle.includes('n')) {
          let targetY = resizeStart.y + dy;
          let targetHeight = resizeStart.height - dy;

          const yTargets = [
            { val: slideHeight / 2, label: 'منتصف الساحة' }
          ];
          otherElements.forEach(other => {
            yTargets.push({ val: other.y, label: `${other.name} (أعلى)` });
            yTargets.push({ val: other.y + other.height, label: `${other.name} (أسفل)` });
            yTargets.push({ val: other.y + other.height / 2, label: `${other.name} (المنتصف)` });
          });

          let bestYDiff = SNAP_THRESHOLD;
          let bestYDiff_T = SNAP_THRESHOLD;
          let bestYSnap = null;
          let bestYGuideVal = 0;
          let bestYLabel = '';

          yTargets.forEach(target => {
            const diff = Math.abs(targetY - target.val);
            if (diff < bestYDiff_T) {
              bestYDiff_T = diff;
              bestYSnap = target.val;
              bestYGuideVal = target.val;
              bestYLabel = target.label;
            }
          });

          if (bestYSnap !== null) {
            targetY = bestYSnap;
            targetHeight = (resizeStart.y + resizeStart.height) - targetY;
            horizontalGuide = { y: bestYGuideVal, label: bestYLabel };
          }

          if (targetHeight > 24) {
            newHeight = targetHeight;
            newY = targetY;
          } else {
            newHeight = 24;
            newY = resizeStart.y + resizeStart.height - 24;
          }
        }

        onUpdateElementSize(selectedElement.id, Math.round(newWidth), Math.round(newHeight), Math.round(newX), Math.round(newY));
        setActiveGuides({ vertical: verticalGuide, horizontal: horizontalGuide });
      } else if (isRotating && selectedElement) {
        const elemNode = document.getElementById(`canvas-elem-${selectedElement.id}`);
        if (elemNode) {
          const rect = elemNode.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          // Rotation handle is at bottom, so offset by -90deg so handle points at 0deg
          let deg = Math.round(rad * (180 / Math.PI)) - 90;
          deg = (deg % 360 + 360) % 360;

          // Snap to 0, 45, 90, 135, 180, 225, 270, 315 within 4 degrees threshold
          const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
          for (const snap of snapAngles) {
            if (Math.abs(deg - snap) <= 4) {
              deg = snap % 360;
              break;
            }
          }

          setRotatingAngle(deg);
          onUpdateElementRotation?.(selectedElement.id, deg);
        }
      }
    };

    const handleMouseUp = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (pendingDragPosRef.current) {
        const { id, x, y } = pendingDragPosRef.current;
        onUpdateElementPosition(id, x, y);
        pendingDragPosRef.current = null;
      }
      if (pendingResizeRef.current) {
        const { id, w, h, x, y } = pendingResizeRef.current;
        onUpdateElementSize(id, w, h, x, y);
        pendingResizeRef.current = null;
      }

      if (isRotating && selectedElement) {
        onCommitElementRotation?.(selectedElement.id, rotatingAngle);
      }
      setIsDragging(false);
      setDragStart(null);
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
      setIsRotating(false);
      setActiveGuides({ vertical: null, horizontal: null });
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 1. Two-finger pinch to resize and rotate in focused direct edit mode
      if (isPinching && pinchStartRef.current && selectedElement && e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const angle = (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) / Math.PI;

        const scaleRatio = dist / pinchStartRef.current.dist;
        const newW = Math.max(40, Math.min(1280, Math.round(pinchStartRef.current.width * scaleRatio)));
        const newH = Math.max(24, Math.min(1000, Math.round(pinchStartRef.current.height * scaleRatio)));

        const angleDelta = angle - pinchStartRef.current.angle;
        let newRot = Math.round((pinchStartRef.current.rotation + angleDelta) % 360);
        if (newRot < 0) newRot += 360;

        onUpdateElementSize(selectedElement.id, newW, newH, selectedElement.x, selectedElement.y);
        onUpdateElementRotation?.(selectedElement.id, newRot);
        return;
      }

      // 2. Dragging on touch (after long-press)
      if (isDragging && dragStart && selectedElement && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
          cancelable: true,
          preventDefault: () => {},
        } as unknown as MouseEvent);
        return;
      }

      // 3. Resizing handles on touch
      if (isResizing && resizeStart && selectedElement && resizeHandle && e.touches.length === 1) {
        if (e.cancelable) e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
          cancelable: true,
          preventDefault: () => {},
        } as unknown as MouseEvent);
        return;
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isPinching) {
        setIsPinching(false);
        pinchStartRef.current = null;
        if (selectedElement && onCommitElementRotation) {
          onCommitElementRotation(selectedElement.id, selectedElement.rotation || 0);
        }
      }
      setIsTouchDragging(false);
      handleMouseUp();
    };

    if (isDragging || isResizing || isRotating || isPinching) {
      window.addEventListener('mousemove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, isResizing, isRotating, isPinching, onUpdateElementPosition, onUpdateElementSize, onUpdateElementRotation, onCommitElementRotation]);

  // Width container based on preview mode.
  // Device frames use `overflow-clip`, not `overflow-hidden`: hidden would make the frame a scroll
  // container and break fixed backgrounds' scroll timeline (see syncFixedBackgrounds).
  const getContainerWidthClass = () => {
    if (isPublicSite) return 'shadow-none rounded-none border-0';
    switch (previewMode) {
      case 'mobile':
        return 'w-[380px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-[40px] border-[10px] border-[#1d1d1f] overflow-clip';
      case 'tablet':
        return 'w-[768px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] rounded-[28px] border-[8px] border-[#2c2c2e] overflow-clip';
      case 'desktop':
      default:
        if (isPreviewActive) {
          return 'w-[1280px] shadow-none rounded-none border-0';
        }
        return 'w-[1280px] shadow-[0_12px_45px_rgba(0,0,0,0.06)] rounded-2xl border border-black/[0.08]';
    }
  };

  // Short "added to cart" confirmation shown after an add-to-cart button is clicked.
  const [cartToast, setCartToast] = useState<string | null>(null);
  const cartToastTimer = useRef<number | undefined>(undefined);

  const handleOpenLink = (elem: CanvasElement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (elem.cartProduct) {
      addToCart(elem.cartProduct);
      setCartToast(elem.cartProduct.name);
      window.clearTimeout(cartToastTimer.current);
      cartToastTimer.current = window.setTimeout(() => setCartToast(null), 2000);
      return;
    }
    if (!elem.linkUrl) return;

    if (elem.linkType === 'page' || elem.linkUrl.startsWith('#page-')) {
      const pageId = elem.linkTargetId || elem.linkUrl.replace('#page-', '');
      if (onSelectPage && pageId) {
        onSelectPage(pageId);
      }
    } else if (elem.linkType === 'slide' || elem.linkUrl.startsWith('#slide-')) {
      const targetSlideId = elem.linkTargetId || elem.linkUrl.replace('#slide-', '');
      onSelectSlide(targetSlideId);
      const targetElem = document.getElementById(`slide-container-${targetSlideId}`);
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.open(elem.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // The navbar's page-name links are derived live from the site's actual page list (not the
  // possibly-stale navbar.items stored on the page), so adding/renaming/deleting a page updates
  // the navbar automatically. Any manually-added non-page links (external URLs, etc.) are kept.
  const navPageLinkItems = (allPages || []).map((p) => ({
    id: `page-link-${p.id}`,
    label: p.name,
    href: '#',
    linkType: 'page' as const,
    linkTargetId: p.id,
  }));
  const navCustomItems = (navbar.items || []).filter((it) => it.linkType !== 'page');
  // The cart page's navbar link shows how many items the visitor has in the cart.
  const cartItems = useCart();
  const menuCartLines = useMenuCart();
  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0) + menuCartCount(menuCartLines);
  const cartPageIds = new Set(
    (allPages || [])
      .filter((p) => p.slides.some((sl) => rawElements.some((e) => (e.type === 'cart' || e.type === 'menuCart') && e.slideId === sl.id)))
      .map((p) => p.id)
  );
  // The store's main product slide (the tallest one: the full store rather than a featured row)
  // shows the results of a store search; a search from another page opens its page.
  const storeList = rawElements
    .filter((e) => e.type === 'shopProducts' && e.shopLayout !== 'marquee' && e.shopSource !== 'featured')
    .sort((a, b) => b.height - a.height)[0];
  const storePageId = storeList && (allPages || []).find((p) => p.slides.some((sl) => sl.id === storeList.slideId))?.id;
  const openStorePage = () => {
    if (storePageId) onSelectPage?.(storePageId);
  };
  // The showroom's main car list (the tallest non-featured one) shows car search results; a search
  // from another page opens the page that holds it.
  const showroomList = rawElements
    .filter((e) => e.type === 'carListings' && e.carLayout !== 'marquee' && e.carSource !== 'featured')
    .sort((a, b) => b.height - a.height)[0];
  const showroomPageId = showroomList && (allPages || []).find((p) => p.slides.some((sl) => sl.id === showroomList.slideId))?.id;
  const openShowroomPage = () => {
    if (showroomPageId) onSelectPage?.(showroomPageId);
  };
  const cartBadge = (item: { linkType?: string; linkTargetId?: string }) =>
    cartCount > 0 && item.linkType === 'page' && item.linkTargetId && cartPageIds.has(item.linkTargetId) ? (
      <span
        className="ms-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff3b30] text-white text-[10px] font-bold leading-none align-middle"
        aria-label={`${cartCount} في السلة`}
      >
        {cartCount > 99 ? '99+' : cartCount}
      </span>
    ) : null;
  const effectiveNavItems = allPages && allPages.length > 0 ? [...navPageLinkItems, ...navCustomItems] : navbar.items;

  const totalUnscaledHeight = (navbar.height ?? 60) + slides.reduce((sum, s) => sum + s.height, 0);
  const totalScaledHeight = totalUnscaledHeight * scaleFactor;
  // Height of the mobile device notch, which sits above the navbar as a flow sibling.
  // IMPORTANT: `position: sticky`'s `top` offset must be given in the element's own UNSCALED
  // layout space — it is measured against the scroll container's layout geometry, which `transform`
  // never affects. The notch's reserved flow space is always its unscaled height (24px), regardless
  // of scaleFactor, because `transform: scale(...)` only changes how it's painted, not how much
  // room it takes up in the flow. Using the *scaled* height here (as a previous version did) made
  // the sticky `top` threshold smaller than the navbar's real static offset, so the moment the
  // navbar became "stuck" it visibly snapped a few pixels — looking exactly like "sticky doesn't
  // work" whenever scaleFactor < 1 (i.e. whenever the canvas isn't shown at 100%, which is most of
  // the time).
  const notchHeightUnscaled = previewMode === 'mobile' && !isPublicSite ? 24 : 0;
  // Navbar strip width (unscaled, before its own scale transform below) — a percentage of the page's
  // own width (navbar.width, default 100 = full-bleed). Centered automatically by the Scaling
  // Wrapper's `items-center`, so narrowing it just insets it evenly from both edges.
  const navWidthPx = frameWidth * ((navbar.width ?? 100) / 100);

  return (
    <>
    {cartToast && (
      <div dir="rtl" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] bg-[#2A1F1A] text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg pointer-events-none">
        ✓ أُضيف «{cartToast}» إلى السلة
      </div>
    )}
    <div 
      ref={workspaceRef}
      // IMPORTANT: this must be a capped height, never `min-h-[...]`. A min-height is only a
      // floor — once the slides' combined content is taller than one viewport (true almost always,
      // the moment there's more than a couple of slides), the div simply grows to fit everything
      // instead of clipping. That means it never actually overflows ITSELF, so `overflow-y-auto`
      // never kicks in, and the whole outer page scrolls instead of this div. Since the navbar's
      // `position: sticky` is anchored to THIS div as its scrolling ancestor, a sticky navbar does
      // nothing at all when this div never scrolls — it just flows away with the rest of the page,
      // which is the real cause of "sticky doesn't work" (confirmed by direct reproduction: with
      // min-height, scrolling moved window.scrollY while this div's own scrollTop stayed frozen at
      // 0 and the navbar drifted off-screen with everything else; with a capped height, this div
      // alone scrolls, window.scrollY stays 0, and the navbar's top stays pinned). A capped height
      // still fills the viewport exactly the same way min-height did when content is short, so
      // nothing about the empty/short-content layout changes — only tall content now scrolls where
      // it was always meant to.
      className={`flex-1 w-full overflow-y-auto transition-colors duration-200 ${
        isPublicSite
          ? 'bg-white p-0 m-0 h-[100dvh] flex flex-col items-center justify-start'
          : previewMode === 'desktop'
          ? (isPreviewActive ? 'bg-white p-0 m-0 h-[calc(100vh-56px)] flex flex-col items-center justify-start' : 'bg-[#ececf0] p-4 sm:p-8 flex flex-col items-center justify-start')
          : 'bg-[#ececf0] p-4 sm:p-8 flex flex-col items-center justify-start'
      }`}
      style={isPublicSite || (previewMode === 'desktop' && isPreviewActive) ? undefined : { height: `calc(100vh - ${chromeHeight}px)` }}
      onClick={() => {
        onSelectElement(null);
        setFocusedElementId(null);
      }}
      dir="rtl"
    >
      {/* 
        This is the Scaling Wrapper container.
        It has the exact scaled dimensions so the scrollbars of the parent div work perfectly!
      */}
      <div 
        className="flex flex-col items-center justify-start relative transition-all duration-300 origin-top"
        style={{
          width: isPublicSite || (isPreviewActive && previewMode === 'desktop') ? '100%' : `${baseWidth * scaleFactor}px`,
          height: `${totalScaledHeight}px`,
        }}
      >
        {/* Mobile Device Top Notch/Speaker Bar (if mobile). Rendered here, before the navbar, as a flow
            sibling — both now live OUTSIDE the "Device Mode Wrapper Frame" below, specifically so the
            navbar can use native CSS `position: sticky`: a `transform` on ANY ancestor between a
            sticky element and its scrolling container breaks native sticky in every browser (confirmed
            empirically) — which is exactly what the Frame's own `transform: scale(...)` did when the
            navbar was a descendant of it. Giving the notch/navbar their own scale transform directly
            (no transformed ancestor in between) lets the browser's compositor handle sticky natively —
            smooth, with none of the one-frame-behind lag ("jitter") that came from simulating it in JS
            on every scroll event. The Frame below starts right after these two, offset by their scaled
            (on-screen) height. */}
        {previewMode === 'mobile' && !isPublicSite && (
          <div
            className="w-full bg-[#1d1d1f] h-6 flex items-center justify-center relative shrink-0"
            style={{ width: `${baseWidth}px`, transformOrigin: 'top center', transform: `scale(${scaleFactor})` }}
          >
            <div className="w-20 h-3.5 bg-black rounded-b-xl flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#111] mr-1.5" />
              <div className="w-8 h-1 bg-[#333] rounded-full" />
            </div>
          </div>
        )}

        {/* 1. Navbar - Narrow Strip (نافبار وهو شريحة ضيقة) */}
        <nav
          ref={navbarRef}
          onClick={(e) => {
            if (isPreviewActive) return;
            e.stopPropagation();
            onSelectElement(null);
            onSelectNavbar?.();
          }}
          className={`shrink-0 w-full ${isNavHamburger ? 'overflow-visible' : 'overflow-hidden'} ${
            navbar.borderStyle && navbar.borderStyle !== 'none' ? '' : 'border-b border-black/[0.06]'
          } ${isNavbarSelected && !isPreviewActive ? 'ring-2 ring-[#0071e3]/50' : ''} ${isPreviewActive ? '' : 'cursor-pointer'}`}
          style={{
            position: navbar.isSticky ? 'sticky' : 'relative',
            // Unscaled on purpose — see notchHeightUnscaled's comment above.
            top: `${notchHeightUnscaled}px`,
            width: `${navWidthPx}px`,
            transformOrigin: 'top center',
            transform: `scale(${scaleFactor})`,
            // Z-index kept far above any slide element's (which can reach ~50+) so nothing ever floats over the navbar.
            zIndex: 100000,
            minHeight: `${navbar.height ?? 60}px`,
            // Only colors/shadow/border transition — position is handled natively by the browser's
            // compositor via `position: sticky` above, so `transform`/`top` are intentionally excluded
            // here to avoid any CSS-animated lag behind the scroll.
            transition: 'background-color 150ms, border-color 150ms, box-shadow 150ms',
            // Only at 100% or below: a layer promoted while scaled up is painted blurry.
            willChange: navbar.isSticky && scaleFactor <= 1 ? 'transform' : undefined,
            borderStyle: navbar.borderStyle && navbar.borderStyle !== 'none' ? navbar.borderStyle : undefined,
            borderWidth: navbar.borderStyle && navbar.borderStyle !== 'none' ? `${navbar.borderWidth ?? 0}px` : undefined,
            borderColor: navbar.borderStyle && navbar.borderStyle !== 'none' ? (navbar.borderColor || 'transparent') : undefined,
            borderRadius: navbar.borderRadius ? `${navbar.borderRadius}px` : undefined,
            boxShadow: [
              getGlowShadowStyle(navbar.glowIntensity, navbar.glowColor, navbar.glowPosition, false),
              getGlowShadowStyle(navbar.innerGlowIntensity, navbar.innerGlowColor, navbar.innerGlowPosition, true),
            ].filter(Boolean).join(', ') || undefined,
          }}
        >
          {/* Background layer (same logic as a slide's background layer): color AND image both
              respect backgroundOpacity here — putting the color directly on <nav> (as before) made
              the opacity slider affect only an image overlay and do nothing when there was no image. */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{
              backgroundColor: navbar.bgColor?.includes('gradient') ? undefined : (navbar.bgColor || '#ffffff'),
              backgroundImage: navbar.backgroundImage
                ? `url("${navbar.backgroundImage}")`
                : (navbar.bgColor?.includes('gradient') ? navbar.bgColor : undefined),
              backgroundSize: navbar.backgroundSize || 'cover',
              backgroundPosition: navbar.backgroundPosition || 'center',
              opacity: navbar.backgroundOpacity ?? 1,
            }}
          />

          {/* Navbar Internal Lighting Overlay (same pattern as a slide's): an inset box-shadow painted
              on <nav> itself is drawn BEHIND this background layer (CSS paint order), so it was
              invisible whenever the background was opaque — only showing when opacity made the
              background see-through. A dedicated overlay div painted AFTER the background (like
              slides/elements already do) fixes this: it's always visible regardless of opacity. */}
          {Boolean(navbar.innerGlowIntensity && navbar.innerGlowIntensity > 0) && (
            <div
              className="absolute inset-0 pointer-events-none transition-all duration-150 mix-blend-screen"
              style={{
                borderRadius: navbar.borderRadius ? `${navbar.borderRadius}px` : undefined,
                ...getLightGradientStyle(navbar.innerGlowIntensity, navbar.innerGlowColor, navbar.innerGlowPosition),
              }}
            />
          )}

          <div
            className="relative w-full h-full px-6 sm:px-10 flex items-center justify-between"
            style={{ color: navbar.textColor, opacity: navbar.textOpacity ?? 1, minHeight: `${navbar.height ?? 60}px` }}
          >
            {/* Logo / Brand Name (can be hidden entirely via navbar.showBrandName). Both the logo and
                the name come ONLY from the user's own input (navbar.logoUrl / navbar.brandName) —
                never a platform-name fallback ("weelink"/"W"): the platform's own name must never
                leak into the user's published page. If the user hasn't set either yet, nothing is
                shown here (just the alignment spacer below). */}
            {navbar.showBrandName !== false && (navbar.logoUrl || navbar.brandName) ? (
              <div className="flex items-center gap-2 shrink-0">
                {navbar.logoUrl ? (
                  <img
                    src={navbar.logoUrl}
                    alt={navbar.brandName || 'شعار'}
                    className="w-7 h-7 rounded-lg object-contain shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#0071e3] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {navbar.brandName.charAt(0)}
                  </div>
                )}
                {navbar.brandName && (
                  <span className="font-bold text-sm tracking-tight" style={{ color: navbar.textColor }}>
                    {navbar.brandName}
                  </span>
                )}
              </div>
            ) : (
              // No brand/logo shown: leave a small visual gap (about one page-name's width) from the
              // page edge instead of butting the page names flush against it.
              <span className="shrink-0 w-16" />
            )}

            {/* Nav links (page names): plain names only, no hover color/active-bold/underline marks —
                any visual distinction (frame, background, font) is purely opt-in via navbar-settings.
                Always rendered (no `hidden md:flex` viewport media-query) — this canvas is scaled to
                simulate mobile/tablet/desktop regardless of the real browser window width, so hiding
                by a viewport media query was hiding the page names any time the actual editor window
                was narrower than 768px, independent of the chosen device-preview mode. */}
            {!isNavHamburger && (
            <div
              className={`flex flex-1 items-center gap-2.5 text-xs font-medium px-4 flex-wrap ${
                navbar.itemsAlign === 'left' ? 'justify-end' : navbar.itemsAlign === 'center' ? 'justify-center' : 'justify-start'
              }`}
              style={{ color: navbar.textColor }}
            >
              {effectiveNavItems.map((item) => {
                const isPageLink = item.linkType === 'page' && !!item.linkTargetId;
                const hasFrame = Boolean(
                  navbar.itemsFrameBgColor ||
                  (navbar.itemsFrameBorderWidth && navbar.itemsFrameBorderWidth > 0)
                );
                return (
                  <span
                    key={item.id}
                    onClick={(e) => {
                      if (isPageLink) {
                        e.stopPropagation();
                        onSelectPage?.(item.linkTargetId as string);
                      }
                    }}
                    className={`${hasFrame ? 'px-2.5 py-1' : ''} ${isPageLink ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      fontFamily: navbar.itemsFontFamily || undefined,
                      backgroundColor: navbar.itemsFrameBgColor || undefined,
                      borderWidth: navbar.itemsFrameBorderWidth ? `${navbar.itemsFrameBorderWidth}px` : undefined,
                      borderStyle: navbar.itemsFrameBorderWidth ? 'solid' : undefined,
                      borderColor: navbar.itemsFrameBorderColor || undefined,
                      borderRadius: navbar.itemsFrameBorderRadius ? `${navbar.itemsFrameBorderRadius}px` : undefined,
                    }}
                  >
                    {item.label}{cartBadge(item)}
                  </span>
                );
              })}
            </div>
            )}
            {isNavHamburger && <span className="flex-1" />}

            {/* Action CTA Button — only rendered when the user has actually typed a label for it.
                Never fall back to a default label like "ابدأ الآن"; an empty ctaText means the
                user doesn't want a button here at all. */}
            {navbar.ctaText && navbar.ctaText.trim() !== '' && (
              <button
                onClick={(e) => {
                  if (navbar.ctaLinkType === 'page' && navbar.ctaLinkTargetId) {
                    e.stopPropagation();
                    onSelectPage?.(navbar.ctaLinkTargetId);
                  }
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#0071e3] text-white hover:bg-[#0077ed] transition-all shadow-xs active:scale-95"
              >
                {navbar.ctaText}
              </button>
            )}

            {/* Phones: page names live in a dropdown opened by this hamburger icon. */}
            {isNavHamburger && effectiveNavItems.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNavMenuOpen(open => !open);
                }}
                className="shrink-0 w-9 h-9 -me-2 ms-2 rounded-lg flex items-center justify-center hover:bg-black/[0.05] active:scale-95 transition-all"
                style={{ color: navbar.textColor }}
                aria-label="قائمة الصفحات"
                aria-expanded={isNavMenuOpen}
              >
                {isNavMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>

          {isNavHamburger && isNavMenuOpen && (
            <div
              className="absolute top-full inset-x-0 flex flex-col py-2 shadow-[0_12px_24px_rgba(0,0,0,0.12)] border-t border-black/[0.06]"
              style={{ backgroundColor: navbar.bgColor || '#ffffff', color: navbar.textColor }}
              onClick={(e) => e.stopPropagation()}
            >
              {effectiveNavItems.map((item) => {
                const isPageLink = item.linkType === 'page' && !!item.linkTargetId;
                const isCurrent = isPageLink && item.linkTargetId === activePageId;
                return (
                  <span
                    key={item.id}
                    onClick={() => {
                      if (isPageLink) onSelectPage?.(item.linkTargetId as string);
                      setIsNavMenuOpen(false);
                    }}
                    className={`px-6 py-3 text-sm ${isCurrent ? 'font-bold' : 'font-medium'} ${isPageLink ? 'cursor-pointer hover:bg-black/[0.04]' : 'cursor-default'}`}
                    style={{ fontFamily: navbar.itemsFontFamily || undefined }}
                  >
                    {item.label}{cartBadge(item)}
                  </span>
                );
              })}
            </div>
          )}
        </nav>

        {/* Device Mode Wrapper Frame: the device-mockup chrome (border/rounded corners/shadow) around
            the slides. A normal FLOW sibling now (not absolutely positioned), exactly like the notch
            and navbar above it: an unscaled-size box with its own `transform: scale(...)`, centered by
            the Scaling Wrapper's `items-center`. Using absolute positioning with a hand-computed `top`
            offset here previously caused it to overlap the bottom of the (unscaled, flow-sized) navbar
            whenever scaleFactor < 1 — the overlap flickered during scroll, which was the real cause of
            the reported jitter, not the sticky mechanics themselves. As a flow sibling, it simply stacks
            after the navbar with no overlap (at the cost of a small, accepted blank gap when
            scaleFactor < 1, since each sibling's flow height is its unscaled size). */}
        <div
          className={`bg-white transition-all duration-300 relative flex flex-col select-none ${getContainerWidthClass()}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: `${frameWidth}px`,
            transformOrigin: 'top center',
            transform: `scale(${scaleFactor})`,
          }}
        >
          {/* 2. Webpage Slides Container (الشرائح مساحات عمل حرة freegrid) */}
          <div className="flex flex-col w-full divide-y divide-black/[0.06]">
          {slides.map((slide, slideIndex) => {
            const slideElements = elements.filter(el => el.slideId === slide.id);
            const isSlideActive = slide.id === activeSlideId;

            return (
              <div
                key={slide.id}
                id={`slide-container-${slide.id}`}
                onClick={(e) => {
                  if (isPreviewActive) return;
                  e.stopPropagation();
                  onSelectSlide(slide.id);
                  onSelectElement(null);
                  setFocusedElementId(null);
                }}
                onDragOver={(e) => {
                  if (isPreviewActive) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  if (dragOverSlideId !== slide.id) {
                    setDragOverSlideId(slide.id);
                  }
                }}
                onDragLeave={(e) => {
                  if (dragOverSlideId === slide.id) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (
                      e.clientX <= rect.left ||
                      e.clientX >= rect.right ||
                      e.clientY <= rect.top ||
                      e.clientY >= rect.bottom
                    ) {
                      setDragOverSlideId(null);
                    }
                  }
                }}
                onDrop={async (e) => {
                  if (isPreviewActive) return;
                  e.preventDefault();
                  setDragOverSlideId(null);

                  const rawData = e.dataTransfer.getData('application/json');
                  if (!rawData) return;
                  try {
                    const data = JSON.parse(rawData);
                    const slideRect = e.currentTarget.getBoundingClientRect();
                    const dropX = Math.round((e.clientX - slideRect.left) / scaleFactor);
                    const dropY = Math.round((e.clientY - slideRect.top) / scaleFactor);

                    if (data.type === 'unsplash-photo' && data.photo) {
                      const p = data.photo;
                      setIsDroppingPhoto(true);
                      try {
                        const compressed = await compressImageToTargetSize(p.fullUrl || p.thumbUrl, 150 * 1024);
                        const finalW = 200;
                        const finalH = 130;
                        const targetX = Math.max(10, Math.min(baseWidth - finalW - 10, dropX - finalW / 2));
                        const targetY = Math.max(10, Math.min(slide.height - finalH - 10, dropY - finalH / 2));

                        if (onAddElement) {
                          onAddElement(
                            'image',
                            p.title || 'صورة مضافة',
                            {
                              borderRadius: 20,
                              shadow: 'apple',
                              objectFit: 'cover',
                            },
                            {
                              name: p.title || 'صورة مضافة',
                              width: finalW,
                              height: finalH,
                              imageUrl: compressed.url,
                              slideId: slide.id,
                              x: targetX,
                              y: targetY,
                            }
                          );
                        }
                      } finally {
                        setIsDroppingPhoto(false);
                      }
                    } else if (data.type === 'graphic-item' && data.item) {
                      const item = data.item;
                      const finalW = 140;
                      const finalH = 140;
                      const targetX = Math.max(10, Math.min(baseWidth - finalW - 10, dropX - finalW / 2));
                      const targetY = Math.max(10, Math.min(slide.height - finalH - 10, dropY - finalH / 2));

                      if (onAddElement) {
                        onAddElement(
                          'image',
                          item.title || 'عنصر جرافيك',
                          {
                            borderRadius: 16,
                            shadow: 'none',
                            objectFit: 'contain',
                            backgroundColor: 'transparent',
                          },
                          {
                            name: item.title || 'عنصر جرافيك',
                            width: finalW,
                            height: finalH,
                            imageUrl: item.url || item.previewUrl,
                            slideId: slide.id,
                            x: targetX,
                            y: targetY,
                          }
                        );
                      }
                    }
                  } catch (err) {
                    console.error('Error handling dropped image:', err);
                  }
                }}
                className={`relative w-full bg-white transition-all overflow-hidden ${
                  isPreviewActive ? '' : 'bg-freegrid-subtle'
                }`}
                style={{
                  height: `${slide.height}px`,
                  borderColor: slide.borderColor || 'transparent',
                  borderWidth: slide.borderWidth ? `${slide.borderWidth}px` : undefined,
                  borderRadius: slide.borderRadius ? `${slide.borderRadius}px` : undefined,
                  borderStyle: slide.borderStyle || 'none',
                  boxShadow: [
                    getGlowShadowStyle(slide.glowIntensity, slide.glowColor, slide.glowPosition, false),
                    getGlowShadowStyle(slide.innerGlowIntensity, slide.innerGlowColor, slide.innerGlowPosition, true)
                  ].filter(Boolean).join(', ') || undefined,
                  clipPath: slide.backgroundAttachment === 'fixed' ? 'inset(0px)' : undefined,
                  // `overflow: hidden` makes the slide a scroll container, which would hijack the fixed
                  // background's scroll timeline; `clip` clips the same way without that side effect.
                  overflow: (slide.backgroundAttachment === 'fixed' || slideElements.some(el => el.styles.backgroundAttachment === 'fixed')) ? 'clip' : undefined,
                }}
              >
                {/* Drag Over Drop Target Feedback */}
                {dragOverSlideId === slide.id && !isPreviewActive && (
                  <div className="absolute inset-0 z-50 bg-[#0071e3]/10 border-2 border-dashed border-[#0071e3] rounded-inherit flex items-center justify-center pointer-events-none backdrop-blur-[1px] transition-all">
                    <div className="bg-white/95 px-4 py-2.5 rounded-2xl shadow-lg border border-[#0071e3]/20 flex items-center gap-2.5 text-xs font-bold text-[#0071e3] animate-bounce">
                      <span className="text-base">✨</span>
                      <span>أفلت الصورة هنا لإدراجها في الشريحة</span>
                    </div>
                  </div>
                )}
                {/* Slide Background Layer with slide.backgroundOpacity */}
                {Boolean(slide.backgroundColor || slide.backgroundImage) && (() => {
                  const isFixed = slide.backgroundAttachment === 'fixed';
                  if (isFixed) {
                    return (
                      <div
                        key="bg-fixed"
                        className="bg-fixed-layer absolute inset-x-0 pointer-events-none transition-opacity duration-150"
                        data-slide-id={slide.id}
                        style={{
                          top: 0,
                          height: `calc(100vh / ${scaleFactor || 1})`,
                          backgroundColor: slide.backgroundColor?.includes('gradient') ? undefined : (slide.backgroundColor || '#ffffff'),
                          backgroundImage: slide.backgroundImage 
                            ? `url("${slide.backgroundImage}")` 
                            : (slide.backgroundColor?.includes('gradient') ? slide.backgroundColor : undefined),
                          backgroundSize: slide.backgroundSize || 'cover',
                          backgroundPosition: slide.backgroundPosition || 'center',
                          backgroundRepeat: slide.backgroundRepeat || (slide.backgroundSize === 'auto' ? 'repeat' : 'no-repeat'),
                          opacity: slide.backgroundOpacity ?? 1,
                          borderRadius: slide.borderRadius ? `${slide.borderRadius}px` : undefined,
                        }}
                      />
                    );
                  } else {
                    return (
                      <div
                        key="bg"
                        className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                        style={{
                          backgroundColor: slide.backgroundColor?.includes('gradient') ? undefined : (slide.backgroundColor || '#ffffff'),
                          backgroundImage: slide.backgroundImage 
                            ? `url("${slide.backgroundImage}")` 
                            : (slide.backgroundColor?.includes('gradient') ? slide.backgroundColor : undefined),
                          backgroundSize: slide.backgroundSize || 'cover',
                          backgroundPosition: slide.backgroundPosition || 'center',
                          backgroundRepeat: slide.backgroundRepeat || (slide.backgroundSize === 'auto' ? 'repeat' : 'no-repeat'),
                          opacity: slide.backgroundOpacity ?? 1,
                          borderRadius: slide.borderRadius ? `${slide.borderRadius}px` : undefined,
                        }}
                      />
                    );
                  }
                })()}

                {/* Slide Internal Lighting Overlay (Gradual Fading Glow) */}
                {Boolean(slide.innerGlowIntensity && slide.innerGlowIntensity > 0) && (
                  <div 
                    className="absolute inset-0 pointer-events-none transition-all duration-150 mix-blend-screen"
                    style={{
                      borderRadius: slide.borderRadius ? `${slide.borderRadius}px` : undefined,
                      ...getLightGradientStyle(slide.innerGlowIntensity, slide.innerGlowColor, slide.innerGlowPosition)
                    }}
                  />
                )}

                {/* The slide being edited: a blue frame and its name in the corner; the others keep a quiet name tag */}
                {!isPreviewActive && isSlideActive && (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 z-[45] pointer-events-none border-2 border-[#0071e3] animate-[fade_0.25s_ease-out]"
                      style={{ borderRadius: slide.borderRadius ? `${slide.borderRadius}px` : undefined }}
                    />
                    <div className="absolute top-2 right-3 z-[46] pointer-events-none animate-[fade_0.25s_ease-out]">
                      <span className="text-[11px] font-bold bg-[#0071e3] text-white px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(0,113,227,0.35)]">
                        {slide.name}
                      </span>
                    </div>
                  </>
                )}
                {!isPreviewActive && !isSlideActive && (
                  <div className="absolute top-2 right-3 z-10 pointer-events-none flex items-center gap-1.5 opacity-60">
                    <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md border border-black/[0.05]">
                      {slide.name}
                    </span>
                  </div>
                )}

                {/* Empty State in Slide if no elements */}
                {slideElements.length === 0 && !isPreviewActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100/90 border border-black/[0.05] flex items-center justify-center text-neutral-400 mb-2.5 shadow-2xs">
                      <Plus size={20} strokeWidth={2.2} />
                    </div>
                    <h4 className="text-sm font-semibold text-[#1d1d1f] mb-1">
                      {slide.name} مساحة عمل حرة (Freegrid)
                    </h4>
                    <p className="text-xs text-neutral-400 max-w-sm">
                      اسحب العناصر إلى هنا بحرية أو استخدم لوحة التحكم من السهم الجانبي الأيمن لإضافة العناوين والبطاقات والأزرار.
                    </p>
                  </div>
                )}

                {/* Render Freegrid Elements inside this slide */}
                <div className="relative h-full mx-auto" style={{ width: `${baseWidth}px` }}>
                  {slideElements.map((elem, idx) => {
                  // Edge-to-edge elements (e.g. a photo overlay) keep reaching the window's edges.
                  const spansPage = bleed > 0 && elem.x <= 0 && elem.x + elem.width >= baseWidth;
                  const isSelected = elem.id === selectedElementId;
                  const isColorGradient = elem.styles.color?.includes('gradient');
                  const textGradientStyles: React.CSSProperties = isColorGradient ? {
                    backgroundImage: elem.styles.color,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                    width: '100%'
                  } : {};

                  const elementHasBg = Boolean(
                    elem.type !== 'mask' && 
                    !(elem.type === 'shape' && elem.content && elem.content.startsWith('line-')) && (
                      (elem.styles.backgroundColor && elem.styles.backgroundColor !== 'transparent' && elem.styles.backgroundColor !== 'rgba(0, 0, 0, 0)') ||
                      elem.styles.backgroundImage
                    )
                  );
                  const effectiveContentOpacity = (elem.styles.contentOpacity ?? elem.styles.opacity ?? 1) * (slide.opacity ?? 1);
                  const effectiveBgOpacity = elem.styles.backgroundOpacity ?? 1;

                  const anim = elem.styles?.animation || 'none';
                  const animTrigger = elem.styles?.animationTrigger || 'once';
                  const animDuration = elem.styles?.animationDuration || (
                    ['spin-slow'].includes(anim) ? 10 :
                    ['marquee-rtl', 'marquee-ltr'].includes(anim) ? 12 :
                    ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'scale-down'].includes(anim) ? 1.2 :
                    ['pulse', 'brightness', 'shake', 'bounce', 'flash', 'float', 'heartbeat', 'rubberband', 'swing', 'jello'].includes(anim) ? 2 : 1.5
                  );
                  const isAnimLoop = animTrigger === 'loop';
                  const isAnimHover = animTrigger === 'hover';
                  
                  const animationStyle = anim && anim !== 'none' ? (
                    isAnimHover ? {
                      '--anim-name': anim,
                      '--anim-duration': `${animDuration}s`,
                      '--anim-timing': ['marquee-rtl', 'marquee-ltr'].includes(anim) ? 'linear' : 'ease-out',
                    } : {
                      animationName: anim,
                      animationDuration: `${animDuration}s`,
                      animationIterationCount: isAnimLoop ? 'infinite' : '1',
                      animationTimingFunction: ['marquee-rtl', 'marquee-ltr'].includes(anim) ? 'linear' : 'ease-out',
                      animationFillMode: isAnimLoop ? 'none' : 'forwards',
                    }
                  ) : {};

                    return (
                    <div
                      key={elem.id}
                      id={`canvas-elem-${elem.id}`}
                      onMouseDown={(e) => !isPreviewActive && handleElementMouseDown(e, elem)}
                      onTouchStart={(e) => !isPreviewActive && handleElementTouchStart(e, elem)}
                      onTouchMove={handleElementTouchMove}
                      onTouchEnd={handleElementTouchEnd}
                      onTouchCancel={handleElementTouchEnd}
                      onClick={(e) => {
                        if (isPreviewActive) {
                          if (elem.linkUrl || elem.cartProduct) {
                            handleOpenLink(elem, e);
                          }
                          return;
                        }
                        e.stopPropagation();
                        onSelectElement(elem.id);
                        onSelectSlide(slide.id);
                      }}
                      className={`absolute ${isPreviewActive ? 'select-text' : 'select-none'} group ${
                        isPreviewActive 
                          ? '' 
                          : (isSelected ? 'touch-none' : 'touch-pan-y')
                      } ${
                        isDragging && isSelected
                          ? 'transition-none will-change-[left,top] ring-2 ring-[#0071e3] shadow-[0_12px_36px_rgba(0,113,227,0.3)]'
                          : isPreviewActive
                            ? ''
                            : focusedElementId === elem.id
                              ? 'ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.45)]'
                              : isTouchDragging && isSelected
                                ? 'ring-2 ring-[#0071e3] shadow-[0_12px_36px_rgba(0,113,227,0.35)] scale-[1.02]'
                                : isSelected 
                                  ? 'ring-2 ring-[#0071e3] shadow-[0_4px_24px_rgba(0,113,227,0.15)]' 
                                  : 'hover:ring-1 hover:ring-[#0071e3]/40'
                      } ${isAnimHover ? 'hover-animate' : ''}`}
                      style={{
                        left: `${spansPage ? elem.x - bleed : elem.x}px`,
                        top: `${elem.y}px`,
                        width: `${spansPage ? elem.width + bleed * 2 : elem.width}px`,
                        height: `${elem.height}px`,
                        zIndex: isSelected ? ((idx + 1) * 10 + 2) : ((idx + 1) * 10),
                        filter: [
                          elem.styles.brightness ? `brightness(${elem.styles.brightness}%)` : '',
                          elem.clipPath ? 'drop-shadow(0px 8px 20px rgba(0,0,0,0.14)) drop-shadow(0px 2px 5px rgba(0,0,0,0.06))' : ''
                        ].filter(Boolean).join(' ') || undefined,
                        cursor: isPreviewActive
                          ? (elem.linkUrl || elem.cartProduct ? 'pointer' : 'default')
                          : (elem.isLocked ? 'default' : (isDragging ? 'grabbing' : 'grab')),
                        transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
                        transformOrigin: 'center center',
                        ...animationStyle
                      }}
                    >
                      {/* Link Indicator Badge on Element */}
                      {elem.linkUrl && !isPreviewActive && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenLink(elem, e)}
                          title={`انتقال إلى الرابط: ${elem.linkUrl}`}
                          className="absolute -top-2.5 -left-2.5 z-40 bg-[#0071e3] hover:bg-[#0077ed] text-white p-1 rounded-full shadow-md transition-all hover:scale-110 cursor-pointer flex items-center justify-center ring-2 ring-white"
                          aria-label="رابط العنصر"
                        >
                          <ExternalLink size={10} strokeWidth={2.5} />
                        </button>
                      )}

                      {/* Element Body Rendering */}
                      <div 
                        className="relative w-full h-full overflow-hidden flex flex-col justify-center"
                        style={{
                          overflow: elem.styles.backgroundAttachment === 'fixed' ? 'clip' : undefined, // see slide overflow note
                          borderRadius: elem.clipPath ? undefined : (typeof elem.styles.borderRadius === 'string' ? elem.styles.borderRadius : `${elem.styles.borderRadius || 0}px`),
                          borderWidth: elem.clipPath ? undefined : `${elem.styles.borderWidth || 0}px`,
                          borderColor: elem.clipPath ? undefined : elem.styles.borderColor || 'transparent',
                          borderStyle: elem.clipPath ? undefined : elem.styles.borderStyle || 'solid',
                          boxShadow: elem.clipPath ? undefined : [
                            getGlowShadowStyle(elem.styles.glowIntensity, elem.styles.glowColor, elem.styles.glowPosition, false),
                            getGlowShadowStyle(elem.styles.innerGlowIntensity, elem.styles.innerGlowColor, elem.styles.innerGlowPosition, true)
                          ].filter(Boolean).join(', ') || undefined,
                          clipPath: elem.clipPath ? (elem.clipPath.startsWith('polygon') ? elem.clipPath : `url(#${elem.clipPath})`) : undefined,
                        }}
                      >
                        {/* Element Background Layer (if element has background) with backgroundOpacity */}
                        {elementHasBg && (
                          <div 
                            /* Distinct keys so toggling fixed/scroll remounts the layer and drops the
                               inline size/transform that syncFixedBackgrounds wrote directly to the DOM. */
                            key={elem.styles.backgroundAttachment === 'fixed' ? 'bg-fixed' : 'bg'}
                            className={`${elem.styles.backgroundAttachment === 'fixed' ? 'bg-fixed-layer absolute top-0 left-0' : 'absolute inset-0'} pointer-events-none transition-opacity duration-150`}
                            data-fixed-axis={elem.styles.backgroundAttachment === 'fixed' ? 'xy' : undefined}
                            style={{
                              backgroundColor: elem.styles.backgroundColor?.includes('gradient') ? undefined : (elem.styles.backgroundColor || 'transparent'),
                              backgroundImage: elem.styles.backgroundImage 
                                ? `url("${elem.styles.backgroundImage}")` 
                                : (elem.styles.backgroundColor?.includes('gradient') ? elem.styles.backgroundColor : undefined),
                              backgroundSize: elem.styles.backgroundSize || 'cover',
                              backgroundPosition: 'center',
                              opacity: effectiveBgOpacity,
                              borderRadius: elem.styles.backgroundAttachment === 'fixed' ? undefined : 'inherit',
                            }}
                          />
                        )}

                        {/* Element Internal Lighting Overlay (Gradual Fading Glow) */}
                        {Boolean(elem.styles.innerGlowIntensity && elem.styles.innerGlowIntensity > 0) && (
                          <div 
                            className="absolute inset-0 pointer-events-none transition-all duration-150 mix-blend-screen z-20"
                            style={{
                              borderRadius: 'inherit',
                              ...getLightGradientStyle(elem.styles.innerGlowIntensity, elem.styles.innerGlowColor, elem.styles.innerGlowPosition)
                            }}
                          />
                        )}

                        {/* Element Content Layer with contentOpacity (شفافية العنصر نفسه كالنص) */}
                        <div 
                          className="relative z-10 w-full h-full flex flex-col justify-center transition-opacity duration-150"
                          style={{
                            opacity: effectiveContentOpacity,
                            color: isColorGradient ? 'transparent' : (elem.styles.color || '#1d1d1f'),
                            textAlign: elem.styles.textAlign || 'right',
                            fontSize: `${elem.styles.fontSize || 16}px`,
                            fontWeight: elem.styles.fontWeight || 'normal',
                            fontStyle: elem.styles.fontStyle || 'normal',
                            textDecoration: elem.styles.textDecoration || 'none',
                            fontFamily: elem.styles.fontFamily || undefined,
                          }}
                        >
                        {/* Compound Text Renderers */}
                        {elem.compoundType === 'hero' && (
                          <div className="w-full h-full flex flex-col justify-center px-2 space-y-1.5 text-right select-none">
                            <h2 
                              className="font-bold tracking-tight leading-tight"
                              style={{ fontSize: `${elem.styles.fontSize || 32}px`, ...textGradientStyles }}
                              contentEditable={isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </h2>
                            <p 
                              className="text-neutral-500 leading-relaxed font-normal"
                              style={{ fontSize: `${Math.max(12, Math.round((elem.styles.fontSize || 32) * 0.45))}px` }}
                              contentEditable={isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.subContent || 'نص وصفي توضيحي مكمل للعنوان يبرز تفاصيل الفكرة بدقة وأناقة.'}
                            </p>
                          </div>
                        )}

                        {elem.compoundType === 'badge-heading' && (
                          <div className="w-full h-full flex flex-col justify-center px-2 space-y-2 text-right select-none">
                            <div>
                              <span 
                                className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 shadow-2xs"
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  if (onUpdateElement) {
                                    onUpdateElement(elem.id, { badgeText: e.currentTarget.innerText });
                                  }
                                }}
                              >
                                {elem.badgeText || '✦ جديد وحصري'}
                              </span>
                            </div>
                            <h2 
                              className="font-bold tracking-tight leading-tight text-neutral-900"
                              style={{ fontSize: `${elem.styles.fontSize || 26}px`, ...textGradientStyles }}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </h2>
                          </div>
                        )}

                        {elem.compoundType === 'quote' && (
                          <div className="w-full h-full flex items-start gap-3 p-4 bg-white/90 border-r-4 border-[#0071e3] rounded-2xl shadow-xs text-right">
                            <span className="text-3xl text-[#0071e3] font-serif leading-none select-none">❝</span>
                            <div className="flex-1 space-y-1.5">
                              <p 
                                className="italic text-neutral-800 font-medium leading-relaxed"
                                style={{ fontSize: `${elem.styles.fontSize || 18}px` }}
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                              >
                                {elem.content}
                              </p>
                              <span 
                                className="block text-xs font-semibold text-neutral-500"
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  if (onUpdateElement) {
                                    onUpdateElement(elem.id, { authorText: e.currentTarget.innerText });
                                  }
                                }}
                              >
                                {elem.authorText || '— كاتب أو مصدر الاقتباس'}
                              </span>
                            </div>
                          </div>
                        )}

                        {elem.compoundType === 'stat' && (
                          <div className="w-full h-full flex flex-col justify-center p-3 text-right">
                            <div 
                              className="font-mono font-black text-[#0071e3] leading-none"
                              style={{ fontSize: `${elem.styles.fontSize || 40}px` }}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </div>
                            <div 
                              className="text-xs font-semibold text-neutral-600 mt-2 leading-snug"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.subContent || 'مؤشر إحصائي بارز يوضح حجم الإنجاز'}
                            </div>
                          </div>
                        )}

                        {elem.compoundType === 'checklist' && (
                          <div className="w-full h-full flex flex-col justify-center p-3 space-y-2 text-right">
                            <h3 
                              className="font-bold text-neutral-900 border-b border-black/[0.06] pb-1.5"
                              style={{ fontSize: `${elem.styles.fontSize || 20}px` }}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </h3>
                            <div 
                              className="space-y-1.5 text-xs text-neutral-700 leading-relaxed"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {(elem.subContent || '✓ سرعة فائقة وتوافق كامل\n✓ أمان سحابي متقدم ودعم متواصل\n✓ تخصيص سهل ومرونة تامة').split('\n').map((line, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                  <span>{line.replace(/^[✓•\-\d+\.]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {elem.compoundType === 'accent-border' && (
                          <div className="w-full h-full flex flex-col justify-center pr-3 border-r-4 border-[#0071e3] text-right space-y-1">
                            <h3 
                              className="font-bold text-neutral-900 leading-tight"
                              style={{ fontSize: `${elem.styles.fontSize || 22}px` }}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </h3>
                            <p 
                              className="text-xs text-neutral-500 leading-relaxed"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.subContent || 'نص جانبي أنيق مفصول بخط بارز لإبراز النقاط الجوهرية.'}
                            </p>
                          </div>
                        )}

                        {elem.compoundType === 'price-tag' && (
                          <div className="w-full h-full flex flex-col justify-between p-3.5 bg-white rounded-2xl border border-black/[0.08] shadow-xs text-right">
                            <div className="flex items-center justify-between">
                              <h4 
                                className="font-bold text-neutral-900 text-sm"
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                              >
                                {elem.content}
                              </h4>
                              <span 
                                className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 font-bold text-xs rounded-lg"
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  if (onUpdateElement) {
                                    onUpdateElement(elem.id, { badgeText: e.currentTarget.innerText });
                                  }
                                }}
                              >
                                {elem.badgeText || '١٩٩ ر.س'}
                              </span>
                            </div>
                            <p 
                              className="text-[11px] text-neutral-500 mt-2"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.subContent || 'اشتراك شهري متكامل يشمل كل المزايا والدعم.'}
                            </p>
                          </div>
                        )}

                        {elem.compoundType === 'card-box' && (
                          <div className="w-full h-full flex flex-col justify-between p-4 text-right">
                            <div className="flex items-center gap-3">
                              {elem.badgeText && (
                                <span className="text-2xl select-none shrink-0">{elem.badgeText}</span>
                              )}
                              <h3 
                                className="font-bold tracking-tight text-neutral-900 leading-tight"
                                style={{ fontSize: `${elem.styles.fontSize || 18}px` }}
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                              >
                                {elem.content}
                              </h3>
                            </div>
                            <p 
                              className="text-xs text-neutral-500 leading-relaxed mt-2"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.subContent || 'محتوى توضيحي إبداعي يصف الخدمة أو الفكرة بوضوح وأناقة عالية.'}
                            </p>
                          </div>
                        )}

                        {elem.compoundType === 'alert-box' && (
                          <div className="w-full h-full flex items-start gap-3 p-3.5 text-right">
                            <span className="text-xl select-none shrink-0">{elem.badgeText || '💡'}</span>
                            <div className="flex-1 space-y-1">
                              <h4 
                                className="font-bold text-sm leading-tight"
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                              >
                                {elem.content}
                              </h4>
                              <p 
                                className="text-xs opacity-90 leading-relaxed"
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  if (onUpdateElement) {
                                    onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                  }
                                }}
                              >
                                {elem.subContent || 'ملاحظة وتنبيه هام يمكنك تعديل نصه بسهولة تامة ليناسب احتياجك.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {elem.compoundType === 'faq-box' && (
                          <div className="w-full h-full flex flex-col justify-center p-4 text-right space-y-2">
                            <div className="flex items-center gap-2 text-[#0071e3] font-bold text-xs">
                              <span>❓</span>
                              <span 
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  if (onUpdateElement) {
                                    onUpdateElement(elem.id, { badgeText: e.currentTarget.innerText });
                                  }
                                }}
                              >
                                {elem.badgeText || 'سؤال متكرر'}
                              </span>
                            </div>
                            <h3 
                              className="font-bold text-neutral-900 leading-snug"
                              style={{ fontSize: `${elem.styles.fontSize || 16}px` }}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </h3>
                            <p 
                              className="text-xs text-neutral-500 leading-relaxed"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.subContent || 'إجابة مفصلة وواضحة توضح للزائر كل ما يحتاج لمعرفته بكل ثقة وسرعة.'}
                            </p>
                          </div>
                        )}

                        {elem.compoundType === 'welcome-box' && (
                          <div className="w-full h-full flex flex-col justify-center p-4 text-right space-y-1.5">
                            <span 
                              className="text-xs font-bold tracking-wide opacity-80"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { badgeText: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.badgeText || 'مرحباً بك في موقعنا ✦'}
                            </span>
                            <h2 
                              className="font-black leading-tight tracking-tight"
                              style={{ fontSize: `${elem.styles.fontSize || 24}px` }}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </h2>
                            <p 
                              className="text-xs opacity-90 leading-relaxed"
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { subContent: e.currentTarget.innerText });
                                }
                              }}
                            >
                              {elem.subContent || 'انطلق في تجربة تصميم استثنائية وابنِ موقع أحلامك بأرقى المعايير العالمية.'}
                            </p>
                          </div>
                        )}

                        {/* Standard Text & Element Renderers */}
                        {!elem.compoundType && elem.type === 'heading' && (
                          <h2 
                            className="font-bold tracking-tight px-2 leading-tight"
                            style={textGradientStyles}
                            contentEditable={!isPreviewActive && isSelected}
                            suppressContentEditableWarning
                            onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                          >
                            {elem.content}
                          </h2>
                        )}

                        {!elem.compoundType && elem.type === 'paragraph' && (
                          elem.styles.listStyle === 'bullet' ? (
                            <div 
                              className="px-2 leading-relaxed space-y-1"
                              style={textGradientStyles}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content.split('\n').map((line, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-[#0071e3] shrink-0 font-bold select-none">•</span>
                                  <span>{line.replace(/^[•\-\d+\.]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          ) : elem.styles.listStyle === 'numeric' ? (
                            <div 
                              className="px-2 leading-relaxed space-y-1"
                              style={textGradientStyles}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content.split('\n').map((line, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-[#0071e3] shrink-0 font-mono text-xs font-bold select-none">{idx + 1}.</span>
                                  <span>{line.replace(/^[•\-\d+\.]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p 
                              className="px-2 leading-relaxed"
                              style={textGradientStyles}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </p>
                          )
                        )}

                        {elem.type === 'button' && (
                          <div className="w-full h-full flex items-center justify-center px-4 font-semibold text-sm transition-all">
                            <span 
                              style={textGradientStyles}
                              contentEditable={!isPreviewActive && isSelected}
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                            >
                              {elem.content}
                            </span>
                          </div>
                        )}

                        {elem.type === 'card' && (
                          <div className="p-4 flex flex-col justify-between h-full bg-white rounded-2xl shadow-sm border border-black/[0.06]">
                            <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold text-sm mb-2">
                              ★
                            </div>
                            <h3 className="font-semibold text-sm text-[#1d1d1f] mb-1">
                              بطاقة تفاعلية حديثة
                            </h3>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                              {elem.content}
                            </p>
                          </div>
                        )}

                        {elem.type === 'image' && (
                          <div 
                            className={`w-full h-full flex items-center justify-center overflow-hidden rounded-xl select-none relative ${
                              elem.styles.objectFit === 'contain' ? 'bg-transparent border-0' : 'bg-neutral-100 border border-black/[0.04]'
                            }`}
                            style={{
                              backgroundColor: elem.styles.backgroundColor || (elem.styles.objectFit === 'contain' ? 'transparent' : undefined)
                            }}
                          >
                            {elem.imageUrl ? (
                              <>
                                <img 
                                  src={elem.imageUrl} 
                                  alt={elem.name}
                                  referrerPolicy="no-referrer"
                                  draggable={false}
                                  onDragStart={(e) => e.preventDefault()}
                                  className={`w-full h-full pointer-events-none select-none ${
                                    elem.styles.objectFit === 'contain' ? 'object-contain' : 'object-cover'
                                  }`} 
                                  style={{
                                    filter: [
                                      elem.styles.imageFilter === 'grayscale' ? 'grayscale(100%)' :
                                      elem.styles.imageFilter === 'sepia' ? 'sepia(100%)' :
                                      elem.styles.imageFilter === 'invert' ? 'invert(100%)' :
                                      elem.styles.imageFilter === 'warm' ? 'sepia(40%) saturate(140%) hue-rotate(-10deg) brightness(105%)' :
                                      elem.styles.imageFilter === 'cool' ? 'saturate(115%) hue-rotate(15deg) brightness(95%)' :
                                      elem.styles.imageFilter === 'vintage' ? 'sepia(60%) saturate(110%) contrast(110%)' :
                                      elem.styles.imageFilter === 'technicolor' ? 'contrast(140%) saturate(180%)' :
                                      elem.styles.imageFilter === 'blur' ? 'blur(4px)' : '',
                                      elem.styles.brightness !== undefined ? `brightness(${elem.styles.brightness}%)` : ''
                                    ].filter(Boolean).join(' ') || undefined
                                  }}
                                />
                                {elem.styles.imageTintColor && (
                                  <div 
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: elem.styles.imageTintColor,
                                      opacity: (elem.styles.imageTintOpacity ?? 50) / 100,
                                      mixBlendMode: (elem.styles.imageTintBlendMode || 'multiply') as any
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-3 text-neutral-400 pointer-events-none select-none">
                                <span className="text-2xl mb-1">🖼️</span>
                                <span className="text-[11px] font-medium">{elem.content}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {elem.type === 'input' && (
                          <div className={`w-full h-full flex items-center ${!isPreviewActive ? 'pointer-events-none' : ''}`}>
                            <input
                              key={`${elem.id}-${isPreviewActive}`}
                              type="text"
                              disabled={!isPreviewActive}
                              readOnly={!isPreviewActive}
                              value={isPreviewActive ? undefined : (elem.content || '')}
                              defaultValue={isPreviewActive ? '' : undefined}
                              placeholder={elem.content || 'حقل إدخال نص (اكتب هنا في المعاينة)...'}
                              className={`w-full h-full px-3.5 py-2 bg-white/95 border border-neutral-300 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 rounded-xl text-neutral-800 placeholder:text-neutral-400 outline-none transition-all shadow-2xs ${
                                isPreviewActive ? 'cursor-text' : 'cursor-move'
                              }`}
                              style={{
                                fontSize: `${elem.styles.fontSize || 15}px`,
                                fontFamily: elem.styles.fontFamily || undefined,
                                textAlign: elem.styles.textAlign || 'right',
                              }}
                              onClick={(e) => {
                                if (isPreviewActive) e.stopPropagation();
                              }}
                            />
                          </div>
                        )}

                        {elem.type === 'table' && (() => {
                          const tableConfig = elem.tableConfig || {
                            rows: 3,
                            cols: 3,
                            themeColor: '#0071e3',
                            headerRow: true,
                            indexCol: false,
                            colWidths: [120, 120, 120],
                            rowHeights: [40, 40, 40],
                            cells: [
                              ['الخدمة', 'الحالة', 'التكلفة'],
                              ['تصميم موقع', 'مكتمل', '500 $'],
                              ['استضافة سريعة', 'نشط', '120 $']
                            ]
                          };

                          const { rows, cols, themeColor, headerRow, indexCol, colWidths, rowHeights, cells, cellStyles = {} } = tableConfig;

                          return (
                            <div 
                              className="w-full h-full rounded-xl border relative text-right select-none flex flex-col group/table"
                              style={{
                                borderColor: themeColor,
                                borderWidth: '1.5px',
                                backgroundColor: elem.styles.backgroundColor || 'white',
                                opacity: elem.styles.opacity ?? 1,
                              }}
                            >
                              {/* 1. Header (Add Column button +) at the top-left edge of the table (In RTL, leftmost column) */}
                              {!isPreviewActive && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTableAddColumn(elem.id);
                                  }}
                                  className="absolute -left-9 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-50 cursor-pointer border-2 border-white opacity-0 group-hover/table:opacity-100 duration-150"
                                  title="إضافة عمود جديد لليسار"
                                >
                                  +
                                </button>
                              )}

                              {/* 2. Scrollable Table Container */}
                              <div className="w-full h-full overflow-auto no-scrollbar relative flex-1 rounded-xl">
                                <table className="border-collapse table-fixed w-max min-w-full" dir="rtl">
                                  <tbody>
                                    {Array.from({ length: rows }).map((_, r) => {
                                      const rowHeight = rowHeights[r] || 40;
                                      const isHeader = r === 0 && headerRow;

                                      return (
                                        <tr 
                                          key={r} 
                                          className={`group/row relative ${
                                            isHeader 
                                              ? 'font-bold text-white shadow-2xs' 
                                              : r % 2 === 1 
                                                ? 'bg-neutral-50/75 hover:bg-neutral-100/50' 
                                                : 'bg-white hover:bg-neutral-100/50'
                                          }`}
                                          style={{
                                            height: `${rowHeight}px`,
                                            backgroundColor: isHeader ? themeColor : undefined
                                          }}
                                        >
                                          {/* Row Deletion button at first column cell hover */}
                                          {!isPreviewActive && rows > 1 && (
                                            <td className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-0 h-0 flex items-center justify-center z-50 pointer-events-none">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleTableDeleteRow(elem.id, r);
                                                }}
                                                className="w-5.5 h-5.5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md opacity-0 group-hover/row:opacity-100 hover:scale-110 pointer-events-auto transition-all cursor-pointer border border-white"
                                                title="حذف هذا السطر"
                                              >
                                                -
                                              </button>
                                            </td>
                                          )}

                                          {/* Optional Index Column on the right (Index Numbering) */}
                                          {indexCol && (
                                            <td
                                              style={{
                                                width: '50px',
                                                borderColor: isHeader ? 'rgba(255,255,255,0.3)' : '#cbd5e1',
                                                borderWidth: '1.5px',
                                                borderStyle: 'solid',
                                                backgroundColor: isHeader ? themeColor : '#f1f5f9'
                                              }}
                                              className={`text-center font-mono text-xs select-none ${
                                                isHeader ? 'text-white' : 'text-neutral-500 font-bold'
                                              }`}
                                            >
                                              {isHeader ? '#' : r}
                                            </td>
                                          )}

                                          {/* Render Column Cells */}
                                          {Array.from({ length: cols }).map((_, c) => {
                                            const colWidth = colWidths[c] || 120;
                                            const cellValue = (cells[r] && cells[r][c] !== undefined) ? cells[r][c] : '';
                                            const cellStyleKey = `${r},${c}`;
                                            const customCellStyle = cellStyles[cellStyleKey] || {};
                                            const isCellFocused = activeTableCell && activeTableCell.elementId === elem.id && activeTableCell.row === r && activeTableCell.col === c;

                                            return (
                                              <td
                                                key={c}
                                                style={{
                                                  width: `${colWidth}px`,
                                                  borderColor: isHeader ? 'rgba(255,255,255,0.4)' : '#cbd5e1',
                                                  borderWidth: '1.5px',
                                                  borderStyle: 'solid',
                                                  position: 'relative'
                                                }}
                                                className={`align-middle group/cell transition-colors duration-100 ${
                                                  isCellFocused ? 'ring-2 ring-[#0071e3]/70 ring-inset bg-blue-50/20' : ''
                                                }`}
                                              >
                                                {/* Column Delete button (on header row hover) */}
                                                {!isPreviewActive && r === 0 && cols > 1 && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleTableDeleteColumn(elem.id, c);
                                                    }}
                                                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-5.5 h-5.5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md opacity-0 group-hover/cell:opacity-100 hover:scale-110 transition-all cursor-pointer z-50 border border-white"
                                                    title="حذف هذا العمود"
                                                  >
                                                    -
                                                  </button>
                                                )}

                                                {/* Cell Text contentEditable box */}
                                                <div
                                                  contentEditable={!isPreviewActive}
                                                  suppressContentEditableWarning
                                                  onFocus={() => {
                                                    onSelectTableCell?.({ elementId: elem.id, row: r, col: c });
                                                  }}
                                                  onBlur={(e) => {
                                                    handleTableUpdateCell(elem.id, r, c, e.currentTarget.innerText);
                                                  }}
                                                  className="w-full h-full min-h-[1.5em] px-2.5 py-1.5 outline-none text-right whitespace-pre-wrap select-text break-words leading-snug cursor-text"
                                                  style={{
                                                    fontSize: customCellStyle.fontSize ? `${customCellStyle.fontSize}px` : (elem.styles.fontSize ? `${elem.styles.fontSize}px` : '11px'),
                                                    fontWeight: customCellStyle.fontWeight || (isHeader ? 'bold' : elem.styles.fontWeight || 'normal'),
                                                    color: customCellStyle.color || (isHeader ? '#ffffff' : elem.styles.color || '#374151'),
                                                    textAlign: customCellStyle.textAlign || elem.styles.textAlign || 'right',
                                                    fontStyle: customCellStyle.fontStyle || (isHeader ? 'normal' : elem.styles.fontStyle || 'normal'),
                                                    textDecoration: customCellStyle.textDecoration || (isHeader ? 'none' : elem.styles.textDecoration || 'none'),
                                                    backgroundColor: customCellStyle.backgroundColor || undefined,
                                                  }}
                                                >
                                                  {cellValue}
                                                </div>

                                                {/* Excel Column resize handle at left edge (since RTL, col moves right to left) */}
                                                {!isPreviewActive && (
                                                  <div
                                                    className="absolute top-0 bottom-0 left-0 w-2 cursor-col-resize hover:bg-[#0071e3]/40 active:bg-[#0071e3] transition-all z-20"
                                                    onMouseDown={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      setResizingTableId(elem.id);
                                                      setResizingTableColIdx(c);
                                                      setTableResizeStartX(e.clientX);
                                                      setTableResizeStartWidths([...colWidths]);
                                                    }}
                                                    title="اسحب لتعديل عرض العمود"
                                                  />
                                                )}

                                                {/* Excel Row resize handle at bottom edge */}
                                                {!isPreviewActive && c === 0 && (
                                                  <div
                                                    className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize hover:bg-[#0071e3]/40 active:bg-[#0071e3] transition-all z-20"
                                                    onMouseDown={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      setResizingTableId(elem.id);
                                                      setResizingTableRowIdx(r);
                                                      setTableResizeStartY(e.clientY);
                                                      setTableResizeStartHeights([...rowHeights]);
                                                    }}
                                                    title="اسحب لتعديل ارتفاع السطر"
                                                  />
                                                )}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* 3. Bottom Add Row button + */}
                              {!isPreviewActive && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTableAddRow(elem.id);
                                  }}
                                  className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all z-50 cursor-pointer border-2 border-white opacity-0 group-hover/table:opacity-100 duration-150"
                                  title="إضافة سطر جديد بالأسفل"
                                >
                                  +
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* GALLERY ELEMENT (معرض صور تفاعلي بـ ٤ تنسيقات مطابقة للرسم التخطيطي) */}
                        {elem.type === 'gallery' && (() => {
                          const config = elem.galleryConfig || {
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

                          const items = config.items && config.items.length > 0 ? config.items : [
                            { id: '1', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80', title: 'طبيعة بحيرة وجبال' },
                            { id: '2', url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&auto=format&fit=crop&q=80', title: 'قمم الثلوج' },
                            { id: '3', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80', title: 'غابة الصنوبر' },
                            { id: '4', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80', title: 'شروق الشمس' },
                            { id: '5', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80', title: 'تلال وسهول' }
                          ];

                          const activeIndex = Math.min(Math.max(0, config.activeImageIndex ?? 0), items.length - 1);
                          const activeItem = items[activeIndex] || items[0];
                          const layout = config.layout || 'top-main';
                          const objectFit = config.objectFit || 'cover';
                          const radius = config.borderRadius ?? 12;
                          const gap = config.gap ?? 8;

                          const handleSelectThumbnail = (e: React.MouseEvent, idx: number) => {
                            e.stopPropagation();
                            if (!isPreviewActive) {
                              onSelectElement(elem.id);
                              onSelectSlide(slide.id);
                            }
                            onUpdateElement?.(elem.id, {
                              galleryConfig: {
                                ...config,
                                items,
                                activeImageIndex: idx
                              }
                            });
                          };

                          const handleOpenLightbox = (e?: React.MouseEvent) => {
                            if (e) e.stopPropagation();
                            setLightboxState({
                              isOpen: true,
                              items,
                              activeIndex,
                              title: elem.name || 'معرض صور'
                            });
                          };

                          const handleMainScreenClick = (e: React.MouseEvent) => {
                            if (isPreviewActive) {
                              handleOpenLightbox(e);
                            } else {
                              onSelectElement(elem.id);
                              onSelectSlide(slide.id);
                            }
                          };

                          // Image filter string for gallery photos (allowing editing like normal images)
                          const galleryImageFilter = [
                            elem.styles.imageFilter === 'grayscale' ? 'grayscale(100%)' :
                            elem.styles.imageFilter === 'sepia' ? 'sepia(100%)' :
                            elem.styles.imageFilter === 'invert' ? 'invert(100%)' :
                            elem.styles.imageFilter === 'warm' ? 'sepia(40%) saturate(140%) hue-rotate(-10deg) brightness(105%)' :
                            elem.styles.imageFilter === 'cool' ? 'saturate(115%) hue-rotate(15deg) brightness(95%)' :
                            elem.styles.imageFilter === 'vintage' ? 'sepia(60%) saturate(110%) contrast(110%)' :
                            elem.styles.imageFilter === 'technicolor' ? 'contrast(140%) saturate(180%)' :
                            elem.styles.imageFilter === 'blur' ? 'blur(4px)' : '',
                            elem.styles.brightness !== undefined ? `brightness(${elem.styles.brightness}%)` : ''
                          ].filter(Boolean).join(' ') || undefined;

                          // Render thumbnail item helper
                          const renderThumbnail = (item: typeof items[0], idx: number, extraClass?: string) => {
                            const isCurrent = idx === activeIndex;
                            return (
                              <div
                                key={item.id || idx}
                                onClick={(e) => handleSelectThumbnail(e, idx)}
                                className={`relative overflow-hidden cursor-pointer transition-all duration-200 select-none group/thumb ${
                                  isCurrent 
                                    ? 'ring-2 ring-[#0071e3] ring-offset-2 ring-offset-white opacity-100 scale-[1.02] shadow-sm z-10' 
                                    : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
                                } ${extraClass || ''}`}
                                style={{ borderRadius: `${Math.max(4, radius - 2)}px` }}
                                title={item.title || `صورة ${idx + 1}`}
                              >
                                <img
                                  src={item.url}
                                  alt={item.title || `صورة ${idx + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105 pointer-events-none"
                                  style={{ filter: galleryImageFilter }}
                                  loading="lazy"
                                />
                                {elem.styles.imageTintColor && (
                                  <div 
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: elem.styles.imageTintColor,
                                      opacity: (elem.styles.imageTintOpacity ?? 50) / 100,
                                      mixBlendMode: (elem.styles.imageTintBlendMode || 'multiply') as any
                                    }}
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/10 transition-colors pointer-events-none" />
                              </div>
                            );
                          };

                          // Render Main Screen display
                          const renderMainScreen = (extraClass?: string) => {
                            return (
                              <div
                                onClick={handleMainScreenClick}
                                onDoubleClick={handleOpenLightbox}
                                className={`relative overflow-hidden cursor-pointer select-none group/screen bg-neutral-900 shadow-xs ${extraClass || ''}`}
                                style={{ borderRadius: `${radius}px` }}
                                title={isPreviewActive ? "انقر لتكبير وتصفح الصور 🔍" : "انقر للتحديد، أو نقر مزدوج للتكبير 🔍"}
                              >
                                <img
                                  src={activeItem.url}
                                  alt={activeItem.title || 'شاشة العرض'}
                                  className={`w-full h-full object-${objectFit} transition-transform duration-300 group-hover/screen:scale-[1.01]`}
                                  style={{ filter: galleryImageFilter }}
                                />
                                {elem.styles.imageTintColor && (
                                  <div 
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: elem.styles.imageTintColor,
                                      opacity: (elem.styles.imageTintOpacity ?? 50) / 100,
                                      mixBlendMode: (elem.styles.imageTintBlendMode || 'multiply') as any
                                    }}
                                  />
                                )}
                                
                                {/* Hover overlay hint with enlarge button */}
                                <div 
                                  onClick={handleOpenLightbox}
                                  className="absolute inset-0 bg-black/0 group-hover/screen:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover/screen:opacity-100 cursor-pointer"
                                >
                                  <div className="bg-black/75 backdrop-blur-xs text-white px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover/screen:translate-y-0 transition-transform">
                                    <Maximize2 size={13} />
                                    <span>عرض بملء الشاشة</span>
                                  </div>
                                </div>

                                {/* Counter Badge at corner */}
                                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white/90 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-xs pointer-events-none">
                                  {activeIndex + 1} / {items.length}
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div 
                              className="w-full h-full p-2.5 relative select-none flex flex-col overflow-hidden"
                              style={{
                                borderRadius: `${elem.styles.borderRadius || 18}px`
                              }}
                            >
                              {/* 4 Layout options directly matching the user's hand sketch */}
                              {layout === 'top-main' && (
                                // Layout 1: Top main display, bottom thumbnails row (scales proportionally)
                                <div className="w-full h-full flex flex-col" style={{ gap: `${gap}px` }}>
                                  <div className="flex-1 min-h-0 w-full">
                                    {renderMainScreen("w-full h-full")}
                                  </div>
                                  <div 
                                    className="w-full h-[22%] min-h-[35px] grid grid-cols-5 gap-2 shrink-0 pt-0.5"
                                    style={{ gap: `${gap}px` }}
                                  >
                                    {items.map((item, idx) => renderThumbnail(item, idx, "h-full w-full"))}
                                  </div>
                                </div>
                              )}

                              {layout === 'left-thumbnails' && (
                                // Layout 2: Left 2x2 grid of thumbnails, Right main display
                                <div className="w-full h-full flex flex-row" style={{ gap: `${gap}px` }}>
                                  <div 
                                    className="w-[38%] h-full grid grid-cols-2 grid-rows-2 shrink-0"
                                    style={{ gap: `${gap}px` }}
                                  >
                                    {items.slice(0, 4).map((item, idx) => renderThumbnail(item, idx, "w-full h-full"))}
                                  </div>
                                  <div className="flex-1 min-w-0 h-full">
                                    {renderMainScreen("w-full h-full")}
                                  </div>
                                </div>
                              )}

                              {layout === 'right-thumbnails' && (
                                // Layout 3: Left main display, Right 2x2 grid of thumbnails
                                <div className="w-full h-full flex flex-row" style={{ gap: `${gap}px` }}>
                                  <div className="flex-1 min-w-0 h-full">
                                    {renderMainScreen("w-full h-full")}
                                  </div>
                                  <div 
                                    className="w-[38%] h-full grid grid-cols-2 grid-rows-2 shrink-0"
                                    style={{ gap: `${gap}px` }}
                                  >
                                    {items.slice(0, 4).map((item, idx) => renderThumbnail(item, idx, "w-full h-full"))}
                                  </div>
                                </div>
                              )}

                              {layout === 'left-main-row' && (
                                // Layout 4: Left main display, Right vertical column of thumbnails
                                <div className="w-full h-full flex flex-row" style={{ gap: `${gap}px` }}>
                                  <div className="w-[62%] h-full shrink-0">
                                    {renderMainScreen("w-full h-full")}
                                  </div>
                                  <div 
                                    className="flex-1 min-w-0 h-full flex flex-col justify-between"
                                    style={{ gap: `${gap}px` }}
                                  >
                                    {items.slice(0, 4).map((item, idx) => renderThumbnail(item, idx, "flex-1 min-h-0 w-full"))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {elem.type === 'divider' && (
                          <div className="w-full h-px bg-black/[0.12] my-auto" />
                        )}

                        {elem.type === 'icon' && elem.content && elem.content.startsWith('iconify:') ? (
                          <div className="w-full h-full flex items-center justify-center select-none overflow-hidden p-1">
                            <Icon 
                              icon={elem.content.replace('iconify:', '')} 
                              className="w-full h-full" 
                              style={{ 
                                color: isColorGradient ? undefined : (elem.styles.color || '#0071e3'),
                                fontSize: '100%'
                              }} 
                            />
                          </div>
                        ) : (elem.type === 'badge' || elem.type === 'icon') && (
                          <div className="w-full h-full flex items-center justify-center text-center select-none overflow-hidden px-1 leading-none">
                            {elem.content && (
                              <span 
                                style={{
                                  fontSize: elem.styles.fontSize ? `${elem.styles.fontSize}px` : (elem.width <= 80 && elem.height <= 80 ? '24px' : '16px'),
                                  fontWeight: elem.styles.fontWeight || 'bold',
                                  color: isColorGradient ? 'transparent' : (elem.styles.color || 'inherit'),
                                  lineHeight: 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  ...textGradientStyles,
                                }}
                                contentEditable={!isPreviewActive && isSelected}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                              >
                                {elem.content}
                              </span>
                            )}
                          </div>
                        )}

                        {!elem.compoundType && elem.type === 'shape' && (
                          <div className="w-full h-full flex items-center justify-center text-center p-2 leading-none relative">
                            {elem.isGroupContainer && !isPreviewActive && isSelected && (
                              <div className="absolute top-1.5 right-2 bg-[#0071e3] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs pointer-events-none select-none z-30">
                                <span>📁</span>
                                <span>مجموعة نشطة</span>
                              </div>
                            )}
                            {elem.content && elem.content.startsWith('line-') ? (() => {
                              const lineType = elem.content;
                              const strokeColor = elem.styles.backgroundColor && elem.styles.backgroundColor !== 'transparent'
                                ? elem.styles.backgroundColor
                                : (elem.styles.color || elem.styles.borderColor || '#0071e3');
                              return (
                                <div className="w-full h-full flex items-center justify-center select-none pointer-events-none p-0">
                                  {lineType === 'line-dotted' && (
                                    <svg viewBox="0 0 100 10" width="100%" height="100%" preserveAspectRatio="none">
                                      <path d="M 0,5 L 100,5" fill="none" stroke={strokeColor} strokeWidth="3.5" strokeDasharray="1,6" strokeLinecap="round" />
                                    </svg>
                                  )}
                                  {lineType === 'line-dashed' && (
                                    <svg viewBox="0 0 100 10" width="100%" height="100%" preserveAspectRatio="none">
                                      <path d="M 0,5 L 100,5" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="8,6" />
                                    </svg>
                                  )}
                                  {lineType === 'line-glow' && (
                                    <svg viewBox="0 0 100 12" width="100%" height="100%" preserveAspectRatio="none">
                                      <filter id={`line-glow-filter-${elem.id}`} x="-10%" y="-10%" width="120%" height="120%">
                                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                        <feMerge>
                                          <feMergeNode in="coloredBlur"/>
                                          <feMergeNode in="SourceGraphic"/>
                                        </feMerge>
                                      </filter>
                                      <path d="M 0,6 L 100,6" fill="none" stroke={strokeColor} strokeWidth="3.5" filter={`url(#line-glow-filter-${elem.id})`} strokeLinecap="round" />
                                    </svg>
                                  )}
                                  {lineType === 'line-curve-up' && (
                                    <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                                      <path d="M 2,18 Q 50,2 98,18" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                  )}
                                  {lineType === 'line-wavy' && (
                                    <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                                      <path d="M 0,10 Q 12.5,2 25,10 T 50,10 T 75,10 T 100,10" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                  )}
                                  {lineType === 'line-double' && (
                                    <svg viewBox="0 0 100 10" width="100%" height="100%" preserveAspectRatio="none">
                                      <path d="M 0,2 L 100,2 M 0,8 L 100,8" fill="none" stroke={strokeColor} strokeWidth="2.5" />
                                    </svg>
                                  )}
                                  {lineType === 'line-gradient' && (
                                    <svg viewBox="0 0 100 10" width="100%" height="100%" preserveAspectRatio="none">
                                      <defs>
                                        <linearGradient id={`line-grad-grad-${elem.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor={strokeColor}/>
                                          <stop offset="50%" stopColor={strokeColor} stopOpacity="0.45"/>
                                          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.08"/>
                                        </linearGradient>
                                      </defs>
                                      <path d="M 0,5 L 100,5" fill="none" stroke={`url(#line-grad-grad-${elem.id})`} strokeWidth="3.5" strokeLinecap="round" />
                                    </svg>
                                  )}
                                  {lineType === 'line-3d' && (
                                    <svg viewBox="0 0 100 14" width="100%" height="100%" preserveAspectRatio="none">
                                      <path d="M 0,8 L 100,8" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="3.5" strokeLinecap="round" />
                                      <path d="M 0,5 L 100,5" fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
                                    </svg>
                                  )}
                                  {lineType === 'line-arrow' && (
                                    <svg viewBox="0 0 100 12" width="100%" height="100%" preserveAspectRatio="none">
                                      <defs>
                                        <marker id={`arrow-marker-${elem.id}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
                                        </marker>
                                      </defs>
                                      <path d="M 0,6 L 94,6" fill="none" stroke={strokeColor} strokeWidth="2.5" markerEnd={`url(#arrow-marker-${elem.id})`} />
                                    </svg>
                                  )}
                                  {lineType === 'line-zigzag' && (
                                    <svg viewBox="0 0 100 20" width="100%" height="100%" preserveAspectRatio="none">
                                      <path d="M 0,10 L 10,2 L 20,18 L 30,2 L 40,18 L 50,2 L 60,18 L 70,2 L 80,18 L 90,2 L 100,10" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                              );
                            })() : (
                              elem.content && (
                                <span 
                                  style={{
                                    fontSize: elem.styles.fontSize ? `${elem.styles.fontSize}px` : undefined,
                                    fontWeight: elem.styles.fontWeight || 'semibold',
                                    color: isColorGradient ? 'transparent' : (elem.styles.color || 'inherit'),
                                    ...textGradientStyles
                                  }}
                                  contentEditable={!isPreviewActive && isSelected}
                                  suppressContentEditableWarning
                                  onBlur={(e) => onUpdateElementContent(elem.id, e.currentTarget.innerText)}
                                >
                                  {elem.content}
                                </span>
                              )
                            )}
                          </div>
                        )}

                        {elem.type === 'mask' && (() => {
                          const maskId = elem.content || 'circle';
                          const maskColor = elem.styles.backgroundColor || '#ffffff';
                          const foundMask = MASK_SHAPES.find(m => m.id === maskId) || MASK_SHAPES[0];
                          return (
                            <div className="w-full h-full relative pointer-events-none select-none overflow-hidden">
                              {foundMask.svg(maskColor)}
                            </div>
                          );
                        })()}

                        {elem.type === 'video' && (() => {
                          // Extract embed URL for YouTube or TikTok
                          const getEmbedUrl = (url?: string): string | null => {
                            if (!url) return null;
                            
                            // YouTube
                            const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                            if (ytMatch && ytMatch[1]) {
                              return `https://www.youtube.com/embed/${ytMatch[1]}`;
                            }
                            
                            // YouTube Shorts
                            const shortsMatch = url.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/i);
                            if (shortsMatch && shortsMatch[1]) {
                              return `https://www.youtube.com/embed/${shortsMatch[1]}`;
                            }

                            // TikTok
                            const ttMatch = url.match(/tiktok\.com\/@?[^\/]+\/video\/(\d+)/i);
                            if (ttMatch && ttMatch[1]) {
                              return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;
                            }

                            return null;
                          };

                          const embedUrl = getEmbedUrl(elem.videoUrl);

                          if (embedUrl) {
                            return (
                              <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative">
                                <iframe
                                  src={embedUrl}
                                  title={elem.content || "Video Player"}
                                  className="w-full h-full border-0 absolute inset-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                                {/* Overlay to block clicks during editing so drag/resize work */}
                                {!isPreviewActive && (
                                  <div className="absolute inset-0 bg-transparent z-10 cursor-move" />
                                )}
                              </div>
                            );
                          }

                          return (
                            <div className="w-full h-full bg-[#111827] rounded-2xl overflow-hidden relative flex flex-col justify-between p-3 text-white select-none border border-white/10 shadow-lg">
                              {/* Video Top Bar */}
                              <div className="flex items-center justify-between z-10">
                                <span className="text-[11px] font-bold bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  فيديو بدقة 4K
                                </span>
                                <span className="text-[10px] text-white/70 font-mono">02:45 / 05:00</span>
                              </div>

                              {/* Center Play Button */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-[#0071e3] text-white flex items-center justify-center shadow-lg shadow-[#0071e3]/40 transform group-hover:scale-110 transition-transform">
                                  <span className="text-lg translate-x-0.5">▶</span>
                                </div>
                                <span className="text-xs font-semibold text-white/90 drop-shadow-sm px-4 text-center truncate max-w-[85%]">
                                  {elem.content || 'مشغل فيديو تفاعلي'}
                                </span>
                              </div>

                              {/* Video Progress Bar */}
                              <div className="w-full space-y-1 z-10">
                                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                  <div className="w-2/5 h-full bg-[#0071e3] rounded-full" />
                                </div>
                              </div>
                            </div>
                          );
                        })()}



                        {elem.type === 'map' && (() => {
                          const locationQuery = elem.mapLocation || elem.content || 'الرياض، المملكة العربية السعودية';
                          const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

                          const handleLocateMe = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            if (typeof window === 'undefined' || !navigator.geolocation) {
                              alert('المتصفح لا يدعم تحديد الموقع الجغرافي.');
                              return;
                            }
                            navigator.geolocation.getCurrentPosition(
                              async (pos) => {
                                const { latitude, longitude } = pos.coords;
                                let detected = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                                try {
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
                                        data.address.city || data.address.town || data.address.state,
                                        data.address.country
                                      ].filter(Boolean);
                                      if (parts.length > 0) detected = parts.join('، ');
                                    }
                                  }
                                } catch {}
                                if (onUpdateElement) {
                                  onUpdateElement(elem.id, { mapLocation: detected, content: detected });
                                } else {
                                  onUpdateElementContent(elem.id, detected);
                                }
                              },
                              (err) => {
                                let msg = 'تعذر جلب موقعك الجغرافي.';
                                if (err.code === err.PERMISSION_DENIED) {
                                  msg = 'يرجى السماح للمتصفح بالوصول لموقعك الجغرافي.';
                                }
                                alert(msg);
                              },
                              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                            );
                          };

                          return (
                            <div className="w-full h-full bg-[#e8ecef] rounded-2xl overflow-hidden relative border border-black/[0.08] shadow-sm">
                              <iframe
                                src={embedUrl}
                                title={locationQuery}
                                className="w-full h-full border-0 absolute inset-0"
                                allowFullScreen
                                loading="lazy"
                              />
                              {/* Overlay to block clicks during editing so drag/resize work */}
                              {!isPreviewActive && (
                                <div className="absolute inset-0 bg-transparent z-10 cursor-move flex flex-col justify-between p-3 select-none pointer-events-auto">
                                  {/* Top Search / Location Chip */}
                                  <div className="flex items-center justify-between">
                                    <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-black/[0.06] flex items-center gap-1.5 text-[11px] font-bold text-neutral-800">
                                      <span className="text-red-500">📍</span>
                                      <span className="truncate max-w-[160px]">{locationQuery}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleLocateMe}
                                      className="text-[10px] font-bold bg-white/95 hover:bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-200/80 shadow-2xs flex items-center gap-1 transition-all cursor-pointer pointer-events-auto active:scale-95"
                                      title="تحديد وتثبيت موقعي الجغرافي الحالي على الخريطة"
                                    >
                                      <span>موقعي الحالي</span>
                                      <span>📍</span>
                                    </button>
                                  </div>

                                  {/* Visual helper in edit mode */}
                                  <div className="flex justify-end">
                                    <span className="text-[10px] text-neutral-500 bg-white/90 px-2 py-0.5 rounded shadow-2xs font-medium">
                                      انقر في المعاينة للتفاعل
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {elem.type === 'pricing' && (() => {
                          const accent = elem.styles.color || '#0071e3';
                          const cardBg = elem.styles.backgroundColor || '#ffffff';
                          const cardBorderColor = elem.styles.borderColor || 'rgba(0,0,0,0.08)';
                          const cardBorderWidth = elem.styles.borderWidth ?? 1;
                          const cardRadius = elem.styles.borderRadius ?? 16;
                          const isFeatured = !!elem.pricingFeatured;
                          return (
                            <div
                              className={`w-full h-full p-4 flex flex-col justify-between text-right ${isFeatured ? 'shadow-lg' : 'shadow-sm'}`}
                              style={{
                                backgroundColor: cardBg,
                                borderColor: cardBorderColor,
                                borderWidth: cardBorderWidth,
                                borderStyle: 'solid',
                                borderRadius: cardRadius,
                              }}
                            >
                              {/* Plan Header */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full"
                                    style={{ color: accent, backgroundColor: `${accent}1a` }}
                                  >
                                    {elem.pricingPlan || 'الباقة الأكثر طلباً'}
                                  </span>
                                  {isFeatured && (
                                    <span className="text-[11px] font-bold" style={{ color: accent }}>★ الأكثر طلباً</span>
                                  )}
                                </div>
                                <div className="flex items-baseline gap-1 my-1">
                                  <span className="text-2xl font-black text-neutral-900 tracking-tight">
                                    {elem.pricingPrice || '199 ر.س'}
                                  </span>
                                  <span className="text-xs text-neutral-500 font-medium">
                                    / {elem.pricingPeriod || 'شهرياً'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-500 mt-1">
                                  {elem.content || 'الحل الأمثل لإطلاق موقعك والبدء في استقبال العملاء.'}
                                </p>
                              </div>

                              {/* Features Checklist */}
                              <div className="space-y-1.5 my-2 border-t border-b border-black/[0.06] py-2.5">
                                {(elem.pricingFeatures || [
                                  'تصميم متجاوب كامل مع الجوال',
                                  'دعم فني واستشارات متواصلة',
                                  'سيرفرات سريعة ونطاق مجاني',
                                  'شهادة أمان SSL مدمجة'
                                ]).map((feat, fIdx) => (
                                  <div key={fIdx} className="flex items-center gap-2 text-xs text-neutral-700">
                                    <span className="text-emerald-500 font-bold text-xs">✓</span>
                                    <span className="truncate">{feat}</span>
                                  </div>
                                ))}
                              </div>

                              {/* CTA Button */}
                              <button
                                className="w-full py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-all text-center"
                                style={{ backgroundColor: accent }}
                              >
                                {elem.pricingCtaText || 'اشترك الآن وابدأ'}
                              </button>
                            </div>
                          );
                        })()}

                        {elem.type === 'calendar' && (
                          <InteractiveCalendarWidget elem={elem} />
                        )}

                        {elem.type === 'cart' && (
                          <CartView elem={elem} isPreviewActive={isPreviewActive} />
                        )}

                        {elem.type === 'shopProducts' && (
                          <ShopProductsView elem={elem} isPreviewActive={isPreviewActive} showsSearch={elem.id === storeList?.id} onGrow={shopGrowHandler(elem.id)} boxHeight={elem.height - (isPreviewActive ? shopGrow[elem.id] || 0 : 0)} />
                        )}

                        {elem.type === 'checkout' && (
                          <CheckoutFormCard elem={elem} isPreviewActive={isPreviewActive} />
                        )}

                        {elem.type === 'shopSearch' && (
                          <ShopSearchView elem={elem} isPreviewActive={isPreviewActive} onOpenStore={openStorePage} />
                        )}

                        {elem.type === 'carListings' && (
                          <CarListingsView elem={elem} isPreviewActive={isPreviewActive} showsSearch={elem.id === showroomList?.id} onGrow={shopGrowHandler(elem.id)} boxHeight={elem.height - (isPreviewActive ? shopGrow[elem.id] || 0 : 0)} />
                        )}

                        {elem.type === 'menuList' && (
                          <MenuView elem={elem} isPreviewActive={isPreviewActive} onGrow={shopGrowHandler(elem.id)} boxHeight={elem.height - (isPreviewActive ? shopGrow[elem.id] || 0 : 0)} />
                        )}

                        {elem.type === 'menuCart' && (
                          <MenuCartView elem={elem} isPreviewActive={isPreviewActive} />
                        )}

                        {elem.type === 'carSearch' && (
                          <CarSearchView elem={elem} isPreviewActive={isPreviewActive} onOpenShowroom={openShowroomPage} />
                        )}

                        {elem.type === 'html' && (
                          <div className="w-full h-full bg-white rounded-xl border border-black/[0.08] overflow-hidden flex flex-col">
                            <div className="bg-neutral-100 px-3 py-1 border-b border-black/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-500">
                              <span>&lt;/&gt; HTML Container</span>
                              <span className="text-emerald-600 font-bold">مفعل</span>
                            </div>
                            <div 
                              className="flex-1 p-3 overflow-auto flex items-center justify-center"
                              dangerouslySetInnerHTML={{ __html: elem.htmlCode || elem.content || '<div style="color:#0071e3; font-weight:bold;">حاوية HTML نشطة</div>' }}
                            />
                          </div>
                        )}
                        </div>
                      </div>

                      {/* Selection Bounding Box & Resizing Handles */}
                      {isSelected && (
                        <>
                          {/* Direct Edit / Two-finger Pinch Focus Banner */}
                          {focusedElementId === elem.id && (
                            <div 
                              className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1d1d1f] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xl border border-emerald-400 whitespace-nowrap pointer-events-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              <span>تعديل بإصبعين ✦ (قرّب أو باعِد للتكبير والتدوير)</span>
                              <button 
                                type="button"
                                onClick={() => setFocusedElementId(null)}
                                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs cursor-pointer mr-1 transition-all"
                              >
                                تم ✓
                              </button>
                            </div>
                          )}

                          {/* Long-Press Dragging Indicator Badge */}
                          {isTouchDragging && isSelected && (
                            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 z-50 bg-[#0071e3] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1 animate-pulse">
                              <span>جاري السحب والإفلات ✦</span>
                            </div>
                          )}

                          {/* Dimensions & Controls Floating Tooltip */}
                          <div 
                            className="absolute -top-7 right-0 flex items-center gap-1.5 bg-[#1d1d1f] text-white text-[10px] px-2 py-0.5 rounded-md shadow-md pointer-events-auto"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <span className="font-mono">{elem.width} × {elem.height}px</span>
                            {Boolean(elem.rotation && elem.rotation !== 0) && (
                              <>
                                <div className="w-px h-2.5 bg-white/20 mx-0.5" />
                                <span className="font-mono text-[#40a9ff]">{Math.round(elem.rotation || 0)}°</span>
                              </>
                            )}
                            <div className="w-px h-2.5 bg-white/20 mx-0.5" />
                            <button
                              onClick={() => onDuplicateElement(elem.id)}
                              className="hover:text-[#40a9ff] transition-colors"
                              title="تكرار"
                            >
                              <Copy size={11} />
                            </button>
                            <button
                              onClick={() => onDeleteElement(elem.id)}
                              className="hover:text-red-400 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>

                           {/* Rotation Handle - Moved to bottom and distanced from the border to prevent overlap with drag/resize handles */}
                          <div
                            className="absolute -bottom-11 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 pointer-events-auto"
                            onMouseDown={(e) => handleRotateMouseDown(e, elem)}
                            onTouchStart={(e) => {
                              if (e.touches.length === 1) {
                                const touch = e.touches[0];
                                handleRotateMouseDown({
                                  ...e,
                                  clientX: touch.clientX,
                                  clientY: touch.clientY,
                                  stopPropagation: () => e.stopPropagation(),
                                  preventDefault: () => e.preventDefault(),
                                } as any, elem);
                              }
                            }}
                          >
                            <div className="w-0.5 h-3.5 bg-[#0071e3]" />
                            <div
                              className="w-5 h-5 rounded-full bg-white border-2 border-[#0071e3] shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-125 transition-transform group/rot before:absolute before:-inset-2 before:content-['']"
                              title="تدوير العنصر حول مركزه (اضغط واسحب بالماوس أو الإصبع للتدوير)"
                            >
                              <RotateCw size={11} className="text-[#0071e3] group-hover/rot:rotate-45 transition-transform" />
                            </div>
                            {(isRotating || (elem.rotation !== undefined && elem.rotation !== 0)) && (
                              <div className="absolute -bottom-6 bg-[#1d1d1f] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm pointer-events-none whitespace-nowrap">
                                {Math.round(isRotating ? rotatingAngle : (elem.rotation || 0))}°
                              </div>
                            )}
                          </div>

                          {/* 4 Corner Handles (Apple blue square handles with comfortable touch targets) */}
                          {/* 1. Top-Right (North-East: ⤢) */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'ne', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 'ne', elem)}
                            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0071e3] rounded-xs cursor-nesw-resize z-40 shadow-xs before:absolute before:-inset-2.5 before:content-['']"
                            title="تغيير الحجم من الزاوية العلوية اليمنى"
                          />
                          {/* 2. Top-Left (North-West: ⤡) */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'nw', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 'nw', elem)}
                            className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0071e3] rounded-xs cursor-nwse-resize z-40 shadow-xs before:absolute before:-inset-2.5 before:content-['']"
                            title="تغيير الحجم من الزاوية العلوية اليسرى"
                          />
                          {/* 3. Bottom-Left (South-West: ⤢) */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'sw', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 'sw', elem)}
                            className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0071e3] rounded-xs cursor-nesw-resize z-40 shadow-xs before:absolute before:-inset-2.5 before:content-['']"
                            title="تغيير الحجم من الزاوية السفلية اليسرى"
                          />
                          {/* 4. Bottom-Right (South-East: ⤡) */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'se', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 'se', elem)}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#0071e3] rounded-xs cursor-nwse-resize z-40 shadow-xs before:absolute before:-inset-2.5 before:content-['']"
                            title="تغيير الحجم من الزاوية السفلية اليمنى"
                          />

                          {/* 4 Edge Handles */}
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'n', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 'n', elem)}
                            className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border border-[#0071e3] rounded-xs cursor-ns-resize z-40 shadow-xs before:absolute before:-inset-2 before:content-['']"
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 's', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 's', elem)}
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border border-[#0071e3] rounded-xs cursor-ns-resize z-40 shadow-xs before:absolute before:-inset-2 before:content-['']"
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'e', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 'e', elem)}
                            className="absolute top-1/2 -translate-y-1/2 -right-1 w-1.5 h-4 bg-white border border-[#0071e3] rounded-xs cursor-ew-resize z-40 shadow-xs before:absolute before:-inset-2 before:content-['']"
                          />
                          <div
                            onMouseDown={(e) => handleResizeMouseDown(e, 'w', elem)}
                            onTouchStart={(e) => handleResizeTouchStart(e, 'w', elem)}
                            className="absolute top-1/2 -translate-y-1/2 -left-1 w-1.5 h-4 bg-white border border-[#0071e3] rounded-xs cursor-ew-resize z-40 shadow-xs before:absolute before:-inset-2 before:content-['']"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
                </div>

                {/* SVG Slide Transition / Divider at the bottom of the slide */}
                {slide.dividerShape && slide.dividerShape !== 'straight' && (() => {
                  const dividerDef = SLIDE_DIVIDER_OPTIONS.find(d => d.id === slide.dividerShape);
                  if (!dividerDef) return null;
                  const nextSlideBg = slides[slideIndex + 1]?.backgroundColor || '#f5f5f7';
                  return dividerDef.renderDivider(nextSlideBg, 54);
                })()}

                {/* Active Alignment Guide Lines */}
                {isSlideActive && selectedElement?.slideId === slide.id && (isDragging || isResizing) && (
                  <>
                    {activeGuides.vertical && (
                      <div 
                        className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center justify-start"
                        style={{
                          left: `${activeGuides.vertical.x}px`,
                          width: '1px',
                        }}
                      >
                        <div className="h-full border-l-2 border-dashed border-pink-500 opacity-90 shadow-[0_0_4px_rgba(236,72,153,0.5)]" />
                        {activeGuides.vertical.label && (
                          <div className="absolute top-3 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded shadow-md font-semibold whitespace-nowrap opacity-95 z-50">
                            {activeGuides.vertical.label}
                          </div>
                        )}
                      </div>
                    )}
                    {activeGuides.horizontal && (
                      <div 
                        className="absolute left-0 right-0 pointer-events-none z-50 flex items-center justify-end"
                        style={{
                          top: `${activeGuides.horizontal.y}px`,
                          height: '1px',
                        }}
                      >
                        <div className="w-full border-t-2 border-dashed border-pink-500 opacity-90 shadow-[0_0_4px_rgba(236,72,153,0.5)]" />
                        {activeGuides.horizontal.label && (
                          <div className="absolute right-3 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded shadow-md font-semibold whitespace-nowrap opacity-95 z-50">
                            {activeGuides.horizontal.label}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 5. Tactile Slide Height Drag Resize Handle (Core platform feature) */}
                {!isPreviewActive && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize z-30 group flex items-center justify-center select-none ${
                      resizingSlideId === slide.id ? 'bg-[#0071e3]/10' : 'hover:bg-neutral-100/50'
                    }`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setResizingSlideId(slide.id);
                      setSlideResizeStartY(e.clientY);
                      setSlideResizeStartHeight(slide.height);
                    }}
                    onTouchStart={(e) => {
                      if (e.touches.length === 1) {
                        e.stopPropagation();
                        setResizingSlideId(slide.id);
                        setSlideResizeStartY(e.touches[0].clientY);
                        setSlideResizeStartHeight(slide.height);
                      }
                    }}
                    title="اضغط واسحب الشريحة لأسفل أو لأعلى لتكبيرها أو تصغيرها (تغيير ارتفاع الشريحة)"
                  >
                    {/* Visual indicator bar */}
                    <div className={`w-16 h-1 rounded-full bg-neutral-300 group-hover:bg-[#0071e3] transition-all ${
                      resizingSlideId === slide.id ? 'bg-[#0071e3] scale-x-125' : ''
                    }`} />
                    
                    {/* Size Tooltip */}
                    {resizingSlideId === slide.id && (
                      <div className="absolute top-4 bg-[#1d1d1f] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none z-50 font-mono">
                        {slide.height}px
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info strip of page */}
        <footer className="w-full px-6 py-4 bg-[#fbfbfd] border-t border-black/[0.06] text-center text-xs text-neutral-400">
          <span>تم التصميم بواسطة منصة </span>
          <strong className="text-neutral-700 font-semibold">Weelink</strong>
          <span> • صُمم خصيصاً للمنطقة العربية</span>
        </footer>
        </div>
      </div>

    {/* Floating drop compression indicator */}
    {isDroppingPhoto && (
      <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-medium backdrop-blur-md border border-white/10 animate-pulse">
        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span>جاري معالجة وضغط الصورة (≤150KB) وإدراجها في الساحة...</span>
      </div>
    )}

    {/* SVG DEFINITIONS FOR CREATIVE RESPONSIVE SHAPES */}
    <svg className="absolute w-0 h-0 pointer-events-none opacity-0" style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
      <defs>
        {/* LEAVES & NATURE */}
        <clipPath id="clip-shape-leaf-classic" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0 C 0.8 0.3, 0.9 0.6, 0.5 1 C 0.1 0.6, 0.2 0.3, 0.5 0 Z" />
        </clipPath>
        <clipPath id="clip-shape-leaf-curved" clipPathUnits="objectBoundingBox">
          <path d="M 0.2 0.1 C 0.5 0, 0.9 0.3, 0.8 0.8 C 0.7 0.9, 0.4 0.9, 0.2 0.7 C 0 0.5, 0 0.2, 0.2 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-dew-drop" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0 C 0.5 0, 0.9 0.5, 0.9 0.75 A 0.4 0.4 0 0 1 0.1 0.75 C 0.1 0.5, 0.5 0, 0.5 0 Z" />
        </clipPath>
        <clipPath id="clip-shape-petal" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.1 C 0.8 0.1, 0.9 0.4, 0.6 0.9 C 0.5 1, 0.5 1, 0.4 0.9 C 0.1 0.4, 0.2 0.1, 0.5 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-lotus" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.2 C 0.7 0.1, 0.9 0.3, 0.9 0.6 C 0.9 0.8, 0.7 1, 0.5 0.9 C 0.3 1, 0.1 0.8, 0.1 0.6 C 0.1 0.3, 0.3 0.1, 0.5 0.2 Z" />
        </clipPath>
        <clipPath id="clip-shape-feather" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0 C 0.7 0.2, 0.75 0.5, 0.6 0.9 C 0.55 0.95, 0.5 1, 0.5 1 C 0.5 1, 0.45 0.95, 0.4 0.9 C 0.25 0.5, 0.3 0.2, 0.5 0 Z" />
        </clipPath>
        <clipPath id="clip-shape-monstera" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0 C 0.8 0, 1 0.3, 0.9 0.6 C 0.85 0.7, 0.75 0.75, 0.7 0.7 C 0.65 0.6, 0.6 0.6, 0.55 0.75 C 0.5 0.9, 0.5 1, 0.5 1 C 0.5 1, 0.5 0.9, 0.45 0.75 C 0.4 0.6, 0.35 0.6, 0.3 0.7 C 0.25 0.75, 0.15 0.7, 0.1 0.6 C 0 0.3, 0.2 0, 0.5 0 Z" />
        </clipPath>
        <clipPath id="clip-shape-bud" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.1 C 0.6 0.3, 0.8 0.4, 0.8 0.7 C 0.8 0.9, 0.6 1, 0.5 0.95 C 0.4 1, 0.2 0.9, 0.2 0.7 C 0.2 0.4, 0.4 0.3, 0.5 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-grass" clipPathUnits="objectBoundingBox">
          <path d="M 0.1 1 C 0.3 0.7, 0.5 0.4, 0.9 0.1 C 0.8 0.3, 0.5 0.6, 0.3 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-pod" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0 C 0.9 0.2, 0.8 0.8, 0.5 1 C 0.2 0.8, 0.1 0.2, 0.5 0 Z" />
        </clipPath>

        {/* ARCHES & CURVES */}
        <clipPath id="clip-shape-arch-classic" clipPathUnits="objectBoundingBox">
          <path d="M 0 1 L 0 0.5 C 0 0.2, 1 0.2, 1 0.5 L 1 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-arch-gothic" clipPathUnits="objectBoundingBox">
          <path d="M 0 1 L 0 0.5 C 0 0.25, 0.3 0.1, 0.5 0 C 0.7 0.1, 1 0.25, 1 0.5 L 1 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-mosque" clipPathUnits="objectBoundingBox">
          <path d="M 0 1 L 0 0.6 C 0 0.4, 0.2 0.3, 0.35 0.25 C 0.45 0.2, 0.5 0.05, 0.5 0 C 0.5 0.05, 0.55 0.2, 0.65 0.25 C 0.8 0.3, 1 0.4, 1 0.6 L 1 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-crescent" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0 C 0.77 0.15, 0.9 0.45, 0.8 0.75 C 0.7 0.95, 0.45 1, 0.35 1 C 0.6 0.9, 0.7 0.65, 0.6 0.4 C 0.5 0.2, 0.3 0.1, 0.2 0.1 C 0.3 0.03, 0.4 0, 0.5 0 Z" />
        </clipPath>
        <clipPath id="clip-shape-tunnel" clipPathUnits="objectBoundingBox">
          <path d="M 0.1 1 L 0.1 0.4 C 0.1 0.15, 0.9 0.15, 0.9 0.4 L 0.9 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-arch-double" clipPathUnits="objectBoundingBox">
          <path d="M 0 1 L 0 0.5 C 0 0.2, 0.5 0.2, 0.5 0.5 C 0.5 0.2, 1 0.2, 1 0.5 L 1 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-sine-wave" clipPathUnits="objectBoundingBox">
          <path d="M 0 1 L 0 0.5 C 0.25 0.2, 0.25 0.8, 0.5 0.5 C 0.75 0.2, 0.75 0.8, 1 0.5 L 1 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-window-arch" clipPathUnits="objectBoundingBox">
          <path d="M 0.1 1 L 0.1 0.3 A 0.4 0.4 0 0 1 0.9 0.3 L 0.9 1 Z" />
        </clipPath>
        <clipPath id="clip-shape-scurve" clipPathUnits="objectBoundingBox">
          <path d="M 0 0.8 C 0.3 1, 0.4 0.4, 0.7 0.6 C 0.9 0.7, 1 0.5, 1 0.3 L 1 0 L 0 0 Z" />
        </clipPath>
        <clipPath id="clip-shape-arch-dome" clipPathUnits="objectBoundingBox">
          <path d="M 0.2 1 L 0.2 0.4 C 0.2 0.2, 0.8 0.2, 0.8 0.4 L 0.8 1 Z" />
        </clipPath>

        {/* FLUID & BLOBS */}
        <clipPath id="clip-shape-blob-splash" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.1 C 0.7 0.05, 0.95 0.2, 0.9 0.5 C 0.85 0.8, 0.7 0.9, 0.45 0.95 C 0.2 1, 0.05 0.75, 0.1 0.5 C 0.15 0.25, 0.3 0.15, 0.5 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-org-a" clipPathUnits="objectBoundingBox">
          <path d="M 0.4 0.1 C 0.6 0.05, 0.85 0.25, 0.9 0.45 C 0.95 0.65, 0.75 0.9, 0.5 0.95 C 0.25 1, 0.1 0.8, 0.1 0.6 C 0.1 0.4, 0.2 0.15, 0.4 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-org-b" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.15 C 0.75 0.1, 0.9 0.3, 0.85 0.6 C 0.8 0.9, 0.55 0.9, 0.35 0.95 C 0.15 1, 0.05 0.7, 0.15 0.45 C 0.25 0.2, 0.35 0.2, 0.5 0.15 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-cloud" clipPathUnits="objectBoundingBox">
          <path d="M 0.3 0.2 C 0.5 0.1, 0.7 0.15, 0.8 0.3 C 0.95 0.4, 0.95 0.7, 0.8 0.8 C 0.65 0.9, 0.35 0.9, 0.2 0.8 C 0.05 0.7, 0.05 0.4, 0.2 0.3 C 0.25 0.25, 0.28 0.2, 0.3 0.2 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-slanted" clipPathUnits="objectBoundingBox">
          <path d="M 0.7 0.1 C 0.9 0.3, 0.95 0.7, 0.7 0.9 C 0.45 1.1, 0.1 0.9, 0.1 0.6 C 0.1 0.3, 0.4 0, 0.7 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-bubble" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.1 C 0.8 0.1, 0.9 0.3, 0.9 0.5 C 0.9 0.7, 0.8 0.9, 0.5 0.9 C 0.2 0.9, 0.1 0.7, 0.1 0.5 C 0.1 0.3, 0.2 0.1, 0.5 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-amoeba" clipPathUnits="objectBoundingBox">
          <path d="M 0.45 0.1 C 0.7 0.05, 0.9 0.25, 0.8 0.5 C 0.7 0.75, 0.9 0.9, 0.55 0.95 C 0.2 1, 0.05 0.7, 0.15 0.5 C 0.25 0.3, 0.2 0.15, 0.45 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-energy" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.2 C 0.8 0.1, 0.95 0.4, 0.85 0.7 C 0.75 1, 0.4 0.9, 0.2 0.8 C 0 0.7, 0.1 0.4, 0.25 0.3 C 0.4 0.2, 0.3 0.25, 0.5 0.2 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-honey" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.1 C 0.7 0.1, 0.85 0.25, 0.85 0.5 C 0.85 0.75, 0.65 0.9, 0.5 0.95 C 0.35 0.9, 0.15 0.75, 0.15 0.5 C 0.15 0.25, 0.3 0.1, 0.5 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-ink" clipPathUnits="objectBoundingBox">
          <path d="M 0.4 0.15 C 0.6 0.1, 0.8 0.2, 0.9 0.4 C 1 0.6, 0.85 0.8, 0.65 0.85 C 0.45 0.9, 0.2 1, 0.1 0.75 C 0 0.5, 0.15 0.3, 0.25 0.2 C 0.3 0.15, 0.35 0.2, 0.4 0.15 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-sunset" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.1 C 0.85 0.1, 0.9 0.4, 0.85 0.65 C 0.8 0.9, 0.5 0.95, 0.3 0.85 C 0.1 0.75, 0.05 0.5, 0.15 0.3 C 0.25 0.1, 0.35 0.1, 0.5 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-volcano" clipPathUnits="objectBoundingBox">
          <path d="M 0.45 0.1 C 0.65 0.1, 0.85 0.2, 0.9 0.5 C 0.95 0.8, 0.7 0.9, 0.5 0.9 C 0.3 0.9, 0.1 0.8, 0.1 0.5 C 0.1 0.2, 0.25 0.1, 0.45 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-wavy" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.1 C 0.7 0.1, 0.9 0.25, 0.85 0.55 C 0.8 0.85, 0.6 0.9, 0.35 0.85 C 0.1 0.8, 0.1 0.5, 0.2 0.3 C 0.3 0.1, 0.4 0.1, 0.5 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-river" clipPathUnits="objectBoundingBox">
          <path d="M 0.2 0.2 C 0.5 0.05, 0.8 0.25, 0.9 0.5 C 1 0.75, 0.7 0.9, 0.45 0.95 C 0.2 1, 0.05 0.8, 0.1 0.5 C 0.15 0.2, 0.1 0.25, 0.2 0.2 Z" />
        </clipPath>
        <clipPath id="clip-shape-blob-egg" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.05 C 0.75 0.05, 0.85 0.4, 0.85 0.7 C 0.85 0.9, 0.7 1, 0.5 1 C 0.3 1, 0.15 0.9, 0.15 0.7 C 0.15 0.4, 0.25 0.05, 0.5 0.05 Z" />
        </clipPath>

        {/* BRUSH STROKES & SPLATTERS */}
        <clipPath id="clip-shape-brush-horiz" clipPathUnits="objectBoundingBox">
          <path d="M 0.05 0.35 C 0.2 0.2, 0.4 0.4, 0.6 0.25 C 0.8 0.1, 0.95 0.3, 0.95 0.45 C 0.95 0.6, 0.8 0.5, 0.65 0.65 C 0.5 0.8, 0.3 0.5, 0.15 0.65 C 0.05 0.8, 0.02 0.5, 0.05 0.35 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-vert" clipPathUnits="objectBoundingBox">
          <path d="M 0.35 0.05 C 0.5 0.02, 0.6 0.1, 0.65 0.25 C 0.7 0.4, 0.5 0.6, 0.65 0.75 C 0.8 0.9, 0.6 0.98, 0.45 0.95 C 0.3 0.92, 0.4 0.8, 0.35 0.65 C 0.3 0.5, 0.45 0.4, 0.35 0.25 C 0.25 0.1, 0.2 0.08, 0.35 0.05 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-watercolor" clipPathUnits="objectBoundingBox">
          <path d="M 0.45 0.1 C 0.65 0.05, 0.8 0.15, 0.85 0.3 C 0.9 0.45, 0.95 0.6, 0.85 0.75 C 0.75 0.9, 0.55 0.95, 0.4 0.9 C 0.25 0.85, 0.1 0.8, 0.05 0.6 C 0 0.4, 0.15 0.2, 0.3 0.15 C 0.35 0.1, 0.4 0.15, 0.45 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-splatter" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.2 C 0.55 0.05, 0.65 0.15, 0.65 0.25 C 0.75 0.2, 0.85 0.25, 0.8 0.4 C 0.95 0.45, 0.9 0.55, 0.8 0.6 C 0.85 0.7, 0.75 0.8, 0.65 0.75 C 0.6 0.9, 0.5 0.85, 0.45 0.75 C 0.35 0.8, 0.25 0.75, 0.3 0.6 C 0.15 0.55, 0.1 0.45, 0.25 0.4 C 0.2 0.25, 0.3 0.2, 0.4 0.25 C 0.45 0.15, 0.48 0.05, 0.5 0.2 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-smudge" clipPathUnits="objectBoundingBox">
          <path d="M 0.15 0.3 C 0.3 0.2, 0.5 0.4, 0.7 0.25 C 0.9 0.1, 0.95 0.4, 0.85 0.6 C 0.75 0.8, 0.5 0.7, 0.3 0.8 C 0.1 0.9, 0.05 0.6, 0.15 0.3 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-diagonal" clipPathUnits="objectBoundingBox">
          <path d="M 0.1 0.9 C 0.2 0.8, 0.4 0.5, 0.7 0.2 C 0.9 0, 0.98 0.1, 0.9 0.3 C 0.8 0.5, 0.5 0.8, 0.2 0.98 C 0.1 1, 0.05 0.95, 0.1 0.9 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-roller" clipPathUnits="objectBoundingBox">
          <path d="M 0.2 0.25 L 0.8 0.25 C 0.9 0.25, 0.9 0.75, 0.8 0.75 L 0.2 0.75 C 0.1 0.75, 0.1 0.25, 0.2 0.25 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-feather" clipPathUnits="objectBoundingBox">
          <path d="M 0.3 0.1 C 0.5 0.2, 0.7 0.1, 0.8 0.3 C 0.9 0.5, 0.7 0.8, 0.5 0.9 C 0.3 1, 0.2 0.8, 0.2 0.6 C 0.2 0.4, 0.1 0.2, 0.3 0.1 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-messy" clipPathUnits="objectBoundingBox">
          <path d="M 0.4 0.2 C 0.6 0.1, 0.8 0.3, 0.8 0.5 C 0.8 0.7, 0.9 0.8, 0.6 0.85 C 0.4 0.9, 0.2 0.8, 0.2 0.6 C 0.2 0.4, 0.2 0.3, 0.4 0.2 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-splodge" clipPathUnits="objectBoundingBox">
          <path d="M 0.2 0.3 C 0.4 0.2, 0.6 0.4, 0.8 0.3 C 0.9 0.5, 0.8 0.7, 0.6 0.8 C 0.4 0.9, 0.2 0.7, 0.2 0.5 C 0.2 0.4, 0.1 0.3, 0.2 0.3 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-swipe" clipPathUnits="objectBoundingBox">
          <path d="M 0.1 0.3 L 0.9 0.2 C 0.95 0.2, 0.95 0.8, 0.9 0.8 L 0.1 0.7 C 0.05 0.7, 0.05 0.3, 0.1 0.3 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-scratch" clipPathUnits="objectBoundingBox">
          <path d="M 0.2 0.4 C 0.4 0.3, 0.6 0.5, 0.8 0.4 C 0.9 0.5, 0.7 0.6, 0.5 0.6 C 0.3 0.6, 0.2 0.5, 0.2 0.4 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-dripping" clipPathUnits="objectBoundingBox">
          <path d="M 0.3 0.2 C 0.5 0.1, 0.7 0.2, 0.7 0.4 C 0.7 0.6, 0.8 0.8, 0.6 0.9 C 0.4 1, 0.3 0.8, 0.3 0.6 C 0.3 0.4, 0.2 0.3, 0.3 0.2 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-corona" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.15 C 0.7 0.1, 0.8 0.3, 0.8 0.5 C 0.8 0.7, 0.7 0.8, 0.5 0.85 C 0.3 0.8, 0.2 0.7, 0.2 0.5 C 0.2 0.3, 0.3 0.2, 0.5 0.15 Z" />
        </clipPath>
        <clipPath id="clip-shape-brush-mist" clipPathUnits="objectBoundingBox">
          <path d="M 0.4 0.25 C 0.6 0.2, 0.7 0.3, 0.75 0.5 C 0.8 0.7, 0.6 0.75, 0.45 0.7 C 0.3 0.65, 0.25 0.5, 0.3 0.35 C 0.35 0.25, 0.38 0.25, 0.4 0.25 Z" />
        </clipPath>
        <clipPath id="clip-shape-heart" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.85 C 0.4 0.75, 0.05 0.5, 0.05 0.28 C 0.05 0.12, 0.18 0.05, 0.32 0.05 C 0.42 0.05, 0.48 0.12, 0.5 0.18 C 0.52 0.12, 0.58 0.05, 0.68 0.05 C 0.82 0.05, 0.95 0.12, 0.95 0.28 C 0.95 0.5, 0.6 0.75, 0.5 0.85 Z" />
        </clipPath>
        <clipPath id="clip-shape-crescent-moon" clipPathUnits="objectBoundingBox">
          <path d="M 0.5 0.05 C 0.75 0.05, 0.95 0.25, 0.95 0.5 C 0.95 0.75, 0.75 0.95, 0.5 0.95 C 0.35 0.95, 0.2 0.88, 0.1 0.78 C 0.35 0.78, 0.55 0.65, 0.55 0.5 C 0.55 0.35, 0.35 0.22, 0.1 0.22 C 0.2 0.12, 0.35 0.05, 0.5 0.05 Z" />
        </clipPath>
        
        {/* PREMIUM GEOMETRIC & ABSTRACT USER-REQUESTED SHAPES */}
        <clipPath id="clip-shape-geo-circle" clipPathUnits="objectBoundingBox">
          <circle cx="0.5" cy="0.5" r="0.5" />
        </clipPath>
        <clipPath id="clip-shape-geo-capsule" clipPathUnits="objectBoundingBox">
          <rect x="0" y="0.1" width="1" height="0.8" rx="0.4" ry="0.4" />
        </clipPath>
        <clipPath id="clip-shape-geo-hexagon" clipPathUnits="objectBoundingBox">
          <polygon points="0.25 0, 0.75 0, 1 0.5, 0.75 1, 0.25 1, 0 0.5" />
        </clipPath>
        <clipPath id="clip-shape-geo-octagon" clipPathUnits="objectBoundingBox">
          <polygon points="0.3 0, 0.7 0, 1 0.3, 1 0.7, 0.7 1, 0.3 1, 0 0.7, 0 0.3" />
        </clipPath>
        <clipPath id="clip-shape-geo-triangle" clipPathUnits="objectBoundingBox">
          <polygon points="0.5 0, 1 1, 0 1" />
        </clipPath>
        <clipPath id="clip-shape-geo-leaf-opposite" clipPathUnits="objectBoundingBox">
          <path d="M 0,0.5 C 0,0.2 0.2,0 0.5,0 L 1,0 L 1,0.5 C 1,0.8 0.8,1 0.5,1 L 0,1 Z" />
        </clipPath>
        <clipPath id="clip-shape-geo-three-quarters" clipPathUnits="objectBoundingBox">
          <path d="M 0.5,0.5 L 0.5,0 A 0.5,0.5 0 1,1 0,0.5 Z" />
        </clipPath>
        <clipPath id="clip-shape-geo-puzzle-a" clipPathUnits="objectBoundingBox">
          <path d="M 0,0 H 0.35 C 0.35,0.1 0.4,0.15 0.5,0.15 C 0.6,0.15 0.65,0.1 0.65,0 H 1 V 0.35 C 0.9,0.35 0.85,0.4 0.85,0.5 C 0.85,0.6 0.9,0.65 1,0.65 V 1 H 0.65 C 0.65,0.9 0.6,0.85 0.5,0.85 C 0.4,0.85 0.35,0.9 0.35,1 H 0 V 0.65 C 0.1,0.65 0.15,0.6 0.15,0.5 C 0.15,0.4 0.1,0.35 0,0.35 Z" />
        </clipPath>
        <clipPath id="clip-shape-geo-puzzle-b" clipPathUnits="objectBoundingBox">
          <path d="M 0,0 H 0.35 C 0.35,-0.1 0.4,-0.15 0.5,-0.15 C 0.6,-0.15 0.65,-0.1 0.65,0 H 1 V 0.35 C 1.1,0.35 1.15,0.4 1.15,0.5 C 1.15,0.6 1.1,0.65 1,0.65 V 1 H 0.65 C 0.65,1.1 0.6,1.15 0.5,1.15 C 0.4,1.15 0.35,1.1 0.35,1 H 0 V 0.65 C -0.1,0.65 -0.15,0.6 -0.15,0.5 C -0.15,0.4 -0.1,0.35 0,0.35 Z" />
        </clipPath>
      </defs>
    </svg>

    {/* Gallery Lightbox Modal - Fullscreen Interactive Viewer */}
    {lightboxState?.isOpen && (
      <div 
        className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) setLightboxState(null);
        }}
        dir="rtl"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between text-white z-10 px-2 sm:px-4">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold bg-white/10 px-3 py-1 rounded-full text-white/90">
              صورة {lightboxState.activeIndex + 1} من {lightboxState.items.length}
            </span>
            {lightboxState.items[lightboxState.activeIndex]?.title && (
              <span className="text-sm font-medium text-white/80 hidden sm:inline max-w-md truncate">
                {lightboxState.items[lightboxState.activeIndex].title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const item = lightboxState.items[lightboxState.activeIndex];
                if (item) handleDownloadLightboxImage(item.url, item.title);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="تنزيل الصورة الحالية"
            >
              <Download size={18} />
            </button>
            <button
              type="button"
              onClick={() => setLightboxState(null)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="إغلاق (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Middle Stage: Image & Left / Right navigation arrows */}
        <div className="flex-1 flex items-center justify-between relative px-1 sm:px-6 my-2 min-h-0">
          {/* Previous image arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxState(prev => {
                if (!prev) return null;
                const prevIdx = (prev.activeIndex - 1 + prev.items.length) % prev.items.length;
                return { ...prev, activeIndex: prevIdx };
              });
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer z-10 shadow-lg"
            title="الصورة السابقة (سهم يمين)"
          >
            <ChevronRight size={24} />
          </button>

          {/* Main Large Image */}
          <div className="flex-1 h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <img
              src={lightboxState.items[lightboxState.activeIndex]?.url}
              alt={lightboxState.items[lightboxState.activeIndex]?.title || 'معاينة بالحجم الكامل'}
              className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl transition-all duration-300 pointer-events-none select-none"
            />
          </div>

          {/* Next image arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxState(prev => {
                if (!prev) return null;
                const nextIdx = (prev.activeIndex + 1) % prev.items.length;
                return { ...prev, activeIndex: nextIdx };
              });
            }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer z-10 shadow-lg"
            title="الصورة التالية (سهم يسار)"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Bottom Thumbnails Strip */}
        <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 no-scrollbar z-10">
          {lightboxState.items.map((item, idx) => {
            const isSelected = idx === lightboxState.activeIndex;
            return (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setLightboxState(prev => prev ? { ...prev, activeIndex: idx } : null)}
                className={`w-13 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer ${
                  isSelected 
                    ? 'ring-2 ring-white scale-110 shadow-lg opacity-100' 
                    : 'opacity-50 hover:opacity-85'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.title || `مصغرة ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    )}
  </div>
    </>
  );
};
