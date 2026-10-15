// Weelink's front page: the place a visitor searches first (food, online shopping, technicians,
// cars), with the way in for business owners always in sight. A signed-in person sees the pages
// they opened lately and the search they use most on top. Below the fold, each kind of page
// Weelink builds is explained with a photo. See services/directory.ts for what the searches find.
import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowLeft, CarFront, Clock, Loader2, MapPin, ShoppingBag, Sparkles, UtensilsCrossed, Wrench, X,
} from 'lucide-react';
import { PlatformNav } from '../platform/PlatformNav';
import { SYRIAN_GOVERNORATES } from '../../utils/syriaLists';
import { Intent, RecentPage, bumpIntent, favoriteIntent, listRecent, readHomePlace, recordVisit, saveHomePlace } from '../../services/homeActivity';
import { DirectoryEntry, DishOffer, INTENT_KIND, entryUrl, listByCategory, listByKind, restaurantOffers } from '../../services/directory';
import { categorySourceOf, useCategories } from '../../utils/businessCategories';
import { JoinedPage, listJoinedPages, pageUrl } from '../../services/pageCustomers';
import { FOOD_PHOTOS, foodPhoto } from '../restaurant/restaurantTypes';
import type { ProjectType } from '../shop/shopTypes';

const photo = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;


const INTENTS: { id: Intent; title: string; line: string; icon: React.ElementType; image: string }[] = [
  { id: 'food', title: 'أكل وطلبات', line: 'مطاعم ومنيو وطلب أونلاين', icon: UtensilsCrossed, image: foodPhoto(FOOD_PHOTOS.grill, 900) },
  { id: 'shop', title: 'تسوق أونلاين', line: 'متاجر ومنتجات بتوصلك لعندك', icon: ShoppingBag, image: photo('1441986300917-64674bd600d8') },
  { id: 'pros', title: 'فنيين وخدمات', line: 'كهربائي، طبيب، مدرّس، محامي…', icon: Wrench, image: photo('1504307651254-35680f356dfd') },
  { id: 'cars', title: 'سيارات', line: 'معارض وسيارات للبيع', icon: CarFront, image: photo('1503376780353-7e6692767b70') },
];

const intentOf = (kind: ProjectType): Intent | null =>
  (Object.entries(INTENT_KIND) as [Intent, ProjectType][]).find(([, k]) => k === kind)?.[0] || null;

const KIND_LABEL: Record<ProjectType, string> = { page: 'صفحة', shop: 'متجر', cars: 'معرض سيارات', restaurant: 'مطعم' };

// What each kind of page gives its owner, shown as the visitor scrolls down.
const FEATURES: { title: string; lead: string; points: string[]; image: string; contain?: boolean }[] = [
  {
    title: 'صفحتك جاهزة بدقائق، مع Wee AI',
    lead: 'بتجاوب على كم سؤال عن شغلك، وWee AI بيكتبلك النصوص وبيرتب الصفحة. بعدها بتعدّل كل شي بإيدك.',
    points: ['صفحة تعريفية مجانية لأي مهنة', 'عنوانك على الخريطة وأرقام التواصل', 'تصميم حر: صور، ألوان، حركات'],
    image: '/graphics/undraw/web-development.svg',
    contain: true,
  },
  {
    title: 'مطعمك: منيو وطلبات مباشرة',
    lead: 'منيو واحد بيغذّي موقعك والطلب أونلاين وطاولات QR والمطبخ والكاشير.',
    points: ['الطلبات بتوصل للمطبخ لحظياً', 'كل موظف برمز خاص وصندوق خاص', 'زبائنك بيسجلوا وبيتابعوا طلباتهم'],
    image: foodPhoto(FOOD_PHOTOS.plates, 1200),
  },
  {
    title: 'متجر أونلاين بدون تعقيد',
    lead: 'فئات ومنتجات ومخزن، والزبون بيدفع كاش أو بمحفظة إلكترونية.',
    points: ['سلة وطلب من الموبايل', 'مخزن ومحاسبة وزبائن', 'عروض ومنتجات مميزة بالواجهة'],
    image: photo('1441986300917-64674bd600d8', 1200),
  },
  {
    title: 'معرض سيارات بكل تفاصيله',
    lead: 'سيارات ركوب وشاحنات ومعدات، مع بحث متقدم وطلبات تجربة من الزوار.',
    points: ['إدخال السيارة بخطوات', 'مصاريف وربح كل سيارة', 'عقود بيع وتجربة مع توقيع'],
    image: photo('1503376780353-7e6692767b70', 1200),
  },
  {
    title: 'اسمك على الإنترنت',
    lead: 'بتنشر صفحتك باسم خاص فيك، مع رمز QR وأيقونة، وبتظهر بالبحث بـ Weelink.',
    points: ['اسم مجاني name.testweelink.de', 'دومين خاص إذا بدك', 'كلمات بحث لـ Google'],
    image: '/graphics/undraw/launch-day.svg',
    contain: true,
  },
];

const money = (n: number, currency: string) => `${n.toLocaleString('ar-SY')} ${currency}`;

interface HomePageProps {
  user: User | null;
  onAccount: () => void; // signed out: open the sign-in screen
  onOpenMyPage: () => void; // signed in: straight to the person's own page(s)
  onLaw: () => void; // «قانون الصفحة»
  onBuild: () => void; // «اعمل صفحتك»
  onLogout: () => void;
}

const Chip: React.FC<{ on: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }> = ({ on, onClick, small, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 whitespace-nowrap rounded-full border font-bold transition ${small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
      on ? 'bg-ink border-ink text-white' : 'bg-surface border-line text-muted hover:border-brand hover:text-ink'
    }`}
  >
    {children}
  </button>
);

export const HomePage: React.FC<HomePageProps> = ({ user, onAccount, onOpenMyPage, onLaw, onBuild, onLogout }) => {
  const uid = user?.uid || null;
  const [place, setPlace] = useState(readHomePlace);
  // A search: one of the four fields (narrowed to a category and its sub-category when picked).
  const [active, setActive] = useState<{ intent: Intent; category?: string; sub?: string } | null>(null);
  const [results, setResults] = useState<DirectoryEntry[] | null>(null);
  const [offers, setOffers] = useState<DishOffer[]>([]);
  const [failed, setFailed] = useState(false);
  const [joined, setJoined] = useState<JoinedPage[]>([]);
  const recent = useMemo<RecentPage[]>(() => (uid ? listRecent(uid) : []), [uid, active]);
  const favorite = uid ? favoriteIntent(uid) : null;
  const firstName = user ? (user.displayName || user.email?.split('@')[0] || '').split(' ')[0] : '';

  useEffect(() => {
    if (!uid) return setJoined([]);
    listJoinedPages(uid).then(setJoined).catch(() => setJoined([]));
  }, [uid]);

  // The person's usual search, opened with its offers (restaurants' dishes) before they ask.
  const [favOffers, setFavOffers] = useState<DishOffer[]>([]);
  useEffect(() => {
    setFavOffers([]);
    if (favorite !== 'food') return;
    let alive = true;
    listByKind('restaurant', 6)
      .then((r) => restaurantOffers(r, 6))
      .then((o) => alive && setFavOffers(o))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [favorite]);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    setResults(null);
    setOffers([]);
    setFailed(false);
    const filter = active.sub || active.category;
    const load = filter ? listByCategory(INTENT_KIND[active.intent], filter) : listByKind(INTENT_KIND[active.intent]);
    load
      .then(async (list) => {
        if (!alive) return;
        setResults(list);
        if (active.intent === 'food') {
          const o = await restaurantOffers(list).catch(() => []);
          if (alive) setOffers(o);
        }
      })
      .catch(() => alive && (setResults([]), setFailed(true)));
    return () => {
      alive = false;
    };
  }, [active]);

  const openIntent = (intent: Intent) => {
    bumpIntent(uid, intent);
    setActive({ intent });
    window.setTimeout(() => document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const openEntry = (e: DirectoryEntry) => {
    const url = entryUrl(e);
    recordVisit(uid, { kind: e.project, name: e.name, title: e.title, url });
    const intent = intentOf(e.project);
    if (intent && !active) bumpIntent(uid, intent);
    window.location.href = url;
  };

  const orderedIntents = favorite ? [...INTENTS].sort((a, b) => Number(b.id === favorite) - Number(a.id === favorite)) : INTENTS;
  const activeIntent = active ? INTENTS.find((i) => i.id === active.intent) : null;
  // The categories of the open search (Eyad's shop and restaurant lists, the occupations for services).
  const catKind = active && active.intent !== 'cars' ? INTENT_KIND[active.intent] : undefined;
  const categories = useCategories(categorySourceOf(catKind), !!catKind);
  const activeCategory = active?.category ? categories?.find((c) => c.name === active.category) : undefined;
  const pickCategory = (category?: string, sub?: string) => active && setActive({ intent: active.intent, category, sub });

  return (
    <div dir="rtl" className="min-h-screen bg-bg text-ink">
      <PlatformNav
        current="home"
        user={user}
        onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onStart={onBuild}
        onOpenMyPage={onOpenMyPage}
        onLaw={onLaw}
        onAccount={onAccount}
        onLogout={onLogout}
      />

      {/* The way in: pick the field first; the search of that field (its categories and city) opens below */}
      <section className="relative overflow-hidden bg-surface border-b border-line">
        <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 text-center">
          {user && (
            <p className="text-sm font-bold text-brand mb-2">أهلاً {firstName}</p>
          )}
          <h1 className="text-title sm:text-display font-bold">
            كل شي بتحتاجه{place ? <> بـ<span className="text-brand">{place}</span></> : ' حواليك'}،<br className="hidden sm:block" /> بصفحة وحدة
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted">اختر شو بدك تدور عليه: أكل، تسوق، فنيين وسيارات، من محلات وناس حقيقيين.</p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-6 space-y-10">
        {/* Signed in: what they opened lately, and the pages they joined as a customer */}
        {user && (recent.length > 0 || joined.length > 0) && (
          <section>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2"><Clock size={16} className="text-faint" /> زرتها مؤخراً</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
              {recent.map((p) => (
                <a key={p.url} href={p.url} onClick={() => recordVisit(uid, p)} className="snap-start shrink-0 w-44 bg-surface rounded-card border border-line p-3 hover:border-brand transition">
                  <div className="text-xs font-bold text-muted">{KIND_LABEL[p.kind] || 'صفحة'}</div>
                  <div className="text-sm font-bold truncate">{p.title}</div>
                </a>
              ))}
              {joined.filter((j) => !recent.some((r) => r.url === pageUrl(j.kind, j.ownerUid))).map((j) => {
                const url = pageUrl(j.kind, j.ownerUid);
                return url ? (
                  <a key={j.ownerUid} href={url} className="snap-start shrink-0 w-44 bg-surface rounded-card border border-line p-3 hover:border-brand transition">
                    <div className="text-xs font-bold text-success">مشترك فيها</div>
                    <div className="text-sm font-bold truncate">{j.name || 'بدون اسم'}</div>
                  </a>
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* Signed in: the search they use most, first, with its offers */}
        {favorite && !active && (() => {
          const fav = INTENTS.find((i) => i.id === favorite)!;
          return (
            <section className="rounded-card overflow-hidden relative min-h-[180px] flex items-end text-white">
              <img src={fav.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <div className="relative p-5 w-full space-y-3">
                <div className="text-xs font-bold opacity-80">بتدور عادة على</div>
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-heading sm:text-title font-bold">{fav.title}{place ? ` بـ${place}` : ''}</h2>
                  <button type="button" onClick={() => openIntent(fav.id)} className="shrink-0 bg-surface text-ink rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1">
                    افتح <ArrowLeft size={14} />
                  </button>
                </div>
                {favOffers.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {favOffers.map((o, i) => (
                      <a key={i} href={o.restaurantUrl} className="shrink-0 bg-surface text-ink rounded-ctl p-2 flex items-center gap-2 w-60">
                        {o.image && <img src={o.image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{o.dish}</div>
                          <div className="text-xs text-muted truncate">{o.restaurant}</div>
                          <div className="text-xs font-bold text-brand">{money(o.price, o.currency)}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* The four searches */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {orderedIntents.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => openIntent(it.id)}
                className={`group relative rounded-card overflow-hidden aspect-[4/5] sm:aspect-[4/4.4] text-right text-white bg-ink transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${active?.intent === it.id ? 'ring-4 ring-brand' : ''}`}
              >
                <img src={it.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 space-y-1">
                  <div className="text-heading font-bold flex items-center gap-2"><it.icon size={18} className="shrink-0" />{it.title}</div>
                  <div className="text-xs opacity-90 leading-snug">{it.line}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Results of a search */}
        {active && (
          <section id="home-results" className="scroll-mt-20 bg-surface rounded-card border border-line p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-heading font-bold">{activeIntent?.title}</h2>
              <label className="ms-auto flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-bg py-1 pl-1 pr-2.5 text-xs font-bold text-muted">
                <MapPin size={14} className="shrink-0 text-brand" />
                <select
                  aria-label="محافظتك"
                  value={place}
                  onChange={(e) => { setPlace(e.target.value); saveHomePlace(e.target.value); }}
                  className="max-w-[7.5rem] cursor-pointer truncate bg-transparent outline-none"
                >
                  <option value="">كل سوريا</option>
                  {SYRIAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => setActive(null)} aria-label="إغلاق النتائج" className="w-8 h-8 rounded-full bg-bg hover:bg-line flex items-center justify-center"><X size={16} /></button>
            </div>
            {catKind && categories && (
              <div className="space-y-2">
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                  <Chip on={!active?.category} onClick={() => pickCategory()}>الكل</Chip>
                  {categories.map((c) => (
                    <Chip key={c.name} on={active?.category === c.name} onClick={() => pickCategory(c.name)}>{c.name}</Chip>
                  ))}
                </div>
                {activeCategory && activeCategory.subs.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                    <Chip small on={!active?.sub} onClick={() => pickCategory(activeCategory.name)}>كل {activeCategory.name}</Chip>
                    {activeCategory.subs.map((s) => (
                      <Chip small key={s.name} on={active?.sub === s.name} onClick={() => pickCategory(activeCategory.name, s.name)}>{s.name}</Chip>
                    ))}
                  </div>
                )}
              </div>
            )}
            {place && <p className="text-xs text-muted">الترتيب حسب المدينة والحي بيجي مع دليل المواقع بالمرحلة الجاية.</p>}
            {offers.length > 0 && (
              <div>
                <div className="text-xs font-bold text-brand mb-2 flex items-center gap-1"><Sparkles size={13} /> عروض اليوم</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {offers.map((o, i) => (
                    <a key={i} href={o.restaurantUrl} className="shrink-0 w-40 rounded-card border border-line overflow-hidden bg-surface">
                      {o.image ? <img src={o.image} alt="" loading="lazy" className="w-full h-24 object-cover" /> : <div className="h-24 bg-bg" />}
                      <div className="p-2">
                        <div className="text-xs font-bold truncate">{o.dish}</div>
                        <div className="text-xs text-muted truncate">{o.restaurant}</div>
                        <div className="text-xs font-bold text-brand">
                          {money(o.price, o.currency)}
                          {o.oldPrice > o.price && <span className="text-faint line-through font-normal mr-1">{money(o.oldPrice, o.currency)}</span>}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {results === null ? (
              <div className="py-10 flex justify-center text-faint"><Loader2 className="animate-spin" /></div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-muted">{failed ? 'ما قدرنا نجيب النتائج. جرّب كمان شوي.' : 'لسا ما في صفحات منشورة هون.'}</p>
                <button type="button" onClick={onBuild} className="text-sm font-bold text-brand hover:text-brand-hover">عندك شغل بهالمجال؟ اعمل صفحتك أول وحدة</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((e) => (
                  <button key={e.name} type="button" onClick={() => openEntry(e)} className="text-right rounded-card border border-line bg-surface hover:border-brand p-4 transition flex items-start gap-3">
                    <span className="w-11 h-11 rounded-ctl bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">{e.title.trim()[0] || 'W'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-muted">{KIND_LABEL[e.project] || 'صفحة'}</span>
                      <span className="block text-sm font-bold truncate">{e.title}</span>
                      {e.description && <span className="block text-xs text-muted line-clamp-2 mt-0.5">{e.description}</span>}
                    </span>
                    <ArrowLeft size={16} className="text-faint mt-1 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* For business owners */}
        <section className="rounded-card bg-ink text-white p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="space-y-2">
            <h2 className="text-heading sm:text-title font-bold">عندك محل أو مهنة؟</h2>
            <p className="text-sm text-white/80 max-w-lg">اعمل صفحتك مجاناً، وخلّي الناس يلاقوك لما يدوّروا بمدينتك.</p>
          </div>
          <button type="button" onClick={onBuild} className="shrink-0 bg-brand hover:bg-brand-hover text-white rounded-ctl px-6 py-3.5 text-sm font-bold transition flex items-center gap-2 self-start sm:self-auto">
            اعمل صفحتك مجاناً <ArrowLeft size={16} />
          </button>
        </section>

        {/* What Weelink builds, explained as the visitor scrolls */}
        <section className="space-y-6 sm:space-y-10 pt-4">
          <div className="text-center space-y-2">
            <div className="text-xs font-bold text-brand">لأصحاب المحلات والمهن</div>
            <h2 className="text-title sm:text-display font-bold">شو بتقدر تعمل بـ Weelink</h2>
          </div>
          {FEATURES.map((f, i) => (
            <article key={f.title} className={`grid md:grid-cols-2 gap-5 md:gap-10 items-center ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className={`rounded-card overflow-hidden aspect-[16/11] ${f.contain ? 'bg-surface border border-line flex items-center justify-center p-8' : ''}`}>
                <img src={f.image} alt="" loading="lazy" className={f.contain ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'} />
              </div>
              <div className="space-y-3">
                <h3 className="text-heading sm:text-title font-bold">{f.title}</h3>
                <p className="text-sm sm:text-base text-muted leading-relaxed">{f.lead}</p>
                <ul className="space-y-1.5">
                  {f.points.map((p) => (
                    <li key={p} className="text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />{p}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          <div className="text-center pt-2">
            <button type="button" onClick={onBuild} className="bg-brand hover:bg-brand-hover text-white rounded-ctl px-6 py-3.5 text-sm font-bold">ابدأ صفحتك</button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line mt-10">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-muted flex flex-wrap gap-x-4 gap-y-1 justify-between">
          <span>© Weelink</span>
          <span>صُنع للمحلات والمهن بسوريا</span>
        </div>
      </footer>
    </div>
  );
};
