export type DevicePreviewMode = 'desktop' | 'tablet' | 'mobile';

export type ElementType = 
  | 'heading' 
  | 'paragraph' 
  | 'button' 
  | 'image' 
  | 'card' 
  | 'badge' 
  | 'input' 
  | 'divider' 
  | 'icon' 
  | 'table'
  | 'shape'
  | 'video'
  | 'map'
  | 'pricing'
  | 'calendar'
  | 'html'
  | 'gallery'
  | 'mask'
  | 'cart';

export type GalleryLayout = 'top-main' | 'left-thumbnails' | 'right-thumbnails' | 'left-main-row';

export interface GalleryItem {
  id: string;
  url: string;
  title?: string;
  alt?: string;
}

export interface ElementStyles {
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundAttachment?: 'scroll' | 'fixed';
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number | string;
  borderStyle?: string;
  opacity?: number;
  contentOpacity?: number;
  backgroundOpacity?: number;
  brightness?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'apple';
  glowColor?: string;
  glowIntensity?: number; // 0 to 50 or similar
  glowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  innerGlowColor?: string;
  innerGlowIntensity?: number;
  innerGlowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  textAlign?: 'right' | 'center' | 'left';
  fontSize?: number;
  fontWeight?: 'normal' | '500' | '600' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  fontFamily?: string;
  listStyle?: 'none' | 'bullet' | 'numeric';
  animation?: string;
  animationTrigger?: 'hover' | 'once' | 'loop';
  animationDuration?: number;
  rotation?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  imageFilter?: string;
  imageTintColor?: string;
  imageTintOpacity?: number;
  imageTintBlendMode?: string;
}

export type LinkType = 'page' | 'slide' | 'url' | 'contact';
export type ContactType = 'whatsapp' | 'phone' | 'email' | 'facebook' | 'instagram' | 'x' | 'tiktok';

// Position/size of an element in the phone layout, written by the "تنسيق الموبايل" auto-arrange.
// The desktop layout (x/y/width/height on the element itself) is never touched by it.
export interface MobileLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  // Multiplier applied to styles.fontSize on phones (1 = unchanged).
  fontScale?: number;
}

// A product an "أضف إلى السلة" button puts in the visitor's shopping cart (see utils/cartStore).
export interface CartProduct {
  name: string;
  price: number;
  currency: string;
  image?: string;
}

export interface CanvasElement {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // Rotation in degrees around center (0 - 360)
  // Phone layout; when absent the element shows at its desktop position in mobile view.
  mobile?: MobileLayout;
  content: string;
  slideId: string;
  styles: ElementStyles;
  isLocked?: boolean;
  isGrouped?: boolean;
  isGroupContainer?: boolean;
  groupId?: string;
  groupName?: string;
  linkUrl?: string;
  linkType?: LinkType;
  // When set, clicking this element (in preview / on the live site) adds the product to the cart.
  cartProduct?: CartProduct;
  // 'cart' element only: WhatsApp number the finished order is sent to.
  cartWhatsapp?: string;
  linkTargetId?: string;
  contactType?: ContactType;
  contactValue?: string;
  imageUrl?: string;
  videoUrl?: string;
  mapLocation?: string;
  htmlCode?: string;
  pricingPlan?: string;
  pricingPrice?: string;
  pricingPeriod?: string;
  pricingFeatures?: string[];
  calendarTitle?: string;
  calendarSlots?: string[];
  calendarWorkingDays?: string[]; // e.g. ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  calendarHolidays?: string[]; // e.g. ['friday', 'saturday']
  calendarBreakStart?: string; // e.g. "12:00"
  calendarBreakEnd?: string; // e.g. "13:00"
  calendarWorkStart?: string; // e.g. "09:00"
  calendarWorkEnd?: string; // e.g. "17:00"
  calendarInterval?: '10' | '15' | '30' | '60' | 'day' | 'manual';
  calendarIntervalMinutes?: number;
  calendarNeedsConfirmation?: boolean;
  calendarMeetingType?: 'personal' | 'phone' | 'whatsapp';
  calendarMeetingTypes?: string[]; // e.g. ['personal', 'phone', 'whatsapp']
  calendarAccentColor?: string; // Hex color
  calendarNameLabel?: string;
  calendarAddressLabel?: string;
  calendarPhoneLabel?: string;
  calendarEmailLabel?: string;
  calendarDescLabel?: string;
  compoundType?: 'hero' | 'badge-heading' | 'quote' | 'stat' | 'checklist' | 'accent-border' | 'price-tag' | 'card-box' | 'alert-box' | 'faq-box' | 'welcome-box';
  subContent?: string;
  badgeText?: string;
  hasBadge?: boolean;
  badgeType?: 'warning' | 'danger' | 'success' | 'info' | 'royal' | 'gift' | 'fire' | 'idea' | 'star';
  badgePosition?: 'right' | 'left';
  authorText?: string;
  clipPath?: string;
  tableConfig?: {
    rows: number;
    cols: number;
    themeColor: string;
    headerRow: boolean;
    indexCol: boolean;
    colWidths: number[];
    rowHeights: number[];
    cells: string[][];
    cellStyles?: Record<string, ElementStyles>;
  };
  galleryConfig?: {
    layout: GalleryLayout;
    items: GalleryItem[];
    activeImageIndex?: number;
    showThumbnails?: boolean;
    gap?: number;
    borderRadius?: number;
    objectFit?: 'cover' | 'contain';
  };
}

export type SlideDividerShape = 
  | 'straight' 
  | 'wave' 
  | 'slanted' 
  | 'curve-down' 
  | 'curve-up' 
  | 'triangle' 
  | 'asymmetric-wave' 
  | 'double-wave' 
  | 'zigzag' 
  | 'tilt-right' 
  | 'tilt-left' 
  | 'clouds';

export interface Slide {
  id: string;
  name: string; // e.g. "شريحة ١"
  height: number; // default e.g. 540
  // Slide height in the phone layout, used once its elements have a mobile layout.
  mobileHeight?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: 'scroll' | 'fixed';
  dividerShape?: SlideDividerShape;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: string;
  opacity?: number;
  backgroundOpacity?: number;
  glowColor?: string;
  glowIntensity?: number;
  glowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  innerGlowColor?: string;
  innerGlowIntensity?: number;
  innerGlowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface NavbarItem {
  id: string;
  label: string;
  href: string;
  linkType?: LinkType;
  linkTargetId?: string;
}

export interface NavbarConfig {
  brandName: string;
  brandSubtext?: string;
  items: NavbarItem[];
  ctaText: string;
  ctaHref: string;
  ctaLinkType?: LinkType;
  ctaLinkTargetId?: string;
  bgColor: string;
  textColor: string;
  isSticky: boolean;
  // Navbar strip height/length in px (default 60 when unset)
  height?: number;
  // Navbar strip width, as a percentage of the page width (default 100 when unset = full-bleed).
  // Less than 100 insets it from both edges (centered), for a narrower "floating" navbar look.
  width?: number;
  // Background image (same logic as a slide's background image)
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  // Opacity — applies to the background (color/image) and the text/content, same logic as a slide
  backgroundOpacity?: number;
  textOpacity?: number;
  // Lighting (inner glow) — same field names/logic as a slide's "الإضاءة"
  innerGlowColor?: string;
  innerGlowIntensity?: number;
  innerGlowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  // Outer shadow — same field names/logic as a slide's "الظلال"
  glowColor?: string;
  glowIntensity?: number;
  glowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  // Border / frame — same field names/logic as a slide's border editing
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: string;
  // Site name (brand) visibility + an actual user-uploaded logo image (shown instead of the letter badge)
  showBrandName?: boolean;
  logoUrl?: string;
  // Page-name (nav items) row alignment
  itemsAlign?: 'right' | 'center' | 'left';
  // Page-name (nav items) "frame" styling: font + background + border around each label
  itemsFontFamily?: string;
  itemsFrameBgColor?: string;
  itemsFrameBorderColor?: string;
  itemsFrameBorderWidth?: number;
  itemsFrameBorderRadius?: number;
}

export interface Page {
  id: string;
  name: string; // e.g. "الرئيسية"
  slug: string;
  navbar: NavbarConfig;
  slides: Slide[];
  colorPalette?: [string, string, string, string, string];
  paletteMode?: 'default' | 'custom';
}

export const getGlowShadowStyle = (
  intensity: number | undefined,
  color: string | undefined,
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | string | undefined,
  isInset = false
) => {
  if (!intensity || intensity === 0) return undefined;
  const shadowColor = color || 'rgba(0, 113, 227, 0.6)';
  const pos = position || 'center';
  
  const blur = intensity;
  const spread = Math.max(0, Math.round(intensity / 5));
  const offset = Math.max(2, Math.round(intensity / 2));

  if (isInset) {
    // Inner lighting (inset): positive offsets push the light shadow from that edge inwards
    switch (pos) {
      case 'center':
        return `0px 0px ${blur}px ${spread}px ${shadowColor} inset`;
      case 'top':
        return `0px ${offset}px ${blur}px -1px ${shadowColor} inset`;
      case 'bottom':
        return `0px -${offset}px ${blur}px -1px ${shadowColor} inset`;
      case 'left':
        return `${offset}px 0px ${blur}px -1px ${shadowColor} inset`;
      case 'right':
        return `-${offset}px 0px ${blur}px -1px ${shadowColor} inset`;
      case 'top-right':
        return `-${offset}px ${offset}px ${blur}px -2px ${shadowColor} inset`;
      case 'top-left':
        return `${offset}px ${offset}px ${blur}px -2px ${shadowColor} inset`;
      case 'bottom-right':
        return `-${offset}px -${offset}px ${blur}px -2px ${shadowColor} inset`;
      case 'bottom-left':
        return `${offset}px -${offset}px ${blur}px -2px ${shadowColor} inset`;
      default:
        return `0px 0px ${blur}px ${spread}px ${shadowColor} inset`;
    }
  } else {
    // Outer shadow: normal shadow offset directions
    switch (pos) {
      case 'center':
        return `0px 0px ${blur}px ${spread}px ${shadowColor}`;
      case 'top':
        return `0px -${offset}px ${blur}px 1px ${shadowColor}`;
      case 'bottom':
        return `0px ${offset}px ${blur}px 1px ${shadowColor}`;
      case 'left':
        return `-${offset}px 0px ${blur}px 1px ${shadowColor}`;
      case 'right':
        return `${offset}px 0px ${blur}px 1px ${shadowColor}`;
      case 'top-right':
        return `${offset}px -${offset}px ${blur}px 0px ${shadowColor}`;
      case 'top-left':
        return `-${offset}px -${offset}px ${blur}px 0px ${shadowColor}`;
      case 'bottom-right':
        return `${offset}px ${offset}px ${blur}px 0px ${shadowColor}`;
      case 'bottom-left':
        return `-${offset}px ${offset}px ${blur}px 0px ${shadowColor}`;
      default:
        return `0px 0px ${blur}px ${spread}px ${shadowColor}`;
    }
  }
};

export const getLightGradientStyle = (
  intensity: number | undefined,
  color: string | undefined,
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | string | undefined
): any => {
  if (!intensity || intensity === 0) return undefined;
  
  const lightColor = color || '#0071e3';
  const pos = position || 'center';
  
  // Opacity scales beautifully with intensity (max 50, so intensity/50 * 0.75 opacity for a very vibrant yet translucent glow)
  const opacity = (intensity / 50) * 0.85;
  
  let gradientStr = '';
  switch (pos) {
    case 'center':
      gradientStr = `radial-gradient(ellipse at center, ${lightColor} 0%, transparent 85%)`;
      break;
    case 'top':
      gradientStr = `radial-gradient(ellipse at top center, ${lightColor} 0%, transparent 100%)`;
      break;
    case 'bottom':
      gradientStr = `radial-gradient(ellipse at bottom center, ${lightColor} 0%, transparent 100%)`;
      break;
    case 'left':
      gradientStr = `radial-gradient(ellipse at center left, ${lightColor} 0%, transparent 100%)`;
      break;
    case 'right':
      gradientStr = `radial-gradient(ellipse at center right, ${lightColor} 0%, transparent 100%)`;
      break;
    case 'top-right':
      gradientStr = `radial-gradient(ellipse at top right, ${lightColor} 0%, transparent 100%)`;
      break;
    case 'top-left':
      gradientStr = `radial-gradient(ellipse at top left, ${lightColor} 0%, transparent 100%)`;
      break;
    case 'bottom-right':
      gradientStr = `radial-gradient(ellipse at bottom right, ${lightColor} 0%, transparent 100%)`;
      break;
    case 'bottom-left':
      gradientStr = `radial-gradient(ellipse at bottom left, ${lightColor} 0%, transparent 100%)`;
      break;
    default:
      gradientStr = `radial-gradient(ellipse at center, ${lightColor} 0%, transparent 85%)`;
      break;
  }
  
  return {
    backgroundImage: gradientStr,
    opacity: opacity,
    pointerEvents: 'none',
  };
};
