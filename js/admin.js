// js/admin.js
// منطق لوحة الإدارة بالكامل ومطوّر لتجنب التجميد

const ADMIN_PASSWORD = 'admin123';
let adminAuthed      = false;
let orderFilter      = '';
let prodCatFilter    = 0;

function adminLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('admin-pass').value;
  if (pass !== ADMIN_PASSWORD) {
    showAdminToast('كلمة المرور غير صحيحة', 'error');
    return;
  }
  adminAuthed = true;
  localStorage.setItem('faqous_admin_auth', '1');
  document.getElementById('admin-login').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');
  initAdminDashboard();
}

function adminLogout() {
  adminAuthed = false;
  localStorage.removeItem('faqous_admin_auth');
  document.getElementById('admin-login').classList.remove('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
  document.getElementById('admin-pass').value = '';
}

function checkAdminAuth() {
  if (localStorage.getItem('faqous_admin_auth') === '1') {
    adminAuthed = true;
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    initAdminDashboard();
  }
}

function showAdminToast(msg, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el        = document.createElement('div');
  const icons     = { success: '✅', error: '❌', default: 'ℹ️' };
  el.className    = `toast toast-${type}`;
  el.innerHTML    = `<span>${icons[type] || ''}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(20px)';
    el.style.transition = 'all .3s';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function openModal(title, bodyHTML, large = false) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML    = bodyHTML;
  document.getElementById('modal-box').className     = large ? 'modal-box modal-lg' : 'modal-box';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function showAdminPage(page, linkEl) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));
  const pageTarget = document.getElementById(`admin-page-${page}`);
  if (pageTarget) pageTarget.classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (linkEl) {
    linkEl.classList.add('active');
  } else {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(l => {
      if (l.getAttribute('onclick') && l.getAttribute('onclick').includes(`'${page}'`)) {
        l.classList.add('active');
      }
    });
  }

  const titles = {
    dashboard: 'الرئيسية',
    orders:    'الطلبات',
    products:  'المنتجات',
    settings:  'الإعدادات',
  };
  document.getElementById('admin-page-title').textContent = titles[page] || '';

  if (page === 'dashboard') renderDashboard();
  if (page === 'orders')    renderOrders();
  if (page === 'products')  renderProducts();
  if (page === 'settings')  loadSettings();
}

function initAdminDashboard() {
  renderDashboard();
  renderNotifBadge();
  renderNotifList();
  loadSettings();

  document.getElementById('modal-overlay')
    .addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

  setInterval(() => {
    loadData();
    renderNotifBadge();
    renderNotifList();
    const activePage = document.querySelector('.admin-page:not(.hidden)');
    if (activePage?.id === 'admin-page-dashboard') renderDashboard();
    if (activePage?.id === 'admin-page-orders')    renderOrders();
  }, 30000);
}

function renderDashboard() {
  loadData();
  const today = new Date().toDateString();

  const newCount     = DB.orders.filter(o => o.status === 'جديد').length;
  const todayCount   = DB.orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
  const activeProds  = DB.products.filter(p => p.active).length;
  const totalSales   = DB.orders
    .filter(o => o.status === 'تم التسليم')
    .reduce((s, o) => s + o.total, 0);

  document.getElementById('stat-new').textContent      = newCount;
  document.getElementById('stat-today').textContent    = todayCount;
  document.getElementById('stat-products').textContent = activeProds;
  document.getElementById('stat-sales').textContent    = totalSales.toFixed(0) + ' ج';

  const el = document.getElementById('dash-recent-orders');
  if (!DB.orders.length) {
    el.innerHTML = `<p style="text-align:center;padding:20px;color:#9ca3af;font-size:14px">لا توجد طلبات بعد</p>`;
    return;
  }

  el.innerHTML = DB.orders.slice(0, 5).map(o => `
    <div class="dash-order-row">
      <div>
        <p class="dash-order-name" style="font-weight:700;">طلب #${o.id} — ${o.fullName}</p>
        <p class="dash-order-time">${formatTime(o.createdAt)}</p>
      </div>
      <span class="${getStatusClass(o.status)}">${o.status}</span>
      <span class="dash-order-total" style="font-weight:700; color:var(--green);">${o.total.toFixed(2)} ج</span>
    </div>
  `).join('');
}

const ALL_STATUSES = ['جديد', 'جاري التجهيز', 'خرج للتوصيل', 'تم التسليم', 'ملغي'];

function renderOrders() {
  loadData();

  document.getElementById('order-filters').innerHTML =
    ['', ...ALL_STATUSES].map(s => `
      <button class="filter-pill ${orderFilter === s ? 'active' : ''}" onclick="setOrderFilter('${s}')">
        ${s || 'الكل'}
      </button>
    `).join('');

  const list     = document.getElementById('orders-list');
  const filtered = orderFilter ? DB.orders.filter(o => o.status === orderFilter) : DB.orders;

  if (!filtered.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><p class="empty-text">لا توجد طلبات</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(o => `
    <div class="order-card" onclick="viewOrder(${o.id})">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:800;font-size:15px">طلب #${o.id}</span>
        <span class="${getStatusClass(o.status)}">${o.status}</span>
      </div>
      <p style="font-size:14px;font-weight:600;margin-bottom:4px">${o.fullName}</p>
      <p style="color:var(--gray-500);font-size:12px;margin-bottom:8px">${formatTime(o.createdAt)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--gray-200);padding-top:8px">
        <span style="font-size:12px;color:var(--gray-500)">${o.items.length} منتجات</span>
        <span style="font-weight:700;color:var(--green)">${o.total.toFixed(2)} ج</span>
      </div>
    </div>
  `).join('');
}

function setOrderFilter(status) {
  orderFilter = status;
  renderOrders();
}

function viewOrder(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o) return;

  const itemsHTML = o.items.map(i => `
    <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-100);font-size:14px">
      <span>• ${i.name} × ${i.qty} ${i.unit}</span>
      <span>${(i.price * i.qty).toFixed(2)} ج</span>
    </div>
  `).join('');

  const html = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card" style="padding:14px">
        <h4 style="margin-bottom:8px;font-size:14px;">بيانات العميل</h4>
        <p style="font-size:14px"><b>الاسم:</b> ${o.fullName}</p>
        <p style="font-size:14px"><b>واتساب:</b> ${o.whatsapp}</p>
        <p style="font-size:14px"><b>هاتف إضافي:</b> ${o.phoneExtra || 'لا يوجد'}</p>
        <p style="font-size:14px"><b>العنوان:</b> ${o.zone} — ${o.street} — منزل ${o.houseNumber} — دور ${o.floor || 'غير محدد'} — شقة ${o.apartment || 'غير محدد'}</p>
        <p style="font-size:14px"><b>علامة مميزة:</b> ${o.landmark || 'لا يوجد'}</p>
        <p style="font-size:14px"><b>ملاحظات:</b> ${o.notes || 'لا يوجد'}</p>
      </div>
      <div class="card" style="padding:14px">
        <h4 style="margin-bottom:8px;font-size:14px;">المنتجات المطلوبة</h4>
        ${itemsHTML}
        <div style="margin-top:10px;text-align:left;font-weight:700">
          <p>المجموع: ${o.subtotal.toFixed(2)} ج</p>
          <p>التوصيل: ${o.deliveryFee} ج</p>
          <p style="color:var(--green);font-size:16px">الإجمالي: ${o.total.toFixed(2)} ج</p>
        </div>
      </div>
      <div>
        <h4 style="margin-bottom:8px;font-size:14px;">تحديث حالة الطلب</h4>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${ALL_STATUSES.map(s => `
            <button class="btn btn-sm ${o.status === s ? 'btn-primary' : 'btn-ghost'}" onclick="changeStatus(${o.id}, '${s}')">
              ${s}
            </button>
          `).join('')}
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button class="btn btn-outline btn-md w-full" onclick="copyOrder(${o.id})">📋 نسخ الطلب</button>
        <button class="btn btn-primary btn-md w-full" style="background:#25d366" onclick="sendToWhatsApp(${o.id})">💬 إرسال واتساب</button>
      </div>
    </div>
  `;
  openModal(`تفاصيل الطلب #${o.id}`, html, true);
}

function changeStatus(orderId, status) {
  const o = DB.orders.find(x => x.id === orderId);
  if (o) {
    o.status = status;
    saveData();
    showAdminToast('تم تحديث الحالة بنجاح', 'success');
    renderDashboard();
    renderOrders();
    closeModal();
  }
}

function copyOrder(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o) return;
  const lines = o.items.map(i => `${i.name} x ${i.qty} ${i.unit}`).join('\n');
  const txt = `طلب رقم #${o.id}\nالعميل: ${o.fullName}\nالهاتف: ${o.whatsapp}\nالعنوان: ${o.zone}، ${o.street}\nالمنتجات:\n${lines}\nالإجمالي: ${o.total} جنيه`;
  navigator.clipboard.writeText(txt).then(() => {
    showAdminToast('تم نسخ بيانات الطلب للحافظة', 'success');
  });
}

function sendToWhatsApp(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o) return;
  const url = `https://wa.me/${o.whatsapp}?text=${buildWhatsAppText(o)}`;
  window.open(url, '_blank');
}

function renderProducts() {
  loadData();
  const select = document.getElementById('prod-cat-filter');
  if (select && select.children.length <= 1) {
    select.innerHTML = '<option value="0">كل الأقسام</option>' + DB.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  const grid = document.getElementById('products-grid');
  const filtered = prodCatFilter ? DB.products.filter(p => p.catId === parseInt(prodCatFilter)) : DB.products;

  grid.innerHTML = filtered.map(p => `
    <div class="prod-admin-card ${p.active ? '' : 'disabled'}">
      <div style="font-size:24px;margin-bottom:6px">${p.icon}</div>
      <p style="font-weight:700;font-size:14px">${p.name}</p>
      <p style="color:var(--green);font-weight:700;font-size:13px">${p.price} ج / ${p.unit}</p>
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn btn-sm btn-outline" style="flex:1" onclick="openProductModal(${p.id})">✏️ تعديل</button>
        <button class="btn btn-sm ${p.active ? 'btn-primary' : 'btn-ghost'}" onclick="toggleProduct(${p.id})">
          ${p.active ? '👁️ نشط' : '❌ معطل'}
        </button>
      </div>
    </div>
  `).join('');
}

function setProdFilter(val) {
  prodCatFilter = parseInt(val);
  renderProducts();
}

function toggleProduct(id) {
  const p = DB.products.find(x => x.id === id);
  if (p) {
    p.active = !p.active;
    saveData();
    renderProducts();
    showAdminToast('تم تغيير حالة المنتج', 'success');
  }
}

function openProductModal(id = null) {
  const isEdit = id !== null;
  const product = isEdit ? DB.products.find(x => x.id === id) : null;
  const title = isEdit ? 'تعديل منتج' : 'إضافة منتج جديد';

  const catOptions = DB.categories.map(c => `<option value="${c.id}" ${product && product.catId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  const units = ['كيلو', 'لتر', 'علبة', 'كرتونة', 'حبة'];
  const unitOptions = units.map(u => `<option value="${u}" ${product && product.unit === u ? 'selected' : ''}>${u}</option>`).join('');

  const html = `
    <form id="prod-form" onsubmit="saveProduct(event, ${id})" style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">اسم المنتج</label>
        <input class="input" id="pf-name" value="${isEdit ? product.name : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">القسم</label>
        <select class="input" id="pf-cat" required>${catOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">السعر (جنيه)</label>
        <input class="input" type="number" step="0.01" id="pf-price" value="${isEdit ? product.price : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">الوحدة</label>
        <select class="input" id="pf-unit" required>${unitOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">الأيقونة (Emoji)</label>
        <input class="input" id="pf-icon" value="${isEdit ? product.icon : '📦'}" required />
      </div>
      <button type="submit" class="btn btn-primary btn-md w-full">💾 حفظ المنتج</button>
    </form>
  `;
  openModal(title, html);
}

function saveProduct(e, id) {
  e.preventDefault();
  const name = document.getElementById('pf-name').value.trim();
  const catId = parseInt(document.getElementById('pf-cat').value);
  const price = parseFloat(document.getElementById('pf-price').value);
  const unit = document.getElementById('pf-unit').value;
  const icon = document.getElementById('pf-icon').value.trim();

  if (id === null) {
    const newId = DB.products.length ? Math.max(...DB.products.map(p => p.id)) + 1 : 1;
    DB.products.push({ id: newId, catId, name, price, unit, icon, active: true });
    showAdminToast('تم إضافة المنتج الجديد بنجاح', 'success');
  } else {
    const p = DB.products.find(x => x.id === id);
    if (p) {
      p.name = name;
      p.catId = catId;
      p.price = price;
      p.unit = unit;
      p.icon = icon;
      showAdminToast('تم تعديل المنتج بنجاح', 'success');
    }
  }
  saveData();
  renderProducts();
  closeModal();
}

function loadSettings() {
  document.getElementById('set-name').value = DB.settings.storeName;
  document.getElementById('set-wa').value   = DB.settings.whatsapp;
  document.getElementById('set-fee').value  = DB.settings.deliveryFee;
  
  const btn = document.getElementById('set-open-btn');
  if (DB.settings.storeOpen) {
    btn.className = 'btn btn-primary';
    btn.textContent = 'المتجر مفتوح الآن';
  } else {
    btn.className = 'btn btn-outline';
    btn.textContent = 'المتجر مغلق حالياً';
  }
}

function toggleStoreSetting() {
  DB.settings.storeOpen = !DB.settings.storeOpen;
  loadSettings();
}

function saveSettings() {
  DB.settings.storeName = document.getElementById('set-name').value.trim();
  DB.settings.whatsapp  = document.getElementById('set-wa').value.trim();
  DB.settings.deliveryFee = parseFloat(document.getElementById('set-fee').value) || 0;
  saveData();
  showAdminToast('تم حفظ الإعدادات بنجاح', 'success');
}

function renderNotifBadge() {
  const unread = DB.notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) {
    if (unread > 0) {
      badge.textContent = unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

function renderNotifList() {
  const container = document.getElementById('notif-items');
  if (!container) return;
  if (!DB.notifications.length) {
    container.innerHTML = `<p style="padding:10px;text-align:center;color:var(--gray-400);font-size:12px">لا توجد إشعارات</p>`;
    return;
  }
  container.innerHTML = DB.notifications.slice(0, 10).map(n => `
    <div class="notif-item ${n.read ? 'read' : ''}" onclick="readNotif(${n.id})">
      <p style="font-weight:700;font-size:13px">${n.title}</p>
      <p style="font-size:12px;color:var(--gray-500)">${n.body}</p>
    </div>
  `).join('');
}

function toggleNotifDrop() {
  document.getElementById('notif-drop').classList.toggle('hidden');
}

function readNotif(id) {
  const n = DB.notifications.find(x => x.id === id);
  if (n) { n.read = true; saveData(); }
  renderNotifBadge();
  renderNotifList();
  document.getElementById('notif-drop').classList.add('hidden');
  const o = DB.orders.find(x => x.id === n?.orderId);
  if (o) { showAdminPage('orders', null); viewOrder(o.id); }
}

function markAllRead() {
  DB.notifications.forEach(n => n.read = true);
  saveData();
  renderNotifBadge();
  renderNotifList();
}

window.addEventListener('DOMContentLoaded', checkAdminAuth);