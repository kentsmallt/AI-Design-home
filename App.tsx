import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, ArrowRight, RotateCcw } from 'lucide-react';
import { ComparisonSlider } from './components/ComparisonSlider';
import { ChatInterface } from './components/ChatInterface';
import { StyleCarousel } from './components/StyleCarousel';
import { AppState, DesignStyle, Message, MessageRole, UserIntent } from './types';
import { fileToBase64 } from './utils/imageUtils';
import { editImage, chatWithConsultant, classifyUserIntent } from './services/geminiService';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null); // The one currently shown (edited or original)
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial welcome message
  useEffect(() => {
    if (appState === AppState.EDITOR && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: MessageRole.MODEL,
          text: "I've analyzed your room! Try selecting a style above, or tell me specific changes like 'Make the sofa blue' or 'Add a plant'. You can also ask me to find items to buy.",
          timestamp: Date.now()
        }
      ]);
    }
  }, [appState, messages.length]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      const base64 = await fileToBase64(file);
      setOriginalImage(base64);
      setCurrentImage(base64);
      setAppState(AppState.EDITOR);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStyleSelect = async (style: DesignStyle) => {
    if (!originalImage || isProcessing) return;

    try {
      setIsProcessing(true);
      // Add a system message indicating action
      const userMsgId = Date.now().toString();
      const userMsg: Message = {
        id: userMsgId,
        role: MessageRole.USER,
        text: `Apply ${style.name} style`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg]);

      // Edit Image
      const newImageBase64 = await editImage(originalImage, style.prompt); // Always base edits on original for styles? Or current? 
      // Requirement: "Reimagined styles". Usually implies transforming the original. 
      // Let's use Original for fresh style applications to avoid degradation.
      setCurrentImage(newImageBase64);

      // Add response
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: `Here is the ${style.name} look! How does it feel?`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);

    } catch (err) {
      setError("Failed to generate style. " + (err instanceof Error ? err.message : ""));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserMessage = async (text: string) => {
    if (!currentImage || isProcessing) return;

    try {
      setIsProcessing(true);
      
      // 1. Add user message to UI immediately
      const userMsg: Message = {
        id: Date.now().toString(),
        role: MessageRole.USER,
        text: text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMsg]);

      // 2. Classify Intent
      const intent = await classifyUserIntent(text);
      console.log("Detected Intent:", intent);

      if (intent === UserIntent.EDIT_IMAGE) {
        // --- EDIT PATH ---
        // Use Gemini 2.5 Flash Image
        // We use currentImage as the base for refinements (e.g., "Make the rug blue" should apply to the currently visible room)
        const editedImageBase64 = await editImage(currentImage, text);
        setCurrentImage(editedImageBase64);
        
        const modelMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: MessageRole.MODEL,
          text: "I've updated the design based on your request.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, modelMsg]);

      } else {
        // --- CHAT/SHOP PATH ---
        // Use Gemini 3 Pro Preview
        const response = await chatWithConsultant(currentImage, messages.map(m => ({ role: m.role, text: m.text })), text);
        
        const modelMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: MessageRole.MODEL,
          text: response.text,
          sources: response.sources,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, modelMsg]);
      }

    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: MessageRole.SYSTEM,
        text: "I encountered an error processing your request. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setOriginalImage(null);
    setCurrentImage(null);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-10">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">DesignDream <span className="text-indigo-600">AI</span></h1>
          </div>
          {appState === AppState.EDITOR && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-stone-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={16} /> Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {appState === AppState.UPLOAD ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="text-center max-w-2xl">
              <h2 className="text-4xl font-extrabold text-stone-900 mb-4 tracking-tight">Reimagine your space instantly.</h2>
              <p className="text-lg text-stone-600 mb-10">
                Upload a photo of your room. Apply styles like Mid-Century or Industrial. Chat to refine details and find where to buy the look.
              </p>
              
              <label className="group relative flex flex-col items-center justify-center w-full max-w-lg h-64 border-2 border-stone-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-stone-50 hover:border-indigo-500 transition-all shadow-sm hover:shadow-md mx-auto">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="mb-2 text-sm text-stone-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-stone-400">PNG, JPG up to 10MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                />
              </label>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-stone-400 uppercase tracking-widest">
                <span>Powered by Gemini 2.5 Flash</span>
                <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                <span>Gemini 3 Pro</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left Column: Visualizer */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-1 rounded-2xl shadow-sm border border-stone-200">
                 {originalImage && currentImage && (
                   <ComparisonSlider 
                     originalImage={originalImage}
                     generatedImage={currentImage}
                   />
                 )}
              </div>
              
              <StyleCarousel 
                onSelectStyle={handleStyleSelect}
                disabled={isProcessing}
              />
              
              <div className="bg-indigo-50 rounded-lg p-4 text-indigo-800 text-sm flex gap-3">
                 <div className="shrink-0 pt-1"><ArrowRight size={16} /></div>
                 <div>
                   <span className="font-bold">Pro Tip:</span> Use the chat on the right to make specific edits like "Make the floor darker" or "Remove the chair".
                 </div>
              </div>
            </div>

            {/* Right Column: Chat */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ChatInterface 
                  messages={messages}
                  onSendMessage={handleUserMessage}
                  isLoading={isProcessing}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
