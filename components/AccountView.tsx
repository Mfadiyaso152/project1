import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Layers, 
  Stamp, 
  PenTool, 
  FileText, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  LogOut, 
  Cloud, 
  Download,
  Eye,
  X,
  FileCheck,
  Calendar,
  FolderOpen,
  Sparkles,
  Loader2
} from 'lucide-react';
import { User, UserSavedDocument } from '../types';
import { 
  saveUserAsset, 
  getUserAsset, 
  fetchUserFromFirestoreByEmail,
  subscribeToUserAssets,
  fetchUserDocumentsFromFirestore,
  getFullDocumentPdfFromFirestore,
  deleteDocumentFromFirestore,
  subscribeToUserDocuments
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
  const [activeTab, setActiveTab] = useState<'documents' | 'assets'>('documents');
  const [savedDocs, setSavedDocs] = useState<UserSavedDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<UserSavedDocument | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync latest cloud assets and documents on mount and listen to changes
  useEffect(() => {
    if (!currentUser?.email) return;

    // 1. Initial documents load
    fetchUserDocumentsFromFirestore(currentUser.email).then(docs => {
      setSavedDocs(docs);
      setIsLoadingDocs(false);
    });

    // 2. Real-time Firestore listener for documents (sync across all devices)
    const unsubscribeDocs = subscribeToUserDocuments(currentUser.email, (docs) => {
      setSavedDocs(docs);
      setIsLoadingDocs(false);
    });

    // 3. Real-time Firestore listener for assets
    const unsubscribeAssets = subscribeToUserAssets(currentUser.email, () => {
      onUpdate();
    });

    const syncAssets = async () => {
      const freshUser = await fetchUserFromFirestoreByEmail(currentUser.email);
      if (freshUser) {
        onUpdate();
      }
    };
    syncAssets();

    return () => {
      unsubscribeDocs();
      unsubscribeAssets();
    };
  }, [currentUser?.email]);

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

  const handleDownloadSavedDoc = async (docItem: UserSavedDocument) => {
    setDownloadingDocId(docItem.id);
    try {
      let pdfData = docItem.pdfData;
      if (!pdfData) {
        pdfData = await getFullDocumentPdfFromFirestore(currentUser.email, docItem.id);
      }
      if (pdfData) {
        const a = document.createElement('a');
        a.href = pdfData;
        a.download = `${docItem.title || 'certified-document'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('تم تحميل المستند بنجاح ✅');
      } else {
        showToast('جاري تجهيز الملف للتحميل...');
        // Fallback open thumbnail as image
        if (docItem.thumbnail) {
          const a = document.createElement('a');
          a.href = docItem.thumbnail;
          a.download = `${docItem.title || 'document'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } catch (e: any) {
      showToast('خطأ أثناء تحميل الملف: ' + (e?.message || e));
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleDeleteSavedDoc = async (docId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستند؟')) return;
    setDeletingDocId(docId);
    try {
      const ok = await deleteDocumentFromFirestore(currentUser.email, docId);
      if (ok) {
        setSavedDocs(prev => prev.filter(d => d.id !== docId));
        if (previewDoc?.id === docId) setPreviewDoc(null);
        showToast('تم حذف المستند بنجاح');
      }
    } catch (e: any) {
      showToast('خطأ أثناء الحذف: ' + (e?.message || e));
    } finally {
      setDeletingDocId(null);
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full flex flex-col gap-6 animate-fade-in-up">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>العودة للرئيسية</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
          >
            <LogOut size={14} />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
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
            <div className="absolute -bottom-1 -left-1 bg-blue-600 text-white p-1 rounded-full shadow-xs animate-pulse">
              <Cloud size={12} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-slate-900">
                {currentUser.name || 'مستخدم وثيق'}
              </h1>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 text-xs font-mono">
              <Mail size={14} className="text-blue-600 shrink-0" />
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>

        {/* Modern Interactive Navigation Tabs */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1 text-xs font-black shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white text-blue-700 shadow-sm font-black scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FolderOpen size={16} />
            <span>المستندات المحفوظة</span>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
              {savedDocs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-white text-blue-700 shadow-sm font-black scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Layers size={16} />
            <span>الأصول الرسمية (الورقة، الختم، التوقيع)</span>
          </button>
        </div>

        {/* TAB 1: SAVED DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                <div>
                  <h2 className="text-lg font-black text-slate-900">المستندات الموثقة المحفوظة</h2>
                </div>
              </div>
            </div>

            {isLoadingDocs ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <span className="text-xs font-bold">جاري تحميل المستندات...</span>
              </div>
            ) : savedDocs.length === 0 ? (
              <div className="py-14 px-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <FileText size={32} />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                  <h3 className="text-sm font-black text-slate-800">لا توجد مستندات محفوظة بعد</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    عندما تقوم بدمج وتوثيق أي معاملة بالضغط على «توثيق المستند»، ستُحفظ نسختك الموثقة في حسابك فوراً، لتظهر لك هنا على أي جهاز أو هاتف تسجل الدخول منه.
                  </p>
                </div>
                <button
                  onClick={onBack}
                  className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black py-2.5 px-5 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
                >
                  بدء توثيق مستند جديد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {savedDocs.map((docItem) => (
                  <div 
                    key={docItem.id}
                    className="bg-slate-50/70 border border-slate-200/90 hover:border-blue-400 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-1 group relative"
                  >
                    {/* Top status */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-extrabold truncate max-w-[170px]" title={docItem.title}>
                        <FileCheck size={14} className="text-blue-600 shrink-0" />
                        <span className="truncate">{docItem.title}</span>
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold shrink-0">
                        {docItem.pageCount} {docItem.pageCount === 1 ? 'صفحة' : 'صفحات'}
                      </span>
                    </div>

                    {/* Thumbnail Preview with hover preview trigger */}
                    <div 
                      onClick={() => setPreviewDoc(docItem)}
                      className="aspect-[3/4] bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden relative cursor-pointer group/thumb"
                    >
                      {docItem.thumbnail ? (
                        <img 
                          src={docItem.thumbnail} 
                          alt={docItem.title} 
                          className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover/thumb:scale-105" 
                        />
                      ) : (
                        <FileText size={40} className="text-slate-300" />
                      )}

                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white/95 text-slate-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                          <Eye size={14} className="text-blue-600" />
                          <span>معاينة المستند</span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          <span>{new Date(docItem.createdAt).toLocaleDateString('ar-SA')}</span>
                        </span>
                        {docItem.fileSizeText && <span>{docItem.fileSizeText}</span>}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleDownloadSavedDoc(docItem)}
                          disabled={downloadingDocId === docItem.id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
                        >
                          {downloadingDocId === docItem.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Download size={13} />
                          )}
                          <span>تحميل PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSavedDoc(docItem.id)}
                          disabled={deletingDocId === docItem.id}
                          className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                          title="حذف المستند من السحابة"
                        >
                          {deletingDocId === docItem.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFICIAL ASSETS (الورقة، الختم، التوقيع) */}
        {activeTab === 'assets' && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                <div>
                  <h2 className="text-lg font-black text-slate-900">الأصول الرسمية المحفوظة</h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* 1. Official Letterhead */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-sm">
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
                          className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
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
                <label className="w-full bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-400 py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer shadow-xs">
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
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-sm">
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
                          className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
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
                <label className="w-full bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-400 py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer shadow-xs">
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
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-sm">
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
                          className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer shadow-xs"
                  >
                    <PenTool size={13} />
                    <span>رسم توقيع حي ✍️</span>
                  </button>

                  <label className="w-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer">
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
        )}

      </div>

      {/* Document Quick Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-scale-in max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-900">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-slate-100 p-2 flex items-center justify-center min-h-[350px]">
              {previewDoc.thumbnail ? (
                <img 
                  src={previewDoc.thumbnail} 
                  alt={previewDoc.title} 
                  className="max-h-[60vh] object-contain rounded-xl shadow-md bg-white" 
                />
              ) : (
                <div className="text-slate-400 text-xs font-bold">لا تتوفر معاينة</div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500 font-bold">
                تاريخ التوثيق: {new Date(previewDoc.createdAt).toLocaleDateString('ar-SA')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSavedDoc(previewDoc)}
                  disabled={downloadingDocId === previewDoc.id}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Download size={14} />
                  <span>تحميل PDF</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
