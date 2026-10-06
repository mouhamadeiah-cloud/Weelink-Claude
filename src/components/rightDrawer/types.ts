import type React from 'react';
import { Slide, ElementType, CanvasElement, NavbarConfig, Page, SlideDividerShape } from '../../types';
import type { InspectorGroupId } from './inspectorGroups';

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
  | 'project-settings'
  | 'gallery'
  // The docked panel's one page of everything about the selection (cards per group of settings).
  | 'inspector';

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
  isShopProject?: boolean;
  isCarProject?: boolean;
  isRestaurantProject?: boolean; // restaurant project: the restaurant slide category is offered // Online Shop project: the online-shop slide category is offered
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
  // Docked beside the workspace on a wide screen (its width in px): it then stays open while the
  // canvas is used, and cannot be dragged or minimised. 0 or absent: the floating drawer.
  dockedWidth?: number;
  // Shown at the head of the docked panel (the selected element's name).
  headerSlot?: React.ReactNode;
  // Counts the times an icon asked for a section, so asking again for the one already chosen still
  // brings its tab to the front.
  sectionRequest?: number;
  // Asks the add panel to open on one kind of element, or on adding a slide or a page (counted).
  addRequest?: { mode: 'element' | 'slide' | 'page'; category: string | null; n: number };
  onActiveTabChange?: (tab: 'structure' | 'tool') => void;
  // Project settings (the gear beside the project name in the top bar).
  projectSettings?: React.ReactNode;
  // The docked panel's inspector: the group the column asked to show (counted, so asking again for
  // the same one scrolls to it again), and the group at the top of the panel as it scrolls.
  inspectorFocus?: { group: InspectorGroupId | null; n: number };
  onInspectorGroupChange?: (group: InspectorGroupId | null) => void;
  onCopyFormat?: () => void;
  onToggleGroupContainer?: () => void;
  // Asks the panel to show its structure or its tools (counted like sectionRequest).
  tabRequest?: { tab: 'structure' | 'tool'; n: number };
  projectName?: string;
}
