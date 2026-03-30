import React, { useEffect, useState } from 'react';
import { Wand2, Compass, Maximize2, BoxSelect, Zap, Palette, ClipboardCheck, FileCode, Film, FileText, Settings, GripVertical, Layers } from 'lucide-react';
import { sounds } from '../services/soundService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LandingPageProps {
  onNavigate: (page: 'generator' | 'editor' | 'history' | 'angle_studio' | 'upscale' | 'style_transfer' | 'audit' | 'svg_converter' | 'video' | 'pdf' | 'bulk_mockup') => void;
  onOpenSettings: () => void;
  cardOrder?: string[];
  onOrderChange?: (newOrder: string[]) => void;
}

const DEFAULT_CARDS = [
    { id: 'generator', title: "Scene Gen", subtitle: "Environment", icon: Wand2, color: "purple", shortcut: "1" },
    { id: 'angle_studio', title: "Angle Studio", subtitle: "3D Rotation", icon: Compass, color: "blue", shortcut: "2" },
    { id: 'video', title: "Motion Studio", subtitle: "Video Interpolation", icon: Film, color: "pink", shortcut: "3", hideOnMobile: true },
    { id: 'upscale', title: "GigaXpert", subtitle: "Upscale", icon: Maximize2, color: "green", shortcut: "4" },
    { id: 'editor', title: "Magic Edit", subtitle: "Inpainting", icon: BoxSelect, color: "rose", shortcut: "5" },
    { id: 'style_transfer', title: "Style Transfer", subtitle: "Aesthetics", icon: Palette, color: "orange", shortcut: "6" },
    { id: 'bulk_mockup', title: "Batch Fabricator", subtitle: "Bulk Mockups", icon: Layers, color: "amber", shortcut: "7" },
    { id: 'svg_converter', title: "Vectorize", subtitle: "Raster to SVG", icon: FileCode, color: "cyan", shortcut: "8", hideOnMobile: true },
    { id: 'pdf', title: "PDF Intel", subtitle: "Chat & Compare", icon: FileText, color: "teal", shortcut: "9" },
    { id: 'audit', title: "Design Audit", subtitle: "AI Analysis", icon: ClipboardCheck, color: "yellow", shortcut: "0" },
];

// Metallic Winged Logo Component
const XpertLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 457 425" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <path 
            fillRule="evenodd" 
            fill="url(#metallicGradient)"
            filter="url(#glow)"
            d="M85.213,85.361 C85.213,85.361 109.675,85.260 121.215,85.468 C122.989,85.500 126.441,87.821 126.441,87.821 L145.148,100.591 L129.680,115.236 L85.213,85.361 ZM420.305,190.070 C405.770,181.469 391.638,173.105 376.531,164.166 C386.301,154.477 394.924,145.770 403.742,137.266 C406.778,134.338 408.654,131.313 408.630,126.890 C408.498,102.242 408.570,77.592 408.519,52.943 C408.516,51.673 408.022,50.405 407.670,48.725 C405.297,48.446 403.045,47.955 400.792,47.950 C376.136,47.894 351.480,47.999 326.825,47.839 C322.138,47.809 318.689,49.262 315.375,52.591 C271.422,96.731 227.359,140.760 183.339,184.834 C182.224,185.950 181.296,187.253 179.626,189.254 C184.310,192.155 188.444,194.835 192.689,197.325 C245.820,228.478 298.974,259.592 352.098,290.758 C356.111,293.112 360.217,295.441 363.797,298.371 C372.668,305.634 374.817,318.406 369.207,328.206 C363.555,338.079 352.954,342.174 341.730,338.411 C337.986,337.156 334.469,335.102 331.013,333.124 C314.866,323.886 298.776,314.547 282.010,304.866 C277.043,309.677 271.994,314.434 267.093,319.338 C234.127,352.325 201.171,385.322 168.282,418.385 C165.332,421.351 162.420,423.163 157.918,423.151 C107.274,423.005 56.629,423.076 5.984,423.058 C4.395,423.058 2.807,422.724 0.669,422.484 C0.461,419.134 0.124,416.229 0.122,413.323 C0.107,378.013 0.266,342.703 0.038,307.395 C-0.000,301.568 1.858,297.517 5.927,293.485 C35.263,264.413 64.400,235.142 93.584,205.917 C95.911,203.587 98.112,201.131 101.324,197.724 C67.150,177.233 33.613,157.124 0.528,137.285 C0.528,91.276 0.528,46.393 0.528,0.853 C3.886,0.627 6.811,0.261 9.736,0.257 C57.049,0.191 104.362,0.259 151.674,0.028 C157.472,-0.001 161.786,1.624 165.778,5.766 C177.773,18.211 190.027,30.407 203.103,43.634 C191.827,54.974 180.918,65.945 169.055,77.875 C161.693,70.530 154.266,63.975 147.901,56.514 C142.189,49.818 135.785,47.556 127.087,47.768 C104.777,48.312 82.444,47.934 60.120,47.925 C56.533,47.924 52.945,47.925 48.874,47.925 C48.494,50.887 48.049,52.771 48.042,54.657 C47.979,70.646 48.119,86.637 47.912,102.624 C47.850,107.401 49.109,110.664 53.467,113.251 C80.658,129.394 107.710,145.771 135.483,162.476 C137.792,160.530 140.159,158.810 142.206,156.769 C177.352,121.719 212.451,86.622 247.577,51.552 C262.899,36.254 278.384,21.118 293.513,5.633 C297.356,1.700 301.376,0.166 306.728,0.176 C353.708,0.259 400.688,0.163 447.667,0.170 C450.262,0.170 452.857,0.609 455.878,0.882 C456.089,3.971 456.419,6.574 456.421,9.177 C456.463,54.480 456.355,99.783 456.600,145.085 C456.635,151.623 454.742,156.201 449.865,160.674 C439.836,169.874 430.507,179.836 420.305,190.070 ZM143.087,225.648 C112.412,256.167 81.710,286.659 51.196,317.338 C49.357,319.186 48.176,322.509 48.123,325.174 C47.826,340.154 47.934,355.143 48.015,370.128 C48.023,371.648 48.775,373.164 49.297,375.114 C79.301,375.114 108.917,375.187 138.531,374.973 C140.840,374.956 143.650,373.454 145.360,371.765 C174.739,342.743 203.991,313.592 233.222,284.419 C234.505,283.139 235.313,281.384 237.040,278.811 C205.677,260.486 175.041,242.587 145.042,225.059 C143.696,225.452 143.289,225.447 143.087,225.648 ZM133.443,332.621 C129.710,336.465 125.928,338.558 120.403,338.356 C111.112,338.016 92.491,338.371 92.491,338.371 L83.041,338.033 C83.041,338.033 128.274,292.841 150.005,270.612 C159.536,276.276 168.562,281.641 178.467,287.528 C174.204,291.851 170.787,295.372 167.310,298.833 C156.008,310.084 144.553,321.184 133.443,332.621 ZM318.594,368.556 C331.249,375.306 344.685,377.813 359.109,376.182 C384.690,373.291 411.034,347.711 408.891,314.647 C407.487,293.001 398.539,275.481 379.492,264.279 C344.779,243.865 309.842,223.831 275.028,203.588 C263.253,196.741 251.567,189.741 239.285,182.483 C240.521,180.413 241.186,178.552 242.449,177.293 C271.693,148.136 300.961,119.001 330.385,90.026 C332.576,87.869 335.923,85.793 338.830,85.649 C349.396,85.127 360.004,85.443 371.816,85.443 C371.816,95.455 372.295,104.698 371.553,113.841 C371.299,116.975 368.445,120.310 366.003,122.788 C351.513,137.494 336.788,151.968 322.163,166.542 C320.563,168.136 319.098,169.865 316.981,172.174 C323.454,176.137 329.268,179.869 335.243,183.322 C358.009,196.478 380.868,209.475 403.618,222.659 C436.437,241.679 453.414,270.719 456.535,308.035 C459.000,337.516 451.371,364.425 432.179,387.063 C408.345,415.176 377.326,427.000 340.651,424.060 C324.446,422.761 309.424,417.559 295.314,409.697 C281.705,402.114 268.234,394.282 253.973,386.143 C266.268,373.736 277.238,362.666 288.265,351.539 C298.432,357.263 308.401,363.119 318.594,368.556 Z"
        />
    </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenSettings, cardOrder, onOrderChange }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cards, setCards] = useState<typeof DEFAULT_CARDS>(() => {
    if (cardOrder && cardOrder.length > 0) {
        return cardOrder.map(id => DEFAULT_CARDS.find(c => c.id === id)).filter(Boolean) as typeof DEFAULT_CARDS;
    }
    return DEFAULT_CARDS;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (cardOrder && cardOrder.length > 0) {
        const newCards = cardOrder.map(id => DEFAULT_CARDS.find(c => c.id === id)).filter(Boolean) as typeof DEFAULT_CARDS;
        setCards(newCards);
    }
  }, [cardOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const nextItems = arrayMove(items, oldIndex, newIndex) as typeof DEFAULT_CARDS;
        if (onOrderChange) onOrderChange(nextItems.map(i => i.id));
        return nextItems;
      });
    }
  };

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

      <div className="relative z-10 max-w-[1400px] mx-auto p-6 lg:p-8 pt-6 lg:pt-10 flex flex-col">
        
        {/* New Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700 gap-6 md:gap-0">
            <div className="flex items-center gap-3">
                {/* New Metallic Winged Logo */}
                <div className="w-12 h-12 md:w-14 md:h-14 relative group cursor-default">
                    <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <XpertLogo className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg md:text-xl font-black text-white tracking-tighter leading-none">XpertStudio</h1>
                    <span className="text-[8px] font-bold text-purple-400 uppercase tracking-[0.3em] mt-1">Creative Suite</span>
                </div>
            </div>
            
            {/* Settings Button */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => { sounds.playClick(); onOpenSettings(); }}
                    onMouseEnter={() => sounds.playHover()}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white shadow-xl backdrop-blur-md hover:bg-white/10 hover:border-purple-500/50 transition-all active:scale-95 group"
                >
                    <Settings size={14} className="text-purple-400 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="uppercase tracking-widest">System Settings</span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-white/10 text-[8px] opacity-40">,</span>
                </button>
            </div>
        </header>

        {/* Updated Hero Section & Grid */}
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                
                {/* Main Hero Card - Redesigned for Split Layout Feel */}
                <div 
                    className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-2 bg-gradient-to-br from-[#0f0f12]/90 to-[#050505]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group transition-all duration-700 hover:border-purple-500/40 min-h-[400px] shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-default"
                    onMouseEnter={() => sounds.playHover()}
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
                        <div 
                            className="absolute -top-20 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse"
                            style={{ transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)` }}
                        ></div>
                        <div 
                            className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px]"
                            style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
                        ></div>
                    </div>

                    <div className="relative z-20 flex flex-col h-full">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md">
                                <Zap size={12} fill="currentColor" className="animate-pulse"/> v3.0 Professional Edition
                            </div>
                            <h2 className="text-5xl md:text-7xl xl:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9] uppercase">
                                Design <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 animate-gradient-xy">Mastery.</span>
                            </h2>
                        </div>
                        
                        <div className="mt-auto max-w-lg">
                            <p className="text-slate-400 text-lg leading-relaxed font-medium mb-8 border-l-2 border-purple-500/50 pl-6">
                                XpertStudio is the ultimate creative engine. Generate high-fidelity environments, manipulate 3D perspectives, and animate static assets with state-of-the-art AI.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => onNavigate('generator')}
                                    className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-tighter text-sm hover:bg-purple-400 transition-all active:scale-95"
                                >
                                    Start Creating
                                </button>
                                <button 
                                    onClick={() => onNavigate('history')}
                                    className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-tighter text-sm hover:bg-white/10 transition-all active:scale-95 backdrop-blur-md"
                                >
                                    View Gallery
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Floating Visual Element - Subtle Grid Pattern */}
                    <div className="absolute bottom-0 right-0 w-1/2 h-full opacity-20 pointer-events-none hidden lg:block">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] transform rotate-12 scale-150"></div>
                    </div>
                </div>

                <SortableContext 
                    items={cards}
                    strategy={rectSortingStrategy}
                >
                    {cards.map((card) => (
                        <SortableNavCard 
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            subtitle={card.subtitle}
                            icon={card.icon}
                            color={card.color}
                            shortcut={card.shortcut}
                            hideOnMobile={card.hideOnMobile}
                            onClick={() => onNavigate(card.id as any)}
                        />
                    ))}
                </SortableContext>
            </div>
        </DndContext>

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

const SortableNavCard = (props: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <NavCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
        </div>
    );
};

const NavCard = ({ title, subtitle, icon: Icon, color, onClick, hideOnMobile, shortcut, dragHandleProps }: any) => {
    const styles: Record<string, { iconBg: string, border: string, gradient: string, glow: string }> = {
        purple: { iconBg: "text-purple-400", border: "hover:border-purple-500/50", gradient: "from-purple-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(168,85,247,0.15)]" },
        blue: { iconBg: "text-blue-400", border: "hover:border-blue-500/50", gradient: "from-blue-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]" },
        pink: { iconBg: "text-pink-400", border: "hover:border-pink-500/50", gradient: "from-pink-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(236,72,153,0.15)]" },
        green: { iconBg: "text-green-400", border: "hover:border-green-500/50", gradient: "from-green-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(34,197,94,0.15)]" },
        rose: { iconBg: "text-rose-400", border: "hover:border-rose-500/50", gradient: "from-rose-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(244,63,94,0.15)]" },
        orange: { iconBg: "text-orange-400", border: "hover:border-orange-500/50", gradient: "from-orange-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(249,115,22,0.15)]" },
        cyan: { iconBg: "text-cyan-400", border: "hover:border-cyan-500/50", gradient: "from-cyan-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(34,211,238,0.15)]" },
        yellow: { iconBg: "text-yellow-400", border: "hover:border-yellow-500/50", gradient: "from-yellow-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(234,179,8,0.15)]" },
        teal: { iconBg: "text-teal-400", border: "hover:border-teal-500/50", gradient: "from-teal-500/10", glow: "group-hover:shadow-[0_0_50px_rgba(20,184,166,0.15)]" }
    };
    
    const s = styles[color] || styles.purple;

    return (
        <div 
            onClick={() => { sounds.playClick(); onClick(); }}
            onMouseEnter={() => sounds.playHover()}
            className={`col-span-1 min-h-[220px] bg-[#0a0a0c]/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 cursor-pointer transition-all duration-500 group flex flex-col items-start justify-between relative overflow-hidden transform hover:-translate-y-2 ${s.border} ${s.glow} ${hideOnMobile ? 'hidden md:flex' : 'flex'}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
            
            {/* Drag Handle */}
            <div 
                {...dragHandleProps}
                className="absolute top-6 left-6 p-2 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-30"
            >
                <GripVertical size={16} />
            </div>

            {/* Shortcut Tooltip */}
            {shortcut && (
                <div className="absolute top-6 right-6 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 opacity-40 group-hover:opacity-100 transition-opacity z-30">
                    {shortcut}
                </div>
            )}

            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${s.iconBg} relative z-20`}>
                <Icon size={28} strokeWidth={2}/>
            </div>
            
            <div className="relative z-20 w-full">
                <h3 className="text-2xl font-black text-white mb-1 tracking-tighter group-hover:text-purple-400 transition-colors uppercase">{title}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{subtitle}</p>
            </div>

            {/* Subtle Arrow on Hover */}
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                <Zap size={16} className="text-purple-500" fill="currentColor" />
            </div>
        </div>
    );
};
