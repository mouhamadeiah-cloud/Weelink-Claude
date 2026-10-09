import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { NavbarPart } from './utils/navbarParts';
import { 
  Page, 
  Slide, 
  CanvasElement, 
  DevicePreviewMode, 
  ElementType,
  SlideDividerShape,
  NavbarConfig,
} from './types';
import { ControlBar } from './components/ControlBar';
import { EditBar, SelectionNameInput, selectionName } from './components/EditBar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { EditorColumn, EDITOR_BAR_HEIGHT, EDITOR_COLUMN_WIDTH } from './components/EditorColumn';
import { INSPECTOR_SECTIONS, InspectorGroupId, InspectorShortcutId, InspectorTarget, groupOfSection, inspectorGroups } from './components/rightDrawer/inspectorGroups';
import { RightDrawer, DrawerSection } from './components/RightDrawer';
import { ProjectSettingsSection } from './components/rightDrawer/sections/ProjectSettingsSection';
import { WorkspaceHub } from './components/WorkspaceHub';
import { StandardAuth } from './components/StandardAuth';
import { ProjectChooser } from './components/ProjectChooser';
import { ShopAdminPanel } from './components/shop/ShopAdminPanel';
import { ShopDataContext, ShopUpdateContext } from './components/shop/store/ShopDataContext';
import { ProjectType, ShopAdminData, createEmptyShopAdmin, normalizeShopAdmin } from './components/shop/shopTypes';
import { CarAdminPanel } from './components/cars/CarAdminPanel';
import { CarDataContext, CarRequestContext } from './components/cars/store/CarDataContext';
import { submitRequest, RequestInput } from './components/cars/carMoney';
import { CarAdminData, createEmptyCarAdmin, normalizeCarAdmin, exampleCars } from './components/cars/carTypes';
import { getCarShowroomTemplate } from './data/carShowroomTemplate';
import { RestaurantAdminPanel } from './components/restaurant/RestaurantAdminPanel';
import { RestaurantDataContext, RestaurantOrderContext } from './components/restaurant/store/RestaurantDataContext';
import { RestaurantAdminData, MenuOrder, createEmptyRestaurantAdmin, normalizeRestaurantAdmin, exampleRestaurantAdmin, submitOrder } from './components/restaurant/restaurantTypes';
import { dropStaffFromDesign, placeOrder, publishRestaurant, readStaff, restaurantSiteUrl, saveStaff, withoutStaff } from './components/restaurant/restaurantCloud';
import { getRestaurantTemplate } from './data/restaurantTemplate';
import { WeeAIChat } from './components/WeeAIChat';
import { Eye, FileText, FolderTree, LayoutTemplate, Loader2, MousePointer2, Plus, Redo2, Settings, SlidersHorizontal, Store, Undo2 } from 'lucide-react';
import { applyPageTexts, businessFacts, pageTextItems, requestPageTexts, type WeeAnswers } from './services/weeWriter';
import { CommandPalette, PaletteCommand } from './components/CommandPalette';
import { elementDisplayName } from './utils/elementLabels';
import { getFreeStarterTemplate } from './data/freeStarterTemplate';
import { getOnlineShopTemplate, withLiveProductGrid, withCheckoutLayout } from './data/onlineShopTemplate';
import { arrangeForMobile } from './utils/mobileLayout';
import { withTemplateGroups } from './utils/templateGroups';
import { withLocalGraphics } from './utils/localGraphics';

// Firebase Imports
import { auth, db, loginWithGoogle, logoutUser } from './services/firebase';
import { isSigningIn, resolveAccountId, takeInviteProblem } from './services/accounts';
import { Access, OWNER_ACCESS, loadAccess } from './services/members';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SelectionBar } from './components/SelectionBar';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = data[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeData(val);
        }
      }
    }
    return cleaned;
  }
  return data;
};

// Converts string[][] table cells to [{ row: string[] }] to avoid nested arrays (unsupported by Firestore)
const serializeElements = (elements: CanvasElement[]): any[] => {
  const mapped = elements.map(el => {
    if (el.tableConfig) {
      const { cells, ...rest } = el.tableConfig;
      return {
        ...el,
        tableConfig: {
          ...rest,
          cells: cells ? cells.map(row => ({ row })) : []
        }
      };
    }
    return el;
  });
  return sanitizeData(mapped);
};

const deserializeElements = (dataElements: any[]): CanvasElement[] => {
  if (!dataElements) return [];
  return dataElements.map(withLocalGraphics).map(el => {
    if (el.tableConfig) {
      const { cells, ...rest } = el.tableConfig;
      let restoredCells: string[][] = [];
      if (Array.isArray(cells)) {
        restoredCells = cells.map((item: any) => {
          if (item && Array.isArray(item.row)) {
            return item.row;
          }
          if (Array.isArray(item)) {
            return item;
          }
          return [];
        });
      }
      return {
        ...el,
        tableConfig: {
          ...rest,
          cells: restoredCells
        }
      } as CanvasElement;
    }
    return el;
  });
};

const initialPage: Page = {
  id: 'page-home',
  name: 'الرئيسية',
  slug: '/',
  navbar: {
    // Never default this to the platform's own name — it must come from the user's own input.
    brandName: '',
    items: [
      { id: '1', label: 'الرئيسية', href: '#' },
    ],
    // Never default this to a fallback CTA label — the button should only appear once the
    // user types one themselves in the navbar settings.
    ctaText: '',
    ctaHref: '#start',
    bgColor: '#ffffff',
    textColor: '#1d1d1f',
    isSticky: true,
  },
  slides: [
    {
      id: 'slide-1',
      name: 'شريحة ١',
      height: 560,
      backgroundColor: '#ffffff',
      dividerShape: 'straight',
    },
  ],
};

// Old hardcoded platform-name/CTA defaults that used to be baked into every new page before this
// was fixed. Any already-saved page (in localStorage or Firestore) from before the fix still has
// these literal values persisted, so loading it must strip them back out — otherwise the user's
// navbar keeps showing the platform's own name/CTA instead of staying empty until they type their
// own. This only clears an EXACT match against the old defaults; anything the user typed themselves
// (including a brand name that happens to also be "wee" by coincidence) is left completely alone.
const LEGACY_DEFAULT_BRAND_NAMES = new Set(['weelink', 'wee', 'Wee', 'Weelink', 'WEE', 'WEELINK']);
const LEGACY_DEFAULT_CTA_TEXTS = new Set(['ابدأ مجاناً', 'ابدأ الآن']);

const normalizeLegacyNavbarDefaults = (pagesToFix: Page[]): Page[] => {
  return pagesToFix.map((page) => {
    if (!page.navbar) return page;
    const brandName = page.navbar.brandName;
    const ctaText = page.navbar.ctaText;
    const brandIsLegacy = typeof brandName === 'string' && LEGACY_DEFAULT_BRAND_NAMES.has(brandName);
    const ctaIsLegacy = typeof ctaText === 'string' && LEGACY_DEFAULT_CTA_TEXTS.has(ctaText);
    if (!brandIsLegacy && !ctaIsLegacy) return page;
    return {
      ...page,
      navbar: {
        ...page.navbar,
        ...(brandIsLegacy ? { brandName: '' } : {}),
        ...(ctaIsLegacy ? { ctaText: '' } : {}),
      },
    };
  });
};

const getInitialPages = (): Page[] => {
  // Deep sweep: Clear all legacy and active design caches from localStorage to ensure a 100% blank slate on refresh!
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('weelink_pages') || key.startsWith('weelink_elements'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Storage sweep failed:", e);
  }
  return [initialPage];
};

const getInitialElements = (): CanvasElement[] => {
  return [];
};

// Where each project is stored: the free page keeps the original fields/keys,
// the Online Shop project uses its own fields in the same design document.
const PROJECT_STORAGE: Record<ProjectType, { pagesField: string; elementsField: string; localPrefix: string }> = {
  page: { pagesField: 'pages', elementsField: 'elements', localPrefix: 'weelink_' },
  shop: { pagesField: 'shopPages', elementsField: 'shopElements', localPrefix: 'weelink_shop_' },
  cars: { pagesField: 'carPages', elementsField: 'carElements', localPrefix: 'weelink_cars_' },
  restaurant: { pagesField: 'restaurantPages', elementsField: 'restaurantElements', localPrefix: 'weelink_restaurant_' },
};

// Named in the top bar until the site has its own name (the navbar's brand name).
const PROJECT_KIND_LABEL: Record<ProjectType, string> = { page: 'صفحتي', shop: 'المتجر', cars: 'معرض السيارات', restaurant: 'المطعم' };

export default function App() {
  // Pages state
  const [pages, setPages] = useState<Page[]>(getInitialPages);
  const [activePageId, setActivePageId] = useState<string>('page-home');

  // Preview Mode: desktop, tablet, mobile
  const [previewMode, setPreviewMode] = useState<DevicePreviewMode>('desktop');
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);

  // Drawer section & open state
  // A phone starts with the canvas in full view; its panel opens from the bar at the bottom.
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(() => window.innerWidth >= 1024);
  const [drawerSection, setDrawerSection] = useState<DrawerSection>('elements');
  const [drawerTab, setDrawerTab] = useState<'structure' | 'tool'>('structure');
  const [sectionRequest, setSectionRequest] = useState(0);
  // The docked panel's inspector: the group the column asked for, and the group showing at its top.
  const [inspectorFocus, setInspectorFocus] = useState<{ group: InspectorGroupId | null; shortcut?: InspectorShortcutId; n: number }>({ group: null, n: 0 });
  const [inspectorGroup, setInspectorGroup] = useState<InspectorGroupId | null>(null);
  const [tabRequest, setTabRequest] = useState<{ tab: 'structure' | 'tool'; n: number }>({ tab: 'structure', n: 0 });
  // The column's "admin" button opens the restaurant, shop or showroom admin.
  const [adminOpenRequest, setAdminOpenRequest] = useState(0);

  // On a wide screen the control panel is docked on the right with the icons beside it, and the
  // workspace takes the rest of the width, so the panel never covers the canvas.
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Narrower screens (phones, tablets) get the same panel as a sheet that slides up from the bottom,
  // with the editing icons in a bar along the bottom edge.
  const isWide = windowWidth >= 1024;
  const isSheet = !isWide && !isPreviewActive;
  const isDocked = !isPreviewActive;
  const dockedPanelWidth = Math.round(Math.min(400, Math.max(320, windowWidth * 0.24)));
  const EDIT_RAIL_WIDTH = EDITOR_COLUMN_WIDTH;
  const [isWorkspaceHubOpen, setIsWorkspaceHubOpen] = useState(false);

  // Elements state (Canvas elements in freegrid)
  const [elements, setElements] = useState<CanvasElement[]>(getInitialElements);

  // Firebase Auth & Cloud Sync States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [isAuthActive, setIsAuthActive] = useState<boolean>(true);
  const [isChatActive, setIsChatActive] = useState<boolean>(true);
  const [isCanvasLoading, setIsCanvasLoading] = useState<boolean>(false);
  // The account whose workspace is open (see services/accounts.ts); 'mouhamadeiah' while signed out.
  const [activeUserUid, setActiveUserUid] = useState<string>('mouhamadeiah');
  // Open project: the free page or the Online Shop (Weelink / Shops). The user
  // picks one on the project chooser after logging in.
  const [project, setProject] = useState<ProjectType>('page');
  const [isProjectChosen, setIsProjectChosen] = useState<boolean>(false);
  const [projectLoading, setProjectLoading] = useState<ProjectType | null>(null);
  const [hasShop, setHasShop] = useState<boolean>(false);
  const [shopAdmin, setShopAdmin] = useState<ShopAdminData>(createEmptyShopAdmin);
  const updateShopAdmin = useCallback((fn: (d: ShopAdminData) => ShopAdminData) => setShopAdmin((prev) => fn(prev)), []);
  const [hasCars, setHasCars] = useState<boolean>(false);
  const [carAdmin, setCarAdmin] = useState<CarAdminData>(createEmptyCarAdmin);
  const updateCarAdmin = useCallback((fn: (d: CarAdminData) => CarAdminData) => setCarAdmin((prev) => fn(prev)), []);
  const submitCarRequest = useCallback((r: RequestInput) => setCarAdmin((prev) => submitRequest(prev, r)), []);
  const [hasRestaurant, setHasRestaurant] = useState<boolean>(false);
  const [restaurantAdmin, setRestaurantAdmin] = useState<RestaurantAdminData>(createEmptyRestaurantAdmin);
  const updateRestaurantAdmin = useCallback((fn: (d: RestaurantAdminData) => RestaurantAdminData) => setRestaurantAdmin((prev) => fn(prev)), []);
  const ownerUid = activeUserUid;
  // The owner sees everything; a management member what the owner allowed (services/members.ts).
  const [access, setAccess] = useState<Access>(OWNER_ACCESS);
  useEffect(() => {
    let alive = true;
    loadAccess(currentUser, activeUserUid).then((a) => alive && setAccess(a));
    return () => {
      alive = false;
    };
  }, [currentUser, activeUserUid]);
  // An order placed in the preview goes to the live orders like a guest's; when they cannot be
  // reached it is kept in the admin data instead.
  const submitRestaurantOrder = useCallback(async (o: MenuOrder) => {
    try {
      return await placeOrder(ownerUid, o);
    } catch (e) {
      console.warn('Could not send the order to the live orders:', e);
      setRestaurantAdmin((prev) => submitOrder(prev, o));
      return null;
    }
  }, [ownerUid]);
  // Bumped by every workspace load so a slower, older load can't overwrite a newer one.
  const loadSeqRef = useRef(0);
  // True once the open project's data has actually been loaded, so switching
  // projects never saves a half-loaded placeholder over the real design.
  const projectReadyRef = useRef(false);
  const [authErrorModal, setAuthErrorModal] = useState<{
    title: string;
    message: string;
    domain?: string;
    copied?: boolean;
  } | null>(null);

  // Keep latest state of pages & elements accessible in the auth listener without trigger loops
  const pagesRef = useRef<Page[]>(pages);
  const elementsRef = useRef<CanvasElement[]>(elements);
  const isInitialLoadComplete = useRef<boolean>(false);
  // The Firebase user whose workspace was last loaded (undefined until the first auth answer).
  const handledAuthUid = useRef<string | null | undefined>(undefined);
  // Whether the open restaurant's devices and workers may be written to their private doc.
  const staffSyncRef = useRef<'private' | 'legacy' | 'off'>('off');

  // Loads pages/elements from LocalStorage only (offline fallback / pre-cloud-sync bootstrap)
  const loadLocalDesign = (userId: string) => {
    try {
      // IMPORTANT: no fallback to the old non-namespaced 'weelink_pages'/'weelink_elements'
      // keys here. That fallback used to leak the last signed-in user's design to any
      // other/new user on the same browser whenever their own per-user key didn't exist
      // yet (e.g. a brand-new signup). Each user's data must come ONLY from their own key.
      const storedPages = localStorage.getItem(`weelink_pages_${userId}`);
      const storedElements = localStorage.getItem(`weelink_elements_${userId}`);
      
      let loadedPages: Page[] = [];
      let loadedElements: CanvasElement[] = [];
      
      if (storedPages) {
        loadedPages = normalizeLegacyNavbarDefaults(JSON.parse(storedPages));
      }
      if (storedElements) {
        loadedElements = deserializeElements(JSON.parse(storedElements));
      }
      
      if (loadedPages.length === 0) {
        const blankPage: Page = {
          id: 'page-home',
          name: 'الرئيسية',
          slug: '/',
          navbar: {
            // Never default this to the platform's own name — it must come from the user's own input.
            brandName: '',
            items: [],
            ctaText: '',
            ctaHref: '',
            bgColor: '#ffffff',
            textColor: '#1d1d1f',
            isSticky: true,
          },
          slides: [
            {
              id: 'slide-1',
              name: 'شريحة فارغة',
              height: 560,
              backgroundColor: '#ffffff',
              dividerShape: 'straight',
            }
          ]
        };
        loadedPages = [blankPage];
        loadedElements = [];
      }
      
      setProject('page');
      setPages(loadedPages);
      setElements(loadedElements);
      setHistory([loadedElements]);
      setHistoryIndex(0);
    } catch (e) {
      console.error("Error loading local workspace:", e);
    }
  };

  // Loads onboarding/chat-completion status from LocalStorage only (offline fallback)
  const loadLocalChatStatus = (userId: string) => {
    try {
      const chatProgressStored = localStorage.getItem(`weelink_chat_progress_${userId}`);
      if (chatProgressStored) {
        const chatData = JSON.parse(chatProgressStored);
        setIsChatActive(chatData.currentStep !== 13);
      } else {
        setIsChatActive(true);
      }
    } catch (e) {
      console.error("Error loading local chat status:", e);
      setIsChatActive(true);
    }
  };

  // Loads the user's workspace: Firebase first (source of truth, synced across devices),
  // falling back to the local cache when offline or before the first cloud sync.
  const loadUserWorkspace = async (userId: string) => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    let loadedDesignFromCloud = false;
    let shopExists = false;
    let carsExist = false;
    let restaurantExists = false;
    try {
      shopExists = !!localStorage.getItem(`${PROJECT_STORAGE.shop.localPrefix}pages_${userId}`);
      carsExist = !!localStorage.getItem(`${PROJECT_STORAGE.cars.localPrefix}pages_${userId}`);
      restaurantExists = !!localStorage.getItem(`${PROJECT_STORAGE.restaurant.localPrefix}pages_${userId}`);
    } catch {
      // storage unavailable
    }
    try {
      const designSnap = await getDoc(doc(db, 'designs', userId));
      if (seq !== loadSeqRef.current) return;
      if (designSnap.exists()) {
        const data: any = designSnap.data();
        if (Array.isArray(data.shopPages) && data.shopPages.length > 0) shopExists = true;
        if (Array.isArray(data.carPages) && data.carPages.length > 0) carsExist = true;
        if (Array.isArray(data.restaurantPages) && data.restaurantPages.length > 0) restaurantExists = true;
        const cloudPages: Page[] = normalizeLegacyNavbarDefaults(Array.isArray(data.pages) ? data.pages : []);
        if (cloudPages.length > 0) {
          const cloudElements: CanvasElement[] = deserializeElements(data.elements || []);
          setProject('page');
          setPages(cloudPages);
          setElements(cloudElements);
          setHistory([cloudElements]);
          setHistoryIndex(0);
          loadedDesignFromCloud = true;
        }
      }
    } catch (e) {
      console.warn("Could not load design from Firebase, falling back to local cache:", e);
    }
    if (seq !== loadSeqRef.current) return;
    if (!loadedDesignFromCloud) {
      loadLocalDesign(userId);
    }
    setHasShop(shopExists);
    setHasCars(carsExist);
    setHasRestaurant(restaurantExists);
    setActivePageId('page-home');
    projectReadyRef.current = true;

    let loadedChatStatusFromCloud = false;
    try {
      const progressSnap = await getDoc(doc(db, 'platform_directory', userId));
      if (seq !== loadSeqRef.current) return;
      if (progressSnap.exists()) {
        const chatData: any = progressSnap.data();
        setIsChatActive(chatData.currentStep !== 13);
        loadedChatStatusFromCloud = true;
      }
    } catch (e) {
      console.warn("Could not load onboarding progress from Firebase, falling back to local cache:", e);
    }
    if (seq !== loadSeqRef.current) return;
    if (!loadedChatStatusFromCloud) {
      loadLocalChatStatus(userId);
    }
  };

  // Loads the Online Shop project. A first visit starts from the online shop template.
  const loadShopWorkspace = async (userId: string) => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    const { pagesField, elementsField, localPrefix } = PROJECT_STORAGE.shop;
    let shopPages: Page[] = [];
    let shopElements: CanvasElement[] = [];
    let admin: ShopAdminData | null = null;
    try {
      const designSnap = await getDoc(doc(db, 'designs', userId));
      if (designSnap.exists()) {
        const data: any = designSnap.data();
        if (Array.isArray(data[pagesField]) && data[pagesField].length > 0) {
          shopPages = normalizeLegacyNavbarDefaults(data[pagesField]);
          shopElements = deserializeElements(data[elementsField] || []);
        }
        if (data.shopAdmin) admin = normalizeShopAdmin(data.shopAdmin);
      }
    } catch (e) {
      console.warn("Could not load the shop from Firebase, falling back to local cache:", e);
    }
    if (seq !== loadSeqRef.current) return;
    try {
      if (shopPages.length === 0) {
        const storedPages = localStorage.getItem(`${localPrefix}pages_${userId}`);
        const storedElements = localStorage.getItem(`${localPrefix}elements_${userId}`);
        if (storedPages) shopPages = normalizeLegacyNavbarDefaults(JSON.parse(storedPages));
        if (storedElements) shopElements = deserializeElements(JSON.parse(storedElements));
      }
      if (!admin) {
        const storedAdmin = localStorage.getItem(`${localPrefix}admin_${userId}`);
        if (storedAdmin) admin = normalizeShopAdmin(JSON.parse(storedAdmin));
      }
    } catch (e) {
      console.warn("Could not read the local shop cache:", e);
    }
    if (shopPages.length === 0) {
      const template = getOnlineShopTemplate({ liveProducts: true });
      shopPages = template.pages;
      shopElements = template.elements;
    } else {
      shopElements = withLiveProductGrid(shopElements);
      ({ pages: shopPages, elements: shopElements } = withCheckoutLayout(shopPages, shopElements));
      ({ pages: shopPages, elements: shopElements } = withTemplateGroups(shopPages, shopElements));
    }
    setProject('shop');
    setPages(shopPages);
    setElements(shopElements);
    setHistory([shopElements]);
    setHistoryIndex(0);
    setShopAdmin(admin || createEmptyShopAdmin());
    setActivePageId(shopPages[0].id);
    setActiveSlideId(shopPages[0].slides[0]?.id || 'slide-1');
    setSelectedElementId(null);
    setIsChatActive(false);
    setHasShop(true);
    projectReadyRef.current = true;
  };

  // Loads the car showroom project. A first visit starts from the showroom template, with four
  // example cars in the admin window so its pages are not empty.
  const loadCarsWorkspace = async (userId: string) => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    const { pagesField, elementsField, localPrefix } = PROJECT_STORAGE.cars;
    let carPages: Page[] = [];
    let carElements: CanvasElement[] = [];
    let admin: CarAdminData | null = null;
    try {
      const designSnap = await getDoc(doc(db, 'designs', userId));
      if (designSnap.exists()) {
        const data: any = designSnap.data();
        if (Array.isArray(data[pagesField]) && data[pagesField].length > 0) {
          carPages = normalizeLegacyNavbarDefaults(data[pagesField]);
          carElements = deserializeElements(data[elementsField] || []);
        }
        if (data.carAdmin) admin = normalizeCarAdmin(data.carAdmin);
      }
    } catch (e) {
      console.warn("Could not load the car showroom from Firebase, falling back to local cache:", e);
    }
    if (seq !== loadSeqRef.current) return;
    try {
      if (carPages.length === 0) {
        const storedPages = localStorage.getItem(`${localPrefix}pages_${userId}`);
        const storedElements = localStorage.getItem(`${localPrefix}elements_${userId}`);
        if (storedPages) carPages = normalizeLegacyNavbarDefaults(JSON.parse(storedPages));
        if (storedElements) carElements = deserializeElements(JSON.parse(storedElements));
      }
      if (!admin) {
        const storedAdmin = localStorage.getItem(`${localPrefix}admin_${userId}`);
        if (storedAdmin) admin = normalizeCarAdmin(JSON.parse(storedAdmin));
      }
    } catch (e) {
      console.warn("Could not read the local car showroom cache:", e);
    }
    if (carPages.length === 0) {
      const template = getCarShowroomTemplate();
      carPages = template.pages;
      carElements = template.elements;
      if (!admin) admin = { ...createEmptyCarAdmin(), cars: exampleCars() };
    } else {
      ({ pages: carPages, elements: carElements } = withTemplateGroups(carPages, carElements));
    }
    setProject('cars');
    setPages(carPages);
    setElements(carElements);
    setHistory([carElements]);
    setHistoryIndex(0);
    setCarAdmin(admin || createEmptyCarAdmin());
    setActivePageId(carPages[0].id);
    setActiveSlideId(carPages[0].slides[0]?.id || 'slide-1');
    setSelectedElementId(null);
    setIsChatActive(false);
    setHasCars(true);
    projectReadyRef.current = true;
  };

  // Loads the restaurant project. A first visit starts from the restaurant template, with an example
  // menu in the admin window so its pages are not empty.
  const loadRestaurantWorkspace = async (userId: string) => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    const { pagesField, elementsField, localPrefix } = PROJECT_STORAGE.restaurant;
    let restPages: Page[] = [];
    let restElements: CanvasElement[] = [];
    let admin: RestaurantAdminData | null = null;
    try {
      const designSnap = await getDoc(doc(db, 'designs', userId));
      if (designSnap.exists()) {
        const data: any = designSnap.data();
        if (Array.isArray(data[pagesField]) && data[pagesField].length > 0) {
          restPages = normalizeLegacyNavbarDefaults(data[pagesField]);
          restElements = deserializeElements(data[elementsField] || []);
        }
        if (data.restaurantAdmin) admin = normalizeRestaurantAdmin(data.restaurantAdmin);
      }
    } catch (e) {
      console.warn("Could not load the restaurant from Firebase, falling back to local cache:", e);
    }
    // The devices and the workers come from the private doc once it exists (see restaurantCloud.ts).
    const staff = await readStaff(userId);
    if (seq !== loadSeqRef.current) return;
    staffSyncRef.current = typeof staff === 'object' ? 'private' : staff === 'missing' ? 'legacy' : 'off';
    if (typeof staff === 'object') admin = { ...(admin || createEmptyRestaurantAdmin()), devices: staff.devices, workers: staff.workers };
    else if (staff === 'denied' && admin) admin = { ...admin, devices: [], workers: [] };
    try {
      if (restPages.length === 0) {
        const storedPages = localStorage.getItem(`${localPrefix}pages_${userId}`);
        const storedElements = localStorage.getItem(`${localPrefix}elements_${userId}`);
        if (storedPages) restPages = normalizeLegacyNavbarDefaults(JSON.parse(storedPages));
        if (storedElements) restElements = deserializeElements(JSON.parse(storedElements));
      }
      if (!admin) {
        const storedAdmin = localStorage.getItem(`${localPrefix}admin_${userId}`);
        if (storedAdmin) admin = normalizeRestaurantAdmin(JSON.parse(storedAdmin));
      }
    } catch (e) {
      console.warn("Could not read the local restaurant cache:", e);
    }
    if (restPages.length === 0) {
      const template = getRestaurantTemplate();
      restPages = template.pages;
      restElements = template.elements;
      if (!admin) admin = exampleRestaurantAdmin();
    }
    setProject('restaurant');
    setPages(restPages);
    setElements(restElements);
    setHistory([restElements]);
    setHistoryIndex(0);
    setRestaurantAdmin(admin || createEmptyRestaurantAdmin());
    setActivePageId(restPages[0].id);
    setActiveSlideId(restPages[0].slides[0]?.id || 'slide-1');
    setSelectedElementId(null);
    setIsChatActive(false);
    setHasRestaurant(true);
    projectReadyRef.current = true;
  };

  // The shop's products page carries the store's name (page title and navbar link).
  useEffect(() => {
    if (project !== 'shop' || !projectReadyRef.current) return;
    const label = shopAdmin.settings.storeName.trim() || 'المتجر';
    setPages((prev) => {
      let changed = false;
      const next = prev.map((pg) => {
        let page = pg;
        if (pg.id === 'shop-page-products' && pg.name !== label) {
          changed = true;
          page = { ...page, name: label };
        }
        if (pg.navbar?.items?.some((i) => i.linkTargetId === 'shop-page-products' && i.label !== label)) {
          changed = true;
          page = { ...page, navbar: { ...page.navbar, items: page.navbar.items.map((i) => (i.linkTargetId === 'shop-page-products' ? { ...i, label } : i)) } };
        }
        return page;
      });
      return changed ? next : prev;
    });
  }, [project, shopAdmin.settings.storeName, pages.length]);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // 1. Listen for Auth changes & Load workspace from LocalStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (signedIn: User | null) => {
      // An anonymous user is a restaurant device in another tab, not an owner.
      const user = signedIn && !signedIn.isAnonymous ? signedIn : null;
      setCurrentUser(user);
      // The sign-in screen opens the account itself; a token refresh changes nothing.
      const uid = user ? user.uid : null;
      if (isSigningIn() || uid === handledAuthUid.current) return;
      const first = handledAuthUid.current === undefined;
      handledAuthUid.current = uid;
      setIsFirebaseLoading(true);
      // Left over from the old sign-in, which trusted these.
      localStorage.removeItem('weelink_simulated_user_uid');
      localStorage.removeItem('weelink_simulated_user_email');
      localStorage.removeItem('weelink_last_login_account');
      const accountId = user ? await resolveAccountId(user) : 'mouhamadeiah';
      setActiveUserUid(accountId);
      await loadUserWorkspace(accountId);
      const problem = takeInviteProblem();
      if (problem) window.alert(problem);
      if (first || !user) setIsAuthActive(true);
      setIsFirebaseLoading(false);
      isInitialLoadComplete.current = true;
    });
    return () => unsubscribe();
  }, []);

  // 2. Debounced auto-save to LocalStorage whenever pages or elements change
  useEffect(() => {
    // Skip saving during initial boot/loading to prevent overwrite races
    if (!isInitialLoadComplete.current || isFirebaseLoading) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      try {
        const targetUserId = activeUserUid;
        const { localPrefix } = PROJECT_STORAGE[project];
        localStorage.setItem(`${localPrefix}pages_${targetUserId}`, JSON.stringify(pages));
        localStorage.setItem(`${localPrefix}elements_${targetUserId}`, JSON.stringify(elements));
        // NOTE: deliberately no longer writing the old non-namespaced 'weelink_pages'/
        // 'weelink_elements' keys — they were the source of a cross-account data leak.
      } catch (e) {
        console.warn("Could not save to LocalStorage:", e);
      }
    }, 1200); // 1.2s debounce to avoid spamming writes

    return () => clearTimeout(delayDebounceFn);
  }, [pages, elements, currentUser, isFirebaseLoading, activeUserUid, project]);

  // 3. Debounced live auto-save to Firebase whenever pages or elements change
  useEffect(() => {
    // Skip saving during initial boot/loading to prevent overwrite races
    if (!isInitialLoadComplete.current || isFirebaseLoading) {
      return;
    }

    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSavingCloud(true);
        const { pagesField, elementsField } = PROJECT_STORAGE[project];
        await setDoc(doc(db, 'designs', targetUserId), {
          [pagesField]: sanitizeData(pages),
          [elementsField]: serializeElements(elements),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save failed (kept locally, will retry on next change):", e);
      } finally {
        setIsSavingCloud(false);
      }
    }, 1200); // 1.2s debounce to avoid spamming writes

    return () => clearTimeout(delayDebounceFn);
  }, [pages, elements, currentUser, isFirebaseLoading, activeUserUid, project]);

  // 4. Debounced save of the shop's admin data (catalogs, warehouse, orders...).
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'shop') {
      return;
    }
    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      try {
        localStorage.setItem(`${PROJECT_STORAGE.shop.localPrefix}admin_${targetUserId}`, JSON.stringify(shopAdmin));
      } catch (e) {
        console.warn("Could not save shop admin data locally:", e);
      }
      try {
        await setDoc(doc(db, 'designs', targetUserId), {
          shopAdmin: sanitizeData(shopAdmin),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save of shop admin data failed:", e);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [shopAdmin, currentUser, isFirebaseLoading, activeUserUid, project]);

  // 5. Debounced save of the car showroom's admin data (cars, settings).
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'cars') {
      return;
    }
    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      try {
        localStorage.setItem(`${PROJECT_STORAGE.cars.localPrefix}admin_${targetUserId}`, JSON.stringify(carAdmin));
      } catch (e) {
        console.warn("Could not save car showroom data locally:", e);
      }
      try {
        await setDoc(doc(db, 'designs', targetUserId), {
          carAdmin: sanitizeData(carAdmin),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save of car showroom data failed:", e);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [carAdmin, currentUser, isFirebaseLoading, activeUserUid, project]);

  // 6. Debounced save of the restaurant's admin data (menu, orders, settings).
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'restaurant') {
      return;
    }
    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      try {
        localStorage.setItem(`${PROJECT_STORAGE.restaurant.localPrefix}admin_${targetUserId}`, JSON.stringify(restaurantAdmin));
      } catch (e) {
        console.warn("Could not save restaurant data locally:", e);
      }
      try {
        await setDoc(doc(db, 'designs', targetUserId), {
          restaurantAdmin: sanitizeData(withoutStaff(restaurantAdmin)),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save of restaurant data failed:", e);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [restaurantAdmin, currentUser, isFirebaseLoading, activeUserUid, project]);

  // 7. The restaurant's public site (restaurants/{uid}): pages, elements, menu and settings, published
  // a moment after each change so the guests' link and the tables' QR codes always show the latest.
  // The devices and the workers go to the private doc the restaurant's tablets read.
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'restaurant' || !projectReadyRef.current) return;
    const t = setTimeout(() => {
      publishRestaurant(ownerUid, pages, elements, restaurantAdmin).catch((e) => console.warn('Could not publish the restaurant site:', e));
      // Not when they could not be read (no permission, offline): the empty list would wipe them.
      if (staffSyncRef.current !== 'off') {
        saveStaff(ownerUid, restaurantAdmin)
          .then(() => {
            if (staffSyncRef.current === 'legacy') dropStaffFromDesign(ownerUid).catch(() => {});
            staffSyncRef.current = 'private';
          })
          .catch((e) => console.warn('Could not save the devices for the restaurant tablets:', e));
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [pages, elements, restaurantAdmin, isFirebaseLoading, project, ownerUid]);

  // Saves the open project right away (the debounced saves above would be
  // cancelled when another project's data replaces it).
  const flushProjectSave = () => {
    if (!projectReadyRef.current) return;
    const targetUserId = activeUserUid;
    const { pagesField, elementsField, localPrefix } = PROJECT_STORAGE[project];
    try {
      localStorage.setItem(`${localPrefix}pages_${targetUserId}`, JSON.stringify(pages));
      localStorage.setItem(`${localPrefix}elements_${targetUserId}`, JSON.stringify(elements));
      if (project === 'shop') localStorage.setItem(`${localPrefix}admin_${targetUserId}`, JSON.stringify(shopAdmin));
      if (project === 'cars') localStorage.setItem(`${localPrefix}admin_${targetUserId}`, JSON.stringify(carAdmin));
      if (project === 'restaurant') localStorage.setItem(`${localPrefix}admin_${targetUserId}`, JSON.stringify(restaurantAdmin));
    } catch (e) {
      console.warn("Could not save to LocalStorage:", e);
    }
    // Not awaited: Firestore queues the write locally, and waiting for the server
    // would freeze the switch while offline.
    setDoc(doc(db, 'designs', targetUserId), {
      [pagesField]: sanitizeData(pages),
      [elementsField]: serializeElements(elements),
      ...(project === 'shop' ? { shopAdmin: sanitizeData(shopAdmin) } : {}),
      ...(project === 'cars' ? { carAdmin: sanitizeData(carAdmin) } : {}),
      ...(project === 'restaurant' ? { restaurantAdmin: sanitizeData(withoutStaff(restaurantAdmin)) } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch((e) => console.warn("Cloud save failed while switching projects:", e));
  };

  const handleChooseProject = async (type: ProjectType) => {
    if (projectLoading) return;
    setProjectLoading(type);
    try {
      const targetUserId = activeUserUid;
      if (type !== project) {
        flushProjectSave();
        if (type === 'shop') await loadShopWorkspace(targetUserId);
        else if (type === 'cars') await loadCarsWorkspace(targetUserId);
        else if (type === 'restaurant') await loadRestaurantWorkspace(targetUserId);
        else await loadUserWorkspace(targetUserId);
      }
      setIsProjectChosen(true);
    } finally {
      setProjectLoading(null);
    }
  };

  const handleOpenProjects = () => {
    flushProjectSave();
    setIsPreviewActive(false);
    setIsProjectChosen(false);
  };

  // Auth Action Handlers
  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) handleAuthSuccess(await resolveAccountId(user), false);
    } catch (e: any) {
      console.warn("Google Login caught info:", e);
      const errorCode = e?.code || '';
      const errorMsg = e?.message || '';
      const currentHost = window.location.hostname;

      if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
        setAuthErrorModal({
          title: 'إضافة نطاق الموقع إلى Autorisierte Domains',
          message: 'نظام أمان Google يرفض تسجيل الدخول لأن نطاق الصفحة الحالية غير مسجل بدقة في قائمة النطاقات المصرح بها في كونسول Firebase.',
          domain: currentHost,
        });
      } else if (errorCode === 'auth/configuration-not-found' || errorMsg.includes('configuration-not-found')) {
        setAuthErrorModal({
          title: 'خطوة أخيرة في إعداد Google في Firebase',
          message: 'في كونسول Firebase (مشروع weelink-cd35d):\n1. اضغط على خيار Google في جدول Anmeldemethode.\n2. تأكد من تحديد بريد الدعم (Support-E-Mail des Projekts) من القائمة المنسدلة.\n3. اضغط زر Speichern (حفظ).',
        });
      } else if (errorCode === 'auth/popup-blocked') {
        alert('قام المتصفح بحظر نافذة تسجيل الدخول المنبثقة. يرجى السماح بالنوافذ المنبثقة (Popups) لهذا الموقع من شريط عنوان المتصفح.');
      } else if (errorCode === 'auth/popup-closed-by-user') {
        // Closed by user, no notification needed
      } else {
        setAuthErrorModal({
          title: 'تنبيه تسجيل الدخول (' + (errorCode || 'خطأ غير معروف') + ')',
          message: errorMsg || 'تعذر تسجيل الدخول بـ Google. يرجى مراجعة إعدادات الأمان في كونسول Firebase.',
          domain: currentHost,
        });
      }
    }
  };

  const handleAuthSuccess = (userUid: string, isNewUser: boolean) => {
    handledAuthUid.current = auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser.uid : null;
    setActiveUserUid(userUid);
    const inviteProblem = takeInviteProblem();
    if (inviteProblem) window.setTimeout(() => window.alert(inviteProblem), 300);
    if (isNewUser) {
      // ALWAYS start a brand-new account with a blank page. The editor screen
      // (isAuthActive === false) never renders before authentication succeeds,
      // so there is no such thing as "guest work designed before signup" to
      // preserve here — anything left in pagesRef/elementsRef at this point is
      // always a PREVIOUS account's leftover in-memory state from this same
      // browser tab, and handing it to a new account is exactly the
      // cross-account data leak that was reported. Never reuse it.
      const blankPage: Page = {
        id: 'page-home',
        name: 'الرئيسية',
        slug: '/',
        navbar: {
          // Never default this to the platform's own name — it must come from the user's own input.
          brandName: '',
          items: [],
          ctaText: '',
          ctaHref: '',
          bgColor: '#ffffff',
          textColor: '#1d1d1f',
          isSticky: true,
        },
        slides: [
          {
            id: 'slide-1',
            name: 'شريحة فارغة',
            height: 560,
            backgroundColor: '#ffffff',
            dividerShape: 'straight',
          }
        ]
      };
      const finalPages: Page[] = [blankPage];
      const finalElements: CanvasElement[] = [];

      loadSeqRef.current++;
      projectReadyRef.current = true;
      setProject('page');
      setHasShop(false);
      setPages(finalPages);
      setElements(finalElements);
      setHistory([finalElements]);
      setHistoryIndex(0);
      setIsChatActive(true);

      // Save to localStorage
      try {
        localStorage.setItem(`weelink_pages_${userUid}`, JSON.stringify(finalPages));
        localStorage.setItem(`weelink_elements_${userUid}`, JSON.stringify(finalElements));
        
        const emailVal = auth.currentUser?.email || '';
        const initialProgress = {
          currentStep: 1,
          personalInfo: { title: 'سيد', fullName: '', birthDate: '', logoUrl: '' },
          addressInfo: { governorate: 'دمشق', city: '', street: '', details: '', coordinates: null },
          contactInfo: { email: emailVal, whatsapp: '', phone: '', facebook: '', tiktok: '' },
          catalogInfo: { category: 'مطاعم وكافيهات', specialty: 'طبخ منزلي 🍳', customCategory: '', customSpecialty: '' },
          aiAnswers: {
            description: '',
            colorPalette: 'الأزرق الكلاسيكي الكوني',
            customColor: '#0071e3',
            dividerStyle: 'straight',
            wantsGallery: true,
            galleryImages: [],
            heroBgImage: '',
            motionEffects: 'صفحة هادئة وجادة',
            specialInstructions: ''
          },
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(`weelink_chat_progress_${userUid}`, JSON.stringify(initialProgress));
      } catch (err) {
        console.error("Error setting up local storage layout:", err);
      }
    } else {
      // Existing user: fetch their page
      loadUserWorkspace(userUid);
    }
    setIsSavingCloud(false);
    isInitialLoadComplete.current = true;
    setIsAuthActive(false); // Hide login screen, go straight to builder/chat!
    // A phone sees its page first; the panel waits behind the bar at the bottom.
    setIsRightDrawerOpen(window.innerWidth >= 1024);
  };

  const handleCompleteChat = (collectedData: any) => {
    const targetUserId = activeUserUid;
    try {
      const completedProgress = {
        ...collectedData,
        currentStep: 13,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`weelink_chat_progress_${targetUserId}`, JSON.stringify(completedProgress));
    } catch (err) {
      console.error("Error saving completed chat state to LocalStorage:", err);
    }
    // Wee AI stays open: its next step is the button that writes the page's texts from these answers.
  };

  const handleManualSave = () => {
    const targetUserId = activeUserUid;
    try {
      localStorage.setItem(`weelink_pages_${targetUserId}`, JSON.stringify(pages));
      localStorage.setItem(`weelink_elements_${targetUserId}`, JSON.stringify(elements));

      alert('تم حفظ الصفحة والشرائح بنجاح محلياً!');
    } catch (error) {
      console.error("Manual save failed:", error);
      alert('عذراً، فشل الحفظ المحلي: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleStepChange = (_stepNum: number) => {
    setIsCanvasLoading(true);
    setTimeout(() => {
      setIsCanvasLoading(false);
    }, 900);
  };

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من الحساب السحابي؟')) {
      try {
        await logoutUser();
        // Critical: clear the in-memory design when logging out. Without this,
        // the previous account's pages/elements stay in React state, and if a
        // DIFFERENT person then signs up as a new user on this same browser
        // without a page refresh, handleAuthSuccess's "preserve current design
        // for the new user" logic would hand them the previous user's page.
        setPages([initialPage]);
        setElements([]);
        setSelectedElementId(null);
        setActivePageId('page-home');
        setActiveSlideId('slide-1');
        setHistory([[]]);
        setHistoryIndex(0);
        setActiveUserUid('mouhamadeiah');
        loadSeqRef.current++;
        projectReadyRef.current = false;
        setProject('page');
        setIsProjectChosen(false);
        setHasShop(false);
        setShopAdmin(createEmptyShopAdmin());
        setHasCars(false);
        setCarAdmin(createEmptyCarAdmin());
        setHasRestaurant(false);
        setRestaurantAdmin(createEmptyRestaurantAdmin());
        setIsAuthActive(true);
      } catch (e) {
        alert('تعذر تسجيل الخروج.');
      }
    }
  };

  // Selected element & slide
  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-1');
  const [activeSlideId, setActiveSlideId] = useState<string>('slide-1');
  const [activeTableCell, setActiveTableCell] = useState<{ elementId: string; row: number; col: number } | null>(null);
  // Navbar selection (clicking the navbar in the canvas, like selecting a slide, opens navbar-specific editing)
  const [isNavbarSelected, setIsNavbarSelected] = useState<boolean>(false);
  // A navbar part whose link is waiting to be copied onto the next element the user clicks.
  const [linkCopySource, setLinkCopySource] = useState<NavbarPart | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<CanvasElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushToHistory = useCallback((newElements: CanvasElement[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newElements);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setElements(newElements);
  }, [history, historyIndex]);

  // Wee AI writes the texts of the page being edited from the owner's answers, as one step that
  // undo takes back. The answer can take a while, so it is applied to the elements as they are then.
  const pushToHistoryRef = useRef(pushToHistory);
  pushToHistoryRef.current = pushToHistory;
  const handleWriteTexts = async (answers: WeeAnswers) => {
    const page = pagesRef.current.find((p) => p.id === activePageId) || currentPage;
    const items = pageTextItems(elementsRef.current, page.slides);
    if (!items.length) return { ok: false, message: 'ما في نصوص بهالصفحة ليكتبها Wee AI. أضف عنوان أو فقرة أولاً.' };
    const result = await requestPageTexts(businessFacts(answers, page.navbar.brandName || PROJECT_KIND_LABEL[project]), items);
    if (!result.ok) return { ok: false, message: result.message };
    const { next, changed } = applyPageTexts(elementsRef.current, result.texts);
    if (!changed) return { ok: false, message: 'ما رجع Wee AI بنصوص جديدة. جرّب مرة ثانية.' };
    pushToHistoryRef.current(next);
    return { ok: true, message: `كتب Wee AI ${changed} نص بصفحة «${page.name}». إذا ما عجبوك اكبس تراجع (${/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'}+Z).` };
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setElements(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setElements(history[nextIndex]);
    }
  };

  // Format painter state (نسخ التنسيق - رول الدهان)
  const [copiedFormat, setCopiedFormat] = useState<any | null>(null);
  const [copiedType, setCopiedType] = useState<'element' | 'slide' | 'navbar' | null>(null);

  const handleCopyFormat = () => {
    if (copiedFormat) {
      // Clear/cancel copied format
      setCopiedFormat(null);
      setCopiedType(null);
      return;
    }

    if (selectedElement) {
      // Copy element styles
      setCopiedFormat({ ...selectedElement.styles });
      setCopiedType('element');
    } else if (currentSlide) {
      // Copy active slide styles
      setCopiedFormat({
        backgroundColor: currentSlide.backgroundColor,
        backgroundImage: currentSlide.backgroundImage,
        backgroundSize: currentSlide.backgroundSize,
        backgroundPosition: currentSlide.backgroundPosition,
        backgroundRepeat: currentSlide.backgroundRepeat,
        borderColor: currentSlide.borderColor,
        borderWidth: currentSlide.borderWidth,
        borderRadius: currentSlide.borderRadius,
        borderStyle: currentSlide.borderStyle,
        glowColor: currentSlide.glowColor,
        glowIntensity: currentSlide.glowIntensity,
        glowPosition: currentSlide.glowPosition,
        innerGlowColor: currentSlide.innerGlowColor,
        innerGlowIntensity: currentSlide.innerGlowIntensity,
        innerGlowPosition: currentSlide.innerGlowPosition,
        opacity: currentSlide.opacity,
        backgroundOpacity: currentSlide.backgroundOpacity,
        height: currentSlide.height,
      });
      setCopiedType('slide');
    } else if (isNavbarSelected) {
      // Copy navbar styles
      setCopiedFormat({
        bgColor: currentPage.navbar.bgColor,
        textColor: currentPage.navbar.textColor,
        backgroundImage: currentPage.navbar.backgroundImage,
        backgroundSize: currentPage.navbar.backgroundSize,
        backgroundPosition: currentPage.navbar.backgroundPosition,
        backgroundOpacity: currentPage.navbar.backgroundOpacity,
        textOpacity: currentPage.navbar.textOpacity,
        innerGlowColor: currentPage.navbar.innerGlowColor,
        innerGlowIntensity: currentPage.navbar.innerGlowIntensity,
        innerGlowPosition: currentPage.navbar.innerGlowPosition,
        glowColor: currentPage.navbar.glowColor,
        glowIntensity: currentPage.navbar.glowIntensity,
        glowPosition: currentPage.navbar.glowPosition,
        borderColor: currentPage.navbar.borderColor,
        borderWidth: currentPage.navbar.borderWidth,
        borderRadius: currentPage.navbar.borderRadius,
        borderStyle: currentPage.navbar.borderStyle,
        height: currentPage.navbar.height,
        width: currentPage.navbar.width,
        showBrandName: currentPage.navbar.showBrandName,
        itemsAlign: currentPage.navbar.itemsAlign,
        itemsFontFamily: currentPage.navbar.itemsFontFamily,
        itemsFrameBgColor: currentPage.navbar.itemsFrameBgColor,
        itemsFrameBorderColor: currentPage.navbar.itemsFrameBorderColor,
        itemsFrameBorderWidth: currentPage.navbar.itemsFrameBorderWidth,
        itemsFrameBorderRadius: currentPage.navbar.itemsFrameBorderRadius,
      });
      setCopiedType('navbar');
    }
  };

  const handleSelectSlide = (id: string) => {
    setActiveSlideId(id);
    setIsNavbarSelected(false);
    followSelectionInPanel();
    if (!isDocked) setIsRightDrawerOpen(false); // The floating panel would cover the selected slide

    if (copiedFormat && copiedType === 'slide') {
      // Apply slide styles to this slide
      const updatedSlides = currentPage.slides.map(s => {
        if (s.id === id) {
          return {
            ...s,
            backgroundColor: copiedFormat.backgroundColor,
            backgroundImage: copiedFormat.backgroundImage,
            backgroundSize: copiedFormat.backgroundSize,
            backgroundPosition: copiedFormat.backgroundPosition,
            backgroundRepeat: copiedFormat.backgroundRepeat,
            borderColor: copiedFormat.borderColor,
            borderWidth: copiedFormat.borderWidth,
            borderRadius: copiedFormat.borderRadius,
            borderStyle: copiedFormat.borderStyle,
            glowColor: copiedFormat.glowColor,
            glowIntensity: copiedFormat.glowIntensity,
            glowPosition: copiedFormat.glowPosition,
            innerGlowColor: copiedFormat.innerGlowColor,
            innerGlowIntensity: copiedFormat.innerGlowIntensity,
            innerGlowPosition: copiedFormat.innerGlowPosition,
            opacity: copiedFormat.opacity,
            backgroundOpacity: copiedFormat.backgroundOpacity,
            height: copiedFormat.height,
          };
        }
        return s;
      });
      setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
      
      // Reset format painter after single use
      setCopiedFormat(null);
      setCopiedType(null);
    }
  };

  const handleSelectElement = (id: string | null) => {
    if (isPreviewActive) return;
    if (id !== selectedElementId) {
      setActiveTableCell(null);
    }
    if (id) {
      setIsNavbarSelected(false);
    }

    if (id && copiedFormat && copiedType === 'element') {
      // Apply style to this element!
      const targetElement = elements.find(el => el.id === id);
      if (targetElement) {
        const updated = elements.map(el => {
          if (el.id === id) {
            return {
              ...el,
              styles: {
                ...el.styles,
                // Merge visual styles only (protects essence like button text, image url, link etc.)
                backgroundColor: copiedFormat.backgroundColor,
                color: copiedFormat.color,
                borderColor: copiedFormat.borderColor,
                borderWidth: copiedFormat.borderWidth,
                borderRadius: copiedFormat.borderRadius,
                borderStyle: copiedFormat.borderStyle,
                glowColor: copiedFormat.glowColor,
                glowIntensity: copiedFormat.glowIntensity,
                glowPosition: copiedFormat.glowPosition,
                innerGlowColor: copiedFormat.innerGlowColor,
                innerGlowIntensity: copiedFormat.innerGlowIntensity,
                innerGlowPosition: copiedFormat.innerGlowPosition,
                fontSize: copiedFormat.fontSize,
                fontWeight: copiedFormat.fontWeight,
                textAlign: copiedFormat.textAlign,
                fontFamily: copiedFormat.fontFamily,
                fontStyle: copiedFormat.fontStyle,
                textDecoration: copiedFormat.textDecoration,
                shadow: copiedFormat.shadow,
                opacity: copiedFormat.opacity,
                backgroundOpacity: copiedFormat.backgroundOpacity,
                imageFilter: copiedFormat.imageFilter,
                imageTintColor: copiedFormat.imageTintColor,
                imageTintOpacity: copiedFormat.imageTintOpacity,
                imageTintBlendMode: copiedFormat.imageTintBlendMode,
              }
            };
          }
          return el;
        });
        pushToHistory(updated);
      }
      
      // Reset format painter after single use
      setCopiedFormat(null);
      setCopiedType(null);
    }
    
    if (id) {
      const el = elements.find(item => item.id === id);
      if (isDocked) {
        // Picking an element on the canvas always shows its settings (even after adding).
        if (drawerSection !== 'add-image') {
          setDrawerSection('inspector');
          setTabRequest((r) => ({ tab: 'tool', n: r.n + 1 }));
        }
      } else if (el && el.type === 'gallery') {
        setDrawerSection('gallery');
        setIsRightDrawerOpen(true);
      }
    }
    
    setSelectedElementId(id);
  };

  // Selecting the navbar (clicking it in the canvas) — mirrors handleSelectSlide/handleSelectElement
  const handleSelectNavbar = () => {
    if (isPreviewActive) return;
    setSelectedElementId(null);
    setIsNavbarSelected(true);
    followSelectionInPanel();

    if (copiedFormat && copiedType === 'navbar') {
      setPages(pages.map(p => ({
        ...p,
        navbar: {
          ...p.navbar,
          bgColor: copiedFormat.bgColor,
          textColor: copiedFormat.textColor,
          backgroundImage: copiedFormat.backgroundImage,
          backgroundSize: copiedFormat.backgroundSize,
          backgroundPosition: copiedFormat.backgroundPosition,
          backgroundOpacity: copiedFormat.backgroundOpacity,
          textOpacity: copiedFormat.textOpacity,
          innerGlowColor: copiedFormat.innerGlowColor,
          innerGlowIntensity: copiedFormat.innerGlowIntensity,
          innerGlowPosition: copiedFormat.innerGlowPosition,
          glowColor: copiedFormat.glowColor,
          glowIntensity: copiedFormat.glowIntensity,
          glowPosition: copiedFormat.glowPosition,
          borderColor: copiedFormat.borderColor,
          borderWidth: copiedFormat.borderWidth,
          borderRadius: copiedFormat.borderRadius,
          borderStyle: copiedFormat.borderStyle,
          height: copiedFormat.height,
          width: copiedFormat.width,
          showBrandName: copiedFormat.showBrandName,
          itemsAlign: copiedFormat.itemsAlign,
          itemsFontFamily: copiedFormat.itemsFontFamily,
          itemsFrameBgColor: copiedFormat.itemsFrameBgColor,
          itemsFrameBorderColor: copiedFormat.itemsFrameBorderColor,
          itemsFrameBorderWidth: copiedFormat.itemsFrameBorderWidth,
          itemsFrameBorderRadius: copiedFormat.itemsFrameBorderRadius,
        },
      })));
      setCopiedFormat(null);
      setCopiedType(null);
    }
  };

  // What the docked panel's inspector is about right now.
  const currentInspectorTarget = (): InspectorTarget => {
    const el = isNavbarSelected ? null : elements.find((e) => e.id === selectedElementId);
    return isNavbarSelected ? { kind: 'navbar' } : el ? { kind: 'element', type: el.type } : { kind: 'slide' };
  };

  // Shows the inspector in the docked panel, scrolled to a group when one is given.
  const showInspector = (group: InspectorGroupId | null = null, shortcut?: InspectorShortcutId) => {
    setDrawerSection('inspector');
    setInspectorFocus((f) => ({ group, shortcut, n: f.n + 1 }));
    setTabRequest((r) => ({ tab: 'tool', n: r.n + 1 }));
    setIsRightDrawerOpen(true);
  };

  // Selecting on the canvas shows what was selected in the docked panel, unless the panel is in the
  // middle of adding something (a new element is selected as it is added).
  const followSelectionInPanel = () => {
    if (!isDocked) return;
    if (drawerSection === 'elements' || drawerSection === 'add-text' || drawerSection === 'add-image') return;
    setDrawerSection('inspector');
    setTabRequest((r) => ({ tab: 'tool', n: r.n + 1 }));
  };

  // Tool Selection from any icon: Opens Control Drawer and selects corresponding tool
  // Asking again for the section the docked panel is showing closes the panel.
  const handleSelectTool = (tool: DrawerSection) => {
    // The docked panel shows an element's settings together on one page: a section asked for by
    // name opens its group there.
    if (isDocked && INSPECTOR_SECTIONS.includes(tool)) {
      showInspector(groupOfSection(tool, currentInspectorTarget()));
      return;
    }
    if (isDocked && isRightDrawerOpen && drawerTab === 'tool' && drawerSection === tool) {
      setIsRightDrawerOpen(false);
      return;
    }
    setDrawerSection(tool);
    setSectionRequest((n) => n + 1);
    setIsRightDrawerOpen(true);
  };

  const currentPage = pages.find(p => p.id === activePageId) || pages[0];
  const selectedElement = elements.find(el => el.id === selectedElementId) || null;
  const currentSlide = currentPage.slides.find(s => s.id === activeSlideId) || currentPage.slides[0];

  // Element Actions
  const handleUpdateElementName = (newName: string) => {
    if (selectedElement) {
      const updated = elements.map(el => 
        el.id === selectedElement.id ? { ...el, name: newName } : el
      );
      pushToHistory(updated);
    } else if (currentSlide) {
      const updatedSlides = currentPage.slides.map(s => 
        s.id === currentSlide.id ? { ...s, name: newName } : s
      );
      setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
    }
  };

  const handleUpdateElementStyles = (newStyles: Partial<CanvasElement['styles']>) => {
    if (!selectedElement) return;

    // Direct cell styling inside Table elements if a cell is focused
    if (selectedElement.type === 'table' && activeTableCell && activeTableCell.elementId === selectedElement.id) {
      const { row, col } = activeTableCell;
      const updated = elements.map(el => {
        if (el.id === selectedElement.id) {
          const config = el.tableConfig || {
            rows: 3,
            cols: 3,
            themeColor: '#0071e3',
            headerRow: true,
            indexCol: false,
            colWidths: [120, 120, 120],
            rowHeights: [40, 40, 40],
            cells: [['', '', ''], ['', '', ''], ['', '', '']]
          };
          const cellStyles = config.cellStyles || {};
          const key = `${row},${col}`;
          cellStyles[key] = {
            ...(cellStyles[key] || {}),
            ...newStyles
          };
          return {
            ...el,
            tableConfig: {
              ...config,
              cellStyles
            }
          };
        }
        return el;
      });
      pushToHistory(updated);
      return;
    }

    // A group's text colour goes to the texts inside it, since the group itself shows no text.
    const groupTextIds = new Set<string>();
    if (selectedElement.type === 'shape' && selectedElement.isGroupContainer && newStyles.color !== undefined) {
      const g = selectedElement;
      elements.forEach(el => {
        if (
          el.slideId === g.slideId && !el.isLocked &&
          ['heading', 'paragraph', 'button', 'badge'].includes(el.type) &&
          el.x >= g.x && el.x + el.width <= g.x + g.width &&
          el.y >= g.y && el.y + el.height <= g.y + g.height
        ) groupTextIds.add(el.id);
      });
    }

    const updated = elements.map(el => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          styles: { ...el.styles, ...newStyles }
        };
      }
      if (groupTextIds.has(el.id)) {
        return { ...el, styles: { ...el.styles, color: newStyles.color } };
      }
      return el;
    });
    pushToHistory(updated);
  };

  const handleUpdateElement = (data: Partial<CanvasElement>) => {
    if (!selectedElement) return;
    const updated = elements.map(el => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          ...data,
        };
      }
      return el;
    });
    pushToHistory(updated);
  };

  const handleUpdateElementById = (id: string, data: Partial<CanvasElement>) => {
    const updated = elements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          ...data,
        };
      }
      return el;
    });
    pushToHistory(updated);
  };

  const handleUpdateElementPosition = (id: string, x: number, y: number) => {
    const target = elements.find(el => el.id === id);
    if (!target) return;

    // In mobile view an element with a phone layout is moved within that layout only;
    // its desktop position stays as it is.
    if (previewMode === 'mobile' && target.mobile) {
      setElements(elements.map(el => el.id === id && el.mobile ? { ...el, mobile: { ...el.mobile, x, y } } : el));
      return;
    }

    const dx = x - target.x;
    const dy = y - target.y;

    // 1. If dragging a shape that is an active Group Container
    if (target.type === 'shape' && target.isGroupContainer) {
      const containerIndex = elements.findIndex(el => el.id === id);
      const children = elements.filter((el, idx) => {
        if (el.slideId !== target.slideId) return false;
        if (idx <= containerIndex) return false;
        if (el.isLocked) return false;
        if (el.id === id) return false;
        if (el.type === 'shape' && el.isGroupContainer) return false;
        
        // Bounds check relative to parent's original position (target.x, target.y)
        return (
          el.x >= target.x &&
          el.x + el.width <= target.x + target.width &&
          el.y >= target.y &&
          el.y + el.height <= target.y + target.height
        );
      });

      const childIds = new Set(children.map(c => c.id));

      const updated = elements.map(el => {
        if (el.id === id) {
          return { ...el, x, y };
        }
        if (childIds.has(el.id)) {
          return { ...el, x: el.x + dx, y: el.y + dy };
        }
        return el;
      });
      setElements(updated);
      return;
    }

    // Find if the target was sitting inside an active group container prior to this drag
    const targetIndex = elements.findIndex(el => el.id === id);
    const parentContainer = elements.find((el, idx) => 
      el.slideId === target.slideId &&
      el.type === 'shape' &&
      el.isGroupContainer &&
      idx < targetIndex &&
      target.x >= el.x &&
      target.x + target.width <= el.x + el.width &&
      target.y >= el.y &&
      target.y + target.height <= el.y + el.height
    );

    // 2. If dragging an element that is already grouped: allow moving within container or dragging out
    if (parentContainer) {
      const isCompletelyWithin = (
        x >= parentContainer.x &&
        x + target.width <= parentContainer.x + parentContainer.width &&
        y >= parentContainer.y &&
        y + target.height <= parentContainer.y + parentContainer.height
      );

      if (isCompletelyWithin) {
        // Still completely within parent: update position inside and auto-grow container height if needed
        let containerHeight = parentContainer.height;
        if (y + target.height > parentContainer.y + parentContainer.height - 12) {
          containerHeight = (y + target.height) - parentContainer.y + 16;
        }

        const updated = elements.map(el => {
          if (el.id === id) {
            return { ...el, x, y };
          }
          if (el.id === parentContainer.id) {
            return { ...el, height: containerHeight };
          }
          return el;
        });
        setElements(updated);
      } else {
        // Dragged OUTSIDE parent bounds: automatically remove from group by updating its position normally
        const updated = elements.map(el => el.id === id ? { ...el, x, y } : el);
        setElements(updated);
      }
      return;
    }

    // 3. Regular element drag: check if new position falls completely inside any active Group Container on the same slide
    const activeContainers = elements.filter((el, idx) => 
      el.slideId === target.slideId && 
      el.type === 'shape' && 
      el.isGroupContainer && 
      el.id !== id &&
      idx < targetIndex
    );

    let containerOver: CanvasElement | null = null;
    for (const container of activeContainers) {
      const isCompletelyWithin = (
        x >= container.x &&
        x + target.width <= container.x + container.width &&
        y >= container.y &&
        y + target.height <= container.y + container.height
      );
      if (isCompletelyWithin) {
        containerOver = container;
        break;
      }
    }

    if (containerOver) {
      // Dragged over container: join the group!
      let width = target.width;
      let height = target.height;
      const maxWidth = containerOver.width - 24;
      const maxHeight = containerOver.height - 24;

      if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width;
        const heightRatio = maxHeight / height;
        const scale = Math.min(widthRatio, heightRatio);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      // Clamp position inside group bounds
      let clampedX = Math.max(containerOver.x + 12, Math.min(containerOver.x + containerOver.width - width - 12, x));
      let clampedY = Math.max(containerOver.y + 12, Math.min(containerOver.y + containerOver.height - height - 12, y));

      // Auto-extend container height if child overflows bottom edge
      let containerHeight = containerOver.height;
      if (clampedY + height > containerOver.y + containerOver.height - 12) {
        containerHeight = (clampedY + height) - containerOver.y + 16;
      }

      const updated = elements.map(el => {
        if (el.id === id) {
          return { 
            ...el, 
            x: clampedX, 
            y: clampedY, 
            width, 
            height
          };
        }
        if (el.id === containerOver!.id) {
          return { ...el, height: containerHeight };
        }
        return el;
      });
      setElements(updated);
    } else {
      // Normal single element drag
      const updated = elements.map(el => el.id === id ? { ...el, x, y } : el);
      setElements(updated);
    }
  };

  const handleToggleGroupContainer = () => {
    if (!selectedElement || selectedElement.type !== 'shape') return;
    const shapeId = selectedElement.id;
    const shape = selectedElement;

    if (shape.isGroupContainer) {
      // Deactivating: Dissolve the group by simply turning off isGroupContainer property
      const updated = elements.map(el => {
        if (el.id === shapeId) {
          return { ...el, isGroupContainer: false };
        }
        return el;
      });
      pushToHistory(updated);
    } else {
      // Activating: Turn on group mode (isGroupContainer: true) on the container
      const updated = elements.map(el => {
        if (el.id === shapeId) {
          return { ...el, isGroupContainer: true };
        }
        return el;
      });

      // Send the group container shape to the bottom-most layer of the slide elements list
      // to ensure all other elements are in layers ABOVE it!
      const thisSlideElements = updated.filter(el => el.slideId === shape.slideId);
      const containerIndex = thisSlideElements.findIndex(el => el.id === shapeId);
      if (containerIndex !== -1) {
        const containerElem = thisSlideElements[containerIndex];
        const rest = thisSlideElements.filter(el => el.id !== shapeId);
        const sortedSlideElements = [containerElem, ...rest];

        let slideIndex = 0;
        const finalUpdated = updated.map(el => {
          if (el.slideId === shape.slideId) {
            return sortedSlideElements[slideIndex++];
          }
          return el;
        });
        pushToHistory(finalUpdated);
      } else {
        pushToHistory(updated);
      }
    }
  };

  const handleUpdateElementSize = (id: string, width: number, height: number, x?: number, y?: number) => {
    const target = elements.find(el => el.id === id);
    if (previewMode === 'mobile' && target?.mobile) {
      setElements(elements.map(el => el.id === id && el.mobile ? {
        ...el,
        mobile: {
          ...el.mobile,
          width,
          height,
          ...(x !== undefined ? { x } : {}),
          ...(y !== undefined ? { y } : {}),
        }
      } : el));
      return;
    }

    const updated = elements.map(el => {
      if (el.id === id) {
        if (el.type === 'table' && el.tableConfig) {
          const config = el.tableConfig;
          const currentTotalW = config.colWidths.reduce((sum, w) => sum + w, 0) + (config.indexCol ? 50 : 0);
          const currentTotalH = config.rowHeights.reduce((sum, h) => sum + h, 0);

          const wRatio = width / (currentTotalW || 1);
          const hRatio = height / (currentTotalH || 1);

          const newColWidths = config.colWidths.map(w => Math.max(30, Math.round(w * wRatio)));
          const newRowHeights = config.rowHeights.map(h => Math.max(15, Math.round(h * hRatio)));

          return {
            ...el,
            width,
            height,
            ...(x !== undefined ? { x } : {}),
            ...(y !== undefined ? { y } : {}),
            tableConfig: {
              ...config,
              colWidths: newColWidths,
              rowHeights: newRowHeights
            }
          };
        }
        return {
          ...el,
          width,
          height,
          ...(x !== undefined ? { x } : {}),
          ...(y !== undefined ? { y } : {}),
        };
      }
      return el;
    });
    setElements(updated);
  };

  const handleUpdateElementRotation = (id: string, rotation: number) => {
    const updated = elements.map(el => el.id === id ? { ...el, rotation } : el);
    setElements(updated);
  };

  const handleCommitElementRotation = (id: string, rotation: number) => {
    const updated = elements.map(el => el.id === id ? { ...el, rotation } : el);
    pushToHistory(updated);
  };

  const handleUpdateElementContent = (id: string, content: string) => {
    const updated = elements.map(el => el.id === id ? { ...el, content } : el);
    pushToHistory(updated);
  };

  const handleDeleteElement = (id: string) => {
    const target = elements.find(el => el.id === id);
    let updated = elements.filter(el => el.id !== id);
    
    // Cascading delete: if this is an active group container, delete all its spatially grouped elements
    if (target && target.type === 'shape' && target.isGroupContainer) {
      const containerIndex = elements.findIndex(el => el.id === id);
      const groupedChildIds = new Set(
        elements
          .filter((el, idx) => {
            if (el.slideId !== target.slideId) return false;
            if (idx <= containerIndex) return false;
            if (el.isLocked) return false;
            if (el.id === id) return false;
            if (el.type === 'shape' && el.isGroupContainer) return false;
            
            return (
              el.x >= target.x &&
              el.x + el.width <= target.x + target.width &&
              el.y >= target.y &&
              el.y + el.height <= target.y + target.height
            );
          })
          .map(c => c.id)
      );

      updated = updated.filter(el => !groupedChildIds.has(el.id));
    }

    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
    pushToHistory(updated);
  };

  const handleDuplicateElement = (id: string) => {
    const target = elements.find(el => el.id === id);
    if (!target) return;

    const timestamp = Date.now();

    // 1. If copying a Group Container shape
    if (target.type === 'shape' && target.isGroupContainer) {
      const newContainerId = `el-${timestamp}`;
      const newContainer: CanvasElement = {
        ...target,
        id: newContainerId,
        name: `${target.name} (نسخة)`,
        x: target.x + 24,
        y: target.y + 24,
      };

      // Find children dynamically!
      const containerIndex = elements.findIndex(el => el.id === id);
      const groupedChildren = elements.filter((el, idx) => {
        if (el.slideId !== target.slideId) return false;
        if (idx <= containerIndex) return false;
        if (el.isLocked) return false;
        if (el.id === id) return false;
        if (el.type === 'shape' && el.isGroupContainer) return false;
        
        return (
          el.x >= target.x &&
          el.x + el.width <= target.x + target.width &&
          el.y >= target.y &&
          el.y + el.height <= target.y + target.height
        );
      });

      const newChildren: CanvasElement[] = groupedChildren.map((child, idx) => {
        return {
          ...child,
          id: `el-${timestamp}-${idx}`,
          x: child.x + 24,
          y: child.y + 24,
        };
      });

      const updated = [...elements, newContainer, ...newChildren];
      setSelectedElementId(newContainerId);
      pushToHistory(updated);
      return;
    }

    // 2. Normal single element duplication
    const newEl: CanvasElement = {
      ...target,
      id: `el-${timestamp}`,
      name: `${target.name} (نسخة)`,
      x: target.x + 24,
      y: target.y + 24,
    };
    const updated = [...elements, newEl];
    setSelectedElementId(newEl.id);
    pushToHistory(updated);
  };

  const handleToggleLock = () => {
    if (!selectedElement) return;
    const updated = elements.map(el => 
      el.id === selectedElement.id ? { ...el, isLocked: !el.isLocked } : el
    );
    pushToHistory(updated);
  };

  const handleToggleBold = () => {
    if (!selectedElement) return;
    const isBold = selectedElement.styles.fontWeight === 'bold';
    handleUpdateElementStyles({ fontWeight: isBold ? 'normal' : 'bold' });
  };

  const handleToggleItalic = () => {
    if (!selectedElement) return;
    const isItalic = selectedElement.styles.fontStyle === 'italic';
    handleUpdateElementStyles({ fontStyle: isItalic ? 'normal' : 'italic' });
  };

  const handleToggleUnderline = () => {
    if (!selectedElement) return;
    const isUnderline = selectedElement.styles.textDecoration === 'underline';
    handleUpdateElementStyles({ textDecoration: isUnderline ? 'none' : 'underline' });
  };

  const handleCycleAlignment = () => {
    if (!selectedElement) return;
    const current = selectedElement.styles.textAlign || 'right';
    const nextAlign = current === 'right' ? 'center' : (current === 'center' ? 'left' : 'right');
    handleUpdateElementStyles({ textAlign: nextAlign });
  };

  // The quick tools bar above the selected element (docked editor).
  const renderSelectionBar = (el: CanvasElement) => (
    <SelectionBar
      element={el}
      onToggleBold={handleToggleBold}
      onToggleItalic={handleToggleItalic}
      onSetAlign={(textAlign) => handleUpdateElementStyles({ textAlign })}
      onFontSize={(fontSize) => handleUpdateElementStyles({ fontSize })}
      onReplaceImage={() => {
        setDrawerSection('add-image');
        setTabRequest((r) => ({ tab: 'tool', n: r.n + 1 }));
        setIsRightDrawerOpen(true);
      }}
      onOpenGroup={showInspector}
      onDuplicate={() => handleDuplicateElement(el.id)}
      onCopyFormat={handleCopyFormat}
      isFormatCopied={!!copiedFormat}
      onToggleLock={handleToggleLock}
      onDelete={() => handleDeleteElement(el.id)}
    />
  );

  // Quick search (Ctrl/⌘+K) over settings, things to add, pages, slides, elements and actions.
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [addRequest, setAddRequest] = useState<{ mode: 'element' | 'slide' | 'page'; category: string | null; n: number }>({ mode: 'element', category: null, n: 0 });
  const openAdd = (mode: 'element' | 'slide' | 'page', category: string | null = null) => {
    setDrawerSection('elements');
    setIsChatActive(false);
    setAddRequest((r) => ({ mode, category, n: r.n + 1 }));
    setTabRequest((r) => ({ tab: 'tool', n: r.n + 1 }));
    setIsRightDrawerOpen(true);
  };
  const paletteCommands = (): PaletteCommand[] => {
    const cmds: PaletteCommand[] = [];
    const target = currentInspectorTarget();
    const settingsTitle = isNavbarSelected ? 'النافبار' : selectedElement ? elementDisplayName(selectedElement) : 'الشريحة';
    const SETTINGS: [DrawerSection, string, string][] = [
      ['typography', 'الخط وحجمه', 'خط نوع حجم عريض مائل محاذاة'],
      ['color', 'لون النص', 'لون ألوان'],
      ['background', 'الخلفية', 'لون صورة تدرج خلفيه'],
      ['border', 'الإطار والزوايا', 'حدود دوران زوايا'],
      ['opacity', 'الشفافية', 'شفاف'],
      ['shadow', 'الظل والتوهج', 'ظل توهج إضاءة'],
      ['format', 'الأبعاد والتدوير', 'عرض طول حجم تدوير مكان'],
      ['layers', 'الطبقات', 'ترتيب فوق تحت'],
      ['link', 'الرابط', 'رابط لينك url'],
      ['animation', 'حركة الظهور', 'حركه انيميشن'],
      ['navbar-settings', 'إعدادات النافبار', 'قائمة شعار'],
    ];
    if (isDocked) {
      SETTINGS.forEach(([section, title, keywords]) => {
        const group = groupOfSection(section, target);
        if (!group) return;
        cmds.push({ id: `set-${section}`, section: `إعدادات ${settingsTitle}`, title, keywords, icon: <SlidersHorizontal size={14} />, run: () => showInspector(group) });
      });
    }
    const ADDS: [string, string, string?][] = [
      ['text', 'نص', 'عنوان فقرة كتابة'], ['image', 'صورة', 'صوره'], ['button', 'زر', 'كبسة'], ['icons', 'أيقونة', 'ايقونه رمز'],
      ['shape', 'أشكال', 'شكل مربع دائرة'], ['divider', 'خط فاصل', 'فاصل خط'], ['video', 'فيديو', 'يوتيوب'], ['lottie', 'رسوم متحركة', 'لوتي lottie انيميشن حركة'], ['gallery', 'معرض صور', 'البوم'],
      ['map', 'خريطة', 'موقع عنوان'], ['calendar', 'حجز مواعيد', 'تقويم موعد'], ['pricing', 'أسعار', 'باقة سعر'], ['sheet', 'جدول', 'جدول'],
      ['group-templates', 'بطاقات جاهزة', 'بطاقة مجموعة'], ['html', 'كود مخصص', 'html كود'],
    ];
    ADDS.forEach(([category, name, keywords]) =>
      cmds.push({ id: `add-${category}`, section: 'إضافة', title: `إضافة ${name}`, keywords, icon: <Plus size={14} />, run: () => openAdd('element', category) })
    );
    cmds.push({ id: 'add-slide', section: 'إضافة', title: 'إضافة شريحة', keywords: 'قسم سلايد', icon: <Plus size={14} />, run: () => openAdd('slide') });
    cmds.push({ id: 'add-page', section: 'إضافة', title: 'إضافة صفحة', keywords: 'صفحه', icon: <Plus size={14} />, run: () => openAdd('page') });

    pages.forEach((pg) =>
      cmds.push({ id: `page-${pg.id}`, section: 'الصفحات', title: pg.name, keywords: 'صفحة', icon: <FileText size={14} />, hint: pg.id === activePageId ? 'الحالية' : undefined, run: () => setActivePageId(pg.id) })
    );
    currentPage.slides.forEach((sl) =>
      cmds.push({
        id: `slide-${sl.id}`, section: 'الشرائح', title: sl.name, keywords: 'شريحة قسم', icon: <LayoutTemplate size={14} />,
        run: () => {
          handleSelectElement(null);
          handleSelectSlide(sl.id);
          document.getElementById(`slide-container-${sl.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      })
    );
    elements
      .filter((el) => currentPage.slides.some((sl) => sl.id === el.slideId))
      .forEach((el) => {
        const slideName = currentPage.slides.find((sl) => sl.id === el.slideId)?.name || '';
        // Many elements share a name like «عنوان», so a few words of their text tell them apart.
        const text = ['heading', 'paragraph', 'button'].includes(el.type) ? (el.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
        const name = elementDisplayName(el);
        cmds.push({
          id: `el-${el.id}`, section: 'عناصر الصفحة', title: text && text !== name ? `${name}: ${text}` : name, keywords: `${slideName} ${el.type} ${(el.content || '').slice(0, 60)}`,
          icon: <MousePointer2 size={14} />, hint: slideName,
          run: () => {
            handleSelectElement(el.id);
            document.getElementById(`canvas-elem-${el.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          },
        });
      });

    const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
    cmds.push({ id: 'undo', section: 'أوامر', title: 'تراجع', keywords: 'رجوع', icon: <Undo2 size={14} />, hint: `${mod}+Z`, run: handleUndo });
    cmds.push({ id: 'redo', section: 'أوامر', title: 'إعادة', icon: <Redo2 size={14} />, hint: `${mod}+Y`, run: handleRedo });
    cmds.push({ id: 'preview', section: 'أوامر', title: 'معاينة الموقع', keywords: 'عرض شوف', icon: <Eye size={14} />, run: () => { setSelectedElementId(null); setIsRightDrawerOpen(false); setIsPreviewActive(true); } });
    cmds.push({ id: 'structure', section: 'أوامر', title: 'هيكل الموقع', keywords: 'صفحات شرائح عناصر شجرة', icon: <FolderTree size={14} />, run: () => { setIsChatActive(false); setTabRequest((r) => ({ tab: 'structure', n: r.n + 1 })); setIsRightDrawerOpen(true); } });
    cmds.push({ id: 'page-settings', section: 'أوامر', title: 'إعدادات الصفحة', keywords: 'ألوان الصفحة', icon: <Settings size={14} />, run: () => { setIsChatActive(false); setDrawerSection('page-settings'); setTabRequest((r) => ({ tab: 'tool', n: r.n + 1 })); setIsRightDrawerOpen(true); } });
    cmds.push({ id: 'project-settings', section: 'أوامر', title: 'إعدادات المشروع', keywords: 'اسم المشروع', icon: <Settings size={14} />, run: () => { setIsChatActive(false); setDrawerSection('project-settings'); setTabRequest((r) => ({ tab: 'tool', n: r.n + 1 })); setIsRightDrawerOpen(true); } });
    if (project !== 'page') {
      cmds.push({ id: 'admin', section: 'أوامر', title: project === 'shop' ? 'إدارة المتجر' : project === 'cars' ? 'إدارة معرض السيارات' : 'إدارة المطعم', keywords: 'ادارة طلبات منتجات', icon: <Store size={14} />, run: () => setAdminOpenRequest((n) => n + 1) });
    }
    cmds.push({ id: 'wee-ai', section: 'أوامر', title: 'Wee AI', keywords: 'ذكاء اصطناعي كتابة نصوص', icon: <SlidersHorizontal size={14} />, run: () => { setIsChatActive(true); setIsRightDrawerOpen(true); } });
    return cmds;
  };

  // Keyboard shortcuts of the editor. They stay out of the way while typing in a field or in a text
  // on the canvas, and in the preview.
  const [copiedElement, setCopiedElement] = useState<CanvasElement | null>(null);
  const handleShortcut = (e: KeyboardEvent) => {
    if (isPreviewActive || !currentUser) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setIsPaletteOpen((v) => !v);
      return;
    }
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
    if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    const el = selectedElement;

    if (mod && key === 'z') {
      e.preventDefault();
      if (e.shiftKey) handleRedo();
      else handleUndo();
      return;
    }
    if (mod && key === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }
    if (mod && key === 'v' && copiedElement) {
      e.preventDefault();
      const sameSlide = copiedElement.slideId === activeSlideId;
      const pasted: CanvasElement = {
        ...copiedElement,
        id: `el-${Date.now()}`,
        slideId: activeSlideId,
        x: copiedElement.x + (sameSlide ? 24 : 0),
        y: copiedElement.y + (sameSlide ? 24 : 0),
        isLocked: false,
      };
      setSelectedElementId(pasted.id);
      pushToHistory([...elements, pasted]);
      // The next paste lands a step further.
      setCopiedElement(pasted);
      return;
    }
    if (!el) return;
    if (e.key === 'Escape') {
      handleSelectElement(null);
      return;
    }
    if (mod && key === 'c') {
      // Copy the element only when no text on the page is selected.
      if (window.getSelection()?.toString()) return;
      setCopiedElement(el);
      return;
    }
    if (mod && key === 'd') {
      e.preventDefault();
      handleDuplicateElement(el.id);
      return;
    }
    if (mod && key === 'b' && ['heading', 'paragraph', 'button'].includes(el.type)) {
      e.preventDefault();
      handleToggleBold();
      return;
    }
    if (mod && key === 'i' && ['heading', 'paragraph', 'button'].includes(el.type)) {
      e.preventDefault();
      handleToggleItalic();
      return;
    }
    if (el.isLocked) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleDeleteElement(el.id);
      return;
    }
    const step = e.shiftKey ? 10 : 1;
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (move[e.key] && !mod) {
      e.preventDefault();
      const [dx, dy] = move[e.key];
      // A plain move is one undo step; a group or the phone layout moves the way dragging does.
      if (previewMode === 'mobile' || (el.type === 'shape' && el.isGroupContainer)) handleUpdateElementPosition(el.id, el.x + dx, el.y + dy);
      else handleUpdateElementById(el.id, { x: el.x + dx, y: el.y + dy });
    }
  };
  const shortcutRef = useRef(handleShortcut);
  shortcutRef.current = handleShortcut;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => shortcutRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleToggleBulletList = () => {
    if (!selectedElement) return;
    const current = selectedElement.styles.listStyle;
    handleUpdateElementStyles({ listStyle: current === 'bullet' ? 'none' : 'bullet' });
  };

  const handleToggleNumericList = () => {
    if (!selectedElement) return;
    const current = selectedElement.styles.listStyle;
    handleUpdateElementStyles({ listStyle: current === 'numeric' ? 'none' : 'numeric' });
  };

  const handleMoveLayerUp = () => {
    if (!selectedElement) return;
    const thisSlideElements = elements.filter(el => el.slideId === selectedElement.slideId);
    const index = thisSlideElements.findIndex(el => el.id === selectedElement.id);
    if (index < thisSlideElements.length - 1) {
      const updatedThisSlide = [...thisSlideElements];
      const temp = updatedThisSlide[index];
      updatedThisSlide[index] = updatedThisSlide[index + 1];
      updatedThisSlide[index + 1] = temp;

      let slideIndex = 0;
      const copy = elements.map(el => {
        if (el.slideId === selectedElement.slideId) {
          return updatedThisSlide[slideIndex++];
        }
        return el;
      });
      pushToHistory(copy);
    }
  };

  const handleMoveLayerDown = () => {
    if (!selectedElement) return;
    const thisSlideElements = elements.filter(el => el.slideId === selectedElement.slideId);
    const index = thisSlideElements.findIndex(el => el.id === selectedElement.id);
    if (index > 0) {
      const updatedThisSlide = [...thisSlideElements];
      const temp = updatedThisSlide[index];
      updatedThisSlide[index] = updatedThisSlide[index - 1];
      updatedThisSlide[index - 1] = temp;

      let slideIndex = 0;
      const copy = elements.map(el => {
        if (el.slideId === selectedElement.slideId) {
          return updatedThisSlide[slideIndex++];
        }
        return el;
      });
      pushToHistory(copy);
    }
  };

  const handleMoveLayerToFront = () => {
    if (!selectedElement) return;
    const thisSlideElements = elements.filter(el => el.slideId === selectedElement.slideId);
    const index = thisSlideElements.findIndex(el => el.id === selectedElement.id);
    if (index !== -1 && index < thisSlideElements.length - 1) {
      const updatedThisSlide = thisSlideElements.filter(el => el.id !== selectedElement.id);
      updatedThisSlide.push(selectedElement);

      let slideIndex = 0;
      const copy = elements.map(el => {
        if (el.slideId === selectedElement.slideId) {
          return updatedThisSlide[slideIndex++];
        }
        return el;
      });
      pushToHistory(copy);
    }
  };

  const handleMoveLayerToBack = () => {
    if (!selectedElement) return;
    const thisSlideElements = elements.filter(el => el.slideId === selectedElement.slideId);
    const index = thisSlideElements.findIndex(el => el.id === selectedElement.id);
    if (index !== -1 && index > 0) {
      const updatedThisSlide = thisSlideElements.filter(el => el.id !== selectedElement.id);
      updatedThisSlide.unshift(selectedElement);

      let slideIndex = 0;
      const copy = elements.map(el => {
        if (el.slideId === selectedElement.slideId) {
          return updatedThisSlide[slideIndex++];
        }
        return el;
      });
      pushToHistory(copy);
    }
  };

  // Add Element from Drawer
  // The navbar is one shared header across the whole site: apply to every page, not just the current one
  const handleUpdateNavbar = (updates: Partial<NavbarConfig>) => {
    setPages(prev => prev.map(p => ({ ...p, navbar: { ...p.navbar, ...updates } })));
  };

  const handleAddElement = (
    type: ElementType, 
    customContent?: string, 
    customStyles?: any,
    extraData?: Partial<CanvasElement>
  ) => {
    const newId = `el-${Date.now()}`;
    const defaultConfigs: Record<ElementType, Partial<CanvasElement>> = {
      heading: {
        name: 'عنوان رئيسي',
        width: 480,
        height: 70,
        content: customContent || 'عنوان جديد مميز',
        styles: { fontSize: 26, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'right', ...(customStyles || {}) },
      },
      paragraph: {
        name: 'فقرة نصية',
        width: 460,
        height: 80,
        content: customContent || 'هذا النص تجريبي للتوضيح والشرح، يمكنك استبداله بأي محتوى تفضله بكل سهولة.',
        styles: { fontSize: 14, color: '#4b5563', textAlign: 'right', ...(customStyles || {}) },
      },
      button: {
        name: 'زر تفاعلي',
        width: 160,
        height: 44,
        content: customContent || 'انقر هنا ✦',
        styles: { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold', textAlign: 'center', ...(customStyles || {}) },
      },
      card: {
        name: 'بطاقة خدمة',
        width: 290,
        height: 220,
        content: customContent || 'خدمة سريعة وموثوقة تقدم أعلى مستويات الجودة والأداء.',
        styles: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', shadow: 'apple', ...(customStyles || {}) },
      },
      image: {
        name: 'إطار صورة',
        width: 340,
        height: 220,
        content: customContent || 'صورة توضيحية',
        styles: { borderRadius: 16, ...(customStyles || {}) },
      },
      input: {
        name: 'حقل إدخال',
        width: 280,
        height: 42,
        content: customContent || 'أدخل بريدك الإلكتروني...',
        styles: { borderRadius: 12, ...(customStyles || {}) },
      },
      table: {
        name: 'جدول',
        width: 380,
        height: 180,
        content: customContent || 'جدول الخدمات',
        styles: { borderRadius: 14, ...(customStyles || {}) },
      },
      divider: {
        name: 'خط فاصل',
        width: 400,
        height: 10,
        content: '',
        styles: { ...(customStyles || {}) },
      },
      badge: {
        name: 'شارة',
        width: 120,
        height: 32,
        content: customContent || 'جديد 2026',
        styles: { borderRadius: 999, ...(customStyles || {}) },
      },
      icon: {
        name: 'أيقونة',
        width: 48,
        height: 48,
        content: customContent || '★',
        styles: { ...(customStyles || {}) },
      },
      shape: {
        name: 'شكل هندسي',
        width: 140,
        height: 140,
        content: customContent !== undefined ? customContent : '',
        styles: { backgroundColor: '#0071e3', borderRadius: 24, ...(customStyles || {}) },
      },
      video: {
        name: 'مشغل فيديو',
        width: 460,
        height: 260,
        content: customContent || 'فيديو تعريفي مميز للمنصة',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        styles: { borderRadius: 20, shadow: 'apple', ...(customStyles || {}) },
      },
      map: {
        name: 'خرائط جوجل',
        width: 420,
        height: 250,
        content: customContent || 'الرياض، المملكة العربية السعودية',
        mapLocation: 'الرياض، المملكة العربية السعودية',
        styles: { borderRadius: 20, shadow: 'apple', ...(customStyles || {}) },
      },
      pricing: {
        name: 'أسعار',
        width: 320,
        height: 380,
        content: customContent || 'باقة الانطلاق للأعمال',
        pricingPlan: 'الباقة المتقدمة',
        pricingPrice: '199 ر.س',
        pricingPeriod: 'شهرياً',
        pricingFeatures: ['تصميم متجاوب كامل', 'دعم فني على مدار الساعة', 'استضافة سحابية سريعة', 'نطاق مجاني مخصص'],
        styles: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', shadow: 'apple', ...(customStyles || {}) },
      },
      calendar: {
        name: 'حجز مواعيد',
        width: 360,
        height: 360,
        content: customContent || 'حجز استشارة أو موعد',
        calendarTitle: 'حجز موعد استشارة',
        calendarSlots: ['09:00 ص', '11:30 ص', '02:00 م', '04:30 م'],
        styles: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', shadow: 'apple', ...(customStyles || {}) },
      },
      html: {
        name: 'حاوية Html',
        width: 380,
        height: 180,
        content: customContent || '<div style="padding: 16px; text-align: center; color: #0071e3; font-weight: bold;">محتوى HTML مخصص ✦</div>',
        htmlCode: '<div style="padding: 16px; text-align: center; color: #0071e3; font-weight: bold;">محتوى HTML مخصص ✦</div>',
        styles: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', ...(customStyles || {}) },
      },
      gallery: {
        name: 'معرض صور 🖼️',
        width: 540,
        height: 380,
        content: customContent || 'معرض الصور التفاعلي',
        galleryConfig: {
          layout: 'top-main',
          activeImageIndex: 0,
          showThumbnails: true,
          gap: 8,
          borderRadius: 12,
          objectFit: 'cover',
          items: [
            {
              id: 'img-1',
              url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
              title: 'بحيرة الشفق والجبال الخضراء'
            },
            {
              id: 'img-2',
              url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200&auto=format&fit=crop&q=80',
              title: 'قمم الثلوج والشتاء الهادئ'
            },
            {
              id: 'img-3',
              url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
              title: 'ضباب فوق غابة الصنوبر'
            },
            {
              id: 'img-4',
              url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop&q=80',
              title: 'شروق الشمس الساحر بين الأشجار'
            },
            {
              id: 'img-5',
              url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80',
              title: 'سهول وتلال خضراء بديعة'
            }
          ]
        },
        styles: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', shadow: 'apple', ...(customStyles || {}) },
      },
      mask: {
        name: 'صورة بشكل',
        width: 220,
        height: 220,
        content: customContent || 'circle',
        styles: { backgroundColor: '#ffffff', ...(customStyles || {}) },
      },
      cart: {
        name: 'سلة المشتريات',
        width: 900,
        height: 480,
        content: '',
        styles: { color: '#B4532A', ...(customStyles || {}) },
      },
      shopProducts: {
        name: 'منتجات المتجر',
        width: 1100,
        height: 900,
        content: '',
        styles: { color: '#B4532A', ...(customStyles || {}) },
      },
      shopSearch: {
        name: 'بحث في المتجر',
        width: 640,
        height: 56,
        content: 'ابحث عن منتج...',
        styles: { color: '#B4532A', ...(customStyles || {}) },
      },
      carListings: {
        name: 'سيارات المعرض',
        width: 1100,
        height: 900,
        content: '',
        carLayout: 'grid',
        carLimit: 9,
        styles: { color: '#C8102E', ...(customStyles || {}) },
      },
      carSearch: {
        name: 'بحث عن سيارة',
        width: 700,
        height: 60,
        content: 'ابحث بالماركة أو الموديل أو السنة...',
        shopSearchStyle: 'pill',
        styles: { color: '#C8102E', ...(customStyles || {}) },
      },
      menuList: {
        name: 'منيو المطعم',
        width: 1100,
        height: 900,
        content: '',
        menuLayout: 'grid',
        styles: { color: '#B5562B', ...(customStyles || {}) },
      },
      lottie: {
        name: 'رسم متحرك',
        width: 160,
        height: 160,
        content: '',
        lottieId: 'success',
        styles: { ...(customStyles || {}) },
      },
      menuCart: {
        name: 'سلة الطلب',
        width: 1100,
        height: 600,
        content: '',
        styles: { color: '#B5562B', ...(customStyles || {}) },
      },
      checkout: {
        name: 'بطاقة الطلب',
        width: 560,
        height: 740,
        content: '',
        shopAccent: '#B4532A',
        styles: { color: '#2A1F1A', backgroundColor: '#FFFFFF', borderRadius: 24, ...(customStyles || {}) },
      },
    };

    const cfg = defaultConfigs[type] || defaultConfigs.card;
    const newElement: CanvasElement = {
      id: newId,
      name: extraData?.name || cfg.name || 'عنصر جديد',
      type,
      x: extraData?.x ?? (100 + (elements.length * 15) % 200),
      y: extraData?.y ?? (90 + (elements.length * 20) % 200),
      width: extraData?.width || cfg.width || 200,
      height: extraData?.height || cfg.height || 60,
      content: extraData?.content ?? (customContent !== undefined ? customContent : (cfg.content || '')),
      slideId: activeSlideId,
      styles: { ...(cfg.styles || {}), ...(extraData?.styles || {}) },
      ...extraData,
    };

    const updated = [...elements, newElement];
    setSelectedElementId(newId);
    pushToHistory(updated);
  };

  const handleAddGroup = (
    containerShape: Partial<CanvasElement>,
    childElements: Partial<CanvasElement>[]
  ) => {
    const timestamp = Date.now();
    const containerId = `el-${timestamp}`;
    
    // Calculate bounding box of children relative to (0,0) to dynamically size the group shape container
    let maxChildRight = 0;
    let maxChildBottom = 0;
    childElements.forEach(child => {
      const right = (child.x ?? 0) + (child.width ?? 100);
      const bottom = (child.y ?? 0) + (child.height ?? 40);
      if (right > maxChildRight) maxChildRight = right;
      if (bottom > maxChildBottom) maxChildBottom = bottom;
    });

    const finalWidth = Math.max(containerShape.width ?? 320, maxChildRight + 24);
    const finalHeight = Math.max(containerShape.height ?? 300, maxChildBottom + 24);

    const finalContainer: CanvasElement = {
      ...containerShape,
      id: containerId,
      type: 'shape',
      name: containerShape.name || 'مجموعة جديدة',
      content: containerShape.content || '',
      x: containerShape.x ?? 120,
      y: containerShape.y ?? 120,
      width: finalWidth,
      height: finalHeight,
      slideId: activeSlideId,
      isGroupContainer: true,
      styles: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        shadow: 'apple',
        ...(containerShape.styles || {})
      }
    };

    const finalChildren: CanvasElement[] = childElements.map((child, idx) => {
      const childId = `el-${timestamp}-${idx}`;
      
      const childWidth = child.width ?? 100;
      const childHeight = child.height ?? 40;

      // Force relative coordinates to sit perfectly within final container boundaries with a safety padding
      const relativeX = child.x ?? 0;
      const relativeY = child.y ?? 0;
      const safeX = Math.max(12, Math.min(relativeX, finalWidth - childWidth - 12));
      const safeY = Math.max(12, Math.min(relativeY, finalHeight - childHeight - 12));

      return {
        ...child,
        id: childId,
        type: child.type || 'paragraph',
        name: child.name || 'عنصر في مجموعة',
        content: child.content || '',
        x: (containerShape.x ?? 120) + safeX,
        y: (containerShape.y ?? 120) + safeY,
        width: childWidth,
        height: childHeight,
        slideId: activeSlideId,
        styles: {
          color: '#1d1d1f',
          fontSize: 14,
          ...(child.styles || {})
        }
      };
    });

    const updated = [...elements, finalContainer, ...finalChildren];
    setSelectedElementId(containerId);
    pushToHistory(updated);
  };

  // Slides management
  const handleAddSlide = () => {
    const slideNumber = currentPage.slides.length + 1;
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      name: `شريحة ${slideNumber}`,
      height: 520,
      backgroundColor: '#ffffff',
    };
    const updatedSlides = [...currentPage.slides, newSlide];
    setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
    setActiveSlideId(newSlide.id);
  };

  const handleCopyCurrentSlide = (slideId: string) => {
    const slideToCopy = currentPage.slides.find(s => s.id === slideId);
    if (!slideToCopy) return;

    const newSlideId = `slide-${Date.now()}`;
    const newSlide: Slide = {
      ...slideToCopy,
      id: newSlideId,
      name: `${slideToCopy.name} (نسخة)`,
    };

    // Duplicate all elements on this slide!
    const slideElements = elements.filter(el => el.slideId === slideId);
    const duplicatedElements = slideElements.map((el, idx) => ({
      ...el,
      id: `el-${Date.now()}-${idx}`,
      slideId: newSlideId,
    }));

    const updatedSlides = [...currentPage.slides, newSlide];
    setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
    setElements([...elements, ...duplicatedElements]);
    setActiveSlideId(newSlideId);
  };

  const handleAddSlideTemplate = (template: { name: string; height: number; backgroundColor: string; backgroundImage?: string; backgroundOpacity?: number; backgroundAttachment?: 'scroll' | 'fixed'; elements: any[] }) => {
    const newSlideId = `slide-${Date.now()}`;
    const newSlide: Slide = {
      id: newSlideId,
      name: template.name,
      height: template.height,
      backgroundColor: template.backgroundColor,
      ...(template.backgroundImage ? {
        backgroundImage: template.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundOpacity: template.backgroundOpacity ?? 1,
        backgroundAttachment: template.backgroundAttachment || 'scroll',
      } : {}),
    };

    const newElements: CanvasElement[] = template.elements.map((el, idx) => {
      let imageUrl = el.imageUrl;
      if (el.type === 'image' && !imageUrl && el.content && (el.content.startsWith('http') || el.content.startsWith('data:'))) {
        imageUrl = el.content;
      }
      return {
        ...el,
        imageUrl,
        id: `el-${Date.now()}-${idx}`,
        slideId: newSlideId,
      };
    });

    const updatedSlides = [...currentPage.slides, newSlide];
    setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
    setElements([...elements, ...newElements]);
    setActiveSlideId(newSlideId);
  };

  const handleDeleteSlide = (slideId: string) => {
    if (currentPage.slides.length <= 1) return;
    const updatedSlides = currentPage.slides.filter(s => s.id !== slideId);
    setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
    if (activeSlideId === slideId) {
      setActiveSlideId(updatedSlides[0].id);
    }
  };

  const handleUpdateSlideHeight = (slideId: string, height: number) => {
    const slide = currentPage.slides.find(s => s.id === slideId);
    // In mobile view a slide that has a phone layout is resized in that layout only.
    const isMobileLayout = previewMode === 'mobile' && !!slide?.mobileHeight && elements.some(el => el.slideId === slideId && el.mobile);
    const updatedSlides = currentPage.slides.map(s => 
      s.id === slideId ? (isMobileLayout ? { ...s, mobileHeight: height } : { ...s, height }) : s
    );
    setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
  };

  // "تنسيق الموبايل": arranges every page's elements for phones (desktop layout untouched),
  // collapses the navbar's page names into a hamburger menu on phones, and switches to mobile
  // view so the result is visible right away. Undo reverts the elements.
  const handleArrangeForMobile = () => {
    const allSlides = pages.flatMap(p => p.slides);
    const { elements: arrangedElements, slides: arrangedSlides } = arrangeForMobile(allSlides, elements);
    const arrangedSlideById = new Map(arrangedSlides.map(s => [s.id, s]));
    pushToHistory(arrangedElements);
    setPages(pages.map(p => ({
      ...p,
      slides: p.slides.map(s => arrangedSlideById.get(s.id) || s),
      navbar: { ...p.navbar, mobileMenu: true },
    })));
    setPreviewMode('mobile');
  };

  // Pages management
  const handleAddPage = (name: string) => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      name,
      slug: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
      navbar: { ...currentPage.navbar },
      slides: [
        {
          id: `slide-${Date.now()}`,
          name: 'شريحة ١',
          height: 540,
          backgroundColor: '#ffffff',
        }
      ],
    };
    setPages([...pages, newPage]);
    setActivePageId(newPage.id);
    setActiveSlideId(newPage.slides[0].id);
  };

  const handleCopyCurrentPage = (pageId: string) => {
    const pageToCopy = pages.find(p => p.id === pageId);
    if (!pageToCopy) return;

    const newPageId = `page-${Date.now()}`;
    
    // We must map all slides and duplicate all elements belonging to those slides
    const duplicatedSlides: Slide[] = [];
    const newElementsToAppend: CanvasElement[] = [];

    pageToCopy.slides.forEach((slide, sIdx) => {
      const newSlideId = `slide-${Date.now()}-${sIdx}`;
      duplicatedSlides.push({
        ...slide,
        id: newSlideId,
      });

      const slideElements = elements.filter(el => el.slideId === slide.id);
      slideElements.forEach((el, elIdx) => {
        newElementsToAppend.push({
          ...el,
          id: `el-${Date.now()}-${sIdx}-${elIdx}`,
          slideId: newSlideId,
        });
      });
    });

    const newPage: Page = {
      ...pageToCopy,
      id: newPageId,
      name: `${pageToCopy.name} (نسخة)`,
      slug: `/${pageToCopy.name.toLowerCase().replace(/\s+/g, '-')}-copy`,
      slides: duplicatedSlides,
    };

    setPages([...pages, newPage]);
    setElements([...elements, ...newElementsToAppend]);
    setActivePageId(newPageId);
    setActiveSlideId(duplicatedSlides[0].id);
  };

  const handleAddPageTemplate = (template: { name: string; slides: { name: string; height: number; backgroundColor: string; elements: any[] }[] }) => {
    const newPageId = `page-${Date.now()}`;
    
    const duplicatedSlides: Slide[] = [];
    const newElementsToAppend: CanvasElement[] = [];

    template.slides.forEach((slideTemplate, sIdx) => {
      const newSlideId = `slide-${Date.now()}-${sIdx}`;
      duplicatedSlides.push({
        id: newSlideId,
        name: slideTemplate.name,
        height: slideTemplate.height,
        backgroundColor: slideTemplate.backgroundColor,
      });

      slideTemplate.elements.forEach((el, elIdx) => {
        newElementsToAppend.push({
          ...el,
          id: `el-${Date.now()}-${sIdx}-${elIdx}`,
          slideId: newSlideId,
        });
      });
    });

    const newPage: Page = {
      id: newPageId,
      name: template.name,
      slug: `/${template.name.toLowerCase().replace(/\s+/g, '-')}`,
      navbar: { ...currentPage.navbar },
      slides: duplicatedSlides,
    };

    setPages([...pages, newPage]);
    setElements([...elements, ...newElementsToAppend]);
    setActivePageId(newPageId);
    setActiveSlideId(duplicatedSlides[0].id);
  };

  // Applies a ready-made multi-page site template (pages linked through one shared navbar).
  // This REPLACES the whole site (all current pages/elements) rather than appending, since it
  // is a full starter-site action. Template ids get a unique suffix, and every page/slide
  // reference (navbar items, navbar CTA, element links) is remapped to the new ids.
  const applySiteTemplate = (
    template: { pages: Page[]; elements: CanvasElement[] },
    confirmMessage: string
  ) => {
    if (!window.confirm(confirmMessage)) return;

    const { pages: templatePages, elements: templateElements } = template;
    const suffix = Date.now();

    const idMap: Record<string, string> = {};
    templatePages.forEach((p) => { idMap[p.id] = `${p.id}-${suffix}`; });
    templatePages.forEach((p) => {
      p.slides.forEach((s) => { idMap[s.id] = `${s.id}-${suffix}`; });
    });

    const newPages: Page[] = templatePages.map((p) => ({
      ...p,
      id: idMap[p.id],
      slides: p.slides.map((s) => ({ ...s, id: idMap[s.id] })),
      navbar: {
        ...p.navbar,
        items: p.navbar.items.map((item) => ({
          ...item,
          linkTargetId: item.linkTargetId ? (idMap[item.linkTargetId] || item.linkTargetId) : item.linkTargetId,
        })),
        ctaLinkTargetId: p.navbar.ctaLinkTargetId ? (idMap[p.navbar.ctaLinkTargetId] || p.navbar.ctaLinkTargetId) : p.navbar.ctaLinkTargetId,
      },
    }));

    const newElements: CanvasElement[] = templateElements.map((el) => {
      const linkTargetId = el.linkTargetId ? (idMap[el.linkTargetId] || el.linkTargetId) : el.linkTargetId;
      const isInternalLink = el.linkType === 'page' || el.linkType === 'slide';
      return {
        ...el,
        id: `${el.id}-${suffix}`,
        slideId: idMap[el.slideId] || el.slideId,
        linkTargetId,
        linkUrl: isInternalLink && linkTargetId ? `#${el.linkType}-${linkTargetId}` : el.linkUrl,
      };
    });

    setPages(newPages);
    setElements(newElements);
    setActivePageId(newPages[0].id);
    setActiveSlideId(newPages[0].slides[0].id);
  };

  const handleApplyFreeStarterTemplate = () => applySiteTemplate(
    getFreeStarterTemplate(),
    'سيتم استبدال كل صفحات موقعك الحالية بقالب جاهز من خمس صفحات (مدخل، من نحن، أعمالنا، الأسعار، اتصال). هل تريد المتابعة؟'
  );

  const handleApplyOnlineShopTemplate = () => applySiteTemplate(
    getOnlineShopTemplate(),
    'سيتم استبدال كل صفحات موقعك الحالية بقالب متجر إلكتروني من خمس صفحات (الرئيسية، المنتجات، السلة، طريقة الطلب، تواصل معنا). هل تريد المتابعة؟'
  );

  const handleUpdatePage = (updates: Partial<Page>) => {
    setPages(pages.map(p => p.id === currentPage.id ? { ...p, ...updates } : p));
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) return;
    const indexToDelete = pages.findIndex(p => p.id === pageId);
    const updatedPages = pages.filter(p => p.id !== pageId);
    
    // Also delete all elements associated with the deleted page's slides
    const pageToDelete = pages.find(p => p.id === pageId);
    const slideIdsToDelete = pageToDelete ? pageToDelete.slides.map(s => s.id) : [];
    const updatedElements = elements.filter(el => !slideIdsToDelete.includes(el.slideId));
    
    setPages(updatedPages);
    setElements(updatedElements);
    
    if (activePageId === pageId) {
      const nextActiveIndex = indexToDelete > 0 ? indexToDelete - 1 : 0;
      const nextActivePage = updatedPages[nextActiveIndex];
      setActivePageId(nextActivePage.id);
      setActiveSlideId(nextActivePage.slides[0].id);
    }
  };

  const handleMovePage = (pageId: string, direction: 'up' | 'down') => {
    const idx = pages.findIndex(p => p.id === pageId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= pages.length) return;

    const updated = [...pages];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;

    setPages(updated);
  };

  const handleMoveSlide = (slideId: string, direction: 'up' | 'down') => {
    const slideIndex = currentPage.slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) return;
    const newIdx = direction === 'up' ? slideIndex - 1 : slideIndex + 1;
    if (newIdx < 0 || newIdx >= currentPage.slides.length) return;

    const updatedSlides = [...currentPage.slides];
    const temp = updatedSlides[slideIndex];
    updatedSlides[slideIndex] = updatedSlides[newIdx];
    updatedSlides[newIdx] = temp;

    setPages(pages.map(p => p.id === currentPage.id ? { ...p, slides: updatedSlides } : p));
  };

  const handleApplyPagePalette = (palette: [string, string, string, string, string]) => {
    // palette: [0: bg, 1: card/box, 2: border, 3: text, 4: accent/brand]
    const [bg, card, border, text, accent] = palette;

    // 1. Update current page slides background & navbar colors
    setPages(pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          colorPalette: palette,
          navbar: {
            ...p.navbar,
            bgColor: bg,
            textColor: text,
          },
          slides: p.slides.map((s, idx) => ({
            ...s,
            backgroundColor: idx === 0 ? bg : (idx % 2 === 0 ? bg : '#ffffff'),
          })),
        };
      }
      return p;
    }));

    // 2. Harmonize elements on the canvas
    const updatedElements = elements.map(el => {
      const styles = { ...el.styles };
      if (el.type === 'heading' || el.type === 'paragraph') {
        styles.color = text;
      } else if (el.type === 'button') {
        styles.backgroundColor = accent;
        styles.color = '#ffffff';
      } else if (el.type === 'card') {
        styles.backgroundColor = card;
        styles.borderColor = border;
      }
      return { ...el, styles };
    });
    pushToHistory(updatedElements);
  };

  const handleUpdateSlideDivider = (slideId: string, shape: SlideDividerShape) => {
    setPages(pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          slides: p.slides.map(s => s.id === slideId ? { ...s, dividerShape: shape } : s)
        };
      }
      return p;
    }));
  };

  const handleUpdateSlideBackground = (
    slideId: string, 
    bg: { backgroundColor?: string; backgroundImage?: string; backgroundSize?: 'cover' | 'contain' | 'auto'; backgroundPosition?: string; backgroundRepeat?: string; backgroundAttachment?: 'scroll' | 'fixed' }
  ) => {
    setPages(pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          slides: p.slides.map(s => s.id === slideId ? { ...s, ...bg } : s)
        };
      }
      return p;
    }));
  };

  const handleUpdateSlideBorder = (
    slideId: string,
    border: { borderColor?: string; borderWidth?: number; borderRadius?: number; borderStyle?: string }
  ) => {
    setPages(pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          slides: p.slides.map(s => s.id === slideId ? { ...s, ...border } : s)
        };
      }
      return p;
    }));
  };

  const handleUpdateSlideOpacity = (
    slideId: string,
    opacity: { opacity?: number; backgroundOpacity?: number }
  ) => {
    setPages(pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          slides: p.slides.map(s => s.id === slideId ? { ...s, ...opacity } : s)
        };
      }
      return p;
    }));
  };

  const handleUpdateSlideGlow = (
    slideId: string,
    glow: { 
      glowColor?: string; 
      glowIntensity?: number; 
      glowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
      innerGlowColor?: string; 
      innerGlowIntensity?: number; 
      innerGlowPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    }
  ) => {
    setPages(pages.map(p => {
      if (p.id === currentPage.id) {
        return {
          ...p,
          slides: p.slides.map(s => s.id === slideId ? { ...s, ...glow } : s)
        };
      }
      return p;
    }));
  };

  if (isFirebaseLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <span className="text-xs text-neutral-400 font-bold animate-pulse">جاري الاتصال السحابي...</span>
      </div>
    );
  }

  if (isAuthActive) {
    return (
      <StandardAuth
        onLoginWithGoogle={handleLogin}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  if (!isProjectChosen) {
    return (
      <ProjectChooser
        onChoose={handleChooseProject}
        hasShop={hasShop}
        hasCars={hasCars}
        hasRestaurant={hasRestaurant}
        loadingType={projectLoading}
      />
    );
  }

  // The editing icons: the bar under the top bar on a narrow screen, the rail beside the panel on a wide one.
  const editBarProps = {
    selectedElement,
    selectedSlide: currentSlide,
    onUpdateElementName: handleUpdateElementName,
    onSelectTool: handleSelectTool,
    onToggleBold: handleToggleBold,
    onToggleItalic: handleToggleItalic,
    onToggleUnderline: handleToggleUnderline,
    onCycleAlignment: handleCycleAlignment,
    onToggleBulletList: handleToggleBulletList,
    onToggleNumericList: handleToggleNumericList,
    onToggleLock: handleToggleLock,
    onDuplicate: () => selectedElementId && handleDuplicateElement(selectedElementId),
    onMoveLayerUp: handleMoveLayerUp,
    onMoveLayerDown: handleMoveLayerDown,
    onCopyFormat: handleCopyFormat,
    isFormatCopied: !!copiedFormat,
    onToggleGroupContainer: handleToggleGroupContainer,
    onUpdateElement: handleUpdateElementById,
    isNavbarSelected,
  };
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col antialiased selection:bg-[#0071e3]/15 selection:text-[#0071e3]">
      {/* Modal for Firebase Domain Authorization Guidance */}
      {authErrorModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 text-right relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 text-2xl mx-auto">
              🌐
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              {authErrorModal.title}
            </h3>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line text-center">
              {authErrorModal.message}
            </p>

            {authErrorModal.domain && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-right">
                <div className="text-xs text-gray-500 font-semibold mb-2">
                  يجب إضافة كلا النطاقين التاليين لضمان عمل الدخول في بيئة التطوير والمعاينة:
                </div>

                {/* Dev Domain */}
                <div className="mb-2">
                  <div className="text-[10px] text-gray-600 font-bold mb-1">1. نطاق المحرر الحالي (Dev):</div>
                  <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-800 break-all select-all">
                    <span>ais-dev-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('ais-dev-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app');
                        alert('تم نسخ نطاق المحرر (Dev) بنجاح!');
                      }}
                      className="shrink-0 bg-[#0071e3] hover:bg-[#0077ed] text-white px-2.5 py-1 rounded-md text-[11px] font-sans transition-all cursor-pointer"
                    >
                      نسخ
                    </button>
                  </div>
                </div>

                {/* Pre Domain */}
                <div className="mb-3">
                  <div className="text-[10px] text-gray-600 font-bold mb-1">2. نطاق المعاينة والنشر (Live):</div>
                  <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-800 break-all select-all">
                    <span>ais-pre-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('ais-pre-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app');
                        alert('تم نسخ نطاق المعاينة (Live) بنجاح!');
                      }}
                      className="shrink-0 bg-[#0071e3] hover:bg-[#0077ed] text-white px-2.5 py-1 rounded-md text-[11px] font-sans transition-all cursor-pointer"
                    >
                      نسخ
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 space-y-1">
                  <p className="font-bold">⚠️ ملاحظة مهمة جداً:</p>
                  <p>تأكد من حرف <strong>h</strong> في كلمة <strong>s7v6hg</strong> (وليست lg).</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setAuthErrorModal(null)}
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 
        Fixed and floating bars at the top:
        الواجهة الأساسية للعمل هي شريط تحكم اساسي وتحته شريط تعديل 
        مهم جدا الشريطين ثابتين وعائمين يظهران دائما في اعلى الصفحة مهما نزل المستخدم بشريط السحب الى اسفل
      */}
      {/* z-index kept above the page's own navbar (which can be set sticky with z-index 100000 by
          the user inside the canvas) so the app's own control bar/edit bar always stays on top of it. */}
      <div className="sticky top-0 z-[999999] w-full shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        {/* 1. Primary Control Bar */}
        <ControlBar
          currentPage={currentPage}
          pages={pages}
          onSelectPage={setActivePageId}
          onAddPage={handleAddPage}
          previewMode={previewMode}
          onChangePreviewMode={setPreviewMode}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onArrangeForMobile={handleArrangeForMobile}
          onOpenPageSettings={() => handleSelectTool('page-settings')}
          onTogglePreview={() => {
            const nextPreviewState = !isPreviewActive;
            setIsPreviewActive(nextPreviewState);
            if (nextPreviewState) {
              setSelectedElementId(null);
              setIsRightDrawerOpen(false);
            }
          }}
          isPreviewActive={isPreviewActive}
          user={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          isSaving={isSavingCloud}
          onOpenWorkspaceHub={() => setIsWorkspaceHubOpen(true)}
          onManualSave={handleManualSave}
          projectName={currentPage.navbar.brandName || PROJECT_KIND_LABEL[project]}
          onOpenProjectSettings={() => handleSelectTool('project-settings')}
          projectLabel={project === 'shop' ? 'Shops' : project === 'cars' ? 'Cars' : project === 'restaurant' ? 'Restaurant' : undefined}
          onOpenProjects={handleOpenProjects}
        />

        {/* 2. Secondary Edit Bar directly beneath (narrow screens; wide ones dock it beside the panel) */}
        {!isPreviewActive && !isDocked && !isSheet && <EditBar {...editBarProps} />}
      </div>

      {/* Main Operations Area (ساحة العمليات): left of the docked panel and its icons */}
      <div
        className="flex-1 flex relative overflow-hidden"
        style={
          isSheet
            ? { paddingBottom: EDITOR_BAR_HEIGHT }
            : isDocked
              ? { marginRight: (isRightDrawerOpen ? dockedPanelWidth : 0) + EDIT_RAIL_WIDTH, transition: 'margin-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }
              : undefined
        }
      >
        <RestaurantDataContext.Provider value={project === 'restaurant' ? restaurantAdmin : null}>
        <RestaurantOrderContext.Provider value={project === 'restaurant' ? submitRestaurantOrder : null}>
        <CarDataContext.Provider value={project === 'cars' ? carAdmin : null}>
        <CarRequestContext.Provider value={project === 'cars' ? submitCarRequest : null}>
        <ShopDataContext.Provider value={project === 'shop' ? shopAdmin : null}>
        <ShopUpdateContext.Provider value={project === 'shop' ? updateShopAdmin : null}>
        <CanvasWorkspace
          previewMode={previewMode}
          slides={currentPage.slides}
          activeSlideId={activeSlideId}
          elements={elements}
          selectedElementId={isPreviewActive ? null : selectedElementId}
          onSelectElement={handleSelectElement}
          onSelectSlide={handleSelectSlide}
          onSelectPage={setActivePageId}
          allPages={pages}
          isNavbarSelected={isNavbarSelected}
          onSelectNavbar={handleSelectNavbar}
          onUpdateElementPosition={handleUpdateElementPosition}
          onUpdateElementSize={handleUpdateElementSize}
          onUpdateElementRotation={handleUpdateElementRotation}
          onCommitElementRotation={handleCommitElementRotation}
          onUpdateElementContent={handleUpdateElementContent}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onUpdateElement={handleUpdateElementById}
          onAddElement={handleAddElement}
          onUpdateNavbar={handleUpdateNavbar}
          linkCopySource={isPreviewActive ? null : linkCopySource}
          onApplyLinkCopy={(id) => {
            if (!linkCopySource?.link) return;
            const { linkType, linkTargetId, linkUrl } = linkCopySource.link;
            handleUpdateElementById(id, { linkType, linkTargetId, linkUrl, contactType: undefined, contactValue: undefined });
            setLinkCopySource(null);
          }}
          onCancelLinkCopy={() => setLinkCopySource(null)}
          onUpdateSlideHeight={handleUpdateSlideHeight}
          activeTableCell={activeTableCell}
          onSelectTableCell={setActiveTableCell}
          navbar={currentPage.navbar}
          isPreviewActive={isPreviewActive}
          activePageId={activePageId}
          chromeHeight={isDocked ? 56 : 104}
          renderSelectionBar={renderSelectionBar}
        />
        </ShopUpdateContext.Provider>
        </ShopDataContext.Provider>
        </CarRequestContext.Provider>
        </CarDataContext.Provider>
        </RestaurantOrderContext.Provider>
        </RestaurantDataContext.Provider>
        {isCanvasLoading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs z-50 flex flex-col items-center justify-center select-none text-right font-sans">
            <Loader2 className="w-9 h-9 text-[#0071e3] animate-spin mb-3" />
            <span className="text-xs font-black text-neutral-600 animate-pulse">جاري تحميل وتحديث البيانات في ساحة العمليات...</span>
          </div>
        )}
      </div>

      <CommandPalette open={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} commands={isPaletteOpen ? paletteCommands() : []} />

      {/* The editing icons: a column beside the docked panel, or a bar along the bottom of a phone */}
      {isDocked && (
        <div
          className="fixed z-[999999]"
          style={
            isSheet
              ? { left: 0, right: 0, bottom: 0, height: EDITOR_BAR_HEIGHT }
              : { top: 56, bottom: 0, width: EDIT_RAIL_WIDTH, right: isRightDrawerOpen ? dockedPanelWidth : 0, transition: 'right 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }
          }
        >
          <EditorColumn
            horizontal={isSheet}
            groups={inspectorGroups(currentInspectorTarget())}
            target={currentInspectorTarget()}
            activeGroup={isRightDrawerOpen && !isChatActive && drawerTab === 'tool' && drawerSection === 'inspector' ? inspectorGroup : null}
            // Every tab but Wee AI puts the chat away and shows its own settings in the panel.
            onPickGroup={(g, shortcut) => {
              setIsChatActive(false);
              showInspector(g, shortcut);
            }}
            onAdd={() => {
              if (isChatActive) {
                setIsChatActive(false);
                if (isRightDrawerOpen && drawerTab === 'tool' && drawerSection === 'elements') return;
              }
              handleSelectTool('elements');
            }}
            isAddShown={isRightDrawerOpen && !isChatActive && drawerTab === 'tool' && (drawerSection === 'elements' || drawerSection === 'add-text' || drawerSection === 'add-image')}
            onStructure={() => {
              if (isChatActive) {
                setIsChatActive(false);
                setTabRequest((r) => ({ tab: 'structure', n: r.n + 1 }));
                setIsRightDrawerOpen(true);
                return;
              }
              if (isRightDrawerOpen && drawerTab === 'structure') {
                setIsRightDrawerOpen(false);
                return;
              }
              setTabRequest((r) => ({ tab: 'structure', n: r.n + 1 }));
              setIsRightDrawerOpen(true);
            }}
            isStructureShown={isRightDrawerOpen && !isChatActive && drawerTab === 'structure'}
            admin={
              project === 'shop' ? { label: 'إدارة المتجر', onOpen: () => setAdminOpenRequest((n) => n + 1) }
              : project === 'cars' ? { label: 'إدارة معرض السيارات', onOpen: () => setAdminOpenRequest((n) => n + 1) }
              : project === 'restaurant' ? { label: 'إدارة المطعم', onOpen: () => setAdminOpenRequest((n) => n + 1) }
              : null
            }
            onWeeAi={() => {
              setIsChatActive((v) => !v);
              setIsRightDrawerOpen(true);
            }}
            isWeeAiOpen={isRightDrawerOpen && isChatActive}
            isPanelOpen={isRightDrawerOpen}
            onTogglePanel={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
            onSearch={() => setIsPaletteOpen(true)}
          />
        </div>
      )}

      {/* Right Control Drawer: docked on a wide screen, floating over the canvas on a narrow one */}
      <RestaurantDataContext.Provider value={project === 'restaurant' ? restaurantAdmin : null}>
      <RightDrawer
        isShopProject={project === 'shop'}
        isCarProject={project === 'cars'}
        isRestaurantProject={project === 'restaurant'}
        isOpen={isRightDrawerOpen}
        onToggle={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
        onClose={() => setIsRightDrawerOpen(false)}
        activeSection={drawerSection}
        onSelectSection={setDrawerSection}
        pages={pages}
        currentPage={currentPage}
        onSelectPage={setActivePageId}
        slides={currentPage.slides}
        activeSlideId={activeSlideId}
        onSelectSlide={handleSelectSlide}
        isNavbarSelected={isNavbarSelected}
        onAddSlide={handleAddSlide}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onMovePage={handleMovePage}
        onMoveSlide={handleMoveSlide}
        onCopyCurrentSlide={handleCopyCurrentSlide}
        onCopyCurrentPage={handleCopyCurrentPage}
        onAddSlideTemplate={handleAddSlideTemplate}
        onAddPageTemplate={handleAddPageTemplate}
        onApplyFreeStarterTemplate={handleApplyFreeStarterTemplate}
        onApplyOnlineShopTemplate={handleApplyOnlineShopTemplate}
        onDeleteSlide={handleDeleteSlide}
        onUpdateSlideHeight={handleUpdateSlideHeight}
        onAddElement={(type, customContent, customStyles, extraData) => {
          handleAddElement(type, customContent, customStyles, extraData);
        }}
        onAddGroup={handleAddGroup}
        linkCopySourceId={linkCopySource?.id}
        onStartLinkCopy={setLinkCopySource}
        navbar={currentPage.navbar}
        onUpdateNavbar={handleUpdateNavbar}
        selectedElement={selectedElement}
        elements={elements}
        onSelectElement={handleSelectElement}
        onUpdateElementStyles={handleUpdateElementStyles}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onDuplicateElement={handleDuplicateElement}
        onToggleLock={handleToggleLock}
        onUpdatePage={handleUpdatePage}
        onApplyPagePalette={handleApplyPagePalette}
        onUpdateSlideDivider={handleUpdateSlideDivider}
        onUpdateSlideBackground={handleUpdateSlideBackground}
        onUpdateSlideBorder={handleUpdateSlideBorder}
        onUpdateSlideOpacity={handleUpdateSlideOpacity}
        onUpdateSlideGlow={handleUpdateSlideGlow}
        isFormatCopied={!!copiedFormat}
        onMoveLayerUp={handleMoveLayerUp}
        onMoveLayerDown={handleMoveLayerDown}
        onMoveLayerToFront={handleMoveLayerToFront}
        onMoveLayerToBack={handleMoveLayerToBack}
        isPreviewActive={isPreviewActive}
        userId={activeUserUid}
        userEmail={currentUser?.email || ''}
        onCompleteChat={handleCompleteChat}
        onStepChange={handleStepChange}
        onWriteTexts={handleWriteTexts}
        isWeeAiChatCollapsed={!isChatActive}
        onToggleWeeAiChat={() => setIsChatActive(prev => !prev)}
        dockedWidth={isDocked && !isSheet ? dockedPanelWidth : 0}
        sheet={isSheet}
        headerSlot={
          <SelectionNameInput
            name={selectionName(selectedElement, currentSlide, isNavbarSelected)}
            onRename={handleUpdateElementName}
            disabled={isNavbarSelected}
            className="w-40"
          />
        }
        sectionRequest={sectionRequest}
        addRequest={addRequest}
        onActiveTabChange={setDrawerTab}
        inspectorFocus={inspectorFocus}
        onInspectorGroupChange={setInspectorGroup}
        onCopyFormat={handleCopyFormat}
        onToggleGroupContainer={handleToggleGroupContainer}
        tabRequest={tabRequest}
        projectName={currentPage.navbar.brandName || PROJECT_KIND_LABEL[project]}
        projectSettings={
          <ProjectSettingsSection
            name={currentPage.navbar.brandName || ''}
            onRename={(brandName) => setPages(pages.map(p => ({ ...p, navbar: { ...p.navbar, brandName } })))}
            kindLabel={PROJECT_KIND_LABEL[project]}
            siteUrl={project === 'restaurant' ? restaurantSiteUrl(ownerUid) : undefined}
          />
        }
      />
      </RestaurantDataContext.Provider>

      {/* Online Shop admin: floating gear + admin window */}
      {project === 'shop' && (
        <ShopAdminPanel data={shopAdmin} onChange={updateShopAdmin} openRequest={adminOpenRequest} hideGear={isDocked} />
      )}
      {project === 'cars' && (
        <CarAdminPanel data={carAdmin} onChange={updateCarAdmin} openRequest={adminOpenRequest} hideGear={isDocked} />
      )}
      {project === 'restaurant' && (
        <RestaurantAdminPanel data={restaurantAdmin} onChange={updateRestaurantAdmin} ownerUid={ownerUid} access={access} openRequest={adminOpenRequest} hideGear={isDocked} />
      )}

      {/* Workspace Hub Drawer Panel */}
      <WorkspaceHub isOpen={isWorkspaceHubOpen} onClose={() => setIsWorkspaceHubOpen(false)} />
    </div>
  );
}
