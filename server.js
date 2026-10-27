const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'ronzi_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

// التهيئة الأولية لبيانات المتجر إن لم تكن موجودة
function getStoreData() {
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData = {
      storeInfo: {
        name: 'متجر رونزي',
        whatsapp: '963969537664',
        shamcash: '0969537664@shamcash',
        announcement: 'عروض متجددة وتوصيل سريع لكافة المناطق — متجر رونزي الإلكتروني'
      },
      products: [
        {
          id: 1,
          name: 'مايك لاسلكي احترافي',
          cat: 'الصوتيات',
          price: 2800,
          tag: 'جديد ومميز',
          rating: '4.9 ★★★★★',
          active: true,
          desc: 'ميكروفون لاسلكي ذكي بجودة صوت عالية ونقاء ممتاز للمحتوى والتسجيل عالي الدقة.',
          colors: [{ name: 'أسود ملكي', icon: '🎙️' }]
        },
        {
          id: 2,
          name: 'مبرد جوال مائي ثلجي',
          cat: 'إكسسوارات الجوال',
          price: 1100,
          tag: 'الأكثر مبيعاً',
          rating: '4.8 ★★★★★',
          active: true,
          desc: 'تبريد مائي وفائق السرعة لحماية الجوال من الارتفاع المفاجئ للحرارة أثناء اللعب.',
          colors: [{ name: 'أسود تيتانيوم', icon: '❄️' }]
        }
      ],
      coupons: [{ code: 'ulebi', discountPercent: 20, active: true }],
      orders: [],
      users: [{ id: 1, username: 'admin', password: 'admin123', role: 'المدير العام', active: true }]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveStoreData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// REST API Endpoints

// 1. جلب البيانات العامة للمتجر (مفتوح للعملاء)
app.get('/api/store-data', (req, res) => {
  const data = getStoreData();
  res.json({
    storeInfo: data.storeInfo,
    products: data.products.filter(p => p.active !== false),
    coupons: data.coupons.filter(c => c.active !== false)
  });
});

// 2. تسجيل دخول لوحة التحكم
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const data = getStoreData();
  const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  
  if (user && user.active !== false) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: { username: user.username, role: user.role } });
  }
  res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
});

// 3. جلب بيانات اللوحة الكاملة للمدير
app.get('/api/admin/full-data', (req, res) => {
  const data = getStoreData();
  res.json(data);
});

// 4. إضافة أو تعديل منتج
app.post('/api/admin/products', (req, res) => {
  const data = getStoreData();
  const product = req.body;
  
  if (product.id) {
    const idx = data.products.findIndex(p => p.id === parseInt(product.id));
    if (idx !== -1) data.products[idx] = { ...data.products[idx], ...product };
  } else {
    product.id = Date.now();
    product.active = true;
    data.products.unshift(product);
  }
  
  saveStoreData(data);
  res.json({ success: true, products: data.products });
});

// 5. التغيير على حالات الأوضاع/المنتجات/الأكواد
app.post('/api/admin/update-full-store', (req, res) => {
  const newData = req.body;
  saveStoreData(newData);
  res.json({ success: true });
});

// 6. إرسال طلب جديد من المتجر الرئيسي
app.post('/api/orders', (req, res) => {
  const data = getStoreData();
  const newOrder = req.body;
  data.orders.unshift(newOrder);
  saveStoreData(data);
  res.json({ success: true, orderId: newOrder.id });
});

// توجيه الصفحات الرئيسية
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));