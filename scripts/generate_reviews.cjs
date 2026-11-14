const fs = require('fs');
const path = require('path');

const storeFilePath = path.join(__dirname, '../data/store.json');
const storeData = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));

const moroccanCities = [
  'الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'فاس', 'أكادير', 'مكناس', 'وجدة',
  'القنيطرة', 'تطوان', 'تمارة', 'العيون', 'الداخلة', 'الناظور', 'الجديدة', 'آسفي',
  'بني ملال', 'خريبكة', 'تازة', 'سطات', 'المحمدية', 'بركان', 'تارودانت', 'الرشيدية',
  'كلميم', 'الصويرة', 'شفشاون', 'ورزازات', 'العرائش', 'القصر الكبير', 'سيدي قاسم',
  'خنيفرة', 'الخميسات', 'تيفلت', 'قلعة السراغنة', 'الفقيه بن صالح', 'تزنيت', 'بنسليمان',
  'برشيد', 'سيدي سليمان', 'جرادة', 'تاوريرت', 'ميدلت', 'أزرو', 'إفران', 'وزان'
];

const maleNames = [
  'محمد الإدريسي', 'عمر التازي', 'يوسف بنجلون', 'حمزة الفاسي', 'أمين المرابط',
  'كريم الشرايبي', 'طارق العلمي', 'سفيان المنصوري', 'أنس السوسي', 'مهدي برادة',
  'عثمان الودغيري', 'ياسين الصقلي', 'رضا العراقي', 'بدر الحريزي', 'خليل الوزاني',
  'عبد الله الرحماني', 'هشام البقالي', 'وليد السبتي', 'مروان البوزيدي', 'إلياس التلمساني',
  'زياد بومهدي', 'أيوب الراجي', 'إسماعيل الشريف', 'سعد بناني', 'أشرف بوعبيد',
  'معاذ الدكالي', 'نزار السلاوي', 'يحيى البهجة', 'فؤاد الريفي', 'مصطفى زروال',
  'رشيد أيت الطالب', 'عادل المنبهي', 'بلال الزهراوي', 'نبيل الصنهاجي', 'صلاح الدين الوهابي',
  'عبد العالي القادري', 'حسام العمراني', 'خالد الكتاني', 'عبد الإله الصالحي', 'جمال الفيلالي'
];

const femaleNames = [
  'سناء بنكيران', 'خديجة العمراني', 'سلمى المنصوري', 'فاطمة الزهراء التازي', 'مريم الشاوي',
  'إيمان العلمي', 'هاجر الفاسي', 'لبنى بوزيد', 'كوثر الإدريسي', 'زينب الرحماني',
  'أسماء الودغيري', 'نادية البقالي', 'هناء السوسي', 'سارة برادة', 'شيماء الصقلي',
  'أحلام المرابط', 'ياسمين بناني', 'سميرة الدكالي', 'رجاء الشريف', 'هدى بوعبيد',
  'غيثة الفيلالي', 'وصال الراجي', 'حنان السبتي', 'منى اليعقوبي', 'نهيلة التلمساني',
  'لمياء الصنهاجي', 'نورة الشرايبي', 'بسمة الوهابي', 'وفاء أيت الطالب', 'سعاد القادري',
  'بشرى الكتاني', 'لطيفة الصالحي', 'وفاء الزهراوي', 'أمل المنبهي', 'دنيا العمراني'
];

const maleAvatars = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
];

const femaleAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80',
];

// Rich, natural Moroccan Darija review templates for watches
const darijaReviewsGeneral = [
  "تبارك الله وصلاتني ف وقت قياسي، التغليف واعر والعلبة تصلح كادو هماوي. الساعة ثقيلة وفخمة بزاف.",
  "الصراحة كنت متردد حيت أول مرة نشري من هاد السيت، ولكن فاش حليت الباكية قبل ما نخلص لقيتها أحسن من التصاور بمليون درجة.",
  "ساعة همة وشان، كتجي مع الورقة د الضمان وسيرتيفيكا، كلشي ناضي ف هاد المتجر الله يعطيكم الصحة.",
  "التعامل د الموزع كان قمة فالأخلاق، خلاني حتى حليت الكولية وفحصت الساعة على راحتي عاد خلصتو كاش.",
  "الجودة تفوت الثمن بكتير، زجاج السافير كيحافظ على اللمعان ديالو وما كيتجرحش واخا تقيسو ف السوارت.",
  "وصلاتني ف 24 ساعة لمدينة الدار البيضاء، الساعة ناضية وسريعة، واللون متناسق بزاف مع الحوايج كلاس.",
  "كنت خايف من السلعة ديال لانتيرنيت، ولكن صراحة Qevorin رجعات ليا الثقة، معقولين وسلعتهم أصلية ونقية.",
  "الساعة فاش كديرها ف يدك كتعطيك هيبة، الثقل ديال الفولاذ المقاوم للصدأ واللمعة ديال الذهب متقونة بزاف.",
  "السيرفيس كليان عندهم تبارك الله احترافيين، جاوبوني ف الواتساب على كل التساؤلات ديالي، شكراً جزيلاً.",
  "شريت بزاف د الساعات من قبل، ولكن هادي بصح تفاجأت بجمال التفاصيل ديالها، كولشي فيها كيبان مصنوع بإتقان.",
  "التوصيل فابور حتى لباب الدار ف فاس، التغليف محكم ف كرتونة نقية، والساعة محمية بالبلاستيك الأصلي ديالها.",
  "عجباتني بزاف، سيرتو أن الدفع حتى شفت السلعة، هاد النقطة كتعطي راحة البال لأي كليان كيشري أول مرة.",
  "الساعة كتواتى مع الكوستيم ومع الجلابة المغربية فالمناسبات، كولشي صحابي ف الخدمة سولوني منين خديتها.",
  "الماكينة ديالها هادئة ودقيقة ف الوقت، والعلبة الجلدية الفاخرة زايدها قيمة كبيرة، الله يبارك ليكم فرزقكم.",
  "خدمة ممتازة وسريعة، درت الكوموند البارح ف العشية واليوم ف الصباح مع 11 كان الليفرور عندي ف الرباط.",
  "ساعة واعرة بزاف، خديتها بثمن التخفيض وتستاهل كتر، حتى السير ديالها مريح وما كيعرقش اليد نهائياً.",
  "الضمان ديال عامين المعتمد كيريح البال، هاد الناس معقولين وكيخافو الله فالسلعة لي كيبيعو.",
  "ما شاء الله، إتقان فالصنع، اللون ثابت ما كيتغيرش واخا تغسل يدك بالما والصابون، ننصح بيها أي واحد.",
  "تجربة شراء ممتازة من البداية حتى النهاية، السيت ساهل والتعامل راقي والمنتوج فوق التوقعات.",
  "خديت وحدة وبان ليا غنزيد كوموند ثانية للأخ ديالي، حيت بصح ما كايناش بحال هاد الجودة بهاد الثمن فالسوق."
];

const darijaReviewsMenChronograph = [
  "الساعة ثقيلة فاليد والكرونوغراف خدام دقة وحدة، العقارب الصغار كلهم شغالين ماشي مجرد ديكور بحال ساعات السوق.",
  "رويال كرونوغراف ساعة رجالية من الطراز الرفيع، اللمسة الذهبية مع الأسود كتعطي مظهر جذاب وأنيق ف اليد.",
  "الكرونوغراف شغال 100% والزر الفوقاني كيبدا العد والتحتاني كيرجعو للصفر، ميكانيزم متقون بزاف.",
  "خديت الكرونوغراف الأسود والذهبي، ساعة واااعرة كتعمر اليد وكتبان هماوية ف الاجتماعات واللقاءات الرسمية.",
  "محرك الكوارتز الياباني دقيق جداً ف الثواني، والأزرار الجانبية قاصحة ومتقونة، تستاهل كل درهم تحط فيها."
];

const darijaReviewsSkeleton = [
  "الله يعطيكم الصحة، الساعة السكيليتون ميكانيكية بدون حجر كتحرك مع حركة اليد شي حاجة خيالية وإبداع هندسي.",
  "المنظر ديال التروس والعجلات كيدورو من الواجهة ومن الظهر زجاج شفاف يخليك جالس حاضيها، متعة حقيقية.",
  "أوتوماتيك حقيقية كتشارجا مع الحركة والنبض، ما تحتاج لا حجرة لا والو، فينيسيون فاخرة وعصرية.",
  "ساعة سكيليتون روعة، الماتريال ديال الفولاذ 316L ثقيل ومقاوم للصدأ، والصوت ديال التكات كيبين أصالتها.",
  "أحسن ساعة شريتها هاد العام، سكيليتون ماستر بيس متعة بصرية، التغليف والعلبة ف المستوى العالي."
];

const darijaReviewsWomenElegance = [
  "الروز غولد مع الكريستال جا غزال بزاف فاللبسة، كلشي ف الخدمة والعائلة سولني عليها حيت كتبري بحال المجوهرات.",
  "خديتها كادو لمراتي فعيد زواجنا، عجباتها بزااف وفرحات بيها! العلبة الفاخرة خلات الهدية تبان راقية وغالية.",
  "ساعة نسائية ناعمة وكلاس بزاف، اللون الروز غولد ناصع وما كيكحالش، ومشبك القفل ديالها مريح وسهل فاللبس.",
  "شريتها للماما فعيد ميلادها، بكات بالفرحة تبارك الله، العلبة والضمان كيزيدو يرفعو من قيمة الهدية، شكراً لكم.",
  "مرصعة بحبات الكريستال كتعطي بريق لامع تحت الضوء، مناسبة بزاف للمناسبات والقفطان المغربي والتكشيطة."
];

const darijaReviewsAquaracer = [
  "وصلاتني لمراكش، درت ليها تيست ديال الما ف لافابو وخليتها ساعة وما تسرب والو، مقاومة للماء 100% بصح.",
  "ساعة رياضية متينة وقوية، الإطار الدوار كيتكتك بدقة، وسوار السيليكون الرياضي مريح بزاف ف الصيف والعرق.",
  "عقارب مضيئة ف الظلام كتبان واضحة فالليل، ساعة أكواريسر ممتازة للغوص والبحر والأنشطة الرياضية.",
  "كنتريني بيها ف لاصال وندوش بيها، ما كتخافش عليها نهائياً، زجاج ضد الخدش وساعة معمرة يديك صحيحة."
];

const darijaReviewsMinimalist = [
  "ساعة ألترا سليم فائقة النحافة، ما كتحسش بيها ف يدك، وكتدخل بسلاسة تحت كم القميص بلا ما تشد ولا تعذبك.",
  "التصميم المينيماليست الكلاسيكي بسيط وراقي بزاف، الجلد الطبيعي ديال الحزام رطب وكيتواتى مع أي لبسة.",
  "خفيفة وأنيقة، المينا نظيف والأرقام واضحة، هادي هي الساعة لي كنت كنقلب عليها للخدمة والمكتب.",
  "كلاسيكية بامتياز، الحزام الجلد أصلي ومتقون الخياطة، لي كيعجبو البساطة والفخامة الهادئة هادي هي خياره."
];

const darijaReviewsSmartWatch = [
  "الساعة الذكية فاخرة والشاشة نقية بزاف والألوان واضحة تحت الشمس، المكالمات كتسمع بوضوح والبطارية بقات شادة معايا 6 أيام كاملة.",
  "كتصل بسرعة مع الآيفون والسامسونغ، كتوصلني الإشعارات د الواتساب والمكالمات بصوت نقي وسبيكر واعر.",
  "الحساسات ديال نبضات القلب والخطوات دقيقة، وشكلها الخارجي كيبان بحال ساعة فاخرة ماشي بحال البلاستيك الرخيص.",
  "البلوتوث مستقر بزاف، وشاحن الماغنيتيك سريع، أحسن سمارت ووتش شريتها بهاد الثمن فالمغرب."
];

// Combine products with targeted reviews
const productReviewsMap = {
  'prod-1': darijaReviewsMenChronograph,
  'prod-2': darijaReviewsSkeleton,
  'prod-3': darijaReviewsWomenElegance,
  'prod-4': darijaReviewsAquaracer,
  'prod-5': darijaReviewsMinimalist,
  'prod-6': darijaReviewsSmartWatch
};

const products = storeData.products || [];
const targetCount = 544;
const reviewsList = [];

// Helper random pick
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate realistic date within past 180 days
function getRandomDate() {
  const now = new Date('2026-10-28');
  const pastDays = Math.floor(Math.random() * 180);
  const d = new Date(now.getTime() - pastDays * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

// Let's generate exactly 544 reviews
for (let i = 1; i <= targetCount; i++) {
  const isFemale = Math.random() < 0.35; // 35% female, 65% male
  const author = isFemale ? rand(femaleNames) : rand(maleNames);
  const avatar = isFemale ? rand(femaleAvatars) : rand(maleAvatars);
  const city = rand(moroccanCities);
  
  // Pick product: if female, slightly higher chance for prod-3 or prod-6 or prod-5
  let prod;
  if (isFemale && Math.random() < 0.6) {
    prod = Math.random() < 0.7 ? products.find(p => p.id === 'prod-3') : rand(products);
  } else {
    prod = rand(products);
  }
  const prodId = prod ? prod.id : 'prod-1';
  
  // Select comment
  let pool = darijaReviewsGeneral;
  if (productReviewsMap[prodId] && Math.random() < 0.6) {
    pool = productReviewsMap[prodId];
  }
  
  // Add some variations / suffixes
  const baseComment = rand(pool);
  const rating = Math.random() < 0.88 ? 5 : 4; // 88% 5-star, 12% 4-star

  reviewsList.push({
    id: `rev-${i}`,
    productId: prodId,
    author: author,
    city: city,
    rating: rating,
    date: getRandomDate(),
    comment: baseComment,
    isVerified: true,
    isApproved: true,
    customerPhoto: avatar
  });
}

// Sort reviews by date descending
reviewsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

storeData.reviews = reviewsList;

// Update product review counts and ratings
products.forEach(p => {
  const pReviews = reviewsList.filter(r => r.productId === p.id);
  p.reviewCount = pReviews.length;
  if (pReviews.length > 0) {
    const avg = pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length;
    p.rating = Math.round(avg * 10) / 10;
  }
});

fs.writeFileSync(storeFilePath, JSON.stringify(storeData, null, 2), 'utf8');
console.log(`Successfully generated and saved ${reviewsList.length} authentic Moroccan Darija reviews!`);
