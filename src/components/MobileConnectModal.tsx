import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

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
  const [remoteUrl, setRemoteUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}#remote`;
      setRemoteUrl(url);

      QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0A0F24',
          light: '#FFFFFF',
        },
      })
        .then((dataUri) => setQrDataUrl(dataUri))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0C1226] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-changa text-white flex items-center gap-2">
              <span>التحكم بالموقع من الهاتف</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full">
                مباشر
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              امسح رمز QR بكاميرا هاتفك للتحكم في الألعاب والنتيجة عن بُعد
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl shadow-xl border border-slate-200 my-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR for Mobile Remote"
              className="w-56 h-56 rounded-xl"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          )}
          <span className="text-[11px] font-bold text-slate-800 font-changa mt-2">
            امسح الكود بكاميرا الهاتف لفتح ريموت التحكم فوراً
          </span>
        </div>

        {/* Instructions */}
        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-2 mb-4">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <span className="w-5 h-5 rounded-full bg-purple-900/80 border border-purple-500/50 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>افتح كاميرا الهاتف ووجّهها نحو الشاشة لمسح الكود.</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <span className="w-5 h-5 rounded-full bg-cyan-900/80 border border-cyan-500/50 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>ستفتح شاشة التحكم: كشف الألعاب، حظر واختيار، وتعديل النقاط.</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <span className="w-5 h-5 rounded-full bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>أي نقرة على هاتفك ستظهر فوراً على هذه الشاشة في أجزاء من الثانية!</span>
          </div>
        </div>

        {/* Quick Link & Copy Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-changa flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ الرابط!' : 'نسخ رابط الريموت'}</span>
          </button>

          {onOpenRemoteDirectly && (
            <button
              onClick={() => {
                onClose();
                onOpenRemoteDirectly();
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold font-changa flex items-center gap-1.5 shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>تجربة الريموت هنا</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
