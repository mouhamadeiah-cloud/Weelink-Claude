// A Weelink page as its visitors see it (no editor): the published site, and the previews in the
// «نشر» window. It fills the box it is put in; on a phone it shows the phone layout (arranged
// automatically for slides the customer has not arranged).
import React, { useMemo } from 'react';
import { CanvasWorkspace } from '../CanvasWorkspace';
import { withPhoneLayouts } from '../../utils/mobileLayout';
import { ShopDataContext, ShopUpdateContext } from '../shop/store/ShopDataContext';
import { CarDataContext } from '../cars/store/CarDataContext';
import { EstateModeContext, RentalModeContext, rentalShopView } from '../rental/rentalTypes';
import { carsFromPublic, shopFromPublic } from './publicData';
import type { CanvasElement, Page } from '../../types';
import { PIXABAY_URL } from '../../services/pixabayService';
import { kindOf, type ProjectKey } from '../../utils/projectKeys';

const noop = () => {};
// The store's checkout records the order in the admin data; a published copy has none to write to,
// so the order goes to the shop on WhatsApp from the thank-you screen.
const keepNothing = () => {};

export const SiteView: React.FC<{
  project: ProjectKey;
  pages: Page[];
  elements: CanvasElement[];
  data: any;
  phone: boolean;
  pageId: string;
  onSelectPage?: (id: string) => void;
  onContactClick?: (url: string) => void;
  navActions?: { id: string; label: string; onClick: () => void; icon?: 'person' }[];
}> = ({ project, pages, elements, data, phone, pageId, onSelectPage, onContactClick, navActions }) => {
  const view = useMemo(() => (phone ? withPhoneLayouts(pages, elements) : { pages, elements }), [pages, elements, phone]);
  // A hotel-and-property rental is a rental whose kinds come from the estate list.
  const estate = kindOf(project) === 'hotel';
  const rental = kindOf(project) === 'rental' || estate;
  const shop = useMemo(() => (kindOf(project) === 'shop' ? shopFromPublic(data) : rental ? rentalShopView(shopFromPublic(data?.shop)) : null), [project, data, rental]);
  const cars = useMemo(() => (kindOf(project) === 'cars' ? carsFromPublic(data) : rental ? carsFromPublic(data?.cars) : null), [project, data, rental]);
  // Pixabay asks that a page showing its files says so: a stored copy keeps «pixabay-» in its name, a video keeps the host.
  const usesPixabay = useMemo(() => /pixabay/i.test(JSON.stringify([pages, elements])), [pages, elements]);
  const page = view.pages.find((p) => p.id === pageId) || view.pages[0];
  if (!page) return null;

  return (
    <RentalModeContext.Provider value={rental}>
    <EstateModeContext.Provider value={estate}>
    <ShopDataContext.Provider value={shop}>
      <ShopUpdateContext.Provider value={shop ? keepNothing : null}>
        <CarDataContext.Provider value={cars}>
          <div className="h-full flex flex-col bg-white">
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
              onSelectPage={onSelectPage || noop}
              allPages={view.pages}
              activePageId={page.id}
              navbar={page.navbar}
              cardMode={page.cardMode}
              pageBackground={page.pageBackground}
              onUpdateElementPosition={noop}
              onUpdateElementSize={noop}
              onUpdateElementContent={noop}
              onDeleteElement={noop}
              onDuplicateElement={noop}
              onContactClick={onContactClick}
              navActions={navActions}
            />
            {usesPixabay && (
              <p className="shrink-0 bg-white py-1 text-center text-[11px] text-neutral-500" dir="rtl">
                بعض الصور والفيديوهات من{' '}
                <a href={PIXABAY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Pixabay</a>
              </p>
            )}
          </div>
        </CarDataContext.Provider>
      </ShopUpdateContext.Provider>
    </ShopDataContext.Provider>
    </EstateModeContext.Provider>
    </RentalModeContext.Provider>
  );
};
