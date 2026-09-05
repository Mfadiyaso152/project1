import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Sparkles, CheckCircle2, UserCheck, Layers, PenTool } from 'lucide-react';

interface LandingViewProps {
  onStart: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-hidden" dir="rtl">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -left-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 p-2.5 rounded-2xl text-white shadow-lg shadow-teal-500/20">
              <FileText size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                وثيق
              </h1>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">توثيق رسمي</span>
            </div>
          </div>
          
          <button 
            onClick={onStart}
            className="text-sm font-bold text-slate-700 hover:text-teal-600 bg-white border border-slate-200 hover:border-teal-500 px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105"
          >
            تسجيل الدخول
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full mt-8 sm:mt-12">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-4 py-2 rounded-full text-xs font-bold mb-6 animate-fade-in">
            <ShieldCheck size={16} className="text-teal-600" />
            <span>منصة دمج وتوثيق المستندات والختم الإلكتروني والتواقيع الرسمية</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            مستنداتك الرسمية <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">بكل سهولة، أمان، واحترافية</span>
          </h2>
          
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            ادمج أصل المعاملات مع ورقة المؤسسة الرسمية، أضف الأختام والتواقيع، واحفظ أصولك في السحابة لاسترجاعها في ثوانٍ.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onStart}
              className="group relative inline-flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative">ابدأ الآن</span>
              <ArrowLeft size={22} className="relative group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-right w-full">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-teal-500 border border-slate-100">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">أمان وخصوصية تامة</h3>
              <p className="text-sm text-slate-500">معالجة المستندات مباشرة على جهازك وحفظ أصولك الخاصة بأمان.</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-teal-500 border border-slate-100">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">دمج متعدد الصفحات</h3>
              <p className="text-sm text-slate-500">دمج الأوراق الأصلية مع الورقة الرسمية والأختام بضغطة زر واحدة.</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-teal-500 border border-slate-100">
                <PenTool size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">توقيع حي وسحابي</h3>
              <p className="text-sm text-slate-500">ارسم توقيعك مباشرة أو ارفع ختمك واستخدمه في كل مستنداتك بسهولة.</p>
            </div>
          </div>
          
          <div className="mt-16 mb-20 flex flex-col items-center justify-center opacity-60">
            <span className="font-black text-lg text-slate-800 tracking-tight">منصة وثيق للتوثيق الإلكتروني</span>
            <span className="text-xs font-medium text-slate-500 mt-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>
        </main>
      </div>
    </div>
  );
};
