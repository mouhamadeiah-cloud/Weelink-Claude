// شاشة الزبون: faces the guest at the cashier. It follows only the cashier device it is tied to.
// Idle, the whole screen is the Weelink advert. With a bill open, one half shows the bill and the
// other the advert: the dishes still to pay (a dish paid by items leaves the list), what the cashier
// is taking right now and for which dishes, each part already paid, and what is left. After the
// bill is closed it thanks the guest with the change.
import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogOut, Wallet } from 'lucide-react';
import { useScreen, useTab } from '../staffCloud';
import { tabTitle, tabTotals } from '../staffTypes';
import { formatMoney } from '../../shop/adminUi';
import { WeelinkAd } from './WeelinkAd';

const recent = (iso: string | undefined, now: number, ms: number) => !!iso && now - new Date(iso).getTime() < ms;

export const CustomerDisplay: React.FC<{ uid: string; cashierId: string; name: string; currency: string; onLogout: () => void }> = ({ uid, cashierId, name, currency, onLogout }) => {
  const screen = useScreen(uid, cashierId);
  const tab = useTab(uid, screen?.tabId || '');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const money = (n: number) => formatMoney(n, currency);
  const thanks = screen?.thanks && recent(screen.thanks.at, now, 20000) ? screen.thanks : null;
  const justPaid = screen?.paid && recent(screen.paid.at, now, 15000) ? screen.paid : null;
  const draft = screen?.draft || null;

  const logout = (
    <button type="button" onClick={onLogout} aria-label="خروج الجهاز" className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-xl bg-white/5 text-white/40 hover:text-white/80 flex items-center justify-center cursor-pointer"><LogOut size={16} /></button>
  );

  if (!cashierId) {
    return (
      <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex items-center justify-center p-8 font-sans text-center text-lg font-bold">
        اربط هذه الشاشة بجهاز كاشير من «الأجهزة والأكواد» في الإدارة.
        {logout}
      </div>
    );
  }

  if (thanks) {
    return (
      <div dir="rtl" className="fixed inset-0 bg-[#2F9E44] text-white flex flex-col items-center justify-center gap-4 p-8 font-sans text-center">
        <CheckCircle2 size={80} />
        <div className="text-5xl font-black">شكرًا لزيارتكم</div>
        <div className="text-2xl font-bold">المدفوع {money(thanks.paid)}</div>
        {thanks.change > 0 && <div className="px-8 py-4 rounded-3xl bg-white text-[#2F9E44] text-4xl font-black">الباقي لكم {money(thanks.change)}</div>}
        {logout}
      </div>
    );
  }

  if (!tab) {
    return (
      <div dir="rtl" className="fixed inset-0 font-sans">
        <WeelinkAd restaurant={name} />
        {logout}
      </div>
    );
  }

  const t = tabTotals(tab);
  const toPay = tab.items.filter((i) => !i.voided && i.qty - i.paidQty > 0);
  const picked = new Map((draft?.lines || []).map((l) => [l.name, l.qty]));

  return (
    <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex flex-col lg:flex-row font-sans">
      <section className="flex-1 lg:w-1/2 lg:flex-none min-h-0 flex flex-col p-5 sm:p-8">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="text-2xl font-black flex-1 truncate">{name}</div>
          <div className="text-lg font-bold text-white/60">{tabTitle(tab)}</div>
        </div>

        {justPaid && (
          <div className="mt-4 rounded-3xl bg-[#2F9E44] px-5 py-4 space-y-1">
            <div className="flex items-center gap-2 text-2xl font-black"><CheckCircle2 size={26} /> تم دفع {money(justPaid.amount)}<span className="text-base font-bold text-white/80">· {justPaid.method}</span></div>
            {justPaid.note && <div className="text-base font-bold text-white/90">{justPaid.note}</div>}
            <div className="flex flex-wrap gap-x-6 text-lg font-black">
              {justPaid.change > 0 && <span>الباقي لكم {money(justPaid.change)}</span>}
              <span>المتبقي على الطاولة {money(justPaid.left)}</span>
            </div>
          </div>
        )}

        {draft && draft.amount > 0 && (
          <div className="mt-4 rounded-3xl bg-[#FFF4E6] text-[#1d1d1f] px-5 py-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-black text-[#A34A00]"><Wallet size={18} /> الدفع الآن · {draft.label} · {draft.method}</div>
            <div className="text-5xl font-black text-[#E8590C]">{money(draft.amount)}</div>
            {draft.lines.length > 0 && (
              <div className="space-y-0.5">
                {draft.lines.map((l) => (
                  <div key={l.name} className="flex justify-between text-lg font-bold"><span>{l.qty}× {l.name}</span><span>{money(l.amount)}</span></div>
                ))}
              </div>
            )}
            {draft.given > 0 && (
              <div className="flex flex-wrap gap-x-6 text-lg font-black">
                <span>المستلم {money(draft.given)}</span>
                {draft.change > 0 && <span className="text-[#2F9E44]">الباقي لكم {money(draft.change)}</span>}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-2.5">
          {toPay.length > 0 && <div className="text-sm font-black text-white/40">للدفع</div>}
          {toPay.map((i) => {
            const left = i.qty - i.paidQty;
            const pick = picked.get(i.name) || 0;
            return (
              <div key={i.id} className={`flex items-start gap-3 text-xl rounded-2xl px-2 py-1 ${pick ? 'bg-[#E8590C]/25 ring-2 ring-[#E8590C]' : ''}`}>
                <span className="font-black w-10 text-[#FF922B]">{left}×</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{i.name}</div>
                  {(i.extras.length > 0 || i.removed.length > 0) && <div className="text-sm text-white/50">{[...i.extras.map((e) => `+ ${e.name}`), ...i.removed.map((r) => `بدون ${r}`)].join('، ')}</div>}
                  {i.paidQty > 0 && <div className="text-sm text-[#8CE99A] font-bold">دُفع {i.paidQty} من {i.qty}</div>}
                </div>
                <span className="font-black">{money(i.unitPrice * left)}</span>
              </div>
            );
          })}
          {toPay.length === 0 && t.due > 0 && <div className="text-lg font-bold text-white/50">كل الأصناف مدفوعة، بقي مبلغ {money(t.due)}.</div>}

          {tab.payments.length > 0 && (
            <div className="pt-3 space-y-1.5">
              <div className="text-sm font-black text-white/40">مدفوع</div>
              {tab.payments.map((p) => (
                <div key={p.id} className="flex items-start gap-3 text-base text-[#8CE99A]">
                  <CheckCircle2 size={18} className="mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{p.method}</div>
                    {p.note && <div className="text-sm text-white/50">{p.note}</div>}
                  </div>
                  <span className="font-black">{money(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 space-y-1.5 text-xl">
          {(t.discount > 0 || t.paid > 0) && <div className="flex justify-between text-white/60"><span>الإجمالي</span><span>{money(t.subtotal)}</span></div>}
          {t.discount > 0 && <div className="flex justify-between text-[#FCC2D7]"><span>خصم{tab.discountPct ? ` ${tab.discountPct}%` : ''}</span><span>- {money(t.discount)}</span></div>}
          {t.paid > 0 && <div className="flex justify-between text-[#8CE99A]"><span>مدفوع</span><span>{money(t.paid)}</span></div>}
          <div className="flex justify-between text-4xl sm:text-5xl font-black"><span>{t.paid > 0 ? 'المتبقي' : 'المجموع'}</span><span>{money(t.paid > 0 ? t.due : t.total)}</span></div>
        </div>
      </section>
      <aside className="h-[45%] shrink-0 lg:h-auto lg:w-1/2">
        <WeelinkAd compact />
      </aside>
      {logout}
    </div>
  );
};
