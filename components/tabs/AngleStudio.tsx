import React, { useState, useRef, useEffect } from 'react';
import { Compass, ZoomIn, ScanEye, Rotate3d, Download, X, Trash2, Plus, Layers, Settings2, Zap, SlidersHorizontal, MousePointer2, Monitor, ArrowRight, ArrowDown, Box, Grip } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { detectImageAngle, generateAngleView } from '../../services/angleService';
import { GeneratedImage } from '../../types';

// --- Constants ---

const ANGLE_PRESETS = [
    { label: 'Front', yaw: 0, pitch: 0 },
    { label: 'Iso R', yaw: 45, pitch: 30 },
    { label: 'Iso L', yaw: 315, pitch: 30 },
    { label: 'Top', yaw: 0, pitch: 90 },
    { label: 'Side R', yaw: 90, pitch: 0 },
    { label: 'Side L', yaw: 270, pitch: 0 },
    { label: 'Low', yaw: 0, pitch: -20 },
    { label: 'Back', yaw: 180, pitch: 0 },
];

// --- Visualizers ---

const Dial = ({ value, min, max, label, onChange, unit = "°", size = "normal" }: any) => {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startValue = useRef(0);
    const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); startY.current = e.clientY; startValue.current = value; document.body.style.cursor = 'ns-resize'; };
    const handleTouchStart = (e: React.TouchEvent) => { setIsDragging(true); startY.current = e.touches[0].clientY; startValue.current = value; };
    
    useEffect(() => {
        const handleMove = (clientY: number) => { if (!isDragging) return; const change = ((startY.current - clientY) / 200) * (max - min); let n = startValue.current + change; if (max === 360) { n %= 360; if (n < 0) n += 360; } else { n = Math.max(min, Math.min(max, n)); } onChange(Math.round(n)); };
        const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
        const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);
        const onEnd = () => { setIsDragging(false); document.body.style.cursor = ''; };
        
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging, max, min, onChange]);
    
    const r = max === 360 ? value : ((value - min) / (max - min)) * 270 - 135;
    return ( <div className="flex flex-col items-center gap-3 select-none group" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}> <div className={`relative ${size === "large" ? "w-20 h-20" : "w-16 h-16"} rounded-full bg-[#080808] border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] cursor-ns-resize hover:border-purple-500/30 transition-colors`}> <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-[#222]"></div><div className="absolute inset-0" style={{ transform: `rotate(${r}deg)` }}> <div className={`absolute left-1/2 -translate-x-1/2 top-1.5 ${size === "large" ? "w-2 h-3" : "w-1.5 h-2.5"} bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]`}></div> </div> <div className="absolute inset-5 bg-[#111] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/5"><div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div></div></div> <div className="text-center"> <div className="text-[9px] font-black uppercase text-slate-500 group-hover:text-purple-400 tracking-widest mb-0.5">{label}</div> <div className="text-sm font-mono text-white font-bold">{Math.round(value)}{unit}</div> </div> </div> );
};

const OrbitalRig = ({ yaw, pitch }: any) => {
    // 3D Projection Helpers
    const w = 280, h = 200, cx = w / 2, cy = h / 2, r = 70; 
    const viewPitch = 25 * Math.PI / 180, viewYaw = 35 * Math.PI / 180; 
    const project = (x: number, y: number, z: number) => {
        const x1 = x * Math.cos(viewYaw) + z * Math.sin(viewYaw);
        const z1 = -x * Math.sin(viewYaw) + z * Math.cos(viewYaw);
        const y2 = y * Math.cos(viewPitch) - z1 * Math.sin(viewPitch);
        const z2 = y * Math.sin(viewPitch) + z1 * Math.cos(viewPitch);
        return { x: cx + x1, y: cy - y2, z: z2 };
    };
    
    // Target Calculation (Camera Position)
    const yRad = (yaw * Math.PI) / 180, pRad = (pitch * Math.PI) / 180;
    const rG = r * Math.cos(pRad), targetY = r * Math.sin(pRad), targetZ = rG * Math.cos(yRad), targetX = rG * Math.sin(yRad);
    const camPos = project(targetX, targetY, targetZ);
    const groundPos = project(targetX, 0, targetZ);
    const origin = project(0,0,0);

    // Cube Logic
    const s = 15; // Cube size
    const rawVerts = [{x:-s, y:s, z:s}, {x:s, y:s, z:s}, {x:s, y:s, z:-s}, {x:-s, y:s, z:-s}, {x:-s, y:-s, z:s}, {x:s, y:-s, z:s}, {x:s, y:-s, z:-s}, {x:-s, y:-s, z:-s}];
    const verts = rawVerts.map(v => project(v.x, v.y, v.z));
    
    // Orbit Rings
    const orbitPath = []; for(let i=0; i<=360; i+=5) { const rad = i * Math.PI / 180; const p = project(r * Math.sin(rad), 0, r * Math.cos(rad)); orbitPath.push(`${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
    const meridianPath = []; for(let i=-90; i<=90; i+=5) { const rad = i * Math.PI / 180; const mrg = r * Math.cos(rad); const p = project(mrg * Math.sin(yRad), r * Math.sin(rad), mrg * Math.cos(yRad)); meridianPath.push(`${i===-90?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }

    return (
        <div className="w-full bg-[#030304] rounded-xl border border-white/5 relative overflow-hidden h-56 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] group font-mono select-none">
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20 opacity-80">
                <div className="w-1.5 h-1.5 rounded-sm bg-purple-500"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Orbital Rig</span>
            </div>
            
            <div className="absolute bottom-4 right-4 text-right z-20 pointer-events-none">
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Orbit</div>
                <div className="text-xs font-bold text-slate-400 font-mono">{Math.round(yaw)}°</div>
            </div>
            
            <div className="absolute bottom-1/2 right-4 translate-y-1/2 text-right z-20 pointer-events-none">
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Elev</div>
                <div className="text-xs font-bold text-slate-400 font-mono">{Math.round(pitch)}°</div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
                    <defs>
                        <radialGradient id="rigGlow" cx="50%" cy="50%" r="60%">
                            <stop offset="0%" stopColor="rgba(168,85,247,0.08)"/>
                            <stop offset="100%" stopColor="transparent"/>
                        </radialGradient>
                    </defs>
                    
                    {/* Background Glow */}
                    <circle cx={cx} cy={cy} r={r} fill="url(#rigGlow)" />
                    
                    {/* Rings */}
                    <path d={orbitPath.join(' ')} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="2 3" />
                    <path d={meridianPath.join(' ')} fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                    
                    {/* Camera Vectors */}
                    <g>
                        <line x1={origin.x} y1={origin.y} x2={groundPos.x} y2={groundPos.y} stroke="rgba(168,85,247,0.3)" strokeWidth="1" strokeDasharray="2 2" />
                        <line x1={groundPos.x} y1={groundPos.y} x2={camPos.x} y2={camPos.y} stroke="rgba(168,85,247,0.5)" strokeWidth="1" />
                        <circle cx={groundPos.x} cy={groundPos.y} r="1.5" fill="rgba(168,85,247,0.5)" />
                    </g>

                    {/* Central Cube (Target) */}
                    <g>
                         {[[0,3], [1,2], [5,6], [4,7]].map((p,i) => (<line key={`cl-${i}`} x1={verts[p[0]].x} y1={verts[p[0]].y} x2={verts[p[1]].x} y2={verts[p[1]].y} stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />))}
                         {[[0,1], [1,5], [5,4], [4,0], [3,2], [2,6], [6,7], [7,3], [0,4], [1,5], [2,6], [3,7]].map((p,i) => (<line key={`bl-${i}`} x1={verts[p[0]].x} y1={verts[p[0]].y} x2={verts[p[1]].x} y2={verts[p[1]].y} stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />))}
                         {/* Front Face Fill */}
                         <path d={`M ${verts[0].x} ${verts[0].y} L ${verts[1].x} ${verts[1].y} L ${verts[5].x} ${verts[5].y} L ${verts[4].x} ${verts[4].y} Z`} fill="rgba(168,85,247,0.15)" />
                         {/* Center Dot */}
                         <circle cx={cx} cy={cy} r="2" fill="#fff" />
                         <circle cx={cx} cy={cy} r="4" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
                    </g>
                    
                    {/* Camera Pos */}
                    <g transform={`translate(${camPos.x}, ${camPos.y})`}>
                        <circle r="4" fill="#000" stroke="rgba(168,85,247,1)" strokeWidth="2" />
                        <circle r="1.5" fill="#fff" />
                    </g>
                </svg>
            </div>
        </div>
    );
}

// --- Main Component ---

interface AngleStudioProps {
    inputs: string[];
    setInputs: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerate: (img: GeneratedImage) => void;
    onTransfer: (url: string, target: any) => void;
}

export const AngleStudio: React.FC<AngleStudioProps> = ({ inputs, setInputs, onGenerate, onTransfer }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [customAngle, setCustomAngle] = useState({ yaw: 330, pitch: 20 });
    const [viewZoom, setViewZoom] = useState(100);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    
    // Toggle for the large Config Popover
    const [showConfig, setShowConfig] = useState(false);
    
    const [showMobileQueue, setShowMobileQueue] = useState(false);

    const handleClearImage = (i: number) => {
        setInputs(prev => prev.filter((_, idx) => idx !== i));
        if (activeIndex >= inputs.length - 1) setActiveIndex(Math.max(0, inputs.length - 2));
    };

    const handleGenerate = async () => {
        if (!inputs[activeIndex]) return;
        setIsGenerating(true);
        try {
            const { resultBase64 } = await generateAngleView(inputs[activeIndex], customAngle.yaw, customAngle.pitch);
            setPreviewImage(resultBase64);
            onGenerate({ id: Date.now().toString(), originalUrl: inputs[activeIndex], resultUrl: resultBase64, prompt: `Angle: Yaw ${customAngle.yaw}, Pitch ${customAngle.pitch}`, type: 'angle', timestamp: Date.now() });
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#030303]">
            <div className="flex-1 relative flex flex-col overflow-hidden bg-[#050505]">
                {/* Visual Header */}
                <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none">
                     <span className="text-blue-500">Angle Studio</span><span className="text-slate-700">/</span><span>{previewImage ? 'Render Preview' : 'Virtual Camera'}</span>
                </div>

                {/* Mobile Queue Toggle */}
                <div className="lg:hidden absolute top-4 right-4 z-50">
                    <button onClick={() => setShowMobileQueue(!showMobileQueue)} className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all ${showMobileQueue ? 'bg-white text-black border-white' : 'bg-[#0a0a0c] text-slate-300 border-white/10'}`}>
                        <Layers size={14} />
                        <span>Queue</span>
                        <span className={`${showMobileQueue ? 'bg-black text-white' : 'bg-blue-600 text-white'} px-1.5 rounded text-[9px] font-black`}>{inputs.length}</span>
                    </button>
                </div>

                {/* Main Viewport */}
                <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#080808]">
                    {inputs[activeIndex] ? (
                        <div className="relative group w-full h-full flex items-center justify-center p-4 pb-40 lg:p-12 animate-in fade-in zoom-in-[0.99] duration-500 ease-out-quint">
                            {previewImage ? (
                                <div className="relative z-20 animate-in fade-in zoom-in-95 duration-500 ease-out-quint">
                                    <img src={previewImage} className="max-h-[80vh] max-w-[85vw] shadow-2xl rounded-lg border border-white/10" />
                                    <div className="absolute top-4 right-4 bg-purple-600/90 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 backdrop-blur-md"><span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> AI Preview</div>
                                    <button onClick={() => setPreviewImage(null)} className="absolute top-4 left-4 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors backdrop-blur-md"><X size={16} /></button>
                                    <a href={previewImage} download="angle-preview.png" className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded-lg hover:bg-white hover:text-black transition-colors backdrop-blur-md"><Download size={16} /></a>
                                </div>
                            ) : (
                                <div style={{ transform: `scale(${viewZoom / 100}) perspective(1000px) rotateX(${customAngle.pitch * 0.2}deg) rotateY(${customAngle.yaw * 0.2}deg)`, transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)', maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={inputs[activeIndex]} className="max-h-[75vh] max-w-full object-contain shadow-2xl rounded-lg" />
                                </div>
                            )}
                        </div>
                    ) : ( 
                        <div className="opacity-30 flex flex-col items-center animate-pulse"><Compass size={64} className="mb-4"/><p className="text-sm font-bold uppercase tracking-widest">Upload Image to Start</p></div> 
                    )}
                </div>

                {/* Main Action Area (Floating Bar + Config Panel) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-full md:w-auto md:max-w-[95vw] flex flex-col items-center pointer-events-none px-4 md:px-0">
                    
                    {/* CAMERA CONFIG PANEL (Popover) */}
                    {showConfig && (
                        <div className="absolute bottom-full mb-3 bg-[#0a0a0c] border border-white/10 rounded-2xl p-5 w-[90vw] max-w-[360px] shadow-2xl animate-in slide-in-from-bottom-2 zoom-in-95 duration-300 z-50 pointer-events-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Settings2 size={14} className="text-purple-500"/> Camera Config</h3>
                                <button onClick={()=>setShowConfig(false)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                            </div>
                            
                            {/* Visualizer */}
                            <div className="mb-6">
                                <OrbitalRig yaw={customAngle.yaw} pitch={customAngle.pitch} />
                            </div>

                            {/* Presets Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {ANGLE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setCustomAngle({ yaw: preset.yaw, pitch: preset.pitch })}
                                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${
                                            customAngle.yaw === preset.yaw && customAngle.pitch === preset.pitch
                                            ? 'bg-purple-500/20 border-purple-500 text-purple-400' 
                                            : 'bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Dials */}
                            <div className="flex justify-around items-center gap-4 bg-[#050505] p-4 rounded-xl border border-white/5 mb-6">
                                <Dial value={customAngle.yaw} min={0} max={360} label="Azimuth" onChange={(v: any) => setCustomAngle(p => ({ ...p, yaw: v }))} unit="°" />
                                <div className="w-px h-12 bg-white/10"></div>
                                <Dial value={customAngle.pitch} min={-90} max={90} label="Elevation" onChange={(v: any) => setCustomAngle(p => ({ ...p, pitch: v }))} unit="°" />
                            </div>

                            {/* Slider */}
                            <div className="space-y-3">
                                 <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase"><span className="flex items-center gap-1"><ZoomIn size={10}/> Focal Length</span><span className="text-white">{viewZoom}%</span></div>
                                 <input type="range" min="50" max="150" value={viewZoom} onChange={e => setViewZoom(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full accent-purple-500 cursor-pointer" />
                            </div>
                        </div>
                    )}

                    {/* FLOATING BAR (Main Controls) */}
                    {!previewImage && (
                        <div className="bg-[#0f0f11]/95 border border-white/10 rounded-2xl p-2 flex items-center gap-2 md:gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500 ease-out-quint border-b-2 overflow-x-auto no-scrollbar relative z-40 max-w-full pointer-events-auto">
                            
                            {/* Left Group: Config & Match */}
                            <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5 shrink-0">
                                <button 
                                    onClick={() => setShowConfig(!showConfig)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${showConfig ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >
                                    <Compass size={20}/>
                                </button>
                                <div className="w-px h-5 bg-white/10 mx-1"></div>
                                <button 
                                    onClick={async () => { if (!inputs[activeIndex]) return; setIsDetecting(true); const a = await detectImageAngle(inputs[activeIndex]); setCustomAngle(a); setIsDetecting(false); }}
                                    disabled={isDetecting || !inputs[activeIndex]}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${isDetecting ? 'animate-pulse text-purple-400' : 'text-slate-500 hover:text-white disabled:opacity-20'}`}
                                    title="Auto Match"
                                >
                                    <ScanEye size={20}/>
                                </button>
                            </div>

                            <div className="w-px h-8 bg-white/10 shrink-0"></div>

                            {/* Center Group: Status Info - Fixed Padding & Wrapping */}
                            <div className="flex items-center gap-3 md:gap-6 px-2 md:px-4 shrink-0">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-extrabold uppercase text-slate-600 tracking-widest hidden md:block">Perspective</span>
                                    <span className="text-sm font-mono font-bold text-white whitespace-nowrap flex items-center gap-2">
                                        {Math.round(customAngle.yaw)}° <span className="text-slate-700">•</span> {Math.round(customAngle.pitch)}°
                                    </span>
                                </div>
                                <div className="bg-[#151515] rounded-lg h-9 px-3 flex items-center gap-2 border border-white/10 shadow-sm">
                                    <ZoomIn size={14} className="text-slate-500"/>
                                    <span className="text-xs font-mono font-bold text-slate-200">{viewZoom}%</span>
                                </div>
                            </div>

                            <div className="w-px h-8 bg-white/10 shrink-0"></div>

                            {/* Action Group: Generate */}
                            <button 
                                onClick={handleGenerate} 
                                disabled={isGenerating || !inputs[activeIndex]} 
                                className="h-12 px-4 md:px-6 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.15em] flex items-center gap-3 shadow-[0_5px_20px_rgba(147,51,234,0.4)] disabled:opacity-40 transition-all hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed group shrink-0"
                            >
                                {isGenerating ? <Zap size={16} className="animate-spin"/> : <Rotate3d size={18} className="group-hover:rotate-180 transition-transform duration-700"/>} 
                                <span className="hidden sm:inline">Generate</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar (Desktop only) */}
            <div className="hidden lg:flex w-[300px] border-l border-white/5 bg-[#0a0a0c] flex-col z-30">
                 <div className="p-4 border-b border-white/5 bg-[#0f0f11] flex justify-between items-center">
                     <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> Queue</h3>
                     <span className="text-[10px] bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">{inputs.length} Sources</span>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#050505]">
                     {inputs.map((img, i) => (
                         <div key={i} onClick={() => { setActiveIndex(i); setPreviewImage(null); }} className={`group relative rounded-xl transition-all duration-300 overflow-hidden cursor-pointer ${activeIndex === i ? 'bg-[#151515] border border-blue-500/50 shadow-lg' : 'bg-transparent border border-transparent hover:bg-[#111]'}`}>
                             <div className="p-2 flex items-center gap-3">
                                 <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border transition-all ${activeIndex === i ? 'border-blue-500' : 'border-white/10 opacity-70 hover:opacity-100'}`}><img src={img} className="w-full h-full object-cover" /></div>
                                 <div className="flex-1 min-w-0"><div className={`text-[10px] font-bold ${activeIndex === i ? 'text-white' : 'text-slate-400'}`}>Source {i + 1}</div><div className="text-[8px] text-slate-600 font-mono">Original</div></div>
                                 <button onClick={(e) => { e.stopPropagation(); handleClearImage(i); }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                             </div>
                         </div>
                     ))}
                 </div>
                 <div className="p-4 border-t border-white/5 bg-[#0a0a0c]">
                      <div className="relative h-24 border border-dashed border-white/20 rounded-xl hover:border-blue-500 hover:bg-blue-900/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                          <Plus size={24} className="text-slate-600 group-hover:text-blue-500 mb-2 transition-colors"/><span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase">Add Image</span><div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(prev => [...prev, ...imgs])} compact /></div>
                      </div>
                 </div>
            </div>
        </div>
    );
};