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
  RefreshCw,
  Sparkles,
  Wifi,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { webrtcSync, normalizeFourDigitCode } from '../utils/webrtcSync';
import {
  subscribeToConnectionStatus,
  pushHostStateToServer,
  forceReconnectAll,
} from '../utils/storage';

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
  const [codeCopied, setCodeCopied] = useState(false);
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
  const [roomCode, setRoomCode] = useState<string>(() => webrtcSync.getRoomCode());
  const [isEditingCustomCode, setIsEditingCustomCode] = useState<boolean>(false);
  const [customCodeInput, setCustomCodeInput] = useState<string>('');

  useEffect(() => {
    return subscribeToConnectionStatus((status, count) => {
      setConnStatus(status);
      setClientCount(count);
      setRoomCode(webrtcSync.getRoomCode());
    });
  }, []);

  const getCurrentDeploymentBase = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname
      .replace(/\/index\.html$/, '')
      .replace(/\/remote\/?$/, '')
      .replace(/\/+$/, '');
    return `${origin}${pathname}`;
  };

  const getSharedAppBase = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin.replace(/^https:\/\/ais-dev-/, 'https://ais-pre-');
    const pathname = window.location.pathname
      .replace(/\/index\.html$/, '')
      .replace(/\/remote\/?$/, '')
      .replace(/\/+$/, '');
    return `${origin}${pathname}`;
  };

  const effectiveBase =
    customDomain && customDomain.trim() !== ''
      ? customDomain.trim().replace(/\/+$/, '')
      : getCurrentDeploymentBase();

  const remoteUrl = `${effectiveBase}/?mode=remote&room=${roomCode}#remote`;

  useEffect(() => {
    if (isOpen) {
      webrtcSync.setRole('host');
      setRoomCode(webrtcSync.getRoomCode());
      setTempDomainInput(customDomain || getCurrentDeploymentBase());
      pushHostStateToServer();
    }
  }, [isOpen, customDomain]);

  useEffect(() => {
    if (typeof window !== 'undefined' && remoteUrl) {
      QRCode.toDataURL(remoteUrl, {
        width: 300,
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

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
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
      setTempDomainInput(getCurrentDeploymentBase());
    }
  };

  const handleUseSharedUrl = () => {
    const shared = getSharedAppBase();
    try {
      localStorage.setItem('tahadi5_custom_domain', shared);
    } catch {}
    setCustomDomain(shared);
    setTempDomainInput(shared);
  };

  const handleApplyCustomRoomCode = () => {
    const cleaned = normalizeFourDigitCode(customCodeInput);
    if (cleaned.length === 4) {
      webrtcSync.setRoomCode(cleaned);
      setRoomCode(cleaned);
      setIsEditingCustomCode(false);
      pushHostStateToServer();
    }
  };

  const digits = roomCode.padStart(4, '0').slice(0, 4).split('');
  const isUsingCustomDomain = Boolean(customDomain && customDomain.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-fade-in select-none">
      <div className="bg-[#0A0F24] border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-right max-h-[94vh] overflow-y-auto">
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
            <h2 className="text-lg sm:text-xl font-bold font-changa text-white flex items-center gap-2 flex-wrap">
              <span>التحكم بالدوري من الهاتف</span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
                  clientCount > 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                    : connStatus === 'connected'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    clientCount > 0
                      ? 'bg-emerald-400 animate-ping'
                      : connStatus === 'connected'
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                {clientCount > 0
                  ? `ONLINE (${clientCount}) 🟢`
                  : 'CLOUD READY 🟢'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              امسح الكود بكاميرا هاتفك أو أدخل الـ 4 أرقام في شاشة الهاتف للربط المباشر
            </p>
          </div>
        </div>

        {/* PROMINENT 4-DIGIT ROOM CODE CARD */}
        <div className="mb-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-[#0E1738] to-cyan-950/80 border-2 border-cyan-400/60 shadow-xl shadow-cyan-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-black font-changa text-cyan-300 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span>رمز الغرفة للربط المباشر (4 أرقام):</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsEditingCustomCode((v) => !v);
                  setCustomCodeInput(roomCode);
                }}
                className="text-[10px] bg-slate-900/90 hover:bg-slate-800 text-cyan-200 border border-cyan-500/40 px-2.5 py-1 rounded-lg font-bold"
              >
                {isEditingCustomCode ? 'إلغاء' : 'تعديل الرمز'}
              </button>
              <button
                onClick={() => {
                  const next = webrtcSync.generateNewRoomCode();
                  setRoomCode(next);
                  pushHostStateToServer();
                }}
                className="text-[10px] bg-indigo-900/90 hover:bg-indigo-800 text-indigo-200 border border-indigo-400/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>رمز جديد</span>
              </button>
            </div>
          </div>

          {isEditingCustomCode ? (
            <div className="flex items-center gap-2 my-2">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={4}
                dir="ltr"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="flex-1 bg-slate-950 border-2 border-cyan-400 rounded-xl py-2.5 px-4 text-2xl font-black font-mono text-center text-white tracking-[0.5em] focus:outline-none"
              />
              <button
                onClick={handleApplyCustomRoomCode}
                disabled={customCodeInput.replace(/\D/g, '').length !== 4}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black font-changa text-sm shadow-lg"
              >
                اعتماد
              </button>
            </div>
          ) : (
            <div
              onClick={handleCopyCode}
              title="اضغط لنسخ الرمز"
              className="flex items-center justify-center gap-2.5 sm:gap-3 my-2 cursor-pointer group"
              dir="ltr"
            >
              {digits.map((digit, idx) => (
                <div
                  key={idx}
                  className="w-14 h-16 sm:w-16 sm:h-18 rounded-2xl bg-[#050918] border-2 border-cyan-400/80 group-hover:border-emerald-400 flex items-center justify-center text-3xl sm:text-4xl font-black font-mono text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all"
                >
                  {digit}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-cyan-200/90 mt-2 pt-2 border-t border-cyan-500/20">
            <span className="font-mono text-[10px] text-slate-300" dir="ltr">
              Room: #{roomCode}
            </span>
            <span className="font-bold text-emerald-300">
              {codeCopied ? '✓ تم نسخ الرمز!' : 'أدخل هذه الـ 4 أرقام في الهاتف للربط الفوري'}
            </span>
          </div>
        </div>

        {/* Domain / Link Configuration */}
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-b from-[#0D1533] to-[#070B1A] border border-cyan-500/40 space-y-2 text-right">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs font-changa text-cyan-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>رابط التحكم من الهاتف:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUseSharedUrl}
                className="text-[10px] bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold"
              >
                الرابط العام
              </button>
              <button
                onClick={() => {
                  forceReconnectAll();
                  setRoomCode(webrtcSync.getRoomCode());
                }}
                className="text-[10px] bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              dir="ltr"
              placeholder="اختياري: https://your-domain.com أو نطاق GitHub Pages"
              value={tempDomainInput}
              onChange={(e) => setTempDomainInput(e.target.value)}
              className="flex-1 bg-[#050814] border border-cyan-500/50 rounded-xl px-3 py-2 text-xs text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={handleSaveCustomDomain}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-changa text-xs shadow-md shrink-0"
            >
              تطبيق الرابط
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="truncate dir-ltr font-mono text-[10px] text-slate-400 max-w-[260px]">
              {remoteUrl}
            </span>
            {isUsingCustomDomain && (
              <button
                onClick={handleResetToCurrentOrigin}
                className="text-rose-400 hover:text-rose-300 underline font-bold shrink-0 ml-2"
              >
                العودة لرابط الموقع الحالي
              </button>
            )}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-3xl shadow-2xl border-4 border-slate-300/40 my-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR for Mobile Remote"
              className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl shadow-inner"
            />
          ) : (
            <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-slate-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          )}
          <div className="mt-1.5 text-center w-full">
            <span className="text-xs font-black text-slate-900 font-changa block">
              امسح الكود بكاميرا الهاتف لفتح ريموت التحكم (غرفة #{roomCode})
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] text-emerald-800 bg-emerald-100 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Cloud WSS + PeerJS WebRTC</span>
              </span>
              <span className="text-[10px] text-purple-800 bg-purple-100 font-mono font-bold px-2 py-0.5 rounded-full border border-purple-300 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-purple-600" />
                <span>غرفة #{roomCode}</span>
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
