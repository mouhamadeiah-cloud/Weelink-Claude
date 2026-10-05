import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The restaurant's own pages open from query links (no server rewrites needed):
// ?r=<uid> is the guests' site (with &t=<table> from a table's QR code), ?kitchen=<uid> the kitchen screen.
const PublicRestaurantSite = lazy(() => import('./components/restaurant/PublicRestaurantSite').then((m) => ({default: m.PublicRestaurantSite})));
const KitchenPage = lazy(() => import('./components/restaurant/KitchenScreen').then((m) => ({default: m.KitchenPage})));

const params = new URLSearchParams(window.location.search);
const siteUid = params.get('r');
const kitchenUid = params.get('kitchen');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {siteUid ? (
      <Suspense fallback={null}><PublicRestaurantSite uid={siteUid} /></Suspense>
    ) : kitchenUid ? (
      <Suspense fallback={null}><KitchenPage uid={kitchenUid} /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
