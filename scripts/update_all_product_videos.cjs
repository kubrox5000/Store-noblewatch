const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'store.json');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');
const TEST_VID = path.join(VIDEOS_DIR, 'test.mp4');

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

console.log(`Checking videos for all ${db.products.length} products...`);

db.products.forEach((product, idx) => {
  const prodId = product.id;
  const videoFileName = `video_${prodId}.mp4`;
  const targetVideoPath = path.join(VIDEOS_DIR, videoFileName);
  const videoUrl = `/videos/${videoFileName}`;

  // Ensure file exists and is valid
  if (!fs.existsSync(targetVideoPath) || fs.statSync(targetVideoPath).size < 1000) {
    if (fs.existsSync(TEST_VID) && fs.statSync(TEST_VID).size > 1000) {
      fs.copyFileSync(TEST_VID, targetVideoPath);
      console.log(`✓ Copied template video to ${videoFileName}`);
    }
  }

  // Generate tailored Arabic video titles for each item
  let videoTitle1 = `معاينة حقيقية 360° وتفاصيل ${product.name}`;
  let videoTitle2 = `فحص الجودة والخامات وتجربة الارتداء - ${product.name.split(' ').slice(0, 3).join(' ')}`;

  if (product.category === 'accessories' || product.category === 'men-accessories' || product.category === 'women-accessories') {
    if (product.id.includes('box')) {
      videoTitle1 = 'معاينة واقعية لصندوق الساعات: الملمس المخملي، قفل الأمان والتشطيب';
      videoTitle2 = 'طريقة ترتيب الساعات وحمايتها من الخدوش داخل الصندوق الملكي';
    } else if (product.id.includes('cufflinks')) {
      videoTitle1 = 'معاينة لمعان أزرار الأكمام المذهبة ونقش Noblewatch الدقيق';
      videoTitle2 = 'تجربة تثبيت أزرار الأكمام على القميص وثبات القفل الملكي';
    } else if (product.id.includes('wallet')) {
      videoTitle1 = 'استعراض ملمس الجلد الطبيعي واختبار تقنية حجب RFID الذكية';
      videoTitle2 = 'معاينة سعة الجيوب والنحافة الفائقة داخل الجيب';
    } else if (product.id.includes('tennis') || product.id.includes('bangle') || product.id.includes('women-2')) {
      videoTitle1 = 'بريق أحجار الزركون تحت الإضاءة وانعكاسات الروز غولد الساحرة';
      videoTitle2 = 'معاينة ارتداء السوار على المعصم ونظام الإغلاق الآمن';
    } else {
      videoTitle1 = `معاينة حقيقية بالفيديو: ${product.name}`;
      videoTitle2 = `فحص الخامات الملكية والتغليف الفاخر قبل الاستلام`;
    }
  } else {
    if (product.id === 'prod-1') {
      videoTitle1 = 'نظرة تفصيلية على ساعة رويال كرونوغراف وانعكاسات المينا الملكية';
      videoTitle2 = 'تجربة ارتداء الساعة على المعصم وسلاسة عمل عقارب الكرونوغراف';
    } else if (product.id === 'prod-2') {
      videoTitle1 = 'حركة التروس الميكانيكية للساعة الأوتوماتيكية تحت الضوء';
      videoTitle2 = 'معاينة الغطاء الخلفي الشفاف والقلب النابض للساعة الميكانيكية';
    } else if (product.id === 'prod-3') {
      videoTitle1 = 'بريق الكريستال ورقة سوار الروز غولد المش النسائي الفاخر';
      videoTitle2 = 'معاينة إطلالة الساعة النسائية على اليد وطريقة تعديل مقاس السوار';
    } else if (product.id === 'prod-4') {
      videoTitle1 = 'فحص مقاومة الماء والإطار الدوار السيراميكي للساعة الرياضية';
      videoTitle2 = 'وضوح المؤشرات المضيئة في الظلام ومتانة الفولاذ المقاوم للصدأ';
    } else if (product.id === 'prod-5') {
      videoTitle1 = 'أناقة النحافة الفائقة وملمس الجلد الطبيعي لساعة مينيماليست';
      videoTitle2 = 'خفة الوزن والراحة التامة أثناء الارتداء اليومي وفي المناسبات';
    } else if (product.id === 'prod-6') {
      videoTitle1 = 'تشغيل شاشة AMOLED عالية الدقة وربط المكالمات بالبلوتوث';
      videoTitle2 = 'تجربة الحساسات الحيوية، قياس النبض، وسرعة استجابة اللمس';
    }
  }

  // Set videos array
  product.videos = [
    {
      title: videoTitle1,
      url: videoUrl,
      poster: product.images[0],
      aspect: '16:9',
      duration: '0:45'
    }
  ];

  // Add second video for popular products
  if (['prod-1', 'prod-6', 'prod-acc-men-1', 'prod-acc-women-1', 'prod-acc-men-3'].includes(product.id)) {
    product.videos.push({
      title: videoTitle2,
      url: videoUrl,
      poster: product.images[1] || product.images[0],
      aspect: '16:9',
      duration: '0:35'
    });
  }

  console.log(`[${idx + 1}/${db.products.length}] ${product.id} now has ${product.videos.length} videos`);
});

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
console.log('✅ Done! store.json updated with videos for all products.');
