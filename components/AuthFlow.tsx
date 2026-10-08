import React, { useState } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  User as UserIcon, 
  Mail, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { User } from '../types';
import { loginWithGoogle, loginWithEmailOrGoogle, ADMIN_EMAIL } from '../authService';

interface AuthFlowProps {
  onSuccess: (user: User) => void;
  onCancel?: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const completeUserLogin = async (email: string, name: string, avatar?: string, sub?: string) => {
    setIsLoading(true);
    const res = await loginWithGoogle({
      email,
      name,
      avatar,
      sub
    });
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessMsg(res.message);
      setTimeout(() => onSuccess(res.user!), 300);
    } else {
      setError(res.message || 'تعذر تسجيل الدخول');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    setUnauthorizedDomain(null);

    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (firebaseUser && firebaseUser.email) {
        await completeUserLogin(
          firebaseUser.email,
          firebaseUser.displayName || firebaseUser.email.split('@')[0],
          firebaseUser.photoURL || undefined,
          firebaseUser.uid
        );
        return;
      }
    } catch (err: any) {
      setIsLoading(false);

      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('');
        return;
      }
      
      console.warn('Firebase Google Auth:', err?.code, err?.message);

      if (err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(currentDomain);
        setError('النطاق الحالي قيد الإضافة في قائمة النطاقات المعتمدة بـ Firebase.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة بواسطة المتصفح، يمكنك الدخول المباشر بالبريد أدناه');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('تعذر الاتصال بخوادم Google، يرجى استخدام الدخول بالبريد الإلكتروني');
      } else {
        setError(err?.message || 'حدث خطأ أثناء الاتصال بحساب Google');
      }
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await loginWithEmailOrGoogle({
        email: emailInput.trim(),
        name: nameInput.trim() || undefined,
        authProvider: 'email'
      });
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => onSuccess(res.user!), 300);
      } else {
        setError(res.message || 'تعذر تسجيل الدخول');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError('خطأ أثناء تسجيل الدخول: ' + (err?.message || err));
    }
  };

  const handleQuickContinueAdmin = () => {
    completeUserLogin(
      ADMIN_EMAIL,
      'محمد',
      `https://api.dicebear.com/7.x/initials/svg?seed=محمد`
    );
  };

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Ambient background */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Return to Landing Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 z-20 flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl shadow-xs transition-all hover:scale-105 cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>الرئيسية</span>
        </button>
      )}

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-xl my-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-3 border border-blue-100 shadow-sm">
            <FileText size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            تسجيل الدخول
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            ترتبط أصولك المحفوظة (أختام وتواقيع) بسحابة Firebase بحسابك في كل جلسة
          </p>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs font-bold mb-5 flex flex-col gap-2.5 animate-shake">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle size={16} className="shrink-0" />
              <span className="leading-tight">{error}</span>
            </div>

            {unauthorizedDomain && (
              <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs font-normal text-slate-700 flex flex-col gap-2">
                <span className="font-bold text-slate-800 text-[11px]">النطاق المطلوب إضافته في Firebase:</span>
                <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-blue-700">
                  <span className="truncate">{currentDomain}</span>
                  <button
                    onClick={handleCopyDomain}
                    type="button"
                    className="flex items-center gap-1 shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-[10px] font-black transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'تم النسخ' : 'نسخ النطاق'}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                  <span className="text-slate-500 text-[11px]">أو الدخول المباشر كمدير النظام:</span>
                  <button
                    type="button"
                    onClick={handleQuickContinueAdmin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserIcon size={14} />
                    <span>المتابعة كـ {ADMIN_EMAIL}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-blue-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Real Google Sign-in Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-blue-500 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            )}
            <span className="text-sm font-black">
              {isLoading ? 'جاري التحقق...' : 'المتابعة بحساب Google'}
            </span>
          </button>
        </div>

        {/* Elegant Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 absolute">
            أو الدخول بالبريد الإلكتروني
          </span>
        </div>

        {/* Email Direct Login Form for any user */}
        <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3 mt-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition-all outline-hidden text-left"
                dir="ltr"
              />
              <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              الاسم (اختياري)
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="اسمك أو اسم المؤسسة"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition-all outline-hidden text-right"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !emailInput.trim()}
            className="w-full mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
          >
            <span>دخول الحساب وتحميل الأصول</span>
            <ArrowRight size={14} className="rotate-180" />
          </button>
        </form>

      </div>
    </div>
  );
};
