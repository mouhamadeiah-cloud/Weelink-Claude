// The packages of the chosen kind, under the questions on the start page: what each one holds, its
// price, and the extras. The owner picks one; nothing is charged yet (subscriptions come later).
import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { ProjectType } from '../shop/shopTypes';
import { ADD_ONS, PLANS, readPlan, savePlan, yearlyPrice } from '../../data/plans';

const HEAD_FONT = "'Readex Pro', 'IBM Plex Sans Arabic', sans-serif";

interface PlanPickerProps {
  kind: ProjectType;
  // Whose choice it is (the account, or the visitor before signing up).
  owner: string;
  accent: string;
}

export const PlanPicker: React.FC<PlanPickerProps> = ({ kind, owner, accent }) => {
  const plans = PLANS[kind];
  const [yearly, setYearly] = useState(false);
  const [picked, setPicked] = useState<string>(() => readPlan(owner, kind) || plans[0].id);

  const pick = (id: string) => {
    setPicked(id);
    savePlan(owner, kind, id);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pb-10 space-y-4" aria-labelledby="plans-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="plans-title" className="text-2xl font-bold" style={{ fontFamily: HEAD_FONT }}>اختر باقتك</h2>
          <p className="text-xs text-[#5b5348]">فيك تغيّرها بأي وقت. الدفع لسا ما بلّش، والأسعار مبدئية.</p>
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
              {y ? 'سنوي (شهرين مجاناً)' : 'شهري'}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 ${plans.length === 2 ? 'sm:grid-cols-2 max-w-3xl' : 'sm:grid-cols-3'}`}>
        {plans.map((p) => {
          const on = picked === p.id;
          const price = yearly ? yearlyPrice(p.monthly) : p.monthly;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p.id)}
              aria-pressed={on}
              className={`relative text-right rounded-3xl bg-white p-5 border-2 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)] ${on ? 'shadow-[0_18px_40px_rgba(0,0,0,0.1)]' : 'border-black/5'}`}
              style={on ? { borderColor: accent } : undefined}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold text-white rounded-full px-2.5 py-0.5" style={{ backgroundColor: accent }}>الأكثر طلباً</span>
              )}
              <span className="flex items-start justify-between gap-2">
                <span className="space-y-0.5">
                  <span className="block text-lg font-bold" style={{ fontFamily: HEAD_FONT }}>باقة {p.name}</span>
                  <span className="block text-xs text-[#5b5348]">{p.tagline}</span>
                </span>
                <span className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${on ? 'text-white' : 'border-black/15'}`} style={on ? { backgroundColor: accent, borderColor: accent } : undefined}>
                  {on && <Check size={14} />}
                </span>
              </span>
              <span className="block my-4">
                {p.monthly === 0 ? (
                  <span className="text-3xl font-bold" style={{ fontFamily: HEAD_FONT }}>مجاناً</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold" style={{ fontFamily: HEAD_FONT }}>{price}$</span>
                    <span className="text-xs text-[#5b5348] font-bold"> / {yearly ? 'بالسنة' : 'بالشهر'}</span>
                    {yearly && <span className="block text-[11px] font-bold mt-1" style={{ color: accent }}>مع دومين خاص مجاناً</span>}
                  </>
                )}
              </span>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs leading-relaxed">
                    <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}><Check size={10} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-white border border-black/5 p-5 space-y-3">
        <h3 className="text-sm font-bold" style={{ fontFamily: HEAD_FONT }}>إضافات بتقدر تزيدها</h3>
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
