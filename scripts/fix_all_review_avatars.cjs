const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'store.json');
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

const MALE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1541577141970-eebc83ebe30e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1583864697784-a0efc8379f70?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1562788869-4ed32648eb72?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
];

const FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=150&q=80',
];

const FEMALE_NAME_KEYWORDS = [
  'نادية', 'منى', 'بشرى', 'كوثر', 'فاطمة', 'نورة', 'لطيفة', 'مريم', 'زينب', 'حنان',
  'سلمى', 'إكرام', 'سناء', 'شيماء', 'خديجة', 'هاجر', 'أسماء', 'لبنى', 'إيمان', 'صفاء',
  'رجاء', 'غيثة', 'ياسمين', 'هدى', 'سارة', 'ابتسام', 'أمل', 'ليلى', 'سميرة', 'فتيحة',
  'نزهة', 'حسناء', 'دنيا', 'بثينة', 'إلهام', 'نوال', 'سعاد', 'حليمة', 'أمينة', 'نجاة',
  'سكينة', 'وفاء', 'أميمة', 'كنزة', 'مروة', 'صوفيا', 'نجوى', 'عائشة'
];

function isFemale(name) {
  if (!name) return false;
  const first = name.trim().split(' ')[0];
  return FEMALE_NAME_KEYWORDS.some(fn => name.includes(fn) || first.includes(fn));
}

let maleIdx = 0;
let femaleIdx = 0;

db.reviews.forEach((rev, idx) => {
  const female = isFemale(rev.author);
  if (female) {
    rev.customerPhoto = FEMALE_AVATARS[femaleIdx % FEMALE_AVATARS.length];
    femaleIdx++;
  } else {
    rev.customerPhoto = MALE_AVATARS[maleIdx % MALE_AVATARS.length];
    maleIdx++;
  }
});

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✅ Successfully assigned diverse, gender-matched unique avatars across all ${db.reviews.length} reviews!`);

// Print the first 10 reviews
console.log('\n--- FIRST 10 REVIEWS AVATARS ---');
db.reviews.slice(0, 10).forEach((r, i) => {
  console.log(`${i}: ${r.author} (${isFemale(r.author) ? 'F' : 'M'}) -> ${r.customerPhoto.slice(28, 65)}`);
});
