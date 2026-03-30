import React, { useState, useRef, useEffect } from 'react';
import { Upload, Type, Sparkles, X, Undo2, Eraser, Settings2, ScanEye, Trash2, Zap, Wand2, Plus, Layers, XCircle, History, Maximize2, MousePointer2, Move, Crop, BoxSelect } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { GeneratedImage, AspectRatio } from '../../types';
import { compressAndResizeImage } from '../../services/geminiService';
import { generateEdit } from '../../services/editorService';
import { Button } from '../Button';

type EditMode = 'mask' | 'expand' | 'text' | 'remove';

interface MagicEditorProps {
    inputs: string[];
    setInputs: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerate: (img: GeneratedImage) => void;
}

export const MagicEditor: React.FC<MagicEditorProps> = ({ inputs, setInputs, onGenerate }) => {
    const [editorImage, setEditorImage] = useState<GeneratedImage | null>(null);
    const [editMode, setEditMode] = useState<EditMode>('mask');
    const [maskHasContent, setMaskHasContent] = useState(false);
    const [isTextEditMode, setIsTextEditMode] = useState(false);
    const [replaceText, setReplaceText] = useState('');
    const [brushSize, setBrushSize] = useState(30);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showEditSettings, setShowEditSettings] = useState(false);
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
    
    // Zoom State
    const [zoom, setZoom] = useState(1);
    
    // Expand State
    const [expandRatio, setExpandRatio] = useState<AspectRatio | 'free'>('free');
    const [expandPadding, setExpandPadding] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
    const [expandScale, setExpandScale] = useState(1);
    
    // Canvas & Drawing
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const expandCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentPath = useRef<{x: number, y: number}[]>([]);
    const [maskPaths, setMaskPaths] = useState<any[]>([]);
    
    // Draw Mode
    const [drawMode, setDrawMode] = useState<'brush' | 'rectangle'>('brush');
    const rectStart = useRef<{x: number, y: number} | null>(null);
    const [previewRect, setPreviewRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);

    // Handle Expand Interaction
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startPadding = useRef({ top: 0, bottom: 0, left: 0, right: 0 });
    const startOffset = useRef({ x: 0, y: 0 });
    
    // Auto-load first input if no image is selected
    useEffect(() => {
        if (!editorImage && inputs.length > 0) {
            handleImageSelect([inputs[0]]);
        }
    }, [inputs, editorImage]);

    useEffect(() => {
        if (editMode === 'expand' && editorImage && expandRatio !== 'free') {
            const img = new Image();
            img.onload = () => {
                const [wRatio, hRatio] = expandRatio.split(':').map(Number);
                const targetRatio = wRatio / hRatio;
                const currentRatio = img.width / img.height;
                
                let newPadding = { top: 0, bottom: 0, left: 0, right: 0 };
                
                if (currentRatio < targetRatio) {
                    // Current is taller than target, add horizontal padding
                    const targetWidth = img.height * targetRatio;
                    const totalPadding = targetWidth - img.width;
                    newPadding.left = totalPadding / 2;
                    newPadding.right = totalPadding / 2;
                } else {
                    // Current is wider than target, add vertical padding
                    const targetHeight = img.width / targetRatio;
                    const totalPadding = targetHeight - img.height;
                    newPadding.top = totalPadding / 2;
                    newPadding.bottom = totalPadding / 2;
                }
                setExpandPadding(newPadding);
                setImageOffset({ x: 0, y: 0 });
            };
            img.src = editorImage.resultUrl;
        }
    }, [expandRatio, editMode, editorImage]);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio) {
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(selected);
            } else {
                setHasApiKey(true); // Fallback for environments without aistudio global
            }
        };
        checkKey();
    }, []);

    const handleOpenKeySelector = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setHasApiKey(true); // Assume success as per guidelines
        }
    };

    const handleImageSelect = async (imgs: string[]) => {
        if (imgs[0]) {
            const compressed = await compressAndResizeImage(imgs[0], 1536);
            setInputs(p => [compressed, ...p]);
            setEditorImage({ id: Date.now().toString(), originalUrl: compressed, resultUrl: compressed, prompt: 'Imported for Edit', type: 'edit', timestamp: Date.now() });
            resetCanvas();
        }
    };

    const resetCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
        }
        setMaskHasContent(false);
        setMaskPaths([]);
    };

    const redrawMasks = (ctx: CanvasRenderingContext2D, paths: any[]) => {
        paths.forEach(path => {
            if (path.type === 'rect') {
                ctx.fillStyle = 'rgba(220, 38, 38, 0.5)';
                ctx.fillRect(path.x, path.y, path.w, path.h);
            } else {
                if (!path.points || path.points.length === 0) return;
                ctx.beginPath(); ctx.moveTo(path.points[0].x, path.points[0].y);
                for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y);
                ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = path.size || brushSize; ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)'; ctx.stroke();
            }
        });
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const startX = (e.clientX - rect.left) * scaleX;
        const startY = (e.clientY - rect.top) * scaleY;

        if (drawMode === 'rectangle') {
            rectStart.current = { x: startX, y: startY };
            setPreviewRect({ x: startX, y: startY, w: 0, h: 0 });
        } else {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            currentPath.current = [{ x: startX, y: startY }];
            ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(startX, startY);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = brushSize; ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)'; ctx.stroke();
            setMaskHasContent(true);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
        const currentY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

        if (drawMode === 'rectangle' && rectStart.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            redrawMasks(ctx, maskPaths);
            
            const rx = Math.min(rectStart.current.x, currentX);
            const ry = Math.min(rectStart.current.y, currentY);
            const rw = Math.abs(currentX - rectStart.current.x);
            const rh = Math.abs(currentY - rectStart.current.y);
            
            ctx.fillStyle = 'rgba(220, 38, 38, 0.5)';
            ctx.fillRect(rx, ry, rw, rh);
            setPreviewRect({ x: rx, y: ry, w: rw, h: rh });
        } else {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            ctx.lineTo(currentX, currentY); ctx.stroke();
            currentPath.current.push({ x: currentX, y: currentY });
        }
    };

    const stopDrawing = () => { 
        if(isDrawing) { 
            setIsDrawing(false); 
            if (drawMode === 'rectangle' && previewRect) {
                setMaskPaths(p => [...p, { type: 'rect', ...previewRect }]);
                setMaskHasContent(true);
                setPreviewRect(null);
                rectStart.current = null;
            } else if (currentPath.current.length > 0) {
                setMaskPaths(p => [...p, { type: 'path', points: [...currentPath.current], size: brushSize }]); 
                currentPath.current = []; 
            }
        } 
    };

    const undoMask = () => {
        if (maskPaths.length === 0 || !canvasRef.current) return;
        const newPaths = maskPaths.slice(0, -1);
        setMaskPaths(newPaths);
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (newPaths.length === 0) setMaskHasContent(false);
        redrawMasks(ctx, newPaths);
    };

    const handleGenerate = async (isRemoveBg = false) => {
        if (!editorImage) return;
        
        // Check for API key if using Expand mode
        if (editMode === 'expand' && !hasApiKey) {
            await handleOpenKeySelector();
            // Proceed to generate after triggering selector
        }

        setIsGenerating(true);
        try {
            let finalImage = editorImage.resultUrl;
            let finalMask = maskHasContent ? canvasRef.current?.toDataURL() : undefined;
            let instruction = replaceText;

            if (editMode === 'expand') {
                // Create expanded canvas
                const canvas = document.createElement('canvas');
                const img = new Image();
                await new Promise(r => { img.onload = r; img.src = editorImage.resultUrl; });
                
                const newWidth = img.width + expandPadding.left + expandPadding.right;
                const newHeight = img.height + expandPadding.top + expandPadding.bottom;
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Fill with a neutral gray or average color to help the AI
                    ctx.fillStyle = '#111111'; // Dark gray is better than white/light gray
                    ctx.fillRect(0, 0, newWidth, newHeight);
                    // Draw image with offset
                    ctx.drawImage(img, expandPadding.left + imageOffset.x, expandPadding.top + imageOffset.y);
                }
                finalImage = canvas.toDataURL('image/jpeg', 0.9);
                
                // Create mask for expansion area
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = newWidth;
                maskCanvas.height = newHeight;
                const mCtx = maskCanvas.getContext('2d');
                if (mCtx) {
                    mCtx.fillStyle = 'white'; // Expansion area is white (to be filled)
                    mCtx.fillRect(0, 0, newWidth, newHeight);
                    mCtx.fillStyle = 'black'; // Original area is black (preserved)
                    mCtx.fillRect(expandPadding.left + imageOffset.x, expandPadding.top + imageOffset.y, img.width, img.height);
                }
                finalMask = maskCanvas.toDataURL('image/png');
                instruction = instruction || "Generatively expand the image to fill the white areas. Match the textures, lighting, and content of the original image seamlessly. Extend the background and any objects that are cut off.";
            } else if (editMode === 'remove') {
                instruction = instruction || "Remove the object in the masked area and fill it realistically with the background.";
            }

            const { resultBase64 } = await generateEdit(finalImage, {
                editInstruction: instruction,
                maskImage: finalMask,
                textEditMode: isTextEditMode,
                isRemoveBg,
                isExpand: editMode === 'expand',
                sourceImages: editorImage.sourceImages
            });
            const newImg: GeneratedImage = { id: Date.now().toString(), originalUrl: editorImage.originalUrl, resultUrl: resultBase64, prompt: isRemoveBg ? 'Remove BG' : instruction, type: isRemoveBg ? 'remove-bg' : 'edit', timestamp: Date.now() };
            onGenerate(newImg);
            setEditorImage(newImg);
            resetCanvas();
            setExpandPadding({ top: 0, bottom: 0, left: 0, right: 0 });
            setImageOffset({ x: 0, y: 0 });
        } catch (e: any) { 
            console.error(e);
            if (e.message?.includes('PERMISSION_DENIED') || e.message?.includes('not found')) {
                setHasApiKey(false);
                alert("AI Expand requires a paid Gemini API key. Please select a valid key from a paid project.");
            } else {
                alert(`Error: ${e.message}`);
            }
        } finally { setIsGenerating(false); }
    };

    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(handle);
        setExpandRatio('free');
        startPos.current = { x: e.clientX, y: e.clientY };
        startPadding.current = { ...expandPadding };
    };

    const handleImageDragStart = (e: React.MouseEvent) => {
        if (editMode !== 'expand') return;
        e.preventDefault();
        setIsDraggingImage(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startOffset.current = { ...imageOffset };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                const dx = (e.clientX - startPos.current.x) / zoom;
                const dy = (e.clientY - startPos.current.y) / zoom;
                
                setExpandPadding(prev => {
                    const next = { ...prev };
                    if (isResizing.includes('top')) next.top = Math.max(0, startPadding.current.top - dy);
                    if (isResizing.includes('bottom')) next.bottom = Math.max(0, startPadding.current.bottom + dy);
                    if (isResizing.includes('left')) next.left = Math.max(0, startPadding.current.left - dx);
                    if (isResizing.includes('right')) next.right = Math.max(0, startPadding.current.right + dx);
                    return next;
                });
            } else if (isDraggingImage) {
                const dx = (e.clientX - startPos.current.x) / zoom;
                const dy = (e.clientY - startPos.current.y) / zoom;
                setImageOffset({
                    x: startOffset.current.x + dx,
                    y: startOffset.current.y + dy
                });
            }
        };
        const handleMouseUp = () => {
            setIsResizing(null);
            setIsDraggingImage(false);
        };
        if (isResizing || isDraggingImage) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, isDraggingImage, zoom]);

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#050505] overflow-hidden">
             {/* Sidebar Modes */}
             <div className="hidden lg:flex w-16 border-r border-white/5 bg-[#0a0a0c] flex-col items-center py-6 gap-6 z-40">
                <button onClick={() => {setEditMode('mask'); setIsTextEditMode(false);}} className={`p-3 rounded-xl transition-all ${editMode === 'mask' && !isTextEditMode ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`} title="Insert">
                    <Sparkles size={20}/>
                    <span className="text-[8px] font-bold mt-1 uppercase">Insert</span>
                </button>
                <button onClick={() => {setEditMode('remove'); setIsTextEditMode(false);}} className={`p-3 rounded-xl transition-all ${editMode === 'remove' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`} title="Remove">
                    <Eraser size={20}/>
                    <span className="text-[8px] font-bold mt-1 uppercase">Remove</span>
                </button>
                <button onClick={() => setEditMode('expand')} className={`p-3 rounded-xl transition-all ${editMode === 'expand' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`} title="AI Expand">
                    <Maximize2 size={20}/>
                    <span className="text-[8px] font-bold mt-1 uppercase">Expand</span>
                </button>
                <button onClick={() => {setEditMode('mask'); setIsTextEditMode(true);}} className={`p-3 rounded-xl transition-all ${isTextEditMode ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`} title="Text Edit">
                    <Type size={20}/>
                    <span className="text-[8px] font-bold mt-1 uppercase">Text</span>
                </button>
                <div className="mt-auto">
                    <button className="p-3 text-slate-600 hover:text-white transition-colors flex flex-col items-center" title="Pan View">
                        <Move size={20}/>
                        <span className="text-[8px] font-bold mt-1 uppercase">Pan</span>
                    </button>
                </div>
             </div>

             <div className="flex-1 relative flex flex-col overflow-hidden bg-[#050505]">
                 <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none">
                    <span className={editMode === 'expand' ? 'text-blue-500' : editMode === 'remove' ? 'text-red-500' : 'text-pink-500'}>{editMode === 'expand' ? 'AI Expand' : editMode === 'remove' ? 'Remove Object' : 'Magic Edit'}</span>
                    <span className="text-slate-700">/</span>
                    <span>{maskHasContent ? 'Masking Active' : editMode === 'expand' ? 'Expansion Mode' : 'Canvas Ready'}</span>
                 </div>
                 
                 <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#080808]">
                      {/* API Key Selection Banner */}
                      {editMode === 'expand' && hasApiKey === false && (
                          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-500">
                              <div className="bg-blue-600/90 backdrop-blur-xl border border-blue-400/30 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl">
                                  <div className="flex flex-col">
                                      <p className="text-xs font-bold text-white uppercase tracking-wider">API Key Required</p>
                                      <p className="text-[10px] text-blue-100">AI Expand requires a paid Gemini API key.</p>
                                  </div>
                                  <button 
                                    onClick={handleOpenKeySelector}
                                    className="px-4 py-2 bg-white text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-blue-50 transition-colors"
                                  >
                                      Select Key
                                  </button>
                                  <a 
                                    href="https://ai.google.dev/gemini-api/docs/billing" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-200 underline hover:text-white transition-colors"
                                  >
                                      Billing Info
                                  </a>
                              </div>
                          </div>
                      )}

                      {/* Zoom Controls Overlay */}
                      {editorImage && (
                          <div className="absolute top-6 right-6 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                              <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col items-center gap-3 shadow-2xl">
                                  <button onClick={() => setZoom(prev => Math.min(3, prev + 0.1))} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Plus size={16}/></button>
                                  <div className="h-24 w-1 bg-white/10 rounded-full relative group cursor-pointer">
                                      <input 
                                        type="range" 
                                        min="0.1" 
                                        max="3" 
                                        step="0.01" 
                                        value={zoom} 
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="absolute inset-0 w-24 h-1 -rotate-90 origin-center translate-y-11 -translate-x-11 opacity-0 cursor-pointer z-10"
                                      />
                                      <div 
                                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full transition-all"
                                        style={{ height: `${((zoom - 0.1) / 2.9) * 100}%` }}
                                      ></div>
                                  </div>
                                  <button onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><X size={16} className="rotate-45"/></button>
                                  <div className="w-px h-4 bg-white/10"></div>
                                  <button onClick={() => setZoom(1)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Fit to Screen"><Maximize2 size={16}/></button>
                                  <div className="text-[9px] font-black text-slate-500 font-mono">{Math.round(zoom * 100)}%</div>
                              </div>
                          </div>
                      )}

                      {editorImage ? (
                          <div className="relative w-full h-full p-4 lg:p-20 flex items-center justify-center animate-in fade-in zoom-in-[0.99] duration-500 ease-out-quint overflow-auto custom-scrollbar">
                              <div 
                                className="relative shadow-2xl rounded-lg group border border-white/10 transition-transform duration-200 ease-out"
                                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                              >
                                  {/* Expansion Overlay */}
                                  {editMode === 'expand' && (
                                      <div 
                                        className="absolute border-2 border-blue-500/50 bg-blue-500/5 pointer-events-none z-10"
                                        style={{
                                            top: -expandPadding.top,
                                            bottom: -expandPadding.bottom,
                                            left: -expandPadding.left,
                                            right: -expandPadding.right,
                                        }}
                                      >
                                          {/* Grid Lines */}
                                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                                              {[...Array(9)].map((_, i) => <div key={i} className="border border-blue-500/30"></div>)}
                                          </div>
                                          
                                          {/* Handles */}
                                          <div onMouseDown={(e) => handleResizeStart(e, 'top')} className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-blue-500 rounded-full cursor-ns-resize pointer-events-auto shadow-lg"></div>
                                          <div onMouseDown={(e) => handleResizeStart(e, 'bottom')} className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-blue-500 rounded-full cursor-ns-resize pointer-events-auto shadow-lg"></div>
                                          <div onMouseDown={(e) => handleResizeStart(e, 'left')} className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-12 bg-blue-500 rounded-full cursor-ew-resize pointer-events-auto shadow-lg"></div>
                                          <div onMouseDown={(e) => handleResizeStart(e, 'right')} className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-12 bg-blue-500 rounded-full cursor-ew-resize pointer-events-auto shadow-lg"></div>
                                          
                                          {/* Corner Handles */}
                                          <div onMouseDown={(e) => handleResizeStart(e, 'top-left')} className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-blue-500 cursor-nwse-resize pointer-events-auto"></div>
                                          <div onMouseDown={(e) => handleResizeStart(e, 'top-right')} className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-blue-500 cursor-nesw-resize pointer-events-auto"></div>
                                          <div onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-blue-500 cursor-nesw-resize pointer-events-auto"></div>
                                          <div onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-blue-500 cursor-nwse-resize pointer-events-auto"></div>
                                      </div>
                                  )}

                                  <img 
                                    src={editorImage.resultUrl} 
                                    className={`max-h-full max-w-full object-contain pointer-events-none select-none transition-transform duration-200`}
                                    style={{ 
                                        transform: editMode === 'expand' ? `translate(${imageOffset.x}px, ${imageOffset.y}px)` : 'none',
                                    }}
                                    onLoad={(e) => { if (canvasRef.current) { const img = e.currentTarget; canvasRef.current.width = img.width; canvasRef.current.height = img.height; } }} 
                                  />
                                  
                                  {editMode === 'expand' && (
                                      <div 
                                        className="absolute inset-0 cursor-move z-20"
                                        onMouseDown={handleImageDragStart}
                                      ></div>
                                  )}
                                  
                                  {(editMode === 'mask' || editMode === 'remove') && (
                                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair opacity-60" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                                  )}
                                  
                                  {maskHasContent && (editMode === 'mask' || editMode === 'remove') && (<div className="absolute top-4 right-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-in fade-in z-30 pointer-events-none">MASK ACTIVE</div>)}
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center gap-6 opacity-80 animate-in fade-in duration-500">
                              <div className="w-32 h-32 relative group">
                                <div className="absolute inset-0 bg-[#0a0a0c] rounded-2xl border-2 border-dashed border-slate-700 group-hover:border-purple-500 group-hover:bg-purple-900/10 transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xl"><Upload className="text-slate-400 group-hover:text-purple-400 transition-colors" size={32} /></div>
                                <div className="opacity-0 absolute inset-0"><ImageUploader onImagesSelect={handleImageSelect} compact /></div>
                              </div>
                              <div className="flex flex-col items-center"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Drag & Drop Image</p></div>
                          </div>
                      )}
                 </div>

                 {/* Controls */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] lg:max-w-[90vw] flex flex-col gap-2 items-center pointer-events-none">
                      {editorImage && (
                          <div className={`w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-xl p-1.5 flex flex-col shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-500 mb-1 pointer-events-auto`}>
                               <div className="flex items-center w-full">
                                   <div className={`p-2 ${editMode === 'expand' ? 'text-blue-400' : editMode === 'remove' ? 'text-red-400' : isTextEditMode ? 'text-green-400' : 'text-pink-500'}`}>
                                       {editMode === 'expand' ? <Maximize2 size={16}/> : editMode === 'remove' ? <Eraser size={16}/> : isTextEditMode ? <Type size={16}/> : <Sparkles size={16}/>}
                                   </div>
                                   <input value={replaceText} onChange={(e)=>setReplaceText(e.target.value)} placeholder={editMode === 'expand' ? "Expansion prompt (optional)..." : editMode === 'remove' ? "Describe what to remove (optional)..." : isTextEditMode ? "Enter new text..." : "Describe edit (e.g., 'Remove object')..."} className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 px-2"/>
                                   {replaceText && <button onClick={()=>setReplaceText('')} className="p-1 hover:text-white text-slate-500 mr-1"><X size={12}/></button>}
                               </div>
                               {editorImage.sourceImages && editorImage.sourceImages.length > 1 && isTextEditMode && (
                                   <div className="flex items-center gap-2 px-2 pb-2 pt-1 border-t border-white/5 mt-1 overflow-x-auto custom-scrollbar">
                                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Call out:</span>
                                       {editorImage.sourceImages.map((src, idx) => (
                                           <button 
                                               key={idx} 
                                               onClick={() => setReplaceText(prev => prev + (prev ? ' ' : '') + `[Product ${idx + 1}]`)}
                                               className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors shrink-0"
                                           >
                                               <img src={src} className="w-4 h-4 rounded object-cover" />
                                               <span className="text-[10px] font-medium text-slate-300 whitespace-nowrap">[Product {idx + 1}]</span>
                                           </button>
                                       ))}
                                   </div>
                               )}
                          </div>
                      )}
                      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-wrap justify-center items-center gap-2 md:gap-4 shadow-2xl backdrop-blur-md relative pointer-events-auto animate-in slide-in-from-bottom-4 duration-500">
                           {(editMode === 'mask' || editMode === 'remove') ? (
                               <>
                                   <div className="flex items-center gap-2 px-2">
                                       <button onClick={() => setDrawMode('brush')} className={`p-1.5 rounded-lg ${drawMode === 'brush' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}><Sparkles size={14}/></button>
                                       <button onClick={() => setDrawMode('rectangle')} className={`p-1.5 rounded-lg ${drawMode === 'rectangle' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}><BoxSelect size={14}/></button>
                                       <div className="w-px h-4 bg-white/10 mx-1"></div>
                                       <span className="text-[10px] font-bold text-slate-500 uppercase mr-2 hidden md:block">Brush</span><input type="range" min="5" max="100" value={brushSize} onChange={(e)=>setBrushSize(Number(e.target.value))} className={`w-16 md:w-24 h-1 bg-white/10 rounded-full ${editMode === 'remove' ? 'accent-red-500' : 'accent-pink-500'} cursor-pointer`}/><div className="w-6 h-6 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-[10px] font-mono text-slate-300">{brushSize}</div>
                                   </div>
                                   <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                                   <div className="flex gap-1"><button onClick={undoMask} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Undo"><Undo2 size={16}/></button><button onClick={resetCanvas} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Clear Mask"><Eraser size={16}/></button></div>
                               </>
                           ) : (
                               <div className="flex gap-1 px-2">
                                   {[AspectRatio.SQUARE, AspectRatio.PORTRAIT, AspectRatio.LANDSCAPE, AspectRatio.WIDE].map(ratio => (
                                       <button 
                                            key={ratio} 
                                            onClick={() => setExpandRatio(ratio)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${expandRatio === ratio ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                        >
                                           {ratio}
                                       </button>
                                   ))}
                                   <div className="w-px h-4 bg-white/10 mx-1"></div>
                                   <button onClick={() => {setExpandPadding({top: 0, bottom: 0, left: 0, right: 0}); setImageOffset({x: 0, y: 0}); setExpandRatio('free');}} className="p-2 text-slate-500 hover:text-white" title="Reset Expansion"><Undo2 size={16}/></button>
                                   {!hasApiKey && (
                                       <button 
                                         onClick={handleOpenKeySelector}
                                         className="ml-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all"
                                       >
                                           Select Key
                                       </button>
                                   )}
                               </div>
                           )}
                           
                           <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                           
                           <button 
                                onClick={()=>handleGenerate(false)} 
                                disabled={isGenerating || !editorImage} 
                                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all ${editMode === 'expand' ? 'bg-blue-600 hover:bg-blue-500' : editMode === 'remove' ? 'bg-red-600 hover:bg-red-500' : 'bg-pink-600 hover:bg-pink-500'} text-white`}
                            >
                                {isGenerating ? <Zap size={14} className="animate-spin"/> : <Wand2 size={14}/>} 
                                <span className="hidden md:inline">Generate</span>
                           </button>
                           
                           <button onClick={()=>setShowEditSettings(!showEditSettings)} className={`p-2 rounded-lg transition-colors ${showEditSettings ? 'text-white bg-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Settings2 size={16}/></button>
                      </div>
                      {showEditSettings && (
                          <div className="absolute bottom-full mb-3 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 w-48 shadow-2xl animate-in fade-in zoom-in-95 z-50 pointer-events-auto">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Options</h4>
                              <button onClick={()=>handleGenerate(true)} disabled={!editorImage || isGenerating} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 mb-1"><ScanEye size={12}/> Remove Background</button>
                              <button onClick={() => {setEditorImage(null); resetCanvas(); setShowEditSettings(false); setExpandPadding({top: 0, bottom: 0, left: 0, right: 0});}} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"><Trash2 size={12}/> Clear Canvas</button>
                          </div>
                      )}
                 </div>
             </div>
             {/* History */}
             <div className="hidden lg:flex w-[340px] border-l border-white/5 bg-[#0a0a0c] flex-col z-30 shadow-2xl animate-in slide-in-from-right-4 duration-500">
                 <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0f0f11]"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> History</h3><div className="flex gap-2"><span className="text-[10px] bg-pink-900/20 text-pink-500 px-2 py-0.5 rounded border border-pink-500/20">{inputs.length} Sources</span></div></div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#050505]">
                     {inputs.map((img, i) => (
                          <div key={i} onClick={() => { setEditorImage({ id: Date.now().toString(), originalUrl: img, resultUrl: img, prompt: 'Revert', type: 'edit', timestamp: Date.now() }); resetCanvas(); }} className={`group relative overflow-hidden rounded-xl border transition-all cursor-pointer ${editorImage?.originalUrl === img ? 'border-pink-500 bg-[#1a1a1a]' : 'border-white/5 bg-[#0f0f11] hover:bg-white/5'}`}>
                              <div className="flex p-3 gap-3"><div className="w-16 h-16 rounded-lg bg-black border border-white/10 shrink-0 overflow-hidden"><img src={img} className="w-full h-full object-cover"/></div><div className="flex-1 min-w-0 flex flex-col justify-center"><div className="flex justify-between items-start"><span className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">Source</span></div></div></div>
                              <button onClick={(e)=>{e.stopPropagation(); setInputs(p => p.filter((_, idx) => idx !== i));}} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-opacity"><XCircle size={12}/></button>
                          </div>
                     ))}
                 </div>
                 <div className="p-4 border-t border-white/5 bg-[#0a0a0c] space-y-3 pb-8"><div className="relative group w-full h-24"><div className="absolute inset-0 bg-[#050505] rounded-xl border border-dashed border-white/20 group-hover:border-pink-500 group-hover:bg-pink-900/5 transition-all flex flex-col items-center justify-center cursor-pointer"><div className="mb-2 p-2 bg-white/5 rounded-full text-slate-500 group-hover:text-pink-400 transition-colors"><Plus size={16}/></div><span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-300">New Project</span></div><div className="absolute inset-0 opacity-0 cursor-pointer"><ImageUploader onImagesSelect={handleImageSelect} compact /></div></div></div>
             </div>
        </div>
    );
};