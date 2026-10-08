import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, Check, X, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClose: () => void;
}

const COLORS = [
  { id: 'darkblue', value: '#1e3a8a', label: 'أزرق داكن (حبر رسمي)' },
  { id: 'black', value: '#0f172a', label: 'أسود كربوني' },
  { id: 'royalblue', value: '#2563eb', label: 'أزرق ملكي' },
  { id: 'red', value: '#991b1b', label: 'أحمر معتمد' },
];

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeColor, setActiveColor] = useState('#1e3a8a');
  const [lineWidth, setLineWidth] = useState(3.5);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = lineWidth;
  }, [activeColor, lineWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let drawing = false;

    const handleStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e.touches.length === 0) return;
      
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        drawing = true;
        setIsDrawing(true);
        setHasDrawn(true);
      }
    };

    const handleMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!drawing) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if (e.touches.length === 0) return;

      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };

    const handleEnd = (e: TouchEvent) => {
      e.preventDefault();
      drawing = false;
      setIsDrawing(false);
    };

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
      canvas.removeEventListener('touchcancel', handleEnd);
    };
  }, [activeColor, lineWidth]);

  const getCoordinates = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
      setHasDrawn(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-fade-in text-right" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-700">
              <PenTool size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">منصّة التوقيع الحيّ</h3>
              <p className="text-slate-500 text-xs mt-0.5">ارسم توقيعك بدقة عالية وبخلفية شفافة</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 hover:bg-slate-200/70 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ink Colors & Line width */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">لون الحبر:</span>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setActiveColor(color.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                    activeColor === color.value ? 'border-blue-600 scale-110 shadow-sm' : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                >
                  {activeColor === color.value && (
                    <Check size={13} className="text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">السُّمك:</span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {[2, 3.5, 5].map((width) => (
                <button
                  key={width}
                  type="button"
                  onClick={() => setLineWidth(width)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    lineWidth === width ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {width === 2 ? 'رفيع' : width === 5 ? 'عريض' : 'متوسط'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-5 bg-slate-50/50 flex flex-col items-center">
          <div className="relative w-full aspect-[16/9] max-h-56 bg-white border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden cursor-crosshair shadow-inner">
            <canvas
              ref={canvasRef}
              width={500}
              height={280}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-full bg-transparent touch-none"
            />
            
            {!hasDrawn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 gap-2">
                <span className="text-sm font-bold text-slate-500">ارسم توقيعك هنا بإصبعك أو بالفأرة</span>
                <span className="text-xs text-slate-400">يتم التثبيت بخلفية مفرغة شفافة تلقائياً</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasDrawn}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>مسح والبدء مجدداً</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>اعتماد التوقيع</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SignaturePad;
