import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImagesSelect: (base64s: string[]) => void;
  compact?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelect, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList) => {
    const promises: Promise<string>[] = [];
    
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
      promises.push(promise);
    });

    Promise.all(promises).then(results => {
      onImagesSelect(results);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (compact) {
    return (
      <div className="relative group overflow-hidden border-2 border-dashed border-slate-700 hover:border-purple-500 hover:bg-slate-800/50 bg-slate-800/20 rounded-xl transition-all h-full w-full flex flex-col items-center justify-center cursor-pointer">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <Upload size={20} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[300px] cursor-pointer
        ${isDragging 
          ? 'border-purple-500 bg-purple-500/10 scale-[1.01]' 
          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="w-16 h-16 bg-slate-800 text-purple-400 rounded-full flex items-center justify-center mb-4 shadow-lg ring-1 ring-slate-700">
        <Upload size={32} strokeWidth={2} />
      </div>
      <h3 className="text-xl font-semibold text-slate-200 mb-2">
        Upload your products
      </h3>
      <p className="text-slate-400 max-w-sm">
        Drag and drop multiple images here, or click to browse.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-purple-400 uppercase tracking-wider font-semibold">
        <ImageIcon size={14} />
        <span>Nano Banana Powered</span>
      </div>
    </div>
  );
};