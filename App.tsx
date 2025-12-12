import React, { useState } from 'react';
import { FileText, Stamp, Image as ImageIcon, CheckCircle, ArrowLeft } from 'lucide-react';
import FileUpload from './components/FileUpload';
import CanvasEditor from './components/CanvasEditor';
import GeminiAnalyzer from './components/GeminiAnalyzer';
import { DocumentState, Step } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [docs, setDocs] = useState<DocumentState>({
    original: null,
    template: null,
    stamp: null,
  });

  const handleFile = (type: keyof DocumentState, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setDocs(prev => ({ ...prev, [type]: e.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const clearFile = (type: keyof DocumentState) => {
    setDocs(prev => ({ ...prev, [type]: null }));
  };

  const canProceed = docs.original && docs.template && docs.stamp;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileText size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">DocuStamp <span className="text-blue-600 font-light">Pro</span></h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className={step === Step.UPLOAD ? "text-blue-600 font-bold" : ""}>1. رفع الملفات</span>
            <span>&larr;</span>
            <span className={step === Step.EDITOR ? "text-blue-600 font-bold" : ""}>2. التعديل والتصدير</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {step === Step.UPLOAD && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">تجهيز المستند الرسمي</h2>
              <p className="text-slate-500 max-w-lg mx-auto">
                قم برفع الملفات الثلاثة المطلوبة لدمجها. تأكد من جودة الصور للحصول على أفضل نتيجة في ملف PDF النهائي.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              
              <FileUpload
                label="1. الورقة الأصلية"
                subLabel="المحتوى النصي أو المستند المكتوب"
                value={docs.original}
                onChange={(f) => handleFile('original', f)}
                onClear={() => clearFile('original')}
                icon={<FileText size={40} className="text-slate-300" />}
              />

              <FileUpload
                label="2. ورقة المؤسسة (Template)"
                subLabel="الخلفية أو الترويسة الرسمية (Header/Footer)"
                value={docs.template}
                onChange={(f) => handleFile('template', f)}
                onClear={() => clearFile('template')}
                icon={<ImageIcon size={40} className="text-slate-300" />}
              />

              <FileUpload
                label="3. ختم المؤسسة"
                subLabel="صورة الختم (يفضل خلفية شفافة PNG)"
                accept="image/png, image/jpeg"
                value={docs.stamp}
                onChange={(f) => handleFile('stamp', f)}
                onClear={() => clearFile('stamp')}
                icon={<Stamp size={40} className="text-slate-300" />}
              />
            </div>

            <div className="flex flex-col items-center gap-4">
               <button
                disabled={!canProceed}
                onClick={() => setStep(Step.EDITOR)}
                className={`
                  flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl
                  ${canProceed 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-200' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                المتابعة إلى المحرر
                <ArrowLeft size={20} />
              </button>
              
              {!canProceed && (
                <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                  يرجى رفع جميع الملفات الثلاثة للمتابعة
                </p>
              )}
            </div>

             {/* AI Feature Teaser/Usage */}
             {docs.original && process.env.API_KEY && (
                <div className="max-w-2xl mx-auto mt-12">
                   <GeminiAnalyzer imageBase64={docs.original} />
                </div>
             )}
          </div>
        )}

        {step === Step.EDITOR && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <CanvasEditor 
              documents={docs} 
              onReset={() => {
                setDocs({ original: null, template: null, stamp: null });
                setStep(Step.UPLOAD);
              }}
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
