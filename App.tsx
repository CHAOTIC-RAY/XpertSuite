import React, { useState, useEffect } from 'react';
import { Settings, X, Wand2, Compass, Maximize2, BoxSelect, Palette, FileCode, ClipboardCheck, History as HistoryIcon } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { SceneGenerator } from './components/tabs/SceneGenerator';
import { AngleStudio } from './components/tabs/AngleStudio';
import { Upscale } from './components/tabs/Upscale';
import { MagicEditor } from './components/tabs/MagicEditor';
import { StyleTransfer } from './components/tabs/StyleTransfer';
import { SvgConverter } from './components/tabs/SvgConverter';
import { DesignAudit } from './components/tabs/DesignAudit';
import { History } from './components/tabs/History';
import { GeneratedImage } from './types';
import { compressAndResizeImage } from './services/geminiService';

const STORAGE_KEY = 'chaoticx_suite_v3';

// Settings Modal
const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [apiKey, setApiKey] = useState('');
    useEffect(() => { const stored = localStorage.getItem('chaoticx_api_key'); if (stored) setApiKey(stored); }, []);
    const handleSave = () => { if (apiKey.trim()) localStorage.setItem('chaoticx_api_key', apiKey.trim()); else localStorage.removeItem('chaoticx_api_key'); onClose(); window.location.reload(); };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in p-4">
            <div className="glass-panel rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                <h2 className="text-xl font-bold text-white mb-6">System Settings</h2>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter Google Gemini API Key..." className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-purple-500 outline-none mb-2" />
                <div className="flex justify-end gap-3 mt-4"><button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">CANCEL</button><button onClick={handleSave} className="px-6 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-slate-200">SAVE</button></div>
            </div>
        </div>
    );
};

const SidebarButton = ({ active, icon: Icon, label, onClick }: any) => (
    <button onClick={onClick} className={`relative group flex flex-col md:flex-row items-center justify-center w-full md:w-12 h-full md:h-12 md:rounded-xl transition-all ${active ? 'text-purple-400 md:bg-white md:text-black md:shadow-[0_0_15px_rgba(255,255,255,0.2)] md:scale-110' : 'text-slate-500 hover:text-white md:hover:bg-white/10'}`}>
        <Icon size={20} className="mb-1 md:mb-0" />
        <span className="text-[10px] font-bold uppercase md:hidden">{label}</span>
        <span className="hidden md:block absolute left-14 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-wider z-50 border border-white/10">{label}</span>
    </button>
);

const MobileNavButton = ({ active, icon: Icon, label, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${active ? 'text-purple-400' : 'text-slate-500'}`}>
        <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'landing' | 'generator' | 'editor' | 'history' | 'angle_studio' | 'upscale' | 'svg_converter' | 'style_transfer' | 'audit'>('landing');
  const [showSettings, setShowSettings] = useState(false);
  
  // Data State - Lifted up to persist across tab changes
  const [genInputs, setGenInputs] = useState<string[]>([]);
  const [angleInputs, setAngleInputs] = useState<string[]>([]);
  const [upscaleInputs, setUpscaleInputs] = useState<string[]>([]);
  const [editInputs, setEditInputs] = useState<string[]>([]);
  const [styleInputs, setStyleInputs] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // Persistence
  useEffect(() => { const c = localStorage.getItem(STORAGE_KEY); if (c) { try { const d = JSON.parse(c); setGenInputs(d.gen||[]); setAngleInputs(d.ang||[]); setUpscaleInputs(d.up||[]); setEditInputs(d.edit||[]); setStyleInputs(d.style||[]); setGeneratedImages(d.genImg||[]); } catch(e){} } }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ gen: genInputs, ang: angleInputs, up: upscaleInputs, edit: editInputs, style: styleInputs, genImg: generatedImages })); } catch (e) {} }, [genInputs, angleInputs, upscaleInputs, editInputs, styleInputs, generatedImages]);

  const handleGenerate = (img: GeneratedImage) => {
      setGeneratedImages(prev => [img, ...prev]);
  };

  const handleTransfer = (url: string, target: any) => {
      setActivePage(target);
      if (target === 'generator') setGenInputs(p => [url, ...p]);
      if (target === 'angle_studio') setAngleInputs(p => [url, ...p]);
      if (target === 'upscale') setUpscaleInputs(p => [url, ...p]);
      if (target === 'style_transfer') setStyleInputs(p => [url, ...p]);
      if (target === 'editor') setEditInputs(p => [url, ...p]);
  };

  // Shared clearing logic
  const handleClearImage = (index: number) => {
     if (activePage === 'generator') setGenInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'angle_studio') setAngleInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'upscale') setUpscaleInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'style_transfer') setStyleInputs(p => p.filter((_, i) => i !== index));
     if (activePage === 'editor') setEditInputs(p => p.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
      if (activePage === 'generator') setGenInputs([]);
      if (activePage === 'angle_studio') setAngleInputs([]);
      if (activePage === 'upscale') setUpscaleInputs([]);
      if (activePage === 'style_transfer') setStyleInputs([]);
      if (activePage === 'editor') setEditInputs([]);
  };

  return (
    <div className="fixed inset-0 bg-[#020202] text-slate-200 font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col md:flex-row">
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {activePage !== 'landing' && (
          <div className="hidden md:flex w-20 h-full border-r border-white/5 bg-[#050505] flex-col items-center py-6 z-50 shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black mb-8 cursor-pointer hover:scale-105 transition-transform shadow-lg" onClick={() => setActivePage('landing')}>CX</div>
              <div className="flex flex-col gap-6">
                  <SidebarButton active={activePage === 'generator'} icon={Wand2} label="Scene Gen" onClick={() => setActivePage('generator')} />
                  <SidebarButton active={activePage === 'angle_studio'} icon={Compass} label="Angle Studio" onClick={() => setActivePage('angle_studio')} />
                  <SidebarButton active={activePage === 'upscale'} icon={Maximize2} label="GigaXpert" onClick={() => setActivePage('upscale')} />
                  <SidebarButton active={activePage === 'editor'} icon={BoxSelect} label="Magic Edit" onClick={() => setActivePage('editor')} />
                  <SidebarButton active={activePage === 'style_transfer'} icon={Palette} label="Style Transfer" onClick={() => setActivePage('style_transfer')} />
                  <SidebarButton active={activePage === 'svg_converter'} icon={FileCode} label="Vectorize" onClick={() => setActivePage('svg_converter')} />
                  <SidebarButton active={activePage === 'audit'} icon={ClipboardCheck} label="Design Audit" onClick={() => setActivePage('audit')} />
                  <SidebarButton active={activePage === 'history'} icon={HistoryIcon} label="History" onClick={() => setActivePage('history')} />
              </div>
              <div className="mt-auto flex flex-col gap-4"><SidebarButton active={showSettings} icon={Settings} label="Settings" onClick={() => setShowSettings(true)} /></div>
          </div>
      )}

      {/* Mobile Bottom Nav */}
      {activePage !== 'landing' && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-[#020202] border-t border-white/10 z-[100] grid grid-cols-6 pb-2 pt-1 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
               <MobileNavButton active={activePage === 'generator'} icon={Wand2} label="Scene" onClick={() => setActivePage('generator')} />
               <MobileNavButton active={activePage === 'angle_studio'} icon={Compass} label="Angle" onClick={() => setActivePage('angle_studio')} />
               <MobileNavButton active={activePage === 'upscale'} icon={Maximize2} label="Upscale" onClick={() => setActivePage('upscale')} />
               <MobileNavButton active={activePage === 'editor'} icon={BoxSelect} label="Edit" onClick={() => setActivePage('editor')} />
               <MobileNavButton active={activePage === 'style_transfer'} icon={Palette} label="Style" onClick={() => setActivePage('style_transfer')} />
               <MobileNavButton active={activePage === 'audit'} icon={ClipboardCheck} label="Audit" onClick={() => setActivePage('audit')} />
          </div>
      )}

      <div className="flex-1 relative bg-black overflow-hidden flex flex-col mb-[70px] md:mb-0">
          {activePage === 'landing' && <LandingPage onNavigate={setActivePage} />}
          {activePage === 'generator' && <SceneGenerator inputs={genInputs} setInputs={setGenInputs} onGenerate={handleGenerate} onTransfer={handleTransfer} handleClearImage={handleClearImage} handleClearAll={handleClearAll} />}
          {activePage === 'angle_studio' && <AngleStudio inputs={angleInputs} setInputs={setAngleInputs} onGenerate={handleGenerate} onTransfer={handleTransfer} />}
          {activePage === 'upscale' && <Upscale inputs={upscaleInputs} setInputs={setUpscaleInputs} onGenerate={handleGenerate} generatedImages={generatedImages} />}
          {activePage === 'editor' && <MagicEditor inputs={editInputs} setInputs={setEditInputs} onGenerate={handleGenerate} />}
          {activePage === 'style_transfer' && <StyleTransfer inputs={styleInputs} setInputs={setStyleInputs} onGenerate={handleGenerate} generatedImages={generatedImages} />}
          {activePage === 'svg_converter' && <SvgConverter />}
          {activePage === 'audit' && <DesignAudit />}
          {activePage === 'history' && <History images={generatedImages} onClear={() => { setGeneratedImages([]); localStorage.removeItem(STORAGE_KEY); }} />}
      </div>
    </div>
  );
};