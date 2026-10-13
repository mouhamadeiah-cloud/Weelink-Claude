// The packages of the chosen kind, the start page's step right after the kind (Eyad, 12 Oct): what
// each one holds, a drawing of what comes with it, its price, and the extras. Picking one starts the
// questions. Nothing is charged yet (subscriptions come later); the choice is remembered.
import React, { useState } from 'react';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import type { ProjectType } from '../shop/shopTypes';
import { ADD_ONS, PLANS, YEARLY_DISCOUNT, formatPounds, readPlan, savePlan, yearlyPrice } from '../../data/plans';
import { PlanArt } from './PlanArt';


interface PlanPickerProps {
  kind: ProjectType;
  // Whose choice it is (the account, or the visitor before signing up).
  owner: string;
  accent: string;
  title: string;
  onPicked: (planId: string) => void;
}

export const PlanPicker: React.FC<PlanPickerProps> = ({ kind, owner, accent, title, onPicked }) => {
  const plans = PLANS[kind];
  const [yearly, setYearly] = useState(false);
  const before = readPlan(owner, kind);

  const pick = (id: string) => {
    savePlan(owner, kind, id);
    onPicked(id);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-5 sm:py-8 space-y-5" aria-labelledby="plans-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-bold" style={{ color: accent }}>{title}</p>
          <h1 id="plans-title" className="text-2xl sm:text-3xl font-bold">اختر باقتك</h1>
          <p className="text-xs text-[#5b5348]">بعد ما تختار، منبلّش بالأسئلة. فيك تغيّر الباقة بأي وقت، والدفع لسا ما بلّش.</p>
        </div>
        <div className="inline-flex rounded-full bg-white border border-black/10 p-1 text-xs font-bold" role="group" aria-label="طريقة الدفع">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              onClick={() => setYearly(y)}
              aria-pressed={yearly === y}
              className={`rounded-full px-3.5 py-1.5 transition ${yearly === y ? 'text-white shadow' : 'text-[#5b5348] hover:text-[#1c1a17]'}`}
              style={yearly === y ? { backgroundColor: accent } : undefined}
            >
              {y ? `سنوي (أرخص ${Math.round(YEARLY_DISCOUNT * 100)}٪)` : 'شهري'}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 ${plans.length === 2 ? 'sm:grid-cols-2 max-w-3xl' : 'sm:grid-cols-3'}`}>
        {plans.map((p, i) => {
          const was = before === p.id;
          return (
            <article
              key={p.id}
              style={{ animationDelay: `${80 + i * 90}ms`, ...(p.popular ? { borderColor: accent } : {}) }}
              className={`wl-rise relative flex flex-col rounded-3xl bg-white p-5 border-2 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${p.popular ? 'shadow-[0_18px_40px_rgba(0,0,0,0.08)]' : 'border-black/5'}`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold text-white rounded-full px-2.5 py-0.5" style={{ backgroundColor: accent }}>الأكثر طلباً</span>
              )}
              <PlanArt art={p.art} accent={accent} kind={kind} />
              <div className="mt-4 space-y-0.5">
                <h2 className="text-lg font-bold">{p.monthly === 0 ? 'الباقة المجانية' : `باقة ${p.name}`}</h2>
                <p className="text-xs text-[#5b5348]">{p.tagline}</p>
              </div>
              <div className="my-4">
                {p.monthly === 0 ? (
                  <span className="text-3xl font-bold">مجاناً</span>
                ) : yearly ? (
                  <>
                    <span className="text-2xl font-bold">{formatPounds(yearlyPrice(p.monthly))}</span>
                    <span className="text-xs text-[#5b5348] font-bold"> / بالسنة</span>
                    <span className="block text-[11px] font-bold mt-1" style={{ color: accent }}>
                      بدل {formatPounds(p.monthly * 12)}، ومعها دومين خاص مجاناً
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold">{formatPounds(p.monthly)}</span>
                    <span className="text-xs text-[#5b5348] font-bold"> / بالشهر</span>
                  </>
                )}
              </div>
              <ul className="space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs leading-relaxed">
                    <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}><Check size={10} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => pick(p.id)}
                className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold transition ${p.popular ? 'text-white hover:opacity-90' : 'bg-[#f6f3ee] text-[#1c1a17] hover:bg-[#ece6dc]'}`}
                style={p.popular ? { backgroundColor: accent } : undefined}
              >
                {was ? 'كمّل بهالباقة' : 'اختار هالباقة'}
                <ArrowLeft size={15} />
              </button>
            </article>
          );
        })}
      </div>

      <div className="rounded-3xl bg-white border border-black/5 p-5 space-y-3">
        <h3 className="text-sm font-bold">إضافات</h3>
        <ul className="grid sm:grid-cols-2 gap-2">
          {ADD_ONS[kind].map((a) => (
            <li key={a.name} className="flex items-center gap-2.5 rounded-2xl bg-[#f6f3ee] px-3 py-2.5 text-xs">
              <span className="w-6 h-6 shrink-0 rounded-full bg-white flex items-center justify-center" style={{ color: accent }}><Plus size={13} /></span>
              <span className="flex-1 font-bold">{a.name}</span>
              <span className="text-[#5b5348]">{a.price}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
