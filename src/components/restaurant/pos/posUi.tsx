// Shared pieces of the cashier and waiter screens: the window frame, the manager's approval and the
// short messages at the bottom of the screen.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { NumberPad } from './NumberPad';
import type { Worker } from '../staffTypes';
import type { Actor } from '../staffTypes';

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }> = ({ title, onClose, children, wide, footer }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[40] bg-black/50 flex items-end sm:items-center justify-center sm:p-4" onMouseDown={onClose}>
      <div
        dir="rtl"
        role="dialog"
        aria-label={title}
        className={`w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[94vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#1d1d1f]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="h-14 shrink-0 px-4 flex items-center gap-2 border-b border-neutral-100">
          <h3 className="flex-1 text-base font-black truncate">{title}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-xl hover:bg-neutral-100 flex items-center justify-center cursor-pointer"><X size={18} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
        {footer && <footer className="shrink-0 border-t border-neutral-100 p-3">{footer}</footer>}
      </div>
    </div>
  );
};

export const BigButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'dark' | 'green' | 'orange' | 'light' | 'red' }> = ({ tone = 'dark', className = '', ...props }) => {
  const tones = {
    dark: 'bg-[#1d1d1f] text-white',
    green: 'bg-[#2F9E44] text-white',
    orange: 'bg-[#E8590C] text-white',
    light: 'bg-neutral-100 text-[#1d1d1f]',
    red: 'bg-[#FFF5F5] text-[#E03131]',
  };
  return <button type="button" {...props} className={`h-12 px-4 rounded-2xl text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition disabled:opacity-35 disabled:cursor-default ${tones[tone]} ${className}`} />;
};

// Asks for a manager's PIN before a sensitive action. A manager signed in himself is not asked.
// Resolves with the manager's name, or null when cancelled. With no manager added yet the owner
// is told so and the action goes ahead (the restaurant is still being set up).
export const useManagerGate = (workers: Worker[], current: Worker | null) => {
  const [ask, setAsk] = useState<{ reason: string } | null>(null);
  const [error, setError] = useState('');
  const resolver = useRef<((name: string | null) => void) | null>(null);
  const managers = workers.filter((w) => w.active && w.role === 'manager');

  const askManager = useCallback(
    (reason: string) =>
      new Promise<string | null>((resolve) => {
        if (current?.role === 'manager') return resolve(current.name);
        if (managers.length === 0) return resolve(window.confirm(`${reason}\nلا يوجد مدير مسجل في «العمال» بعد. متابعة؟`) ? 'بدون مدير' : null);
        resolver.current = resolve;
        setError('');
        setAsk({ reason });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, workers]
  );

  const finish = (name: string | null) => {
    resolver.current?.(name);
    resolver.current = null;
    setAsk(null);
  };

  const dialog = ask ? (
    <Modal title="موافقة المدير" onClose={() => finish(null)}>
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#FFF4E6] text-[#A34A00] text-sm font-bold"><ShieldCheck size={18} className="shrink-0 mt-0.5" />{ask.reason}</div>
      <NumberPad
        length={4}
        dark={false}
        error={error}
        onSubmit={(pin) => {
          const m = managers.find((w) => w.pin === pin);
          if (m) finish(m.name);
          else setError('رقم المدير غير صحيح.');
        }}
      />
    </Modal>
  ) : null;

  return { askManager, dialog };
};

// A short message at the bottom of the screen.
export const useToast = () => {
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback((text: string, bad = false) => {
    setMsg({ text, bad });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3500);
  }, []);
  const node = msg ? (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] px-5 py-3 rounded-2xl shadow-xl text-sm font-black text-white ${msg.bad ? 'bg-[#E03131]' : 'bg-[#1d1d1f]'}`}>{msg.text}</div>
  ) : null;
  return { show, node };
};

export const failText = (e: unknown) => {
  const m = (e as any)?.message || '';
  const code = (e as any)?.code || '';
  if (m === 'gone') return 'هذه الفاتورة أُغلقت أو نُقلت من جهاز آخر.';
  if (m === 'occupied') return 'الطاولة مشغولة الآن بفاتورة أخرى.';
  if (String(code).includes('permission')) return 'قاعدة البيانات رفضت الحفظ: يجب نشر قواعد Firebase الجديدة.';
  return 'تعذر الحفظ. تحقق من الإنترنت وحاول مرة أخرى.';
};

export type { Actor };
