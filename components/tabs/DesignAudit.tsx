import React, { useState } from 'react';
import { ImageUploader } from '../ImageUploader';
import { ImagePlus, X, Upload, TrendingUp, ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Zap, ClipboardCheck, Eye, Layers, ChevronLeft, ChevronRight, MousePointer2 } from 'lucide-react';
import { DesignCritique } from '../../types';
import { analyzeDesign, generateHeatmap } from '../../services/auditService';
import { compressAndResizeImage } from '../../services/geminiService';

export const DesignAudit = () => {
    const [inputs, setInputs] = useState<string[]>([]);
    const [result, setResult] = useState<DesignCritique | null>(null);
    const [heatmaps, setHeatmaps] = useState<(string | null)[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);

    const handleImagesSelect = async (images: string[]) => {
        const compressed = await Promise.all(images.map(img => compressAndResizeImage(img, 1024)));
        setInputs([...inputs, ...compressed]);
        // Reset results when new images are added to ensure consistency
        if (result) {
            setResult(null);
            setHeatmaps([]);
        }
    };

    const handleClearImage = (index: number) => {
        const newInputs = inputs.filter((_, i) => i !== index);
        setInputs(newInputs);
        if (heatmaps.length > index) {
            setHeatmaps(heatmaps.filter((_, i) => i !== index));
        }
        if (selectedPageIndex >= newInputs.length) {
            setSelectedPageIndex(Math.max(0, newInputs.length - 1));
        }
    };

    const moveImage = (index: number, direction: -1 | 1, e: React.MouseEvent) => {
        e.stopPropagation();
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= inputs.length) return;

        const newInputs = [...inputs];
        [newInputs[index], newInputs[newIndex]] = [newInputs[newIndex], newInputs[index]];
        setInputs(newInputs);

        // If heatmaps exist, move them too
        if (heatmaps.length === inputs.length) {
            const newHeatmaps = [...heatmaps];
            [newHeatmaps[index], newHeatmaps[newIndex]] = [newHeatmaps[newIndex], newHeatmaps[index]];
            setHeatmaps(newHeatmaps);
        }

        // Follow selection
        if (selectedPageIndex === index) setSelectedPageIndex(newIndex);
        else if (selectedPageIndex === newIndex) setSelectedPageIndex(index);
    };

    const runAudit = async () => {
        if (inputs.length === 0) return;
        setIsGenerating(true);
        setHeatmaps([]);
        try {
            // Run analysis on the collection
            const auditPromise = analyzeDesign(inputs);
            
            // Run heatmap generation for ALL pages in parallel
            // We map catch to null so one failure doesn't break the whole process
            const heatmapPromises = inputs.map(img => 
                generateHeatmap(img).catch(e => {
                    console.error("Heatmap failed for image", e);
                    return null;
                })
            );

            const [auditRes, ...heatmapResults] = await Promise.all([
                auditPromise, 
                ...heatmapPromises
            ]);

            setResult(auditRes);
            setHeatmaps(heatmapResults);
        } catch (e) {
            console.error(e);
            alert("Audit failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#020202] overflow-hidden">
            <div className="flex-1 relative flex flex-col h-full overflow-y-auto custom-scrollbar">
                
                <div className="sticky top-0 z-30 bg-[#020202]/80 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span className="text-yellow-500">Design Audit</span>
                        <span className="text-slate-700">/</span>
                        <span>AI Analysis</span>
                    </div>
                    
                    {inputs.length > 0 && !result && (
                        <button 
                        onClick={runAudit}
                        disabled={isGenerating}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all disabled:opacity-50"
                        >
                        {isGenerating ? <Zap size={14} className="animate-spin"/> : <ClipboardCheck size={14}/>} Analyze Design
                        </button>
                    )}
                </div>

                <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                    
                    <div className="mb-12">
                        {inputs.length > 0 ? (
                            <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 snap-x items-center px-2">
                                <div className="h-[300px] aspect-[4/5] shrink-0 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 hover:border-yellow-500/50 transition-all cursor-pointer relative group bg-[#0a0a0c]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <ImagePlus size={32} className="text-slate-500 group-hover:text-yellow-500 transition-colors"/>
                                    </div>
                                    <span className="text-xs font-bold uppercase text-slate-600 group-hover:text-slate-400 tracking-widest">Add Page</span>
                                    <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={handleImagesSelect} compact /></div>
                                </div>
                                {inputs.map((img, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedPageIndex(i)}
                                        className={`relative h-[300px] aspect-[4/5] rounded-2xl overflow-hidden border shadow-2xl shrink-0 snap-center group bg-black transition-all cursor-pointer ${selectedPageIndex === i ? 'border-yellow-500 ring-2 ring-yellow-500/20 scale-105 z-10' : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 pointer-events-none">
                                            <div className="flex justify-between items-start pointer-events-auto">
                                                <div className="flex gap-1">
                                                    {i > 0 && <button onClick={(e) => moveImage(i, -1, e)} className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-white/20"><ChevronLeft size={14}/></button>}
                                                    {i < inputs.length - 1 && <button onClick={(e) => moveImage(i, 1, e)} className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-white/20"><ChevronRight size={14}/></button>}
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); handleClearImage(i); }} className="p-1.5 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-red-500 hover:text-white text-slate-400"><X size={14}/></button>
                                            </div>
                                            <div className="text-[10px] font-bold text-white uppercase tracking-wider text-center">Page {i + 1}</div>
                                        </div>
                                        {/* Selection Indicator */}
                                        {selectedPageIndex === i && (
                                            <div className="absolute top-2 left-2 w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_orange]"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 rounded-3xl border border-dashed border-white/10 bg-[#0a0a0c] flex flex-col items-center justify-center p-8 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="w-16 h-16 rounded-full bg-yellow-900/10 flex items-center justify-center mb-4 text-yellow-500 group-hover:scale-110 transition-transform">
                                    <Upload size={24}/>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Upload Design for Analysis</h3>
                                <p className="text-sm text-slate-500 max-w-md text-center">Upload single posts, carousels, or ad creatives. Our AI will analyze composition, typography, and visual impact.</p>
                                <div className="absolute inset-0 opacity-0 cursor-pointer"><ImageUploader onImagesSelect={handleImagesSelect} compact /></div>
                            </div>
                        )}
                    </div>

                    {isGenerating && (
                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                            <div className="w-20 h-20 rounded-full border-4 border-yellow-500/30 border-t-yellow-500 animate-spin mb-6"></div>
                            <div className="text-lg font-bold text-white uppercase tracking-widest">Analyzing Design Metrics...</div>
                            <p className="text-slate-500 text-sm mt-2">Generating Critique & Attention Heatmaps for {inputs.length} pages</p>
                        </div>
                    )}

                    {result && !isGenerating && (
                        <div className="animate-in slide-in-from-bottom-8 fade-in duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-1 bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 to-transparent"></div>
                                    <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" strokeWidth="8"/>
                                            <circle cx="50" cy="50" r="45" fill="none" stroke={result.score > 75 ? '#22c55e' : result.score > 50 ? '#eab308' : '#ef4444'} strokeWidth="8" strokeDasharray={`${result.score * 2.83} 283`} strokeLinecap="round" className="transition-all duration-1000"/>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-black text-white">{result.score}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">/ 100</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Overall Score</h3>
                                    <p className="text-center text-sm text-slate-400">{result.score > 80 ? 'Excellent work! Minimal changes needed.' : result.score > 60 ? 'Good foundation, but needs refinement.' : 'Significant improvements recommended.'}</p>
                                </div>

                                <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/10 rounded-3xl p-8 flex flex-col justify-center relative">
                                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={16}/> Executive Summary</h3>
                                    <p className="text-lg text-slate-300 leading-relaxed font-medium">"{result.summary}"</p>
                                </div>
                            </div>

                            {/* Heatmap Section */}
                            <div className="mb-8 bg-[#0a0a0c] border border-white/10 rounded-3xl p-1 overflow-hidden shadow-2xl">
                                <div className="bg-[#111] p-4 flex flex-col md:flex-row justify-between items-center rounded-t-[20px] gap-4">
                                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <Eye size={16} className="text-purple-500"/> Visual Attention Analysis 
                                        <span className="text-slate-600">|</span> 
                                        <span className="text-white">Page {selectedPageIndex + 1}</span>
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Pagination for heatmap if multiple */}
                                        {inputs.length > 1 && (
                                            <div className="flex items-center bg-black/40 rounded-lg border border-white/10 mr-4">
                                                <button 
                                                    onClick={() => setSelectedPageIndex(Math.max(0, selectedPageIndex - 1))}
                                                    disabled={selectedPageIndex === 0}
                                                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                                >
                                                    <ChevronLeft size={14}/>
                                                </button>
                                                <span className="text-[10px] font-bold text-slate-300 px-2 min-w-[60px] text-center">
                                                    {selectedPageIndex + 1} / {inputs.length}
                                                </span>
                                                <button 
                                                    onClick={() => setSelectedPageIndex(Math.min(inputs.length - 1, selectedPageIndex + 1))}
                                                    disabled={selectedPageIndex === inputs.length - 1}
                                                    className="p-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                                >
                                                    <ChevronRight size={14}/>
                                                </button>
                                            </div>
                                        )}

                                        <button 
                                            onClick={() => setShowHeatmap(!showHeatmap)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${showHeatmap ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}
                                        >
                                            <Layers size={14}/> {showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
                                        </button>
                                    </div>
                                </div>

                                <div className="relative w-full h-[500px] lg:h-[600px] bg-black/50 flex items-center justify-center p-4">
                                    <div className="relative h-full max-w-full aspect-[4/5] rounded-lg overflow-hidden shadow-2xl border border-white/5 group">
                                        
                                        {/* Original Image Layer */}
                                        <img 
                                            src={inputs[selectedPageIndex]} 
                                            className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${showHeatmap && heatmaps[selectedPageIndex] ? 'grayscale brightness-[0.4] blur-[1px]' : 'grayscale-0 brightness-100'}`}
                                            alt="Original"
                                        />

                                        {/* Heatmap Layer */}
                                        {heatmaps[selectedPageIndex] ? (
                                            <img 
                                                src={heatmaps[selectedPageIndex]!} 
                                                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 mix-blend-screen ${showHeatmap ? 'opacity-100' : 'opacity-0'}`}
                                                alt="Heatmap"
                                            />
                                        ) : (
                                           showHeatmap && (
                                               <div className="absolute inset-0 flex items-center justify-center">
                                                   <div className="bg-black/80 text-white text-xs px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                                       <XCircle size={14} className="text-red-500"/> Heatmap generation failed for this page
                                                   </div>
                                               </div>
                                           )
                                        )}
                                        
                                        {/* Legend */}
                                        <div className={`absolute bottom-4 left-4 bg-black/90 backdrop-blur-md p-3 rounded-xl border border-white/10 transition-opacity duration-300 ${showHeatmap ? 'opacity-100' : 'opacity-0'}`}>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MousePointer2 size={10}/> User Focus</div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red]"></div><span className="text-[10px] text-white font-medium">High Attention</span></div>
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_yellow]"></div><span className="text-[10px] text-white font-medium">Medium</span></div>
                                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] text-white font-medium">Low Interest</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6">
                                    <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-6 flex items-center gap-2 pb-4 border-b border-white/5"><ThumbsUp size={16}/> Strengths</h3>
                                    <ul className="space-y-4">
                                        {result.strengths.map((item, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-300">
                                                <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5"/>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6">
                                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2 pb-4 border-b border-white/5"><ThumbsDown size={16}/> Weak Points</h3>
                                    <ul className="space-y-4">
                                        {result.weaknesses.map((item, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-300">
                                                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5"/>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-gradient-to-b from-yellow-900/10 to-[#0a0a0c] border border-yellow-500/20 rounded-3xl p-6 shadow-inner">
                                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-6 flex items-center gap-2 pb-4 border-b border-white/5"><Zap size={16}/> Action Plan</h3>
                                    <ul className="space-y-4">
                                        {result.improvements.map((item, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-white font-medium">
                                                <div className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</div>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};