import React, { useState } from 'react';
import { Palette, Undo2, Download, ImagePlus, Zap, Wand2, Cloud, Feather, BoxSelect, Sparkles, PenTool, Type, X, Plus } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { GeneratedImage } from '../../types';
import { generateStyleTransfer } from '../../services/styleService';

const STYLE_PRESETS = [
    { id: 'Anti-Gravity / Levitation', icon: Cloud, gradient: 'from-indigo-400 via-purple-400 to-indigo-500', prompt: 'Zero-gravity interior, furniture and objects floating chaotically in mid-air, weightless suspension, surreal physics-defying composition, dreamlike atmosphere, cinematic lighting, photorealistic 8k render, inception style' },
    { id: 'Neon Cyberpunk', icon: Zap, gradient: 'from-fuchsia-600 via-purple-600 to-blue-600', prompt: 'Cyberpunk aesthetic, neon city lights reflecting on wet surfaces, futuristic sci-fi atmosphere, high contrast, vibrant blue and purple hues, cinematic composition' },
    { id: 'Soft Minimalist', icon: Feather, gradient: 'from-stone-100 via-stone-200 to-stone-300', prompt: 'Soft minimalist interior, japandi style, warm beige and white tones, soft natural lighting, decluttered, clean lines, serene atmosphere, high-end architectural photography' },
    { id: '3D Clay Render', icon: BoxSelect, gradient: 'from-pink-300 via-rose-200 to-orange-200', prompt: '3D cute clay render, matte plastic textures, soft rounded edges, pastel color palette, isometric view, toy-like aesthetic, soft studio lighting' },
    { id: 'Dark Luxury', icon: Sparkles, gradient: 'from-gray-900 via-neutral-900 to-amber-900', prompt: 'Dark moody luxury, matte black and gold textures, dramatic chiaroscuro lighting, rich shadows, elegant expensive atmosphere, high-end editorial photography' },
    { id: 'Architectural Sketch', icon: PenTool, gradient: 'from-blue-800 to-slate-900', prompt: 'Architectural concept sketch, loose pencil lines, white paper background, technical drawing style, blueprint aesthetic, artistic shading' },
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
    const [selectedResult, setSelectedResult] = useState<GeneratedImage | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

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
                customPrompt: styleCustomPrompt
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
                <div className="absolute top-4 left-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500"><span className="text-orange-500">Style Transfer</span><span className="text-slate-700">/</span><span>{activeView === 'result' ? 'Result' : 'Canvas'}</span></div>
                <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#020202]">
                    {activeView === 'result' && selectedResult ? (
                        <div className="relative h-full w-full flex items-center justify-center">
                            <img src={selectedResult.resultUrl} className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-500"/>
                            <div className="absolute bottom-10 right-10 flex gap-2">
                                <button onClick={()=>setActiveView('input')} className="p-3 bg-black/60 backdrop-blur rounded-xl text-white border border-white/10 hover:bg-white/10"><Undo2 size={20}/></button>
                                <a href={selectedResult.resultUrl} download className="p-3 bg-orange-600 rounded-xl text-white shadow-lg hover:bg-orange-500"><Download size={20}/></a>
                            </div>
                        </div>
                    ) : inputs[activeIndex] ? (
                        <div className="relative max-w-[600px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                            <img src={inputs[activeIndex]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"/>
                            <div className="absolute inset-0 flex flex-col items-center justify-center"><Palette size={48} className="text-orange-500 mb-4 opacity-50"/><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Style to Apply</p></div>
                        </div>
                    ) : ( <div className="text-center opacity-30 flex flex-col items-center"><div className="w-24 h-24 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center mb-4"><Palette size={32}/></div><p className="text-sm font-bold uppercase tracking-widest">Select Image to Style</p></div> )}
                </div>
                <div className="h-auto border-t border-white/5 bg-[#0a0a0c] p-6 lg:p-8">
                    <div className="max-w-5xl mx-auto">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Palette size={14}/> Select Style Preset</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                            {STYLE_PRESETS.map((style) => (
                                <button key={style.id} onClick={() => setSelectedStylePreset(style.id)} className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all h-32 group overflow-hidden ${selectedStylePreset === style.id ? 'border-orange-500 bg-orange-900/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg mb-1 group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/10 group-hover:ring-white/30`}><style.icon size={20} className="text-white drop-shadow-md"/></div>
                                    <span className={`text-[9px] font-bold uppercase text-center leading-tight z-10 ${selectedStylePreset === style.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{style.id}</span>
                                    {selectedStylePreset === style.id && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_orange]"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-stretch">
                            <div className="flex-1 relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Type size={14}/></div><input type="text" value={styleCustomPrompt} onChange={(e)=>setStyleCustomPrompt(e.target.value)} placeholder="Add custom style details (e.g. 'purple lighting', 'dramatic shadows')..." className="w-full bg-[#151518] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:border-orange-500 outline-none placeholder-slate-600 h-12"/></div>
                            <div className="flex gap-3"><button className="px-4 py-3 bg-[#151518] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap"><ImagePlus size={14}/> Use Ref Image</button><button onClick={handleGenerate} disabled={isGenerating || !inputs[activeIndex] || !selectedStylePreset} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap">{isGenerating ? <Zap size={16} className="animate-spin"/> : <Wand2 size={16}/>} Transfer Style</button></div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Right Sidebar */}
            <div className="hidden lg:flex w-[300px] border-l border-white/5 bg-[#050505] flex-col z-30 shadow-2xl">
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
