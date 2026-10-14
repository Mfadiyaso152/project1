import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Stamp, 
  PenTool, 
  FileText, 
  CheckCircle2, 
  LogOut, 
  Upload, 
  Trash2, 
  Layers
} from 'lucide-react';
import { User } from '../types';
import { 
  saveUserAsset, 
  getUserAsset,
  fetchUserFromFirestoreByEmail 
} from '../authService';
import SignaturePad from './SignaturePad';

interface AccountViewProps {
  currentUser: User;
  onBack: () => void;
  onLogout: () => void;
  onUpdate: () => void;
}

const loadPdfFirstPage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("مكتبة معالجة ملفات PDF قيد التحميل.");
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          reject(new Error('Canvas context not available'));
        }
      } catch (err) {
        reject(err);
      }
    };
    fileReader.onerror = (err) => reject(err);
    fileReader.readAsArrayBuffer(file);
  });
};

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  onBack,
  onLogout,
  onUpdate
}) => {
  const [savingType, setSavingType] = useState<string | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAssetUpload = async (type: 'template' | 'stamp' | 'signature', file: File) => {
    setSavingType(type);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    try {
      let dataUrl: string;
      if (isPdf) {
        showToast('جاري معالجة واستخراج صفحة الـ PDF...');
        dataUrl = await loadPdfFirstPage(file);
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      if (dataUrl) {
        await saveUserAsset(type, dataUrl, currentUser);
        showToast(`تم حفظ ${type === 'template' ? 'الورقة الرسمية' : type === 'stamp' ? 'الختم' : 'التوقيع'} وربطه بحسابك بنجاح ✅`);
        onUpdate();
      }
    } catch (err: any) {
      showToast('خطأ أثناء معالجة الملف: ' + (err?.message || err));
    } finally {
      setSavingType(null);
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    setSavingType('signature');
    setIsDrawingSignature(false);
    await saveUserAsset('signature', dataUrl, currentUser);
    setSavingType(null);
    showToast('تم حفظ التوقيع وربطه بحسابك بنجاح ✅');
    onUpdate();
  };

  const handleDeleteAsset = async (type: 'template' | 'stamp' | 'signature') => {
    setSavingType(type);
    await saveUserAsset(type, null, currentUser);
    setSavingType(null);
    showToast(`تم حذف ${type === 'template' ? 'الورقة الرسمية' : type === 'stamp' ? 'الختم' : 'التوقيع'} من حسابك بنجاح`);
    onUpdate();
  };

  const templateAsset = getUserAsset('template', currentUser);
  const stampAsset = getUserAsset('stamp', currentUser);
  const signatureAsset = getUserAsset('signature', currentUser);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative" dir="rtl">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-toast-drop pointer-events-none">
          <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black backdrop-blur-2xl flex items-center gap-2.5 border border-slate-700/80">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full flex flex-col gap-6 animate-fade-in-up">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>العودة للرئيسية</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Assets Management Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
              <div>
                <h1 className="text-lg font-black text-slate-900">حفظ الأصول الرسمية</h1>
                <p className="text-xs text-slate-500">أوراقك، أختامك، وتواقيعك المتزامنة سحابياً لتظهر تلقائياً في أي جهاز.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Official Template */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Layers size={16} className="text-blue-600" />
                  <span>الورقة الرسمية</span>
                </span>
                <p className="text-[11px] text-slate-500">خلفية الخطابات والمستندات</p>
              </div>

              <div className="aspect-[3/4] bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-xs">
                {templateAsset ? (
                  <img src={templateAsset} alt="الورقة الرسمية" className="w-full h-full object-contain p-1" />
                ) : (
                  <FileText size={32} className="text-slate-300" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                  <Upload size={14} />
                  <span>{savingType === 'template' ? 'جاري الحفظ...' : 'رفع الورقة'}</span>
                  <input 
                    type="file" 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && handleAssetUpload('template', e.target.files[0])} 
                  />
                </label>
                {templateAsset && (
                  <button
                    onClick={() => handleDeleteAsset('template')}
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Official Stamp */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Stamp size={16} className="text-amber-600" />
                  <span>ختم المؤسسة</span>
                </span>
                <p className="text-[11px] text-slate-500">صورة الختم الرسمي PNG</p>
              </div>

              <div className="aspect-[3/4] bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-xs">
                {stampAsset ? (
                  <img src={stampAsset} alt="ختم المؤسسة" className="w-full h-full object-contain p-1" />
                ) : (
                  <Stamp size={32} className="text-slate-300" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                  <Upload size={14} />
                  <span>{savingType === 'stamp' ? 'جاري الحفظ...' : 'رفع الختم'}</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, application/pdf" 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && handleAssetUpload('stamp', e.target.files[0])} 
                  />
                </label>
                {stampAsset && (
                  <button
                    onClick={() => handleDeleteAsset('stamp')}
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Official Signature */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <PenTool size={16} className="text-indigo-600" />
                  <span>التوقيع الرسمي</span>
                </span>
                <p className="text-[11px] text-slate-500">التوقيع أو الرسم الحي</p>
              </div>

              <div className="aspect-[3/4] bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-xs">
                {signatureAsset ? (
                  <img src={signatureAsset} alt="التوقيع الرسمي" className="w-full h-full object-contain p-1" />
                ) : (
                  <PenTool size={32} className="text-slate-300" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors text-center">
                  <Upload size={13} />
                  <span>رفع</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, application/pdf" 
                    className="hidden" 
                    onChange={(e) => e.target.files?.[0] && handleAssetUpload('signature', e.target.files[0])} 
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setIsDrawingSignature(true)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors"
                >
                  <span>رسم ✍️</span>
                </button>

                {signatureAsset && (
                  <button
                    onClick={() => handleDeleteAsset('signature')}
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Signature Pad Modal */}
      {isDrawingSignature && (
        <SignaturePad
          onSave={handleSignatureSave}
          onClose={() => setIsDrawingSignature(false)}
        />
      )}

    </div>
  );
};
