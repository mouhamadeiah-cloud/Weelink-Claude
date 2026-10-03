// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { ChevronDown, ChevronUp, Copy, Trash2, Lock, Unlock, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { ElementType } from '../../../types';
import { RightDrawerProps } from '../types';

interface LayersSectionProps {
  elements: RightDrawerProps['elements'];
  activeSlideId: RightDrawerProps['activeSlideId'];
  selectedElement: RightDrawerProps['selectedElement'];
  onSelectElement: RightDrawerProps['onSelectElement'];
  onDeleteElement: RightDrawerProps['onDeleteElement'];
  onDuplicateElement: RightDrawerProps['onDuplicateElement'];
  onToggleLock: RightDrawerProps['onToggleLock'];
  onMoveLayerUp: RightDrawerProps['onMoveLayerUp'];
  onMoveLayerDown: RightDrawerProps['onMoveLayerDown'];
  onMoveLayerToFront: RightDrawerProps['onMoveLayerToFront'];
  onMoveLayerToBack: RightDrawerProps['onMoveLayerToBack'];
  getElementIcon: (type: ElementType) => React.ReactNode;
}

export const LayersSection = ({
  elements,
  activeSlideId,
  selectedElement,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onToggleLock,
  onMoveLayerUp,
  onMoveLayerDown,
  onMoveLayerToFront,
  onMoveLayerToBack,
  getElementIcon,
}: LayersSectionProps) => {
  const slideElements = elements.filter(el => el.slideId === activeSlideId);
  // Render topmost layers first (which are at the end of the slideElements array)
  const layersList = [...slideElements].reverse();

  return (
    <div className="space-y-4 text-right" dir="rtl">
                  
      {/* أزرار التحكم بالترتيب الفوري للطبقات */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-neutral-800 block">
          خيارات ترتيب الطبقة للعنصر المحدد:
        </span>
                    
        {selectedElement ? (
          <div className="grid grid-cols-4 gap-2 bg-neutral-50 p-2 rounded-2xl border border-neutral-300">
            {/* 1. أسفل الجميع (Send to absolute bottom) */}
            <button
              onClick={onMoveLayerToBack}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
              title="أسفل الجميع (إرسال للقاع)"
            >
              <span className="text-neutral-500 hover:text-black">
                <ArrowDownToLine size={18} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-bold">أسفل</span>
            </button>

            {/* 2. طبقة للأسفل (Send backward) */}
            <button
              onClick={onMoveLayerDown}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
              title="طبقة للأسفل (تراجع خطوة)"
            >
              <span className="text-neutral-500 hover:text-black">
                <ChevronDown size={18} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-bold">لأسفل</span>
            </button>

            {/* 3. طبقة للأعلى (Bring forward) */}
            <button
              onClick={onMoveLayerUp}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
              title="طبقة للأعلى (تقدم خطوة)"
            >
              <span className="text-neutral-500 hover:text-black">
                <ChevronUp size={18} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-bold">للأعلى</span>
            </button>

            {/* 4. أعلى الجميع (Bring to absolute top) */}
            <button
              onClick={onMoveLayerToFront}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-black transition-all cursor-pointer shadow-3xs active:scale-95"
              title="أعلى الجميع (إحضار للمقدمة)"
            >
              <span className="text-neutral-500 hover:text-black">
                <ArrowUpToLine size={18} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-bold">أعلى</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-neutral-50 rounded-xl text-center text-xs text-neutral-400 border border-neutral-200">
            يرجى تحديد عنصر في الساحة لعرض وإجراء خيارات الترتيب.
          </div>
        )}
      </div>

      {/* قائمة بجميع الطبقات في هذه الشريحة */}
      <div className="space-y-2.5 pt-2 border-t border-neutral-100">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-neutral-800">طبقات الشريحة الحالية:</span>
          <span className="text-[10px] text-neutral-400 font-mono">({layersList.length} عناصر)</span>
        </div>

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
          {layersList.map((el, i) => {
            const isSelected = selectedElement?.id === el.id;
            const isLocked = !!el.isLocked;

            return (
              <div
                key={el.id}
                className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs ring-1 ring-[#0071e3]/30'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300'
                }`}
                onClick={() => onSelectElement(el.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  {/* رقم الترتيب / الطبقة بصريًا */}
                  <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-100 w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                    {layersList.length - i}
                  </span>
                  {/* أيقونة العنصر */}
                  <span className="shrink-0">
                    {getElementIcon(el.type)}
                  </span>
                  {/* اسم العنصر */}
                  <span className={`text-xs truncate ${isSelected ? 'font-bold text-[#0071e3]' : 'text-neutral-700 font-medium'}`}>
                    {el.name}
                  </span>
                </div>

                {/* الإجراءات السريعة على الطبقة */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* زر القفل السريع */}
                  <button
                    onClick={() => {
                      onSelectElement(el.id);
                      onToggleLock();
                    }}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isLocked 
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                        : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                    }`}
                    title={isLocked ? "إلغاء قفل العنصر" : "قفل العنصر"}
                  >
                    {isLocked ? <Lock size={11} strokeWidth={2.4} /> : <Unlock size={11} />}
                  </button>

                  {/* زر التكرار السريع */}
                  <button
                    onClick={() => onDuplicateElement(el.id)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
                    title="تكرار هذه الطبقة"
                  >
                    <Copy size={11} />
                  </button>

                  {/* زر الحذف السريع */}
                  <button
                    onClick={() => onDeleteElement(el.id)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="حذف الطبقة"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}

          {layersList.length === 0 && (
            <div className="text-center py-6 text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              لا توجد عناصر في هذه الشريحة حالياً. أضف عناصر جديدة من القائمة لتبدأ!
            </div>
          )}
        </div>
      </div>

      {/* نص توضيحي مفيد */}
      <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] text-neutral-500 leading-tight">
        💡 <b>معلومة مفيدة:</b> الطبقات مرتبة من الأعلى للأسفل كبرامج التصميم الاحترافية. لتعديل عنصر مغطى بالكامل خلف عناصر أخرى، حدده مباشرة من هذه القائمة وسيتم تنشيطه على الفور في ساحة العمل.
      </div>

    </div>
  );
};
