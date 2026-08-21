import React, { useState } from 'react';
import { X, ShieldCheck, Mail, ArrowRight, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginWithGoogle, ADMIN_EMAIL } from '../authService';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  reasonMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  reasonMessage
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleQuickLogin = (email: string, name?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const user = loginWithGoogle(email, name);
      setIsLoading(false);
      onSuccess(user);
      onClose();
    }, 450);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    handleGoogleQuickLogin(emailInput.trim(), nameInput.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 relative animate-scale-in">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-xs">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">تسجيل الدخول بواسطة Google</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {reasonMessage || 'يمكنك تجربة المنصة ورفع الملفات، وللمتابعة وتوثيق المستند يرجى تسجيل الدخول'}
            </p>
          </div>
        </div>

        {/* Action Options */}
        {!isCustomMode ? (
          <div className="flex flex-col gap-3">
            {/* Primary Google Login Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsCustomMode(true)}
              className="flex items-center justify-center gap-3 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              <span>تسجيل الدخول بحساب Google</span>
            </button>

            <div className="relative my-2 flex items-center justify-center">
              <div className="border-t border-slate-100 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 absolute">أو تسجيل الدخول السريع</span>
            </div>

            {/* Manager Account Quick Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleGoogleQuickLogin(ADMIN_EMAIL, 'المدير العام')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 transition-all cursor-pointer group text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  مدير
                </div>
                <div>
                  <div className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                    <span>حساب المدير العام</span>
                    <span className="text-[10px] bg-teal-200/80 text-teal-800 px-1.5 py-0.5 rounded font-bold">VIP</span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-mono">{ADMIN_EMAIL}</span>
                </div>
              </div>
              <ArrowRight size={16} className="text-teal-600 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Demo Customer Quick Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleGoogleQuickLogin('client.sample@gmail.com', 'عميل تجريبي')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs">
                  عميل
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">حساب عميل تجريبي</div>
                  <span className="text-[11px] text-slate-500 font-mono">client.sample@gmail.com</span>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني لحساب Google:
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="your.email@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
                <Mail size={18} className="absolute right-3 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الاسم الكريم (اختياري):
              </label>
              <input
                type="text"
                placeholder="محمد بن عبد الله"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={isLoading || !emailInput.trim()}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? 'جاري التحقق...' : 'متابعة الدخول'}
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                رجوع
              </button>
            </div>
          </form>
        )}

        {/* Guarantee Banner */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-3">
          <ShieldCheck size={20} className="text-teal-600 shrink-0" />
          <p className="text-[11px] text-slate-500 leading-normal">
            تسجيل آمن ومشفر. يتم ربط اشتراكك الشهري بحسابك لسهولة حفظ وتوثيق مستنداتك.
          </p>
        </div>

      </div>
    </div>
  );
};
