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
import { fetchUnsplashPhotos } from '../services/unsplashService';
import { 
  MANDATORY_BG_COLORS, 
  FIFTY_SOLID_COLORS, 
  PASTEL_SOFT_GRADIENTS, 
  RICH_MULTI_GRADIENTS 
} from '../data/backgroundPresets';
import { WeeAIChat } from './WeeAIChat';
import { ShopElementSettings } from './ShopElementSettings';

import { DrawerSection, RightDrawerProps } from './rightDrawer/types';
import { SIXTY_FONTS, READY_SLIDE_CATEGORIES, getSlideTemplatePayload } from '../data/slideTemplates';
import { uploadGalleryImageToStorage } from '../utils/galleryUpload';
import { buildAddMenuData } from './rightDrawer/addMenuTemplates';
import { AnimationSection } from './rightDrawer/sections/AnimationSection';
import { LayersSection } from './rightDrawer/sections/LayersSection';
import { LinkSection } from './rightDrawer/sections/LinkSection';

export type { DrawerSection } from './rightDrawer/types';
export { SIXTY_FONTS, READY_SLIDE_CATEGORIES, customizeElementsForIndex, getSlideTemplatePayload } from '../data/slideTemplates';

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
  onApplyOnlineShopTemplate,
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

  // Navbar logo upload state
  const [isNavbarLogoUploading, setIsNavbarLogoUploading] = useState(false);
  const navbarLogoFileInputRef = useRef<HTMLInputElement>(null);

  const handleNavbarLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setIsNavbarLogoUploading(true);
    try {
      const downloadUrl = await uploadGalleryImageToStorage(file);
      onUpdateNavbar({ logoUrl: downloadUrl });
    } catch (err) {
      console.error('Navbar logo upload failed', err);
    } finally {
      setIsNavbarLogoUploading(false);
    }
  };

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
      {/* Floating Edge Arrow Toggle Button.
          z-index kept above the page's own navbar (which can be set sticky with z-index 100000 by
          the user inside the canvas) so this app control — "لوحة التحكم" — always stays reachable
          and on top of it, never covered by a sticky navbar scrolling underneath it. */}
      <button
        onClick={onToggle}
        className="fixed top-32 right-0 z-[999999] w-7 h-11 bg-white/95 backdrop-blur-md border border-r-0 border-neutral-300 rounded-l-xl shadow-[-3px_2px_12px_rgba(0,0,0,0.1)] flex items-center justify-center text-neutral-600 hover:text-[#0071e3] transition-all hover:w-8 active:scale-95 group focus:outline-none"
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
        className={`fixed top-26 right-0 bottom-0 z-[999999] w-[320px] sm:w-[350px] md:w-[24vw] min-w-[290px] max-w-[430px] bg-white border-l-2 border-t-2 border-b-2 border-neutral-300 shadow-[-16px_0_40px_rgba(0,0,0,0.12)] rounded-l-2xl flex flex-col select-none text-right overflow-visible ${
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
            {activeSection === 'shadow' && isNavbarSelected && navbar && (() => {
              // Reuses the exact element/slide "shadow" structure below (intensity slider, page-palette
              // swatches, 50 basic colors, free color picker, 9-direction grid) instead of a bespoke
              // simplified panel, targeted directly at the navbar (no element/slide switcher needed).
              const activeShadowIntensity = navbar.glowIntensity ?? 0;
              const activeShadowColor = navbar.glowColor || '#1d1d1f';
              const activeShadowPosition = navbar.glowPosition || 'center';

              const updateShadowIntensity = (intensity: number) => onUpdateNavbar({ glowIntensity: intensity });
              const updateShadowColor = (color: string) => onUpdateNavbar({ glowColor: color });
              const updateShadowPosition = (pos: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') =>
                onUpdateNavbar({ glowPosition: pos });

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
                  <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-[#0071e3]">تعديل ظل النافبار</span>
                  </div>

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

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-800 block">لون الظل الخارجي (Shadow Color):</span>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block">ألوان الصفحة الافتراضية:</span>
                      <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-200/65">
                        {customColors.map((hex, idx) => {
                          const isSelected = activeShadowColor.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={`navbar-shadow-palette-color-${idx}-${hex}`}
                              onClick={() => updateShadowColor(hex)}
                              className={`w-7 h-7 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                                isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                              }`}
                              style={{ backgroundColor: hex }}
                              title={`لون الصفحة ${idx + 1}: ${hex}`}
                            >
                              {isSelected && (
                                <Check size={12} className={['#ffffff', '#e5e5ea', '#f5f5f7'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} strokeWidth={3} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-neutral-400 font-semibold block">الخمسون لوناً الأساسية:</span>
                        <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">50 basic colors</span>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-40 overflow-y-auto pr-1">
                        <div className="grid grid-cols-10 gap-1.5">
                          {BASIC_50_COLORS.map((hex, idx) => {
                            const isSelected = activeShadowColor.toLowerCase() === hex.toLowerCase();
                            return (
                              <button
                                key={`navbar-shadow-basic-color-${idx}-${hex}`}
                                onClick={() => updateShadowColor(hex)}
                                className={`w-5 h-5 rounded-md border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-4xs flex items-center justify-center ${
                                  isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                                }`}
                                style={{ backgroundColor: hex }}
                                title={hex}
                              >
                                {isSelected && (
                                  <Check size={10} className={['#ffffff', '#f3f4f6', '#e5e7eb'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} strokeWidth={3} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

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

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-neutral-800 block">توجيه اتجاه وزاوية الظل (Shadow Position):</span>
                    <p className="text-[10px] text-neutral-500 leading-tight">
                      انقر على المربع لتوجيه الظل في الاتجاه المرغوب. تبرز المعاينات شكل الظل الخارجي المطبق على مربع رمادي افتراضي:
                    </p>

                    <div className="bg-neutral-100 p-3 rounded-2xl border border-neutral-200/80 flex justify-center items-center">
                      <div className="grid grid-cols-3 gap-3.5 max-w-[240px] w-full">
                        {DIRECTION_CELLS.map((cell) => {
                          const isSelected = activeShadowPosition === cell.id;
                          const previewIntensity = activeShadowIntensity > 0 ? Math.min(activeShadowIntensity, 16) : 10;
                          const boxPreviewShadow = getGlowShadowStyle(previewIntensity, activeShadowColor, cell.id, false);

                          return (
                            <button
                              key={`navbar-shadow-dir-${cell.id}`}
                              onClick={() => updateShadowPosition(cell.id)}
                              className={`relative aspect-square rounded-xl p-1 transition-all flex flex-col items-center justify-center cursor-pointer border-2 bg-white ${
                                isSelected ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs scale-105 z-10' : 'border-transparent hover:border-neutral-300'
                              }`}
                              title={cell.name}
                            >
                              <div className="w-9 h-9 rounded-lg bg-neutral-300 transition-all flex items-center justify-center border border-neutral-300/40" style={{ boxShadow: boxPreviewShadow }}>
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
            {activeSection === 'lighting' && isNavbarSelected && navbar && (() => {
              // Reuses the exact element/slide "lighting" structure below (intensity slider, page-palette
              // swatches, 50 basic colors, free color picker, 9-direction grid with live preview) instead
              // of a bespoke simplified panel, targeted directly at the navbar.
              const activeLightIntensity = navbar.innerGlowIntensity ?? 0;
              const activeLightColor = navbar.innerGlowColor || '#0071e3';
              const activeLightPosition = navbar.innerGlowPosition || 'center';

              const updateLightIntensity = (intensity: number) => onUpdateNavbar({ innerGlowIntensity: intensity });
              const updateLightColor = (color: string) => onUpdateNavbar({ innerGlowColor: color });
              const updateLightPosition = (pos: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') =>
                onUpdateNavbar({ innerGlowPosition: pos });

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
                  <div className="bg-[#0071e3]/5 border border-[#0071e3]/10 p-2.5 rounded-xl text-center">
                    <span className="text-[11px] font-bold text-[#0071e3]">تعديل إضاءة النافبار</span>
                  </div>

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

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-neutral-800 block">لون الإضاءة والتوهج الداخلي (Light Color):</span>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block">ألوان الصفحة الافتراضية:</span>
                      <div className="flex gap-2 p-1.5 bg-neutral-50 rounded-xl border border-neutral-200/65">
                        {customColors.map((hex, idx) => {
                          const isSelected = activeLightColor.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={`navbar-light-palette-color-${idx}-${hex}`}
                              onClick={() => updateLightColor(hex)}
                              className={`w-7 h-7 rounded-full border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-3xs flex items-center justify-center ${
                                isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                              }`}
                              style={{ backgroundColor: hex }}
                              title={`لون الصفحة ${idx + 1}: ${hex}`}
                            >
                              {isSelected && (
                                <Check size={12} className={['#ffffff', '#e5e5ea', '#f5f5f7'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} strokeWidth={3} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-neutral-400 font-semibold block">الخمسون لوناً الأساسية:</span>
                        <span className="text-[9px] text-neutral-400 font-mono" dir="ltr">50 basic colors</span>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-2xl border border-neutral-200/70 max-h-40 overflow-y-auto pr-1">
                        <div className="grid grid-cols-10 gap-1.5">
                          {BASIC_50_COLORS.map((hex, idx) => {
                            const isSelected = activeLightColor.toLowerCase() === hex.toLowerCase();
                            return (
                              <button
                                key={`navbar-light-basic-color-${idx}-${hex}`}
                                onClick={() => updateLightColor(hex)}
                                className={`w-5 h-5 rounded-md border border-black/10 transition-all hover:scale-125 cursor-pointer shadow-4xs flex items-center justify-center ${
                                  isSelected ? 'ring-2 ring-[#0071e3] scale-110 z-10' : ''
                                }`}
                                style={{ backgroundColor: hex }}
                                title={hex}
                              >
                                {isSelected && (
                                  <Check size={10} className={['#ffffff', '#f3f4f6', '#e5e7eb'].includes(hex.toLowerCase()) ? 'text-black' : 'text-white'} strokeWidth={3} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

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

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-neutral-800 block">توجيه اتجاه وزاوية الإضاءة الداخلية (Light Position):</span>
                    <p className="text-[10px] text-neutral-500 leading-tight">
                      انقر على المربع لتوجيه الإضاءة في الاتجاه المرغوب. تبرز المعاينات شكل الإضاءة الداخلية (inset) المطبقة على مربع رمادي افتراضي:
                    </p>

                    <div className="bg-neutral-100 p-3 rounded-2xl border border-neutral-200/80 flex justify-center items-center">
                      <div className="grid grid-cols-3 gap-3.5 max-w-[240px] w-full">
                        {DIRECTION_CELLS.map((cell) => {
                          const isSelected = activeLightPosition === cell.id;
                          const previewIntensity = activeLightIntensity > 0 ? Math.min(activeLightIntensity, 16) : 10;

                          return (
                            <button
                              key={`navbar-light-dir-${cell.id}`}
                              onClick={() => updateLightPosition(cell.id)}
                              className={`relative aspect-square rounded-xl p-1 transition-all flex flex-col items-center justify-center cursor-pointer border-2 bg-white ${
                                isSelected ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs scale-105 z-10' : 'border-transparent hover:border-neutral-300'
                              }`}
                              title={cell.name}
                            >
                              <div className="w-9 h-9 rounded-lg bg-neutral-300 relative overflow-hidden transition-all flex items-center justify-center border border-neutral-300/40">
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
            {activeSection === 'animation' && <AnimationSection styles={styles} onUpdateElementStyles={onUpdateElementStyles} />}

            {/* TOOL: Add Elements (+) - Step 1: Squares Grid (الصورة رقم ١) | Step 2: Detail with Subcategories Bar (الصورة رقم ٢) */}
            {(activeSection === 'elements' || activeSection === 'add-text') && (() => {
              const { ADD_CATEGORIES, SUBCATEGORIES_MAP, TEMPLATES_MAP } = buildAddMenuData({
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
              });

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
                          <button
                            type="button"
                            onClick={() => onApplyOnlineShopTemplate && onApplyOnlineShopTemplate()}
                            className="w-full bg-gradient-to-br from-[#B4532A]/5 to-[#B4532A]/[0.02] hover:from-[#B4532A]/10 hover:to-[#B4532A]/5 border border-[#B4532A]/20 hover:border-[#B4532A] rounded-2xl p-3.5 flex flex-col text-right transition-all hover:shadow-xs active:scale-99 cursor-pointer group gap-1.5"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-neutral-800 group-hover:text-[#B4532A] transition-colors">
                                متجر إلكتروني: منتجات وسلة مشتريات
                              </span>
                              <span className="text-[10px] text-[#B4532A] font-semibold bg-[#B4532A]/10 border border-[#B4532A]/15 px-1.5 py-0.5 rounded-md">
                                5 صفحات
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                              الرئيسية، المنتجات، السلة، طريقة الطلب، وتواصل معنا — بطاقات منتجات بزر «أضف إلى السلة»، وصفحة سلة ترسل الطلب كاملًا عبر واتساب. سيستبدل هذا كل صفحات موقعك الحالية.
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
            {activeSection === 'link' && <LinkSection pages={pages} slides={slides} selectedElement={selectedElement} onUpdateElement={onUpdateElement} linkSubSection={linkSubSection} setLinkSubSection={setLinkSubSection} contactMethod={contactMethod} setContactMethod={setContactMethod} contactInputValue={contactInputValue} setContactInputValue={setContactInputValue} urlInputValue={urlInputValue} setUrlInputValue={setUrlInputValue} />}

            {/* TOOL: Layers (إدارة الطبقات) */}
            {activeSection === 'layers' && <LayersSection elements={elements} activeSlideId={activeSlideId} selectedElement={selectedElement} onSelectElement={onSelectElement} onDeleteElement={onDeleteElement} onDuplicateElement={onDuplicateElement} onToggleLock={onToggleLock} onMoveLayerUp={onMoveLayerUp} onMoveLayerDown={onMoveLayerDown} onMoveLayerToFront={onMoveLayerToFront} onMoveLayerToBack={onMoveLayerToBack} getElementIcon={getElementIcon} />}

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

            {/* TOOL: Navbar settings (ترس الإعدادات) — التثبيت، الطول، اسم الموقع، وتموضع/تنسيق أسماء الصفحات */}
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
                  <Slider
                    label="طول (ارتفاع) النافبار"
                    value={navbar.height ?? 60}
                    min={44}
                    max={140}
                    onChange={(v) => onUpdateNavbar({ height: v })}
                    formatValue={(v) => `${v}px`}
                  />
                  <Slider
                    label="عرض النافبار"
                    value={navbar.width ?? 100}
                    min={40}
                    max={100}
                    onChange={(v) => onUpdateNavbar({ width: v })}
                    formatValue={(v) => `${v}%`}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                  <SectionHeader title="اسم الموقع" />
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-800 block">
                      اسم الشركة / اسم صاحب الموقع:
                    </label>
                    <input
                      type="text"
                      value={navbar.brandName || ''}
                      onChange={(e) => onUpdateNavbar({ brandName: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-300 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
                      placeholder="مثال: متجر الأمل..."
                      dir="rtl"
                    />
                    <p className="text-[10px] text-neutral-400 leading-tight">
                      هذا الاسم هو ما يظهر في النافبار — اكتب اسم شركتك أو اسمك الشخصي، فهو لا يُملأ تلقائيًا.
                    </p>
                  </div>
                  <PillTabs
                    options={[
                      { value: 'show', label: 'إظهار اسم الموقع' },
                      { value: 'hide', label: 'إخفاء اسم الموقع' },
                    ]}
                    value={navbar.showBrandName === false ? 'hide' : 'show'}
                    onChange={(v) => onUpdateNavbar({ showBrandName: v === 'show' })}
                    className="w-full"
                  />

                  <div className="flex items-center gap-2.5 pt-1">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                      {navbar.logoUrl ? (
                        <img src={navbar.logoUrl} alt="شعار الموقع" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-bold">بدون شعار</span>
                      )}
                    </div>
                    <input
                      ref={navbarLogoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNavbarLogoFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => navbarLogoFileInputRef.current?.click()}
                      disabled={isNavbarLogoUploading}
                      className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/20 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isNavbarLogoUploading ? 'جارٍ رفع الشعار...' : (navbar.logoUrl ? 'تغيير الشعار' : 'رفع شعار من الجهاز')}
                    </button>
                    {navbar.logoUrl && (
                      <button
                        type="button"
                        onClick={() => onUpdateNavbar({ logoUrl: undefined })}
                        className="py-1.5 px-2.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-tight">
                    عند رفع شعار، يظهر بدل الحرف الافتراضي بجانب اسم الموقع.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                  <SectionHeader title="تموضع أسماء صفحات الموقع" />
                  <PillTabs
                    options={[
                      { value: 'right', label: 'اليمين' },
                      { value: 'center', label: 'الوسط' },
                      { value: 'left', label: 'اليسار' },
                    ]}
                    value={navbar.itemsAlign || 'right'}
                    onChange={(v) => onUpdateNavbar({ itemsAlign: v as 'right' | 'center' | 'left' })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-black/[0.06]">
                  <SectionHeader title="إطار أسماء الصفحات" />
                  <p className="text-[11px] text-neutral-500 -mt-1">
                    إطار اختياري حول كل اسم صفحة في النافبار: سمك وتدوير الحواف ولون الإطار، ولون خلفية النص.
                  </p>
                  <Slider
                    label="سمك الإطار"
                    value={navbar.itemsFrameBorderWidth ?? 0}
                    min={0}
                    max={6}
                    onChange={(v) => onUpdateNavbar({ itemsFrameBorderWidth: v })}
                    formatValue={(v) => `${v}px`}
                  />
                  <Slider
                    label="تدوير حواف الإطار"
                    value={navbar.itemsFrameBorderRadius ?? 0}
                    min={0}
                    max={24}
                    onChange={(v) => onUpdateNavbar({ itemsFrameBorderRadius: v })}
                    formatValue={(v) => `${v}px`}
                  />
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-neutral-700 block">لون الإطار</span>
                    <ColorSwatchPicker
                      swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
                      selectedValue={navbar.itemsFrameBorderColor || 'transparent'}
                      onSelect={(color) => onUpdateNavbar({ itemsFrameBorderColor: color })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-neutral-700 block">لون خلفية النص</span>
                    <ColorSwatchPicker
                      swatches={FIFTY_SOLID_COLORS.map((hex) => ({ value: hex }))}
                      selectedValue={navbar.itemsFrameBgColor || 'transparent'}
                      onSelect={(color) => onUpdateNavbar({ itemsFrameBgColor: color })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-neutral-700 block">نوع الخط لأسماء الصفحات</span>
                    <select
                      value={navbar.itemsFontFamily || ''}
                      onChange={(e) => onUpdateNavbar({ itemsFontFamily: e.target.value || undefined })}
                      className="w-full px-2.5 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0071e3] focus:border-[#0071e3]"
                      style={{ fontFamily: navbar.itemsFontFamily || undefined }}
                    >
                      <option value="">الخط الافتراضي</option>
                      {SIXTY_FONTS.map((f) => (
                        <option key={f.font} value={f.font} style={{ fontFamily: f.font }}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-center select-none" dir="rtl">
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
