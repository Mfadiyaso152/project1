import React from 'react';
import { 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  Layers, 
  PenTool, 
  Stamp, 
  Zap, 
  Lock, 
  Cpu, 
  Sparkles,
  CheckCircle2,
  Share2,
  FileCheck2,
  Smartphone
} from 'lucide-react';
import { User, Step } from '../types';

interface AboutViewProps {
  currentUser: User | null;
  onNavigate: (step: Step) => void;
  onStart: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ currentUser, onNavigate, onStart }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-hidden" dir="rtl">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        
        {/* Main Content Container */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20 flex-1 w-full animate-fade-in-up">
          
          {/* Header Tag & Title */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <Sparkles size={15} className="text-teal-600" />
              <span>منصة التوثيق والدمج الرقمي</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              عن وثيق | Wathiq
            </h1>
            
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
              حل تقني حديث صُمم لتبسيط وتسريع عمليات دمج المعاملات مع الأوراق الرسمية والأختام والتواقيع الرقمية بأعلى دقة وموثوقية.
            </p>
          </div>

          {/* Core Story & Problem Solved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            
            {/* Card 1: What is Wathiq */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-5">
                  <FileText size={24} className="stroke-[2.5]" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-3">ما هو وثيق؟</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  <strong>وثيق</strong> هي منصة إلكترونية متخصصة في توثيق ودمج المستندات والخطابات الرسمية مع ورق الترويسة الرسمي للجهات والمؤسسات، وإتاحة تطبيق الأختام والتواقيع الرقمية على صفحات المستند بدقة هندسية عالية وتصديرها كملف PDF موثّق ونقي.
                </p>
              </div>
            </div>

            {/* Card 2: The Problem Solved */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-5">
                  <Zap size={24} className="stroke-[2.5]" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-3">المشكلة التي يحلها وثيق</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  تتطلب المعاملات الورقية التقليدية وقتاً وجهداً في طباعة المسودة، ووضع الختم والتوقيع يدوياً، ثم إعادة سحبها عبر الماسح الضوئي (Scanner)، مما يسبب تشويشاً في جودة الملف واستهلاكاً للوقت. وثيق تلغي هذه الدورة التقليدية وتنجزها سحابياً في لحظات.
                </p>
              </div>
            </div>

          </div>

          {/* How It Works (3 Steps) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm mb-12">
            <div className="text-center max-w-xl mx-auto mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">كيف تعمل المنصة؟</h2>
              <p className="text-sm text-slate-500">ثلاث خطوات بسيطة ومباشرة من البداية حتى تصدير مستندك المعتمد</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-black flex items-center justify-center text-base mb-4 shadow-md shadow-teal-500/20">
                  1
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">رفع المستندات</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ارفع مستندك الأصلي بصيغة PDF أو صور، مع إمكانية إضافة ورقة الترويسة الرسمية كخلفية معتمدة.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-black flex items-center justify-center text-base mb-4 shadow-md shadow-teal-500/20">
                  2
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">ضبط الأختام والتواقيع</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  حدد موضع الختم والتوقيع وحجمهما بالسحب الحر، مع خيار تثبيتها وتطبيقها تلقائياً على كل الصفحات.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-black flex items-center justify-center text-base mb-4 shadow-md shadow-teal-500/20">
                  3
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">التصدير والمشاركة</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  صدّر المستند كملف PDF عالي النقاء جاهز للأرشفة والمراسلة، أو شاركه مباشرة عبر الجوال وواتساب.
                </p>
              </div>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="mb-12">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">أهم المزايا التقنية</h2>
              <p className="text-sm text-slate-500">تم تطوير وثيق ليلبي احتياجات الشركات، المستقلين، والأفراد بكفاءة</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                  <Layers size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">دعم المستندات متعددة الصفحات</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">معالجة وتصفح صفحات PDF وتطبيق الأختام ومزامنة المواضع بين الصفحات بسهولة.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                  <Stamp size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">إدارة الأصول الحسابية</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">حفظ ختم المؤسسة والورقة الرسمية والتوقيع المعتمد في حسابك لاستخدامها بضغطة زر واحدة.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                  <PenTool size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">رسم التوقيع الحي</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">لوحة رسم تفاعلية متوافقة مع شاشات اللمس والأقلام الرقمية على الجوال والحاسوب.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">مشاركة فورية وتوافق كامل</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">مشاركة المستندات الموثقة مباشرة عبر واتساب ومختلف تطبيقات الهاتف بمرونة تامة.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl mb-12 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">الأمان والخصوصية الواقعية</h3>
                <p className="text-xs text-slate-400 mt-0.5">معايير حماية البيانات والتعامل الآمن مع المستندات</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <span><strong>معالجة موضعية:</strong> تتم عمليات قراءة المستندات ومعالجتها داخل بيئة المتصفح على جهاز المستخدم مباشرة لضمان أعلى مستويات الخصوصية.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <span><strong>أصول خاصة ومحمية:</strong> تُربط الأصول المحفوظة (الأختام والتواقيع) بحسابك المعتمد فقط ولا يمكن لأي طرف آخر الوصول إليها.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <span><strong>تشفير الاتصال:</strong> كافة البيانات المتبادلة مشفرة وفق بروتوكولات HTTPS وTLS المعتمدة دولياً.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <span><strong>حماية الدخول:</strong> تسجيل دخول موثوق عبر حساب Google المعتمد ورموز التحقق المؤقتة OTP المشفرة عبر SHA-256.</span>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="text-center bg-teal-50/80 border border-teal-200 rounded-3xl p-8 sm:p-10">
            <h3 className="text-2xl font-black text-slate-900 mb-2">جاهز لتوثيق مستنداتك باحترافية؟</h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
              ابدأ الآن بدمج معاملاتك وأوراقك الرسمية في ثوانٍ معدودة وبدون أي خطوات معقدة.
            </p>
            <button
              onClick={onStart}
              className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white font-black px-8 py-4 rounded-2xl text-base shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
            >
              <span>ابدأ التوثيق الآن</span>
              <ArrowLeft size={18} />
            </button>
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-8 px-4 text-center text-xs text-slate-500">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-500 text-white rounded-lg">
                <FileText size={14} className="stroke-[2.5]" />
              </div>
              <span className="font-black text-sm text-slate-900">وثيق | Wathiq</span>
            </div>
            
            <div className="flex items-center gap-6 font-medium">
              <button onClick={() => onNavigate(Step.LANDING)} className="hover:text-teal-600 transition-colors cursor-pointer">الرئيسية</button>
              <button onClick={() => onNavigate(Step.ABOUT)} className="hover:text-teal-600 transition-colors cursor-pointer font-bold text-teal-600">عن وثيق</button>
              <button onClick={() => onNavigate(currentUser ? Step.UPLOAD : Step.AUTH)} className="hover:text-teal-600 transition-colors cursor-pointer">مساحة العمل</button>
            </div>

            <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>
        </footer>

      </div>
    </div>
  );
};
