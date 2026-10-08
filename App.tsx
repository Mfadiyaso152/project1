import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Stamp, 
  Image as ImageIcon, 
  ArrowLeft, 
  PenTool, 
  Layers, 
  BookmarkCheck,
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import CanvasEditor from './components/CanvasEditor';
import SignaturePad from './components/SignaturePad';
import { LandingView } from './components/LandingView';
import { AuthFlow } from './components/AuthFlow';
import { AccountView } from './components/AccountView';
import { DocumentState, Step, User } from './types';
import { getCurrentUser, setCurrentUser, canUserProcessFile, saveUserAsset, getUserAsset } from './authService';

const App: React.FC = () => {
  const [currentUser, setUser] = useState<User | null>(() => getCurrentUser());
  const [step, setStep] = useState<Step>(() => {
    const user = getCurrentUser();
    return user ? Step.UPLOAD : Step.LANDING;
  });
  
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingText, setLoadingText] = useState('جاري معالجة وتوثيق المستند...');
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [docs, setDocs] = useState<DocumentState>({
    original: null, 
    originalPages: [],
    template: null, 
    templatePages: [],
    stamp: null, 
    signature: null,
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshUser = () => {
    setUser(getCurrentUser());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = getCurrentUser();
      if (fresh) {
        setUser(fresh);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // PDF.js Page Extraction
  const loadPdfPages = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) throw new Error("مكتبة معالجة ملفات PDF قيد التحميل، يرجى المحاولة بعد لحظات.");
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const pageImages: string[] = [];
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              pageImages.push(canvas.toDataURL('image/jpeg', 0.9));
            }
          }
          resolve(pageImages);
        } catch (err: any) { reject(err); }
      };
      fileReader.onerror = (err) => reject(err);
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleOriginalUpload = async (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;

    const firstFile = fileList[0];
    const isPdf = firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setLoadingText('جاري قراءة ومعالجة صفحات المستند...');
      setLoadingPdf(true);
      try {
        const pages = await loadPdfPages(firstFile);
        setDocs(prev => ({ ...prev, original: pages[0] || null, originalPages: pages }));
        showToast(`تم رفع ${pages.length} ${pages.length === 1 ? 'صفحة' : 'صفحات'} بنجاح`);
      } catch (err: any) {
        showToast("خطأ في قراءة ملف PDF: " + (err.message || err), 'error');
      } finally {
        setLoadingPdf(false);
      }
    } else {
      const pagePromises = fileList.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || "");
        reader.readAsDataURL(file);
      }));
      const pages = await Promise.all(pagePromises);
      const validPages = pages.filter(p => !!p);
      setDocs(prev => ({ 
        ...prev, 
        original: prev.original || validPages[0] || null, 
        originalPages: [...prev.originalPages, ...validPages] 
      }));
      showToast(`تم رفع ${validPages.length} ${validPages.length === 1 ? 'صفحة' : 'صفحات'} بنجاح`);
    }
  };

  const handleTemplateUpload = async (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;
    const firstFile = fileList[0];
    const isPdf = firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setLoadingText('جاري معالجة الورقة الرسمية...');
      setLoadingPdf(true);
      try {
        const pages = await loadPdfPages(firstFile);
        setDocs(prev => ({ ...prev, template: pages[0] || null, templatePages: pages }));
        showToast('تم تعيين الورقة الرسمية بنجاح');
      } catch (err: any) { 
        showToast("خطأ في قراءة ملف PDF: " + (err.message || err), 'error');
      } finally { 
        setLoadingPdf(false); 
      }
    } else {
      const pagePromises = fileList.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || "");
        reader.readAsDataURL(file);
      }));
      const pages = await Promise.all(pagePromises);
      const validPages = pages.filter(p => !!p);
      setDocs(prev => ({ ...prev, template: validPages[0] || null, templatePages: validPages }));
      showToast('تم تعيين الورقة الرسمية بنجاح');
    }
  };

  const handleFile = async (type: 'stamp' | 'signature', file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setLoadingText('جاري معالجة الملف...');
      setLoadingPdf(true);
      try {
        const pages = await loadPdfPages(file);
        if (pages.length > 0) {
          setDocs(prev => ({ ...prev, [type]: pages[0] }));
          showToast(`تم تعيين ${type === 'stamp' ? 'الختم' : 'التوقيع'} بنجاح`);
        }
      } catch (err: any) { 
        showToast("خطأ في قراءة الملف: " + (err.message || err), 'error');
      } finally { 
        setLoadingPdf(false); 
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { 
        if (e.target?.result) {
          setDocs(prev => ({ ...prev, [type]: e.target!.result as string }));
          showToast(`تم تعيين ${type === 'stamp' ? 'الختم' : 'التوقيع'} بنجاح`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (type: keyof DocumentState) => {
    if (type === 'original') setDocs(prev => ({ ...prev, original: null, originalPages: [] }));
    else if (type === 'template') setDocs(prev => ({ ...prev, template: null, templatePages: [] }));
    else setDocs(prev => ({ ...prev, [type]: null }));
  };

  const handleUseSavedAsset = (type: 'template' | 'stamp' | 'signature') => {
    if (!currentUser) {
      showToast('يرجى تسجيل الدخول أولاً لاستخدام الملفات المحفوظة', 'info');
      return;
    }

    const savedData = getUserAsset(type, currentUser);
    if (savedData) {
      if (type === 'template') {
        setDocs(prev => ({
          ...prev,
          template: savedData,
          templatePages: [savedData]
        }));
        showToast('تم استيراد الورقة الرسمية المحفوظة بنجاح ✅');
      } else if (type === 'stamp') {
        setDocs(prev => ({ ...prev, stamp: savedData }));
        showToast('تم استيراد الختم المحفوظ بنجاح ✅');
      } else if (type === 'signature') {
        setDocs(prev => ({ ...prev, signature: savedData }));
        showToast('تم استيراد التوقيع المحفوظ بنجاح ✅');
      }
    } else {
      showToast(`لا يوجد ${type === 'template' ? 'ورقة رسمية' : type === 'stamp' ? 'ختم' : 'توقيع'} محفوظ حالياً في حسابك`, 'info');
    }
  };

  const handleSaveCurrentAssetToAccount = async (type: 'template' | 'stamp' | 'signature') => {
    if (!currentUser) {
      showToast('يرجى تسجيل الدخول لحفظ أصولك', 'info');
      return;
    }
    const currentAsset = type === 'template' ? docs.template : docs[type];
    if (!currentAsset) {
      showToast(`يرجى رفع ${type === 'template' ? 'الورقة الرسمية' : type === 'stamp' ? 'الختم' : 'التوقيع'} أولاً لحفظه`, 'info');
      return;
    }
    const updated = await saveUserAsset(type, currentAsset, currentUser);
    setUser(updated);
    showToast(`تم حفظ ${type === 'template' ? 'الورقة الرسمية' : type === 'stamp' ? 'الختم' : 'التوقيع'} في السيرفر بنجاح ✅`);
  };

  const handleProceedToEditor = () => {
    const check = canUserProcessFile(currentUser);
    if (!check.allowed) {
      showToast(check.reason || 'يرجى تسجيل الدخول أولاً', 'error');
      return;
    }
    setStep(Step.EDITOR);
  };

  const handleStartOver = () => {
    setStep(Step.UPLOAD);
    showToast('تم الرجوع إلى الصفحة الرئيسية مع الاحتفاظ بملفاتك ✅');
  };

  // Landing Flow
  if (step === Step.LANDING) {
    return <LandingView onStart={() => setStep(Step.AUTH)} />;
  }

  // Auth Flow
  if (step === Step.AUTH) {
    return (
      <AuthFlow 
        onSuccess={(u) => { 
          setUser(u); 
          setStep(Step.UPLOAD); 
        }}
        onCancel={() => setStep(currentUser ? Step.UPLOAD : Step.LANDING)}
      />
    );
  }

  // Dedicated Account Page (Name, Email & Cloud Assets ONLY)
  if (step === Step.ACCOUNT && currentUser) {
    return (
      <AccountView
        currentUser={currentUser}
        onBack={() => setStep(Step.UPLOAD)}
        onLogout={() => {
          setCurrentUser(null);
          setUser(null);
          setStep(Step.LANDING);
        }}
        onUpdate={() => refreshUser()}
      />
    );
  }

  const canProceed = docs.originalPages.length > 0 || !!docs.original;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative" dir="rtl">
      
      {/* Background ambient luxury lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px]" />
      </div>

      {/* LUXURY BORDERLESS LOADING OVERLAY (NO SQUARE BOX) */}
      {loadingPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="relative flex flex-col items-center justify-center gap-6 select-none">
            
            {/* Multi-Ring Rotating Luxury Seal */}
            <div className="relative flex items-center justify-center w-32 h-32">
              <div className="absolute inset-0 border-2 border-dashed border-blue-400/50 rounded-full animate-spin-slow" />
              <div className="absolute inset-2 border border-amber-300/60 rounded-full animate-spin-reverse-slow" />
              <div className="w-16 h-16 rounded-full bg-white/90 border border-blue-400/50 flex items-center justify-center shadow-xl animate-pulse-glow">
                <FileText size={28} className="text-blue-600" />
              </div>
            </div>

            {/* Shimmering Text */}
            <div className="flex flex-col items-center text-center gap-1.5">
              <span className="text-3xl font-black tracking-widest text-white">
                وثـيـق
              </span>
              <p className="text-xs font-bold text-slate-200">
                {loadingText}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-300" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs font-black flex items-center gap-2.5 ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-900/10'
              : notification.type === 'info'
              ? 'bg-amber-50 text-amber-900 border-amber-200 shadow-amber-900/10'
              : 'bg-blue-50 text-blue-900 border-blue-200 shadow-blue-900/10'
          }`}>
            <CheckCircle2 size={16} className={notification.type === 'error' ? 'text-rose-600' : notification.type === 'info' ? 'text-amber-600' : 'text-blue-600'} />
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Profile Picture / Account Button (Clicking navigates to dedicated Account page) */}
      <div className="absolute top-5 left-6 z-40">
        <button
          onClick={() => setStep(Step.ACCOUNT)}
          className="flex items-center gap-2.5 bg-white/90 hover:bg-white border border-slate-200/90 hover:border-blue-500/40 px-3.5 py-1.5 rounded-full shadow-xs hover:shadow-sm backdrop-blur-md transition-all cursor-pointer group"
          title="عرض الحساب والأصول المحفوظة"
        >
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-blue-500/40" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserIcon size={14} />
            </div>
          )}
          <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
            {currentUser?.name || 'حسابي'}
          </span>
        </button>
      </div>

      {/* MAIN WORKSPACE */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-20 flex-1 w-full animate-fade-in-up">
        
        {step === Step.UPLOAD && (
          <div className="flex flex-col">
            
            {/* HERO BRAND TITLE: WORD "وثيق" STANDS CLEAN & PROMINENT */}
            <div className="flex flex-col items-center text-center mb-10">
              <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-slate-900 drop-shadow-xs">
                وثـيـق
              </h1>
            </div>

            {/* TWO MAIN CARDS FOR UPLOAD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* 1. Core Documents Card */}
              <div className="bg-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2.5">
                    <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                    <span>المستندات الأساسية</span>
                  </h3>
                </div>
                
                <div className="flex flex-col gap-6">
                  {/* Original Document */}
                  <FileUpload
                    label="المستند الأصلي (المعاملة)"
                    subLabel="PDF أو صور متعددة (مطلوب)"
                    accept="image/*,application/pdf"
                    multiple={true}
                    value={docs.originalPages.length > 0 ? docs.originalPages : docs.original}
                    onChange={handleOriginalUpload}
                    onClear={() => clearFile('original')}
                    icon={<FileText size={32} />}
                  />

                  {/* Template (Official Letterhead) */}
                  <div className="flex flex-col gap-2">
                    <FileUpload
                      label="ورقة المؤسسة الرسمية"
                      subLabel="خلفية رسمية للخطابات (اختياري)"
                      accept="image/*,application/pdf"
                      multiple={true}
                      value={docs.templatePages.length > 0 ? docs.templatePages : docs.template}
                      onChange={handleTemplateUpload}
                      onClear={() => clearFile('template')}
                      icon={<ImageIcon size={32} />}
                    />
                    
                    {/* Saved Asset Buttons */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <button 
                        type="button"
                        onClick={() => handleUseSavedAsset('template')} 
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers size={14} />
                        <span>استخدام الورقة الرسمية المحفوظة</span>
                      </button>

                      {docs.template && (
                        <button
                          type="button"
                          onClick={() => handleSaveCurrentAssetToAccount('template')}
                          className="text-[11px] text-slate-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          <BookmarkCheck size={12} />
                          <span>حفظ كافتراضي</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Stamps and Signatures Card */}
              <div className="bg-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2.5">
                    <div className="w-2.5 h-6 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full" />
                    <span>الأختام والتواقيع (اختياري)</span>
                  </h3>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Official Stamp */}
                  <div className="flex flex-col gap-2">
                    <FileUpload
                      label="ختم المؤسسة"
                      subLabel="صورة مفرغة PNG أو JPEG"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.stamp}
                      onChange={(f) => handleFile('stamp', f as File)}
                      onClear={() => clearFile('stamp')}
                      icon={<Stamp size={32} />}
                    />
                    
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <button 
                        type="button"
                        onClick={() => handleUseSavedAsset('stamp')} 
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Stamp size={14} />
                        <span>استخدام الختم المحفوظ</span>
                      </button>

                      {docs.stamp && (
                        <button
                          type="button"
                          onClick={() => handleSaveCurrentAssetToAccount('stamp')}
                          className="text-[11px] text-slate-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          <BookmarkCheck size={12} />
                          <span>حفظ كافتراضي</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="flex flex-col gap-2">
                    <FileUpload
                      label="التوقيع الرسمي"
                      subLabel="صورة توقيع أو رسم حي"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.signature}
                      onChange={(f) => handleFile('signature', f as File)}
                      onClear={() => clearFile('signature')}
                      icon={<PenTool size={32} />}
                    />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => handleUseSavedAsset('signature')} 
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <PenTool size={14} />
                          <span>استخدام التوقيع المحفوظ</span>
                        </button>

                        {docs.signature && (
                          <button
                            type="button"
                            onClick={() => handleSaveCurrentAssetToAccount('signature')}
                            className="text-[11px] text-slate-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                          >
                            <BookmarkCheck size={12} />
                            <span>حفظ</span>
                          </button>
                        )}
                      </div>

                      <button 
                        type="button"
                        onClick={() => setIsDrawingSignature(true)} 
                        className="text-xs px-3.5 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>ارسم توقيعك ✍️</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN ACTION: PROCEED TO NOTARIZE & MERGE */}
            <div className="flex justify-center mt-2">
              <button
                disabled={!canProceed}
                onClick={handleProceedToEditor}
                className={`flex items-center justify-center gap-3 px-12 py-4 rounded-2xl font-black text-base transition-all shadow-lg ${
                  canProceed 
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-blue-600/20' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <span>المتابعة للدمج والتوثيق</span>
                <ArrowLeft size={18} />
              </button>
            </div>
          </div>
        )}

        {/* EDITOR STEP */}
        {step === Step.EDITOR && (
          <CanvasEditor 
            documents={docs} 
            onReset={handleStartOver}
          />
        )}

      </main>

      {/* Signature Pad Modal */}
      {isDrawingSignature && (
        <SignaturePad
          onSave={async (dataUrl) => { 
            setDocs(prev => ({ ...prev, signature: dataUrl })); 
            setIsDrawingSignature(false);
            showToast('تم اعتماد التوقيع الحي بنجاح ✅');
          }}
          onClose={() => setIsDrawingSignature(false)}
        />
      )}

      {/* Account Suspended Notice */}
      {currentUser?.status === 'suspended' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
              <AlertCircle size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-900">تم إيقاف حسابك مؤقتاً</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              تم إيقاف حسابك من قِبل الإدارة. يرجى التواصل لإعادة التفعيل.
            </p>
            <button
              onClick={() => {
                setCurrentUser(null);
                setUser(null);
                setStep(Step.LANDING);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer mt-2"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
