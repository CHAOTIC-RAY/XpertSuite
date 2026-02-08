import React from 'react';
import { Wand2, Compass, Maximize2, BoxSelect, Zap, Cpu, ScanFace, Globe, Palette, ClipboardCheck, FileCode } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: 'generator' | 'editor' | 'history' | 'angle_studio' | 'upscale' | 'style_transfer' | 'audit' | 'svg_converter') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-purple-500/30 relative bg-[#020202] overflow-y-auto custom-scrollbar">
      
      {/* Deep Space Animated Background (Fixed) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,#1a0b2e_0%,#000000_60%)] animate-pulse opacity-60"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150"></div>
        
        {/* Moving Nebulas */}
        <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[60%] right-[20%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[40%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 20s infinite ease-in-out alternate;
        }
      `}</style>

      <div className="relative z-10 max-w-[1400px] mx-auto p-6 lg:p-8 flex flex-col">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700 gap-4 md:gap-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-2xl">
                    <Zap className="text-purple-400" size={24} fill="currentColor" fillOpacity={0.2} />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white leading-none">Chaotic<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">X</span></h1>
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-bold block mt-1">Creative Suite</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 shadow-lg backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    SYSTEM ONLINE
                </div>
            </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pb-20">
            
            {/* Main Hero Card */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-[#08080a]/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-center relative overflow-hidden group transition-all duration-500 hover:border-purple-500/30 min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-600/20 transition-all duration-700"></div>
                
                <div className="relative z-20">
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-[0.9]">
                        Chaos <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">Theory.</span>
                    </h2>
                    {/* Compact Text Box */}
                    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 max-w-sm">
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            The ultimate generative workspace. Visualize, Rotate, Edit, and Enhance in one fluid motion.
                        </p>
                    </div>
                </div>
            </div>

            {/* Scene Generator */}
            <div 
                onClick={() => onNavigate('generator')}
                className="col-span-1 min-h-[240px] bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 hover:border-purple-500/50 rounded-[2.5rem] p-6 cursor-pointer transition-all hover:bg-purple-500/5 group flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                    <Wand2 size={48} strokeWidth={1.5}/>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Scene Gen</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Environment</p>
                </div>
            </div>

            {/* Angle Studio */}
            <div 
                onClick={() => onNavigate('angle_studio')}
                className="col-span-1 min-h-[240px] bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 hover:border-blue-500/50 rounded-[2.5rem] p-6 cursor-pointer transition-all hover:bg-blue-500/5 group flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                    <Compass size={48} strokeWidth={1.5}/>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Angle Studio</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">3D Rotation</p>
                </div>
            </div>

            {/* GigaXpert */}
            <div 
                onClick={() => onNavigate('upscale')}
                className="col-span-1 min-h-[240px] bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 hover:border-green-500/50 rounded-[2.5rem] p-6 cursor-pointer transition-all hover:bg-green-500/5 group flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <Maximize2 size={48} strokeWidth={1.5}/>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">GigaXpert</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Upscale</p>
                </div>
            </div>

            {/* Magic Editor */}
            <div 
                onClick={() => onNavigate('editor')}
                className="col-span-1 min-h-[240px] bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 hover:border-pink-500/50 rounded-[2.5rem] p-6 cursor-pointer transition-all hover:bg-pink-500/5 group flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-pink-500/10 rounded-full flex items-center justify-center mb-6 text-pink-400 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(236,72,153,0.15)]">
                    <BoxSelect size={48} strokeWidth={1.5}/>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Magic Edit</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inpainting</p>
                </div>
            </div>

             {/* Style Transfer */}
            <div 
                onClick={() => onNavigate('style_transfer')}
                className="col-span-1 min-h-[240px] bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 hover:border-orange-500/50 rounded-[2.5rem] p-6 cursor-pointer transition-all hover:bg-orange-500/5 group flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                    <Palette size={48} strokeWidth={1.5}/>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Style Transfer</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aesthetics</p>
                </div>
            </div>

            {/* Vectorize (New Card) */}
            <div 
                onClick={() => onNavigate('svg_converter')}
                className="col-span-1 min-h-[240px] bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 hover:border-cyan-500/50 rounded-[2.5rem] p-6 cursor-pointer transition-all hover:bg-cyan-500/5 group flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,211,238,0.15)]">
                    <FileCode size={48} strokeWidth={1.5}/>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Vectorize</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Raster to SVG</p>
                </div>
            </div>

            {/* Design Audit */}
            <div 
                onClick={() => onNavigate('audit')}
                className="col-span-1 min-h-[240px] bg-[#0a0a0c]/60 backdrop-blur-md border border-white/5 hover:border-yellow-500/50 rounded-[2.5rem] p-6 cursor-pointer transition-all hover:bg-yellow-500/5 group flex flex-col items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 text-yellow-500 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                    <ClipboardCheck size={48} strokeWidth={1.5}/>
                </div>
                <div className="relative z-10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-1">Design Audit</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Analysis</p>
                </div>
            </div>

             {/* Stats / Info */}
             <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[240px]">
                 <div className="text-center mb-6">
                     <div className="flex justify-center mb-3"><Cpu size={20} className="text-slate-500"/></div>
                     <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Model</div>
                     <div className="text-xl font-black text-white">Nano v3</div>
                 </div>
                 <div className="w-16 h-px bg-white/10 mb-6"></div>
                 <div className="text-center">
                     <div className="flex justify-center mb-3"><Globe size={20} className="text-slate-500"/></div>
                     <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Global</div>
                     <div className="text-xl font-black text-white">Edge</div>
                 </div>
            </div>

        </div>

        <footer className="flex justify-between items-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto pb-8">
            <div>ChaoticX Suite © 2024</div>
            <div>Powered by Google Gemini</div>
        </footer>
      </div>
    </div>
  );
};