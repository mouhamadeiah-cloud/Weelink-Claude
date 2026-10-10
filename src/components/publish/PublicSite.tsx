// A published Weelink page, opened by its name (alnour.testweelink.de or /?s=alnour) or by the
// customer's own domain: the copy made by «نشر», full-window, without the editor. A restaurant's
// name opens its live site (orders, customers) as /?r=<uid> does.
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CanvasWorkspace } from '../CanvasWorkspace';
import { withLocalGraphics } from '../../utils/localGraphics';
import { PublishedSite, letterIcon, loadPublishedSite } from '../../services/sites';
import { PublicRestaurantSite, withPhoneLayouts } from '../restaurant/PublicRestaurantSite';
import { ShopDataContext, ShopUpdateContext } from '../shop/store/ShopDataContext';
import { CarDataContext } from '../cars/store/CarDataContext';
import { carsFromPublic, shopFromPublic } from './publicData';

const PHONE_MAX = 768;

// The page's logo on the browser tab and on a phone's home screen.
const setPageIcon = (href: string) => {
  if (!href) return;
  document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((l) => l.remove());
  [['icon', 'image/png'], ['apple-touch-icon', '']].forEach(([rel, type]) => {
    const link = document.createElement('link');
    link.rel = rel;
    if (type) link.type = type;
    link.href = href;
    document.head.appendChild(link);
  });
};
const noop = () => {};
// The store's checkout records the order in the admin data; a published copy has none to write to,
// so the order goes to the shop on WhatsApp from the thank-you screen.
const keepNothing = () => {};

export const PublicSite: React.FC<{ where: { name: string } | { host: string } }> = ({ where }) => {
  const [site, setSite] = useState<PublishedSite | null | 'loading' | 'error'>('loading');
  const [pageId, setPageId] = useState('');
  const [phone, setPhone] = useState(() => window.innerWidth < PHONE_MAX);

  useEffect(() => {
    loadPublishedSite(where)
      .then((s) => {
        setSite(s ? { ...s, elements: (s.elements || []).map(withLocalGraphics) } : null);
        if (s?.pages?.[0]) setPageId(s.pages[0].id);
        const title = s?.pages?.[0]?.navbar?.brandName;
        if (title) document.title = title;
        if (s) setPageIcon(s.icon || letterIcon(title || s.name));
      })
      .catch(() => setSite('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => setPhone(window.innerWidth < PHONE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const view = useMemo(() => {
    if (!site || typeof site === 'string') return null;
    return phone ? withPhoneLayouts(site.pages || [], site.elements) : { pages: site.pages || [], elements: site.elements };
  }, [site, phone]);
  const shop = useMemo(() => (site && typeof site !== 'string' && site.project === 'shop' ? shopFromPublic(site.data) : null), [site]);
  const cars = useMemo(() => (site && typeof site !== 'string' && site.project === 'cars' ? carsFromPublic(site.data) : null), [site]);

  if (site === 'loading') {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-white"><Loader2 size={36} className="animate-spin text-[#0071e3]" /></div>;
  }
  if (site && typeof site !== 'string' && site.project === 'restaurant') return <PublicRestaurantSite uid={site.owner} />;
  if (!view || !site || typeof site === 'string' || !view.pages.length) {
    return (
      <div dir="rtl" className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-[#f5f5f7] text-center p-6 font-sans">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white flex items-center justify-center text-xl font-bold">W</span>
        <div className="text-xl font-black text-[#1d1d1f]">{site === 'error' ? 'تعذر فتح الصفحة' : 'هذه الصفحة غير منشورة'}</div>
        <p className="text-sm text-black/50">{site === 'error' ? 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'تأكد من الرابط، أو اصنع صفحتك مجاناً على Weelink.'}</p>
      </div>
    );
  }

  const page = view.pages.find((p) => p.id === pageId) || view.pages[0];
  const selectPage = (id: string) => {
    setPageId(id);
    document.querySelector('[dir="rtl"].overflow-y-auto')?.scrollTo({ top: 0 });
  };

  return (
    <ShopDataContext.Provider value={shop}>
      <ShopUpdateContext.Provider value={shop ? keepNothing : null}>
        <CarDataContext.Provider value={cars}>
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
        </CarDataContext.Provider>
      </ShopUpdateContext.Provider>
    </ShopDataContext.Provider>
  );
};
