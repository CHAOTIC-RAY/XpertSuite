import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, MousePointer2, Columns, Settings2, ImagePlus, ArrowRightLeft, Download, XCircle, Trash2, Layers, Sparkles, ChevronUp, History, PlayCircle, Plus, Zap } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { GeneratedImage } from '../../types';
import { generateUpscale } from '../../services/upscaleService';

// Constants locally to avoid dependency issues if not moved
type UpscaleModelType = 'Standard' | 'High Fidelity' | 'Low Res' | 'Art & CG';
const UPSCALE_MODES: { label: string, value: UpscaleModelType }[] = [
    { label: 'Standard', value: 'Standard' },
    { label: 'Realism', value: 'High Fidelity' },
    { label: 'Art & CG', value: 'Art & CG' }
];
const CREATIVITY_LEVELS = [
    { label: 'Zero', value: 0 }, { label: 'Subtle', value: 1 }, { label: 'Low', value: 2 }, 
    { label: 'Medium', value: 3 }, { label: 'High', value: 4 }, { label: 'Max', value: 5 },
];

// Helper: Zoom Hook
const useZoomWheel = (active: boolean, ref: React.RefObject<HTMLElement>) => {
    const [zoom, setZoom] = useState(1);
    useEffect(() => { if (!active) setZoom(1); }, [active]);
    useEffect(() => {
        const el = ref.current;
        if (!el || !active) return;
        const onWheel = (e: WheelEvent) => { e.preventDefault(); const delta = e.deltaY * -0.001; setZoom(z => Math.min(6, Math.max(1, z + delta))); };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [active, ref]);
    return zoom;
};

// Helper: Comparison
const ImageComparison = ({ before, after, isZoomMode }: any) => {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoom = useZoomWheel(isZoomMode, containerRef);
    const handleMove = (clientX: number) => { if (containerRef.current) { const rect = containerRef.current.getBoundingClientRect(); setSliderPos(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))); } };
    useEffect(() => { const onM = (e: any) => { if (isDragging) handleMove(e.clientX || e.touches[0].clientX); }; const onU = () => setIsDragging(false); if (isDragging) { window.addEventListener('mousemove', onM); window.addEventListener('touchmove', onM); window.addEventListener('mouseup', onU); window.addEventListener('touchend', onU); } return () => { window.removeEventListener('mousemove', onM); window.removeEventListener('touchmove', onM); window.removeEventListener('mouseup', onU); window.removeEventListener('touchend', onU); }; }, [isDragging]);
    return (
        <div ref={containerRef} className={`relative select-none rounded-xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group cursor-col-resize mx-auto transition-all`} style={{ width: isZoomMode ? `${zoom * 85}vw` : 'auto', maxWidth: isZoomMode ? 'none' : '85vw', maxHeight: isZoomMode ? 'none' : '80vh' }} onMouseDown={(e) => { setIsDragging(true); handleMove(e.clientX); }} onTouchStart={(e) => { setIsDragging(true); handleMove(e.touches[0].clientX); }}>
            <img src={before} className={`block w-full object-contain pointer-events-none ${isZoomMode?'':'max-h-[80vh] max-w-full'}`} />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}><img src={after} className="absolute inset-0 w-full h-full pointer-events-none" /></div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-20 shadow-[0_0_20px_rgba(0,0,0,0.8)]" style={{ left: `${sliderPos}%` }}><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur border border-white/50 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110"><ArrowRightLeft size={14} className="text-white" /></div></div>
            {isZoomMode && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white">ZOOM: {Math.round(zoom * 100)}%</div>}
        </div>
    );
};

interface UpscaleProps {
    inputs: string[];
    setInputs: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerate: (img: GeneratedImage) => void;
    generatedImages: GeneratedImage[]; // needed to show history
}

export const Upscale: React.FC<UpscaleProps> = ({ inputs, setInputs, onGenerate, generatedImages }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [latestResult, setLatestResult] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Settings
    const [scaleFactor, setScaleFactor] = useState<'2x' | '4x' | '6x' | '8x'>('4x');
    const [model, setModel] = useState<UpscaleModelType>('Standard');
    const [creativity, setCreativity] = useState(0);
    const [sharpen, setSharpen] = useState(50);
    const [denoise, setDenoise] = useState(30);
    const [faceRec, setFaceRec] = useState(false);
    const [textRec, setTextRec] = useState(false);
    const [prompt, setPrompt] = useState('');
    
    // UI
    const [zoomMode, setZoomMode] = useState(false);
    const [compareMode, setCompareMode] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showCreativity, setShowCreativity] = useState(false);
    const [showMobileQueue, setShowMobileQueue] = useState(false); // Mobile History State

    const singleImageRef = useRef<HTMLDivElement>(null);
    const zoom = useZoomWheel(zoomMode, singleImageRef);

    const handleGenerate = async () => {
        if (!inputs[activeIndex]) return;
        setIsGenerating(true);
        try {
            const { resultBase64 } = await generateUpscale(inputs[activeIndex], {
                scaleFactor, upscaleModel: model, upscaleCreativityLevel: creativity,
                upscaleSharpen: sharpen, upscaleDenoise: denoise, faceRecovery: faceRec, textRecovery: textRec, customPrompt: prompt
            });
            setLatestResult(resultBase64);
            onGenerate({ id: Date.now().toString(), originalUrl: inputs[activeIndex], resultUrl: resultBase64, prompt: 'Upscale', type: 'upscale', timestamp: Date.now() });
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    const handleBatch = async () => {
        if (inputs.length === 0) return;
        setIsGenerating(true);
        try {
            for (const img of inputs) {
                const { resultBase64 } = await generateUpscale(img, {
                    scaleFactor, upscaleModel: model, upscaleCreativityLevel: creativity,
                    upscaleSharpen: sharpen, upscaleDenoise: denoise, faceRecovery: faceRec, textRecovery: textRec
                });
                onGenerate({ id: Date.now().toString(), originalUrl: img, resultUrl: resultBase64, prompt: 'Batch Upscale', type: 'upscale', timestamp: Date.now() });
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    const handleClearAll = () => { setInputs([]); setLatestResult(null); };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#000]">
            <div className="flex-1 relative flex flex-col bg-[#050505] overflow-hidden">
                <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500"><span className="text-green-500">GigaXpert</span> <span className="text-slate-700">/</span> <span>{latestResult ? 'Result' : 'Source'}</span></div>
                
                {/* Mobile History Toggle */}
                <div className="lg:hidden absolute top-4 right-4 z-50">
                    <button 
                        onClick={() => setShowMobileQueue(!showMobileQueue)}
                        className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all ${showMobileQueue ? 'bg-white text-black border-white' : 'bg-[#0a0a0c] text-slate-300 border-white/10'}`}
                    >
                        <Layers size={14} />
                        <span>History</span>
                        <span className={`${showMobileQueue ? 'bg-black text-white' : 'bg-green-600 text-black'} px-1.5 rounded text-[9px] font-black`}>{inputs.length}</span>
                    </button>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-8 pb-40 w-full relative custom-scrollbar">
                    {latestResult ? (
                        compareMode ? <ImageComparison before={inputs[activeIndex]} after={latestResult} isZoomMode={zoomMode} /> :
                        <div ref={singleImageRef} className="relative transition-all duration-100 ease-out" style={{ width: zoomMode ? `${zoom * 85}vw` : 'auto', maxWidth: zoomMode ? 'none' : '85vw', maxHeight: zoomMode ? 'none' : '80vh' }}>
                            <img src={latestResult} className="w-full h-full object-contain rounded-lg shadow-2xl" />
                            {zoomMode && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white pointer-events-none">ZOOM: {Math.round(zoom * 100)}%</div>}
                        </div>
                    ) : inputs[activeIndex] ? <img src={inputs[activeIndex]} className="max-w-[90vw] h-auto object-contain shadow-2xl rounded-lg" /> : <div className="text-center opacity-30 flex flex-col items-center"><ImagePlus size={32} /><p className="text-sm font-bold uppercase tracking-widest mt-2">No Image Selected</p></div>}
                </div>

                {/* Mobile Queue (Vertical Bar) - Toggled via Top Button */}
                {showMobileQueue && (
                    <div className="absolute right-4 top-16 bottom-52 z-40 lg:hidden flex flex-col gap-3 overflow-y-auto no-scrollbar py-2 animate-in slide-in-from-right-4 fade-in duration-200">
                        {inputs.map((img, i) => (
                            <div key={i} onClick={() => { setActiveIndex(i); setLatestResult(null); }} className={`relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shadow-lg ${activeIndex === i ? 'border-green-500 shadow-green-500/30' : 'border-white/20 bg-black/40'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </div>
                        ))}
                        <div className="relative w-14 h-14 shrink-0 rounded-lg border-2 border-green-500 bg-green-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            <Plus size={24} className="text-green-400" />
                            <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(p => [...p, ...imgs])} compact /></div>
                        </div>
                    </div>
                )}

                {/* Controls Bar */}
                <div className="absolute bottom-2 lg:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-[98vw] lg:max-w-[90vw] flex flex-col gap-2 items-center px-2">
                    {/* Mode & Creativity - Removed overflow-x-auto to fix dropdown clipping, added flex-wrap */}
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-1.5 flex flex-wrap justify-center items-center shadow-2xl animate-in slide-in-from-bottom-4 relative max-w-full pointer-events-auto gap-2 lg:gap-0">
                        <div className="flex items-center px-2"><span className="text-[10px] font-bold text-slate-500 uppercase mr-3">Mode</span><div className="flex bg-[#0a0a0c] rounded-lg p-1 border border-white/5">{UPSCALE_MODES.map((m) => (<button key={m.label} onClick={() => setModel(m.value)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all relative whitespace-nowrap ${model === m.value ? 'bg-[#2a2a2a] text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{m.label}</button>))}</div></div>
                        <div className="w-px h-6 bg-white/10 mx-2 shrink-0 hidden lg:block"></div>
                        <div className="flex items-center px-2 relative"><span className="text-[10px] font-bold text-slate-500 uppercase mr-3">Creativity</span><div className="relative"><button onClick={() => setShowCreativity(!showCreativity)} className="flex items-center gap-2 bg-[#0a0a0c] border border-white/5 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all min-w-[80px] justify-between">{CREATIVITY_LEVELS.find(l => l.value === creativity)?.label}<ChevronUp size={12} /></button>{showCreativity && (<div className="absolute bottom-full left-0 mb-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-bottom-left z-50 flex flex-col-reverse">{CREATIVITY_LEVELS.map((level) => (<button key={level.value} onClick={() => { setCreativity(level.value); setShowCreativity(false); }} className={`px-4 py-2.5 text-left text-[10px] font-bold flex justify-between items-center transition-colors ${creativity === level.value ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{level.label}</button>))}</div>)}</div></div>
                    </div>
                    
                    {model === 'Standard' && (<div className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-xl p-3 flex items-center shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-auto"><input type="text" value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Optional - Describe image..." className="flex-1 bg-transparent border-none outline-none text-xs text-white px-2 h-6"/></div>)}
                    
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-wrap justify-center items-center gap-2 md:gap-4 shadow-2xl backdrop-blur-md mt-1 max-w-full pointer-events-auto">
                        <div className="flex items-center gap-1">
                             <button onClick={()=>setZoomMode(!zoomMode)} className={`p-2.5 rounded-xl transition-colors ${zoomMode ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}><MousePointer2 size={18}/></button>
                             <button onClick={()=>setCompareMode(!compareMode)} className={`p-2.5 rounded-xl transition-colors ${compareMode ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-white/5'}`} disabled={!latestResult}><Columns size={18}/></button>
                        </div>
                        <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                        
                        {/* Scale Buttons */}
                        <div className="flex items-center gap-2 md:gap-3 pl-1 pr-1 overflow-x-auto no-scrollbar max-w-[160px] md:max-w-none">
                             <div className="flex gap-1">
                                {['1x', '2x', '4x', '6x', '8x'].map((s) => (
                                    <button key={s} onClick={() => setScaleFactor(s as any)} className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${scaleFactor === s ? 'bg-[#333] text-white border border-white/10' : 'text-slate-500 hover:bg-white/5'}`}>{s}</button>
                                ))}
                             </div>
                        </div>
                        
                        <div className="h-8 w-px bg-white/10 mx-1 hidden md:block"></div>
                        
                        <button onClick={handleGenerate} disabled={isGenerating || !inputs[activeIndex]} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50 min-w-[100px] justify-center">
                            {isGenerating ? <Zap size={16} className="animate-spin"/> : <Sparkles size={16}/>} Process
                        </button>
                        <button onClick={() => setShowAdvanced(!showAdvanced)} className={`p-2.5 rounded-xl transition-colors ${showAdvanced ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'}`}><Settings2 size={18}/></button>
                    </div>
                    {showAdvanced && (
                        <div className="absolute bottom-full mb-4 bg-[#1a1a1a] border border-white/10 rounded-xl p-4 w-64 shadow-2xl animate-in fade-in zoom-in-95 pointer-events-auto">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Fine Tuning</h4>
                            <div className="space-y-4">
                                <div><div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Sharpen</span><span>{sharpen}%</span></div><input type="range" min="0" max="100" value={sharpen} onChange={(e)=>setSharpen(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full accent-green-500"/></div>
                                <div><div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Denoise</span><span>{denoise}%</span></div><input type="range" min="0" max="100" value={denoise} onChange={(e)=>setDenoise(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full accent-green-500"/></div>
                                <div><div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Face Recovery</span><span>{faceRec ? 'ON' : 'OFF'}</span></div><button onClick={()=>setFaceRec(!faceRec)} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${faceRec ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}>{faceRec ? 'Enabled' : 'Disabled'}</button></div>
                                <div><div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Text Recovery</span><span>{textRec ? 'ON' : 'OFF'}</span></div><button onClick={()=>setTextRec(!textRec)} className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all ${textRec ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}>{textRec ? 'Enabled' : 'Disabled'}</button></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="hidden lg:flex w-[340px] border-l border-white/5 bg-[#0a0a0c] flex-col z-30 shadow-2xl">
               <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0f0f11]"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> History</h3><div className="flex gap-2"><span className="text-[10px] bg-green-900/20 text-green-500 px-2 py-0.5 rounded border border-green-500/20">{inputs.length} Items</span></div></div>
               <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#050505]">
                   {inputs.map((img, i) => (
                        <div key={i} className={`group relative overflow-hidden rounded-xl border transition-all cursor-pointer ${activeIndex === i && !latestResult ? 'border-green-500 bg-[#1a1a1a]' : 'border-white/5 bg-[#0f0f11] hover:bg-white/5'}`} onClick={()=>{setActiveIndex(i); setLatestResult(null);}}>
                            <div className="flex p-3 gap-3"><div className="w-16 h-16 rounded-lg bg-black border border-white/10 shrink-0 overflow-hidden"><img src={img} className="w-full h-full object-cover"/></div><div className="flex-1 min-w-0 flex flex-col justify-center"><span className="text-[10px] font-bold text-white uppercase tracking-wider mb-1">Source</span></div></div>
                            <button onClick={(e)=>{e.stopPropagation(); setInputs(p=>p.filter((_,idx)=>idx!==i));}} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-opacity"><XCircle size={12}/></button>
                        </div>
                   ))}
               </div>
               <div className="p-4 border-t border-white/5 bg-[#0a0a0c] space-y-3 pb-8"><button onClick={handleBatch} disabled={isGenerating || inputs.length === 0} className="w-full py-3 bg-white/5 border border-white/10 hover:bg-green-900/20 hover:border-green-500/30 hover:text-green-400 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Zap size={14} className="animate-spin"/> : <PlayCircle size={14}/>} Batch Process All</button><div className="relative group w-full h-24"><div className="absolute inset-0 bg-[#050505] rounded-xl border border-dashed border-white/20 group-hover:border-green-500 group-hover:bg-green-900/5 transition-all flex flex-col items-center justify-center cursor-pointer"><div className="mb-2 p-2 bg-white/5 rounded-full text-slate-500 group-hover:text-green-400 transition-colors"><Plus size={16}/></div><span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-slate-300">Add to Queue</span></div><div className="absolute inset-0 opacity-0 cursor-pointer"><ImageUploader onImagesSelect={(imgs)=>setInputs(p=>[...p,...imgs])} compact /></div></div></div>
            </div>
        </div>
    );
};