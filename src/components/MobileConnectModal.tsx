import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Globe,
  Settings,
  RefreshCw,
  Sparkles,
  Wifi,
  ShieldCheck,
} from 'lucide-react';
import { webrtcSync } from '../utils/webrtcSync';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRemoteDirectly?: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
  onOpenRemoteDirectly,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [customDomain, setCustomDomain] = useState<string>(() => {
    try {
      return localStorage.getItem('tahadi5_custom_domain') || '';
    } catch {
      return '';
    }
  });
  const [tempDomainInput, setTempDomainInput] = useState<string>('');
  const [connStatus, setConnStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [clientCount, setClientCount] = useState<number>(0);

  const roomCode = webrtcSync.getRoomCode();

  // Listen to live WebRTC connection status with Google STUN servers
  useEffect(() => {
    return webrtcSync.onStatusChange((status, count) => {
      setConnStatus(status);
      setClientCount(count);
    });
  }, []);

  // Determine the effective base origin and subpath permanently
  // Strictly matches: ${customDomain || window.location.origin}${window.location.pathname}
  const getFullBase = () => {
    if (customDomain && customDomain.trim() !== '') {
      return customDomain.trim().replace(/\/+$/, '');
    }
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname
      .replace(/\/index\.html$/, '')
      .replace(/\/remote\/?$/, '')
      .replace(/\/+$/, '');
    return `${origin}${pathname}`;
  };

  const effectiveBase = getFullBase();

  // Formula strictly 100% compatible with GitHub Pages:
  // ${customDomain || window.location.origin}${window.location.pathname}?mode=remote&room=${roomId}#remote
  const remoteUrl = `${effectiveBase}/?mode=remote&room=${roomCode}#remote`;

  useEffect(() => {
    if (isOpen) {
      setTempDomainInput(customDomain || (typeof window !== 'undefined' ? window.location.origin : ''));
    }
  }, [isOpen, customDomain]);

  useEffect(() => {
    if (typeof window !== 'undefined' && remoteUrl) {
      QRCode.toDataURL(remoteUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#070D1F',
          light: '#FFFFFF',
        },
      })
        .then((dataUri) => setQrDataUrl(dataUri))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [remoteUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveCustomDomain = () => {
    let clean = tempDomainInput.trim();
    if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    clean = clean.replace(/\/+$/, '');

    try {
      localStorage.setItem('tahadi5_custom_domain', clean);
    } catch {}
    setCustomDomain(clean);
  };

  const handleResetToCurrentOrigin = () => {
    try {
      localStorage.removeItem('tahadi5_custom_domain');
    } catch {}
    setCustomDomain('');
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname
        .replace(/\/index\.html$/, '')
        .replace(/\/remote\/?$/, '')
        .replace(/\/+$/, '');
      setTempDomainInput(`${origin}${pathname}`);
    }
  };

  const isUsingCustomDomain = Boolean(customDomain && customDomain.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-fade-in select-none">
      <div className="bg-[#0A0F24] border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-right max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-changa text-white flex items-center gap-2">
              <span>التحكم بالدوري من الهاتف</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                clientCount > 0
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                  : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${clientCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
                {clientCount > 0 ? `ONLINE (${clientCount}) 🟢` : 'READY TO CONNECT'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              امسح الكود بكاميرا هاتفك للتحكم المباشر في النتيجة والألعاب عبر شبكات 4G/5G
            </p>
          </div>
        </div>

        {/* Permanent Custom Domain Configuration Box (Always Accessible) */}
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-b from-[#0D1533] to-[#070B1A] border border-cyan-500/40 space-y-2 text-right">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs font-changa text-cyan-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>تثبيت دومين GitHub الخاص بك:</span>
            </span>
            {isUsingCustomDomain ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                مثبت دائماً ✓
              </span>
            ) : (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                رابط المعاينة الحالي
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              dir="ltr"
              placeholder="https://username.github.io/repo أو https://my-league.com"
              value={tempDomainInput}
              onChange={(e) => setTempDomainInput(e.target.value)}
              className="flex-1 bg-[#050814] border border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={handleSaveCustomDomain}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-changa text-xs shadow-md shrink-0"
            >
              حفظ وتثبيت
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="truncate dir-ltr font-mono text-[10px] text-slate-400 max-w-[240px]">
              {remoteUrl}
            </span>
            {isUsingCustomDomain && (
              <button
                onClick={handleResetToCurrentOrigin}
                className="text-rose-400 hover:text-rose-300 underline font-bold shrink-0 ml-2"
              >
                إلغاء التثبيت
              </button>
            )}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl shadow-2xl border-4 border-slate-300/40 my-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR for Mobile Remote"
              className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl shadow-inner"
            />
          ) : (
            <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          )}
          <div className="mt-2 text-center w-full">
            <span className="text-xs font-black text-slate-900 font-changa block">
              امسح الكود بكاميرا الهاتف لفتح ريموت التحكم
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] text-emerald-800 bg-emerald-100 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Google STUN 4G/5G Ready</span>
              </span>
              <span className="text-[10px] text-purple-800 bg-purple-100 font-mono font-bold px-2 py-0.5 rounded-full border border-purple-300 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-purple-600" />
                <span>غرفة {roomCode}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Copy Link & Open in Tab */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 text-xs font-bold font-changa flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span className="text-emerald-200">تم نسخ رابط الريموت بنجاح!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white" />
                <span>نسخ رابط الريموت 📋</span>
              </>
            )}
          </button>

          <a
            href={remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold font-changa flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="فتح الرابط في نافذة جديدة للتجربة"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>فتح الرابط</span>
          </a>

          {onOpenRemoteDirectly && (
            <button
              onClick={() => {
                onClose();
                onOpenRemoteDirectly();
              }}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-changa flex items-center gap-1.5 border border-slate-700 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>تجربة مباشرة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
