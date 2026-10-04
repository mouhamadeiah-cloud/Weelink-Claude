// How a product looks on the store page: main image, badge, name, short description and price, as
// a grid card or as a full-width slide. Clicking it opens the floating card, which is where the
// customer picks options and adds to the cart. Also used as the live preview in the admin's
// product editor.
import React from 'react';
import { ImageOff } from 'lucide-react';
import { ShopProduct, CardCorners, DEFAULT_CARD_STYLE } from '../shopTypes';
import { badgeColor, badgeText, isSoldOut } from '../productModel';
import { formatPrice } from '../../../utils/cartStore';

interface ProductCardProps {
  product: ShopProduct;
  accent?: string;
  onOpen?: () => void; // set on the store page; the editor preview leaves it out
}

const Badge: React.FC<{ product: ShopProduct }> = ({ product }) => {
  const badge = badgeText(product);
  if (!badge) return null;
  return (
    <span
      className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow"
      style={{ backgroundColor: badgeColor(product) }}
    >
      {badge}
    </span>
  );
};

// شريحة: the main image fills the row as a fixed background; name and price sit in a narrow strip
// along its bottom.
export const ProductSlide: React.FC<ProductCardProps> = ({ product, onOpen }) => {
  const soldOut = isSoldOut(product);
  return (
    <div
      onClick={onOpen}
      dir="rtl"
      className={`relative w-full aspect-[16/9] sm:aspect-[21/8] min-h-[200px] rounded-3xl overflow-hidden bg-neutral-200 bg-cover bg-center text-right ${onOpen ? 'cursor-pointer' : ''} ${soldOut ? 'grayscale' : ''}`}
      style={product.images[0] ? { backgroundImage: `url("${product.images[0]}")` } : undefined}
    >
      {!product.images[0] && <div className="absolute inset-0 flex items-center justify-center text-neutral-400"><ImageOff size={36} /></div>}
      <Badge product={product} />
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 bg-black/55 backdrop-blur-sm text-white">
        <div className="flex-1 min-w-[45%]">
          <div className="text-sm sm:text-base font-bold leading-tight truncate">{product.name || 'اسم المنتج'}</div>
          {product.showShortDescription && product.shortDescription && (
            <div className="text-[11px] text-white/75 truncate">{product.shortDescription}</div>
          )}
        </div>
        <div className="shrink-0 mr-auto flex flex-col items-end leading-tight">
          <span className="text-sm sm:text-base font-black">{formatPrice(product.price, product.currency)}</span>
          {product.oldPrice > product.price && (
            <span className="text-[10px] text-white/60 line-through">{formatPrice(product.oldPrice, product.currency)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Corner radius of each card shape, for the card and for its photo's top corners.
const CORNERS: Record<CardCorners, string> = {
  rounded: '24px',
  soft: '10px',
  square: '0px',
  leaf: '28px 4px 28px 4px',
};

// The card's look from the product's card settings (frame, text colours, corners).
export const cardLook = (product: ShopProduct) => {
  const st = product.cardStyle || DEFAULT_CARD_STYLE;
  return {
    radius: CORNERS[st.corners] || CORNERS.rounded,
    border: st.border ? `2px solid ${st.borderColor || '#B4532A'}` : '1px solid rgba(0,0,0,0.06)',
    textColor: st.textColor || '',
    textBg: st.textBg || '#FFFFFF',
  };
};

// Card width in px for a product's card size, from the layout's width for 50% (the default).
export const cardWidth = (product: ShopProduct, base: number) => Math.round(base * ((product.cardSize || 50) / 50));

export const ProductCard: React.FC<ProductCardProps & { width?: number }> = ({ product, accent = '#B4532A', onOpen, width }) => {
  const soldOut = isSoldOut(product);
  const look = cardLook(product);
  // Narrow cards drop the description; the narrowest keep only the photo, name and price.
  const tiny = !!width && width < 110;
  const compact = !!width && width < 190;

  return (
    <div
      onClick={onOpen}
      dir="rtl"
      className={`group w-full text-right overflow-hidden flex flex-col transition ${
        onOpen ? 'cursor-pointer hover:shadow-[0_16px_40px_rgba(42,31,26,0.14)] hover:-translate-y-0.5' : ''
      }`}
      style={{ borderRadius: look.radius, border: look.border, backgroundColor: look.textBg }}
    >
      <div className="relative w-full aspect-square bg-neutral-100 overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition duration-500 ${onOpen ? 'group-hover:scale-105' : ''} ${soldOut ? 'grayscale opacity-70' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageOff size={tiny ? 18 : 32} /></div>
        )}
        {!tiny && <Badge product={product} />}
      </div>
      <div className={`${tiny ? 'p-1.5 gap-0' : compact ? 'p-2.5 gap-1' : 'p-4 gap-1.5'} flex flex-col flex-1`} style={{ color: look.textColor || undefined }}>
        <div
          className={`${tiny ? 'text-[10px] truncate' : compact ? 'text-xs line-clamp-2' : 'text-[15px] line-clamp-2'} font-bold leading-snug`}
          style={{ color: look.textColor || '#2A1F1A' }}
        >
          {product.name || 'اسم المنتج'}
        </div>
        {!compact && product.showShortDescription && product.shortDescription && (
          <div className="text-xs leading-relaxed line-clamp-2" style={{ color: look.textColor || '#8A7B70', opacity: look.textColor ? 0.8 : 1 }}>{product.shortDescription}</div>
        )}
        <div className={`mt-auto ${tiny ? '' : 'pt-1'} flex items-baseline gap-x-2 flex-wrap`}>
          <span className={`${tiny ? 'text-[10px]' : compact ? 'text-xs' : 'text-base'} font-black`} style={{ color: accent }}>{formatPrice(product.price, product.currency)}</span>
          {!tiny && product.oldPrice > product.price && (
            <span className="text-[11px] text-[#8A7B70] line-through">{formatPrice(product.oldPrice, product.currency)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const Price: React.FC<{ product: ShopProduct; accent: string; className?: string }> = ({ product, accent, className = 'text-base' }) => (
  <div className="flex items-baseline gap-2 flex-wrap">
    <span className={`${className} font-black`} style={{ color: accent }}>{formatPrice(product.price, product.currency)}</span>
    {product.oldPrice > product.price && (
      <span className="text-xs text-[#8A7B70] line-through">{formatPrice(product.oldPrice, product.currency)}</span>
    )}
  </div>
);

const Photo: React.FC<{ product: ShopProduct; className: string; hover?: boolean }> = ({ product, className, hover }) => (
  <div className={`relative bg-neutral-100 overflow-hidden ${className}`}>
    {product.images[0] ? (
      <img
        src={product.images[0]}
        alt={product.name}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition duration-500 ${hover ? 'group-hover:scale-105' : ''} ${isSoldOut(product) ? 'grayscale opacity-70' : ''}`}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageOff size={28} /></div>
    )}
    <Badge product={product} />
  </div>
);

const Description: React.FC<{ product: ShopProduct; lines?: string }> = ({ product, lines = 'line-clamp-2' }) =>
  product.showShortDescription && product.shortDescription ? (
    <div className={`text-sm text-[#8A7B70] leading-relaxed ${lines}`}>{product.shortDescription}</div>
  ) : null;

// زجزاج: one product per row, the photo on alternating sides.
export const ProductZigzag: React.FC<ProductCardProps & { flip: boolean }> = ({ product, accent = '#B4532A', onOpen, flip }) => (
  <div onClick={onOpen} dir="rtl" className={`group w-full flex items-center gap-5 cursor-pointer ${flip ? 'flex-row-reverse' : ''}`}>
    <Photo product={product} className="w-[46%] aspect-[4/3] rounded-2xl shrink-0" hover />
    <div className="flex-1 flex flex-col gap-3 text-right">
      <div className="text-lg font-bold text-[#2A1F1A] leading-snug font-['El_Messiri',serif]">{product.name || 'اسم المنتج'}</div>
      <Description product={product} lines="line-clamp-3" />
      <Price product={product} accent={accent} className="text-base" />
      <span className="self-start mt-1 h-8 px-4 rounded-full text-xs font-bold text-white inline-flex items-center" style={{ backgroundColor: accent }}>
        عرض المنتج
      </span>
    </div>
  </div>
);

// بطاقة عرضية: photo on the right, details beside it.
export const ProductWide: React.FC<ProductCardProps> = ({ product, accent = '#B4532A', onOpen }) => {
  const look = cardLook(product);
  return (
    <div
      onClick={onOpen}
      dir="rtl"
      className="group w-full h-full flex overflow-hidden cursor-pointer transition hover:shadow-[0_16px_40px_rgba(42,31,26,0.14)] hover:-translate-y-0.5"
      style={{ borderRadius: look.radius, border: look.border, backgroundColor: look.textBg }}
    >
      <Photo product={product} className="w-[42%] aspect-[4/3] shrink-0" hover />
      <div className="flex-1 p-3 flex flex-col gap-1 text-right min-w-0">
        <div className="text-sm font-bold leading-snug line-clamp-2" style={{ color: look.textColor || '#2A1F1A' }}>{product.name || 'اسم المنتج'}</div>
        <Description product={product} />
        <div className="mt-auto pt-1"><Price product={product} accent={accent} className="text-sm" /></div>
      </div>
    </div>
  );
};

// بطاقة صغيرة: square photo, name and price only.
export const ProductMini: React.FC<ProductCardProps> = ({ product, accent = '#B4532A', onOpen }) => {
  const look = cardLook(product);
  return (
    <div
      onClick={onOpen}
      dir="rtl"
      className="group w-full overflow-hidden cursor-pointer text-right transition hover:shadow-[0_10px_24px_rgba(42,31,26,0.12)]"
      style={{ borderRadius: look.radius, border: look.border, backgroundColor: look.textBg }}
    >
      <Photo product={product} className="w-full aspect-square" hover />
      <div className="px-2 py-1.5">
        <div className="text-[11px] font-bold truncate" style={{ color: look.textColor || '#2A1F1A' }}>{product.name || 'اسم المنتج'}</div>
        <Price product={product} accent={accent} className="text-[11px]" />
      </div>
    </div>
  );
};

// Tiny chip of the running strip: round photo, name and price.
export const ProductChip: React.FC<ProductCardProps> = ({ product, accent = '#B4532A', onOpen }) => (
  <div
    onClick={onOpen}
    dir="rtl"
    className="w-full h-full flex items-center gap-2.5 pl-4 pr-1.5 bg-white rounded-full cursor-pointer shadow-sm"
  >
    <div className="h-[calc(100%-12px)] aspect-square rounded-full overflow-hidden bg-neutral-100 shrink-0">
      {product.images[0] && <img src={product.images[0]} alt={product.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
    </div>
    <div className="min-w-0 leading-tight text-right">
      <div className="text-xs font-bold text-[#2A1F1A] truncate">{product.name || 'اسم المنتج'}</div>
      <div className="text-[11px] font-black" style={{ color: accent }}>{formatPrice(product.price, product.currency)}</div>
    </div>
  </div>
);
