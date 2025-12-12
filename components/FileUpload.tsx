import React, { useRef } from 'react';

interface FileUploadProps {
  label: string;
  subLabel?: string;
  accept?: string;
  value: string | null;
  onChange: (file: File) => void;
  onClear: () => void;
  icon: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  subLabel,
  accept = "image/*",
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
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div
        onClick={handleClick}
        className={`
          relative flex flex-col items-center justify-center w-full h-40 
          border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer overflow-hidden
          ${value 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50'
          }
        `}
      >
        {value ? (
          <div className="relative w-full h-full group">
            <img 
              src={value} 
              alt="Preview" 
              className="w-full h-full object-contain p-2" 
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 shadow-lg"
              >
                حذف وتغيير
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className="mb-3 text-slate-400">
              {icon}
            </div>
            <p className="mb-2 text-sm text-slate-600 font-medium">
              <span className="font-bold text-blue-600">اضغط للرفع</span>
            </p>
            {subLabel && <p className="text-xs text-slate-400">{subLabel}</p>}
          </div>
        )}
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept={accept} 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default FileUpload;
