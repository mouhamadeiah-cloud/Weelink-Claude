// The guests' restaurant site at /?r=<uid> (and a table's QR code at /?r=<uid>&t=<table>): the
// published pages, menu and settings from restaurants/{uid}, shown full-window with no editor and
// no sign-in. Phones get the phone layout (slides without one are arranged for phones on the fly).
// Orders go straight to the restaurant's live orders.
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { CanvasWorkspace } from '../CanvasWorkspace';
import type { CanvasElement, Page } from '../../types';
import { arrangeSlideForMobile } from '../../utils/mobileLayout';
import { withLocalGraphics } from '../../utils/localGraphics';
import { loadPublishedRestaurant, placeOrder, PublishedRestaurant } from './restaurantCloud';
import { RestaurantDataContext, RestaurantOrderContext } from './store/RestaurantDataContext';
import { readTableFromUrl } from './tableStore';
import type { MenuOrder } from './restaurantTypes';

const PHONE_MAX = 768;
const noop = () => {};

// Slides that have no phone layout yet get one, as «تنسيق الموبايل» would make it.
const withPhoneLayouts = (pages: Page[], elements: CanvasElement[]) => {
  const layouts = new Map<string, NonNullable<CanvasElement['mobile']>>();
  const nextPages = pages.map((p) => ({
    ...p,
    slides: p.slides.map((s) => {
      const els = elements.filter((e) => e.slideId === s.id);
      if (!els.length || els.some((e) => e.mobile)) return s;
      const { layouts: l, mobileHeight } = arrangeSlideForMobile(s, els);
      l.forEach((v, k) => layouts.set(k, v));
      return { ...s, mobileHeight };
    }),
  }));
  return { pages: nextPages, elements: layouts.size ? elements.map((e) => (layouts.has(e.id) ? { ...e, mobile: layouts.get(e.id) } : e)) : elements };
};

export const PublicRestaurantSite: React.FC<{ uid: string }> = ({ uid }) => {
  const [site, setSite] = useState<PublishedRestaurant | null | 'loading' | 'error'>('loading');
  const [pageId, setPageId] = useState('');
  const [phone, setPhone] = useState(() => window.innerWidth < PHONE_MAX);

  useEffect(() => {
    readTableFromUrl();
    loadPublishedRestaurant(uid)
      .then((s) => {
        setSite(s ? { ...s, elements: s.elements.map(withLocalGraphics) } : null);
        if (s?.pages[0]) setPageId(s.pages[0].id);
        if (s?.admin.settings.name) document.title = s.admin.settings.name;
      })
      .catch(() => setSite('error'));
  }, [uid]);

  useEffect(() => {
    const onResize = () => setPhone(window.innerWidth < PHONE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const view = useMemo(() => {
    if (!site || typeof site === 'string') return null;
    return phone ? withPhoneLayouts(site.pages, site.elements) : { pages: site.pages, elements: site.elements };
  }, [site, phone]);

  const submit = useMemo(
    () => async (o: MenuOrder) => {
      try {
        return await placeOrder(uid, o);
      } catch (e) {
        console.warn('Could not send the order:', e);
        return null;
      }
    },
    [uid]
  );

  if (site === 'loading') {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-white"><Loader2 size={36} className="animate-spin text-[#B5562B]" /></div>;
  }
  if (!view || !site || typeof site === 'string') {
    return (
      <div dir="rtl" className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-[#FBF6EF] text-center p-6 font-sans">
        <UtensilsCrossed size={44} className="text-[#B5562B]" />
        <div className="text-xl font-black text-[#2B2118]">{site === 'error' ? 'تعذر فتح الموقع' : 'هذا الموقع غير منشور بعد'}</div>
        <p className="text-sm text-black/50">{site === 'error' ? 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'تأكد من الرابط، أو اطلب من المطعم رابطًا جديدًا.'}</p>
      </div>
    );
  }

  const page = view.pages.find((p) => p.id === pageId) || view.pages[0];
  if (!page) return null;
  const selectPage = (id: string) => {
    setPageId(id);
    document.querySelector('[dir="rtl"].overflow-y-auto')?.scrollTo({ top: 0 });
  };

  return (
    <RestaurantDataContext.Provider value={site.admin}>
      <RestaurantOrderContext.Provider value={submit}>
        <div className="h-[100dvh] flex flex-col bg-white">
          <CanvasWorkspace
            isPublicSite
            isPreviewActive
            previewMode={phone ? 'mobile' : 'desktop'}
            slides={page.slides}
            activeSlideId={page.slides[0]?.id || ''}
            elements={view.elements}
            selectedElementId={null}
            onSelectElement={noop}
            onSelectSlide={noop}
            onSelectPage={selectPage}
            allPages={view.pages}
            activePageId={page.id}
            navbar={page.navbar}
            onUpdateElementPosition={noop}
            onUpdateElementSize={noop}
            onUpdateElementContent={noop}
            onDeleteElement={noop}
            onDuplicateElement={noop}
          />
        </div>
      </RestaurantOrderContext.Provider>
    </RestaurantDataContext.Provider>
  );
};
