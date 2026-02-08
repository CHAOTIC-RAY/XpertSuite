import React, { useState } from 'react';
import { X, ImagePlus, Zap, ArrowRightLeft, CheckCircle2, Download, FileCode, Copy } from 'lucide-react';
import { ImageUploader } from '../ImageUploader';
import { generateSVG } from '../../services/vectorService';
import { compressAndResizeImage } from '../../services/geminiService';

export const SvgConverter = () => {
    const [svgInput, setSvgInput] = useState<string | null>(null);
    const [svgOutput, setSvgOutput] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleImagesSelect = async (images: string[]) => {
        if (images[0]) {
            const compressed = await compressAndResizeImage(images[0], 1024);
            setSvgInput(compressed);
            setSvgOutput(null);
        }
    };

    const handleGenerate = async () => {
        if (!svgInput) return;
        setIsGenerating(true);
        try {
            const svgCode = await generateSVG(svgInput);
            setSvgOutput(svgCode);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadSvg = () => {
        if (!svgOutput) return;
        const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vector-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="absolute inset-0 flex bg-[#030303]">
            <div className="flex-1 relative flex flex-col">
                <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 gap-4 lg:gap-8 overflow-y-auto">
                    {/* Source */}
                    <div className="flex-1 w-full lg:w-auto h-[40vh] lg:h-full lg:max-h-[80vh] bg-[#0a0a0c] rounded-2xl border border-white/10 p-6 flex flex-col relative group">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Source Raster Image</h3>
                        {svgInput ? (
                            <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-xl bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                                <img src={svgInput} className="max-w-full max-h-full object-contain" />
                                <button onClick={() => setSvgInput(null)} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"><X size={16}/></button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-white/5 transition-all cursor-pointer relative">
                                <div className="absolute inset-0 opacity-0"><ImageUploader onImagesSelect={handleImagesSelect} compact /></div>
                                <ImagePlus size={48} className="text-slate-600 mb-4"/>
                                <p className="text-sm font-bold text-slate-400">Upload Image to Vectorize</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Action */}
                    <div className="flex items-center justify-center shrink-0">
                        <button onClick={handleGenerate} disabled={!svgInput || isGenerating} className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-700 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all hover:scale-110">
                            {isGenerating ? <Zap size={24} className="animate-spin text-white"/> : <ArrowRightLeft size={24} className="text-white"/>}
                        </button>
                    </div>

                    {/* Result */}
                    <div className="flex-1 w-full lg:w-auto h-[40vh] lg:h-full lg:max-h-[80vh] bg-[#0a0a0c] rounded-2xl border border-white/10 p-6 flex flex-col relative">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex justify-between items-center">
                            <span>Vector Output (SVG)</span>
                            {svgOutput && <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> Ready</span>}
                        </h3>
                        {svgOutput ? (
                            <div className="flex-1 flex flex-col relative">
                                <div className="flex-1 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-white/5 p-4 relative">
                                    <div className="w-full h-full flex items-center justify-center" style={{ contain: 'strict' }} dangerouslySetInnerHTML={{ __html: svgOutput }} />
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button onClick={handleDownloadSvg} className="flex-1 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"><Download size={16}/> Download SVG</button>
                                    <button onClick={() => navigator.clipboard.writeText(svgOutput)} className="px-4 py-3 bg-white/5 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2"><Copy size={16}/> Copy Code</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border border-white/5 rounded-xl bg-white/5 text-slate-500">
                                <FileCode size={48} className="mb-4 opacity-50"/>
                                <p className="text-sm font-bold">Waiting for input...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
