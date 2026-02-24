import React, { useState, useRef, useEffect } from 'react';
import { FileText, Plus, X, Send, Bot, User, Trash2, FileSearch, Sparkles, MessageSquare, Files, ArrowUp, ScanEye, ChevronLeft, ChevronRight, Crop, Maximize2, Download, Zap, Link, Menu, Layout, Layers, Eye } from 'lucide-react';
import { PdfDocument, ChatMessage, GeneratedImage } from '../../types';
import { extractTextFromPdf, chatWithDocuments } from '../../services/pdfService';
import { generateUpscale } from '../../services/upscaleService';
import { sounds } from '../../services/soundService';

interface PdfIntelligenceProps {
    documents: PdfDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<PdfDocument[]>>;
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    onGenerate: (img: GeneratedImage) => void;
}

export const PdfIntelligence: React.FC<PdfIntelligenceProps> = ({ documents, setDocuments, chatHistory, setChatHistory, onGenerate }) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [useVisualAnalysis, setUseVisualAnalysis] = useState(false);
    
    // View State
    const [mode, setMode] = useState<'chat' | 'inspector'>('chat');
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    
    // Inspector State
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.5);
    
    // Selection state in CSS Coordinates relative to the displayed canvas
    const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionStart = useRef<{x: number, y: number} | null>(null);

    const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
    const [isUpscaling, setIsUpscaling] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Ref to store the active PDF render task so we can cancel it
    const renderTaskRef = useRef<any>(null);

    // Ensure selectedDocId is valid
    useEffect(() => {
        if (!selectedDocId && documents.length > 0) setSelectedDocId(documents[0].id);
    }, [documents, selectedDocId]);

    // Reset page to 1 when switching documents
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDocId]);

    const activeDoc = documents.find(d => d.id === selectedDocId) || documents[0];

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, mode]);

    // PDF Rendering Logic
    useEffect(() => {
        let isMounted = true;

        const performRender = async () => {
            if (mode === 'inspector' && activeDoc && canvasRef.current) {
                try {
                    await renderPdfPage();
                } catch (e) {
                    console.debug("Render execution interrupted", e);
                }
            }
        };

        performRender();
        
        // Cleanup function to cancel render if component unmounts or deps change
        return () => {
            isMounted = false;
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
        };
    }, [mode, activeDoc, currentPage, scale]);

    const scrollToBottom = () => {
        if (mode === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const renderPdfPage = async () => {
        if (!activeDoc || !canvasRef.current) return;
        
        // 1. Cancel any existing render task to free the canvas immediately
        if (renderTaskRef.current) {
            try {
                await renderTaskRef.current.cancel();
            } catch (e) {
                // Ignore cancellation errors
            }
            renderTaskRef.current = null;
        }
        
        try {
            const arrayBuffer = await activeDoc.originalFile.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
            
            // Validate page request
            if (currentPage < 1 || currentPage > pdf.numPages) {
                return;
            }

            const page = await pdf.getPage(currentPage);
            
            // 2. CRITICAL: Check AGAIN if a new render task was started (by another effect) while we were awaiting 'getPage'
            if (renderTaskRef.current) {
                 try {
                     await renderTaskRef.current.cancel();
                 } catch(e) {}
            }

            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (context) {
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;
                
                await renderTask.promise;
                
                // Only clear if this specific task finished successfully and wasn't replaced
                if (renderTaskRef.current === renderTask) {
                    renderTaskRef.current = null;
                }
            }
        } catch (e: any) {
            if (e?.name !== 'RenderingCancelledException') {
                console.error("Render error:", e);
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const newDocs: PdfDocument[] = [];
            
            try {
                for (let i = 0; i < e.target.files.length; i++) {
                    const file = e.target.files[i];
                    if (file.type === 'application/pdf') {
                        const doc = await extractTextFromPdf(file);
                        newDocs.push(doc);
                    }
                }
                setDocuments(prev => [...prev, ...newDocs]);
                if (!selectedDocId && newDocs.length > 0) setSelectedDocId(newDocs[0].id);
                
                if (documents.length === 0 && newDocs.length > 0) {
                    setChatHistory([{
                        role: 'model',
                        text: `I've analyzed ${newDocs.length} document(s). You can ask me to summarize them, or switch to 'Visual Inspector' to select and upscale specific diagrams or images.`
                    }]);
                }
            } catch (err) {
                console.error(err);
                alert("Error reading PDF.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleRemoveDoc = (id: string) => {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (selectedDocId === id) setSelectedDocId(documents.find(d => d.id !== id)?.id || null);
    };

    const handleSend = async () => {
        if (!input.trim() || documents.length === 0) return;
        const userMsg = input;
        setInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsProcessing(true);
        sounds.playClick();

        try {
            // Pass the visualAnalysis flag
            const response = await chatWithDocuments(userMsg, documents, chatHistory, useVisualAnalysis);
            setChatHistory(prev => [...prev, { role: 'model', text: response }]);
            sounds.playSuccess();
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. If the document is large, try disabling Visual Analysis." }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Interaction Handlers (Pointer Events) ---
    const handlePointerDown = (e: React.PointerEvent) => {
        if (mode !== 'inspector') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        selectionStart.current = { x, y };
        setIsSelecting(true);
        setSelection(null);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSelecting || !selectionStart.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const startX = selectionStart.current.x;
        const startY = selectionStart.current.y;

        setSelection({
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            w: Math.abs(currentX - startX),
            h: Math.abs(currentY - startY)
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsSelecting(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (selection && (selection.w < 10 || selection.h < 10)) {
            setSelection(null);
        }
    };

    const handleUpscaleSelection = async () => {
        if (!selection || !canvasRef.current) return;
        setIsUpscaling(true);
        sounds.playStart();

        try {
            const rect = canvasRef.current.getBoundingClientRect();
            const ratioX = canvasRef.current.width / rect.width;
            const ratioY = canvasRef.current.height / rect.height;

            const cropX = selection.x * ratioX;
            const cropY = selection.y * ratioY;
            const cropW = selection.w * ratioX;
            const cropH = selection.h * ratioY;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = cropW;
            tempCanvas.height = cropH;
            const tCtx = tempCanvas.getContext('2d');
            
            if (tCtx) {
                tCtx.drawImage(
                    canvasRef.current, 
                    cropX, cropY, cropW, cropH, 
                    0, 0, cropW, cropH
                );
                const base64 = tempCanvas.toDataURL('image/jpeg');
                
                const result = await generateUpscale(base64, {
                    scaleFactor: '4x',
                    upscaleModel: 'High Fidelity',
                    upscaleCreativityLevel: 1, 
                    upscaleSharpen: 50,
                    upscaleDenoise: 30,
                    textRecovery: true 
                });
                
                setUpscaledImage(result.resultBase64);
                
                onGenerate({
                    id: Date.now().toString(),
                    originalUrl: base64, 
                    resultUrl: result.resultBase64,
                    prompt: `PDF Extract - Page ${currentPage}`,
                    type: 'pdf-analysis',
                    timestamp: Date.now()
                });

                sounds.playSuccess();
            }
        } catch (e) {
            console.error("Upscale failed", e);
            alert("Failed to upscale selection.");
        } finally {
            setIsUpscaling(false);
        }
    };

    // --- Message Parser for Clickable Citations ---
    const renderMessageContent = (text: string) => {
        const parts = text.split(/(\[\[?Page\s*:?\s*\d+\]?\])/gi);
        return parts.map((part, index) => {
            const match = part.match(/\[\[?Page\s*:?\s*(\d+)\]?\]/i);
            if (match) {
                const pageNum = parseInt(match[1]);
                return (
                    <button 
                        key={index}
                        onClick={() => {
                            setMode('inspector');
                            setCurrentPage(pageNum);
                        }}
                        className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-cyan-900/40 border border-cyan-500/40 rounded-full text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-black transition-all cursor-pointer align-baseline shadow-sm"
                        title={`Jump to Page ${pageNum}`}
                    >
                        <ScanEye size={10} /> Page {pageNum}
                    </button>
                );
            }
            return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />;
        });
    };

    return (
        <div className="absolute inset-0 flex flex-col lg:flex-row bg-[#020202] overflow-hidden">
            {/* Mobile Header / Toggle */}
            <div className="lg:hidden h-14 border-b border-white/5 bg-[#0a0a0c] flex items-center justify-between px-4 shrink-0 z-40">
                <button 
                    onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest"
                >
                    <Menu size={18}/>
                    {showMobileSidebar ? 'Close Files' : 'Files'}
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-cyan-900/20 text-cyan-400 px-2 py-0.5 rounded font-bold border border-cyan-500/20">{documents.length} Docs</span>
                </div>
            </div>

            {/* Sidebar / Document Deck (Responsive) */}
            <div className={`
                fixed inset-y-0 left-0 w-[280px] bg-[#0a0a0c] border-r border-white/5 flex flex-col z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0 lg:w-[300px] lg:h-full lg:z-auto
                ${showMobileSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className="p-5 border-b border-white/5 bg-[#0f0f11] flex justify-between items-center">
                    <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2"><Files size={16}/> Context Deck</h2>
                    <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden text-slate-500 hover:text-white"><X size={18}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {documents.map(doc => (
                        <div 
                            key={doc.id} 
                            onClick={() => { setSelectedDocId(doc.id); setShowMobileSidebar(false); }}
                            className={`rounded-xl p-3 flex gap-3 group border transition-all cursor-pointer ${selectedDocId === doc.id ? 'bg-[#151515] border-cyan-500 shadow-lg' : 'bg-[#151515] border-white/10 hover:border-white/30'}`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${selectedDocId === doc.id ? 'bg-cyan-600 text-white' : 'bg-cyan-900/20 text-cyan-400'}`}>
                                <FileText size={20}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs font-bold truncate ${selectedDocId === doc.id ? 'text-white' : 'text-slate-300'}`}>{doc.name}</h4>
                                <p className="text-[10px] text-slate-500 font-mono mt-1">{doc.pageCount} pages • {doc.fileSize}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleRemoveDoc(doc.id); }} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                        </div>
                    ))}

                    <div className="relative group border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center hover:border-cyan-500 hover:bg-cyan-900/10 transition-all cursor-pointer">
                        <input type="file" accept=".pdf" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        {isUploading ? (
                            <div className="flex flex-col items-center py-2"><div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2"></div><span className="text-[10px] font-bold text-cyan-500 uppercase">Processing...</span></div>
                        ) : (
                            <><div className="p-2 bg-white/5 rounded-full text-slate-400 group-hover:text-cyan-400 mb-2"><Plus size={20}/></div><span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:text-cyan-200">Add Documents</span></>
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop for Mobile Sidebar */}
            {showMobileSidebar && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)}></div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[#050505] relative h-full overflow-hidden">
                {/* View Toggles */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex bg-[#1a1a1a] rounded-full p-1 border border-white/10 shadow-2xl backdrop-blur-md">
                    <button 
                        onClick={() => setMode('chat')}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${mode === 'chat' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare size={14}/> Chat
                    </button>
                    <button 
                        onClick={() => setMode('inspector')}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${mode === 'inspector' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ScanEye size={14}/> Inspector
                    </button>
                </div>

                {/* --- CHAT MODE --- */}
                {mode === 'chat' && (
                    <div className="flex-1 flex flex-col h-full relative animate-in fade-in zoom-in-[0.99] duration-300">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 space-y-6 pt-20">
                            {chatHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 px-4 text-center">
                                    <FileSearch size={64} className="text-cyan-600 mb-6"/>
                                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">Document Intelligence</h3>
                                    <p className="text-sm text-slate-400 mt-2 max-w-md">Chat with documents or use the Visual Inspector to upscale embedded images.</p>
                                </div>
                            ) : (
                                chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'model' && <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-cyan-900/50"><Bot size={16} className="text-white"/></div>}
                                        <div className={`max-w-[90%] lg:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#1a1a1a] text-white border border-white/10' : 'bg-transparent text-slate-200 border border-cyan-900/30'}`}>
                                            {msg.role === 'model' ? <div>{renderMessageContent(msg.text)}</div> : msg.text}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isProcessing && <div className="flex gap-4"><div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0 mt-1 animate-pulse"><Bot size={16} className="text-white"/></div><div className="flex items-center gap-1 h-10"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-100"></div></div></div>}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 lg:p-6 bg-[#020202] border-t border-white/5">
                            <div className="max-w-4xl mx-auto relative bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl focus-within:border-cyan-500/50 transition-colors flex items-center">
                                <div className="pl-3">
                                    <button 
                                        onClick={() => setUseVisualAnalysis(!useVisualAnalysis)}
                                        className={`p-2 rounded-lg transition-all ${useVisualAnalysis ? 'bg-cyan-900/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                        title={useVisualAnalysis ? "Deep Visual Analysis: ON (Slower, sees images)" : "Deep Visual Analysis: OFF (Text only)"}
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>
                                <textarea 
                                    value={input} 
                                    onChange={(e) => setInput(e.target.value)} 
                                    onKeyDown={(e) => {if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();}}} 
                                    placeholder={documents.length > 0 ? "Ask about the documents..." : "Upload a PDF first..."} 
                                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 p-4 pr-14 resize-none h-14 max-h-32 custom-scrollbar" 
                                    disabled={documents.length===0}
                                />
                                <button onClick={handleSend} disabled={!input.trim() || isProcessing || documents.length===0} className="absolute right-2 bottom-2 p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl disabled:opacity-30 transition-all active:scale-95"><ArrowUp size={18}/></button>
                            </div>
                            <div className="text-center mt-2">
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${useVisualAnalysis ? 'text-cyan-500' : 'text-slate-600'}`}>
                                    {useVisualAnalysis ? "Deep Visual Analysis Active (Comparisons & Scanned Docs)" : "Fast Text Analysis Mode"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- INSPECTOR MODE --- */}
                {mode === 'inspector' && (
                    <div className="flex-1 flex flex-col h-full bg-[#080808] relative animate-in fade-in zoom-in-[0.99] duration-300">
                        {/* Visual Toolbar */}
                        {activeDoc ? (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-xl border border-white/10 shadow-2xl overflow-x-auto max-w-[90vw]">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft size={18}/></button>
                                <span className="text-xs font-bold font-mono text-white whitespace-nowrap px-2">Page {currentPage} / {activeDoc.pageCount}</span>
                                <button onClick={() => setCurrentPage(Math.min(activeDoc.pageCount, currentPage + 1))} disabled={currentPage === activeDoc.pageCount} className="p-2 text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight size={18}/></button>
                                <div className="w-px h-6 bg-white/10 mx-1"></div>
                                <button onClick={() => setScale(Math.max(0.5, scale - 0.25))} className="text-xs font-bold text-slate-400 px-2 hover:text-white">-</button>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(Math.min(3, scale + 0.25))} className="text-xs font-bold text-slate-400 px-2 hover:text-white">+</button>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none"><div className="flex flex-col items-center"><FileText size={48} className="mb-4"/><p className="text-sm font-bold uppercase">Select a Document</p></div></div>
                        )}

                        {/* Canvas Container */}
                        <div ref={containerRef} className="flex-1 overflow-auto flex items-center justify-center p-4 lg:p-8 relative bg-[#050505] custom-scrollbar touch-pan-x touch-pan-y">
                            <div className="relative shadow-2xl border border-white/10 bg-white">
                                <canvas ref={canvasRef} className="block select-none" />
                                
                                {/* Interactive Overlay for Selection */}
                                <div 
                                    className="absolute inset-0 cursor-crosshair touch-none"
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerLeave={handlePointerUp}
                                >
                                    {selection && (
                                        <div 
                                            className="absolute border-2 border-cyan-500 bg-cyan-500/10 z-10"
                                            style={{ 
                                                left: selection.x, 
                                                top: selection.y, 
                                                width: selection.w, 
                                                height: selection.h,
                                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' // Dim outside area
                                            }}
                                        >
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 animate-in zoom-in-95 duration-200 pointer-events-auto" onPointerDown={e => e.stopPropagation()}>
                                                <button 
                                                    onClick={handleUpscaleSelection}
                                                    className="bg-cyan-600 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 hover:bg-cyan-500 whitespace-nowrap"
                                                >
                                                    <Crop size={12}/> Upscale
                                                </button>
                                                <button 
                                                    onClick={() => setSelection(null)}
                                                    className="bg-black/80 text-slate-300 p-1.5 rounded-lg hover:text-white hover:bg-red-500/80"
                                                >
                                                    <X size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Upscale Loading/Result Overlay */}
                        {(isUpscaling || upscaledImage) && (
                            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                                {isUpscaling ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-widest">Enhancing Details...</h3>
                                        <p className="text-slate-400 text-sm mt-2">Using Gemini Vision to reconstruct high resolution</p>
                                    </div>
                                ) : (
                                    <div className="relative max-w-5xl w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                                        <div className="bg-[#151515] border border-white/10 rounded-2xl p-2 shadow-2xl relative group max-h-[80vh] flex flex-col">
                                            <img src={upscaledImage!} className="max-h-[60vh] lg:max-h-[70vh] rounded-xl object-contain bg-black" />
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={upscaledImage!} download={`pdf-extract-${Date.now()}.png`} className="p-2 bg-white text-black rounded-lg hover:bg-cyan-500 hover:text-white transition-colors"><Download size={16}/></a>
                                                <button onClick={() => setUpscaledImage(null)} className="p-2 bg-black/60 text-white rounded-lg hover:bg-red-500 transition-colors"><X size={16}/></button>
                                            </div>
                                        </div>
                                        <div className="mt-6 flex gap-4">
                                            <button onClick={() => setUpscaledImage(null)} className="px-6 py-2 bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors">Close</button>
                                            <a href={upscaledImage!} download={`pdf-extract-${Date.now()}.png`} className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-cyan-500 transition-colors shadow-lg flex items-center gap-2"><Download size={14}/> Download High-Res</a>
                                        </div>
                                        <p className="text-slate-500 text-[10px] mt-4 uppercase tracking-widest">Image saved to Gallery</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};