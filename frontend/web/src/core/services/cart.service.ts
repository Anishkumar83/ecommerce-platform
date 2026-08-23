import type { Cart, CartItem, Product } from '../models';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const EMPTY_CART: Cart = {
  customerId: 'CST260822A01',
  items: [],
  discount: 0,
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
};

const STORAGE_KEY = 'zha_cart';

/**
 * The cart lives in module state, which a full page reload wipes — so a shopper
 * arriving from a campaign link, adding an item and then refreshing would lose
 * it. Mirroring it into sessionStorage (the same place AuthContext keeps the
 * session) makes the basket survive navigation without pretending to be a real
 * backend.
 */
function restore(): Cart {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_CART, items: [] };
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed || !Array.isArray(parsed.items)) return { ...EMPTY_CART, items: [] };
    return parsed;
  } catch {
    return { ...EMPTY_CART, items: [] };
  }
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Private mode, or storage disabled — the in-memory cart still works.
  }
}

let cart: Cart = restore();

function recalculate() {
  const activeItems = cart.items.filter(i => !i.savedForLater);
  cart.subtotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  cart.deliveryFee = cart.subtotal > 500 ? 0 : 49;
  cart.total = cart.subtotal - cart.discount + cart.deliveryFee;
  persist();
}

export const cartService = {
  async getCart(): Promise<Cart> {
    await delay(200);
    recalculate();
    return { ...cart, items: [...cart.items] };
  },

  async addItem(product: Product, variantId?: string, quantity = 1): Promise<Cart> {
    await delay(400);
    const variantLabel = variantId
      ? product.variants.find(v => v.referenceId === variantId)?.color ?? ''
      : undefined;

    const existing = cart.items.find(i => i.productId === product.referenceId && i.variantId === variantId);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > existing.maxStock) {
        throw { code: 409, message: `Only ${existing.maxStock} items remaining in stock.` };
      }
      existing.quantity = newQty;
    } else {
      const maxStock = variantId
        ? (product.variants.find(v => v.referenceId === variantId)?.stock ?? product.stock)
        : product.stock;

      const item: CartItem = {
        referenceId: `CI_${Date.now()}`,
        productId: product.referenceId,
        productName: product.name,
        imageUrl: product.media.find(m => m.isPrimary)?.url ?? '',
        partnerId: product.partnerId,
        partnerName: product.partnerName,
        variantId,
        variantLabel,
        price: product.price,
        mrp: product.mrp,
        quantity,
        maxStock,
        savedForLater: false,
      };
      cart.items.push(item);
    }
    recalculate();
    return { ...cart, items: [...cart.items] };
  },

  async updateQuantity(itemReferenceId: string, quantity: number): Promise<Cart> {
    await delay(300);
    const item = cart.items.find(i => i.referenceId === itemReferenceId);
    if (!item) throw { code: 404, message: 'Cart item not found' };

    // Simulate stock check
    if (quantity > item.maxStock) {
      throw { code: 409, message: `This item is no longer available in the requested quantity.\n\nAvailable quantity: ${item.maxStock}` };
    }
    item.quantity = quantity;
    recalculate();
    return { ...cart, items: [...cart.items] };
  },

  async removeItem(itemReferenceId: string): Promise<Cart> {
    await delay(300);
    cart.items = cart.items.filter(i => i.referenceId !== itemReferenceId);
    recalculate();
    return { ...cart, items: [...cart.items] };
  },

  async saveForLater(itemReferenceId: string): Promise<Cart> {
    await delay(200);
    const item = cart.items.find(i => i.referenceId === itemReferenceId);
    if (item) item.savedForLater = true;
    recalculate();
    return { ...cart, items: [...cart.items] };
  },

  async moveToCart(itemReferenceId: string): Promise<Cart> {
    await delay(200);
    const item = cart.items.find(i => i.referenceId === itemReferenceId);
    if (item) item.savedForLater = false;
    recalculate();
    return { ...cart, items: [...cart.items] };
  },

  async applyCoupon(code: string): Promise<Cart> {
    await delay(600);
    if (code.toUpperCase() === 'SAVE200') {
      cart.couponCode = code;
      cart.discount = 200;
    } else if (code.toUpperCase() === 'FIRST500') {
      cart.couponCode = code;
      cart.discount = 500;
    } else {
      throw { code: 400, message: 'Invalid coupon code' };
    }
    recalculate();
    return { ...cart, items: [...cart.items] };
  },

  async clearCart(): Promise<void> {
    cart.items = [];
    cart.discount = 0;
    cart.couponCode = undefined;
    recalculate();
  },

  getItemCount(): number {
    return cart.items.filter(i => !i.savedForLater).reduce((sum, i) => sum + i.quantity, 0);
  },
};
