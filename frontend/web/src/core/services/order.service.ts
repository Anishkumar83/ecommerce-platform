import type { Order, PaginatedResponse, Address, PaymentMethod } from '../models';
import { MOCK_ORDERS } from '../mock/data';
import { cartService } from './cart.service';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let orders = [...MOCK_ORDERS];

export const orderService = {
  async getOrders(customerId: string, page = 1, pageSize = 10): Promise<PaginatedResponse<Order>> {
    await delay(400);
    const filtered = orders.filter(o => o.customerId === customerId);
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getAllOrders(page = 1, pageSize = 20): Promise<PaginatedResponse<Order>> {
    await delay(400);
    const total = orders.length;
    const data = orders.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getOrder(referenceId: string): Promise<Order> {
    await delay(300);
    const order = orders.find(o => o.referenceId === referenceId);
    if (!order) throw { code: 404, message: 'Order not found' };
    return order;
  },

  async placeOrder(params: {
    customerId: string;
    customerName: string;
    shippingAddress: Address;
    paymentMethod: PaymentMethod;
  }): Promise<{ order: Order; paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING' }> {
    await delay(1200);

    const cart = await cartService.getCart();
    if (cart.items.filter(i => !i.savedForLater).length === 0) {
      throw { code: 400, message: 'Cart is empty' };
    }

    // Simulate payment outcomes
    const rand = Math.random();
    let paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
    if (params.paymentMethod === 'CASH_ON_DELIVERY') {
      paymentStatus = 'PENDING';
    } else if (rand < 0.85) {
      paymentStatus = 'SUCCESS';
    } else {
      paymentStatus = 'FAILED';
    }

    if (paymentStatus === 'FAILED') {
      throw { code: 402, message: 'Payment failed. Please try a different payment method.' };
    }

    const ref = `ORD${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();
    const delivery = new Date(Date.now() + 5 * 86400000).toISOString();

    const order: Order = {
      referenceId: ref,
      customerId: params.customerId,
      customerName: params.customerName,
      items: cart.items.filter(i => !i.savedForLater).map(i => ({
        referenceId: `OI_${i.referenceId}`,
        productId: i.productId,
        productName: i.productName,
        imageUrl: i.imageUrl,
        partnerId: i.partnerId,
        partnerName: i.partnerName,
        variantLabel: i.variantLabel,
        price: i.price,
        quantity: i.quantity,
        total: i.price * i.quantity,
      })),
      shippingAddress: params.shippingAddress,
      paymentMethod: params.paymentMethod,
      paymentStatus,
      paymentReferenceId: paymentStatus === 'SUCCESS' ? `PAY_${Date.now()}` : undefined,
      orderStatus: 'PLACED',
      subtotal: cart.subtotal,
      discount: cart.discount,
      deliveryFee: cart.deliveryFee,
      total: cart.total,
      estimatedDelivery: delivery,
      timeline: [{ status: 'PLACED', timestamp: now, description: 'Order placed successfully', completed: true }],
      versionNo: 1,
      statusCode: 'ACTIVE',
      activeCode: 'Y',
      rowVersion: 1,
      createdOn: now,
      createdBy: params.customerId,
      lastUpdatedOn: now,
      lastUpdatedBy: params.customerId,
    };

    orders.unshift(order);
    await cartService.clearCart();
    return { order, paymentStatus };
  },

  async cancelOrder(referenceId: string): Promise<Order> {
    await delay(500);
    const order = orders.find(o => o.referenceId === referenceId);
    if (!order) throw { code: 404, message: 'Order not found' };
    if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
      throw { code: 400, message: 'Order cannot be cancelled at this stage.' };
    }
    order.orderStatus = 'CANCELLED';
    order.timeline.push({ status: 'CANCELLED', timestamp: new Date().toISOString(), description: 'Order cancelled by customer', completed: true });
    return order;
  },
};
