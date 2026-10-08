import React, { useEffect, useRef, useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { DocumentState, StampPosition, User } from '../types';
import { 
  Move, 
  Download, 
  RefreshCcw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  PenTool,
  Stamp,
  Share2,
  X,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  FilePlus,
  BookmarkCheck,
  Upload,
  RotateCcw,
  PlusCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import SignaturePad from './SignaturePad';
import { saveUserAsset } from '../authService';

interface CanvasEditorProps {
  documents: DocumentState;
  onReset: () => void;
  onStartFresh: () => void;
  currentUser?: User | null;
  onUpdateDocs?: (updater: (prev: DocumentState) => DocumentState) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ 
  documents, 
  onReset, 
  onStartFresh,
  currentUser,
  onUpdateDocs
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);
  const sigFileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [isDrawingSigModal, setIsDrawingSigModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalPages = documents.originalPages.length || (documents.original ? 1 : 0);

  const getTemplateForPage = (index: number): string | null => {
    if (documents.templatePages.length === 0) return documents.template || null;
    if (documents.templatePages.length === 1) return documents.templatePages[0];
    if (index < documents.templatePages.length) {
      return documents.templatePages[index];
    }
    return documents.templatePages[documents.templatePages.length - 1];
  };

  // Safe, clamped dimensions & coordinates calculator that NEVER allows off-screen or negative positions
  const getSafeDimensions = useCallback(() => {
    const el = containerRef.current;
    const w = (el && el.clientWidth > 50) ? el.clientWidth : 420;
    const h = (el && el.clientHeight > 50) ? el.clientHeight : Math.round(w * (297 / 210));
    return { w, h };
  }, []);

  const getSafeStampConfig = useCallback((pageIdx: number): StampPosition => {
    const { w, h } = getSafeDimensions();
    const saved = stampConfigs[pageIdx];
    const size = saved?.size || 130;

    // Default position: lower right area (traditional placement for official stamps in Arabic documents)
    const defaultX = Math.round(w * 0.12);
    const defaultY = Math.max(10, Math.round(h - size - 36));

    let x = (saved?.x !== undefined && !isNaN(saved.x)) ? saved.x : defaultX;
    let y = (saved?.y !== undefined && !isNaN(saved.y)) ? saved.y : defaultY;

    // Strict clamping within visible paper
    x = Math.max(8, Math.min(x, w - size - 8));
    y = Math.max(8, Math.min(y, h - size - 8));

    return {
      x,
      y,
      size,
      enabled: saved?.enabled !== undefined ? saved.enabled : !!documents.stamp
    };
  }, [stampConfigs, getSafeDimensions, documents.stamp]);

  const getSafeSignatureConfig = useCallback((pageIdx: number): StampPosition => {
    const { w, h } = getSafeDimensions();
    const saved = signatureConfigs[pageIdx];
    const size = saved?.size || 130;

    // Default position: lower left area (traditional placement for signature in Arabic documents)
    const defaultX = Math.max(10, Math.round(w - size - (w * 0.12)));
    const defaultY = Math.max(10, Math.round(h - size - 36));

    let x = (saved?.x !== undefined && !isNaN(saved.x)) ? saved.x : defaultX;
    let y = (saved?.y !== undefined && !isNaN(saved.y)) ? saved.y : defaultY;

    // Strict clamping within visible paper
    x = Math.max(8, Math.min(x, w - size - 8));
    y = Math.max(8, Math.min(y, h - size - 8));

    return {
      x,
      y,
      size,
      enabled: saved?.enabled !== undefined ? saved.enabled : !!documents.signature
    };
  }, [signatureConfigs, getSafeDimensions, documents.signature]);

  // Keep configs updated across all pages
  useEffect(() => {
    const pageCount = Math.max(1, totalPages);
    setStampConfigs(prev => {
      const next = { ...prev };
      for (let i = 0; i < pageCount; i++) {
        if (!next[i]) {
          const safe = getSafeStampConfig(i);
          next[i] = safe;
        } else if (documents.stamp && next[i].enabled === false && prev[i] === undefined) {
          next[i].enabled = true;
        }
      }
      return next;
    });

    setSignatureConfigs(prev => {
      const next = { ...prev };
      for (let i = 0; i < pageCount; i++) {
        if (!next[i]) {
          const safe = getSafeSignatureConfig(i);
          next[i] = safe;
        } else if (documents.signature && next[i].enabled === false && prev[i] === undefined) {
          next[i].enabled = true;
        }
      }
      return next;
    });
  }, [totalPages, documents.stamp, documents.signature, getSafeStampConfig, getSafeSignatureConfig]);

  const currentStampConfig = getSafeStampConfig(currentPageIndex);
  const currentSignatureConfig = getSafeSignatureConfig(currentPageIndex);

  // Toggle Stamp for a specific page
  const toggleStampForPage = (pageIdx: number) => {
    setStampConfigs(prev => {
      const current = getSafeStampConfig(pageIdx);
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
      const current = getSafeSignatureConfig(pageIdx);
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
        const existing = getSafeStampConfig(i);
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
        const existing = getSafeSignatureConfig(i);
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

  // Preset location buttons (أسفل اليمين، أسفل الوسط، أسفل اليسار، استعادة الموضع)
  const setPresetPosition = (item: 'stamp' | 'signature', pos: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'center') => {
    const { w, h } = getSafeDimensions();
    const config = item === 'stamp' ? currentStampConfig : currentSignatureConfig;
    const size = config.size;

    let targetX = config.x;
    let targetY = config.y;

    if (pos === 'bottom-right') {
      targetX = 24;
      targetY = h - size - 28;
    } else if (pos === 'bottom-center') {
      targetX = Math.round((w - size) / 2);
      targetY = h - size - 28;
    } else if (pos === 'bottom-left') {
      targetX = w - size - 24;
      targetY = h - size - 28;
    } else if (pos === 'center') {
      targetX = Math.round((w - size) / 2);
      targetY = Math.round((h - size) / 2);
    }

    targetX = Math.max(8, Math.min(targetX, w - size - 8));
    targetY = Math.max(8, Math.min(targetY, h - size - 8));

    if (item === 'stamp') {
      setStampConfigs(prev => {
        const updated = { ...prev };
        if (syncPositions) {
          for (let i = 0; i < totalPages; i++) {
            updated[i] = {
              ...getSafeStampConfig(i),
              x: targetX,
              y: targetY,
              enabled: updated[i]?.enabled ?? true
            };
          }
        } else {
          updated[currentPageIndex] = {
            ...currentStampConfig,
            x: targetX,
            y: targetY,
            enabled: true
          };
        }
        return updated;
      });
    } else {
      setSignatureConfigs(prev => {
        const updated = { ...prev };
        if (syncPositions) {
          for (let i = 0; i < totalPages; i++) {
            updated[i] = {
              ...getSafeSignatureConfig(i),
              x: targetX,
              y: targetY,
              enabled: updated[i]?.enabled ?? true
            };
          }
        } else {
          updated[currentPageIndex] = {
            ...currentSignatureConfig,
            x: targetX,
            y: targetY,
            enabled: true
          };
        }
        return updated;
      });
    }
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
              ...(updated[idx] || getSafeStampConfig(idx)),
              x: newX,
              y: newY,
              size: activeConfig.size,
              enabled: updated[idx]?.enabled ?? true
            };
          }
        } else {
          updated[currentPageIndex] = {
            ...getSafeStampConfig(currentPageIndex),
            x: newX,
            y: newY,
            enabled: true
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
              ...(updated[idx] || getSafeSignatureConfig(idx)),
              x: newX,
              y: newY,
              size: activeConfig.size,
              enabled: updated[idx]?.enabled ?? true
            };
          }
        } else {
          updated[currentPageIndex] = {
            ...getSafeSignatureConfig(currentPageIndex),
            x: newX,
            y: newY,
            enabled: true
          };
        }
        return updated;
      });
    }
  }, [draggingItem, dragOffset, currentStampConfig, currentSignatureConfig, syncPositions, totalPages, currentPageIndex, getSafeStampConfig, getSafeSignatureConfig]);

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
          updated[idx] = {
            ...(updated[idx] || getSafeStampConfig(idx)),
            size: newSize
          };
        }
      } else {
        updated[currentPageIndex] = {
          ...getSafeStampConfig(currentPageIndex),
          size: newSize
        };
      }
      return updated;
    });
  };

  const handleSignatureSizeChange = (newSize: number) => {
    setSignatureConfigs(prev => {
      const updated = { ...prev };
      if (syncPositions) {
        for (let idx = 0; idx < totalPages; idx++) {
          updated[idx] = {
            ...(updated[idx] || getSafeSignatureConfig(idx)),
            size: newSize
          };
        }
      } else {
        updated[currentPageIndex] = {
          ...getSafeSignatureConfig(currentPageIndex),
          size: newSize
        };
      }
      return updated;
    });
  };

  // Load Saved Asset from User Account directly into Editor
  const handleUseSavedAssetInEditor = (type: 'stamp' | 'signature') => {
    if (!currentUser?.savedAssets?.[type]) {
      showToast('لا يوجد أصل محفوظ لهذا الحساب حالياً');
      return;
    }
    const assetUrl = currentUser.savedAssets[type]!;
    if (onUpdateDocs) {
      onUpdateDocs(prev => ({
        ...prev,
        [type]: assetUrl
      }));
    }
    // Ensure enabled is true
    if (type === 'stamp') {
      applyStampPreset('all');
      showToast('تم إدراج الختم المحفوظ وتثبيته في الموضع بنجاح ✅');
    } else {
      applySignaturePreset('all');
      showToast('تم إدراج التوقيع المحفوظ وتثبيته في الموضع بنجاح ✅');
    }
  };

  // File Upload Helper within Editor
  const handleFileUploadInEditor = (type: 'stamp' | 'signature', file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) throw new Error("مكتبة معالجة PDF قيد التحميل");
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const dataUrl = canvas.toDataURL('image/png');
            if (onUpdateDocs) {
              onUpdateDocs(prev => ({ ...prev, [type]: dataUrl }));
            }
            if (type === 'stamp') applyStampPreset('all');
            else applySignaturePreset('all');
            showToast(`تم تعيين ${type === 'stamp' ? 'الختم' : 'التوقيع'} بنجاح ✅`);
          }
        } catch (e: any) {
          showToast('حدث خطأ أثناء معالجة الملف: ' + (e?.message || e));
        }
      };
      fileReader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && onUpdateDocs) {
          const dataUrl = e.target.result as string;
          onUpdateDocs(prev => ({ ...prev, [type]: dataUrl }));
          if (type === 'stamp') applyStampPreset('all');
          else applySignaturePreset('all');
          showToast(`تم تعيين ${type === 'stamp' ? 'الختم' : 'التوقيع'} بنجاح ✅`);
        }
      };
      reader.readAsDataURL(file);
    }
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

      const { w: containerWidth, h: containerHeight } = getSafeDimensions();

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
          const scaleX = canvas.width / containerWidth;
          const scaleY = canvas.height / containerHeight;

          // 3. Stamp (only if enabled on page i)
          const stampConfig = getSafeStampConfig(i);
          if (documents.stamp && stampConfig.enabled) {
            const stampImg = await loadImage(documents.stamp);
            const stampX = stampConfig.x * scaleX;
            const stampY = stampConfig.y * scaleY;
            const stampSize = stampConfig.size * scaleX;
            ctx.drawImage(stampImg, stampX, stampY, stampSize, stampSize);
          }

          // 4. Signature (only if enabled on page i)
          const sigConfig = getSafeSignatureConfig(i);
          if (documents.signature && sigConfig.enabled) {
            const sigImg = await loadImage(documents.signature);
            const sigX = sigConfig.x * scaleX;
            const sigY = sigConfig.y * scaleY;
            const sigSize = sigConfig.size * scaleX;
            ctx.drawImage(sigImg, sigX, sigY, sigSize, sigSize);
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

  const currentPageOriginal = documents.originalPages[currentPageIndex] || documents.original;
  const currentPageTemplate = getTemplateForPage(currentPageIndex);

  // Active counts
  const stampActiveCount = Object.keys(stampConfigs).length > 0 
    ? Array.from({ length: totalPages }).filter((_, i) => getSafeStampConfig(i).enabled).length 
    : (documents.stamp ? totalPages : 0);

  const signatureActiveCount = Object.keys(signatureConfigs).length > 0 
    ? Array.from({ length: totalPages }).filter((_, i) => getSafeSignatureConfig(i).enabled).length 
    : (documents.signature ? totalPages : 0);

  return (
    <div 
      className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-5xl mx-auto w-full animate-page-enter text-right relative"
      dir="rtl"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleEndDrag}
      onTouchEnd={handleEndDrag}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-xl text-xs font-bold backdrop-blur-md animate-fade-in flex items-center gap-2 border border-slate-700">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs for in-editor upload */}
      <input 
        ref={stampFileInputRef} 
        type="file" 
        accept="image/png, image/jpeg, application/pdf" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUploadInEditor('stamp', e.target.files[0]);
        }} 
      />
      <input 
        ref={sigFileInputRef} 
        type="file" 
        accept="image/png, image/jpeg, application/pdf" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUploadInEditor('signature', e.target.files[0]);
        }} 
      />

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
                const hasStamp = getSafeStampConfig(idx).enabled && !!documents.stamp;
                const hasSig = getSafeSignatureConfig(idx).enabled && !!documents.signature;
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
          className="relative w-full max-w-[460px] aspect-[210/297] min-h-[480px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-300/80 select-none touch-none transition-all duration-300"
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

          {/* Draggable Stamp (Clearly visible and interactive) */}
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
              className={`absolute cursor-move border-2 border-dashed border-blue-500 hover:border-blue-600 rounded-xl p-1 bg-blue-500/10 hover:bg-blue-500/20 shadow-lg active:scale-95 flex items-center justify-center group select-none transition-[border-color,background-color] ${
                draggingItem === 'stamp' ? 'z-40 ring-4 ring-blue-500/30' : 'z-30'
              }`}
            >
              <img 
                src={documents.stamp} 
                alt="Stamp" 
                className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm" 
              />
              <div className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-md flex items-center gap-1 select-none pointer-events-none">
                <Stamp size={10} />
                <span>ختم</span>
              </div>
            </div>
          )}

          {/* Draggable Signature (Clearly visible and interactive) */}
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
              className={`absolute cursor-move border-2 border-dashed border-indigo-500 hover:border-indigo-600 rounded-xl p-1 bg-indigo-500/10 hover:bg-indigo-500/20 shadow-lg active:scale-95 flex items-center justify-center group select-none transition-[border-color,background-color] ${
                draggingItem === 'signature' ? 'z-40 ring-4 ring-indigo-500/30' : 'z-30'
              }`}
            >
              <img 
                src={documents.signature} 
                alt="Signature" 
                className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm" 
              />
              <div className="absolute -top-2.5 -right-2.5 bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-md flex items-center gap-1 select-none pointer-events-none">
                <PenTool size={10} />
                <span>توقيع</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Cards Sidebar */}
      <div className="w-full lg:w-96 flex flex-col gap-4">

        {/* 1. STAMP MANAGEMENT CARD */}
        {documents.stamp ? (
          <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stamp size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">الختم الرسمي</h3>
                  <p className="text-[10px] text-slate-400">تحديد الصفحات والموضع بدقة</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono">
                  {stampActiveCount} من {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => toggleStampForPage(currentPageIndex)}
                  title={currentStampConfig.enabled ? "إخفاء الختم من هذه الصفحة" : "إظهار الختم على هذه الصفحة"}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    currentStampConfig.enabled 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                >
                  {currentStampConfig.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>
            </div>

            {/* Quick Presets for Target Pages */}
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
                  const isEnabled = getSafeStampConfig(idx).enabled;
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

            {/* Quick 1-tap Location Presets */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">موضع الختم السريع:</span>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setPresetPosition('stamp', 'bottom-right')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  أسفل اليمين
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPosition('stamp', 'bottom-center')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  أسفل الوسط
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPosition('stamp', 'bottom-left')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  أسفل اليسار
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPosition('stamp', 'center')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  توسيط
                </button>
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

            {/* Replace / Remove Stamp actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => stampFileInputRef.current?.click()}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Upload size={12} />
                <span>تغيير صورة الختم</span>
              </button>
              {onUpdateDocs && (
                <button
                  type="button"
                  onClick={() => onUpdateDocs(prev => ({ ...prev, stamp: null }))}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                >
                  حذف الختم
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Card if stamp is not uploaded yet */
          <div className="bg-white border border-dashed border-blue-200 p-5 rounded-3xl shadow-sm flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Stamp size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">إضافة الختم الرسمي</h3>
                <p className="text-[10px] text-slate-400">لم يتم اختيار ختم لهذا المستند بعد</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {currentUser?.savedAssets?.stamp && (
                <button
                  type="button"
                  onClick={() => handleUseSavedAssetInEditor('stamp')}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-blue-200"
                >
                  <BookmarkCheck size={14} />
                  <span>استخدام الختم المحفوظ بحسابك</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => stampFileInputRef.current?.click()}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload size={13} />
                <span>رفع ختم من جهازك (صورة أو PDF)</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. SIGNATURE MANAGEMENT CARD */}
        {documents.signature ? (
          <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PenTool size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">التوقيع الرسمي</h3>
                  <p className="text-[10px] text-slate-400">تحديد الصفحات والموضع بدقة</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono">
                  {signatureActiveCount} من {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSignatureForPage(currentPageIndex)}
                  title={currentSignatureConfig.enabled ? "إخفاء التوقيع من هذه الصفحة" : "إظهار التوقيع على هذه الصفحة"}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    currentSignatureConfig.enabled 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                >
                  {currentSignatureConfig.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>
            </div>

            {/* Quick Presets for Target Pages */}
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
                  const isEnabled = getSafeSignatureConfig(idx).enabled;
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

            {/* Quick 1-tap Location Presets */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">موضع التوقيع السريع:</span>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setPresetPosition('signature', 'bottom-right')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  أسفل اليمين
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPosition('signature', 'bottom-center')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  أسفل الوسط
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPosition('signature', 'bottom-left')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  أسفل اليسار
                </button>
                <button
                  type="button"
                  onClick={() => setPresetPosition('signature', 'center')}
                  className="text-[10px] font-bold py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200 transition-colors cursor-pointer text-center"
                >
                  توسيط
                </button>
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

            {/* Redraw / Remove Signature actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDrawingSigModal(true)} 
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <PenTool size={12} />
                  <span>إعادة رسم التوقيع</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => sigFileInputRef.current?.click()} 
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={12} />
                  <span>رفع صورة</span>
                </button>
              </div>
              {onUpdateDocs && (
                <button
                  type="button"
                  onClick={() => onUpdateDocs(prev => ({ ...prev, signature: null }))}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                >
                  حذف التوقيع
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Card if signature is not uploaded yet */
          <div className="bg-white border border-dashed border-indigo-200 p-5 rounded-3xl shadow-sm flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <PenTool size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">إضافة التوقيع الرسمي</h3>
                <p className="text-[10px] text-slate-400">لم يتم اختيار توقيع لهذا المستند بعد</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {currentUser?.savedAssets?.signature && (
                <button
                  type="button"
                  onClick={() => handleUseSavedAssetInEditor('signature')}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-indigo-200"
                >
                  <BookmarkCheck size={14} />
                  <span>استخدام التوقيع المحفوظ بحسابك</span>
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawingSigModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <PenTool size={13} />
                  <span>رسم توقيعك ✍️</span>
                </button>
                <button
                  type="button"
                  onClick={() => sigFileInputRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={13} />
                  <span>رفع صورة</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sync Settings */}
        <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-sm flex items-center justify-between">
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

              {/* Start completely new file button */}
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

              {/* 2. Download File Button */}
              <button
                onClick={handleDownloadFile}
                className="flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>تحميل المستند الموثق (PDF)</span>
              </button>

              {/* 3. Start Over Button (keeps current files) */}
              <button
                onClick={onReset}
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3.5 px-6 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <RefreshCcw size={15} />
                <span>البدء من جديد (مع نفس الملفات)</span>
              </button>

              {/* 4. Start Fresh with new files */}
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

      {/* Signature Pad Modal inside Editor */}
      {isDrawingSigModal && (
        <SignaturePad
          onSave={(dataUrl) => {
            if (onUpdateDocs) {
              onUpdateDocs(prev => ({ ...prev, signature: dataUrl }));
            }
            applySignaturePreset('all');
            setIsDrawingSigModal(false);
            showToast('تم اعتماد التوقيع الحي وإدراجه بنجاح ✅');
          }}
          onClose={() => setIsDrawingSigModal(false)}
        />
      )}

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
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl transition-all text-xs cursor-pointer text-center"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 relative animate-scale-in text-right">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Share2 size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-900">مشاركة المستند الموثق</h3>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  handleDownloadFile();
                  setShowShareModal(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Download size={14} />
                <span>تحميل وحفظ في الجهاز</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CanvasEditor;
