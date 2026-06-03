// js/db.js
// قاعدة البيانات المشتركة بين المتجر والإدارة - مع معالجة الحفظ التلقائي والتهيئة

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
    { id: 1,  catId: 1, name: 'طماطم فاخرة',  price: 15,   unit: 'كيلو',    icon: '🍅', active: true },
    { id: 2,  catId: 1, name: 'بطاطس تحمير',  price: 12,   unit: 'كيلو',    icon: '🥔', active: true },
    { id: 3,  catId: 1, name: 'بصل أحمر',    price: 10,   unit: 'كيلو',    icon: '🧅', active: true },
    { id: 4,  catId: 2, name: 'تفاح أحمر',    price: 50,   unit: 'كيلو',    icon: '🍎', active: true },
    { id: 5,  catId: 2, name: 'موز بلدي',     price: 20,   unit: 'كيلو',    icon: '🍌', active: true },
    { id: 6,  catId: 3, name: 'لحم بقري طازج', price: 380,  unit: 'كيلو',    icon: '🥩', active: true },
    { id: 7,  catId: 6, name: 'طبق بيض أبيض', price: 150,  unit: 'كرتونة',  icon: '🥚', active: true },
    { id: 8,  catId: 6, name: 'لبن جاموسي طازج', price: 30,  unit: 'لتر',    icon: '🥛', active: true }
  ],
  orders: [],
  notifications: [],
  settings: {
    storeName: 'سوق فاقوس',
    whatsapp: '201026412140', // يمكنك تعديله من الإعدادات لاحقاً
    deliveryFee: 15,
    storeOpen: true
  },
  orderCounter: 1000
};

function loadData() {
  const data = localStorage.getItem('faqous_db');
  if (data) {
    const parsed = JSON.parse(data);
    DB.products = parsed.products || DB.products;
    DB.orders = parsed.orders || DB.orders;
    DB.notifications = parsed.notifications || DB.notifications;
    DB.settings = parsed.settings || DB.settings;
    DB.orderCounter = parsed.orderCounter || DB.orderCounter;
  }
}

function saveData() {
  localStorage.setItem('faqous_db', JSON.stringify({
    products: DB.products,
    orders: DB.orders,
    notifications: DB.notifications,
    settings: DB.settings,
    orderCounter: DB.orderCounter
  }));
}

function formatPrice(amount) {
  return amount.toFixed(2) + ' جنيه';
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

  return encodeURIComponent(
    `🛒 *طلب جديد من سوق فاقوس #${order.id}*\n\n` +
    `👤 *الاسم:* ${order.fullName}\n` +
    `📱 *واتساب:* ${order.whatsapp}\n` +
    `📱 *هاتف إضافي:* ${order.phoneExtra || 'لا يوجد'}\n` +
    `📍 *العنوان:* ${order.zone} — الشارع: ${order.street} — منزل رقم: ${order.houseNumber}` +
    (order.floor     ? ` — دور: ${order.floor}`      : '') +
    (order.apartment ? ` — شقة: ${order.apartment}`  : '') +
    (order.landmark  ? `\n🗺️ *علامة مميزة:* ${order.landmark}` : '') +
    (order.notes     ? `\n📝 *ملاحظات:* ${order.notes}` : '') +
    `\n\n📋 *المنتجات المطلوبة:*\n${lines}\n\n` +
    `💵 *إجمالي المنتجات:* ${order.subtotal.toFixed(2)} جنيه\n` +
    `🚴 *رسوم التوصيل الكلية:* ${order.deliveryFee.toFixed(2)} جنيه\n` +
    `💰 *الإجمالي النهائي المطلوب الدفع عند الاستلام:* ${order.total.toFixed(2)} جنيه\n\n` +
    `شكراً لتسوقك معنا في سوق فاقوس! ✨`
  );
}

// تحميل فوري للبيانات
loadData();