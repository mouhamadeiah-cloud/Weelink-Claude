// شاشة الزبون: faces the guest at the cashier. It follows only the cashier device it is tied to: the
// bill open on it (dishes, total, paid, left to pay), a thank-you with the change after paying, and
// the restaurant's name when nothing is open.
import React, { useEffect, useState } from 'react';
import { CheckCircle2, LogOut, UtensilsCrossed } from 'lucide-react';
import { useScreen, useTab } from '../staffCloud';
import { itemTotal, tabTitle, tabTotals } from '../staffTypes';
import { formatMoney } from '../../shop/adminUi';

export const CustomerDisplay: React.FC<{ uid: string; cashierId: string; name: string; currency: string; onLogout: () => void }> = ({ uid, cashierId, name, currency, onLogout }) => {
  const screen = useScreen(uid, cashierId);
  const tab = useTab(uid, screen?.tabId || '');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 2000);
    return () => window.clearInterval(t);
  }, []);
  const money = (n: number) => formatMoney(n, currency);
  const thanks = screen?.thanks && now - new Date(screen.thanks.at).getTime() < 20000 ? screen.thanks : null;

  const logout = (
    <button type="button" onClick={onLogout} aria-label="خروج الجهاز" className="absolute bottom-3 left-3 w-9 h-9 rounded-xl text-white/20 hover:text-white/70 flex items-center justify-center cursor-pointer"><LogOut size={16} /></button>
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
      <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex flex-col items-center justify-center gap-4 p-8 font-sans text-center">
        <UtensilsCrossed size={72} className="text-[#FF922B]" />
        <div className="text-5xl font-black">{name || 'أهلًا وسهلًا'}</div>
        <div className="text-xl font-bold text-white/50">أهلًا بكم</div>
        {logout}
      </div>
    );
  }

  const t = tabTotals(tab);
  const items = tab.items.filter((i) => !i.voided);
  return (
    <div dir="rtl" className="fixed inset-0 bg-[#18191c] text-white flex flex-col p-6 sm:p-10 font-sans">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="text-3xl font-black flex-1">{name}</div>
        <div className="text-xl font-bold text-white/60">{tabTitle(tab)}</div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex items-start gap-4 text-2xl">
            <span className="font-black w-12 text-[#FF922B]">{i.qty}×</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold">{i.name}</div>
              {(i.extras.length > 0 || i.removed.length > 0) && <div className="text-base text-white/50">{[...i.extras.map((e) => `+ ${e.name}`), ...i.removed.map((r) => `بدون ${r}`)].join('، ')}</div>}
            </div>
            <span className="font-black">{money(itemTotal(i))}</span>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-white/10 space-y-2 text-2xl">
        {t.discount > 0 && <div className="flex justify-between text-[#FCC2D7]"><span>خصم</span><span>- {money(t.discount)}</span></div>}
        {t.paid > 0 && <div className="flex justify-between text-[#8CE99A]"><span>مدفوع</span><span>{money(t.paid)}</span></div>}
        <div className="flex justify-between text-5xl font-black"><span>{t.paid > 0 ? 'المتبقي' : 'المجموع'}</span><span>{money(t.paid > 0 ? t.due : t.total)}</span></div>
      </div>
      {logout}
    </div>
  );
};
