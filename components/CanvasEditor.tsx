import React, { useEffect, useRef, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { DocumentState, StampPosition, DocumentFileItem } from '../types';
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
  FileText
} from 'lucide-react';

interface CanvasEditorProps {
  documents: DocumentState;
  onReset: () => void;
}

const A4_RATIO = 210 / 297; // Width / Height

const CanvasEditor: React.FC<CanvasEditorProps> = ({ documents, onReset }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive effective files list
  const effectiveFiles: DocumentFileItem[] = (documents.files && documents.files.length > 0)
    ? documents.files
    : (documents.originalPages.length > 0
        ? [{ id: 'file-1', name: 'ملف 1', pages: documents.originalPages }]
        : []);

  // Multi-file & Multi-page Navigation
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const currentFile = effectiveFiles[activeFileIndex] || effectiveFiles[0];
  const totalPagesInCurrentFile = currentFile?.pages.length || 0;
  const activeKey = `${activeFileIndex}-${currentPageIndex}`;

  // Per-page & per-file configurations for Stamp & Signature
  const [stampConfigs, setStampConfigs] = useState<{ [key: string]: StampPosition }>({});
  const [signatureConfigs, setSignatureConfigs] = useState<{ [key: string]: StampPosition }>({});

  // State for dragging item ('stamp' or 'signature')
  const [draggingItem, setDraggingItem] = useState<'stamp' | 'signature' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Sync coordinates & size across ALL files and pages (Checked by default)
  const [syncPositions, setSyncPositions] = useState(true);

  // Customization
  const [originalOpacity, setOriginalOpacity] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Helper: Get template page for specific global page index
  const getTemplateForPage = (index: number): string | null => {
    if (documents.templatePages.length === 0) return null;
    if (documents.templatePages.length === 1) return documents.templatePages[0];
    if (index < documents.templatePages.length) {
      return documents.templatePages[index];
    }
    return documents.templatePages[documents.templatePages.length - 1];
  };

  // Initialize stamp and signature positions
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const w = width || 400;
      const h = height || 565;

      const defaultStampX = (w / 2) - 65;
      const defaultStampY = h - 150;
      const defaultSignatureX = (w / 2) - 65;
      const defaultSignatureY = h - 260;

      setStampConfigs(prev => {
        const updated = { ...prev };
        effectiveFiles.forEach((file, fIdx) => {
          file.pages.forEach((_, pIdx) => {
            const key = `${fIdx}-${pIdx}`;
            if (!updated[key]) {
              updated[key] = {
                x: defaultStampX,
                y: defaultStampY,
                size: 130,
                enabled: !!documents.stamp
              };
            }
          });
        });
        return updated;
      });

      setSignatureConfigs(prev => {
        const updated = { ...prev };
        effectiveFiles.forEach((file, fIdx) => {
          file.pages.forEach((_, pIdx) => {
            const key = `${fIdx}-${pIdx}`;
            if (!updated[key]) {
              updated[key] = {
                x: defaultSignatureX,
                y: defaultSignatureY,
                size: 130,
                enabled: !!documents.signature
              };
            }
          });
        });
        return updated;
      });
    }
  }, [effectiveFiles, documents.stamp, documents.signature]);

  // Current stamp & signature config for active file and page
  const currentStampConfig = stampConfigs[activeKey] || {
    x: 100,
    y: 350,
    size: 130,
    enabled: false
  };

  const currentSignatureConfig = signatureConfigs[activeKey] || {
    x: 100,
    y: 200,
    size: 130,
    enabled: false
  };

  // Dragging handlers
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
          effectiveFiles.forEach((file, fIdx) => {
            file.pages.forEach((_, pIdx) => {
              const k = `${fIdx}-${pIdx}`;
              updated[k] = { ...updated[k], x: newX, y: newY };
            });
          });
        } else {
          updated[activeKey] = { ...updated[activeKey], x: newX, y: newY };
        }
        return updated;
      });
    } else {
      setSignatureConfigs(prev => {
        const updated = { ...prev };
        if (syncPositions) {
          effectiveFiles.forEach((file, fIdx) => {
            file.pages.forEach((_, pIdx) => {
              const k = `${fIdx}-${pIdx}`;
              updated[k] = { ...updated[k], x: newX, y: newY };
            });
          });
        } else {
          updated[activeKey] = { ...updated[activeKey], x: newX, y: newY };
        }
        return updated;
      });
    }
  }, [draggingItem, dragOffset, currentStampConfig, currentSignatureConfig, activeKey, syncPositions, effectiveFiles]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
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

  // Resizing Stamp
  const handleStampSizeChange = (newSize: number) => {
    setStampConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        effectiveFiles.forEach((file, fIdx) => {
          file.pages.forEach((_, pIdx) => {
            const k = `${fIdx}-${pIdx}`;
            updated[k] = { ...updated[k], size: newSize };
          });
        });
      } else {
        updated[activeKey] = { ...updated[activeKey], size: newSize };
      }
      return updated;
    });
  };

  // Resizing Signature
  const handleSignatureSizeChange = (newSize: number) => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        effectiveFiles.forEach((file, fIdx) => {
          file.pages.forEach((_, pIdx) => {
            const k = `${fIdx}-${pIdx}`;
            updated[k] = { ...updated[k], size: newSize };
          });
        });
      } else {
        updated[activeKey] = { ...updated[activeKey], size: newSize };
      }
      return updated;
    });
  };

  // Enable / Disable Stamp
  const toggleStampEnabled = (enabled: boolean) => {
    setStampConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        effectiveFiles.forEach((file, fIdx) => {
          file.pages.forEach((_, pIdx) => {
            const k = `${fIdx}-${pIdx}`;
            updated[k] = { ...updated[k], enabled };
          });
        });
      } else {
        updated[activeKey] = { ...updated[activeKey], enabled };
      }
      return updated;
    });
  };

  // Enable / Disable Signature
  const toggleSignatureEnabled = (enabled: boolean) => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        effectiveFiles.forEach((file, fIdx) => {
          file.pages.forEach((_, pIdx) => {
            const k = `${fIdx}-${pIdx}`;
            updated[k] = { ...updated[k], enabled };
          });
        });
      } else {
        updated[activeKey] = { ...updated[activeKey], enabled };
      }
      return updated;
    });
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  const handleDownloadSignaturePng = () => {
    if (!documents.signature) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const cvs = document.createElement('canvas');
      cvs.width = img.width;
      cvs.height = img.height;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = cvs.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'توقيع_بخلفية_شفافة.png';
        a.click();
      }
    };
    img.src = documents.signature;
  };

  // High quality multi-file, multi-page PDF generation
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = 210 * 3; 
      const height = 297 * 3;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        alert("تعذر إنشاء بيئة العمل للرسم");
        return;
      }

      const stampImg = documents.stamp ? await loadImage(documents.stamp) : null;
      const sigImg = documents.signature ? await loadImage(documents.signature) : null;

      let globalPageCount = 0;

      for (let fIdx = 0; fIdx < effectiveFiles.length; fIdx++) {
        const fileItem = effectiveFiles[fIdx];
        for (let pIdx = 0; pIdx < fileItem.pages.length; pIdx++) {
          const pageSrc = fileItem.pages[pIdx];
          ctx.clearRect(0, 0, width, height);

          // 1. Template Background
          const templatePageSrc = getTemplateForPage(globalPageCount);
          if (templatePageSrc) {
            try {
              const templateImg = await loadImage(templatePageSrc);
              ctx.drawImage(templateImg, 0, 0, width, height);
            } catch (e) {
              console.error(`Failed to load template page`, e);
            }
          }

          // 2. Original Page Image
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

          const key = `${fIdx}-${pIdx}`;
          const stampConfig = stampConfigs[key] || stampConfigs[`0-0`];
          const sigConfig = signatureConfigs[key] || signatureConfigs[`0-0`];

          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const scaleX = width / containerRect.width;
            const scaleY = height / containerRect.height;

            // 3. Draw Stamp if enabled
            if (stampImg && stampConfig && stampConfig.enabled) {
              const stampX = stampConfig.x * scaleX;
              const stampY = stampConfig.y * scaleY;
              const stampW = stampConfig.size * scaleX;
              const stampH = stampConfig.size * scaleY;
              ctx.drawImage(stampImg, stampX, stampY, stampW, stampH);
            }

            // 4. Draw Signature if enabled
            if (sigImg && sigConfig && sigConfig.enabled) {
              const sigX = sigConfig.x * scaleX;
              const sigY = sigConfig.y * scaleY;
              const sigW = sigConfig.size * scaleX;
              const sigH = sigConfig.size * scaleY;
              ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);
            }
          }

          // 5. Add to PDF
          const imgData = canvas.toDataURL('image/jpeg', 0.90);
          if (globalPageCount > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
          globalPageCount++;
        }
      }

      pdf.save('المستندات_الموثقة.pdf');
    } catch (error) {
      console.error("Export failed", error);
      alert("حدث خطأ أثناء تصدير الملفات الموثقة");
    } finally {
      setIsExporting(false);
    }
  };

  const currentPageImage = currentFile?.pages[currentPageIndex] || null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
      
      {/* Editor Canvas Area */}
      <div className="flex-1 flex flex-col items-center">
        
        {/* Multi-file Tabs (ملف 1, ملف 2, ملف 3...) side-by-side above paper */}
        {effectiveFiles.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3 w-full max-w-[500px]">
            {effectiveFiles.map((fileItem, fileIdx) => (
              <button
                key={fileItem.id || fileIdx}
                type="button"
                onClick={() => {
                  setActiveFileIndex(fileIdx);
                  setCurrentPageIndex(0);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeFileIndex === fileIdx
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-200 ring-2 ring-teal-500 scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                }`}
              >
                <FileText size={16} />
                <span>{fileItem.name || `ملف ${fileIdx + 1}`}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeFileIndex === fileIdx ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {fileItem.pages.length} {fileItem.pages.length === 1 ? 'صفحة' : 'صفحات'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Page Navigation for active file */}
        {totalPagesInCurrentFile > 1 && (
          <div className="flex items-center justify-between w-full max-w-[500px] bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-xs mb-3">
            <button
              onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed rounded-lg text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              السابق &larr;
            </button>
            <span className="text-slate-700 font-bold text-sm">
              الصفحة {currentPageIndex + 1} من {totalPagesInCurrentFile} ({currentFile?.name})
            </span>
            <button
              onClick={() => setCurrentPageIndex(prev => Math.min(totalPagesInCurrentFile - 1, prev + 1))}
              disabled={currentPageIndex === totalPagesInCurrentFile - 1}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed rounded-lg text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              التالي &rarr;
            </button>
          </div>
        )}

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
            {/* Layer 1: Selected Template Background */}
            {getTemplateForPage(currentPageIndex) && (
              <img 
                src={getTemplateForPage(currentPageIndex)!} 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                alt="Template"
              />
            )}

            {/* Layer 2: Original Page - Fitted & Multiplied */}
            {currentPageImage && (
              <img 
                src={currentPageImage} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-multiply"
                style={{ opacity: originalOpacity }}
                alt={`Original Page ${currentPageIndex + 1}`}
              />
            )}

            {/* Layer 3: Dynamic Stamp */}
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
                <div className="absolute inset-0 border-2 border-dashed border-amber-500 opacity-60 group-hover:opacity-100 rounded-lg pointer-events-none transition-all" />
                <div className="absolute top-0 right-0 bg-amber-500 text-white rounded-bl-lg text-[9px] px-1 font-bold pointer-events-none">الختم</div>
              </div>
            )}

            {/* Layer 4: Dynamic Signature */}
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
            <span>أدوات الضبط والمحاذاة</span>
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
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Sync positions toggle */}
          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 mb-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-teal-900 select-none">
              <input 
                type="checkbox" 
                checked={syncPositions}
                onChange={(e) => setSyncPositions(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <span>تطبيق نفس مكان الختم والتوقيع على جميع الصفحات والملفات</span>
            </label>
          </div>
        </div>

        {/* Stamp Controls */}
        {documents.stamp && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Stamp size={18} className="text-amber-500" />
                <span>إعدادات الختم</span>
              </h3>
              
              <button
                type="button"
                onClick={() => toggleStampEnabled(!currentStampConfig.enabled)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentStampConfig.enabled 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {currentStampConfig.enabled ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{currentStampConfig.enabled ? 'مفعل' : 'معطل'}</span>
              </button>
            </div>

            {currentStampConfig.enabled && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block flex justify-between">
                    <span>حجم الختم</span>
                    <span className="font-mono text-xs text-amber-600">{currentStampConfig.size}px</span>
                  </label>
                  <input 
                    type="range" 
                    min="50" 
                    max="250" 
                    value={currentStampConfig.size}
                    onChange={(e) => handleStampSizeChange(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Signature Controls */}
        {documents.signature && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <PenTool size={18} className="text-emerald-600" />
                <span>إعدادات التوقيع</span>
              </h3>
              
              <button
                type="button"
                onClick={() => toggleSignatureEnabled(!currentSignatureConfig.enabled)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSignatureConfig.enabled 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {currentSignatureConfig.enabled ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{currentSignatureConfig.enabled ? 'مفعل' : 'معطل'}</span>
              </button>
            </div>

            {currentSignatureConfig.enabled && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block flex justify-between">
                    <span>حجم التوقيع</span>
                    <span className="font-mono text-xs text-emerald-600">{currentSignatureConfig.size}px</span>
                  </label>
                  <input 
                    type="range" 
                    min="50" 
                    max="250" 
                    value={currentSignatureConfig.size}
                    onChange={(e) => handleSignatureSizeChange(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSignaturePng}
                  className="flex items-center justify-center gap-1.5 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 px-3 rounded-lg border border-emerald-200 transition-colors cursor-pointer mt-1"
                >
                  <Download size={14} className="text-emerald-600" />
                  حفظ/تنزيل التوقيع بخلفية شفافة (PNG)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-auto">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري تصدير PDF الموحد...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>تصدير وحفظ جميع المستندات الموثقة (PDF)</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            disabled={isExporting}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 text-sm"
          >
            <RefreshCcw size={16} />
            <span>توثيق معاملة جديدة</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default CanvasEditor;
