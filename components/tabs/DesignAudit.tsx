import React, { useState } from 'react';
import { ImageUploader } from '../ImageUploader';
import { ImagePlus, X, Upload, TrendingUp, ThumbsUp, ThumbsDown, CheckCircle2, XCircle, Zap, ClipboardCheck, Eye, Layers } from 'lucide-react';
import { DesignCritique } from '../../types';
import { analyzeDesign, generateHeatmap } from '../../services/auditService';
import { compressAndResizeImage } from '../../services/geminiService';

export const DesignAudit = () => {
    const [inputs, setInputs] = useState<string[]>([]);
    const [result, setResult] = useState<DesignCritique | null>(null);
    const [heatmap, setHeatmap] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(true);

    const handleImagesSelect = async (images: string[]) => {
        const compressed = await Promise.all(images.map(img => compressAndResizeImage(img, 1024)));
        setInputs([...inputs, ...compressed]);
    };

    const handleClearImage = (index: number) => {
        setInputs(inputs.filter((_, i) => i !== index));
    };

    const runAudit = async () => {
        if (inputs.length === 0) return;
        setIsGenerating(true);
        setHeatmap(null);
        try {
            // Run analysis and heatmap generation in parallel
            const [auditRes, heatmapRes] = await Promise.all([
                analyzeDesign(inputs),
                generateHeatmap(inputs[0]) // Generate heatmap for the first page/image
            ]);
            setResult(auditRes);
            setHeatmap(heatmapRes);
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
                                <div className="h-[450px] aspect-[4/5] shrink-0 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 hover:border-yellow-500/50 transition-all cursor-pointer relative group bg-[#0a0a0c]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <ImagePlus size={32} className="text-slate-500 group-hover:text-yellow-500 transition-colors"/>
                                    </div>
                                    <span className="text-xs font-bold uppercase text-slate-600 group-hover:text-slate-400 tracking-widest">Add Page</span>
                                    <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={handleImagesSelect} compact /></div>
                                </div>
                                {inputs.map((img, i) => (
                                    <div key={i} className="relative h-[450px] aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0 snap-center group bg-black">
                                        <img src={img} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                        <button onClick={() => handleClearImage(i)} className="absolute top-4 right-4 p-2.5 bg-black/50 backdrop-blur rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:border-red-500"><X size={16}/></button>
                                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">Page {i + 1}</div>
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
                            <p className="text-slate-500 text-sm mt-2">Generating Critique & Attention Heatmap</p>
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
                            {heatmap && (
                                <div className="mb-8 bg-[#0a0a0c] border border-white/10 rounded-3xl p-1 overflow-hidden">
                                    <div className="bg-[#111] p-4 flex justify-between items-center rounded-t-[20px]">
                                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                            <Eye size={16} className="text-purple-500"/> Visual Attention Analysis
                                        </h3>
                                        <button 
                                            onClick={() => setShowHeatmap(!showHeatmap)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase transition-colors text-slate-300"
                                        >
                                            <Layers size={14}/> {showHeatmap ? 'Show Original' : 'Show Heatmap'}
                                        </button>
                                    </div>
                                    <div className="relative w-full h-[400px] lg:h-[500px] bg-black/50 flex items-center justify-center p-4">
                                        <div className="relative h-full max-w-full aspect-[4/5] rounded-lg overflow-hidden shadow-2xl border border-white/5">
                                            {/* Original Image Layer */}
                                            <img 
                                                src={inputs[0]} 
                                                className="absolute inset-0 w-full h-full object-contain"
                                                alt="Original"
                                            />
                                            {/* Heatmap Layer */}
                                            <img 
                                                src={heatmap} 
                                                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${showHeatmap ? 'opacity-100' : 'opacity-0'}`}
                                                alt="Heatmap"
                                            />
                                            
                                            {/* Legend */}
                                            <div className={`absolute bottom-4 left-4 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 transition-opacity duration-300 ${showHeatmap ? 'opacity-100' : 'opacity-0'}`}>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Attention Map</div>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red]"></div><span className="text-[10px] text-white">High Focus</span></div>
                                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-[10px] text-white">Medium</span></div>
                                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] text-white">Low Focus</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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