import { CategoryInfo, GameItem, Team } from '../types';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'أبو شنيف',
    shortName: 'ABO SHAIF',
    color: '#A855F7', // Violet / Purple
    bgBadge: 'from-purple-600/30 to-purple-900/40 border-purple-500/60',
    logo: 'crown',
  },
  {
    id: 'team-2',
    name: 'يزيد',
    shortName: 'YAZEED',
    color: '#06B6D4', // Cyan
    bgBadge: 'from-cyan-600/30 to-cyan-900/40 border-cyan-500/60',
    logo: 'shield',
  },
  {
    id: 'team-3',
    name: 'بندريتا',
    shortName: 'BANDARITA',
    color: '#10B981', // Emerald
    bgBadge: 'from-emerald-600/30 to-emerald-900/40 border-emerald-500/60',
    logo: 'zap',
  },
  {
    id: 'team-4',
    name: 'فهد سال',
    shortName: 'FAHAD SAL',
    color: '#F59E0B', // Amber
    bgBadge: 'from-amber-600/30 to-amber-900/40 border-amber-500/60',
    logo: 'flame',
  },
  {
    id: 'team-5',
    name: 'مروان',
    shortName: 'MARWAN',
    color: '#F43F5E', // Rose
    bgBadge: 'from-rose-600/30 to-rose-900/40 border-rose-500/60',
    logo: 'swords',
  },
  {
    id: 'team-6',
    name: 'عزيز',
    shortName: 'AZIZ',
    color: '#3B82F6', // Blue
    bgBadge: 'from-blue-600/30 to-blue-900/40 border-blue-500/60',
    logo: 'target',
  },
];

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'digital',
    nameAr: 'إلكتروني',
    nameEn: 'DIGITAL',
    description: 'ألعاب الفيديو والشاشات والأجهزة الإلكترونية',
    accentColor: '#38BDF8', // Cyan / Sky Blue (matching image)
    glowColor: 'rgba(56, 189, 248, 0.4)',
    icon: 'gamepad',
  },
  {
    id: 'mental',
    nameAr: 'ذكاء',
    nameEn: 'MENTAL',
    description: 'تحديات التفكير والذاكرة والألغاز وسرعة البديهة',
    accentColor: '#10B981', // Emerald Green (matching image)
    glowColor: 'rgba(16, 185, 129, 0.4)',
    icon: 'brain',
  },
  {
    id: 'physical',
    nameAr: 'بدني',
    nameEn: 'PHYSICAL',
    description: 'تحديات الحركة واللياقة والتسديد والموازنة',
    accentColor: '#F97316', // Vibrant Orange (matching image)
    glowColor: 'rgba(249, 115, 22, 0.4)',
    icon: 'activity',
  },
  {
    id: 'captains',
    nameAr: 'تحدي الكباتن',
    nameEn: 'CAPTAINS',
    description: 'مواجهات الحسم الخاصة بكباتن الفرق',
    accentColor: '#EF4444', // Crimson / Red (matching image)
    glowColor: 'rgba(239, 68, 68, 0.4)',
    icon: 'crown',
  },
  {
    id: 'fan_vote',
    nameAr: 'تصويت الجمهور',
    nameEn: 'FAN VOTE',
    description: 'تصويت الجمهور المباشر لاختيار أي لعبة من كامل مكتبة الألعاب',
    accentColor: '#EC4899', // Pink / Magenta
    glowColor: 'rgba(236, 72, 153, 0.5)',
    icon: 'flame',
  },
];

export const DEFAULT_GAMES: GameItem[] = [
  // 1. الكتروني (DIGITAL)
  {
    id: 'g-fc27',
    categoryId: 'digital',
    nameAr: 'إف سي 27',
    nameEn: 'EA FC 27',
    description: 'مباراة كرة قدم إلكترونية حماسية',
    iconType: 'fc27',
  },
  {
    id: 'g-clash-royale',
    categoryId: 'digital',
    nameAr: 'كلاش رويال',
    nameEn: 'CLASH ROYALE',
    description: 'معركة بطاقات واستراتيجية سريعة',
    iconType: 'clash',
  },
  {
    id: 'g-rocket-league',
    categoryId: 'digital',
    nameAr: 'روكيت ليج',
    nameEn: 'ROCKET LEAGUE',
    description: 'كرة قدم بسيارات الصواريخ الطائرة',
    iconType: 'rocket',
  },
  {
    id: 'g-brawlhalla',
    categoryId: 'digital',
    nameAr: 'براول هالا',
    nameEn: 'BRAWLHALLA',
    description: 'نزال جماعي لإسقاط الخصوم من حلبة القتال',
    iconType: 'brawlhalla',
  },
  {
    id: 'g-overcooked-2',
    categoryId: 'digital',
    nameAr: 'أوفر كوكد',
    nameEn: 'OVERCOOKED!',
    description: 'إعداد وجبات سريعة في مطبخ فوضوي مشترك',
    iconType: 'chef',
  },
  {
    id: 'g-screamer',
    categoryId: 'digital',
    nameAr: 'سكريمير',
    nameEn: 'SCREAMER',
    description: 'تحدي الرعب وردة الفعل الصامتة',
    iconType: 'screamer',
  },
  {
    id: 'g-tekken-8',
    categoryId: 'digital',
    nameAr: 'تيكن 8',
    nameEn: 'TEKKEN 8',
    description: 'قتال قتالي كلاسيكي حماسي 1 ضد 1',
    iconType: 'tekken',
  },
  {
    id: 'g-sackboy',
    categoryId: 'digital',
    nameAr: 'ساكبوي 4',
    nameEn: 'SACKBOY 4',
    description: 'مغامرة قفز وألغاز وتعاون جماعي',
    iconType: 'sackboy',
  },

  // 2. ذكاء (MENTAL)
  {
    id: 'g-seen-jeem',
    categoryId: 'mental',
    nameAr: 'حرف وجواب (ج)',
    nameEn: 'Q & A (JEEM)',
    description: 'إجابة سريعة على أسئلة تبدأ بالحرف المطلوب',
    iconType: 'quiz',
  },
  {
    id: 'g-who-am-i',
    categoryId: 'mental',
    nameAr: 'من أكون؟',
    nameEn: 'WHO AM I / NOBODY 1800',
    description: 'تخمين الشخصية أو الشيء عبر أسئلة ذكية',
    iconType: 'spy',
  },
  {
    id: 'g-shans',
    categoryId: 'mental',
    nameAr: 'شَنْص',
    nameEn: 'SHANS',
    description: 'تحدي الحظ والقرارات الاستراتيجية السريعة',
    iconType: 'dice',
  },
  {
    id: 'g-letters-game',
    categoryId: 'mental',
    nameAr: 'مع حروف عزيز',
    nameEn: 'LETTERS WITH AZIZ',
    description: 'توليد كلمات وفق حروف وشروط مباغتة',
    iconType: 'hats',
  },
  {
    id: 'g-photo-match',
    categoryId: 'mental',
    nameAr: 'تطابق الصور',
    nameEn: 'IMAGE MATCH',
    description: 'اكتشاف وتطابق أزواج الصور بأسرع وقت',
    iconType: 'brain',
  },
  {
    id: 'g-codenames',
    categoryId: 'mental',
    nameAr: 'كود نيمز',
    nameEn: 'CODENAMES',
    description: 'تخمين الكلمات السرية للفريق برمز واحد',
    iconType: 'cards',
  },
  {
    id: 'g-kalak',
    categoryId: 'mental',
    nameAr: 'كَلَك',
    nameEn: 'KALAK',
    description: 'تحدي المهارة الحركية والتركيز الذهني',
    iconType: 'kalak',
  },

  // 3. بدني (PHYSICAL)
  {
    id: 'g-penalty-shoot',
    categoryId: 'physical',
    nameAr: 'ركلات جزاء',
    nameEn: 'PENALTY SHOOT',
    description: 'تسديد ركلات جزاء دقيقة نحو نقاط الهدف',
    iconType: 'penalty',
  },
  {
    id: 'g-football-2v2',
    categoryId: 'physical',
    nameAr: 'كرة قدم 2v2',
    nameEn: 'FOOTBALL 2v2',
    description: 'مواجهة ميدانية ثنائية سريعة بالمرمى الصغير',
    iconType: 'football',
  },
  {
    id: 'g-cap-ball',
    categoryId: 'physical',
    nameAr: 'طاقية بالكرة',
    nameEn: 'CAP & BALL',
    description: 'التقاط الكرة بالغطاء وتوجيهها بمهارة توازن',
    iconType: 'cap',
  },
  {
    id: 'g-hawks-eagle',
    categoryId: 'physical',
    nameAr: 'صقور و نسر',
    nameEn: 'HAWKS & EAGLE',
    description: 'مطاردة حركية وتفادي سريع بالملعب',
    iconType: 'eagle',
  },
  {
    id: 'g-bottle-flip-xo',
    categoryId: 'physical',
    nameAr: 'قلب الزجاجة / XO',
    nameEn: 'BOTTLE FLIP XO',
    description: 'قلب الزجاجة لتثبيتها ولعب حركة في شبكة XO',
    iconType: 'bottle',
  },

  // 4. تحدي الكباتن (CAPTAINS CHALLENGE)
  {
    id: 'g-box-of-liars',
    categoryId: 'captains',
    nameAr: 'صندوق الكذابين',
    nameEn: 'BOX OF LIARS',
    description: 'وصف ما بداخل الصندوق واكتشاف إن كان يصدق أم يراوغ',
    iconType: 'box',
  },
  {
    id: 'g-stop-timer',
    categoryId: 'captains',
    nameAr: 'وقف المؤقت',
    nameEn: 'STOP THE TIMER',
    description: 'إيقاف ساعة التوقيت بدقة متناهية دون النظر للشاشة',
    iconType: 'timer',
  },

  // 5. تصويت الجمهور (FAN VOTE)
  {
    id: 'g-fan-vote',
    categoryId: 'fan_vote',
    nameAr: 'تصويت الجمهور',
    nameEn: 'FAN VOTE',
    description: 'اللعبة التي يختارها الجمهور بالتصويت المباشر من كامل المكتبة',
    iconType: 'flame',
  },
];
