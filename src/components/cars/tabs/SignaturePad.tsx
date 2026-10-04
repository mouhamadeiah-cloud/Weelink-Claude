// A signature drawn with a finger, pen or mouse. The value is an image (an uploaded URL, or a data
// URL until the document is saved); '' means not signed.
import React, { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}

export const SignaturePad: React.FC<Props> = ({ label, value, onChange, disabled }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const drew = useRef(false);
  const [editing, setEditing] = useState(!value);

  useEffect(() => {
    if (!value) setEditing(true);
  }, [value]);

  // A white background so the image stays readable when saved as JPEG.
  useEffect(() => {
    if (!editing) return;
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.offsetWidth, c.offsetHeight);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b1f4d';
    drew.current = false;
  }, [editing]);

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current!.getContext('2d')!;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    drew.current = true;
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvas.current!.getContext('2d')!;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (drew.current) onChange(canvas.current!.toDataURL('image/png'));
  };
  const clear = () => {
    onChange('');
    setEditing(false);
    setTimeout(() => setEditing(true), 0);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-neutral-600">{label}</span>
        {!disabled && (value || drew.current) && (
          <button type="button" onClick={clear} className="text-[11px] font-bold text-neutral-500 hover:text-red-500 flex items-center gap-1 cursor-pointer"><Eraser size={12} /> مسح</button>
        )}
      </div>
      {value && !editing ? (
        <div className="h-32 rounded-xl border border-neutral-200 bg-white flex items-center justify-center"><img src={value} alt={label} className="max-h-28 max-w-full" /></div>
      ) : (
        <canvas
          ref={canvas}
          aria-label={`${label}: وقّع هنا`}
          className={`w-full h-32 rounded-xl border-2 border-dashed bg-white touch-none ${disabled ? 'border-neutral-200' : 'border-neutral-300 cursor-crosshair'}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
        />
      )}
      {!value && !disabled && <p className="text-[10px] text-neutral-400">وقّع داخل المربع بالإصبع أو بالقلم أو بالماوس.</p>}
    </div>
  );
};
