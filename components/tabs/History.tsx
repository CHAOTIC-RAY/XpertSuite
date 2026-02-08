import React from 'react';
import { History as HistoryIcon, Trash2 } from 'lucide-react';
import { GeneratedImage } from '../../types';
import { ResultsGallery } from '../ResultsGallery';

interface HistoryProps {
    images: GeneratedImage[];
    onClear: () => void;
}

export const History: React.FC<HistoryProps> = ({ images, onClear }) => {
    return (
        <div className="absolute inset-0 bg-[#050505] overflow-y-auto custom-scrollbar p-4 lg:p-8 pb-32 lg:pb-8">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-3">
                            <HistoryIcon size={32} className="text-slate-500"/> History
                        </h2>
                        <p className="text-slate-500 text-sm mt-1 font-mono uppercase tracking-widest">Global Generation Log</p>
                    </div>
                    {images.length > 0 && (
                        <button 
                            onClick={() => { if(window.confirm('Clear all history?')) onClear(); }} 
                            className="px-4 py-2 bg-red-900/20 border border-red-900/50 text-red-400 hover:bg-red-900/40 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    )}
                </div>
                
                {images.length > 0 ? (
                    <ResultsGallery images={images} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <HistoryIcon size={64} className="text-slate-600 mb-4"/>
                        <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">No History Yet</p>
                        <p className="text-slate-600 text-sm mt-2">Generate some images to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
