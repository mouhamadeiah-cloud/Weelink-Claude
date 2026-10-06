// Investments & projects (Weelink / Invest): the data an investment company keeps in its admin
// window. Its projects are shown live on the site through 'investProjects' elements, visitors send
// an investment request from a project's page, and the company records its investors and what each
// put into which project. How much a project has raised comes from those investments plus the
// amount raised before the site (raisedBefore). normalizeInvestAdmin fills defaults so older saved
// data still loads.
import { newId } from '../shop/shopTypes';

export type InvestStatus = 'open' | 'funded' | 'running' | 'completed';

export interface InvestProject {
  id: string;
  title: string;
  sector: string;
  location: string;
  summary: string; // one or two lines on the card
  description: string;
  highlights: string[]; // short points: why invest in this project
  images: string[];
  status: InvestStatus;
  currency: string;
  target: number; // the capital the project needs
  raisedBefore: number; // raised before the site, added to the recorded investments
  minInvestment: number;
  expectedReturn: string; // free text, e.g. "18% سنويًا"
  duration: string; // free text, e.g. "24 شهرًا"
  startDate: string; // yyyy-mm-dd
  featured: boolean;
  published: boolean;
  createdAt: string;
}

export interface InvestSettings {
  companyName: string;
  currency: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  acceptRequests: boolean; // the «أرغب بالاستثمار» form on a project's page
  showCompleted: boolean; // completed projects stay on the site as past work
  disclaimer: string; // shown under every project's page
}

export type InvestRequestStatus = 'new' | 'contacted' | 'done';
export interface InvestRequest {
  id: string;
  projectId: string;
  projectTitle: string;
  name: string;
  phone: string;
  amount: number;
  message: string;
  status: InvestRequestStatus;
  investorId?: string; // set once the request was added to the investors
  createdAt: string;
}

export interface InvestmentEntry {
  id: string;
  projectId: string;
  amount: number;
  date: string; // yyyy-mm-dd
  note: string;
}

export interface Investor {
  id: string;
  name: string;
  phone: string;
  notes: string;
  investments: InvestmentEntry[];
  createdAt: string;
}

export interface InvestAdminData {
  settings: InvestSettings;
  projects: InvestProject[];
  requests: InvestRequest[];
  investors: Investor[];
}

export type InvestRequestInput = Omit<InvestRequest, 'id' | 'status' | 'createdAt' | 'investorId'>;

export const INVEST_CURRENCIES = ['$', 'ل.س', '€'];
export const INVEST_SECTORS = ['عقارات', 'زراعة', 'صناعة', 'تجارة', 'سياحة وفنادق', 'مطاعم', 'تقنية', 'طاقة', 'صحة', 'تعليم', 'نقل', 'أخرى'];

export const INVEST_STATUSES: { id: InvestStatus; label: string; color: string }[] = [
  { id: 'open', label: 'مفتوح للاستثمار', color: '#1e7a34' },
  { id: 'funded', label: 'اكتمل التمويل', color: '#0071e3' },
  { id: 'running', label: 'قيد التنفيذ', color: '#b06f00' },
  { id: 'completed', label: 'منجز', color: '#6e6e73' },
];

export const investStatusMeta = (s: InvestStatus) => INVEST_STATUSES.find((x) => x.id === s) || INVEST_STATUSES[0];

export const DEFAULT_INVEST_SETTINGS: InvestSettings = {
  companyName: '',
  currency: '$',
  whatsappNumber: '',
  phone: '',
  email: '',
  address: '',
  acceptRequests: true,
  showCompleted: true,
  disclaimer: 'الأرقام المعروضة تقديرية وليست ضمانًا للربح. كل استثمار يحمل نسبة من المخاطرة، ويُوقَّع عقد مستقل لكل مشاركة.',
};

export const emptyProject = (currency = '$'): InvestProject => ({
  id: newId('prj'),
  title: '',
  sector: '',
  location: '',
  summary: '',
  description: '',
  highlights: [],
  images: [],
  status: 'open',
  currency,
  target: 0,
  raisedBefore: 0,
  minInvestment: 0,
  expectedReturn: '',
  duration: '',
  startDate: '',
  featured: false,
  published: true,
  createdAt: new Date().toISOString(),
});

export const createEmptyInvestAdmin = (): InvestAdminData => ({
  settings: { ...DEFAULT_INVEST_SETTINGS },
  projects: [],
  requests: [],
  investors: [],
});

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : Number(v) || 0);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

const normalizeProject = (raw: any, currency: string): InvestProject => {
  const base = emptyProject(currency);
  const status = INVEST_STATUSES.some((s) => s.id === raw?.status) ? raw.status : 'open';
  return {
    ...base,
    ...raw,
    id: str(raw?.id) || base.id,
    status,
    currency: str(raw?.currency) || currency,
    target: num(raw?.target),
    raisedBefore: num(raw?.raisedBefore),
    minInvestment: num(raw?.minInvestment),
    highlights: Array.isArray(raw?.highlights) ? raw.highlights.filter((h: unknown) => typeof h === 'string') : [],
    images: Array.isArray(raw?.images) ? raw.images.filter((h: unknown) => typeof h === 'string') : [],
    featured: !!raw?.featured,
    published: raw?.published !== false,
  };
};

const normalizeRequest = (raw: any): InvestRequest => ({
  id: str(raw?.id) || newId('ireq'),
  projectId: str(raw?.projectId),
  projectTitle: str(raw?.projectTitle),
  name: str(raw?.name),
  phone: str(raw?.phone),
  amount: num(raw?.amount),
  message: str(raw?.message),
  status: raw?.status === 'contacted' || raw?.status === 'done' ? raw.status : 'new',
  ...(raw?.investorId ? { investorId: str(raw.investorId) } : {}),
  createdAt: str(raw?.createdAt) || new Date().toISOString(),
});

const normalizeInvestor = (raw: any): Investor => ({
  id: str(raw?.id) || newId('inv'),
  name: str(raw?.name),
  phone: str(raw?.phone),
  notes: str(raw?.notes),
  investments: Array.isArray(raw?.investments)
    ? raw.investments.map((e: any) => ({ id: str(e?.id) || newId('ent'), projectId: str(e?.projectId), amount: num(e?.amount), date: str(e?.date), note: str(e?.note) }))
    : [],
  createdAt: str(raw?.createdAt) || new Date().toISOString(),
});

export const normalizeInvestAdmin = (raw: any): InvestAdminData => {
  const settings: InvestSettings = { ...DEFAULT_INVEST_SETTINGS, ...(raw?.settings || {}) };
  return {
    settings,
    projects: Array.isArray(raw?.projects) ? raw.projects.map((p: unknown) => normalizeProject(p, settings.currency)) : [],
    requests: Array.isArray(raw?.requests) ? raw.requests.map(normalizeRequest) : [],
    investors: Array.isArray(raw?.investors) ? raw.investors.map(normalizeInvestor) : [],
  };
};

// What a project has raised: before the site plus every recorded investment in it.
export const projectRaised = (data: Pick<InvestAdminData, 'investors'>, p: InvestProject) =>
  p.raisedBefore + data.investors.reduce((sum, inv) => sum + inv.investments.filter((e) => e.projectId === p.id).reduce((s, e) => s + e.amount, 0), 0);

export const projectInvestorCount = (data: Pick<InvestAdminData, 'investors'>, p: InvestProject) =>
  data.investors.filter((inv) => inv.investments.some((e) => e.projectId === p.id)).length;

export const fundedPercent = (raised: number, target: number) => (target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0);

export const submitInvestRequest = (d: InvestAdminData, r: InvestRequestInput): InvestAdminData => ({
  ...d,
  requests: [{ ...r, id: newId('ireq'), status: 'new', createdAt: new Date().toISOString() }, ...d.requests],
});

export const whatsappHref = (number: string, text: string) =>
  `https://wa.me/${number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;

// Example projects for a first visit, so the site's pages are not empty. The owner edits or deletes them.
export const exampleInvestAdmin = (): InvestAdminData => {
  const p = (changes: Partial<InvestProject>): InvestProject => ({ ...emptyProject('$'), ...changes, id: newId('prj') });
  const projects: InvestProject[] = [
    p({
      title: 'مجمّع سكني في ريف دمشق',
      sector: 'عقارات',
      location: 'ريف دمشق، قدسيا',
      summary: 'بناء 48 شقة سكنية متوسطة المساحة مع محلات تجارية في الطابق الأرضي.',
      description: 'مشروع سكني من أربعة أبنية على أرض مملوكة للشركة ومرخّصة. تُباع الشقق على المخطط وبالتقسيط، ويتقاسم المستثمرون أرباح البيع حسب حصصهم بعد انتهاء البناء.',
      highlights: ['أرض مملوكة ومرخّصة', 'طلب مرتفع على الشقق المتوسطة', 'تقارير إنجاز كل ثلاثة أشهر'],
      images: [photo('1545324418-cc1a3fa10c00'), photo('1503387762-592deb58ef4e')],
      target: 600000, raisedBefore: 210000, minInvestment: 5000, expectedReturn: '22% عند البيع', duration: '30 شهرًا', featured: true,
    }),
    p({
      title: 'بيوت بلاستيكية للخضار',
      sector: 'زراعة',
      location: 'طرطوس',
      summary: '20 بيتًا بلاستيكيًا لإنتاج البندورة والخيار على مدار السنة مع تصدير جزء من الإنتاج.',
      description: 'تجهيز 20 بيتًا بلاستيكيًا بنظام ري بالتنقيط، مع عقود بيع مسبقة لتجار الجملة. يُوزَّع الربح بعد كل موسم.',
      highlights: ['موسمان في السنة', 'عقود بيع مسبقة', 'إدارة من مهندس زراعي'],
      images: [photo('1530836369250-ef72a3f5cda8')],
      target: 120000, raisedBefore: 75000, minInvestment: 1000, expectedReturn: '15–18% سنويًا', duration: '3 سنوات', featured: true,
    }),
    p({
      title: 'محطة طاقة شمسية لمنشأة صناعية',
      sector: 'طاقة',
      location: 'حلب، المدينة الصناعية',
      summary: 'محطة 500 كيلوواط تبيع الكهرباء لمعمل بعقد طويل الأمد.',
      description: 'تركيب ألواح وبطاريات على سطح المعمل، ويدفع المعمل ثمن الكهرباء شهريًا بعقد مدته عشر سنوات.',
      highlights: ['عقد بيع كهرباء 10 سنوات', 'دخل شهري ثابت', 'صيانة مشمولة'],
      images: [photo('1509391366360-2e959784a276')],
      target: 250000, raisedBefore: 250000, minInvestment: 2500, expectedReturn: '12% سنويًا', duration: '10 سنوات', status: 'funded', featured: true,
    }),
    p({
      title: 'مطعم وجبات سريعة في اللاذقية',
      sector: 'مطاعم',
      location: 'اللاذقية، الكورنيش',
      summary: 'فرع جديد لعلامة مطاعم ناجحة في موقع سياحي.',
      description: 'تجهيز وافتتاح فرع جديد بإدارة فريق العلامة نفسها. بدأ التشغيل وتُوزَّع الأرباح كل ثلاثة أشهر.',
      highlights: ['علامة معروفة', 'موقع سياحي', 'أرباح كل 3 أشهر'],
      images: [photo('1517248135467-4c7edcad34c4')],
      target: 80000, raisedBefore: 80000, minInvestment: 2000, expectedReturn: '20% سنويًا', duration: 'مفتوح', status: 'running',
    }),
  ];
  return { ...createEmptyInvestAdmin(), projects };
};
