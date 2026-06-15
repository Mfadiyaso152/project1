import React, { useState } from 'react';
import { FileText, Stamp, Image as ImageIcon, Loader2, ArrowLeft, HelpCircle, PenTool } from 'lucide-react';
import FileUpload from './components/FileUpload';
import CanvasEditor from './components/CanvasEditor';
import SignaturePad from './components/SignaturePad';
import { DocumentState, Step } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [docs, setDocs] = useState<DocumentState>({
    original: null,
    originalPages: [],
    template: null,
    templatePages: [],
    stamp: null,
    signature: null,
  });

  // Client-side PDF page extractor
  const loadPdfPages = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            throw new Error("مكتبة معالجة ملفات PDF لم تكتمل بعد، يرجى الانتظار ثانية والمحاولة.");
          }
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const pageImages: string[] = [];
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // High-quality 2x scaling
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              pageImages.push(canvas.toDataURL('image/jpeg', 0.85));
            }
          }
          resolve(pageImages);
        } catch (err: any) {
          console.error(err);
          reject(err);
        }
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
        setDocs(prev => ({ 
          ...prev, 
          original: pages[0] || null, 
          originalPages: pages 
        }));
      } catch (err: any) {
        alert("حدث خطأ أثناء قراءة ملف PDF: " + (err.message || err));
      } finally {
        setLoadingPdf(false);
      }
    } else {
      // It's a list of images!
      const pagePromises = fileList.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string || "");
          };
          reader.readAsDataURL(file);
        });
      });

      try {
        const pages = await Promise.all(pagePromises);
        setDocs(prev => ({ 
          ...prev, 
          original: pages[0] || null, 
          originalPages: [...prev.originalPages, ...pages.filter(p => !!p)] 
        }));
      } catch (err) {
        console.error(err);
      }
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
        setDocs(prev => ({ 
          ...prev, 
          template: pages[0] || null, 
          templatePages: pages 
        }));
      } catch (err: any) {
        alert("حدث خطأ أثناء قراءة ورقة المؤسسة PDF: " + (err.message || err));
      } finally {
        setLoadingPdf(false);
      }
    } else {
      // It's a list of images!
      const pagePromises = fileList.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string || "");
          };
          reader.readAsDataURL(file);
        });
      });

      try {
        const pages = await Promise.all(pagePromises);
        setDocs(prev => ({ 
          ...prev, 
          template: pages[0] || null, 
          templatePages: pages.filter(p => !!p) 
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFile = async (type: keyof DocumentState, file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setLoadingPdf(true);
      try {
        const pages = await loadPdfPages(file);
        if (pages.length > 0) {
          setDocs(prev => ({ ...prev, [type]: pages[0] }));
        } else {
          alert("لم يتم العثور على أي صفحة في ملف PDF.");
        }
      } catch (err: any) {
        alert("حدث خطأ أثناء قراءة ملف PDF: " + (err.message || err));
      } finally {
        setLoadingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setDocs(prev => ({ ...prev, [type]: e.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (type: keyof DocumentState) => {
    if (type === 'original') {
      setDocs(prev => ({ ...prev, original: null, originalPages: [] }));
    } else if (type === 'template') {
      setDocs(prev => ({ ...prev, template: null, templatePages: [] }));
    } else {
      setDocs(prev => ({ ...prev, [type]: null }));
    }
  };

  // Stamp is NO LONGER mandatory - only original pages and template are required!
  const canProceed = docs.originalPages.length > 0 && docs.templatePages.length > 0;

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Loading Overlay */}
      {loadingPdf && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full text-center border border-slate-100">
            <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
            <h4 className="text-slate-800 font-bold text-lg mt-2">جاري استخراج صفحات PDF...</h4>
            <p className="text-sm text-slate-500 leading-relaxed">يرجى الانتظار، جاري تحويل مستند PDF إلى صفحات ذكية قابلة للتعديل والدمج.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 relative z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2.5 rounded-xl text-white shadow-sm shadow-teal-200">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              وثيق
              <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-md border border-teal-100">
                للتوثيق والدمج
              </span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 animate-fade-in-up">
        
        {step === Step.UPLOAD && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">تجهيز المستند الرسمي</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* القسم الأول: المستندات المطلوبة */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-2.5 h-6 bg-teal-600 rounded-full animate-pulse" />
                  <h3 className="font-extrabold text-slate-800 text-base">المستندات المطلوب دمجها (أساسي)</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUpload
                    label="1. المستند الأصلي (الأوراق)"
                    subLabel="ملف PDF أو صور (أصل المعاملة)"
                    accept="image/*,application/pdf"
                    multiple={true}
                    value={docs.originalPages.length > 0 ? docs.originalPages : null}
                    onChange={handleOriginalUpload}
                    onClear={() => clearFile('original')}
                    icon={<FileText size={38} className="text-teal-500" />}
                  />

                  <FileUpload
                    label="2. ورقة المؤسسة الرسمية (Template)"
                    subLabel="ملف PDF أو صور (الخلفية والترويسة)"
                    accept="image/*,application/pdf"
                    multiple={true}
                    value={docs.templatePages.length > 0 ? docs.templatePages : null}
                    onChange={handleTemplateUpload}
                    onClear={() => clearFile('template')}
                    icon={<ImageIcon size={38} className="text-teal-500" />}
                  />
                </div>
              </div>

              {/* القسم الثاني: التوثيق الاختياري */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-2.5 h-6 bg-emerald-600 rounded-full animate-pulse" />
                  <h3 className="font-extrabold text-slate-800 text-base">أدوات التوثيق والاعتماد (اختياري)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUpload
                    label="3. ختم المؤسسة"
                    subLabel="صورة الختم أو ملف PDF (يفضل خلفية شفافة PNG)"
                    accept="image/png, image/jpeg, application/pdf"
                    value={docs.stamp}
                    onChange={(f) => handleFile('stamp', f as File)}
                    onClear={() => clearFile('stamp')}
                    icon={<Stamp size={38} className="text-amber-500" />}
                  />

                  <div className="flex flex-col gap-3">
                    <FileUpload
                      label="4. التوقيع الإلكتروني"
                      subLabel="صورة توقيعك، ملف PDF أو ارسم بيدك"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.signature}
                      onChange={(f) => handleFile('signature', f as File)}
                      onClear={() => clearFile('signature')}
                      icon={<PenTool size={38} className="text-emerald-500" />}
                    />
                    <button
                      type="button"
                      onClick={() => setIsDrawingSignature(true)}
                      className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 px-3 rounded-xl font-bold text-xs border border-emerald-200/40 shadow-xs transition-all hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
                    >
                      <PenTool size={13} />
                      أو ارسم توقيعك الحي الآن ✍️
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                disabled={!canProceed}
                onClick={() => setStep(Step.EDITOR)}
                className={`
                  flex items-center justify-center gap-3 px-12 py-4 rounded-xl font-bold text-lg transition-all shadow-xl
                  ${canProceed 
                    ? 'bg-teal-600 text-white hover:bg-teal-700 hover:scale-[1.03] active:scale-[0.98] shadow-teal-100 cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }
                `}
              >
                المتابعة إلى المحرر
                <ArrowLeft size={20} />
              </button>
              
              {!canProceed && (
                <p className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 flex items-center gap-2 animate-pulse">
                  <HelpCircle size={16} />
                  يرجى رفع المستند الأصلي والورقة الرسمية للمتابعة (الختم والتوقيع اختياري)
                </p>
              )}
            </div>
          </div>
        )}

        {step === Step.EDITOR && (
          <div className="animate-scale-in">
            <CanvasEditor 
              documents={docs} 
              onReset={() => {
                setDocs({ original: null, originalPages: [], template: null, templatePages: [], stamp: null, signature: null });
                setStep(Step.UPLOAD);
              }}
            />
          </div>
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

      {/* Floating Support Card with Soft Rounded Corners */}
      <footer className="w-full py-8 text-slate-500 text-sm animate-fade-in-up">
        <div className="max-w-6xl mx-auto px-4 flex justify-center">
          <div className="flex items-center justify-center gap-3.5 text-slate-700 bg-white border border-slate-200/60 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 max-w-sm w-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <span className="text-xs text-slate-500 font-bold">رقم المبرمج للتواصل والدعم المباشر:</span>
            <a href="tel:0536894854" className="font-extrabold text-teal-600 hover:text-teal-700 hover:underline tracking-wider text-sm transition-colors">0536894854</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
