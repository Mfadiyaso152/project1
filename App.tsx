import React, { useState, useEffect } from 'react';
import { FileText, Stamp, Image as ImageIcon, Loader2, ArrowLeft, PenTool, Sparkles, MoreVertical, ListOrdered, DollarSign, Key, Users } from 'lucide-react';
import FileUpload from './components/FileUpload';
import CanvasEditor from './components/CanvasEditor';
import SignaturePad from './components/SignaturePad';
import { LandingView } from './components/LandingView';
import { AuthFlow } from './components/AuthFlow';
import { AccountView } from './components/AccountView';
import { AdminRequestsView, AdminRevenueView, AdminCodesView, AdminUsersView } from './components/AdminViews';
import { BottomNav } from './components/BottomNav';
import { DocumentState, Step, User } from './types';
import { getCurrentUser, setCurrentUser, canUserProcessFile, updateUserInDb, createSubscriptionRequest } from './authService';

const App: React.FC = () => {
  const [currentUser, setUser] = useState<User | null>(() => getCurrentUser());
  const [step, setStep] = useState<Step>(currentUser ? Step.UPLOAD : Step.LANDING);
  
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const [docs, setDocs] = useState<DocumentState>({
    original: null, originalPages: [],
    template: null, templatePages: [],
    stamp: null, signature: null,
  });

  const refreshUser = () => {
    setUser(getCurrentUser());
  };

  // PDF Loading Logic
  const loadPdfPages = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) throw new Error("مكتبة معالجة ملفات PDF لم تكتمل بعد، يرجى الانتظار ثانية والمحاولة.");
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
              pageImages.push(canvas.toDataURL('image/jpeg', 0.85));
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
      setLoadingPdf(true);
      try {
        const pages = await loadPdfPages(firstFile);
        setDocs(prev => ({ ...prev, original: pages[0] || null, originalPages: pages }));
      } catch (err: any) {
        alert("خطأ PDF: " + (err.message || err));
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
      setDocs(prev => ({ ...prev, original: pages[0] || null, originalPages: [...prev.originalPages, ...pages.filter(p => !!p)] }));
    }
  };

  const handleTemplateUpload = async (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;
    const firstFile = fileList[0];
    const isPdf = firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setLoadingPdf(true);
      try {
        const pages = await loadPdfPages(firstFile);
        setDocs(prev => ({ ...prev, template: pages[0] || null, templatePages: pages }));
      } catch (err: any) { alert("خطأ PDF: " + (err.message || err)); } 
      finally { setLoadingPdf(false); }
    } else {
      const pagePromises = fileList.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || "");
        reader.readAsDataURL(file);
      }));
      const pages = await Promise.all(pagePromises);
      setDocs(prev => ({ ...prev, template: pages[0] || null, templatePages: pages.filter(p => !!p) }));
    }
  };

  const handleFile = async (type: keyof DocumentState, file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setLoadingPdf(true);
      try {
        const pages = await loadPdfPages(file);
        if (pages.length > 0) setDocs(prev => ({ ...prev, [type]: pages[0] }));
      } catch (err: any) { alert("خطأ PDF: " + (err.message || err)); } 
      finally { setLoadingPdf(false); }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { if (e.target?.result) setDocs(prev => ({ ...prev, [type]: e.target!.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (type: keyof DocumentState) => {
    if (type === 'original') setDocs(prev => ({ ...prev, original: null, originalPages: [] }));
    else if (type === 'template') setDocs(prev => ({ ...prev, template: null, templatePages: [] }));
    else setDocs(prev => ({ ...prev, [type]: null }));
  };

  const handleProceedToEditor = () => {
    const check = canUserProcessFile(currentUser);
    if (!check.allowed) {
      setLimitWarning(check.reason || 'لا يمكنك المتابعة');
      setTimeout(() => setLimitWarning(null), 4000);
      return;
    }
    setStep(Step.EDITOR);
  };

  const loadSavedAsset = (type: 'stamp' | 'signature' | 'template') => {
    if (currentUser?.plan !== 'pro' && currentUser?.role !== 'admin') {
      alert('ميزة السحابة متاحة فقط في باقة Pro. رقي باقتك بـ 10 ريال فقط!');
      return;
    }
    if (currentUser.savedAssets[type]) {
      if (type === 'template') {
        setDocs(prev => ({ ...prev, template: currentUser.savedAssets[type], templatePages: [currentUser.savedAssets[type] as string] }));
      } else {
        setDocs(prev => ({ ...prev, [type]: currentUser.savedAssets[type] }));
      }
    } else {
      alert('لا يوجد ملف محفوظ.');
    }
  };

  if (step === Step.LANDING) {
    return <LandingView onStart={() => setStep(Step.AUTH)} />;
  }

  if (step === Step.AUTH) {
    return (
      <AuthFlow 
        onSuccess={(u) => { setUser(u); setStep(Step.UPLOAD); }}
        onCancel={() => setStep(Step.LANDING)}
      />
    );
  }

  const canProceed = docs.originalPages.length > 0;
  
  // Apply themes
  let bgClass = 'bg-slate-50 text-slate-900';
  let cardClass = 'bg-white border-slate-200';
  let isLight = true;

  if (currentUser?.theme === 'space-dark') {
    bgClass = 'bg-slate-950 text-slate-200';
    cardClass = 'bg-slate-900 border-slate-800';
    isLight = false;
  } else if (currentUser?.theme === 'snap-yellow') {
    bgClass = 'bg-[#FFFC00] text-slate-900';
    cardClass = 'bg-white border-[#e6e300]';
    isLight = true;
  }

  const isPending = currentUser?.subscriptionStatus !== 'active' && currentUser?.role !== 'admin';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${bgClass}`} dir="rtl">
      
      {loadingPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full border border-slate-800">
            <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
            <h4 className="text-white font-bold text-lg mt-2">جاري المعالجة...</h4>
          </div>
        </div>
      )}

      {limitWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-fade-in-up">
          {limitWarning}
        </div>
      )}

      {/* Floating Logo Top Right */}
      {step !== Step.EDITOR && (
        <div className="fixed top-6 right-6 z-40 pointer-events-auto flex items-center gap-3">
          <FileText size={32} className={`${currentUser?.theme === 'snap-yellow' ? 'text-slate-900' : 'text-teal-500'} drop-shadow-md stroke-[2.5]`} />
          {currentUser?.role === 'admin' && (
            <div className="relative">
              <button 
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className={`p-2 rounded-xl transition-colors ${isLight ? 'bg-white shadow-sm hover:bg-slate-100' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                <MoreVertical size={20} />
              </button>
              {adminMenuOpen && (
                <div className={`absolute top-full right-0 mt-2 w-48 rounded-2xl shadow-xl border overflow-hidden animate-scale-in ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                  <button onClick={() => { setStep(Step.ADMIN_REQUESTS); setAdminMenuOpen(false); }} className={`flex items-center gap-2 w-full p-3 font-bold text-sm ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700'}`}>
                    <ListOrdered size={16} className="text-teal-500" /> الطلبات
                  </button>
                  <button onClick={() => { setStep(Step.ADMIN_REVENUE); setAdminMenuOpen(false); }} className={`flex items-center gap-2 w-full p-3 font-bold text-sm ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700'}`}>
                    <DollarSign size={16} className="text-teal-500" /> الأرباح
                  </button>
                  <button onClick={() => { setStep(Step.ADMIN_CODES); setAdminMenuOpen(false); }} className={`flex items-center gap-2 w-full p-3 font-bold text-sm ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700'}`}>
                    <Key size={16} className="text-teal-500" /> الأكواد
                  </button>
                  <button onClick={() => { setStep(Step.ADMIN_USERS); setAdminMenuOpen(false); }} className={`flex items-center gap-2 w-full p-3 font-bold text-sm ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700'}`}>
                    <Users size={16} className="text-teal-500" /> العملاء
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 pt-20 pb-32 flex-1 w-full animate-fade-in-up">
        
        {step === Step.UPLOAD && (
          <div className="flex flex-col">
            <div className="text-center mb-10">
              <h2 className={`text-3xl font-black tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                مرحباً {currentUser?.name}
              </h2>
              <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                قم برفع المستندات المطلوبة للبدء في الدمج والتوثيق
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative">
              {isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-white/30 dark:bg-slate-950/30 rounded-3xl">
                   <div className="bg-white dark:bg-slate-800 shadow-2xl px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 animate-scale-in">
                     <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                     <span className="font-bold text-slate-800 dark:text-slate-200">بانتظار كود التفعيل</span>
                   </div>
                </div>
              )}
              
              <div className={`${cardClass} p-6 rounded-3xl border shadow-xl flex flex-col gap-6`}>
                <h3 className={`font-extrabold text-lg flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  <div className="w-2 h-6 bg-teal-500 rounded-full" />
                  المستندات الأساسية
                </h3>
                
                <div className="flex flex-col gap-5">
                  <FileUpload
                    label="المستند الأصلي (الأوراق)"
                    subLabel="PDF أو صور"
                    accept="image/*,application/pdf"
                    multiple={true}
                    value={docs.originalPages.length > 0 ? docs.originalPages : null}
                    onChange={handleOriginalUpload}
                    onClear={() => clearFile('original')}
                    icon={<FileText size={38} className="text-teal-500" />}
                  />
                  <div>
                    <FileUpload
                      label="ورقة المؤسسة الرسمية (الترويسة)"
                      subLabel="اختياري"
                      accept="image/*,application/pdf"
                      multiple={true}
                      value={docs.templatePages.length > 0 ? docs.templatePages : null}
                      onChange={handleTemplateUpload}
                      onClear={() => clearFile('template')}
                      icon={<ImageIcon size={38} className="text-teal-500" />}
                    />
                    <button onClick={() => loadSavedAsset('template')} className="mt-2 text-xs text-teal-500 font-bold hover:underline">
                      {currentUser?.plan === 'pro' || currentUser?.role === 'admin' ? 'استخدام الترويسة المحفوظة في حسابي' : 'استخدم الترويسة من السحابة 👑'}
                    </button>
                  </div>
                </div>
              </div>

              <div className={`${cardClass} p-6 rounded-3xl border shadow-xl flex flex-col gap-6`}>
                <h3 className={`font-extrabold text-lg flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  <div className="w-2 h-6 bg-teal-500 rounded-full" />
                  الأختام والتواقيع (اختياري)
                </h3>

                <div className="flex flex-col gap-5">
                  <div>
                    <FileUpload
                      label="ختم المؤسسة"
                      subLabel="صورة شفافة PNG"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.stamp}
                      onChange={(f) => handleFile('stamp', f as File)}
                      onClear={() => clearFile('stamp')}
                      icon={<Stamp size={38} className="text-teal-500" />}
                    />
                    <button onClick={() => loadSavedAsset('stamp')} className="mt-2 text-xs text-teal-500 font-bold hover:underline">
                      {currentUser?.plan === 'pro' || currentUser?.role === 'admin' ? 'استخدام الختم المحفوظ في حسابي' : 'استخدم الختم من السحابة 👑'}
                    </button>
                  </div>

                  <div>
                    <FileUpload
                      label="التوقيع"
                      subLabel="صورة أو رسم حي"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.signature}
                      onChange={(f) => handleFile('signature', f as File)}
                      onClear={() => clearFile('signature')}
                      icon={<PenTool size={38} className="text-teal-500" />}
                    />
                    <div className="flex justify-between items-center mt-2">
                       <button onClick={() => loadSavedAsset('signature')} className="text-xs text-teal-500 font-bold hover:underline">
                        {currentUser?.plan === 'pro' || currentUser?.role === 'admin' ? 'استخدام التوقيع المحفوظ' : 'التوقيع من السحابة 👑'}
                      </button>
                      <button onClick={() => setIsDrawingSignature(true)} className={`text-xs px-4 py-2 rounded-xl font-bold transition-colors ${isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>ارسم توقيعك ✍️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                disabled={!canProceed || isPending}
                onClick={handleProceedToEditor}
                className={`flex items-center justify-center gap-3 px-12 py-4 rounded-3xl font-black text-lg transition-all shadow-xl ${
                  canProceed && !isPending ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white hover:scale-[1.02] cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                المتابعة للدمج
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        )}

        {step === Step.EDITOR && (
          <CanvasEditor 
            documents={docs} 
            onReset={() => {
              setDocs({ original: null, originalPages: [], template: null, templatePages: [], stamp: null, signature: null });
              setStep(Step.UPLOAD);
            }}
          />
        )}

        {step === Step.ACCOUNT && currentUser && (
          <AccountView currentUser={currentUser} onLogout={() => { setUser(null); setStep(Step.LANDING); }} onUpdate={() => setDocs({ ...docs })} />
        )}

        {step === Step.ADMIN_REQUESTS && currentUser && <AdminRequestsView currentUser={currentUser} />}
        {step === Step.ADMIN_REVENUE && currentUser && <AdminRevenueView currentUser={currentUser} />}
        {step === Step.ADMIN_CODES && currentUser && <AdminCodesView currentUser={currentUser} />}
        {step === Step.ADMIN_USERS && currentUser && <AdminUsersView currentUser={currentUser} />}

      </main>

      {isDrawingSignature && (
        <SignaturePad
          onSave={(dataUrl) => { setDocs(prev => ({ ...prev, signature: dataUrl })); setIsDrawingSignature(false); }}
          onClose={() => setIsDrawingSignature(false)}
        />
      )}

      {step !== Step.EDITOR && (
        <BottomNav
          currentUser={currentUser}
          currentStep={step}
          onOpenHome={() => { setStep(Step.UPLOAD); refreshUser(); }}
          onOpenAccount={() => setStep(Step.ACCOUNT)}
        />
      )}
    </div>
  );
};

export default App;
