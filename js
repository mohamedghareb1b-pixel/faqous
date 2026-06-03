// js/admin.js
// منطق لوحة الإدارة — يُستخدم في admin.html فقط

const ADMIN_PASSWORD = 'admin123';
let adminAuthed      = false;
let orderFilter      = '';
let prodCatFilter    = 0;

// ─── Auth ─────────────────────────────────────────────────────
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

// ─── Toast ────────────────────────────────────────────────────
function showAdminToast(msg, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
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

// ─── Modal ────────────────────────────────────────────────────
function openModal(title, bodyHTML, large = false) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML    = bodyHTML;
  document.getElementById('modal-box').className     = large ? 'modal-box modal-lg' : 'modal-box';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ─── Sidebar ─────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('admin-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

// ─── Page Navigation ──────────────────────────────────────────
function showAdminPage(page, linkEl) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`admin-page-${page}`).classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
  else {
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

  closeSidebar();
}

// ─── Init ─────────────────────────────────────────────────────
function initAdminDashboard() {
  renderDashboard();
  renderNotifBadge();
  renderNotifList();
  loadSettings();

  document.getElementById('modal-overlay')
    .addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

  // Polling: تحقق من طلبات جديدة كل 30 ثانية
  setInterval(() => {
    loadData();
    renderNotifBadge();
    renderNotifList();
    const activePage = document.querySelector('.admin-page:not(.hidden)');
    if (activePage?.id === 'admin-page-dashboard') renderDashboard();
    if (activePage?.id === 'admin-page-orders')    renderOrders();
  }, 30000);
}

// ─── Dashboard ────────────────────────────────────────────────
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
    el.innerHTML = `<p style="text-align:center;padding:20px;color:#9ca3af;font-size:14px">
      لا توجد طلبات بعد</p>`;
    return;
  }

  el.innerHTML = DB.orders.slice(0, 5).map(o => `
    <div class="dash-order-row">
      <div>
        <p class="dash-order-name">طلب #${o.id} — ${o.fullName}</p>
        <p class="dash-order-time">${formatTime(o.createdAt)}</p>
      </div>
      <span class="${getStatusClass(o.status)}">${o.status}</span>
      <span class="dash-order-total">${o.total.toFixed(2)} ج</span>
    </div>
  `).join('');
}

// ─── Orders ───────────────────────────────────────────────────
const ALL_STATUSES = ['جديد', 'جاري التجهيز', 'خرج للتوصيل', 'تم التسليم', 'ملغي'];

function renderOrders() {
  loadData();

  // Filters
  document.getElementById('order-filters').innerHTML =
    ['', ...ALL_STATUSES].map(s => `
      <button class="filter-pill ${orderFilter === s ? 'active' : ''}"
        onclick="setOrderFilter('${s}')">
        ${s || 'الكل'}
      </button>
    `).join('');

  const list     = document.getElementById('orders-list');
  const filtered = orderFilter
    ? DB.orders.filter(o => o.status === orderFilter)
    : DB.orders;

  if (!filtered.length) {
    list.innerHTML = `<div class="empty">
      <div class="empty-icon">📋</div>
      <p class="empty-text">لا توجد طلبات</p>
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(o => `
    <div class="card order-card">
      <div class="order-row">
        <span class="order-num">طلب #${o.id}</span>
        <span class="order-name">${o.fullName}</span>
        <span class="order-total">${o.total.toFixed(2)} ج</span>
        <span class="${getStatusClass(o.status)}">${o.status}</span>
        <button class="btn btn-outline btn-sm" onclick="viewOrder(${o.id})">
          عرض المزيد
        </button>
      </div>
    </div>
  `).join('');
}

function setOrderFilter(s) {
  orderFilter = s;
  renderOrders();
}

function viewOrder(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;

  const html = `
    <div class="order-detail">

      <div class="detail-grid">
        <div class="detail-item">
          <p class="d-label">الاسم</p>
          <p class="d-val">${o.fullName}</p>
        </div>
        <div class="detail-item">
          <p class="d-label">واتساب</p>
          <p class="d-val" dir="ltr">${o.whatsapp}</p>
        </div>
        ${o.phoneExtra ? `
        <div class="detail-item">
          <p class="d-label">رقم إضافي</p>
          <p class="d-val" dir="ltr">${o.phoneExtra}</p>
        </div>` : ''}
        <div class="detail-item detail-full">
          <p class="d-label">العنوان</p>
          <p class="d-val">
            ${o.zone} — ${o.street} — ${o.houseNumber}
            ${o.floor     ? ' — دور '  + o.floor      : ''}
            ${o.apartment ? ' — شقة '  + o.apartment  : ''}
          </p>
        </div>
        ${o.landmark ? `
        <div class="detail-item detail-full">
          <p class="d-label">أقرب علامة</p>
          <p class="d-val">${o.landmark}</p>
        </div>` : ''}
        ${o.notes ? `
        <div class="detail-item detail-full">
          <p class="d-label">ملاحظات</p>
          <p class="d-val">${o.notes}</p>
        </div>` : ''}
        <div class="detail-item">
          <p class="d-label">وقت الطلب</p>
          <p class="d-val">${formatTime(o.createdAt)}</p>
        </div>
      </div>

      <div class="order-items-section">
        <p class="section-sub-title">المنتجات</p>
        ${o.items.map(i => `
          <div class="order-item-row">
            <span>${i.name} × ${i.qty} ${i.unit}</span>
            <span>${(i.price * i.qty).toFixed(2)} ج</span>
          </div>
        `).join('')}
        <div class="order-item-row muted">
          <span>التوصيل</span><span>${o.deliveryFee} ج</span>
        </div>
        <div class="order-item-row order-grand-total">
          <span>الإجمالي</span><span>${o.total.toFixed(2)} جنيه</span>
        </div>
      </div>

      <div class="status-section">
        <p class="section-sub-title">تغيير الحالة</p>
        <div class="status-btns">
          ${ALL_STATUSES.map(s => `
            <button class="btn btn-sm ${o.status === s ? 'btn-primary' : 'btn-ghost'}"
              id="sbtn-${s}"
              onclick="changeStatus(${o.id}, '${s}')">
              ${s}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="action-btns">
        <button class="btn btn-outline btn-md" onclick="copyOrder(${o.id})">
          📋 نسخ الطلب
        </button>
        <button class="btn btn-wa btn-md" onclick="sendToWhatsApp(${o.id})">
          💬 إرسال واتساب
        </button>
      </div>
    </div>
  `;

  openModal(`طلب #${o.id} — ${o.fullName}`, html, true);
}

function changeStatus(orderId, newStatus) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  o.status = newStatus;
  saveData();

  // تحديث أزرار الحالة داخل المودال
  ALL_STATUSES.forEach(s => {
    const btn = document.getElementById(`sbtn-${s}`);
    if (!btn) return;
    btn.className = `btn btn-sm ${s === newStatus ? 'btn-primary' : 'btn-ghost'}`;
  });

  showAdminToast('تم تحديث حالة الطلب', 'success');
  renderOrders();
  renderDashboard();
}

function copyOrder(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  navigator.clipboard.writeText(buildWhatsAppText(o))
    .then(() => showAdminToast('تم نسخ الطلب', 'success'));
}

function sendToWhatsApp(orderId) {
  const o     = DB.orders.find(x => x.id === orderId);
  if (!o) return;
  const text  = encodeURIComponent(buildWhatsAppText(o));
  const phone = o.whatsapp.replace(/\D/g, '');
  window.open(`[wa.me](https://wa.me/${phone}?text=${text})`, '_blank');
}

// ─── Products ─────────────────────────────────────────────────
function renderProducts() {
  loadData();

  document.getElementById('prod-filters').innerHTML =
    [{ id: 0, name: 'الكل', icon: '📦' }, ...DB.categories].map(c => `
      <button class="filter-pill ${prodCatFilter === c.id ? 'active' : ''}"
        onclick="setProdFilter(${c.id})">
        ${c.icon || ''} ${c.name}
      </button>
    `).join('');

  const filtered = prodCatFilter
    ? DB.products.filter(p => p.catId === prodCatFilter)
    : DB.products;

  document.getElementById('products-list').innerHTML = filtered.map(p => {
    const cat = DB.categories.find(c => c.id === p.catId);
    return `
      <div class="product-card admin-prod-card" style="opacity:${p.active ? 1 : .5}">
        <div class="product-img">${p.img ? `<img src="${p.img}" alt="${p.name}">` : p.icon}</div>
        <p class="product-name">${p.name}</p>
        <p class="product-price">${p.price} جنيه / ${p.unit}</p>
        <p class="prod-cat-label">${cat?.name || ''}</p>
        <div class="prod-actions">
          <button class="btn btn-outline btn-sm" onclick="openEditProduct(${p.id})">✏️</button>
          <button class="btn btn-sm ${p.active ? 'btn-ghost' : 'btn-primary'}"
            style="border:1px solid #e5e7eb"
            onclick="toggleProduct(${p.id})">
            ${p.active ? '⏸️' : '▶️'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function setProdFilter(id) {
  prodCatFilter = id;
  renderProducts();
}

function toggleProduct(id) {
  const p = DB.products.find(x => x.id === id);
  if (!p) return;
  p.active = !p.active;
  saveData();
  renderProducts();
  renderDashboard();
  showAdminToast(p.active ? 'تم تفعيل المنتج' : 'تم إيقاف المنتج');
}

function deleteProduct(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
  DB.products = DB.products.filter(x => x.id !== id);
  saveData();
  renderProducts();
  renderDashboard();
  showAdminToast('تم حذف المنتج', 'success');
}

function openAddProduct()    { openProductForm(null); }
function openEditProduct(id) { openProductForm(DB.products.find(x => x.id === id)); }

function openProductForm(product) {
  const isEdit = !!product;
  const units  = ['كيلو', 'لتر', 'علبة', 'كرتونة', 'حبة'];

  const html = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">اسم المنتج</label>
        <input class="input" id="pf-name" value="${isEdit ? product.name : ''}"
          placeholder="مثال: طماطم" required />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">السعر (جنيه)</label>
          <input class="input" type="number" id="pf-price"
            value="${isEdit ? product.price : ''}" min="0" step="0.5" required />
        </div>
        <div class="form-group">
          <label class="form-label">الوحدة</label>
          <select class="input" id="pf-unit">
            ${units.map(u => `
              <option ${isEdit && product.unit === u ? 'selected' : ''}>${u}</option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">القسم</label>
        <select class="input" id="pf-cat">
          ${DB.categories.map(c => `
            <option value="${c.id}"
              ${isEdit && product.catId === c.id ? 'selected' : ''}>
              ${c.icon} ${c.name}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">أيقونة (emoji)</label>
        <input class="input" id="pf-icon"
          value="${isEdit ? product.icon : '🛒'}" placeholder="🍅" />
      </div>
      <button class="btn btn-primary btn-lg w-full"
        onclick="saveProduct(${isEdit ? product.id : 'null'})">
        ${isEdit ? '💾 حفظ التعديلات' : '➕ إضافة المنتج'}
      </button>
    </div>
  `;

  openModal(isEdit ? `تعديل: ${product.name}` : 'إضافة منتج جديد', html);
}

function saveProduct(productId) {
  const name  = document.getElementById('pf-name').value.trim();
  const price = parseFloat(document.getElementById('pf-price').value);
  const unit  = document.getElementById('pf-unit').value;
  const catId = parseInt(document.getElementById('pf-cat').value);
  const icon  = document.getElementById('pf-icon').value.trim() || '🛒';

  if (!name || isNaN(price) || price < 0) {
    showAdminToast('يرجى ملء جميع الحقول المطلوبة', 'error');
    return;
  }

  if (productId && productId !== 'null') {
    const p = DB.products.find(x => x.id === productId);
    if (p) Object.assign(p, { name, price, unit, catId, icon });
    showAdminToast('تم تحديث المنتج', 'success');
  } else {
    const newId = Math.max(0, ...DB.products.map(x => x.id)) + 1;
    DB.products.push({ id: newId, catId, name, price, unit, icon, active: true });
    showAdminToast('تم إضافة المنتج', 'success');
  }

  saveData();
  closeModal();
  renderProducts();
  renderDashboard();
}

// ─── Notifications ────────────────────────────────────────────
function renderNotifBadge() {
  const unread = DB.notifications.filter(n => !n.read).length;
  const badge  = document.getElementById('notif-badge');
  if (!badge) return;
  badge.textContent = unread;
  badge.classList.toggle('hidden', unread === 0);
}

function renderNotifList() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!DB.notifications.length) {
    list.innerHTML = `<p style="padding:20px;text-align:center;
      color:#9ca3af;font-size:13px">لا توجد إشعارات</p>`;
    return;
  }
  list.innerHTML = DB.notifications.slice(0, 15).map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="readNotif(${n.id})">
      <p class="notif-title">${n.title}</p>
      <p class="notif-body">${n.body}</p>
      <p class="notif-time">${formatTime(n.time)}</p>
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
  toggleNotifDrop();
  const o = DB.orders.find(x => x.id === n?.orderId);
  if (o) { showAdminPage('orders', null); viewOrder(o.id); }
}

function markAllRead() {
  DB.notifications.forEach(n => n.read = true);
  saveData();
  renderNotifBadge();
  renderNotifList();
}

// ─── Settings ─────────────────────────────────────────────────
function loadSettings() {
  document.getElementById('set-name').value = DB.settings.storeName;
  document.getElementById('set-wa').value   = DB.settings.whatsapp;
  document.getElementById('set-fee').value  = DB.settings.deliveryFee;
  const toggle = document.getElementById('set-open-toggle');
  const label  = document.getElementById('set-open-label');
  if (DB.settings.storeOpen) {
    toggle.classList.add('on');
    label.textContent = 'المتجر مفتوح';
  } else {
    toggle.classList.remove('on');
    label.textContent = 'المتجر مغلق';
  }
}

function toggleStoreSetting() {
  DB.settings.storeOpen = !DB.settings.storeOpen;
  loadSettings();
}

function saveSettings() {
  DB.settings.storeName   = document.getElementById('set-name').value.trim();
  DB.settings.whatsapp    = document.getElementById('set-wa').value.trim();
  DB.settings.deliveryFee = parseFloat(document.getElementById('set-fee').value) || 15;
  saveData();
  showAdminToast('تم حفظ الإعدادات', 'success');
}
