import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Type, Blob } from "@google/genai";
import {
    ChatIcon, ImageIcon, VideoIcon, MicIcon, LiveIcon, CloseIcon, SendIcon,
    BotIcon, UserIcon, UploadIcon
} from './Icons';

type Tab = 'chat' | 'image' | 'video' | 'transcribe' | 'live';
type ChatModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';

interface GeoAIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    userLocation: { lat: number, lon: number } | null;
}

// Audio helper functions from documentation
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
}
// End audio helpers

const GeoAIAssistant: React.FC<GeoAIAssistantProps> = ({ isOpen, onClose, userLocation }) => {
    const [activeTab, setActiveTab] = useState<Tab>('chat');
    
    // Chat state
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string, links?: any[] }[]>([
        { role: 'model', text: 'Hello! I am your GeoAI assistant. How can I help you with your farm today?' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatModel, setChatModel] = useState<ChatModel>('gemini-2.5-flash');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Image state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageAnalysis, setImageAnalysis] = useState<string>('');
    const [isImageLoading, setIsImageLoading] = useState(false);

    // Video state
    const [videoAnalysis, setVideoAnalysis] = useState<string>('');
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    // Transcription state
    const [transcript, setTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const transcriptSessionPromise = useRef<Promise<LiveSession> | null>(null);
    const transcriptAudioContext = useRef<AudioContext | null>(null);
    const transcriptStream = useRef<MediaStream | null>(null);
    const transcriptProcessor = useRef<ScriptProcessorNode | null>(null);

    // Live API state
    const [liveTranscript, setLiveTranscript] = useState<{speaker: string, text: string}[]>([]);
    const [isLive, setIsLive] = useState(false);
    const liveSessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const liveStream = useRef<MediaStream | null>(null);
    const liveProcessor = useRef<ScriptProcessorNode | null>(null);
    const liveSources = useRef(new Set<AudioBufferSourceNode>()).current;
    const nextStartTime = useRef(0);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            if(isTranscribing) stopTranscription();
            if(isLive) stopLiveConversation();
        }
    }, [isOpen]);

    const handleTabClick = (tab: Tab) => {
        if (isTranscribing) stopTranscription();
        if (isLive) stopLiveConversation();
        setActiveTab(tab);
    };

    // --- CHAT LOGIC ---
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        
        const newUserMessage = { role: 'user' as const, text: chatInput };
        setChatMessages(prev => [...prev, newUserMessage]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const config: any = {};
            // Always add Google Search grounding for up-to-date info. The model will decide when to use it.
            const tools: any[] = [{ googleSearch: {} }];
            const lowerCaseInput = chatInput.toLowerCase();

            // Add Maps grounding if location is available and relevant keywords are used.
            if (userLocation && (lowerCaseInput.includes('nearby') || lowerCaseInput.includes('closest'))) {
                tools.push({ googleMaps: {} });
                config.toolConfig = {
                    retrievalConfig: {
                        latLng: {
                            latitude: userLocation.lat,
                            longitude: userLocation.lon
                        }
                    }
                };
            }
            
            config.tools = tools;
            
            if (chatModel === 'gemini-2.5-pro') {
                config.thinkingConfig = { thinkingBudget: 32768 };
            }
            
            const response = await ai.models.generateContent({
                model: chatModel,
                contents: `You are an expert agricultural assistant. User's question: ${chatInput}`,
                config,
            });

            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const newModelMessage = { role: 'model' as const, text: response.text, links: groundingChunks };
            setChatMessages(prev => [...prev, newModelMessage]);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMessage = { role: 'model' as const, text: "Sorry, I encountered an error. Please try again." };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // --- IMAGE ANALYSIS LOGIC ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setImageAnalysis('');
        }
    };

    const handleAnalyzeImage = async () => {
        if (!imageFile) return;
        setIsImageLoading(true);
        setImageAnalysis('');

        const fileToPart = async (file: File) => {
            const base64encoded = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });
            return {
                inlineData: {
                    data: base64encoded,
                    mimeType: file.type
                }
            };
        };

        try {
            const imagePart = await fileToPart(imageFile);
            const prompt = "Analyze this image from an agricultural perspective. Identify any visible crops, assess their health, and point out potential issues like pests, diseases, or nutrient deficiencies. Provide actionable advice for a farmer if possible.";
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: prompt }] },
            });
            setImageAnalysis(response.text);
        } catch (error) {
            console.error("Image Analysis Error:", error);
            setImageAnalysis("Sorry, I couldn't analyze the image. Please try another one.");
        } finally {
            setIsImageLoading(false);
        }
    };

    // --- VIDEO ANALYSIS LOGIC (DEMO) ---
    const handleAnalyzeVideo = async () => {
        setIsVideoLoading(true);
        setVideoAnalysis('');
        try {
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: "Describe key information one might find in a video of a drone flying over a cornfield for crop monitoring.",
                config: { thinkingConfig: { thinkingBudget: 32768 } }
            });
            setVideoAnalysis(response.text);
        } catch(e) {
            console.error(e);
            setVideoAnalysis("An error occurred during the simulated analysis.");
        } finally {
            setIsVideoLoading(false);
        }
    };

    // --- TRANSCRIPTION LOGIC ---
    const startTranscription = async () => {
        if (isTranscribing) return;
        setIsTranscribing(true);
        setTranscript('');
        try {
            transcriptStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            transcriptAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            transcriptSessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash',
                callbacks: {
                    onopen: () => {
                        const source = transcriptAudioContext.current!.createMediaStreamSource(transcriptStream.current!);
                        transcriptProcessor.current = transcriptAudioContext.current!.createScriptProcessor(4096, 1, 1);
                        transcriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            transcriptSessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(transcriptProcessor.current);
                        transcriptProcessor.current.connect(transcriptAudioContext.current!.destination);
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscript(prev => prev + text);
                        }
                    },
                    onerror: (e: ErrorEvent) => console.error('Transcription error:', e),
                    onclose: () => console.log('Transcription closed'),
                },
                config: { inputAudioTranscription: {} },
            });
        } catch (error) {
            console.error('Failed to start transcription:', error);
            setTranscript("Error: Could not access microphone.");
            setIsTranscribing(false);
        }
    };
    
    const stopTranscription = async () => {
        if (!isTranscribing) return;
        setIsTranscribing(false);
        transcriptProcessor.current?.disconnect();
        transcriptAudioContext.current?.close();
        transcriptStream.current?.getTracks().forEach(track => track.stop());
        const session = await transcriptSessionPromise.current;
        session?.close();
    };

    // --- LIVE API LOGIC ---
    const startLiveConversation = async () => {
        if(isLive) return;
        setIsLive(true);
        setLiveTranscript([]);
        try {
            liveStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            liveSessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContext.current!.createMediaStreamSource(liveStream.current!);
                        liveProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                        liveProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            liveSessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(liveProcessor.current);
                        liveProcessor.current.connect(inputAudioContext.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle audio output
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if(base64Audio) {
                            nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext.current!, 24000, 1);
                            const source = outputAudioContext.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.current!.destination);
                            source.addEventListener('ended', () => { liveSources.delete(source); });
                            source.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            liveSources.add(source);
                        }

                        // Handle transcription
                        if (message.serverContent?.inputTranscription) {
                           setLiveTranscript(prev => {
                               const last = prev[prev.length - 1];
                               if (last?.speaker === 'user') {
                                   last.text += message.serverContent.inputTranscription.text;
                                   return [...prev.slice(0, -1), last];
                               }
                               return [...prev, { speaker: 'user', text: message.serverContent.inputTranscription.text }];
                           });
                        }
                        if (message.serverContent?.outputTranscription) {
                            setLiveTranscript(prev => {
                               const last = prev[prev.length - 1];
                               if (last?.speaker === 'model') {
                                   last.text += message.serverContent.outputTranscription.text;
                                   return [...prev.slice(0, -1), last];
                               }
                               return [...prev, { speaker: 'model', text: message.serverContent.outputTranscription.text }];
                           });
                        }
                    },
                    onerror: (e: ErrorEvent) => console.error('Live error:', e),
                    onclose: () => console.log('Live closed'),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a friendly and helpful agricultural assistant.'
                }
            });

        } catch (error) {
            console.error('Failed to start live conversation:', error);
            setLiveTranscript([{speaker: 'model', text: 'Error: Could not access microphone.'}]);
            setIsLive(false);
        }
    };
    const stopLiveConversation = async () => {
        if(!isLive) return;
        setIsLive(false);
        liveProcessor.current?.disconnect();
        inputAudioContext.current?.close();
        outputAudioContext.current?.close();
        liveStream.current?.getTracks().forEach(track => track.stop());
        liveSources.forEach(s => s.stop());
        const session = await liveSessionPromise.current;
        session?.close();
    };


    if (!isOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'chat': return (
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <label htmlFor="model-select" className="text-sm text-gray-500 dark:text-gray-400 mr-2">Model:</label>
                        <select id="model-select" value={chatModel} onChange={e => setChatModel(e.target.value as ChatModel)} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1 text-sm">
                            <option value="gemini-2.5-flash">Fast (Flash)</option>
                            <option value="gemini-2.5-flash-lite">Low Latency (Flash-Lite)</option>
                            <option value="gemini-2.5-pro">Complex (Pro + Thinking)</option>
                        </select>
                    </div>
                    <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    {msg.links && msg.links.length > 0 && (
                                        <div className="mt-2 border-t border-gray-300 dark:border-gray-600 pt-2">
                                            <h4 className="text-xs font-semibold mb-1">Sources:</h4>
                                            <ul className="text-xs space-y-1">
                                                {msg.links.map((link, idx) => (
                                                  <li key={idx}><a href={link.web?.uri || link.maps?.uri} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-500">{link.web?.title || link.maps?.title}</a></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
                            </div>
                        ))}
                        {isChatLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">Thinking...</div></div>}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Ask about your farm..."
                                className="flex-grow bg-gray-100 dark:bg-gray-800 border-transparent rounded-md focus:ring-green-500 focus:border-green-500"
                            />
                            <button onClick={handleSendMessage} disabled={isChatLoading} className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 disabled:bg-gray-400">
                                <SendIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            );
            case 'image': return (
                <div className="p-4 space-y-4 overflow-y-auto h-full">
                    <h3 className="font-semibold">Analyze Crop Image</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Upload an image of a plant or crop to identify potential issues.</p>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <input type="file" id="image-upload" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-center">
                            <UploadIcon className="w-10 h-10 mx-auto text-gray-400" />
                            <span className="mt-2 block text-sm font-semibold text-green-600">{imageFile ? imageFile.name : "Choose an image"}</span>
                        </label>
                    </div>
                    {imagePreview && <img src={imagePreview} alt="Preview" className="mx-auto rounded-lg max-h-48" />}
                    <button onClick={handleAnalyzeImage} disabled={!imageFile || isImageLoading} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                        {isImageLoading ? 'Analyzing...' : 'Analyze Image'}
                    </button>
                    {imageAnalysis && <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm whitespace-pre-wrap">{imageAnalysis}</div>}
                </div>
            );
            case 'video': return (
                <div className="p-4 space-y-4 overflow-y-auto h-full">
                    <h3 className="font-semibold">Analyze Drone Footage (Conceptual)</h3>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg">
                        <strong>Note:</strong> Direct video file analysis is not supported by this client-side app. This is a conceptual demo using Gemini Pro to generate a sample analysis based on a text prompt about a hypothetical video.
                    </div>
                    <button onClick={handleAnalyzeVideo} disabled={isVideoLoading} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                        {isVideoLoading ? 'Analyzing...' : 'Run Demo Analysis'}
                    </button>
                    {videoAnalysis && <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm whitespace-pre-wrap">{videoAnalysis}</div>}
                </div>
            );
            case 'transcribe': return (
                <div className="p-4 space-y-4 overflow-y-auto h-full flex flex-col">
                    <h3 className="font-semibold">Transcribe Audio Note</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Record your voice to transcribe field notes, observations, or questions.</p>
                    <div className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm whitespace-pre-wrap">{transcript || 'Your transcript will appear here...'}</div>
                    <button onClick={isTranscribing ? stopTranscription : startTranscription} className={`w-full font-semibold py-2 rounded-md ${isTranscribing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                        {isTranscribing ? 'Stop Recording' : 'Start Recording'}
                    </button>
                </div>
            );
            case 'live': return (
                 <div className="p-4 space-y-4 overflow-y-auto h-full flex flex-col">
                    <h3 className="font-semibold">Live Conversation</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Speak directly with the GeoAI assistant in real-time.</p>
                    <div className="flex-grow p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm space-y-2">
                        {liveTranscript.map((t,i) => <p key={i}><strong>{t.speaker === 'user' ? 'You' : 'AI'}:</strong> {t.text}</p>)}
                        {!isLive && liveTranscript.length === 0 && <p>Your conversation will appear here...</p>}
                    </div>
                     <button onClick={isLive ? stopLiveConversation : startLiveConversation} className={`w-full font-semibold py-2 rounded-md ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                        {isLive ? 'End Conversation' : 'Start Conversation'}
                    </button>
                </div>
            );
            default: return null;
        }
    };

    const TABS: { id: Tab, name: string, icon: React.FC<any> }[] = [
        { id: 'chat', name: 'Chat', icon: ChatIcon },
        { id: 'image', name: 'Image', icon: ImageIcon },
        { id: 'video', name: 'Video', icon: VideoIcon },
        { id: 'transcribe', name: 'Transcribe', icon: MicIcon },
        { id: 'live', name: 'Live', icon: LiveIcon },
    ];
    
    return (
        <div className={`fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'}`}>
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-lg">GeoAI Assistant</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><CloseIcon className="w-6 h-6" /></button>
            </header>
            <div className="flex-grow flex flex-col overflow-hidden">
                <nav className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700">
                    {TABS.map(({ id, name, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => handleTabClick(id)}
                            className={`flex-1 flex flex-col items-center p-2 text-xs font-medium border-b-2 ${activeTab === id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                        >
                            <Icon className="w-5 h-5 mb-1" />
                            {name}
                        </button>
                    ))}
                </nav>
                <main className="flex-grow bg-white dark:bg-gray-800 overflow-hidden">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default GeoAIAssistant;
