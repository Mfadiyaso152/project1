import React, { useEffect, useRef, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { DocumentState, StampPosition } from '../types';
import { Move, Download, RefreshCcw, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';

interface CanvasEditorProps {
  documents: DocumentState;
  onReset: () => void;
}

const A4_RATIO = 210 / 297; // Width / Height

const CanvasEditor: React.FC<CanvasEditorProps> = ({ documents, onReset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for stamp manipulation
  const [stampPos, setStampPos] = useState<StampPosition>({ x: 50, y: 80, size: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Customization
  const [originalOpacity, setOriginalOpacity] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize stamp position center
  useEffect(() => {
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Center vertically, place near bottom
        setStampPos(prev => ({ ...prev, x: (width / 2) - 75, y: height - 200 }));
    }
  }, []);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Calculate offset to prevent snapping to corner
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate new position relative to container
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    // Boundary checks
    newX = Math.max(0, Math.min(newX, containerRect.width - stampPos.size));
    newY = Math.max(0, Math.min(newY, containerRect.height - stampPos.size));

    setStampPos(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragOffset, stampPos.size]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  // Export Logic
  const handleExport = async () => {
    if (!canvasRef.current || !documents.template || !documents.original) return;
    setIsExporting(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A4 dimensions in pixels (high res: 300 DPI approx)
    const width = 2480; 
    const height = 3508;
    canvas.width = width;
    canvas.height = height;

    // Load images
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    try {
      // 1. Draw Template (Background)
      // We stretch the template to fill A4 (object-fill behavior) to ensure header/footer fits
      const templateImg = await loadImage(documents.template);
      ctx.drawImage(templateImg, 0, 0, width, height);

      // 2. Draw Original Content (Centered/Fitted - object-contain behavior)
      const originalImg = await loadImage(documents.original);
      
      // Calculate aspect ratio to "contain" the image without distortion
      const imgRatio = originalImg.width / originalImg.height;
      const canvasRatio = width / height;
      
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        // Image is wider than canvas relative to aspect -> fit to width
        drawH = width / imgRatio;
        drawY = (height - drawH) / 2;
      } else {
        // Image is taller -> fit to height
        drawW = height * imgRatio;
        drawX = (width - drawW) / 2;
      }

      ctx.save();
      ctx.globalAlpha = originalOpacity;
      // IMPORTANT: Use multiply to blend white backgrounds onto the template
      ctx.globalCompositeOperation = 'multiply'; 
      ctx.drawImage(originalImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      // 3. Draw Stamp
      if (documents.stamp && containerRef.current) {
        const stampImg = await loadImage(documents.stamp);
        
        // Map screen coordinates to canvas coordinates
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate scaling factor between screen view and actual A4 canvas
        const scaleX = width / containerRect.width;
        const scaleY = height / containerRect.height;

        const stampX = stampPos.x * scaleX;
        const stampY = stampPos.y * scaleY;
        const stampW = stampPos.size * scaleX;
        const stampH = stampPos.size * scaleY; // Assuming square stamp

        ctx.drawImage(stampImg, stampX, stampY, stampW, stampH);
      }

      // 4. Generate PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.90);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save('merged-document.pdf');

    } catch (error) {
      console.error("Export failed", error);
      alert("حدث خطأ أثناء تصدير الملف");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
      
      {/* Editor Canvas Area */}
      <div className="flex-1 flex justify-center bg-slate-200/50 rounded-xl p-4 lg:p-8 overflow-hidden shadow-inner min-h-[600px] items-center">
        <div 
          ref={containerRef}
          className="relative bg-white shadow-2xl transition-all overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '500px', // Visual width on screen
            aspectRatio: `${A4_RATIO}`,
          }}
        >
          {/* Layer 1: Template (Institution Paper) - Stretched to fill */}
          {documents.template && (
            <img 
              src={documents.template} 
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              alt="Template"
            />
          )}

          {/* Layer 2: Original Paper - Fitted (Contained) & Multiplied */}
          {documents.original && (
            <img 
              src={documents.original} 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-multiply"
              style={{ opacity: originalOpacity }}
              alt="Original"
            />
          )}

          {/* Layer 3: Stamp */}
          {documents.stamp && (
            <div
              onMouseDown={handleMouseDown}
              className={`absolute cursor-move select-none group z-10 ${isDragging ? 'opacity-80' : 'opacity-100'}`}
              style={{
                left: stampPos.x,
                top: stampPos.y,
                width: stampPos.size,
                height: stampPos.size,
              }}
            >
              <img 
                src={documents.stamp} 
                className="w-full h-full object-contain drop-shadow-md"
                alt="Stamp"
              />
              {/* Visual border on hover/drag */}
              <div className="absolute inset-0 border-2 border-dashed border-blue-400 opacity-0 group-hover:opacity-100 rounded-lg pointer-events-none transition-opacity" />
            </div>
          )}
        </div>
      </div>

      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-3">أدوات التحكم</h3>
          
          {/* Opacity Control */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-600 mb-2 block">وضوح المستند الأصلي</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={originalOpacity}
              onChange={(e) => setOriginalOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Stamp Size Control */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-600 mb-2 block flex justify-between">
              <span>حجم الختم</span>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{Math.round(stampPos.size)}px</span>
            </label>
            <div className="flex items-center gap-2">
              <ZoomOut size={16} className="text-slate-400" />
              <input 
                type="range" 
                min="50" 
                max="300" 
                value={stampPos.size}
                onChange={(e) => setStampPos(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <ZoomIn size={16} className="text-slate-400" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-2 flex items-start gap-2">
            <Move className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>اسحب الختم لوضعه في المكان المناسب.</p>
          </div>
          
           <div className="bg-amber-50 p-4 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>يتم دمج المستند الأصلي باستخدام تقنية "المضاعفة" (Multiply) لإخفاء الخلفية البيضاء.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
          >
            {isExporting ? (
              <span className="animate-pulse">جاري التصدير...</span>
            ) : (
              <>
                <Download size={20} />
                تصدير PDF
              </>
            )}
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium transition-colors"
          >
            <RefreshCcw size={18} />
            بدء مستند جديد
          </button>
        </div>

      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CanvasEditor;
