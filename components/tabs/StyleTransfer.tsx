import React, { useState } from 'react';
import { Palette, Undo2, Download, ImagePlus, Zap, Wand2, Cloud, Feather, BoxSelect, Sparkles, PenTool, Type, X, Plus, Sliders, Droplets, Mountain, Hexagon, Layers, ArrowRight, Wind } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { GeneratedImage } from '../../types';
import { generateStyleTransfer } from '../../services/styleService';

const STYLE_PRESETS = [
    { id: 'Y2K Liquid Chrome', icon: Droplets, gradient: 'from-cyan-400 via-blue-500 to-purple-500', prompt: 'Y2K aesthetic, liquid chrome metal textures, iridescent holographic reflections, fluid shapes, futuristic 2000s vibe, glossy high contrast, raytracing, 8k resolution' },
    { id: 'Biophilic Oasis', icon: Mountain, gradient: 'from-emerald-300 via-green-400 to-teal-500', prompt: 'Biophilic interior design, abundant lush indoor plants, living walls, natural sunlight, organic wooden textures, blurring lines between indoor and outdoor, fresh, serene, high-end architectural photography' },
    { id: 'Brutalist Concrete', icon: Hexagon, gradient: 'from-gray-500 via-slate-600 to-zinc-700', prompt: 'Brutalist architecture style, raw concrete textures, harsh dramatic lighting, monolithic shapes, industrial atmosphere, minimal, grey tones, cinematic lighting' },
    { id: 'Frosted Glass', icon: Sparkles, gradient: 'from-sky-100 via-blue-100 to-indigo-200', prompt: 'Glassmorphism style, frosted glass textures, background blur, soft diffuse lighting, pastel gradients, clean modern UI aesthetic, translucent materials, ethereal' },
    { id: 'Vaporwave Sunset', icon: Sliders, gradient: 'from-pink-500 via-purple-500 to-indigo-500', prompt: 'Vaporwave aesthetic, retro 80s grid background, neon pink and purple lighting, greek statues, palm trees, glitch art elements, nostalgic surrealism' },
    { id: 'Papercut Art', icon: Feather, gradient: 'from-orange-200 via-red-300 to-pink-300', prompt: 'Layered papercut art style, depth of field, soft shadows between paper layers, vibrant colors, craft aesthetic, handmade feel, simplistic shapes, diorama' },
    { id: 'Neon Cyberpunk', icon: Zap, gradient: 'from-fuchsia-600 via-purple-600 to-blue-600', prompt: 'Cyberpunk aesthetic, neon city lights reflecting on wet surfaces, futuristic sci-fi atmosphere, high contrast, vibrant blue and purple hues' },
    { id: '3D Clay Render', icon: BoxSelect, gradient: 'from-pink-300 via-rose-200 to-orange-200', prompt: '3D cute clay render, matte plastic textures, soft rounded edges, pastel color palette, isometric view, toy-like aesthetic' },
    { id: 'Architectural Sketch', icon: PenTool, gradient: 'from-blue-800 to-slate-900', prompt: 'Architectural concept sketch, loose pencil lines, white paper background, technical drawing style, blueprint aesthetic, artistic shading' },
    { id: 'Anti-Gravity Float', icon: Wind, gradient: 'from-amber-200 via-orange-300 to-yellow-400', prompt: 'Anti-gravity product photography, zero gravity composition, objects floating in mid-air, levitating furniture elements, dynamic chaotic arrangement, exploded view, surreal editorial style, warm beige studio background, soft cinematic lighting, high end design aesthetic' },
];

interface StyleTransferProps {
    inputs: string[];
    setInputs: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerate: (img: GeneratedImage) => void;
    generatedImages: GeneratedImage[];
}

export const StyleTransfer: React.FC<StyleTransferProps> = ({ inputs, setInputs, onGenerate, generatedImages }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeView, setActiveView] = useState<'input' | 'result'>('input');
    const [selectedStylePreset, setSelectedStylePreset] = useState<string | null>(null);
    const [styleCustomPrompt, setStyleCustomPrompt] = useState('');
    const [styleStrength, setStyleStrength] = useState(50);
    const [selectedResult, setSelectedResult] = useState<GeneratedImage | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showMobileQueue, setShowMobileQueue] = useState(false);

    const handleClearImage = (i: number) => {
        setInputs(prev => prev.filter((_, idx) => idx !== i));
        if (activeIndex >= inputs.length - 1) setActiveIndex(Math.max(0, inputs.length - 2));
    };

    const handleGenerate = async () => {
        if (!inputs[activeIndex] || !selectedStylePreset) return;
        setIsGenerating(true);
        try {
            const { resultBase64 } = await generateStyleTransfer(inputs[activeIndex], {
                stylePreset: selectedStylePreset,
                customPrompt: styleCustomPrompt,
                styleStrength: styleStrength
            });
            const newImg: GeneratedImage = { id: Date.now().toString(), originalUrl: inputs[activeIndex], resultUrl: resultBase64, prompt: `Style: ${selectedStylePreset}`, type: 'style-transfer', timestamp: Date.now() };
            onGenerate(newImg);
            setSelectedResult(newImg);
            setActiveView('result');
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#020202] overflow-hidden">
            <div className="flex-1 relative flex flex-col overflow-hidden">
                <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 pointer-events-none"><span className="text-orange-500">Style Transfer</span><span className="text-slate-700">/</span><span>{activeView === 'result' ? 'Result' : 'Canvas'}</span></div>
                
                {/* Mobile Queue Toggle */}
                <div className="lg:hidden absolute top-4 right-4 z-50">
                    <button 
                        onClick={() => setShowMobileQueue(!showMobileQueue)}
                        className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all ${showMobileQueue ? 'bg-white text-black border-white' : 'bg-[#0a0a0c] text-slate-300 border-white/10'}`}
                    >
                        <Layers size={14} />
                        <span className="hidden sm:inline">History</span>
                        <span className={`${showMobileQueue ? 'bg-black text-white' : 'bg-orange-500 text-white'} px-1.5 rounded text-[9px] font-black`}>{inputs.length}</span>
                    </button>
                </div>

                {/* Mobile Queue Overlay */}
                {showMobileQueue && (
                    <div className="absolute right-0 top-16 bottom-0 z-40 lg:hidden flex flex-col gap-3 overflow-y-auto no-scrollbar py-2 px-3 bg-[#0a0a0c]/95 backdrop-blur-xl border-l border-white/10 animate-in slide-in-from-right-10 fade-in duration-200 w-20 items-center">
                        {inputs.map((img, i) => (
                           <div key={i} onClick={()=>{ setActiveIndex(i); setActiveView('input'); setSelectedResult(null); }} className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shadow-lg ${activeIndex === i ? 'border-orange-500 shadow-orange-500/30' : 'border-white/20 bg-black/40'}`}>
                               <img src={img} className="w-full h-full object-cover"/>
                           </div>
                       ))}
                       <div className="relative w-12 h-12 shrink-0 rounded-lg border-2 border-orange-500 bg-orange-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:bg-orange-500/20 transition-colors cursor-pointer">
                           <Plus size={20} className="text-orange-400" />
                           <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(p => [...p, ...imgs])} compact /></div>
                       </div>
                    </div>
                )}
                
                {/* Main Content Area - Animated Switch */}
                <div key={activeView} className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#020202] animate-in fade-in zoom-in-[0.99] duration-500 ease-out-quint relative">
                    {activeView === 'result' && selectedResult ? (
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src={selectedResult.resultUrl} className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl rounded-lg"/>
                            <div className="absolute bottom-10 right-10 flex gap-2 animate-in slide-in-from-bottom-4 duration-500 delay-100 z-30">
                                <button onClick={()=>setActiveView('input')} className="p-3 bg-black/60 backdrop-blur rounded-xl text-white border border-white/10 hover:bg-white/10"><Undo2 size={20}/></button>
                                <a href={selectedResult.resultUrl} download className="p-3 bg-orange-600 rounded-xl text-white shadow-lg hover:bg-orange-500"><Download size={20}/></a>
                            </div>
                        </div>
                    ) : inputs[activeIndex] ? (
                        <div className="relative max-w-[600px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                            <img src={inputs[activeIndex]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"/>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><Palette size={48} className="text-orange-500 mb-4 opacity-50"/><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Style to Apply</p></div>
                        </div>
                    ) : ( <div className="text-center opacity-30 flex flex-col items-center animate-pulse"><div className="w-24 h-24 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center mb-4"><Palette size={32}/></div><p className="text-sm font-bold uppercase tracking-widest">Select Image to Style</p></div> )}
                </div>

                <div className="h-auto border-t border-white/5 bg-[#0a0a0c] p-4 lg:p-8 animate-in slide-in-from-bottom-4 duration-500 z-30">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Palette size={14}/> 
                                <span className="hidden sm:inline">Select Style Preset</span>
                                <span className="sm:hidden">Styles</span>
                            </h3>
                            
                            {/* Strength Slider */}
                            <div className="w-full sm:w-auto flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                                <Sliders size={12} className="text-slate-400 shrink-0"/>
                                <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Influence</span>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="100" 
                                    value={styleStrength} 
                                    onChange={(e) => setStyleStrength(Number(e.target.value))}
                                    className="flex-1 sm:w-24 h-1 bg-white/10 rounded-full accent-orange-500 cursor-pointer"
                                />
                                <span className="text-[10px] font-mono text-orange-400 w-6 text-right">{styleStrength}%</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2 mb-4 max-h-[160px] lg:max-h-none overflow-y-auto custom-scrollbar">
                            {STYLE_PRESETS.map((style) => (
                                <button key={style.id} onClick={() => setSelectedStylePreset(style.id)} className={`relative p-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all h-24 lg:h-28 group overflow-hidden ${selectedStylePreset === style.id ? 'border-orange-500 bg-orange-900/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg mb-1 group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/10 group-hover:ring-white/30`}><style.icon size={16} className="text-white drop-shadow-md"/></div>
                                    <span className={`text-[8px] font-bold uppercase text-center leading-tight z-10 ${selectedStylePreset === style.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{style.id.split(' ')[0]}</span>
                                    {selectedStylePreset === style.id && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_orange]"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 items-stretch">
                            <div className="flex-1 relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Type size={14}/></div>
                                <input type="text" value={styleCustomPrompt} onChange={(e)=>setStyleCustomPrompt(e.target.value)} placeholder="Custom details (optional)..." className="w-full bg-[#151518] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:border-orange-500 outline-none placeholder-slate-600 h-10 md:h-12"/>
                            </div>
                            <div className="flex gap-2 h-10 md:h-12">
                                <button className="px-3 md:px-4 bg-[#151518] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors whitespace-nowrap" title="Use Reference Image">
                                    <ImagePlus size={16}/> 
                                    <span className="hidden md:inline">Use Ref</span>
                                </button>
                                <button onClick={handleGenerate} disabled={isGenerating || !inputs[activeIndex] || !selectedStylePreset} className="flex-1 md:flex-none px-4 md:px-8 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 whitespace-nowrap">
                                    {isGenerating ? <Zap size={16} className="animate-spin"/> : <Wand2 size={16}/>} 
                                    <span>Transfer</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Right Sidebar */}
            <div className="hidden lg:flex w-[300px] border-l border-white/5 bg-[#050505] flex-col z-30 shadow-2xl animate-in slide-in-from-right-4 duration-500">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0a0a0c]"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Style Gallery</h3><div className="flex gap-2"><span className="text-[10px] bg-orange-900/20 text-orange-500 px-2 py-0.5 rounded border border-orange-500/20">{inputs.length} Inputs</span></div></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {inputs.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-20"><Palette size={48} className="mb-4 text-slate-500"/><p className="text-[10px] uppercase font-bold text-slate-600">No Images</p></div> : inputs.map((img, i) => (
                        <div key={i} className="space-y-2">
                            <div onClick={() => { setActiveIndex(i); setActiveView('input'); setSelectedResult(null); }} className={`relative h-32 rounded-xl overflow-hidden border cursor-pointer transition-all ${activeIndex === i && activeView === 'input' ? 'border-orange-500' : 'border-white/10 hover:border-white/30'}`}><img src={img} className="w-full h-full object-cover"/><button onClick={(e)=>{e.stopPropagation(); handleClearImage(i)}} className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-red-500 transition-colors"><X size={12}/></button></div>
                            {generatedImages.filter(g => g.originalUrl === img && g.type === 'style-transfer').map((res) => (<div key={res.id} onClick={() => { setActiveIndex(i); setSelectedResult(res); setActiveView('result'); }} className={`relative h-24 rounded-xl overflow-hidden border ml-6 cursor-pointer transition-all ${selectedResult?.id === res.id ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-white/10 hover:border-white/30'}`}><img src={res.resultUrl} className="w-full h-full object-cover"/><div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur p-1 text-[9px] text-slate-300 truncate px-2">{res.prompt.split('.')[1] || 'Styled'}</div></div>))}
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-white/5 bg-[#0a0a0c]"><div className="relative group w-full h-24 border border-dashed border-white/20 rounded-xl hover:border-orange-500 hover:bg-orange-900/5 transition-all flex flex-col items-center justify-center cursor-pointer"><Plus size={24} className="text-slate-600 group-hover:text-orange-500 mb-2 transition-colors"/><span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-400">Add Image</span><div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={(imgs) => setInputs(prev => [...prev, ...imgs])} compact /></div></div></div>
            </div>
        </div>
    );
};