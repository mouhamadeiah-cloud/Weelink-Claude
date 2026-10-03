// How a product looks on the store page: main image, badge, name, short description and price.
// Also used as the live preview in the admin's product editor.
import React from 'react';
import { ImageOff } from 'lucide-react';
import { ShopProduct } from '../shopTypes';
import { badgeText, totalStock } from '../productModel';
import { formatPrice } from '../../../utils/cartStore';

interface ProductCardProps {
  product: ShopProduct;
  accent?: string;
  onOpen?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, accent = '#B4532A', onOpen }) => {
  const badge = badgeText(product);
  const soldOut = totalStock(product) <= 0;
  const Tag = onOpen ? 'button' : 'div';
  return (
    <Tag
      type={onOpen ? 'button' : undefined}
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
      </div>
    </Tag>
  );
};
