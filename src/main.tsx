import {StrictMode, lazy, Suspense, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {siteFromLocation, siteNameForHost} from './services/sites';
import {loadPageFonts} from './services/pageFonts';
import {ownerOfRestaurant} from './utils/projectKeys';

// The restaurant's own pages open from query links (no server rewrites needed):
// ?r=<uid> is the guests' site (with &t=<table> from a table's QR code), ?kitchen=<uid> the kitchen
// screen, ?device=<uid> a restaurant tablet that opens its own screen by its code, and
// ?r=<uid>&order=<id>&k=<key> an order's status page (the link in the customer's confirmation email).
const PublicRestaurantSite = lazy(() => import('./components/restaurant/PublicRestaurantSite').then((m) => ({default: m.PublicRestaurantSite})));
const KitchenPage = lazy(() => import('./components/restaurant/KitchenScreen').then((m) => ({default: m.KitchenPage})));
// A published page: <name>.testweelink.de, /?s=<name>, or a customer's own domain.
const PublicSite = lazy(() => import('./components/publish/PublicSite').then((m) => ({default: m.PublicSite})));
// The platform admin site (Eyad's team): admin.<domain>, or ?admin on any address (the server decides who gets in).
const AdminSite = lazy(() => import('./components/admin/AdminSite').then((m) => ({default: m.AdminSite})));
const SuspendedGate = lazy(() => import('./components/publish/SuspendedGate').then((m) => ({default: m.SuspendedGate})));
const OrderStatusPage = lazy(() => import('./components/restaurant/OrderStatusPage').then((m) => ({default: m.OrderStatusPage})));
const DevicePage = lazy(() => import('./components/restaurant/DeviceScreen').then((m) => ({default: m.DevicePage})));

const params = new URLSearchParams(window.location.search);
const siteUid = params.get('r');
const kitchenUid = params.get('kitchen');
const deviceUid = params.get('device');
const orderId = params.get('order');
const isAdminSite = window.location.hostname.toLowerCase().startsWith('admin.') || params.has('admin');
const publishedSite = isAdminSite ? null : siteFromLocation();

// Customers' pages (published pages, a restaurant's site and its order page) keep their own fonts:
// the page fonts load, and text with no font of its own (windows included) stays in the page font.
const showPageFonts = () => {
  loadPageFonts();
  document.body.classList.replace('font-sans', 'font-page');
};
if ((publishedSite && !('host' in publishedSite)) || siteUid) showPageFonts();

// Any other address is a customer's own domain only if one is connected (siteDomains); otherwise
// it is Weelink itself, wherever it is served from (a new domain, a preview host).
const HostGate = ({host}: {host: string}) => {
  const [name, setName] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    siteNameForHost(host).then((found) => {
      if (found) showPageFonts();
      setName(found);
    }).catch(() => setName(null));
  }, []);
  if (name === undefined) return null;
  return name ? <Suspense fallback={null}><PublicSite where={{name}} /></Suspense> : <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminSite ? (
      <Suspense fallback={null}><AdminSite /></Suspense>
    ) : publishedSite && 'host' in publishedSite && !siteUid ? (
      <HostGate host={publishedSite.host} />
    ) : publishedSite && !siteUid ? (
      <Suspense fallback={null}><PublicSite where={publishedSite} /></Suspense>
    ) : siteUid && orderId ? (
      <Suspense fallback={null}><OrderStatusPage uid={siteUid} orderId={orderId} k={params.get('k') || ''} /></Suspense>
    ) : siteUid ? (
      <Suspense fallback={null}><SuspendedGate owner={ownerOfRestaurant(siteUid)}><PublicRestaurantSite uid={siteUid} /></SuspendedGate></Suspense>
    ) : kitchenUid ? (
      <Suspense fallback={null}><KitchenPage uid={kitchenUid} /></Suspense>
    ) : deviceUid ? (
      <Suspense fallback={null}><DevicePage uid={deviceUid} /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
