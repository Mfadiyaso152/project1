import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Stamp, 
  Image as ImageIcon, 
  Loader2, 
  ArrowLeft, 
  HelpCircle, 
  PenTool, 
  FolderPlus, 
  Trash2, 
  Download, 
  BookmarkCheck,
  Check
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import CanvasEditor from './components/CanvasEditor';
import SignaturePad from './components/SignaturePad';
import { DocumentState, Step, DocumentFileItem } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocumentState>({
    original: null,
    originalPages: [],
    files: [],
    template: null,
    templatePages: [],
    stamp: null,
    signature: null,
  });

  // Check for stored signature on mount
  useEffect(() => {
    const saved = localStorage.getItem('docustamp_saved_signature');
    if (saved) {
      setSavedSignature(saved);
    }
  }, []);

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
        setDocs(prev => {
          const file1: DocumentFileItem = { id: 'file-1', name: 'ملف 1', pages };
          const otherFiles = prev.files.slice(1);
          const updatedFiles = [file1, ...otherFiles].map((f, idx) => ({ ...f, name: `ملف ${idx + 1}` }));
          return {
            ...prev,
            original: pages[0] || null,
            originalPages: pages,
            files: updatedFiles
          };
        });
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
        const validPages = pages.filter(p => !!p);
        setDocs(prev => {
          const file1: DocumentFileItem = { id: 'file-1', name: 'ملف 1', pages: validPages };
          const otherFiles = prev.files.slice(1);
          const updatedFiles = [file1, ...otherFiles].map((f, idx) => ({ ...f, name: `ملف ${idx + 1}` }));
          return {
            ...prev,
            original: validPages[0] || null,
            originalPages: validPages,
            files: updatedFiles
          };
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handler for uploading additional files (ملف 2, ملف 3...)
  const handleAddAdditionalFiles = async (files: File | File[]) => {
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;

    setLoadingPdf(true);
    try {
      const newItems: DocumentFileItem[] = [];
      let baseCount = docs.files.length;
      if (baseCount === 0 && docs.originalPages.length > 0) {
        baseCount = 1;
      }

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        let pages: string[] = [];

        if (isPdf) {
          pages = await loadPdfPages(file);
        } else {
          pages = await new Promise<string[]>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve([e.target?.result as string || ""]);
            };
            reader.readAsDataURL(file);
          });
        }

        if (pages.length > 0) {
          const nextIndex = baseCount + newItems.length + 1;
          newItems.push({
            id: `file-${Date.now()}-${i}`,
            name: `ملف ${nextIndex}`,
            pages
          });
        }
      }

      setDocs(prev => {
        let currentFiles = [...prev.files];
        if (currentFiles.length === 0 && prev.originalPages.length > 0) {
          currentFiles = [{ id: 'file-1', name: 'ملف 1', pages: prev.originalPages }];
        }
        const updatedFiles = [...currentFiles, ...newItems].map((f, idx) => ({
          ...f,
          name: `ملف ${idx + 1}`
        }));

        return {
          ...prev,
          files: updatedFiles,
          originalPages: updatedFiles[0]?.pages || prev.originalPages
        };
      });
    } catch (err: any) {
      alert("حدث خطأ أثناء رفع الملفات الإضافية: " + (err.message || err));
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleRemoveAdditionalFile = (fileId: string) => {
    setDocs(prev => {
      const filtered = prev.files.filter(f => f.id !== fileId);
      const reindexed = filtered.map((f, idx) => ({ ...f, name: `ملف ${idx + 1}` }));
      return {
        ...prev,
        files: reindexed,
        originalPages: reindexed[0]?.pages || []
      };
    });
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
          const res = e.target!.result as string;
          setDocs(prev => ({ ...prev, [type]: res }));
          if (type === 'signature') {
            localStorage.setItem('docustamp_saved_signature', res);
            setSavedSignature(res);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (type: keyof DocumentState) => {
    if (type === 'original') {
      setDocs(prev => ({ ...prev, original: null, originalPages: [], files: prev.files.slice(1) }));
    } else if (type === 'template') {
      setDocs(prev => ({ ...prev, template: null, templatePages: [] }));
    } else {
      setDocs(prev => ({ ...prev, [type]: null }));
    }
  };

  const handleUseSavedSignature = () => {
    if (savedSignature) {
      setDocs(prev => ({ ...prev, signature: savedSignature }));
    }
  };

  const handleSaveCurrentSignatureLocally = () => {
    if (docs.signature) {
      localStorage.setItem('docustamp_saved_signature', docs.signature);
      setSavedSignature(docs.signature);
      alert('تم حفظ التوقيع في التطبيق بنجاح بخلفية شفافة لاستخدامه في المستندات القادمة!');
    }
  };

  const handleDownloadSignatureTransparent = () => {
    if (!docs.signature) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'توقيع_بخلفية_شفافة.png';
        a.click();
      }
    };
    img.src = docs.signature;
  };

  // Check effective files for proceed readiness
  const effectiveFiles = docs.files.length > 0 
    ? docs.files 
    : (docs.originalPages.length > 0 ? [{ id: 'file-1', name: 'ملف 1', pages: docs.originalPages }] : []);

  const canProceed = effectiveFiles.length > 0 && effectiveFiles[0].pages.length > 0;

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* القسم الأول: المستندات المطلوبة */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-2.5 h-6 bg-teal-600 rounded-full animate-pulse" />
                  <h3 className="font-extrabold text-slate-800 text-base">المستندات المطلوب دمجها (أساسي)</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUpload
                    label="1. المستند الأصلي (ملف 1)"
                    subLabel="ملف PDF أو صور (أصل المعاملة)"
                    accept="image/*,application/pdf"
                    multiple={true}
                    value={docs.originalPages.length > 0 ? docs.originalPages : null}
                    onChange={handleOriginalUpload}
                    onClear={() => clearFile('original')}
                    icon={<FileText size={38} className="text-teal-500" />}
                  />

                  <FileUpload
                    label="2. ورقة المؤسسة الرسمية (اختياري)"
                    subLabel="ملف PDF أو صور (الخلفية والترويسة) - غير إلزامية"
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

                    {savedSignature && !docs.signature && (
                      <button
                        type="button"
                        onClick={handleUseSavedSignature}
                        className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 py-2 px-3 rounded-xl font-bold text-xs border border-amber-200 transition-all cursor-pointer"
                      >
                        <BookmarkCheck size={14} className="text-amber-600" />
                        استخدام التوقيع المحفوظ سابقاً ✨
                      </button>
                    )}

                    {docs.signature && (
                      <div className="flex flex-col gap-1.5 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                        <button
                          type="button"
                          onClick={handleDownloadSignatureTransparent}
                          className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white hover:bg-emerald-100/50 py-1.5 px-2.5 rounded-lg border border-emerald-200/80 transition-colors cursor-pointer"
                        >
                          <Download size={13} className="text-emerald-600" />
                          حفظ/تنزيل التوقيع بخلفية شفافة (PNG)
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveCurrentSignatureLocally}
                          className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-white/80 py-1 px-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          <BookmarkCheck size={12} className="text-slate-500" />
                          حفظ كـ توقيع دائم في التطبيق
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* خيار إضافة أكثر من ملف للتوثيق دفعة واحدة (تحت أدوات التوثيق) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5 mb-10">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-teal-600 rounded-full animate-pulse" />
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">إضافة ملفات إضافية للتوثيق (دفعة واحدة)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">إذا كان لديك عدة ملفات وتريد توثيقها وختمها جميعاً معاً دون الحاجة لإعادة العملية كل مرة</p>
                  </div>
                </div>
                {effectiveFiles.length > 1 && (
                  <span className="text-xs bg-teal-50 text-teal-700 font-extrabold px-3 py-1 rounded-full border border-teal-100">
                    مجموع الملفات: {effectiveFiles.length}
                  </span>
                )}
              </div>

              {/* Display list of uploaded files */}
              {effectiveFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {effectiveFiles.map((fileItem, idx) => (
                    <div key={fileItem.id || idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="bg-teal-600 text-white px-2.5 py-1 rounded-lg font-bold text-xs flex-shrink-0 shadow-2xs">
                          {fileItem.name || `ملف ${idx + 1}`}
                        </div>
                        <div className="truncate">
                          <span className="text-xs text-slate-600 font-bold block">
                            {fileItem.pages.length} {fileItem.pages.length === 1 ? 'صفحة' : 'صفحات'}
                          </span>
                        </div>
                      </div>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalFile(fileItem.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف هذا الملف الإضافي"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload additional files button */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <label className="flex-1 w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-teal-50/50 text-teal-700 border-2 border-dashed border-teal-200 hover:border-teal-500 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer">
                  <FolderPlus size={18} />
                  <span>+ إضافة ملفات إضافية</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleAddAdditionalFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>
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
                المتابعة إلى المحرر لتحديد مكان الختم والتوقيع
                <ArrowLeft size={20} />
              </button>
              
              {!canProceed && (
                <p className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 flex items-center gap-2 animate-pulse">
                  <HelpCircle size={16} />
                  يرجى رفع المستند الأصلي للمتابعة (الخلفية الرسمية، الختم، والتوقيع اختيارية تماماً)
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
                setDocs({ original: null, originalPages: [], files: [], template: null, templatePages: [], stamp: null, signature: null });
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
            localStorage.setItem('docustamp_saved_signature', dataUrl);
            setSavedSignature(dataUrl);
            setIsDrawingSignature(false);
          }}
          onClose={() => setIsDrawingSignature(false)}
        />
      )}

      {/* Floating Support Card */}
      <footer className="w-full py-8 text-slate-500 text-sm animate-fade-in-up">
        <div className="max-w-6xl mx-auto px-4 flex justify-center">
          <div className="flex flex-col items-center gap-3 text-center text-slate-700 bg-white border border-slate-200/60 px-6 py-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 max-w-md w-full">
            <div className="flex items-center justify-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 opacity-90">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span className="text-xs text-slate-500 font-bold">رقم المبرمج للتواصل والدعم المباشر:</span>
              <a href="tel:0536894854" className="font-extrabold text-teal-600 hover:text-teal-700 hover:underline tracking-wider text-sm transition-colors">0536894854</a>
            </div>

            <div className="w-full h-px bg-slate-100" />

            <p className="text-xs text-slate-400 font-semibold">
              جميع حقوق فكرة وتصميم الموقع محفوظة &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
