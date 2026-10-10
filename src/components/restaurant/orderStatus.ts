// The order confirmation email and the order's status page (see api/order-status.ts).
import { auth } from '../../services/firebase';

// Asks the server to email the signed-in customer the confirmation of the order they just placed,
// with the link to its status page. Nothing to wait for: the order is placed either way.
export const sendOrderConfirmation = async (uid: string, orderId: string) => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;
    await fetch('/api/order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ r: uid, o: orderId }),
    });
  } catch (e) {
    console.warn('Could not send the order confirmation:', e);
  }
};

export interface OrderStatusView {
  number: number;
  status: string;
  type: string;
  table: string;
  createdAt: string;
  lines: { name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  restaurant: { name: string; currency: string; phone: string; whatsapp: string };
}

export const loadOrderStatus = async (uid: string, orderId: string, k: string): Promise<OrderStatusView | 'not_found'> => {
  const res = await fetch(`/api/order-status?r=${encodeURIComponent(uid)}&o=${encodeURIComponent(orderId)}&k=${encodeURIComponent(k)}`, { cache: 'no-store' });
  if (res.status === 404) return 'not_found';
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
};
