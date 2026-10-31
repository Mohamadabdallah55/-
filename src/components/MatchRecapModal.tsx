import React, { useEffect, useRef, useState } from 'react';
import { CurrentMatch, Team, GameItem, CategoryInfo, LeagueRow } from '../types';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Trophy,
  Sparkles,
  Camera,
  MessageCircle,
} from 'lucide-react';

interface MatchRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMatch: CurrentMatch;
  teams: Team[];
  games: GameItem[];
  categories: CategoryInfo[];
  standings: LeagueRow[];
}

export const MatchRecapModal: React.FC<MatchRecapModalProps> = ({
  isOpen,
  onClose,
  currentMatch,
  teams,
  games,
  categories,
  standings,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];

  const activeGame = games.find((g) => g.id === currentMatch.activeGameId);
  const winner =
    currentMatch.teamAScore > currentMatch.teamBScore
      ? teamA
      : currentMatch.teamBScore > currentMatch.teamAScore
      ? teamB
      : null;

  const totalWon = currentMatch.teamAScore + currentMatch.teamBScore;

  // Format WhatsApp Share Message
  const getWhatsAppSummaryText = () => {
    const winnerText = winner ? `👑 الفائز: ${winner.name} (${winner.shortName})` : '⚔️ المواجهة مستمرة / تعادل';
    const scoreText = `${teamA.name} [ ${currentMatch.teamAScore} - ${currentMatch.teamBScore} ] ${teamB.name}`;

    const roundCategoryNames: Record<number, string> = {
      1: 'إلكتروني',
      2: 'ذكاء',
      3: 'بدني',
      4: 'تصويت الجمهور',
      5: '1 ضد 1',
    };

    let roundsBreakdown = '';
    for (let r = 1; r <= 5; r++) {
      const cat = roundCategoryNames[r] || '';
      if (r <= currentMatch.teamAScore) {
        roundsBreakdown += `\n• الجولة ${r} [${cat}]: فوز ${teamA.shortName} 🟣`;
      } else if (r <= totalWon) {
        roundsBreakdown += `\n• الجولة ${r} [${cat}]: فوز ${teamB.shortName} 🔵`;
      }
    }

    let standingsText = '\n\n📊 صدارة الترتيب العام:\n';
    standings.slice(0, 3).forEach((row, idx) => {
      const medals = ['🥇', '🥈', '🥉'];
      standingsText += `${medals[idx] || '•'} ${row.team.name}: ${row.points} نقطة (${row.won}W - ${row.lost}L)\n`;
    });

    return `🏆 *ملخص مواجهة دوري صراع النخبة | CLASH OF ELITES*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `⚔️ *النتيجة النهائية:* \n` +
      `👉 ${scoreText}\n` +
      `${winnerText}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *مجريات الجولات (BO5):*${roundsBreakdown}` +
      `${standingsText}\n` +
      `#صراع_النخبة #ClashOfElites #Esports`;
  };

  // Automated Canvas Generation (1080x1080 Square Format for Social Media & WhatsApp)
  useEffect(() => {
    if (!isOpen) return;

    setIsGenerating(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background Stadium Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#040714');
    bgGrad.addColorStop(0.5, '#070D22');
    bgGrad.addColorStop(1, '#02050E');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle ambient neon lighting
    const glowA = ctx.createRadialGradient(250, 450, 20, 250, 450, 350);
    glowA.addColorStop(0, `${teamA.color}35`);
    glowA.addColorStop(1, 'transparent');
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 150, 600, 600);

    const glowB = ctx.createRadialGradient(830, 450, 20, 830, 450, 350);
    glowB.addColorStop(0, `${teamB.color}35`);
    glowB.addColorStop(1, 'transparent');
    ctx.fillStyle = glowB;
    ctx.fillRect(500, 150, 600, 600);

    // Decorative esports borders
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1020, 1020);

    ctx.strokeStyle = '#6366F140';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 1000, 1000);

    // 2. Header Branding
    // Top Gold Tag
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(415, 55, 250, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL MATCH RECAP', 540, 79);

    // Main Arabic Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px "Changa", "Cairo", sans-serif';
    ctx.fillText('دوري صراع النخبة', 540, 135);

    // Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 20px "Orbitron", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('CLASH OF ELITES — BEST OF 5', 540, 168);

    // Date
    const today = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillStyle = '#64748B';
    ctx.font = '16px "Cairo", sans-serif';
    ctx.fillText(today, 540, 196);

    // Divider Line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 215);
    ctx.lineTo(1000, 215);
    ctx.stroke();

    // 3. Central VS Matchup Section
    // Team A Card (Left side on canvas, x: 80 to 450)
    const isWinnerA = winner?.id === teamA.id;
    ctx.fillStyle = isWinnerA ? '#131130' : '#0B1024';
    ctx.strokeStyle = isWinnerA ? '#A855F7' : '#334155';
    ctx.lineWidth = isWinnerA ? 4 : 2;
    ctx.beginPath();
    ctx.roundRect(80, 245, 380, 310, 28);
    ctx.fill();
    ctx.stroke();

    // Winner Crown Badge for Team A
    if (isWinnerA) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(170, 225, 200, 36, 18);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px "Orbitron", sans-serif';
      ctx.fillText('👑 WINNER', 270, 249);
    }

    // Team A Color Dot & Short Name
    ctx.fillStyle = teamA.color;
    ctx.beginPath();
    ctx.arc(270, 310, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Orbitron", sans-serif';
    ctx.fillText(teamA.shortName.slice(0, 3), 270, 318);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Changa", "Cairo", sans-serif';
    ctx.fillText(teamA.name, 270, 380);

    // Score A
    ctx.fillStyle = teamA.color;
    ctx.font = '900 85px "Orbitron", sans-serif';
    ctx.fillText(String(currentMatch.teamAScore), 270, 485);

    // Center VS Box (x: 480 to 600)
    ctx.fillStyle = '#070D1E';
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(490, 340, 100, 100, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 36px "Orbitron", sans-serif';
    ctx.fillText('VS', 540, 402);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 14px "Orbitron", sans-serif';
    ctx.fillText('BO5', 540, 465);

    // Team B Card (Right side on canvas, x: 620 to 1000)
    const isWinnerB = winner?.id === teamB.id;
    ctx.fillStyle = isWinnerB ? '#0B2433' : '#0B1024';
    ctx.strokeStyle = isWinnerB ? '#06B6D4' : '#334155';
    ctx.lineWidth = isWinnerB ? 4 : 2;
    ctx.beginPath();
    ctx.roundRect(620, 245, 380, 310, 28);
    ctx.fill();
    ctx.stroke();

    // Winner Crown Badge for Team B
    if (isWinnerB) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.roundRect(710, 225, 200, 36, 18);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px "Orbitron", sans-serif';
      ctx.fillText('👑 WINNER', 810, 249);
    }

    // Team B Color Dot & Short Name
    ctx.fillStyle = teamB.color;
    ctx.beginPath();
    ctx.arc(810, 310, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Orbitron", sans-serif';
    ctx.fillText(teamB.shortName.slice(0, 3), 810, 318);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px "Changa", "Cairo", sans-serif';
    ctx.fillText(teamB.name, 810, 380);

    // Score B
    ctx.fillStyle = teamB.color;
    ctx.font = '900 85px "Orbitron", sans-serif';
    ctx.fillText(String(currentMatch.teamBScore), 810, 485);

    // 4. Round Timeline Tracker (y: 585 to 685)
    ctx.fillStyle = '#0A0F24';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 580, 920, 115, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('مسار جولات المواجهة الخمسة (Round Timeline):', 970, 608);

    ctx.textAlign = 'center';
    const roundWidth = 165;
    const roundGap = 16;
    const startX = 100;

    for (let r = 1; r <= 5; r++) {
      const x = startX + (r - 1) * (roundWidth + roundGap);
      const isWonA = r <= currentMatch.teamAScore;
      const isWonB = r > currentMatch.teamAScore && r <= totalWon;
      const isCurrent = r === totalWon + 1 && !winner;

      ctx.fillStyle = isWonA ? '#6B21A8' : isWonB ? '#0E7490' : isCurrent ? '#78350F' : '#1E293B';
      ctx.strokeStyle = isWonA ? '#C084FC' : isWonB ? '#22D3EE' : isCurrent ? '#F59E0B' : '#334155';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(x, 615, roundWidth, 68, 12);
      ctx.fill();
      ctx.stroke();

      const roundCatNames = ['', 'إلكتروني', 'ذكاء', 'بدني', 'تصويت الجمهور', '1 ضد 1'];

      // Category tag on top
      ctx.fillStyle = isWonA ? '#E9D5FF' : isWonB ? '#A5F3FC' : isCurrent ? '#FDE68A' : '#94A3B8';
      ctx.font = 'bold 12px "Cairo", sans-serif';
      ctx.fillText(`جولة ${r} (${roundCatNames[r]})`, x + roundWidth / 2, 638);

      // Outcome on bottom
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 14px "Cairo", sans-serif';
      const label = isWonA
        ? `${teamA.shortName} ✓`
        : isWonB
        ? `${teamB.shortName} ✓`
        : isCurrent
        ? `جارية 🔴`
        : `قادمة`;
      ctx.fillText(label, x + roundWidth / 2, 665);
    }

    // 5. Mini Standings Table (y: 720 to 980)
    ctx.fillStyle = '#070C1E';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 715, 920, 275, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 20px "Changa", "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('📊 جدول ترتيب دوري صراع النخبة المحدث:', 970, 750);

    // Table Header
    ctx.font = 'bold 15px "Cairo", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('المركز والفريق', 960, 785);
    ctx.textAlign = 'center';
    ctx.fillText('لعب', 520, 785);
    ctx.fillText('فاز', 440, 785);
    ctx.fillText('خسر', 360, 785);
    ctx.fillText('فارق الجولات', 260, 785);
    ctx.fillText('النقاط (PTS)', 140, 785);

    // Rows (top 6 teams)
    standings.forEach((row, idx) => {
      const rowY = 820 + idx * 28;

      // Alternating background
      if (idx % 2 === 0) {
        ctx.fillStyle = '#0E163040';
        ctx.fillRect(90, rowY - 20, 900, 26);
      }

      // Rank & Name
      ctx.textAlign = 'right';
      ctx.fillStyle = idx === 0 ? '#F59E0B' : idx < 3 ? '#38BDF8' : '#E2E8F0';
      ctx.font = 'bold 15px "Cairo", sans-serif';
      ctx.fillText(`${idx + 1}.  ${row.team.name} (${row.team.shortName})`, 960, rowY);

      // Stats
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(String(row.played), 520, rowY);
      ctx.fillText(String(row.won), 440, rowY);
      ctx.fillText(String(row.lost), 360, rowY);
      ctx.fillText(String(row.gd > 0 ? `+${row.gd}` : row.gd), 260, rowY);

      // Points (Highlighted)
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 17px "Orbitron", sans-serif';
      ctx.fillText(String(row.points), 140, rowY);
    });

    // 6. Watermark Footer
    ctx.fillStyle = '#475569';
    ctx.font = '14px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('دوري صراع النخبة | منصة التحكيم والبث المباشر الرسمية', 540, 1025);

    // Export to PNG Data URI
    try {
      const url = canvas.toDataURL('image/png', 1.0);
      setDataUrl(url);
    } catch {}

    setIsGenerating(false);
  }, [isOpen, currentMatch, teams, games, categories, standings, winner]);

  if (!isOpen) return null;

  const handleDownloadImage = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `clash-of-elites-recap-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyText = () => {
    const text = getWhatsAppSummaryText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(getWhatsAppSummaryText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 animate-fade-in select-none">
      <div className="bg-[#0A0F24] border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative text-right max-h-[94vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-changa text-white flex items-center gap-2">
              <span>تصدير ملخص المواجهة الاحترافي</span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                1080×1080 HD
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              بطاقة سينمائية جاهزة للمشاركة المباشرة على واتساب وسوشيال ميديا
            </p>
          </div>
        </div>

        {/* Card Visual Preview */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-2 rounded-2xl bg-[#050814] border border-slate-800 shadow-inner my-1">
          {isGenerating ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
              <span className="text-xs font-changa font-bold">جاري توليد بطاقة المباراة السينمائية...</span>
            </div>
          ) : dataUrl ? (
            <div className="relative group max-w-md w-full">
              <img
                src={dataUrl}
                alt="Match Recap Card Preview"
                className="w-full rounded-2xl shadow-2xl border border-slate-700/80 transition-transform group-hover:scale-[1.01]"
              />
              <div className="absolute bottom-3 left-3 bg-black/80 px-2.5 py-1 rounded-xl text-[10px] font-mono text-amber-300 border border-amber-500/40">
                1080 × 1080 PNG
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Controls: Download, WhatsApp, Copy */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Download PNG Button */}
          <button
            onClick={handleDownloadImage}
            disabled={!dataUrl}
            className="py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-changa text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>تحميل الصورة 📥</span>
          </button>

          {/* Copy WhatsApp Text */}
          <button
            onClick={handleCopyText}
            className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold font-changa text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95 shadow-md"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">تم نسخ النص!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>نسخ ملخص نصي 📋</span>
              </>
            )}
          </button>

          {/* Direct WhatsApp Share */}
          <button
            onClick={handleOpenWhatsApp}
            className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-changa text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>مشاركة عبر واتساب 💬</span>
          </button>
        </div>
      </div>
    </div>
  );
};
