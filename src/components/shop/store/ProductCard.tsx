// How a product looks on the store page: main image, badge, name, short description, price and
// an add-to-cart button. Also used as the live preview in the admin's product editor.
import React, { useState } from 'react';
import { ImageOff, ShoppingBag, Check } from 'lucide-react';
import { ShopProduct } from '../shopTypes';
import { badgeText, totalStock } from '../productModel';
import { addToCart, formatPrice } from '../../../utils/cartStore';

interface ProductCardProps {
  product: ShopProduct;
  accent?: string;
  onOpen?: () => void; // set on the store page; the editor preview leaves it out
}

// A product the customer must pick options for (size, colour…) is added from its full card.
export const needsChoice = (p: ShopProduct) =>
  p.options.some((o) => o.values.length > 1 || (o.affectsStock && o.values.length > 0));

export const ProductCard: React.FC<ProductCardProps> = ({ product, accent = '#B4532A', onOpen }) => {
  const [added, setAdded] = useState(false);
  const badge = badgeText(product);
  const soldOut = totalStock(product) <= 0;

  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onOpen || soldOut) return;
    if (needsChoice(product)) {
      onOpen();
      return;
    }
    addToCart({ name: product.name, price: product.price, currency: product.currency, image: product.images[0] });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

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
        {badge && (
          <span
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow"
            style={{ backgroundColor: soldOut ? '#6e6e73' : product.badge === 'discount' ? '#ff3b30' : '#2A1F1A' }}
          >
            {badge}
          </span>
        )}
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
          {added ? <><Check size={16} /> تمت الإضافة</> : <><ShoppingBag size={16} /> {soldOut ? 'نفد من المخزون' : 'أضف إلى السلة'}</>}
        </button>
      </div>
    </div>
  );
};
