import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Sparkles, CheckCircle2, Layers, PenTool, Stamp, Lock } from 'lucide-react';

interface LandingViewProps {
  onStart: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative overflow-hidden" dir="rtl">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Simple Top Bar */}
        <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-[1px] shadow-md shadow-blue-500/20">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-blue-600">
                <FileText size={22} className="stroke-[2.5]" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">وثيق</span>
            </div>
          </div>
          
          <button 
            onClick={onStart}
            className="text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200/80 px-5 py-2.5 rounded-xl shadow-xs transition-all hover:scale-105 cursor-pointer"
          >
            تسجيل الدخول
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full mt-6 sm:mt-12">
          
          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            توثيق مستنداتك الرسمية <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
              بأعلى معايير الأمان والاحترافية
            </span>
          </h1>
          
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
            ادمج أوراق المعاملات مع أوراق المؤسسة الرسمية، أضف الأختام والتواقيع، واستورد أصولك المحفوظة بضغطة زر واحدة.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onStart}
              className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white px-9 py-4 rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-blue-600/25 cursor-pointer overflow-hidden"
            >
              <span>دخول المنصة</span>
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 text-right w-full">
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all">
              <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                <Lock size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">أمان وخصوصية تامة</h3>
              <p className="text-xs text-slate-500 leading-relaxed">معالجة فورية ومباشرة داخل متصفحك مع الحفاظ التام على سرية أوراقك.</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all">
              <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                <Layers size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">دمج متعدد الصفحات</h3>
              <p className="text-xs text-slate-500 leading-relaxed">دمج ملفات PDF والصور المتعددة وتطبيق الورقة الرسمية بدقة متناهية.</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all">
              <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                <Stamp size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">أختام وتواقيع سحابية</h3>
              <p className="text-xs text-slate-500 leading-relaxed">احفظ أختامك وتوقيعك في حسابك واستخدمها فوراً دون الحاجة لإعادة الرفع.</p>
            </div>
          </div>
          
          <div className="mt-16 mb-16 flex flex-col items-center justify-center opacity-70">
            <span className="font-bold text-sm text-slate-700">منصة وثيق للتوثيق الإلكتروني</span>
            <span className="text-[11px] font-medium text-slate-500 mt-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>
        </main>
      </div>
    </div>
  );
};
