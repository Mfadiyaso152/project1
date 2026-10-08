import React, { useEffect, useRef, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { DocumentState, StampPosition } from '../types';
import { 
  Move, 
  Download, 
  RefreshCcw, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Square, 
  CheckSquare, 
  Copy,
  PenTool,
  Stamp,
  Share2,
  MessageCircle,
  X,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  FilePlus,
  Layers,
  RotateCcw,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface CanvasEditorProps {
  documents: DocumentState;
  onReset: () => void;
  onStartFresh: () => void;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ documents, onReset, onStartFresh }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [stampConfigs, setStampConfigs] = useState<{ [key: number]: StampPosition }>({});
  const [signatureConfigs, setSignatureConfigs] = useState<{ [key: number]: StampPosition }>({});
  
  const [draggingItem, setDraggingItem] = useState<'stamp' | 'signature' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [syncPositions, setSyncPositions] = useState(true);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [isExported, setIsExported] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFreshConfirmModal, setShowFreshConfirmModal] = useState(false);

  const totalPages = documents.originalPages.length || (documents.original ? 1 : 0);

  const getTemplateForPage = (index: number): string | null => {
    if (documents.templatePages.length === 0) return documents.template || null;
    if (documents.templatePages.length === 1) return documents.templatePages[0];
    if (index < documents.templatePages.length) {
      return documents.templatePages[index];
    }
    return documents.templatePages[documents.templatePages.length - 1];
  };

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const w = width || 400;
      const h = height || 565;
      
      const defaultStampX = (w / 2) - 65;
      const defaultStampY = h - 150;
      const defaultSignatureX = (w / 2) - 65;
      const defaultSignatureY = h - 260;

      const pageCount = Math.max(1, totalPages);

      setStampConfigs(prev => {
        const updated = { ...prev };
        for (let idx = 0; idx < pageCount; idx++) {
          if (!updated[idx]) {
            updated[idx] = {
              x: defaultStampX,
              y: defaultStampY,
              size: 130,
              enabled: !!documents.stamp
            };
          }
        }
        return updated;
      });

      setSignatureConfigs(prev => {
        const updated = { ...prev };
        for (let idx = 0; idx < pageCount; idx++) {
          if (!updated[idx]) {
            updated[idx] = {
              x: defaultSignatureX,
              y: defaultSignatureY,
              size: 130,
              enabled: !!documents.signature
            };
          }
        }
        return updated;
      });
    }
  }, [totalPages, documents.stamp, documents.signature]);

  const currentStampConfig = stampConfigs[currentPageIndex] || {
    x: 100,
    y: 350,
    size: 130,
    enabled: !!documents.stamp
  };

  const currentSignatureConfig = signatureConfigs[currentPageIndex] || {
    x: 100,
    y: 200,
    size: 130,
    enabled: !!documents.signature
  };

  // Toggle Stamp for a specific page
  const toggleStampForPage = (pageIdx: number) => {
    setStampConfigs(prev => {
      const current = prev[pageIdx] || { x: 100, y: 350, size: 130, enabled: false };
      return {
        ...prev,
        [pageIdx]: {
          ...current,
          enabled: !current.enabled
        }
      };
    });
  };

  // Toggle Signature for a specific page
  const toggleSignatureForPage = (pageIdx: number) => {
    setSignatureConfigs(prev => {
      const current = prev[pageIdx] || { x: 100, y: 200, size: 130, enabled: false };
      return {
        ...prev,
        [pageIdx]: {
          ...current,
          enabled: !current.enabled
        }
      };
    });
  };

  // Apply Stamp Presets
  const applyStampPreset = (preset: 'all' | 'first' | 'last' | 'current' | 'none') => {
    setStampConfigs(prev => {
      const updated = { ...prev };
      for (let i = 0; i < totalPages; i++) {
        const existing = updated[i] || { x: 100, y: 350, size: 130, enabled: false };
        let shouldEnable = false;
        if (preset === 'all') shouldEnable = true;
        else if (preset === 'first') shouldEnable = (i === 0);
        else if (preset === 'last') shouldEnable = (i === totalPages - 1);
        else if (preset === 'current') shouldEnable = (i === currentPageIndex);
        else if (preset === 'none') shouldEnable = false;

        updated[i] = { ...existing, enabled: shouldEnable };
      }
      return updated;
    });
  };

  // Apply Signature Presets
  const applySignaturePreset = (preset: 'all' | 'first' | 'last' | 'current' | 'none') => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      for (let i = 0; i < totalPages; i++) {
        const existing = updated[i] || { x: 100, y: 200, size: 130, enabled: false };
        let shouldEnable = false;
        if (preset === 'all') shouldEnable = true;
        else if (preset === 'first') shouldEnable = (i === 0);
        else if (preset === 'last') shouldEnable = (i === totalPages - 1);
        else if (preset === 'current') shouldEnable = (i === currentPageIndex);
        else if (preset === 'none') shouldEnable = false;

        updated[i] = { ...existing, enabled: shouldEnable };
      }
      return updated;
    });
  };

  const handleStartDrag = (item: 'stamp' | 'signature', clientX: number, clientY: number, currentTarget: HTMLElement) => {
    setDraggingItem(item);
    const rect = currentTarget.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };

  const handleMouseDown = (item: 'stamp' | 'signature', e: React.MouseEvent) => {
    handleStartDrag(item, e.clientX, e.clientY, e.currentTarget as HTMLElement);
  };

  const handleTouchStart = (item: 'stamp' | 'signature', e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStartDrag(item, touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingItem || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    let newX = clientX - containerRect.left - dragOffset.x;
    let newY = clientY - containerRect.top - dragOffset.y;

    const activeConfig = draggingItem === 'stamp' ? currentStampConfig : currentSignatureConfig;
    const itemSize = activeConfig.size;
    newX = Math.max(0, Math.min(newX, containerRect.width - itemSize));
    newY = Math.max(0, Math.min(newY, containerRect.height - itemSize));

    if (draggingItem === 'stamp') {
      setStampConfigs(prev => {
        const updated = { ...prev };
        if (syncPositions) {
          for (let idx = 0; idx < totalPages; idx++) {
            updated[idx] = {
              ...(updated[idx] || {}),
              x: newX,
              y: newY,
              size: activeConfig.size,
              enabled: updated[idx]?.enabled ?? (idx === currentPageIndex)
            };
          }
        } else {
          updated[currentPageIndex] = {
            ...updated[currentPageIndex],
            x: newX,
            y: newY
          };
        }
        return updated;
      });
    } else if (draggingItem === 'signature') {
      setSignatureConfigs(prev => {
        const updated = { ...prev };
        if (syncPositions) {
          for (let idx = 0; idx < totalPages; idx++) {
            updated[idx] = {
              ...(updated[idx] || {}),
              x: newX,
              y: newY,
              size: activeConfig.size,
              enabled: updated[idx]?.enabled ?? (idx === currentPageIndex)
            };
          }
        } else {
          updated[currentPageIndex] = {
            ...updated[currentPageIndex],
            x: newX,
            y: newY
          };
        }
        return updated;
      });
    }
  }, [draggingItem, dragOffset, currentStampConfig, currentSignatureConfig, syncPositions, totalPages, currentPageIndex]);

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleEndDrag = () => {
    setDraggingItem(null);
  };

  const handleStampSizeChange = (newSize: number) => {
    setStampConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        for (let idx = 0; idx < totalPages; idx++) {
          if (updated[idx]) {
            updated[idx] = { ...updated[idx], size: newSize };
          }
        }
      } else {
        if (updated[currentPageIndex]) {
          updated[currentPageIndex] = { ...updated[currentPageIndex], size: newSize };
        }
      }
      return updated;
    });
  };

  const handleSignatureSizeChange = (newSize: number) => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        for (let idx = 0; idx < totalPages; idx++) {
          if (updated[idx]) {
            updated[idx] = { ...updated[idx], size: newSize };
          }
        }
      } else {
        if (updated[currentPageIndex]) {
          updated[currentPageIndex] = { ...updated[currentPageIndex], size: newSize };
        }
      }
      return updated;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pagesToProcess = documents.originalPages.length > 0 
        ? documents.originalPages 
        : (documents.original ? [documents.original] : []);

      for (let i = 0; i < pagesToProcess.length; i++) {
        if (i > 0) pdf.addPage('a4', 'portrait');

        const canvas = document.createElement('canvas');
        canvas.width = 1240;
        canvas.height = 1754;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 1. Template background
          const currentTemplate = getTemplateForPage(i);
          if (currentTemplate) {
            const templateImg = await loadImage(currentTemplate);
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          }

          // 2. Original Page
          const origImg = await loadImage(pagesToProcess[i]);
          ctx.drawImage(origImg, 0, 0, canvas.width, canvas.height);

          // Scale coordinates
          const containerWidth = containerRef.current?.clientWidth || 400;
          const containerHeight = containerRef.current?.clientHeight || 565;
          const scaleX = canvas.width / containerWidth;
          const scaleY = canvas.height / containerHeight;

          // 3. Signature (only if enabled on page i)
          const sigConfig = signatureConfigs[i];
          if (documents.signature && sigConfig && sigConfig.enabled) {
            const sigImg = await loadImage(documents.signature);
            const sigX = sigConfig.x * scaleX;
            const sigY = sigConfig.y * scaleY;
            const sigSize = sigConfig.size * scaleX;
            ctx.drawImage(sigImg, sigX, sigY, sigSize, sigSize);
          }

          // 4. Stamp (only if enabled on page i)
          const stampConfig = stampConfigs[i];
          if (documents.stamp && stampConfig && stampConfig.enabled) {
            const stampImg = await loadImage(documents.stamp);
            const stampX = stampConfig.x * scaleX;
            const stampY = stampConfig.y * scaleY;
            const stampSize = stampConfig.size * scaleX;
            ctx.drawImage(stampImg, stampX, stampY, stampSize, stampSize);
          }

          const pageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(pageDataUrl, 'JPEG', 0, 0, 210, 297);
        }
      }

      const blob = pdf.output('blob');
      setExportedBlob(blob);
      setIsExported(true);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير المستند: ' + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  const handleShareClick = async () => {
    if (!exportedBlob) return;
    const file = new File([exportedBlob], 'watheeq-certified-document.pdf', { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'مستند موثق عبر وثيق',
          text: 'تم توثيق وتوقيع هذا المستند رسمياً عبر منصة وثيق.',
          files: [file]
        });
        return;
      } catch (err) {
        // User cancelled share
      }
    }
    setShowShareModal(true);
  };

  const handleDownloadFile = () => {
    if (!exportedBlob) return;
    const url = URL.createObjectURL(exportedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watheeq-certified-document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppShare = () => {
    handleDownloadFile();
    const text = encodeURIComponent('مرحباً، تم توثيق المستند رسمياً عبر منصة وثيق 📄✨. تم حفظ الملف على جهازك ويمكنك إرفاقه مباشرة.');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const currentPageOriginal = documents.originalPages[currentPageIndex] || documents.original;
  const currentPageTemplate = getTemplateForPage(currentPageIndex);

  // Count active pages
  const stampActiveCount = Object.values(stampConfigs).filter(c => c.enabled).length;
  const signatureActiveCount = Object.values(signatureConfigs).filter(c => c.enabled).length;

  return (
    <div 
      className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-5xl mx-auto w-full animate-page-enter text-right"
      dir="rtl"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleEndDrag}
      onTouchEnd={handleEndDrag}
    >
      {/* Central Canvas View */}
      <div className="flex-1 w-full flex flex-col items-center">
        
        {/* Top Multi-page Navigation Bar */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-2.5 w-full max-w-[460px] mb-4 bg-white border border-slate-200/90 shadow-sm p-3 rounded-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPageIndex(p => Math.max(0, p - 1))}
                disabled={currentPageIndex === 0}
                className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="الصفحة السابقة"
              >
                <ChevronRight size={18} />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  معاينة صفحة <span className="text-blue-600 font-mono font-black">{currentPageIndex + 1}</span> من <span className="font-mono">{totalPages}</span>
                </span>
              </div>

              <button
                onClick={() => setCurrentPageIndex(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPageIndex === totalPages - 1}
                className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-25 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="الصفحة التالية"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Visual Page Tabs Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 justify-center">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const isCurrent = idx === currentPageIndex;
                const hasStamp = stampConfigs[idx]?.enabled;
                const hasSig = signatureConfigs[idx]?.enabled;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      isCurrent 
                        ? 'bg-blue-600 text-white shadow-sm scale-105' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>ص {idx + 1}</span>
                    <div className="flex items-center gap-0.5">
                      {hasStamp && <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-amber-300' : 'bg-blue-500'}`} title="يحتوي على ختم" />}
                      {hasSig && <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-300' : 'bg-indigo-500'}`} title="يحتوي على توقيع" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* The Live Interactive Canvas Paper */}
        <div 
          ref={containerRef}
          className="relative w-full max-w-[460px] aspect-[210/297] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-300/80 select-none touch-none transition-all duration-300"
        >
          {/* Template */}
          {currentPageTemplate && (
            <img 
              src={currentPageTemplate} 
              alt="Official Letterhead" 
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" 
            />
          )}

          {/* Original Document */}
          {currentPageOriginal && (
            <img 
              src={currentPageOriginal} 
              alt="Document Page" 
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-20"
            />
          )}

          {/* Draggable Stamp (Only if enabled on this page) */}
          {documents.stamp && currentStampConfig.enabled && (
            <div
              style={{
                left: `${currentStampConfig.x}px`,
                top: `${currentStampConfig.y}px`,
                width: `${currentStampConfig.size}px`,
                height: `${currentStampConfig.size}px`,
              }}
              onMouseDown={(e) => handleMouseDown('stamp', e)}
              onTouchStart={(e) => handleTouchStart('stamp', e)}
              className="absolute z-30 cursor-move border-2 border-dashed border-blue-500 hover:border-blue-600 rounded-xl p-1 bg-blue-500/10 hover:bg-blue-500/20 shadow-lg active:scale-95 flex items-center justify-center group canvas-draggable select-none"
            >
              <img 
                src={documents.stamp} 
                alt="Stamp" 
                className="w-full h-full object-contain pointer-events-none" 
              />
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full text-[9px] font-black shadow-sm flex items-center gap-0.5">
                <Stamp size={10} />
                <span>ختم</span>
              </div>
            </div>
          )}

          {/* Draggable Signature (Only if enabled on this page) */}
          {documents.signature && currentSignatureConfig.enabled && (
            <div
              style={{
                left: `${currentSignatureConfig.x}px`,
                top: `${currentSignatureConfig.y}px`,
                width: `${currentSignatureConfig.size}px`,
                height: `${currentSignatureConfig.size}px`,
              }}
              onMouseDown={(e) => handleMouseDown('signature', e)}
              onTouchStart={(e) => handleTouchStart('signature', e)}
              className="absolute z-30 cursor-move border-2 border-dashed border-indigo-500 hover:border-indigo-600 rounded-xl p-1 bg-indigo-500/10 hover:bg-indigo-500/20 shadow-lg active:scale-95 flex items-center justify-center group canvas-draggable select-none"
            >
              <img 
                src={documents.signature} 
                alt="Signature" 
                className="w-full h-full object-contain pointer-events-none" 
              />
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full text-[9px] font-black shadow-sm flex items-center gap-0.5">
                <PenTool size={10} />
                <span>توقيع</span>
              </div>
            </div>
          )}

          {/* Helper overlay badge if neither is enabled on this page */}
          {(!currentStampConfig.enabled && !currentSignatureConfig.enabled) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/80 backdrop-blur-sm text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-md flex items-center gap-2 pointer-events-none animate-fade-in">
              <EyeOff size={13} className="text-amber-400" />
              <span>الختم والتوقيع معطلان في هذه الصفحة</span>
            </div>
          )}
        </div>

        {/* Drag Helper Tip */}
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 font-bold">
          <Sparkles size={14} className="text-blue-600 shrink-0" />
          <span>اسحب الختم والتوقيع بإصبعك أو بالفأرة للمكان المطلوب مباشرة على الصفحة.</span>
        </p>
      </div>

      {/* Control Cards Sidebar */}
      <div className="w-full lg:w-96 flex flex-col gap-4">

        {/* 1. SELECTION OF PAGES FOR STAMP & SIGNATURE (حل مشكلة اختيار الصفحات) */}
        {documents.stamp && (
          <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stamp size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">صفحات الختم</h3>
                  <p className="text-[10px] text-slate-400">تحديد الصفحات المطلوب ظهور الختم بها</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono">
                {stampActiveCount} من {totalPages}
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => applyStampPreset('all')}
                className="text-[11px] font-bold py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                كل الصفحات
              </button>
              <button
                type="button"
                onClick={() => applyStampPreset('last')}
                className="text-[11px] font-bold py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                الأخيرة فقط
              </button>
              <button
                type="button"
                onClick={() => applyStampPreset('first')}
                className="text-[11px] font-bold py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                الأولى فقط
              </button>
            </div>

            {/* Interactive Page Chips Grid */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500">اختر الصفحات يدوياً:</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const isEnabled = stampConfigs[idx]?.enabled ?? false;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleStampForPage(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isEnabled
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isEnabled ? <Check size={12} strokeWidth={3} /> : <span className="w-3" />}
                      <span>صفحة {idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stamp Size Slider */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>حجم الختم</span>
                <span className="font-mono text-blue-600">{Math.round(currentStampConfig.size)}px</span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut size={14} className="text-slate-400" />
                <input 
                  type="range" 
                  min="50" 
                  max="280" 
                  value={currentStampConfig.size}
                  onChange={(e) => handleStampSizeChange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <ZoomIn size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        )}

        {/* 2. SELECTION OF PAGES FOR SIGNATURE (صفحات التوقيع) */}
        {documents.signature && (
          <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PenTool size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">صفحات التوقيع</h3>
                  <p className="text-[10px] text-slate-400">تحديد الصفحات المطلوب ظهور التوقيع بها</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono">
                {signatureActiveCount} من {totalPages}
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => applySignaturePreset('all')}
                className="text-[11px] font-bold py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                كل الصفحات
              </button>
              <button
                type="button"
                onClick={() => applySignaturePreset('last')}
                className="text-[11px] font-bold py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                الأخيرة فقط
              </button>
              <button
                type="button"
                onClick={() => applySignaturePreset('first')}
                className="text-[11px] font-bold py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors cursor-pointer text-center"
              >
                الأولى فقط
              </button>
            </div>

            {/* Interactive Page Chips Grid */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500">اختر الصفحات يدوياً:</span>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const isEnabled = signatureConfigs[idx]?.enabled ?? false;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSignatureForPage(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isEnabled
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {isEnabled ? <Check size={12} strokeWidth={3} /> : <span className="w-3" />}
                      <span>صفحة {idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signature Size Slider */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>حجم التوقيع</span>
                <span className="font-mono text-indigo-600">{Math.round(currentSignatureConfig.size)}px</span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut size={14} className="text-slate-400" />
                <input 
                  type="range" 
                  min="50" 
                  max="280" 
                  value={currentSignatureConfig.size}
                  onChange={(e) => handleSignatureSizeChange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <ZoomIn size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        )}

        {/* Sync Settings */}
        <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-sm flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={syncPositions}
              onChange={(e) => setSyncPositions(e.target.checked)}
              className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded accent-blue-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800">
              مزامنة الموضع والحجم في كافة الصفحات
            </span>
          </label>
          <p className="text-[11px] text-slate-500 leading-relaxed mr-7.5">
            تثبيت موضع الختم والتوقيع تلقائياً في الصفحات المحددة لتكون متطابقة بدقة.
          </p>
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="flex flex-col gap-2.5 mt-1">
          {!isExported ? (
            <>
              {/* Main Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white py-4 px-6 rounded-2xl font-black text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                {isExporting ? (
                  <span className="animate-pulse">جاري دمج وتوثيق الملف...</span>
                ) : (
                  <>
                    <FileCheck size={20} />
                    <span>توثيق المستند وتصديره</span>
                  </>
                )}
              </button>

              {/* Back to Edit Files (Keeps uploaded files) */}
              <button
                onClick={onReset}
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 rounded-2xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <span>العودة لتعديل الملفات الحالية</span>
              </button>

              {/* START TOTALLY NEW FILE BUTTON (المطلوب: زر بصفحة التوثيق عشان ابدأ بملف جديد كليا) */}
              <button
                onClick={() => setShowFreshConfirmModal(true)}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent text-slate-600 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer"
              >
                <FilePlus size={15} />
                <span>بدء ملف جديد كلياً</span>
              </button>
            </>
          ) : (
            /* COMPLETION STATE BUTTONS */
            <div className="flex flex-col gap-3 animate-fade-in-up">
              
              {/* 1. Share Button */}
              <button
                onClick={handleShareClick}
                className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white py-4 px-6 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Share2 size={20} />
                <span>مشاركة المستند</span>
              </button>

              {/* 2. Start Over Button (keeps current files without deleting them) */}
              <button
                onClick={onReset}
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3.5 px-6 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <RefreshCcw size={15} />
                <span>البدء من جديد (مع نفس الملفات)</span>
              </button>

              {/* 3. Start Fresh with new files */}
              <button
                onClick={() => setShowFreshConfirmModal(true)}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                <FilePlus size={15} />
                <span>بدء ملف جديد كلياً</span>
              </button>

            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal for Starting Completely New File */}
      {showFreshConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 relative animate-scale-in text-right">
            <button 
              onClick={() => setShowFreshConfirmModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-slate-600 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <FilePlus size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">بدء ملف جديد كلياً</h3>
                <p className="text-xs text-slate-500 mt-0.5">تفريغ المستند والبدء من جديد</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              هل أنت متأكد من رغبتك في تفريغ ملفات المعاملة الحالية والبدء من جديد لرفع ملفات جديدة كلياً؟
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowFreshConfirmModal(false);
                  onStartFresh();
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-rose-600/20 text-xs cursor-pointer text-center"
              >
                نعم، ابدأ ملفاً جديداً
              </button>

              <button
                onClick={() => setShowFreshConfirmModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-5 rounded-2xl transition-all text-xs cursor-pointer text-center"
              >
                إلغاء والعودة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative animate-scale-in text-right">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-slate-600 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Share2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">مشاركة المستند الموثق</h3>
                <p className="text-xs text-slate-500 mt-0.5">الملف جاهز للإرسال المباشر أو التحميل الفوري</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleWhatsAppShare}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-2xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-3 cursor-pointer text-xs"
              >
                <MessageCircle size={18} />
                <span>إرسال ومشاركة عبر واتساب 📲</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer text-xs"
              >
                <Download size={18} />
                <span>حفظ نسخة PDF على الجهاز 📥</span>
              </button>
            </div>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowShareModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1 cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CanvasEditor;
