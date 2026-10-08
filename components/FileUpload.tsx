import React, { useRef } from 'react';
import { Trash2, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
  label: string;
  subLabel?: string;
  accept?: string;
  multiple?: boolean;
  value: string | string[] | null;
  onChange: (files: File | File[]) => void;
  onClear: () => void;
  icon: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  subLabel,
  accept = "image/*",
  multiple = false,
  value,
  onChange,
  onClear,
  icon
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!value && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple) {
        onChange(Array.from(e.target.files));
      } else {
        onChange(e.target.files[0]);
      }
    }
  };

  const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
  const valuesArray = Array.isArray(value) ? value : (value ? [value] : []);

  return (
    <div className="flex flex-col gap-2 w-full text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>{label}</span>
        </label>
        {multiple && valuesArray.length > 0 && (
          <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
            {valuesArray.length} {valuesArray.length === 1 ? 'صفحة' : valuesArray.length === 2 ? 'صفحتين' : 'صفحات'}
          </span>
        )}
      </div>

      <div
        onClick={handleClick}
        className={`
          relative flex flex-col items-center justify-center w-full min-h-[9.5rem] 
          border-2 border-dashed rounded-2xl transition-all duration-300 overflow-hidden
          ${hasValue 
            ? 'border-blue-500 bg-blue-50/40 shadow-[0_4px_20px_rgba(37,99,235,0.06)]' 
            : 'border-slate-200 bg-slate-50/70 hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer group shadow-xs'
          }
        `}
      >
        {hasValue ? (
          <div className="relative w-full p-4 flex flex-col gap-3 group">
            {/* Thumbnails */}
            <div className={`grid gap-2.5 max-h-48 overflow-y-auto pr-1 ${valuesArray.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {valuesArray.map((url, idx) => (
                <div 
                  key={idx} 
                  className="relative aspect-[3/4] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center"
                >
                  <img 
                    src={url} 
                    alt={`Document Page ${idx + 1}`} 
                    className="w-full h-full object-contain p-1.5" 
                  />
                  {valuesArray.length > 1 && (
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[10px] text-white font-bold text-center py-0.5 font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Clear overlay on hover */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition-all text-xs cursor-pointer"
              >
                <Trash2 size={15} />
                <span>حذف وإعادة الرفع</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className="mb-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 text-blue-600 shadow-xs group-hover:scale-110 group-hover:border-blue-400 transition-all duration-300">
              {icon}
            </div>
            <p className="mb-1 text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
              اضغط لاختيار أو إسقاط الملفات
            </p>
            {subLabel && (
              <p className="text-xs text-slate-500 leading-normal max-w-[220px] mx-auto">
                {subLabel}
              </p>
            )}
          </div>
        )}

        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept={accept} 
          multiple={multiple}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default FileUpload;
