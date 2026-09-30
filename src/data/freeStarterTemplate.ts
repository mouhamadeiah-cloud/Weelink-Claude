// Free starter template: a fixed 5-page site (Home, About, Our Work, Pricing, Contact),
// each page reachable from the shared navbar. This is the platform's ready-made
// free-tier template — every element here uses only existing platform element types
// (heading, paragraph, image, icon, shape, button, pricing, map), no external/invented components.
// Generated data — see applyFreeStarterTemplate() in App.tsx for how it is applied.

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
        "backgroundColor": "#FAF7F2",
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
    "id": "free-home-el-1",
    "name": "shape",
    "type": "shape",
    "x": 680,
    "y": 0,
    "width": 600,
    "height": 680,
    "content": "",
    "slideId": "free-home-slide",
    "styles": {
      "backgroundColor": "rgba(250,247,242,0.93)"
    }
  },
  {
    "id": "free-home-el-2",
    "name": "image",
    "type": "image",
    "x": 740,
    "y": 90,
    "width": 64,
    "height": 64,
    "content": "",
    "slideId": "free-home-slide",
    "styles": {
      "borderRadius": 999,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=400&q=85"
  },
  {
    "id": "free-home-el-3",
    "name": "heading",
    "type": "heading",
    "x": 740,
    "y": 176,
    "width": 480,
    "height": 120,
    "content": "حيث تلتقي الجودة بالثقة",
    "slideId": "free-home-slide",
    "styles": {
      "fontSize": 40,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "right",
      "lineHeight": 1.25
    }
  },
  {
    "id": "free-home-el-4",
    "name": "shape",
    "type": "shape",
    "x": 1200,
    "y": 176,
    "width": 4,
    "height": 110,
    "content": "",
    "slideId": "free-home-slide",
    "styles": {
      "backgroundColor": "#1F5D50",
      "borderRadius": 2
    }
  },
  {
    "id": "free-home-el-5",
    "name": "paragraph",
    "type": "paragraph",
    "x": 740,
    "y": 306,
    "width": 460,
    "height": 100,
    "content": "نرحب بكم في صفحتنا الإلكترونية، صممناها لتقديم خدماتنا بأسلوب واضح يعكس احترافيتنا ويليق بثقتكم.",
    "slideId": "free-home-slide",
    "styles": {
      "fontSize": 16,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.8
    }
  },
  {
    "id": "free-home-el-6",
    "name": "button",
    "type": "button",
    "x": 740,
    "y": 430,
    "width": 200,
    "height": 50,
    "content": "تواصل معنا",
    "slideId": "free-home-slide",
    "styles": {
      "backgroundColor": "#1F5D50",
      "color": "#FFFFFF",
      "fontSize": 15,
      "fontWeight": "600",
      "borderRadius": 9999,
      "textAlign": "center"
    },
    "linkType": "page",
    "linkTargetId": "page-contact",
    "linkUrl": "#page-page-contact"
  },
  {
    "id": "free-about-el-1",
    "name": "image",
    "type": "image",
    "x": 100,
    "y": 80,
    "width": 480,
    "height": 460,
    "content": "",
    "slideId": "free-about-slide",
    "styles": {
      "borderRadius": 12,
      "borderColor": "#E6E1D6",
      "borderWidth": 1,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=85"
  },
  {
    "id": "free-about-el-2",
    "name": "heading",
    "type": "heading",
    "x": 620,
    "y": 80,
    "width": 400,
    "height": 50,
    "content": "من نحن",
    "slideId": "free-about-slide",
    "styles": {
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "right",
      "lineHeight": 1.25
    }
  },
  {
    "id": "free-about-el-3",
    "name": "shape",
    "type": "shape",
    "x": 1020,
    "y": 84,
    "width": 4,
    "height": 42,
    "content": "",
    "slideId": "free-about-slide",
    "styles": {
      "backgroundColor": "#1F5D50",
      "borderRadius": 2
    }
  },
  {
    "id": "free-about-el-4",
    "name": "paragraph",
    "type": "paragraph",
    "x": 620,
    "y": 160,
    "width": 560,
    "height": 320,
    "content": "نحن فريق شغوف يؤمن بأن كل تفصيل صغير يصنع فرقًا كبيرًا في تجربة العميل. تأسس عملنا على الرغبة في تقديم خدمة تجمع بين الجودة والصدق في التعامل، ونحرص في كل مرة على أن نترك أثرًا إيجابيًا يستحق الثقة. نستمع لاحتياجات كل عميل على حدة، ونعمل على تحويلها إلى نتائج ملموسة تلبي تطلعاته.",
    "slideId": "free-about-slide",
    "styles": {
      "fontSize": 16,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 2
    }
  },
  {
    "id": "free-work-el-header",
    "name": "heading",
    "type": "heading",
    "x": 780,
    "y": 70,
    "width": 400,
    "height": 50,
    "content": "أعمالنا",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "right",
      "lineHeight": 1.25
    }
  },
  {
    "id": "free-work-el-sub",
    "name": "paragraph",
    "type": "paragraph",
    "x": 780,
    "y": 122,
    "width": 400,
    "height": 40,
    "content": "نماذج من أعمال أنجزناها بعناية لعملائنا",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 15,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.5
    }
  },
  {
    "id": "free-work-img-1",
    "name": "image",
    "type": "image",
    "x": 100,
    "y": 220,
    "width": 340,
    "height": 240,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 10,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&q=80"
  },
  {
    "id": "free-work-cap-1",
    "name": "paragraph",
    "type": "paragraph",
    "x": 100,
    "y": 470,
    "width": 340,
    "height": 70,
    "content": "مشروع أنجز بعناية فائقة لتلبية احتياجات عميل يبحث عن التميز.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 13.5,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.6
    }
  },
  {
    "id": "free-work-img-2",
    "name": "image",
    "type": "image",
    "x": 470,
    "y": 220,
    "width": 340,
    "height": 240,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 10,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=700&q=80"
  },
  {
    "id": "free-work-cap-2",
    "name": "paragraph",
    "type": "paragraph",
    "x": 470,
    "y": 470,
    "width": 340,
    "height": 70,
    "content": "نتيجة نهائية تعكس شغفنا بالتفاصيل الدقيقة.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 13.5,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.6
    }
  },
  {
    "id": "free-work-img-3",
    "name": "image",
    "type": "image",
    "x": 840,
    "y": 220,
    "width": 340,
    "height": 240,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 10,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=700&q=80"
  },
  {
    "id": "free-work-cap-3",
    "name": "paragraph",
    "type": "paragraph",
    "x": 840,
    "y": 470,
    "width": 340,
    "height": 70,
    "content": "تجربة ناجحة حقّقت رضا عميلنا الكامل.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 13.5,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.6
    }
  },
  {
    "id": "free-work-img-4",
    "name": "image",
    "type": "image",
    "x": 270,
    "y": 580,
    "width": 340,
    "height": 240,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 10,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=700&q=80"
  },
  {
    "id": "free-work-cap-4",
    "name": "paragraph",
    "type": "paragraph",
    "x": 270,
    "y": 830,
    "width": 340,
    "height": 70,
    "content": "حل مخصص صُمم خصيصًا ليلائم طبيعة العمل.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 13.5,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.6
    }
  },
  {
    "id": "free-work-img-5",
    "name": "image",
    "type": "image",
    "x": 670,
    "y": 580,
    "width": 340,
    "height": 240,
    "content": "",
    "slideId": "free-work-slide",
    "styles": {
      "borderRadius": 10,
      "objectFit": "cover"
    },
    "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80"
  },
  {
    "id": "free-work-cap-5",
    "name": "paragraph",
    "type": "paragraph",
    "x": 670,
    "y": 830,
    "width": 340,
    "height": 70,
    "content": "لحظة من رحلة عمل نفخر بها ونعتز بنتائجها.",
    "slideId": "free-work-slide",
    "styles": {
      "fontSize": 13.5,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.6
    }
  },
  {
    "id": "free-pricing-header",
    "name": "heading",
    "type": "heading",
    "x": 100,
    "y": 70,
    "width": 1080,
    "height": 50,
    "content": "باقات الأسعار",
    "slideId": "free-pricing-slide",
    "styles": {
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "center",
      "lineHeight": 1.25
    }
  },
  {
    "id": "free-pricing-sub",
    "name": "paragraph",
    "type": "paragraph",
    "x": 100,
    "y": 125,
    "width": 1080,
    "height": 40,
    "content": "اختر الباقة التي تناسب احتياجاتك",
    "slideId": "free-pricing-slide",
    "styles": {
      "fontSize": 15,
      "color": "#6B6459",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "center",
      "lineHeight": 1.5
    }
  },
  {
    "id": "free-pricing-tier-1",
    "name": "pricing",
    "type": "pricing",
    "x": 100,
    "y": 210,
    "width": 320,
    "height": 380,
    "content": "",
    "slideId": "free-pricing-slide",
    "styles": {
      "backgroundColor": "#FFFFFF",
      "color": "#1F5D50",
      "borderRadius": 16,
      "textAlign": "center",
      "borderColor": "#E6E1D6",
      "borderWidth": 1
    },
    "pricingPlan": "الباقة الأساسية",
    "pricingPrice": "٢٥$",
    "pricingPeriod": "شهريًا",
    "pricingFeatures": [
      "استشارة أولى مجانية",
      "متابعة عبر واتساب",
      "مدة تنفيذ قياسية"
    ],
    "pricingFeatured": false,
    "pricingCtaText": "اختر هذه الباقة"
  },
  {
    "id": "free-pricing-tier-2",
    "name": "pricing",
    "type": "pricing",
    "x": 480,
    "y": 210,
    "width": 320,
    "height": 380,
    "content": "",
    "slideId": "free-pricing-slide",
    "styles": {
      "backgroundColor": "#FFFFFF",
      "color": "#1F5D50",
      "borderRadius": 16,
      "textAlign": "center",
      "borderColor": "#1F5D50",
      "borderWidth": 2
    },
    "pricingPlan": "الباقة المميزة",
    "pricingPrice": "٤٥$",
    "pricingPeriod": "شهريًا",
    "pricingFeatures": [
      "كل ميزات الباقة الأساسية",
      "أولوية في التنفيذ",
      "متابعة أسبوعية مباشرة",
      "تعديلات إضافية مجانية"
    ],
    "pricingFeatured": true,
    "pricingCtaText": "اختر هذه الباقة"
  },
  {
    "id": "free-pricing-tier-3",
    "name": "pricing",
    "type": "pricing",
    "x": 860,
    "y": 210,
    "width": 320,
    "height": 380,
    "content": "",
    "slideId": "free-pricing-slide",
    "styles": {
      "backgroundColor": "#FFFFFF",
      "color": "#1F5D50",
      "borderRadius": 16,
      "textAlign": "center",
      "borderColor": "#E6E1D6",
      "borderWidth": 1
    },
    "pricingPlan": "الباقة الشاملة",
    "pricingPrice": "٧٥$",
    "pricingPeriod": "شهريًا",
    "pricingFeatures": [
      "كل ميزات الباقة المميزة",
      "دعم على مدار الساعة",
      "تقرير أداء شهري",
      "مدير حساب مخصص"
    ],
    "pricingFeatured": false,
    "pricingCtaText": "اختر هذه الباقة"
  },
  {
    "id": "free-contact-heading",
    "name": "heading",
    "type": "heading",
    "x": 680,
    "y": 70,
    "width": 480,
    "height": 50,
    "content": "تواصل معنا",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#1C1B19",
      "fontFamily": "El Messiri",
      "textAlign": "right",
      "lineHeight": 1.25
    }
  },
  {
    "id": "free-contact-rule",
    "name": "shape",
    "type": "shape",
    "x": 1164,
    "y": 74,
    "width": 4,
    "height": 42,
    "content": "",
    "slideId": "free-contact-slide",
    "styles": {
      "backgroundColor": "#1F5D50",
      "borderRadius": 2
    }
  },
  {
    "id": "free-contact-map",
    "name": "map",
    "type": "map",
    "x": 100,
    "y": 150,
    "width": 560,
    "height": 400,
    "content": "دمشق، سوريا",
    "slideId": "free-contact-slide",
    "styles": {
      "borderRadius": 16
    },
    "mapLocation": "دمشق، سوريا"
  },
  {
    "id": "free-contact-icon-phone",
    "name": "icon",
    "type": "icon",
    "x": 1128,
    "y": 150,
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
    "x": 680,
    "y": 154,
    "width": 430,
    "height": 32,
    "content": "٩٦٣ ٩٩١ ٢٣٤ ٥٦٧+",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.4
    },
    "linkType": "contact",
    "contactType": "phone",
    "contactValue": "+963991234567",
    "linkUrl": "tel:+963991234567"
  },
  {
    "id": "free-contact-icon-whatsapp",
    "name": "icon",
    "type": "icon",
    "x": 1128,
    "y": 220,
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
    "x": 680,
    "y": 224,
    "width": 430,
    "height": 32,
    "content": "تواصل عبر واتساب",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.4
    },
    "linkType": "contact",
    "contactType": "whatsapp",
    "contactValue": "963991234567",
    "linkUrl": "https://wa.me/963991234567"
  },
  {
    "id": "free-contact-icon-email",
    "name": "icon",
    "type": "icon",
    "x": 1128,
    "y": 290,
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
    "x": 680,
    "y": 294,
    "width": 430,
    "height": 32,
    "content": "info@example.com",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.4
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
    "x": 1128,
    "y": 360,
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
    "x": 680,
    "y": 364,
    "width": 430,
    "height": 32,
    "content": "دمشق، سوريا",
    "slideId": "free-contact-slide",
    "styles": {
      "fontSize": 15,
      "color": "#3D3830",
      "fontFamily": "IBM Plex Sans Arabic",
      "textAlign": "right",
      "lineHeight": 1.4
    }
  },
  {
    "id": "free-contact-social-fb",
    "name": "icon",
    "type": "icon",
    "x": 1120,
    "y": 450,
    "width": 40,
    "height": 40,
    "content": "iconify:simple-icons:facebook",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#6B6459"
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
    "x": 1064,
    "y": 450,
    "width": 40,
    "height": 40,
    "content": "iconify:simple-icons:instagram",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#6B6459"
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
    "x": 1008,
    "y": 450,
    "width": 40,
    "height": 40,
    "content": "iconify:simple-icons:tiktok",
    "slideId": "free-contact-slide",
    "styles": {
      "color": "#6B6459"
    },
    "linkType": "contact",
    "contactType": "tiktok",
    "contactValue": "yourpage",
    "linkUrl": "https://tiktok.com/@yourpage"
  }
];

  return { pages, elements };
}
