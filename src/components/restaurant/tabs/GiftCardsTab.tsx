// بطاقات الرصيد: every gift card the cashier sold, with what was sold, what is left to spend and each
// use. A card exists from the moment its bill was fully paid.
import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CARD_STATE_TEXT, CardState, GiftCard, cardState, formatCardNumber, cleanCardNumber } from '../giftCardLogic';
import { useCards } from '../staffCloud';
import { Card, EmptyState, formatMoney } from '../../shop/adminUi';
import { CloudNotice, RestaurantTabProps } from './shared';

type Filter = 'all' | CardState;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'ok', label: 'فعّالة' },
  { id: 'empty', label: 'فارغة' },
  { id: 'expired', label: 'منتهية' },
];

const day = (iso: string) => (iso ? new Date(iso).toLocaleDateString('ar-SY-u-nu-latn') : '');
const dayTime = (iso: string) => (iso ? new Date(iso).toLocaleString('ar-SY-u-nu-latn', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

export const GiftCardsTab: React.FC<RestaurantTabProps> = ({ data, restaurantId }) => {
  const cards = useCards(restaurantId);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState('');
  const currency = data.settings.currency;
  const money = (n: number) => formatMoney(n, currency);

  const stats = useMemo(() => {
    const live = cards.items.filter((c) => cardState(c) === 'ok');
    return {
      count: cards.items.length,
      sold: cards.items.reduce((s, c) => s + c.initial, 0),
      spent: cards.items.reduce((s, c) => s + (c.initial - c.balance), 0),
      // What the restaurant still owes its guests: the balance of the cards that still work.
      owed: live.reduce((s, c) => s + c.balance, 0),
    };
  }, [cards.items]);

  const digits = cleanCardNumber(q);
  const list = cards.items.filter((c) => (filter === 'all' || cardState(c) === filter) && (!digits || c.number.includes(digits)));

  return (
    <div className="space-y-4">
      <CloudNotice error={cards.error} />
      {!data.settings.giftCard.enabled && <div className="p-3 rounded-2xl bg-[#FFF4E6] text-[#A34A00] text-xs font-bold">كاتالوك «بطاقة رصيد» غير مفعّل. فعّله من تبويب «أقسام المنيو».</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center">
        {[
          ['البطاقات الصادرة', String(stats.count)],
          ['مجموع ما بيع', money(stats.sold)],
          ['ما صُرف منها', money(stats.spent)],
          ['رصيد قائم للزبائن', money(stats.owed)],
        ].map(([label, value]) => (
          <div key={label} className="p-3 rounded-2xl bg-white border border-neutral-100"><div className="text-[11px] font-bold text-neutral-400">{label}</div><div className="text-base font-black mt-0.5">{value}</div></div>
        ))}
      </div>
      <Card title="البطاقات الصادرة">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input dir="ltr" inputMode="numeric" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم البطاقة" className="w-full h-10 pr-9 pl-3 rounded-xl border border-neutral-200 text-sm font-bold outline-none focus:border-neutral-400" />
          </div>
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`h-10 px-3 rounded-xl text-sm font-black cursor-pointer ${filter === f.id ? 'bg-[#1d1d1f] text-white' : 'bg-neutral-100 text-neutral-600'}`}>{f.label}</button>
          ))}
        </div>
        {!cards.ready ? (
          <div className="py-8 text-center text-sm font-bold text-neutral-400">جارٍ التحميل...</div>
        ) : list.length === 0 ? (
          <EmptyState text={cards.items.length ? 'لا توجد بطاقة بهذه المواصفات.' : 'لم تُبع أي بطاقة رصيد بعد.'} />
        ) : (
          <div className="divide-y divide-neutral-100">
            {list.map((c) => (
              <Row key={c.number} c={c} money={money} open={openId === c.number} onToggle={() => setOpenId(openId === c.number ? '' : c.number)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const STATE_COLOR: Record<CardState, string> = { ok: 'bg-[#EBFBEE] text-[#2B8A3E]', empty: 'bg-neutral-100 text-neutral-500', expired: 'bg-[#FFF0F0] text-[#C92A2A]' };
const STATE_LABEL: Record<CardState, string> = { ok: 'فعّالة', empty: 'فارغة', expired: 'منتهية' };

const Row: React.FC<{ c: GiftCard; money: (n: number) => string; open: boolean; onToggle: () => void }> = ({ c, money, open, onToggle }) => {
  const st = cardState(c);
  return (
    <div className="py-3">
      <button type="button" onClick={onToggle} className="w-full flex flex-wrap items-center gap-x-4 gap-y-1 text-right cursor-pointer">
        <span className="font-black tracking-wider" dir="ltr">{formatCardNumber(c.number)}</span>
        <span className={`h-6 px-2.5 rounded-full text-[11px] font-black inline-flex items-center ${STATE_COLOR[st]}`}>{STATE_LABEL[st]}</span>
        <span className="text-sm font-bold text-neutral-500">الأصلي {money(c.initial)}</span>
        <span className="text-sm font-black mr-auto">المتبقي {money(c.balance)}</span>
      </button>
      <div className="text-[11px] font-bold text-neutral-400 mt-1">
        صدرت {dayTime(c.issuedAt)}{c.issuedBy ? ` · ${c.issuedBy}` : ''} · {c.expiresAt ? `تنتهي ${day(c.expiresAt)}` : 'بدون انتهاء'}
        {CARD_STATE_TEXT[st] ? ` · ${CARD_STATE_TEXT[st]}` : ''}
      </div>
      {open && (
        <div className="mt-2 rounded-2xl bg-neutral-50 p-3 space-y-1">
          {c.uses.length === 0 && <div className="text-xs font-bold text-neutral-400">لم تُستعمل بعد.</div>}
          {c.uses.map((u, i) => (
            <div key={i} className="flex justify-between gap-3 text-xs font-bold"><span>{dayTime(u.at)} · {u.place}</span><span className="text-[#E8590C]">- {money(u.amount)}</span></div>
          ))}
        </div>
      )}
    </div>
  );
};
