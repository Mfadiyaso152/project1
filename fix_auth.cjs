const fs = require('fs');
const content = `import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Phone, CheckCircle2, Shield, Star, Crown, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { User } from '../types';
import { registerUser, loginUser } from '../authService';

interface AuthFlowProps {
  onSuccess: (user: User) => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'details' | 'plans' | 'pending'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = loginUser(email, password);
      if (user) {
        onSuccess(user);
      } else {
        setError('بيانات الدخول غير صحيحة');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterBasic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('الرجاء إدخال البريد وكلمة المرور');
      return;
    }
    setMode('details');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !dob) {
      setError('الرجاء إكمال جميع البيانات');
      return;
    }
    setMode('plans');
  };

  const handleSelectPlan = (plan: 'basic' | 'pro') => {
    setIsLoading(true);
    try {
      const user = registerUser(email, password, name, phone, dob, plan);
      setTempUser(user);
      setMode('pending');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* INITIAL LOGIN/REGISTER */}
      {(mode === 'login' || mode === 'register') && (
        <div className="relative z-10 w-full max-w-md animate-scale-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-4 shadow-sm border border-teal-100 dark:border-teal-500/20">
              <FileText size={32} className="stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {mode === 'login' ? 'مرحباً بعودتك، ادخل بياناتك للمتابعة' : 'انضم إلينا الآن للبدء في توثيق مستنداتك'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-bold mb-6 text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegisterBasic} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
                <Mail size={18} className="absolute right-3 top-3 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
                <Lock size={18} className="absolute right-3 top-3 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] mt-2 shadow-md"
            >
              {isLoading ? 'جاري التحميل...' : mode === 'login' ? 'دخول' : 'متابعة'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            </span>
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }} 
              className="font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              {mode === 'login' ? 'سجل الآن' : 'تسجيل الدخول'}
            </button>
          </div>
        </div>
      )}

      {/* DETAILS MODE (Post-Register step 1) */}
      {mode === 'details' && (
        <div className="relative z-10 w-full max-w-md animate-scale-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 flex items-center justify-between">
            <button onClick={() => setMode('register')} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">أكمل بياناتك الشخصية</h2>
            <div className="w-9" />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-bold mb-6 text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">الاسم الكامل (للترحيب)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
                <UserIcon size={18} className="absolute right-3 top-3 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">تاريخ الميلاد</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
                <Calendar size={18} className="absolute right-3 top-3 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">رقم الجوال (للتواصل وتفعيل الباقة)</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
                <Phone size={18} className="absolute right-3 top-3 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 shadow-md"
            >
              <span>متابعة لاختيار الباقة</span>
              <ArrowLeft size={18} />
            </button>
          </form>
        </div>
      )}

      {/* PLANS MODE */}
      {mode === 'plans' && (
        <div className="relative z-10 w-full max-w-4xl animate-scale-in flex flex-col items-center">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">اختر الباقة المناسبة لك</h2>
            <p className="text-slate-500 dark:text-slate-400">باقات مصممة لتلبية احتياجاتك في دمج وتوثيق المستندات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
            
            {/* Basic Plan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col shadow-xl">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">الباقة الأساسية Basic</h3>
              </div>
              
              <ul className="flex-1 flex flex-col gap-4 text-sm text-slate-600 dark:text-slate-400 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <span className="font-bold text-slate-900 dark:text-white">عدد لا محدود من الملفات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>دمج وتحميل بصيغة PDF عالية الجودة</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400 dark:text-slate-600">
                  <Shield size={18} className="shrink-0 mt-0.5" />
                  <span className="line-through">ميزة حفظ الأختام والترويسة بالسحابة</span>
                </li>
              </ul>

              <button
                onClick={() => handleSelectPlan('basic')}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                طلب الباقة الأساسية
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-teal-50 dark:bg-slate-900 border-2 border-teal-500 rounded-3xl p-6 sm:p-8 flex flex-col relative shadow-xl">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-teal-500 text-white font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Crown size={14} />
                <span>الاحترافية</span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-2">الباقة الاحترافية Pro</h3>
              </div>
              
              <ul className="flex-1 flex flex-col gap-4 text-sm text-slate-700 dark:text-slate-300 mb-8">
                <li className="flex items-start gap-2">
                  <Star size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <span className="font-bold text-slate-900 dark:text-white">عدد لا محدود من الملفات والصفحات</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <span className="font-bold text-teal-600 dark:text-teal-400">تخزين سحابي للأختام والترويسة والتوقيع للوصول الفوري</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>تخصيص كامل للمظهر (ثيمات حصرية)</span>
                </li>
              </ul>

              <button
                onClick={() => handleSelectPlan('pro')}
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                طلب الباقة الاحترافية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PENDING MODE */}
      {mode === 'pending' && (
        <div className="relative z-10 w-full max-w-md animate-scale-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-teal-50 dark:bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-500 border border-teal-100 dark:border-teal-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">تم رفع طلبك بنجاح</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
            تم إرسال طلب الاشتراك في باقة <span className="font-bold text-teal-500">{tempUser?.plan?.toUpperCase()}</span>. 
            <br/><br/>
            يمكنك التواصل مع المدير للحصول على كود التفعيل:
            <span className="block text-slate-900 dark:text-white font-bold font-mono mt-2 bg-slate-50 dark:bg-slate-950 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-lg">0536894854</span>
          </p>
          <button
            onClick={() => {
              if (tempUser) onSuccess(tempUser);
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            الانتقال للرئيسية (بانتظار التفعيل)
          </button>
        </div>
      )}
    </div>
  );
};
`
fs.writeFileSync('components/AuthFlow.tsx', content);
