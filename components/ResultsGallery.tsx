import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Maximize2, MessageSquare, Edit3, Trash2 } from 'lucide-react';

interface ResultsGalleryProps {
  images: GeneratedImage[];
  onDelete?: (id: string) => void;
  onChat?: (url: string) => void;
}

export const ResultsGallery: React.FC<ResultsGalleryProps> = ({ images, onDelete, onChat }) => {
  if (images.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-2">
        Generated Mockups
        <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
          {images.length}
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800 hover:border-purple-500/50 hover:shadow-2xl transition-all duration-300">
            <div className="aspect-square bg-slate-950 relative overflow-hidden">
               <img 
                 src={img.resultUrl} 
                 alt={img.prompt} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="flex gap-2 justify-end">
                    {onChat && (
                      <button 
                        className="p-2 bg-slate-800/80 backdrop-blur-md rounded-lg text-white hover:bg-purple-600 transition-colors"
                        title="Chat with Image"
                        onClick={() => onChat(img.resultUrl)}
                      >
                        <MessageSquare size={20} />
                      </button>
                    )}
                    <a 
                      href={img.resultUrl} 
                      download={`mockup-${img.id}.png`}
                      className="p-2 bg-slate-800/80 backdrop-blur-md rounded-lg text-white hover:bg-purple-600 transition-colors"
                      title="Download"
                    >
                      <Download size={20} />
                    </a>
                    {onDelete && (
                      <button 
                        onClick={() => { if(window.confirm('Delete this image?')) onDelete(img.id); }}
                        className="p-2 bg-slate-800/80 backdrop-blur-md rounded-lg text-white hover:bg-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
               </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`
                  text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide
                  ${img.type === 'mockup' ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-800' : ''}
                  ${img.type === 'remove-bg' ? 'bg-pink-900/50 text-pink-300 border border-pink-800' : ''}
                  ${img.type === 'upscale' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-800' : ''}
                  ${img.type === 'angle' ? 'bg-orange-900/50 text-orange-300 border border-orange-800' : ''}
                  ${img.type === 'edit' ? 'bg-teal-900/50 text-teal-300 border border-teal-800' : ''}
                `}>
                  {img.type}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(img.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2" title={img.prompt}>
                {img.prompt || 'No custom prompt'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
