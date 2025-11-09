
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Page } from '../App';
import { ArrowLeftIcon, LiveIcon, StopIcon, UserIcon, BotIcon } from './Icons';
import IconButton from './common/IconButton';
import Button from './common/Button';

// Audio Encoding & Decoding functions
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
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

type TranscriptEntry = {
    id: number;
    role: 'user' | 'model';
    text: string;
};

const LiveAssistant: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR'>('IDLE');
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const startSession = async () => {
        setStatus('CONNECTING');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setStatus('LISTENING');
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        streamRef.current = stream;
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            setStatus('SPEAKING');
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current!.destination);
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                                if (audioSourcesRef.current.size === 0) {
                                    setStatus('LISTENING');
                                }
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }

                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscripts(prev => {
                                const last = prev.length > 0 ? prev[prev.length - 1] : null;
                                if (last && last.role === 'user') {
                                    const updatedTranscripts = [...prev];
                                    updatedTranscripts[updatedTranscripts.length - 1] = { ...last, text: last.text + text };
                                    return updatedTranscripts;
                                }
                                return [...prev, { id: Date.now(), role: 'user', text }];
                            });
                        }

                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                             setTranscripts(prev => {
                                const last = prev.length > 0 ? prev[prev.length - 1] : null;
                                if (last && last.role === 'model') {
                                    const updatedTranscripts = [...prev];
                                    updatedTranscripts[updatedTranscripts.length - 1] = { ...last, text: last.text + text };
                                    return updatedTranscripts;
                                }
                                return [...prev, { id: Date.now(), role: 'model', text }];
                            });
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatus('ERROR');
                        stopSession();
                    },
                    onclose: () => {
                        setStatus('IDLE');
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a friendly and helpful farm assistant for AgriSense AI. Do not reveal that you are a large language model trained by Google. Identify yourself only as the AgriSense AI assistant. Keep your answers concise and to the point.'
                }
            });

        } catch (error) {
            console.error('Failed to start session:', error);
            setStatus('ERROR');
        }
    };

    const stopSession = () => {
        sessionPromiseRef.current?.then((session) => session.close());
        sessionPromiseRef.current = null;
        
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;

        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        
        setStatus('IDLE');
    };

    useEffect(() => {
        return () => {
            // Cleanup on component unmount
            if (status !== 'IDLE') {
                stopSession();
            }
        };
    }, [status]);
    
    const isSessionActive = status !== 'IDLE' && status !== 'ERROR';

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            <header className="flex-shrink-0 flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm">
                <IconButton variant="subtle" size="sm" onClick={() => setPage('Chat')} aria-label="Go back">
                    <ArrowLeftIcon className="w-6 h-6" />
                </IconButton>
                <div className="flex flex-col items-center">
                    <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">Live AI Assistant</h1>
                </div>
                <div className="w-8"></div>
            </header>
            
            <div className="flex-grow p-4 overflow-y-auto">
                 <div className="space-y-4">
                    {transcripts.map(t => (
                        <div key={t.id} className={`flex items-start gap-3 ${t.role === 'user' ? 'justify-end' : ''}`}>
                            {t.role === 'model' && <BotIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />}
                            <div className={`p-3 rounded-lg max-w-sm text-sm ${t.role === 'user' ? 'bg-lime-200 text-gray-800' : 'bg-white dark:bg-gray-700'}`}>
                                {t.text}
                            </div>
                            {t.role === 'user' && <UserIcon className="w-6 h-6 text-gray-500 flex-shrink-0 mt-1" />}
                        </div>
                    ))}
                 </div>
            </div>

            <footer className="flex-shrink-0 p-6 text-center bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center justify-center">
                    <Button onClick={isSessionActive ? stopSession : startSession} size="lg" className="rounded-full !w-20 !h-20 shadow-lg" disabled={status === 'CONNECTING'}>
                        {isSessionActive ? <StopIcon className="w-8 h-8"/> : <LiveIcon className="w-8 h-8" />}
                    </Button>
                    <p className="mt-3 font-semibold text-gray-700 dark:text-gray-200 capitalize">
                        {status.toLowerCase().replace('_', ' ')}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LiveAssistant;