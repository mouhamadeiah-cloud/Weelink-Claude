import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  Image as ImageIcon,
  ExternalLink,
  ArrowUpCircle,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import { 
  GALLERY_CATEGORIES, 
  UNSPLASH_GALLERY_PHOTOS, 
  GalleryImageItem,
  GRAPHIC_CATEGORIES, 
  GRAPHICS_ITEMS 
} from '../data/graphicsPresets';
import { CanvasElement } from '../types';
import { 
  fetchUnsplashPhotos, 
  trackUnsplashDownload 
} from '../services/unsplashService';
import { compressImageToTargetSize } from '../utils/imageCompressor';
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
  const fileRef = ref(storage, `images/${timestamp}_${baseName}`);
  const snapshot = await uploadBytes(fileRef, blob);
  return await getDownloadURL(snapshot.ref);
};

export type ImageDoorType = 'device' | 'gallery' | 'graphics';

interface ImageDrawerSectionProps {
  onAddImage: (imageUrl: string, title?: string, width?: number, height?: number, isGraphic?: boolean) => void;
  onBack?: () => void;
  canvasElements?: CanvasElement[];
  selectedElement?: CanvasElement | null;
  onUpdateElement?: (data: Partial<CanvasElement>) => void;
}

// Key for saving recent device uploads in browser localStorage
const STORAGE_RECENT_KEY = 'weelink_recent_device_images';

// Initial starter recent images so the section looks great immediately
const DEFAULT_STARTER_RECENTS = [
  {
    id: 'rec-1',
    title: 'تصميم منتج تقني حديث',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    date: 'اليوم',
  },
  {
    id: 'rec-2',
    title: 'لقطة معمارية دبي',
    url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80',
    date: 'أمس',
  },
  {
    id: 'rec-3',
    title: 'فنجان قهوة وكتاب',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
    date: 'أمس',
  },
];

export const ImageDrawerSection: React.FC<ImageDrawerSectionProps> = ({
  onAddImage,
  onBack,
  canvasElements = [],
  selectedElement,
  onUpdateElement,
}) => {
  // Unified helper to either swap existing image or add a new one
  const handleImageApply = (url: string, title?: string, width?: number, height?: number, isGraphic?: boolean) => {
    if (selectedElement && selectedElement.type === 'image' && onUpdateElement) {
      onUpdateElement({
        imageUrl: url,
        name: title || (isGraphic ? 'عنصر جرافيك' : 'صورة مستبدلة'),
      });
    } else {
      onAddImage(url, title, width, height, isGraphic);
    }
  };

  // 3 DOORS (الأبواب الثلاثة كما في الرسومات اليدوية):
  // 1. من الجهاز (device)
  // 2. من المعرض (gallery)
  // 3. جرافيك (graphics)
  const [activeDoor, setActiveDoor] = useState<ImageDoorType>('device');

  // ----------------------------------------------------
  // DOOR 1: من الجهاز (Device Upload & Recent Images)
  // ----------------------------------------------------
  const [recentImages, setRecentImages] = useState<Array<{ id: string; title: string; url: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_RECENT_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Error loading recent images', e);
      }
    }
    return DEFAULT_STARTER_RECENTS;
  });

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const graphicsScrollRef = useRef<HTMLDivElement>(null);

  const scrollGraphics = (direction: 'left' | 'right') => {
    if (graphicsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      graphicsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Sync and persist recent images
  const saveRecentImages = (newList: Array<{ id: string; title: string; url: string }>) => {
    setRecentImages(newList);
    try {
      localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(newList.slice(0, 18)));
    } catch (e) {
      console.warn('Storage limit reached for local images', e);
    }
  };

  const [compressingPhotoId, setCompressingPhotoId] = useState<string | null>(null);
  const [compressedNotice, setCompressedNotice] = useState<{ text: string; sizeKb: number } | null>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;
      if (rawDataUrl) {
        try {
          // Automatic compression of uploaded image to <= 150 KB
          const compressed = await compressImageToTargetSize(rawDataUrl, 150 * 1024);
          
          // Upload to Firebase Storage instead of keeping base64!
          const firebaseStorageUrl = await uploadDataUrlToStorage(compressed.url, file.name);

          handleImageApply(
            firebaseStorageUrl,
            file.name.replace(/\.[^/.]+$/, ''),
            compressed.width || 440,
            compressed.height || 280
          );

          const newEntry = {
            id: `dev-${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            url: firebaseStorageUrl,
          };
          const updated = [newEntry, ...recentImages.filter((img) => img.url !== firebaseStorageUrl)];
          saveRecentImages(updated);

          setCompressedNotice({
            text: `تم ضغط وحفظ الصورة بنجاح (${compressed.sizeKb} KB ≤ 150 KB)`,
            sizeKb: compressed.sizeKb,
          });
          setTimeout(() => setCompressedNotice(null), 3500);
        } catch (err) {
          console.error("Failed to compress or upload to storage, falling back to local compressed data URL", err);
          try {
            // Check if we can still use the compressed URL locally
            const compressed = await compressImageToTargetSize(rawDataUrl, 150 * 1024);
            handleImageApply(
              compressed.url,
              file.name.replace(/\.[^/.]+$/, ''),
              compressed.width || 440,
              compressed.height || 280
            );

            const newEntry = {
              id: `dev-${Date.now()}`,
              title: file.name.replace(/\.[^/.]+$/, ''),
              url: compressed.url,
            };
            const updated = [newEntry, ...recentImages.filter((img) => img.url !== compressed.url)];
            saveRecentImages(updated);

            setCompressedNotice({
              text: `تم ضغط وحفظ الصورة محلياً (${compressed.sizeKb} KB ≤ 150 KB)`,
              sizeKb: compressed.sizeKb,
            });
            setTimeout(() => setCompressedNotice(null), 3500);
          } catch (compressErr) {
            console.error("Compression also failed, using raw data URL", compressErr);
            handleImageApply(rawDataUrl, file.name.replace(/\.[^/.]+$/, ''), 440, 280);
            const newEntry = {
              id: `dev-${Date.now()}`,
              title: file.name.replace(/\.[^/.]+$/, ''),
              url: rawDataUrl,
            };
            saveRecentImages([newEntry, ...recentImages.filter((img) => img.url !== rawDataUrl)]);
          }
        }
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Combine uploaded images + images currently used in canvas elements
  const canvasImages = canvasElements
    .filter((el) => el.type === 'image' && el.imageUrl)
    .map((el) => ({
      id: el.id,
      title: el.name || 'صورة مستخدمة في التصميم',
      url: el.imageUrl as string,
    }));

  // Unique list of all recent images (device + used on canvas)
  const combinedRecentImages = [
    ...recentImages,
    ...canvasImages.filter((cImg) => !recentImages.some((r) => r.url === cImg.url)),
  ];

  // ----------------------------------------------------
  // DOOR 2: من المعرض (Gallery / Live Unsplash Search & Tags)
  // ----------------------------------------------------
  const [galleryCategory, setGalleryCategory] = useState<string>('all');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryImageItem[]>(UNSPLASH_GALLERY_PHOTOS);
  const [galleryPage, setGalleryPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(50);
  const [totalCount, setTotalCount] = useState<number>(10000);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(true);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (dir: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: dir === 'left' ? -120 : 120,
        behavior: 'smooth',
      });
    }
  };

  // Fetch photos from Unsplash API (debounced on search or category change)
  useEffect(() => {
    if (activeDoor !== 'gallery') return;

    let isMounted = true;
    setIsLoadingGallery(true);

    const timer = setTimeout(async () => {
      try {
        const result = await fetchUnsplashPhotos({
          query: gallerySearch,
          category: galleryCategory,
          page: 1,
          perPage: 15,
        });

        if (isMounted) {
          setGalleryPhotos(result.items);
          setGalleryPage(1);
          setTotalPages(result.totalPages);
          setTotalCount(result.total);
          setIsLive(result.isLive);
        }
      } catch (err) {
        console.error('Error fetching gallery photos', err);
      } finally {
        if (isMounted) {
          setIsLoadingGallery(false);
        }
      }
    }, gallerySearch ? 400 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeDoor, galleryCategory, gallerySearch]);

  // Load More Handler (جلب المزيد من ملايين الصور عبر Unsplash)
  const handleLoadMoreGallery = async () => {
    if (isLoadingMore || galleryPage >= totalPages) return;

    setIsLoadingMore(true);
    const nextPage = galleryPage + 1;

    try {
      const result = await fetchUnsplashPhotos({
        query: gallerySearch,
        category: galleryCategory,
        page: nextPage,
        perPage: 15,
      });

      if (result.items.length > 0) {
        setGalleryPhotos((prev) => {
          // Avoid duplicate photos by ID
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = result.items.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
        setGalleryPage(nextPage);
        setTotalPages(result.totalPages);
        setTotalCount(result.total);
        setIsLive(result.isLive);
      }
    } catch (e) {
      console.error('Error loading more Unsplash photos:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle adding gallery photo to canvas with automatic compression to <= 150 KB
  const handleAddGalleryPhoto = async (photo: GalleryImageItem) => {
    if (compressingPhotoId) return; // Prevent duplicate clicks
    setCompressingPhotoId(photo.id);

    try {
      // Compress the Unsplash photo to maximum 150 KB (153,600 bytes)
      const compressed = await compressImageToTargetSize(photo.fullUrl, 150 * 1024);

      // Add compressed image to canvas
      handleImageApply(
        compressed.url,
        photo.title,
        compressed.width || 500,
        compressed.height || 320
      );

      // Add to recent images list for convenient re-use
      const newEntry = {
        id: `unsplash-${Date.now()}`,
        title: photo.title,
        url: compressed.url,
      };
      saveRecentImages([newEntry, ...recentImages.filter((img) => img.url !== compressed.url)]);

      // Display compression feedback
      setCompressedNotice({
        text: `تم ضغط الصورة إلى ${compressed.sizeKb} KB (أقل من 150KB) وإضافتها بنجاح!`,
        sizeKb: compressed.sizeKb,
      });
      setTimeout(() => setCompressedNotice(null), 3500);

      // Trigger Unsplash API download tracking
      if (photo.downloadLocation) {
        trackUnsplashDownload(photo.downloadLocation);
      }
    } catch (e) {
      console.error('Error compressing gallery photo:', e);
      // Direct fallback
      handleImageApply(photo.fullUrl, photo.title, photo.width || 500, photo.height || 320);
    } finally {
      setCompressingPhotoId(null);
    }
  };

  // ----------------------------------------------------
  // DOOR 3: جرافيك (Graphics: Stickers, Vector Icons, Claymation)
  // ----------------------------------------------------
  const [graphicsCategory, setGraphicsCategory] = useState<string>('all');
  const [graphicsSearch, setGraphicsSearch] = useState<string>('');
  const [visibleGraphicsCount, setVisibleGraphicsCount] = useState<number>(12);

  const filteredGraphics = GRAPHICS_ITEMS.filter((item) => {
    if (graphicsCategory !== 'all' && item.subCategory !== graphicsCategory) {
      return false;
    }
    if (graphicsSearch.trim()) {
      const q = graphicsSearch.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchTag;
    }
    return true;
  });

  const displayedGraphics = filteredGraphics.slice(0, visibleGraphicsCount);

  return (
    <div className="space-y-3.5 pb-8 text-right select-none" dir="rtl">
      {/* Top Header with Back to elements */}
      {onBack && (
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-[#0071e3] hover:text-[#005bb5] bg-[#0071e3]/10 hover:bg-[#0071e3]/15 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight size={15} strokeWidth={2.4} />
            <span>رجوع للعناصر</span>
          </button>

          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
            <ImageIcon size={16} className="text-[#0071e3]" />
            <span>{selectedElement?.type === 'image' ? 'تبديل وتغيير الصورة' : 'اضافة صورة'}</span>
          </h3>
        </div>
      )}

      {/* Current image preview if editing an existing image */}
      {selectedElement && selectedElement.type === 'image' && selectedElement.imageUrl && (
        <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-700">الصورة الحالية في التصميم:</span>
            <span className="text-[10px] text-[#0071e3] bg-[#0071e3]/8 px-2 py-0.5 rounded-md font-semibold">
              وضع التبديل النشط 🔄
            </span>
          </div>
          <div className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-neutral-100">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-neutral-50 flex items-center justify-center">
              <img 
                src={selectedElement.imageUrl} 
                alt={selectedElement.name || 'الصورة الحالية'} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs font-bold text-neutral-800 truncate">
                {selectedElement.name || 'عنصر صورة'}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                {selectedElement.width} × {selectedElement.height} بكسل
              </p>
              <p className="text-[10px] text-neutral-500 font-medium mt-1 leading-normal">
                اختر أي صورة أو جرافيك أدناه لتبديل هذه الصورة فوراً مع الاحتفاظ بكافة التأثيرات والحجم والإطارات.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 
        ====================================================
        THE 3 DOORS (الأبواب الثلاثة كما في المخطط اليدوي):
        [ من الجهاز ] [ من المعرض ] [ جرافيك ]
        ====================================================
      */}
      <div className="bg-neutral-100 p-1 rounded-2xl border border-neutral-200 flex items-center gap-1 shadow-2xs">
        {/* Door 1: من الجهاز */}
        <button
          type="button"
          onClick={() => setActiveDoor('device')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeDoor === 'device'
              ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <Upload size={13} strokeWidth={2.3} />
          <span>من الجهاز</span>
        </button>

        {/* Door 2: من المعرض */}
        <button
          type="button"
          onClick={() => setActiveDoor('gallery')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeDoor === 'gallery'
              ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <ImageIcon size={13} strokeWidth={2.3} />
          <span>من المعرض</span>
        </button>

        {/* Door 3: جرافيك */}
        <button
          type="button"
          onClick={() => setActiveDoor('graphics')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeDoor === 'graphics'
              ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-black/[0.04]'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
          }`}
        >
          <Sparkles size={13} strokeWidth={2.3} />
          <span>جرافيك</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* DOOR 1 CONTENT: من الجهاز (صورة رقم ١ في طلب المستخدم) */}
      {/* ==================================================== */}
      {activeDoor === 'device' && (
        <div className="space-y-4">
          {/* Main Upload Box (صندوق الرفع مع سهم لأعلى داخل دائرة) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer group ${
              isDraggingOver
                ? 'border-[#0071e3] bg-[#0071e3]/10 scale-[1.01]'
                : 'border-neutral-300 hover:border-[#0071e3] bg-neutral-50/80 hover:bg-neutral-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            {/* Circular Arrow Up Icon exactly matching the user's sketch */}
            <div className="w-14 h-14 rounded-full bg-white border-2 border-neutral-300 group-hover:border-[#0071e3] group-hover:bg-[#0071e3]/10 flex items-center justify-center text-neutral-600 group-hover:text-[#0071e3] transition-all shadow-sm mb-2.5">
              {isUploading ? (
                <RefreshCw size={24} className="animate-spin text-[#0071e3]" />
              ) : (
                <ArrowUpCircle size={30} strokeWidth={2.2} />
              )}
            </div>

            <span className="text-xs font-bold text-neutral-800 group-hover:text-[#0071e3] transition-colors">
              {isUploading ? 'جاري قراءة ورفع الصورة...' : 'انقر لرفع صورة من الجهاز'}
            </span>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              أو اسحب وأفلت ملف الصورة هنا (PNG, JPG, SVG, WebP)
            </p>
          </div>

          {/* Section: آخر الصور (Recent Images Grid as in Sketch 1) */}
          <div className="space-y-2 pt-1 border-t border-neutral-200">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <span>آخر الصور</span>
                <span className="text-[10px] font-mono text-neutral-400 font-normal">
                  ({combinedRecentImages.length})
                </span>
              </span>
              <span className="text-[10px] text-neutral-400">
                انقر على أي صورة لإضافتها فوراً
              </span>
            </div>

            {/* 3 Columns Grid for Recent Images (كما في الرسم اليدوي للصورة الأولى) */}
            <div className="grid grid-cols-3 gap-2">
              {combinedRecentImages.map((img, idx) => (
                <div
                  key={`${img.id}-${idx}`}
                  onClick={() => handleImageApply(img.url, img.title, 420, 260)}
                  className="aspect-square bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 hover:border-[#0071e3] shadow-2xs hover:shadow-md transition-all cursor-pointer group relative"
                  title={`${img.title} (انقر للإضافة)`}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Subtle hover overlay with add button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                    <span className="w-7 h-7 rounded-full bg-white/95 text-[#0071e3] flex items-center justify-center font-bold text-xs shadow-md scale-75 group-hover:scale-100 transition-transform">
                      <Plus size={14} strokeWidth={3} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {combinedRecentImages.length === 0 && (
              <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                لا توجد صور مرفوعة بعد. ارفع أول صورة لك من الصندوق أعلاه!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DOOR 2 CONTENT: من المعرض (صورة رقم ٢ في طلب المستخدم) */}
      {/* ==================================================== */}
      {activeDoor === 'gallery' && (
        <div className="space-y-3">
          {/* Scrollable Category Chips (كما في الصورة ٢: خلفيات، رخام، طعام، بورتريه...) */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="p-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-all shrink-0 z-10"
              title="تمرير يمين"
            >
              <ChevronRight size={13} strokeWidth={2.5} />
            </button>

            <div
              ref={categoryScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth w-full"
            >
              {GALLERY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setGalleryCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    galleryCategory === cat.id
                      ? 'bg-[#0071e3] text-white shadow-2xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="p-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-all shrink-0 z-10"
              title="تمرير يسار"
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Search Input (شريط البحث الحي الموضح في المخطط اليدوي) */}
          <div className="relative">
            <input
              type="text"
              value={gallerySearch}
              onChange={(e) => setGallerySearch(e.target.value)}
              placeholder="بحث في ملايين صور Unsplash (رخام، قهوة، طبيعة، تقنية...)"
              className="w-full pl-8 pr-9 py-2 bg-neutral-100 focus:bg-white border border-neutral-300 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] rounded-xl text-xs text-right placeholder:text-neutral-400 focus:outline-none transition-all shadow-3xs"
              dir="rtl"
            />
            <Search
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            {gallerySearch && (
              <button
                type="button"
                onClick={() => setGallerySearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs p-1"
                title="مسح البحث"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status info bar: Live Unsplash Indicator, Loaded Count & Compression Badge */}
          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-500">
            <div className="flex items-center gap-1.5 font-medium text-neutral-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
              <span>{isLive ? 'بحث Unsplash المباشر نشط' : 'معرض الصور'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold">
                ⚡ ضغط آلي ≤ 150KB
              </span>
              {totalCount > 0 && !isLoadingGallery && (
                <span className="text-[10px] text-neutral-400 font-mono">
                  {galleryPhotos.length} {totalCount > 1000 ? '+ من آلاف' : `من ${totalCount}`}
                </span>
              )}
            </div>
          </div>

          {/* Compressed Notice Toast */}
          {compressedNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600" />
                <span>{compressedNotice.text}</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-md font-mono">
                {compressedNotice.sizeKb} KB
              </span>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoadingGallery && (
            <div className="grid grid-cols-3 gap-2 pt-1 animate-pulse">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="aspect-square bg-neutral-200/70 rounded-xl flex items-center justify-center"
                >
                  <RefreshCw size={16} className="animate-spin text-neutral-400" />
                </div>
              ))}
            </div>
          )}

          {/* 3x3 (or dynamic) Photo Grid (شبكة صور Unsplash الحية) */}
          {!isLoadingGallery && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              {galleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => handleAddGalleryPhoto(photo)}
                  draggable={!compressingPhotoId}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({
                        type: 'unsplash-photo',
                        photo: {
                          id: photo.id,
                          title: photo.title,
                          thumbUrl: photo.thumbUrl,
                          fullUrl: photo.fullUrl,
                          photographer: photo.photographer,
                        },
                      })
                    );
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="aspect-square bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 hover:border-[#0071e3] shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative select-none"
                  title={`${photo.title} (اسحب إلى الشريحة أو انقر للإضافة)`}
                >
                  <img
                    src={photo.thumbUrl}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Active compression overlay */}
                  {compressingPhotoId === photo.id && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-1 text-white gap-1.5 z-20 backdrop-blur-[1px]">
                      <RefreshCw size={18} className="animate-spin text-white" />
                      <span className="text-[9px] font-bold">جاري الضغط ≤150KB...</span>
                    </div>
                  )}

                  {/* Photo hover overlay */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-between p-1.5 text-center text-white">
                    <span className="text-[8px] bg-black/60 px-1 py-0.2 rounded-md font-mono self-end truncate max-w-[85%]">
                      {photo.category}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-white text-[#0071e3] flex items-center justify-center font-bold text-xs shadow-sm scale-90 group-hover:scale-100 transition-transform">
                      <Plus size={13} strokeWidth={3} />
                    </span>
                    <span className="text-[9px] truncate w-full font-medium leading-tight opacity-90">
                      {photo.photographer || photo.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingGallery && galleryPhotos.length === 0 && (
            <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 space-y-2">
              <p>لا توجد نتائج مطابقة لبحثك في Unsplash.</p>
              {gallerySearch && (
                <button
                  type="button"
                  onClick={() => setGallerySearch('')}
                  className="text-xs text-[#0071e3] font-bold hover:underline"
                >
                  مسح كلمة البحث
                </button>
              )}
            </div>
          )}

          {/* Load More Button (زر عرض المزيد اللانهائي كما في المخطط اليدوي بالصورة الثانية) */}
          {!isLoadingGallery && galleryPhotos.length > 0 && galleryPage < totalPages && (
            <button
              type="button"
              disabled={isLoadingMore}
              onClick={handleLoadMoreGallery}
              className="w-full py-2.5 rounded-xl border border-neutral-300 hover:border-[#0071e3] bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-800 hover:text-[#0071e3] transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-[#0071e3]" />
                  <span>جاري تحميل المزيد من صور Unsplash...</span>
                </>
              ) : (
                <>
                  <span>عرض المزيد ({galleryPhotos.length} محملة)</span>
                  <span className="text-sm">↓</span>
                </>
              )}
            </button>
          )}

          <div className="text-[10px] text-neutral-400 text-center flex items-center justify-center gap-1">
            <span>ملايين الصور عالية الدقة مدعومة بربط حي مع</span>
            <a
              href="https://unsplash.com?utm_source=weelink&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-neutral-600 hover:text-[#0071e3] inline-flex items-center gap-0.5"
            >
              <span>Unsplash</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DOOR 3 CONTENT: جرافيك (Stickers, Vector, Claymation) */}
      {/* ==================================================== */}
      {activeDoor === 'graphics' && (
        <div className="space-y-3">
          {/* Subcategory Pills Scroller with Arrows */}
          <div className="relative flex items-center border-2 border-neutral-200 bg-white rounded-full p-0.5 shadow-2xs">
            {/* Right Scroll Button (Scrolls to start in RTL/LTR) */}
            <button
              type="button"
              onClick={() => scrollGraphics('left')}
              className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-3xs"
              title="تمرير لليمين"
              aria-label="تمرير لليمين"
            >
              <ChevronRight size={13} strokeWidth={2.4} />
            </button>

            {/* Scrollable Pills Track */}
            <div
              ref={graphicsScrollRef}
              className="flex items-center gap-1 overflow-x-auto scroll-smooth flex-1 px-1 py-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {GRAPHIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setGraphicsCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    graphicsCategory === cat.id
                      ? 'bg-[#0071e3] text-white shadow-2xs'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Left Scroll Button (Scrolls to end in RTL/LTR) */}
            <button
              type="button"
              onClick={() => scrollGraphics('right')}
              className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-3xs"
              title="تمرير لليسار"
              aria-label="تمرير لليسار"
            >
              <ChevronLeft size={13} strokeWidth={2.4} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={graphicsSearch}
              onChange={(e) => setGraphicsSearch(e.target.value)}
              placeholder="بحث في الملصقات والفيكتور والكلايميشن..."
              className="w-full pl-8 pr-9 py-2 bg-neutral-100 focus:bg-white border border-neutral-300 focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] rounded-xl text-xs text-right placeholder:text-neutral-400 focus:outline-none transition-all shadow-3xs"
              dir="rtl"
            />
            <Search
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            {graphicsSearch && (
              <button
                type="button"
                onClick={() => setGraphicsSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 3 Columns Grid for Graphics with soft transparent checkerboard/pastel bg */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {displayedGraphics.map((item) => (
              <div
                key={item.id}
                onClick={() => handleImageApply(item.url, item.title, item.width || 200, item.height || 200, true)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      type: 'graphic-item',
                      item: {
                        id: item.id,
                        title: item.title,
                        url: item.url,
                        previewUrl: item.previewUrl,
                        width: item.width,
                        height: item.height,
                      },
                    })
                  );
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="aspect-square bg-gradient-to-tr from-neutral-50 to-neutral-100/90 rounded-2xl overflow-hidden border border-neutral-200 hover:border-[#0071e3] shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative p-2 flex flex-col items-center justify-center text-center select-none"
                title={`${item.title} (اسحب إلى الشريحة أو انقر للإضافة)`}
              >
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-sm"
                />

                {/* Badge tag */}
                <div className="absolute top-1 right-1 opacity-80 group-hover:opacity-100">
                  <span className="text-[7.5px] px-1 py-0.2 rounded-md font-bold bg-white/90 border border-black/10 text-neutral-700 shadow-3xs">
                    {item.subCategory === 'stickers'
                      ? 'ستيكر'
                      : item.subCategory === 'claymation'
                      ? 'صلصال'
                      : 'فيكتور'}
                  </span>
                </div>

                {/* Hover Add Overlay */}
                <div className="absolute inset-0 bg-[#0071e3]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-white text-[#0071e3] flex items-center justify-center font-bold text-xs shadow-md scale-90 group-hover:scale-100 transition-transform">
                    <Plus size={14} strokeWidth={3} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {displayedGraphics.length === 0 && (
            <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              لا توجد عناصر جرافيك مطابقة لبحثك.
            </div>
          )}

          {/* Load More Button for Graphics */}
          {visibleGraphicsCount < filteredGraphics.length && (
            <button
              type="button"
              onClick={() => setVisibleGraphicsCount((prev) => prev + 12)}
              className="w-full py-2.5 rounded-xl border border-neutral-300 hover:border-[#0071e3] bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-800 hover:text-[#0071e3] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-[0.99]"
            >
              <span>عرض المزيد من الجرافيك</span>
              <span className="text-sm">↓</span>
            </button>
          )}

          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[10px] text-neutral-500 leading-snug">
            💡 <b>ملاحظة:</b> مكتبة الجرافيك توفر ملصقات 3D، وأيقونات فيكتور، ونماذج كلايميشن صلصالية جاهزة للإدراج مباشرة في تصميمك بنقرة واحدة.
          </div>
        </div>
      )}
    </div>
  );
};
