import React, { useState, useRef, useEffect } from 'react';
import { Compass, RefreshCcw, ZoomIn, ScanEye, BoxSelect, Rotate3d, Download, X, Trash2, XCircle } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { Button } from '../Button';
import { detectImageAngle, generateAngleView } from '../../services/angleService';
import { GeneratedImage } from '../../types';

// Visualizers
const Dial = ({ value, min, max, label, onChange, unit = "°", size = "normal" }: any) => {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startValue = useRef(0);
    const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); startY.current = e.clientY; startValue.current = value; document.body.style.cursor = 'ns-resize'; };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => { if (!isDragging) return; const change = ((startY.current - e.clientY) / 200) * (max - min); let n = startValue.current + change; if (max === 360) { n %= 360; if (n < 0) n += 360; } else { n = Math.max(min, Math.min(max, n)); } onChange(Math.round(n)); };
        const handleMouseUp = () => { setIsDragging(false); document.body.style.cursor = ''; };
        if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isDragging, max, min, onChange]);
    const r = max === 360 ? value : ((value - min) / (max - min)) * 270 - 135;
    return ( <div className="flex flex-col items-center gap-3 select-none group" onMouseDown={handleMouseDown}> <div className={`relative ${size === "large" ? "w-24 h-24" : "w-16 h-16"} rounded-full bg-[#080808] border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] cursor-ns-resize hover:border-purple-500/30 transition-colors`}> <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-[#222]"></div><div className="absolute inset-0" style={{ transform: `rotate(${r}deg)` }}> <div className={`absolute left-1/2 -translate-x-1/2 top-1.5 ${size === "large" ? "w-2 h-3" : "w-1.5 h-2.5"} bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]`}></div> </div> <div className="absolute inset-6 bg-[#111] rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/5"><div className="w-2 h-2 bg-slate-600 rounded-full"></div></div></div> <div className="text-center"> <div className="text-[10px] font-black uppercase text-slate-500 group-hover:text-purple-400 tracking-widest mb-0.5">{label}</div> <div className="text-sm font-mono text-white font-bold">{Math.round(value)}{unit}</div> </div> </div> );
};

const OrbitalRig = ({ yaw, pitch }: any) => {
    const w = 300, h = 220, cx = w / 2, cy = h / 2, r = 85; const viewPitch = 25 * Math.PI / 180, viewYaw = 35 * Math.PI / 180; const project = (x: number, y: number, z: number) => {const x1 = x * Math.cos(viewYaw) + z * Math.sin(viewYaw);const z1 = -x * Math.sin(viewYaw) + z * Math.cos(viewYaw);const y2 = y * Math.cos(viewPitch) - z1 * Math.sin(viewPitch);const z2 = y * Math.sin(viewPitch) + z1 * Math.cos(viewPitch);return { x: cx + x1, y: cy - y2, z: z2 };};const yRad = (yaw * Math.PI) / 180, pRad = (pitch * Math.PI) / 180;const rG = r * Math.cos(pRad), targetY = r * Math.sin(pRad), targetZ = rG * Math.cos(yRad), targetX = rG * Math.sin(yRad);const camPos = project(targetX, targetY, targetZ), groundPos = project(targetX, 0, targetZ), origin = project(0,0,0);const s = 24, rawVerts = [{x:-s, y:s, z:s}, {x:s, y:s, z:s}, {x:s, y:s, z:-s}, {x:-s, y:s, z:-s}, {x:-s, y:-s, z:s}, {x:s, y:-s, z:s}, {x:s, y:-s, z:-s}, {x:-s, y:-s, z:-s}];const verts = rawVerts.map(v => project(v.x, v.y, v.z));const orbitPath = []; for(let i=0; i<=360; i+=5) { const rad = i * Math.PI / 180; const p = project(r * Math.sin(rad), 0, r * Math.cos(rad)); orbitPath.push(`${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }const meridianPath = []; for(let i=-90; i<=90; i+=5) { const rad = i * Math.PI / 180; const mrg = r * Math.cos(rad); const p = project(mrg * Math.sin(yRad), r * Math.sin(rad), mrg * Math.cos(yRad)); meridianPath.push(`${i===-90?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
    return (<div className="w-full bg-[#030304] rounded-xl border border-white/5 relative overflow-hidden h-64 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] group font-mono select-none"><div className="absolute top-4 left-4 flex items-center gap-2 z-20 opacity-80"><div className="w-1.5 h-1.5 rounded-sm bg-purple-500"></div><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Advanced Orbital Rig</span></div><div className="absolute bottom-4 right-4 text-right z-20 pointer-events-none"><div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Orbit</div><div className="text-sm font-bold text-slate-400 font-mono">{Math.round(yaw)}°</div></div><div className="absolute bottom-1/2 right-4 translate-y-1/2 text-right z-20 pointer-events-none"><div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Elev</div><div className="text-sm font-bold text-slate-400 font-mono">{Math.round(pitch)}°</div></div><div className="absolute inset-0 flex items-center justify-center"><svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible"><defs><radialGradient id="rigGlow" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="rgba(168,85,247,0.08)"/><stop offset="100%" stopColor="transparent"/></radialGradient></defs><circle cx={cx} cy={cy} r={r} fill="url(#rigGlow)" /><path d={orbitPath.join(' ')} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="2 3" /><path d={meridianPath.join(' ')} fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1" strokeDasharray="4 4" /><g><line x1={origin.x} y1={origin.y} x2={groundPos.x} y2={groundPos.y} stroke="rgba(168,85,247,0.3)" strokeWidth="1" strokeDasharray="2 2" /><line x1={groundPos.x} y1={groundPos.y} x2={camPos.x} y2={camPos.y} stroke="rgba(168,85,247,0.5)" strokeWidth="1" /><circle cx={groundPos.x} cy={groundPos.y} r="1.5" fill="rgba(168,85,247,0.5)" /></g>{[[2,3], [3,7], [7,6], [6,2]].map((p,i) => (<line key={`bl-${i}`} x1={verts[p[0]].x} y1={verts[p[0]].y} x2={verts[p[1]].x} y2={verts[p[1]].y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />))}{[[0,3], [1,2], [5,6], [4,7]].map((p,i) => (<line key={`cl-${i}`} x1={verts[p[0]].x} y1={verts[p[0]].y} x2={verts[p[1]].x} y2={verts[p[1]].y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />))}<path d={`M ${verts[0].x} ${verts[0].y} L ${verts[1].x} ${verts[1].y} L ${verts[5].x} ${verts[5].y} L ${verts[4].x} ${verts[4].y} Z`} fill="rgba(168,85,247,0.15)" stroke="rgba(192,132,252,0.6)" strokeWidth="1.5" /><g transform={`translate(${camPos.x}, ${camPos.y})`}><circle r="5" fill="#000" stroke="rgba(168,85,247,1)" strokeWidth="2" /><circle r="2" fill="#fff" /></g></svg></div></div>);
}

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

    const handleClearImage = (i: number) => {
        setInputs(prev => prev.filter((_, idx) => idx !== i));
        if (activeIndex >= inputs.length - 1) setActiveIndex(Math.max(0, inputs.length - 2));
    };

    const handleClearAll = () => { setInputs([]); setPreviewImage(null); };

    const handleGenerate = async () => {
        if (!inputs[activeIndex]) return;
        setIsGenerating(true);
        try {
            const { resultBase64 } = await generateAngleView(inputs[activeIndex], customAngle.yaw, customAngle.pitch);
            setPreviewImage(resultBase64);
            onGenerate({
                id: Date.now().toString(),
                originalUrl: inputs[activeIndex],
                resultUrl: resultBase64,
                prompt: `Angle: Yaw ${customAngle.yaw}, Pitch ${customAngle.pitch}`,
                type: 'angle',
                timestamp: Date.now()
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#030303]">
            {/* Left Canvas */}
            <div className="flex-1 relative overflow-auto bg-black/50 flex items-center justify-center h-[50vh] lg:h-auto order-1">
                {inputs[activeIndex] ? (
                    <div className="relative group w-full min-h-full flex items-center justify-center p-4 lg:p-12">
                        <div className="absolute top-6 left-6 z-30 flex flex-col gap-2 pointer-events-none animate-in slide-in-from-left-4 fade-in duration-500">
                            <div className="glass-panel px-3 py-2 rounded-lg border border-white/10 flex flex-col items-start bg-black/60 backdrop-blur-md shadow-2xl"><span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Azimuth (Yaw)</span><span className="text-xl font-mono text-white font-bold">{Math.round(customAngle.yaw)}°</span></div>
                            <div className="glass-panel px-3 py-2 rounded-lg border border-white/10 flex flex-col items-start bg-black/60 backdrop-blur-md shadow-2xl"><span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Elevation (Pitch)</span><span className="text-xl font-mono text-white font-bold">{Math.round(customAngle.pitch)}°</span></div>
                        </div>
                        {previewImage ? (
                            <div className="relative z-20">
                                <img src={previewImage} className="max-h-[85vh] max-w-[85vw] shadow-2xl rounded-lg animate-in fade-in zoom-in duration-300 border border-white/10" />
                                <div className="absolute top-4 right-4 bg-purple-600/90 text-white px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 backdrop-blur-md"><span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> AI Preview</div>
                                <button onClick={() => setPreviewImage(null)} className="absolute top-4 left-4 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors backdrop-blur-md"><X size={16} /></button>
                                <a href={previewImage} download="angle-preview.png" className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded-lg hover:bg-white hover:text-black transition-colors backdrop-blur-md"><Download size={16} /></a>
                            </div>
                        ) : (<div style={{ transform: `scale(${viewZoom / 100})`, transition: 'transform 0.1s ease-out', maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={inputs[activeIndex]} className="max-h-full max-w-full object-contain shadow-2xl rounded-lg" style={{ transform: `rotateX(${customAngle.pitch * 0.2}deg) rotateY(${customAngle.yaw * 0.2}deg)` }} /></div>)}
                    </div>
                ) : ( <div className="opacity-30 flex flex-col items-center"><Compass size={64} className="mb-4"/><p>Upload Image</p></div> )}
                
                {/* Floating Image Bar */}
                <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 glass-panel p-2 rounded-2xl flex gap-2 items-center z-50">
                    <div className="w-12 h-12 relative group">
                        <ImageUploader onImagesSelect={(imgs) => setInputs(prev => [...prev, ...imgs])} compact />
                        {inputs.length > 0 && <button onClick={handleClearAll} className="absolute -top-3 -right-3 bg-red-600 rounded-full p-1.5 text-white hover:bg-red-500 z-50 shadow-xl transform scale-90 group-hover:scale-100 transition-transform"><Trash2 size={14} /></button>}
                    </div>
                    {inputs.map((img, i) => (
                        <div key={i} className="relative group shrink-0">
                            <button onClick={() => { setActiveIndex(i); setPreviewImage(null); }} className={`w-12 h-12 rounded-lg overflow-hidden border ${activeIndex === i ? 'border-purple-500' : 'border-white/10'} opacity-70 hover:opacity-100 transition-all`}><img src={img} className="w-full h-full object-cover" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleClearImage(i); }} className="absolute -top-2 -right-2 bg-black rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-md p-0.5"><XCircle size={18} fill="black" /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Controls */}
            <div className="w-full lg:w-[360px] h-[50vh] lg:h-full glass-panel lg:rounded-3xl flex flex-col z-20 overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-500 border-t lg:border-t-0 lg:border-l border-white/5 order-2">
                <div className="p-6 border-b border-white/5 bg-[#0a0a0c]"><h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter"><Compass className="text-purple-500" /> ANGLE STUDIO</h2><p className="text-[10px] text-slate-500 font-mono mt-1">Virtual Camera Control</p></div>
                <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar bg-[#050505]">
                    <OrbitalRig yaw={customAngle.yaw} pitch={customAngle.pitch} />
                    <div className="space-y-6 bg-[#0a0a0c] p-5 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center px-2"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><RefreshCcw size={12} /> Angle & Zoom</h3><div className="flex gap-2"><button onClick={async () => { setIsDetecting(true); const a = await detectImageAngle(inputs[activeIndex]); setCustomAngle(a); setIsDetecting(false); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-slate-400 uppercase border border-white/5 transition-colors">Match</button><button onClick={() => setCustomAngle({ yaw: 330, pitch: 20 })} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-[9px] font-bold text-white uppercase shadow-md transition-colors">Auto</button></div></div>
                        <div className="flex justify-around items-center py-2 gap-4"><Dial value={customAngle.yaw} min={0} max={360} label="Orbit (Azimuth)" onChange={(v: any) => setCustomAngle(p => ({ ...p, yaw: v }))} unit="°" size="large" /><div className="w-px h-16 bg-white/5"></div><Dial value={customAngle.pitch} min={-90} max={90} label="Elevation (Pitch)" onChange={(v: any) => setCustomAngle(p => ({ ...p, pitch: v }))} unit="°" size="large" /></div>
                        <div className="space-y-3 pt-2 border-t border-white/5"><div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase flex items-center"><div className="flex items-center gap-1.5"><ZoomIn size={12} /> Focal Length (Zoom)</div><span className="text-white font-mono">{viewZoom}%</span></div><input type="range" min="10" max="200" value={viewZoom} onChange={e => setViewZoom(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full accent-purple-500 cursor-pointer" /></div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <button onClick={async () => { setIsDetecting(true); const a = await detectImageAngle(inputs[activeIndex]); setCustomAngle(a); setIsDetecting(false); }} className="py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group">{isDetecting ? 'Scanning...' : <><BoxSelect size={14} className="group-hover:text-purple-400" /> Match Angle From Image</>}</button>
                        <button className="py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group"><Rotate3d size={14} className="group-hover:text-purple-400" /> Open 3D Rotator</button>
                    </div>
                </div>
                <div className="p-6 border-t border-white/5 bg-[#0a0a0c] space-y-2 pb-8 lg:pb-6"><Button onClick={handleGenerate} isLoading={isGenerating} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest shadow-lg rounded-xl">Render High-Res View</Button></div>
            </div>
        </div>
    );
};
