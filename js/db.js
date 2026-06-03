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
    { id: 1,  catId: 1, name: 'طماطم',       price: 8,   unit: 'كيلو',    icon: '🍅', img: '', active: true },
    { id: 2,  catId: 1, name: 'بطاطس',       price: 10,  unit: 'كيلو',    icon: '🥔', img: '', active: true },
    { id: 3,  catId: 1, name: 'بصل',         price: 7,   unit: 'كيلو',    icon: '🧅', img: '', active: true },
    { id: 4,  catId: 1, name: 'خيار',        price: 12,  unit: 'كيلو',    icon: '🥒', img: '', active: true },
    { id: 5,  catId: 1, name: 'فلفل',        price: 15,  unit: 'كيلو',    icon: '🫑', img: '', active: true },
    { id: 6,  catId: 1, name: 'جزر',         price: 9,   unit: 'كيلو',    icon: '🥕', img: '', active: true },
    { id: 7,  catId: 1, name: 'كوسة',        price: 11,  unit: 'كيلو',    icon: '🥬', img: '', active: true },
    { id: 8,  catId: 1, name: 'ملوخية',      price: 14,  unit: 'كيلو',    icon: '🌿', img: '', active: true },
    // فواكه
    { id: 9,  catId: 2, name: 'مانجو',       price: 25,  unit: 'كيلو',    icon: '🥭', img: '', active: true },
    { id: 10, catId: 2, name: 'برتقال',      price: 12,  unit: 'كيلو',    icon: '🍊', img: '', active: true },
    { id: 11, catId: 2, name: 'موز',         price: 15,  unit: 'كيلو',    icon: '🍌', img: '', active: true },
    { id: 12, catId: 2, name: 'تفاح',        price: 20,  unit: 'كيلو',    icon: '🍎', img: '', active: true },
    { id: 13, catId: 2, name: 'عنب',         price: 30,  unit: 'كيلو',    icon: '🍇', img: '', active: true },
    // لحوم
    { id: 14, catId: 3, name: 'لحم بقري مفروم', price: 280, unit: 'كيلو',   icon: '🥩', img: '', active: true },
    { id: 15, catId: 3, name: 'مكعبات لحم كندوز', price: 320, unit: 'كيلو',  icon: '🥩', img: '', active: true },
    { id: 16, catId: 3, name: 'ريش ضاني',     price: 350, unit: 'كيلو',   icon: '🥩', img: '', active: true },
    { id: 17, catId: 3, name: 'كبدة بقري',     price: 290, unit: 'كيلو',   icon: '🥩', img: '', active: true },
    // دواجن
    { id: 18, catId: 4, name: 'فراخ بلدي',     price: 110, unit: 'كيلو',   icon: '🐓', img: '', active: true },
    { id: 19, catId: 4, name: 'بانيه دجاج',     price: 210, unit: 'كيلو',   icon: '🍗', img: '', active: true },
    { id: 20, catId: 4, name: 'أوراك دجاج',     price: 95,  unit: 'كيلو',   icon: '🍗', img: '', active: true },
    // أسماك
    { id: 21, catId: 5, name: 'سمك بلطي شبار', price: 85,  unit: 'كيلو',   icon: '🐟', img: '', active: true },
    { id: 22, catId: 5, name: 'سمك بوري طازج', price: 140, unit: 'كيلو',   icon: '🐟', img: '', active: true },
    { id: 23, catId: 5, name: 'جمبري وسط',    price: 380, unit: 'كيلو',   icon: '🦐', img: '', active: true },
    // ألبان وبيض
    { id: 24, catId: 6, name: 'جبنة قريش فلاحي', price: 60,  unit: 'كيلو',   icon: '🧀', img: '', active: true },
    { id: 25, catId: 6, name: 'لبن جاموسي طازج', price: 25,  unit: 'لتر',    icon: '🥛', img: '', active: true },
    { id: 26, catId: 6, name: 'كرتونة بيض أحمر', price: 150, unit: 'كرتونة', icon: '🥚', img: '', active: true },
    // عطارة وحبوب
    { id: 27, catId: 7, name: 'أرز مصري فاخر',  price: 30,  unit: 'كيلو',   icon: '🌾', img: '', active: true },
    { id: 28, catId: 7, name: 'مكرونة لمتنا',    price: 24,  unit: 'كيلو',   icon: '🌾', img: '', active: true }
  ],

  orders: [],
  notifications: [],
  settings: {
    storeName: 'سوق فاقوس',
    whatsapp: '201000000000',
    deliveryFee: 15,
    storeOpen: true
  }
};

// تحميل البيانات وحفظها بـ LocalStorage
function loadData() {
  const localDB = localStorage.getItem('faqous_market_db');
  if (localDB) {
    try {
      const parsed = JSON.parse(localDB);
      if (parsed.products) DB.products = parsed.products;
      if (parsed.orders) DB.orders = parsed.orders;
      if (parsed.notifications) DB.notifications = parsed.notifications;
      if (parsed.settings) DB.settings = parsed.settings;
    } catch (e) {
      console.error("خطأ في قراءة LocalStorage", e);
    }
  } else {
    saveData();
  }
}

function saveData() {
  localStorage.setItem('faqous_market_db', JSON.stringify(DB));
}

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
    `👤 الاسم: ${order.fullName}\n` +
    `📱 واتساب: ${order.whatsapp}\n` +
    `📍 العنوان: ${order.zone} — ${order.street} — منزل رقم ${order.houseNumber}` +
    (order.floor     ? ` — دور ${order.floor}`      : '') +
    (order.apartment ? ` — شقة ${order.apartment}`  : '') +
    (order.landmark  ? `\n🗺️ علامة مميزة: ${order.landmark}` : '') +
    (order.notes     ? `\n📝 ملاحظات: ${order.notes}` : '') +
    `\n\n📋 المنتجات المطلوبة:\n${lines}\n\n` +
    `💵 المجموع: ${order.subtotal.toFixed(2)} ج\n` +
    `🛵 مصاريف التوصيل: ${order.deliveryFee.toFixed(2)} ج\n` +
    `💰 الإجمالي النهائي: ${order.total.toFixed(2)} ج`
  );
}

// تحميل أولي للبيانات
loadData();