'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@livekit/components-react';
import { MessageSquare, Send, X, ExternalLink } from 'lucide-react';

export interface StoredChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage?: () => void;
}

const STORAGE_KEY = 'sala_principal_chat_v2';
const EXPIRE_TIME_MS = 3 * 60 * 1000; // 3 minutos

export function ChatPanel({ isOpen, onClose, onNewMessage }: ChatPanelProps) {
  // Hook Oficial da LiveKit para Chat WebRTC em Tempo Real
  const { chatMessages, send, isSending } = useChat();

  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega histórico do localStorage e descarta mensagens com mais de 3 minutos
  const loadAndCleanMessages = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredChatMessage[] = JSON.parse(stored);
        const now = Date.now();
        const valid = parsed.filter((m) => now - m.timestamp < EXPIRE_TIME_MS);
        setMessages(valid);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      }
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Limpeza automática a cada 5 segundos para mensagens > 3 minutos
  useEffect(() => {
    loadAndCleanMessages();
    const interval = setInterval(() => {
      loadAndCleanMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadAndCleanMessages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Sincroniza mensagens recebidas do hook oficial useChat() do LiveKit
  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0) return;

    setMessages((prev) => {
      let updated = [...prev];
      let hasNew = false;

      chatMessages.forEach((lkMsg) => {
        const senderName = lkMsg.from?.name || lkMsg.from?.identity || 'Participante';
        const senderId = lkMsg.from?.identity || 'desconhecido';
        const msgId = lkMsg.id || `${lkMsg.timestamp}-${senderId}-${lkMsg.message}`;

        if (!updated.some((m) => m.id === msgId)) {
          updated.push({
            id: msgId,
            senderName,
            senderId,
            text: lkMsg.message,
            timestamp: lkMsg.timestamp,
          });
          hasNew = true;
        }
      });

      if (hasNew) {
        const now = Date.now();
        updated = updated.filter((m) => now - m.timestamp < EXPIRE_TIME_MS);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        if (onNewMessage) onNewMessage();
        return updated;
      }

      return prev;
    });
  }, [chatMessages, onNewMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await send(messageText);
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  // Parser de URLs para criar links azul clicáveis
  const renderFormattedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5865F2] underline hover:text-[#7983F5] font-semibold break-all inline-flex items-center gap-1"
          >
            {part}
            <ExternalLink className="w-3 h-3 inline shrink-0" />
          </a>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full md:w-80 h-full bg-[#2b2d31] border-l border-[#1e1f22] flex flex-col z-20 shrink-0 select-none shadow-2xl relative">
      {/* Cabeçalho do Chat */}
      <div className="h-14 border-b border-[#1e1f22] px-4 flex items-center justify-between bg-[#2b2d31]">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <MessageSquare className="w-4 h-4 text-[#5865F2]" />
          <span>Bate-papo da Sala</span>
          <span className="px-2 py-0.5 rounded-full bg-[#1e1f22] text-[#23a55a] text-[10px] font-extrabold uppercase">
            Limpeza 3m
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-[#35373c] text-[#949ba4] hover:text-white transition-colors cursor-pointer"
          title="Fechar Bate-papo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#2b2d31]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#949ba4] space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#1e1f22] flex items-center justify-center text-[#5865F2]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[#dbdee1]">Nenhuma mensagem ativa</p>
            <p className="text-[11px]">
              Envie mensagens e links para a sala! Elas expiram automaticamente após <strong>3 minutos</strong>.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderName = msg.senderName || 'Participante';
            const initial = senderName.slice(0, 2).toUpperCase();
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.id} className="flex items-start gap-2.5 group">
                {/* Avatar com Inicial */}
                <div className="w-7 h-7 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-md">
                  {initial}
                </div>

                {/* Conteúdo da Mensagem */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white truncate">{senderName}</span>
                    <span className="text-[10px] text-[#949ba4]">{timeStr}</span>
                  </div>

                  <div className="text-xs text-[#dbdee1] bg-[#1e1f22] p-2.5 rounded-lg border border-[#313338] break-words font-normal leading-relaxed">
                    {renderFormattedText(msg.text)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulário de Envio de Mensagem */}
      <form onSubmit={handleSend} className="p-3 bg-[#1e1f22] border-t border-[#313338]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Conversar em sala-principal..."
            disabled={isSending}
            maxLength={1000}
            className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[#2b2d31] border border-[#383a40] text-white placeholder-[#80848e] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="absolute right-1.5 p-1.5 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-30 disabled:hover:bg-[#5865F2] transition-all cursor-pointer"
            title="Enviar mensagem"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
