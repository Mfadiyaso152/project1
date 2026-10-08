import React, { useState } from 'react';
import { 
  Calendar, 
  Phone, 
  ArrowLeft, 
  ArrowRight,
  Check, 
  Briefcase, 
  UserCheck, 
  Share2, 
  Search, 
  Megaphone, 
  Building2, 
  HelpCircle 
} from 'lucide-react';
import { User, SurveyData } from '../types';
import { updateUserInDb, setCurrentUser } from '../authService';

interface OnboardingSurveyProps {
  currentUser: User;
  onComplete: (updatedUser: User) => void;
}

export const OnboardingSurvey: React.FC<OnboardingSurveyProps> = ({ currentUser, onComplete }) => {
  // 4 Steps: 1 -> Referral, 2 -> Usage Type, 3 -> Date of Birth, 4 -> Phone
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  const [howDidYouHear, setHowDidYouHear] = useState<string>('وسائل التواصل الاجتماعي (X، تيك توك، لينكد إن)');
  const [dob, setDob] = useState<string>(currentUser.dob || '');
  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [usageType, setUsageType] = useState<string>('شركات ومؤسسات تجارية');
  const [customHow, setCustomHow] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const referralOptions = [
    { id: 'social', label: 'وسائل التواصل الاجتماعي (X، تيك توك، لينكد إن)', icon: <Share2 size={18} className="text-teal-500" /> },
    { id: 'friend', label: 'توصية من صديق أو زميل عمل', icon: <UserCheck size={18} className="text-teal-500" /> },
    { id: 'search', label: 'بحث قوقل (Google)', icon: <Search size={18} className="text-teal-500" /> },
    { id: 'ads', label: 'إعلان إلكتروني', icon: <Megaphone size={18} className="text-teal-500" /> },
    { id: 'work', label: 'جهة عمل أو مؤسسة', icon: <Building2 size={18} className="text-teal-500" /> },
    { id: 'other', label: 'أخرى', icon: <HelpCircle size={18} className="text-teal-500" /> }
  ];

  const usageOptions = [
    { id: 'business', label: 'شركات ومؤسسات تجارية', desc: 'دمج وتوثيق الفواتير والمعاملات والمخاطبات الرسمية', icon: <Building2 size={20} className="text-teal-600" /> },
    { id: 'freelance', label: 'أعمال حرة ومستقلون', desc: 'توثيق العقود والتواقيع للأعمال والخدمات الفردية', icon: <Briefcase size={20} className="text-teal-600" /> },
    { id: 'personal', label: 'معاملات شخصية', desc: 'أرشفة وتوثيق المستندات والشهادات الشخصية', icon: <UserCheck size={20} className="text-teal-600" /> }
  ];

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!howDidYouHear) {
        setErrorMsg('يرجى تحديد خيار للمتابعة');
        return;
      }
      if (howDidYouHear === 'أخرى' && !customHow.trim()) {
        setErrorMsg('يرجى كتابة التفاصيل');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!usageType) {
        setErrorMsg('يرجى تحديد الغرض من الاستخدام');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الجوال للمتابعة');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const finalHow = howDidYouHear === 'أخرى' && customHow.trim() ? `أخرى: ${customHow.trim()}` : howDidYouHear;

    const surveyData: SurveyData = {
      howDidYouHear: finalHow,
      dob: dob.trim(),
      phone: phone.trim(),
      usageType,
      completedAt: new Date().toISOString()
    };

    const updatedUser: User = {
      ...currentUser,
      dob: dob.trim() || currentUser.dob,
      phone: phone.trim() || currentUser.phone,
      surveyCompleted: true,
      surveyData
    };

    updateUserInDb(updatedUser);
    setCurrentUser(updatedUser);

    setTimeout(() => {
      setIsSubmitting(false);
      onComplete(updatedUser);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden" dir="rtl">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 animate-fade-in-up my-6">
        
        {/* Step Progress Bar */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center justify-between text-xs font-black text-slate-500">
            <span>الخطوة {currentStep} من {totalSteps}</span>
            <span className="text-teal-600 font-mono font-bold">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-teal-400 to-teal-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-sm font-bold mb-6 flex items-center gap-2 animate-shake">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: كيف عرفت عن المنصة */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                كيف عرفت عن منصة وثيق؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                اختر القناة أو الطريقة التي وصلت إلينا من خلالها
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {referralOptions.map((opt) => {
                const isSelected = howDidYouHear === opt.label || (opt.id === 'other' && howDidYouHear === 'أخرى');
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setHowDidYouHear(opt.id === 'other' ? 'أخرى' : opt.label);
                      setErrorMsg('');
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-right transition-all cursor-pointer text-sm font-bold ${
                      isSelected 
                        ? 'bg-teal-50/70 border-teal-500 text-teal-900 shadow-sm ring-1 ring-teal-500' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {opt.icon}
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={18} className="text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {howDidYouHear === 'أخرى' && (
              <input
                type="text"
                value={customHow}
                onChange={(e) => setCustomHow(e.target.value)}
                placeholder="أخبرنا كيف عرفتنا بالتحديد..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                autoFocus
              />
            )}
          </div>
        )}

        {/* Step 2: نوع وغرض الاستخدام */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ما هو الغرض الأساسي من استخدامك للمنصة؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                حدد طبيعة المعاملات لتقديم تجربة ملائمة لاحتياجاتك
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {usageOptions.map((opt) => {
                const isSelected = usageType === opt.label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setUsageType(opt.label);
                      setErrorMsg('');
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-teal-50/70 border-teal-500 text-teal-900 shadow-sm ring-1 ring-teal-500' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 shrink-0 text-teal-600">
                        {opt.icon}
                      </div>
                      <div>
                        <div className="font-black text-sm sm:text-base text-slate-900">{opt.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check size={18} className="text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: تاريخ الميلاد */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                تاريخ الميلاد
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                اختياري - لمواءمة إعدادات الحساب ومطابقة الهوية الرسمية
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar size={18} className="text-teal-600" />
                <span>حدد تاريخ ميلادك</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-medium"
              />
            </div>
          </div>
        )}

        {/* Step 4: رقم الجوال */}
        {currentStep === 4 && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                رقم الجوال
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                مطلوب للتواصل والدعم الفني وتأكيد صحة الحساب
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Phone size={18} className="text-teal-600" />
                <span>أدخل رقم الجوال <span className="text-red-500">*</span></span>
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="05XXXXXXXX أو +9665..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-800 font-mono text-left focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none pl-4 font-semibold"
                autoFocus
                required
              />
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight size={16} />
              <span>السابق</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-teal-500 hover:bg-teal-600 active:scale-[0.99] text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              <span>التالي</span>
              <ArrowLeft size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600 active:scale-[0.99] text-white font-black py-3.5 px-8 rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>إكمال وبدء التوثيق</span>
                  <Check size={16} />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
