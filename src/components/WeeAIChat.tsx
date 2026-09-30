import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  MapPin, 
  Sparkles, 
  Check, 
  ArrowLeft,
  X
} from 'lucide-react';

interface WeeAIChatProps {
  userId: string;
  userEmail: string;
  onCompleteChat?: (collectedData: any) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onStepChange?: (stepNum: number) => void;
}

const SYRIAN_GOVERNORATES = [
  'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'إدلب', 'درعا', 'السويداء', 'القنيطرة', 'دير الزور', 'الحسكة', 'الرقة'
];

const BUSINESS_CATALOG = [
  {
    category: 'مطاعم وكافيهات',
    specialties: ['مطعم شرقي', 'مطعم غربي', 'وجبات سريعة', 'كافيه ومقهى', 'طبخ منزلي 🍳', 'حلويات ومخبوزات', 'غير ذلك']
  },
  {
    category: 'نقل وتوصيل',
    specialties: ['شحن بضائع', 'تكسي وأجرة', 'نقل أثاث', 'توصيل طلبات 📦', 'تأجير سيارات', 'غير ذلك']
  },
  {
    category: 'خدمات طبية ورعاية صحية',
    specialties: ['عيادة طبية', 'طبيب عام', 'أخصائي أسنان', 'صيدلية', 'مستشفى', 'رعاية منزلية', 'غير ذلك']
  },
  {
    category: 'تجارة وتجزئة',
    specialties: ['محل ملابس', 'متجر إلكتروني', 'سوبرماركت', 'مستحضرات تجميل', 'مكتبة وقرطاسية', 'غير ذلك']
  },
  {
    category: 'خدمات تقنية وبرمجية',
    specialties: ['تطوير مواقع وتطبيقات', 'تسويق رقمي', 'تصميم جرافيك', 'صيانة برمجيات', 'شبكات وأمان', 'غير ذلك']
  },
  {
    category: 'تعليم وتدريب',
    specialties: ['مدرسة خاصة', 'معهد تدريبي', 'مدرس خصوصي', 'دورات أونلاين', 'تعليم أطفال', 'غير ذلك']
  },
  {
    category: 'حرف ومهن يدوية',
    specialties: ['صيانة كهرباء', 'أعمال سباكة', 'نجارة وديكور', 'تصليح أجهزة', 'دهان وتشطيب', 'غير ذلك']
  },
  {
    category: 'خدمات سياحية وعقارية',
    specialties: ['شركة سياحة وسفر', 'مكتب عقاري', 'فندق وشقق مفروشة', 'دليل سياحي', 'غير ذلك']
  },
  {
    category: 'غير ذلك',
    specialties: ['أخرى']
  }
];

const getConciseQuestionText = (stepNum: number, name?: string): string => {
  switch (stepNum) {
    case 1:
      return "يرجى تعبئة المعلومات الشخصية لمالك الصفحة:";
    case 2:
      return "يرجى تحديد تفاصيل عنوانك الجغرافي:";
    case 3:
      return "يرجى إدخال معلومات الاتصال وروابطك الاجتماعية:";
    case 4:
      return "يرجى تحديد تصنيف عملك واختصاصك الدقيق:";
    case 5:
      return `${name ? `يا ${name}، ` : ''}اوصف لي طبيعة الصفحة والخدمات التي تقدمها:`;
    case 6:
      return "هل لديك لون مفضل تود تطبيقه في الصفحة؟";
    case 7:
      return "اختر شكل فواصل تنسيق الشرائح المفضل لديك:";
    case 8:
      return "هل ترغب في معرض أعمال يعرض حتى خمس صور؟";
    case 9:
      return "يرجى رفع الشعار الرسمي (اللوغو) لصفحتك:";
    case 10:
      return "صورة لخلفية الشريحة التعريفية الأولى لموقعك:";
    case 11:
      return "هل تفضل الصفحة هادئة وجادة أم بتأثيرات بصرية وحركية؟";
    case 12:
      return "هل هناك ملاحظات خاصة تود التركيز عليها أثناء بناء موقعك؟";
    default:
      return "اكتملت الاستشارة وجاهزة للبناء.";
  }
};

export const WeeAIChat: React.FC<WeeAIChatProps> = ({
  userId,
  userEmail,
  onCompleteChat,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
  onStepChange
}) => {
  // Local collapsed state if not externally controlled
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;
  const toggleCollapse = externalOnToggleCollapse || (() => setInternalCollapsed(prev => !prev));

  // Current Step (1 through 12, then 13 = complete)
  const [step, setStep] = useState<number>(1);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  // Typewriter text state
  const [typedText, setTypedText] = useState<string>('');

  // Form State Values
  const [personalInfo, setPersonalInfo] = useState({
    title: 'سيد',
    fullName: '',
    birthDate: '',
    logoUrl: ''
  });

  const [addressInfo, setAddressInfo] = useState({
    governorate: 'دمشق',
    city: '',
    street: '',
    details: '',
    coordinates: null as { lat: number; lng: number } | null
  });

  const [contactInfo, setContactInfo] = useState({
    email: userEmail || '',
    whatsapp: '',
    phone: '',
    facebook: '',
    tiktok: ''
  });

  const [catalogInfo, setCatalogInfo] = useState({
    category: 'مطاعم وكافيهات',
    specialty: 'طبخ منزلي 🍳',
    customCategory: '',
    customSpecialty: ''
  });

  const [aiAnswers, setAiAnswers] = useState({
    description: '',
    colorPalette: 'الأزرق الكلاسيكي الكوني',
    customColor: '#0071e3',
    dividerStyle: 'straight',
    wantsGallery: true,
    galleryImages: [] as string[],
    heroBgImage: '',
    motionEffects: 'صفحة هادئة وجادة',
    specialInstructions: ''
  });

  const resetToBlankDefaults = () => {
    setPersonalInfo({
      title: 'سيد',
      fullName: '',
      birthDate: '',
      logoUrl: ''
    });
    setAddressInfo({
      governorate: 'دمشق',
      city: '',
      street: '',
      details: '',
      coordinates: null
    });
    setContactInfo({
      email: userEmail || '',
      whatsapp: '',
      phone: '',
      facebook: '',
      tiktok: ''
    });
    setCatalogInfo({
      category: 'مطاعم وكافيهات',
      specialty: 'طبخ منزلي 🍳',
      customCategory: '',
      customSpecialty: ''
    });
    setAiAnswers({
      description: '',
      colorPalette: 'الأزرق الكلاسيكي الكوني',
      customColor: '#0071e3',
      dividerStyle: 'straight',
      wantsGallery: true,
      galleryImages: [],
      heroBgImage: '',
      motionEffects: 'صفحة هادئة وجادة',
      specialInstructions: ''
    });
    setStep(1);
  };

  // Load existing progress: Firebase first (source of truth across devices), LocalStorage as offline fallback
  useEffect(() => {
    const applyData = (data: any) => {
      if (data.personalInfo) setPersonalInfo(data.personalInfo);
      if (data.addressInfo) setAddressInfo(data.addressInfo);
      if (data.contactInfo) setContactInfo(data.contactInfo);
      if (data.catalogInfo) setCatalogInfo(data.catalogInfo);
      if (data.aiAnswers) setAiAnswers(data.aiAnswers);
      if (data.currentStep && data.currentStep <= 13) setStep(data.currentStep);
    };

    const loadProgress = async () => {
      if (!userId) return;

      try {
        const snap = await getDoc(doc(db, 'platform_directory', userId));
        if (snap.exists()) {
          applyData(snap.data());
          return;
        }
      } catch (err) {
        console.warn("Error loading chat progress from Firebase, falling back to local cache:", err);
      }

      // Fallback: local cache (offline, or before first cloud sync)
      try {
        const stored = localStorage.getItem('weelink_chat_progress_' + userId);
        if (stored) {
          applyData(JSON.parse(stored));
          return;
        }
        resetToBlankDefaults();
      } catch (err) {
        console.error("Error loading chat progress:", err);
        resetToBlankDefaults();
      }
    };
    loadProgress();
  }, [userId, userEmail]);

  // Typewriter effect on step / question change
  useEffect(() => {
    const question = getConciseQuestionText(step, personalInfo.fullName);
    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < question.length) {
        setTypedText(question.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 18); // Smooth and readable typing speed
    return () => clearInterval(interval);
  }, [step, personalInfo.fullName]);

  // Silently trigger canvas loading loop simulation on step changes
  useEffect(() => {
    if (step > 1) {
      onStepChange?.(step);
    }
  }, [step]);

  // Save progress at each transition: instantly to LocalStorage, and live up to Firebase
  const saveProgress = (nextStep: number) => {
    if (!userId) return;
    const dataToSave = {
      personalInfo,
      addressInfo,
      contactInfo,
      catalogInfo,
      aiAnswers,
      currentStep: nextStep,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('weelink_chat_progress_' + userId, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Silent local save failed:", e);
    }
    // Live upload to Firebase so progress/step follows the user across devices and sessions
    setDoc(doc(db, 'platform_directory', userId), {
      ...dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch((err) => {
      console.warn("Silent cloud save failed (kept locally, will retry next step):", err);
    });
  };

  const goToNextStep = () => {
    let nextStep = step + 1;
    // Skip step 9 (logo prompt) if user already uploaded logo in step 1
    if (step === 8 && personalInfo.logoUrl) {
      nextStep = 10;
    }
    setStep(nextStep);
    saveProgress(nextStep);
  };

  const goToPrevStep = () => {
    let prevStep = Math.max(1, step - 1);
    if (step === 10 && personalInfo.logoUrl) {
      prevStep = 8;
    }
    setStep(prevStep);
  };

  // Helper: Read image file directly from user device as data URL
  const handleDeviceImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLoaded(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper: Gallery files (multiple or single)
  const handleGalleryFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const arrayFiles = Array.from(files);

    arrayFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAiAnswers(prev => {
            if (prev.galleryImages.length >= 5) return prev;
            return {
              ...prev,
              galleryImages: [...prev.galleryImages, reader.result as string]
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // GPS Coordinates Locator
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("ميزة تحديد الموقع الجغرافي غير مدعومة في متصفحك.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAddressInfo(prev => ({
          ...prev,
          coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }));
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        alert("يرجى السماح بصلاحية الموقع في المتصفح لتحديد إحداثياتك.");
      },
      { timeout: 7000 }
    );
  };

  // IF COLLAPSED: We return null to avoid covering any bottom sections in the control panel
  if (isCollapsed) {
    return null;
  }

  // IF EXPANDED: Positioned exactly below top drag handle/headers (64px offset) so handle remains free!
  return (
    <div 
      className="absolute top-[64px] left-0 right-0 bottom-0 z-30 bg-white flex flex-col overflow-hidden text-right select-none font-sans"
      dir="rtl"
    >
      {/* Dynamic Typewriter Active Question Header */}
      <div className="flex items-start justify-between gap-2.5 p-3 bg-[#fbfbfd] border-b border-neutral-150 shrink-0">
        <div className="flex items-start gap-2.5">
          {/* Slowly Pulsing Glow Icon Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0071e3] to-cyan-500 shadow-[0_0_12px_rgba(0,113,227,0.35)] flex items-center justify-center text-white text-xs shrink-0 animate-pulse">
            🤖
          </div>
          <div className="space-y-0.5 text-right">
            <div className="text-[9px] font-black text-neutral-400 select-none tracking-wider">مساعدك الشخصي (wee ai)</div>
            <h4 className="font-bold text-neutral-800 text-[11px] leading-relaxed min-h-[2.5em] transition-all">
              {typedText}
            </h4>
          </div>
        </div>

        {/* Minimize Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-7 h-7 rounded-lg hover:bg-neutral-200 border border-neutral-200/50 text-neutral-500 hover:text-black flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5"
          title="تصغير المحاورة لأسفل لوحة التحكم"
        >
          <ChevronDown size={15} strokeWidth={2.4} />
        </button>
      </div>

      {/* Main Form Fields Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-neutral-800">
        
        {/* STEP 1: معلومات شخصية */}
        {step === 1 && (
          <div className="space-y-3.5">
            {/* اللقب */}
            <div className="flex gap-1.5">
              {['سيد', 'سيدة', 'شركة'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPersonalInfo(p => ({ ...p, title: opt }))}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    personalInfo.title === opt
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* الاسم الكامل */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 block">الاسم الكامل *</label>
              <input
                type="text"
                value={personalInfo.fullName}
                onChange={e => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))}
                placeholder="أدخل الاسم أو اسم الشركة"
                className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
              />
            </div>

            {/* تاريخ الميلاد */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 block">تاريخ الميلاد (يمكن تخطيه)</label>
              <input
                type="date"
                value={personalInfo.birthDate}
                onChange={e => setPersonalInfo(p => ({ ...p, birthDate: e.target.value }))}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
              />
            </div>

            {/* صورة اللوغو (رفع من الجهاز أو رابط) */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-neutral-500 block">صورة اللوغو (غير إجباري)</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-[10.5px] font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                  <Upload size={13} />
                  <span>رفع من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleDeviceImageUpload(e, url => setPersonalInfo(p => ({ ...p, logoUrl: url })))}
                    className="hidden"
                  />
                </label>
                {personalInfo.logoUrl && (
                  <div className="relative w-8 h-8 rounded border border-neutral-300 overflow-hidden shrink-0">
                    <img src={personalInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPersonalInfo(p => ({ ...p, logoUrl: '' }))}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-[10px]"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              <input
                type="url"
                value={personalInfo.logoUrl}
                onChange={e => setPersonalInfo(p => ({ ...p, logoUrl: e.target.value }))}
                placeholder="أو ضع رابط الشعار المباشر هنا"
                className="w-full text-[10.5px] py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none font-mono text-left"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!personalInfo.fullName.trim()) {
                  alert('الرجاء إدخال الاسم الكامل لمتابعة البناء.');
                  return;
                }
                goToNextStep();
              }}
              className="w-full py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>متابعة</span>
            </button>
          </div>
        )}

        {/* STEP 2: العنوان */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 block">المحافظة (إجباري) *</label>
              <select
                value={addressInfo.governorate}
                onChange={e => setAddressInfo(p => ({ ...p, governorate: e.target.value }))}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white"
              >
                {SYRIAN_GOVERNORATES.map(gov => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 block">المدينة</label>
              <input
                type="text"
                value={addressInfo.city}
                onChange={e => setAddressInfo(p => ({ ...p, city: e.target.value }))}
                placeholder="المدينة / المنطقة"
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 block">الشارع والرقم</label>
              <input
                type="text"
                value={addressInfo.street}
                onChange={e => setAddressInfo(p => ({ ...p, street: e.target.value }))}
                placeholder="اسم الشارع ورقم البناء"
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 block">تفصيل العنوان</label>
              <textarea
                value={addressInfo.details}
                onChange={e => setAddressInfo(p => ({ ...p, details: e.target.value }))}
                placeholder="معلومات إضافية للوصول..."
                rows={2}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg"
              />
            </div>

            {/* زر موقعي من جوجل ماب */}
            <div className="pt-1 border-t border-neutral-100 flex items-center justify-between">
              <button
                type="button"
                disabled={gpsLoading}
                onClick={handleGetLocation}
                className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-[10.5px] font-bold text-neutral-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MapPin size={12} className="text-[#0071e3]" />
                <span>{gpsLoading ? 'جاري التحديد...' : 'موقعي (Google Maps)'}</span>
              </button>
              {addressInfo.coordinates && (
                <span className="text-[9.5px] text-green-600 font-bold flex items-center gap-1">
                  <Check size={11} /> تم أخذ الإحداثيات
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!addressInfo.governorate) {
                    alert('يرجى اختيار المحافظة.');
                    return;
                  }
                  goToNextStep();
                }}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: معلومات الاتصال */}
        {step === 3 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 block">الإيميل الافتراضي</label>
              <input
                type="email"
                readOnly
                value={contactInfo.email}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-500 font-mono text-left cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 block">رقم واتساب (إجباري) *</label>
              <input
                type="tel"
                value={contactInfo.whatsapp}
                onChange={e => setContactInfo(p => ({ ...p, whatsapp: e.target.value }))}
                placeholder="+963 900 000 000"
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 block">رقم الهاتف (غير إجباري)</label>
              <input
                type="tel"
                value={contactInfo.phone}
                onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                placeholder="011 000 000"
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 block">حساب فيسبوك (غير إجباري)</label>
              <input
                type="url"
                value={contactInfo.facebook}
                onChange={e => setContactInfo(p => ({ ...p, facebook: e.target.value }))}
                placeholder="https://facebook.com/..."
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 block">حساب Tiktok (غير إجباري)</label>
              <input
                type="url"
                value={contactInfo.tiktok}
                onChange={e => setContactInfo(p => ({ ...p, tiktok: e.target.value }))}
                placeholder="https://tiktok.com/@..."
                className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!contactInfo.whatsapp.trim()) {
                    alert('رقم واتساب إجباري لضمان التواصل.');
                    return;
                  }
                  goToNextStep();
                }}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: المهنة والكتالوج */}
        {step === 4 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 block">كتالوج الأعمال الرئيسي</label>
              <select
                value={catalogInfo.category}
                onChange={e => {
                  const cat = e.target.value;
                  const item = BUSINESS_CATALOG.find(c => c.category === cat);
                  setCatalogInfo(p => ({
                    ...p,
                    category: cat,
                    specialty: item ? item.specialties[0] : ''
                  }));
                }}
                className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
              >
                {BUSINESS_CATALOG.map(c => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
            </div>

            {catalogInfo.category === 'غير ذلك' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 block">اكتب كتالوجك</label>
                <input
                  type="text"
                  value={catalogInfo.customCategory}
                  onChange={e => setCatalogInfo(p => ({ ...p, customCategory: e.target.value }))}
                  placeholder="أدخل مجال عملك"
                  className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 block">الاختصاص</label>
                <select
                  value={catalogInfo.specialty}
                  onChange={e => setCatalogInfo(p => ({ ...p, specialty: e.target.value }))}
                  className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none"
                >
                  {(BUSINESS_CATALOG.find(c => c.category === catalogInfo.category)?.specialties || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {catalogInfo.specialty === 'غير ذلك' && catalogInfo.category !== 'غير ذلك' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 block">اكتب اختصاصك</label>
                <input
                  type="text"
                  value={catalogInfo.customSpecialty}
                  onChange={e => setCatalogInfo(p => ({ ...p, customSpecialty: e.target.value }))}
                  placeholder="أدخل اختصاصك بدقة"
                  className="w-full text-xs font-semibold py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg"
                />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: وصف الصفحة والخدمات (طبيعة الصفحة) */}
        {step === 5 && (
          <div className="space-y-3.5">
            <textarea
              value={aiAnswers.description}
              onChange={e => setAiAnswers(p => ({ ...p, description: e.target.value }))}
              placeholder="اكتب وصفاً باختصار لخدماتك ونشاطك هنا..."
              rows={4}
              className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white focus:border-black focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!aiAnswers.description.trim()) {
                    alert('يرجى كتابة وصف بسيط للصفحة.');
                    return;
                  }
                  goToNextStep();
                }}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: اللون المفضل */}
        {step === 6 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'الأزرق الكلاسيكي الكوني', colors: ['#0071e3', '#f5f5f7'] },
                { name: 'الأسود الفخم والرمادي', colors: ['#1d1d1f', '#86868b'] },
                { name: 'الأخضر العشبي الزمردي', colors: ['#34c759', '#e8f5e9'] },
                { name: 'الذهبي الفاخر الداكن', colors: ['#b89047', '#1a1a1a'] },
                { name: 'الوردي الرقيق اللطيف', colors: ['#ff2d55', '#fff0f3'] }
              ].map(pal => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => setAiAnswers(p => ({ ...p, colorPalette: pal.name }))}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                    aiAnswers.colorPalette === pal.name ? 'border-black bg-neutral-50 shadow-xs' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-neutral-800">{pal.name}</span>
                  <div className="flex gap-1">
                    {pal.colors.map((c, i) => (
                      <span key={i} className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* تخصيص لون من المتصفح */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-neutral-600">أو حدد لوناً مخصصاً:</span>
              <input
                type="color"
                value={aiAnswers.customColor}
                onChange={e => setAiAnswers(p => ({ ...p, customColor: e.target.value, colorPalette: `مخصص: ${e.target.value}` }))}
                className="w-7 h-7 rounded border border-neutral-300 cursor-pointer"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: تنسيق الشرائح */}
        {step === 7 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'مستقيمة', val: 'straight' },
                { name: 'متماوجة', val: 'wave' },
                { name: 'جيبية', val: 'sine' },
                { name: 'منحنية', val: 'curved' }
              ].map(div => (
                <button
                  key={div.val}
                  type="button"
                  onClick={() => setAiAnswers(p => ({ ...p, dividerStyle: div.val }))}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                    aiAnswers.dividerStyle === div.val ? 'border-black bg-neutral-50 shadow-xs' : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {div.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: معرض الصور */}
        {step === 8 && (
          <div className="space-y-3.5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAiAnswers(p => ({ ...p, wantsGallery: true }))}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  aiAnswers.wantsGallery ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                نعم
              </button>
              <button
                type="button"
                onClick={() => setAiAnswers(p => ({ ...p, wantsGallery: false, galleryImages: [] }))}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                  !aiAnswers.wantsGallery ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                لا
              </button>
            </div>

            {aiAnswers.wantsGallery && (
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="w-full py-2 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-[10.5px] font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                  <Upload size={13} />
                  <span>رفع حتى 5 صور من الجهاز</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryFilesUpload}
                    className="hidden"
                  />
                </label>

                {aiAnswers.galleryImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {aiAnswers.galleryImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded border border-neutral-300 overflow-hidden bg-neutral-100">
                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAiAnswers(p => ({ ...p, galleryImages: p.galleryImages.filter((_, idx) => idx !== i) }))}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-[9px]"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 9: صورة اللوغو (إن لم يرفع واحدة في الخطوة 1) */}
        {step === 9 && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              <label className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                <Upload size={14} />
                <span>رفع صورة الشعار من الجهاز</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleDeviceImageUpload(e, url => setPersonalInfo(p => ({ ...p, logoUrl: url })))}
                  className="hidden"
                />
              </label>

              {personalInfo.logoUrl && (
                <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <img src={personalInfo.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover" />
                  <span className="text-[10px] text-green-600 font-bold">✓ تم تحديد اللوغو</span>
                </div>
              )}

              <input
                type="url"
                value={personalInfo.logoUrl}
                onChange={e => setPersonalInfo(p => ({ ...p, logoUrl: e.target.value }))}
                placeholder="أو ضع رابط صورة اللوغو"
                className="w-full text-xs py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 10: صورة لخلفية الشريحة الأولى */}
        {step === 10 && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              <label className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-center cursor-pointer text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 transition-all">
                <Upload size={14} />
                <span>رفع صورة الخلفية من الجهاز</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleDeviceImageUpload(e, url => setAiAnswers(p => ({ ...p, heroBgImage: url })))}
                  className="hidden"
                />
              </label>

              {aiAnswers.heroBgImage && (
                <div className="relative h-20 rounded-lg border border-neutral-300 overflow-hidden bg-neutral-100">
                  <img src={aiAnswers.heroBgImage} alt="Hero BG" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAiAnswers(p => ({ ...p, heroBgImage: '' }))}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded text-[10px]"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <input
                type="url"
                value={aiAnswers.heroBgImage}
                onChange={e => setAiAnswers(p => ({ ...p, heroBgImage: e.target.value }))}
                placeholder="أو ضع رابط صورة الخلفية المباشر"
                className="w-full text-xs py-1.5 px-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-left"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 11: هادئة وتدل على الجدية أم تأثيرات حركية وبصرية */}
        {step === 11 && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              {[
                { title: 'صفحة هادئة تدل على الجدية', val: 'صفحة هادئة وجادة' },
                { title: 'إضافة بعض التأثيرات الحركية والبصرية', val: 'تأثيرات حركية وبصرية' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setAiAnswers(p => ({ ...p, motionEffects: opt.val }))}
                  className={`w-full p-2.5 rounded-xl border text-right text-xs font-bold transition-all cursor-pointer ${
                    aiAnswers.motionEffects === opt.val ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-800'
                  }`}
                >
                  {opt.title}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* STEP 12: ما يجب الانتباه له */}
        {step === 12 && (
          <div className="space-y-3.5">
            <textarea
              value={aiAnswers.specialInstructions}
              onChange={e => setAiAnswers(p => ({ ...p, specialInstructions: e.target.value }))}
              placeholder="اكتب أي ملاحظات أو متطلبات خاصة هنا (يمكن تركه فارغاً)..."
              rows={4}
              className="w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={goToPrevStep}
                className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold transition-all"
              >
                السابق
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(13);
                  saveProgress(13);
                  if (onCompleteChat) {
                    onCompleteChat({
                      personalInfo,
                      addressInfo,
                      contactInfo,
                      catalogInfo,
                      aiAnswers
                    });
                  }
                }}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <span>إنهاء وتجهيز الإجابات</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 13: اكتملت الإجابات */}
        {step >= 13 && (
          <div className="space-y-3 text-center py-4">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto text-base">
              ✓
            </div>
            <h4 className="font-bold text-neutral-900 text-xs">اكتملت جميع الإجابات بنجاح</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold">
              تم جمع وحفظ كامل معلوماتك ومواصفات موقعك السحابي.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[10px] text-[#0071e3] hover:underline font-bold"
            >
              مراجعة الإجابات من البداية
            </button>
          </div>
        )}

      </div>

      {/* STATIC BOTTOM BUTTON: «أنشئ الصفحة المجانية» (معطل مبدئياً) */}
      <div className="p-3 border-t border-neutral-200 bg-[#fbfbfd] shrink-0">
        <button
          type="button"
          disabled={true}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-neutral-400 bg-neutral-100 border border-neutral-200 cursor-not-allowed flex items-center justify-center gap-1.5 shadow-none"
          title="هذا الزر معطل مبدئياً للمناقشة لاحقاً"
        >
          <Sparkles size={13} />
          <span>أنشئ الصفحة المجانية</span>
        </button>
      </div>

    </div>
  );
};
