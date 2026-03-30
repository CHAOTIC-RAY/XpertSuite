import React, { useState, useRef } from 'react';
import { Upload, Layers, Settings2, Zap, X, Plus, Armchair, Image as ImageIcon, CheckCircle2, Trash2, Download, BoxSelect, Wand2, StopCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ImageUploader } from '../ImageUploader';
import { GeneratedImage } from '../../types';
import { applyPatternToFurniture, generateBaseImage, BulkMockupOptions, detectPillowCount } from '../../services/mockupService';
import { compressAndResizeImage } from '../../services/geminiService';

interface BulkMockupProps {
    baseImage: string | null;
    setBaseImage: React.Dispatch<React.SetStateAction<string | null>>;
    patterns: {data: string, pillowCount: number}[];
    setPatterns: React.Dispatch<React.SetStateAction<{data: string, pillowCount: number}[]>>;
    onGenerate: (img: GeneratedImage) => void;
}

const FURNITURE_TYPES = ['Sofa', 'Bed', 'Bed Mattress', 'Chair', 'Cushion', 'Curtains', 'Rug', 'Wall', 'Apparel', 'Custom'];
const MATERIALS = ['Cotton', 'Velvet', 'Leather', 'Silk', 'Linen', 'Matte', 'Glossy', 'Wood', 'Metal'];
const LIGHTING = ['Natural', 'Studio', 'Dramatic', 'Soft', 'Cinematic'];

export const BulkMockup: React.FC<BulkMockupProps> = ({ baseImage, setBaseImage, patterns, setPatterns, onGenerate }) => {
    const [options, setOptions] = useState<BulkMockupOptions>({
        furnitureType: 'Sofa',
        material: 'Cotton',
        lighting: 'Natural',
        customPrompt: '',
        preserveDetails: true,
        decorateRoom: false,
        accuracy: 80
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const isCancelledRef = useRef(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [localResults, setLocalResults] = useState<{pattern: string, result: string}[]>([]);
    const [baseImagePrompt, setBaseImagePrompt] = useState('');
    const [isGeneratingBase, setIsGeneratingBase] = useState(false);

    const handleGenerateBaseImage = async () => {
        if (!baseImagePrompt) return;
        setIsGeneratingBase(true);
        try {
            const result = await generateBaseImage(baseImagePrompt);
            setBaseImage(result);
            
            // Save the generated base image to history
            const newImg: GeneratedImage = {
                id: Date.now().toString(),
                originalUrl: result,
                resultUrl: result,
                prompt: `Base Image: ${baseImagePrompt}`,
                type: 'bulk-mockup',
                timestamp: Date.now()
            };
            onGenerate(newImg);
        } catch (error) {
            console.error(error);
            alert("Failed to generate base image.");
        } finally {
            setIsGeneratingBase(false);
        }
    };

    const handleBaseImageSelect = async (imgs: string[]) => {
        if (imgs[0]) {
            const compressed = await compressAndResizeImage(imgs[0], 1536);
            setBaseImage(compressed);
        }
    };

    // const [patterns, setPatterns] = useState<{data: string, pillowCount: number}[]>([]);

    const handlePatternsSelect = async (imgs: string[]) => {
        const processed = await Promise.all(imgs.map(async (img) => {
            const compressed = await compressAndResizeImage(img, 1024);
            const pillowCount = await detectPillowCount(compressed);
            return { data: compressed, pillowCount };
        }));
        setPatterns(prev => [...prev, ...processed]);
    };

    const removePattern = (index: number) => {
        setPatterns(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (!baseImage || patterns.length === 0) return;
        setIsGenerating(true);
        isCancelledRef.current = false;
        setProgress({ current: 0, total: patterns.length });
        setLocalResults([]);

        for (let i = 0; i < patterns.length; i++) {
            if (isCancelledRef.current) break;
            
            setProgress({ current: i + 1, total: patterns.length });
            try {
                const resultBase64 = await applyPatternToFurniture(baseImage, patterns[i].data, { ...options, pillowCount: patterns[i].pillowCount, accuracy: options.accuracy });
                if (isCancelledRef.current) break;
                
                const newImg: GeneratedImage = {
                    id: Date.now().toString() + i,
                    originalUrl: baseImage,
                    sourceImages: [patterns[i].data],
                    resultUrl: resultBase64,
                    prompt: `Bulk Mockup: ${options.furnitureType} in ${options.material}`,
                    type: 'bulk-mockup' as any,
                    timestamp: Date.now()
                };
                onGenerate(newImg);
                setLocalResults(prev => [...prev, { pattern: patterns[i].data, result: resultBase64 }]);
            } catch (e) {
                console.error(`Failed to generate pattern ${i+1}`, e);
            }
        }
        setIsGenerating(false);
    };

    const handleStop = () => {
        isCancelledRef.current = true;
        setIsGenerating(false);
    };

    const handleDownloadAll = async () => {
        if (localResults.length === 0) return;
        
        const zip = new JSZip();
        const folder = zip.folder("mockups");
        
        if (!folder) return;

        localResults.forEach((res, i) => {
            // Extract base64 data
            const base64Data = res.result.split(',')[1];
            folder.file(`mockup-${options.furnitureType}-${i + 1}.png`, base64Data, { base64: true });
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "batch-mockups.zip");
        } catch (error) {
            console.error("Error generating zip:", error);
            alert("Failed to download zip file.");
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0c]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-32">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                                <Layers className="text-orange-500" size={28} />
                                Batch Fabricator
                            </h2>
                            <p className="text-slate-400 mt-1 text-sm max-w-xl">
                                Upload a base furniture image and multiple fabric/texture patterns. The AI will automatically apply each pattern to the furniture, preserving lighting and geometry.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Base Image & Settings */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Base Image */}
                            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <Armchair size={16} className="text-orange-400" />
                                    Base Furniture Image
                                </h3>
                                {!baseImage ? (
                                    <div className="space-y-4">
                                        <div className="h-64">
                                            <ImageUploader onImagesSelect={handleBaseImageSelect} maxImages={1} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-[1px] flex-1 bg-white/10"></div>
                                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">OR GENERATE</span>
                                                <div className="h-[1px] flex-1 bg-white/10"></div>
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. A modern white sofa in a bright living room" 
                                                    value={baseImagePrompt}
                                                    onChange={(e) => setBaseImagePrompt(e.target.value)}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                                                />
                                                <button 
                                                    onClick={handleGenerateBaseImage}
                                                    disabled={!baseImagePrompt || isGeneratingBase}
                                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white rounded-xl text-sm font-bold flex items-center justify-center transition-colors"
                                                >
                                                    {isGeneratingBase ? <Zap size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50">
                                        <img src={baseImage} alt="Base" className="w-full h-64 object-contain" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <button onClick={() => setBaseImage(null)} className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Settings Panel */}
                            <div className="bg-[#111113] border border-white/5 rounded-2xl p-5 shadow-xl space-y-5">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Settings2 size={16} className="text-slate-400" />
                                    Mockup Settings
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Furniture Type</label>
                                        <div className="flex flex-wrap gap-2">
                                            {FURNITURE_TYPES.map(type => (
                                                <button 
                                                    key={type}
                                                    onClick={() => setOptions({...options, furnitureType: type})}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${options.furnitureType === type ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                        {options.furnitureType === 'Custom' && (
                                            <input 
                                                type="text" 
                                                placeholder="e.g., Ottoman, Lamp Shade" 
                                                className="mt-2 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                                                onChange={(e) => setOptions({...options, furnitureType: e.target.value})}
                                            />
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Material Finish</label>
                                            <select 
                                                value={options.material}
                                                onChange={(e) => setOptions({...options, material: e.target.value})}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none appearance-none"
                                            >
                                                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Lighting</label>
                                            <select 
                                                value={options.lighting}
                                                onChange={(e) => setOptions({...options, lighting: e.target.value})}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none appearance-none"
                                            >
                                                {LIGHTING.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer group mb-3" onClick={() => setOptions({...options, preserveDetails: !options.preserveDetails})}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${options.preserveDetails ? 'bg-orange-500 border-orange-500' : 'border-slate-600 bg-transparent group-hover:border-slate-400'}`}>
                                                {options.preserveDetails && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Preserve exact folds & shadows</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setOptions({...options, decorateRoom: !options.decorateRoom})}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${options.decorateRoom ? 'bg-orange-500 border-orange-500' : 'border-slate-600 bg-transparent group-hover:border-slate-400'}`}>
                                                {options.decorateRoom && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Decorate room based on pattern</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Accuracy: {options.accuracy}%</label>
                                        <input 
                                            type="range" 
                                            min="50" 
                                            max="100" 
                                            value={options.accuracy} 
                                            onChange={(e) => setOptions({...options, accuracy: parseInt(e.target.value)})}
                                            className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Custom Instructions (Optional)</label>
                                        <textarea 
                                            value={options.customPrompt}
                                            onChange={(e) => setOptions({...options, customPrompt: e.target.value})}
                                            placeholder="e.g., Make the pattern smaller, keep the wooden legs original..."
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none h-20 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Patterns & Results */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Patterns Upload */}
                            <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <BoxSelect size={16} className="text-orange-400" />
                                        Pattern / Texture Samples ({patterns.length})
                                    </h3>
                                    {patterns.length > 0 && (
                                        <button onClick={() => setPatterns([])} className="text-xs text-slate-400 hover:text-red-400 transition-colors">Clear All</button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {patterns.map((pattern, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                                            <img src={pattern.data} alt={`Pattern ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <button onClick={() => removePattern(idx)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="aspect-square">
                                        <ImageUploader onImagesSelect={handlePatternsSelect} maxImages={10} compact={true} />
                                    </div>
                                </div>
                            </div>

                            {/* Results Area */}
                            {localResults.length > 0 && (
                                <div className="bg-[#111113] border border-white/5 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <ImageIcon size={16} className="text-green-400" />
                                            Generated Mockups ({localResults.length})
                                        </h3>
                                        <button onClick={handleDownloadAll} className="text-xs flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg">
                                            <Download size={14} /> Download All
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {localResults.map((res, idx) => (
                                            <div key={idx} className="relative rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
                                                <img src={res.result} alt={`Result ${idx}`} className="w-full aspect-square object-contain" />
                                                <div className="absolute top-2 left-2 w-8 h-8 rounded-lg border border-white/20 overflow-hidden shadow-lg">
                                                    <img src={res.pattern} alt="Pattern used" className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[90vw] pointer-events-none">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 flex items-center gap-4 shadow-2xl backdrop-blur-md pointer-events-auto animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">Ready to Fabricate</span>
                            <span className="text-[10px] text-slate-400">{patterns.length} patterns selected</span>
                        </div>
                    </div>
                    
                    <div className="h-8 w-px bg-white/10 shrink-0"></div>
                    
                    <button 
                        onClick={isGenerating ? handleStop : handleGenerate} 
                        disabled={!baseImage || patterns.length === 0} 
                        className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0 ${isGenerating ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white'}`}
                    >
                        {isGenerating ? (
                            <>
                                <StopCircle size={18} /> 
                                Stop ( {progress.current} / {progress.total} )
                            </>
                        ) : (
                            <>
                                <Layers size={18} /> Batch Generate
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
