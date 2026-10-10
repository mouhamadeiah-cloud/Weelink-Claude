import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The restaurant's own pages open from query links (no server rewrites needed):
// ?r=<uid> is the guests' site (with &t=<table> from a table's QR code), ?kitchen=<uid> the kitchen
// screen, ?device=<uid> a restaurant tablet that opens its own screen by its code, and
// ?r=<uid>&order=<id>&k=<key> an order's status page (the link in the customer's confirmation email).
const PublicRestaurantSite = lazy(() => import('./components/restaurant/PublicRestaurantSite').then((m) => ({default: m.PublicRestaurantSite})));
const KitchenPage = lazy(() => import('./components/restaurant/KitchenScreen').then((m) => ({default: m.KitchenPage})));
const OrderStatusPage = lazy(() => import('./components/restaurant/OrderStatusPage').then((m) => ({default: m.OrderStatusPage})));
const DevicePage = lazy(() => import('./components/restaurant/DeviceScreen').then((m) => ({default: m.DevicePage})));

const params = new URLSearchParams(window.location.search);
const siteUid = params.get('r');
const kitchenUid = params.get('kitchen');
const deviceUid = params.get('device');
const orderId = params.get('order');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {siteUid && orderId ? (
      <Suspense fallback={null}><OrderStatusPage uid={siteUid} orderId={orderId} k={params.get('k') || ''} /></Suspense>
    ) : siteUid ? (
      <Suspense fallback={null}><PublicRestaurantSite uid={siteUid} /></Suspense>
    ) : kitchenUid ? (
      <Suspense fallback={null}><KitchenPage uid={kitchenUid} /></Suspense>
    ) : deviceUid ? (
      <Suspense fallback={null}><DevicePage uid={deviceUid} /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
