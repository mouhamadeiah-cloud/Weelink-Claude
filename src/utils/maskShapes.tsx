import React from 'react';

export interface MaskShape {
  id: string;
  name: string;
  svg: (color: string) => React.ReactNode;
}

export const MASK_SHAPES: MaskShape[] = [
  {
    id: 'circle',
    name: 'تفريغ دائري ناعم ⚪',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'arch',
    name: 'قوس معماري ملكي 🏛️',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 15,85 V 50 A 35,35 0 0,1 85,50 V 85 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'capsule',
    name: 'كبسولة مائلة ريادية 💊',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 15,35 A 20,20 0 0,1 85,35 V 65 A 20,20 0 0,1 15,65 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'hexagon',
    name: 'مسدس هندسي مفرغ ⎔',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,12 L 85,31 V 69 L 50,88 L 15,69 V 31 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'blob1',
    name: 'بقعة عضوية سائلة 💦',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,15 C 75,12 88,35 85,55 C 82,75 68,85 45,85 C 22,85 12,68 15,48 C 18,28 25,18 50,15 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'blob2',
    name: 'أمواج مائية تموجية 🌊',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 52,15 C 68,10 82,22 88,42 C 94,62 72,82 50,88 C 28,94 10,72 12,50 C 14,28 36,20 52,15 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'blob3',
    name: 'بقعة الحصاة الملساء 🪨',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 48,15 C 68,14 85,28 85,48 C 85,68 62,88 42,85 C 22,82 15,62 18,42 C 21,22 28,16 48,15 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'polaroid',
    name: 'إطار بولارويد كلاسيكي 📸',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 15,12 H 85 V 72 H 15 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'ticket',
    name: 'بطاقة سينما مثقوبة 🎫',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 15,15 H 85 V 38 A 12,12 0 0,0 85,62 V 85 H 15 V 62 A 12,12 0 0,0 15,38 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'star4',
    name: 'نجمة متوهجة رباعية ✨',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,15 Q 50,50 85,50 Q 50,50 50,85 Q 50,50 15,50 Q 50,50 50,15 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'keyhole',
    name: 'ثقب الباب الفخم 🔑',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,18 A 20,20 0 0,1 68,34 L 75,82 H 25 L 32,34 A 20,20 0 0,1 50,18 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'camera',
    name: 'عدسة فوتوغرافية دائرية 📷',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,50 m -28,0 a 28,28 0 1,1 56,0 a 28,28 0 1,1 -56,0 M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'heart',
    name: 'قلب رومانسي حنون ❤️',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,28 C 50,25 43,15 28,15 C 13,15 13,28 13,32 C 13,50 32,70 50,85 C 68,70 87,50 87,32 C 87,28 87,15 72,15 C 57,15 50,25 50,28 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'octagon',
    name: 'مثمن هندسي ملكي 🛑',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 35,15 H 65 L 85,35 V 65 L 65,85 H 35 L 15,65 V 35 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'rhombus',
    name: 'مَعين هندسي مائل 💎',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 50,15 L 85,50 L 50,85 L 15,50 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'leaves',
    name: 'ورقة شجر جمالية 🍃',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 15,15 C 50,15 85,50 85,85 C 50,85 15,50 15,15 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'cloud',
    name: 'سحابة كرتونية لطيفة ☁️',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 25,60 A 15,15 0 0,1 40,45 A 20,20 0 0,1 75,50 A 15,15 0 0,1 75,75 H 25 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'banner',
    name: 'شريط عرض أفقي 🎀',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 12,25 H 88 V 75 H 12 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'diagonal-slash',
    name: 'قص مائل ديناميكي ⚡',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 15,85 L 85,15 H 55 L 15,55 Z" fill={color} fillRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'window-arch',
    name: 'نافذة مقوسة مزدوجة 🪟',
    svg: (color: string) => (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block', pointerEvents: 'none' }}>
        <path d="M 0,0 H 100 V 100 H 0 Z M 20,85 V 45 A 15,15 0 0,1 50,45 V 85 M 50,85 V 45 A 15,15 0 0,1 80,45 V 85" fill={color} fillRule="evenodd" />
      </svg>
    )
  }
];
