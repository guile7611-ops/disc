'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@livekit/components-react';
import { MessageSquare, Send, X, User } from 'lucide-react';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { chatMessages, send, isSending } = useChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const messageToSend = inputText.trim();
    setInputText('');

    try {
      await send(messageToSend);
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full md:w-80 h-full bg-[#2b2d31] border-l border-[#1e1f22] flex flex-col z-20 shrink-0 select-none shadow-2xl">
      {/* Cabeçalho do Chat */}
      <div className="h-14 border-b border-[#1e1f22] px-4 flex items-center justify-between bg-[#2b2d31]">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <MessageSquare className="w-4 h-4 text-[#5865F2]" />
          <span>Bate-papo da Sala</span>
          <span className="px-2 py-0.5 rounded-full bg-[#1e1f22] text-[#949ba4] text-xs font-semibold">
            {chatMessages.length}
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
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#949ba4] space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#1e1f22] flex items-center justify-center text-[#5865F2]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[#dbdee1]">Nenhuma mensagem ainda</p>
            <p className="text-[11px]">Envie uma mensagem para iniciar a conversa com a sala!</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const senderName = msg.from?.name || msg.from?.identity || 'Participante';
            const initial = senderName.slice(0, 2).toUpperCase();
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.id || msg.timestamp} className="flex items-start gap-3 group">
                {/* Avatar com Inicial */}
                <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                  {initial}
                </div>

                {/* Conteúdo da Mensagem */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white truncate">{senderName}</span>
                    <span className="text-[10px] text-[#949ba4]">{timeStr}</span>
                  </div>
                  <div className="text-xs text-[#dbdee1] bg-[#1e1f22] p-2.5 rounded-lg border border-[#313338] break-words font-normal leading-relaxed">
                    {msg.message}
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
            maxLength={500}
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
