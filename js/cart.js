// js/cart.js
// الكائن المسؤول عن إدارة عمليات سلة المشتريات والتخزين المؤقت المحلي

const Cart = {
  items: [],

  load() {
    const saved = localStorage.getItem('faqous_cart');
    this.items  = saved ? JSON.parse(saved) : [];
  },

  save() {
    localStorage.setItem('faqous_cart', JSON.stringify(this.items));
    this.updateBadge();
  },

  add(productId, qty) {
    const existing = this.items.find(i => i.id === productId);
    if (existing) {
      existing.qty = parseFloat((existing.qty + qty).toFixed(2));
    } else {
      this.items.push({ id: productId, qty });
    }
    this.save();
  },

  remove(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
  },

  updateQty(productId, qty) {
    if (qty <= 0) { this.remove(productId); return; }
    const item = this.items.find(i => i.id === productId);
    if (item) item.qty = parseFloat(qty.toFixed(2));
    this.save();
  },

  subtotal() {
    return this.items.reduce((sum, i) => {
      const p = DB.products.find(x => x.id === i.id);
      return sum + (p ? p.price * i.qty : 0);
    }, 0);
  },

  total() {
    return this.subtotal() + DB.settings.deliveryFee;
  },

  count() {
    return this.items.length;
  },

  clear() {
    this.items = [];
    this.save();
  },

  updateBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = this.count();
    }
  }
};

// تحميل فوري
Cart.load();