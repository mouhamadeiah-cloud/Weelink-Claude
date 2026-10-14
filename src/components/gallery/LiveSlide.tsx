// A design drawn by the real renderer (the one published pages use), not a picture of it: background
// videos play, text moves, effects and animations run, exactly as on a customer's page (Eyad, 14 Oct:
// that is the heart of a design). It is drawn on the 1280-wide canvas it was made on and scaled to the
// box it sits in. A slide is shown alone; a page (up to three slides with a navbar) is shown whole. A page
// of cards must not play dozens of videos at once, so a design plays only while its card is on (or
// near) the screen. Nothing in it can be clicked: a link or a phone number in a gallery design does
// nothing.
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CanvasWorkspace } from '../CanvasWorkspace';
import { ShopDataContext, ShopUpdateContext } from '../shop/store/ShopDataContext';
import { CarDataContext, CarRequestContext } from '../cars/store/CarDataContext';
import { RestaurantDataContext, RestaurantOrderContext } from '../restaurant/store/RestaurantDataContext';
import { demoCarAdmin, demoRestaurantAdmin, demoShopAdmin } from '../rightDrawer/slidePreviewDemo';
import type { CanvasElement, NavbarConfig, Page, Slide } from '../../types';

const DESIGN_WIDTH = 1280;
const noop = () => {};

const NO_NAVBAR: NavbarConfig = { brandName: '', items: [], ctaText: '', ctaHref: '', bgColor: '#ffffff', textColor: '#1d1d1f', isSticky: false };

// The height a navbar strip takes above the slides (a floating or side navbar takes none).
const navFlow = (navbar?: NavbarConfig) => (navbar && (!navbar.layout || navbar.layout === 'horizontal') && !navbar.posY ? (navbar.height ?? 60) : 0);

interface LiveDesignProps {
  slides: Slide[];
  elements: CanvasElement[];
  // A page's navbar; none for a lone slide.
  navbar?: NavbarConfig;
  // The tallest the box may be on the screen, in px: a long page is cut here with a fade (the large
  // view has no limit).
  maxHeight?: number;
}

export const LiveDesign: React.FC<LiveDesignProps> = ({ slides, elements, navbar, maxHeight }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [near, setNear] = useState(false);

  useLayoutEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const measure = () => setWidth(node.clientWidth);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    const seen = new IntersectionObserver((entries) => setNear(entries.some((e) => e.isIntersecting)), { rootMargin: '300px' });
    seen.observe(node);
    return () => {
      resize.disconnect();
      seen.disconnect();
    };
  }, []);

  const fixed = useMemo(() => slides.map((s, i) => ({ ...s, id: s.id || `slide-${i + 1}`, height: Number(s.height) || 560 })), [slides]);
  const page = useMemo<Page>(() => ({ id: 'gallery', name: 'الرئيسية', slug: '/', navbar: navbar || NO_NAVBAR, slides: fixed }), [navbar, fixed]);
  const height = navFlow(navbar) + fixed.reduce((sum, s) => sum + s.height, 0);
  const scale = width / DESIGN_WIDTH;
  const full = Math.max(8, Math.round(height * scale));
  const shown = maxHeight ? Math.min(full, maxHeight) : full;
  // Example data, so a shop, showroom or menu design shows filled (the same the ready-slide picker uses).
  const shop = useMemo(() => demoShopAdmin(), []);
  const cars = useMemo(() => demoCarAdmin(), []);
  const menu = useMemo(() => demoRestaurantAdmin(), []);

  return (
    <div ref={boxRef} className="relative w-full overflow-hidden bg-white" style={{ height: shown }}>
      {near && width > 0 && (
        <div dir="ltr" className="absolute top-0 left-0 pointer-events-none select-none" style={{ width: DESIGN_WIDTH, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ShopUpdateContext.Provider value={null}>
            <ShopDataContext.Provider value={shop}>
              <CarRequestContext.Provider value={null}>
                <CarDataContext.Provider value={cars}>
                  <RestaurantOrderContext.Provider value={null}>
                    <RestaurantDataContext.Provider value={menu}>
                      <CanvasWorkspace
                        isPublicSite
                        embedded
                        hideNavbar={!navbar}
                        isPreviewActive
                        previewMode="desktop"
                        slides={page.slides}
                        activeSlideId={page.slides[0].id}
                        elements={elements}
                        selectedElementId={null}
                        onSelectElement={noop}
                        onSelectSlide={noop}
                        onSelectPage={noop}
                        allPages={[page]}
                        activePageId={page.id}
                        navbar={page.navbar}
                        onUpdateElementPosition={noop}
                        onUpdateElementSize={noop}
                        onUpdateElementContent={noop}
                        onDeleteElement={noop}
                        onDuplicateElement={noop}
                      />
                    </RestaurantDataContext.Provider>
                  </RestaurantOrderContext.Provider>
                </CarDataContext.Provider>
              </CarRequestContext.Provider>
            </ShopDataContext.Provider>
          </ShopUpdateContext.Provider>
        </div>
      )}
      {shown < full && <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none bg-gradient-to-t from-white to-transparent" aria-hidden />}
    </div>
  );
};

// One slide, alone.
export const LiveSlide: React.FC<{ slide: any; elements: CanvasElement[]; maxHeight?: number }> = ({ slide, elements, maxHeight }) => {
  const slides = useMemo(() => [slide], [slide]);
  return <LiveDesign slides={slides} elements={elements} maxHeight={maxHeight} />;
};

// A page: its navbar and its slides.
export const LivePage: React.FC<{ page: { navbar?: NavbarConfig; slides?: Slide[] }; elements: CanvasElement[]; maxHeight?: number }> = ({ page, elements, maxHeight }) => (
  <LiveDesign slides={page.slides || []} navbar={page.navbar || NO_NAVBAR} elements={elements} maxHeight={maxHeight} />
);
