import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
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
  EyeOff,
  Layers,
  Trash2,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import SignaturePad from './SignaturePad';
import { saveUserAsset, saveDocumentToFirestore } from '../authService';

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
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [stampConfigs, setStampConfigs] = useState<{ [key: number]: StampPosition }>({});
  const [signatureConfigs, setSignatureConfigs] = useState<{ [key: number]: StampPosition }>({});
  const [mergeMode, setMergeMode] = useState<'overlay' | 'append'>('overlay');
  
  const [draggingItem, setDraggingItem] = useState<'stamp' | 'signature' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [syncPositions, setSyncPositions] = useState(true);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [isExported, setIsExported] = useState(false);
  const [cloudSavedDocId, setCloudSavedDocId] = useState<string | null>(null);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
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

  const disabledStampPagesRef = useRef<Set<number>>(new Set());
  const disabledSigPagesRef = useRef<Set<number>>(new Set());

  // Standalone computation of initial default stamp placement (zero dependency on state to avoid loops)
  const computeDefaultStamp = useCallback((): StampPosition => {
    const { w, h } = getSafeDimensions();
    const size = 130;
    const defaultX = Math.round(w * 0.12);
    const defaultY = Math.max(10, Math.round(h - size - 36));
    const x = Math.max(8, Math.min(defaultX, w - size - 8));
    const y = Math.max(8, Math.min(defaultY, h - size - 8));
    return { x, y, size, enabled: true };
  }, [getSafeDimensions]);

  // Standalone computation of initial default signature placement (zero dependency on state to avoid loops)
  const computeDefaultSignature = useCallback((): StampPosition => {
    const { w, h } = getSafeDimensions();
    const size = 130;
    const defaultX = Math.max(10, Math.round(w - size - (w * 0.12)));
    const defaultY = Math.max(10, Math.round(h - size - 36));
    const x = Math.max(8, Math.min(defaultX, w - size - 8));
    const y = Math.max(8, Math.min(defaultY, h - size - 8));
    return { x, y, size, enabled: true };
  }, [getSafeDimensions]);

  const getSafeStampConfig = useCallback((pageIdx: number): StampPosition => {
    const saved = stampConfigs[pageIdx];
    if (saved) return saved;
    return computeDefaultStamp();
  }, [stampConfigs, computeDefaultStamp]);

  const getSafeSignatureConfig = useCallback((pageIdx: number): StampPosition => {
    const saved = signatureConfigs[pageIdx];
    if (saved) return saved;
    return computeDefaultSignature();
  }, [signatureConfigs, computeDefaultSignature]);

  // Keep configs updated across all pages WITHOUT infinite dependency loop
  useEffect(() => {
    const pageCount = Math.max(1, totalPages);
    setStampConfigs(prev => {
      let changed = false;
      const next = { ...prev };
      for (let i = 0; i < pageCount; i++) {
        if (!next[i]) {
          next[i] = computeDefaultStamp();
          changed = true;
        } else if (documents.stamp && !next[i].enabled && !disabledStampPagesRef.current.has(i)) {
          next[i] = { ...next[i], enabled: true };
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    setSignatureConfigs(prev => {
      let changed = false;
      const next = { ...prev };
      for (let i = 0; i < pageCount; i++) {
        if (!next[i]) {
          next[i] = computeDefaultSignature();
          changed = true;
        } else if (documents.signature && !next[i].enabled && !disabledSigPagesRef.current.has(i)) {
          next[i] = { ...next[i], enabled: true };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [totalPages, documents.stamp, documents.signature, computeDefaultStamp, computeDefaultSignature]);

  const currentStampConfig = getSafeStampConfig(currentPageIndex);
  const currentSignatureConfig = getSafeSignatureConfig(currentPageIndex);

  // Toggle Stamp for a specific page
  const toggleStampForPage = (pageIdx: number) => {
    setStampConfigs(prev => {
      const current = getSafeStampConfig(pageIdx);
      const nextEnabled = !current.enabled;
      if (!nextEnabled) {
        disabledStampPagesRef.current.add(pageIdx);
      } else {
        disabledStampPagesRef.current.delete(pageIdx);
      }
      return {
        ...prev,
        [pageIdx]: {
          ...current,
          enabled: nextEnabled
        }
      };
    });
  };

  // Toggle Signature for a specific page
  const toggleSignatureForPage = (pageIdx: number) => {
    setSignatureConfigs(prev => {
      const current = getSafeSignatureConfig(pageIdx);
      const nextEnabled = !current.enabled;
      if (!nextEnabled) {
        disabledSigPagesRef.current.add(pageIdx);
      } else {
        disabledSigPagesRef.current.delete(pageIdx);
      }
      return {
        ...prev,
        [pageIdx]: {
          ...current,
          enabled: nextEnabled
        }
      };
    });
  };

  // Apply Stamp Presets
  const applyStampPreset = (preset: 'all' | 'first' | 'last' | 'current' | 'none') => {
    disabledStampPagesRef.current.clear();
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

        if (!shouldEnable) {
          disabledStampPagesRef.current.add(i);
        }
        updated[i] = { ...existing, enabled: shouldEnable };
      }
      return updated;
    });
  };

  // Apply Signature Presets
  const applySignaturePreset = (preset: 'all' | 'first' | 'last' | 'current' | 'none') => {
    disabledSigPagesRef.current.clear();
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

        if (!shouldEnable) {
          disabledSigPagesRef.current.add(i);
        }
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
      disabledStampPagesRef.current.clear();
      applyStampPreset('all');
      showToast('تم إدراج الختم المحفوظ وتثبيته في الموضع بنجاح ✅');
    } else {
      disabledSigPagesRef.current.clear();
      applySignaturePreset('all');
      showToast('تم إدراج التوقيع المحفوظ وتثبيته في الموضع بنجاح ✅');
    }
  };

  // File Upload Helper within Editor (supporting stamp, signature, and official template)
  const handleFileUploadInEditor = (type: 'stamp' | 'signature' | 'template', file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      showToast('جاري معالجة الملف...');
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) throw new Error("مكتبة معالجة PDF قيد التحميل");
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          
          if (type === 'template') {
            const pages: string[] = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                pages.push(canvas.toDataURL('image/png'));
              }
            }
            if (onUpdateDocs) {
              onUpdateDocs(prev => ({ ...prev, template: pages[0] || null, templatePages: pages }));
            }
            showToast('تم تعيين الورقة الرسمية بنجاح ✅');
          } else {
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
          if (type === 'template') {
            onUpdateDocs(prev => ({ ...prev, template: dataUrl, templatePages: [dataUrl] }));
            showToast('تم تعيين الورقة الرسمية بنجاح ✅');
          } else {
            onUpdateDocs(prev => ({ ...prev, [type]: dataUrl }));
            if (type === 'stamp') applyStampPreset('all');
            else applySignaturePreset('all');
            showToast(`تم تعيين ${type === 'stamp' ? 'الختم' : 'التوقيع'} بنجاح ✅`);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Preprocesses the document page so light/paper backgrounds (white, scanning grey, noise)
   * are cleanly normalized to pure white (255, 255, 255).
   * When blended onto the letterhead template with 'multiply', pure white is 100% invisible,
   * revealing the official letterhead headers, footers, borders, and watermarks crystal-clear!
   */
  const cleanDocumentPage = (img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.drawImage(img, 0, 0);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        if (lum > 218) {
          // Normalize paper background to pure white
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else if (lum < 90) {
          // Boost dark text contrast
          data[i] = Math.max(0, r * 0.8);
          data[i + 1] = Math.max(0, g * 0.8);
          data[i + 2] = Math.max(0, b * 0.8);
        }
      }
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      console.warn('Canvas image preprocessing warning:', e);
    }

    return canvas;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Only set crossOrigin on non-data, non-blob URLs to prevent WebKit CORS bugs
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('فشل تحميل الصورة: ' + (e as any)?.message || 'تنسيق غير صالح'));
      img.src = src;
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

      if (pagesToProcess.length === 0) {
        throw new Error('يرجى رفع المستند الأصلي أولاً');
      }

      const { w: containerWidth, h: containerHeight } = getSafeDimensions();

      let firstPageThumb = '';
      // Process all document pages
      for (let i = 0; i < pagesToProcess.length; i++) {
        if (i > 0) pdf.addPage('a4', 'portrait');

        const canvas = document.createElement('canvas');
        canvas.width = 1240;
        canvas.height = 1754;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const currentTemplate = getTemplateForPage(i);
          let templateImg: HTMLImageElement | null = null;
          
          if (currentTemplate) {
            try {
              templateImg = await loadImage(currentTemplate);
            } catch (err: any) {
              console.error('Template loading failed for page', i, err);
              throw new Error('تعذر تحميل ورقة المؤسسة (القالب): ' + (err?.message || 'الملف غير صالح'));
            }
          }

          // LAYER 1: BASE BACKGROUND
          if (templateImg && mergeMode === 'overlay') {
            // Draw official letterhead template as full-bleed A4 background
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
          } else {
            // Standard clean white sheet
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // LAYER 2: DOCUMENT CONTENT
          const origImg = await loadImage(pagesToProcess[i]);
          
          if (templateImg && mergeMode === 'overlay') {
            // Preprocess paper background so scanner grain/off-white is pure white
            const cleanedDoc = cleanDocumentPage(origImg);
            
            // Multiply blending: White paper disappears into the template background,
            // while all text, lines, tables, and content print onto the letterhead perfectly!
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(cleanedDoc, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          } else {
            // Direct draw if no overlay template
            ctx.drawImage(origImg, 0, 0, canvas.width, canvas.height);
          }

          // Scale factor between screen preview container and high-res export canvas
          const scaleX = canvas.width / containerWidth;
          const scaleY = canvas.height / containerHeight;

          // LAYER 3: OFFICIAL STAMP (Drawn in standard source-over mode for full color vibrancy)
          const stampConfig = getSafeStampConfig(i);
          if (documents.stamp && stampConfig.enabled) {
            const stampImg = await loadImage(documents.stamp);
            const stampX = stampConfig.x * scaleX;
            const stampY = stampConfig.y * scaleY;
            const stampSize = stampConfig.size * scaleX;
            ctx.drawImage(stampImg, stampX, stampY, stampSize, stampSize);
          }

          // LAYER 4: OFFICIAL SIGNATURE (Drawn in standard source-over mode)
          const sigConfig = getSafeSignatureConfig(i);
          if (documents.signature && sigConfig.enabled) {
            const sigImg = await loadImage(documents.signature);
            const sigX = sigConfig.x * scaleX;
            const sigY = sigConfig.y * scaleY;
            const sigSize = sigConfig.size * scaleX;
            ctx.drawImage(sigImg, sigX, sigY, sigSize, sigSize);
          }

          // Add completed composite page to PDF
          const pageDataUrl = canvas.toDataURL('image/png');
          if (i === 0) firstPageThumb = pageDataUrl;
          pdf.addImage(pageDataUrl, 'PNG', 0, 0, 210, 297);
        }
      }

      // If user chose independent appendix mode, append template pages as standalone pages
      if (mergeMode === 'append' && documents.templatePages.length > 0) {
        for (let tIdx = 0; tIdx < documents.templatePages.length; tIdx++) {
          pdf.addPage('a4', 'portrait');
          const tCanvas = document.createElement('canvas');
          tCanvas.width = 1240;
          tCanvas.height = 1754;
          const tCtx = tCanvas.getContext('2d');
          if (tCtx) {
            const tImg = await loadImage(documents.templatePages[tIdx]);
            tCtx.drawImage(tImg, 0, 0, tCanvas.width, tCanvas.height);
            pdf.addImage(tCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
          }
        }
      }

      const blob = pdf.output('blob');
      const pdfDataUrl = pdf.output('datauristring');
      setExportedBlob(blob);
      setIsExported(true);

      // Cloud Firestore cross-device document saving
      if (currentUser?.email) {
        setIsSavingToCloud(true);
        try {
          const docTitle = `مستند موثق #${Math.floor(1000 + Math.random() * 9000)} (${new Date().toLocaleDateString('ar-SA')})`;
          const res = await saveDocumentToFirestore(currentUser, {
            title: docTitle,
            pdfDataUrl,
            thumbnailDataUrl: firstPageThumb,
            pageCount: pagesToProcess.length,
            hasTemplate: !!documents.template || documents.templatePages.length > 0,
            hasStamp: !!documents.stamp,
            hasSignature: !!documents.signature
          });
          if (res.success) {
            setCloudSavedDocId(res.documentId || null);
            showToast('تم توثيق المستند وحفظه بنجاح ✅');
          } else {
            showToast('تم توثيق ودمج المستند بنجاح 🎉');
          }
        } catch (e) {
          console.warn('Cloud save error:', e);
          showToast('تم توثيق ودمج المستند بنجاح 🎉');
        } finally {
          setIsSavingToCloud(false);
        }
      } else {
        showToast('تم توثيق ودمج المستند بنجاح 🎉');
      }
    } catch (err: any) {
      console.error('Export Error:', err);
      alert('خطأ أثناء توثيق المستند: ' + (err?.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareClick = async () => {
    if (!exportedBlob) return;
    const file = new File([exportedBlob], 'watheeq-certified-document.pdf', { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
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
      className="wq-editor-layout flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl mx-auto w-full text-right relative px-2 sm:px-4"
      dir="rtl"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleEndDrag}
      onTouchEnd={handleEndDrag}
    >
      {/* Toast Notification */}
      {toastMessage && ReactDOM.createPortal(
        <div className="fixed top-5 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
          <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black backdrop-blur-2xl flex items-center gap-2.5 border border-slate-700/80 pointer-events-auto">
            <Check size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden File Inputs for in-editor upload */}
      <input 
        ref={templateFileInputRef} 
        type="file" 
        accept="image/png, image/jpeg, application/pdf" 
        className="hidden" 
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileUploadInEditor('template', e.target.files[0]);
        }} 
      />
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
      <div className="wq-editor-preview flex-1 w-full flex flex-col items-center">
        
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
          {/* Layer 1: Template (Official Letterhead) */}
          {currentPageTemplate && mergeMode === 'overlay' && (
            <img 
              src={currentPageTemplate} 
              alt="Official Letterhead" 
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" 
            />
          )}

          {/* Layer 2: Original Document Page with Multiply Blend Mode for crystal-clear letterhead overlay */}
          {currentPageOriginal && (
            <img 
              src={currentPageOriginal} 
              alt="Document Page" 
              className={`absolute inset-0 w-full h-full object-fill pointer-events-none z-20 ${
                currentPageTemplate && mergeMode === 'overlay' ? 'mix-blend-multiply' : ''
              }`}
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
      <div className="wq-editor-controls w-full lg:w-[380px] shrink-0 flex flex-col gap-4">

        {/* 0. OFFICIAL INSTITUTION PAPER (TEMPLATE / LETTERHEAD) CARD */}
        <div className="wq-panel bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">ورقة المؤسسة الرسمية</h3>
                <p className="text-[10px] text-slate-400">القالب والترويسة المدمجة للخطابات</p>
              </div>
            </div>
            {currentPageTemplate ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                مفعلة
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                غير مرفقة
              </span>
            )}
          </div>

          {currentPageTemplate ? (
            <div className="flex flex-col gap-3">
              {/* Thumbnail and Details */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
                <div className="w-12 h-16 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                  <img 
                    src={currentPageTemplate} 
                    alt="Template thumbnail" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    ورقة المؤسسة الرسمية
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {documents.templatePages.length > 1 
                      ? `${documents.templatePages.length} صفحات بالقالب` 
                      : 'قالب رسمي معتمد'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => templateFileInputRef.current?.click()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload size={13} />
                  <span>تغيير الورقة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateDocs) {
                      onUpdateDocs(prev => ({ ...prev, template: null, templatePages: [] }));
                    }
                    showToast('تمت إزالة ورقة المؤسسة');
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                  title="إزالة ورقة المؤسسة"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                يمكنك إرفاق ورقة المؤسسة الرسمية (الترويسة) لدمجها خلف محتوى المستند أو كصفحة إضافية.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => templateFileInputRef.current?.click()}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload size={13} />
                  <span>رفع ورقة المؤسسة (PDF / صورة)</span>
                </button>
                {currentUser?.savedAssets?.template && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateDocs && currentUser.savedAssets.template) {
                        onUpdateDocs(prev => ({ 
                          ...prev, 
                          template: currentUser.savedAssets.template,
                          templatePages: [currentUser.savedAssets.template]
                        }));
                      }
                      showToast('تم استيراد الورقة الرسمية المحفوظة بنجاح ✅');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    title="استيراد من حسابي"
                  >
                    <BookmarkCheck size={15} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 1. STAMP MANAGEMENT CARD */}
        {documents.stamp ? (
          <div className="wq-panel bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 animate-fade-in">
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
          <div className="wq-panel bg-white border border-dashed border-blue-200 p-5 rounded-3xl shadow-sm flex flex-col gap-3 animate-fade-in">
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
          <div className="wq-panel bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 animate-fade-in">
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
          <div className="wq-panel bg-white border border-dashed border-indigo-200 p-5 rounded-3xl shadow-sm flex flex-col gap-3 animate-fade-in">
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
              
              {/* Cloud Saved Indicator Card */}
              {currentUser?.email && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xs animate-scale-in">
                  <div className="flex items-center gap-2.5 text-blue-900 font-bold">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Cloud size={17} className={isSavingToCloud ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">
                        {isSavingToCloud ? 'جاري الحفظ في السحابة...' : 'محفوظ في سحابة حسابك'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        متاح الآن وتستطيع فتحه من أي جهاز بنفس الحساب
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-600 text-white font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
                    <CheckCircle2 size={12} />
                    <span>سحابي</span>
                  </span>
                </div>
              )}

              {/* 1. Share Button */}
              <button
                onClick={handleShareClick}
                className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white py-4 px-6 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
              >
                <Share2 size={20} />
                <span>مشاركة المستند</span>
              </button>

              {/* 2. Download File Button */}
              <button
                onClick={handleDownloadFile}
                className="flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-6 rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
              >
                <Download size={16} />
                <span>تحميل المستند الموثق (PDF)</span>
              </button>

              {/* 3. Start Over Button (keeps current files) */}
              <button
                onClick={onReset}
                className="flex items-center justify-center gap-2 w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 py-3.5 px-6 rounded-2xl font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer shadow-xs"
              >
                <RefreshCcw size={15} />
                <span>البدء من جديد (مع نفس الملفات)</span>
              </button>

              {/* 4. Start Fresh with new files */}
              <button
                onClick={() => setShowFreshConfirmModal(true)}
                className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold text-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
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
