// The cards a car is shown with on the showroom page: a regular card, a wide row, a large photo
// card and a small chip for the running strip. Colours, corners and font come from the element
// (CarLook), so the owner restyles them like any other element.
import React from 'react';
import { Gauge, Fuel, Settings2, Calendar, ImageOff, ArrowLeft } from 'lucide-react';
import { Car } from '../carTypes';
import { carFacts, carPriceLabel, carSubtitle, carTitle, formatKm, statusMeta } from '../carModel';
import { formatMoney } from '../../shop/adminUi';

export interface CarLook {
  accent: string;
  cardBg: string;
  text: string;
  radius: number;
  font: string;
}

interface CardProps {
  car: Car;
  look: CarLook;
  onOpen: () => void;
}

const Photo: React.FC<{ car: Car; className?: string }> = ({ car, className = '' }) =>
  car.images[0] ? (
    <img src={car.images[0]} alt={carTitle(car)} referrerPolicy="no-referrer" loading="lazy" className={`w-full h-full object-cover ${className}`} />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-black/[0.05] text-black/20"><ImageOff size={32} /></div>
  );

// Badge on the photo, and a ribbon when the car is reserved or sold.
const Marks: React.FC<{ car: Car; look: CarLook }> = ({ car, look }) => (
  <>
    {car.badge && (
      <span className="absolute top-3 right-3 px-2.5 h-6 rounded-full text-[11px] font-bold text-white flex items-center" style={{ backgroundColor: look.accent }}>
        {car.badge}
      </span>
    )}
    {(car.status === 'reserved' || car.status === 'sold') && (
      <span className="absolute top-3 left-3 px-2.5 h-6 rounded-full text-[11px] font-bold text-white flex items-center" style={{ backgroundColor: statusMeta(car.status).color }}>
        {statusMeta(car.status).label}
      </span>
    )}
  </>
);

const Price: React.FC<{ car: Car; look: CarLook; size?: string }> = ({ car, look, size = 'text-lg' }) => (
  <div className="flex items-baseline gap-2 flex-wrap">
    <span className={`${size} font-black`} style={{ color: look.accent }}>{carPriceLabel(car)}</span>
    {car.showPrice && car.oldPrice > car.price && car.price > 0 && (
      <span className="text-xs line-through opacity-50">{formatMoney(car.oldPrice, car.currency)}</span>
    )}
    {car.negotiable && car.showPrice && car.price > 0 && <span className="text-[11px] opacity-60">قابل للتفاوض</span>}
  </div>
);

const shell = (look: CarLook): React.CSSProperties => ({
  backgroundColor: look.cardBg,
  color: look.text,
  borderRadius: look.radius,
  fontFamily: look.font,
});

export const CarCard: React.FC<CardProps> = ({ car, look, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group w-full text-right overflow-hidden border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition flex flex-col cursor-pointer"
    style={shell(look)}
  >
    <div className="relative aspect-[4/3] overflow-hidden">
      <div className="w-full h-full group-hover:scale-105 transition duration-700"><Photo car={car} /></div>
      <Marks car={car} look={look} />
    </div>
    <div className="flex-1 flex flex-col gap-2 p-4">
      <div>
        <div className="text-base font-black leading-snug line-clamp-1">{carTitle(car)}</div>
        {carSubtitle(car) && <div className="text-xs opacity-60 line-clamp-1">{carSubtitle(car)}</div>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {carFacts(car).slice(1).map((f) => (
          <span key={f} className="px-2 h-6 rounded-full bg-black/[0.05] text-[11px] font-semibold flex items-center">{f}</span>
        ))}
      </div>
      <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-black/[0.06]">
        <Price car={car} look={look} />
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 group-hover:-translate-x-1 transition" style={{ backgroundColor: look.accent }}>
          <ArrowLeft size={16} />
        </span>
      </div>
    </div>
  </button>
);

const Fact: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <span className="flex items-center gap-1.5 text-xs font-semibold opacity-80"><Icon size={14} className="opacity-60" />{text}</span>
);

export const CarWide: React.FC<CardProps> = ({ car, look, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group w-full text-right overflow-hidden border border-black/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition flex flex-col sm:flex-row cursor-pointer"
    style={shell(look)}
  >
    <div className="relative sm:w-[42%] aspect-[16/10] sm:aspect-auto sm:min-h-[220px] overflow-hidden shrink-0">
      <div className="absolute inset-0 group-hover:scale-105 transition duration-700"><Photo car={car} /></div>
      <Marks car={car} look={look} />
    </div>
    <div className="flex-1 flex flex-col gap-3 p-5">
      <div>
        <div className="text-xl font-black leading-snug">{carTitle(car)}</div>
        {carSubtitle(car) && <div className="text-sm opacity-60">{carSubtitle(car)}</div>}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {car.year > 0 && <Fact icon={Calendar} text={String(car.year)} />}
        <Fact icon={Gauge} text={car.condition === 'new' ? 'جديدة' : formatKm(car.mileage)} />
        {car.transmission && <Fact icon={Settings2} text={car.transmission} />}
        {car.fuel && <Fact icon={Fuel} text={car.fuel} />}
      </div>
      {car.description && <p className="text-sm opacity-70 leading-relaxed line-clamp-2">{car.description}</p>}
      <div className="mt-auto flex items-center justify-between gap-3">
        <Price car={car} look={look} size="text-xl" />
        <span className="h-10 px-4 rounded-full text-sm font-bold text-white flex items-center gap-1.5" style={{ backgroundColor: look.accent }}>
          التفاصيل <ArrowLeft size={15} />
        </span>
      </div>
    </div>
  </button>
);

export const CarLarge: React.FC<CardProps> = ({ car, look, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group relative w-full aspect-[4/3] text-right overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.12)] cursor-pointer"
    style={{ borderRadius: look.radius, fontFamily: look.font }}
  >
    <div className="absolute inset-0 group-hover:scale-105 transition duration-700"><Photo car={car} /></div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <Marks car={car} look={look} />
    <div className="absolute inset-x-0 bottom-0 p-5 text-white space-y-1">
      <div className="text-2xl font-black leading-tight">{carTitle(car)}</div>
      <div className="text-sm text-white/75">{carFacts(car).join(' · ')}</div>
      <div className="pt-1 flex items-center justify-between">
        <span className="text-xl font-black">{carPriceLabel(car)}</span>
        <span className="w-10 h-10 rounded-full flex items-center justify-center group-hover:-translate-x-1 transition" style={{ backgroundColor: look.accent }}>
          <ArrowLeft size={18} />
        </span>
      </div>
    </div>
  </button>
);

export const CarChip: React.FC<CardProps> = ({ car, look, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="w-full h-full flex items-center gap-3 px-2 overflow-hidden text-right cursor-pointer"
    style={{ backgroundColor: look.cardBg, color: look.text, borderRadius: 9999, fontFamily: look.font }}
    dir="rtl"
  >
    <span className="h-[80%] aspect-square rounded-full overflow-hidden shrink-0"><Photo car={car} /></span>
    <span className="min-w-0">
      <span className="block text-sm font-bold truncate">{carTitle(car)} {car.year || ''}</span>
      <span className="block text-xs font-black truncate" style={{ color: look.accent }}>{carPriceLabel(car)}</span>
    </span>
  </button>
);
