
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Page } from '../App';
import {
    UserIcon, CameraIcon, MicIcon, VideoIcon, SendIcon, RefreshIcon, LiveIcon, SparklesIcon, SpeakerWaveIcon, LinkIcon, StopIcon, ArrowLeftIcon
} from './Icons';
import Button from './common/Button';
import IconButton from './common/IconButton';

type MessageContent = {
    type: 'text';
    value: string;
} | {
    type: 'map';
    title: string;
    imageUrl: string;
} | {
    type: 'barchart';
    title: string;
    subtitle: string;
    labels: string[];
    data: number[];
} | {
    type: 'image' | 'video';
    value: string; // Base64 Data URL
}

type GroundingSource = {
    uri: string;
    title: string;
    type: 'web' | 'maps';
}

type ChatMessage = {
    id: number;
    role: 'user' | 'model';
    content: MessageContent[];
    sources?: GroundingSource[];
}

const initialMessages: ChatMessage[] = [
    {
        id: 1,
        role: 'user',
        content: [{ type: 'text', value: 'My paddy crop is turning yellow, what should I do?' }]
    },
    {
        id: 2,
        role: 'model',
        content: [
            { type: 'text', value: 'Your field (NDVI: 0.43) has low moisture. Irrigate within 2 days. A nitrogen spray (Urea 1%) is also recommended.' },
            { type: 'map', title: 'NDVI Trend', imageUrl: 'https://i.imgur.com/4zA8E0L.png' }
        ]
    },
];

const blobToBase64 = (blob: Blob): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const [header, data] = dataUrl.split(',');
        if (!header || !data) {
           reject(new Error("Invalid file format."));
           return;
        }
        const mimeTypeMatch = header.match(/:(.*?);/);
        if (!mimeTypeMatch || !mimeTypeMatch[1]) {
            reject(new Error("Could not determine file type."));
            return;
        }
        resolve({ data, mimeType: mimeTypeMatch[1] });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ChartVisual: React.FC<{ title: string, subtitle: string, labels: string[], data: number[] }> = ({ title, subtitle, labels, data }) => {
    const maxValue = Math.max(...data, 1);
    const chartHeight = 120;
    return (
        <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg mt-2 border border-gray-200 dark:border-gray-600">
            <div className="mb-3">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            <div className="flex justify-around items-end" style={{ height: `${chartHeight}px` }}>
                {data.map((value, index) => (
                    <div key={index} className="flex flex-col items-center w-1/5">
                        <div className="w-4/5 bg-gray-300 dark:bg-gray-500 rounded-t-sm" style={{ height: `${(value / maxValue) * chartHeight}px` }}></div>
                        <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">{labels[index]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MapVisual: React.FC<{ title: string, imageUrl: string }> = ({ title, imageUrl }) => (
    <div className="mt-2 group cursor-pointer">
        <img src={imageUrl} alt={title} className="rounded-lg w-full h-auto" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 group-hover:underline">Tap to expand</p>
    </div>
);

const Sources: React.FC<{ sources: GroundingSource[] }> = ({ sources }) => (
    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Sources:</h4>
        <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
                <a key={index} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-blue-600 dark:text-blue-300 rounded-full px-2 py-1 transition-colors">
                    <LinkIcon className="w-3 h-3 mr-1.5" />
                    <span>{source.title || new URL(source.uri).hostname}</span>
                </a>
            ))}
        </div>
    </div>
);


// Audio decoding helpers for TTS
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / 1;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


const GeoAIAssistant: React.FC<{ setPage: (page: Page) => void; farmSummary: any; }> = ({ setPage, farmSummary }) => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isThinkingMode, setIsThinkingMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [activeTTSId, setActiveTTSId] = useState<number | null>(null);
    const [uploadedFile, setUploadedFile] = useState<{data: string, mimeType: string, type: 'image' | 'video'} | null>(null);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [chatMessages]);

    const playAudio = async (text: string, messageId: number) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        setActiveTTSId(messageId);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: { responseModalities: [Modality.AUDIO] },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
                source.onended = () => setActiveTTSId(null);
            }
        } catch (error) {
            console.error("TTS error:", error);
            setActiveTTSId(null);
        }
    };
    
    const handleSendMessage = async (messageText?: string) => {
        const textToSend = (messageText || chatInput).trim();
        if ((!textToSend && !uploadedFile) || isChatLoading) return;

        const content: MessageContent[] = [];
        if (textToSend) content.push({ type: 'text', value: textToSend });
        if (uploadedFile) content.push({ type: uploadedFile.type, value: `data:${uploadedFile.mimeType};base64,${uploadedFile.data}`});
        
        const newUserMessage: ChatMessage = { id: Date.now(), role: 'user', content };
        setChatMessages(prev => [...prev, newUserMessage]);
        
        if (!messageText) setChatInput('');
        setUploadedFile(null);
        setIsChatLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const model = isThinkingMode ? "gemini-2.5-pro" : "gemini-2.5-flash-lite";
            const parts: any[] = [];
            if(textToSend) parts.push({ text: textToSend });
            if(uploadedFile) parts.push({ inlineData: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } });

            const config: any = {
                systemInstruction: "You are the AI Geo Assistant for AgriSense AI, a smart agriculture platform. Your role is to provide data-driven insights to farmers, researchers, and policymakers. Do not reveal that you are a large language model trained by Google. Identify yourself only as the AgriSense AI Geo Assistant."
            };
            if (isThinkingMode) {
                config.thinkingConfig = { thinkingBudget: 32768 };
            } else if (!uploadedFile) { // Grounding only for text-based queries in standard mode
                config.tools = [{googleSearch: {}}, {googleMaps: {}}];
            }

            const response = await ai.models.generateContent({ model, contents: { parts }, config });

            const responseText = response.text;
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

            const modelContent: MessageContent[] = [{ type: 'text', value: responseText || "I'm sorry, I couldn't generate a response." }];
            
            const sources: GroundingSource[] = [];
            if (groundingMetadata?.groundingChunks) {
                for (const chunk of groundingMetadata.groundingChunks) {
                    if (chunk.web) sources.push({ ...chunk.web, type: 'web' });
                    if (chunk.maps) sources.push({ ...chunk.maps, type: 'maps' });
                }
            }
            
            const newModelMessage: ChatMessage = {
                id: Date.now() + 1,
                role: 'model',
                content: modelContent,
                ...(sources.length > 0 && { sources })
            };
            setChatMessages(prev => [...prev, newModelMessage]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                role: 'model',
                content: [{ type: 'text', value: "Sorry, I'm having trouble. Please try again." }]
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const { data, mimeType } = await blobToBase64(file);
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        setUploadedFile({ data, mimeType, type });

        const content: MessageContent[] = [{ type: 'text', value: `Uploaded ${type}: ${file.name}. Add a question or send.` }];
        if (type === 'image') content.push({ type: 'image', value: `data:${mimeType};base64,${data}`});

        setChatMessages(prev => [...prev, { id: Date.now(), role: 'model', content }]);
        
        if (event.target) event.target.value = '';
    };

    const toggleAudioRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = event => {
                    audioChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const { data, mimeType } = await blobToBase64(audioBlob);
                    transcribeAudio(data, mimeType);
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Microphone access denied:", error);
            }
        }
    };
    
    const transcribeAudio = async (audioData: string, mimeType: string) => {
        setIsChatLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: "Transcribe this audio." }, { inlineData: { data: audioData, mimeType } }] },
            });
            setChatInput(response.text);
        } catch (error) {
            console.error("Transcription error:", error);
            setChatInput("Audio transcription failed.");
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="bg-gray-200 dark:bg-black flex flex-col h-full">
            <header className="flex-shrink-0 p-4 bg-gray-200 dark:bg-black">
                <div className="flex items-center justify-between mb-3">
                    <IconButton variant="subtle" size="sm" onClick={() => setPage('Dashboard')} aria-label="Go back">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </IconButton>
                    <div className="flex flex-col items-center">
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white">AI Geo Assistant</h2>
                    </div>
                    <IconButton variant="subtle" size="sm" onClick={() => setPage('Profile')}><UserIcon className="w-6 h-6" /></IconButton>
                </div>
                <div className="text-xs text-center text-gray-600 dark:text-gray-400 bg-gray-300 dark:bg-gray-800/50 p-2 rounded-lg flex items-center justify-center space-x-2">
                    <div className="flex-grow text-center">
                         <span>Avg. NDVI: <strong>{farmSummary?.avgNdvi ?? '...'}</strong></span><span className="mx-2">|</span>
                         <span>Moisture: <strong>{farmSummary?.dominantMoisture ?? '...'}</strong></span>
                    </div>
                    <IconButton variant="subtle" size="sm" className="w-6 h-6"><RefreshIcon className="w-4 h-4 animate-spin" style={{animationDuration: '15s'}}/></IconButton>
                </div>
            </header>
            
            <main ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <div className={`w-full max-w-xs md:max-w-sm p-3 rounded-2xl ${msg.role === 'user' ? 'bg-lime-300 text-gray-800 rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm rounded-bl-none'}`}>
                            {msg.content.map((item, index) => {
                                switch (item.type) {
                                    case 'text': return <p key={index} className="text-sm whitespace-pre-wrap">{item.value}</p>;
                                    case 'map': return <MapVisual key={index} {...item} />;
                                    case 'barchart': return <ChartVisual key={index} {...item} />;
                                    case 'image': return <img key={index} src={item.value} alt="User upload" className="rounded-lg w-full h-auto mt-2" />;
                                    case 'video': return <video key={index} src={item.value} controls className="rounded-lg w-full h-auto mt-2" />;
                                    default: return null;
                                }
                            })}
                            {msg.sources && <Sources sources={msg.sources} />}
                            {msg.role === 'model' && msg.content.some(c => c.type === 'text') && (
                                <IconButton variant="subtle" size="sm" className="mt-2 -ml-1" onClick={() => playAudio(msg.content.find(c => c.type === 'text')?.value || '', msg.id)} disabled={activeTTSId !== null}>
                                    <SpeakerWaveIcon className={`w-4 h-4 ${activeTTSId === msg.id ? 'text-green-500' : ''}`} />
                                </IconButton>
                            )}
                        </div>
                    </div>
                ))}
                {isChatLoading && <div className="flex justify-start"><div className="p-3 rounded-2xl bg-white dark:bg-gray-800 text-sm">...</div></div>}
            </main>

            <footer className="flex-shrink-0 p-4 space-y-3 bg-gray-200 dark:bg-black border-t border-gray-300 dark:border-gray-700">
                <div className="flex items-center justify-between gap-2 text-xs">
                     <Button onClick={() => setPage('Live')} variant="tertiary" size="sm" className="!px-3 !py-2"><LiveIcon className="w-4 h-4 mr-1.5"/>Live Assistant</Button>
                    <div className="flex items-center gap-2 p-1 bg-gray-300 dark:bg-gray-800 rounded-full">
                        <SparklesIcon className="w-4 h-4 ml-2 text-purple-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Thinking Mode</span>
                        <button onClick={() => setIsThinkingMode(!isThinkingMode)} className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${isThinkingMode ? 'bg-purple-500' : 'bg-gray-400 dark:bg-gray-600'}`} role="switch" aria-checked={isThinkingMode}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isThinkingMode ? 'translate-x-5' : ''}`}></div>
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                    <IconButton onClick={() => fileInputRef.current?.click()} variant="subtle" size="md" aria-label="Upload file"><CameraIcon className="w-6 h-6"/></IconButton>
                    <IconButton onClick={() => fileInputRef.current?.click()} variant="subtle" size="md" aria-label="Upload file"><VideoIcon className="w-6 h-6"/></IconButton>
                    <div className="relative flex-grow">
                        <input
                            type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isRecording ? "Recording..." : "Ask me anything..."}
                            className="w-full bg-white dark:bg-gray-800 border-transparent rounded-full focus:ring-green-500 focus:border-green-500 p-2.5 pl-4 pr-10 text-sm shadow-sm"
                        />
                        <IconButton onClick={toggleAudioRecording} variant="subtle" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
                            {isRecording ? <StopIcon className="w-5 h-5 text-red-500 animate-pulse" /> : <MicIcon className="w-5 h-5" />}
                        </IconButton>
                    </div>
                    <IconButton
                        onClick={() => handleSendMessage()}
                        disabled={isChatLoading || (!chatInput.trim() && !uploadedFile)}
                        className="bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 flex-shrink-0 shadow-sm"
                    >
                        <SendIcon className="w-5 h-5"/>
                    </IconButton>
                </div>
            </footer>
        </div>
    );
};

export default GeoAIAssistant;