import React, { useState, useRef } from 'react';
import { Upload, Type, Sparkles, X, Undo2, Eraser, Settings2, ScanEye, Trash2, Zap, Wand2, Plus, Layers, XCircle, History } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { GeneratedImage } from '../../types';
import { compressAndResizeImage } from '../../services/geminiService';
import { generateEdit } from '../../services/editorService';
import { Button } from '../Button';

interface MagicEditorProps {
    inputs: string[];
    setInputs: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerate: (img: GeneratedImage) => void;
}

export const MagicEditor: React.FC<MagicEditorProps> = ({ inputs, setInputs, onGenerate }) => {
    const [editorImage, setEditorImage] = useState<GeneratedImage | null>(null);
    const [maskHasContent, setMaskHasContent] = useState(false);
    const [isTextEditMode, setIsTextEditMode] = useState(false);
    const [replaceText, setReplaceText] = useState('');
    const [brushSize, setBrushSize] = useState(30);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showEditSettings, setShowEditSettings] = useState(false);
    
    // Canvas & Drawing
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const currentPath = useRef<{x: number, y: number}[]>([]);
    const [maskPaths, setMaskPaths] = useState<{points: {x: number, y: number}[], size: number}[]>([]);

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

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        setIsDrawing(true);
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        currentPath.current = [{ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }];
        ctx.beginPath(); ctx.moveTo(currentPath.current[0].x, currentPath.current[0].y); ctx.lineTo(currentPath.current[0].x, currentPath.current[0].y);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = brushSize; ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)'; ctx.stroke();
        setMaskHasContent(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
        const currentY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
        ctx.lineTo(currentX, currentY); ctx.stroke();
        currentPath.current.push({ x: currentX, y: currentY });
    };

    const stopDrawing = () => { 
        if(isDrawing) { setIsDrawing(false); if (currentPath.current.length > 0) setMaskPaths(p => [...p, { points: [...currentPath.current], size: brushSize }]); currentPath.current = []; } 
    };

    const undoMask = () => {
        if (maskPaths.length === 0 || !canvasRef.current) return;
        const newPaths = maskPaths.slice(0, -1);
        setMaskPaths(newPaths);
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (newPaths.length === 0) setMaskHasContent(false);
        newPaths.forEach(path => {
            if (path.points.length === 0) return;
            ctx.beginPath(); ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = path.size; ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)'; ctx.stroke();
        });
    };

    const handleGenerate = async (isRemoveBg = false) => {
        if (!editorImage) return;
        setIsGenerating(true);
        try {
            const { resultBase64 } = await generateEdit(editorImage.resultUrl, {
                editInstruction: replaceText,
                maskImage: maskHasContent ? canvasRef.current?.toDataURL() : undefined,
                textEditMode: isTextEditMode,
                isRemoveBg
            });
            const newImg: GeneratedImage = { id: Date.now().toString(), originalUrl: editorImage.originalUrl, resultUrl: resultBase64, prompt: isRemoveBg ? 'Remove BG' : replaceText, type: isRemoveBg ? 'remove-bg' : 'edit', timestamp: Date.now() };
            onGenerate(newImg);
            setEditorImage(newImg);
            resetCanvas();
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#050505] overflow-hidden">
             <div className="flex-1 relative flex flex-col overflow-hidden bg-[#050505]">
                 <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none"><span className="text-pink-500">Magic Edit</span><span className="text-slate-700">/</span><span>{maskHasContent ? 'Masking Active' : 'Canvas Ready'}</span></div>
                 <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#080808]">
                      {editorImage ? (
                          <div className="relative w-full h-full p-4 lg:p-12 flex items-center justify-center">
                              <div className="relative shadow-2xl rounded-lg overflow-hidden group border border-white/10 max-h-[70vh] lg:max-h-[85vh] max-w-[90vw] lg:max-w-[85vw]">
                                  <img src={editorImage.resultUrl} className="max-h-full max-w-full object-contain pointer-events-none select-none" onLoad={(e) => { if (canvasRef.current) { const img = e.currentTarget; canvasRef.current.width = img.width; canvasRef.current.height = img.height; } }} />
                                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair opacity-60" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                                  {maskHasContent && (<div className="absolute top-4 right-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-in fade-in z-30 pointer-events-none">MASK ACTIVE</div>)}
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center gap-6 opacity-80">
                              <div className="w-32 h-32 relative group">
                                <div className="absolute inset-0 bg-[#0a0a0c] rounded-2xl border-2 border-dashed border-slate-700 group-hover:border-purple-500 group-hover:bg-purple-900/10 transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xl"><Upload className="text-slate-400 group-hover:text-purple-400 transition-colors" size={32} /></div>
                                <div className="opacity-0 absolute inset-0"><ImageUploader onImagesSelect={handleImageSelect} compact /></div>
                              </div>
                              <div className="flex flex-col items-center"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Drag & Drop Image</p></div>
                          </div>
                      )}
                 </div>

                 {/* Mobile Inputs - Vertical Right Floating Bar */}
                 <div className="absolute right-4 bottom-48 z-40 lg:hidden flex flex-col gap-3">
                       {inputs.map((img, i) => (
                           <div key={i} onClick={()=>{ setEditorImage({ id: Date.now().toString(), originalUrl: img, resultUrl: img, prompt: 'Revert', type: 'edit', timestamp: Date.now() }); resetCanvas(); }} className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shadow-lg ${editorImage?.originalUrl === img ? 'border-pink-500 shadow-pink-500/30' : 'border-white/20 bg-black/40'}`}>
                               <img src={img} className="w-full h-full object-cover"/>
                           </div>
                       ))}
                       {/* Add Button */}
                       <div className="relative w-14 h-14 rounded-lg border-2 border-pink-500 bg-pink-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                           <Plus size={24} className="text-pink-400" />
                           <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={handleImageSelect} compact /></div>
                       </div>
                 </div>

                 {/* Controls */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] lg:max-w-[90vw] flex flex-col gap-2 items-center pointer-events-none">
                      {editorImage && (
                          <div className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-xl p-1.5 flex items-center shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 mb-1 pointer-events-auto">
                               <div className={`p-2 ${isTextEditMode ? 'text-green-400' : 'text-pink-500'}`}>{isTextEditMode ? <Type size={16}/> : <Sparkles size={16}/>}</div>
                               <input value={replaceText} onChange={(e)=>setReplaceText(e.target.value)} placeholder={isTextEditMode ? "Enter new text..." : "Describe edit (e.g., 'Remove object')..."} className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 px-2"/>
                               {replaceText && <button onClick={()=>setReplaceText('')} className="p-1 hover:text-white text-slate-500 mr-1"><X size={12}/></button>}
                          </div>
                      )}
                      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-wrap justify-center items-center gap-2 md:gap-4 shadow-2xl backdrop-blur-md relative pointer-events-auto">
                           <div className="flex items-center gap-2 px-2"><span className="text-[10px] font-bold text-slate-500 uppercase mr-2 hidden md:block">Brush</span><input type="range" min="5" max="100" value={brushSize} onChange={(e)=>setBrushSize(Number(e.target.value))} className="w-16 md:w-24 h-1 bg-white/10 rounded-full accent-pink-500 cursor-pointer"/><div className="w-6 h-6 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-[10px] font-mono text-slate-300">{brushSize}</div></div>
                           <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                           <div className="flex gap-1"><button onClick={undoMask} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Undo"><Undo2 size={16}/></button><button onClick={resetCanvas} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="Clear Mask"><Eraser size={16}/></button><div className="w-px h-4 bg-white/10 mx-1"></div><button onClick={()=>setIsTextEditMode(!isTextEditMode)} className={`p-2 rounded-lg transition-all flex items-center gap-2 ${isTextEditMode ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Text Mode"><Type size={16}/></button></div>
                           <div className="h-6 w-px bg-white/10 hidden md:block"></div>
                           <button onClick={()=>handleGenerate(false)} disabled={isGenerating || !editorImage} className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50">{isGenerating ? <Zap size={14} className="animate-spin"/> : <Wand2 size={14}/>} <span className="hidden md:inline">Generate</span></button>
                           <button onClick={()=>setShowEditSettings(!showEditSettings)} className={`p-2 rounded-lg transition-colors ${showEditSettings ? 'text-white bg-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Settings2 size={16}/></button>
                      </div>
                      {showEditSettings && (
                          <div className="absolute bottom-full mb-3 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 w-48 shadow-2xl animate-in fade-in zoom-in-95 z-50 pointer-events-auto">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Options</h4>
                              <button onClick={()=>handleGenerate(true)} disabled={!editorImage || isGenerating} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 mb-1"><ScanEye size={12}/> Remove Background</button>
                              <button onClick={() => {setEditorImage(null); resetCanvas(); setShowEditSettings(false);}} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"><Trash2 size={12}/> Clear Canvas</button>
                          </div>
                      )}
                 </div>
             </div>
             {/* History */}
             <div className="hidden lg:flex w-[340px] border-l border-white/5 bg-[#0a0a0c] flex-col z-30 shadow-2xl">
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