// js/db.js
// قاعدة البيانات المشتركة بين المتجر والإدارة - نسخة سوبابيز السحابية

const SUPABASE_URL = "https://ssumsqxmaqouivamvaw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzdW1zcXhtYXFvaXVpdmFtdmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTEwMzcsImV4cCI6MjA5NjA4NzAzN30.GPplQ7IOExRJOnvRFaNV5suoRS-TkzWZ7iTG3tlxN7U";

// تهيئة اتصال سوبابيز
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// الكائن الرئيسي لحفظ البيانات مؤقتاً في الرام أثناء تشغيل الصفحة
const DB = {
  categories: [],
  products: [],
  orders: [],
  notifications: [],
  settings: {
    storeName:   'سوق فاقوس',
    whatsapp:    '',
    deliveryFee: 15,
    storeOpen:   true,
  },
};

// ─── جلب البيانات من سوبابيز (Async Load) ───────────────────
// ملحوظة: جلب البيانات من الإنترنت يحتاج جزء من الثانية، لذلك نستخدم async/await
async function loadData() {
  try {
    // 1. جلب الأقسام
    const { data: cats, error: e1 } = await supabaseClient.from('categories').select('*').order('id');
    if (!e1 && cats) DB.categories = cats;

    // 2. جلب المنتجات النشطة فقط للمتجر
    const { data: prods, error: e2 } = await supabaseClient.from('products').select('*').order('id');
    if (!e2 && prods) DB.products = prods;

    // 3. جلب الإعدادات (الصف الأول دائماً)
    const { data: setts, error: e3 } = await supabaseClient.from('settings').select('*').eq('id', 1).single();
    if (!e3 && setts) DB.settings = setts;

    // 4. جلب الطلبات والإشعارات
    const { data: ords, error: e4 } = await supabaseClient.from('orders').select('*').order('createdAt', { ascending: false });
    if (!e4 && ords) DB.orders = ords;

    const { data: notifs, error: e5 } = await supabaseClient.from('notifications').select('*').order('time', { ascending: false });
    if (!e5 && notifs) DB.notifications = notifs;

    console.log("✅ تم مزامنة البيانات بنجاح من سوبابيز!");
    return true;
  } catch (error) {
    console.error("❌ فشل في جلب البيانات من سوبابيز:", error);
    return false;
  }
}

// ─── دالات الحفظ والإرسال الجديدة ───────────────────────────

// عند إرسال طلب جديد من المتجر
async function sendNewOrder(orderData) {
  // نحذف الـ id المؤقت ليقوم السيستم في سوبابيز بتوليده تلقائياً بشكل فريد مرتب
  const { id, ...cleanOrder } = orderData;
  
  const { data, error } = await supabaseClient
    .from('orders')
    .insert([cleanOrder])
    .select()
    .single();

  if (error) {
    console.error("خطأ أثناء إرسال الطلب:", error);
    throw error;
  }
  
  // تحديث القائمة المحلية بالطلب الجديد
  DB.orders.unshift(data);
  return data; // يرجع الطلب بالـ ID الحقيقي الجديد
}

// عند إضافة إشعار جديد في السيستم
async function sendNotification(title, body, orderId) {
  const { data, error } = await supabaseClient
    .from('notifications')
    .insert([{ title, body, orderId, read: false }])
    .select()
    .single();

  if (error) console.error("خطأ في الإشعار:", error);
  return data;
}

// تحديث حالة طلب (مثلاً من جديد إلى جاري التجهيز) من لوحة الآدمن
async function updateOrderStatus(orderId, newStatus) {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) console.error("خطأ في تحديث الحالة:", error);
}

// تحديث إعدادات المتجر من لوحة التحكم
async function saveStoreSettings(updatedSettings) {
  const { error } = await supabaseClient
    .from('settings')
    .update(updatedSettings)
    .eq('id', 1);

  if (error) {
    console.error("خطأ في حفظ الإعدادات:", error);
    throw error;
  }
  Object.assign(DB.settings, updatedSettings);
}


// ─── أدوات مساعدة مشتركة (كما هي بدون تغيير) ─────────────────────
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