// Free starter template: a fixed 5-page site (Home, About, Our Work, Pricing, Contact),
// each page reachable from the shared navbar. Every element here uses only existing platform
// element/style capabilities (fixed background image, glass/transparent cards, corner-bleeding
// geometric shapes, clip-path image crops, glow/shadow, borders, one entrance animation) —
// no external or invented components. See applyFreeStarterTemplate() in App.tsx.

import type { Page, CanvasElement } from '../types';

export function getFreeStarterTemplate(): { pages: Page[]; elements: CanvasElement[] } {
  const pages: Page[] = [
  {
    "id": "page-home",
    "name": "الرئيسية",
    "slug": "/",
    "navbar": {
      "brandName": "اسم عملك",
      "brandSubtext": "",
      "items": [
        {
          "id": "nav-home",
          "label": "الرئيسية",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-home"
        },
        {
          "id": "nav-about",
          "label": "من نحن",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-about"
        },
        {
          "id": "nav-work",
          "label": "أعمالنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-work"
        },
        {
          "id": "nav-pricing",
          "label": "الأسعار",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-pricing"
        },
        {
          "id": "nav-contact",
          "label": "تواصل معنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-contact"
        }
      ],
      "ctaText": "احجز الآن",
      "ctaHref": "#",
      "ctaLinkType": "page",
      "ctaLinkTargetId": "page-contact",
      "bgColor": "#FFFFFF",
      "textColor": "#1C1B19",
      "isSticky": true
    },
    "slides": [
      {
        "id": "free-home-slide",
        "name": "المدخل",
        "height": 680,
        "backgroundColor": "#14241F",
        "backgroundImage": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=85",
        "backgroundSize": "cover",
        "backgroundPosition": "center",
        "backgroundAttachment": "fixed",
        "dividerShape": "straight"
      }
    ]
  },
  {
    "id": "page-about",
    "name": "من نحن",
    "slug": "/about",
    "navbar": {
      "brandName": "اسم عملك",
      "brandSubtext": "",
      "items": [
        {
          "id": "nav-home",
          "label": "الرئيسية",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-home"
        },
        {
          "id": "nav-about",
          "label": "من نحن",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-about"
        },
        {
          "id": "nav-work",
          "label": "أعمالنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-work"
        },
        {
          "id": "nav-pricing",
          "label": "الأسعار",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-pricing"
        },
        {
          "id": "nav-contact",
          "label": "تواصل معنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-contact"
        }
      ],
      "ctaText": "احجز الآن",
      "ctaHref": "#",
      "ctaLinkType": "page",
      "ctaLinkTargetId": "page-contact",
      "bgColor": "#FFFFFF",
      "textColor": "#1C1B19",
      "isSticky": true
    },
    "slides": [
      {
        "id": "free-about-slide",
        "name": "من نحن",
        "height": 640,
        "backgroundColor": "#FFFFFF",
        "dividerShape": "straight"
      }
    ]
  },
  {
    "id": "page-work",
    "name": "أعمالنا",
    "slug": "/work",
    "navbar": {
      "brandName": "اسم عملك",
      "brandSubtext": "",
      "items": [
        {
          "id": "nav-home",
          "label": "الرئيسية",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-home"
        },
        {
          "id": "nav-about",
          "label": "من نحن",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-about"
        },
        {
          "id": "nav-work",
          "label": "أعمالنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-work"
        },
        {
          "id": "nav-pricing",
          "label": "الأسعار",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-pricing"
        },
        {
          "id": "nav-contact",
          "label": "تواصل معنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-contact"
        }
      ],
      "ctaText": "احجز الآن",
      "ctaHref": "#",
      "ctaLinkType": "page",
      "ctaLinkTargetId": "page-contact",
      "bgColor": "#FFFFFF",
      "textColor": "#1C1B19",
      "isSticky": true
    },
    "slides": [
      {
        "id": "free-work-slide",
        "name": "أعمالنا",
        "height": 950,
        "backgroundColor": "#FAF7F2",
        "dividerShape": "straight"
      }
    ]
  },
  {
    "id": "page-pricing",
    "name": "الأسعار",
    "slug": "/pricing",
    "navbar": {
      "brandName": "اسم عملك",
      "brandSubtext": "",
      "items": [
        {
          "id": "nav-home",
          "label": "الرئيسية",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-home"
        },
        {
          "id": "nav-about",
          "label": "من نحن",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-about"
        },
        {
          "id": "nav-work",
          "label": "أعمالنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-work"
        },
        {
          "id": "nav-pricing",
          "label": "الأسعار",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-pricing"
        },
        {
          "id": "nav-contact",
          "label": "تواصل معنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-contact"
        }
      ],
      "ctaText": "احجز الآن",
      "ctaHref": "#",
      "ctaLinkType": "page",
      "ctaLinkTargetId": "page-contact",
      "bgColor": "#FFFFFF",
      "textColor": "#1C1B19",
      "isSticky": true
    },
    "slides": [
      {
        "id": "free-pricing-slide",
        "name": "الأسعار",
        "height": 640,
        "backgroundColor": "#FAF7F2",
        "dividerShape": "straight"
      }
    ]
  },
  {
    "id": "page-contact",
    "name": "تواصل معنا",
    "slug": "/contact",
    "navbar": {
      "brandName": "اسم عملك",
      "brandSubtext": "",
      "items": [
        {
          "id": "nav-home",
          "label": "الرئيسية",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-home"
        },
        {
          "id": "nav-about",
          "label": "من نحن",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-about"
        },
        {
          "id": "nav-work",
          "label": "أعمالنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-work"
        },
        {
          "id": "nav-pricing",
          "label": "الأسعار",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-pricing"
        },
        {
          "id": "nav-contact",
          "label": "تواصل معنا",
          "href": "#",
          "linkType": "page",
          "linkTargetId": "page-contact"
        }
      ],
      "ctaText": "احجز الآن",
      "ctaHref": "#",
      "ctaLinkType": "page",
      "ctaLinkTargetId": "page-contact",
      "bgColor": "#FFFFFF",
      "textColor": "#1C1B19",
      "isSticky": true
    },
    "slides": [
      {
        "id": "free-contact-slide",
        "name": "تواصل معنا",
        "height": 620,
        "backgroundColor": "#FAF7F2",
        "dividerShape": "straight"
      }
    ]
  }
];

  const elements: CanvasElement[] = [
  {
    "id": "free-home-overlay",
    "name": "shape",
    "type": "shape",
    "x": 0,
    "y": 0,
    "width": 1280,
    "height": 680,
    "content": "",
    "slideId": "free-home-slide",
    "styles": {
      "backgroundColor": "rgba(10,20,18,0.46)"
    }
  },
  {
    "id": "free-home-circle",
    "name": "shape",
    "type": "shape",
    "x": 980,
    "y": -140,
    "width": 420,
    "height": 420,
    "content": "",
    "slideId": "free-home-slide",
    "styles": {
      "backgroundColor": "rgba(255,255,255,0.07)",
      "borderColor": "rgba(255,255,255,0.22)",
      "borderWidth": 1,
      "borderRadius": 9999
    }
  },
  {
    "id": "free-home-glass",
    "name": "shape",
    "type": "shape",
    "x": 100,
    "y": 140,
    "width": 620,
    "height": 400,
    "content": "",
    "slideId": "free-home-slide",
    "styles": {
      "backgroundColor": "rgba(255,255,255,0.10)",
      "borderColor": "rgba(255,255,255,0.28)",
      "borderWidth": 1,
      "borderRadius": 32,
      "glowIntensity": 44,
      "glowColor": "rgba(0,0,0,0.38)",
      "glowPosition": "bottom"
    }
  },
  {
    "id": "free-home-logo",
    "name": "image",
    "type": "image",
    "x": 140,
    "y": 182,
    "width": 60,
    "height": 60,
    "content": "",
    "slideId": "free-home-slide",
    "styles": {
      "borderRadius": 999,
      "objectFit": "cover",
      "borderColor": "rgba(255,255,255,0.55)",
      "borderWidth": 2
    },
    "imageUrl": "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=85"
  },
  {
    "id": "free-home-heading",
    "name": "heading",
    "type": "heading",
    "x": 140,
    "y": 268,
    "width": 520,
    "height": 112,
    "content": "حيث تلتقي الجودة بالثقة",
    "slideId": "free-home-slide",
    "styles": {
      "fontSize": 42,
      "fontWeight": "bold",
      "color": "#FFFFFF",
      "fontFamily": "El Messiri",
      "textAlign": "right",
      "lineHeight": 1.2,
      "animation": "slide-up",
      "animationTrigger": "once",
      "animationDuration": 1.1
    }
  },
  {
    "id": "free-home-intro",
    "name": "paragraph",
    "type": "paragraph",
    "x": 140,
    "y": 396,
    "width": 520,
    "height": 90,
    "content": "نرحب بكم في صفحتنا الإلكترونية، صممناها لتقديم خدماتنا بأسلوب واضح يعكس احترافيتنا ويليق بثقتكم.",
    "slideId": "free-home-slide",
    "styles": {
      "fontSize": 16,
      "color": "rgba(255,255,255,0.86)",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.8
    }
  },
  {
    "id": "free-home-cta",
    "name": "button",
    "type": "button",
    "x": 140,
    "y": 502,
    "width": 200,
    "height": 52,
    "content": "تواصل معنا",
    "slideId": "free-home-slide",
    "styles": {
      "backgroundColor": "#1F5D50",
      "color": "#FFFFFF",
      "fontSize": 15,
      "fontWeight": "600",
      "borderRadius": 9999,
      "textAlign": "center",
      "glowIntensity": 26,
      "glowColor": "rgba(31,93,80,0.55)",
      "glowPosition": "bottom"
    },
    "linkType": "contact",
    "contactType": "whatsapp",
    "contactValue": "963991234567",
    "linkUrl": "https://wa.me/963991234567"
  },
  {
    "id": "free-about-block",
    "name": "shape",
    "type": "shape",
    "x": 660,
    "y": 90,
    "width": 380,
    "height": 400,
    "content": "",
    "slideId": "free-about-slide",
    "styles": {
      "backgroundColor": "rgba(31,93,80,0.08)",
      "borderRadius": 24
    }
  },
  {
    "id": "free-about-image",
    "name": "image",
    "type": "image",
    "x": 700,
    "y": 120,
    "width": 320,
    "height": 380,
    "content": "",
    "slideId": "free-about-slide",
    "styles": {
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=85",
    "clipPath": "clip-shape-arch-classic"
  },
  {
    "id": "free-about-heading",
    "name": "heading",
    "type": "heading",
    "x": 140,
    "y": 120,
    "width": 420,
    "height": 70,
    "content": "من نحن",
    "slideId": "free-about-slide",
    "styles": {
      "fontSize": 34,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "right"
    }
  },
  {
    "id": "free-about-text",
    "name": "paragraph",
    "type": "paragraph",
    "x": 140,
    "y": 210,
    "width": 440,
    "height": 340,
    "content": "نحن فريق شغوف يؤمن بأن كل تفصيل صغير يصنع فرقًا كبيرًا في تجربة العميل. تأسس عملنا على الرغبة في تقديم خدمة تجمع بين الجودة والصدق في التعامل، ونحرص في كل مرة على أن نترك أثرًا إيجابيًا يستحق الثقة. نستمع لاحتياجات كل عميل على حدة، ونعمل على تحويلها إلى نتائج ملموسة تلبي تطلعاته.",
    "slideId": "free-about-slide",
    "styles": {
      "fontSize": 15.5,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.9
    }
  },
  {
    "id": "free-work-accent",
    "name": "shape",
    "type": "shape",
    "x": -110,
    "y": 760,
    "width": 300,
    "height": 300,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "backgroundColor": "rgba(31,93,80,0.08)",
      "borderRadius": 40
    },
    "rotation": 20
  },
  {
    "id": "free-work-header",
    "name": "heading",
    "type": "heading",
    "x": 140,
    "y": 50,
    "width": 400,
    "height": 56,
    "content": "أعمالنا",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "right"
    }
  },
  {
    "id": "free-work-sub",
    "name": "paragraph",
    "type": "paragraph",
    "x": 140,
    "y": 108,
    "width": 500,
    "height": 40,
    "content": "نماذج من أعمال أنجزناها بعناية لعملائنا.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 15,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right"
    }
  },
  {
    "id": "free-work-card-1",
    "name": "shape",
    "type": "shape",
    "x": 140,
    "y": 180,
    "width": 1000,
    "height": 130,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "backgroundColor": "rgba(31,93,80,0.05)",
      "borderRadius": 28,
      "borderColor": "rgba(0,0,0,0.05)",
      "borderWidth": 1
    }
  },
  {
    "id": "free-work-img-1",
    "name": "image",
    "type": "image",
    "x": 140,
    "y": 195,
    "width": 240,
    "height": 100,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 22,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&q=85"
  },
  {
    "id": "free-work-cap-1",
    "name": "paragraph",
    "type": "paragraph",
    "x": 500,
    "y": 195,
    "width": 330,
    "height": 100,
    "content": "مشروع أنجز بعناية فائقة لتلبية احتياجات العميل.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 14.5,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.7
    }
  },
  {
    "id": "free-work-card-2",
    "name": "shape",
    "type": "shape",
    "x": 140,
    "y": 330,
    "width": 1000,
    "height": 130,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "backgroundColor": "rgba(196,154,88,0.07)",
      "borderRadius": 20,
      "borderColor": "rgba(0,0,0,0.05)",
      "borderWidth": 1
    }
  },
  {
    "id": "free-work-img-2",
    "name": "image",
    "type": "image",
    "x": 870,
    "y": 345,
    "width": 240,
    "height": 100,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 14,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=700&q=85"
  },
  {
    "id": "free-work-cap-2",
    "name": "paragraph",
    "type": "paragraph",
    "x": 140,
    "y": 345,
    "width": 330,
    "height": 100,
    "content": "نتيجة نهائية تعكس شغفنا بالتفاصيل الدقيقة.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 14.5,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.7
    }
  },
  {
    "id": "free-work-card-3",
    "name": "shape",
    "type": "shape",
    "x": 140,
    "y": 480,
    "width": 1000,
    "height": 130,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "backgroundColor": "rgba(31,93,80,0.05)",
      "borderRadius": 28,
      "borderColor": "rgba(0,0,0,0.05)",
      "borderWidth": 1
    }
  },
  {
    "id": "free-work-img-3",
    "name": "image",
    "type": "image",
    "x": 140,
    "y": 495,
    "width": 240,
    "height": 100,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 22,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=700&q=85"
  },
  {
    "id": "free-work-cap-3",
    "name": "paragraph",
    "type": "paragraph",
    "x": 500,
    "y": 495,
    "width": 330,
    "height": 100,
    "content": "تجربة ناجحة حقّقت رضا عميلنا الكامل.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 14.5,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.7
    }
  },
  {
    "id": "free-work-card-4",
    "name": "shape",
    "type": "shape",
    "x": 140,
    "y": 630,
    "width": 1000,
    "height": 130,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "backgroundColor": "rgba(196,154,88,0.07)",
      "borderRadius": 20,
      "borderColor": "rgba(0,0,0,0.05)",
      "borderWidth": 1
    }
  },
  {
    "id": "free-work-img-4",
    "name": "image",
    "type": "image",
    "x": 870,
    "y": 645,
    "width": 240,
    "height": 100,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 14,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=700&q=85"
  },
  {
    "id": "free-work-cap-4",
    "name": "paragraph",
    "type": "paragraph",
    "x": 140,
    "y": 645,
    "width": 330,
    "height": 100,
    "content": "حل مخصص صُمم خصيصًا ليلائم طبيعة العمل.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 14.5,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.7
    }
  },
  {
    "id": "free-work-card-5",
    "name": "shape",
    "type": "shape",
    "x": 140,
    "y": 780,
    "width": 1000,
    "height": 130,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "backgroundColor": "rgba(31,93,80,0.05)",
      "borderRadius": 28,
      "borderColor": "rgba(0,0,0,0.05)",
      "borderWidth": 1
    }
  },
  {
    "id": "free-work-img-5",
    "name": "image",
    "type": "image",
    "x": 140,
    "y": 795,
    "width": 240,
    "height": 100,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 22,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=85"
  },
  {
    "id": "free-work-cap-5",
    "name": "paragraph",
    "type": "paragraph",
    "x": 500,
    "y": 795,
    "width": 330,
    "height": 100,
    "content": "لحظة من رحلة عمل نفخر بها ونعتز بنتائجها.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 14.5,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.7
    }
  },
  {
    "id": "free-pricing-bg-circle",
    "name": "shape",
    "type": "shape",
    "x": 450,
    "y": 160,
    "width": 380,
    "height": 380,
    "content": "",
    "slideId": "free-pricing-slide",
    "styles": {
      "backgroundColor": "rgba(31,93,80,0.08)",
      "borderRadius": 9999
    }
  },
  {
    "id": "free-pricing-header",
    "name": "heading",
    "type": "heading",
    "x": 0,
    "y": 60,
    "width": 1280,
    "height": 50,
    "content": "باقات الأسعار",
    "slideId": "free-pricing-slide",
    "styles": {
      "fontSize": 30,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "center"
    }
  },
  {
    "id": "free-pricing-sub",
    "name": "paragraph",
    "type": "paragraph",
    "x": 0,
    "y": 112,
    "width": 1280,
    "height": 34,
    "content": "اختر الباقة التي تناسب احتياجاتك",
    "slideId": "free-pricing-slide",
    "styles": {
      "fontSize": 15,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "center"
    }
  },
  {
    "id": "free-pricing-tier-1",
    "name": "pricing",
    "type": "pricing",
    "x": 140,
    "y": 190,
    "width": 320,
    "height": 380,
    "content": "تبدأ رحلتك معنا بخطوات واثقة.",
    "slideId": "free-pricing-slide",
    "styles": {
      "borderColor": "rgba(0,0,0,0.08)",
      "borderWidth": 1,
      "borderRadius": 24,
      "backgroundColor": "#FFFFFF"
    },
    "pricingPlan": "الأساسية",
    "pricingPrice": "199 ر.س",
    "pricingPeriod": "شهريًا",
    "pricingFeatures": [
      "استشارة أولى مجانية",
      "دعم عبر البريد الإلكتروني",
      "تسليم خلال 5 أيام"
    ],
    "pricingCtaText": "ابدأ الآن"
  },
  {
    "id": "free-pricing-tier-2",
    "name": "pricing",
    "type": "pricing",
    "x": 480,
    "y": 160,
    "width": 320,
    "height": 410,
    "content": "الخيار الأنسب لمعظم عملائنا.",
    "slideId": "free-pricing-slide",
    "styles": {
      "borderColor": "#1F5D50",
      "borderWidth": 2,
      "borderRadius": 24,
      "backgroundColor": "#FFFFFF",
      "glowIntensity": 36,
      "glowColor": "rgba(31,93,80,0.30)",
      "glowPosition": "bottom",
      "color": "#1F5D50"
    },
    "pricingPlan": "المتقدمة",
    "pricingPrice": "399 ر.س",
    "pricingPeriod": "شهريًا",
    "pricingFeatures": [
      "كل مزايا الباقة الأساسية",
      "دعم أولوية عبر واتساب",
      "تسليم خلال 48 ساعة",
      "مراجعتان مجانيتان"
    ],
    "pricingFeatured": true,
    "pricingCtaText": "اشترك الآن"
  },
  {
    "id": "free-pricing-tier-3",
    "name": "pricing",
    "type": "pricing",
    "x": 820,
    "y": 190,
    "width": 320,
    "height": 380,
    "content": "تغطية شاملة للأعمال الكبيرة.",
    "slideId": "free-pricing-slide",
    "styles": {
      "borderColor": "rgba(0,0,0,0.08)",
      "borderWidth": 1,
      "borderRadius": 24,
      "backgroundColor": "#FFFFFF"
    },
    "pricingPlan": "الاحترافية",
    "pricingPrice": "699 ر.س",
    "pricingPeriod": "شهريًا",
    "pricingFeatures": [
      "كل مزايا الباقة المتقدمة",
      "مدير حساب مخصص",
      "تقارير أداء أسبوعية"
    ],
    "pricingCtaText": "تواصل معنا"
  },
  {
    "id": "free-contact-corner",
    "name": "shape",
    "type": "shape",
    "x": -90,
    "y": 360,
    "width": 320,
    "height": 320,
    "content": "",
    "slideId": "free-contact-slide",
    "styles": {
      "backgroundColor": "rgba(31,93,80,0.08)",
      "borderRadius": 9999
    }
  },
  {
    "id": "free-contact-heading",
    "name": "heading",
    "type": "heading",
    "x": 140,
    "y": 56,
    "width": 420,
    "height": 60,
    "content": "تواصل معنا",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "right"
    }
  },
  {
    "id": "free-contact-map",
    "name": "map",
    "type": "map",
    "x": 140,
    "y": 140,
    "width": 500,
    "height": 420,
    "content": "دمشق، سوريا",
    "slideId": "free-contact-slide",
    "styles": {
      "borderRadius": 24
    },
    "mapLocation": "دمشق، سوريا"
  },
  {
    "id": "free-contact-card",
    "name": "shape",
    "type": "shape",
    "x": 700,
    "y": 140,
    "width": 440,
    "height": 420,
    "content": "",
    "slideId": "free-contact-slide",
    "styles": {
      "backgroundColor": "#FFFFFF",
      "borderColor": "rgba(0,0,0,0.06)",
      "borderWidth": 1,
      "borderRadius": 28,
      "glowIntensity": 28,
      "glowColor": "rgba(0,0,0,0.10)",
      "glowPosition": "bottom"
    }
  },
  {
    "id": "free-contact-icon-phone",
    "name": "icon",
    "type": "icon",
    "x": 1070,
    "y": 180,
    "width": 32,
    "height": 32,
    "content": "iconify:mdi:phone",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#1F5D50"
    }
  },
  {
    "id": "free-contact-text-phone",
    "name": "paragraph",
    "type": "paragraph",
    "x": 740,
    "y": 180,
    "width": 310,
    "height": 32,
    "content": "+963 991 234 567",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right"
    },
    "linkType": "contact",
    "contactType": "phone",
    "contactValue": "+963 991 234 567",
    "linkUrl": "tel:+963991234567"
  },
  {
    "id": "free-contact-icon-whatsapp",
    "name": "icon",
    "type": "icon",
    "x": 1070,
    "y": 244,
    "width": 32,
    "height": 32,
    "content": "iconify:mdi:whatsapp",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#1F5D50"
    }
  },
  {
    "id": "free-contact-text-whatsapp",
    "name": "paragraph",
    "type": "paragraph",
    "x": 740,
    "y": 244,
    "width": 310,
    "height": 32,
    "content": "تواصل عبر واتساب",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right"
    },
    "linkType": "contact",
    "contactType": "whatsapp",
    "contactValue": "تواصل عبر واتساب",
    "linkUrl": "https://wa.me/963991234567"
  },
  {
    "id": "free-contact-icon-email",
    "name": "icon",
    "type": "icon",
    "x": 1070,
    "y": 308,
    "width": 32,
    "height": 32,
    "content": "iconify:mdi:email-outline",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#1F5D50"
    }
  },
  {
    "id": "free-contact-text-email",
    "name": "paragraph",
    "type": "paragraph",
    "x": 740,
    "y": 308,
    "width": 310,
    "height": 32,
    "content": "info@example.com",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right"
    },
    "linkType": "contact",
    "contactType": "email",
    "contactValue": "info@example.com",
    "linkUrl": "mailto:info@example.com"
  },
  {
    "id": "free-contact-icon-address",
    "name": "icon",
    "type": "icon",
    "x": 1070,
    "y": 372,
    "width": 32,
    "height": 32,
    "content": "iconify:mdi:map-marker-outline",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#1F5D50"
    }
  },
  {
    "id": "free-contact-text-address",
    "name": "paragraph",
    "type": "paragraph",
    "x": 740,
    "y": 372,
    "width": 310,
    "height": 32,
    "content": "دمشق، سوريا",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right"
    }
  },
  {
    "id": "free-contact-social-fb",
    "name": "icon",
    "type": "icon",
    "x": 1070,
    "y": 446,
    "width": 30,
    "height": 30,
    "content": "iconify:simple-icons:facebook",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#1877F2"
    },
    "linkType": "contact",
    "contactType": "facebook",
    "contactValue": "yourpage",
    "linkUrl": "https://facebook.com/yourpage"
  },
  {
    "id": "free-contact-social-ig",
    "name": "icon",
    "type": "icon",
    "x": 1020,
    "y": 446,
    "width": 30,
    "height": 30,
    "content": "iconify:simple-icons:instagram",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#E1306C"
    },
    "linkType": "contact",
    "contactType": "instagram",
    "contactValue": "yourpage",
    "linkUrl": "https://instagram.com/yourpage"
  },
  {
    "id": "free-contact-social-tt",
    "name": "icon",
    "type": "icon",
    "x": 970,
    "y": 446,
    "width": 30,
    "height": 30,
    "content": "iconify:simple-icons:tiktok",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#000000"
    },
    "linkType": "contact",
    "contactType": "tiktok",
    "contactValue": "yourpage",
    "linkUrl": "https://tiktok.com/@yourpage"
  }
];

  return { pages, elements };
}
