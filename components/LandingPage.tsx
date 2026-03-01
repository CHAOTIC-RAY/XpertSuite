import React, { useEffect, useState } from 'react';
import { Wand2, Compass, Maximize2, BoxSelect, Zap, Palette, ClipboardCheck, FileCode, Film, FileText, Settings } from 'lucide-react';
import { sounds } from '../services/soundService';

interface LandingPageProps {
  onNavigate: (page: 'generator' | 'editor' | 'history' | 'angle_studio' | 'upscale' | 'style_transfer' | 'audit' | 'svg_converter' | 'video' | 'pdf') => void;
  onOpenSettings: () => void;
}

// Metallic Winged Logo Component
const XpertLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 457 425" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            fillRule="evenodd" 
            fill="white"
            d="M85.213,85.361 C85.213,85.361 109.675,85.260 121.215,85.468 C122.989,85.500 126.441,87.821 126.441,87.821 L145.148,100.591 L129.680,115.236 L85.213,85.361 ZM420.305,190.070 C405.770,181.469 391.638,173.105 376.531,164.166 C386.301,154.477 394.924,145.770 403.742,137.266 C406.778,134.338 408.654,131.313 408.630,126.890 C408.498,102.242 408.570,77.592 408.519,52.943 C408.516,51.673 408.022,50.405 407.670,48.725 C405.297,48.446 403.045,47.955 400.792,47.950 C376.136,47.894 351.480,47.999 326.825,47.839 C322.138,47.809 318.689,49.262 315.375,52.591 C271.422,96.731 227.359,140.760 183.339,184.834 C182.224,185.950 181.296,187.253 179.626,189.254 C184.310,192.155 188.444,194.835 192.689,197.325 C245.820,228.478 298.974,259.592 352.098,290.758 C356.111,293.112 360.217,295.441 363.797,298.371 C372.668,305.634 374.817,318.406 369.207,328.206 C363.555,338.079 352.954,342.174 341.730,338.411 C337.986,337.156 334.469,335.102 331.013,333.124 C314.866,323.886 298.776,314.547 282.010,304.866 C277.043,309.677 271.994,314.434 267.093,319.338 C234.127,352.325 201.171,385.322 168.282,418.385 C165.332,421.351 162.420,423.163 157.918,423.151 C107.274,423.005 56.629,423.076 5.984,423.058 C4.395,423.058 2.807,422.724 0.669,422.484 C0.461,419.134 0.124,416.229 0.122,413.323 C0.107,378.013 0.266,342.703 0.038,307.395 C-0.000,301.568 1.858,297.517 5.927,293.485 C35.263,264.413 64.400,235.142 93.584,205.917 C95.911,203.587 98.112,201.131 101.324,197.724 C67.150,177.233 33.613,157.124 0.528,137.285 C0.528,91.276 0.528,46.393 0.528,0.853 C3.886,0.627 6.811,0.261 9.736,0.257 C57.049,0.191 104.362,0.259 151.674,0.028 C157.472,-0.001 161.786,1.624 165.778,5.766 C177.773,18.211 190.027,30.407 203.103,43.634 C191.827,54.974 180.918,65.945 169.055,77.875 C161.693,70.530 154.266,63.975 147.901,56.514 C142.189,49.818 135.785,47.556 127.087,47.768 C104.777,48.312 82.444,47.934 60.120,47.925 C56.533,47.924 52.945,47.925 48.874,47.925 C48.494,50.887 48.049,52.771 48.042,54.657 C47.979,70.646 48.119,86.637 47.912,102.624 C47.850,107.401 49.109,110.664 53.467,113.251 C80.658,129.394 107.710,145.771 135.483,162.476 C137.792,160.530 140.159,158.810 142.206,156.769 C177.352,121.719 212.451,86.622 247.577,51.552 C262.899,36.254 278.384,21.118 293.513,5.633 C297.356,1.700 301.376,0.166 306.728,0.176 C353.708,0.259 400.688,0.163 447.667,0.170 C450.262,0.170 452.857,0.609 455.878,0.882 C456.089,3.971 456.419,6.574 456.421,9.177 C456.463,54.480 456.355,99.783 456.600,145.085 C456.635,151.623 454.742,156.201 449.865,160.674 C439.836,169.874 430.507,179.836 420.305,190.070 ZM143.087,225.648 C112.412,256.167 81.710,286.659 51.196,317.338 C49.357,319.186 48.176,322.509 48.123,325.174 C47.826,340.154 47.934,355.143 48.015,370.128 C48.023,371.648 48.775,373.164 49.297,375.114 C79.301,375.114 108.917,375.187 138.531,374.973 C140.840,374.956 143.650,373.454 145.360,371.765 C174.739,342.743 203.991,313.592 233.222,284.419 C234.505,283.139 235.313,281.384 237.040,278.811 C205.677,260.486 175.041,242.587 145.042,225.059 C143.696,225.452 143.289,225.447 143.087,225.648 ZM133.443,332.621 C129.710,336.465 125.928,338.558 120.403,338.356 C111.112,338.016 92.491,338.371 92.491,338.371 L83.041,338.033 C83.041,338.033 128.274,292.841 150.005,270.612 C159.536,276.276 168.562,281.641 178.467,287.528 C174.204,291.851 170.787,295.372 167.310,298.833 C156.008,310.084 144.553,321.184 133.443,332.621 ZM318.594,368.556 C331.249,375.306 344.685,377.813 359.109,376.182 C384.690,373.291 411.034,347.711 408.891,314.647 C407.487,293.001 398.539,275.481 379.492,264.279 C344.779,243.865 309.842,223.831 275.028,203.588 C263.253,196.741 251.567,189.741 239.285,182.483 C240.521,180.413 241.186,178.552 242.449,177.293 C271.693,148.136 300.961,119.001 330.385,90.026 C332.576,87.869 335.923,85.793 338.830,85.649 C349.396,85.127 360.004,85.443 371.816,85.443 C371.816,95.455 372.295,104.698 371.553,113.841 C371.299,116.975 368.445,120.310 366.003,122.788 C351.513,137.494 336.788,151.968 322.163,166.542 C320.563,168.136 319.098,169.865 316.981,172.174 C323.454,176.137 329.268,179.869 335.243,183.322 C358.009,196.478 380.868,209.475 403.618,222.659 C436.437,241.679 453.414,270.719 456.535,308.035 C459.000,337.516 451.371,364.425 432.179,387.063 C408.345,415.176 377.326,427.000 340.651,424.060 C324.446,422.761 309.424,417.559 295.314,409.697 C281.705,402.114 268.234,394.282 253.973,386.143 C266.268,373.736 277.238,362.666 288.265,351.539 C298.432,357.263 308.401,363.119 318.594,368.556 Z"
        />
    </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenSettings }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        // Calculate normalized position (-1 to 1)
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setMousePos({ x, y });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        
        const key = e.key;
        if (key === '1') onNavigate('generator');
        if (key === '2') onNavigate('angle_studio');
        if (key === '3') onNavigate('video');
        if (key === '4') onNavigate('upscale');
        if (key === '5') onNavigate('editor');
        if (key === '6') onNavigate('style_transfer');
        if (key === '7') onNavigate('svg_converter');
        if (key === '8') onNavigate('pdf');
        if (key === '9') onNavigate('audit');
        if (key === '0') onNavigate('history');
        if (key === ',') onOpenSettings();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNavigate, onOpenSettings]);

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-purple-500/30 relative bg-[#030014]">
      
      {/* Redesigned Background - Very Animated & Interactive */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Main Gradient Mesh - Interactive Wrapper */}
          <div 
            className="absolute inset-0 transition-transform duration-1000 ease-out will-change-transform"
            style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}
          >
             <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
          </div>

          <div 
            className="absolute inset-0 transition-transform duration-1000 ease-out will-change-transform"
            style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
          >
             <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
          </div>

          <div 
            className="absolute inset-0 transition-transform duration-1000 ease-out will-change-transform"
            style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)` }}
          >
             <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] bg-fuchsia-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen"></div>
          </div>
          
          {/* Grid Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.07]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -60px) scale(1.15); }
          66% { transform: translate(-30px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite ease-in-out alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes gradient-xy {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
      }
      .animate-gradient-xy {
          animation: gradient-xy 15s ease infinite;
      }
      `}</style>

      <div className="relative z-10 max-w-[1400px] mx-auto p-6 lg:p-8 flex flex-col">
        
        {/* New Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700 gap-6 md:gap-0">
            <div className="flex items-center gap-4">
                {/* New Metallic Winged Logo */}
                <div className="w-16 h-16 md:w-20 md:h-20 relative group cursor-default">
                    <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <XpertLogo className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">XpertStudio</h1>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em] mt-1">Creative Suite</span>
                </div>
            </div>
            
            {/* Settings Button */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => { sounds.playClick(); onOpenSettings(); }}
                    onMouseEnter={() => sounds.playHover()}
                    className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-white shadow-xl backdrop-blur-md hover:bg-white/10 hover:border-purple-500/50 transition-all active:scale-95 group"
                >
                    <Settings size={16} className="text-purple-400 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="uppercase tracking-widest">System Settings</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-[9px] opacity-40">,</span>
                </button>
            </div>
        </header>

        {/* Updated Hero Section & Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-20">
            
            {/* Main Hero Card - Smaller Version with Mouse Interaction */}
            <div 
                className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-b from-[#0f0f12]/80 to-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 flex flex-col justify-center relative overflow-hidden group transition-all duration-500 hover:border-purple-500/40 min-h-[260px] shadow-2xl cursor-default"
                style={{
                    backgroundPosition: `${50 + mousePos.x * 2}% ${50 + mousePos.y * 2}%`
                }}
                onMouseEnter={() => sounds.playHover()}
            >
                {/* Dynamic Background in Hero */}
                <div 
                    className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-transform duration-100 ease-out"
                    style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px) translate(50%, -50%)` }}
                ></div>
                
                <div className="relative z-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[9px] font-bold uppercase tracking-wider mb-4 w-fit">
                        <Zap size={10} fill="currentColor"/> v3.0 Now Available
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-[0.95]">
                        Design <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 animate-gradient-xy">Without Limits.</span>
                    </h2>
                    <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-xl p-4 max-w-sm hover:bg-white/10 transition-colors">
                        <p className="text-slate-300 text-xs leading-relaxed font-medium">
                            XpertStudio creates the impossible. From photorealistic product mockups to 3D angle synthesis and video motion.
                        </p>
                    </div>
                </div>
            </div>

            {/* Scene Generator */}
            <NavCard 
                title="Scene Gen" 
                subtitle="Environment" 
                icon={Wand2} 
                color="purple" 
                shortcut="1"
                onClick={() => onNavigate('generator')} 
            />

            {/* Angle Studio */}
            <NavCard 
                title="Angle Studio" 
                subtitle="3D Rotation" 
                icon={Compass} 
                color="blue" 
                shortcut="2"
                onClick={() => onNavigate('angle_studio')} 
            />

            {/* Motion Studio - Hidden on Mobile */}
            <NavCard 
                title="Motion Studio" 
                subtitle="Video Interpolation" 
                icon={Film} 
                color="pink" 
                shortcut="3"
                onClick={() => onNavigate('video')} 
                hideOnMobile={true}
            />

            {/* GigaXpert */}
            <NavCard 
                title="GigaXpert" 
                subtitle="Upscale" 
                icon={Maximize2} 
                color="green" 
                shortcut="4"
                onClick={() => onNavigate('upscale')} 
            />

            {/* Magic Editor */}
            <NavCard 
                title="Magic Edit" 
                subtitle="Inpainting" 
                icon={BoxSelect} 
                color="rose" 
                shortcut="5"
                onClick={() => onNavigate('editor')} 
            />

             {/* Style Transfer */}
            <NavCard 
                title="Style Transfer" 
                subtitle="Aesthetics" 
                icon={Palette} 
                color="orange" 
                shortcut="6"
                onClick={() => onNavigate('style_transfer')} 
            />

            {/* Vectorize - Hidden on Mobile */}
            <NavCard 
                title="Vectorize" 
                subtitle="Raster to SVG" 
                icon={FileCode} 
                color="cyan" 
                shortcut="7"
                onClick={() => onNavigate('svg_converter')} 
                hideOnMobile={true}
            />

            {/* PDF Intelligence - New */}
            <NavCard 
                title="PDF Intel" 
                subtitle="Chat & Compare" 
                icon={FileText} 
                color="teal" 
                shortcut="8"
                onClick={() => onNavigate('pdf')} 
            />

            {/* Design Audit */}
            <NavCard 
                title="Design Audit" 
                subtitle="AI Analysis" 
                icon={ClipboardCheck} 
                color="yellow" 
                shortcut="9"
                onClick={() => onNavigate('audit')} 
            />

        </div>

        <footer className="flex justify-between items-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto pb-8 border-t border-white/5 pt-8">
            <div>Suite © 2024</div>
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Powered by Google Gemini
            </div>
        </footer>
      </div>
    </div>
  );
};

const NavCard = ({ title, subtitle, icon: Icon, color, onClick, hideOnMobile, shortcut }: any) => {
    const styles: Record<string, { iconBg: string, border: string, gradient: string }> = {
        purple: { iconBg: "text-purple-400 group-hover:bg-purple-500/20 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]", border: "hover:border-purple-500/50", gradient: "from-purple-500/5" },
        blue: { iconBg: "text-blue-400 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]", border: "hover:border-blue-500/50", gradient: "from-blue-500/5" },
        pink: { iconBg: "text-pink-400 group-hover:bg-pink-500/20 group-hover:shadow-[0_0_40px_rgba(236,72,153,0.3)]", border: "hover:border-pink-500/50", gradient: "from-pink-500/5" },
        green: { iconBg: "text-green-400 group-hover:bg-green-500/20 group-hover:shadow-[0_0_40px_rgba(34,197,94,0.3)]", border: "hover:border-green-500/50", gradient: "from-green-500/5" },
        rose: { iconBg: "text-rose-400 group-hover:bg-rose-500/20 group-hover:shadow-[0_0_40px_rgba(244,63,94,0.3)]", border: "hover:border-rose-500/50", gradient: "from-rose-500/5" },
        orange: { iconBg: "text-orange-400 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_40px_rgba(249,115,22,0.3)]", border: "hover:border-orange-500/50", gradient: "from-orange-500/5" },
        cyan: { iconBg: "text-cyan-400 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_40px_rgba(34,211,238,0.3)]", border: "hover:border-cyan-500/50", gradient: "from-cyan-500/5" },
        yellow: { iconBg: "text-yellow-400 group-hover:bg-yellow-500/20 group-hover:shadow-[0_0_40px_rgba(234,179,8,0.3)]", border: "hover:border-yellow-500/50", gradient: "from-yellow-500/5" },
        teal: { iconBg: "text-teal-400 group-hover:bg-teal-500/20 group-hover:shadow-[0_0_40px_rgba(20,184,166,0.3)]", border: "hover:border-teal-500/50", gradient: "from-teal-500/5" }
    };
    
    const s = styles[color] || styles.purple;

    return (
        <div 
            onClick={() => { sounds.playClick(); onClick(); }}
            onMouseEnter={() => sounds.playHover()}
            className={`col-span-1 min-h-[220px] bg-[#0a0a0c]/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center relative overflow-hidden transform hover:-translate-y-1 hover:shadow-2xl ${s.border} ${hideOnMobile ? 'hidden md:flex' : 'flex'}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            
            {/* Shortcut Tooltip */}
            {shortcut && (
                <div className="absolute top-6 right-6 px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity">
                    {shortcut}
                </div>
            )}

            <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${s.iconBg}`}>
                <Icon size={32} strokeWidth={1.5}/>
            </div>
            <div className="relative z-10 text-center">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:tracking-wide transition-all">{title}</h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
    );
};