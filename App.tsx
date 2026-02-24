import React, { useState, useEffect } from 'react';
import { Settings, X, Wand2, Compass, Maximize2, BoxSelect, Palette, FileCode, ClipboardCheck, History as HistoryIcon, Images, Film, Home, FileText } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { SceneGenerator } from './components/tabs/SceneGenerator';
import { AngleStudio } from './components/tabs/AngleStudio';
import { Upscale } from './components/tabs/Upscale';
import { MagicEditor } from './components/tabs/MagicEditor';
import { StyleTransfer } from './components/tabs/StyleTransfer';
import { SvgConverter } from './components/tabs/SvgConverter';
import { DesignAudit } from './components/tabs/DesignAudit';
import { VideoInterpolator } from './components/tabs/VideoInterpolator';
import { PdfIntelligence } from './components/tabs/PdfIntelligence';
import { History } from './components/tabs/History';
import { GeneratedImage, PdfDocument, ChatMessage } from './types';
import { sounds } from './services/soundService';

const STORAGE_KEY = 'chaoticx_suite_v3';

// Metallic Logo for Sidebar
const XpertLogoSmall = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 457 425" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            fillRule="evenodd" 
            fill="white"
            d="M85.213,85.361 C85.213,85.361 109.675,85.260 121.215,85.468 C122.989,85.500 126.441,87.821 126.441,87.821 L145.148,100.591 L129.680,115.236 L85.213,85.361 ZM420.305,190.070 C405.770,181.469 391.638,173.105 376.531,164.166 C386.301,154.477 394.924,145.770 403.742,137.266 C406.778,134.338 408.654,131.313 408.630,126.890 C408.498,102.242 408.570,77.592 408.519,52.943 C408.516,51.673 408.022,50.405 407.670,48.725 C405.297,48.446 403.045,47.955 400.792,47.950 C376.136,47.894 351.480,47.999 326.825,47.839 C322.138,47.809 318.689,49.262 315.375,52.591 C271.422,96.731 227.359,140.760 183.339,184.834 C182.224,185.950 181.296,187.253 179.626,189.254 C184.310,192.155 188.444,194.835 192.689,197.325 C245.820,228.478 298.974,259.592 352.098,290.758 C356.111,293.112 360.217,295.441 363.797,298.371 C372.668,305.634 374.817,318.406 369.207,328.206 C363.555,338.079 352.954,342.174 341.730,338.411 C337.986,337.156 334.469,335.102 331.013,333.124 C314.866,323.886 298.776,314.547 282.010,304.866 C277.043,309.677 271.994,314.434 267.093,319.338 C234.127,352.325 201.171,385.322 168.282,418.385 C165.332,421.351 162.420,423.163 157.918,423.151 C107.274,423.005 56.629,423.076 5.984,423.058 C4.395,423.058 2.807,422.724 0.669,422.484 C0.461,419.134 0.124,416.229 0.122,413.323 C0.107,378.013 0.266,342.703 0.038,307.395 C-0.000,301.568 1.858,297.517 5.927,293.485 C35.263,264.413 64.400,235.142 93.584,205.917 C95.911,203.587 98.112,201.131 101.324,197.724 C67.150,177.233 33.613,157.124 0.528,137.285 C0.528,91.276 0.528,46.393 0.528,0.853 C3.886,0.627 6.811,0.261 9.736,0.257 C57.049,0.191 104.362,0.259 151.674,0.028 C157.472,-0.001 161.786,1.624 165.778,5.766 C177.773,18.211 190.027,30.407 203.103,43.634 C191.827,54.974 180.918,65.945 169.055,77.875 C161.693,70.530 154.266,63.975 147.901,56.514 C142.189,49.818 135.785,47.556 127.087,47.768 C104.777,48.312 82.444,47.934 60.120,47.925 C56.533,47.924 52.945,47.925 48.874,47.925 C48.494,50.887 48.049,52.771 48.042,54.657 C47.979,70.646 48.119,86.637 47.912,102.624 C47.850,107.401 49.109,110.664 53.467,113.251 C80.658,129.394 107.710,145.771 135.483,162.476 C137.792,160.530 140.159,158.810 142.206,156.769 C177.352,121.719 212.451,86.622 247.577,51.552 C262.899,36.254 278.384,21.118 293.513,5.633 C297.356,1.700 301.376,0.166 306.728,0.176 C353.708,0.259 400.688,0.163 447.667,0.170 C450.262,0.170 452.857,0.609 455.878,0.882 C456.089,3.971 456.419,6.574 456.421,9.177 C456.463,54.480 456.355,99.783 456.600,145.085 C456.635,151.623 454.742,156.201 449.865,160.674 C439.836,169.874 430.507,179.836 420.305,190.070 ZM143.087,225.648 C112.412,256.167 81.710,286.659 51.196,317.338 C49.357,319.186 48.176,322.509 48.123,325.174 C47.826,340.154 47.934,355.143 48.015,370.128 C48.023,371.648 48.775,373.164 49.297,375.114 C79.301,375.114 108.917,375.187 138.531,374.973 C140.840,374.956 143.650,373.454 145.360,371.765 C174.739,342.743 203.991,313.592 233.222,284.419 C234.505,283.139 235.313,281.384 237.040,278.811 C205.677,260.486 175.041,242.587 145.042,225.059 C143.696,225.452 143.289,225.447 143.087,225.648 ZM133.443,332.621 C129.710,336.465 125.928,338.558 120.403,338.356 C111.112,338.016 92.491,338.371 92.491,338.371 L83.041,338.033 C83.041,338.033 128.274,292.841 150.005,270.612 C159.536,276.276 168.562,281.641 178.467,287.528 C174.204,291.851 170.787,295.372 167.310,298.833 C156.008,310.084 144.553,321.184 133.443,332.621 ZM318.594,368.556 C331.249,375.306 344.685,377.813 359.109,376.182 C384.690,373.291 411.034,347.711 408.891,314.647 C407.487,293.001 398.539,275.481 379.492,264.279 C344.779,243.865 309.842,223.831 275.028,203.588 C263.253,196.741 251.567,189.741 239.285,182.483 C240.521,180.413 241.186,178.552 242.449,177.293 C271.693,148.136 300.961,119.001 330.385,90.026 C332.576,87.869 335.923,85.793 338.830,85.649 C349.396,85.127 360.004,85.443 371.816,85.443 C371.816,95.455 372.295,104.698 371.553,113.841 C371.299,116.975 368.445,120.310 366.003,122.788 C351.513,137.494 336.788,151.968 322.163,166.542 C320.563,168.136 319.098,169.865 316.981,172.174 C323.454,176.137 329.268,179.869 335.243,183.322 C358.009,196.478 380.868,209.475 403.618,222.659 C436.437,241.679 453.414,270.719 456.535,308.035 C459.000,337.516 451.371,364.425 432.179,387.063 C408.345,415.176 377.326,427.000 340.651,424.060 C324.446,422.761 309.424,417.559 295.314,409.697 C281.705,402.114 268.234,394.282 253.973,386.143 C266.268,373.736 277.238,362.666 288.265,351.539 C298.432,357.263 308.401,363.119 318.594,368.556 Z"
        />
    </svg>
);

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [apiKey, setApiKey] = useState('');
    useEffect(() => { const stored = localStorage.getItem('chaoticx_api_key'); if (stored) setApiKey(stored); }, []);
    const handleSave = () => { if (apiKey.trim()) localStorage.setItem('chaoticx_api_key', apiKey.trim()); else localStorage.removeItem('chaoticx_api_key'); onClose(); window.location.reload(); };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in p-4">
            <div className="glass-panel rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h2 className="text-xl font-bold text-white mb-6">System Settings</h2>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter Google Gemini API Key..." className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-purple-500 outline-none mb-2" />
                <div className="flex justify-end gap-3 mt-4"><button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">CANCEL</button><button onClick={handleSave} className="px-6 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-slate-200">SAVE</button></div>
            </div>
        </div>
    );
};

const SidebarButton = ({ active, icon: Icon, label, onClick }: any) => (
    <button 
        onClick={() => { sounds.playClick(); onClick(); }} 
        onMouseEnter={() => sounds.playHover()}
        className={`relative group flex flex-col md:flex-row items-center justify-center w-full md:w-12 h-full md:h-12 md:rounded-xl transition-all duration-300 ease-out-quint ${active ? 'text-purple-400 md:bg-white md:text-black md:shadow-[0_0_15px_rgba(255,255,255,0.2)] md:scale-110' : 'text-slate-500 hover:text-white md:hover:bg-white/10'}`}
    >
        <Icon size={20} className="mb-1 md:mb-0" />
        <span className="text-[10px] font-bold uppercase md:hidden">{label}</span>
        <span className="hidden md:block absolute left-14 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-wider z-50 border border-white/10 shadow-xl translate-x-2 group-hover:translate-x-0 transition-transform duration-200">{label}</span>
    </button>
);

const MobileNavButton = ({ active, icon: Icon, label, onClick }: any) => (
    <button 
        onClick={() => { sounds.playClick(); onClick(); }} 
        className={`flex flex-col items-center justify-center min-w-[64px] w-full h-full gap-1 transition-all duration-300 ease-out-quint ${active ? 'text-purple-400 -translate-y-1' : 'text-slate-500'}`}
    >
        <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);

const PageTransition = ({ children, transitionKey, isScrollable }: { children?: React.ReactNode, transitionKey: string, isScrollable?: boolean }) => (
    <div 
        key={transitionKey}
        className={`absolute inset-0 w-full h-full animate-in fade-in zoom-in-[0.99] slide-in-from-bottom-4 duration-500 ease-out-quint ${isScrollable ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`} 
    >
        {children}
    </div>
);

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'landing' | 'generator' | 'editor' | 'history' | 'angle_studio' | 'upscale' | 'svg_converter' | 'style_transfer' | 'audit' | 'video' | 'pdf'>('landing');
  const [showSettings, setShowSettings] = useState(false);
  
  const [genInputs, setGenInputs] = useState<string[]>([]);
  const [angleInputs, setAngleInputs] = useState<string[]>([]);
  const [upscaleInputs, setUpscaleInputs] = useState<string[]>([]);
  const [editInputs, setEditInputs] = useState<string[]>([]);
  const [styleInputs, setStyleInputs] = useState<string[]>([]);
  const [videoInputs, setVideoInputs] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  
  // PDF State (Lifted for persistence during session, not saved to localStorage due to File object)
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocument[]>([]);
  const [pdfChatHistory, setPdfChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => { const c = localStorage.getItem(STORAGE_KEY); if (c) { try { const d = JSON.parse(c); setGenInputs(d.gen||[]); setAngleInputs(d.ang||[]); setUpscaleInputs(d.up||[]); setEditInputs(d.edit||[]); setStyleInputs(d.style||[]); setVideoInputs(d.video||[]); setGeneratedImages(d.genImg||[]); } catch(e){} } }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ gen: genInputs, ang: angleInputs, up: upscaleInputs, edit: editInputs, style: styleInputs, video: videoInputs, genImg: generatedImages })); } catch (e) {} }, [genInputs, angleInputs, upscaleInputs, editInputs, styleInputs, videoInputs, generatedImages]);

  const handleGenerate = (img: GeneratedImage) => setGeneratedImages(prev => [img, ...prev]);
  const handleDeleteImages = (ids: string[]) => setGeneratedImages(prev => prev.filter(img => !ids.includes(img.id)));

  const handleTransfer = (url: string, target: any) => {
      setActivePage(target);
      if (target === 'generator') setGenInputs(p => [url, ...p]);
      if (target === 'angle_studio') setAngleInputs(p => [url, ...p]);
      if (target === 'upscale') setUpscaleInputs(p => [url, ...p]);
      if (target === 'style_transfer') setStyleInputs(p => [url, ...p]);
      if (target === 'editor') setEditInputs(p => [url, ...p]);
      if (target === 'video') setVideoInputs(p => [url, ...p]);
  };

  const handleClearImage = (index: number) => {
     if (activePage === 'generator') setGenInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'angle_studio') setAngleInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'upscale') setUpscaleInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'style_transfer') setStyleInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'editor') setEditInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'video') setVideoInputs(p => p.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
      if (activePage === 'generator') setGenInputs([]);
      if (activePage === 'angle_studio') setAngleInputs([]);
      if (activePage === 'upscale') setUpscaleInputs([]);
      if (activePage === 'style_transfer') setStyleInputs([]);
      if (activePage === 'editor') setEditInputs([]);
      if (activePage === 'video') setVideoInputs([]);
  };

  return (
    <div className="fixed inset-0 bg-[#020202] text-slate-200 font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col md:flex-row">
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {activePage !== 'landing' && (
          <div className="hidden md:flex w-20 h-full border-r border-white/5 bg-[#050505] flex-col items-center py-6 z-50 shrink-0 animate-in slide-in-from-left-4 duration-500">
              <div 
                className="w-12 h-12 flex items-center justify-center mb-8 cursor-pointer hover:scale-105 transition-transform" 
                onClick={() => { sounds.playClick(); setActivePage('landing'); }}
              >
                  <XpertLogoSmall className="w-full h-full drop-shadow-lg" />
              </div>
              <div className="flex flex-col gap-6">
                  <SidebarButton active={activePage === 'generator'} icon={Wand2} label="Scene Gen" onClick={() => setActivePage('generator')} />
                  <SidebarButton active={activePage === 'angle_studio'} icon={Compass} label="Angle Studio" onClick={() => setActivePage('angle_studio')} />
                  <SidebarButton active={activePage === 'video'} icon={Film} label="Motion Studio" onClick={() => setActivePage('video')} />
                  <SidebarButton active={activePage === 'upscale'} icon={Maximize2} label="GigaXpert" onClick={() => setActivePage('upscale')} />
                  <SidebarButton active={activePage === 'editor'} icon={BoxSelect} label="Magic Edit" onClick={() => setActivePage('editor')} />
                  <SidebarButton active={activePage === 'style_transfer'} icon={Palette} label="Style Transfer" onClick={() => setActivePage('style_transfer')} />
                  <SidebarButton active={activePage === 'svg_converter'} icon={FileCode} label="Vectorize" onClick={() => setActivePage('svg_converter')} />
                  <SidebarButton active={activePage === 'audit'} icon={ClipboardCheck} label="Design Audit" onClick={() => setActivePage('audit')} />
                  <SidebarButton active={activePage === 'pdf'} icon={FileText} label="PDF Intel" onClick={() => setActivePage('pdf')} />
                  <SidebarButton active={activePage === 'history'} icon={Images} label="Gallery" onClick={() => setActivePage('history')} />
              </div>
              <div className="mt-auto flex flex-col gap-4"><SidebarButton active={showSettings} icon={Settings} label="Settings" onClick={() => setShowSettings(true)} /></div>
          </div>
      )}

      {activePage !== 'landing' && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-[#020202] border-t border-white/10 z-[100] flex items-center justify-between px-2 pb-2 pt-1 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] overflow-x-auto no-scrollbar gap-1">
               <MobileNavButton active={activePage === 'landing'} icon={Home} label="Home" onClick={() => setActivePage('landing')} />
               <MobileNavButton active={activePage === 'generator'} icon={Wand2} label="Scene" onClick={() => setActivePage('generator')} />
               <MobileNavButton active={activePage === 'angle_studio'} icon={Compass} label="Angle" onClick={() => setActivePage('angle_studio')} />
               <MobileNavButton active={activePage === 'video'} icon={Film} label="Video" onClick={() => setActivePage('video')} />
               <MobileNavButton active={activePage === 'editor'} icon={BoxSelect} label="Edit" onClick={() => setActivePage('editor')} />
               <MobileNavButton active={activePage === 'pdf'} icon={FileText} label="PDF" onClick={() => setActivePage('pdf')} />
               <MobileNavButton active={activePage === 'history'} icon={Images} label="Gallery" onClick={() => setActivePage('history')} />
          </div>
      )}

      <div className={`flex-1 relative bg-black flex flex-col ${activePage !== 'landing' ? 'mb-[70px] md:mb-0 overflow-hidden' : 'overflow-y-auto'}`}>
          <PageTransition transitionKey={activePage} isScrollable={activePage === 'landing'}>
            {activePage === 'landing' && <LandingPage onNavigate={(p) => { sounds.playClick(); setActivePage(p); }} />}
            {activePage === 'generator' && <SceneGenerator inputs={genInputs} setInputs={setGenInputs} onGenerate={handleGenerate} onTransfer={handleTransfer} handleClearImage={handleClearImage} handleClearAll={handleClearAll} generatedImages={generatedImages} onDeleteImages={handleDeleteImages} />}
            {activePage === 'angle_studio' && <AngleStudio inputs={angleInputs} setInputs={setAngleInputs} onGenerate={handleGenerate} onTransfer={handleTransfer} />}
            {activePage === 'video' && <VideoInterpolator inputs={videoInputs} setInputs={setVideoInputs} onGenerate={handleGenerate} />}
            {activePage === 'upscale' && <Upscale inputs={upscaleInputs} setInputs={setUpscaleInputs} onGenerate={handleGenerate} generatedImages={generatedImages} />}
            {activePage === 'editor' && <MagicEditor inputs={editInputs} setInputs={setEditInputs} onGenerate={handleGenerate} />}
            {activePage === 'style_transfer' && <StyleTransfer inputs={styleInputs} setInputs={setStyleInputs} onGenerate={handleGenerate} generatedImages={generatedImages} />}
            {activePage === 'svg_converter' && <SvgConverter />}
            {activePage === 'audit' && <DesignAudit />}
            {activePage === 'pdf' && <PdfIntelligence documents={pdfDocuments} setDocuments={setPdfDocuments} chatHistory={pdfChatHistory} setChatHistory={setPdfChatHistory} onGenerate={handleGenerate} />}
            {activePage === 'history' && <History images={generatedImages} onClear={() => { setGeneratedImages([]); localStorage.removeItem(STORAGE_KEY); }} />}
          </PageTransition>
      </div>
    </div>
  );
};