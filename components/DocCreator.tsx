import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignRight, AlignCenter, AlignLeft, AlignJustify, 
  FileText, Sparkles, Send, Trash2, FileDown, Loader2, Calendar, Check,
  Type, Award, ChevronDown, ChevronUp, AlertCircle, HelpCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DocCreatorProps {
  onSendToEditor: (pages: string[]) => void;
}

const DEFAULT_TEXT = '<p><br></p>';

interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export const DocCreator: React.FC<DocCreatorProps> = ({ onSendToEditor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pagesContent, setPagesContent] = useState<string[]>([DEFAULT_TEXT]);
  const [isRendering, setIsRendering] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('تم إرسال المستند بنجاح! تم وضعه كـ "المستند الأصلي" في الأعلى.');
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmState | null>(null);
  
  // Font customization options including the Word-like font
  const [fontFamily, setFontFamily] = useState<'Cairo' | 'Amiri' | 'NotoNaskh'>('NotoNaskh');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Caret Marker restoration hook
  useEffect(() => {
    const marker = document.getElementById('caret-marker');
    if (marker) {
      let parent: ParentNode | null = marker.parentNode;
      while (parent) {
        if (parent instanceof HTMLElement && parent.hasAttribute('data-page-index')) {
          parent.focus();
          break;
        }
        parent = parent.parentNode;
      }
      
      const range = document.createRange();
      range.selectNode(marker);
      range.collapse(false);
      
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      // Remove marker from DOM
      marker.parentNode?.removeChild(marker);
      
      // Save clean state
      syncDOMToState();
    }
  }, [pagesContent]);

  const saveCaret = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    
    const marker = document.createElement('span');
    marker.id = 'caret-marker';
    marker.style.lineHeight = '0';
    marker.style.display = 'inline-block';
    marker.style.width = '0';
    marker.style.height = '0';
    marker.style.overflow = 'hidden';
    marker.innerHTML = '&#8203;';
    
    try {
      range.insertNode(marker);
      return marker;
    } catch (e) {
      console.warn('Could not insert caret marker:', e);
      return null;
    }
  };

  const restoreCaret = () => {
    const marker = document.getElementById('caret-marker');
    if (!marker) return;
    
    let parent: ParentNode | null = marker.parentNode;
    while (parent) {
      if (parent instanceof HTMLElement && parent.hasAttribute('data-page-index')) {
        parent.focus();
        break;
      }
      parent = parent.parentNode;
    }
    
    const range = document.createRange();
    range.selectNode(marker);
    range.collapse(false);
    
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    
    marker.parentNode?.removeChild(marker);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  const getActivePageElementAndIndex = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      let node: Node | null = container;
      while (node) {
        if (node instanceof HTMLElement && node.hasAttribute('data-page-index')) {
          const pageId = node.getAttribute('data-page-index');
          if (pageId !== null) {
            return {
              element: node,
              index: parseInt(pageId, 10)
            };
          }
        }
        node = node.parentNode;
      }
    }
    return null;
  };

  const addNewPage = () => {
    setPagesContent(prev => [...prev, DEFAULT_TEXT]);
    showToast('تمت إضافة صفحة جديدة بنجاح! 📄');
  };

  const deletePage = (index: number) => {
    if (pagesContent.length <= 1) return;
    
    setPagesContent(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    showToast('تم حذف الصفحة بنجاح.');
  };

  const updatePageContent = (index: number, html: string) => {
    setPagesContent(prev => {
      const copy = [...prev];
      copy[index] = html;
      return copy;
    });
  };

  const getLatestPagesContent = () => {
    return pagesContent.map((pageHtml, index) => {
      const el = document.querySelector(`[data-page-index="${index}"]`);
      return el ? el.innerHTML : pageHtml;
    });
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    const activePage = getActivePageElementAndIndex();
    if (activePage) {
      updatePageContent(activePage.index, activePage.element.innerHTML);
    }
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setPendingConfirm({
      title,
      message,
      onConfirm
    });
  };

  const clearEditor = () => {
    setPagesContent([DEFAULT_TEXT]);
    showToast('تم إفراغ المستند بنجاح.');
  };

  // Helper to insert HTML at the current cursor position inside the focused editor
  const insertAtCursor = (html: string) => {
    const activePage = getActivePageElementAndIndex();
    
    if (activePage) {
      const { element, index } = activePage;
      element.focus();
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const el = document.createElement('div');
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node;
        while ((node = el.firstChild)) {
          frag.appendChild(node);
        }
        range.insertNode(frag);
        
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        updatePageContent(index, element.innerHTML);
        return;
      }
    }

    // Fallback: append to the last page
    const lastIndex = pagesContent.length - 1;
    setPagesContent(prev => {
      const copy = [...prev];
      const current = copy[lastIndex];
      copy[lastIndex] = current === DEFAULT_TEXT ? html : current + html;
      return copy;
    });
  };

  // Quick insertion tools
  const insertTodayDate = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    insertAtCursor(` <span style="font-weight: bold; color: #0f172a;">${formattedDate}</span> `);
  };

  const insertBismillah = () => {
    insertAtCursor('<div style="text-align: center; margin: 15px 0; font-weight: bold; font-size: 1.25rem;">بسم الله الرحمن الرحيم</div>');
  };

  const insertSalutation = () => {
    insertAtCursor('<p style="margin: 10px 0;">السلام عليكم ورحمة الله وبركاته،،،</p>');
  };

  const insertSubject = () => {
    insertAtCursor('<p style="margin: 10px 0; font-weight: bold;">الموضوع: ................................................................</p>');
  };

  const insertSignatures = () => {
    insertAtCursor(`
      <div style="display: flex; justify-content: space-between; margin-top: 40px; padding: 0 10px;">
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold;">اسم مقدم الطلب: .............................</p>
          <p style="margin: 5px 0 0 0; color: #475569;">التوقيع: .............................</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
    `);
  };

  const applyTemplate = (template: string, title: string) => {
    const activePage = getActivePageElementAndIndex();
    const targetIndex = activePage ? activePage.index : 0;
    
    const rawContent = pagesContent[targetIndex];
    const cleanCurrent = rawContent
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .replace(/\s/g, '')
      .trim();
    
    const applyToTarget = () => {
      setPagesContent(prev => {
        const copy = [...prev];
        copy[targetIndex] = template;
        return copy;
      });
      showToast(`تم تطبيق ${title} بنجاح.`);
    };

    applyToTarget();
  };

  const syncDOMToState = () => {
    const pages = Array.from(document.querySelectorAll('[data-page-index]')) as HTMLDivElement[];
    pages.sort((a, b) => {
      const idxA = parseInt(a.getAttribute('data-page-index') || '0', 10);
      const idxB = parseInt(b.getAttribute('data-page-index') || '0', 10);
      return idxA - idxB;
    });
    
    const contents = pages.map(p => p.innerHTML);
    setPagesContent(contents);
  };

  const redistributePages = (): boolean => {
    let maxIterations = 50;
    let iteration = 0;
    let madeChanges = false;
    
    let pageElements = Array.from(document.querySelectorAll('[data-page-index]')) as HTMLDivElement[];
    pageElements.sort((a, b) => {
      const idxA = parseInt(a.getAttribute('data-page-index') || '0', 10);
      const idxB = parseInt(b.getAttribute('data-page-index') || '0', 10);
      return idxA - idxB;
    });
    
    let i = 0;
    while (i < pageElements.length && iteration < maxIterations) {
      iteration++;
      const target = pageElements[i];
      const nextPageIndex = i + 1;
      let nextPageEl = pageElements[nextPageIndex];
      
      // 1. Check for Overflow
      if (target.scrollHeight > target.clientHeight) {
        madeChanges = true;
        const movedNodes: Node[] = [];
        
        // Pull children from the end until it doesn't overflow
        while (target.scrollHeight > target.clientHeight && target.childNodes.length > 1) {
          const lastChild = target.lastChild;
          if (lastChild) {
            movedNodes.unshift(lastChild);
            target.removeChild(lastChild);
          } else {
            break;
          }
        }
        
        // Single child split
        if (target.scrollHeight > target.clientHeight && target.childNodes.length === 1) {
          const singleChild = target.firstChild;
          if (singleChild) {
            // Check if caret-marker is inside singleChild to preserve its exact position
            const markerEl = document.getElementById('caret-marker');
            let hasCaret = false;
            if (markerEl && singleChild.contains(markerEl)) {
              hasCaret = true;
              const placeholder = document.createTextNode('__CARET_PLACEHOLDER__');
              markerEl.parentNode?.replaceChild(placeholder, markerEl);
            }

            if (singleChild.nodeType === Node.TEXT_NODE) {
              const textContent = singleChild.textContent || '';
              const words = textContent.split(/\s+/);
              if (words.length > 1) {
                let low = 0;
                let high = words.length;
                let optimalK = 0;
                
                while (low <= high) {
                  const mid = Math.floor((low + high) / 2);
                  singleChild.textContent = words.slice(0, mid).join(' ');
                  if (target.scrollHeight <= target.clientHeight) {
                    optimalK = mid;
                    low = mid + 1;
                  } else {
                    high = mid - 1;
                  }
                }
                
                if (optimalK > 0 && optimalK < words.length) {
                  const firstPart = words.slice(0, optimalK).join(' ');
                  const secondPart = words.slice(optimalK).join(' ');
                  
                  const markerHtml = `<span id="caret-marker" style="line-height: 0; display: inline-block; width: 0; height: 0; overflow: hidden;">&#8203;</span>`;
                  
                  if (hasCaret) {
                    const tempDiv1 = document.createElement('div');
                    tempDiv1.innerHTML = firstPart.replace('__CARET_PLACEHOLDER__', markerHtml);
                    singleChild.textContent = tempDiv1.textContent || '';
                  } else {
                    singleChild.textContent = firstPart;
                  }
                  
                  let secondNode: Node;
                  if (hasCaret && secondPart.includes('__CARET_PLACEHOLDER__')) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = secondPart.replace('__CARET_PLACEHOLDER__', markerHtml);
                    secondNode = tempDiv.firstChild ? tempDiv.firstChild.cloneNode(true) : document.createTextNode(secondPart);
                  } else {
                    secondNode = document.createTextNode(secondPart);
                  }
                  movedNodes.unshift(secondNode);
                } else {
                  if (hasCaret) {
                    singleChild.textContent = textContent.replace('__CARET_PLACEHOLDER__', '');
                    const restoredMarker = document.createElement('span');
                    restoredMarker.id = 'caret-marker';
                    restoredMarker.style.lineHeight = '0';
                    restoredMarker.style.display = 'inline-block';
                    restoredMarker.style.width = '0';
                    restoredMarker.style.height = '0';
                    restoredMarker.style.overflow = 'hidden';
                    restoredMarker.innerHTML = '&#8203;';
                    target.appendChild(restoredMarker);
                  } else {
                    singleChild.textContent = textContent;
                  }
                  movedNodes.unshift(singleChild);
                  target.removeChild(singleChild);
                }
              } else {
                if (hasCaret) {
                  singleChild.textContent = textContent.replace('__CARET_PLACEHOLDER__', '');
                  const restoredMarker = document.createElement('span');
                  restoredMarker.id = 'caret-marker';
                  restoredMarker.style.lineHeight = '0';
                  restoredMarker.style.display = 'inline-block';
                  restoredMarker.style.width = '0';
                  restoredMarker.style.height = '0';
                  restoredMarker.style.overflow = 'hidden';
                  restoredMarker.innerHTML = '&#8203;';
                  target.appendChild(restoredMarker);
                } else {
                  singleChild.textContent = textContent;
                }
                movedNodes.unshift(singleChild);
                target.removeChild(singleChild);
              }
            } else if (singleChild instanceof HTMLElement) {
              const textContent = singleChild.textContent || '';
              const words = textContent.split(/\s+/);
              if (words.length > 1) {
                let low = 0;
                let high = words.length;
                let optimalK = 0;
                const tag = singleChild.tagName.toLowerCase();
                const styleAttr = singleChild.getAttribute('style') || '';
                const styleStr = styleAttr ? ` style="${styleAttr}"` : ' style="margin-bottom: 14px; line-height: 1.75;"';
                const originalHtml = singleChild.innerHTML;
                
                while (low <= high) {
                  const mid = Math.floor((low + high) / 2);
                  singleChild.textContent = words.slice(0, mid).join(' ');
                  if (target.scrollHeight <= target.clientHeight) {
                    optimalK = mid;
                    low = mid + 1;
                  } else {
                    high = mid - 1;
                  }
                }
                
                if (optimalK > 0 && optimalK < words.length) {
                  const firstPart = words.slice(0, optimalK).join(' ');
                  const secondPart = words.slice(optimalK).join(' ');
                  
                  const markerHtml = `<span id="caret-marker" style="line-height: 0; display: inline-block; width: 0; height: 0; overflow: hidden;">&#8203;</span>`;
                  
                  const firstPartClean = firstPart.replace('__CARET_PLACEHOLDER__', markerHtml);
                  const secondPartClean = secondPart.replace('__CARET_PLACEHOLDER__', markerHtml);
                  
                  singleChild.innerHTML = firstPartClean;
                  
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = `<${tag}${styleStr}>${secondPartClean}</${tag}>`;
                  if (tempDiv.firstChild) {
                    movedNodes.unshift(tempDiv.firstChild);
                  }
                } else {
                  if (hasCaret) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = originalHtml;
                    singleChild.innerHTML = tempDiv.innerHTML;
                  } else {
                    singleChild.innerHTML = originalHtml;
                  }
                  movedNodes.unshift(singleChild);
                  target.removeChild(singleChild);
                }
              } else {
                if (hasCaret) {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = originalHtml;
                  singleChild.innerHTML = tempDiv.innerHTML;
                } else {
                  singleChild.innerHTML = originalHtml;
                }
                movedNodes.unshift(singleChild);
                target.removeChild(singleChild);
              }
            }
          }
        }
        
        // Distribute moved nodes
        if (movedNodes.length > 0) {
          if (!nextPageEl) {
            const tempDiv = document.createElement('div');
            movedNodes.forEach(node => tempDiv.appendChild(node.cloneNode(true)));
            const movedHtml = tempDiv.innerHTML;
            
            setPagesContent(prev => {
              const updatedContents = pageElements.map((el, idx) => {
                if (idx === i) {
                  return target.innerHTML;
                }
                return el.innerHTML;
              });
              updatedContents.push(movedHtml);
              return updatedContents;
            });
            showToast('تم إنشاء صفحة جديدة تلقائياً ونقل النص إليها! 📄');
            return true;
          } else {
            const fragment = document.createDocumentFragment();
            movedNodes.forEach(node => fragment.appendChild(node));
            nextPageEl.insertBefore(fragment, nextPageEl.firstChild);
            
            pageElements = Array.from(document.querySelectorAll('[data-page-index]')) as HTMLDivElement[];
            pageElements.sort((a, b) => {
              const idxA = parseInt(a.getAttribute('data-page-index') || '0', 10);
              const idxB = parseInt(b.getAttribute('data-page-index') || '0', 10);
              return idxA - idxB;
            });
          }
        }
      }
      // 2. Check for Underflow
      else if (nextPageEl && target.scrollHeight < target.clientHeight - 40) {
        let pulledAny = false;
        while (nextPageEl.childNodes.length > 0 && target.scrollHeight < target.clientHeight - 40) {
          const firstChild = nextPageEl.firstChild;
          if (!firstChild) break;
          const clone = firstChild.cloneNode(true);
          target.appendChild(clone);
          if (target.scrollHeight <= target.clientHeight) {
            nextPageEl.removeChild(firstChild);
            pulledAny = true;
            madeChanges = true;
          } else {
            target.removeChild(clone);
            break;
          }
        }
        
        if (nextPageEl.childNodes.length === 0 || nextPageEl.innerHTML.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '') {
          setPagesContent(prev => {
            const updatedContents = pageElements.map((el, idx) => {
              if (idx === i) {
                return target.innerHTML;
              }
              return el.innerHTML;
            });
            updatedContents.splice(nextPageIndex, 1);
            return updatedContents;
          });
          return true;
        }
      }
      i++;
    }
    
    if (madeChanges) {
      syncDOMToState();
    }
    return madeChanges;
  };

  const triggerPagination = () => {
    const marker = saveCaret();
    const changed = redistributePages();
    if (!changed && marker) {
      restoreCaret();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>, pageIndex: number) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    // Split text by lines to construct proper paragraph blocks with exact line heights and spacing
    const paragraphs = text.split(/\r?\n/);
    const paragraphsHtml = paragraphs
      .map(line => {
        const trimmed = line.trim();
        if (trimmed === '') {
          return '<p style="margin-bottom: 14px; line-height: 1.75; min-height: 1.5em;">&nbsp;</p>';
        }
        return `<p style="margin-bottom: 14px; line-height: 1.75; text-align: justify; text-justify: inter-word;">${trimmed}</p>`;
      })
      .join('');

    const target = e.currentTarget;

    // Use document.execCommand('insertHTML') which inserts the formatted paragraphs HTML perfectly at the cursor
    const success = document.execCommand('insertHTML', false, paragraphsHtml);

    if (!success) {
      // Fallback manual insertion if execCommand is not supported
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement('div');
        el.innerHTML = paragraphsHtml;
        const frag = document.createDocumentFragment();
        let node;
        while ((node = el.firstChild)) {
          frag.appendChild(node);
        }
        range.insertNode(frag);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        target.innerHTML += paragraphsHtml;
      }
    }

    triggerPagination();
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>, pageIndex: number) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Defer pagination checks slightly to allow the browser to process layout and report correct heights
    setTimeout(() => {
      triggerPagination();
    }, 0);
    
    syncTimeoutRef.current = setTimeout(() => {
      syncDOMToState();
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, pageIndex: number) => {
    const target = e.currentTarget;
    
    if (e.key === 'Backspace') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        
        // Calculate the caret offset from start of this editable div
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(target);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const caretOffset = preCaretRange.toString().length;
        
        // If cursor is at the very beginning of page index > 0, merge with previous page
        if (caretOffset === 0 && pageIndex > 0) {
          e.preventDefault();
          
          const prevPageEl = document.querySelector(`[data-page-index="${pageIndex - 1}"]`) as HTMLDivElement | null;
          if (prevPageEl) {
            // Get original child nodes count to place caret correctly at the boundary later
            const originalChildCount = prevPageEl.childNodes.length;
            
            // Move all child nodes of current target to the end of prevPageEl
            while (target.childNodes.length > 0) {
              prevPageEl.appendChild(target.firstChild!);
            }
            
            // Focus previous page and set cursor at the boundary
            prevPageEl.focus();
            
            const range = document.createRange();
            if (prevPageEl.childNodes.length > 0) {
              const targetNode = prevPageEl.childNodes[Math.max(0, originalChildCount - 1)] || prevPageEl;
              range.selectNodeContents(targetNode);
              range.collapse(false);
            } else {
              range.selectNodeContents(prevPageEl);
              range.collapse(false);
            }
            
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            prevPageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Remove the current page since we merged its contents
            setPagesContent(prev => {
              const copy = [...prev];
              copy.splice(pageIndex, 1);
              return copy;
            });
            
            showToast('تم دمج الصفحة مع الصفحة السابقة تلقائياً! 📄');
          }
        }
      }
    }
  };

  const insertPledgeTemplate = () => {
    const template = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: bold;">إقرار وتعهد رسمي</span>
      </div>
      <div style="margin-bottom: 20px; line-height: 1.8; text-align: justify;">
        <p style="margin: 0;">
          أقر أنا الموقع أدناه / .......................................................................، سعودي الجنسية بموجب الهوية الوطنية رقم (........................................)، بكامل أهليتي المعتبرة شرعاً ونظاماً بأنني ألتزم وأتعهد بـ ............................................................................................................................................................
        </p>
        <p style="margin: 10px 0 0 0;">
          وهذا إقرار وتعهد مني بذلك، وأتحمل كافة المسؤوليات والتبعات القانونية والنظامية في حال الإخلال بهذا التعهد دون أدنى مسؤولية على أي جهة أخرى.
        </p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold;">المقر بما فيه (المتعهد):</p>
          <p style="margin: 5px 0;">الاسم: ............................................</p>
          <p style="margin: 5px 0;">رقم الجوال: ............................................</p>
          <p style="margin: 5px 0;">التوقيع: ............................................</p>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; justify-content: flex-end;">
          <p style="margin: 0; font-weight: bold;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
    `;
    
    applyTemplate(template, 'قالب إقرار وتعهد');
  };

  const insertFinancialDemandTemplate = () => {
    const template = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: bold;">مطالبة مالية بسداد مستحقات</span>
      </div>
      <div style="margin-bottom: 15px;">
        <p style="font-weight: bold; margin: 0;">السادة / ......................................... المحترمين</p>
        <p style="margin: 5px 0; color: #334155;">عناية قسم المحاسبة والمالية</p>
        <p style="margin: 5px 0; color: #334155;">السلام عليكم ورحمة الله وبركاته،،،</p>
      </div>
      <div style="margin-bottom: 20px; text-align: justify; line-height: 1.8;">
        <p style="margin: 0; text-indent: 20px;">
          إشارة إلى التعامل المتبادل بيننا، ونظراً لتقديمنا كافة الخدمات المتفق عليها بموجب العقد المبرم/الفاتورة رقم (......................)، نود تذكيركم بأن هناك مستحقات مالية متأخرة الدفع قدرها <span style="font-weight: bold; color: #0f172a;">...................... ريال سعودي</span>.
        </p>
        <p style="margin: 10px 0 0 0; text-indent: 20px;">
          لذا، يرجى التكرم بالإيعاز لمن يلزم بإنهاء إجراءات الصرف وتحويل المبلغ المذكور إلى حسابنا البنكي في أقرب وقت ممكن تلافياً لأي تأخير في تقديم الخدمات المستقبلية.
        </p>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">شاكرين لكم حسن تعاونكم الدائم وتفهمكم،،،</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 40px;">
        <div>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">المستند منشأ عبر منصة وثيق</p>
        </div>
        <div style="text-align: right; min-width: 150px;">
          <p style="font-weight: bold; margin: 0;">الجهة المطالبة: ..........................</p>
          <p style="margin: 4px 0 0 0; color: #64748b;">التوقيع والختم: ..........................</p>
        </div>
      </div>
    `;

    applyTemplate(template, 'قالب مطالبة مالية');
  };

  const insertContractTemplate = () => {
    const template = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: bold;">عقد اتفاق وتقديم خدمات</span>
      </div>
      <div style="margin-bottom: 15px; line-height: 1.8;">
        <p style="margin: 5px 0;">إنه في يوم: ....................... الموافق: ....................... تم الاتفاق بين كل من:</p>
        <p style="margin: 5px 0; font-weight: bold;">الطرف الأول: ..............................................................</p>
        <p style="margin: 5px 0; font-weight: bold;">الطرف الثاني: ..............................................................</p>
      </div>
      <div style="margin-bottom: 20px; text-align: justify; line-height: 1.8;">
        <p style="margin: 0; font-weight: bold; text-decoration: underline;">البند الأول (موضوع العقد):</p>
        <p style="margin: 5px 0 15px 0;">
          يلتزم الطرف الثاني بتقديم الخدمات التالية للطرف الأول: ..........................................................................................................................................
        </p>
        <p style="margin: 0; font-weight: bold; text-decoration: underline;">البند الثاني (القيمة المالية والدفع):</p>
        <p style="margin: 5px 0 15px 0;">
          اتفق الطرفان على أن تكون القيمة الإجمالية لهذا العقد هي (...................... ريال سعودي) تدفع على النحو التالي: ............................................................................
        </p>
        <p style="margin: 0; font-weight: bold; text-decoration: underline;">البند الثالث (الالتزامات والمدة):</p>
        <p style="margin: 5px 0;">
          يسري هذا العقد لمدة (......................) تبدأ من تاريخ توقيعه من الطرفين.
        </p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: right;">
          <p style="font-weight: bold; margin: 0;">الطرف الأول:</p>
          <p style="margin: 5px 0; color: #64748b;">التوقيع: ..........................</p>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; margin: 0;">الطرف الثاني:</p>
          <p style="margin: 5px 0; color: #64748b;">التوقيع: ..........................</p>
        </div>
      </div>
    `;

    applyTemplate(template, 'قالب عقد اتفاق');
  };

  const insertPriceQuoteTemplate = () => {
    const template = `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: bold;">عرض أسعار رسمي</span>
      </div>
      <div style="margin-bottom: 15px;">
        <p style="font-weight: bold; margin: 0;">السادة / ......................................... المحترمين</p>
        <p style="margin: 5px 0; color: #334155;">يسرنا أن نقدم لكم عرض السعر التالي للخدمات/المنتجات المطلوبة:</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">م</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: right;">الوصف والبيان</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">الكمية</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">سعر الوحدة</th>
            <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">١</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">تأدية خدمات ................................</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">١</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">...... ريال</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">...... ريال</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">٢</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">أعمال تطوير ومتابعة ..........................</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">١</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">...... ريال</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">...... ريال</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f8fafc;">
            <td colspan="4" style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">المجموع الإجمالي:</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; color: #0f172a;">...................... ريال</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-bottom: 20px; line-height: 1.6; font-size: 11px; color: #475569;">
        <p style="margin: 3px 0;">* هذا العرض ساري لمدة ٣٠ يوماً من تاريخ التقديم.</p>
        <p style="margin: 3px 0;">* شروط الدفع: ٥٠٪ مقدم عند التوقيع و٥٠٪ بعد تسليم الأعمال.</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 35px;">
        <div>
          <p style="margin: 0; font-size: 10px; color: #94a3b8;">منصة وثيق للمستندات</p>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; margin: 0;">مقدم العرض (الشركة/المؤسسة): ..........................</p>
          <p style="margin: 4px 0 0 0; color: #64748b;">التوقيع والختم: ..........................</p>
        </div>
      </div>
    `;

    applyTemplate(template, 'قالب عرض أسعار');
  };

  const handleExportWord = () => {
    const latestPages = getLatestPagesContent();
    setPagesContent(latestPages);

    const fontName = fontFamily === 'NotoNaskh' ? 'Noto Naskh Arabic' : fontFamily === 'Amiri' ? 'Amiri' : 'Cairo';
    
    const joinedContent = latestPages
      .map(pageHtml => `<div class="word-page">${pageHtml}</div>`)
      .join('<br clear="all" style="page-break-before: always; mso-break-type: section-break;" />');

    const documentHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>مستند وثيق</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&family=Amiri&family=Cairo&display=swap');
          body {
            font-family: '${fontName}', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            padding: 40px;
            background-color: #ffffff;
            line-height: 1.6;
          }
          p {
            margin-bottom: 12px;
          }
          .word-page {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        ${joinedContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + documentHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مستند_وثيق_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const latestPages = getLatestPagesContent();
    setPagesContent(latestPages);

    try {
      setIsRendering(true);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; 

      for (let index = 0; index < latestPages.length; index++) {
        const paper = document.getElementById(`word-document-paper-${index}`);
        if (!paper) continue;

        if (index > 0) {
          pdf.addPage();
        }

        const canvas = await html2canvas(paper, {
          scale: 2.2, // High resolution rendering
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 800,
          windowHeight: 1130
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`مستند_وثيق_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleSendToAppEditor = async () => {
    const latestPages = getLatestPagesContent();
    setPagesContent(latestPages);

    try {
      setIsRendering(true);
      const renderedPages: string[] = [];

      for (let index = 0; index < latestPages.length; index++) {
        const paper = document.getElementById(`word-document-paper-${index}`);
        if (!paper) continue;

        const canvas = await html2canvas(paper, {
          scale: 2.2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 800,
          windowHeight: 1130
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        renderedPages.push(imgData);
      }

      if (renderedPages.length > 0) {
        onSendToEditor(renderedPages);
        showToast('تم إرسال المستند بنجاح! تم وضعه كـ "المستند الأصلي" في الأعلى. يمكنك الآن اختيار الختم والتوقيع لدمجهما. 📤');
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error rendering image for editor:', err);
    } finally {
      setIsRendering(false);
    }
  };

  // Font family styles
  const getFontFamilyStyle = () => {
    if (fontFamily === 'NotoNaskh') {
      return { fontFamily: "'Noto Naskh Arabic', serif" };
    }
    return fontFamily === 'Amiri' ? { fontFamily: "'Amiri', serif" } : { fontFamily: "'Cairo', sans-serif" };
  };

  // Font size mapper
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  return (
    <div id="word-creator-section" className="mt-8 bg-white rounded-3xl border border-slate-200/70 shadow-sm flex flex-col overflow-hidden transition-all duration-300">
      
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-24 right-4 left-4 md:right-auto md:left-4 z-50 bg-teal-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-scale-in border border-teal-500/30 max-w-sm">
          <Check className="bg-white/20 p-1 rounded-full text-white" size={20} />
          <p className="text-xs font-bold leading-relaxed">
            {toastMessage}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-4 text-right animate-scale-in" dir="rtl">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle size={20} />
              <h4 className="text-base font-extrabold text-slate-900">{pendingConfirm.title}</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{pendingConfirm.message}</p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  pendingConfirm.onConfirm();
                  setPendingConfirm(null);
                }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                نعم، استبدل
              </button>
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Header Click Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white hover:from-teal-50/25 hover:to-white transition-all text-right cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 text-teal-600 p-2 rounded-xl border border-teal-100/60 group-hover:scale-105 transition-transform">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800">✍️ منشئ المستندات والخطابات السريع (بديل Word)</h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">اضغط هنا لكتابة خطاب، تعهد، أو إقرار مباشرة على الموقع والختم عليه فوراً</p>
          </div>
        </div>
        <div className="text-slate-400 group-hover:text-teal-600 transition-colors">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Main expanded panel */}
      {isOpen && (
        <div className="p-5 sm:p-7 border-t border-slate-100 flex flex-col gap-5 animate-scale-in">
          
          {/* Simplified, Horizontal MS Word-like Ribbon above the paper */}
          <div className="bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3.5 shadow-3xs">
            {/* Ribbon Tools Container */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Format Controls */}
              <div className="flex items-center gap-0.5 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleFormat('bold')}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700 transition-colors cursor-pointer"
                  title="عريض"
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('italic')}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700 transition-colors cursor-pointer"
                  title="مائل"
                >
                  <Italic size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('underline')}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700 transition-colors cursor-pointer"
                  title="تحته خط"
                >
                  <Underline size={15} />
                </button>
              </div>

              {/* Align Controls */}
              <div className="flex items-center gap-0.5 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleFormat('justifyRight')}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700 transition-colors cursor-pointer"
                  title="محاذاة لليمين"
                >
                  <AlignRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('justifyCenter')}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700 transition-colors cursor-pointer"
                  title="توسيط"
                >
                  <AlignCenter size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('justifyLeft')}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700 transition-colors cursor-pointer"
                  title="محاذاة لليسار"
                >
                  <AlignLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormat('justifyFull')}
                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700 transition-colors cursor-pointer"
                  title="ضبط كامل"
                >
                  <AlignJustify size={15} />
                </button>
              </div>

              {/* Font Selection Dropdown-like Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-500">الخط:</span>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setFontFamily('NotoNaskh')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      fontFamily === 'NotoNaskh' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    خط وورد الرسمي
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFamily('Cairo')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      fontFamily === 'Cairo' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cairo
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontFamily('Amiri')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      fontFamily === 'Amiri' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Amiri
                  </button>
                </div>
              </div>

              {/* Font Size Dropdown-like Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-500">الحجم:</span>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 gap-0.5">
                  {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setFontSize(sz)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        fontSize === sz ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sz === 'sm' ? 'صغير' : sz === 'base' ? 'عادي' : sz === 'lg' ? 'كبير' : 'ضخم'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Tool */}
            <button
              type="button"
              onClick={clearEditor}
              className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} />
              مسح الورقة
            </button>
          </div>

          {/* Editor & helper section */}
          <div className="flex flex-col items-center justify-start bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200/50 w-full overflow-x-auto">
            
            {/* Custom Style tag to force perfect Word line-height and paragraph spacing */}
            <style dangerouslySetInnerHTML={{ __html: `
              .editor-content-area p {
                margin-bottom: 14px !important;
                line-height: 1.75 !important;
              }
              .editor-content-area div {
                margin-bottom: 14px;
                line-height: 1.75;
              }
            `}} />

            {/* Vertical stack of A4 Sheets (MS Word style) */}
            <div className="w-full flex flex-col items-center gap-8 py-2">
              {pagesContent.map((pageHtml, index) => (
                <div 
                  key={index}
                  className="relative w-[595px] group/page mx-auto shrink-0"
                >
                  {/* Top Header info and quick actions for this specific page */}
                  <div className="flex items-center justify-between px-2 mb-1.5 text-slate-500 text-[11px] font-bold">
                    <span className="bg-slate-200/70 text-slate-700 py-1 px-2.5 rounded-lg shadow-3xs">
                      📄 الصفحة {index + 1} من {pagesContent.length}
                    </span>
                    {pagesContent.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deletePage(index)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md border border-transparent hover:border-rose-100 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        حذف الصفحة
                      </button>
                    )}
                  </div>

                  {/* Printable container that acts like standard A4 letter */}
                  <div 
                    id={`word-document-paper-${index}`}
                    className={`
                      w-[595px] h-[842px] bg-white shadow-xl border border-slate-300 rounded-sm p-12 transition-all duration-300 relative flex flex-col justify-start
                      ${getFontSizeClass()}
                      text-slate-900 leading-relaxed
                    `}
                    style={getFontFamilyStyle()}
                  >
                    {/* Content editable Word area */}
                    <div
                      data-page-index={index}
                      contentEditable
                      suppressContentEditableWarning
                      onPaste={(e) => handlePaste(e, index)}
                      onInput={(e) => handleInput(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onBlur={(e) => {
                        updatePageContent(index, e.currentTarget.innerHTML);
                      }}
                      className="w-full h-[720px] max-h-[720px] bg-transparent focus:outline-none text-right overflow-hidden select-text editor-content-area"
                      dir="rtl"
                      dangerouslySetInnerHTML={{ __html: pageHtml }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Global Actions: Add New Page */}
            <button
              type="button"
              onClick={addNewPage}
              className="mt-6 mb-2 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/40 py-2.5 px-6 rounded-xl font-bold text-xs transition-colors shadow-3xs cursor-pointer active:scale-95"
            >
              ➕ إضافة صفحة جديدة للمستند
            </button>

            {/* HELPERS & TOOLS UNDER THE PAPER */}
            <div className="w-full max-w-[620px] mt-4">
              <div className="flex items-center gap-1 text-slate-600 font-bold text-xs mb-2">
                <Calendar size={13} className="text-teal-600" />
                <span>أدوات مساعدة سريعة (اضغط للإدراج الفوري في مكان الكتابة):</span>
              </div>

              <div className="flex flex-wrap gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-3xs">
                <button
                  type="button"
                  onClick={insertTodayDate}
                  className="flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-teal-200/40 cursor-pointer transition-colors"
                >
                  <Calendar size={12} />
                  📅 تاريخ اليوم
                </button>

                <button
                  type="button"
                  onClick={insertBismillah}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  ﷽ البسملة
                </button>

                <button
                  type="button"
                  onClick={insertSalutation}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  👋 السلام عليكم
                </button>

                <button
                  type="button"
                  onClick={insertSubject}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  📌 سطر الموضوع:
                </button>

                <button
                  type="button"
                  onClick={insertSignatures}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  ✍️ الاسم والتوقيع
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1 align-middle self-center" />

                <button
                  type="button"
                  onClick={insertPledgeTemplate}
                  className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200/30 cursor-pointer transition-colors"
                >
                  <Award size={12} />
                  نموذج إقرار وتعهد
                </button>

                <button
                  type="button"
                  onClick={insertFinancialDemandTemplate}
                  className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-rose-200/30 cursor-pointer transition-colors"
                >
                  <FileText size={12} />
                  مطالبة مالية 💰
                </button>

                <button
                  type="button"
                  onClick={insertContractTemplate}
                  className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-blue-200/30 cursor-pointer transition-colors"
                >
                  <Award size={12} />
                  عقد اتفاق 🤝
                </button>

                <button
                  type="button"
                  onClick={insertPriceQuoteTemplate}
                  className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-purple-200/30 cursor-pointer transition-colors"
                >
                  <FileText size={12} />
                  عرض سعر 📄
                </button>
              </div>
            </div>

          </div>

          {/* Main Export & Send Action Buttons below the editor area */}
          <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Export Formats */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">تصدير مباشر:</span>
              <button
                type="button"
                onClick={handleExportWord}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/30 py-2 px-3.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                <FileDown size={13} />
                ملف Word (DOC)
              </button>
              
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/30 py-2 px-3.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                <FileText size={13} />
                ملف PDF
              </button>
            </div>

            {/* Sending button that auto uploads/attaches AND scrolls to upload cards so they can configure rest of files */}
            <button
              type="button"
              disabled={isRendering}
              onClick={handleSendToAppEditor}
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm py-2.5 px-6 rounded-xl shadow-md shadow-teal-100 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {isRendering ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  جاري معالجة المستند...
                </>
              ) : (
                <>
                  <Send size={15} />
                  إدراج في المستندات أعلاه للختم والتوقيع 📤
                </>
              )}
            </button>

          </div>

        </div>
      )}

    </div>
  );
};
