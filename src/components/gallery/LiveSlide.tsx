// A slide drawn by the real renderer (the one published pages use), not a picture of it: background
// videos play, text moves, effects and animations run, exactly as on a customer's page (Eyad, 14 Oct:
// that is the heart of a design). It is drawn on the 1280-wide canvas the slide was made on and scaled
// to the box it sits in, as tall as the slide. A page of cards must not play dozens of videos at
// once, so the slide plays only while its card is on (or near) the screen. Nothing in it can be
// clicked: a link or a phone number in a gallery slide does nothing.
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CanvasWorkspace } from '../CanvasWorkspace';
import { ShopDataContext, ShopUpdateContext } from '../shop/store/ShopDataContext';
import { CarDataContext, CarRequestContext } from '../cars/store/CarDataContext';
import { RestaurantDataContext, RestaurantOrderContext } from '../restaurant/store/RestaurantDataContext';
import { demoCarAdmin, demoRestaurantAdmin, demoShopAdmin } from '../rightDrawer/slidePreviewDemo';
import type { CanvasElement, NavbarConfig, Page } from '../../types';

const DESIGN_WIDTH = 1280;
const noop = () => {};

const NO_NAVBAR: NavbarConfig = { brandName: '', items: [], ctaText: '', ctaHref: '', bgColor: '#ffffff', textColor: '#1d1d1f', isSticky: false };

export const LiveSlide: React.FC<{ slide: any; elements: CanvasElement[] }> = ({ slide, elements }) => {
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

  const height = Number(slide?.height) || 560;
  const scale = width / DESIGN_WIDTH;
  const page = useMemo<Page>(() => ({ id: 'gallery', name: '', slug: '/', navbar: NO_NAVBAR, slides: [{ ...slide, id: slide?.id || 'slide-1', height }] }), [slide, height]);
  // Example data, so a shop, showroom or menu slide shows filled (the same the ready-slide picker uses).
  const shop = useMemo(() => demoShopAdmin(), []);
  const cars = useMemo(() => demoCarAdmin(), []);
  const menu = useMemo(() => demoRestaurantAdmin(), []);

  return (
    <div ref={boxRef} className="relative w-full overflow-hidden bg-white" style={{ height: Math.max(8, Math.round(height * scale)) }}>
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
                        navbar={NO_NAVBAR}
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
    </div>
  );
};
