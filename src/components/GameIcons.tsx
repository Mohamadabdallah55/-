import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

export const GameIcon: React.FC<IconProps> = ({ name, className = 'w-8 h-8' }) => {
  switch (name) {
    // EA FC 27 (FC 27)
    case 'fc27':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0C152B" stroke="#38BDF8" strokeWidth="3" />
          <path d="M22 36h14v8h-7v8h6v8h-6v12h-7V36Z" fill="#FFFFFF" />
          <path d="M42 36h14v8h-7v20h7v8H42V36Z" fill="#38BDF8" />
          <path d="M60 44c0-5 4-8 10-8h4v8h-3c-2 0-3 1-3 3 0 1 1 2 3 2h3c5 0 9 3 9 8 0 6-4 9-10 9h-5v-8h4c2 0 3-1 3-2 0-1-1-2-3-2h-3c-5 0-9-3-9-8Z" fill="#FFFFFF" />
          <text x="64" y="68" fill="#38BDF8" fontFamily="sans-serif" fontWeight="900" fontSize="20" letterSpacing="-1">27</text>
        </svg>
      );

    // CLASH ROYALE
    case 'clash':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1E1B4B" stroke="#FBBF24" strokeWidth="3" />
          {/* Golden Crown */}
          <path d="M22 66h56v8H22v-8Z" fill="#F59E0B" />
          <path d="M22 66l8-36 12 18 8-24 8 24 12-18 8 36H22Z" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
          <circle cx="50" cy="24" r="5" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
          <circle cx="70" cy="30" r="4" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
          <circle cx="50" cy="56" r="4" fill="#EF4444" />
        </svg>
      );

    // ROCKET LEAGUE
    case 'rocket':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
          <path d="M50 16l24 14v28L50 84 26 58V30l24-14Z" fill="#1E293B" stroke="#38BDF8" strokeWidth="2.5" />
          <path d="M50 24l16 9v18L50 68 34 51V33l16-9Z" fill="#0284C7" />
          <path d="M42 48l16-16m-12 24l8-8" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="50" r="8" fill="#F59E0B" />
        </svg>
      );

    // BRAWLHALLA
    case 'brawlhalla':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0C1B33" stroke="#60A5FA" strokeWidth="3" />
          {/* Viking Winged Helmet */}
          <path d="M22 36c4-12 14-16 22-16v12c-8 0-14 2-18 6l-4-2Z" fill="#93C5FD" />
          <path d="M78 36c-4-12-14-16-22-16v12c8 0 14 2 18 6l4-2Z" fill="#93C5FD" />
          <path d="M30 40c0-11 9-20 20-20s20 9 20 20v18c0 8-9 14-20 14s-20-6-20-14V40Z" fill="#3B82F6" stroke="#BFDBFE" strokeWidth="2" />
          <rect x="36" y="52" width="28" height="6" rx="3" fill="#1E293B" />
          <line x1="50" y1="20" x2="50" y2="72" stroke="#60A5FA" strokeWidth="2.5" />
        </svg>
      );

    // SACKBOY 4
    case 'sackboy':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#3B2613" stroke="#D97706" strokeWidth="3" />
          {/* Sackboy knitted head */}
          <circle cx="50" cy="46" r="26" fill="#92400E" stroke="#B45309" strokeWidth="3" />
          {/* Big black button eyes */}
          <circle cx="40" cy="42" r="6" fill="#1C1917" stroke="#78350F" strokeWidth="2" />
          <circle cx="60" cy="42" r="6" fill="#1C1917" stroke="#78350F" strokeWidth="2" />
          {/* Happy smile & tongue */}
          <path d="M38 52c3 8 21 8 24 0" stroke="#1C1917" strokeWidth="3" strokeLinecap="round" />
          <path d="M46 56c0 4 8 4 8 0" fill="#EF4444" />
          {/* Zipper underneath */}
          <line x1="50" y1="72" x2="50" y2="86" stroke="#FBBF24" strokeWidth="4" strokeDasharray="3 2" />
        </svg>
      );

    // OVERCOOKED CHEF (matching IMG_3937.jpg)
    case 'chef':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0C152B" stroke="#38BDF8" strokeWidth="3" />
          {/* White Chef Hat with puffs */}
          <path d="M30 44c-6 0-10-5-8-11 2-6 8-8 12-7 2-6 9-10 16-10s14 4 16 10c4-1 10 1 12 7 2 6-2 11-8 11H30Z" fill="#FFFFFF" />
          <path d="M32 44h36v8H32v-8Z" fill="#E2E8F0" />
          {/* Chef Face & Mustache */}
          <circle cx="50" cy="58" r="16" fill="#FDE047" />
          <circle cx="44" cy="54" r="3" fill="#0F172A" />
          <circle cx="56" cy="54" r="3" fill="#0F172A" />
          <path d="M40 62c4-2 7 2 10 0 3 2 6-2 10 0 2 2-2 5-10 4-8 1-12-2-10-4Z" fill="#78350F" />
        </svg>
      );

    // SCREAMER
    case 'screamer':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#200A0A" stroke="#EF4444" strokeWidth="3" />
          {/* Screaming Skull Mask */}
          <path d="M32 30c0-10 8-18 18-18s18 8 18 18c0 14-6 26-10 38h-16c-4-12-10-24-10-38Z" fill="#F87171" stroke="#DC2626" strokeWidth="2" />
          {/* Hollow Eye Sockets */}
          <ellipse cx="43" cy="34" rx="4.5" ry="7" fill="#000000" />
          <ellipse cx="57" cy="34" rx="4.5" ry="7" fill="#000000" />
          {/* Screaming Open Mouth */}
          <ellipse cx="50" cy="54" rx="6" ry="12" fill="#000000" stroke="#7F1D1D" strokeWidth="2" />
        </svg>
      );

    // TEKKEN 8
    case 'tekken':
    case 'fist':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1C1124" stroke="#EC4899" strokeWidth="3" />
          {/* Iron Fist with flames */}
          <path d="M30 48c0-8 6-14 14-14h12c8 0 14 6 14 14v16c0 8-6 14-14 14H44c-8 0-14-6-14-14V48Z" fill="#DB2777" stroke="#F472B6" strokeWidth="2" />
          <line x1="42" y1="36" x2="42" y2="56" stroke="#500724" strokeWidth="3" />
          <line x1="50" y1="36" x2="50" y2="56" stroke="#500724" strokeWidth="3" />
          <line x1="58" y1="36" x2="58" y2="56" stroke="#500724" strokeWidth="3" />
          {/* Lightning / Flame aura */}
          <path d="M24 38l8-14-4 10 10-6-6 12" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M76 38l-8-14 4 10-10-6 6 12" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // TRICKY TOWERS (matching IMG_3937.jpg)
    case 'tower':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0B132B" stroke="#A78BFA" strokeWidth="3" />
          {/* Puffy Wizard Cloud */}
          <path d="M26 64c-4 0-8-3-8-8 0-4 3-7 7-8 1-6 7-10 14-10 4 0 7 1 9 3 3-5 8-8 15-8 8 0 15 5 17 12 5 1 9 5 9 10 0 6-5 11-11 11H26Z" fill="#F1F5F9" />
          {/* Wizard character with hood */}
          <path d="M44 42c0-8 6-14 12-14s12 6 12 14v10H44V42Z" fill="#8B5CF6" />
          <circle cx="56" cy="38" r="4" fill="#FDE047" />
          {/* Floating magic block */}
          <rect x="32" y="24" width="12" height="12" rx="2" fill="#38BDF8" transform="rotate(15 38 30)" />
          <line x1="68" y1="28" x2="74" y2="54" stroke="#F59E0B" strokeWidth="2.5" />
          <polygon points="68,26 72,22 74,26" fill="#F59E0B" />
        </svg>
      );

    // CRASH TEAM RACING (matching IMG_3937.jpg)
    case 'racing':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1C1427" stroke="#F97316" strokeWidth="3" />
          {/* Crash Bandicoot big grin & ears */}
          <polygon points="30,22 42,38 24,36" fill="#EA580C" />
          <polygon points="70,22 58,38 76,36" fill="#EA580C" />
          <circle cx="50" cy="52" r="22" fill="#F97316" />
          {/* Big eyes */}
          <ellipse cx="44" cy="46" rx="5" ry="8" fill="#FFFFFF" />
          <circle cx="44" cy="46" r="2.5" fill="#000000" />
          <ellipse cx="56" cy="46" rx="5" ry="8" fill="#FFFFFF" />
          <circle cx="56" cy="46" r="2.5" fill="#000000" />
          {/* Giant wide grin with teeth */}
          <path d="M34 56c4 10 28 10 32 0-4-3-28-3-32 0Z" fill="#FEF08A" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="42" y1="56" x2="42" y2="63" stroke="#C2410C" strokeWidth="1" />
          <line x1="50" y1="56" x2="50" y2="64" stroke="#C2410C" strokeWidth="1" />
          <line x1="58" y1="56" x2="58" y2="63" stroke="#C2410C" strokeWidth="1" />
        </svg>
      );

    // تطابق الصور - BRAIN LIGHTBULB (matching IMG_3937.jpg)
    case 'brain':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1E1333" stroke="#C084FC" strokeWidth="3" />
          {/* Brain Shaped Lightbulb */}
          <path d="M34 38c-4 3-6 8-4 13 2 4 6 7 8 9 2 2 3 5 3 8h18c0-3 1-6 3-8 2-2 6-5 8-9 2-5 0-10-4-13-3-3-8-4-13-1-5-3-10-2-13 1Z" fill="#E9D5FF" stroke="#A855F7" strokeWidth="2.5" />
          {/* Brain folds filament */}
          <path d="M42 32c3 4 5 12 5 18m6-18c-3 4-5 12-5 18" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" />
          {/* Bulb Base */}
          <rect x="42" y="68" width="16" height="5" rx="1.5" fill="#94A3B8" />
          <rect x="44" y="74" width="12" height="4" rx="1" fill="#64748B" />
          <circle cx="50" cy="80" r="3" fill="#475569" />
        </svg>
      );

    // من أكون؟ - DETECTIVE SPY (matching IMG_3937.jpg)
    case 'spy':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#111827" stroke="#A855F7" strokeWidth="3" />
          {/* Fedora hat */}
          <path d="M20 42c8-2 52-2 60 0-4-6-16-16-30-16s-26 10-30 16Z" fill="#374151" stroke="#9CA3AF" strokeWidth="2" />
          <path d="M28 42c4-8 12-12 22-12s18 4 22 12H28Z" fill="#1F2937" />
          {/* Question mark over face */}
          <text x="44" y="58" fill="#FBBF24" fontFamily="sans-serif" fontWeight="900" fontSize="22">?</text>
          {/* Sinister grin */}
          <path d="M38 68c4 6 20 6 24 0" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // لعبة الحروف - MAGICIAN TOP HATS (matching IMG_3937.jpg)
    case 'hats':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1F1338" stroke="#E879F9" strokeWidth="3" />
          {/* Magician Hat 1 with Letter ر */}
          <g transform="translate(22, 22) rotate(-15 15 15)">
            <rect x="6" y="8" width="18" height="16" rx="2" fill="#4C1D95" stroke="#C084FC" strokeWidth="1.5" />
            <ellipse cx="15" cy="24" rx="14" ry="4" fill="#3B0764" />
            <text x="11" y="20" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="bold" fontSize="12">ر</text>
          </g>
          {/* Magician Hat 2 with Letter س */}
          <g transform="translate(52, 22) rotate(15 15 15)">
            <rect x="6" y="8" width="18" height="16" rx="2" fill="#4C1D95" stroke="#C084FC" strokeWidth="1.5" />
            <ellipse cx="15" cy="24" rx="14" ry="4" fill="#3B0764" />
            <text x="10" y="20" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="bold" fontSize="11">س</text>
          </g>
          {/* Magician Hat 3 with Letter ف */}
          <g transform="translate(24, 52) rotate(10 15 15)">
            <rect x="6" y="8" width="18" height="16" rx="2" fill="#4C1D95" stroke="#C084FC" strokeWidth="1.5" />
            <ellipse cx="15" cy="24" rx="14" ry="4" fill="#3B0764" />
            <text x="11" y="20" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="bold" fontSize="11">ف</text>
          </g>
          {/* Magician Hat 4 with Letter أ */}
          <g transform="translate(54, 52) rotate(-10 15 15)">
            <rect x="6" y="8" width="18" height="16" rx="2" fill="#4C1D95" stroke="#C084FC" strokeWidth="1.5" />
            <ellipse cx="15" cy="24" rx="14" ry="4" fill="#3B0764" />
            <text x="12" y="20" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="bold" fontSize="12">أ</text>
          </g>
        </svg>
      );

    // CODENAMES
    case 'cards':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1C1917" stroke="#EF4444" strokeWidth="3" />
          <rect x="28" y="28" width="28" height="38" rx="4" fill="#DC2626" transform="rotate(-8 42 47)" />
          <rect x="44" y="28" width="28" height="38" rx="4" fill="#1E40AF" transform="rotate(8 58 47)" />
          <circle cx="50" cy="46" r="6" fill="#FFFFFF" />
          <path d="M42 62h16v4H42z" fill="#FBBF24" />
        </svg>
      );

    // SHANS (شَنْص)
    case 'dice':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#064E3B" stroke="#34D399" strokeWidth="3" />
          {/* 3D Lucky Golden Dice */}
          <rect x="30" y="30" width="40" height="40" rx="8" fill="#FBBF24" stroke="#D97706" strokeWidth="2.5" />
          <circle cx="40" cy="40" r="3.5" fill="#78350F" />
          <circle cx="60" cy="40" r="3.5" fill="#78350F" />
          <circle cx="50" cy="50" r="3.5" fill="#DC2626" />
          <circle cx="40" cy="60" r="3.5" fill="#78350F" />
          <circle cx="60" cy="60" r="3.5" fill="#78350F" />
        </svg>
      );

    // سين جيم - حرف وجواب (ج)
    case 'quiz':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#042F2E" stroke="#14B8A6" strokeWidth="3" />
          <circle cx="46" cy="44" r="22" fill="#0D9488" stroke="#5EEAD4" strokeWidth="3" />
          <line x1="62" y1="60" x2="80" y2="78" stroke="#5EEAD4" strokeWidth="6" strokeLinecap="round" />
          <text x="36" y="54" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="30">ج</text>
        </svg>
      );

    // KALAK (كلك)
    case 'kalak':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#132E27" stroke="#10B981" strokeWidth="3" />
          <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" fill="#059669" stroke="#6EE7B7" strokeWidth="2.5" />
          <line x1="50" y1="22" x2="50" y2="78" stroke="#047857" strokeWidth="2" />
          <line x1="26" y1="36" x2="74" y2="64" stroke="#047857" strokeWidth="2" />
          <line x1="26" y1="64" x2="74" y2="36" stroke="#047857" strokeWidth="2" />
          <circle cx="50" cy="50" r="6" fill="#FBBF24" />
        </svg>
      );

    // BASKETBALL (matching IMG_3937.jpg)
    case 'basketball':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#2E1005" stroke="#EA580C" strokeWidth="3" />
          {/* Halftone basketball */}
          <circle cx="50" cy="50" r="28" fill="#F97316" stroke="#C2410C" strokeWidth="2.5" />
          <line x1="22" y1="50" x2="78" y2="50" stroke="#7C2D12" strokeWidth="2.5" />
          <line x1="50" y1="22" x2="50" y2="78" stroke="#7C2D12" strokeWidth="2.5" />
          <path d="M30 30c8 8 8 32 0 40" stroke="#7C2D12" strokeWidth="2.5" />
          <path d="M70 30c-8 8-8 32 0 40" stroke="#7C2D12" strokeWidth="2.5" />
        </svg>
      );

    // STRENGTH TESTER (matching IMG_3937.jpg)
    case 'trophy':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1C1917" stroke="#F59E0B" strokeWidth="3" />
          {/* Carnival Hammer Bell Machine */}
          <rect x="42" y="24" width="16" height="50" rx="3" fill="#D97706" stroke="#FDE68A" strokeWidth="2" />
          <circle cx="50" cy="22" r="8" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
          <rect x="30" y="74" width="40" height="10" rx="2" fill="#78350F" />
          {/* Hammer next to it */}
          <path d="M30 46l-8-6 4-6 8 6-4 6Z" fill="#94A3B8" />
          <line x1="24" y1="42" x2="16" y2="56" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // PENALTY SHOOT / FOOTBALL (matching IMG_3937.jpg)
    case 'penalty':
    case 'football':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
          <circle cx="50" cy="50" r="28" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.5" />
          {/* Classic Pentagons on ball */}
          <polygon points="50,42 58,48 55,58 45,58 42,48" fill="#0F172A" />
          <line x1="50" y1="42" x2="50" y2="22" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="58" y1="48" x2="76" y2="40" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="55" y1="58" x2="68" y2="72" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="45" y1="58" x2="32" y2="72" stroke="#0F172A" strokeWidth="2.5" />
          <line x1="42" y1="48" x2="24" y2="40" stroke="#0F172A" strokeWidth="2.5" />
        </svg>
      );

    // صقور ونسر
    case 'eagle':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0B233A" stroke="#0284C7" strokeWidth="3" />
          {/* Blue Falcon / Eagle Head */}
          <path d="M26 66c6-14 18-24 34-26-4-8-12-14-22-16 16-2 28 6 34 16 6 2 12 6 14 12-4 2-10 1-14 0 2 4 2 8 0 12-6 10-18 14-30 14-8 0-14-4-16-12Z" fill="#38BDF8" />
          <path d="M68 52c6 0 14 4 14 10-6 4-14 2-18-2l4-8Z" fill="#F59E0B" />
          <circle cx="56" cy="46" r="3.5" fill="#0F172A" />
        </svg>
      );

    // BOTTLE FLIP XO (قلب الزجاجة / XO)
    case 'bottle':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#331405" stroke="#F59E0B" strokeWidth="3" />
          {/* Water bottle */}
          <rect x="36" y="24" width="8" height="6" rx="1" fill="#0284C7" />
          <path d="M34 30h12v6l4 8v24H30V44l4-8v-6Z" fill="#38BDF8" stroke="#BAE6FD" strokeWidth="2" opacity="0.9" />
          {/* XO letters next to it */}
          <text x="56" y="52" fill="#EF4444" fontFamily="sans-serif" fontWeight="900" fontSize="22">X</text>
          <text x="56" y="74" fill="#3B82F6" fontFamily="sans-serif" fontWeight="900" fontSize="22">O</text>
        </svg>
      );

    // طاقية بالكرة
    case 'cap':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#0F243B" stroke="#0284C7" strokeWidth="3" />
          {/* Blue baseball cap visor & crown */}
          <path d="M22 62c0-14 12-24 26-24s26 10 26 24H22Z" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
          <path d="M48 62c8 0 28 0 34 6-8 4-26 4-38 0l4-6Z" fill="#0369A1" />
          <circle cx="48" cy="38" r="3" fill="#F59E0B" />
          {/* Floating soccer ball catching in it */}
          <circle cx="68" cy="36" r="10" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
        </svg>
      );

    // FATAL FURY (matching IMG_3937.jpg)
    case 'fighter':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1E102E" stroke="#A855F7" strokeWidth="3" />
          {/* Anime fighter with clenched fists and fingerless gloves */}
          <path d="M32 40c0-10 8-18 18-18s18 8 18 18c-4 6-10 12-18 14-8-2-14-8-18-14Z" fill="#FDE047" />
          <path d="M28 32c4-8 14-12 22-12s18 4 22 12c-6 2-12-2-22-2s-16 4-22 2Z" fill="#B91C1C" />
          {/* Fighter Hands with wraps */}
          <rect x="34" y="56" width="14" height="18" rx="4" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
          <rect x="52" y="56" width="14" height="18" rx="4" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
        </svg>
      );

    // تحدي الرمي - CORNHOLE BEANBAG (matching IMG_3937.jpg)
    case 'sack':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#131B2E" stroke="#38BDF8" strokeWidth="3" />
          {/* Flying Beanbag Cushion with Motion Rays */}
          <path d="M28 36l36-12 12 36-36 12-12-36Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2.5" />
          <circle cx="50" cy="48" r="4" fill="#0284C7" />
          {/* Dynamic Action Sparkles */}
          <line x1="20" y1="30" x2="12" y2="26" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <line x1="24" y1="46" x2="16" y2="48" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <line x1="78" y1="30" x2="86" y2="26" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <line x1="74" y1="62" x2="82" y2="68" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    // BOX OF LIARS (صندوق الكذابين)
    case 'box':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#2A080C" stroke="#EF4444" strokeWidth="3" />
          <rect x="28" y="36" width="44" height="36" rx="4" fill="#991B1B" stroke="#F87171" strokeWidth="2.5" />
          <polygon points="28,36 50,24 72,36" fill="#B91C1C" />
          <circle cx="50" cy="54" r="6" fill="#FBBF24" />
          <line x1="50" y1="54" x2="50" y2="62" stroke="#B45309" strokeWidth="2.5" />
        </svg>
      );

    // STOP THE TIMER (وقف المؤقت)
    case 'timer':
      return (
        <svg viewBox="0 0 100 100" fill="none" className={className}>
          <circle cx="50" cy="50" r="46" fill="#1E1705" stroke="#F59E0B" strokeWidth="3" />
          <circle cx="50" cy="54" r="26" fill="#0F172A" stroke="#FBBF24" strokeWidth="3" />
          <rect x="46" y="18" width="8" height="8" rx="2" fill="#FBBF24" />
          <line x1="50" y1="54" x2="50" y2="38" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="54" x2="62" y2="54" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="54" r="3" fill="#FFFFFF" />
        </svg>
      );

    // DEFAULT CATEGORY ICONS
    case 'gamepad':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <line x1="6" x2="10" y1="12" y2="12" />
          <line x1="8" x2="8" y1="10" y2="14" />
          <line x1="15" x2="15.01" y1="13" y2="13" />
          <line x1="18" x2="18.01" y1="11" y2="11" />
          <rect width="20" height="12" x="2" y="6" rx="6" />
        </svg>
      );

    case 'swords':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
          <line x1="13" x2="19" y1="19" y2="13" />
          <line x1="16" x2="20" y1="16" y2="20" />
          <line x1="19" x2="21" y1="21" y2="19" />
          <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
          <line x1="5" x2="11" y1="14" y2="20" />
        </svg>
      );

    case 'crown':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
        </svg>
      );

    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        </svg>
      );

    case 'flame':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );

    case 'zap':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    case 'target':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );

    case 'activity':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
};
