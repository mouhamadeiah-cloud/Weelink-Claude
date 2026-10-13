// Weelink's front page: the place a visitor searches first (food, online shopping, technicians,
// cars), with the way in for business owners always in sight. A signed-in person sees the pages
// they opened lately and the search they use most on top. Below the fold, each kind of page
// Weelink builds is explained with a photo. See services/directory.ts for what the searches find.
import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowLeft, CarFront, Clock, Loader2, LogOut, MapPin, Search, ShoppingBag, Sparkles, Store, UserRound, UtensilsCrossed, Wrench, X,
} from 'lucide-react';
import { SYRIAN_GOVERNORATES } from '../../utils/syriaLists';
import { normalizeArabic } from '../ui/ComboInput';
import { Intent, RecentPage, bumpIntent, favoriteIntent, listRecent, readHomePlace, recordVisit, saveHomePlace } from '../../services/homeActivity';
import { DirectoryEntry, DishOffer, INTENT_KIND, entryUrl, listByCategory, listByKind, restaurantOffers, searchDirectory } from '../../services/directory';
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

// Words that mean one of the four searches, so «مطعم» or «سيارة» opens it instead of a keyword search.
const INTENT_WORDS: Record<Intent, string[]> = {
  food: ['اكل', 'مطعم', 'مطاعم', 'طعام', 'طلبات', 'وجبه', 'منيو', 'فطور', 'غدا', 'عشا'],
  shop: ['تسوق', 'متجر', 'متاجر', 'شراء', 'منتجات', 'سوق'],
  pros: ['فني', 'فنيين', 'خدمات', 'صيانه', 'مهني', 'حرفي'],
  cars: ['سياره', 'سيارات', 'معرض', 'معارض'],
};

const matchIntent = (text: string): Intent | null => {
  const words = normalizeArabic(text).split(/\s+/).map((w) => w.replace(/^ال/, ''));
  if (words.length !== 1) return null;
  return (Object.entries(INTENT_WORDS) as [Intent, string[]][]).find(([, list]) => list.includes(words[0]))?.[0] || null;
};

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
  onBuild: () => void; // «اعمل صفحتك»
  onLogout: () => void;
}

const Chip: React.FC<{ on: boolean; onClick: () => void; small?: boolean; children: React.ReactNode }> = ({ on, onClick, small, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`shrink-0 whitespace-nowrap rounded-full border font-bold transition ${small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${
      on ? 'bg-[#1c1a17] border-[#1c1a17] text-white' : 'bg-[#f6f3ee] border-black/10 text-[#5b5348] hover:border-[#c2410c]'
    }`}
  >
    {children}
  </button>
);

export const HomePage: React.FC<HomePageProps> = ({ user, onAccount, onOpenMyPage, onBuild, onLogout }) => {
  const uid = user?.uid || null;
  const [place, setPlace] = useState(readHomePlace);
  const [text, setText] = useState('');
  // A search: one of the four (narrowed to a category and its sub-category when picked), or typed words.
  const [active, setActive] = useState<{ intent: Intent | null; query: string; category?: string; sub?: string } | null>(null);
  const [results, setResults] = useState<DirectoryEntry[] | null>(null);
  const [offers, setOffers] = useState<DishOffer[]>([]);
  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    const load = active.intent
      ? filter
        ? listByCategory(INTENT_KIND[active.intent], filter)
        : listByKind(INTENT_KIND[active.intent])
      : searchDirectory(active.query);
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
    setActive({ intent, query: '' });
    window.setTimeout(() => document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    const intent = matchIntent(q);
    if (intent) return openIntent(intent);
    setActive({ intent: null, query: q });
    window.setTimeout(() => document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const openEntry = (e: DirectoryEntry) => {
    const url = entryUrl(e);
    recordVisit(uid, { kind: e.project, name: e.name, title: e.title, url });
    const intent = intentOf(e.project);
    if (intent && !active?.intent) bumpIntent(uid, intent);
    window.location.href = url;
  };

  const orderedIntents = favorite ? [...INTENTS].sort((a, b) => Number(b.id === favorite) - Number(a.id === favorite)) : INTENTS;
  const activeIntent = active?.intent ? INTENTS.find((i) => i.id === active.intent) : null;
  // The categories of the open search (Eyad's shop and restaurant lists, the occupations for services).
  const catKind = active?.intent && active.intent !== 'cars' ? INTENT_KIND[active.intent] : undefined;
  const categories = useCategories(categorySourceOf(catKind), !!catKind);
  const activeCategory = active?.category ? categories?.find((c) => c.name === active.category) : undefined;
  const pickCategory = (category?: string, sub?: string) => active?.intent && setActive({ intent: active.intent, query: '', category, sub });

  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f3ee] text-[#1c1a17]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#f6f3ee]/90 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 shrink-0" aria-label="weelink">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white flex items-center justify-center font-bold">W</span>
            <span className="text-lg font-bold tracking-tight hidden sm:inline font-logo">weelink</span>
          </a>
          <label className="flex items-center gap-1.5 text-xs font-bold text-[#5b5348] bg-white border border-black/10 rounded-full pr-2.5 pl-1 py-1 min-w-0">
            <MapPin size={14} className="text-[#c2410c] shrink-0" />
            <select
              aria-label="محافظتك"
              value={place}
              onChange={(e) => { setPlace(e.target.value); saveHomePlace(e.target.value); }}
              className="bg-transparent outline-none cursor-pointer max-w-[7.5rem] truncate"
            >
              <option value="">كل سوريا</option>
              {SYRIAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <div className="flex-1" />
          <button type="button" onClick={onBuild} className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#1c1a17] hover:text-[#c2410c] px-2">
            <Store size={15} /> اعمل صفحتك
          </button>
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 bg-[#1c1a17] text-white rounded-full pl-3 pr-1 py-1 text-xs font-bold"
              >
                <span className="w-7 h-7 rounded-full bg-[#c2410c] flex items-center justify-center">{(firstName[0] || '؟').toUpperCase()}</span>
                حسابي
              </button>
              {menuOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-black/5 py-2 text-sm z-40">
                  <button type="button" onClick={() => { setMenuOpen(false); onOpenMyPage(); }} className="w-full text-right px-4 py-2 hover:bg-[#f6f3ee] font-bold">صفحتي</button>
                  <button type="button" onClick={() => { setMenuOpen(false); onBuild(); }} className="w-full text-right px-4 py-2 hover:bg-[#f6f3ee]">إضافة صفحة لحسابي</button>
                  <div className="my-1 border-t border-black/5" />
                  <button type="button" onClick={() => { setMenuOpen(false); onLogout(); }} className="w-full text-right px-4 py-2 hover:bg-[#f6f3ee] text-[#9a3412] flex items-center gap-2"><LogOut size={14} /> تسجيل الخروج</button>
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={onAccount} className="flex items-center gap-1.5 bg-[#1c1a17] text-white rounded-full px-4 py-2 text-xs font-bold">
              <UserRound size={15} /> حسابي
            </button>
          )}
        </div>
      </header>

      {/* Search */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#fed7aa_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,#bfdbfe_0%,transparent_50%)] opacity-70" />
        <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-8 sm:pt-16 sm:pb-12 text-center">
          {user && (
            <p className="text-sm font-bold text-[#9a3412] mb-2">أهلاً {firstName}</p>
          )}
          <h1 className="text-[28px] leading-[1.25] sm:text-5xl sm:leading-[1.2] font-bold">
            كل شي بتحتاجه{place ? <> بـ<span className="text-[#c2410c]">{place}</span></> : ' حواليك'}،<br className="hidden sm:block" /> بصفحة وحدة
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#5b5348]">أكل، تسوق، فنيين وسيارات، من محلات وناس حقيقيين.</p>
          <form onSubmit={submitSearch} className="mt-6 flex items-center bg-white rounded-2xl shadow-[0_12px_40px_rgba(28,26,23,0.12)] border border-black/5 p-1.5">
            <Search size={20} className="mx-3 text-[#8a8073] shrink-0" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="شو بدك اليوم؟ شاورما، كهربائي، تويوتا…"
              aria-label="ابحث"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] py-2.5"
            />
            <button type="submit" className="shrink-0 bg-[#c2410c] hover:bg-[#9a3412] text-white rounded-xl px-5 py-2.5 text-sm font-bold transition">ابحث</button>
          </form>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-6 space-y-10">
        {/* Signed in: what they opened lately, and the pages they joined as a customer */}
        {user && (recent.length > 0 || joined.length > 0) && (
          <section>
            <h2 className="text-base font-bold mb-3 flex items-center gap-2"><Clock size={16} className="text-[#8a8073]" /> زرتها مؤخراً</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
              {recent.map((p) => (
                <a key={p.url} href={p.url} onClick={() => recordVisit(uid, p)} className="snap-start shrink-0 w-44 bg-white rounded-2xl border border-black/5 p-3 hover:shadow-md transition">
                  <div className="text-[11px] font-bold text-[#8a8073]">{KIND_LABEL[p.kind] || 'صفحة'}</div>
                  <div className="text-sm font-bold truncate">{p.title}</div>
                </a>
              ))}
              {joined.filter((j) => !recent.some((r) => r.url === pageUrl(j.kind, j.ownerUid))).map((j) => {
                const url = pageUrl(j.kind, j.ownerUid);
                return url ? (
                  <a key={j.ownerUid} href={url} className="snap-start shrink-0 w-44 bg-white rounded-2xl border border-black/5 p-3 hover:shadow-md transition">
                    <div className="text-[11px] font-bold text-[#15803d]">مشترك فيها</div>
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
            <section className="rounded-3xl overflow-hidden relative min-h-[180px] flex items-end text-white">
              <img src={fav.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <div className="relative p-5 w-full space-y-3">
                <div className="text-xs font-bold opacity-80">بتدور عادة على</div>
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-2xl font-bold">{fav.title}{place ? ` بـ${place}` : ''}</h2>
                  <button type="button" onClick={() => openIntent(fav.id)} className="shrink-0 bg-white text-[#1c1a17] rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1">
                    افتح <ArrowLeft size={14} />
                  </button>
                </div>
                {favOffers.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {favOffers.map((o, i) => (
                      <a key={i} href={o.restaurantUrl} className="shrink-0 bg-white/95 text-[#1c1a17] rounded-xl p-2 flex items-center gap-2 w-60">
                        {o.image && <img src={o.image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{o.dish}</div>
                          <div className="text-[11px] text-[#8a8073] truncate">{o.restaurant}</div>
                          <div className="text-xs font-bold text-[#c2410c]">{money(o.price, o.currency)}</div>
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
                className={`group relative rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[4/4.4] text-right text-white shadow-sm hover:shadow-xl transition ${active?.intent === it.id ? 'ring-4 ring-[#c2410c]' : ''}`}
              >
                <img src={it.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4 space-y-1">
                  <span className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-2"><it.icon size={18} /></span>
                  <div className="text-lg sm:text-xl font-bold">{it.title}</div>
                  <div className="text-[11px] sm:text-xs opacity-85 leading-snug">{it.line}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Results of a search */}
        {active && (
          <section id="home-results" className="scroll-mt-20 bg-white rounded-3xl border border-black/5 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">
                {activeIntent ? activeIntent.title : <>نتائج «{active.query}»</>}
              </h2>
              <button type="button" onClick={() => setActive(null)} aria-label="إغلاق النتائج" className="w-8 h-8 rounded-full bg-[#f6f3ee] flex items-center justify-center"><X size={16} /></button>
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
            {place && <p className="text-[11px] text-[#8a8073]">الترتيب حسب المدينة والحي بيجي مع دليل المواقع بالمرحلة الجاية.</p>}
            {offers.length > 0 && (
              <div>
                <div className="text-xs font-bold text-[#c2410c] mb-2 flex items-center gap-1"><Sparkles size={13} /> عروض اليوم</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {offers.map((o, i) => (
                    <a key={i} href={o.restaurantUrl} className="shrink-0 w-40 rounded-2xl border border-black/5 overflow-hidden bg-[#fffaf5]">
                      {o.image ? <img src={o.image} alt="" loading="lazy" className="w-full h-24 object-cover" /> : <div className="h-24 bg-[#fde7d4]" />}
                      <div className="p-2">
                        <div className="text-xs font-bold truncate">{o.dish}</div>
                        <div className="text-[11px] text-[#8a8073] truncate">{o.restaurant}</div>
                        <div className="text-xs font-bold text-[#c2410c]">
                          {money(o.price, o.currency)}
                          {o.oldPrice > o.price && <span className="text-[#8a8073] line-through font-normal mr-1">{money(o.oldPrice, o.currency)}</span>}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {results === null ? (
              <div className="py-10 flex justify-center text-[#8a8073]"><Loader2 className="animate-spin" /></div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-[#5b5348]">{failed ? 'ما قدرنا نجيب النتائج. جرّب كمان شوي.' : 'لسا ما في صفحات منشورة هون.'}</p>
                <button type="button" onClick={onBuild} className="text-sm font-bold text-[#c2410c]">عندك شغل بهالمجال؟ اعمل صفحتك أول وحدة</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.map((e) => (
                  <button key={e.name} type="button" onClick={() => openEntry(e)} className="text-right rounded-2xl border border-black/5 bg-[#fbf9f6] hover:bg-white hover:shadow-md p-4 transition flex items-start gap-3">
                    <span className="w-11 h-11 rounded-xl bg-[#1c1a17] text-white flex items-center justify-center font-bold shrink-0">{e.title.trim()[0] || 'W'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold text-[#8a8073]">{KIND_LABEL[e.project] || 'صفحة'}</span>
                      <span className="block text-sm font-bold truncate">{e.title}</span>
                      {e.description && <span className="block text-xs text-[#5b5348] line-clamp-2 mt-0.5">{e.description}</span>}
                    </span>
                    <ArrowLeft size={16} className="text-[#8a8073] mt-1 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* For business owners */}
        <section className="rounded-3xl bg-[#1c1a17] text-white p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">عندك محل أو مهنة؟</h2>
            <p className="text-sm text-white/75 max-w-lg">اعمل صفحتك مجاناً، وخلّي الناس يلاقوك لما يدوّروا بمدينتك.</p>
          </div>
          <button type="button" onClick={onBuild} className="shrink-0 bg-[#c2410c] hover:bg-[#ea580c] text-white rounded-2xl px-6 py-3.5 text-sm font-bold transition flex items-center gap-2 self-start sm:self-auto">
            اعمل صفحتك مجاناً <ArrowLeft size={16} />
          </button>
        </section>

        {/* What Weelink builds, explained as the visitor scrolls */}
        <section className="space-y-6 sm:space-y-10 pt-4">
          <div className="text-center space-y-2">
            <div className="text-xs font-bold text-[#c2410c]">لأصحاب المحلات والمهن</div>
            <h2 className="text-2xl sm:text-4xl font-bold">شو بتقدر تعمل بـ Weelink</h2>
          </div>
          {FEATURES.map((f, i) => (
            <article key={f.title} className={`grid md:grid-cols-2 gap-5 md:gap-10 items-center ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className={`rounded-3xl overflow-hidden aspect-[16/11] ${f.contain ? 'bg-white flex items-center justify-center p-8' : ''}`}>
                <img src={f.image} alt="" loading="lazy" className={f.contain ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold">{f.title}</h3>
                <p className="text-sm sm:text-base text-[#5b5348] leading-relaxed">{f.lead}</p>
                <ul className="space-y-1.5">
                  {f.points.map((p) => (
                    <li key={p} className="text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c2410c] shrink-0" />{p}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
          <div className="text-center pt-2">
            <button type="button" onClick={onBuild} className="bg-[#1c1a17] text-white rounded-2xl px-6 py-3.5 text-sm font-bold">ابدأ صفحتك</button>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-[#8a8073] flex flex-wrap gap-x-4 gap-y-1 justify-between">
          <span>© Weelink</span>
          <span>صُنع للمحلات والمهن بسوريا</span>
        </div>
      </footer>
    </div>
  );
};
