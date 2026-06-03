// js/store.js - إدارة عمليات المتجر والسلة والطلب عبر سوبابيز

let cart = [];

// 1. عند تحميل الصفحة، ننتظر جلب البيانات من سوبابيز أولاً
document.addEventListener("DOMContentLoaded", async () => {
    console.log("جاري الاتصال بقاعدة بيانات سوبابيز...");
    const success = await loadData();
    
    if (success) {
        initStore();
    } else {
        alert("عذراً، فشل الاتصال بالسيرفر. يرجى تحديث الصفحة.");
    }
});

// 2. تهيئة المتجر وعرض البيانات الأساسية
function initStore() {
    // تحديث اسم المتجر من الإعدادات السحابية
    document.getElementById('store-name').innerText = DB.settings.storeName;
    
    renderCategories();
    renderProducts(); // يعرض كل المنتجات في البداية
    setupCartEvents();
    setupCheckoutForm();
}

// 3. عرض الأقسام
function renderCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = `
        <button onclick="filterProducts('all')" class="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium whitespace-nowrap text-sm active-cat">
            🌟 الكل
        </button>
    `;
    
    DB.categories.forEach(cat => {
        container.innerHTML += `
            <button onclick="filterProducts(${cat.id})" class="bg-white border text-gray-700 px-4 py-2 rounded-full font-medium whitespace-nowrap text-sm hover:bg-gray-50 transition">
                ${cat.icon || '📁'} ${cat.name}
            </button>
        `;
    });
}

// 4. عرض المنتجات (مع إمكانية الفلترة حسب القسم)
function renderProducts(catId = 'all') {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    // فلترة المنتجات النشطة فقط
    const filtered = DB.products.filter(p => (p.active !== false) && (catId === 'all' || p.catId == catId));
    
    if (filtered.length === 0) {
        grid.innerHTML = `<p class="col-span-2 md:col-span-4 text-center text-gray-400 py-8">لا توجد منتجات متاحة حالياً في هذا القسم.</p>--`;
        return;
    }
    
    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-between hover:shadow-md transition">
                <div class="text-4xl mb-2 text-center">${p.icon || '🛒'}</div>
                <div>
                    <h3 class="font-bold text-sm text-gray-800 mb-1">${p.name}</h3>
                    <p class="text-green-600 font-bold text-sm mb-3">${p.price} ج / <span class="text-xs text-gray-400">${p.unit}</span></p>
                </div>
                <button onclick="addToCart(${p.id})" class="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition">
                    ➕ إضافة للسلة
                </button>
            </div>
        `;
    });
}

function filterProducts(catId) {
    renderProducts(catId);
}

// 5. إدارة السلة (Cart Logic)
function setupCartEvents() {
    const modal = document.getElementById('cart-modal');
    document.getElementById('cart-btn').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('close-cart').addEventListener('click', () => modal.classList.add('hidden'));
}

function addToCart(productId) {
    const product = DB.products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateQty(productId, amt) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += amt;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    updateCartUI();
}

function updateCartUI() {
    // تحديث عداد السلة العلوي
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-count').innerText = totalQty;
    
    // ريندر عناصر السلة داخل المودال
    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    
    let subtotal = 0;
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">السلة فارغة حالياً</p>';
    } else {
        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            container.innerHTML += `
                <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                    <div>
                        <h5 class="font-bold text-xs">${item.name}</h5>
                        <span class="text-xs text-gray-500">${item.price} ج × ${item.qty}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="updateQty(${item.id}, -1)" class="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold">-</button>
                        <span class="text-sm font-bold">${item.qty}</span>
                        <button onclick="updateQty(${item.id}, 1)" class="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold">+</button>
                    </div>
                </div>
            `;
        });
    }
    
    // حساب الفاتورة (مصاريف التوصيل تؤخذ من السيرفر المربوط بسوبابيز)
    const deliveryFee = cart.length > 0 ? Number(DB.settings.deliveryFee) : 0;
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal-val').innerText = subtotal.toFixed(2) + ' ج.م';
    document.getElementById('delivery-val').innerText = deliveryFee.toFixed(2) + ' ج.م';
    document.getElementById('total-val').innerText = total.toFixed(2) + ' ج.م';
}

// 6. معالجة وتأكيد الطلب وإرساله إلى سوبابيز
function setupCheckoutForm() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('برجاء إضافة منتجات للسلة أولاً قبل إرسال الطلب!');
            return;
        }
        
        const submitBtn = document.getElementById('submit-order-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ جاري إرسال طلبك سحابياً...';
        
        // تجميع بيانات الفاتورة والعميل لتطابق أعمدة جدول الـ SQL
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const deliveryFee = Number(DB.settings.deliveryFee);
        
        const orderData = {
            fullName:    document.getElementById('order-fullname').value.trim(),
            whatsapp:    document.getElementById('order-whatsapp').value.trim(),
            phoneExtra:  document.getElementById('order-phone-extra').value.trim() || null,
            zone:        document.getElementById('order-zone').value.trim(),
            street:      document.getElementById('order-street').value.trim(),
            houseNumber: document.getElementById('order-house').value.trim(),
            floor:       document.getElementById('order-floor').value.trim() || null,
            apartment:   document.getElementById('order-apartment').value.trim() || null,
            landmark:    document.getElementById('order-landmark').value.trim() || null,
            notes:       document.getElementById('order-notes').value.trim() || null,
            items:       cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, unit: i.unit })),
            subtotal:    subtotal,
            deliveryFee: deliveryFee,
            total:       subtotal + deliveryFee,
            status:      'جديد'
        };
        
        try {
            // 🚀 إرسال الطلب إلى جدول سوبابيز سحابياً
            const savedOrder = await sendNewOrder(orderData);
            
            // 🔔 إرسال إشعار فوري للسيستم
            await sendNotification('طلب جديد 🎉', `العميل ${orderData.fullName} قام بعمل طلب بقيمة ${orderData.total} ج`, savedOrder.id);
            
            alert('🚀 تم تسجيل طلبك بنجاح في السيستم! جاري توجيهك للواتساب...');
            
            // فتح الواتساب لإرسال الفاتورة نصياً
            const messageText = buildWhatsAppText(savedOrder);
            const whatsappUrl = `https://wa.me/${DB.settings.whatsapp || '201000000000'}?text=${encodeURIComponent(messageText)}`;
            window.open(whatsappUrl, '_blank');
            
            // تفريغ السلة وإعادة التصفير
            cart = [];
            updateCartUI();
            form.reset();
            document.getElementById('cart-modal').classList.add('hidden');
            
        } catch (error) {
            alert('حدث خطأ أثناء إرسال الطلب، برجاء المحاولة مرة أخرى.');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = '✅ تأكيد الطلب وإرساله';
        }
    });
}