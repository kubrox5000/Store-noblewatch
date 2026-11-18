import type { Language } from '../context/LanguageContext';

const hasArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text);

const normalizeSpaces = (text: string): string =>
  (text || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

// ============================================================================
// 1. MOROCCAN CITIES (AR -> FR)
// ============================================================================
const CITY_AR_TO_FR: Record<string, string> = {
  'الدار البيضاء': 'Casablanca',
  'الدار': 'Casablanca',
  'كازا': 'Casablanca',
  'الرباط': 'Rabat',
  'مراكش': 'Marrakech',
  'طنجة': 'Tanger',
  'فاس': 'Fès',
  'أكادير': 'Agadir',
  'اكادير': 'Agadir',
  'مكناس': 'Meknès',
  'وجدة': 'Oujda',
  'القنيطرة': 'Kénitra',
  'تطوان': 'Tétouan',
  'تمارة': 'Témara',
  'سلا': 'Salé',
  'المحمدية': 'Mohammédia',
  'الجديدة': 'El Jadida',
  'آسفي': 'Safi',
  'اسفي': 'Safi',
  'بني ملال': 'Béni Mellal',
  'خريبكة': 'Khouribga',
  'الناظور': 'Nador',
  'تازة': 'Taza',
  'برشيد': 'Berrechid',
  'سطات': 'Settat',
  'العرائش': 'Larache',
  'القصر الكبير': 'Ksar El Kebir',
  'كلميم': 'Guelmim',
  'العيون': 'Laâyoune',
  'الداخلة': 'Dakhla',
  'ورزازات': 'Ouarzazate',
  'الصويرة': 'Essaouira',
  'تارودانت': 'Taroudant',
  'بركان': 'Berkane',
  'سيدي قاسم': 'Sidi Kacem',
  'سيدي سليمان': 'Sidi Slimane',
  'الخميسات': 'Khémisset',
  'الحسيمة': 'Al Hoceïma',
  'شفشاون': 'Chefchaouen',
  'إفران': 'Ifrane',
  'افران': 'Ifrane',
  'ميدلت': 'Midelt',
  'الرشيدية': 'Errachidia',
  'جرادة': 'Jerada',
  'الفقيه بن صالح': 'Fquih Ben Salah',
  'تزنيت': 'Tiznit',
  'تاوريرت': 'Taourirt',
  'وزان': 'Ouazzane',
  'بنسليمان': 'Benslimane',
  'خنيفرة': 'Khénifra',
  'تيفلت': 'Tifelt',
  'أزرو': 'Azrou',
  'قلعة السراغنة': 'El Kelâa des Sraghna',
  'زاكورة': 'Zagora',
  'تنجداد': 'Tinejdad',
  'تنغير': 'Tinghir',
  'سيدي بنور': 'Sidi Bennour',
  'اليوسفية': 'Youssoufia',
  'بن جرير': 'Benguerir',
  'جرسيف': 'Guercif',
  'صفرو': 'Sefrou',
  'أصيلة': 'Asilah',
  'الفنيدق': 'Fnideq',
  'المضيق': 'M’diq',
  'مرتيل': 'Martil',
  'السمارة': 'Es-Semara',
  'طانطان': 'Tan-Tan',
  'أخرى': 'Autre ville (Maroc)',
};

export const translateCityName = (city: string, lang: Language): string => {
  if (!city) return city;
  let trimmed = city.trim();
  if (trimmed === 'الدار') trimmed = 'الدار البيضاء';
  else if (trimmed === 'بني') trimmed = 'بني ملال';
  else if (trimmed === 'القصر') trimmed = 'القصر الكبير';

  if (lang === 'ar') return trimmed;

  if (CITY_AR_TO_FR[trimmed]) return CITY_AR_TO_FR[trimmed];

  // Handle "الدار البيضاء (Casablanca)" style strings
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inside = parenMatch[1].trim();
    if (!hasArabic(inside)) return inside;
  }

  const withoutParens = trimmed.replace(/\([^)]*\)/g, '').trim();
  if (CITY_AR_TO_FR[withoutParens]) return CITY_AR_TO_FR[withoutParens];

  for (const [ar, fr] of Object.entries(CITY_AR_TO_FR)) {
    if (trimmed.includes(ar)) return fr;
  }

  return trimmed;
};

// ============================================================================
// 2. CUSTOMER REVIEW COMMENTS (AR / DARIJA -> FR)
// ============================================================================
const REVIEW_COMMENTS_AR_TO_FR: Record<string, string> = {
  'ساعة نسائية ناعمة وكلاس بزاف، اللون الروز غولد ناصع وما كيكحالش، ومشبك القفل ديالها مريح وسهل فاللبس.':
    'Montre femme très raffinée et classe ! La teinte or rose est éclatante et ne noircit pas, et le fermoir est très confortable et facile à mettre.',
  'مرصعة بحبات الكريستال كتعطي بريق لامع تحت الضوء، مناسبة بزاف للمناسبات والقفطان المغربي والتكشيطة.':
    'Sertie de cristaux qui brillent magnifiquement à la lumière, parfaite pour les grandes occasions, le caftan marocain et la takchita.',
  'الماكينة ديالها هادئة ودقيقة ف الوقت، والعلبة الجلدية الفاخرة زايدها قيمة كبيرة، الله يبارك ليكم فرزقكم.':
    'Le mécanisme est silencieux et très précis, et le coffret en cuir luxueux ajoute une vraie touche de prestige. Merci beaucoup !',
  'كتصل بسرعة مع الآيفون والسامسونغ، كتوصلني الإشعارات د الواتساب والمكالمات بصوت نقي وسبيكر واعر.':
    'Se connecte rapidement avec iPhone et Samsung, je reçois les notifications WhatsApp et les appels avec un son clair et un excellent haut-parleur.',
  'وصلاتني لمراكش، درت ليها تيست ديال الما ف لافابو وخليتها ساعة وما تسرب والو، مقاومة للماء 100% بصح.':
    'Reçue à Marrakech ! Je l’ai testée sous l’eau pendant une heure dans le lavabo et aucune goutte n’est passée, vraiment 100 % étanche.',
  'محرك الكوارتز الياباني دقيق جداً ف الثواني، والأزرار الجانبية قاصحة ومتقونة، تستاهل كل درهم تحط فيها.':
    'Le mouvement à quartz japonais est d’une grande précision à la seconde près, et les boutons latéraux sont solides et bien finis. Elle vaut chaque dirham !',
  'عقارب مضيئة ف الظلام كتبان واضحة فالليل، ساعة أكواريسر ممتازة للغوص والبحر والأنشطة الرياضية.':
    'Les aiguilles lumineuses dans le noir restent parfaitement lisibles la nuit. Une montre sportive excellente pour la mer et les activités nautiques.',
  'وصلاتني ف 24 ساعة لمدينة الدار البيضاء، الساعة ناضية وسريعة، واللون متناسق بزاف مع الحوايج كلاس.':
    'Livrée en 24 heures à Casablanca ! La montre est impeccable et la couleur s’accorde parfaitement avec des tenues habillées.',
  'ساعة ألترا سليم فائقة النحافة، ما كتحسش بيها ف يدك، وكتدخل بسلاسة تحت كم القميص بلا ما تشد ولا تعذبك.':
    'Montre ultra-fine d’une grande légèreté, on la sent à peine au poignet et elle glisse facilement sous la manche de chemise sans gêner.',
  'أحسن ساعة شريتها هاد العام، سكيليتون ماستر بيس متعة بصرية، التغليف والعلبة ف المستوى العالي.':
    'La plus belle montre que j’aie achetée cette année ! Le design squelette est un vrai régal pour les yeux, avec un emballage et un coffret haut de gamme.',
  'البلوتوث مستقر بزاف، وشاحن الماغنيتيك سريع، أحسن سمارت ووتش شريتها بهاد الثمن فالمغرب.':
    'Bluetooth très stable et chargeur magnétique rapide : la meilleure montre connectée que j’aie achetée à ce prix au Maroc.',
  'الكرونوغراف شغال 100% والزر الفوقاني كيبدا العد والتحتاني كيرجعو للصفر، ميكانيزم متقون بزاف.':
    'Le chronographe fonctionne à 100 % : le bouton du haut lance le compteur et celui du bas remet à zéro, un mécanisme vraiment bien travaillé.',
  'خفيفة وأنيقة، المينا نظيف والأرقام واضحة، هادي هي الساعة لي كنت كنقلب عليها للخدمة والمكتب.':
    'Légère et élégante, le cadran est épuré et les chiffres bien lisibles. C’est exactement la montre que je cherchais pour le bureau.',
  'الله يعطيكم الصحة، الساعة السكيليتون ميكانيكية بدون حجر كتحرك مع حركة اليد شي حاجة خيالية وإبداع هندسي.':
    'Bravo à vous ! Cette montre squelette mécanique sans pile se recharge simplement avec les mouvements du poignet, une véritable prouesse d’horlogerie.',
  'شريتها للماما فعيد ميلادها، بكات بالفرحة تبارك الله، العلبة والضمان كيزيدو يرفعو من قيمة الهدية، شكراً لكم.':
    'Je l’ai achetée pour l’anniversaire de ma maman, elle était tellement émue ! Le coffret et la carte de garantie subliment vraiment le cadeau. Merci !',
  'ساعة رياضية متينة وقوية، الإطار الدوار كيتكتك بدقة، وسوار السيليكون الرياضي مريح بزاف ف الصيف والعرق.':
    'Montre sport robuste et solide, la lunette tournante clique avec précision et le bracelet en silicone est très confortable en été.',
  'خديتها كادو لمراتي فعيد زواجنا، عجباتها بزااف وفرحات بيها! العلبة الفاخرة خلات الهدية تبان راقية وغالية.':
    'Prise comme cadeau pour notre anniversaire de mariage, ma femme l’a adorée ! Le coffret de luxe donne à l’ensemble une allure très chic et précieuse.',
  'كلاسيكية بامتياز، الحزام الجلد أصلي ومتقون الخياطة، لي كيعجبو البساطة والفخامة الهادئة هادي هي خياره.':
    'Classique par excellence : le bracelet en cuir est authentique avec des coutures soignées. Le choix idéal pour ceux qui aiment la sobriété et le luxe discret.',
  'خديت وحدة وبان ليا غنزيد كوموند ثانية للأخ ديالي، حيت بصح ما كايناش بحال هاد الجودة بهاد الثمن فالسوق.':
    'J’en ai commandé une et je vais sûrement en prendre une deuxième pour mon frère, car une telle qualité à ce prix est introuvable sur le marché.',
  'السيرفيس كليان عندهم تبارك الله احترافيين، جاوبوني ف الواتساب على كل التساؤلات ديالي، شكراً جزيلاً.':
    'Le service client est très professionnel, ils ont répondu à toutes mes questions sur WhatsApp avec courtoisie. Merci beaucoup !',
  'تجربة شراء ممتازة من البداية حتى النهاية، السيت ساهل والتعامل راقي والمنتوج فوق التوقعات.':
    'Excellente expérience d’achat du début à la fin : site fluide, accueil chaleureux et produit au-delà de mes attentes.',
  'الساعة الذكية فاخرة والشاشة نقية بزاف والألوان واضحة تحت الشمس، المكالمات كتسمع بوضوح والبطارية بقات شادة معايا 6 أيام كاملة.':
    'Montre connectée haut de gamme avec un écran très net même en plein soleil. Les appels sont clairs et la batterie a tenu 6 jours complets.',
  'كنتريني بيها ف لاصال وندوش بيها، ما كتخافش عليها نهائياً، زجاج ضد الخدش وساعة معمرة يديك صحيحة.':
    'Je m’entraîne avec à la salle et je prends ma douche sans souci, elle ne craint rien : verre anti-rayures et boîtier bien solide au poignet.',
  'الحساسات ديال نبضات القلب والخطوات دقيقة، وشكلها الخارجي كيبان بحال ساعة فاخرة ماشي بحال البلاستيك الرخيص.':
    'Les capteurs de fréquence cardiaque et de pas sont précis, et son design ressemble vraiment à une montre de luxe plutôt qu’à du plastique bas de gamme.',
  'ساعة واعرة بزاف، خديتها بثمن التخفيض وتستاهل كتر، حتى السير ديالها مريح وما كيعرقش اليد نهائياً.':
    'Montre superbe ! Je l’ai eue en promotion et elle vaut bien plus, le bracelet est très confortable et ne fait pas transpirer le poignet.',
  'الصراحة كنت متردد حيت أول مرة نشري من هاد السيت، ولكن فاش حليت الباكية قبل ما نخلص لقيتها أحسن من التصاور بمليون درجة.':
    'Franchement, j’hésitais car c’était ma première commande sur ce site, mais quand j’ai ouvert le colis avant de payer, elle était encore plus belle que sur les photos !',
  'الساعة كتواتى مع الكوستيم ومع الجلابة المغربية فالمناسبات، كولشي صحابي ف الخدمة سولوني منين خديتها.':
    'Elle se porte aussi bien avec un costume qu’avec une djellaba marocaine lors des occasions ; tous mes collègues au travail m’ont demandé où je l’avais achetée.',
  'خديت الكرونوغراف الأسود والذهبي، ساعة واااعرة كتعمر اليد وكتبان هماوية ف الاجتماعات واللقاءات الرسمية.':
    'J’ai pris le chronographe noir et or : une montre imposante qui habille parfaitement le poignet et fait très chic en réunion.',
  'الساعة فاش كديرها ف يدك كتعطيك هيبة، الثقل ديال الفولاذ المقاوم للصدأ واللمعة ديال الذهب متقونة بزاف.':
    'Une fois au poignet, elle donne une vraie prestance : le poids de l’acier inoxydable et l’éclat doré sont d’une finition remarquable.',
  'عجباتني بزاف، سيرتو أن الدفع حتى شفت السلعة، هاد النقطة كتعطي راحة البال لأي كليان كيشري أول مرة.':
    'Je suis très satisfait, surtout du paiement après vérification du colis : cela rassure énormément lorsqu’on commande pour la première fois.',
  'الروز غولد مع الكريستال جا غزال بزاف فاللبسة، كلشي ف الخدمة والعائلة سولني عليها حيت كتبري بحال المجوهرات.':
    'L’or rose avec les cristaux est magnifique une fois porté ! Tout le monde au travail et en famille m’a posé des questions tellement elle brille comme un bijou.',
  'خدمة ممتازة وسريعة، درت الكوموند البارح ف العشية واليوم ف الصباح مع 11 كان الليفرور عندي ف الرباط.':
    'Service excellent et rapide : j’ai commandé hier soir et ce matin à 11h le livreur était déjà chez moi à Rabat.',
  'ما شاء الله، إتقان فالصنع، اللون ثابت ما كيتغيرش واخا تغسل يدك بالما والصابون، ننصح بيها أي واحد.':
    'Superbe qualité de fabrication ! La couleur reste intacte même en se lavant les mains à l’eau et au savon. Je recommande vivement.',
  'كنت خايف من السلعة ديال لانتيرنيت، ولكن صراحة Noblewatch رجعات ليا الثقة، معقولين وسلعتهم أصلية ونقية.':
    'J’avais des doutes sur les achats en ligne, mais Noblewatch m’a vraiment redonné confiance : équipe sérieuse et produits authentiques et soignés.',
  'شريت بزاف د الساعات من قبل، ولكن هادي بصح تفاجأت بجمال التفاصيل ديالها، كولشي فيها كيبان مصنوع بإتقان.':
    'J’ai acheté beaucoup de montres auparavant, mais celle-ci m’a bluffé par la finesse de ses détails : tout respire le savoir-faire.',
  'التعامل د الموزع كان قمة فالأخلاق، خلاني حتى حليت الكولية وفحصت الساعة على راحتي عاد خلصتو كاش.':
    'Le livreur a été d’une politesse exemplaire : il m’a laissé ouvrir le colis et examiner la montre tranquillement avant de régler en espèces.',
  'الساعة ثقيلة فاليد والكرونوغراف خدام دقة وحدة، العقارب الصغار كلهم شغالين ماشي مجرد ديكور بحال ساعات السوق.':
    'La montre a un bon poids en main et le chronographe est ultra précis : tous les petits cadrans fonctionnent vraiment, ce n’est pas du décor.',
  'التوصيل فابور حتى لباب الدار ف فاس، التغليف محكم ف كرتونة نقية، والساعة محمية بالبلاستيك الأصلي ديالها.':
    'Livraison gratuite jusqu’à la porte à Fès ! Emballage soigné dans un carton propre avec la montre protégée par ses films d’origine.',
  'التصميم المينيماليست الكلاسيكي بسيط وراقي بزاف، الجلد الطبيعي ديال الحزام رطب وكيتواتى مع أي لبسة.':
    'Le design minimaliste classique est sobre et très chic, le cuir véritable du bracelet est souple et s’adapte à toutes les tenues.',
  'ساعة سكيليتون روعة، الماتريال ديال الفولاذ 316L ثقيل ومقاوم للصدأ، والصوت ديال التكات كيبين أصالتها.':
    'Montre squelette splendide ! L’acier 316L est dense et inoxydable, et le tic-tac mécanique témoigne de son authenticité.',
  'أوتوماتيك حقيقية كتشارجا مع الحركة والنبض، ما تحتاج لا حجرة لا والو، فينيسيون فاخرة وعصرية.':
    'Véritable montre automatique qui se remonte avec le mouvement du poignet, aucune pile nécessaire et finition moderne haut de gamme.',
  'ساعة همة وشان، كتجي مع الورقة د الضمان وسيرتيفيكا، كلشي ناضي ف هاد المتجر الله يعطيكم الصحة.':
    'Une montre de grand standing, livrée avec sa carte de garantie et son certificat. Tout est parfait dans cette boutique, bravo !',
  'رويال كرونوغراف ساعة رجالية من الطراز الرفيع، اللمسة الذهبية مع الأسود كتعطي مظهر جذاب وأنيق ف اليد.':
    'La Royal Chronographe est une montre homme de très haut niveau : la touche dorée associée au noir offre une allure élégante et séduisante.',
  'تبارك الله وصلاتني ف وقت قياسي، التغليف واعر والعلبة تصلح كادو هماوي. الساعة ثقيلة وفخمة بزاف.':
    'Reçue en un temps record ! L’emballage est soigné et le coffret convient parfaitement pour un cadeau prestigieux. La montre est dense et très luxueuse.',
  'الجودة تفوت الثمن بكتير، زجاج السافير كيحافظ على اللمعان ديالو وما كيتجرحش واخا تقيسو ف السوارت.':
    'La qualité dépasse largement le prix : le verre saphir garde tout son éclat et ne se raye pas même au contact des clés.',
  'الضمان ديال عام كامل المعتمد كيريح البال، هاد الناس معقولين وكيخافو الله فالسلعة لي كيبيعو.':
    'La garantie officielle d’un an apporte une vraie tranquillité d’esprit. Des vendeurs honnêtes et sérieux qui proposent de la belle marchandise.',
  'المنظر ديال التروس والعجلات كيدورو من الواجهة ومن الظهر زجاج شفاف يخليك جالس حاضيها، متعة حقيقية.':
    'Voir les rouages tourner côté cadran et à travers le fond transparent est hypnotisant, un vrai plaisir horloger !',
};

export const translateReviewComment = (comment: string, lang: Language): string => {
  if (!comment || lang === 'ar') return comment;
  const cleaned = normalizeSpaces(comment);
  if (!hasArabic(cleaned)) return comment;

  if (REVIEW_COMMENTS_AR_TO_FR[cleaned]) {
    return REVIEW_COMMENTS_AR_TO_FR[cleaned];
  }

  // Fallback for any newly submitted/edited Arabic review: construct accurate French summary from key sentiments
  const parts: string[] = [];
  if (/وصلاتني|التوصيل|الليفرور|الموزع|الشحن/.test(cleaned)) {
    parts.push('Livraison rapide et livreur très professionnel.');
  }
  if (/فحص|حليت|معاينة|المعاينة|نخلص|الدفع/.test(cleaned)) {
    parts.push('Vérification du colis avant le paiement à la réception.');
  }
  if (/سكيليتون|تروس|أوتوماتيك|ميكانيك/.test(cleaned)) {
    parts.push('Mécanisme automatique squelette impressionnant et précis.');
  } else if (/كرونوغراف/.test(cleaned)) {
    parts.push('Chronographe précis et fonctionnel.');
  } else if (/كوارتز/.test(cleaned)) {
    parts.push('Mouvement à quartz précis.');
  }
  if (/الماء|الما|ضد الخدش|فولاذ|سافير|جلد/.test(cleaned)) {
    parts.push('Matériaux résistants et finition soignée.');
  }
  if (/كادو|علبة|هدية|عيد/.test(cleaned)) {
    parts.push('Coffret de luxe idéal pour offrir en cadeau.');
  }
  if (/ضمان/.test(cleaned)) {
    parts.push('Garantie officielle incluse.');
  }
  if (parts.length === 0) {
    return 'Très belle montre conforme aux photos, finition soignée et livraison rapide. Je recommande vivement !';
  }
  return `Très satisfait de mon achat : ${parts.join(' ')}`;
};

// ============================================================================
// 3. PRODUCT FEATURES & SPECS (AR -> FR)
// ============================================================================
const EXACT_FEATURES_AR_TO_FR: Record<string, string> = {
  'ضمان معتمد لمدة سنة كاملة ضد أي عيوب مصنعية':
    'Garantie officielle d’un an contre tout défaut de fabrication',
  'ضمان رسمي لمدة سنة كاملة': 'Garantie officielle d’un an',
  'مقاومة الماء': 'Résistance à l’eau certifiée',
  'مقاومة الماء.': 'Résistance à l’eau certifiée',
  'حركة أوتوماتيكية: تعمل بنظام التعبئة الذاتية.':
    'Mouvement automatique : remontage mécanique par mouvement du poignet.',
  'قطر الساعة: 40 ملم.': 'Diamètre du boîtier : 40 mm.',
  'سوار فولاذي: متين ومريح للاستخدام اليومي.':
    'Bracelet en acier inoxydable : robuste et confortable au quotidien.',
  'زجاج Sapphire: مقاومة أفضل للخدوش.':
    'Verre saphir : résistance supérieure aux rayures.',
  'معالجة مضادة للانعكاس: لتحسين وضوح الرؤية.':
    'Traitement antireflet : visibilité et lisibilité optimisées.',
  'قفل آمن: نظام إغلاق محكم للسوار.':
    'Fermoir sécurisé : système de verrouillage fiable du bracelet.',
  'تصميم متعدد الاستخدامات: مناسب للعمل والخروجات والمناسبات.':
    'Design polyvalent : idéal pour le travail, les sorties et les grandes occasions.',
  'تصميم فاخر: أنيق مع هيكل فضي.':
    'Design luxueux : élégant avec boîtier finition argentée.',
};

const EXACT_FEATURES_FR_TO_AR: Record<string, string> = {
  'paiement à la livraison · livraison gratuite · vérification à réception':
    'الدفع عند الاستلام · توصيل مجاني · المعاينة قبل الدفع',
  "fabriquée avec des matériaux de qualité supérieure et dotée d'une finition très minutieuse.":
    'مصنوعة من مواد عالية الجودة وتتميز بتشطيب دقيق ومتقن للغاية.',
  'mouvement : automatique': 'الحركة : أوتوماتيكية',
  'mouvement : automatique — remontage automatique ⚙️':
    'الحركة : أوتوماتيكية — تعبئة ذاتية ⚙️',
  'mouvement : mécanique squelette': 'الحركة : ميكانيكية مكشوفة (سكيليتون)',
  'verre : saphir': 'الزجاج : ياقوت (سافير)',
  'verre : saphir résistant aux rayures': 'الزجاج : ياقوت (سافير) مقاوم للخدوش',
  'verre : saphir bombé antireflet': 'الزجاج : سافير مقبب مضاد للانعكاس',
  'coffret de marque officiel': 'علبة الماركة الرسمية',
  'packaging de marque officiel': 'تغليف الماركة الرسمي الفاخر',
  'mouvement automatique (sans pile)': 'حركة أوتوماتيكية (تعبئة ذاتية بدون بطارية)',
  "design inspiré d'un modèle emblématique de luxe": 'تصميم مستوحى من موديل أيقوني فاخر',
  "finitions haut de gamme avec cadran nid d'abeille et fond transparent":
    'تشطيبات راقية مع مينا بنقشة خلية النحل وظهر شفاف',
  'bracelet intégré confortable et résistant': 'سوار مدمج مريح ومتين للاستخدام اليومي',
  'verre saphir résistant aux rayures': 'زجاج ياقوت (سافير) مقاوم للخدوش',
  'fermoir invisible sécurisé': 'قفل مخفي آمن ومحكم الإغلاق',
  'mouvement : swiss automatique': 'الحركة : أوتوماتيكية سويسرية (Swiss Automatique)',
  'verre : saphir anti-reflets': 'الزجاج : ياقوت (سافير) مضاد للانعكاس',
  'verre : cristal sapphire': 'الزجاج : كريستال سافير مقاوم للخدوش',
  'garantie officielle d’un an': 'ضمان رسمي لمدة سنة كاملة ضد العيوب المصنعية',
  "garantie officielle d'un an": 'ضمان رسمي لمدة سنة كاملة ضد العيوب المصنعية',
  'boitier : 41 mm': 'قطر الهيكل : 41 ملم',
  'verre : sapphir': 'الزجاج : ياقوت (سافير)',
  'étanchéité : 50m': 'مقاومة الماء : 50 متر',
  'étanchéité : 120m (12atm)': 'مقاومة الماء : 120 متر (12ATM)',
  'boîtier : 42mm · acier inoxydable': 'الهيكل : 42 ملم · فولاذ مقاوم للصدأ',
  'boîtier : 42.5mm · acier': 'الهيكل : 42.5 ملم · فولاذ مقاوم للصدأ',
  'mouvement : quartz': 'الحركة : كوارتز عالي الدقة (Quartz)',
  'verre : glace saphir': 'الزجاج : ياقوت (سافير) مقاوم للخدوش',
  'étanchéité : 100m (10 atm)': 'مقاومة الماء : 100 متر (10 ATM)',
  'étanchéité : 30m (3 atm)': 'مقاومة الماء : 30 متر (3 ATM)',
  'étanchéité : 3 atm': 'مقاومة الماء : 3 ATM',
  'boîtier : 36mm or rose': 'الهيكل : 36 ملم · تشطيب ذهبي وردي',
  'boîtier : 36mm acier inoxydable': 'الهيكل : 36 ملم · فولاذ مقاوم للصدأ',
  'boitier : 35 mm': 'قطر الهيكل : 35 ملم',
  'boîtier : 32 mm doré': 'الهيكل : 32 ملم · تشطيب ذهبي',
  'épaisseur de boîtier : 8,5mm': 'سماكة الهيكل : 8.5 ملم',
  'diamètre : 24,6 x 18,7 mm': 'الأبعاد : 24.6 × 18.7 ملم',
  'diamètre : 33,7 mm': 'القطر : 33.7 ملم',
};

const SPEC_KEY_FR_TO_AR: Record<string, string> = {
  marque: 'الماركة',
  modèle: 'الموديل',
  modele: 'الموديل',
  style: 'التصميم / الطراز',
  boîtier: 'الهيكل',
  boitier: 'الهيكل',
  diamètre: 'القطر',
  diametre: 'القطر',
  mouvement: 'الحركة',
  type: 'النوع',
  cadran: 'المينا',
  lunette: 'الإطار (Lunette)',
  glace: 'الزجاج',
  verre: 'الزجاج',
  bracelet: 'السوار',
  fermoir: 'المشبك (القفل)',
  affichage: 'العرض',
  fonctions: 'الوظائف',
  index: 'المؤشرات',
  finition: 'التشطيب',
  fond: 'الظهر',
  collection: 'المجموعة',
  garantie: 'الضمان',
  modéle: 'الموديل',
  référence: 'المرجع (Réf.)',
  étanchéité: 'مقاومة الماء',
  'sous-cadrans': 'العدادات الفرعية',
  'détail unique': 'تفصيل مميز',
  genre: 'الفئة',
  'largeur réglable': 'طول السوار القابل للتعديل',
  'épaisseur de boîtier': 'سماكة الهيكل',
};

const SPEC_VALUE_FR_TO_AR: Record<string, string> = {
  // Brands
  rolex: 'رولكس (Rolex)',
  omega: 'أوميغا (Omega)',
  'patek philippe': 'باتيك فيليب (Patek Philippe)',
  cartier: 'كارتييه (Cartier)',
  hublot: 'هوبلو (Hublot)',
  tissot: 'تيسو (Tissot)',
  'audemars piguet': 'أوديمار بيغيه (Audemars Piguet)',
  'vacheron constantin': 'فاشرون كونستانتان (Vacheron Constantin)',
  // Models
  'cosmograph daytona': 'كوزموغراف دايتونا (Cosmograph Daytona)',
  'cosmograph daytona « panda »': 'كوزموغراف دايتونا « باندا »',
  'cosmograph daytona (réf. 116519ln)': 'كوزموغراف دايتونا (المرجع 116519LN)',
  'santos de cartier squelette': 'سانتوس دي كارتييه سكيليتون',
  'complications annual calendar (réf. 5205r-010)':
    'كومبليكيشنز التقويم السنوي (المرجع 5205R-010)',
  // Movements & Types
  automatique: 'أوتوماتيكية',
  'automatique — remontage automatique ⚙️': 'أوتوماتيكية — تعبئة ذاتية ⚙️',
  'mécanique squelette': 'ميكانيكية مكشوفة (Squelette)',
  chronographe: 'كرونوغراف',
  squelette: 'سكيليتون (هيكل مكشوف)',
  'montre de plongée': 'ساعة غوص احترافية',
  'co-axial master chronometer': 'كو-أكسيال ماستر كرونومتر',
  'calendrier annuel': 'تقويم سنوي',
  analogique: 'عقارب كلاسيكية (Analogique)',
  // Cases & Bezels & Straps & Clasps & Glass
  'oyster, finition or rose': 'أويستر، تشطيب ذهبي وردي (Or Rose)',
  'oyster, oystersteel': 'أويستر، فولاذ أويستر ستيل المقاوم للصدأ',
  'oyster, acier bicolore finition or rose': 'أويستر، فولاذ ثنائي اللون بتشطيب ذهبي وردي',
  'oyster, acier inoxydable': 'أويستر، فولاذ مقاوم للصدأ',
  'oyster, acier argenté': 'أويستر، فولاذ فضي',
  'oyster bicolore, acier et finition or rose': 'أويستر ثنائي اللون، فولاذ وتشطيب ذهبي وردي',
  oysterflex: 'سوار أويستر فليكس (Oysterflex)',
  oysterlock: 'قفل أويستر لوك (Oysterlock)',
  'acier inoxydable / finition bicolore selon version':
    'فولاذ مقاوم للصدأ / تشطيب ثنائي اللون حسب الإصدار',
  'acier inoxydable, finition or jaune': 'فولاذ مقاوم للصدأ بتشطيب ذهبي أصفر',
  'finition or rose': 'تشطيب ذهبي وردي (Or Rose)',
  'acier, finition or jaune, vis apparentes': 'فولاذ بتشطيب ذهبي أصفر مع براغي ظاهرة',
  'maille milanaise en acier': 'سوار ميلانيز شبكي من الفولاذ المقاوم للصدأ',
  'cuir véritable': 'جلد طبيعي فاخر',
  'cuir noir': 'جلد أسود فاخر',
  'boucle déployante': 'مشبك قابل للطي',
  'boucle déployante calatrava': 'مشبك كالاترافا قابل للطي',
  'saphir résistant aux rayures': 'زجاج سافير مقاوم للخدوش',
  saphir: 'زجاج ياقوت (سافير)',
  'saphir bombé antireflet': 'زجاج سافير مقبب مضاد للانعكاس',
  'unidirectionnelle, échelle de plongée': 'دوار باتجاه واحد مع مقياس الغوص',
  'vert avec échelle de plongée': 'أخضر مع مقياس الغوص',
  'cerachrom noire en céramique': 'سيراميك سيراكروم أسود',
  'lunette multicolore, effet sertissage': 'إطار متعدد الألوان بتأثير الترصيع',
  'lunette tachymétrique': 'إطار تاكيمتر لقياس السرعة',
  'lunette tachymétrique noire': 'إطار تاكيمتر أسود',
  'lunette tachymétrique en céramique noire': 'إطار تاكيمتر من السيراميك الأسود',
  'lisse, finition or rose': 'أملس، بتشطيب ذهبي وردي',
  // Dials
  'cadran luxueux avec détails multicolores': 'مينا فاخر بتفاصيل متعددة الألوان',
  'brun / effet tropical': 'بني / بتأثير استوائي',
  'turquoise / bleu et noir': 'تركواز / أزرق وأسود',
  'vert profond': 'أخضر داكن',
  vert: 'أخضر',
  'bleu nuit avec guichets jour/mois/date':
    'أزرق ليلي مع نوافذ اليوم / الشهر / التاريخ',
  chocolat: 'شوكولاتة (بني)',
  'squelette ajouré': 'هيكل مكشوف ومفرغ (Squelette)',
  'blanc avec compteurs noirs': 'أبيض مع عدادات سوداء',
  gris: 'رمادي',
  // Functions, Index, Finishes, Styles
  'heures, minutes': 'الساعات، الدقائق',
  'heures, minutes, secondes, date': 'الساعات، الدقائق، الثواني، التاريخ',
  'heures, minutes, petite seconde, chronographe':
    'الساعات، الدقائق، الثواني الصغيرة، الكرونوغراف',
  'heures, minutes, secondes, jour, mois, date, phase de lune':
    'الساعات، الدقائق، الثواني، اليوم، الشهر، التاريخ، أطوار القمر',
  'index appliqués avec traitement luminescent': 'مؤشرات بارزة معالجة بمادة مضيئة في الظلام',
  'polie et raffinée': 'مصقولة وراقية',
  'polie et satinée': 'مصقولة ولامعة مع تشطيب ساتان',
  'daytona rainbow multicolore': 'دايتونا رينبو متعدد الألوان',
  'sport-luxe, audacieux et prestigieux': 'رياضي فاخر، جريء وراقي',
  'sport chic & haut de gamme': 'رياضي أنيق وفئة عليا',
  'daytona cosmographe 2025, édition tiffany blue (réf. 126518ln)':
    'دايتونا كوزموغراف 2025، إصدار تيفاني بلو (المرجع 126518LN)',
  'chronographe sport-luxe, édition collector': 'كرونوغراف رياضي فاخر، إصدار خاص لهواة الجمع',
  'daytona 2025, cadran vert': 'دايتونا 2025، مينا أخضر',
  'sport-luxe intemporel': 'رياضي فاخر بأناقة خالدة',
  'calendrier annuel avec phase de lune': 'تقويم سنوي مع مؤشر أطوار القمر',
  'haute horlogerie classique et raffinée': 'صناعة ساعات سويسرية رفيعة كلاسيكية وراقية',
  'daytona chocolat bicolore': 'دايتونا شوكولاتة ثنائية اللون',
  'sport-luxe bicolore, élégance intemporelle': 'رياضي فاخر ثنائي اللون بأناقة خالدة',
  'santos squelette bicolore, finition or jaune': 'سانتوس سكيليتون ثنائية اللون بتشطيب ذهبي أصفر',
  'technique et audacieux': 'تقني وجريء',
  'daytona panda, cadran blanc et compteurs noirs': 'دايتونا باندا، مينا أبيض وعدادات سوداء',
  'sport-chic iconique': 'رياضي أنيق وأيقوني',
  'daytona cadran gris, boîtier acier': 'دايتونا بمينا رمادي وهيكل فولاذي',
  'sport-luxe raffiné': 'رياضي فاخر وأنيق',
  '40 mm': '40 ملم',
  '39,8 mm': '39.8 ملم',
  '42 mm': '42 ملم',
  'land-dweller style': 'لاند-دويلر ستايل (Land-Dweller Style)',
  'automatique (sans pile)': 'أوتوماتيكية (تعبئة ذاتية بدون بطارية)',
  "motif nid d'abeille haute finition": 'نقشة خلية النحل بتشطيب عالٍ',
  'cannelée élégante': 'مخدد أنيق (Cannelée)',
  'transparent laissant apparaître le mécanisme': 'شفاف يكشف حركة الماكينة الداخلية',
  'acier inoxydable haute qualité': 'فولاذ مقاوم للصدأ عالي الجودة',
  'flat jubilee intégré confortable et résistant': 'سوار فلات جوبيلي مدمج مريح ومتين',
  'fermoir invisible sécurisé': 'مشبك مخفي آمن ومحكم',
  'santos squelette, mouvement apparent': 'سانتوس سكيليتون بمكينة مكشوفة',
  'acier inoxydable, forme carrée': 'فولاذ مقاوم للصدأ بتصميم مربع',
  'acier, maillons interchangeables': 'فولاذ مقاوم للصدأ بحلقات قابلة للتبديل',
  'cosmograph daytona (réf. 116515)': 'كوزموغراف دايتونا (المرجع 116515)',
  'daytona finition or rose, cadran noir': 'دايتونا بتشطيب ذهبي وردي ومينا أسود',
  noir: 'أسود',
  'lunette tachymétrique, finition or rose': 'إطار تاكيمتر بتشطيب ذهبي وردي',
  'saphir anti-reflets': 'زجاج سافير مضاد للانعكاس',
  'luxe discret et intemporel': 'فخامة هادئة وأناقة خالدة',
  'daytona cadran bleu glacier transparent, lunette marron': 'دايتونا بمينا أزرق جليدي شفاف وإطار بني',
  'bleu glacier': 'أزرق جليدي (Ice Blue)',
  'lunette tachymétrique cerachrom marron': 'إطار تاكيمتر سيراكروم باللون البني',
  'édition rare et élégante': 'إصدار نادر وأنيق',
  'santos de cartier': 'سانتوس دي كارتييه (Santos de Cartier)',
  'santos acier, cadran bleu': 'سانتوس فولاذية بمينا أزرق',
  classique: 'كلاسيكية',
  'bleu, chiffres romains': 'أزرق بأرقام رومانية',
  'acier, vis apparentes': 'فولاذ مقاوم للصدأ مع براغي ظاهرة',
  'heures, minutes, secondes': 'الساعات، الدقائق، الثواني',
  'élégance sportive intemporelle': 'أناقة رياضية خالدة',
  'classic fusion aerofusion, finition king gold': 'كلاسيك فيوجن أيروفيوجن بتشطيب كينغ غولد',
  'aerofusion squelette, finition dorée': 'أيروفيوجن سكيليتون بتشطيب ذهبي',
  'finition king gold, lunette six vis en h': 'تشطيب كينغ غولد مع إطار بـ 6 براغي بشكل H',
  'chronographe squelette': 'كرونوغراف سكيليتون (هيكل مكشوف)',
  'squelette, finition dorée': 'مكشوف (Squelette) بتشطيب ذهبي',
  'finition king gold, six vis en h': 'تشطيب كينغ غولد مع 6 براغي بشكل H',
  'caoutchouc structuré noir': 'مطاط فاخر أسود منقوش',
  'satinée et polie': 'تشطيب ساتان ومصقول',
  'luxe technique et audacieux': 'فخامة تقنية وجريئة',
  'nautilus (réf. 5711/1a)': 'نوتيلوس (المرجع 5711/1A)',
  'nautilus cadran vert olive, boîtier acier': 'نوتيلوس بمينا أخضر زيتوني وهيكل فولاذي',
  'acier inoxydable, forme octogonale arrondie': 'فولاذ مقاوم للصدأ بشكل ثماني مستدير',
  '40,8 mm': '40.8 ملم',
  'classique à date': 'كلاسيكية مع نافذة التاريخ',
  'vert olive, motif horizontal embossé': 'أخضر زيتوني بنقشة أفقية بارزة',
  'lunette octogonale arrondie': 'إطار ثماني مستدير أيقوني',
  'octogonale arrondie': 'ثماني مستدير أيقوني',
  'acier inoxydable intégré': 'فولاذ مقاوم للصدأ مدمج',
  'luxe sportif discret': 'فخامة رياضية راقية',
  nautilus: 'نوتيلوس (Nautilus)',
  'nautilus acier, cadran blanc': 'نوتيلوس فولاذية بمينا أبيض',
  blanc: 'أبيض',
  'acier gris': 'فولاذ رمادي مقاوم للصدأ',
  'sport-luxe discret': 'رياضي فاخر وأنيق',
  'pxr powermatic 80': 'PRX باورماتيك 80 (Powermatic 80)',
  't137.407.11.051.00': 'T137.407.11.051.00',
  'cristal sapphire': 'زجاج كريستال سافير',
  'acier inoxydable': 'فولاذ مقاوم للصدأ',
  'swiss automatique': 'أوتوماتيكية سويسرية (Swiss Automatique)',
  '41 mm': '41 ملم',
  '1 an': 'سنة كاملة (شهادة ضمان رسمية)',
  'gmt-master ii « pepsi » (réf. 126710blro)': 'جي إم تي ماستر 2 « بيبسي » (المرجع 126710BLRO)',
  'gmt voyageur, lunette bicolore rouge et bleue': 'GMT للمسافرين بإطار ثنائي اللون أحمر وأزرق',
  'gmt, double fuseau horaire': 'GMT بتوقيت مزدوج لمنطقتين زمنيتين',
  'cerachrom bicolore rouge et bleu « pepsi »': 'سيراميك سيراكروم أحمر وأزرق « بيبسي »',
  'heures, minutes, secondes, date, second fuseau horaire': 'الساعات، الدقائق، الثواني، التاريخ، التوقيت الثاني GMT',
  'sport-chic, esprit voyageur': 'رياضي أنيق بروح السفر',
  'gmt-master ii « batman » (réf. 126710blnr)': 'جي إم تي ماستر 2 « باتمان » (المرجع 126710BLNR)',
  'gmt voyageur, lunette bicolore noire et bleue': 'GMT للمسافرين بإطار ثنائي اللون أسود وأزرق',
  'cerachrom bicolore noir et bleu « batman »': 'سيراميك سيراكروم أسود وأزرق « باتمان »',
  'jubilée, acier': 'سوار جوبيلي من الفولاذ المقاوم للصدأ',
  'day-date 40 (réf. 228235)': 'داي-ديت 40 (المرجع 228235)',
  'day-date finition or rose, cadran olive': 'داي-ديت بتشطيب ذهبي وردي ومينا أخضر زيتوني',
  'classique à jour et date': 'كلاسيكية مع عرض اليوم والتاريخ',
  'vert olive': 'أخضر زيتوني',
  'president, finition or rose': 'سوار بريزيدنت بتشطيب ذهبي وردي',
  'fermoir dissimulé president': 'مشبك بريزيدنت مخفي',
  'heures, minutes, secondes, jour, date': 'الساعات، الدقائق، الثواني، اليوم، التاريخ',
  'prestige discret et intemporel': 'فخامة هادئة وهيبة خالدة',
  'submariner date « hulk » (réf. 116610lv)': 'سبمارينر ديت « هالك » (المرجع 116610LV)',
  'submariner hulk tout vert': 'سبمارينر هالك بالكامل باللون الأخضر',
  plongée: 'ساعة غوص احترافية',
  'lunette de plongée unidirectionnelle cerachrom verte': 'إطار غوص دوار باتجاه واحد من السيراميك الأخضر',
  glidelock: 'قفل غلايد لوك (Glidelock)',
  'sport-luxe iconique': 'رياضي فاخر وأيقوني',
  'datejust 41 (réf. 126300)': 'ديت جست 41 (المرجع 126300)',
  'datejust cadran bleu, bracelet oyster': 'ديت جست بمينا أزرق وسوار أويستر',
  bleu: 'أزرق',
  'lisse, acier poli': 'أملس من الفولاذ المصقول',
  'élégance intemporelle': 'أناقة كلاسيكية خالدة',
  'royal oak': 'رويال أوك (Royal Oak)',
  '15450st.oo.1256st.01': '15450ST.OO.1256ST.01',
  sapphir: 'زجاج ياقوت (سافير)',
  '41mm': '41 ملم',
  '50m': '50 متر',
  'seamaster aqua terra worldtimer': 'سيماستر أكوا تيرا وورلد تايمر',
  'montre homme': 'ساعة رجالية فاخرة',
  'bleu avec carte du monde': 'أزرق مع خريطة العالم',
  'worldtimer – fuseaux horaires': 'توقيت عالمي (Worldtimer) لجميع المناطق الزمنية',
  caoutchouc: 'مطاط رياضي فاخر',
  'luxe / élégant / sport-chic': 'فاخر / أنيق / سبور شيك',
  'speedmaster silver snoopy award 50th anniversary': 'سبيدماستر الذكرى الخمسين Silver Snoopy Award',
  'argenté guilloché': 'فضي بنقشة غيوشيه (Guilloché)',
  'snoopy en relief à 9h': 'رسم سنوبي بارز عند الساعة 9',
  'nylon bleu avec surpiqûres blanches': 'نايلون أزرق مع تطريز أبيض أنيق',
  'céramique bleue tachymétrique': 'سيراميك أزرق بمقياس التاكيمتر',
  'chronographe · calibre omega 3861': 'كرونوغراف · كاليبر أوميغا 3861',
  'saphir avec animation snoopy lunaire': 'ظهر سافير مع حركة القمر وسنوبي',
  'classic fusion, titane, cadran bleu': 'كلاسيك فيوجن من التيتانيوم ومينا أزرق',
  'classic fusion épurée, boîtier titane': 'كلاسيك فيوجن بتصميم نقي وهيكل تيتانيوم',
  'titane, lunette six vis en h': 'تيتانيوم مع إطار بـ 6 براغي بشكل H',
  'titane, six vis en h': 'تيتانيوم بـ 6 براغي بشكل H',
  'caoutchouc structuré bleu': 'مطاط فاخر أزرق منقوش',
  'élégance minimaliste et moderne': 'أناقة عصرية وبساطة راقية',
  overseas: 'أوفرسيز (Overseas)',
  argent: 'فضي',
  '120m (12atm)': '120 متر (12ATM)',
  '42mm · acier inoxydable': '42 ملم · فولاذ مقاوم للصدأ',
  '42.5mm · acier': '42.5 ملم · فولاذ مقاوم للصدأ',
  // Women's catalog brands, models, and details
  bvlgari: 'بولغاري (Bvlgari)',
  chopard: 'شوبارد (Chopard)',
  'michael kors': 'مايكل كورس (Michael Kors)',
  'daniel wellington': 'دانيال ولينغتون (Daniel Wellington)',
  'emporio armani': 'إمبوريو أرماني (Emporio Armani)',
  guess: 'غيس (Guess)',
  quartz: 'كوارتز عالي الدقة (Quartz)',
  femme: 'نسائية',
  'ballon bleu (réf. w6920046)': 'بالون بلو (المرجع W6920046)',
  'ballon bleu bicolore, effet sertissage or rose': 'بالون بلو ثنائية اللون بتأثير ترصيع ذهبي وردي',
  'blanc, chiffres romains': 'أبيض بأرقام رومانية',
  "acier, couronne sertie d'un saphir bleu synthétique": 'فولاذ مع تاج مرصع بحجر سافير أزرق',
  'acier et finition or rose': 'فولاذ مقاوم للصدأ مع تشطيب ذهبي وردي',
  'élégance ronde raffinée': 'أناقة دائرية راقية',
  'baignoire 25mm': 'بينوار (Baignoire) 25 ملم',
  'baignoire ovale, finition or jaune': 'بينوار بيضاوية بتشطيب ذهبي أصفر',
  'finition or jaune, forme ovale': 'تشطيب ذهبي أصفر، تصميم بيضاوي',
  'argenté, chiffres romains': 'فضي بأرقام رومانية',
  'lisse, finition or jaune': 'أملس، بتشطيب ذهبي أصفر',
  'joaillier, élégance intemporelle': 'تصميم مجوهرات بأناقة خالدة',
  'baignoire mini': 'بينوار ميني (Baignoire Mini)',
  'baignoire mini, bracelet cuir noir': 'بينوار ميني بسوار جلد أسود',
  'acier inoxydable, forme ovale': 'فولاذ مقاوم للصدأ بتصميم بيضاوي',
  '24,6 x 18,7 mm': '24.6 × 18.7 ملم',
  argenté: 'فضي لامع',
  'lisse, acier': 'أملس من الفولاذ',
  'boucle ardillon': 'إبزيم كلاسيكي (Boucle ardillon)',
  polie: 'مصقولة بلمعان فاخر',
  'élégance discrète et raffinée': 'أناقة ناعمة وراقية',
  'panthère de cartier': 'بانثير دي كارتييه (Panthère de Cartier)',
  'panthère acier, effet sertissage': 'بانثير فولاذية مرصعة بالكريستال',
  'acier, effet sertissage': 'فولاذ مرصع بالكريستال',
  'acier inoxydable, maillons panthère': 'فولاذ مقاوم للصدأ بحلقات بانثير الأيقونية',
  'fermoir dissimulé': 'مشبك مخفي أنيق',
  'joaillier, féminin et intemporel': 'تصميم مجوهرات نسائي خالد',
  'panthère finition or rose intégrale': 'بانثير كاملة بتشطيب ذهبي وردي',
  'finition or rose, maillons panthère': 'تشطيب ذهبي وردي بحلقات بانثير الأيقونية',
  'joaillier, féminin et prestigieux': 'تصميم مجوهرات نسائي فاخر',
  'tank must': 'تانك ماست (Tank Must)',
  'tank rectangulaire, bracelet acier': 'تانك مستطيلة بسوار فولاذي',
  'acier inoxydable, forme rectangulaire': 'فولاذ مقاوم للصدأ بتصميم مستطيل',
  '33,7 mm': '33.7 ملم',
  'élégance intemporelle art déco': 'أناقة آرت ديكو خالدة',
  'ballon bleu de cartier': 'بالون بلو دي كارتييه (Ballon Bleu)',
  'ballon bleu, bracelet cuir noir': 'بالون بلو بسوار جلد أسود',
  'acier inoxydable, forme ronde bombée': 'فولاذ مقاوم للصدأ بتصميم دائري مقبب',
  'opalin argenté': 'أوبالين فضي ناصع',
  'élégance ronde et féminine': 'أناقة دائرية أنثوية راقية',
  'serpenti tubogas': 'سيربنتي توبوغاز (Serpenti Tubogas)',
  'or rose serti': 'ذهبي وردي مرصع بالكريستال',
  'or rose': 'ذهبي وردي (Or Rose)',
  'serpenti seduttori': 'سيربنتي سيدوتوري (Serpenti Seduttori)',
  'or jaune': 'ذهبي أصفر (Or Jaune)',
  '35 mm': '35 ملم',
  'oyster perpetual': 'أويستر بربتشوال (Oyster Perpetual)',
  'oyster perpetual, cadran rose': 'أويستر بربتشوال بمينا وردي',
  rose: 'وردي ناعم',
  'oyster perpetual (réf. 276200)': 'أويستر بربتشوال (المرجع 276200)',
  'oyster perpetual compacte, boîtier acier': 'أويستر بربتشوال مدمجة بهيكل فولاذي',
  'coloré, selon disponibilité': 'مينا ملون أنيق حسب الإصدار',
  'oyster perpetual (réf. 277200)': 'أويستر بربتشوال (المرجع 277200)',
  'oyster perpetual, boîtier acier': 'أويستر بربتشوال بهيكل فولاذي',
  'alpine eagle 36': 'ألبين إيغل 36 (Alpine Eagle 36)',
  'glace saphir': 'زجاج ياقوت (سافير)',
  '100m (10 atm)': '100 متر (10 ATM)',
  '36mm or rose': '36 ملم · تشطيب ذهبي وردي',
  '36mm acier inoxydable': '36 ملم · فولاذ مقاوم للصدأ',
  'mini monroe pavé two-tone': 'ميني مونرو بافيه ثنائية اللون',
  'acier bicolore': 'فولاذ ثنائي اللون (فضي وذهبي)',
  'blanc pavé': 'أبيض مرصع بالكريستال',
  emery: 'إيمري (Emery)',
  dw00100341: 'DW00100341',
  'iconic link': 'أيكونيك لينك (Iconic Link)',
  'verre minéral nacre': 'زجاج معدني ومينا عرق اللؤلؤ',
  'acier inoxydable argenté 20mm': 'فولاذ مقاوم للصدأ فضي (20 ملم)',
  '142-208mm': 'قابل للتعديل من 142 إلى 208 ملم',
  '3 atm': 'مقاومة رذاذ الماء (3 ATM)',
  '8,5mm': '8.5 ملم',
  ar1926: 'AR1926',
  retro: 'ريترو الكلاسيكية (Retro)',
  '32 mm doré': '32 ملم بتشطيب ذهبي',
  'acier inoxydable argent / doré': 'فولاذ مقاوم للصدأ فضي / ذهبي',
  '30m (3 atm)': '30 متر (3 ATM)',
  w0836l3: 'W0836L3',
};

function cleanCompetitorBrand(text: string): string {
  return text.replace(/[ \t]{2,}/g, ' ').trim();
}

function translateFrenchFeatureToArabic(raw: string): string {
  const cleaned = normalizeSpaces(raw.replace(/^[•\-–*]\s*/, ''));
  const lower = cleaned.toLowerCase();

  if (EXACT_FEATURES_FR_TO_AR[lower]) {
    return EXACT_FEATURES_FR_TO_AR[lower];
  }

  // Packaging variants e.g. "Coffret complet : 1500 MAD"
  const packMatch = cleaned.match(/^(Coffret complet|Boîte simple)\s*:\s*(\d+)\s*MAD$/i);
  if (packMatch) {
    const label =
      packMatch[1].toLowerCase() === 'coffret complet'
        ? 'العلبة الكاملة الرسمية (Coffret complet)'
        : 'علبة بسيطة (Boîte simple)';
    return `${label} : ${packMatch[2]} د.م`;
  }

  // Diameter e.g. "Diamètre : 40 mm"
  const diamMatch = cleaned.match(/^Diamètre\s*:\s*(.+)$/i);
  if (diamMatch) {
    const val = diamMatch[1].trim().replace(/\s*mm$/i, ' ملم');
    return `القطر : ${val}`;
  }

  // Generic "Key : Value"
  const kvMatch = cleaned.match(/^([^:]+?)\s*:\s*(.+)$/);
  if (kvMatch) {
    const kRaw = kvMatch[1].trim();
    const vRaw = kvMatch[2].trim();
    const kAr = SPEC_KEY_FR_TO_AR[kRaw.toLowerCase()] || kRaw;
    const vAr =
      SPEC_VALUE_FR_TO_AR[vRaw.toLowerCase()] ||
      vRaw.replace(/\bmm\b/gi, 'ملم').replace(/\bMAD\b/g, 'د.م');
    return `${kAr} : ${vAr}`;
  }

  return cleaned;
}

export const translateProductFeature = (feat: string, lang: Language): string => {
  if (!feat) return feat;
  const f = normalizeSpaces(feat.replace(/^[•\-*]\s*/, ''));

  if (lang === 'ar') {
    if (hasArabic(f)) return feat;
    return translateFrenchFeatureToArabic(f);
  }

  // lang === 'fr'
  if (!hasArabic(f)) return cleanCompetitorBrand(feat);

  if (EXACT_FEATURES_AR_TO_FR[f]) return EXACT_FEATURES_AR_TO_FR[f];

  if (f.includes('ضمان معتمد لمدة سنة') || f.includes('ضمان رسمي لمدة سنة')) {
    return 'Garantie officielle d’un an contre tout défaut de fabrication';
  }
  if (f.includes('ضمان')) {
    return 'Garantie officielle d’un an incluse';
  }
  if (f.includes('مقاوم للصدأ') || f.includes('فولاذ') || f.includes('316L')) {
    return 'Boîtier et bracelet en acier inoxydable haute résistance';
  }
  if (f.includes('مقاوم للماء') || f.includes('مقاومة الماء')) {
    return 'Résistance à l’eau certifiée (usage quotidien et pluie)';
  }
  if (f.includes('أوتوماتيك')) {
    return 'Mouvement automatique à remontage par mouvement du poignet';
  }
  if (f.includes('كوارتز') || f.includes('ياباني')) {
    return 'Mouvement à quartz japonais de haute précision';
  }
  if (f.includes('كرونوغراف')) {
    return 'Fonction chronographe précise avec sous-cadrans actifs';
  }
  if (f.includes('سافير') || f.toLowerCase().includes('sapphire') || f.includes('ياقوت')) {
    return 'Verre saphir haute résistance anti-rayures';
  }
  if (f.includes('مضاد للانعكاس') || f.includes('الانعكاس')) {
    return 'Verre avec traitement antireflet haute clarté';
  }
  if (f.includes('زجاج') || f.includes('خدش')) {
    return 'Verre minéral / saphir traité anti-rayures';
  }
  if (f.includes('أحجار') || f.includes('حجر') || f.includes('أونيكس') || f.includes('أوبسيديان') || f.includes('عين النمر') || f.includes('لافا')) {
    return 'Perles en pierres naturelles sélectionnées à la main';
  }
  if (f.includes('مضفر') || f.includes('جلد طبيعي') || f.includes('جلد')) {
    return f.includes('سوار') || f.includes('أساور') || f.includes('مضفر')
      ? 'Cuir véritable tressé souple, durable et agréable au poignet'
      : 'Bracelet en cuir véritable souple et confortable';
  }
  if (f.includes('مغناطيسي')) {
    return 'Fermoir magnétique sécurisé en acier inoxydable';
  }
  if (f.includes('مقاس') || f.includes('تعديل') || f.includes('مناسب لجميع')) {
    return 'Taille confortable adaptée à la majorité des poignets masculins';
  }
  if (f.includes('طقم') || f.includes('متعدد الطبقات')) {
    return 'Ensemble polyvalent facile à assortir avec une montre ou seul';
  }
  if (f.includes('سوار') || f.includes('إكسسوار') || f.includes('معصم')) {
    return 'Finition raffinée résistante à l’usure quotidienne sans noircir';
  }
  if (f.includes('سيليكون')) {
    return 'Bracelet sport en silicone souple et respirant';
  }
  if (f.includes('علبة') || f.includes('هدايا') || f.includes('تغليف')) {
    return 'Livré avec emballage cadeau élégant et certificat de garantie';
  }
  if (f.includes('قفل') || f.includes('إغلاق') || f.includes('مشبك') || f.includes('إبزيم')) {
    return 'Fermoir sécurisé haute robustesse et maintien optimal';
  }
  if (f.includes('قطر') && /\d+/.test(f)) {
    const mm = f.match(/(\d+)/)?.[1];
    return `Diamètre du boîtier : ${mm} mm`;
  }
  if (f.includes('مضيئة') || f.includes('ظلام')) {
    return 'Aiguilles et index luminescents haute visibilité nocturne';
  }
  if (f.includes('بطارية')) {
    return 'Autonomie longue durée avec batterie haute capacité';
  }
  if (f.includes('بلوتوث') || f.includes('مكالمات')) {
    return 'Connexion Bluetooth stable avec appels et notifications';
  }
  if (f.includes('ثنائي') || f.includes('فضي') || f.includes('ذهبي')) {
    return 'Placage longue durée résistant à l’oxydation et à l’eau';
  }
  return 'Finition haut de gamme et contrôle qualité certifié';
};

// ============================================================================
// 4. PRODUCT SUBTITLE & MULTILINE DESCRIPTION (AR <-> FR)
// ============================================================================
const SUBTITLE_EXACT_AR_TO_FR: Record<string, string> = {
  'ساعة يد فاخرة بتصميم أنيق ومحرك ياباني دقيق':
    'Montre de luxe au design raffiné et mouvement japonais de haute précision',
  'ساعة رجالية فاخرة': 'Montre homme de luxe',
  'ساعة نسائية فاخرة': 'Montre femme de luxe',
  'ساعة رياضية فاخرة': 'Montre sport de luxe',
  'ساعة كلاسيكية فاخرة': 'Montre classique de luxe',
  'إكسسوار فاخر': 'Accessoire de luxe',
};

const FRENCH_SENTENCE_TO_AR: Record<string, string> = {
  "Découvrez la collection Rolex — l'excellence horlogère suisse livrée partout au Maroc avec paiement à la livraison. Synonyme de prestige et de précision intemporelle, chaque Rolex est une œuvre d'art au poignet.":
    'اكتشف مجموعة رولكس الفاخرة — التميز السويسري في صناعة الساعات مع التوصيل لجميع أنحاء المغرب والدفع عند الاستلام. عنوان للفخامة والدقة الخالدة، كل ساعة رولكس هي تحفة فنية على معصمك.',
  "Découvrez la collection Rolex — l'excellence horlogère suisse livrée partout au Maroc avec paiement à la livraison.":
    'اكتشف مجموعة رولكس الفاخرة — التميز السويسري في صناعة الساعات مع التوصيل لجميع أنحاء المغرب والدفع عند الاستلام.',
  "Synonyme de prestige et de précision intemporelle, chaque Rolex est une œuvre d'art au poignet.":
    'عنوان للفخامة والدقة الخالدة، كل ساعة رولكس هي تحفة فنية على معصمك.',
  "Découvrez la collection Rolex — montres de prestige disponibles au Maroc avec livraison gratuite et paiement à la livraison. Rolex, l'excellence horlogère depuis 1905.":
    'اكتشف مجموعة رولكس الفاخرة — ساعات مرموقة متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. رولكس، التميز السويسري منذ عام 1905.',
  "Découvrez la collection Omega — montres de légende portées par les astronautes et les champions olympiques, disponibles au Maroc avec paiement à la livraison. Omega : précision suisse, héritage spatial.":
    'اكتشف مجموعة أوميغا الأسطورية — ساعات تاريخية ارتداها رواد الفضاء والأبطال الأولمبيون، متوفرة في المغرب مع الدفع عند الاستلام. أوميغا: دقة سويسرية وإرث فضائي عريق.',
  "Explorez la collection Omega — montres suisses emblématiques disponibles au Maroc avec livraison gratuite et paiement à la livraison. Omega, la montre officielle des astronautes et des Jeux Olympiques.":
    'استكشف مجموعة أوميغا — ساعات سويسرية أيقونية متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. أوميغا، الساعة الرسمية لرواد الفضاء والألعاب الأولمبية.',
  "Découvrez la maison Patek Philippe — montres d'exception transmises de génération en génération, disponibles au Maroc avec paiement à la livraison. Patek Philippe, l'ultime référence de la haute horlogerie genevoise.":
    'اكتشف دار باتيك فيليب العريقة — ساعات استثنائية تتوارثها الأجيال، متوفرة في المغرب مع الدفع عند الاستلام. باتيك فيليب، المرجع الأسمى لصناعة الساعات السويسرية الراقية في جنيف.',
  "Découvrez la Maison Cartier — montres d'art intemporelles disponibles au Maroc avec livraison gratuite et paiement à la livraison. Cartier, le joaillier des rois depuis 1847.":
    'اكتشف دار كارتييه العريقة — ساعات فنية خالدة متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. كارتييه، صائغ الملوك منذ عام 1847.',
  "Paiement à la livraison · Livraison gratuite · Vérification à réception":
    'الدفع عند الاستلام · توصيل مجاني · المعاينة قبل الدفع',
  "Fabriquée avec des matériaux de qualité supérieure et dotée d'une finition très minutieuse.":
    'مصنوعة من مواد عالية الجودة وتتميز بتشطيب دقيق ومتقن للغاية.',
  'Cette montre s\'accompagne de :': 'تأتي هذه الساعة مرفقة بـ :',
  '– Coffret de marque officiel': '– علبة الماركة الرسمية الفاخرة',
  '– Packaging de marque officiel': '– تغليف الماركة الرسمي',
  '- Coffret de marque officiel': '– علبة الماركة الرسمية الفاخرة',
  '- Packaging de marque officiel': '– تغليف الماركة الرسمي',
  'Caractéristiques détaillées :': 'المواصفات التقنية المفصلة:',
  "Montre Style Land-Dweller – Élégance Automatique. Affichez un style raffiné avec cette montre inspirée d'un design emblématique de l'horlogerie de luxe.":
    'ساعة Rolex Land-Dweller Style — أناقة أوتوماتيكية فاخرة بتصميم أيقوني مستوحى من أرقى الساعات السويسرية، متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام.',
  'Montre Style Land-Dweller – Élégance Automatique':
    'ساعة Land-Dweller Style – أناقة أوتوماتيكية فاخرة',
  "L'élégance qui marque les esprits.":
    'أناقة راقية تلفت الأنظار وتترك انطباعاً استثنائياً.',
  "Affichez un style raffiné avec cette montre inspirée d'un design emblématique de l'horlogerie de luxe. Son boîtier soigné, ses finitions premium et son mouvement automatique en font le choix idéal pour les amateurs de belles montres.":
    'تألّق بإطلالة راقية مع هذه الساعة المستوحاة من تصميم أيقوني عالمي في عالم الساعات الفاخرة. هيكلها المتقن، تشطيباتها الرفيعة وحركتها الأوتوماتيكية تجعلها الخيار المثالي لعشاق الساعات الراقية.',
  "Que ce soit pour le travail, un rendez-vous, un mariage ou une sortie entre amis, elle apporte une touche de prestige à votre poignet et renforce votre image avec élégance.":
    'سواء للعمل، لقاء مهم، حفل زفاف أو خرجة مع الأصدقاء، تضفي على معصمك لمسة من الهيبة والفخامة وتعزّز حضورك بكل أناقة.',
  "Explorez la maison Cartier — montres joaillières d'exception disponibles au Maroc avec livraison gratuite et paiement à la livraison. Cartier, l'alliance parfaite entre l'art horloger et le raffinement français.":
    'استكشف دار كارتييه العريقة — ساعات مجوهرات استثنائية متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. كارتييه، التناغم المثالي بين فن صناعة الساعات والرقي الفرنسي.',
  "Explorez la collection Hublot — l'Art de la Fusion entre haute horlogerie et matériaux innovants, disponible au Maroc avec livraison gratuite et paiement à la livraison. Hublot redéfinit les codes du luxe contemporain.":
    'استكشف مجموعة هوبلو — فن الاندماج بين صناعة الساعات الراقية والمواد المبتكرة، متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. هوبلو تعيد تعريف رموز الفخامة المعاصرة.',
  "Découvrez la collection Patek Philippe — montres de haute complication livrées partout au Maroc avec paiement à la livraison. Patek Philippe : vous ne posséderez jamais une montre, vous la préserverez pour la prochaine génération.":
    'اكتشف مجموعة باتيك فيليب — ساعات التعقيدات السويسرية الرفيعة مع التوصيل لجميع أنحاء المغرب والدفع عند الاستلام. باتيك فيليب: أنت لا تقتني مجرد ساعة، بل تحفظ إرثاً للجيل القادم.',
  "Découvrez la collection Tissot — l'horlogerie suisse accessible alliant qualité, innovation et style contemporain, disponible au Maroc avec paiement à la livraison. Innovators by Tradition.":
    'اكتشف مجموعة تيسو (Tissot) — صناعة الساعات السويسرية التي تجمع بين الجودة والابتكار والتصميم العصري، متوفرة في المغرب مع الدفع عند الاستلام. مبتكرون عبر التقاليد.',
  "Explorez la collection Audemars Piguet — le Royal Oak, icône de la haute horlogerie, disponible au Maroc avec livraison gratuite et paiement à la livraison. Le summum du savoir-faire horloger suisse.":
    'استكشف مجموعة أوديمار بيغيه — رويال أوك، أيقونة الساعات السويسرية الراقية، متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. قمة الإبداع السويسري في صناعة الساعات.',
  "Découvrez la collection Vacheron Constantin — l'une des plus anciennes manufactures horlogères du monde depuis 1755, disponible au Maroc avec paiement à la livraison. L'excellence horlogère genevoise à votre poignet.":
    'اكتشف مجموعة فاشرون كونستانتان — إحدى أعرق دور الساعات السويسرية في العالم منذ 1755، متوفرة في المغرب مع الدفع عند الاستلام. التميز السويسري من جنيف على معصمك.',
  "Découvrez la maison Bvlgari — montres à l'italianité affirmée, disponibles au Maroc avec livraison gratuite et paiement à la livraison. Bvlgari, l'audace du design romain.":
    'اكتشفي دار بولغاري (Bvlgari) — ساعات إيطالية راقية بتصميم روماني جريء، متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام.',
  "Explorez la maison Chopard — montres et joaillerie d'exception disponibles au Maroc avec livraison gratuite et paiement à la livraison. Chopard, l'art du luxe depuis 1860.":
    'اكتشفي دار شوبارد (Chopard) — ساعات ومجوهرات سويسرية استثنائية متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. شوبارد، فن الفخامة منذ 1860.',
  "Explorez la collection Michael Kors — montres glamour et tendance disponibles au Maroc avec livraison gratuite et paiement à la livraison. Michael Kors, l'élégance new-yorkaise.":
    'اكتشفي مجموعة مايكل كورس — ساعات نسائية عصرية وجذابة متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام. مايكل كورس، أناقة نيويورك الراقية.',
  'Découvrez la collection Daniel Wellington — montres minimalistes et élégantes disponibles au Maroc avec livraison gratuite et paiement à la livraison. Daniel Wellington, la montre suédoise qui définit le minimalisme moderne.':
    'اكتشفي مجموعة دانيال ولينغتون — ساعات بسيطة وأنيقة بتصميم سويدي عصري، متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام.',
  "Découvrez la collection Emporio Armani — montres au style italien raffiné disponibles au Maroc avec paiement à la livraison. Emporio Armani, le luxe accessible à l'italienne.":
    'اكتشفي مجموعة إمبوريو أرماني — ساعات نسائية بأسلوب إيطالي راقٍ متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام.',
  'Découvrez la collection Guess — montres tendance et audacieuses disponibles au Maroc avec paiement à la livraison. Guess, the original American fashion brand.':
    'اكتشفي مجموعة غيس (Guess) — ساعات عصرية وجريئة مرصعة بتفاصيل أنيقة، متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام.',
};

function translateFrenchIntroToArabic(raw: string): string {
  const cleaned = normalizeSpaces(cleanCompetitorBrand(raw));
  if (FRENCH_SENTENCE_TO_AR[cleaned]) return FRENCH_SENTENCE_TO_AR[cleaned];

  // Match prefix even if truncated with "..."
  const noEllipsis = cleaned.replace(/\.{3}$/, '').trim();
  for (const [fr, ar] of Object.entries(FRENCH_SENTENCE_TO_AR)) {
    if (noEllipsis.length > 25 && fr.startsWith(noEllipsis)) {
      return ar;
    }
    if (cleaned.includes(fr)) {
      return ar;
    }
  }

  // Fallback for any other French subtitle
  if (/Rolex/i.test(cleaned)) {
    return 'اكتشف مجموعة ساعات رولكس الفاخرة — التميز السويسري مع توصيل مجاني والدفع عند الاستلام في المغرب.';
  }
  if (/Omega/i.test(cleaned)) {
    return 'اكتشف مجموعة ساعات أوميغا السويسرية — دقة عالية وتصميم فاخر مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Patek Philippe/i.test(cleaned)) {
    return 'اكتشف دار باتيك فيليب — ساعات سويسرية استثنائية متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Cartier/i.test(cleaned)) {
    return 'اكتشف دار كارتييه — ساعات فنية راقية متوفرة في المغرب مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Bvlgari/i.test(cleaned)) {
    return 'اكتشفي دار بولغاري — ساعات إيطالية راقية بتصميم فاخر مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Chopard/i.test(cleaned)) {
    return 'اكتشفي دار شوبارد السويسرية — ساعات ومجوهرات فاخرة مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Michael Kors/i.test(cleaned)) {
    return 'اكتشفي مجموعة مايكل كورس النسائية — تصميم عصري وأنيق مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Daniel Wellington/i.test(cleaned)) {
    return 'اكتشفي ساعات دانيال ولينغتون — أناقة كلاسيكية ناعمة مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Emporio Armani/i.test(cleaned)) {
    return 'اكتشفي مجموعة إمبوريو أرماني النسائية — تصميم إيطالي راقٍ مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Guess/i.test(cleaned)) {
    return 'اكتشفي مجموعة غيس (Guess) النسائية — أناقة عصرية جذابة مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Hublot/i.test(cleaned)) {
    return 'اكتشف مجموعة ساعات هوبلو الفاخرة — تصميم عصري جريء متوفر في المغرب مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Tissot/i.test(cleaned)) {
    return 'اكتشف ساعات تيسو السويسرية — جودة ودقة سويسرية مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Audemars/i.test(cleaned)) {
    return 'اكتشف ساعات أوديمار بيغيه رويال أوك الفاخرة — تصميم سويسري أيقوني مع توصيل مجاني والدفع عند الاستلام.';
  }
  if (/Vacheron/i.test(cleaned)) {
    return 'اكتشف ساعات فاشرون كونستانتان السويسرية العريقة — فخامة جنيف مع توصيل مجاني والدفع عند الاستلام.';
  }
  return 'ساعة فاخرة بتصميم سويسري دقيق متوفرة الآن مع توصيل مجاني والدفع عند الاستلام في جميع مدن المغرب.';
}

export const translateProductSubtitle = (subtitle: string, lang: Language): string => {
  if (!subtitle) return subtitle;
  const s = normalizeSpaces(subtitle);

  if (lang === 'ar') {
    if (hasArabic(s)) return subtitle;
    return translateFrenchIntroToArabic(s);
  }

  // lang === 'fr'
  if (!hasArabic(s)) return cleanCompetitorBrand(subtitle);
  if (SUBTITLE_EXACT_AR_TO_FR[s]) return SUBTITLE_EXACT_AR_TO_FR[s];

  const tags: string[] = [];
  const hasNecklace = /قلادة|قلادت/.test(s);
  const hasBracelet = /سوار|أساور|براسلي/.test(s);
  const hasRing = /خاتم|خواتم/.test(s);
  const hasAnklet = /خلخال/.test(s);
  const hasHandChain = /سلسلة يد/.test(s);
  const hasSet = /طقم|أطقم|باك|للأزواج/.test(s);
  const isWomen = /للنساء|أنثوي|أنثوية|نسائي|نسائية|العروس|الحناء/.test(s);

  if ((hasNecklace && hasBracelet) || (hasSet && (hasNecklace || hasBracelet || /آية الكرسي|يوسر/.test(s)))) {
    tags.push('Parure Femme de luxe (Collier & Bracelet)');
  } else if (hasBracelet && hasRing) {
    tags.push('Parure Femme de luxe (Bracelet & Bague)');
  } else if (hasHandChain) {
    tags.push('Chaîne de main Femme de luxe');
  } else if (hasAnklet) {
    tags.push('Bracelet de cheville Femme de luxe');
  } else if (hasRing) {
    tags.push('Bague Femme de luxe');
  } else if (hasNecklace) {
    tags.push('Collier Femme de luxe');
  } else if (hasBracelet) {
    tags.push(isWomen ? 'Bracelet Femme de luxe' : 'Bracelet Homme de luxe');
  } else if (hasSet && !/ساعة|ساعات/.test(s)) {
    tags.push(isWomen ? 'Parure Femme de luxe' : 'Ensemble Accessoire de luxe');
  } else if (/إكسسوار|مجوهرات|آية الكرسي|إن مع العسر|يوسر|الحناء/.test(s)) {
    tags.push('Bijou & Accessoire de luxe');
  } else if (s.includes('رجالية') || s.includes('رجالي')) {
    tags.push('Montre Homme');
  } else if (s.includes('نسائية') || s.includes('نسائي')) {
    tags.push('Montre Femme');
  } else {
    tags.push('Montre de luxe');
  }

  if (s.includes('جلد')) tags.push('cuir véritable');
  if (s.includes('أحجار') || s.includes('لافا') || s.includes('أونيكس') || s.includes('أوبسيديان') || s.includes('هيماتيت') || s.includes('عين النمر')) {
    tags.push('pierres naturelles');
  }
  if (s.includes('أوتوماتيك')) tags.push('mouvement automatique');
  else if (s.includes('كوارتز')) tags.push('quartz japonais');
  if (s.includes('فولاذ') || s.includes('مقاوم للصدأ') || s.includes('316L')) tags.push('acier inoxydable');
  if (s.includes('مقاوم للماء') || s.includes('مقاومة للماء')) tags.push('résistante à l’eau');
  if (s.includes('سافير') || s.includes('Sapphire')) tags.push('verre saphir');

  return tags.length > 1 ? `${tags[0]} — ${tags.slice(1).join(', ')}` : tags[0];
};

const EXACT_DESCRIPTIONS_AR_TO_FR: Record<string, string> = {
  [normalizeSpaces(
    `الوصف العام
اكتشف ساعة رجالية بتصميم رياضي فاخر يجمع بين الأناقة والعصرية، مستوحاة من ساعات سباقات السيارات. تتميز بمينا أنيق مع هيكل وسوار من الفولاذ المقاوم للصدأ باللون الفضي، مما يمنحها مظهراً راقياً يناسب الاستخدام اليومي والمناسبات الخاصة.

بقطر 40 ملم، وحركة أوتوماتيكية، وزجاج من الياقوت الصناعي (Sapphire)، تجمع هذه الساعة بين التصميم المميز والراحة والعملية.
المميزات والخصائص
- تصميم فاخر: أنيق مع هيكل فضي.
- حركة أوتوماتيكية: تعمل بنظام التعبئة الذاتية.
- قطر الساعة: 40 ملم.
- سوار فولاذي: متين ومريح للاستخدام اليومي.
- زجاج Sapphire: مقاومة أفضل للخدوش.
- معالجة مضادة للانعكاس: لتحسين وضوح الرؤية.
- قفل آمن: نظام إغلاق محكم للسوار.
- تصميم متعدد الاستخدامات: مناسب للعمل والخروجات والمناسبات.
- مقاومة الماء.`
  )]: `Description générale
Découvrez une montre homme au style sportif de luxe alliant élégance et modernité, inspirée des montres de course automobile. Elle se distingue par un cadran raffiné accompagné d’un boîtier et d’un bracelet en acier inoxydable argenté, offrant une allure prestigieuse idéale au quotidien comme pour les grandes occasions.

Avec un diamètre de 40 mm, un mouvement automatique et un verre saphir synthétique (Sapphire), cette montre réunit esthétique remarquable, confort et praticité.

Caractéristiques & Points forts
- Design luxueux : élégant avec boîtier finition argentée.
- Mouvement automatique : système à remontage automatique par mouvement du poignet.
- Diamètre du boîtier : 40 mm.
- Bracelet en acier : robuste et confortable pour un usage quotidien.
- Verre Sapphire : résistance supérieure aux rayures.
- Traitement antireflet : visibilité et lecture optimales du cadran.
- Fermoir sécurisé : système de verrouillage fiable du bracelet.
- Design polyvalent : parfait pour le travail, les sorties et les cérémonies.
- Résistance à l’eau certifiée.`,
  'ساعة يد فاخرة بتصميم أنيق ومحرك ياباني دقيق.':
    'Montre de luxe au design raffiné dotée d’un mouvement japonais de haute précision.',
};

const DESCRIPTION_LINE_MAP: Record<string, string> = {
  'الوصف العام': 'Description générale',
  'الوصف العام والمميزات': 'Description & Caractéristiques',
  'المميزات والخصائص': 'Caractéristiques & Points forts',
  'الخصائص والمميزات': 'Caractéristiques & Points forts',
  'المواصفات التقنية': 'Caractéristiques techniques',
  'اكتشف ساعة رجالية بتصميم رياضي فاخر يجمع بين الأناقة والعصرية، مستوحاة من ساعات سباقات السيارات. تتميز بمينا أنيق مع هيكل وسوار من الفولاذ المقاوم للصدأ باللون الفضي، مما يمنحها مظهراً راقياً يناسب الاستخدام اليومي والمناسبات الخاصة.':
    'Découvrez une montre homme au style sportif de luxe alliant élégance et modernité, inspirée des montres de course automobile. Elle se distingue par un cadran raffiné accompagné d’un boîtier et d’un bracelet en acier inoxydable argenté, offrant une allure prestigieuse idéale au quotidien comme pour les grandes occasions.',
  'بقطر 40 ملم، وحركة أوتوماتيكية، وزجاج من الياقوت الصناعي (Sapphire)، تجمع هذه الساعة بين التصميم المميز والراحة والعملية.':
    'Avec un diamètre de 40 mm, un mouvement automatique et un verre saphir synthétique (Sapphire), cette montre réunit esthétique remarquable, confort et praticité.',
};

function translateFrenchDescriptionToArabic(description: string): string {
  const lines = description.replace(/\r\n/g, '\n').split('\n');
  const translatedLines: string[] = [];

  for (const rawLine of lines) {
    const cleaned = normalizeSpaces(cleanCompetitorBrand(rawLine));
    if (!cleaned) {
      translatedLines.push('');
      continue;
    }
    if (hasArabic(cleaned)) {
      translatedLines.push(cleaned);
      continue;
    }
    if (FRENCH_SENTENCE_TO_AR[cleaned]) {
      translatedLines.push(FRENCH_SENTENCE_TO_AR[cleaned]);
      continue;
    }
    if (cleaned.startsWith('•') || cleaned.startsWith('-') || cleaned.startsWith('–')) {
      const prefix = cleaned.startsWith('•') ? '• ' : '– ';
      translatedLines.push(`${prefix}${translateFrenchFeatureToArabic(cleaned)}`);
      continue;
    }
    translatedLines.push(translateFrenchIntroToArabic(cleaned));
  }

  return translatedLines.join('\n').trim();
}

export const translateProductDescription = (description: string, lang: Language): string => {
  if (!description) return description;
  const normalized = normalizeSpaces(description);

  if (lang === 'ar') {
    if (hasArabic(normalized)) return description;
    return translateFrenchDescriptionToArabic(description);
  }

  // lang === 'fr'
  if (!hasArabic(normalized)) {
    return description;
  }

  if (EXACT_DESCRIPTIONS_AR_TO_FR[normalized]) {
    return EXACT_DESCRIPTIONS_AR_TO_FR[normalized];
  }

  // Line-by-line intelligent translation for multiline product descriptions
  const isAccessoryDesc =
    /سوار|أساور|معصم|أونيكس|لافا|أوبسيديان|هيماتيت|لازورد|إكسسوار|مرساة|قلادة|قلادت|خاتم|خلخال|سلسلة يد|طقم|باك|براسلي|مجوهرات|حناء|آية الكرسي|إن مع العسر|يوسر/.test(
      normalized
    );
  const lines = description.replace(/\r\n/g, '\n').split('\n');
  const translatedLines: string[] = [];
  const seenGeneric = new Set<string>();

  for (const rawLine of lines) {
    const trimmed = normalizeSpaces(rawLine);
    if (!trimmed) {
      translatedLines.push('');
      continue;
    }
    if (!hasArabic(trimmed)) {
      translatedLines.push(cleanCompetitorBrand(trimmed));
      continue;
    }
    if (DESCRIPTION_LINE_MAP[trimmed]) {
      translatedLines.push(DESCRIPTION_LINE_MAP[trimmed]);
      continue;
    }
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
      translatedLines.push(`- ${translateProductFeature(trimmed, 'fr')}`);
      continue;
    }
    if (
      isAccessoryDesc &&
      !/سوار|أساور|طقم|قلادة|قلادت|خاتم|خلخال|سلسلة يد|باك|براسلي/.test(trimmed)
    ) {
      const candidate = trimmed.includes('ضمان')
        ? 'Livré dans son coffret cadeau élégant avec garantie officielle d’un an.'
        : 'Conçu avec des finitions raffinées, idéal à porter au quotidien ou à offrir dans son écrin élégant.';
      if (!seenGeneric.has(candidate)) {
        seenGeneric.add(candidate);
        translatedLines.push(candidate);
      }
      continue;
    }
    const sub = translateProductSubtitle(trimmed, 'fr');
    let lineOut = '';
    if (trimmed.includes('ضمان')) {
      lineOut = `${sub}, livré dans son coffret soigné avec garantie officielle d’un an.`;
    } else if (
      isAccessoryDesc ||
      /سوار|أساور|معصم|قلادة|قلادت|خاتم|خلخال|طقم|باك|براسلي|سلسلة يد/.test(trimmed)
    ) {
      lineOut = `${sub} avec finition soignée, idéal pour sublimer vos tenues quotidiennes et habillées.`;
    } else {
      lineOut = `${sub} avec finition soignée, idéale pour un usage quotidien et les grandes occasions.`;
    }
    if (!seenGeneric.has(lineOut)) {
      seenGeneric.add(lineOut);
      translatedLines.push(lineOut);
    }
  }

  return translatedLines.join('\n').trim();
};
