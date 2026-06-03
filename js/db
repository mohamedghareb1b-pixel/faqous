// js/db.js
// قاعدة البيانات المشتركة بين المتجر والإدارة

const DB = {
  categories: [
    { id: 1, name: 'خضروات',     slug: 'vegetables', icon: '🥦' },
    { id: 2, name: 'فواكه',       slug: 'fruits',     icon: '🍎' },
    { id: 3, name: 'لحوم',        slug: 'meat',       icon: '🥩' },
    { id: 4, name: 'دواجن',       slug: 'poultry',    icon: '🍗' },
    { id: 5, name: 'أسماك',       slug: 'fish',       icon: '🐟' },
    { id: 6, name: 'ألبان وبيض',  slug: 'dairy',      icon: '🥛' },
    { id: 7, name: 'عطارة وحبوب', slug: 'herbs',      icon: '🌾' },
  ],

  products: [
    // خضروات
    { id: 1,  catId: 1, name: 'طماطم',       price: 8,   unit: 'كيلو',    icon: '🍅', active: true },
    { id: 2,  catId: 1, name: 'بطاطس',       price: 10,  unit: 'كيلو',    icon: '🥔', active: true },
    { id: 3,  catId: 1, name: 'بصل',         price: 7,   unit: 'كيلو',    icon: '🧅', active: true },
    { id: 4,  catId: 1, name: 'خيار',        price: 12,  unit: 'كيلو',    icon: '🥒', active: true },
    { id: 5,  catId: 1, name: 'فلفل',        price: 15,  unit: 'كيلو',    icon: '🫑', active: true },
    { id: 6,  catId: 1, name: 'جزر',         price: 9,   unit: 'كيلو',    icon: '🥕', active: true },
    { id: 7,  catId: 1, name: 'كوسة',        price: 11,  unit: 'كيلو',    icon: '🥬', active: true },
    { id: 8,  catId: 1, name: 'ملوخية',      price: 14,  unit: 'كيلو',    icon: '🌿', active: true },
    // فواكه
    { id: 9,  catId: 2, name: 'مانجو',       price: 25,  unit: 'كيلو',    icon: '🥭', active: true },
    { id: 10, catId: 2, name: 'برتقال',      price: 12,  unit: 'كيلو',    icon: '🍊', active: true },
    { id: 11, catId: 2, name: 'موز',         price: 15,  unit: 'كيلو',    icon: '🍌', active: true },
    { id: 12, catId: 2, name: 'تفاح',        price: 20,  unit: 'كيلو',    icon: '🍎', active: true },
    { id: 13, catId: 2, name: 'عنب',         price: 30,  unit: 'كيلو',    icon: '🍇', active: true },
    { id: 14, catId: 2, name: 'بطيخ',        price: 8,   unit: 'كيلو',    icon: '🍉', active: true },
    // لحوم
    { id: 15, catId: 3, name: 'لحم بقري',    price: 120, unit: 'كيلو',    icon: '🥩', active: true },
    { id: 16, catId: 3, name: 'لحم ضأن',     price: 150, unit: 'كيلو',    icon: '🍖', active: true },
    { id: 17, catId: 3, name: 'كبدة بقري',   price: 80,  unit: 'كيلو',    icon: '🥩', active: true },
    // دواجن
    { id: 18, catId: 4, name: 'فراخ بلدي',   price: 65,  unit: 'كيلو',    icon: '🐓', active: true },
    { id: 19, catId: 4, name: 'فراخ تنة',    price: 50,  unit: 'كيلو',    icon: '🍗', active: true },
    { id: 20, catId: 4, name: 'أوز',         price: 90,  unit: 'كيلو',    icon: '🦢', active: true },
    // أسماك
    { id: 21, catId: 5, name: 'بلطي',        price: 35,  unit: 'كيلو',    icon: '🐟', active: true },
    { id: 22, catId: 5, name: 'بوري',        price: 45,  unit: 'كيلو',    icon: '🐠', active: true },
    { id: 23, catId: 5, name: 'جمبري',       price: 80,  unit: 'كيلو',    icon: '🦐', active: true },
    // ألبان وبيض
    { id: 24, catId: 6, name: 'بيض',         price: 12,  unit: 'كرتونة',  icon: '🥚', active: true },
    { id: 25, catId: 6, name: 'لبن',         price: 15,  unit: 'لتر',     icon: '🥛', active: true },
    { id: 26, catId: 6, name: 'جبنة بيضاء',  price: 60,  unit: 'كيلو',    icon: '🧀', active: true },
    { id: 27, catId: 6, name: 'زبادي',       price: 8,   unit: 'علبة',    icon: '🫙', active: true },
    // عطارة وحبوب
    { id: 28, catId: 7, name: 'أرز',         price: 20,  unit: 'كيلو',    icon: '🍚', active: true },
    { id: 29, catId: 7, name: 'عدس',         price: 22,  unit: 'كيلو',    icon: '🫘', active: true },
    { id: 30, catId: 7, name: 'كمون',        price: 40,  unit: 'كيلو',    icon: '🌾', active: true },
    { id: 31, catId: 7, name: 'فلفل أسود',   price: 50,  unit: 'كيلو',    icon: '🌶️', active: true },
  ],

  orders: [],
  notifications: [],
  orderCounter: 1000,

  settings: {
    storeName:   'سوق فاقوس',
    whatsapp:    '',
    deliveryFee: 15,
    storeOpen:   true,
  },
};

// ─── حفظ واسترجاع من localStorage ───────────────────────────
function saveData() {
  localStorage.setItem('faqous_products',      JSON.stringify(DB.products));
  localStorage.setItem('faqous_orders',        JSON.stringify(DB.orders));
  localStorage.setItem('faqous_notifications', JSON.stringify(DB.notifications));
  localStorage.setItem('faqous_counter',       DB.orderCounter);
  localStorage.setItem('faqous_settings',      JSON.stringify(DB.settings));
}

function loadData() {
  const products      = localStorage.getItem('faqous_products');
  const orders        = localStorage.getItem('faqous_orders');
  const notifications = localStorage.getItem('faqous_notifications');
  const counter       = localStorage.getItem('faqous_counter');
  const settings      = localStorage.getItem('faqous_settings');

  if (products)      DB.products      = JSON.parse(products);
  if (orders)        DB.orders        = JSON.parse(orders);
  if (notifications) DB.notifications = JSON.parse(notifications);
  if (counter)       DB.orderCounter  = parseInt(counter);
  if (settings)      Object.assign(DB.settings, JSON.parse(settings));
}

// ─── أدوات مساعدة مشتركة ─────────────────────────────────────
function formatPrice(amount) {
  return amount.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' جنيه';
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleString('ar-EG', {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function getStatusClass(status) {
  const map = {
    'جديد':           'status-new',
    'جاري التجهيز':   'status-prep',
    'خرج للتوصيل':   'status-delivery',
    'تم التسليم':     'status-done',
    'ملغي':           'status-cancel',
  };
  return 'status ' + (map[status] || 'status-new');
}

function buildWhatsAppText(order) {
  const lines = order.items.map(i =>
    `• ${i.name} — ${i.qty} ${i.unit} × ${i.price} = ${(i.price * i.qty).toFixed(2)} ج`
  ).join('\n');

  return (
    `🛒 طلب جديد #${order.id}\n\n` +
    `👤 ${order.fullName}\n` +
    `📱 ${order.whatsapp}\n` +
    `📍 ${order.zone} — ${order.street} — ${order.houseNumber}` +
    (order.floor     ? ` — دور ${order.floor}`      : '') +
    (order.apartment ? ` — شقة ${order.apartment}`  : '') + '\n' +
    (order.landmark  ? `🏠 ${order.landmark}\n`      : '') +
    (order.notes     ? `📝 ${order.notes}\n`         : '') +
    `\n📦 المنتجات:\n${lines}\n\n` +
    `💰 المنتجات: ${order.subtotal.toFixed(2)} ج\n` +
    `🚚 التوصيل: ${order.deliveryFee} ج\n` +
    `✅ الإجمالي: ${order.total.toFixed(2)} جنيه`
  );
}

// تشغيل loadData فور تحميل الملف
loadData();
