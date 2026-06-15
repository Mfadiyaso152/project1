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
  Stamp
} from 'lucide-react';

interface CanvasEditorProps {
  documents: DocumentState;
  onReset: () => void;
}

const A4_RATIO = 210 / 297; // Width / Height

const CanvasEditor: React.FC<CanvasEditorProps> = ({ documents, onReset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Navigation for multi-page documents
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Per-page configurations for Stamp & Signature (position, size, enabled)
  const [stampConfigs, setStampConfigs] = useState<{ [key: number]: StampPosition }>({});
  const [signatureConfigs, setSignatureConfigs] = useState<{ [key: number]: StampPosition }>({});
  
  // State for dragging item ('stamp' or 'signature')
  const [draggingItem, setDraggingItem] = useState<'stamp' | 'signature' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Sync coordinates & size across ALL pages (Checked by default!)
  const [syncPositions, setSyncPositions] = useState(true);
  
  // Customization
  const [originalOpacity, setOriginalOpacity] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Helper: Get template page for specific original page index
  const getTemplateForPage = (index: number): string | null => {
    if (documents.templatePages.length === 0) return null;
    if (documents.templatePages.length === 1) return documents.templatePages[0];
    
    // Multi-page template: match 1-to-1. If indexes exceed, use the last page
    if (index < documents.templatePages.length) {
      return documents.templatePages[index];
    }
    return documents.templatePages[documents.templatePages.length - 1];
  };

  // Initialize/populate stamp and signature positions for each page when documents load
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const w = width || 400;
      const h = height || 565;
      
      const defaultStampX = (w / 2) - 65;
      const defaultStampY = h - 150;

      // Position signature directly above the stamp ("احطه فوق الختم")
      const defaultSignatureX = (w / 2) - 65;
      const defaultSignatureY = h - 260; 

      setStampConfigs(prev => {
        const updated = { ...prev };
        documents.originalPages.forEach((_, idx) => {
          if (!updated[idx]) {
            updated[idx] = {
              x: defaultStampX,
              y: defaultStampY,
              size: 130,
              enabled: !!documents.stamp // Enabled by default if stamp is uploaded
            };
          }
        });
        return updated;
      });

      setSignatureConfigs(prev => {
        const updated = { ...prev };
        documents.originalPages.forEach((_, idx) => {
          if (!updated[idx]) {
            updated[idx] = {
              x: defaultSignatureX,
              y: defaultSignatureY,
              size: 130,
              enabled: !!documents.signature // Enabled by default if signature is uploaded
            };
          }
        });
        return updated;
      });
    }
  }, [documents.originalPages, documents.stamp, documents.signature]);

  // Current stamp & signature config helpers
  const currentStampConfig = stampConfigs[currentPageIndex] || {
    x: 100,
    y: 350,
    size: 130,
    enabled: false
  };

  const currentSignatureConfig = signatureConfigs[currentPageIndex] || {
    x: 100,
    y: 200,
    size: 130,
    enabled: false
  };

  // Generic start dragging handler
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
    // Touch event helper for mobile
    const touch = e.touches[0];
    handleStartDrag(item, touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingItem || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate new position relative to container
    let newX = clientX - containerRect.left - dragOffset.x;
    let newY = clientY - containerRect.top - dragOffset.y;

    // Check bounds
    const activeConfig = draggingItem === 'stamp' ? currentStampConfig : currentSignatureConfig;
    const itemSize = activeConfig.size;
    newX = Math.max(0, Math.min(newX, containerRect.width - itemSize));
    newY = Math.max(0, Math.min(newY, containerRect.height - itemSize));

    if (draggingItem === 'stamp') {
      setStampConfigs(prev => {
        const updated = { ...prev };
        if (syncPositions) {
          documents.originalPages.forEach((_, idx) => {
            updated[idx] = {
              ...updated[idx],
              x: newX,
              y: newY
            };
          });
        } else {
          updated[currentPageIndex] = {
            ...updated[currentPageIndex],
            x: newX,
            y: newY
          };
        }
        return updated;
      });
    } else {
      setSignatureConfigs(prev => {
        const updated = { ...prev };
        if (syncPositions) {
          documents.originalPages.forEach((_, idx) => {
            updated[idx] = {
              ...updated[idx],
              x: newX,
              y: newY
            };
          });
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
  }, [draggingItem, dragOffset, currentStampConfig, currentSignatureConfig, currentPageIndex, syncPositions, documents.originalPages]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      // Prevent mobile default screen scrolling during signature/stamp dragging
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMove]);

  const handleRelease = () => {
    setDraggingItem(null);
  };

  useEffect(() => {
    if (draggingItem) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleRelease);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      window.addEventListener('touchend', handleRelease);
    } else {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleRelease);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleRelease);
    };
  }, [draggingItem, handleGlobalMouseMove, handleGlobalTouchMove]);

  // Handler for resizing Stamp
  const handleStampSizeChange = (newSize: number) => {
    setStampConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        documents.originalPages.forEach((_, idx) => {
          updated[idx] = {
            ...updated[idx],
            size: newSize
          };
        });
      } else {
        updated[currentPageIndex] = {
          ...updated[currentPageIndex],
          size: newSize
        };
      }
      return updated;
    });
  };

  // Handler for resizing Signature
  const handleSignatureSizeChange = (newSize: number) => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        documents.originalPages.forEach((_, idx) => {
          updated[idx] = {
            ...updated[idx],
            size: newSize
          };
        });
      } else {
        updated[currentPageIndex] = {
          ...updated[currentPageIndex],
          size: newSize
        };
      }
      return updated;
    });
  };

  // Toggle Stamp page status
  const toggleStampOnPage = () => {
    setStampConfigs(prev => ({
      ...prev,
      [currentPageIndex]: {
        ...prev[currentPageIndex],
        enabled: !prev[currentPageIndex]?.enabled
      }
    }));
  };

  const togglePageStamp = (idx: number) => {
    setStampConfigs(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        enabled: !prev[idx]?.enabled
      }
    }));
  };

  const enableAllStamps = () => {
    setStampConfigs(prev => {
      const updated = { ...prev };
      documents.originalPages.forEach((_, idx) => {
        if (updated[idx]) updated[idx].enabled = true;
      });
      return updated;
    });
  };

  const disableAllStamps = () => {
    setStampConfigs(prev => {
      const updated = { ...prev };
      documents.originalPages.forEach((_, idx) => {
        if (updated[idx]) updated[idx].enabled = false;
      });
      return updated;
    });
  };

  // Toggle Signature page status
  const toggleSignatureOnPage = () => {
    setSignatureConfigs(prev => ({
      ...prev,
      [currentPageIndex]: {
        ...prev[currentPageIndex],
        enabled: !prev[currentPageIndex]?.enabled
      }
    }));
  };

  const togglePageSignature = (idx: number) => {
    setSignatureConfigs(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        enabled: !prev[idx]?.enabled
      }
    }));
  };

  const enableAllSignatures = () => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      documents.originalPages.forEach((_, idx) => {
        if (updated[idx]) updated[idx].enabled = true;
      });
      return updated;
    });
  };

  const disableAllSignatures = () => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      documents.originalPages.forEach((_, idx) => {
        if (updated[idx]) updated[idx].enabled = false;
      });
      return updated;
    });
  };

  // Copy current page coordinates & size to all other pages manually
  const copyCurrentCoordsToAll = () => {
    const activeStamp = stampConfigs[currentPageIndex];
    const activeSig = signatureConfigs[currentPageIndex];

    if (activeStamp) {
      setStampConfigs(prev => {
        const updated = { ...prev };
        documents.originalPages.forEach((_, idx) => {
          updated[idx] = {
            ...updated[idx],
            x: activeStamp.x,
            y: activeStamp.y,
            size: activeStamp.size
          };
        });
        return updated;
      });
    }

    if (activeSig) {
      setSignatureConfigs(prev => {
        const updated = { ...prev };
        documents.originalPages.forEach((_, idx) => {
          updated[idx] = {
            ...updated[idx],
            x: activeSig.x,
            y: activeSig.y,
            size: activeSig.size
          };
        });
        return updated;
      });
    }
  };

  // Export to PDF Logic support multi-template and multi-page
  const handleExport = async () => {
    if (!canvasRef.current || documents.originalPages.length === 0) return;
    setIsExporting(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A4 dimensions in pixels (high res representation)
    const width = 2480; 
    const height = 3508;
    canvas.width = width;
    canvas.height = height;

    // Loader helper
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    try {
      // Create jsPDF instance
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const stampImg = documents.stamp ? await loadImage(documents.stamp) : null;
      const sigImg = documents.signature ? await loadImage(documents.signature) : null;

      // Loop through all original pages to build multi-page output
      for (let i = 0; i < documents.originalPages.length; i++) {
        const pageSrc = documents.originalPages[i];
        
        // Reset/clear canvas for next page compilation
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Template Background for this page index
        const templatePageSrc = getTemplateForPage(i);
        if (templatePageSrc) {
          try {
            const templateImg = await loadImage(templatePageSrc);
            ctx.drawImage(templateImg, 0, 0, width, height);
          } catch (e) {
            console.error(`Failed to load template page ${i}`, e);
          }
        }

        // 2. Draw Original Image for current page index (Centered/Fitted)
        const originalImg = await loadImage(pageSrc);
        const imgRatio = originalImg.width / originalImg.height;
        const canvasRatio = width / height;
        
        let drawW = width;
        let drawH = height;
        let drawX = 0;
        let drawY = 0;

        if (imgRatio > canvasRatio) {
          drawH = width / imgRatio;
          drawY = (height - drawH) / 2;
        } else {
          drawW = height * imgRatio;
          drawX = (width - drawW) / 2;
        }

        ctx.save();
        ctx.globalAlpha = originalOpacity;
        ctx.globalCompositeOperation = 'multiply'; 
        ctx.drawImage(originalImg, drawX, drawY, drawW, drawH);
        ctx.restore();

        // 3. Draw Stamp (if loaded and enabled for this page)
        const config = stampConfigs[i];
        if (stampImg && config && config.enabled && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const scaleX = width / containerRect.width;
          const scaleY = height / containerRect.height;

          const stampX = config.x * scaleX;
          const stampY = config.y * scaleY;
          const stampW = config.size * scaleX;
          const stampH = config.size * scaleY;

          ctx.drawImage(stampImg, stampX, stampY, stampW, stampH);
        }

        // 4. Draw Signature (if loaded and enabled for this page)
        const sigConfig = signatureConfigs[i];
        if (sigImg && sigConfig && sigConfig.enabled && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const scaleX = width / containerRect.width;
          const scaleY = height / containerRect.height;

          const sigX = sigConfig.x * scaleX;
          const sigY = sigConfig.y * scaleY;
          const sigW = sigConfig.size * scaleX;
          const sigH = sigConfig.size * scaleY;

          ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);
        }

        // 5. Capture Canvas image & Add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.90);
        
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

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
      <div className="flex-1 flex flex-col items-center">
        
        {/* Navigation Indicator / Header */}
        <div className="flex items-center justify-between w-full max-w-[500px] bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-xs mb-4">
          <button
            onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
            disabled={currentPageIndex === 0}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed rounded-lg text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            السابق &larr;
          </button>
          <span className="text-slate-700 font-bold text-sm">
            الصفحة {currentPageIndex + 1} من {documents.originalPages.length}
          </span>
          <button
            onClick={() => setCurrentPageIndex(prev => Math.min(documents.originalPages.length - 1, prev + 1))}
            disabled={currentPageIndex === documents.originalPages.length - 1}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed rounded-lg text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            التالي &rarr;
          </button>
        </div>

        <div className="flex-1 flex justify-center bg-slate-200/50 rounded-xl p-4 lg:p-8 overflow-hidden shadow-inner min-h-[550px] items-center w-full">
          <div 
            ref={containerRef}
            className="relative bg-white shadow-2xl transition-all overflow-hidden select-none"
            style={{
              width: '100%',
              maxWidth: '500px', // Visual width on screen
              aspectRatio: `${A4_RATIO}`,
            }}
          >
            {/* Layer 1: Selected Template Background for current page index */}
            {getTemplateForPage(currentPageIndex) && (
              <img 
                src={getTemplateForPage(currentPageIndex)!} 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                alt="Template"
              />
            )}

            {/* Layer 2: Original Page - Fitted & Multiplied */}
            {documents.originalPages[currentPageIndex] && (
              <img 
                src={documents.originalPages[currentPageIndex]} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-multiply"
                style={{ opacity: originalOpacity }}
                alt={`Original Page ${currentPageIndex + 1}`}
              />
            )}

            {/* Layer 3: Dynamic Stamp (Only drawn if uploaded & active for this page) */}
            {documents.stamp && currentStampConfig.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('stamp', e)}
                onTouchStart={(e) => handleTouchStart('stamp', e)}
                className={`absolute cursor-move select-none group z-10 touch-none ${
                  draggingItem === 'stamp' ? 'opacity-80 scale-102 ring-2 ring-teal-500' : 'opacity-100'
                }`}
                style={{
                  left: currentStampConfig.x,
                  top: currentStampConfig.y,
                  width: currentStampConfig.size,
                  height: currentStampConfig.size,
                }}
              >
                <img 
                  src={documents.stamp} 
                  className="w-full h-full object-contain drop-shadow-md"
                  alt="Stamp"
                />
                {/* Visual border on hover/drag */}
                <div className="absolute inset-0 border-2 border-dashed border-amber-500 opacity-60 group-hover:opacity-100 rounded-lg pointer-events-none transition-all" />
                <div className="absolute top-0 right-0 bg-amber-500 text-white rounded-bl-lg text-[9px] px-1 font-bold pointer-events-none">الختم</div>
              </div>
            )}

            {/* Layer 4: Dynamic Signature (Only drawn if uploaded & active for this page) */}
            {documents.signature && currentSignatureConfig.enabled && (
              <div
                onMouseDown={(e) => handleMouseDown('signature', e)}
                onTouchStart={(e) => handleTouchStart('signature', e)}
                className={`absolute cursor-move select-none group z-20 touch-none ${
                  draggingItem === 'signature' ? 'opacity-80 scale-102 ring-2 ring-emerald-500' : 'opacity-100'
                }`}
                style={{
                  left: currentSignatureConfig.x,
                  top: currentSignatureConfig.y,
                  width: currentSignatureConfig.size,
                  height: currentSignatureConfig.size,
                }}
              >
                <img 
                  src={documents.signature} 
                  className="w-full h-full object-contain drop-shadow-md"
                  alt="Signature"
                />
                {/* Visual border on hover/drag */}
                <div className="absolute inset-0 border-2 border-dashed border-emerald-500 opacity-60 group-hover:opacity-100 rounded-lg pointer-events-none transition-all" />
                <div className="absolute top-0 right-0 bg-emerald-600 text-white rounded-bl-lg text-[9px] px-1 font-bold pointer-events-none font-sans">التوقيع</div>
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        
        {/* Document Global opacity settings */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span>أدوات الملف</span>
          </h3>
          
          {/* Opacity Control */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-600 mb-2 block flex justify-between">
              <span>وضوح المستند الأصلي</span>
              <span className="font-mono text-xs text-teal-600 font-bold">{Math.round(originalOpacity * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={originalOpacity}
              onChange={(e) => setOriginalOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
            <Sparkles className="w-5 h-5 flex-shrink-0 text-cyan-600" />
            <p className="font-medium text-[11px]">
              <span className="text-slate-800 font-bold">ميزة الذكاء الهجينة:</span> يسهل سحب الختم والتوقيع بالإصبع مباشرة على شاشات الجوال لموثوقية لا تضاهى.
            </p>
          </div>
        </div>

        {/* Sync panel switcher */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
          <div className="flex flex-col gap-2 p-3 bg-teal-50/50 rounded-xl border border-teal-100/40">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={syncPositions}
                onChange={(e) => setSyncPositions(e.target.checked)}
                className="w-4.5 h-4.4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 accent-teal-600 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                مزامنة موضع ومكان التوثيق
              </span>
            </label>
            <p className="text-[11px] text-slate-500 leading-normal mr-7.5">
              تثبيت موضع الختم والتوقيع وحجمهما في كافة الصفحات تلقائياً لتكون متطابقة تماماً.
            </p>
            {!syncPositions && (
              <button
                type="button"
                onClick={copyCurrentCoordsToAll}
                className="mt-2 text-xs bg-white hover:bg-slate-50 text-teal-600 border border-slate-200 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy size={12} />
                نسخ موضع هذه الصفحة للجميع
              </button>
            )}
          </div>
        </div>

        {/* Sync & Target Stamp selection Section */}
        {documents.stamp && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Stamp size={18} className="text-amber-500" />
              <span>إعدادات الختم الرقمي</span>
            </h4>

            {/* Size resize details */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-[11px] font-semibold text-slate-600 mb-2 block flex justify-between">
                <span>حجم الختم (الحالي)</span>
                <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-teal-700">
                  {Math.round(currentStampConfig.size)}px
                </span>
              </label>
              <div className="flex items-center gap-2">
                <ZoomOut size={16} className="text-slate-400" />
                <input 
                  type="range" 
                  min="50" 
                  max="300" 
                  value={currentStampConfig.size}
                  onChange={(e) => handleStampSizeChange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <ZoomIn size={16} className="text-slate-400" />
              </div>
            </div>

            {/* Target Stamp page checkboxes list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600">اختيار صفحات تطبيق الختم:</span>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={enableAllStamps}
                    className="text-[10px] text-teal-600 hover:underline font-bold bg-none cursor-pointer"
                  >
                    الكل
                  </button>
                  <span className="text-[10px] text-slate-300">|</span>
                  <button 
                    type="button" 
                    onClick={disableAllStamps}
                    className="text-[10px] text-red-600 hover:underline font-bold bg-none cursor-pointer"
                  >
                    لا أحد
                  </button>
                </div>
              </div>

              {/* Scrollable pages container */}
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                {documents.originalPages.map((_, idx) => {
                  const stampOnThisPage = stampConfigs[idx]?.enabled ?? false;
                  return (
                    <div 
                      key={idx}
                      onClick={() => togglePageStamp(idx)}
                      className={`flex items-center justify-between p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        idx === currentPageIndex 
                          ? 'bg-teal-50/70 border-teal-200 font-bold' 
                          : 'bg-white border-transparent hover:bg-slate-100/50'
                      }`}
                    >
                      <span>صفحة {idx + 1}</span>
                      {stampOnThisPage ? (
                        <CheckSquare size={14} className="text-emerald-600" />
                      ) : (
                        <Square size={14} className="text-slate-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sync & Target Signature selection Section */}
        {documents.signature && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <PenTool size={18} className="text-emerald-600" />
              <span>إعدادات التوقيع الإلكتروني</span>
            </h4>

            {/* Size resize details */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-[11px] font-semibold text-slate-600 mb-2 block flex justify-between">
                <span>حجم التوقيع (الحالي)</span>
                <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-700">
                  {Math.round(currentSignatureConfig.size)}px
                </span>
              </label>
              <div className="flex items-center gap-2">
                <ZoomOut size={16} className="text-slate-400" />
                <input 
                  type="range" 
                  min="50" 
                  max="300" 
                  value={currentSignatureConfig.size}
                  onChange={(e) => handleSignatureSizeChange(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <ZoomIn size={16} className="text-slate-400" />
              </div>
            </div>

            {/* Target Signature page checkboxes list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600">صفحات وضع التوقيع:</span>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={enableAllSignatures}
                    className="text-[10px] text-emerald-600 hover:underline font-bold bg-none cursor-pointer"
                  >
                    الكل
                  </button>
                  <span className="text-[10px] text-slate-300">|</span>
                  <button 
                    type="button" 
                    onClick={disableAllSignatures}
                    className="text-[10px] text-red-600 hover:underline font-bold bg-none cursor-pointer"
                  >
                    لا أحد
                  </button>
                </div>
              </div>

              {/* Scrollable pages container */}
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                {documents.originalPages.map((_, idx) => {
                  const sigOnThisPage = signatureConfigs[idx]?.enabled ?? false;
                  return (
                    <div 
                      key={idx}
                      onClick={() => togglePageSignature(idx)}
                      className={`flex items-center justify-between p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        idx === currentPageIndex 
                          ? 'bg-emerald-50/70 border-emerald-200 font-bold' 
                          : 'bg-white border-transparent hover:bg-slate-100/50'
                      }`}
                    >
                      <span>صفحة {idx + 1}</span>
                      {sigOnThisPage ? (
                        <CheckSquare size={14} className="text-emerald-600" />
                      ) : (
                        <Square size={14} className="text-slate-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Fallback alerts if stamp & signature are missing */}
        {!documents.stamp && !documents.signature && (
          <div className="bg-white p-5 rounded-xl border border-slate-100">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <p>لم يتم رفع أي ختم أو توقيع، سيتم تصدير مستنداتك مدمجة بنجاح مع الورقة الرسمية وحفظها كملف PDF نظيف.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] cursor-pointer"
          >
            {isExporting ? (
              <span className="animate-pulse">جاري دمج وتصدير الصفحات...</span>
            ) : (
              <>
                <Download size={20} />
                تصدير ملف PDF النهائي
              </>
            )}
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium transition-colors cursor-pointer"
          >
            <RefreshCcw size={18} />
            أبدأ من جديد
          </button>
        </div>

      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CanvasEditor;
