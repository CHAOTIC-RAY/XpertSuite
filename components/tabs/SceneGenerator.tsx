import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Image as ImageIcon, Sparkles, Armchair, ChefHat, Bed, Square, Disc, PenTool, Ghost, Ratio, Settings2, X, Plus, Trash2, Zap, Download, Layers, BoxSelect, ScanEye, Compass, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { Button } from '../Button';
import { RoomType, AspectRatio, AngleType, GeneratedImage, LightingOptions } from '../../types';
import { generateScene, detectProductType, suggestRoomSettings } from '../../services/sceneService';
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
                {/* Track Ring */}
                <div className="absolute inset-2 rounded-full border-[6px] border-[#111]"></div>
                
                {/* Active Indicator (Rotated) */}
                <div className="absolute inset-0" style={{ transform: `rotate(${rotation}deg)` }}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                </div>

                {/* Inner Cap */}
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
    // 3D Projection Logic
    const size = 20;
    const center = 50;

    // Vertices of a cube
    const vertices = [
        { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 }, { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 },  { x: 1, y: -1, z: 1 },  { x: 1, y: 1, z: 1 },  { x: -1, y: 1, z: 1 }
    ];

    const project = (v: { x: number, y: number, z: number }) => {
        // Convert deg to rad
        // Note: For product rotation, usually Yaw rotates the object around Y axis.
        // Pitch usually tilts it. 
        const rYaw = yaw * Math.PI / 180;
        const rPitch = -pitch * Math.PI / 180; // Invert pitch for natural feel (up is positive)

        // Rotate around Y (Yaw)
        let x1 = v.x * Math.cos(rYaw) - v.z * Math.sin(rYaw);
        let z1 = v.x * Math.sin(rYaw) + v.z * Math.cos(rYaw);
        let y1 = v.y;

        // Rotate around X (Pitch)
        let y2 = y1 * Math.cos(rPitch) - z1 * Math.sin(rPitch);
        let z2 = y1 * Math.sin(rPitch) + z1 * Math.cos(rPitch);
        let x2 = x1;

        // Orthographic Projection
        return {
            x: center + x2 * size,
            y: center - y2 * size // SVG y-axis is down
        };
    };

    const p = vertices.map(project);

    // Edges
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Front Face (relative)
        [4, 5], [5, 6], [6, 7], [7, 4], // Back Face (relative)
        [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting Lines
    ];

    return (
        <div className="w-20 h-20 bg-[#050505] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-purple-900/5 group-hover:bg-purple-900/10 transition-colors"></div>
            <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] opacity-90">
                {edges.map((edge, i) => (
                    <line 
                        key={i} 
                        x1={p[edge[0]].x} y1={p[edge[0]].y} 
                        x2={p[edge[1]].x} y2={p[edge[1]].y} 
                        stroke="#a855f7" 
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                ))}
                {/* Optional: Add small dots at vertices for 'tech' feel */}
                {p.map((pt, i) => (
                    <circle key={`v-${i}`} cx={pt.x} cy={pt.y} r="1" fill="#fff" opacity="0.5"/>
                ))}
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
}

export const SceneGenerator: React.FC<SceneGeneratorProps> = ({ inputs, setInputs, onGenerate, onTransfer, handleClearImage, handleClearAll }) => {
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
    
    // Advanced Config State (Matching Screenshot)
    const [compositionMode, setCompositionMode] = useState<'group' | 'single'>('single');
    const [angleMode, setAngleMode] = useState<AngleType>(AngleType.CUSTOM);
    const [customAngle, setCustomAngle] = useState({ yaw: 330, pitch: 56 });
    const [logicMode, setLogicMode] = useState<'loose' | 'strict'>('strict');
    const [fidelityEnabled, setFidelityEnabled] = useState(false);
    
    const [imageLabels, setImageLabels] = useState<Record<number, string>>({});
    const [isDetectingAngle, setIsDetectingAngle] = useState(false);

    // Sync composition mode with inputs availability
    useEffect(() => {
        if (inputs.length > 1) setCompositionMode('group');
    }, [inputs.length]);

    const handleRunGenerate = async () => {
        if (!inputs[activeIndex] && compositionMode === 'single') return;
        if (inputs.length === 0) return;

        setIsGenerating(true);
        try {
            const label = imageLabels[activeIndex];
            let effectiveRoom = isCustomRoom ? null : selectedRoom;
            if (!isCustomRoom && selectedRoom === RoomType.AUTO) {
                try {
                    effectiveRoom = await suggestRoomSettings(inputs[activeIndex], label || 'Product');
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
                fullVisibilityMode: compositionMode === 'group' && inputs.length > 1,
                isAlphaMode,
                antiDuplicateStrength: logicMode === 'strict' ? 'high' : 'low',
                fidelityMode: fidelityEnabled ? 'high' : 'off'
            };

            const sourceImages = (compositionMode === 'group' && inputs.length > 1) ? inputs : [inputs[activeIndex]];
            const { resultBase64 } = await generateScene(sourceImages, options as any);

            const newImg: GeneratedImage = {
                id: Date.now().toString(),
                originalUrl: inputs[activeIndex],
                resultUrl: resultBase64,
                prompt: 'Scene Generation',
                type: 'mockup',
                timestamp: Date.now()
            };
            
            setResultImage(newImg);
            onGenerate(newImg);
            setActiveView('result');
            setShowAdvanced(false); // Close panel on generate
        } catch (e) {
            console.error(e);
            alert("Generation failed. Please check your API key and try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#050505] overflow-hidden">
             {/* Main Canvas */}
             <div className="flex-1 relative flex flex-col overflow-hidden bg-[#050505]">
                 <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none">
                     <span className="text-purple-500">Scene Gen</span><span className="text-slate-700">/</span><span>{activeView === 'result' ? 'Result' : 'Studio'}</span>
                 </div>

                 <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#080808]">
                      {activeView === 'result' && resultImage ? (
                          <div className="relative group w-full h-full flex items-center justify-center p-8 pb-40">
                              <img src={resultImage.resultUrl} className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl rounded-lg" />
                              <div className="absolute top-6 left-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                   <Button onClick={() => onTransfer(resultImage.resultUrl, 'editor')} variant="secondary" className="text-xs">Edit</Button>
                                   <Button onClick={() => onTransfer(resultImage.resultUrl, 'upscale')} variant="secondary" className="text-xs">Upscale</Button>
                                   <a href={resultImage.resultUrl} download className="bg-white text-black p-2 rounded-lg flex items-center justify-center"><Download size={16}/></a>
                                   <Button onClick={() => { setActiveView('input'); setResultImage(null); }} variant="primary" className="text-xs">New Gen</Button>
                              </div>
                          </div>
                      ) : inputs[activeIndex] ? (
                          <div className="relative w-full h-full flex items-center justify-center p-8 pb-40">
                              <img src={inputs[activeIndex]} className="max-w-[85vw] max-h-[75vh] object-contain shadow-2xl rounded-lg" />
                              <div className="absolute top-6 left-1/2 -translate-x-1/2 glass-panel px-3 py-2 rounded-full flex items-center gap-2 z-30 hover:scale-105 transition-transform bg-black/40 backdrop-blur-md border border-white/10">
                                  <input 
                                    value={imageLabels[activeIndex] || ''} 
                                    onChange={(e)=>setImageLabels({...imageLabels, [activeIndex]: e.target.value})} 
                                    placeholder="Detected Product" 
                                    className="bg-transparent border-none text-xs text-white focus:outline-none w-32 font-bold text-center"
                                  />
                                  <button onClick={async ()=>{const l = await detectProductType(inputs[activeIndex]); setImageLabels({...imageLabels, [activeIndex]: l});}} className="text-purple-400 hover:text-white"><Wand2 size={12}/></button>
                              </div>
                          </div>
                      ) : (
                          <div className="opacity-30 flex flex-col items-center">
                              <ImageIcon size={48} className="mb-4"/>
                              <p className="text-sm font-bold uppercase tracking-widest">Select Image</p>
                          </div>
                      )}
                 </div>

                 {/* Mobile History / Queue - Vertical Right Floating Bar */}
                 <div className="absolute right-4 bottom-32 z-40 lg:hidden flex flex-col gap-3">
                    {/* Existing Images */}
                    {inputs.map((img, i) => (
                        <div key={i} onClick={() => { setActiveIndex(i); setActiveView('input'); setResultImage(null); }} className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shadow-lg ${activeIndex === i ? 'border-blue-500 shadow-blue-500/30' : 'border-white/20 bg-black/40'}`}>
                            <img src={img} className="w-full h-full object-cover" />
                        </div>
                    ))}
                    {/* Add Button */}
                    <div className="relative w-14 h-14 rounded-lg border-2 border-blue-500 bg-blue-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Plus size={24} className="text-blue-400" />
                        <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(p => [...p, ...imgs])} compact /></div>
                    </div>
                 </div>

                 {/* Controls Bar - Removed overflow-x-auto to prevent clipping of Ratio Menu */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] lg:max-w-[90vw] flex flex-col items-center">
                      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex flex-wrap lg:flex-nowrap justify-center lg:justify-start items-center gap-3 shadow-2xl backdrop-blur-md relative">
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
                                <button onClick={() => setIsCustomRoom(!isCustomRoom)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isCustomRoom ? 'bg-pink-600 text-white' : 'text-slate-500 hover:text-white'}`}><PenTool size={14}/></button>
                           </div>
                           
                           {/* ISO/Alpha Mode Toggle - Visible when White BG is selected */}
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

                           <button onClick={handleRunGenerate} disabled={isGenerating || !inputs[activeIndex]} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50">
                               {isGenerating ? <Zap size={16} className="animate-spin"/> : <Wand2 size={16}/>} Generate
                           </button>

                           <button onClick={() => setShowAdvanced(!showAdvanced)} className={`p-2.5 rounded-lg transition-colors ${showAdvanced ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}><Settings2 size={18}/></button>
                      </div>

                      {/* Advanced Settings Panel - REFINED UI TO MATCH SCREENSHOT */}
                      {showAdvanced && (
                          <div className="absolute bottom-full mb-4 right-0 bg-[#0a0a0c] border border-white/10 rounded-2xl p-5 w-[95vw] md:w-[420px] shadow-2xl z-50 flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Settings2 size={14} className="text-purple-500"/> Studio Config</h3>
                                  <button onClick={()=>setShowAdvanced(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                              </div>
                              
                              <div className="space-y-6">
                                  {/* Composition Mode */}
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
                                      <p className="text-[9px] text-slate-600 mt-2">
                                          {compositionMode === 'group' 
                                            ? `Generating a scene combining all ${inputs.length} items.`
                                            : "Generating a scene for the currently selected item only."}
                                      </p>
                                  </div>

                                  {/* Creative Prompt */}
                                  <div>
                                       <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Creative Prompt Details</label>
                                       <textarea 
                                        value={customPrompt} 
                                        onChange={e=>setCustomPrompt(e.target.value)} 
                                        className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 text-xs text-white h-24 resize-none focus:border-purple-500/50 outline-none placeholder-slate-800 transition-colors font-medium" 
                                        placeholder="Describe lighting, mood, props..."
                                       />
                                  </div>

                                  {/* Camera & Zoom - BLUE BOX FIX */}
                                  <div className="bg-[#050505] rounded-xl border border-white/10 p-5 relative overflow-hidden">
                                      <div className="flex justify-between items-center mb-6 z-10 relative">
                                          <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><Compass size={12}/> Camera & Zoom</label>
                                          
                                          {/* Toggle Group */}
                                          <div className="flex bg-[#111] rounded-lg p-0.5 border border-white/5">
                                              {[
                                                  { m: AngleType.MATCH_INPUT, label: 'Match Input' },
                                                  { m: AngleType.AI_BEST, label: 'AI Best' },
                                                  { m: AngleType.CUSTOM, label: 'Custom' }
                                              ].map(opt => (
                                                  <button 
                                                    key={opt.m}
                                                    onClick={() => {
                                                        setAngleMode(opt.m);
                                                        if (opt.m === AngleType.MATCH_INPUT) {
                                                            setIsDetectingAngle(true);
                                                            detectImageAngle(inputs[activeIndex]).then(a => {
                                                                setCustomAngle(a);
                                                                setAngleMode(AngleType.CUSTOM); 
                                                                setIsDetectingAngle(false);
                                                            });
                                                        }
                                                    }}
                                                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${angleMode === opt.m ? 'bg-[#9333ea] text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                                  >
                                                      {opt.label}
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                      
                                      {/* Dials Container */}
                                      <div className="flex items-center justify-between px-2 relative z-10">
                                          <Dial value={customAngle.yaw} min={0} max={360} label="Yaw" onChange={v => setCustomAngle(p => ({...p, yaw: v}))} />
                                          <CubeWireframe yaw={customAngle.yaw} pitch={customAngle.pitch} />
                                          <Dial value={customAngle.pitch} min={-90} max={90} label="Pitch" onChange={v => setCustomAngle(p => ({...p, pitch: v}))} />
                                      </div>
                                      
                                      {isDetectingAngle && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20"><span className="text-xs font-bold text-purple-400 animate-pulse">Scanning Geometry...</span></div>}
                                  </div>

                                  {/* Logic & Fidelity */}
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Logic</label>
                                          <div className="flex bg-[#050505] rounded-lg p-1 border border-white/10">
                                              <button onClick={()=>setLogicMode('loose')} className={`flex-1 py-2 rounded text-[9px] font-bold uppercase transition-all ${logicMode === 'loose' ? 'bg-[#1a1a1a] text-white border border-white/10' : 'text-slate-500 hover:text-white'}`}>Loose</button>
                                              <button onClick={()=>setLogicMode('strict')} className={`flex-1 py-2 rounded text-[9px] font-bold uppercase transition-all ${logicMode === 'strict' ? 'bg-[#1a1a1a] text-white border border-white/10 shadow-sm' : 'text-slate-500 hover:text-white'}`}>Strict</button>
                                          </div>
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Fidelity Check</label>
                                          <button 
                                            onClick={()=>setFidelityEnabled(!fidelityEnabled)}
                                            className={`w-full py-2.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${fidelityEnabled ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-[#050505] border-white/10 text-slate-500 hover:bg-[#1a1a1a]'}`}
                                          >
                                              {fidelityEnabled ? 'Enabled' : 'Disabled'}
                                          </button>
                                      </div>
                                  </div>

                              </div>
                          </div>
                      )}
                 </div>
             </div>

             {/* Right Sidebar (History/Queue) */}
             <div className="hidden lg:flex w-[300px] border-l border-white/5 bg-[#0a0a0c] flex-col z-30">
                 <div className="p-4 border-b border-white/5 bg-[#0f0f11]"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Queue</h3></div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                     {inputs.map((img, i) => (
                         <div key={i} className={`relative group rounded-xl overflow-hidden border cursor-pointer ${activeIndex === i ? 'border-purple-500' : 'border-white/10'}`} onClick={() => { setActiveIndex(i); setActiveView('input'); setResultImage(null); }}>
                             <img src={img} className="w-full h-32 object-cover"/>
                             <button onClick={(e)=>{e.stopPropagation(); handleClearImage(i);}} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                         </div>
                     ))}
                 </div>
                 <div className="p-4 border-t border-white/5">
                      <div className="relative h-24 border border-dashed border-white/20 rounded-xl hover:border-purple-500 hover:bg-purple-900/5 transition-all flex flex-col items-center justify-center">
                          <Plus size={24} className="text-slate-600 mb-2"/>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Add Image</span>
                          <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(prev => [...prev, ...imgs])} compact /></div>
                      </div>
                 </div>
             </div>
        </div>
    );
};