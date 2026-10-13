import React, { useState } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Check
} from 'lucide-react';
import { User } from '../types';
import { 
  loginWithEmailAndPassword, 
  registerWithEmailAndPassword,
  signInWithFirebaseGoogle 
} from '../authService';

interface AuthFlowProps {
  onSuccess: (user: User) => void;
  onCancel?: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess, onCancel }) => {
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Registration steps:
  // 0: Welcome greeting
  // 1: Name / Organization
  // 2: Email
  // 3: Password & Confirm Password
  // 4: Success confirmation screen
  const [regStep, setRegStep] = useState<number>(0);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Form fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [noAccountError, setNoAccountError] = useState(false);

  // Direct WhatsApp support link
  const whatsappSupportUrl = `https://wa.me/966536894854?text=${encodeURIComponent('مرحباً، نسيت كلمة المرور لحسابي في منصة وثيق، وأحتاج مساعدة في استعادتها.')}`;

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNoAccountError(false);
    setSuccessMsg('');

    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (!passwordInput || passwordInput.length < 4) {
      setError('يرجى إدخال كلمة سر صحيحة');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginWithEmailAndPassword(cleanEmail, passwordInput);
      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => onSuccess(res.user!), 350);
      } else {
        if (res.isNewUser || res.message.includes('ليس لديك حساب')) {
          setNoAccountError(true);
          setError('ليس لديك حساب؟ إنشاء حساب جديد');
        } else {
          setError(res.message || 'تعذر تسجيل الدخول، يرجى التحقق من البيانات');
        }
      }
    } catch (err: any) {
      setError('حدث خطأ أثناء تسجيل الدخول: ' + (err?.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  // Move forward in registration steps
  const handleNextRegStep = () => {
    setError('');
    if (regStep === 1) {
      if (!nameInput.trim()) {
        setError('يرجى إدخال الاسم أو اسم المؤسسة للمتابعة');
        return;
      }
      setRegStep(2);
    } else if (regStep === 2) {
      const cleanEmail = emailInput.trim();
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setError('يرجى إدخال بريد إلكتروني صالح للمتابعة');
        return;
      }
      setRegStep(3);
    }
  };

  // Submit final registration step (Step 3)
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordInput || passwordInput.length < 4) {
      setError('يرجى إدخال كلمة مرور مكونة من 4 خانات على الأقل');
      return;
    }

    if (passwordInput !== confirmPasswordInput) {
      setError('كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة المحاولة');
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerWithEmailAndPassword(
        nameInput.trim(),
        emailInput.trim(),
        passwordInput
      );

      if (res.success && res.user) {
        // Advance to step 4: Success confirmation screen
        setRegStep(4);
      } else {
        setError(res.message || 'تعذر إنشاء الحساب');
      }
    } catch (err: any) {
      setError('حدث خطأ أثناء إنشاء الحساب: ' + (err?.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  // Google Authentication
  const handleGoogleAuth = async () => {
    setError('');
    setNoAccountError(false);
    setSuccessMsg('');
    setIsGoogleLoading(true);
    try {
      const res = await signInWithFirebaseGoogle();
      if (res.success && res.user) {
        setSuccessMsg(res.message);
        setTimeout(() => onSuccess(res.user!), 350);
      } else {
        setError(res.message || 'تعذر تسجيل الدخول بواسطة Google');
      }
    } catch (err: any) {
      setError('حدث خطأ أثناء الاتصال بحساب Google: ' + (err?.message || err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Switch to register from error banner
  const handleSwitchToRegisterFromError = () => {
    setMode('register');
    setRegStep(nameInput.trim() ? 2 : 1);
    setError('');
    setNoAccountError(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background ambient orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Return to Landing Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 z-20 flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>الرئيسية</span>
        </button>
      )}

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-xl my-8 transition-all">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-3 border border-blue-100 shadow-sm transition-transform duration-300 hover:scale-105">
            <FileText size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            منصة وثيق لتوثيق ودمج المستندات الرسمية بأعلى سرية وأمان
          </p>
        </div>

        {/* Tab switch between Login and Register (only when not in success step) */}
        {!(mode === 'register' && regStep === 4) && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setNoAccountError(false);
              }}
              className={`flex-1 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                mode === 'login' 
                  ? 'bg-white text-blue-600 shadow-sm font-black scale-[1.02]' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegStep(0);
                setError('');
                setNoAccountError(false);
              }}
              className={`flex-1 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                mode === 'register' 
                  ? 'bg-white text-blue-600 shadow-sm font-black scale-[1.02]' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold mb-5 flex flex-col gap-2.5 animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span className="leading-tight">{error}</span>
            </div>
            {/* If user does not have an account, prompt with direct CTA button */}
            {noAccountError && (
              <button
                type="button"
                onClick={handleSwitchToRegisterFromError}
                className="mt-1 w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>إنشاء حساب جديد الآن</span>
                <ArrowRight size={13} className="rotate-180" />
              </button>
            )}
          </div>
        )}

        {/* Success message banner */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: LOGIN FLOW */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setNoAccountError(false);
                    }}
                    placeholder="example@gmail.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition-all duration-200 outline-hidden text-left pl-3.5 pr-9"
                    dir="ltr"
                  />
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    كلمة المرور
                  </label>
                  {/* Forgot Password -> WhatsApp support button */}
                  <a
                    href={whatsappSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 transition-colors"
                  >
                    <MessageCircle size={12} className="text-emerald-500" />
                    <span>نسيت كلمة المرور؟ تواصل مع الدعم</span>
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition-all duration-200 outline-hidden text-left pl-9 pr-9"
                    dir="ltr"
                  />
                  <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !emailInput.trim() || !passwordInput}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black py-3 px-4 rounded-xl text-xs transition-all duration-200 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <ArrowRight size={14} className="rotate-180" />
                  </>
                )}
              </button>
            </form>

            {/* Quick link: Don't have an account? */}
            <div className="mt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegStep(0);
                  setError('');
                  setNoAccountError(false);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all cursor-pointer"
              >
                ليس لديك حساب؟ إنشاء حساب جديد
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400">
                أو
              </span>
            </div>

            {/* Google Sign-in button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer group"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
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
              <span className="text-xs font-bold text-slate-800">
                أو الدخول بواسطة قوقل
              </span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: STEP-BY-STEP REGISTRATION FLOW */}
        {/* ======================================================== */}
        {mode === 'register' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            
            {/* STEP 0: WELCOME GREETING SCREEN */}
            {regStep === 0 && (
              <div className="flex flex-col items-center text-center gap-4 py-2 animate-scale-in">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Sparkles size={32} />
                </div>
                
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1">
                    مرحباً بك في وثـيـق ✨
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    أنشئ حسابك الآن لحفظ أختامك وتواقيعك الرسمية، وتوثيق ودمج مستنداتك بأعلى معايير السرية والأمان.
                  </p>
                </div>

                {/* Security Highlights */}
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2 text-right">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                    <span>بيانات مشفرة وسرية تامة ومحمية بأمان</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                    <Check size={14} className="text-blue-600 shrink-0" />
                    <span>مزامنة أصولك ومستنداتك والوصول إليها من أي جهاز</span>
                  </div>
                </div>

                {/* Start Registration Steps Button */}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setRegStep(1);
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-3.5 px-4 rounded-xl text-xs transition-all duration-200 shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <span>ابدأ إنشاء الحساب الآن 🚀</span>
                  <ArrowRight size={14} className="rotate-180" />
                </button>

                {/* Google Quick Registration */}
                <div className="w-full">
                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400">
                      أو
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isGoogleLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all duration-200 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span className="text-xs font-bold text-slate-800">
                      التسجيل السريع بواسطة قوقل
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all cursor-pointer mt-1"
                >
                  لديك حساب بالفعل؟ تسجيل الدخول
                </button>
              </div>
            )}

            {/* STEP 1: NAME / INSTITUTION */}
            {regStep === 1 && (
              <div className="flex flex-col gap-4 animate-scale-in">
                {/* Step indicator */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span className="text-blue-600 font-black">الخطوة 1 من 3</span>
                  <span>الاسم أو المؤسسة</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-1/3 rounded-full transition-all duration-300" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    الاسم الشخصي / اسم المنشأة أو المؤسسة
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    سيظهر هذا الاسم على مستنداتك المعتمدة وملفك الشخصي
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="مثال: مؤسسة الفهد التجارية أو محمد الحربي"
                      autoFocus
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 transition-all duration-200 outline-hidden text-right pr-10"
                    />
                    <Building2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(0)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={!nameInput.trim()}
                    onClick={handleNextRegStep}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black py-3 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <span>المتابعة إلى البريد</span>
                    <ArrowRight size={14} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: EMAIL */}
            {regStep === 2 && (
              <div className="flex flex-col gap-4 animate-scale-in">
                {/* Step indicator */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span className="text-blue-600 font-black">الخطوة 2 من 3</span>
                  <span>البريد الإلكتروني</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-2/3 rounded-full transition-all duration-300" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    البريد الإلكتروني الخاص بك
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    يُستخدم لتسجيل الدخول ومزامنة أصولك ومستنداتك بسرية تامة
                  </p>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      autoFocus
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-900 transition-all duration-200 outline-hidden text-left pl-3.5 pr-10"
                      dir="ltr"
                    />
                    <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={!emailInput.trim() || !emailInput.includes('@')}
                    onClick={handleNextRegStep}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black py-3 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <span>المتابعة إلى كلمة المرور</span>
                    <ArrowRight size={14} className="rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PASSWORD & CONFIRM PASSWORD */}
            {regStep === 3 && (
              <form onSubmit={handleCompleteRegistration} className="flex flex-col gap-4 animate-scale-in">
                {/* Step indicator */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span className="text-blue-600 font-black">الخطوة 3 من 3</span>
                  <span>كلمة المرور وتأكيدها</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-full rounded-full transition-all duration-300" />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition-all duration-200 outline-hidden text-left pl-9 pr-9"
                      dir="ltr"
                    />
                    <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    إعادة إدخال كلمة المرور (تأكيد)
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 transition-all duration-200 outline-hidden text-left pl-9 pr-9 ${
                        confirmPasswordInput && confirmPasswordInput === passwordInput
                          ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-100'
                          : confirmPasswordInput && confirmPasswordInput !== passwordInput
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100'
                      }`}
                      dir="ltr"
                    />
                    <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(p => !p)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Realtime password feedback */}
                  {confirmPasswordInput && (
                    <div className="mt-1 text-[11px] font-bold flex items-center gap-1.5">
                      {confirmPasswordInput === passwordInput ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          كلمتا المرور متطابقتان تماماً
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle size={13} />
                          كلمتا المرور غير متطابقتين
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !passwordInput || passwordInput !== confirmPasswordInput}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black py-3 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>إنشاء الحساب وتفعيله ✅</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: REGISTRATION SUCCESS CONFIRMATION SCREEN */}
            {regStep === 4 && (
              <div className="flex flex-col items-center text-center gap-4 py-3 animate-scale-in">
                <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-badge-pulse">
                  <CheckCircle2 size={44} className="stroke-[2.5]" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1.5">
                    تم إنشاء الحساب بنجاح! 🎉
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                    أهلاً بك <strong className="text-slate-900 font-black">{nameInput}</strong>، تم حفظ حسابك وربطه بقاعدة البيانات بأمان تام وسرية كاملة.
                  </p>
                </div>

                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs font-bold text-emerald-800 text-center">
                  <span>تم تجهيز حسابك! يمكنك الآن الانتقال لتسجيل الدخول والبدء مباشرة</span>
                </div>

                {/* Redirect to Login button as requested */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRegStep(0);
                    setError('');
                    setSuccessMsg('تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول مباشرة');
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black py-3.5 px-4 rounded-xl text-xs transition-all duration-200 shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <span>الانتقال لصفحة تسجيل الدخول 🚪</span>
                  <ArrowRight size={15} className="rotate-180" />
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
