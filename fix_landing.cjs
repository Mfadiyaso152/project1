const fs = require('fs');
const content = `import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

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
        {/* Simple Header */}
        <header className="px-6 py-8 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 p-2.5 rounded-xl text-white shadow-lg shadow-teal-500/20">
              <FileText size={24} className="stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              وثيق
            </h1>
          </div>
          <button 
            onClick={onStart}
            className="text-sm font-bold text-slate-600 hover:text-teal-600 transition-colors"
          >
            تسجيل الدخول
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full mt-10 sm:mt-0">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-600 px-4 py-2 rounded-full text-xs font-bold mb-8">
            <Sparkles size={16} />
            <span>المنصة الأولى لدمج وتوثيق المستندات باحترافية</span>
          </div>

          <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-6">
            مستنداتك الرسمية <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">بكل سهولة وأمان</span>
          </h2>
          
          <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            منصة وثيق تتيح لك دمج مستنداتك وتوقيعها وختمها على أوراق مؤسستك الرسمية بكل أمان، سرعة، وموثوقية عالية.
          </p>

          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative">ابدأ التوثيق الآن</span>
            <ArrowLeft size={22} className="relative group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 text-right w-full">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-teal-500 border border-slate-100">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">أمان تام للبيانات</h3>
              <p className="text-sm text-slate-500">معالجة المستندات بخصوصية تامة دون حفظها في خوادم خارجية.</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-teal-500 border border-slate-100">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">دمج ذكي وسريع</h3>
              <p className="text-sm text-slate-500">أدوات متطورة لدمج الترويسات، الأختام، والتواقيع بدقة عالية.</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-teal-500 border border-slate-100">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">تصدير احترافي</h3>
              <p className="text-sm text-slate-500">تصدير الملفات بصيغة PDF عالية الجودة جاهزة للاعتماد والمشاركة.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
`
fs.writeFileSync('components/LandingView.tsx', content);
