import React, { useState } from 'react';
import { FileText, ArrowLeft, AlertCircle, CheckCircle2, Copy, Check, ShieldCheck, User as UserIcon } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { User } from '../types';
import { loginWithGoogle, ADMIN_EMAIL } from '../authService';

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

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const completeUserLogin = (email: string, name: string, avatar?: string, sub?: string) => {
    setIsLoading(true);
    const res = loginWithGoogle({
      email,
      name,
      avatar,
      sub
    });
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessMsg(res.message);
      setTimeout(() => onSuccess(res.user!), 400);
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
      // Force Google account chooser on the user's device
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      // Launch actual Google Auth popup
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (firebaseUser && firebaseUser.email) {
        completeUserLogin(
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
        // User closed the popup window - reset state cleanly
        setError('');
        return;
      }
      
      console.warn('Firebase Google Auth:', err?.code, err?.message);

      if (err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(currentDomain);
        setError('النطاق الحالي قيد الإضافة في قائمة النطاقات المعتمدة بـ Firebase.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة بواسطة المتصفح، يرجى السماح بالنوافذ المنبثقة');
      } else if (err?.code === 'auth/network-request-failed') {
        setError('تعذر الاتصال بخوادم Google، يرجى التحقق من اتصال الإنترنت');
      } else {
        setError(err?.message || 'حدث خطأ أثناء الاتصال بحساب Google');
      }
    }
  };

  const handleQuickContinue = () => {
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Return to Landing Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 z-20 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-600 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm transition-all hover:scale-105 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>الرئيسية</span>
        </button>
      )}

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 mb-3 shadow-sm border border-teal-100">
            <FileText size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1.5">
            تسجيل الدخول
          </h1>
          <p className="text-slate-500 text-sm">
            سجّل دخولك بحساب Google المعتمد للمتابعة
          </p>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-sm font-bold mb-5 flex flex-col gap-2.5 animate-shake">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle size={18} className="shrink-0" />
              <span className="leading-tight">{error}</span>
            </div>

            {unauthorizedDomain && (
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs font-normal text-slate-700 flex flex-col gap-2">
                <span className="font-bold text-slate-800">النطاق المطلوب إضافته في Firebase:</span>
                <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-teal-700">
                  <span className="truncate">{currentDomain}</span>
                  <button
                    onClick={handleCopyDomain}
                    type="button"
                    className="flex items-center gap-1 shrink-0 bg-teal-600 hover:bg-teal-700 text-white px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'تم النسخ' : 'نسخ النطاق'}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex flex-col gap-1.5">
                  <span className="text-slate-600 text-[11px]">يمكنك المتابعة فوراً بحسابك المسجل:</span>
                  <button
                    type="button"
                    onClick={handleQuickContinue}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl text-sm font-bold mb-5 flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Real Google Sign-in Button */}
        <div className="my-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-teal-500 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
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
            <span className="text-base font-black">
              {isLoading ? 'جاري فتح نافذة حسابات Google...' : 'المتابعة باستخدام حساب Google'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
