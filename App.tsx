import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Stamp, 
  Image as ImageIcon, 
  Loader2, 
  ArrowLeft, 
  PenTool, 
  Sparkles, 
  Users, 
  Layers,
  CheckCircle2,
  Shield
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import CanvasEditor from './components/CanvasEditor';
import SignaturePad from './components/SignaturePad';
import { LandingView } from './components/LandingView';
import { AuthFlow } from './components/AuthFlow';
import { AccountView } from './components/AccountView';
import { AdminUsersView } from './components/AdminViews';
import { BottomNav } from './components/BottomNav';
import { DocumentState, Step, User } from './types';
import { getCurrentUser, setCurrentUser, canUserProcessFile, updateUserInDb, ADMIN_EMAIL } from './authService';

const App: React.FC = () => {
  const [currentUser, setUser] = useState<User | null>(() => getCurrentUser());
  const [step, setStep] = useState<Step>(currentUser ? Step.UPLOAD : Step.LANDING);
  
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocumentState>({
    original: null, originalPages: [],
    template: null, templatePages: [],
    stamp: null, signature: null,
  });

  const refreshUser = () => {
    setUser(getCurrentUser());
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
      setLimitWarning(check.reason || 'يرجى تسجيل الدخول أولاً');
      setTimeout(() => setLimitWarning(null), 4000);
      return;
    }
    setStep(Step.EDITOR);
  };

  const loadSavedAsset = (type: 'stamp' | 'signature' | 'template') => {
    if (!currentUser) {
      alert('يرجى تسجيل الدخول أولاً.');
      return;
    }
    if (currentUser.savedAssets && currentUser.savedAssets[type]) {
      if (type === 'template') {
        setDocs(prev => ({ 
          ...prev, 
          template: currentUser.savedAssets[type], 
          templatePages: [currentUser.savedAssets[type] as string] 
        }));
      } else {
        setDocs(prev => ({ ...prev, [type]: currentUser.savedAssets[type] }));
      }
    } else {
      alert('لا يوجد ملف محفوظ في حسابك. يمكنك حفظ أصولك من صفحة "حسابي".');
    }
  };

  if (step === Step.LANDING) {
    return <LandingView onStart={() => setStep(Step.AUTH)} />;
  }

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

  const canProceed = docs.originalPages.length > 0;
  
  // Theme styling
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

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${bgClass}`} dir="rtl">
      
      {loadingPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full border border-slate-800">
            <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
            <h4 className="text-white font-bold text-lg mt-2">جاري معالجة صفحات المستند...</h4>
          </div>
        </div>
      )}

      {limitWarning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold animate-fade-in-up">
          {limitWarning}
        </div>
      )}

      {/* Floating Logo Top Right */}
      {step !== Step.EDITOR && (
        <header className="fixed top-5 right-6 left-6 z-40 flex items-center justify-between pointer-events-none max-w-6xl mx-auto">
          <div className="pointer-events-auto flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-1.5 bg-teal-500 text-white rounded-xl">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <span className={`font-black text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>وثيق</span>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full hidden sm:inline">توثيق رسمي</span>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 pt-24 pb-32 flex-1 w-full animate-fade-in-up">
        
        {step === Step.UPLOAD && (
          <div className="flex flex-col">
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-black tracking-tight mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                مرحباً {currentUser?.name || 'بك في وثيق'}
              </h2>
              <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                قم برفع المستندات المطلوبة للبدء في الدمج والتوثيق الإلكتروني
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* Core Documents Box */}
              <div className={`${cardClass} p-6 rounded-3xl border shadow-xl flex flex-col gap-6`}>
                <h3 className={`font-extrabold text-lg flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  <div className="w-2 h-6 bg-teal-500 rounded-full" />
                  المستندات الأساسية
                </h3>
                
                <div className="flex flex-col gap-5">
                  <FileUpload
                    label="المستند الأصلي (الأوراق)"
                    subLabel="PDF أو صور متعددة"
                    accept="image/*,application/pdf"
                    multiple={true}
                    value={docs.originalPages.length > 0 ? docs.originalPages : null}
                    onChange={handleOriginalUpload}
                    onClear={() => clearFile('original')}
                    icon={<FileText size={38} className="text-teal-500" />}
                  />
                  <div>
                    <FileUpload
                      label="ورقة المؤسسة الرسمية"
                      subLabel="اختياري (خلفية للخطابات)"
                      accept="image/*,application/pdf"
                      multiple={true}
                      value={docs.templatePages.length > 0 ? docs.templatePages : null}
                      onChange={handleTemplateUpload}
                      onClear={() => clearFile('template')}
                      icon={<ImageIcon size={38} className="text-teal-500" />}
                    />
                    <button 
                      onClick={() => loadSavedAsset('template')} 
                      className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Layers size={14} />
                      <span>استخدام الورقة الرسمية المحفوظة في حسابي</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stamps and Signatures Box */}
              <div className={`${cardClass} p-6 rounded-3xl border shadow-xl flex flex-col gap-6`}>
                <h3 className={`font-extrabold text-lg flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  <div className="w-2 h-6 bg-teal-500 rounded-full" />
                  الأختام والتواقيع (اختياري)
                </h3>

                <div className="flex flex-col gap-5">
                  <div>
                    <FileUpload
                      label="ختم المؤسسة"
                      subLabel="صورة شفافة PNG أو JPEG"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.stamp}
                      onChange={(f) => handleFile('stamp', f as File)}
                      onClear={() => clearFile('stamp')}
                      icon={<Stamp size={38} className="text-teal-500" />}
                    />
                    <button 
                      onClick={() => loadSavedAsset('stamp')} 
                      className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Stamp size={14} />
                      <span>استخدام الختم المحفوظ في حسابي</span>
                    </button>
                  </div>

                  <div>
                    <FileUpload
                      label="التوقيع"
                      subLabel="صورة توقيع أو رسم حي"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.signature}
                      onChange={(f) => handleFile('signature', f as File)}
                      onClear={() => clearFile('signature')}
                      icon={<PenTool size={38} className="text-teal-500" />}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <button 
                        onClick={() => loadSavedAsset('signature')} 
                        className="text-xs text-teal-600 hover:text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <PenTool size={14} />
                        <span>استخدام التوقيع المحفوظ</span>
                      </button>
                      <button 
                        onClick={() => setIsDrawingSignature(true)} 
                        className={`text-xs px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>ارسم توقيعك ✍️</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <button
                disabled={!canProceed}
                onClick={handleProceedToEditor}
                className={`flex items-center justify-center gap-3 px-12 py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${
                  canProceed 
                    ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white hover:scale-[1.02] cursor-pointer shadow-teal-500/20' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <span>المتابعة للدمج والتصدير</span>
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
          <AccountView 
            currentUser={currentUser} 
            onLogout={() => { 
              setCurrentUser(null);
              setUser(null); 
              setStep(Step.LANDING); 
            }} 
            onUpdate={() => {
              refreshUser();
              setDocs({ ...docs });
            }} 
          />
        )}

        {step === Step.ADMIN_USERS && currentUser && (
          <AdminUsersView 
            currentUser={currentUser} 
            onBack={() => setStep(Step.UPLOAD)}
          />
        )}

      </main>

      {isDrawingSignature && (
        <SignaturePad
          onSave={(dataUrl) => { 
            setDocs(prev => ({ ...prev, signature: dataUrl })); 
            setIsDrawingSignature(false); 
          }}
          onClose={() => setIsDrawingSignature(false)}
        />
      )}

      {step !== Step.EDITOR && (
        <BottomNav
          currentUser={currentUser}
          currentStep={step}
          onOpenHome={() => { setStep(Step.UPLOAD); refreshUser(); }}
          onOpenAccount={() => setStep(Step.ACCOUNT)}
          onOpenAdminUsers={isAdmin ? () => setStep(Step.ADMIN_USERS) : undefined}
        />
      )}
    </div>
  );
};

export default App;
