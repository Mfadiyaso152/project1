import React, { useEffect, useRef, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { DocumentState, StampPosition, DocumentFileItem } from '../types';
import { 
  Download, 
  RefreshCcw, 
  Square, 
  CheckSquare, 
  PenTool,
  Stamp,
  FileText,
  Layers,
  FileCheck
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

  // Per-file selected pages state: { [fileIndex: number]: boolean[] }
  const [selectedPages, setSelectedPages] = useState<{ [fileIdx: number]: boolean[] }>({});

  // Sync selectedPages state when effectiveFiles changes
  useEffect(() => {
    setSelectedPages(prev => {
      const updated: { [fileIdx: number]: boolean[] } = {};
      effectiveFiles.forEach((file, fIdx) => {
        const pageCount = file.pages.length;
        if (prev[fIdx] && prev[fIdx].length === pageCount) {
          updated[fIdx] = prev[fIdx];
        } else {
          updated[fIdx] = new Array(pageCount).fill(true);
        }
      });
      return updated;
    });
  }, [effectiveFiles]);

  // Helper: check if a page receives stamp and signature
  const isPageTargeted = useCallback((fileIdx: number, pageIdx: number): boolean => {
    if (!selectedPages[fileIdx]) return true;
    return selectedPages[fileIdx][pageIdx] ?? true;
  }, [selectedPages]);

  const togglePageSelection = (fIdx: number, pIdx: number) => {
    setSelectedPages(prev => {
      const filePages = prev[fIdx] ? [...prev[fIdx]] : new Array(effectiveFiles[fIdx]?.pages.length || 1).fill(true);
      filePages[pIdx] = !filePages[pIdx];
      return { ...prev, [fIdx]: filePages };
    });
  };

  const selectAllPagesForFile = (fIdx: number, val: boolean) => {
    setSelectedPages(prev => {
      const pageCount = effectiveFiles[fIdx]?.pages.length || 0;
      return { ...prev, [fIdx]: new Array(pageCount).fill(val) };
    });
  };

  const selectFirstPageOnlyForFile = (fIdx: number) => {
    setSelectedPages(prev => {
      const pageCount = effectiveFiles[fIdx]?.pages.length || 0;
      const arr = new Array(pageCount).fill(false);
      if (pageCount > 0) arr[0] = true;
      return { ...prev, [fIdx]: arr };
    });
  };

  const selectLastPageOnlyForFile = (fIdx: number) => {
    setSelectedPages(prev => {
      const pageCount = effectiveFiles[fIdx]?.pages.length || 0;
      const arr = new Array(pageCount).fill(false);
      if (pageCount > 0) arr[pageCount - 1] = true;
      return { ...prev, [fIdx]: arr };
    });
  };

  const selectAllAllFiles = (val: boolean) => {
    setSelectedPages(() => {
      const updated: { [fileIdx: number]: boolean[] } = {};
      effectiveFiles.forEach((file, fIdx) => {
        updated[fIdx] = new Array(file.pages.length).fill(val);
      });
      return updated;
    });
  };

  // Per-page & per-file configurations for Stamp & Signature
  const [stampConfigs, setStampConfigs] = useState<{ [key: string]: StampPosition }>({});
  const [signatureConfigs, setSignatureConfigs] = useState<{ [key: string]: StampPosition }>({});

  // State for dragging item ('stamp' or 'signature')
  const [draggingItem, setDraggingItem] = useState<'stamp' | 'signature' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Sync coordinates & size across pages (Checked by default)
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

  // High quality multi-file, multi-page PDF generation (saves each file individually)
  const handleExport = async () => {
    setIsExporting(true);
    try {
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
        const pdf = new jsPDF('p', 'mm', 'a4');

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

          // Check if this page is targeted for stamp and signature
          const targeted = isPageTargeted(fIdx, pIdx, fileItem.pages.length);

          if (targeted && containerRef.current) {
            const key = `${fIdx}-${pIdx}`;
            const stampConfig = stampConfigs[key] || stampConfigs[`0-0`];
            const sigConfig = signatureConfigs[key] || signatureConfigs[`0-0`];

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
          if (pIdx > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
          globalPageCount++;
        }

        // Clean file name
        const cleanName = fileItem.name ? fileItem.name.replace(/\.[^/.]+$/, "") : `ملف_${fIdx + 1}`;
        const outputFileName = `${cleanName}_موثق.pdf`;
        pdf.save(outputFileName);

        if (fIdx < effectiveFiles.length - 1) {
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } catch (error) {
      console.error("Export failed", error);
      alert("حدث خطأ أثناء تصدير الملفات الموثقة");
    } finally {
      setIsExporting(false);
    }
  };

  const currentPageImage = currentFile?.pages[currentPageIndex] || null;
  const isCurrentPageTargeted = isPageTargeted(activeFileIndex, currentPageIndex, totalPagesInCurrentFile);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto font-sans text-right" dir="rtl">
      
      {/* Editor Canvas Area */}
      <div className="flex-1 flex flex-col items-center">
        
        {/* Multi-file Tabs */}
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFileIndex === fileIdx
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <FileText size={14} />
                <span>{fileItem.name || `ملف ${fileIdx + 1}`}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  activeFileIndex === fileIdx ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {fileItem.pages.length} ص
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Page Navigation for active file */}
        {totalPagesInCurrentFile > 1 && (
          <div className="flex items-center justify-between w-full max-w-[500px] bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs mb-3">
            <button
              onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed rounded text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              السابق
            </button>
            <span className="text-slate-800 font-bold text-xs">
              الصفحة {currentPageIndex + 1} من {totalPagesInCurrentFile} ({currentFile?.name})
            </span>
            <button
              onClick={() => setCurrentPageIndex(prev => Math.min(totalPagesInCurrentFile - 1, prev + 1))}
              disabled={currentPageIndex === totalPagesInCurrentFile - 1}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed rounded text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              التالي
            </button>
          </div>
        )}

        <div className="flex-1 flex justify-center bg-slate-200/60 rounded-xl p-4 lg:p-6 border border-slate-300 shadow-inner min-h-[550px] items-center w-full">
          <div 
            ref={containerRef}
            className="relative bg-white shadow-xl transition-all overflow-hidden select-none border border-slate-300"
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

            {/* Layer 3: Dynamic Stamp (Only if page is targeted) */}
            {isCurrentPageTargeted && documents.stamp && currentStampConfig.enabled && (
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
                <div className="absolute inset-0 border-2 border-dashed border-amber-500 opacity-60 group-hover:opacity-100 rounded pointer-events-none transition-all" />
                <div className="absolute top-0 right-0 bg-amber-600 text-white rounded-bl text-[9px] px-1 font-bold pointer-events-none">الختم</div>
              </div>
            )}

            {/* Layer 4: Dynamic Signature (Only if page is targeted) */}
            {isCurrentPageTargeted && documents.signature && currentSignatureConfig.enabled && (
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
                <div className="absolute inset-0 border-2 border-dashed border-emerald-500 opacity-60 group-hover:opacity-100 rounded pointer-events-none transition-all" />
                <div className="absolute top-0 right-0 bg-teal-700 text-white rounded-bl text-[9px] px-1 font-bold pointer-events-none">التوقيع</div>
              </div>
            )}

            {/* Indicator if current page is excluded by targetPageMode */}
            {!isCurrentPageTargeted && (
              <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[11px] font-bold px-2.5 py-1 rounded backdrop-blur-xs shadow">
                استثناء: هذه الصفحة غير مشمولة بالختم والتوقيع
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-5">
        
        {/* Page Scope Selection Section */}
        <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-teal-700" />
              <span>تحديد الصفحات المراد ختمها وتوقيعها</span>
            </h3>

            {effectiveFiles.length > 1 && (
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => selectAllAllFiles(true)}
                  className="text-teal-700 hover:underline cursor-pointer"
                >
                  تحديد الكل
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => selectAllAllFiles(false)}
                  className="text-amber-700 hover:underline cursor-pointer"
                >
                  إلغاء الكل
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            حدد الصفحات المطلوبة لكل ملف (انقر على رقم الصفحة للتفعيل أو الإلغاء):
          </p>

          <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto pr-1">
            {effectiveFiles.map((fileItem, fIdx) => (
              <div key={fileItem.id || fIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={15} className="text-teal-700 flex-shrink-0" />
                    <span className="font-bold text-xs text-slate-800 truncate" title={fileItem.name}>
                      {fileItem.name || `ملف ${fIdx + 1}`}
                    </span>
                    <span className="text-[10px] bg-teal-100/70 text-teal-800 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                      {fileItem.pages.length} {fileItem.pages.length === 1 ? 'صفحة' : 'صفحات'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => selectAllPagesForFile(fIdx, true)}
                      className="text-teal-700 hover:underline cursor-pointer"
                    >
                      الكل
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => selectFirstPageOnlyForFile(fIdx)}
                      className="text-slate-600 hover:underline cursor-pointer"
                    >
                      الأولى
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => selectLastPageOnlyForFile(fIdx)}
                      className="text-slate-600 hover:underline cursor-pointer"
                    >
                      الأخيرة
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => selectAllPagesForFile(fIdx, false)}
                      className="text-amber-700 hover:underline cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {fileItem.pages.map((_, pIdx) => {
                    const isSelected = isPageTargeted(fIdx, pIdx);
                    const isCurrent = activeFileIndex === fIdx && currentPageIndex === pIdx;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          togglePageSelection(fIdx, pIdx);
                          setActiveFileIndex(fIdx);
                          setCurrentPageIndex(pIdx);
                        }}
                        className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                        } ${isCurrent ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
                        title={`صفحة ${pIdx + 1}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-600 cursor-pointer pointer-events-none accent-teal-600"
                        />
                        <span>ص {pIdx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alignment & Transparency Settings */}
        <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200">
          <h3 className="font-bold text-sm text-slate-900 mb-3 border-b border-slate-100 pb-2">
            أدوات الضبط والمحاذاة
          </h3>
          
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-700 mb-1 flex justify-between">
              <span>وضوح المستند الأصلي</span>
              <span className="font-mono text-xs text-teal-700 font-bold">{Math.round(originalOpacity * 100)}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={originalOpacity}
              onChange={(e) => setOriginalOpacity(parseFloat(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input 
                type="checkbox" 
                checked={syncPositions}
                onChange={(e) => setSyncPositions(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700 focus:ring-teal-700 cursor-pointer"
              />
              <span>تثبيت موقع الختم والتوقيع في جميع الصفحات</span>
            </label>
          </div>
        </div>

        {/* Stamp Controls */}
        {documents.stamp && (
          <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Stamp size={16} className="text-amber-600" />
                <span>إعدادات الختم</span>
              </h3>
              
              <button
                type="button"
                onClick={() => toggleStampEnabled(!currentStampConfig.enabled)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  currentStampConfig.enabled 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {currentStampConfig.enabled ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{currentStampConfig.enabled ? 'مفعل' : 'معطل'}</span>
              </button>
            </div>

            {currentStampConfig.enabled && (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 flex justify-between">
                  <span>حجم الختم</span>
                  <span className="font-mono text-xs text-amber-700">{currentStampConfig.size}px</span>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="250" 
                  value={currentStampConfig.size}
                  onChange={(e) => handleStampSizeChange(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Signature Controls */}
        {documents.signature && (
          <div className="bg-white p-5 rounded-xl shadow-2xs border border-slate-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PenTool size={16} className="text-teal-700" />
                <span>إعدادات التوقيع</span>
              </h3>
              
              <button
                type="button"
                onClick={() => toggleSignatureEnabled(!currentSignatureConfig.enabled)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  currentSignatureConfig.enabled 
                    ? 'bg-teal-100 text-teal-900 border border-teal-300' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {currentSignatureConfig.enabled ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{currentSignatureConfig.enabled ? 'مفعل' : 'معطل'}</span>
              </button>
            </div>

            {currentSignatureConfig.enabled && (
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 flex justify-between">
                  <span>حجم التوقيع</span>
                  <span className="font-mono text-xs text-teal-700">{currentSignatureConfig.size}px</span>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="250" 
                  value={currentSignatureConfig.size}
                  onChange={(e) => handleSignatureSizeChange(parseInt(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-auto">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 px-6 rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري حفظ PDF الموحد...</span>
              </>
            ) : (
              <>
                <FileCheck size={18} />
                <span>تصدير وحفظ المستند المعتمد (PDF)</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            disabled={isExporting}
            className="w-full bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300 text-xs"
          >
            <RefreshCcw size={14} />
            <span>معاملة جديدة</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default CanvasEditor;
