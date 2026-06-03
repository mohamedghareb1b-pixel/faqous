// js/store.js - كامل وجاهز للمتجر
// قاعدة البيانات المشتركة الافتراضية
let DB = JSON.parse(localStorage.getItem('faqous_db')) || {
  products: [],
  categories: [],
  orders: [],
  notifications: [],
  settings: { storeName: 'سوق فاقوس', whatsapp: '201000000000', deliveryFee: 15, storeOpen: true }
};

function loadData() {
  const data = localStorage.getItem('faqous_db');
  if (data) DB = JSON.parse(data);
}

function saveData() {
  localStorage.setItem('faqous_db', JSON.stringify(DB));
}

// زيادة ونقصان الوزن بمقدار 0.50 كيلو تلقائياً
function adjustQty(productId, amount) {
  const qtyEl = document.getElementById(`qty-${productId}`);
  if (!qtyEl) return;
  
  let currentVal = parseFloat(qtyEl.textContent) || 0.5;
  currentVal += amount;
  
  if (currentVal < 0.5) currentVal = 0.5; // أقل وزن مسموح به نصف كيلو
  
  qtyEl.textContent = currentVal.toFixed(2);
}

// دالة إضافة المنتجات المصلحة والمحمية بالكامل
function addToCart(productId) {
  loadData();
  if (!DB || !DB.products) return;
  
  const product = DB.products.find(p => p.id === productId);
  if (!product) return;
  
  // قراءة الوزن بشكل آمن تماماً من الصفحة أو النافذة
  let qtyEl = document.getElementById(`qty-${productId}`) || document.getElementById('modal-qty');
  let quantity = qtyEl ? parseFloat(qtyEl.textContent || qtyEl.value) : 0.5;
  
  if (isNaN(quantity) || quantity <= 0) quantity = 0.5;
  
  let cart = JSON.parse(localStorage.getItem('faqous_cart')) || [];
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.qty = quantity; 
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      qty: quantity
    });
  }
  
  localStorage.setItem('faqous_cart', JSON.stringify(cart));
  
  // تحديث أرقام السلة في الواجهة فوراً
  updateCartUI();
  if (typeof showToast === 'function') {
    showToast('تم إضافة المنتج إلى السلة بنجاح! ✅');
  } else {
    alert('تم إضافة المنتج إلى السلة بنجاح! ✅');
  }
}

function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem('faqous_cart')) || [];
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const barEl = document.getElementById('cart-bar');
  
  if (!countEl || !totalEl) return;
  
  const count = cart.length;
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  countEl.textContent = count;
  totalEl.textContent = total.toFixed(2) + ' ج';
  
  if (barEl) {
    if (count > 0) barEl.classList.remove('hidden');
    else barEl.classList.add('hidden');
  }
}

// تشغيل السلة عند تحميل الصفحة أول مرة
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateCartUI();
});

// دالة مساعدة لبناء نص الواتساب لإرسال الطلب للآدمن
function buildWhatsAppText(order) {
  let text = `*طلب جديد من المتجر 🛒*\n\n`;
  text += `*الاسم:* ${order.fullName}\n`;
  text += `*الواتساب:* ${order.whatsapp}\n`;
  text += `*العنوان:* ${order.zone} - ${order.street}\n`;
  text += `---------------------------\n`;
  order.items.forEach(i => {
    text += `• ${i.name} × ${i.qty} ${i.unit} = ${(i.price * i.qty).toFixed(2)} ج\n`;
  });
  text += `---------------------------\n`;
  text += `*التوصيل:* ${order.deliveryFee} ج\n`;
  text += `*الإجمالي الحساب:* ${order.total.toFixed(2)} ج\n`;
  return text;
}