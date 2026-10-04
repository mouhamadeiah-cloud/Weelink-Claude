import { Slide, ElementType, CanvasElement, NavbarConfig, Page, SlideDividerShape } from '../../types';

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

export interface RightDrawerProps {
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
  isShopProject?: boolean; // Online Shop project: the online-shop slide category is offered
  onAddPageTemplate?: (template: any) => void;
  onApplyFreeStarterTemplate?: () => void;
  onApplyOnlineShopTemplate?: () => void;
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
