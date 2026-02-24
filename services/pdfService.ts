import { ai, cleanBase64 } from "./geminiService";
import { ChatMessage, PdfDocument } from "../types";

// Helper: Convert specific PDF pages to Base64 Images
const renderPdfPagesAsImages = async (file: File, maxPages: number = 3): Promise<string[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
            
            const images: string[] = [];
            // We'll limit to the first few pages to keep payload size manageable
            // or distribute them if the doc is large (e.g., first, middle, last)
            const count = Math.min(pdf.numPages, maxPages);
            
            for (let i = 1; i <= count; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Good balance of quality/size
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context!, viewport }).promise;
                images.push(canvas.toDataURL('image/jpeg', 0.8));
            }
            resolve(images);
        } catch (e) {
            console.error("Error rendering PDF pages:", e);
            resolve([]); // Fail gracefully by returning empty images
        }
    });
};

export const extractTextFromPdf = async (file: File): Promise<PdfDocument> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
                const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
                
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    
                    // Improved extraction: Join with space, but respect newlines if y-coord changes significantly (basic heuristic)
                    // For now, simpler join with space is often sufficient for LLM context
                    const pageText = textContent.items
                        .map((item: any) => item.str)
                        .filter((str: string) => str.trim().length > 0)
                        .join(" ");
                        
                    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
                }

                resolve({
                    id: Date.now().toString() + Math.random().toString(),
                    name: file.name,
                    content: fullText,
                    pageCount: pdf.numPages,
                    fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                    originalFile: file
                });
            } catch (error) {
                console.error("PDF Extraction Error:", error);
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

export const chatWithDocuments = async (
    query: string, 
    documents: PdfDocument[], 
    history: ChatMessage[],
    useVisualAnalysis: boolean = false
): Promise<string> => {
    try {
        const parts: any[] = [];
        
        let contextInstruction = "You are an expert Document Analyst and PDF Intelligence Assistant.\n";
        contextInstruction += "Your goal is to provide precise, evidence-based answers from the provided documents.\n";
        
        if (useVisualAnalysis) {
            contextInstruction += "VISUAL ANALYSIS MODE ENABLED: You have been provided with visual snapshots (images) of the document pages in addition to text. ";
            contextInstruction += "Use these images to analyze charts, diagrams, product photos, and layout details that text extraction might miss. ";
            contextInstruction += "If the text extraction is sparse or garbled, RELY ON THE IMAGES.\n";
        }

        contextInstruction += "\nCRITICAL INSTRUCTIONS:\n";
        contextInstruction += "1. CITATIONS: Cite the page number in format [[Page X]] for every fact.\n";
        contextInstruction += "2. COMPARISONS: When comparing products or documents, look at both the text specs and the visual images provided.\n";
        contextInstruction += "3. FORMATTING: Use Markdown.\n";

        parts.push({ text: contextInstruction });

        // Build Context
        for (let index = 0; index < documents.length; index++) {
            const doc = documents[index];
            parts.push({ text: `\n=== DOCUMENT ${index + 1}: ${doc.name} ===\n${doc.content}\n=================\n` });

            // If visual mode is on, render and attach pages
            if (useVisualAnalysis) {
                // Render up to 3 pages per doc to avoid token limits
                const images = await renderPdfPagesAsImages(doc.originalFile, 3); 
                images.forEach((imgBase64, imgIdx) => {
                     parts.push({ 
                         inlineData: { 
                             mimeType: 'image/jpeg', 
                             data: cleanBase64(imgBase64) 
                         } 
                     });
                     parts.push({ text: `[Image: Document ${index + 1} - Page ${imgIdx + 1}]` });
                });
            }
        }
        
        // Add chat history context
        if (history.length > 0) {
             const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
             parts.push({ text: `\nConversation History:\n${historyText}\n` });
        }

        // Add User Query
        parts.push({ text: `\nUser Question: ${query}` });

        // Use Pro Vision model for visual analysis
        const modelName = useVisualAnalysis ? 'gemini-3-pro-image-preview' : 'gemini-3-flash-preview';

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts }
        });

        return response.text || "I couldn't generate a response.";

    } catch (error) {
        console.error("Chat Error:", error);
        throw new Error("Failed to analyze documents.");
    }
};