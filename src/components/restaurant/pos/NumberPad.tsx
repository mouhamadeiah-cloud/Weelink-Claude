// A big numeric keypad for codes and PINs: the device's six-digit code, a worker's four-digit PIN and
// the manager's PIN for a sensitive action. It submits by itself once the last digit is typed.
import React, { useEffect, useState } from 'react';
import { Delete, Loader2 } from 'lucide-react';

interface NumberPadProps {
  length: number;
  busy?: boolean;
  error?: string;
  dark?: boolean;
  onSubmit: (code: string) => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({ length, busy, error, dark = true, onSubmit }) => {
  const [code, setCode] = useState('');
  const press = (d: string) => {
    if (busy) return;
    const next = (code + d).slice(0, length);
    setCode(next);
    if (next.length === length) onSubmit(next);
  };
  useEffect(() => {
    if (error) setCode('');
  }, [error]);
  // Typing on a keyboard works too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') setCode((c) => c.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const key = dark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-[#1d1d1f]';
  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-2" dir="ltr">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={`w-11 h-14 rounded-xl text-2xl font-black flex items-center justify-center ${i < code.length ? (dark ? 'bg-white text-[#18191c]' : 'bg-[#1d1d1f] text-white') : dark ? 'bg-white/10' : 'bg-neutral-100'}`}>{code[i] ? '•' : ''}</span>
        ))}
      </div>
      <div className={`h-5 text-sm font-bold text-center ${dark ? 'text-[#FF8787]' : 'text-[#E03131]'}`}>{busy ? <Loader2 size={18} className="mx-auto animate-spin opacity-60" /> : error}</div>
      <div className="grid grid-cols-3 gap-3" dir="ltr">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className={`h-16 rounded-2xl text-2xl font-black cursor-pointer active:scale-95 ${key}`}>{d}</button>
        ))}
        <span />
        <button type="button" onClick={() => press('0')} className={`h-16 rounded-2xl text-2xl font-black cursor-pointer active:scale-95 ${key}`}>0</button>
        <button type="button" aria-label="مسح" onClick={() => setCode(code.slice(0, -1))} className={`h-16 rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 ${dark ? 'bg-white/5 text-white' : 'bg-neutral-50 text-[#1d1d1f]'}`}><Delete size={24} /></button>
      </div>
    </div>
  );
};
