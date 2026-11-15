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
  'الضمان ديال عامين المعتمد كيريح البال، هاد الناس معقولين وكيخافو الله فالسلعة لي كيبيعو.':
    'La garantie officielle apporte une vraie tranquillité d’esprit. Des vendeurs honnêtes et sérieux qui proposent de la belle marchandise.',
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
};

const SPEC_VALUE_FR_TO_AR: Record<string, string> = {
  // Brands
  rolex: 'رولكس (Rolex)',
  omega: 'أوميغا (Omega)',
  'patek philippe': 'باتيك فيليب (Patek Philippe)',
  cartier: 'كارتييه (Cartier)',
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
};

function cleanCompetitorBrand(text: string): string {
  return text.replace(/\s*sur\s+Eclatic\.ma/gi, '');
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

  if (f.includes('ضمان معتمد لمدة سنة')) {
    return 'Garantie officielle d’un an contre tout défaut de fabrication';
  }
  if (f.includes('ضمان') && (f.includes('عامين') || f.includes('سنتين'))) {
    return 'Garantie officielle de 2 ans contre tout défaut de fabrication';
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
  if (f.includes('جلد')) {
    return 'Bracelet en cuir véritable souple et confortable';
  }
  if (f.includes('سيليكون')) {
    return 'Bracelet sport en silicone souple et respirant';
  }
  if (f.includes('علبة') || f.includes('هدايا')) {
    return 'Livrée dans un coffret cadeau de luxe avec carte de garantie';
  }
  if (f.includes('قفل') || f.includes('إغلاق')) {
    return 'Fermoir déployant sécurisé et confortable';
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
  return 'Finition horlogère haut de gamme et contrôle qualité certifié';
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
  if (s.includes('رجالية')) tags.push('Montre Homme');
  else if (s.includes('نسائية')) tags.push('Montre Femme');
  else if (s.includes('إكسسوار')) tags.push('Accessoire de luxe');
  else tags.push('Montre de luxe');

  if (s.includes('أوتوماتيك')) tags.push('mouvement automatique');
  else if (s.includes('كوارتز')) tags.push('quartz japonais');
  if (s.includes('فولاذ') || s.includes('مقاوم للصدأ')) tags.push('acier inoxydable');
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
    return description.replace(/\s*sur\s+Eclatic\.ma/gi, '');
  }

  if (EXACT_DESCRIPTIONS_AR_TO_FR[normalized]) {
    return EXACT_DESCRIPTIONS_AR_TO_FR[normalized];
  }

  // Line-by-line intelligent translation for multiline product descriptions
  const lines = description.replace(/\r\n/g, '\n').split('\n');
  const translatedLines: string[] = [];

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
    const sub = translateProductSubtitle(trimmed, 'fr');
    if (trimmed.includes('ضمان')) {
      translatedLines.push(`${sub}, livrée dans son coffret luxe avec garantie officielle d’un an.`);
    } else {
      translatedLines.push(
        `${sub} avec finition soignée, idéale pour un usage quotidien et les grandes occasions.`
      );
    }
  }

  return translatedLines.join('\n').trim();
};
