import React, { useEffect, useRef, useState } from 'react';
import { getMenu, sendChatMessage, sendVoiceChat, streamChatMessage, getAiGreeting } from '../services/api';
import { BASE_URL } from '../config';
import { toast } from 'react-toastify';
import { VoiceRecorder } from '@langx/capacitor-voice-recorder';
import { Capacitor } from '@capacitor/core';

const INITIAL_MESSAGE = {
  sender: 'ai',
  text: 'Olá! Sou seu assistente virtual. Pergunte-me sobre os pratos do cardápio!',
};

const buildSuggestionLabel = (dish) => `Quero saber mais sobre ${dish.name}`;

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState('Processando...');
  const messagesEndRef = useRef(null);
  const streamControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadMenuSuggestions = async () => {
      try {
        const menu = await getMenu();
        const items = Array.isArray(menu) ? menu.slice(0, 4).map((dish) => ({
          id: dish.id,
          label: buildSuggestionLabel(dish),
        })) : [];
        setSuggestions(items);
      } catch (_) { }
    };

    const loadGreeting = async () => {
      try {
        const response = await getAiGreeting();
        if (response.greeting) {
          setMessages([{ sender: 'ai', text: response.greeting }]);
        }
      } catch (_) { }
    };

    loadMenuSuggestions();
    loadGreeting();

    return () => {
      streamControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isLoading) {
      const statuses = ['Lendo menu...', 'Analisando dados...', 'Gerando resposta...', 'Formatando sugestões...'];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % statuses.length;
        setLoadingStatus(statuses[i]);
      }, 2000);
    } else {
      setLoadingStatus('Processando...');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const updateLastAiMessage = (text) => {
    setMessages((prev) => {
      const next = [...prev];
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].sender === 'ai') {
          next[index] = { ...next[index], text };
          return next;
        }
      }
      return [...prev, { sender: 'ai', text }];
    });
  };

  const sendMessage = async (rawMessage) => {
    const userMessage = rawMessage.trim();
    if (!userMessage || isLoading) return;

    streamControllerRef.current?.abort();
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    if (!useStreaming) {
      try {
        const response = await sendChatMessage(userMessage);
        setMessages((prev) => [...prev, { sender: 'ai', text: response.reply }]);
        if (response.audio_url) {
          playAudio(response.audio_url);
        }
      } catch (error) {
        toast.error('Desculpe, não consegui me conectar ao assistente.');
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Ocorreu um erro. Tente novamente mais tarde.' }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const controller = new AbortController();
    streamControllerRef.current = controller;
    let streamedText = '';
    setMessages((prev) => [...prev, { sender: 'ai', text: '...' }]);

    try {
      await streamChatMessage(userMessage, {
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === 'chunk') {
            streamedText += event.content || '';
            updateLastAiMessage(streamedText);
          }

          if (event.type === 'error') {
            throw new Error(event.message || 'Erro no streaming.');
          }
        },
      });

      if (!streamedText.trim()) {
        updateLastAiMessage('Não recebi conteúdo da IA desta vez. Tente novamente.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('O streaming do assistente falhou.');
        updateLastAiMessage('Ocorreu um erro durante a resposta em tempo real. Tente novamente.');
      }
    } finally {
      if (streamControllerRef.current === controller) {
        streamControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    await sendMessage(inputValue);
  };

  const startRecording = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.info('Gravação de voz disponível apenas no aplicativo móvel.');
      return;
    }

    try {
      const { value } = await VoiceRecorder.canDeviceVoiceRecord();
      if (!value) {
        toast.error('Este dispositivo não suporta gravação de voz.');
        return;
      }

      const { value: permission } = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission) {
        toast.error('Permissão de microfone negada.');
        return;
      }

      await VoiceRecorder.startRecording();
      setIsRecording(true);
      toast.info('Gravando...');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Falha ao iniciar microfone.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsLoading(true);

    try {
      const result = await VoiceRecorder.stopRecording();
      const base64Data = result.value.recordDataBase64;
      const mimeType = result.value.mimeType;

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await sendVoiceChat(formData);

      setMessages((prev) => [...prev, { sender: 'user', text: response.transcription || 'Áudio enviado' }]);
      if (response.reply) {
        setMessages((prev) => [...prev, { sender: 'ai', text: response.reply }]);
      }
      if (response.audio_url) {
        playAudio(response.audio_url);
      }
    } catch (error) {
      console.error('Erro ao processar gravação:', error);
      toast.error('Erro ao processar sua voz.');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (url) => {
    const absoluteUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const audio = new Audio(absoluteUrl);
    audio.play().catch((error) => console.error('Erro ao reproduzir áudio:', error));
  };

  return (
    <>
      <div className="fixed right-4 bottom-6 sm:right-8 sm:bottom-8 z-50">
        <button
          onClick={toggleChat}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 w-16 h-16 flex items-center justify-center group"
          aria-label="Abrir chat com assistente"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse border-2 border-white"></div>
            </>
          )}
        </button>
      </div>

      <div className={`fixed right-4 bottom-24 sm:right-8 sm:bottom-28 z-40 w-80 sm:w-96 h-[460px] sm:h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transform transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'} origin-bottom-right`}>
        <div className="bg-gray-800 text-white p-4 rounded-t-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Assistente Virtual</h3>
              <p className="mt-1 text-xs text-gray-300">
                Compare resposta normal e streaming em tempo real.
              </p>
            </div>
            <button onClick={toggleChat} className="text-gray-300 hover:text-white">&times;</button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-sm">
            <span className="text-gray-200">{useStreaming ? 'Modo streaming' : 'Modo normal'}</span>
            <button
              type="button"
              onClick={() => setUseStreaming((value) => !value)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${useStreaming ? 'bg-emerald-500' : 'bg-slate-500'}`}
              aria-pressed={useStreaming}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${useStreaming ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
          {suggestions.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Sugestões rápidas</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    disabled={isLoading || isRecording}
                    onClick={() => sendMessage(suggestion.label)}
                    className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((msg, index) => (
            <div key={`${msg.sender}-${index}-${msg.text.slice(0, 12)}`} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg text-white max-w-xs ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-red-600'}`}>
                {msg.sender === 'ai' && msg.text === '...' ? (
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                    <span className="text-xs font-medium italic animate-pulse">{loadingStatus}</span>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && !useStreaming && (
            <div className="flex justify-start">
              <div className="p-3 rounded-lg bg-gray-300">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-500/60 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                  <span className="text-xs font-medium italic text-gray-600 animate-pulse">{loadingStatus}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {Capacitor.isNativePlatform() && (
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-200 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
            <input
              type="text"
              placeholder={isLoading ? 'Aguarde...' : 'Digite sua pergunta...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || isRecording}
              className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
            <button type="submit" disabled={isLoading || isRecording || !inputValue.trim()} className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Chat;
