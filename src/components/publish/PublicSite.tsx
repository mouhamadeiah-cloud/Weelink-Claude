// A published Weelink page, opened by its name (alnour.testweelink.de or /?s=alnour) or by the
// customer's own domain: the copy made by «نشر», full-window, without the editor. A restaurant's
// name opens its live site (orders, customers) as /?r=<uid> does.
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { withLocalGraphics } from '../../utils/localGraphics';
import { PublishedSite, SiteSeo, letterIcon, loadPublishedSite } from '../../services/sites';
import { PublicRestaurantSite } from '../restaurant/PublicRestaurantSite';
import { SiteView } from './SiteView';

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

// The title, description and keywords the customer wrote for Google and for sharing on social media.
const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) return tag?.remove();
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = value;
};
const applySeo = (seo: SiteSeo | undefined, fallbackTitle: string) => {
  const title = seo?.title || fallbackTitle;
  if (title) document.title = title;
  const description = seo?.description || '';
  setMeta('name', 'description', description);
  setMeta('name', 'keywords', (seo?.keywords || []).join(', '));
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:url', window.location.href);
};

export const PublicSite: React.FC<{ where: { name: string } | { host: string } }> = ({ where }) => {
  const [site, setSite] = useState<PublishedSite | null | 'loading' | 'error'>('loading');
  const [pageId, setPageId] = useState('');
  const [phone, setPhone] = useState(() => window.innerWidth < PHONE_MAX);

  useEffect(() => {
    loadPublishedSite(where)
      .then((s) => {
        setSite(s ? { ...s, elements: (s.elements || []).map(withLocalGraphics) } : null);
        if (s?.pages?.[0]) setPageId(s.pages[0].id);
        const title = s?.pages?.[0]?.navbar?.brandName || '';
        if (s) {
          applySeo(s.seo, title);
          setPageIcon(s.icon || letterIcon(s.seo?.title || title || s.name));
        }
      })
      .catch(() => setSite('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => setPhone(window.innerWidth < PHONE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const ready = site && typeof site !== 'string' ? site : null;
  const elements = useMemo(() => ready?.elements || [], [ready]);

  if (site === 'loading') {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-white"><Loader2 size={36} className="animate-spin text-[#0071e3]" /></div>;
  }
  if (ready?.project === 'restaurant') return <PublicRestaurantSite uid={ready.owner} />;
  if (!ready || !ready.pages?.length) {
    return (
      <div dir="rtl" className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-[#f5f5f7] text-center p-6 font-sans">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white flex items-center justify-center text-xl font-bold">W</span>
        <div className="text-xl font-black text-[#1d1d1f]">{site === 'error' ? 'تعذر فتح الصفحة' : 'هذه الصفحة غير منشورة'}</div>
        <p className="text-sm text-black/50">{site === 'error' ? 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'تأكد من الرابط، أو اصنع صفحتك مجاناً على Weelink.'}</p>
      </div>
    );
  }

  const selectPage = (id: string) => {
    setPageId(id);
    document.querySelector('[dir="rtl"].overflow-y-auto')?.scrollTo({ top: 0 });
  };

  return (
    <div className="h-[100dvh]">
      <SiteView project={ready.project} pages={ready.pages} elements={elements} data={ready.data} phone={phone} pageId={pageId} onSelectPage={selectPage} />
    </div>
  );
};
