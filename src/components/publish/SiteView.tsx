// A Weelink page as its visitors see it (no editor): the published site, and the previews in the
// «نشر» window. It fills the box it is put in; on a phone it shows the phone layout (arranged
// automatically for slides the customer has not arranged).
import React, { useMemo } from 'react';
import { CanvasWorkspace } from '../CanvasWorkspace';
import { withPhoneLayouts } from '../../utils/mobileLayout';
import { ShopDataContext, ShopUpdateContext } from '../shop/store/ShopDataContext';
import { CarDataContext } from '../cars/store/CarDataContext';
import { carsFromPublic, shopFromPublic } from './publicData';
import type { CanvasElement, Page } from '../../types';
import type { ProjectType } from '../shop/shopTypes';

const noop = () => {};
// The store's checkout records the order in the admin data; a published copy has none to write to,
// so the order goes to the shop on WhatsApp from the thank-you screen.
const keepNothing = () => {};

export const SiteView: React.FC<{
  project: ProjectType;
  pages: Page[];
  elements: CanvasElement[];
  data: any;
  phone: boolean;
  pageId: string;
  onSelectPage?: (id: string) => void;
}> = ({ project, pages, elements, data, phone, pageId, onSelectPage }) => {
  const view = useMemo(() => (phone ? withPhoneLayouts(pages, elements) : { pages, elements }), [pages, elements, phone]);
  const shop = useMemo(() => (project === 'shop' ? shopFromPublic(data) : null), [project, data]);
  const cars = useMemo(() => (project === 'cars' ? carsFromPublic(data) : null), [project, data]);
  const page = view.pages.find((p) => p.id === pageId) || view.pages[0];
  if (!page) return null;

  return (
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
