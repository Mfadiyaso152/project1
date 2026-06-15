import React, { useRef } from 'react';
import { Files, Trash2, Eye } from 'lucide-react';

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

  // Check if we have values
  const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
  const valuesArray = Array.isArray(value) ? value : (value ? [value] : []);

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-slate-700 flex justify-between items-center">
        <span>{label}</span>
        {multiple && valuesArray.length > 0 && (
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
            {valuesArray.length} {valuesArray.length === 1 ? 'صفحة' : valuesArray.length === 2 ? 'صفحتين' : 'صفحات'}
          </span>
        )}
      </label>
      <div
        onClick={handleClick}
        className={`
          relative flex flex-col items-center justify-center w-full min-h-[10rem] 
          border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden
          ${hasValue 
            ? 'border-emerald-500 bg-emerald-50/50' 
            : 'border-slate-300 bg-white hover:border-teal-500 hover:bg-teal-50/40 cursor-pointer'
          }
        `}
      >
        {hasValue ? (
          <div className="relative w-full p-4 flex flex-col gap-3 group">
            {/* Gallery / Thumbnails */}
            <div className={`grid gap-2 max-h-48 overflow-y-auto pr-1 ${valuesArray.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {valuesArray.map((url, idx) => (
                <div key={idx} className="relative aspect-[3/4] bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
                  <img 
                    src={url} 
                    alt={`Page ${idx + 1}`} 
                    className="w-full h-full object-contain p-1" 
                  />
                  {valuesArray.length > 1 && (
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[10px] text-white text-center py-0.5 font-sans">
                      {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Clear Banner overlay */}
            <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 shadow-lg active:scale-95 transition-all text-sm"
              >
                <Trash2 size={16} />
                حذف وإعادة الرفع
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 md:px-6">
            <div className="mb-3 text-slate-400">
              {icon}
            </div>
            <p className="mb-2 text-sm text-slate-600 font-medium">
              <span className="font-bold text-teal-600">اضغط لرفع الملفات</span>
            </p>
            {subLabel && <p className="text-xs text-slate-400 leading-normal max-w-[200px] mx-auto">{subLabel}</p>}
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
