// How a product looks on the store page: main image, badge, name, short description, price and
// an add-to-cart button, as a grid card or as a full-width slide. Also used as the live preview in
// the admin's product editor.
import React, { useState } from 'react';
import { ImageOff, ShoppingBag, Check } from 'lucide-react';
import { ShopProduct } from '../shopTypes';
import { badgeColor, badgeText, defaultChoice, isSoldOut, unitPriceFor } from '../productModel';
import { addToCart, formatPrice } from '../../../utils/cartStore';

interface ProductCardProps {
  product: ShopProduct;
  accent?: string;
  onOpen?: () => void; // set on the store page; the editor preview leaves it out
  onAdded?: (name: string) => void;
}

// A product the customer must pick options for (size, colour…) is added from its full card.
export const needsChoice = (p: ShopProduct) =>
  p.options.some((o) => o.values.length > 1 || (o.affectsStock && o.values.length > 0));

// The add-to-cart button: adds straight to the cart and the customer stays in the store. A product
// with options (size, colour…) goes in with its first available choice, shown in the cart line;
// the floating card is where the customer picks another one.
const useAddButton = (product: ShopProduct, onOpen?: () => void, onAdded?: (name: string) => void) => {
  const [added, setAdded] = useState(false);
  const soldOut = isSoldOut(product);
  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onOpen || soldOut) return;
    const choice = needsChoice(product) ? defaultChoice(product) : null;
    if (needsChoice(product) && !choice) {
      onOpen();
      return;
    }
    const name = choice?.label ? `${product.name} (${choice.label})` : product.name;
    addToCart({ name, price: unitPriceFor(product, 1, choice?.variant), currency: product.currency, image: product.images[0], productId: product.id });
    onAdded?.(name);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };
  return { added, soldOut, add };
};

const AddLabel: React.FC<{ added: boolean; soldOut: boolean }> = ({ added, soldOut }) =>
  added ? <><Check size={16} /> تمت الإضافة</> : <><ShoppingBag size={16} /> {soldOut ? 'نفد من المخزون' : 'أضف إلى السلة'}</>;

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

// شريحة: the main image fills the row as a fixed background; name, price and the button sit in a
// narrow strip along its bottom.
export const ProductSlide: React.FC<ProductCardProps> = ({ product, accent = '#B4532A', onOpen, onAdded }) => {
  const { added, soldOut, add } = useAddButton(product, onOpen, onAdded);
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
        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          className="shrink-0 h-9 px-4 rounded-full text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: accent }}
        >
          <AddLabel added={added} soldOut={soldOut} />
        </button>
      </div>
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, accent = '#B4532A', onOpen, onAdded }) => {
  const { added, soldOut, add } = useAddButton(product, onOpen, onAdded);

  return (
    <div
      onClick={onOpen}
      dir="rtl"
      className={`group w-full text-right bg-white rounded-3xl border border-black/[0.06] overflow-hidden flex flex-col transition ${
        onOpen ? 'cursor-pointer hover:shadow-[0_16px_40px_rgba(42,31,26,0.14)] hover:-translate-y-0.5' : ''
      }`}
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
          <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImageOff size={32} /></div>
        )}
        <Badge product={product} />
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="text-[15px] font-bold text-[#2A1F1A] leading-snug line-clamp-2">{product.name || 'اسم المنتج'}</div>
        {product.showShortDescription && product.shortDescription && (
          <div className="text-xs text-[#8A7B70] leading-relaxed line-clamp-2">{product.shortDescription}</div>
        )}
        <div className="mt-auto pt-1 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-black" style={{ color: accent }}>{formatPrice(product.price, product.currency)}</span>
          {product.oldPrice > product.price && (
            <span className="text-xs text-[#8A7B70] line-through">{formatPrice(product.oldPrice, product.currency)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          className="mt-2 w-full h-10 rounded-full text-white text-sm font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{ backgroundColor: accent }}
        >
          <AddLabel added={added} soldOut={soldOut} />
        </button>
      </div>
    </div>
  );
};
