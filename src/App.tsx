import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { becomeDesigner, readDesigner } from './services/designers';
import { DRAFT_SLOTS, deleteDraft, freeSlot, listDrafts, readDraft, saveDraft, type DraftMeta } from './services/designerDrafts';
import { DesignerBar } from './components/designer/DesignerBar';
import { openClientPage, saveClientPage, accessErrorText, activeAccess, revokeAccessCode } from './services/designAccess';
import { useOrderAttention } from './services/orderAttention';
import { GalleryEditBar } from './components/designer/GalleryEditBar';
import { adminEditOpen, adminEditSave, designerEditOpen, designerEditSave, editErrorText, takeAdminHandoff, type EditableDesign } from './services/galleryEdit';
import { DesignerDashboard } from './components/designer/DesignerDashboard';
import { DesignOrdersPanel } from './components/designOrders/DesignOrdersPanel';
import { insertDesign } from './services/fitDesign';
import { recordUse, type GallerySlide } from './services/galleryView';
import { DESIGN_KIND_LABEL, PAGE_MAX_SLIDES, type DesignKind } from './data/slideCategories';
import { ExportSlideModal } from './components/designer/ExportSlideModal';
import { HomePage } from './components/home/HomePage';
import { LawPage } from './components/platform/LawPage';
import { StartPage, type MyProject } from './components/onboarding/StartPage';
import { moveGuestAnswers } from './services/guestAnswers';
import { readCatalogAnswer, sampleRestaurantAdmin, sampleShopAdmin } from './services/sampleItems';
import { PublishModal } from './components/publish/PublishModal';
import { publicDataFor } from './components/publish/publicData';
import { readMySite, siteUrl, unpublishSite } from './services/sites';
import { ShopAdminPanel } from './components/shop/ShopAdminPanel';
import { ShopDataContext, ShopUpdateContext } from './components/shop/store/ShopDataContext';
import { ProjectType, ShopAdminData, createEmptyShopAdmin, normalizeShopAdmin } from './components/shop/shopTypes';
import { laterProjectFields, listProjects, projectDoc } from './services/projects';
import { isFirstOfKind, isProjectKey, kindOf, localPrefixOf, newProjectKey, restaurantIdOf } from './utils/projectKeys';
import { ITEM_WORD, UNLIMITED, overLimit, type PlanLimits } from './utils/planLimits';
import { projectLimits, readGate } from './services/billing';
import { deleteProjectData } from './services/myAccount';
import { AccountPage } from './components/platform/AccountPage';
import { CarAdminPanel } from './components/cars/CarAdminPanel';
import { CarDataContext, CarRequestContext } from './components/cars/store/CarDataContext';
import { submitRequest, RequestInput } from './components/cars/carMoney';
import { CarAdminData, createEmptyCarAdmin, normalizeCarAdmin, exampleCars } from './components/cars/carTypes';
import { getCarShowroomTemplate } from './data/carShowroomTemplate';
import { RestaurantAdminPanel } from './components/restaurant/RestaurantAdminPanel';
import { PageAdminPanel } from './components/pageAdmin/PageAdminPanel';
import { BookingPage, BookingPageContext } from './services/bookings';
import { RatingsSlideContext } from './services/ratings';
import { RestaurantDataContext, RestaurantOrderContext } from './components/restaurant/store/RestaurantDataContext';
import { RestaurantAdminData, MenuOrder, createEmptyRestaurantAdmin, normalizeRestaurantAdmin, exampleRestaurantAdmin, submitOrder } from './components/restaurant/restaurantTypes';
import { dropStaffFromDesign, placeOrder, publishRestaurant, readStaff, restaurantSiteUrl, saveStaff, withoutStaff } from './components/restaurant/restaurantCloud';
import { getRestaurantTemplate } from './data/restaurantTemplate';
import { WeeAIChat } from './components/WeeAIChat';
import { Eye, FileText, FolderTree, LayoutTemplate, Loader2, MousePointer2, Plus, Redo2, Settings, SlidersHorizontal, Store, Undo2 } from 'lucide-react';
import type { WeeAnswers } from './services/weeWriter';
import { applyPageLook, inStartingLook } from './services/applyLook';
import { formatMoney } from './components/shop/adminUi';
import { PageLookPicker, type LookSample } from './components/rightDrawer/PageLookPicker';
import type { PageLook } from './data/pageLooks';
import { KIND_OF_PROJECT, buildPageFromPlan, emptyMainPage, buildProfile, pageAssets, requestPagePlan } from './services/pageBuilder';
import { CommandPalette, PaletteCommand } from './components/CommandPalette';
import { elementDisplayName } from './utils/elementLabels';
import { getOnlineShopTemplate, withLiveProductGrid, withCheckoutLayout } from './data/onlineShopTemplate';
import { withPhoneLayouts } from './utils/mobileLayout';
import { withTemplateGroups } from './utils/templateGroups';
import { withLocalGraphics } from './utils/localGraphics';
import { deserializeElements, sanitizeData, serializeElements } from './utils/elementStorage';

// Firebase Imports
import { auth, db, loginWithGoogle, logoutUser } from './services/firebase';
import { hostAnswerImages, hostLargeImages, largeInlineImages, replaceImages } from './utils/answerImages';
import { isSigningIn, resolveAccountId, takeInviteProblem } from './services/accounts';
import { Access, OWNER_ACCESS, loadAccess } from './services/members';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SelectionBar } from './components/SelectionBar';
import { loadPageFonts } from './services/pageFonts';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';


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

// A fresh tab starts on an empty page; the account's saved page loads after sign-in. The local copies
// (one per account and project) stay: they are the fallback when the cloud save could not happen.
const getInitialPages = (): Page[] => [initialPage];

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

const RESUME_KEY = 'weelink_resume';
// Where this tab was before a refresh (written by the screen effect in App).
const readResume = (): { screen: string; key: string } | null => {
  try {
    const r = JSON.parse(sessionStorage.getItem(RESUME_KEY) || 'null');
    return r && typeof r.screen === 'string' && ['editor', 'account', 'home', 'law'].includes(r.screen) ? { screen: r.screen, key: String(r.key || '') } : null;
  } catch {
    return null;
  }
};

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
  // The free page's admin window (the store kinds have their own, opened by adminOpenRequest).
  const [isPageAdminOpen, setIsPageAdminOpen] = useState(false);

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
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [isAuthActive, setIsAuthActive] = useState<boolean>(true);
  // Weelink opens on «اعمل مشروعك» (the start page); the old home page (search for visitors) is
  // «خدماتنا». What the sign-in screen leads to: 'account' = straight to the person's own page, 'build' = choosing what to build.
  const [isHomeActive, setIsHomeActive] = useState<boolean>(false);
  const afterSignInRef = useRef<'account' | 'build'>('account');
  // «اعمل صفحتك»: the kind of page picked before the questions, then Wee AI's questions. Everyone
  // answers them there (Eyad, 12 Oct); the editor's panel only shows the answers and builds.
  const [isStartActive, setIsStartActive] = useState<boolean>(true);
  // «قانون الصفحة»: a screen of its own under Weelink's top bar.
  const [isLawActive, setIsLawActive] = useState<boolean>(false);
  // «حسابي»: the account page, opened from the person icon (or at the bell's list).
  const [isAccountActive, setIsAccountActive] = useState<boolean>(false);
  const [accountSection, setAccountSection] = useState<'notices' | null>(null);
  // The kind the start page opens on (from «عدّل إجاباتي» in the editor), else the kinds.
  const [startKind, setStartKind] = useState<ProjectType | null>(null);
  // Which form the sign-in screen opens on: the designers' sign-up comes from the start page's fifth card.
  const [authMode, setAuthMode] = useState<'login' | 'designer'>('login');
  // The designers' programme: a designer account (designers/{uid}), and «وضع المصمم»: the editor
  // holds one of the designer's drafts (a single slide) instead of their page; the page's own autosave
  // is off meanwhile (designerModeRef) and the draft saves to designerDrafts/{uid}/items/{slot}.
  const [isDesigner, setIsDesigner] = useState(false);
  const [designerName, setDesignerName] = useState('');
  const [designerMode, setDesignerMode] = useState(false);
  const designerModeRef = useRef(false);
  const draftReadyRef = useRef(false);
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const draftsRef = useRef<DraftMeta[]>([]);
  const [activeSlot, setActiveSlot] = useState('d1');
  const activeSlotRef = useRef('d1');
  const [draftBusy, setDraftBusy] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const orderAttention = useOrderAttention(currentUser && !currentUser.isAnonymous && designerMode ? currentUser.uid : '');
  // The hired designer inside a customer's page with the 3-day code: the editor holds that page, saves go
  // to /api/design-access, and nothing can be exported from it.
  const [clientSession, setClientSession] = useState<{ orderId: string; code: string; expiresAt: number } | null>(null);
  // A designer is inside this account's page with a code (api/design-access): the page is locked here, so a
  // save from this editor cannot overwrite the designer's work. It is read again when the code ends.
  const [designerLock, setDesignerLock] = useState<{ id: string; designerName: string; expiresAt: number } | null>(null);
  const pageLockRef = useRef(false);
  // A design of the gallery open in the editor (services/galleryEdit.ts): the admin edits any of them, a designer their own.
  const [galleryEdit, setGalleryEdit] = useState<{ id: string; as: 'admin' | 'designer'; name: string; kind: DesignKind; status: string; pendingEdit: boolean } | null>(null);
  const galleryEditRef = useRef<{ id: string; as: 'admin' | 'designer'; kind: DesignKind; token?: string } | null>(null);
  const galleryBaselineRef = useRef('');
  const [gallerySaving, setGallerySaving] = useState(false);
  const [gallerySavedNote, setGallerySavedNote] = useState('');
  const clientSessionRef = useRef<{ orderId: string; code: string; expiresAt: number } | null>(null);
  const prevProjectRef = useRef<ProjectType>('page');
  // A page to build as soon as its kind is open in the editor: the questions just finished.
  // The kind whose questions just finished: the editor opens on it with an empty page and Wee AI's panel.
  const afterQuestionsRef = useRef<ProjectType | null>(null);
  // The project just loaded had nothing saved and started from its template.
  const freshProjectRef = useRef(false);
  // What the build after the questions is doing, shown over the editor.
  const [buildNotice, setBuildNotice] = useState<{ busy: boolean; ok?: boolean; message: string; undo?: () => void } | null>(null);
  const [hasBuildBackup, setHasBuildBackup] = useState(false);
  // The kind a guest answered Wee AI for: after signing up, the answers move to the account and it opens.
  const pendingBuildRef = useRef<ProjectType | null>(null);
  // What the signed-in account owns, from the last workspace load (decides where «صفحتي» goes).
  const ownedRef = useRef({ page: false, shop: false, cars: false, restaurant: false });
  const [isChatActive, setIsChatActive] = useState<boolean>(true);
  const [isCanvasLoading, setIsCanvasLoading] = useState<boolean>(false);
  // The account whose workspace is open (see services/accounts.ts); 'mouhamadeiah' while signed out.
  const [activeUserUid, setActiveUserUid] = useState<string>('mouhamadeiah');
  // Open project: the free page or the Online Shop (Weelink / Shops). The user
  // picks one on the project chooser after logging in.
  const [project, setProject] = useState<ProjectType>('page');
  // The open project's key (src/utils/projectKeys.ts): its kind for the account's first project of
  // that kind, else the kind and its own id. `project` above stays the kind, which the editor follows.
  const [projectKey, setProjectKey] = useState<string>('page');
  const [isProjectChosen, setIsProjectChosen] = useState<boolean>(false);
  const [projectLoading, setProjectLoading] = useState<ProjectType | null>(null);
  const [hasShop, setHasShop] = useState<boolean>(false);
  // The open project's package limits (src/utils/planLimits.ts); unlimited until paying is switched on.
  const [limits, setLimits] = useState<PlanLimits>(UNLIMITED);
  const limitsRef = useRef(limits);
  limitsRef.current = limits;
  // A change that would pass the package's limit is dropped, with one notice (the updater may run twice).
  const limitNoticeRef = useRef(0);
  const refuseOverLimit = (what: string) => {
    if (Date.now() - limitNoticeRef.current < 1500) return;
    limitNoticeRef.current = Date.now();
    setTimeout(() => window.alert(`باقتك بتسمح بـ ${what}. رقّي الباقة من «نشر» أو من «حسابي» لتضيف أكتر.`), 0);
  };
  const [shopAdmin, setShopAdmin] = useState<ShopAdminData>(createEmptyShopAdmin);
  const updateShopAdmin = useCallback((fn: (d: ShopAdminData) => ShopAdminData) => setShopAdmin((prev) => {
    const next = fn(prev);
    const max = limitsRef.current.items;
    if (overLimit(prev.products.length, next.products.length, max)) { refuseOverLimit(`${max} ${ITEM_WORD.shop}`); return prev; }
    return next;
  }), []);
  const [hasCars, setHasCars] = useState<boolean>(false);
  const [carAdmin, setCarAdmin] = useState<CarAdminData>(createEmptyCarAdmin);
  // «نشر»: the publish window, and the published page's name (null = not published).
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishedName, setPublishedName] = useState<string | null>(null);
  const updateCarAdmin = useCallback((fn: (d: CarAdminData) => CarAdminData) => setCarAdmin((prev) => {
    const next = fn(prev);
    const max = limitsRef.current.items;
    if (overLimit(prev.cars.length, next.cars.length, max)) { refuseOverLimit(`${max} ${ITEM_WORD.cars}`); return prev; }
    return next;
  }), []);
  const submitCarRequest = useCallback((r: RequestInput) => setCarAdmin((prev) => submitRequest(prev, r)), []);
  const [hasRestaurant, setHasRestaurant] = useState<boolean>(false);
  const [restaurantAdmin, setRestaurantAdmin] = useState<RestaurantAdminData>(createEmptyRestaurantAdmin);
  const updateRestaurantAdmin = useCallback((fn: (d: RestaurantAdminData) => RestaurantAdminData) => setRestaurantAdmin((prev) => {
    const next = fn(prev);
    const { items, devices } = limitsRef.current;
    if (overLimit(prev.dishes.length, next.dishes.length, items)) { refuseOverLimit(`${items} ${ITEM_WORD.restaurant}`); return prev; }
    const active = (d: RestaurantAdminData) => d.devices.filter((v) => v.active).length;
    if (overLimit(active(prev), active(next), devices)) { refuseOverLimit(devices ? `${devices} ${devices === 1 ? 'جهاز' : 'أجهزة'}` : 'طلب أونلاين بس، بدون أجهزة'); return prev; }
    return next;
  }), []);
  const ownerUid = activeUserUid;
  // The open restaurant's live data: restaurants/{uid} for the account's first, restaurants/{uid}__{key} after.
  const restaurantId = restaurantIdOf(ownerUid, projectKey);
  // Read again when «نشر» closes, since a payment may have changed the package.
  useEffect(() => {
    let live = true;
    readGate(ownerUid, projectKey).then((g) => { if (live) setLimits(projectLimits(g, ownerUid, projectKey)); }).catch(() => undefined);
    return () => { live = false; };
  }, [ownerUid, projectKey, isPublishOpen]);
  // The signed-in owner (or a member) looking at the page as visitors see it: its navbar gets «الإدارة».
  const isOwnerView = isPreviewActive && !!currentUser && !currentUser.isAnonymous;
  // The «التقييمات» slide (Eyad, 13 Oct): every free page has one and can't remove it; a paid page
  // gets it once, at the end of its main page, and may remove it. The admins add it back on request.
  const hasRatings = useMemo(() => {
    const slideIds = new Set(pages.flatMap((p) => p.slides.map((sl) => sl.id)));
    return elements.some((el) => el.type === 'ratings' && slideIds.has(el.slideId));
  }, [pages, elements]);
  // One slide at a time, until the elements show it.
  const addingRatingsRef = useRef(false);
  if (hasRatings) addingRatingsRef.current = false;
  const addRatingsSlide = useCallback(() => {
    if (addingRatingsRef.current) return;
    addingRatingsRef.current = true;
    const stamp = Date.now();
    const slideId = `slide-ratings-${stamp}`;
    setPages((prev) =>
      prev.map((p, i) =>
        i === 0 ? { ...p, ratingsSuggested: true, slides: [...p.slides, { id: slideId, name: 'التقييمات', height: 560, backgroundColor: '#f5f5f7' }] } : p
      )
    );
    setElements((prev) => [
      ...prev,
      { id: `el-${stamp}-rt`, name: 'عنوان التقييمات', type: 'heading', x: 140, y: 48, width: 1000, height: 60, content: 'آراء زبائننا', slideId, styles: { fontSize: 32, fontWeight: 'bold', color: '#1d1d1f', textAlign: 'center' } },
      { id: `el-${stamp}-rb`, name: 'التقييمات', type: 'ratings', x: 140, y: 130, width: 1000, height: 380, content: 'التقييمات', slideId, styles: { backgroundColor: '#ffffff', borderRadius: 24 } },
    ]);
  }, []);
  useEffect(() => {
    if (!projectReadyRef.current || !pages[0] || designerModeRef.current) return;
    if (project === 'page') {
      if (!hasRatings) addRatingsSlide();
    } else if (!pages[0].ratingsSuggested) {
      if (hasRatings) setPages((prev) => prev.map((p, i) => (i === 0 ? { ...p, ratingsSuggested: true } : p)));
      else addRatingsSlide();
    }
  }, [project, hasRatings, pages[0]?.id, pages[0]?.ratingsSuggested]);
  const isLockedRatings = (el: CanvasElement) => {
    if (project !== 'page' || el.type !== 'ratings' || elements.filter((e) => e.type === 'ratings' && e.id !== el.id && pages.some((p) => p.slides.some((sl) => sl.id === e.slideId))).length > 0) return false;
    setBuildNotice({ busy: false, ok: false, message: 'شريحة التقييمات أساسية بالصفحة المجانية وما بتنشال. فيك تغيّر شكلها ومكانها.' });
    return true;
  };
  const ratingsSlide = useMemo(() => ({ has: hasRatings, add: addRatingsSlide }), [hasRatings, addRatingsSlide]);

  // The page the «حجز مواعيد» calendar books on, and whose bookings the admins list. Only the owner's
  // view of their page saves real bookings; the editor shows the calendar as a preview.
  const bookingBrand = pages[0]?.navbar?.brandName || '';
  const bookingPage = useMemo<BookingPage | null>(
    () => (ownerUid ? { owner: ownerUid, project: projectKey, pageName: bookingBrand, live: isOwnerView } : null),
    [ownerUid, projectKey, bookingBrand, isOwnerView]
  );
  // Whether the signed-in account is a designer (designers/{uid}), and the name the gallery shows.
  useEffect(() => {
    setIsDesigner(false);
    if (!currentUser || currentUser.isAnonymous) return;
    let alive = true;
    readDesigner(currentUser.uid).then((d) => {
      if (!alive) return;
      setIsDesigner(!!d);
      setDesignerName(d?.name || '');
    });
    return () => {
      alive = false;
    };
  }, [currentUser]);
  // Whether the open project is published (the «نشر» button shows «منشورة»).
  useEffect(() => {
    setPublishedName(null);
    if (!isProjectChosen || !currentUser || currentUser.isAnonymous) return;
    let alive = true;
    readMySite(ownerUid, projectKey)
      .then((s) => alive && setPublishedName(s?.name || null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ownerUid, projectKey, isProjectChosen, currentUser]);
  // «مشاريعي» on the start page: the account's projects and whether each is published.
  const [myProjects, setMyProjects] = useState<MyProject[] | null>(null);
  const [myProjectsTick, setMyProjectsTick] = useState(0);
  const startShowing = isAccountActive || isStartActive || (!isProjectChosen && !isAuthActive);
  useEffect(() => {
    if (!startShowing || !currentUser || currentUser.isAnonymous) return;
    let alive = true;
    const uid = activeUserUid;
    listProjects(uid)
      .then((list) =>
        Promise.all(
          list.map(async (p): Promise<MyProject> => {
            const site = await readMySite(uid, p.key).catch(() => null);
            const url = site ? (p.kind === 'restaurant' ? restaurantSiteUrl(restaurantIdOf(uid, p.key)) : siteUrl(site.name)) : null;
            return { key: p.key, kind: p.kind, name: p.name || site?.name || '', published: site?.name || null, url };
          })
        )
      )
      .then((rows) => alive && setMyProjects(rows))
      .catch((e) => {
        console.warn('Could not list the projects:', e);
        if (alive) setMyProjects([]);
      });
    return () => {
      alive = false;
    };
  }, [startShowing, currentUser, activeUserUid, myProjectsTick]);
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
      return await placeOrder(restaurantId, o);
    } catch (e) {
      console.warn('Could not send the order to the live orders:', e);
      setRestaurantAdmin((prev) => submitOrder(prev, o));
      return null;
    }
  }, [restaurantId]);
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
      setProjectKey('page');
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
    let pageHasContent = false;
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
          pageHasContent = cloudElements.length > 0;
          setProject('page');
          setProjectKey('page');
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
    ownedRef.current = { page: pageHasContent, shop: shopExists, cars: carsExist, restaurant: restaurantExists };
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
  const loadShopWorkspace = async (userId: string, key: string = 'shop') => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    const { pagesField, elementsField } = PROJECT_STORAGE.shop;
    const localPrefix = localPrefixOf(key);
    let shopPages: Page[] = [];
    let shopElements: CanvasElement[] = [];
    let admin: ShopAdminData | null = null;
    try {
      const designSnap = await getDoc(projectDoc(userId, key));
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
    freshProjectRef.current = shopPages.length === 0;
    if (shopPages.length === 0) {
      const template = inStartingLook(getOnlineShopTemplate({ liveProducts: true }), 'shop');
      shopPages = template.pages;
      shopElements = template.elements;
    } else {
      shopElements = withLiveProductGrid(shopElements);
      ({ pages: shopPages, elements: shopElements } = withCheckoutLayout(shopPages, shopElements));
      ({ pages: shopPages, elements: shopElements } = withTemplateGroups(shopPages, shopElements));
    }
    // A first shop opens with ten example products of the store type picked in Wee AI.
    if (!admin) {
      const answer = readCatalogAnswer(userId, 'shop');
      if (answer) admin = await sampleShopAdmin(answer, createEmptyShopAdmin()).catch(() => null);
      if (seq !== loadSeqRef.current) return;
    }
    setProject('shop');
    setProjectKey(key);
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
  const loadCarsWorkspace = async (userId: string, key: string = 'cars') => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    const { pagesField, elementsField } = PROJECT_STORAGE.cars;
    const localPrefix = localPrefixOf(key);
    let carPages: Page[] = [];
    let carElements: CanvasElement[] = [];
    let admin: CarAdminData | null = null;
    try {
      const designSnap = await getDoc(projectDoc(userId, key));
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
    freshProjectRef.current = carPages.length === 0;
    if (carPages.length === 0) {
      const template = inStartingLook(getCarShowroomTemplate(), 'cars');
      carPages = template.pages;
      carElements = template.elements;
      if (!admin) admin = { ...createEmptyCarAdmin(), cars: exampleCars() };
    } else {
      ({ pages: carPages, elements: carElements } = withTemplateGroups(carPages, carElements));
    }
    setProject('cars');
    setProjectKey(key);
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
  const loadRestaurantWorkspace = async (userId: string, key: string = 'restaurant') => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    const { pagesField, elementsField } = PROJECT_STORAGE.restaurant;
    const localPrefix = localPrefixOf(key);
    let restPages: Page[] = [];
    let restElements: CanvasElement[] = [];
    let admin: RestaurantAdminData | null = null;
    try {
      const designSnap = await getDoc(projectDoc(userId, key));
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
    const staff = await readStaff(restaurantIdOf(userId, key));
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
    freshProjectRef.current = restPages.length === 0;
    if (restPages.length === 0) {
      const template = inStartingLook(getRestaurantTemplate(), 'restaurant');
      restPages = template.pages;
      restElements = template.elements;
      if (!admin) {
        // Ten example dishes of the kind picked in Wee AI, else the general example menu.
        const answer = readCatalogAnswer(userId, 'restaurant');
        admin = (answer && (await sampleRestaurantAdmin(answer).catch(() => null))) || exampleRestaurantAdmin();
        if (seq !== loadSeqRef.current) return;
      }
    }
    setProject('restaurant');
    setProjectKey(key);
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

  // Loads a page project after the account's first one (designs/{uid}/projects/{key}). A new one
  // starts on one empty slide.
  const loadPageProject = async (userId: string, key: string) => {
    const seq = ++loadSeqRef.current;
    projectReadyRef.current = false;
    const { pagesField, elementsField } = PROJECT_STORAGE.page;
    const localPrefix = localPrefixOf(key);
    let loadedPages: Page[] = [];
    let loadedElements: CanvasElement[] = [];
    try {
      const snap = await getDoc(projectDoc(userId, key));
      if (snap.exists()) {
        const data: any = snap.data();
        if (Array.isArray(data[pagesField]) && data[pagesField].length > 0) {
          loadedPages = normalizeLegacyNavbarDefaults(data[pagesField]);
          loadedElements = deserializeElements(data[elementsField] || []);
        }
      }
    } catch (e) {
      console.warn("Could not load the page from Firebase, falling back to local cache:", e);
    }
    if (seq !== loadSeqRef.current) return;
    try {
      if (loadedPages.length === 0) {
        const storedPages = localStorage.getItem(`${localPrefix}pages_${userId}`);
        const storedElements = localStorage.getItem(`${localPrefix}elements_${userId}`);
        if (storedPages) loadedPages = normalizeLegacyNavbarDefaults(JSON.parse(storedPages));
        if (storedElements) loadedElements = deserializeElements(JSON.parse(storedElements));
      }
    } catch (e) {
      console.warn("Could not read the local page cache:", e);
    }
    freshProjectRef.current = loadedPages.length === 0;
    if (loadedPages.length === 0) {
      loadedPages = [initialPage];
      loadedElements = [];
    }
    setProject('page');
    setProjectKey(key);
    setPages(loadedPages);
    setElements(loadedElements);
    setHistory([loadedElements]);
    setHistoryIndex(0);
    setActivePageId(loadedPages[0].id);
    setActiveSlideId(loadedPages[0].slides[0]?.id || 'slide-1');
    setSelectedElementId(null);
    setIsChatActive(false);
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
      resetAccountMemory();
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
    // (and in the designer's mode, where the editor holds a draft, not the page)
    if (!isInitialLoadComplete.current || !projectReadyRef.current || isFirebaseLoading || designerModeRef.current || (pageLockRef.current && project === 'page')) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (!projectReadyRef.current || designerModeRef.current || (pageLockRef.current && project === 'page')) return;
      try {
        const targetUserId = activeUserUid;
        const localPrefix = localPrefixOf(projectKey);
        localStorage.setItem(`${localPrefix}pages_${targetUserId}`, JSON.stringify(pages));
        localStorage.setItem(`${localPrefix}elements_${targetUserId}`, JSON.stringify(elements));
        // NOTE: deliberately no longer writing the old non-namespaced 'weelink_pages'/
        // 'weelink_elements' keys — they were the source of a cross-account data leak.
      } catch (e) {
        console.warn("Could not save to LocalStorage:", e);
      }
    }, 1200); // 1.2s debounce to avoid spamming writes

    return () => clearTimeout(delayDebounceFn);
  }, [pages, elements, currentUser, isFirebaseLoading, activeUserUid, project, projectKey]);

  // 3. Debounced live auto-save to Firebase whenever pages or elements change
  useEffect(() => {
    // Skip saving during initial boot/loading to prevent overwrite races
    if (!isInitialLoadComplete.current || !projectReadyRef.current || isFirebaseLoading || designerModeRef.current || (pageLockRef.current && project === 'page')) {
      return;
    }

    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      if (!projectReadyRef.current || designerModeRef.current || (pageLockRef.current && project === 'page')) return;
      try {
        setIsSavingCloud(true);
        const { pagesField, elementsField } = PROJECT_STORAGE[project];
        await setDoc(projectDoc(targetUserId, projectKey), {
          [pagesField]: sanitizeData(pages),
          [elementsField]: serializeElements(elements),
          ...laterProjectFields(projectKey),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save failed (kept locally, will retry on next change):", e);
      } finally {
        setIsSavingCloud(false);
      }
    }, 1200); // 1.2s debounce to avoid spamming writes

    return () => clearTimeout(delayDebounceFn);
  }, [pages, elements, currentUser, isFirebaseLoading, activeUserUid, project, projectKey]);

  // 3b. Full-size photos inside the page (from older Wee AI builds) move to Firebase Storage: kept
  // inline they overflowed the browser storage and made the design too big for Firestore to save.
  const hostingImagesRef = useRef(false);
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || hostingImagesRef.current || !auth.currentUser) return;
    const large = largeInlineImages([pages, elements]);
    if (!large.size) return;
    hostingImagesRef.current = true;
    hostLargeImages(large)
      .then((links) => {
        if (!links.size) return;
        setPages((prev) => replaceImages(prev, links));
        setElements((prev) => replaceImages(prev, links));
      })
      .catch((e) => console.warn('Could not move the page photos to storage:', e))
      .finally(() => { hostingImagesRef.current = false; });
  }, [pages, elements, isFirebaseLoading]);

  // 4. Debounced save of the shop's admin data (catalogs, warehouse, orders...).
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'shop') {
      return;
    }
    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      try {
        localStorage.setItem(`${localPrefixOf(projectKey)}admin_${targetUserId}`, JSON.stringify(shopAdmin));
      } catch (e) {
        console.warn("Could not save shop admin data locally:", e);
      }
      try {
        await setDoc(projectDoc(targetUserId, projectKey), {
          shopAdmin: sanitizeData(shopAdmin),
          ...laterProjectFields(projectKey),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save of shop admin data failed:", e);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [shopAdmin, currentUser, isFirebaseLoading, activeUserUid, project, projectKey]);

  // 5. Debounced save of the car showroom's admin data (cars, settings).
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'cars') {
      return;
    }
    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      try {
        localStorage.setItem(`${localPrefixOf(projectKey)}admin_${targetUserId}`, JSON.stringify(carAdmin));
      } catch (e) {
        console.warn("Could not save car showroom data locally:", e);
      }
      try {
        await setDoc(projectDoc(targetUserId, projectKey), {
          carAdmin: sanitizeData(carAdmin),
          ...laterProjectFields(projectKey),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save of car showroom data failed:", e);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [carAdmin, currentUser, isFirebaseLoading, activeUserUid, project, projectKey]);

  // 6. Debounced save of the restaurant's admin data (menu, orders, settings).
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'restaurant') {
      return;
    }
    const targetUserId = activeUserUid;
    const delayDebounceFn = setTimeout(async () => {
      try {
        localStorage.setItem(`${localPrefixOf(projectKey)}admin_${targetUserId}`, JSON.stringify(restaurantAdmin));
      } catch (e) {
        console.warn("Could not save restaurant data locally:", e);
      }
      try {
        await setDoc(projectDoc(targetUserId, projectKey), {
          restaurantAdmin: sanitizeData(withoutStaff(restaurantAdmin)),
          ...laterProjectFields(projectKey),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) {
        console.warn("Cloud save of restaurant data failed:", e);
      }
    }, 800);
    return () => clearTimeout(delayDebounceFn);
  }, [restaurantAdmin, currentUser, isFirebaseLoading, activeUserUid, project, projectKey]);

  // 7. The restaurant's public site (restaurants/{restaurantId}): pages, elements, menu and settings, published
  // a moment after each change so the guests' link and the tables' QR codes always show the latest.
  // The devices and the workers go to the private doc the restaurant's tablets read.
  useEffect(() => {
    if (!isInitialLoadComplete.current || isFirebaseLoading || project !== 'restaurant' || !projectReadyRef.current) return;
    const t = setTimeout(() => {
      publishRestaurant(restaurantId, pages, elements, restaurantAdmin).catch((e) => console.warn('Could not publish the restaurant site:', e));
      // Not when they could not be read (no permission, offline): the empty list would wipe them.
      if (staffSyncRef.current !== 'off') {
        saveStaff(restaurantId, restaurantAdmin)
          .then(() => {
            if (staffSyncRef.current === 'legacy') dropStaffFromDesign(projectDoc(ownerUid, projectKey)).catch(() => {});
            staffSyncRef.current = 'private';
          })
          .catch((e) => console.warn('Could not save the devices for the restaurant tablets:', e));
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [pages, elements, restaurantAdmin, isFirebaseLoading, project, projectKey, ownerUid, restaurantId]);

  // Saves the open project right away (the debounced saves above would be
  // cancelled when another project's data replaces it).
  const flushProjectSave = (): Promise<boolean> => {
    // In the designer's mode the cloud button saves the open draft, never over the page.
    if (designerModeRef.current) return saveActiveDraft();
    if (pageLockRef.current && project === 'page') return Promise.resolve(false);
    if (!projectReadyRef.current) return Promise.resolve(false);
    const targetUserId = activeUserUid;
    const { pagesField, elementsField } = PROJECT_STORAGE[project];
    const localPrefix = localPrefixOf(projectKey);
    try {
      localStorage.setItem(`${localPrefix}pages_${targetUserId}`, JSON.stringify(pages));
      localStorage.setItem(`${localPrefix}elements_${targetUserId}`, JSON.stringify(elements));
      if (project === 'shop') localStorage.setItem(`${localPrefix}admin_${targetUserId}`, JSON.stringify(shopAdmin));
      if (project === 'cars') localStorage.setItem(`${localPrefix}admin_${targetUserId}`, JSON.stringify(carAdmin));
      if (project === 'restaurant') localStorage.setItem(`${localPrefix}admin_${targetUserId}`, JSON.stringify(restaurantAdmin));
    } catch (e) {
      console.warn("Could not save to LocalStorage:", e);
    }
    // A project switch does not wait for it: Firestore queues the write locally, and waiting for
    // the server would freeze the switch while offline. The top bar's cloud waits, to say «انحفظ».
    return setDoc(projectDoc(targetUserId, projectKey), {
      [pagesField]: sanitizeData(pages),
      [elementsField]: serializeElements(elements),
      ...laterProjectFields(projectKey),
      ...(project === 'shop' ? { shopAdmin: sanitizeData(shopAdmin) } : {}),
      ...(project === 'cars' ? { carAdmin: sanitizeData(carAdmin) } : {}),
      ...(project === 'restaurant' ? { restaurantAdmin: sanitizeData(withoutStaff(restaurantAdmin)) } : {}),
      updatedAt: serverTimestamp(),
    }, { merge: true }).then(() => true, (e) => {
      console.warn("Cloud save failed:", e);
      return false;
    });
  };

  // While a designer is inside the page with a code the page is locked here (see designerLock above): ask
  // now and every 45 seconds; when the code ends, the page is read again, with the designer's changes.
  useEffect(() => {
    if (!currentUser || currentUser.isAnonymous || project !== 'page' || designerMode) return;
    let alive = true;
    const check = async () => {
      try {
        const { rows } = await activeAccess(currentUser);
        if (!alive) return;
        const lock = rows[0] || null;
        const was = pageLockRef.current;
        pageLockRef.current = !!lock;
        setDesignerLock(lock);
        if (was && !lock) loadUserWorkspace(activeUserUid).catch(() => {});
      } catch {
        // offline or no server: the page stays as it is
      }
    };
    check();
    const timer = window.setInterval(check, 45000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [currentUser, project, designerMode, activeUserUid]);

  // ---------- «وضع المصمم» ----------
  // A draft is a slide or a page (Eyad, 14 Oct). The editor works on either as on any page: a slide
  // draft is one page with one empty slide, and the slide being edited is what is exported; a page
  // draft is one page with a navbar and up to three slides (it starts with three empty ones), exported whole.
  const blankDraftPages = (kind: DesignKind = 'slide'): Page[] => [{
    id: 'page-home',
    name: kind === 'page' ? 'الرئيسية' : 'الشريحة',
    slug: '/',
    navbar: { brandName: kind === 'page' ? 'اسم الصفحة' : '', items: [], ctaText: '', ctaHref: '', bgColor: '#ffffff', textColor: '#1d1d1f', isSticky: true },
    slides: kind === 'page'
      ? Array.from({ length: PAGE_MAX_SLIDES }, (_, i) => ({ id: `slide-${i + 1}`, name: `شريحة ${i + 1}`, height: 560, backgroundColor: '#ffffff', dividerShape: 'straight' as const }))
      : [{ id: 'slide-1', name: 'شريحة فارغة', height: 560, backgroundColor: '#ffffff', dividerShape: 'straight' }],
    ratingsSuggested: true,
  }];
  const draftName = (slot: string, kind: DesignKind = 'slide') => `${DESIGN_KIND_LABEL[kind]} ${DRAFT_SLOTS.indexOf(slot) + 1}`;
  const activeKindRef = useRef<DesignKind>('slide');
  const setDraftList = (list: DraftMeta[]) => {
    draftsRef.current = list;
    setDrafts(list);
  };

  // Saves the open draft now; the page itself is never touched.
  const saveActiveDraft = async (): Promise<boolean> => {
    // A gallery design is saved only by its own «حفظ» button: a switch of draft must not send it to review by itself.
    if (galleryEditRef.current) return false;
    const user = auth.currentUser;
    if (!user || user.isAnonymous || !draftReadyRef.current) return false;
    const client = clientSessionRef.current;
    if (client) {
      setIsSavingCloud(true);
      try {
        await saveClientPage(user, client.orderId, client.code, sanitizeData(pagesRef.current), serializeElements(elementsRef.current));
        return true;
      } catch (e) {
        console.warn('Could not save the customer page:', e);
        window.alert(accessErrorText(e));
        return false;
      } finally {
        setIsSavingCloud(false);
      }
    }
    const slot = activeSlotRef.current;
    const meta = draftsRef.current.find((d) => d.slot === slot);
    const kind = activeKindRef.current;
    const name = meta?.name || draftName(slot, kind);
    setIsSavingCloud(true);
    try {
      await saveDraft(user.uid, slot, { name, kind, pages: sanitizeData(pagesRef.current), elements: serializeElements(elementsRef.current) });
      return true;
    } catch (e) {
      console.warn('Could not save the draft:', e);
      return false;
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Puts a draft (or a blank one) in the editor.
  const openDraft = async (uid: string, slot: string) => {
    draftReadyRef.current = false;
    clientSessionRef.current = null;
    setClientSession(null);
    galleryEditRef.current = null;
    setGalleryEdit(null);
    let loaded: Awaited<ReturnType<typeof readDraft>> = null;
    try {
      loaded = await readDraft(uid, slot);
    } catch (e) {
      console.warn('Could not read the draft:', e);
    }
    const kind: DesignKind = loaded?.kind || draftsRef.current.find((d) => d.slot === slot)?.kind || 'slide';
    const draftPages: Page[] = loaded && loaded.pages.length > 0 ? normalizeLegacyNavbarDefaults(loaded.pages) : blankDraftPages(kind);
    const draftElements = loaded ? deserializeElements(loaded.elements) : [];
    loadSeqRef.current++;
    setPages(draftPages);
    setElements(draftElements);
    setHistory([draftElements]);
    setHistoryIndex(0);
    setActivePageId(draftPages[0].id);
    setActiveSlideId(draftPages[0].slides[0]?.id || 'slide-1');
    setSelectedElementId(null);
    activeSlotRef.current = slot;
    activeKindRef.current = kind;
    setActiveSlot(slot);
    try {
      localStorage.setItem(`weelink_last_draft_${uid}`, slot);
    } catch {
      // storage unavailable: the first draft opens next time
    }
    draftReadyRef.current = true;
  };

  // The hired designer opens the customer's page with the code the customer gave (designer mode only).
  const openClientSession = async (orderId: string, code: string): Promise<{ ok: boolean; message: string }> => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous || draftBusy || !designerModeRef.current) return { ok: false, message: 'افتح وضع المصمم أولاً.' };
    setDraftBusy(true);
    try {
      const loaded = await openClientPage(user, orderId, code);
      await saveActiveDraft();
      const pagesIn: Page[] = loaded.pages.length > 0 ? normalizeLegacyNavbarDefaults(loaded.pages) : blankDraftPages('page');
      const elementsIn = deserializeElements(loaded.elements);
      draftReadyRef.current = false;
      loadSeqRef.current++;
      setPages(pagesIn);
      setElements(elementsIn);
      setHistory([elementsIn]);
      setHistoryIndex(0);
      setActivePageId(pagesIn[0].id);
      setActiveSlideId(pagesIn[0].slides[0]?.id || 'slide-1');
      setSelectedElementId(null);
      const session = { orderId, code, expiresAt: loaded.expiresAt };
      clientSessionRef.current = session;
      setClientSession(session);
      activeSlotRef.current = `client-${orderId}`;
      activeKindRef.current = 'page';
      setActiveSlot(`client-${orderId}`);
      draftReadyRef.current = true;
      return { ok: true, message: '' };
    } catch (e) {
      return { ok: false, message: accessErrorText(e) };
    } finally {
      setDraftBusy(false);
    }
  };

  // ---------- Editing a design of the gallery ----------
  const confirmLeaveGalleryEdit = () => !galleryEditRef.current || JSON.stringify({ pages, elements }) === galleryBaselineRef.current || window.confirm('عندك تعديلات لم تُحفظ على هذا التصميم. تتركها؟');

  const loadGalleryDesign = (d: EditableDesign, as: 'admin' | 'designer', pendingEdit: boolean, token?: string) => {
    const base = blankDraftPages(d.kind)[0];
    const pageIn: Page = d.kind === 'page'
      ? { ...base, navbar: d.page?.navbar || base.navbar, slides: d.page?.slides?.length ? d.page.slides : base.slides }
      : { ...base, slides: [d.slide] };
    const pagesIn: Page[] = normalizeLegacyNavbarDefaults([pageIn]);
    const elementsIn = deserializeElements(d.elements);
    draftReadyRef.current = false;
    loadSeqRef.current++;
    setPages(pagesIn);
    setElements(elementsIn);
    setHistory([elementsIn]);
    setHistoryIndex(0);
    setActivePageId(pagesIn[0].id);
    setActiveSlideId(pagesIn[0].slides[0]?.id || 'slide-1');
    setSelectedElementId(null);
    galleryBaselineRef.current = JSON.stringify({ pages: pagesIn, elements: elementsIn });
    galleryEditRef.current = { id: d.id, as, kind: d.kind, token };
    setGalleryEdit({ id: d.id, as, name: d.name, kind: d.kind, status: d.status, pendingEdit });
    setGallerySavedNote('');
    activeSlotRef.current = `gallery-${d.id}`;
    activeKindRef.current = d.kind;
    setActiveSlot(`gallery-${d.id}`);
    draftReadyRef.current = true;
  };

  // What is saved: the page's navbar and slides (a slide design: the open slide) with their elements.
  const galleryPayload = () => {
    const kind = galleryEditRef.current?.kind || 'slide';
    const slides = kind === 'page' ? pages.flatMap((p) => p.slides) : [currentSlide];
    const ids = new Set(slides.map((sl) => sl.id));
    const problem = kind !== 'page' ? '' : pages.length !== 1 ? 'تصميم الصفحة هو صفحة واحدة (حتى ثلاث شرائح). احذف الصفحات الزائدة من قائمة الصفحات.' : slides.length > PAGE_MAX_SLIDES ? `الصفحة حتى ${PAGE_MAX_SLIDES} شرائح، وعندك ${slides.length}.` : '';
    return { problem, page: sanitizeData(kind === 'page' ? { navbar: pages[0].navbar, slides } : { slides }), elements: serializeElements(elements.filter((e) => ids.has(e.slideId))) };
  };

  const saveGalleryEdit = async (): Promise<boolean> => {
    const session = galleryEditRef.current;
    if (!session || gallerySaving) return false;
    const payload = galleryPayload();
    if (payload.problem) {
      window.alert(payload.problem);
      return false;
    }
    setGallerySaving(true);
    setGallerySavedNote('');
    try {
      if (session.as === 'admin') await adminEditSave(session.token || '', session.id, payload);
      else {
        const user = auth.currentUser;
        if (!user) throw new Error('unauthorized');
        const r = await designerEditSave(user, session.id, payload);
        setGallerySavedNote(r.mode === 'review' ? 'أُرسل للمراجعة' : 'حُفظ وعاد للمراجعة');
      }
      if (session.as === 'admin') setGallerySavedNote('حُفظ');
      galleryBaselineRef.current = JSON.stringify({ pages, elements });
      return true;
    } catch (e) {
      window.alert(editErrorText(e));
      return false;
    } finally {
      setGallerySaving(false);
    }
  };

  const leaveGalleryEdit = async () => {
    const session = galleryEditRef.current;
    if (!session || !confirmLeaveGalleryEdit()) return;
    if (session.as === 'admin') {
      galleryEditRef.current = null;
      window.close();
      window.location.href = '/?admin';
      return;
    }
    const user = auth.currentUser;
    if (user && draftsRef.current[0]) {
      setDraftBusy(true);
      await openDraft(user.uid, draftsRef.current[0].slot);
      setDraftBusy(false);
    }
  };

  // Back from Stripe's payment page (src/components/billing/Checkout.tsx): say how it went, once.
  useEffect(() => {
    const url = new URL(window.location.href);
    const back = url.searchParams.get('stripe');
    if (!back) return;
    url.searchParams.delete('stripe');
    window.history.replaceState(window.history.state, '', url.toString());
    window.alert(back === 'ok'
      ? 'وصلت دفعتك. أول ما يأكدها Stripe بيوصلك إيميل بالفاتورة، وبعدها بتقدر تنشر مشروعك من زر «نشر».'
      : 'ما تم الدفع. فيك تدفع بأي وقت من زر «نشر» أو من صفحة «حسابي».');
  }, []);

  // The admin's editor tab (opened by «تعديل في لوحة المصمم» in the admin site) starts here, once the sign-in check is done.
  const adminEditStarted = useRef(false);
  useEffect(() => {
    if (isFirebaseLoading || adminEditStarted.current || !new URLSearchParams(window.location.search).has('edit-gallery')) return;
    adminEditStarted.current = true;
    const handoff = takeAdminHandoff();
    if (!handoff) {
      window.alert('انتهت مهلة فتح التعديل. افتح الإدارة واضغط «تعديل في لوحة المصمم» من جديد.');
      return;
    }
    (async () => {
      try {
        designerModeRef.current = true;
        const r = await adminEditOpen(handoff.token, handoff.id);
        setProject('page');
        setProjectKey('page');
        loadGalleryDesign(r.design, 'admin', false, handoff.token);
        setIsHomeActive(false);
        setIsStartActive(false);
        setIsAuthActive(false);
        setIsProjectChosen(true);
        setDesignerMode(true);
        setIsPreviewActive(false);
      } catch (e) {
        designerModeRef.current = false;
        window.alert(editErrorText(e));
      }
    })();
  }, [isFirebaseLoading]);

  // «تعديل» on a design of the designer's own in the gallery: the editor opens on it in the designer's mode.
  const editMyDesign = async (slide: { id: string }) => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous || !isDesigner) return;
    try {
      const r = await designerEditOpen(user, slide.id);
      setIsAuthActive(false);
      await handleChooseProject('page');
      setIsStartActive(false);
      await enterDesignerMode();
      if (!designerModeRef.current) return;
      loadGalleryDesign(r.design, 'designer', r.pendingEdit);
    } catch (e) {
      window.alert(editErrorText(e));
    }
  };

  const enterDesignerMode = async () => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous || draftBusy || designerModeRef.current) return;
    setDraftBusy(true);
    try {
      await flushProjectSave(); // the designer's own page first
      prevProjectRef.current = project;
      let list = await listDrafts(user.uid);
      if (!list.length) {
        await saveDraft(user.uid, 'd1', { name: draftName('d1'), kind: 'slide', pages: sanitizeData(blankDraftPages()), elements: [] });
        list = [{ slot: 'd1', name: draftName('d1'), kind: 'slide', updatedAt: Date.now() }];
      }
      let last = '';
      try {
        last = localStorage.getItem(`weelink_last_draft_${user.uid}`) || '';
      } catch {
        last = '';
      }
      designerModeRef.current = true;
      setProject('page');
      setProjectKey('page');
      setDraftList(list);
      await openDraft(user.uid, list.find((d) => d.slot === last)?.slot || list[0].slot);
      setDesignerMode(true);
      setIsPreviewActive(false);
      setIsChatActive(false);
      setIsPageAdminOpen(false);
    } catch (e) {
      console.warn('Could not open the designer mode:', e);
      designerModeRef.current = false;
      draftReadyRef.current = false;
      window.alert('تعذّر فتح وضع المصمم. تأكد من اتصالك وجرّب مرة ثانية.');
    } finally {
      setDraftBusy(false);
    }
  };

  const exitDesignerMode = async () => {
    if (draftBusy || !designerModeRef.current || !confirmLeaveGalleryEdit()) return;
    setDraftBusy(true);
    await saveActiveDraft();
    draftReadyRef.current = false;
    setIsExportOpen(false);
    const uid = activeUserUid;
    const kind = prevProjectRef.current;
    try {
      // The page the designer left comes back from the cloud, as it was saved.
      if (kind === 'shop') await loadShopWorkspace(uid);
      else if (kind === 'cars') await loadCarsWorkspace(uid);
      else if (kind === 'restaurant') await loadRestaurantWorkspace(uid);
      else await loadUserWorkspace(uid);
    } catch (e) {
      console.warn('Could not bring the page back:', e);
    }
    designerModeRef.current = false;
    setDesignerMode(false);
    setDraftBusy(false);
  };

  const switchDraft = async (slot: string) => {
    const user = auth.currentUser;
    if (!user || draftBusy || slot === activeSlotRef.current || !confirmLeaveGalleryEdit()) return;
    setDraftBusy(true);
    await saveActiveDraft();
    await openDraft(user.uid, slot);
    setDraftBusy(false);
  };

  const newDraft = async (kind: DesignKind) => {
    const user = auth.currentUser;
    const slot = freeSlot(draftsRef.current);
    if (!user || draftBusy || !slot || !confirmLeaveGalleryEdit()) return;
    setDraftBusy(true);
    await saveActiveDraft();
    try {
      await saveDraft(user.uid, slot, { name: draftName(slot, kind), kind, pages: sanitizeData(blankDraftPages(kind)), elements: [] });
      setDraftList([...draftsRef.current, { slot, name: draftName(slot, kind), kind, updatedAt: Date.now() }].sort((a, b) => DRAFT_SLOTS.indexOf(a.slot) - DRAFT_SLOTS.indexOf(b.slot)));
      await openDraft(user.uid, slot);
    } catch (e) {
      console.warn('Could not make a new draft:', e);
      window.alert('تعذّر إنشاء مسودة جديدة. جرّب مرة ثانية.');
    }
    setDraftBusy(false);
  };

  const removeDraft = async (slot: string) => {
    const user = auth.currentUser;
    if (!user || draftBusy || draftsRef.current.length <= 1) return;
    const name = draftsRef.current.find((d) => d.slot === slot)?.name || draftName(slot, draftsRef.current.find((d) => d.slot === slot)?.kind);
    if (!window.confirm(`حذف «${name}» نهائياً؟ ما بتقدر ترجعها.`)) return;
    setDraftBusy(true);
    try {
      await deleteDraft(user.uid, slot);
      const rest = draftsRef.current.filter((d) => d.slot !== slot);
      setDraftList(rest);
      if (slot === activeSlotRef.current) await openDraft(user.uid, rest[0].slot);
    } catch (e) {
      console.warn('Could not delete the draft:', e);
      window.alert('تعذّر حذف المسودة. جرّب مرة ثانية.');
    }
    setDraftBusy(false);
  };

  // `type` is a project key (src/utils/projectKeys.ts); a kind opens the account's first project of it.
  const handleChooseProject = async (type: string, targetUserId: string = activeUserUid) => {
    if (projectLoading) return;
    const kind = kindOf(type);
    // Leaving «وضع المصمم» (the editor holds a draft, not the page): the draft is saved, and the
    // project asked for is then loaded from the cloud like any other switch.
    const fromDesignerMode = designerModeRef.current;
    if (fromDesignerMode) {
      if (draftBusy) return;
      await exitDesignerMode();
    }
    setProjectLoading(kind);
    try {
      if (fromDesignerMode || type !== projectKey || targetUserId !== activeUserUid) {
        flushProjectSave();
        if (kind === 'shop') await loadShopWorkspace(targetUserId, type);
        else if (kind === 'cars') await loadCarsWorkspace(targetUserId, type);
        else if (kind === 'restaurant') await loadRestaurantWorkspace(targetUserId, type);
        else if (isFirstOfKind(type)) await loadUserWorkspace(targetUserId);
        else await loadPageProject(targetUserId, type);
      }
      try {
        localStorage.setItem(`weelink_last_project_${targetUserId}`, type);
      } catch {
        // storage unavailable: «صفحتي» just asks again next time
      }
      if (isFirstOfKind(type)) ownedRef.current = { ...ownedRef.current, [kind]: true };
      setIsProjectChosen(true);
    } finally {
      setProjectLoading(null);
    }
  };

  // «صفحتي»: the project this account last opened, or its only one; the chooser when that is unclear
  // (several projects, or none yet).
  const openMyPage = (accountId: string) => {
    const owned = ownedRef.current;
    const kinds = (['shop', 'cars', 'restaurant'] as const).filter((k) => owned[k]);
    let last: string | null = null;
    try {
      last = localStorage.getItem(`weelink_last_project_${accountId}`);
    } catch {
      last = null;
    }
    let target: ProjectType | null = null;
    if (last === 'page' ? owned.page : kinds.some((k) => k === last)) target = last as ProjectType;
    else if (kinds.length === 1 && !owned.page) target = kinds[0];
    else if (kinds.length === 0 && owned.page) target = 'page';
    setIsHomeActive(false);
    setIsStartActive(false);
    setIsLawActive(false);
    setIsAccountActive(false);
    setIsAuthActive(false);
    setIsProjectChosen(false);
    // The owner sees their page as visitors do, with «الإدارة» in its navbar (Eyad, 13 Oct); the
    // editor is one step away, from the admin's «تعديل الصفحة».
    if (target) handleChooseProject(target, accountId).then(openOwnerView);
  };

  const openOwnerView = () => {
    setSelectedElementId(null);
    setIsRightDrawerOpen(false);
    setIsPreviewActive(true);
  };

  // «الإدارة» in the navbar of the owner's own page.
  const openAdmin = () => {
    if (project === 'page') setIsPageAdminOpen(true);
    else setAdminOpenRequest((n) => n + 1);
  };

  // «تعديل الصفحة» in the admin: from the owner's view of the page back to the editor.
  const editPageFromAdmin = () => {
    setIsPageAdminOpen(false);
    setIsPreviewActive(false);
  };

  // The Weelink logo in the editor: back to the start page.
  const handleOpenProjects = () => {
    flushProjectSave();
    setIsPreviewActive(false);
    setStartKind(null);
    setIsStartActive(true);
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

  const handleAuthSuccess = (userUid: string, isNewUser: boolean, asDesigner = false) => {
    handledAuthUid.current = auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser.uid : null;
    resetAccountMemory();
    setAuthMode('login');
    setActiveUserUid(userUid);
    const inviteProblem = takeInviteProblem();
    if (inviteProblem) window.setTimeout(() => window.alert(inviteProblem), 300);
    if (isNewUser) {
      ownedRef.current = { page: false, shop: false, cars: false, restaurant: false };
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
      setProjectKey('page');
      setHasShop(false);
      setPages(finalPages);
      setElements(finalElements);
      setHistory([finalElements]);
      setHistoryIndex(0);
      setIsChatActive(false);
      // A new account answers Wee AI's questions on the start page, then the editor builds its page.
      // A designer answers the same questions as everyone (for the free page), then lands on an empty slide.
      if (!pendingBuildRef.current) {
        setStartKind(asDesigner ? 'page' : null);
        setIsHomeActive(false);
        setIsStartActive(true);
      }

      // Save to localStorage
      try {
        localStorage.setItem(`weelink_pages_${userUid}`, JSON.stringify(finalPages));
        localStorage.setItem(`weelink_elements_${userUid}`, JSON.stringify(finalElements));
        
        const emailVal = auth.currentUser?.email || '';
        const initialProgress = {
          currentStep: 1,
          personalInfo: { title: 'سيد', fullName: '', birthDate: '', logoUrl: '' },
          addressInfo: { governorate: 'دمشق', placeType: 'city', city: '', area: '', district: '', subdistrict: '', village: '', street: '', details: '', coordinates: null },
          contactInfo: { email: emailVal, whatsapp: '', phone: '', facebook: '', tiktok: '' },
          catalogInfo: { category: '', subCategory: '', specialty: '', customCategory: '', customSpecialty: '' },
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
      // Existing user: fetch their page, then open it when they came for their account.
      loadUserWorkspace(userUid).then(async () => {
        isInitialLoadComplete.current = true;
        if (pendingBuildRef.current) openGuestBuild(userUid);
        else if (afterSignInRef.current === 'account') openMyPage(userUid);
        // A returning designer comes back to their page, in the editor.
        else if (auth.currentUser && (await readDesigner(auth.currentUser.uid))) {
          setIsHomeActive(false);
          setIsStartActive(false);
          handleChooseProject('page', userUid);
        }
      });
    }
    if (isNewUser && pendingBuildRef.current) openGuestBuild(userUid);
    if (asDesigner) {
      setIsDesigner(true);
      if (auth.currentUser) readDesigner(auth.currentUser.uid).then((d) => setDesignerName(d?.name || ''));
    }
    setIsSavingCloud(false);
    if (isNewUser) isInitialLoadComplete.current = true;
    setIsAuthActive(false); // Hide login screen, go straight to builder/chat!
    // A phone sees its page first; the panel waits behind the bar at the bottom.
    setIsRightDrawerOpen(window.innerWidth >= 1024);
  };

  // The guest's Wee AI answers move to the account they just made, and the kind they were for opens.
  const openGuestBuild = (accountId: string) => {
    const kind = pendingBuildRef.current;
    pendingBuildRef.current = null;
    if (!kind) return;
    setIsProjectChosen(false);
    moveGuestAnswers(accountId, auth.currentUser?.email || '').then((saved) => {
      const open = saved || kind;
      // The answers just moved to the account: the editor opens on an empty page, and the owner
      // chooses there to design it themselves or press «ابن صفحتي».
      afterQuestionsRef.current = open;
      handleChooseProject(open, accountId);
    });
  };

  // The questions finished on the start page: open the kind on an empty page (nothing is built yet).
  // A kind the account has a project of already gets a new project with its own key (Eyad, 17 Oct).
  const openAfterQuestions = async (kind: ProjectType) => {
    afterQuestionsRef.current = kind;
    setIsAuthActive(false);
    await handleChooseProject(ownedRef.current[kind] ? newProjectKey(kind) : kind);
    setIsStartActive(false);
  };

  // «انضم لمصممينا» on the start page: a visitor goes to the designers' sign-up; a signed-in owner
  // becomes a designer (their name for the gallery asked once) and lands on their page in the editor.
  const joinDesigners = async () => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      afterSignInRef.current = 'build';
      pendingBuildRef.current = null;
      setAuthMode('designer');
      setIsStartActive(false);
      setIsAuthActive(true);
      return;
    }
    try {
      const have = await readDesigner(user.uid);
      if (have) setDesignerName(have.name);
      else {
        const name = (window.prompt('اسمك كما سيظهر للزبائن في معرض المصممين:') || '').trim();
        if (name.length < 2) return;
        setDesignerName((await becomeDesigner(user.uid, name)).name);
      }
    } catch (err) {
      console.warn('Could not make the designer profile:', err);
      window.alert('تعذّر إنشاء حساب المصمم. حاول مرة ثانية بعد قليل.');
      return;
    }
    setIsDesigner(true);
    // Questions first, like any new page of the free kind (name, address, city, work); an owner who
    // already has a page goes straight to it.
    if (ownedRef.current.page) {
      setIsStartActive(false);
      await handleChooseProject('page', activeUserUid);
    } else {
      setStartKind('page');
      setIsStartActive(true);
    }
  };

  // «أضف لصفحتي مجاناً» on a gallery design: the signed-in owner's page opens, and the design (its
  // slides, or the slides of a page, without the navbar) is added at the end of the page's first page,
  // fitted to the page's style unless the visitor asked for it as it is. A page that is still one empty
  // slide gives that slide up to it. The editor's own autosave and undo take it from there.
  const addGalleryDesign = async (g: GallerySlide, fit: boolean): Promise<{ ok: boolean; message: string }> => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return { ok: false, message: 'سجّل دخولك لتضيف التصميم لصفحتك.' };
    try {
      await handleChooseProject('page', activeUserUid);
      setIsStartActive(false);
      // Wait for the loaded page to reach the refs the editor keeps of it.
      await new Promise((resolve) => window.setTimeout(resolve, 120));
      const design = g.kind === 'page' && g.page?.slides?.length ? { slides: g.page.slides, elements: g.elements } : { slides: [g.slide], elements: g.elements };
      const result = insertDesign(pagesRef.current, elementsRef.current, design, { fit });
      if (!result) return { ok: false, message: 'ما قدرت أضيف التصميم. جرّب مرة ثانية.' };
      setPages(result.pages);
      pushToHistoryRef.current(result.elements);
      setActivePageId(result.pages[0].id);
      setActiveSlideId(result.firstSlideId);
      setSelectedElementId(null);
      const word = result.added === 1 ? 'شريحة' : `${result.added} شرائح`;
      setBuildNotice({ busy: false, ok: true, message: `أُضيفت ${word} من «${g.name}» لصفحتك${fit ? ' بألوان وخطوط ستايلها' : ''}. إذا ما عجبتك اكبس تراجع (${/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'}+Z).` });
      return { ok: true, message: 'أُضيفت لصفحتك.' };
    } catch (err) {
      console.warn('Could not add the gallery design to the page:', err);
      return { ok: false, message: 'تعذّرت الإضافة. جرّب مرة ثانية.' };
    }
  };

  // «عدّل إجاباتي»: back to the questions of the open kind.
  const openQuestions = () => {
    flushProjectSave();
    setStartKind(project);
    setIsStartActive(true);
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

  // The cloud in the top bar: saves the open project to the cloud now (it also saves itself a
  // moment after every change). Resolves once Firebase has it, or false when it could not.
  const handleManualSave = () => (galleryEditRef.current ? saveGalleryEdit() : flushProjectSave());

  const handleStepChange = (_stepNum: number) => {
    setIsCanvasLoading(true);
    setTimeout(() => {
      setIsCanvasLoading(false);
    }, 900);
  };

  // Clears the signed-out account from memory. Without this, the previous account's pages/elements
  // stay in React state, and if a DIFFERENT person then signs up as a new user on this same browser
  // without a page refresh, handleAuthSuccess's "preserve current design for the new user" logic
  // would hand them the previous user's page.
  const resetAfterSignOut = () => {
    resetAccountMemory();
    designerModeRef.current = false;
    draftReadyRef.current = false;
    setDesignerMode(false);
    setIsDesigner(false);
    setIsExportOpen(false);
    setIsOrdersOpen(false);
    setActiveUserUid('mouhamadeiah');
    setIsProjectChosen(false);
    setIsAuthActive(true);
    setIsLawActive(false);
    setIsAccountActive(false);
    setIsHomeActive(false);
    setStartKind(null);
    setIsStartActive(true);
  };

  const handleLogout = async () => {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من الحساب السحابي؟')) {
      try {
        if (designerModeRef.current) await saveActiveDraft();
        await logoutUser();
        resetAfterSignOut();
      } catch (e) {
        alert('تعذر تسجيل الخروج.');
      }
    }
  };

  const openMyAccount = (section?: 'notices') => {
    if (screenRef.current === 'editor') flushProjectSave();
    setIsHomeActive(false);
    setIsStartActive(false);
    setIsLawActive(false);
    setAccountSection(section || null);
    setIsAccountActive(true);
    window.scrollTo({ top: 0 });
  };

  // «إيقاف مؤقت» on the account page: the project stays, its link stops until it is published again.
  const pauseProject = (key: string) =>
    unpublishSite(activeUserUid, key).then(
      () => {
        setMyProjectsTick((n) => n + 1);
        return true;
      },
      () => false
    );

  // «حذف» on the account page: the link stops, then the project's design and local copies go.
  const deleteProject = async (key: string) => {
    try {
      const row = myProjects?.find((p) => p.key === key);
      if (row?.published) await unpublishSite(activeUserUid, key);
      if (key === projectKey) {
        // The open project must not be saved back by the editor's saves.
        projectReadyRef.current = false;
        setIsProjectChosen(false);
      }
      await deleteProjectData(activeUserUid, key);
      const prefix = localPrefixOf(key);
      try {
        for (const part of ['pages', 'elements', 'admin']) localStorage.removeItem(`${prefix}${part}_${activeUserUid}`);
      } catch {
        // nothing kept locally
      }
      if (isFirstOfKind(key)) ownedRef.current = { ...ownedRef.current, [kindOf(key)]: false };
      setMyProjectsTick((n) => n + 1);
      return true;
    } catch (e) {
      console.warn('Could not delete the project:', e);
      return false;
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

  // The latest pushToHistory, for answers that arrive after a wait.
  const pushToHistoryRef = useRef(pushToHistory);
  pushToHistoryRef.current = pushToHistory;
  const DESIGNER_AI_NOTE = 'Wee AI في وضع المصمم يحتاج رصيد توكنز، وشراء التوكنز غير متاح حالياً. التصميم اليدوي مفتوح.';

  // «ابن صفحتي»: Wee AI designs the page from the owner's answers (ready slides in the owner's
  // palette, texts, photos and links) and replaces the page's slides; a store's other pages take
  // the new colours and fonts. Undo works on elements only, so the page as it was is kept here
  // and «رجّع صفحتي متل ما كانت» brings it back.
  const builtBackupRef = useRef<{ pages: Page[]; elements: CanvasElement[]; activePageId: string; uid: string; project: ProjectType } | null>(null);
  const handleBuildPage = async (given: WeeAnswers, auto = false) => {
    if (designerModeRef.current) return { ok: false, message: DESIGNER_AI_NOTE };
    const kind = KIND_OF_PROJECT[project];
    const page = pagesRef.current.find((p) => p.id === activePageId) || currentPage;
    const siteName = page.navbar.brandName || PROJECT_KIND_LABEL[project];
    const target = kind === 'free' ? `شرائح صفحة «${page.name}»` : 'شرائح الصفحة الرئيسية';
    // Right after the questions the owner asked for the build: no question then, the old page is kept.
    if (!auto && !window.confirm(`Wee AI رح يصمم ${target} من جديد من معلوماتك ويستبدل الشرائح الموجودة. بتقدر ترجع الصفحة القديمة بعدين. نكمل؟`)) {
      return { ok: false, message: 'ما تغير شي بصفحتك.' };
    }
    // The owner's photos go into the page as links, never as full-size inline images.
    const answers = await hostAnswerImages(given);
    const result = await requestPagePlan(kind, buildProfile(answers, siteName), pageAssets(answers), projectKey);
    if (!result.ok) return { ok: false, message: result.message };
    const before = { pages: pagesRef.current, elements: elementsRef.current, activePageId };
    const built = await buildPageFromPlan(result.plan, { kind, answers, siteName, pages: before.pages, elements: before.elements, activePageId });
    if (!built.ok) return { ok: false, message: built.message };
    builtBackupRef.current = { ...before, uid: activeUserUid, project };
    setHasBuildBackup(true);
    setPages(built.pages);
    setElements(built.elements);
    setHistory([built.elements]);
    setHistoryIndex(0);
    setActivePageId(built.pageId);
    setActiveSlideId(built.firstSlideId);
    setSelectedElementId(null);
    return { ok: true, message: `بنى Wee AI ${built.sections} أقسام لصفحتك. عدّل أي شي بدك ياه، أو اكبس «رجّع صفحتي متل ما كانت».` };
  };
  // «ستايل الصفحة»: a look restyles every page of the site at once. Undo works on elements only,
  // so the site as it was before the last pick is kept for «رجّع الستايل اللي قبل».
  const lookBackupRef = useRef<{ pages: Page[]; elements: CanvasElement[]; uid: string; project: ProjectType } | null>(null);
  const [hasLookBackup, setHasLookBackup] = useState(false);
  const handleApplyPageLook = (look: PageLook) => {
    lookBackupRef.current = { pages: pagesRef.current, elements: elementsRef.current, uid: activeUserUid, project };
    setHasLookBackup(true);
    const next = applyPageLook(pagesRef.current, elementsRef.current, look, KIND_OF_PROJECT[project]);
    setPages(next.pages);
    pushToHistory(next.elements);
  };
  const handleUndoPageLook = () => {
    const backup = lookBackupRef.current;
    if (!backup || backup.uid !== activeUserUid || backup.project !== project) return;
    lookBackupRef.current = null;
    setHasLookBackup(false);
    setPages(backup.pages);
    pushToHistory(backup.elements);
  };

  // Everything the editor holds in memory belongs to one account. When the account changes (sign-in, sign-out) all of it goes, so
  // nothing of the previous account is shown to, undone into, or saved under the next one (the saving effects wait for the next
  // account's workspace: projectReadyRef).
  const resetAccountMemory = () => {
    loadSeqRef.current++;
    projectReadyRef.current = false;
    builtBackupRef.current = null;
    setHasBuildBackup(false);
    lookBackupRef.current = null;
    setHasLookBackup(false);
    afterQuestionsRef.current = null;
    setBuildNotice(null);
    setPages([initialPage]);
    setElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedElementId(null);
    setActivePageId('page-home');
    setActiveSlideId('slide-1');
    setProject('page');
    setProjectKey('page');
    setHasShop(false);
    setShopAdmin(createEmptyShopAdmin());
    setHasCars(false);
    setCarAdmin(createEmptyCarAdmin());
    setHasRestaurant(false);
    setRestaurantAdmin(createEmptyRestaurantAdmin());
    ownedRef.current = { page: false, shop: false, cars: false, restaurant: false };
  };

  const handleRestoreBuiltPage = () => {
    const backup = builtBackupRef.current;
    // A copy kept for another account (or another project) is never put into this one.
    if (!backup || backup.uid !== activeUserUid || backup.project !== project) return { ok: false, message: 'ما في صفحة قديمة محفوظة.' };
    builtBackupRef.current = null;
    setHasBuildBackup(false);
    setPages(backup.pages);
    setElements(backup.elements);
    setHistory([backup.elements]);
    setHistoryIndex(0);
    setActivePageId(backup.activePageId);
    setActiveSlideId(backup.pages.find((p) => p.id === backup.activePageId)?.slides[0]?.id || 'slide-1');
    setSelectedElementId(null);
    return { ok: true, message: 'رجعت صفحتك متل ما كانت قبل ما يبنيها Wee AI.' };
  };

  // Right after the questions, once their kind is open in the editor: a project that had nothing
  // saved starts on an empty main page (not the ready template), and Wee AI's panel shows the answers
  // with «ابن صفحتي». The owner decides there to design the page themselves or let Wee AI build it.
  useEffect(() => {
    const kind = afterQuestionsRef.current;
    if (!kind || !isProjectChosen || projectLoading || isStartActive || project !== kind) return;
    afterQuestionsRef.current = null;
    // Only right after the project was first created: answering again from «عدّل إجاباتي» keeps the page.
    const fresh = freshProjectRef.current;
    freshProjectRef.current = false;
    if (fresh && kind !== 'page') {
      const blank = emptyMainPage(KIND_OF_PROJECT[kind], pagesRef.current, elementsRef.current, activePageId);
      setPages(blank.pages);
      setElements(blank.elements);
      setHistory([blank.elements]);
      setHistoryIndex(0);
      setActivePageId(blank.pageId);
      setActiveSlideId(blank.slideId);
      setSelectedElementId(null);
    }
    setBuildNotice({ busy: false, ok: true, message: 'انحفظت إجاباتك. صمّم صفحتك بإيدك، أو اكبس «ابن صفحتي» من لوحة Wee AI وهو بيبنيها من إجاباتك.' });
    setIsChatActive(true);
    setIsRightDrawerOpen(true);
  }, [isProjectChosen, projectLoading, isStartActive, project]);

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
        backgroundVideo: currentSlide.backgroundVideo,
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
            backgroundVideo: copiedFormat.backgroundVideo,
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

  // The look cards show the owner's own site: its name, the first heading, text and button of its
  // first page, and its first dish, product, car or price.
  const lookSample = useMemo((): LookSample => {
    const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const home = pages[0];
    const order = new Map((home?.slides || []).map((s, i) => [s.id, i]));
    const els = elements.filter((e) => order.has(e.slideId)).sort((a, b) => order.get(a.slideId)! - order.get(b.slideId)! || a.y - b.y);
    const first = (type: string) => els.map((e) => (e.type === type ? plain(e.content || '') : '')).find((t) => t.length > 1) || '';
    const dish = project === 'restaurant' ? restaurantAdmin.dishes.find((d) => d.published) : undefined;
    const product = project === 'shop' ? shopAdmin.products[0] : undefined;
    const car = project === 'cars' ? carAdmin.cars.find((c) => c.showPrice && c.price > 0) : undefined;
    const plan = els.find((e) => e.pricingPlan && e.pricingPrice);
    const item = dish ? { name: dish.name, price: formatMoney(dish.price, restaurantAdmin.settings.currency) }
      : product ? { name: product.name, price: formatMoney(product.price, product.currency) }
      : car ? { name: `${car.brand} ${car.model}`.trim(), price: formatMoney(car.price, car.currency) }
      : plan ? { name: plan.pricingPlan!, price: plan.pricingPrice! } : undefined;
    return {
      name: home?.navbar.brandName || PROJECT_KIND_LABEL[project],
      title: first('heading') || 'عنوان صفحتك',
      text: first('paragraph') || 'هون بيطلع أول نص من صفحتك.',
      button: (first('button') || 'تواصل معنا').slice(0, 24),
      item,
    };
  }, [pages, elements, project, restaurantAdmin, shopAdmin, carAdmin]);
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
    if (target && isLockedRatings(target)) return;
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
    cmds.push({ id: 'admin', section: 'أوامر', title: project === 'shop' ? 'إدارة المتجر' : project === 'cars' ? 'إدارة معرض السيارات' : project === 'restaurant' ? 'إدارة المطعم' : 'إدارة الصفحة', keywords: 'ادارة طلبات منتجات مواعيد حجوزات زوار', icon: <Store size={14} />, run: openAdmin });
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
      ratings: {
        name: 'التقييمات',
        width: 1000,
        height: 380,
        content: customContent || 'التقييمات',
        styles: { backgroundColor: '#ffffff', borderRadius: 24, ...(customStyles || {}) },
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

  const handleAddSlideTemplate = (template: { name: string; height: number; backgroundColor: string; backgroundImage?: string; backgroundVideo?: string; backgroundOpacity?: number; backgroundAttachment?: 'scroll' | 'fixed'; dividerShape?: string; aiTemplate?: string; mobileHeight?: number; elements: any[] }) => {
    const newSlideId = `slide-${Date.now()}`;
    const newSlide: Slide = {
      id: newSlideId,
      name: template.name,
      height: template.height,
      backgroundColor: template.backgroundColor,
      ...(template.backgroundVideo ? { backgroundVideo: template.backgroundVideo } : {}),
      ...(template.dividerShape ? { dividerShape: template.dividerShape as Slide['dividerShape'] } : {}),
      ...(template.aiTemplate ? { aiTemplate: template.aiTemplate } : {}),
      ...(template.mobileHeight ? { mobileHeight: template.mobileHeight } : {}),
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
    const lockedRatings = elements.find((el) => el.slideId === slideId && el.type === 'ratings');
    if (lockedRatings && isLockedRatings(lockedRatings)) return;
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

  // The phone view arranges the slides that have no phone layout yet, as the published page does
  // (the designs' own phone layouts and the owner's phone edits stay), and folds the navbar's page
  // names into a menu. It replaced the «تنسيق الموبايل» button (Eyad, 13 Oct).
  const handleChangePreviewMode = (mode: DevicePreviewMode) => {
    setPreviewMode(mode);
    if (mode !== 'mobile') return;
    const arranged = withPhoneLayouts(pages, elements);
    if (arranged.elements !== elements) pushToHistory(arranged.elements);
    if (arranged.elements !== elements || pages.some(p => !p.navbar.mobileMenu)) {
      setPages(arranged.pages.map(p => (p.navbar.mobileMenu ? p : { ...p, navbar: { ...p.navbar, mobileMenu: true } })));
    }
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

  // «من معرض التصاميم» in the add panel: a slide goes to the end of the open page.
  const handleAddGallerySlide = (g: GallerySlide, fit: boolean) => {
    const result = insertDesign(pagesRef.current, elementsRef.current, { slides: [g.slide], elements: g.elements }, { pageId: activePageId, fit });
    if (!result) {
      setBuildNotice({ busy: false, ok: false, message: 'ما قدرت أضيف الشريحة. جرّب مرة ثانية.' });
      return;
    }
    const before = { pages: pagesRef.current, elements: elementsRef.current, pageId: activePageId, slideId: activeSlideId };
    setPages(result.pages);
    pushToHistoryRef.current(result.elements);
    setActiveSlideId(result.firstSlideId);
    setSelectedElementId(null);
    const user = auth.currentUser;
    if (user && !user.isAnonymous) recordUse(user, g.id).catch(() => {});
    setBuildNotice({
      busy: false,
      ok: true,
      message: `أُضيفت «${g.name}" لصفحتك${fit ? ' بألوان وخطوط ستايلها' : ''}.`.replace('"', '»'),
      undo: () => {
        setPages(before.pages);
        pushToHistoryRef.current(before.elements);
        setActivePageId(before.pageId);
        setActiveSlideId(before.slideId);
        setBuildNotice(null);
      },
    });
  };

  // A gallery design (a navbar and slides) becomes a new page of the project, with the name the person gave it: the navbar lists
  // pages by name by itself, so the name appears there and its link opens the page. «شريط التصميم» gives the whole project the
  // design's navbar look, keeping the project's own name, logo, links and button.
  const handleAddGalleryPage = (g: GallerySlide, o: { name: string; fit: boolean; navbar: 'mine' | 'design' }) => {
    if (!g.page?.slides?.length) return;
    const before = { pages: pagesRef.current, elements: elementsRef.current, pageId: activePageId, slideId: activeSlideId };
    const base = before.pages.find((p) => p.id === activePageId) || before.pages[0];
    const stamp = Date.now();
    const name = (o.name.trim() || g.name).slice(0, 30);
    const newPage: Page = {
      ...base,
      id: `page-${stamp}`,
      name,
      slug: `/${name.toLowerCase().replace(/\s+/g, '-')}-${stamp.toString(36)}`,
      slides: [{ id: `slide-${stamp}`, name: 'شريحة ١', height: 540, backgroundColor: '#ffffff' }],
    };
    const result = insertDesign([...before.pages, newPage], before.elements, { slides: g.page.slides, elements: g.elements }, { pageId: newPage.id, fit: o.fit });
    if (!result) {
      setBuildNotice({ busy: false, ok: false, message: 'ما قدرت أضيف الصفحة. جرّب مرة ثانية.' });
      return;
    }
    const dn = g.page.navbar;
    const pagesNext = o.navbar === 'design' && dn
      ? result.pages.map((p) => ({
          ...p,
          navbar: {
            ...dn,
            brandName: p.navbar.brandName, brandSubtext: p.navbar.brandSubtext, showBrandName: p.navbar.showBrandName, logoUrl: p.navbar.logoUrl,
            items: p.navbar.items, ctaText: p.navbar.ctaText, ctaHref: p.navbar.ctaHref, ctaLinkType: p.navbar.ctaLinkType, ctaLinkTargetId: p.navbar.ctaLinkTargetId,
            partIcons: p.navbar.partIcons,
          },
        }))
      : result.pages;
    setPages(pagesNext);
    pushToHistoryRef.current(result.elements);
    setActivePageId(newPage.id);
    setActiveSlideId(result.firstSlideId);
    setSelectedElementId(null);
    const user = auth.currentUser;
    if (user && !user.isAnonymous) recordUse(user, g.id).catch(() => {});
    setBuildNotice({
      busy: false,
      ok: true,
      message: `أُضيفت صفحة «${name}» إلى مشروعك، واسمها في الشريط.`,
      undo: () => {
        setPages(before.pages);
        pushToHistoryRef.current(before.elements);
        setActivePageId(before.pageId);
        setActiveSlideId(before.slideId);
        setBuildNotice(null);
      },
    });
  };

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
          styleLook: undefined,
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
    bg: { backgroundColor?: string; backgroundImage?: string; backgroundVideo?: string; backgroundSize?: 'cover' | 'contain' | 'auto'; backgroundPosition?: string; backgroundRepeat?: string; backgroundAttachment?: 'scroll' | 'fixed' }
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

  // The browser's back button walks back through Weelink's screens (home, the start page and its
  // questions, sign-in, the editor) instead of leaving the site: each screen is an
  // entry in the browser's history.
  const screen = isAccountActive ? 'account' : isLawActive ? 'law' : isHomeActive ? 'home' : isStartActive ? 'start' : isAuthActive ? 'auth' : !isProjectChosen ? 'start' : 'editor';
  const screenRef = useRef(screen);
  screenRef.current = screen;
  // Customers' page fonts load once the editor opens (Weelink's own screens don't use them).
  useEffect(() => {
    if (screen === 'editor') loadPageFonts();
  }, [screen]);
  const poppedRef = useRef(false);
  const goToScreenRef = useRef<(target: string, kind?: ProjectType | null) => void>(() => {});
  goToScreenRef.current = (target, kind) => {
    const signedIn = !!currentUser && !currentUser.isAnonymous;
    const asked = target === 'chooser' ? 'start' : target; // the old projects page's entries
    const to = !signedIn && (asked === 'editor' || asked === 'account') ? 'start' : signedIn && asked === 'auth' ? 'start' : asked;
    if (screenRef.current === 'editor' && to !== 'editor') flushProjectSave();
    setIsLawActive(to === 'law');
    setIsAccountActive(to === 'account' && signedIn);
    setIsHomeActive(to === 'home');
    setIsStartActive(to === 'start');
    if (to === 'start') setStartKind(kind || null);
    if (to === 'auth') setIsAuthActive(true);
    else if (signedIn) setIsAuthActive(false);
    if (to === 'editor') setIsProjectChosen(projectReadyRef.current);
  };
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const target = e.state?.screen;
      if (!target || target === screenRef.current) return;
      poppedRef.current = true;
      goToScreenRef.current(target, e.state.kind);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // A refresh comes back to the screen it was on (the editor with its project, the account, the home page)
  // instead of the start page: the screen is kept for the tab and restored once the sign-in is known.
  const resumeRef = useRef<{ screen: string; key: string } | null>(readResume());
  useEffect(() => {
    const resume = resumeRef.current;
    if (!resume || isFirebaseLoading || handledAuthUid.current === undefined) return;
    resumeRef.current = null;
    if (resume.screen === 'editor') {
      if (!currentUser || currentUser.isAnonymous || !isProjectKey(resume.key)) return;
      setIsAuthActive(false);
      handleChooseProject(resume.key).then(() => {
        setIsStartActive(false);
        setIsHomeActive(false);
      }).catch(() => {});
    } else {
      goToScreenRef.current(resume.screen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirebaseLoading, currentUser]);
  useEffect(() => {
    if (isFirebaseLoading) return;
    if (!resumeRef.current) {
      try {
        if (screen === 'editor' && !designerModeRef.current) sessionStorage.setItem(RESUME_KEY, JSON.stringify({ screen, key: projectKey }));
        else if (screen === 'account' || screen === 'home' || screen === 'law') sessionStorage.setItem(RESUME_KEY, JSON.stringify({ screen, key: '' }));
        else sessionStorage.removeItem(RESUME_KEY);
      } catch {
        // storage unavailable: a refresh just starts from the start page
      }
    }
    const current = window.history.state?.screen;
    if (poppedRef.current || !current) {
      poppedRef.current = false;
      if (current !== screen) window.history.replaceState({ screen }, '');
      return;
    }
    if (current !== screen) window.history.pushState({ screen }, '');
  }, [screen, isFirebaseLoading, projectKey]);

  if (isFirebaseLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans">
        <span className="text-xs text-neutral-400 font-bold animate-pulse">جاري الاتصال السحابي...</span>
      </div>
    );
  }

  if (isAccountActive && currentUser && !currentUser.isAnonymous) {
    return (
      <AccountPage
        user={currentUser}
        accountId={activeUserUid}
        isDesigner={isDesigner}
        projects={myProjects}
        loadingType={projectLoading}
        section={accountSection}
        onHome={() => {
          setIsAccountActive(false);
          setIsHomeActive(true);
        }}
        onStart={() => {
          setIsAccountActive(false);
          setStartKind(null);
          setIsStartActive(true);
        }}
        onOpenMyPage={() => openMyPage(activeUserUid)}
        onLaw={() => {
          setIsAccountActive(false);
          setIsLawActive(true);
        }}
        onAccount={() => {}}
        onMyAccount={(section) => {
          setAccountSection(section || null);
          if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
        onOpenProject={async (key) => {
          await handleChooseProject(key);
          setIsAccountActive(false);
          setIsStartActive(false);
          setIsProjectChosen(true);
        }}
        onPauseProject={pauseProject}
        onDeleteProject={deleteProject}
        onOpenDesigner={async () => {
          setIsAccountActive(false);
          setIsStartActive(false);
          setIsHomeActive(false);
          setIsAuthActive(false);
          setIsProjectChosen(true);
          await enterDesignerMode();
        }}
        onAccountDeleted={resetAfterSignOut}
      />
    );
  }

  if (isLawActive) {
    return (
      <LawPage
        user={currentUser}
        onHome={() => {
          setIsLawActive(false);
          setIsStartActive(false);
          setIsHomeActive(true);
        }}
        onStart={() => {
          setIsLawActive(false);
          setStartKind(null);
          setIsStartActive(true);
        }}
        onOpenMyPage={() => openMyPage(activeUserUid)}
        onLaw={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onAccount={() => {
          setAuthMode('login');
          afterSignInRef.current = 'account';
          pendingBuildRef.current = null;
          setIsLawActive(false);
          setIsAuthActive(true);
        }}
        onMyAccount={openMyAccount}
        onLogout={handleLogout}
      />
    );
  }

  if (isHomeActive) {
    return (
      <HomePage
        user={currentUser}
        onAccount={() => {
          setAuthMode('login');
          afterSignInRef.current = 'account';
          pendingBuildRef.current = null;
          setIsHomeActive(false);
          setIsAuthActive(true);
        }}
        onBuild={() => {
          afterSignInRef.current = 'build';
          setStartKind(null);
          setIsHomeActive(false);
          setIsStartActive(true);
        }}
        onOpenMyPage={() => openMyPage(activeUserUid)}
        onLaw={() => {
          setIsHomeActive(false);
          setIsLawActive(true);
        }}
        onMyAccount={openMyAccount}
        onLogout={handleLogout}
      />
    );
  }

  // The start page is also where the Weelink logo leads from the editor: the kinds of page, with
  // «كمّل صفحتك» on the ones the account has (it replaced the old projects page, Eyad 13 Oct).
  if (isStartActive || (!isProjectChosen && !isAuthActive)) {
    return (
      <StartPage
        key={startKind || 'kinds'}
        user={currentUser}
        accountId={activeUserUid}
        initialKind={startKind}
        loadingType={projectLoading}
        onHome={() => {
          setIsStartActive(false);
          setStartKind(null);
          setIsHomeActive(true);
        }}
        onOpenMyPage={() => openMyPage(activeUserUid)}
        onLaw={() => {
          setIsStartActive(false);
          setIsLawActive(true);
        }}
        onAccount={() => {
          setAuthMode('login');
          afterSignInRef.current = 'account';
          pendingBuildRef.current = null;
          setIsStartActive(false);
          setIsAuthActive(true);
        }}
        onMyAccount={openMyAccount}
        onLogout={handleLogout}
        onBuild={openAfterQuestions}
        owned={(Object.keys(ownedRef.current) as ProjectType[]).filter((k) => ownedRef.current[k])}
        onDesigner={joinDesigners}
        onAddDesign={addGalleryDesign}
        onEditDesign={isDesigner ? editMyDesign : undefined}
        onSignUp={(kind) => {
          afterSignInRef.current = 'build';
          pendingBuildRef.current = kind;
          setIsStartActive(false);
          setIsAuthActive(true);
        }}
      />
    );
  }

  if (isAuthActive) {
    return (
      <>
        <StandardAuth
          key={authMode}
          initialMode={authMode}
          onLoginWithGoogle={handleLogin}
          onAuthSuccess={handleAuthSuccess}
        />
        <button
          type="button"
          onClick={() => { setIsLawActive(false); setStartKind(null); setIsStartActive(true); }}
          className="fixed top-3 right-3 z-[60] bg-surface border border-line rounded-full px-3.5 py-1.5 text-xs font-bold text-muted hover:text-ink"
          dir="rtl"
        >
          → الرئيسية
        </button>
      </>
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
    <BookingPageContext.Provider value={bookingPage}>
    <RatingsSlideContext.Provider value={ratingsSlide}>
    <div className="min-h-screen bg-bg text-ink flex flex-col antialiased selection:bg-brand/15 selection:text-brand">
      {/* The build after the questions: working, then what came of it */}
      {buildNotice && (
        <div dir="rtl" role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[99999] max-w-[92vw] w-[26rem] bg-white border border-neutral-200 shadow-[0_16px_40px_rgba(0,0,0,0.18)] rounded-2xl px-4 py-3 flex items-start gap-3 text-xs font-semibold text-neutral-800">
          {buildNotice.busy ? <Loader2 size={16} className="animate-spin text-brand shrink-0 mt-0.5" /> : <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${buildNotice.ok ? 'bg-green-500' : 'bg-rose-500'}`} />}
          <p className="flex-1 leading-relaxed">{buildNotice.message}</p>
          {buildNotice.undo && <button type="button" onClick={buildNotice.undo} className="shrink-0 rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand/20">تراجع</button>}
          {!buildNotice.busy && (
            <button type="button" onClick={() => setBuildNotice(null)} className="text-neutral-400 hover:text-neutral-800 font-bold" aria-label="إغلاق">✕</button>
          )}
        </div>
      )}
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
                  <div className="text-xs text-gray-600 font-bold mb-1">1. نطاق المحرر الحالي (Dev):</div>
                  <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-800 break-all select-all">
                    <span>ais-dev-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('ais-dev-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app');
                        alert('تم نسخ نطاق المحرر (Dev) بنجاح!');
                      }}
                      className="shrink-0 bg-brand hover:bg-brand-hover text-white px-2.5 py-1 rounded-md text-xs font-sans transition-all cursor-pointer"
                    >
                      نسخ
                    </button>
                  </div>
                </div>

                {/* Pre Domain */}
                <div className="mb-3">
                  <div className="text-xs text-gray-600 font-bold mb-1">2. نطاق المعاينة والنشر (Live):</div>
                  <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-800 break-all select-all">
                    <span>ais-pre-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('ais-pre-s7v6hg2ymnenfiwu6if6oo-430862877888.europe-west2.run.app');
                        alert('تم نسخ نطاق المعاينة (Live) بنجاح!');
                      }}
                      className="shrink-0 bg-brand hover:bg-brand-hover text-white px-2.5 py-1 rounded-md text-xs font-sans transition-all cursor-pointer"
                    >
                      نسخ
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                  <p className="font-bold">⚠️ ملاحظة مهمة جداً:</p>
                  <p>تأكد من حرف <strong>h</strong> في كلمة <strong>s7v6hg</strong> (وليست lg).</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setAuthErrorModal(null)}
                className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
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
          onChangePreviewMode={handleChangePreviewMode}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
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
          onPublish={currentUser && !currentUser.isAnonymous ? () => setIsPublishOpen(true) : undefined}
          isPublished={!!publishedName}
          isDesigner={isDesigner}
          isDesignerMode={designerMode}
          onToggleDesignerMode={designerMode ? exitDesignerMode : enterDesignerMode}
          onExportSlide={clientSession || galleryEdit ? undefined : () => setIsExportOpen(true)}
        />
        {designerMode && !isPreviewActive && galleryEdit && (
          <GalleryEditBar as={galleryEdit.as} name={galleryEdit.name} kind={galleryEdit.kind} status={galleryEdit.status} pendingEdit={galleryEdit.pendingEdit} saving={gallerySaving} savedNote={gallerySavedNote} onSave={saveGalleryEdit} onLeave={leaveGalleryEdit} />
        )}
        {designerMode && !isPreviewActive && !galleryEdit && (
          <DesignerBar drafts={drafts} activeSlot={activeSlot} busy={draftBusy} onOpen={switchDraft} onNew={newDraft} onDelete={removeDraft} onOrders={() => setIsOrdersOpen(true)} onDashboard={() => setIsDashboardOpen(true)} attention={orderAttention} client={clientSession ? { expiresAt: clientSession.expiresAt, onLeave: () => switchDraft(draftsRef.current[0]?.slot || '') } : undefined} />
        )}

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
          navActions={isOwnerView ? [{ id: 'nav-owner-admin', label: 'الإدارة', onClick: openAdmin }] : undefined}
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
            <Loader2 className="w-9 h-9 text-brand animate-spin mb-3" />
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
              : { label: 'إدارة الصفحة', onOpen: () => setIsPageAdminOpen(true) }
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
        key={activeUserUid}
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
        onAddGallerySlide={handleAddGallerySlide}
        onAddGalleryPage={handleAddGalleryPage}
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
        pageLookPicker={
          <PageLookPicker
            kind={KIND_OF_PROJECT[project]}
            current={pages[0]?.styleLook}
            aiLook={pages[0]?.aiLook}
            sample={lookSample}
            onPick={handleApplyPageLook}
            onUndo={hasLookBackup ? handleUndoPageLook : undefined}
          />
        }
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
        onBuildPage={handleBuildPage}
        galleryLimit={limits.gallery}
        onRestorePage={handleRestoreBuiltPage}
        onEditAnswers={openQuestions}
        restoreAvailable={hasBuildBackup}
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
            siteUrl={project === 'restaurant' ? restaurantSiteUrl(restaurantId) : undefined}
          />
        }
      />
      </RestaurantDataContext.Provider>

      {/* Online Shop admin: floating gear + admin window */}
      {project === 'shop' && (
        <ShopAdminPanel data={shopAdmin} onChange={updateShopAdmin} openRequest={adminOpenRequest} hideGear={isDocked || isOwnerView} onEditPage={isPreviewActive ? editPageFromAdmin : undefined} />
      )}
      {project === 'cars' && (
        <CarAdminPanel data={carAdmin} onChange={updateCarAdmin} openRequest={adminOpenRequest} hideGear={isDocked || isOwnerView} onEditPage={isPreviewActive ? editPageFromAdmin : undefined} />
      )}
      {project === 'restaurant' && (
        <RestaurantAdminPanel data={restaurantAdmin} onChange={updateRestaurantAdmin} ownerUid={ownerUid} restaurantId={restaurantId} access={access} openRequest={adminOpenRequest} hideGear={isDocked || isOwnerView} onEditPage={isPreviewActive ? editPageFromAdmin : undefined} />
      )}
      {project === 'page' && (
        <PageAdminPanel
          open={isPageAdminOpen}
          onClose={() => setIsPageAdminOpen(false)}
          owner={ownerUid}
          project={projectKey}
          pageName={currentPage.navbar.brandName || ''}
          published={!!publishedName}
          onEditPage={isPreviewActive ? editPageFromAdmin : undefined}
          onPublish={() => setIsPublishOpen(true)}
        />
      )}

      {/* Workspace Hub Drawer Panel */}
      <WorkspaceHub isOpen={isWorkspaceHubOpen} onClose={() => setIsWorkspaceHubOpen(false)} />
      {designerLock && screen === 'editor' && !designerMode && project === 'page' && currentUser && (
        <div className="fixed inset-0 z-[4000020] bg-black/60 flex items-center justify-center p-4" dir="rtl" role="alertdialog" aria-modal="true" aria-label="المصمم يعدّل صفحتك">
          <div className="w-full max-w-md rounded-card bg-surface border border-line p-6 space-y-3 text-center">
            <h2 className="text-heading font-bold">{designerLock.designerName} يعدّل صفحتك الآن</h2>
            <p className="text-sm text-muted leading-relaxed">أُوقف التحرير هنا حتى لا تمحو تعديلاتكما بعضها. ينتهي رمز دخوله {new Date(designerLock.expiresAt).toLocaleString('ar-SY', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}، ثم تعود صفحتك بتعديلاته. تستطيع سحب الرمز الآن إن أردت التعديل بنفسك.</p>
            <button type="button" onClick={async () => { try { await revokeAccessCode(currentUser, designerLock.id); pageLockRef.current = false; setDesignerLock(null); await loadUserWorkspace(activeUserUid); } catch { window.alert('تعذّر سحب الرمز. جرّب مرة ثانية.'); } }} className="h-11 px-5 rounded-ctl bg-danger text-white text-sm font-bold cursor-pointer">سحب الرمز وتعديل صفحتي</button>
          </div>
        </div>
      )}
      {designerMode && isDashboardOpen && currentUser && <DesignerDashboard user={currentUser} onClose={() => setIsDashboardOpen(false)} />}
      {designerMode && isOrdersOpen && currentUser && <DesignOrdersPanel user={currentUser} onClose={() => setIsOrdersOpen(false)} onEnterClientPage={async (id, code) => { const r = await openClientSession(id, code); if (r.ok) setIsOrdersOpen(false); return r; }} />}
      {designerMode && isExportOpen && currentUser && (() => {
        // A page draft is exported whole (its navbar and its slides, up to three); a slide draft, the open slide.
        const kind: DesignKind = drafts.find((d) => d.slot === activeSlot)?.kind || 'slide';
        const slides = kind === 'page' ? pages.flatMap((p) => p.slides) : [currentSlide];
        const ids = new Set(slides.map((sl) => sl.id));
        const mine = elements.filter((e) => ids.has(e.slideId));
        const problem = kind !== 'page' ? '' : pages.length !== 1 ? 'تصميم الصفحة هو صفحة واحدة (حتى ثلاث شرائح). احذف الصفحات الزائدة من قائمة الصفحات.' : slides.length < 1 || slides.length > PAGE_MAX_SLIDES ? `الصفحة حتى ${PAGE_MAX_SLIDES} شرائح، وعندك ${slides.length}.` : '';
        return (
          <ExportSlideModal
            designerUid={currentUser.uid}
            designerName={designerName}
            draftSlot={activeSlot}
            kind={kind}
            slide={sanitizeData(slides[0])}
            page={kind === 'page' ? sanitizeData({ navbar: pages[0].navbar, slides }) : undefined}
            navbar={kind === 'page' ? pages[0].navbar : undefined}
            elements={mine}
            storedElements={serializeElements(mine)}
            problem={problem}
            onClose={() => setIsExportOpen(false)}
          />
        );
      })()}
      <PublishModal
        open={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        owner={ownerUid}
        project={projectKey}
        pages={pages}
        elements={elements}
        data={isPublishOpen ? publicDataFor(project, shopAdmin, carAdmin) : null}
        suggestedName={currentPage.navbar.brandName || ''}
        onPublishedChange={setPublishedName}
        used={{
          items: project === 'shop' ? shopAdmin.products.length : project === 'cars' ? carAdmin.cars.length : project === 'restaurant' ? restaurantAdmin.dishes.length : 0,
          devices: project === 'restaurant' ? restaurantAdmin.devices.filter((d) => d.active).length : 0,
        }}
      />
    </div>
    </RatingsSlideContext.Provider>
    </BookingPageContext.Provider>
  );
}
