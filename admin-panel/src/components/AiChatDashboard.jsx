import React, { useEffect, useRef, useState } from 'react';
import { FiCpu, FiMessageSquare, FiRefreshCw, FiSend, FiX, FiZap } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getAiInsights, streamChatMessage } from '../services/api';
import { formatMeticalDisplay } from '../utils/currency';

const formatCurrency = (value) => formatMeticalDisplay(Number(value) || 0);

const INITIAL_MESSAGE = {
  sender: 'ai',
  text: 'Ola! Sou seu consultor estrategico de IA. Como posso ajudar com a performance do seu restaurante hoje?',
};

function AiChatDashboard({ openRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Processando...');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);

  const messagesEndRef = useRef(null);
  const streamControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, isOpen, messages]);

  useEffect(() => {
    let intervalId;

    if (isLoading || insightsLoading) {
      const statuses = [
        'Analisando vendas...',
        'Cruzando dados do menu...',
        'Calculando tendencias...',
        'Gerando recomendacoes...',
        'Quase pronto...',
      ];
      let index = 0;

      intervalId = setInterval(() => {
        index = (index + 1) % statuses.length;
        setLoadingStatus(statuses[index]);
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [insightsLoading, isLoading]);

  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!openRequest?.nonce) return;
    setActiveTab(openRequest.tab === 'insights' ? 'insights' : 'chat');
    setIsOpen(true);
  }, [openRequest]);

  useEffect(() => {
    const handleOpen = (event) => {
      const { tab } = event.detail || {};
      setActiveTab(tab === 'insights' ? 'insights' : 'chat');
      setIsOpen(true);
    };

    window.addEventListener('admin:open-ai', handleOpen);
    return () => {
      window.removeEventListener('admin:open-ai', handleOpen);
    };
  }, []);

  const loadInsights = async () => {
    try {
      setInsightsLoading(true);
      const response = await getAiInsights();
      setInsightsData(response);
    } catch (error) {
      toast.error('Erro ao carregar insights.');
    } finally {
      setInsightsLoading(false);
    }
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

  const sendMessage = async (event) => {
    event?.preventDefault();

    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }, { sender: 'ai', text: '...' }]);
    setInputValue('');
    setIsLoading(true);

    const controller = new AbortController();
    streamControllerRef.current = controller;
    let streamedText = '';

    try {
      await streamChatMessage(userMessage, {
        signal: controller.signal,
        onEvent: (streamEvent) => {
          if (streamEvent.type === 'chunk') {
            streamedText += streamEvent.content || '';
            updateLastAiMessage(streamedText);
            return;
          }

          if (streamEvent.type === 'error') {
            throw new Error(streamEvent.message);
          }
        },
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Erro no consultor IA.');
        updateLastAiMessage('Desculpe, tive um problema tecnico. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
      streamControllerRef.current = null;
    }
  };

  return (
    <>


      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar painel do consultor IA"
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-red-300 bg-red-100 shadow-2xl sm:w-[450px]">
            <div className="border-b border-red-300 bg-red-800 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/15 p-2 text-white">
                    <FiCpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Consultor IA</h3>
                    <p className="text-xs text-red-200">Inteligencia estrategica para seu negocio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-red-200 hover:bg-white/10 hover:text-white"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 flex gap-2 rounded-2xl bg-black/10 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('insights')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
                    activeTab === 'insights' ? 'bg-white text-red-800 shadow-sm' : 'text-red-200 hover:text-white'
                  }`}
                >
                  <FiZap className="h-4 w-4" />
                  Insights Rapidos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
                    activeTab === 'chat' ? 'bg-white text-red-800 shadow-sm' : 'text-red-200 hover:text-white'
                  }`}
                >
                  <FiMessageSquare className="h-4 w-4" />
                  Chat Consultivo
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-red-100 p-6">
              {activeTab === 'insights' ? (
                <div className="space-y-6">
                  {!insightsData && !insightsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="mb-6 rounded-full bg-red-200 p-6 text-red-800">
                        <FiZap className="h-12 w-12" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">Gerar Analise 360</h4>
                      <p className="mt-2 text-sm text-slate-500">
                        Analisaremos vendas, menu e operação dos ultimos 30 dias para voce.
                      </p>
                      <button
                        type="button"
                        onClick={loadInsights}
                        className="mt-8 flex items-center gap-2 rounded-2xl bg-red-800 px-8 py-4 font-bold text-white shadow-xl shadow-red-300 transition hover:bg-red-900 active:scale-95"
                      >
                        <FiRefreshCw className="h-5 w-5" />
                        Comecar Analise
                      </button>
                    </div>
                  ) : insightsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-red-700"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-red-700 [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-red-700 [animation-delay:-0.3s]"></div>
                        </div>
                        <span className="animate-pulse text-sm font-medium italic text-slate-600">{loadingStatus}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Vendas</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">{insightsData?.context_summary?.total_orders || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Faturamento</p>
                          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(insightsData?.context_summary?.total_revenue)}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="px-1 text-xs font-bold uppercase tracking-widest text-slate-400">Recomendacoes IA</p>
                        {(insightsData?.items || []).map((item, index) => (
                          <div key={`${index}-${item}`} className="rounded-2xl border border-red-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
                            {item}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={loadInsights}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <FiRefreshCw className="h-4 w-4" />
                        Recalcular Insights
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="flex-1 space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                            msg.sender === 'user' ? 'bg-red-800 text-white' : 'border border-slate-100 bg-white text-slate-700'
                          }`}
                        >
                          {msg.sender === 'ai' && msg.text === '...' ? (
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></div>
                                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
                                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
                              </div>
                              <span className="text-[10px] italic text-slate-400">{loadingStatus}</span>
                            </div>
                          ) : (
                            <p className={`whitespace-pre-wrap ${msg.sender === 'user' ? 'text-white' : 'text-slate-700'}`}>{msg.text}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'chat' ? (
              <div className="border-t border-slate-100 bg-white p-4">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isLoading ? 'IA pensando...' : 'Pergunte sobre sua operação...'}
                    disabled={isLoading}
                    className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-800 text-white shadow-lg shadow-red-300 transition-all hover:bg-red-900 disabled:opacity-50 active:scale-95"
                  >
                    <FiSend className="h-5 w-5" />
                  </button>
                </form>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}
    </>
  );
}

export default AiChatDashboard;
