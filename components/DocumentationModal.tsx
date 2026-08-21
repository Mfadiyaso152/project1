import React from 'react';
import { X, BookOpen, FileCheck2, Stamp, PenTool, Sparkles, Shield, Clock, Phone, HelpCircle } from 'lucide-react';
import { ADMIN_PHONE, ADMIN_EMAIL } from '../authService';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative animate-scale-in">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">دليل التوثيق والاستخدام</h3>
              <p className="text-xs text-slate-500">منصة وثيق لدمج وتوثيق المستندات والختم والتوقيع الإلكتروني</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          {/* Step by Step Guide */}
          <div className="flex flex-col gap-3">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileCheck2 size={18} className="text-teal-600" />
              <span>خطوات تجهيز وتوثيق المستندات</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-1.5">
                <span className="font-bold text-teal-800 text-xs">1. رفع المستند الأصلي (أساسي)</span>
                <p className="text-[12px] text-slate-500">
                  ارفع المعاملة أو الأوراق المطلوب توثيقها بصيغة PDF متعدد الصفحات أو صور ممسوحة ضوئياً.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-1.5">
                <span className="font-bold text-teal-800 text-xs">2. ورقة المؤسسة الرسمية (اختياري)</span>
                <p className="text-[12px] text-slate-500">
                  خلفية وترويسة المؤسسة. سيتم دمج المستند الأصلي فوقها بذكاء وشفافية متناسقة.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-1.5">
                <span className="font-bold text-teal-800 text-xs">3. الختم والتوقيع الحي (اختياري)</span>
                <p className="text-[12px] text-slate-500">
                  ارفع صورة الختم الرسمي ورسم توقيعك الحي باللمس، مع إمكانية وضعهما وتحريكهما بالسحب والإفلات.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col gap-1.5">
                <span className="font-bold text-teal-800 text-xs">4. المزامنة والتصدير النهائي</span>
                <p className="text-[12px] text-slate-500">
                  مزامنة تلقائية لموضع الختم والتوقيع على جميع الصفحات أو تخصيص كل صفحة، ثم تصدير PDF جاهز وموثّق.
                </p>
              </div>
            </div>
          </div>

          {/* Subscription & Activation Codes Policy */}
          <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex flex-col gap-2">
            <h4 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
              <Clock size={16} className="text-teal-600" />
              <span>نظام الاشتراك ورموز الاسترداد</span>
            </h4>
            <p className="text-[12px] text-teal-800 leading-normal">
              تتيح المنصة تجربة رفع وتجهيز كافة المستندات مجاناً. ولمتابعة التحرير ومعالجة وتصدير ملفات PDF، يلزم تسجيل الدخول بحساب Google وتفعيل الاشتراك بواسطة <span className="font-bold">رمز الاسترداد</span>.
            </p>
            <p className="text-[12px] text-teal-800 leading-normal font-medium">
              مدة تفعيل الرمز: <span className="font-bold">شهر كامل (30 يوماً)</span> يتوقف بعدها الاشتراك تلقائياً ويمكن تجديده بإدخال رمز جديد.
            </p>
          </div>

          {/* Legal / Security Standards */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-start gap-3">
            <Shield size={22} className="text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-slate-900 text-xs">الخصوصية وأمان البيانات</h5>
              <p className="text-[11px] text-slate-500 mt-1">
                تتم معالجة ودمج ملفات PDF والترويسات محلياً ومباشرة في متصفحك لضمان سرية مستندات المؤسسة وأعلى معايير الأمان.
              </p>
            </div>
          </div>

          {/* Support and Contact */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-xs">لشراء الرموز أو الدعم الفني المباشر</h5>
              <p className="text-[11px] text-slate-300">المدير العام: {ADMIN_EMAIL}</p>
            </div>
            <a
              href={`tel:${ADMIN_PHONE}`}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors"
            >
              <Phone size={14} />
              <span>{ADMIN_PHONE}</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
