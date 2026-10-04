// The showroom's money, kept as pure functions over CarAdminData so every screen books the same way.
// A car's money lives on the car (purchase, expenses, sale and its payments) and each amount that
// actually moved through the cash box or the bank also has an accounts entry (CarTransaction) whose
// id the car keeps, so changing or undoing it on the car changes the accounts too.
import { newId } from '../shop/shopTypes';
import {
  Car, CarAdminData, CarCustomer, CarExpense, CarRequest, CarSalePayment, CarTransaction, MoneyAccount, TxSource,
} from './carTypes';
import { carTitle } from './carModel';

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const accountLabel = (a: MoneyAccount | 'none') => (a === 'cash' ? 'الصندوق' : a === 'bank' ? 'البنك' : 'بدون تسجيل');

const carLabel = (car: Car) => `${carTitle(car)}${car.year ? ` ${car.year}` : ''} (${car.stockNumber})`;

// ---- figures of one car (all in the car's currency) ----

export const carExpensesTotal = (car: Car) => car.expenses.reduce((s, e) => s + e.amount, 0);
export const carCost = (car: Car) => car.purchasePrice + carExpensesTotal(car);
export const salePaid = (car: Car) => (car.sale ? car.sale.payments.reduce((s, p) => s + p.amount, 0) : 0);
export const saleRemaining = (car: Car) => (car.sale ? Math.max(0, car.sale.price - salePaid(car)) : 0);
export const carProfit = (car: Car) => (car.sale ? car.sale.price - carCost(car) : 0);
// For a car still in stock: what it would make at its asking price.
export const expectedProfit = (car: Car) => (car.price > 0 && car.purchasePrice > 0 ? car.price - carCost(car) : 0);

// ---- balances ----

export type Balances = Record<MoneyAccount, Record<string, number>>;

export const balancesOf = (txs: CarTransaction[]): Balances => {
  const b: Balances = { cash: {}, bank: {} };
  const add = (a: MoneyAccount, cur: string, n: number) => { b[a][cur] = (b[a][cur] || 0) + n; };
  txs.forEach((t) => {
    if (t.kind === 'in') add(t.account, t.currency, t.amount);
    else if (t.kind === 'out') add(t.account, t.currency, -t.amount);
    else if (t.toAccount) { add(t.account, t.currency, -t.amount); add(t.toAccount, t.currency, t.amount); }
  });
  return b;
};

// ---- low-level entry helpers ----

const makeTx = (fields: Omit<CarTransaction, 'id' | 'createdAt'>): CarTransaction => ({ ...fields, id: newId('tx'), createdAt: new Date().toISOString() });
const dropTx = (txs: CarTransaction[], ids: string[]) => txs.filter((t) => !ids.includes(t.id));
const withCar = (d: CarAdminData, id: string, fn: (c: Car) => Car): CarAdminData => ({
  ...d,
  cars: d.cars.map((c) => (c.id === id ? { ...fn(c), updatedAt: new Date().toISOString() } : c)),
});

// The purchase entry follows the car: booked from the chosen account for the purchase price, updated
// when either changes, and removed when the account is set back to «بدون تسجيل».
export const syncPurchaseTx = (d: CarAdminData, car: Car): CarAdminData => {
  const existing = car.purchaseTxId ? d.transactions.find((t) => t.id === car.purchaseTxId) : undefined;
  const wanted = car.purchaseAccount !== 'none' && car.purchasePrice > 0;
  let transactions = d.transactions;
  let purchaseTxId = car.purchaseTxId;
  if (!wanted) {
    if (existing) transactions = dropTx(transactions, [existing.id]);
    purchaseTxId = '';
  } else {
    const fields = {
      date: car.purchaseDate || existing?.date || todayKey(),
      kind: 'out' as const,
      account: car.purchaseAccount as MoneyAccount,
      amount: car.purchasePrice,
      currency: car.currency,
      category: 'شراء سيارة',
      description: `شراء ${carLabel(car)}${car.purchaseFrom ? ` من ${car.purchaseFrom}` : ''}`,
      source: 'purchase' as TxSource,
      carId: car.id,
    };
    if (existing) transactions = transactions.map((t) => (t.id === existing.id ? { ...t, ...fields } : t));
    else {
      const tx = makeTx(fields);
      transactions = [tx, ...transactions];
      purchaseTxId = tx.id;
    }
  }
  return {
    ...d,
    transactions,
    cars: d.cars.map((c) => (c.id === car.id ? { ...c, purchaseTxId } : c)),
  };
};

// ---- expenses ----

export const addCarExpense = (d: CarAdminData, carId: string, e: Omit<CarExpense, 'id' | 'txId'>): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  if (!car) return d;
  const tx = e.account === 'none' ? null : makeTx({
    date: e.date, kind: 'out', account: e.account, amount: e.amount, currency: car.currency,
    category: e.category, description: `${e.category}: ${carLabel(car)}${e.note ? ` · ${e.note}` : ''}`, source: 'expense', carId,
  });
  const expense: CarExpense = { ...e, id: newId('exp'), txId: tx?.id || '' };
  return withCar({ ...d, transactions: tx ? [tx, ...d.transactions] : d.transactions }, carId, (c) => ({ ...c, expenses: [expense, ...c.expenses] }));
};

export const removeCarExpense = (d: CarAdminData, carId: string, expenseId: string): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  const exp = car?.expenses.find((e) => e.id === expenseId);
  if (!car || !exp) return d;
  return withCar({ ...d, transactions: dropTx(d.transactions, [exp.txId]) }, carId, (c) => ({ ...c, expenses: c.expenses.filter((e) => e.id !== expenseId) }));
};

// ---- customers ----

export type CustomerDraft = Omit<CarCustomer, 'id' | 'createdAt'>;

export const emptyCustomer = (): CustomerDraft => ({ name: '', phone: '', city: '', address: '', idNumber: '', roles: [], notes: '' });

export const saveCustomer = (d: CarAdminData, draft: CustomerDraft, id?: string): { data: CarAdminData; id: string } => {
  if (id && d.customers.some((c) => c.id === id)) {
    return { data: { ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...draft } : c)) }, id };
  }
  const customer: CarCustomer = { ...draft, id: newId('cus'), createdAt: new Date().toISOString() };
  return { data: { ...d, customers: [customer, ...d.customers] }, id: customer.id };
};

const addRole = (d: CarAdminData, customerId: string, role: CarCustomer['roles'][number]): CarAdminData => ({
  ...d,
  customers: d.customers.map((c) => (c.id === customerId && !c.roles.includes(role) ? { ...c, roles: [...c.roles, role] } : c)),
});

// ---- the sale ----

export interface SaleInput {
  date: string;
  price: number;
  customerId: string;
  note: string;
  paidNow: number; // 0 = nothing paid yet (all on credit)
  account: MoneyAccount;
}

const paymentTx = (car: Car, customerName: string, p: { date: string; amount: number; account: MoneyAccount; note: string }, first: boolean) =>
  makeTx({
    date: p.date, kind: 'in', account: p.account, amount: p.amount, currency: car.currency,
    category: first ? 'بيع سيارة' : 'دفعة من ثمن سيارة',
    description: `${first ? 'بيع' : 'دفعة'} ${carLabel(car)}${customerName ? ` · ${customerName}` : ''}${p.note ? ` · ${p.note}` : ''}`,
    source: first ? 'sale' : 'payment',
    carId: car.id,
  });

// Firestore refuses undefined fields, so the buyer is only set when there is one.
const withCustomer = (tx: CarTransaction, customerId: string): CarTransaction => (customerId ? { ...tx, customerId } : tx);

// «تم البيع»: the car becomes sold, the money paid today is booked as income, the rest stays owed by
// the buyer, who is marked as a buyer.
// A reserved car's deposit becomes the sale's first payment (its accounts entry stays as it is).
export const sellCar = (d: CarAdminData, carId: string, s: SaleInput): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  if (!car || car.sale) return d;
  const name = d.customers.find((c) => c.id === s.customerId)?.name || '';
  const r = car.reservation;
  const payments: CarSalePayment[] = r && r.deposit > 0
    ? [{ id: newId('pay'), date: r.date, amount: r.deposit, account: r.account, note: 'عربون', txId: r.txId, fromDeposit: true }]
    : [];
  let transactions = d.transactions;
  if (s.paidNow > 0) {
    const tx = withCustomer(paymentTx(car, name, { date: s.date, amount: s.paidNow, account: s.account, note: '' }, true), s.customerId);
    transactions = [tx, ...transactions];
    payments.push({ id: newId('pay'), date: s.date, amount: s.paidNow, account: s.account, note: '', txId: tx.id });
  }
  let next = withCar({ ...d, transactions }, carId, (c) => ({
    ...c,
    status: 'sold',
    sale: { date: s.date, price: s.price, customerId: s.customerId, note: s.note, payments },
    reservation: null,
  }));
  if (s.customerId) next = addRole(next, s.customerId, 'buyer');
  return next;
};

export const addSalePayment = (d: CarAdminData, carId: string, p: { date: string; amount: number; account: MoneyAccount; note: string }): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  if (!car?.sale || !(p.amount > 0)) return d;
  const name = d.customers.find((c) => c.id === car.sale!.customerId)?.name || '';
  const tx = withCustomer(paymentTx(car, name, p, car.sale.payments.length === 0), car.sale.customerId);
  const payment: CarSalePayment = { ...p, id: newId('pay'), txId: tx.id };
  return withCar({ ...d, transactions: [tx, ...d.transactions] }, carId, (c) => ({ ...c, sale: { ...c.sale!, payments: [...c.sale!.payments, payment] } }));
};

export const removeSalePayment = (d: CarAdminData, carId: string, paymentId: string): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  const pay = car?.sale?.payments.find((p) => p.id === paymentId);
  if (!car?.sale || !pay) return d;
  return withCar({ ...d, transactions: dropTx(d.transactions, [pay.txId]) }, carId, (c) => ({ ...c, sale: { ...c.sale!, payments: c.sale!.payments.filter((p) => p.id !== paymentId) } }));
};

// Undo «تم البيع»: the money booked for the sale leaves the accounts and the car is available again,
// or reserved again when the sale started from a reservation (its deposit stays).
export const undoSale = (d: CarAdminData, carId: string): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  if (!car?.sale) return d;
  const dep = car.sale.payments.find((p) => p.fromDeposit);
  const drop = car.sale.payments.filter((p) => !p.fromDeposit).map((p) => p.txId);
  return withCar({ ...d, transactions: dropTx(d.transactions, drop) }, carId, (c) => ({
    ...c,
    sale: null,
    status: dep ? 'reserved' : 'available',
    reservation: dep ? { date: dep.date, customerId: car.sale!.customerId, deposit: dep.amount, account: dep.account, note: '', txId: dep.txId } : null,
  }));
};

// ---- the reservation ----

export interface ReserveInput {
  date: string;
  customerId: string;
  deposit: number;
  account: MoneyAccount;
  note: string;
}

// «حجز بعربون»: the car is held for a customer; the deposit, if any, is income at once.
export const reserveCar = (d: CarAdminData, carId: string, r: ReserveInput): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  if (!car || car.sale || car.reservation) return d;
  const name = d.customers.find((c) => c.id === r.customerId)?.name || '';
  const tx = r.deposit > 0
    ? withCustomer(makeTx({
        date: r.date, kind: 'in', account: r.account, amount: r.deposit, currency: car.currency,
        category: 'عربون', description: `عربون حجز ${carLabel(car)}${name ? ` · ${name}` : ''}${r.note ? ` · ${r.note}` : ''}`,
        source: 'deposit', carId,
      }), r.customerId)
    : null;
  let next = withCar({ ...d, transactions: tx ? [tx, ...d.transactions] : d.transactions }, carId, (c) => ({
    ...c,
    status: 'reserved',
    reservation: { ...r, txId: tx?.id || '' },
  }));
  if (r.customerId) next = addRole(next, r.customerId, 'interested');
  return next;
};

// Cancel a reservation: the deposit is refunded (booked as money out today) or kept by the showroom
// (its entry stays as income, renamed). The car is available again.
export const cancelReservation = (d: CarAdminData, carId: string, refund: boolean, account?: MoneyAccount): CarAdminData => {
  const car = d.cars.find((c) => c.id === carId);
  const r = car?.reservation;
  if (!car || !r) return d;
  let transactions = d.transactions;
  if (r.deposit > 0) {
    if (refund) {
      transactions = [withCustomer(makeTx({
        date: todayKey(), kind: 'out', account: account || r.account, amount: r.deposit, currency: car.currency,
        category: 'إرجاع عربون', description: `إرجاع عربون ${carLabel(car)}`, source: 'deposit', carId,
      }), r.customerId), ...transactions];
    } else {
      transactions = transactions.map((t) => (t.id === r.txId ? { ...t, category: 'عربون محتفظ به', description: `${t.description} · أُلغي الحجز وبقي العربون للمعرض` } : t));
    }
  }
  return withCar({ ...d, transactions }, carId, (c) => ({ ...c, status: 'available', reservation: null }));
};

// ---- the accounts journal ----

export const addManualTx = (d: CarAdminData, t: Omit<CarTransaction, 'id' | 'createdAt' | 'source'>): CarAdminData => ({
  ...d,
  transactions: [makeTx({ ...t, source: 'manual' }), ...d.transactions],
});

// A car's entries belong to the car; only manual ones, and those of a car that no longer exists,
// are removed from the journal itself.
export const canRemoveTx = (d: CarAdminData, t: CarTransaction) => {
  if (t.source === 'manual') return true;
  const car = d.cars.find((c) => c.id === t.carId);
  if (!car) return true;
  // A deposit's entries once the reservation is over (refunded or kept) are history of the journal.
  if (t.source === 'deposit') return car.reservation?.txId !== t.id && !car.sale?.payments.some((p) => p.txId === t.id);
  return false;
};

export const removeTx = (d: CarAdminData, id: string): CarAdminData => ({ ...d, transactions: dropTx(d.transactions, [id]) });

export const TX_SOURCE_LABELS: Record<TxSource, string> = {
  manual: 'يدوي',
  purchase: 'شراء سيارة',
  expense: 'مصروف سيارة',
  sale: 'بيع سيارة',
  payment: 'دفعة من ثمن سيارة',
  deposit: 'عربون',
};

// ---- visitor requests ----

export type RequestInput = Pick<CarRequest, 'type' | 'carId' | 'carLabel' | 'name' | 'phone' | 'preferredDate' | 'message'>;

const phoneKey = (p: string) => p.replace(/\D/g, '').replace(/^(00963|963|0)/, '');

// A visitor's request lands in «طلبات الزوار», and the visitor joins the customers as «مهتم»
// (or, when the phone number is already known, that customer is used).
export const submitRequest = (d: CarAdminData, r: RequestInput): CarAdminData => {
  const key = phoneKey(r.phone);
  const known = key ? d.customers.find((c) => phoneKey(c.phone) === key) : undefined;
  let next = d;
  let customerId = known?.id || '';
  if (known) next = addRole(next, known.id, 'interested');
  else {
    const saved = saveCustomer(next, { ...emptyCustomer(), name: r.name, phone: r.phone, roles: ['interested'], notes: `طلب من الموقع: ${r.carLabel}` });
    next = saved.data;
    customerId = saved.id;
  }
  const request: CarRequest = { ...r, id: newId('req'), status: 'new', customerId, createdAt: new Date().toISOString() };
  return { ...next, requests: [request, ...next.requests] };
};
