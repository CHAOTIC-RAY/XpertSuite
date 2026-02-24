import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Wand2, Image as ImageIcon, Sparkles, Armchair, ChefHat, Bed, Square, Disc, PenTool, Ghost, Ratio, Settings2, X, Plus, Trash2, Zap, Download, Layers, BoxSelect, Compass, CheckSquare, Square as SquareIcon, MessageSquare, Send, ChevronDown, Folder, FolderOpen, Images, ImagePlus, GripVertical, CheckCircle2 } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { Button } from '../Button';
import { RoomType, AspectRatio, AngleType, GeneratedImage, LightingOptions } from '../../types';
import { generateScene, detectProductType, suggestRoomSettings } from '../../services/sceneService';
import { generateEdit } from '../../services/editorService';
import { detectImageAngle } from '../../services/angleService';

// --- Visual Components for Config Panel ---

const Dial = ({ value, label, min = 0, max = 360, onChange }: { value: number, label: string, min?: number, max?: number, onChange: (v: number) => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startValue = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const delta = startY.current - e.clientY;
            const sensitivity = 2; // Degrees per pixel
            let newValue = Math.round(startValue.current + (delta * sensitivity));
            
            if (max === 360) {
                // Wrap around for Yaw
                if (newValue < 0) newValue += 360;
                if (newValue >= 360) newValue %= 360;
            } else {
                // Clamp for Pitch
                newValue = Math.max(min, Math.min(max, newValue));
            }
            onChange(newValue);
        };
        const handleMouseUp = () => { setIsDragging(false); document.body.style.cursor = 'default'; };
        if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isDragging, onChange, min, max]);

    // Visual Calculation
    const percentage = max === 360 ? (value / 360) : ((value - min) / (max - min));
    const rotation = percentage * 360;

    return (
        <div className="flex flex-col items-center gap-3 select-none" onMouseDown={(e) => { setIsDragging(true); startY.current = e.clientY; startValue.current = value; document.body.style.cursor = 'ns-resize'; }}>
            <div className="relative w-20 h-20 rounded-full bg-[#050505] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] border border-white/5 flex items-center justify-center cursor-ns-resize group hover:border-purple-500/30 transition-colors">
                <div className="absolute inset-2 rounded-full border-[6px] border-[#111]"></div>
                <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                </div>
                <div className="absolute inset-6 bg-[#161618] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
                </div>
            </div>
            <div className="text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</div>
                <div className="text-sm font-black font-mono text-white">{value}°</div>
            </div>
        </div>
    );
};

const CubeWireframe = ({ yaw, pitch }: { yaw: number, pitch: number }) => {
    const size = 20; const center = 50;
    const vertices = [{ x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 }, { x: -1, y: -1, z: 1 },  { x: 1, y: -1, z: 1 },  { x: 1, y: 1, z: 1 },  { x: -1, y: 1, z: 1 }];
    const project = (v: { x: number, y: number, z: number }) => {
        const rYaw = yaw * Math.PI / 180; const rPitch = -pitch * Math.PI / 180;
        let x1 = v.x * Math.cos(rYaw) - v.z * Math.sin(rYaw); let z1 = v.x * Math.sin(rYaw) + v.z * Math.cos(rYaw); let y1 = v.y;
        let y2 = y1 * Math.cos(rPitch) - z1 * Math.sin(rPitch); let z2 = y1 * Math.sin(rPitch) + z1 * Math.cos(rPitch); let x2 = x1;
        return { x: center + x2 * size, y: center - y2 * size };
    };
    const p = vertices.map(project);
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    return (
        <div className="w-20 h-20 bg-[#050505] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-purple-900/5 group-hover:bg-purple-900/10 transition-colors"></div>
            <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] opacity-90">
                {edges.map((edge, i) => (<line key={i} x1={p[edge[0]].x} y1={p[edge[0]].y} x2={p[edge[1]].x} y2={p[edge[1]].y} stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"/>))}
                {p.map((pt, i) => (<circle key={`v-${i}`} cx={pt.x} cy={pt.y} r="1" fill="#fff" opacity="0.5"/>))}
            </svg>
        </div>
    );
};

// --- Main Component ---

interface SceneGeneratorProps {
    inputs: string[];
    setInputs: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerate: (img: GeneratedImage) => void;
    onTransfer: (url: string, target: any) => void;
    handleClearImage: (index: number) => void;
    handleClearAll: () => void;
    generatedImages: GeneratedImage[];
    onDeleteImages?: (ids: string[]) => void;
}

export const SceneGenerator: React.FC<SceneGeneratorProps> = ({ inputs, setInputs, onGenerate, onTransfer, handleClearImage, handleClearAll, generatedImages, onDeleteImages }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeView, setActiveView] = useState<'input' | 'result'>('input');
    const [resultImage, setResultImage] = useState<GeneratedImage | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // UI State
    const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(RoomType.AUTO);
    const [isCustomRoom, setIsCustomRoom] = useState(false);
    const [customRoomText, setCustomRoomText] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(AspectRatio.SOCIAL_PORTRAIT);
    const [isAlphaMode, setIsAlphaMode] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showRatioMenu, setShowRatioMenu] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [showMobileQueue, setShowMobileQueue] = useState(false);
    
    // Multi-Select State
    const [selectedInputIndices, setSelectedInputIndices] = useState<Set<number>>(new Set());

    // Refine Chat State
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    
    // Sidebar State
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(null);

    // Advanced Config State
    const [compositionMode, setCompositionMode] = useState<'group' | 'single'>('single');
    const [angleMode, setAngleMode] = useState<AngleType>(AngleType.CUSTOM);
    const [customAngle, setCustomAngle] = useState({ yaw: 330, pitch: 56 });
    const [logicMode, setLogicMode] = useState<'loose' | 'strict'>('strict');
    const [fidelityEnabled, setFidelityEnabled] = useState(false);
    
    const [imageLabels, setImageLabels] = useState<Record<number, string>>({});
    const [isDetectingAngle, setIsDetectingAngle] = useState(false);

    // DnD State
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Sync composition mode based on input count or selection
    useEffect(() => {
        if (selectedInputIndices.size > 1) {
            setCompositionMode('group');
        } else if (inputs.length > 1 && selectedInputIndices.size === 0) {
            setCompositionMode('group');
        } else if (selectedInputIndices.size === 1 || inputs.length === 1) {
            setCompositionMode('single');
        }
    }, [inputs.length, selectedInputIndices.size]);

    // Reset source selection when changing main selection
    useEffect(() => {
        setSelectedSourceIndex(null);
    }, [activeIndex]);

    // Group History Logic
    const historyGroups = useMemo(() => {
        const groups: { id: string, sources: string[], results: GeneratedImage[] }[] = [];
        const seenSignatures = new Set<string>();

        generatedImages.forEach(img => {
            if (img.type === 'mockup' && img.sourceImages && img.sourceImages.length > 1) {
                const sig = JSON.stringify(img.sourceImages.slice().sort());
                if (!seenSignatures.has(sig)) {
                    seenSignatures.add(sig);
                    const matchingResults = generatedImages.filter(g => 
                        g.type === 'mockup' && 
                        g.sourceImages && 
                        JSON.stringify(g.sourceImages.slice().sort()) === sig
                    );
                    groups.push({
                        id: sig,
                        sources: img.sourceImages,
                        results: matchingResults
                    });
                }
            }
        });
        return groups;
    }, [generatedImages]);

    const activeSession = useMemo(() => {
        // If specific items are selected, prioritize them for preview if in group mode
        if (compositionMode === 'group' && selectedInputIndices.size > 0) {
            return { type: 'group' as const, data: { sources: Array.from(selectedInputIndices).map((i) => inputs[i as number]) }, index: -1 };
        }
        
        // Default Logic
        if (activeIndex < inputs.length && compositionMode === 'single') {
            return { type: 'single' as const, data: inputs[activeIndex], index: activeIndex };
        } else if (compositionMode === 'group') {
            // All active inputs
            return { type: 'group' as const, data: { sources: inputs }, index: -1 };
        }
        
        return null;
    }, [activeIndex, inputs, compositionMode, selectedInputIndices]);

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleSelection = (index: number, multi: boolean) => {
        setSelectedInputIndices(prev => {
            const next = new Set(multi ? prev : []);
            if (next.has(index)) {
                 next.delete(index);
                 if (next.size === 0) setActiveIndex(index); // Fallback active
            } else {
                 next.add(index);
                 setActiveIndex(index);
            }
            return next;
        });
    };

    // --- Drag and Drop Logic ---

    const handleDragStart = (e: React.DragEvent, type: 'queue' | 'history-group' | 'history-image', index: number, data?: any) => {
        e.dataTransfer.setData('type', type);
        e.dataTransfer.setData('index', index.toString());
        if (data) e.dataTransfer.setData('payload', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);
        
        const type = e.dataTransfer.getData('type');
        const sourceIndex = parseInt(e.dataTransfer.getData('index'));

        if (type === 'queue') {
            // Reorder active inputs
            if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
                setInputs(prev => {
                    const copy = [...prev];
                    const [removed] = copy.splice(sourceIndex, 1);
                    // Adjust target index if necessary
                    const dest = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
                    copy.splice(dest, 0, removed);
                    return copy;
                });
                
                // Also update selection indices if they moved (complex, so simply clearing selection for safety)
                setSelectedInputIndices(new Set());
                setActiveIndex(targetIndex > sourceIndex ? targetIndex - 1 : targetIndex);
            }
        } else if (type === 'history-group') {
            // Restore group from history
            const payload = e.dataTransfer.getData('payload');
            if (payload) {
                const groupData = JSON.parse(payload);
                if (groupData.sources) {
                    setInputs(prev => {
                        const copy = [...prev];
                        copy.splice(targetIndex, 0, ...groupData.sources);
                        return copy;
                    });
                }
            }
        } else if (type === 'history-image') {
            // Restore single image
            const payload = e.dataTransfer.getData('payload');
            if (payload) {
                const imgData = JSON.parse(payload);
                if (imgData.url) {
                    setInputs(prev => {
                         const copy = [...prev];
                         copy.splice(targetIndex, 0, imgData.url);
                         return copy;
                    });
                }
            }
        }
    };

    const handleRunGenerate = async () => {
        if (!inputs.length) return;
        
        setIsGenerating(true);
        try {
            // Determine active source images
            let sourceImages: string[] = [];
            
            if (compositionMode === 'group') {
                if (selectedInputIndices.size > 0) {
                     // Use specific selection
                     sourceImages = (Array.from(selectedInputIndices) as number[]).sort((a,b)=>a-b).map(i => inputs[i]);
                } else {
                     // Use all
                     sourceImages = inputs;
                }
            } else {
                // Single mode
                sourceImages = [inputs[activeIndex]];
            }

            if (sourceImages.length === 0) return;

            const label = compositionMode === 'single' ? imageLabels[activeIndex] : undefined;
            
            let effectiveRoom = isCustomRoom ? null : selectedRoom;
            if (!isCustomRoom && selectedRoom === RoomType.AUTO) {
                try {
                    effectiveRoom = await suggestRoomSettings(sourceImages[0], label || 'Product');
                } catch { effectiveRoom = RoomType.STUDIO; }
            }

            const options = {
                roomType: effectiveRoom,
                customPrompt: (isCustomRoom ? `in a ${customRoomText} ` : '') + customPrompt,
                angleMode,
                customAngle: angleMode === AngleType.CUSTOM ? customAngle : undefined,
                aspectRatio: selectedAspectRatio,
                lighting: { brightness: 50, temperature: 50 },
                productLabel: label,
                fullVisibilityMode: compositionMode === 'group',
                isAlphaMode,
                antiDuplicateStrength: logicMode === 'strict' ? 'high' : 'low',
                fidelityMode: fidelityEnabled ? 'high' : 'off',
                referenceImage: isCustomRoom ? referenceImage : undefined
            };

            const { resultBase64 } = await generateScene(sourceImages, options as any);

            const newImg: GeneratedImage = {
                id: Date.now().toString(),
                originalUrl: sourceImages[0], 
                sourceImages: sourceImages,
                resultUrl: resultBase64,
                prompt: compositionMode === 'group' ? 'Group Composition' : 'Scene Generation',
                type: 'mockup',
                timestamp: Date.now()
            };
            
            setResultImage(newImg);
            onGenerate(newImg);
            
            setActiveView('result');
            setShowAdvanced(false);
            
        } catch (e) {
            console.error(e);
            alert("Generation failed. Check API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRefine = async () => {
        if (!resultImage || !refinePrompt) return;
        setIsRefining(true);
        try {
            const sources = resultImage.sourceImages && resultImage.sourceImages.length > 0 
                ? resultImage.sourceImages 
                : (resultImage.originalUrl ? [resultImage.originalUrl] : []);

            const { resultBase64 } = await generateEdit(resultImage.resultUrl, {
                editInstruction: refinePrompt,
                textEditMode: false,
                isRemoveBg: false,
                sourceImages: sources
            });

            const newImg: GeneratedImage = {
                id: Date.now().toString(),
                originalUrl: resultImage.originalUrl,
                sourceImages: resultImage.sourceImages,
                resultUrl: resultBase64,
                prompt: `Refine: ${refinePrompt}`,
                type: 'smartedited',
                timestamp: Date.now()
            };
            setResultImage(newImg);
            onGenerate(newImg);
            setRefinePrompt('');
        } catch (e) {
            console.error(e);
            alert("Edit failed.");
        } finally {
            setIsRefining(false);
        }
    };

    const renderMainContent = () => {
        if (activeView === 'result' && resultImage) {
            return (
                <div key="result" className="relative group w-full h-full flex items-center justify-center p-8 pb-40 animate-in fade-in zoom-in-[0.98] duration-500 ease-out-quint">
                    <img src={resultImage.resultUrl} className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl rounded-lg" />
                    <div className="absolute top-6 left-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                        <Button onClick={() => onTransfer(resultImage.resultUrl, 'editor')} variant="secondary" className="text-xs">Edit</Button>
                        <Button onClick={() => onTransfer(resultImage.resultUrl, 'upscale')} variant="secondary" className="text-xs">Upscale</Button>
                        <a href={resultImage.resultUrl} download className="bg-white text-black p-2 rounded-lg flex items-center justify-center"><Download size={16}/></a>
                        <Button onClick={() => { setActiveView('input'); setResultImage(null); }} variant="primary" className="text-xs">Back</Button>
                    </div>
                </div>
            );
        }

        // Only show single input if in single mode
        if (activeSession?.type === 'single') {
            return (
                <div key="single-input" className="relative w-full h-full flex items-center justify-center p-8 pb-40 animate-in fade-in zoom-in-[0.98] duration-500 ease-out-quint">
                    <img src={activeSession.data} className="max-w-[85vw] max-h-[75vh] object-contain shadow-2xl rounded-lg" />
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 glass-panel px-3 py-2 rounded-full flex items-center gap-2 z-30 hover:scale-105 transition-transform bg-black/40 backdrop-blur-md border border-white/10">
                        <input 
                        value={imageLabels[activeIndex] || ''} 
                        onChange={(e)=>setImageLabels({...imageLabels, [activeIndex]: e.target.value})} 
                        placeholder="Detected Product" 
                        className="bg-transparent border-none text-xs text-white focus:outline-none w-32 font-bold text-center"
                        />
                        <button onClick={async ()=>{const l = await detectProductType(activeSession.data); setImageLabels({...imageLabels, [activeIndex]: l});}} className="text-purple-400 hover:text-white"><Wand2 size={12}/></button>
                    </div>
                </div>
            );
        }

        if (activeSession?.type === 'group') {
             // Render grid of sources for group (all inputs or selected subset)
             const groupSources = activeSession.data.sources || [];
             
             return (
                 <div key="group-grid" className="w-full h-full flex flex-col items-center justify-center p-8 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                         {groupSources.map((src, idx) => (
                             <div key={idx} className="relative w-32 h-32 md:w-48 md:h-48 rounded-xl overflow-hidden border border-white/10 shadow-lg cursor-pointer hover:border-purple-500 transition-all hover:scale-105">
                                 <img src={src} className="w-full h-full object-cover" />
                                 <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold text-white">Item {idx+1}</div>
                             </div>
                         ))}
                     </div>
                     <div className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <BoxSelect size={14}/>
                        {selectedInputIndices.size > 0 ? `Custom Group (${selectedInputIndices.size} Items)` : `All Queue Items (${inputs.length})`}
                     </div>
                 </div>
             );
        }

        return (
            <div className="opacity-30 flex flex-col items-center animate-pulse">
                <ImageIcon size={48} className="mb-4"/>
                <p className="text-sm font-bold uppercase tracking-widest">Select Image</p>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#050505] overflow-hidden">
             {/* Main Canvas */}
             <div className="flex-1 relative flex flex-col overflow-hidden bg-[#050505]">
                 <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none">
                     <span className="text-purple-500">Scene Gen</span><span className="text-slate-700">/</span><span>{activeView === 'result' ? 'Result' : activeSession?.type === 'group' ? 'Group Studio' : 'Single Studio'}</span>
                 </div>
                 
                 {/* Mobile Queue Toggle Button */}
                 <div className="lg:hidden absolute top-4 right-4 z-50 flex gap-2">
                     <button 
                        onClick={() => setShowMobileQueue(!showMobileQueue)}
                        className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all ${showMobileQueue ? 'bg-white text-black border-white' : 'bg-[#0a0a0c] text-slate-300 border-white/10'}`}
                    >
                        <Layers size={14} />
                        <span>Queue</span>
                        <span className={`${showMobileQueue ? 'bg-black text-white' : 'bg-purple-600 text-white'} px-1.5 rounded text-[9px] font-black`}>{inputs.length}</span>
                    </button>
                 </div>

                 {/* Mobile Queue Sidebar (Overlay) */}
                 {showMobileQueue && (
                    <div className="absolute right-4 top-16 bottom-32 z-40 lg:hidden flex flex-col gap-3 overflow-y-auto custom-scrollbar py-2 animate-in slide-in-from-right-4 fade-in duration-200">
                        {inputs.map((img, i) => (
                            <div key={i} onClick={() => { setActiveIndex(i); setActiveView('input'); setResultImage(null); }} className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer transition-all shadow-lg group ${activeIndex === i ? 'border-purple-500 shadow-purple-500/30' : 'border-white/20 bg-black/40'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleClearImage(i); }}
                                    className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        <div className="relative w-16 h-16 shrink-0 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center hover:border-purple-500 hover:bg-purple-500/10 transition-all">
                             <Plus size={24} className="text-slate-500" />
                             <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(prev => [...prev, ...imgs])} compact /></div>
                        </div>
                    </div>
                 )}

                 <div 
                    className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#080808]"
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => handleDrop(e, inputs.length)}
                 >
                      {renderMainContent()}
                 </div>
                 
                 {/* Controls Bar */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] lg:max-w-[90vw] flex flex-col items-center">
                      {/* Show generation controls if we have valid inputs OR no inputs (empty state) */}
                      {activeView === 'input' && (activeSession?.type === 'single' || activeSession?.type === 'group' || inputs.length === 0) && (
                          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-wrap lg:flex-nowrap justify-center lg:justify-start items-center gap-3 shadow-2xl backdrop-blur-md relative animate-in slide-in-from-bottom-4 duration-500 ease-out-quint">
                               <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/5 shrink-0">
                                    <button onClick={() => {setSelectedRoom(RoomType.AUTO); setIsCustomRoom(false); setIsAlphaMode(false);}} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${selectedRoom === RoomType.AUTO && !isCustomRoom ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}><Sparkles size={14}/></button>
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    {[
                                        { type: RoomType.STAGE, icon: Disc },
                                        { type: RoomType.LIVING_ROOM, icon: Armchair },
                                        { type: RoomType.BEDROOM, icon: Bed },
                                        { type: RoomType.KITCHEN, icon: ChefHat },
                                        { type: RoomType.WHITE_BG, icon: Square },
                                    ].map(room => (
                                        <button key={room.type} onClick={() => {setSelectedRoom(room.type); setIsCustomRoom(false); setIsAlphaMode(false);}} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${selectedRoom === room.type && !isCustomRoom ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`} title={room.type}><room.icon size={14}/></button>
                                    ))}
                                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                                    <div className="relative">
                                        <button 
                                            onClick={() => {
                                                if (!isCustomRoom) {
                                                    setIsCustomRoom(true);
                                                    setShowCustomInput(true);
                                                    setSelectedRoom(null);
                                                } else {
                                                    setShowCustomInput(!showCustomInput);
                                                }
                                            }}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isCustomRoom ? 'bg-pink-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            <PenTool size={14}/>
                                        </button>
                                        
                                        {/* Custom Input Popover */}
                                        {isCustomRoom && showCustomInput && (
                                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 w-64 shadow-2xl animate-in zoom-in-95 z-50 flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Custom Background</span>
                                                    <button onClick={()=>setShowCustomInput(false)}><X size={12} className="text-slate-500 hover:text-white"/></button>
                                                </div>
                                                
                                                <div className="w-full aspect-video rounded-lg border border-dashed border-white/20 bg-black/20 relative flex items-center justify-center group overflow-hidden">
                                                    {referenceImage ? (
                                                        <>
                                                            <img src={referenceImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"/>
                                                            <button onClick={()=>setReferenceImage(null)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 size={16} className="text-red-400"/></button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <div className="absolute inset-0 opacity-0 cursor-pointer"><ImageUploader onImagesSelect={imgs => setReferenceImage(imgs[0])} compact /></div>
                                                            <ImagePlus size={16} className="text-slate-500 mb-1"/>
                                                            <span className="text-[9px] text-slate-600 uppercase font-bold">Upload Ref Image</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <input 
                                                        value={customRoomText}
                                                        onChange={(e)=>setCustomRoomText(e.target.value)}
                                                        placeholder="Or describe the room..."
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:border-pink-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                               </div>
                               
                               {selectedRoom === RoomType.WHITE_BG && !isCustomRoom && (
                                    <button 
                                      onClick={() => setIsAlphaMode(!isAlphaMode)} 
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isAlphaMode ? 'bg-white text-black border-white' : 'bg-black/40 text-slate-500 border-white/10 hover:text-white'}`}
                                      title="Isolation Mode (White Background)"
                                    >
                                        <Ghost size={14}/>
                                        <span className="text-[10px] font-bold uppercase">{isAlphaMode ? 'ISO Mode' : 'Standard'}</span>
                                    </button>
                               )}

                               <div className="h-8 w-px bg-white/10 hidden md:block shrink-0"></div>

                               <div className="relative">
                                   <button onClick={() => setShowRatioMenu(!showRatioMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent text-slate-400 hover:bg-white/5 hover:text-white"><Ratio size={14}/><span className="text-[10px] font-bold uppercase">{selectedAspectRatio}</span></button>
                                   {showRatioMenu && (
                                       <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 w-32 shadow-xl flex flex-col gap-1 z-50 animate-in zoom-in-95 duration-200">
                                           {[AspectRatio.SQUARE, AspectRatio.SOCIAL_PORTRAIT, AspectRatio.LANDSCAPE].map(r => (
                                               <button key={r} onClick={() => {setSelectedAspectRatio(r); setShowRatioMenu(false);}} className="py-2 px-3 text-[10px] font-bold text-left hover:bg-white/10 rounded text-slate-300">{r}</button>
                                           ))}
                                       </div>
                                   )}
                               </div>

                               <div className="h-8 w-px bg-white/10 hidden md:block shrink-0"></div>

                               <button onClick={handleRunGenerate} disabled={isGenerating || inputs.length === 0} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
                                   {isGenerating ? <Zap size={16} className="animate-spin"/> : <Wand2 size={16}/>} Generate
                               </button>

                               <button onClick={() => setShowAdvanced(!showAdvanced)} className={`p-2.5 rounded-lg transition-colors ${showAdvanced ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}><Settings2 size={18}/></button>
                          </div>
                      )}

                      {/* Result Refinement Bar */}
                      {activeView === 'result' && (
                          <div className="w-full max-w-xl bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500 ease-out-quint">
                              <div className="w-10 h-10 rounded-xl bg-purple-900/20 flex items-center justify-center text-purple-400 shrink-0">
                                  {isRefining ? <Zap size={18} className="animate-spin"/> : <MessageSquare size={18}/>}
                              </div>
                              <input 
                                type="text" 
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                placeholder="Talk to the image to edit..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500"
                                disabled={isRefining}
                              />
                              <button 
                                onClick={handleRefine}
                                disabled={!refinePrompt.trim() || isRefining}
                                className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-700 text-white rounded-xl transition-colors"
                              >
                                  <Send size={16} />
                              </button>
                          </div>
                      )}

                      {/* Advanced Settings Panel */}
                      {showAdvanced && activeView === 'input' && (
                          <div className="absolute bottom-full mb-4 right-0 bg-[#0a0a0c] border border-white/10 rounded-2xl p-5 w-[95vw] md:w-[420px] shadow-2xl z-50 flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 zoom-in-95 duration-300">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Settings2 size={14} className="text-purple-500"/> Studio Config</h3>
                                  <button onClick={()=>setShowAdvanced(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                              </div>
                              
                              <div className="space-y-6">
                                  <div>
                                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Layers size={12}/> Composition Mode</div>
                                      <div className="flex gap-3">
                                          <button 
                                            onClick={()=>setCompositionMode('group')} 
                                            disabled={inputs.length <= 1}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${compositionMode === 'group' ? 'bg-purple-900/20 border-purple-500 text-purple-400' : 'bg-[#050505] border-white/5 text-slate-500 hover:text-slate-300 disabled:opacity-30'}`}
                                          >
                                              <BoxSelect size={14}/> 
                                              <span className="text-[10px] font-bold uppercase tracking-wide">Group Shot</span>
                                          </button>
                                          <button 
                                            onClick={()=>setCompositionMode('single')} 
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${compositionMode === 'single' ? 'bg-purple-900/20 border-purple-500 text-white' : 'bg-[#050505] border-white/5 text-slate-500 hover:text-slate-300'}`}
                                          >
                                             {compositionMode === 'single' ? <CheckSquare size={14} className="text-purple-500"/> : <SquareIcon size={14}/>} 
                                             <span className="text-[10px] font-bold uppercase tracking-wide">Single Item</span>
                                          </button>
                                      </div>
                                  </div>
                                  <div>
                                       <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Creative Prompt Details</label>
                                       <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-xs text-white h-24 resize-none focus:border-purple-500/50 outline-none placeholder-slate-800 transition-colors font-medium" placeholder="Describe lighting, mood, props..."/>
                                  </div>
                                  <div className="bg-[#050505] rounded-xl border border-white/10 p-5 relative overflow-hidden">
                                      <div className="flex justify-between items-center mb-6 z-10 relative">
                                          <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Compass size={12}/> Camera & Zoom</label>
                                          <div className="flex bg-[#111] rounded-lg p-0.5 border border-white/5">
                                              {[{ m: AngleType.MATCH_INPUT, label: 'Match Input' }, { m: AngleType.AI_BEST, label: 'AI Best' }, { m: AngleType.CUSTOM, label: 'Custom' }].map(opt => (
                                                  <button key={opt.m} onClick={() => { setAngleMode(opt.m); if (opt.m === AngleType.MATCH_INPUT) { if (inputs[activeIndex]) { setIsDetectingAngle(true); detectImageAngle(inputs[activeIndex]).then(a => { setCustomAngle(a); setAngleMode(AngleType.CUSTOM); setIsDetectingAngle(false); }); } } }} className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${angleMode === opt.m ? 'bg-[#9333ea] text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{opt.label}</button>
                                              ))}
                                          </div>
                                      </div>
                                      <div className="flex items-center justify-between px-2 relative z-10">
                                          <Dial value={customAngle.yaw} min={0} max={360} label="Yaw" onChange={v => setCustomAngle(p => ({...p, yaw: v}))} />
                                          <CubeWireframe yaw={customAngle.yaw} pitch={customAngle.pitch} />
                                          <Dial value={customAngle.pitch} min={-90} max={90} label="Pitch" onChange={v => setCustomAngle(p => ({...p, pitch: v}))} />
                                      </div>
                                      {isDetectingAngle && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20"><span className="text-xs font-bold text-purple-400 animate-pulse">Scanning Geometry...</span></div>}
                                  </div>
                              </div>
                          </div>
                      )}
                 </div>
             </div>

             {/* Right Sidebar (History/Queue) */}
             <div className="hidden lg:flex w-[300px] border-l border-white/5 bg-[#0a0a0c] flex-col z-30">
                 <div className="p-4 border-b border-white/5 bg-[#0f0f11]"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Queue & History</h3></div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                     
                     {/* 1. List Individual Inputs with Drag Reorder */}
                     {inputs.map((img, i) => {
                         const results = generatedImages.filter(g => g.originalUrl === img && g.type === 'mockup' && (!g.sourceImages || g.sourceImages.length <= 1));
                         const isActive = activeSession?.type === 'single' && activeSession.index === i;
                         const isSelected = selectedInputIndices.has(i);
                         const itemKey = `single-${i}`;
                         const isExpanded = expandedKeys.has(itemKey);
                         
                         return (
                             <div 
                                key={itemKey} 
                                draggable 
                                onDragStart={(e) => handleDragStart(e, 'queue', i)}
                                onDragOver={(e) => handleDragOver(e, i)}
                                onDrop={(e) => handleDrop(e, i)}
                                className={`group relative rounded-2xl transition-all duration-300 overflow-hidden 
                                    ${isActive ? 'bg-[#151515] border border-white/10 shadow-xl' : 'bg-transparent border border-transparent hover:bg-[#111]'}
                                    ${dragOverIndex === i ? 'border-t-2 border-t-purple-500' : ''}
                                    ${isSelected ? 'ring-1 ring-purple-500 bg-purple-900/10' : ''}
                                `}
                             >
                                 <div 
                                    onClick={(e) => { 
                                        if (e.metaKey || e.ctrlKey) {
                                            toggleSelection(i, true);
                                        } else {
                                            toggleSelection(i, false);
                                            setActiveView('input'); 
                                            setResultImage(null); 
                                        }
                                    }} 
                                    className="p-3 flex items-center gap-3 cursor-pointer select-none"
                                 >
                                     <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-400">
                                        <GripVertical size={12}/>
                                     </div>
                                     <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border transition-all relative ${isActive ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-white/10 opacity-70 hover:opacity-100'}`}>
                                         <img src={img} className="w-full h-full object-cover" alt={`Image ${i+1}`} />
                                         {isSelected && (
                                             <div className="absolute inset-0 bg-purple-500/50 flex items-center justify-center">
                                                 <CheckCircle2 size={16} className="text-white"/>
                                             </div>
                                         )}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>Image {i + 1}</div>
                                         <div className="text-[9px] text-slate-600 font-mono">{results.length} versions</div>
                                     </div>
                                     
                                     <div className="flex items-center gap-1">
                                          <div 
                                             onClick={(e) => { e.stopPropagation(); handleClearImage(i); }}
                                             className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                             title="Remove Image"
                                          >
                                              <Trash2 size={14} />
                                          </div>
                                          <div 
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(itemKey); }}
                                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                          >
                                            <ChevronDown size={14} className={`text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                          </div>
                                     </div>
                                 </div>
                                 {isExpanded && (
                                     <div className="px-3 pb-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                         <div className="bg-[#1a1a1a] rounded-xl p-2 border border-white/5 mb-3 group relative">
                                             <div className="bg-white rounded-lg p-2 flex items-center justify-center mb-2">
                                                 <img src={img} className="max-h-24 max-w-full object-contain" />
                                             </div>
                                             <div className="flex justify-between items-end px-1">
                                                 <div><div className="text-[10px] font-bold text-white">Source</div><div className="text-[9px] text-slate-500 font-mono">Original</div></div>
                                                 <button onClick={(e)=>{e.stopPropagation(); handleClearImage(i);}} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                                             </div>
                                         </div>
                                         <div className="grid grid-cols-2 gap-2">
                                             {results.map((res, idx) => (
                                                 <div 
                                                    key={res.id} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, 'history-image', 0, { url: res.resultUrl })}
                                                    onClick={(e) => { e.stopPropagation(); setResultImage(res); setActiveView('result'); }} 
                                                    className={`bg-[#1a1a1a] rounded-xl p-2 border transition-all cursor-pointer relative group/item ${resultImage?.id === res.id ? 'border-purple-500 ring-1 ring-purple-500' : 'border-white/5 hover:border-white/20'}`}
                                                >
                                                     <div className="bg-white rounded-lg overflow-hidden aspect-square flex items-center justify-center mb-2 relative"><img src={res.resultUrl} className="w-full h-full object-contain" /></div>
                                                     <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 shadow-lg">v{idx + 1}</div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                         );
                     })}

                     {/* 2. List Group Histories */}
                     {historyGroups.map((group, i) => {
                         const realIndex = inputs.length + i;
                         const isActive = activeSession?.type === 'group' && activeSession.index === i;
                         const groupKey = `group-${group.id}`;
                         const isExpanded = expandedKeys.has(groupKey);

                         return (
                            <div 
                                key={groupKey} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'history-group', i, { sources: group.sources })}
                                className={`group relative rounded-2xl transition-all duration-300 overflow-hidden ${isActive ? 'bg-[#151515] border border-white/10 shadow-xl' : 'bg-transparent border border-transparent hover:bg-[#111]'}`}
                            >
                                <div onClick={() => { setActiveIndex(realIndex); setActiveView('input'); setResultImage(null); }} className="p-3 flex items-center gap-3 cursor-pointer select-none">
                                    <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-400">
                                        <GripVertical size={12}/>
                                    </div>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-purple-900/20 text-purple-400' : 'bg-white/5 text-slate-500'}`}>
                                        {isActive ? <FolderOpen size={16}/> : <Folder size={16}/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>Group Set {i + 1}</div>
                                        <div className="text-[9px] text-slate-600 font-mono">{group.sources.length} sources • {group.results.length} results</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onDeleteImages && window.confirm('Delete this group history?')) {
                                                    onDeleteImages(group.results.map(r => r.id));
                                                }
                                            }}
                                            className="p-1.5 hover:bg-white/10 text-slate-600 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Group"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(groupKey); }}
                                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                        >
                                            <ChevronDown size={14} className={`text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="px-3 pb-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                        {/* Group Sources Strip */}
                                        <div className="bg-[#1a1a1a] rounded-xl p-2 border border-white/5 mb-3">
                                            <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Source Images</div>
                                            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                                {group.sources.map((src, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={(e) => { e.stopPropagation(); setSelectedSourceIndex(idx); setActiveView('input'); }}
                                                        className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border cursor-pointer transition-all ${selectedSourceIndex === idx ? 'border-purple-500 ring-1 ring-purple-500' : 'border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <img src={src} className="w-full h-full object-cover"/>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Results */}
                                        <div className="grid grid-cols-2 gap-2">
                                             {group.results.map((res, idx) => (
                                                 <div key={res.id} onClick={(e) => { e.stopPropagation(); setResultImage(res); setActiveView('result'); }} className={`bg-[#1a1a1a] rounded-xl p-2 border transition-all cursor-pointer relative group/item ${resultImage?.id === res.id ? 'border-purple-500 ring-1 ring-purple-500' : 'border-white/5 hover:border-white/20'}`}>
                                                     <div className="bg-white rounded-lg overflow-hidden aspect-square flex items-center justify-center mb-2 relative"><img src={res.resultUrl} className="w-full h-full object-contain" /></div>
                                                     <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white/10 shadow-lg">v{idx + 1}</div>
                                                 </div>
                                             ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                         );
                     })}

                 </div>
                 <div className="p-4 border-t border-white/5">
                      <div 
                        className="relative h-24 border border-dashed border-white/20 rounded-xl hover:border-purple-500 hover:bg-purple-900/5 transition-all flex flex-col items-center justify-center cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, inputs.length)}
                      >
                          <Plus size={24} className="text-slate-600 mb-2"/>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Add Image</span>
                          <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(prev => [...prev, ...imgs])} compact /></div>
                      </div>
                 </div>
             </div>
        </div>
    );
};