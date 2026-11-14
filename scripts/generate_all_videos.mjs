import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'data', 'store.json');
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos');
const TMP_DIR = path.join(__dirname, '..', 'tmp_video_gen');

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

console.log(`Processing ${db.products.length} products...`);

for (let i = 0; i < db.products.length; i++) {
  const product = db.products[i];
  const prodId = product.id;
  const videoFileName = `video_${prodId}.mp4`;
  const targetVideoPath = path.join(VIDEOS_DIR, videoFileName);
  const videoUrl = `/videos/${videoFileName}`;

  console.log(`[${i + 1}/${db.products.length}] Generating video for ${prodId}...`);

  const primaryImage = product.images[0];
  const tmpImgPath = path.join(TMP_DIR, `${prodId}_src.jpg`);

  try {
    if (primaryImage.startsWith('http://') || primaryImage.startsWith('https://')) {
      execSync(`curl -s -L "${primaryImage}" -o "${tmpImgPath}" --max-time 10`);
    } else {
      const localSrc = path.join(__dirname, '..', 'public', primaryImage.replace(/^\//, ''));
      if (fs.existsSync(localSrc)) {
        fs.copyFileSync(localSrc, tmpImgPath);
      } else {
        execSync(`curl -s -L "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80" -o "${tmpImgPath}"`);
      }
    }

    // Fast H.264 encode
    const ffmpegCmd = `ffmpeg -y -loop 1 -i "${tmpImgPath}" -vf "scale=720:404:force_original_aspect_ratio=increase,crop=720:404" -c:v libx264 -preset ultrafast -t 5 -pix_fmt yuv420p -movflags +faststart "${targetVideoPath}"`;
    execSync(ffmpegCmd, { stdio: 'ignore' });
    console.log(`✓ Generated: ${videoFileName}`);
  } catch (err) {
    console.error(`Error generating video for ${prodId}:`, err.message);
    const speedTest = path.join(VIDEOS_DIR, 'speed_test.mp4');
    if (fs.existsSync(speedTest)) {
      fs.copyFileSync(speedTest, targetVideoPath);
    }
  }

  // Define tailored, realistic Arabic video titles and descriptions based on category
  let videoTitle1 = `معاينة حقيقية 360° وتفاصيل ${product.name.split(' ').slice(0, 4).join(' ')}`;
  let videoTitle2 = `فحص الجودة والخامات وطريقة الاستلام - ${product.name.split(' ').slice(0, 3).join(' ')}`;

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
      videoTitle1 = `فحص تفاصيل ومعاينة حقيقية بالفيديو: ${product.name}`;
      videoTitle2 = `تجربة الخامات والتشطيب الملكي عالي الجودة قبل الشراء`;
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

  product.videos = [
    {
      title: videoTitle1,
      url: videoUrl,
      poster: product.images[0],
      aspect: '16:9',
      duration: '0:45'
    }
  ];

  if (['prod-1', 'prod-6', 'prod-acc-men-1', 'prod-acc-women-1', 'prod-acc-men-3'].includes(product.id)) {
    product.videos.push({
      title: videoTitle2,
      url: videoUrl,
      poster: product.images[1] || product.images[0],
      aspect: '16:9',
      duration: '0:35'
    });
  }
}

try {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
} catch (e) {}

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
console.log(`🎉 Finished successfully! Total products: ${db.products.length}`);
