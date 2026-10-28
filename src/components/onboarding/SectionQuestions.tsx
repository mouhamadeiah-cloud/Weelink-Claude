// The questions that follow the sections of the page, as a thread of the chat: first the sections the owner may tick, then, one section at
// a time, the questions of every section that will be in his page (fixed ones and the ticked ones). A section answered stays as his own
// bubble that can be opened again; a change in the ticks renews what follows. They come from src/data/sectionQuestions.ts and the page model
// of the chosen package. Every section can be skipped: Wee AI then writes it from what it knows.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { AskedSection, DAYS, SectionQuestion, answerKey, pruneAnswers, questionPlan, questionsFor, summarizeSection, withName } from '../../data/sectionQuestions';
import type { QuestionModel } from '../../services/questionModel';
import { AiBubble, AnswerBox, SKIPPED_TEXT, UserBubble } from './ChatThread';
import type { Topic } from './ExplainPanel';

export type SectionAnswers = Record<string, any>;
export interface BookingChoice { now: boolean; days: number[]; from: string; to: string; minutes: number }
export const DEFAULT_BOOKING: BookingChoice = { now: false, days: [6, 0, 1, 2, 3, 4], from: '09:00', to: '17:00', minutes: 30 };

const FIELD_LABEL: Record<string, string> = { name: 'الاسم', price: 'السعر', note: 'ملاحظة', role: 'الدور', photo: 'رابط صورة' };
const input = 'w-full text-xs font-semibold py-2 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:bg-white';

const ListQuestion: React.FC<{ q: SectionQuestion; rows: Record<string, string>[]; onChange: (rows: Record<string, string>[]) => void }> = ({ q, rows, onChange }) => {
  const fields = (q.fields || ['name']).filter((f) => f !== 'photo'); // photos are added from the editor
  const shown: Record<string, string>[] = rows.length ? rows : Array.from({ length: q.count || 3 }, () => ({}));
  const set = (i: number, field: string, value: string) => onChange(shown.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  return (
    <div className="space-y-1.5">
      {shown.map((r, i) => (
        <div key={i} className="flex gap-1.5">
          {fields.map((f) => (
            <input key={f} value={r[f] || ''} onChange={(e) => set(i, f, e.target.value)} placeholder={FIELD_LABEL[f] || f} aria-label={`${FIELD_LABEL[f] || f} ${i + 1}`}
              className={`${input} ${f === 'price' ? 'max-w-[7rem]' : ''}`} />
          ))}
        </div>
      ))}
      {shown.length < 12 && (
        <button type="button" onClick={() => onChange([...shown, {}])} className="flex items-center gap-1 text-xs font-bold text-brand cursor-pointer"><Plus size={13} /> إضافة صف</button>
      )}
    </div>
  );
};

const BookingQuestion: React.FC<{ value: BookingChoice | undefined; onChange: (v: BookingChoice) => void }> = ({ value, onChange }) => {
  const v = value || DEFAULT_BOOKING;
  const set = (c: Partial<BookingChoice>) => onChange({ ...v, ...c });
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[{ now: true, label: 'أضبطها الآن' }, { now: false, label: 'لاحقاً من الإدارة' }].map((o) => (
          <button key={o.label} type="button" onClick={() => set({ now: o.now })}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer ${v.now === o.now ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200'}`}>{o.label}</button>
        ))}
      </div>
      {v.now && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => {
              const on = v.days.includes(d.id);
              return (
                <button key={d.id} type="button" aria-pressed={on} onClick={() => set({ days: on ? v.days.filter((x) => x !== d.id) : [...v.days, d.id] })}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${on ? 'bg-brand text-white border-brand' : 'bg-white border-neutral-200 text-neutral-600'}`}>{d.name}</button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-600">
            من <input type="time" value={v.from} onChange={(e) => set({ from: e.target.value })} className={`${input} max-w-[8rem]`} />
            إلى <input type="time" value={v.to} onChange={(e) => set({ to: e.target.value })} className={`${input} max-w-[8rem]`} />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-600">
            مدة الموعد
            <select value={v.minutes} onChange={(e) => set({ minutes: Number(e.target.value) })} className={`${input} max-w-[8rem]`}>
              {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} دقيقة</option>)}
            </select>
          </label>
        </div>
      )}
    </div>
  );
};

const TICKS = '@ticks';
const BTN_GHOST = 'py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold cursor-pointer';
const BTN_MAIN = 'flex-1 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-lg cursor-pointer';

interface Props {
  model: QuestionModel;
  kind?: string;
  /** The owner's first name, once he gave it: Wee AI talks to him by it. */
  name?: string;
  ticked: string[] | undefined;
  answers: SectionAnswers;
  onTicked: (ids: string[]) => void;
  onAnswers: (a: SectionAnswers) => void;
  /** The last bubble of the thread, once every section is passed (the special notes and the finish button). */
  finale: React.ReactNode;
  /** What the panel beside the chat shows: the section being asked (null once every section is passed). */
  onTopic?: (t: (Omit<Topic, 'progress'> & { at: { n: number; total: number } }) | null) => void;
  /** The chat's own forms (gallery, front photo, services, features): their form, their answer in a line, and how to clear them. */
  custom?: { form: (id: string) => React.ReactNode; summary: (id: string) => string; clear: (id: string) => void };
}

export const SectionQuestions: React.FC<Props> = ({ model, kind, name = '', ticked, answers, onTicked, onAnswers, finale, onTopic, custom }) => {
  const plan = useMemo(() => questionPlan(model, kind), [model, kind]);
  const on = ticked ?? plan.choices.filter((c) => c.defaultOn).map((c) => c.id);
  const asked: AskedSection[] = useMemo(() => questionsFor(model, ticked, kind), [model, ticked, kind]);
  const [passed, setPassed] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const ids = [...(plan.choices.length ? [TICKS] : []), ...asked.map((a) => a.id)];
  // The first one not passed yet is the one asked now; a change in the ticks brings new sections here by itself.
  const current = editing ? undefined : ids.find((id) => !passed.includes(id));
  const set = (k: string, v: unknown) => onAnswers({ ...answers, [k]: v });
  const pass = (id: string) => { setPassed((p) => (p.includes(id) ? p : [...p, id])); setEditing(null); };

  const liveRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    liveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current, editing]);

  const TICKS_EXPLAIN = 'يا {name}، هي أقسام اختيارية بتزيدها على صفحتك. كل قسم بتعلّم عليه بسألك عنه بعد شوي، والقسم اللي ما بتعلّم عليه ما رح يظهر. وإذا غيّرت رأيك بترجع لهون وبتعدّل، والأسئلة اللي بعدها بتتجدد لحالها.';
  const openId = editing ?? current;
  useEffect(() => {
    if (!onTopic) return;
    if (openId === TICKS) onTopic({ id: 'section-ticks', title: 'أي أقسام تريدها في صفحتك؟', explain: withName(TICKS_EXPLAIN, name), note: 'تقدر تغيّر اختيارك لاحقاً وتتجدد الأسئلة.', at: { n: 1, total: ids.length + 1 } });
    else {
      const sec = asked.find((a) => a.id === openId);
      if (sec) onTopic({ id: `section-${sec.id}`, title: sec.ask.title, explain: [sec.ask.intro, sec.ask.explain && withName(sec.ask.explain, name)].filter(Boolean).join(' '), note: sec.ask.note, at: { n: ids.indexOf(sec.id) + 1, total: ids.length + 1 } });
      else onTopic(null);
    }
  }, [openId, name]); // eslint-disable-line react-hooks/exhaustive-deps

  const tick = (id: string, checked: boolean) => {
    const next = checked ? [...on, id] : on.filter((x) => x !== id);
    onTicked(next);
    if (!checked) onAnswers(pruneAnswers(answers, [id])); // an unticked section leaves nothing behind
  };

  const ticksItem = (live: boolean) => {
    const names = plan.choices.filter((c) => on.includes(c.id)).map((c) => c.ask.title);
    const title = 'أي أقسام تريدها في صفحتك؟';
    if (!live) return (
      <div key={TICKS} className="space-y-2">
        <AiBubble title={title} />
        <UserBubble text={names.length ? names.join('، ') : 'بدون أقسام إضافية'} onEdit={() => setEditing(TICKS)} />
      </div>
    );
    return (
      <div key={TICKS} ref={liveRef} className="space-y-2 scroll-mt-2">
        <AiBubble title={title} live>
          <AnswerBox>
            <div className="space-y-2">
              {plan.choices.map((c) => (
                <label key={c.id} className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={on.includes(c.id)} onChange={(e) => tick(c.id, e.target.checked)} />
                  <span className="text-xs">
                    <span className="font-bold text-neutral-800">{c.ask.title}</span>
                    {c.ask.intro && <span className="block text-neutral-500 font-semibold">{c.ask.intro}</span>}
                  </span>
                </label>
              ))}
              <button type="button" onClick={() => pass(TICKS)} className={`w-full ${BTN_MAIN}`}>{editing ? 'تم' : 'التالي'}</button>
            </div>
          </AnswerBox>
        </AiBubble>
      </div>
    );
  };

  const sectionItem = (section: AskedSection, live: boolean) => {
    const text = summarizeSection(section.id, section.ask, answers, custom?.summary);
    if (!live) return (
      <div key={section.id} className="space-y-2">
        <AiBubble title={section.ask.title} />
        <UserBubble text={text || SKIPPED_TEXT} onEdit={() => setEditing(section.id)} />
      </div>
    );
    const skip = () => {
      onAnswers(pruneAnswers(answers, [section.id]));
      section.ask.questions.forEach((q) => q.custom && custom?.clear(q.custom));
      pass(section.id);
    };
    return (
      <div key={section.id} ref={liveRef} className="space-y-2 scroll-mt-2">
        <AiBubble title={section.ask.title} live>
          <AnswerBox>
            <div className="space-y-3">
              {section.ask.questions.map((q) => {
                const k = answerKey(section.id, q);
                return (
                  <div key={k} className="space-y-1.5">
                    <p className="text-xs font-bold text-neutral-800">{q.label}</p>
                    {q.hint && <p className="text-[11px] font-semibold text-neutral-500">{q.hint}</p>}
                    {q.custom && custom?.form(q.custom)}
                    {!q.custom && q.kind === 'list' && <ListQuestion q={q} rows={answers[k] || []} onChange={(rows) => set(k, rows)} />}
                    {q.kind === 'settings' && <BookingQuestion value={answers[k]} onChange={(v) => set(k, v)} />}
                    {q.kind === 'choice' && (
                      <div className="flex flex-wrap gap-2">
                        {(q.choices || []).map((c) => (
                          <button key={c} type="button" onClick={() => set(k, c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${answers[k] === c ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200'}`}>{c}</button>
                        ))}
                      </div>
                    )}
                    {(q.kind === 'text' || q.kind === 'longText') && (
                      q.kind === 'longText'
                        ? <textarea rows={3} value={answers[k] || ''} onChange={(e) => set(k, e.target.value)} className={input} />
                        : <input value={answers[k] || ''} onChange={(e) => set(k, e.target.value)} className={input} />
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={skip} className={BTN_GHOST}>تخطّى</button>
                <button type="button" onClick={() => pass(section.id)} className={BTN_MAIN}>{editing ? 'تم' : 'التالي'}</button>
              </div>
            </div>
          </AnswerBox>
        </AiBubble>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {ids.map((id) => {
        const live = id === current || id === editing;
        if (!live && !passed.includes(id)) return null;
        if (id === TICKS) return ticksItem(live);
        const section = asked.find((a) => a.id === id);
        return section ? sectionItem(section, live) : null;
      })}
      {!editing && current === undefined && <div ref={liveRef} className="scroll-mt-2">{finale}</div>}
    </div>
  );
};
