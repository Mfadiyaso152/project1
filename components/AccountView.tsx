import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  ShieldCheck, 
  Layers, 
  Stamp, 
  PenTool, 
  FileText, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  LogOut,
  Sparkles,
  Cloud,
  Check
} from 'lucide-react';
import { User } from '../types';
import { saveUserAsset, getUserAsset, setCurrentUser } from '../authService';
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
        if (!pdfjsLib) throw new Error("مكتبة معالجة ملفات PDF قيد التحميل، يرجى المحاولة بعد لحظات.");
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
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [savingType, setSavingType] = useState<string | null>(null);
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
        showToast(`تم حفظ ${type === 'template' ? 'الورقة الرسمية' : type === 'stamp' ? 'الختم' : 'التوقيع'} في السيرفر وربطه بحسابك بنجاح ✅`);
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
    showToast('تم حفظ التوقيع في السيرفر وربطه بحسابك بنجاح ✅');
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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-blue-900 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 border border-blue-700">
            <CheckCircle2 size={16} className="text-blue-300" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full flex flex-col gap-6 animate-fade-in-up">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xs hover:shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>العودة للرئيسية</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Profile Header (Name & Email ONLY) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
          <div className="relative shrink-0">
            {currentUser.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-20 h-20 rounded-3xl object-cover border-2 border-blue-600 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-md">
                <UserIcon size={36} />
              </div>
            )}
            <div className="absolute -bottom-1 -left-1 bg-blue-600 text-white p-1 rounded-full shadow-xs">
              <Cloud size={12} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <h1 className="text-2xl font-black text-slate-900">
              {currentUser.name || 'مستخدم وثيق'}
            </h1>
            
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 text-xs font-mono">
              <Mail size={14} className="text-blue-600 shrink-0" />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* SAVED ASSETS (الأصول المحفوظة في السيرفر) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
              <div>
                <h2 className="text-lg font-black text-slate-900">الأصول المحفوظة في السيرفر</h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* 1. Official Letterhead */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers size={16} className="text-blue-600" />
                  <span>الورقة الرسمية</span>
                </span>
                {templateAsset && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                    محفوظة ✅
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="aspect-[3/4] bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden relative group">
                {templateAsset ? (
                  <>
                    <img src={templateAsset} alt="Template" className="w-full h-full object-contain p-1" />
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteAsset('template')}
                        disabled={savingType === 'template'}
                        className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg"
                      >
                        <Trash2 size={14} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400 flex flex-col items-center gap-1.5">
                    <FileText size={28} className="text-slate-300" />
                    <span className="text-[11px] font-bold text-slate-500">لا توجد ورقة محفوظة</span>
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <label className="w-full bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-400 py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-xs">
                <div className="flex items-center gap-1.5">
                  <Upload size={14} />
                  <span>{templateAsset ? 'تغيير الورقة' : 'رفع ورقة رسمية'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">صورة أو ملف PDF</span>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleAssetUpload('template', e.target.files[0]);
                      e.target.value = '';
                    }
                  }} 
                />
              </label>
            </div>

            {/* 2. Official Stamp */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Stamp size={16} className="text-blue-600" />
                  <span>ختم المؤسسة</span>
                </span>
                {stampAsset && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                    محفوظ ✅
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="aspect-[3/4] bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden relative group">
                {stampAsset ? (
                  <>
                    <img src={stampAsset} alt="Stamp" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteAsset('stamp')}
                        disabled={savingType === 'stamp'}
                        className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg"
                      >
                        <Trash2 size={14} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400 flex flex-col items-center gap-1.5">
                    <Stamp size={28} className="text-slate-300" />
                    <span className="text-[11px] font-bold text-slate-500">لا يوجد ختم محفوظ</span>
                  </div>
                )}
              </div>

              {/* Upload Action */}
              <label className="w-full bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-400 py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-xs">
                <div className="flex items-center gap-1.5">
                  <Upload size={14} />
                  <span>{stampAsset ? 'تغيير الختم' : 'رفع ختم رسمي'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">صورة مفرغة أو PDF</span>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, application/pdf" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleAssetUpload('stamp', e.target.files[0]);
                      e.target.value = '';
                    }
                  }} 
                />
              </label>
            </div>

            {/* 3. Authorized Signature */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PenTool size={16} className="text-blue-600" />
                  <span>التوقيع المعتمد</span>
                </span>
                {signatureAsset && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                    محفوظ ✅
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="aspect-[3/4] bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden relative group">
                {signatureAsset ? (
                  <>
                    <img src={signatureAsset} alt="Signature" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteAsset('signature')}
                        disabled={savingType === 'signature'}
                        className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg"
                      >
                        <Trash2 size={14} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400 flex flex-col items-center gap-1.5">
                    <PenTool size={28} className="text-slate-300" />
                    <span className="text-[11px] font-bold text-slate-500">لا يوجد توقيع محفوظ</span>
                  </div>
                )}
              </div>

              {/* Signature Actions (Draw or Upload) */}
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsDrawingSignature(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <PenTool size={13} />
                  <span>رسم توقيع حي ✍️</span>
                </button>

                <label className="w-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer">
                  <Upload size={12} />
                  <span>رفع صورة توقيع</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAssetUpload('signature', e.target.files[0]);
                      }
                    }} 
                  />
                </label>
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

export default AccountView;
