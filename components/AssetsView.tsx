import React, { useState } from 'react';
import { 
  Layers, 
  FileText, 
  Stamp, 
  PenTool, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Trash2, 
  Sparkles 
} from 'lucide-react';
import FileUpload from './FileUpload';
import SignaturePad from './SignaturePad';
import { User } from '../types';
import { updateUserInDb, setCurrentUser } from '../authService';

interface AssetsViewProps {
  currentUser: User;
  onBack: () => void;
  onUpdate: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ currentUser, onBack, onUpdate }) => {
  const isLight = currentUser.theme !== 'space-dark';
  const [saveMessage, setSaveMessage] = useState('');
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  const handleSaveDataUrlAsset = (type: 'template' | 'stamp' | 'signature', dataUrl: string | null) => {
    if (!currentUser.savedAssets) {
      currentUser.savedAssets = { template: null, stamp: null, signature: null };
    }
    currentUser.savedAssets[type] = dataUrl;
    updateUserInDb(currentUser);
    setCurrentUser(currentUser);
    setSaveMessage('تم حفظ أصولك السحابية بنجاح!');
    setTimeout(() => setSaveMessage(''), 3000);
    onUpdate();
  };

  const handleSaveAsset = (type: 'template' | 'stamp' | 'signature', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      handleSaveDataUrlAsset(type, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const cardClass = isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up pb-12 px-4 sm:px-6" dir="rtl">
      
      {/* Header with back button */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500 text-white rounded-2xl shadow-md">
            <Layers size={24} />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${textPrimary}`}>
              إدارة الأصول الحسابية
            </h1>
            <p className={`text-sm ${textSecondary}`}>
              احفظ أختامك، توقيعك، وورقتك الرسمية لاستخدامها مباشرة في كل معاملة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl border transition-all hover:scale-105 cursor-pointer shadow-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-700 hover:text-teal-600' : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-teal-400'
          }`}
        >
          <ArrowLeft size={16} />
          <span>الرئيسية</span>
        </button>
      </div>

      {saveMessage && (
        <div className="text-sm font-bold text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Info notice */}
      <div className={`p-5 rounded-3xl border flex items-center gap-3.5 shadow-sm ${
        isLight ? 'bg-teal-50/60 border-teal-200 text-teal-900' : 'bg-teal-950/40 border-teal-800 text-teal-200'
      }`}>
        <Sparkles size={22} className="text-teal-500 shrink-0" />
        <p className="text-xs sm:text-sm leading-relaxed">
          جميع الأصول المرفوعة هنا تُحفظ بأمان في سحابة حسابك الشخصي ويتم استدعاؤها تلقائياً عند معالجة أي معاملة في مساحة العمل دون الحاجة لإعادة رفعها كل مرة.
        </p>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* الورقة الرسمية */}
        <div className={`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <FileText size={18} />
              </div>
              <h3 className={`font-black text-lg ${textPrimary}`}>الورقة الرسمية (الترويسة)</h3>
            </div>
            {currentUser.savedAssets?.template && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>محفوظة</span>
              </span>
            )}
          </div>
          <p className={`text-xs ${textSecondary}`}>
            قالب ورقة المؤسسة المعتمدة (PDF أو صورة عالية الجودة) يتم وضع أصل المعاملة فوقها تلقائياً.
          </p>

          <FileUpload
            label="رفع أو تحديث الورقة الرسمية"
            subLabel="PDF أو صورة عريضة A4"
            accept="image/*,application/pdf"
            value={currentUser.savedAssets?.template}
            onChange={(f) => handleSaveAsset('template', f as File)}
            onClear={() => handleSaveDataUrlAsset('template', null)}
            icon={<FileText size={24} className="text-teal-500" />}
          />
        </div>

        {/* الختم الرسمي */}
        <div className={`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Stamp size={18} />
              </div>
              <h3 className={`font-black text-lg ${textPrimary}`}>الختم الرسمي للمؤسسة</h3>
            </div>
            {currentUser.savedAssets?.stamp && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>محفوظ</span>
              </span>
            )}
          </div>
          <p className={`text-xs ${textSecondary}`}>
            صورة الختم الرسمي ذو خلفية شفافة (PNG) لاعتماده ووضعه في مكانه المحدد فوراً.
          </p>

          <FileUpload
            label="رفع أو تحديث الختم الرسمي"
            subLabel="صورة شفافة PNG أو دقة عالية"
            accept="image/png, image/jpeg, application/pdf"
            value={currentUser.savedAssets?.stamp}
            onChange={(f) => handleSaveAsset('stamp', f as File)}
            onClear={() => handleSaveDataUrlAsset('stamp', null)}
            icon={<Stamp size={24} className="text-teal-500" />}
          />
        </div>

        {/* التوقيع الرسمي */}
        <div className={`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl lg:col-span-2 ${cardClass}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <PenTool size={18} />
              </div>
              <h3 className={`font-black text-lg ${textPrimary}`}>التوقيع الإلكتروني المعتمد</h3>
            </div>
            <div className="flex items-center gap-2">
              {currentUser.savedAssets?.signature && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck size={13} />
                  <span>محفوظ</span>
                </span>
              )}
              <button 
                type="button"
                onClick={() => setIsDrawingSignature(true)}
                className="text-xs px-3.5 py-2 font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-105"
              >
                <PenTool size={14} />
                <span>رسم توقيع جديد باليد ✍️</span>
              </button>
            </div>
          </div>
          <p className={`text-xs ${textSecondary}`}>
            ارفع صورة توقيعك المفرغ أو ارسمه مباشرةً باستخدام لوحة الرسم الإلكترونية عالية الدقة.
          </p>

          <FileUpload
            label="رفع صورة التوقيع"
            subLabel="صورة شفافة PNG أو رسم مباشر"
            accept="image/png, image/jpeg, application/pdf"
            value={currentUser.savedAssets?.signature}
            onChange={(f) => handleSaveAsset('signature', f as File)}
            onClear={() => handleSaveDataUrlAsset('signature', null)}
            icon={<PenTool size={24} className="text-teal-500" />}
          />
        </div>

      </div>

      {/* Signature drawing modal */}
      {isDrawingSignature && (
        <SignaturePad
          onSave={(dataUrl) => {
            handleSaveDataUrlAsset('signature', dataUrl);
            setIsDrawingSignature(false);
          }}
          onClose={() => setIsDrawingSignature(false)}
        />
      )}

    </div>
  );
};
