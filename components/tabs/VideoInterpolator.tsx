import React, { useState, useRef, useEffect } from 'react';
import { Film, Play, Plus, Video, Sparkles, AlertCircle, Download, X, Trash2, ArrowRight, Zap, Settings2, Check } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { Button } from '../Button';
import { generateVideoInterpolation, TRANSITION_PRESETS } from '../../services/videoService';
import { GeneratedImage } from '../../types';

interface VideoInterpolatorProps {
    inputs: string[];
    setInputs: React.Dispatch<React.SetStateAction<string[]>>;
    onGenerate: (img: GeneratedImage) => void;
}

interface FrameNode {
    id: string;
    image: string;
}

interface TransitionLink {
    id: string; // usually `link-${fromIndex}-${toIndex}`
    fromId: string;
    toId: string;
    type: string; // preset key
    status: 'idle' | 'generating' | 'done';
    videoUrl?: string;
}

const TRANSITION_OPTIONS = [
    { id: 'smart-morph', label: 'Smart Morph', icon: Sparkles },
    { id: 'dissolve', label: 'Dissolve', icon: Zap },
    { id: 'pan-left', label: 'Pan Left', icon: ArrowRight },
    { id: 'pan-right', label: 'Pan Right', icon: ArrowRight },
    { id: 'zoom-in', label: 'Zoom In', icon: Plus },
];

export const VideoInterpolator: React.FC<VideoInterpolatorProps> = ({ inputs, setInputs, onGenerate }) => {
    // We maintain a local state for the storyboard sequence, initialized from inputs if any
    const [frames, setFrames] = useState<FrameNode[]>([]);
    const [links, setLinks] = useState<TransitionLink[]>([]);
    const [selectedLink, setSelectedLink] = useState<string | null>(null);
    const [activeVideo, setActiveVideo] = useState<string | null>(null);
    
    // Initialize frames from global inputs on mount if empty
    useEffect(() => {
        if (inputs.length > 0 && frames.length === 0) {
            const newFrames = inputs.map((img, i) => ({ id: `frame-${Date.now()}-${i}`, image: img }));
            setFrames(newFrames);
            
            // Auto-create default links
            const newLinks: TransitionLink[] = [];
            for (let i = 0; i < newFrames.length - 1; i++) {
                newLinks.push({
                    id: `link-${newFrames[i].id}-${newFrames[i+1].id}`,
                    fromId: newFrames[i].id,
                    toId: newFrames[i+1].id,
                    type: 'smart-morph',
                    status: 'idle'
                });
            }
            setLinks(newLinks);
        }
    }, []);

    // Sync back to global inputs when frames change
    useEffect(() => {
        const frameImages = frames.map(f => f.image);
        if (JSON.stringify(frameImages) !== JSON.stringify(inputs)) {
            setInputs(frameImages);
        }
    }, [frames]);

    const handleAddFrames = (newImages: string[]) => {
        const newFrameNodes = newImages.map((img, i) => ({ id: `frame-${Date.now()}-${i}`, image: img }));
        
        setFrames(prev => {
            const updated = [...prev, ...newFrameNodes];
            
            // Create links for the new connections
            if (prev.length > 0) {
                const lastOld = prev[prev.length - 1];
                const firstNew = newFrameNodes[0];
                const connectingLink: TransitionLink = {
                    id: `link-${lastOld.id}-${firstNew.id}`,
                    fromId: lastOld.id,
                    toId: firstNew.id,
                    type: 'smart-morph',
                    status: 'idle'
                };
                
                // Also link internal new frames
                const internalLinks: TransitionLink[] = [];
                for (let i = 0; i < newFrameNodes.length - 1; i++) {
                    internalLinks.push({
                        id: `link-${newFrameNodes[i].id}-${newFrameNodes[i+1].id}`,
                        fromId: newFrameNodes[i].id,
                        toId: newFrameNodes[i+1].id,
                        type: 'smart-morph',
                        status: 'idle'
                    });
                }
                
                setLinks(l => [...l, connectingLink, ...internalLinks]);
            }
            return updated;
        });
    };

    const handleRemoveFrame = (index: number) => {
        const frameToRemove = frames[index];
        setFrames(prev => prev.filter((_, i) => i !== index));
        // Remove associated links
        setLinks(prev => prev.filter(l => l.fromId !== frameToRemove.id && l.toId !== frameToRemove.id));
        // Note: Connecting the gap (prev -> next) is complex, usually easier to just break the chain or require user to re-add. 
        // For simplicity, we break the chain here.
    };

    const handleGenerateLink = async (linkId: string) => {
        const link = links.find(l => l.id === linkId);
        if (!link) return;

        const startFrame = frames.find(f => f.id === link.fromId);
        const endFrame = frames.find(f => f.id === link.toId);
        
        if (!startFrame || !endFrame) return;

        // Update status
        setLinks(prev => prev.map(l => l.id === linkId ? { ...l, status: 'generating' } : l));

        try {
            const url = await generateVideoInterpolation(startFrame.image, endFrame.image, null, link.type);
            
            setLinks(prev => prev.map(l => l.id === linkId ? { ...l, status: 'done', videoUrl: url } : l));
            setActiveVideo(url);
            
            onGenerate({
                id: Date.now().toString(),
                originalUrl: startFrame.image,
                resultUrl: url,
                prompt: `Transition: ${link.type}`,
                type: 'video',
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(error);
            alert("Video generation failed.");
            setLinks(prev => prev.map(l => l.id === linkId ? { ...l, status: 'idle' } : l));
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-[#020202] overflow-hidden">
            {/* Top Bar / Header */}
            <div className="h-16 border-b border-white/5 bg-[#050505] flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-2">
                    <Film className="text-pink-500" size={18} />
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Motion Studio</h2>
                </div>
                <div className="flex items-center gap-2">
                     <span className="text-[10px] text-slate-500 uppercase font-bold bg-white/5 px-2 py-1 rounded">Beta</span>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col relative">
                
                {/* 1. Preview Stage (Top Half) */}
                <div className="flex-1 bg-[#080808] flex items-center justify-center p-8 border-b border-white/5 relative">
                    {activeVideo ? (
                        <div className="relative aspect-video h-full max-h-[50vh] rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 group animate-in fade-in zoom-in-[0.98] duration-500">
                            <video 
                                src={activeVideo} 
                                controls 
                                autoPlay 
                                loop 
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={activeVideo} download className="p-2 bg-white text-black rounded-lg text-xs font-bold flex items-center gap-2"><Download size={14}/> Download</a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center opacity-20 animate-pulse">
                            <Film size={64} className="mb-4 text-slate-500"/>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Select a generated transition to preview</p>
                        </div>
                    )}
                </div>

                {/* 2. Storyboard Timeline (Bottom Half) */}
                <div className="h-[320px] bg-[#020202] flex flex-col relative z-10 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="px-6 py-2 border-b border-white/5 flex justify-between items-center bg-[#0a0a0c]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Storyboard Sequence</span>
                        <span className="text-[10px] text-slate-600">Add frames • Connect wires • Render transitions</span>
                    </div>

                    <div className="flex-1 overflow-x-auto custom-scrollbar p-8 flex items-center gap-0 min-w-full">
                        
                        {/* Empty State */}
                        {frames.length === 0 && (
                            <div className="w-full flex items-center justify-center">
                                <div className="w-64 h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-pink-500/50 hover:bg-pink-900/5 transition-all cursor-pointer relative group">
                                    <Plus size={32} className="text-slate-600 group-hover:text-pink-500 mb-2 transition-colors"/>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Project</span>
                                    <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={handleAddFrames} compact /></div>
                                </div>
                            </div>
                        )}

                        {frames.map((frame, index) => {
                            // Check if there is a link to the next frame
                            const link = links.find(l => l.fromId === frame.id);
                            
                            return (
                                <React.Fragment key={frame.id}>
                                    {/* Frame Node */}
                                    <div className="relative group shrink-0">
                                        <div className="w-48 aspect-video bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden shadow-lg group-hover:border-white/30 transition-all relative">
                                            <img src={frame.image} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] font-mono text-white">#{index + 1}</div>
                                            <button 
                                                onClick={() => handleRemoveFrame(index)}
                                                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-md hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={12}/>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Connector Wire (if not last) */}
                                    {link && (
                                        <div className="w-32 h-24 flex items-center justify-center relative shrink-0">
                                            {/* Wire Line */}
                                            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-slate-700 via-slate-700 to-slate-700 top-1/2 -translate-y-1/2 z-0"></div>
                                            
                                            {/* Interaction Node */}
                                            <div className="relative z-10">
                                                {link.status === 'generating' ? (
                                                    <div className="w-10 h-10 rounded-full bg-pink-900 border-2 border-pink-500 flex items-center justify-center animate-pulse">
                                                        <Sparkles size={16} className="text-white animate-spin"/>
                                                    </div>
                                                ) : link.status === 'done' ? (
                                                    <button 
                                                        onClick={() => link.videoUrl && setActiveVideo(link.videoUrl)}
                                                        className="w-10 h-10 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-110 transition-transform"
                                                    >
                                                        <Play size={16} className="text-black fill-current ml-0.5"/>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setSelectedLink(link.id)}
                                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 shadow-lg ${selectedLink === link.id ? 'bg-pink-600 border-pink-400 text-white' : 'bg-[#1a1a1a] border-slate-600 text-slate-400 hover:border-pink-500 hover:text-pink-500'}`}
                                                    >
                                                        <Zap size={14} fill="currentColor"/>
                                                    </button>
                                                )}
                                                
                                                {/* Preset Label */}
                                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                                    <span className="text-[9px] font-bold uppercase text-slate-500 bg-black/50 px-1.5 py-0.5 rounded border border-white/5">{link.type}</span>
                                                </div>

                                                {/* Popover Config (Only active link) */}
                                                {selectedLink === link.id && link.status !== 'generating' && (
                                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#151515] border border-white/10 rounded-xl p-3 w-48 shadow-2xl animate-in zoom-in-95 z-50 flex flex-col gap-1">
                                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Transition</span>
                                                            <button onClick={() => setSelectedLink(null)}><X size={12} className="text-slate-500 hover:text-white"/></button>
                                                        </div>
                                                        
                                                        <div className="max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1 mb-2">
                                                            {TRANSITION_OPTIONS.map(opt => (
                                                                <button 
                                                                    key={opt.id}
                                                                    onClick={() => setLinks(prev => prev.map(l => l.id === link.id ? { ...l, type: opt.id } : l))}
                                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase text-left transition-colors ${link.type === opt.id ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                                                >
                                                                    <opt.icon size={12}/> {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => { handleGenerateLink(link.id); setSelectedLink(null); }}
                                                            className="w-full py-2 bg-white text-black rounded-lg text-[10px] font-bold uppercase hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <Sparkles size={12}/> Render
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {/* Add Button at end */}
                        {frames.length > 0 && (
                            <div className="w-24 h-24 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer relative group shrink-0 ml-8 opacity-50 hover:opacity-100">
                                <Plus size={24} className="text-slate-600 group-hover:text-white mb-1 transition-colors"/>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Add</span>
                                <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={handleAddFrames} compact /></div>
                            </div>
                        )}
                        
                        {/* Right padding for scroll */}
                        <div className="w-12 shrink-0"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};