import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Search, 
  Trash2, 
  Check, 
  Loader2, 
  Key,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  MANDATORY_BG_COLORS, 
  FIFTY_SOLID_COLORS, 
  PASTEL_SOFT_GRADIENTS,
  RICH_MULTI_GRADIENTS,
  CURATED_UNSPLASH_PHOTOS,
  UnsplashPreset 
} from '../data/backgroundPresets';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

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

const uploadDataUrlToStorage = async (dataurl: string, baseName: string): Promise<string> => {
  const blob = dataURLtoBlob(dataurl);
  const timestamp = Date.now();
  const fileRef = ref(storage, `backgrounds/${timestamp}_${baseName}`);
  const snapshot = await uploadBytes(fileRef, blob);
  return await getDownloadURL(snapshot.ref);
};

interface BackgroundDrawerSectionProps {
  targetType: 'slide' | 'element' | 'navbar';
  targetName: string;
  currentBgColor?: string;
  currentBgImage?: string;
  currentBgSize?: 'cover' | 'contain' | 'auto';
  currentBgAttachment?: 'scroll' | 'fixed';
  onApplyColor: (color: string) => void;
  onApplyGradient: (gradientCss: string) => void;
  onApplyImage: (imageUrl: string, size?: 'cover' | 'contain' | 'auto') => void;
  onRemoveImage: () => void;
  onApplyAttachment?: (attachment: 'scroll' | 'fixed') => void;
}

export const BackgroundDrawerSection: React.FC<BackgroundDrawerSectionProps> = ({
  targetType,
  targetName,
  currentBgColor = '#ffffff',
  currentBgImage,
  currentBgSize = 'cover',
  currentBgAttachment = 'scroll',
  onApplyColor,
  onApplyGradient,
  onApplyImage,
  onRemoveImage,
  onApplyAttachment,
}) => {
  // Tabs: 'color' (لون) | 'image' (الصورة) | 'gallery' (المعرض)
  // Matching user's drawing:
  // [ لون ] [ الصورة ] [ المعرض ]
  const [activeTab, setActiveTab] = useState<'color' | 'image' | 'gallery'>('color');

  // Custom Color State
  const [customHex, setCustomHex] = useState(
    currentBgColor?.startsWith('#') ? currentBgColor : '#ffffff'
  );

  // Gradient Category Filter State (like Canva)
  const [gradientCategory, setGradientCategory] = useState<string>('الكل');

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Unsplash Gallery State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [unsplashPhotos, setUnsplashPhotos] = useState<UnsplashPreset[]>(CURATED_UNSPLASH_PHOTOS);
  const [isLoadingUnsplash, setIsLoadingUnsplash] = useState(false);
  const [unsplashError, setUnsplashError] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('unsplash_user_key') || (process.env.UNSPLASH_ACCESS_KEY || '');
  });
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  const categories = ['الكل', 'طبيعة', 'معمار', 'أعمال', 'تجريدي', 'تكنولوجيا', 'خلفيات', 'فخامة', 'مدن'];

  // Handle local file upload
  const handleFileProcess = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 15 ميجابايت');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        try {
          const downloadUrl = await uploadDataUrlToStorage(result, file.name);
          onApplyImage(downloadUrl, 'cover');
        } catch (uploadErr) {
          console.error("Firebase Storage background upload failed", uploadErr);
          setUploadError('حدث خطأ أثناء رفع الصورة إلى السحابة، يرجى المحاولة لاحقاً');
        }
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError('حدث خطأ أثناء قراءة ملف الصورة');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // English translation mapping for Unsplash search query
  const queryTranslations: Record<string, string> = {
    'طبيعة': 'nature landscape',
    'معمار': 'architecture minimal',
    'أعمال': 'business modern office',
    'تجريدي': 'abstract texture',
    'تكنولوجيا': 'technology modern',
    'خلفيات': 'wallpaper background texture',
    'فخامة': 'luxury elegant aesthetic',
    'مدن': 'city skyline architecture',
    'سماء': 'sky clouds sunset',
    'بحر': 'ocean sea beach',
    'صحراء': 'desert sand dunes',
    'قهوة': 'coffee aesthetic',
    'سيارات': 'cars automotive',
  };

  // Perform search on Unsplash API
  const handleSearchUnsplash = async (termToSearch?: string) => {
    const rawTerm = termToSearch !== undefined ? termToSearch : searchQuery;
    const term = rawTerm.trim();

    // Map arabic queries or categories
    let englishQuery = term;
    if (queryTranslations[term]) {
      englishQuery = queryTranslations[term];
    } else if (selectedCategory !== 'الكل' && queryTranslations[selectedCategory]) {
      englishQuery = `${term} ${queryTranslations[selectedCategory]}`.trim();
    }

    if (!englishQuery && selectedCategory === 'الكل') {
      setUnsplashPhotos(CURATED_UNSPLASH_PHOTOS);
      return;
    }

    const accessKey = userApiKey.trim() || (process.env.UNSPLASH_ACCESS_KEY || '').trim();

    if (!accessKey) {
      // Filter locally from curated photos
      const filtered = CURATED_UNSPLASH_PHOTOS.filter(photo => {
        const matchesCategory = selectedCategory === 'الكل' || photo.category === selectedCategory;
        const matchesTerm = !term || photo.title.includes(term) || photo.category.includes(term);
        return matchesCategory && matchesTerm;
      });
      setUnsplashPhotos(filtered.length > 0 ? filtered : CURATED_UNSPLASH_PHOTOS);
      return;
    }

    try {
      setIsLoadingUnsplash(true);
      setUnsplashError(null);
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(englishQuery || 'background wallpaper')}&per_page=20&orientation=landscape&client_id=${accessKey}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`خطأ في جلب الصور: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const formatted: UnsplashPreset[] = data.results.map((item: any) => ({
          id: item.id,
          title: item.description || item.alt_description || 'صورة من Unsplash',
          category: selectedCategory !== 'الكل' ? selectedCategory : 'Unsplash',
          thumbUrl: item.urls.small || item.urls.regular,
          fullUrl: item.urls.regular || item.urls.full,
          photographer: item.user?.name || 'Unsplash',
        }));
        setUnsplashPhotos(formatted);
      } else {
        // Fallback to local
        setUnsplashPhotos(CURATED_UNSPLASH_PHOTOS);
      }
    } catch (err: any) {
      console.warn('Unsplash fetch fallback:', err);
      setUnsplashError('تعذر الاتصال بـ Unsplash حالياً، تم عرض الصور المختارة الجاهزة.');
      // Filter curated as fallback
      const filtered = CURATED_UNSPLASH_PHOTOS.filter(photo => {
        const matchesCategory = selectedCategory === 'الكل' || photo.category === selectedCategory;
        return matchesCategory;
      });
      setUnsplashPhotos(filtered.length > 0 ? filtered : CURATED_UNSPLASH_PHOTOS);
    } finally {
      setIsLoadingUnsplash(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'الكل') {
      if (searchQuery.trim()) {
        handleSearchUnsplash(searchQuery);
      } else {
        setUnsplashPhotos(CURATED_UNSPLASH_PHOTOS);
      }
    } else {
      const term = queryTranslations[cat] || cat;
      handleSearchUnsplash(term);
    }
  };

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('unsplash_user_key', key.trim());
  };

  const isGradient = currentBgColor?.includes('gradient');

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Target Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
        <span className="text-xs font-bold text-neutral-800">
          تعديل خلفية: <span className="text-[#0071e3] font-semibold">{targetName}</span>
        </span>
        <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-md font-medium">
          {targetType === 'slide' ? 'شريحة' : targetType === 'navbar' ? 'نافبار' : 'عنصر'}
        </span>
      </div>

      {/* Main 3 Segmented Tabs (As in user's architectural sketch):
          Right to Left: [ لون ] [ الصورة ] [ المعرض ]
      */}
      <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-200/80 gap-1 select-none shadow-2xs">
        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'color'
              ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          لون
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'image'
              ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          الصورة
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'gallery'
              ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          مكتبة الصور
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: لون (Color Mode as in user's drawing) */}
      {/* ============================================================== */}
      {activeTab === 'color' && (
        <div className="space-y-4">
          
          {/* Row 1: الألوان الإلزامية للخلفية (5 Circles) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                ألوان صفحتك:
              </span>
              <span className="text-[10px] text-neutral-400">
                (أساسيات التصميم)
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200/70">
              {MANDATORY_BG_COLORS.map((item) => {
                const isSelected = !isGradient && !currentBgImage && currentBgColor === item.value;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      onApplyColor(item.value);
                      if (item.value.startsWith('#')) setCustomHex(item.value);
                    }}
                    className={`group relative flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105`}
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
                        backgroundPosition: item.value === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
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

          {/* Row 2: منحدر لوني - 50 لون */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                ألوان أساسية:
              </span>
              <span className="text-[10px] text-neutral-400">
                (تدرج متناسق)
              </span>
            </div>

            <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70">
              <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                {FIFTY_SOLID_COLORS.map((hex, idx) => {
                  const isSelected = !isGradient && !currentBgImage && currentBgColor?.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={`fifty-${idx}-${hex}`}
                      onClick={() => {
                        onApplyColor(hex);
                        setCustomHex(hex);
                      }}
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

          {/* Row 3: ألوان تدريجية متعددة ومتنوعة تخلط بين عدة ألوان (كما في صورة كانفا Alle Farbverläufe) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-800">
                  تدرجات متعددة الألوان:
                </span>
                <span className="text-[10px] bg-[#0071e3]/10 text-[#0071e3] px-1.5 py-0.5 rounded-full font-bold">
                  {RICH_MULTI_GRADIENTS.length + PASTEL_SOFT_GRADIENTS.length} تدرج
                </span>
              </div>
              <span className="text-[10px] text-neutral-400">
                (خلط ألوان ثلاثية ورباعية)
              </span>
            </div>

            {/* 1. الصف العلوي: تدرجات باستيل ناعمة متعددة النغمات (مثل الصف العلوي في كانفا) */}
            <div className="p-2 bg-gradient-to-r from-neutral-50 via-white to-neutral-50 rounded-2xl border border-neutral-200/80 space-y-1 shadow-3xs">
              <div className="text-[10px] font-semibold text-neutral-500 mb-1">
                تدرجات باستيل ناعمة متعددة النغمات:
              </div>
              <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                {PASTEL_SOFT_GRADIENTS.map((grad) => {
                  const isSelected = currentBgColor === grad.value;
                  return (
                    <button
                      key={grad.id}
                      onClick={() => onApplyGradient(grad.value)}
                      className={`w-7 h-7 rounded-full border border-black/10 shadow-3xs flex items-center justify-center transition-all hover:scale-125 cursor-pointer ${
                        isSelected ? 'ring-2 ring-[#0071e3] ring-offset-2 scale-110 z-10' : ''
                      }`}
                      style={{ background: grad.value }}
                      title={`${grad.name} (باستيل ناعم)`}
                    >
                      {isSelected && (
                        <Check size={12} className="text-neutral-800 drop-shadow-xs" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. تصنيفات سريعة للتدرجات (فلتر) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none pt-0.5">
              {[
                { id: 'الكل', label: 'الكل' },
                { id: 'شفق وغروب', label: 'شفق وغروب' },
                { id: 'نيون وأورورا', label: 'نيون وكوزميك' },
                { id: 'طبيعة وبحر', label: 'طبيعة وبحر' },
                { id: 'ميتاليك وفخامة', label: 'ميتاليك وفخامة' },
                { id: 'ليلي داكن', label: 'ليلي داكن' },
                { id: 'باستيل ناعم', label: 'باستيل' },
              ].map((filterTab) => (
                <button
                  key={filterTab.id}
                  onClick={() => setGradientCategory(filterTab.id)}
                  className={`text-[9.5px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                    gradientCategory === filterTab.id
                      ? 'bg-[#0071e3] text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-black'
                  }`}
                >
                  {filterTab.label}
                </button>
              ))}
            </div>

            {/* 3. شبكة التدرجات الشاملة في 7 أعمدة (مطابقة لشبكة كانفا في الصورة Alle Farbverläufe) */}
            <div className="p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-56 overflow-y-auto pr-1">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 justify-items-center">
                {RICH_MULTI_GRADIENTS
                  .filter(g => {
                    if (gradientCategory === 'الكل') return true;
                    if (gradientCategory === 'شفق وغروب') return g.category === 'sunset';
                    if (gradientCategory === 'نيون وأورورا') return g.category === 'neon';
                    if (gradientCategory === 'طبيعة وبحر') return g.category === 'ocean';
                    if (gradientCategory === 'ميتاليك وفخامة') return g.category === 'metallic';
                    if (gradientCategory === 'ليلي داكن') return g.category === 'dark';
                    if (gradientCategory === 'باستيل ناعم') return g.category === 'pastel';
                    return true;
                  })
                  .map((grad) => {
                    const isSelected = currentBgColor === grad.value;
                    return (
                      <button
                        key={grad.id}
                        onClick={() => onApplyGradient(grad.value)}
                        className={`group relative w-7 h-7 rounded-full border border-black/10 shadow-2xs flex items-center justify-center transition-all hover:scale-125 cursor-pointer ${
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

          {/* Custom Hex / Color Picker input */}
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200">
              <input
                type="color"
                value={customHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  onApplyColor(e.target.value);
                }}
                className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    onApplyColor(e.target.value);
                  }
                }}
                placeholder="#ffffff"
                className="flex-1 text-xs px-2 py-1 bg-white rounded-md border border-neutral-200 font-mono text-left"
                dir="ltr"
              />
            </div>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: الصورة (Upload from Device as in Sketch Example 2) */}
      {/* ============================================================== */}
      {activeTab === 'image' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">
              إتاحة رفع صورة من الجهاز:
            </span>
            <span className="text-[10px] text-neutral-400">
              (PNG, JPG, WebP)
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileProcess(e.target.files[0]);
              }
            }}
            accept="image/*"
            className="hidden"
          />

           {/* Upload Dropzone (matching user sketch box with upload arrow in circle) */}
          <div
            onDragOver={(e) => {
              if (isUploading) return;
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              if (isUploading) return;
              handleDrop(e);
            }}
            onClick={() => {
              if (isUploading) return;
              fileInputRef.current?.click();
            }}
            className={`w-full py-8 px-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${
              isDragging
                ? 'border-[#0071e3] bg-[#0071e3]/10 scale-[0.99]'
                : 'border-neutral-300 hover:border-[#0071e3] hover:bg-neutral-50/80 bg-neutral-50/40'
            } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-2">
                <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin mb-2" />
                <p className="text-xs font-bold text-[#1d1d1f]">جاري رفع وخزن الخلفية سحابياً...</p>
                <p className="text-[10.5px] text-neutral-400 mt-1">يرجى الانتظار قليلاً</p>
              </div>
            ) : (
              <>
                {/* Upload Arrow Icon in a circle (Exactly as sketched) */}
                <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={22} strokeWidth={2.4} />
                </div>

                <p className="text-xs font-bold text-[#1d1d1f] mb-1">
                  اضغط لرفع صورة أو اسحبها إلى هنا
                </p>
                <p className="text-[10.5px] text-neutral-400 max-w-xs">
                  سيتم تطبيق الصورة مباشرة كخلفية لـ ({targetName})
                </p>
              </>
            )}
          </div>

          {uploadError && (
            <div className="text-[11px] text-rose-500 bg-rose-50 p-2 rounded-lg border border-rose-200 text-right">
              {uploadError}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: المعرض (Unsplash Gallery as in Sketch Example 3) */}
      {/* ============================================================== */}
      {activeTab === 'gallery' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">
              تصفح معرض Unsplash:
            </span>
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[10.5px] text-[#0071e3] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              title="إعدادات مفتاح Unsplash API"
            >
              <Key size={11} />
              <span>مفتاح الربط</span>
              <ChevronDown size={11} className={`transition-transform ${showKeyConfig ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible API Key settings */}
          {showKeyConfig && (
            <div className="p-2.5 bg-neutral-100 rounded-xl border border-neutral-200 space-y-1.5 text-xs">
              <div className="flex items-center gap-1 text-neutral-600 text-[10.5px]">
                <Info size={12} className="text-[#0071e3] shrink-0" />
                <span>مفتاح الربط (Unsplash Access Key):</span>
              </div>
              <input
                type="password"
                value={userApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="أدخل مفتاح Unsplash الخاص بك..."
                className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-neutral-300 font-mono text-left"
                dir="ltr"
              />
              <p className="text-[9.5px] text-neutral-400">
                تم ربط المفتاح من Secrets تلقائياً. يمكنك تعديله هنا في أي وقت لحسابك.
              </p>
            </div>
          )}

          {/* Search Input Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchUnsplash();
                }
              }}
              placeholder="ابحث في صور Unsplash (طبيعة، معمار، تجريدي)..."
              className="w-full pr-8 pl-9 py-2 text-xs bg-neutral-100/90 hover:bg-neutral-100 focus:bg-white rounded-xl border border-transparent focus:border-[#0071e3] focus:outline-none transition-all shadow-2xs"
            />
            <Search size={14} className="absolute right-2.5 top-2.5 text-neutral-400 pointer-events-none" />
            <button
              onClick={() => handleSearchUnsplash()}
              className="absolute left-1.5 top-1.5 w-6 h-6 rounded-lg bg-[#0071e3] hover:bg-[#0071e3]/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-3xs"
              title="بحث"
            >
              {isLoadingUnsplash ? <Loader2 size={12} className="animate-spin" /> : <Search size={11} />}
            </button>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {unsplashError && (
            <div className="text-[10.5px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-relaxed">
              {unsplashError}
            </div>
          )}

          {/* Photo Grid */}
          <div className="space-y-1">
            <div className="text-[10.5px] text-neutral-500 font-medium">
              اضغط على أي صورة لتطبيقها فوراً كخلفية:
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {unsplashPhotos.map((photo) => {
                const isSelected = currentBgImage === photo.fullUrl;
                return (
                  <button
                    key={photo.id}
                    onClick={() => onApplyImage(photo.fullUrl, 'cover')}
                    className={`group relative rounded-xl overflow-hidden border aspect-video transition-all cursor-pointer text-right shadow-2xs ${
                      isSelected
                        ? 'border-[#0071e3] ring-2 ring-[#0071e3] ring-offset-1'
                        : 'border-neutral-200 hover:border-neutral-300 hover:shadow-xs'
                    }`}
                  >
                    <img
                      src={photo.thumbUrl}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                    {/* Checkmark if selected */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shadow-md">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    {/* Title & Photographer */}
                    <div className="absolute bottom-1 right-1 left-1 pointer-events-none">
                      <p className="text-[9px] font-bold text-white truncate drop-shadow-sm">
                        {photo.title}
                      </p>
                      <p className="text-[7.5px] text-neutral-300 truncate">
                        بواسطة {photo.photographer}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Active Image Card & Controls - Unified below the tab content for Image and Gallery tabs */}
      {activeTab !== 'color' && currentBgImage && (
        <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">
              خيارات الخلفية النشطة:
            </span>
            <button
              type="button"
              onClick={onRemoveImage}
              className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer font-semibold"
            >
              <Trash2 size={12} />
              <span>إزالة الصورة</span>
            </button>
          </div>

          {/* Preview Thumbnail */}
          <div className="relative w-full h-28 rounded-xl overflow-hidden border border-black/10 shadow-2xs">
            <img
              src={currentBgImage}
              alt="خلفية الشريحة"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Image Sizing Modes */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-600 block">
              طريقة عرض الصورة:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cover', label: 'تغطية' },
                { id: 'contain', label: 'احتواء' },
                { id: 'auto', label: 'تكرار' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onApplyImage(currentBgImage, mode.id as any)}
                  className={`py-1.5 px-2 rounded-lg border text-[10.5px] font-semibold transition-all cursor-pointer ${
                    currentBgSize === mode.id
                      ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                      : 'border-neutral-200 hover:bg-white text-neutral-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Attachment Mode (تثبيت الصورة في الخلفية) */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-200/50">
            <span className="text-[11px] font-semibold text-neutral-600 block">
              تثبيت الصورة في الخلفية:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'scroll', label: 'متحركة مع التمرير' },
                { id: 'fixed', label: 'ثابتة في الخلفية' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onApplyAttachment && onApplyAttachment(mode.id as any)}
                  className={`py-1.5 px-2 rounded-lg border text-[10.5px] font-semibold transition-all cursor-pointer ${
                    (currentBgAttachment || 'scroll') === mode.id
                      ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                      : 'border-neutral-200 hover:bg-white text-neutral-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
