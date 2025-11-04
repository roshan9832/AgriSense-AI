import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
    UserIcon, CameraIcon, MicIcon, InfoIcon, SendIcon, RefreshIcon,
} from './Icons';

// Fix for SpeechRecognition API types which are not included in standard TypeScript libs.
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

type MessageContent = {
    type: 'text';
    value: string;
} | {
    type: 'map';
    title: string;
    imageUrl: string; // Placeholder for static map image
} | {
    type: 'barchart';
    title: string;
    subtitle: string;
    labels: string[];
    data: number[];
} | {
    type: 'image';
    value: string; // Base64 Data URL
}

type ChatMessage = {
    id: number;
    role: 'user' | 'model';
    content: MessageContent[];
}

const initialMessages: ChatMessage[] = [
    {
        id: 1,
        role: 'user',
        content: [{ type: 'text', value: 'मेरी धान की फसल पीली पड़ रही है, क्या करें?' }]
    },
    {
        id: 2,
        role: 'model',
        content: [
            { type: 'text', value: 'आपके खेत (NDVI: 0.43) में नमी कम है। सिंचाई 2 दिन में करें। साथ ही नाइट्रोजन स्प्रे (Urea 1%) की सलाह दी जाती है।' },
            { type: 'map', title: 'NDVI Trend', imageUrl: 'https://i.imgur.com/4zA8E0L.png' }
        ]
    },
    {
        id: 3,
        role: 'model',
        content: [
            {
                type: 'barchart',
                title: 'आपके लोकेशन (Darbhanga) में अगले 5 दिनों में 62% बारिश की संभावना है।',
                subtitle: 'अगले 5 दिनों में बारिश की संभावना',
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                data: [20, 62, 45, 30, 15]
            }
        ]
    }
];

const ChartVisual: React.FC<{ title: string, subtitle: string, labels: string[], data: number[] }> = ({ title, subtitle, labels, data }) => {
    const maxValue = Math.max(...data, 1); // Avoid division by zero
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
                        <div 
                            className="w-4/5 bg-gray-300 dark:bg-gray-500 rounded-t-sm"
                            style={{ height: `${(value / maxValue) * chartHeight}px` }}
                        ></div>
                        <span className="text-xs mt-1 text-gray-600 dark:text-gray-300">{labels[index]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MapVisual: React.FC<{ title: string, imageUrl: string }> = ({ title, imageUrl }) => {
    return (
        <div className="mt-2 group cursor-pointer">
            <img src={imageUrl} alt={title} className="rounded-lg w-full h-auto" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 group-hover:underline">Tap to expand</p>
        </div>
    );
};


const GeoAIAssistant: React.FC = () => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [weather, setWeather] = useState<{ temp: number; moisture: string } | null>({ temp: 31, moisture: 'Low' });
    const [isFetchingWeather, setIsFetchingWeather] = useState(false);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [speechApiSupported, setSpeechApiSupported] = useState(true);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechRecognition = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech Recognition API not supported in this browser.");
            setSpeechApiSupported(false);
            return;
        }

        const recognition: SpeechRecognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            setChatInput(transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        speechRecognition.current = recognition;
    }, []);

    const handleMicClick = () => {
        if (!speechRecognition.current) return;

        if (isListening) {
            speechRecognition.current.stop();
        } else {
            setChatInput(''); 
            speechRecognition.current.start();
            setIsListening(true);
        }
    };

    const handleFetchWeather = async () => {
        setIsFetchingWeather(true);
        setWeatherError(null);
        
        if (!navigator.geolocation) {
            setWeatherError("Geolocation is not supported by your browser.");
            setIsFetchingWeather(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Provide the current temperature in Celsius and a one-word moisture level description (e.g., Low, Medium, High) for latitude ${latitude} and longitude ${longitude}.`;
                
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                      responseMimeType: "application/json",
                      responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            temp: { type: Type.NUMBER, description: "Current temperature in Celsius." },
                            moisture: { type: Type.STRING, description: "A single word describing moisture level (Low, Medium, High)." }
                        },
                        required: ["temp", "moisture"]
                      }
                    },
                });

                const parsed = JSON.parse(response.text);
                if (parsed && typeof parsed.temp === 'number' && typeof parsed.moisture === 'string') {
                    setWeather({ temp: Math.round(parsed.temp), moisture: parsed.moisture });
                } else {
                    throw new Error("Invalid data format from AI.");
                }

            } catch (err) {
                console.error("Failed to fetch weather:", err);
                setWeatherError("Failed to fetch weather data.");
            } finally {
                setIsFetchingWeather(false);
            }
        }, (error) => {
            console.error("Geolocation error:", error);
            setWeatherError("Unable to retrieve your location.");
            setIsFetchingWeather(false);
        });
    };

    const handleSendMessage = async (messageText?: string) => {
        const textToSend = (messageText || chatInput).trim();
        if (!textToSend || isChatLoading) return;
        
        const newUserMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: [{ type: 'text', value: textToSend }]
        };
        setChatMessages(prev => [...prev, newUserMessage]);
        if (!messageText) {
            setChatInput('');
        }
        setIsChatLoading(true);

        setTimeout(() => {
            const newModelMessage: ChatMessage = {
                id: Date.now() + 1,
                role: 'model',
                content: [{ type: 'text', value: `I received your message: "${textToSend}". As a demo, I can't generate a live response, but in a real application, I would connect to the Gemini API to provide a data-rich answer with visualizations.` }]
            };
            setChatMessages(prev => [...prev, newModelMessage]);
            setIsChatLoading(false);
        }, 1500);
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const newUserMessage: ChatMessage = {
                    id: Date.now(),
                    role: 'user',
                    content: [{ type: 'image', value: base64String }]
                };
                setChatMessages(prev => [...prev, newUserMessage]);

                setIsChatLoading(true);
                setTimeout(() => {
                    const newModelMessage: ChatMessage = {
                        id: Date.now() + 1,
                        role: 'model',
                        content: [{ type: 'text', value: "I've received the image. Analyzing for crop health... This appears to be a healthy leaf." }]
                    };
                    setChatMessages(prev => [...prev, newModelMessage]);
                    setIsChatLoading(false);
                }, 1500);
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };


    return (
        <div className="bg-gray-200 dark:bg-black flex flex-col h-full">
            <header className="flex-shrink-0 p-4 bg-gray-200 dark:bg-black">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">AI Geo Assistant</h2>
                    <div className="flex items-center space-x-2">
                        <button className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors duration-200">
                            <UserIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="text-xs text-center text-gray-600 dark:text-gray-400 bg-gray-300 dark:bg-gray-800/50 p-2 rounded-lg flex items-center justify-center space-x-2">
                    <div className="flex-grow text-center">
                        {isFetchingWeather ? (
                             <span>Fetching weather...</span>
                        ) : weatherError ? (
                             <span className="text-red-500">{weatherError}</span>
                        ) : (
                            <>
                                <span>Temp: <strong>{weather?.temp ?? '--'}°C</strong></span>
                                <span className="mx-2">|</span>
                                <span>NDVI: <strong>0.72</strong></span>
                                <span className="mx-2">|</span>
                                <span>Moisture: <strong>{weather?.moisture ?? '--'}</strong></span>
                            </>
                        )}
                    </div>
                    <button onClick={handleFetchWeather} disabled={isFetchingWeather} className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-400/50 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                       <RefreshIcon className={`w-4 h-4 ${isFetchingWeather ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>
            
            <main ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <div className={`w-full max-w-xs md:max-w-sm p-3 rounded-2xl ${msg.role === 'user' ? 'bg-lime-300 text-gray-800 rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm rounded-bl-none'}`}>
                            {msg.content.map((contentItem, index) => {
                                switch (contentItem.type) {
                                    case 'text':
                                        return <p key={index} className="text-sm whitespace-pre-wrap">{contentItem.value}</p>;
                                    case 'map':
                                        return <MapVisual key={index} {...contentItem} />;
                                    case 'barchart':
                                        return <ChartVisual key={index} {...contentItem} />;
                                    case 'image':
                                        return <img key={index} src={contentItem.value} alt="User upload" className="rounded-lg w-full h-auto" />;
                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    </div>
                ))}
                {isChatLoading && <div className="flex justify-start"><div className="p-3 rounded-2xl bg-white dark:bg-gray-800 text-sm">...</div></div>}
            </main>

            <footer className="flex-shrink-0 p-4 space-y-3 bg-gray-200 dark:bg-black">
                 <div className="flex items-center flex-wrap gap-2">
                    <button onClick={handleCameraClick} className="flex-shrink-0 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full shadow-sm transition-all duration-200 active:scale-95"><CameraIcon className="w-4 h-4 inline-block -ml-1 mr-1.5" /></button>
                    
                    {['मंडी रेट बना', 'सिंचाई सुझाव दो', 'मौसम देखो'].map(suggestion => (
                         <button 
                            key={suggestion}
                            onClick={() => handleSendMessage(suggestion)}
                            className="flex-shrink-0 text-xs font-medium bg-lime-200 hover:bg-lime-300 text-lime-900 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95"
                          >
                            {suggestion}
                         </button>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <InfoIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isListening ? "Listening..." : "Ask me anything about your farm..."}
                            className="w-full bg-white dark:bg-gray-800 border-transparent rounded-full focus:ring-green-500 focus:border-green-500 p-2.5 pl-10 pr-10 text-sm shadow-sm"
                            aria-label="Chat input"
                        />
                         {speechApiSupported && (
                            <button 
                                onClick={handleMicClick} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 p-1"
                                aria-label={isListening ? "Stop listening" : "Start voice input"}
                                title={isListening ? "Stop listening" : "Start voice input"}
                            >
                                <MicIcon className={`w-5 h-5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => handleSendMessage()} 
                        disabled={isChatLoading || !chatInput.trim()} 
                        className="bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 disabled:bg-gray-400 flex-shrink-0 shadow-sm transition-all duration-200 active:scale-95"
                        aria-label="Send message"
                    >
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default GeoAIAssistant;
