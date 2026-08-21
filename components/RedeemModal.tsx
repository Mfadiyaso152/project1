import React, { useState } from 'react';
import { X, KeyRound, Phone, MessageCircle, CheckCircle2, AlertCircle, Sparkles, Clock, ShieldAlert } from 'lucide-react';
import { ADMIN_PHONE, ADMIN_EMAIL, redeemCodeForUser, getStoredCodes } from '../authService';
import { User } from '../types';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess: (updatedUser: User) => void;
  onOpenAuth: () => void;
}

export const RedeemModal: React.FC<RedeemModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onOpenAuth
}) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!code.trim()) {
      setErrorMessage('يرجى إدخال رمز الاسترداد.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = redeemCodeForUser(currentUser, code.trim());
      setIsLoading(false);

      if (result.success && result.updatedUser) {
        setSuccessMessage(result.message);
        setTimeout(() => {
          onSuccess(result.updatedUser!);
          onClose();
        }, 1500);
      } else {
        setErrorMessage(result.message);
      }
    }, 400);
  };

  // Quick fill sample available code helper for quick testing
  const handleUseSampleCode = () => {
    const codes = getStoredCodes();
    const available = codes.find(c => !c.isUsed);
    if (available) {
      setCode(available.code);
    } else {
      setCode('WTQ-PRO9-8K2M-4L7P');
    }
  };

  const whatsappMessage = encodeURIComponent('السلام عليكم، أرغب في شراء رمز تفعيل وتجديد الاشتراك الشهري لمنصة وثيق.');
  const whatsappUrl = `https://wa.me/966536894854?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 relative animate-scale-in">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs text-amber-600">
            <KeyRound size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">تفعيل الاشتراك الشهري</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              أدخل رمز الاسترداد لتفعيل حسابك لمدة <span className="font-bold text-teal-700">شهر كامل (30 يوماً)</span> وتوثيق جميع مستنداتك بلا حدود.
            </p>
          </div>
        </div>

        {/* Not Logged in Notice */}
        {!currentUser && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-900">يلزم تسجيل الدخول بحساب Google أولاً</p>
              <p className="text-amber-700 mt-0.5">لتسجيل الرمز وربطه بحسابك الشخصي.</p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="mt-2 text-xs font-bold text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                تسجيل الدخول الآن &larr;
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRedeem} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                رمز الاسترداد (Activation Code):
              </label>
              <button
                type="button"
                onClick={handleUseSampleCode}
                className="text-[11px] text-teal-600 hover:underline font-bold cursor-pointer"
              >
                تجربة رمز متاح تلقائياً ✨
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="مثال: WTQ-XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setErrorMessage('');
                }}
                className="w-full pl-3 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono text-slate-800 tracking-wider text-center font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white uppercase"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !code.trim() || !currentUser}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? 'جاري التحقق والتفعيل...' : 'تفعيل الرمز والاشتراك (1 شهر)'}
          </button>
        </form>

        {/* Purchase Contact Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Clock size={16} className="text-teal-600" />
            <span>شراء وتجديد رموز الاسترداد:</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            للحصول على رمز استرداد جديد وتفعيل الخدمة شهرياً، يرجى التواصل مباشرة مع المدير العام:
          </p>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <a
              href={`tel:${ADMIN_PHONE}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              <Phone size={14} className="text-teal-600" />
              <span>اتصال: {ADMIN_PHONE}</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle size={14} />
              <span>واتساب المدير</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
