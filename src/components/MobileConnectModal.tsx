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
} from 'lucide-react';

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
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [tempDomainInput, setTempDomainInput] = useState<string>('');

  // Determine the effective base origin
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const effectiveBase = (customDomain && customDomain.trim() !== '')
    ? customDomain.trim().replace(/\/+$/, '')
    : currentOrigin;

  // Primary URL uses clean /remote path (which camera QR scanners handle best)
  const remoteUrl = `${effectiveBase}/remote`;

  useEffect(() => {
    if (isOpen) {
      setTempDomainInput(customDomain || currentOrigin);
    }
  }, [isOpen, customDomain, currentOrigin]);

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
    setShowDomainSettings(false);
  };

  const handleResetToCurrentOrigin = () => {
    try {
      localStorage.removeItem('tahadi5_custom_domain');
    } catch {}
    setCustomDomain('');
    setTempDomainInput(currentOrigin);
    setShowDomainSettings(false);
  };

  const isUsingCustomDomain = Boolean(customDomain && customDomain.trim() !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
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
              <span>التحكم بالموقع من الهاتف</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold">
                LIVE REMOTE
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              امسح الكود بكاميرا هاتفك للتحكم المباشر في النتيجة وشاشة الألعاب
            </p>
          </div>
        </div>

        {/* Custom Domain Notification Pill */}
        <div className="mb-3 p-2.5 rounded-2xl bg-[#070D1F] border border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-400 shrink-0">رابط الريموت الحالي:</span>
            <span className="font-mono text-cyan-300 font-bold truncate dir-ltr">
              {remoteUrl}
            </span>
          </div>
          <button
            onClick={() => setShowDomainSettings(!showDomainSettings)}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold font-changa shrink-0 flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3 text-amber-400" />
            <span>{isUsingCustomDomain ? 'تعديل الدومين' : 'تفعيل دومين خاص'}</span>
          </button>
        </div>

        {/* Custom Domain Settings Dropdown Drawer */}
        {showDomainSettings && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-b from-[#0D1533] to-[#070B1A] border-2 border-cyan-500/50 space-y-3 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs font-changa text-amber-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>إعداد رابط الدومين الخاص بك (Custom Domain)</span>
              </span>
              {isUsingCustomDomain && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  دومين مخصص مفعّل ✓
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              إذا قمت بربط دومين مخصص لموقعك وتريد أن يفتح رمز الـ QR على هاتفك الدومين الجديد مباشرة، اكتبه هنا وسيتم حفظه وتحديث الكود فوراً:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                dir="ltr"
                placeholder="https://example.com"
                value={tempDomainInput}
                onChange={(e) => setTempDomainInput(e.target.value)}
                className="flex-1 bg-[#050814] border border-cyan-500/60 rounded-xl px-3 py-2 text-xs text-cyan-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button
                onClick={handleSaveCustomDomain}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-changa text-xs shadow-md"
              >
                حفظ
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-400">
                الرابط التلقائي للمتصفح الحالي: <span className="font-mono text-slate-300 dir-ltr">{currentOrigin}</span>
              </span>
              {isUsingCustomDomain && (
                <button
                  onClick={handleResetToCurrentOrigin}
                  className="text-rose-400 hover:text-rose-300 underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة للرابط التلقائي</span>
                </button>
              )}
            </div>
          </div>
        )}

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
          <div className="mt-2 text-center">
            <span className="text-xs font-black text-slate-900 font-changa block">
              امسح الكود بكاميرا الهاتف لفتح ريموت التحكم
            </span>
            <span className="text-[10px] text-slate-600 font-mono dir-ltr block truncate max-w-xs mt-0.5 font-bold">
              {remoteUrl}
            </span>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 text-xs text-slate-300 space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <span className="w-4 h-4 rounded-full bg-purple-900/80 border border-purple-500/50 flex items-center justify-center text-[9px]">
              1
            </span>
            <span>افتح كاميرا الهاتف ووجّهها نحو الشاشة لمسح الكود.</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <span className="w-4 h-4 rounded-full bg-cyan-900/80 border border-cyan-500/50 flex items-center justify-center text-[9px]">
              2
            </span>
            <span>تفتح شاشة ريموت الهاتف: تحكم فوري بالألعاب والنتيجة والـ Ban/Pick.</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <span className="w-4 h-4 rounded-full bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center text-[9px]">
              3
            </span>
            <span>المزامنة فورية وتعمل عبر الشبكة المحلية والإنترنت دون أي تأخير!</span>
          </div>
        </div>

        {/* Action Buttons: Copy Link & Open in Tab */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-changa flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">تم نسخ الرابط!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-indigo-400" />
                <span>نسخ رابط الريموت</span>
              </>
            )}
          </button>

          <a
            href={remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 rounded-2xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/80 text-xs font-bold font-changa flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="فتح الرابط في تبويب جديد لتجربته"
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
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-changa flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>تجربة مباشرة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
