'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { MessageSquare, Send, X, Image as ImageIcon, ExternalLink } from 'lucide-react';

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage?: () => void;
}

const STORAGE_KEY = 'sala_principal_chat_v1';
const EXPIRE_TIME_MS = 3 * 60 * 1000; // 3 minutos
const CHUNK_SIZE = 10000; // 10 KB por pacote

export function ChatPanel({ isOpen, onClose, onNewMessage }: ChatPanelProps) {
  const room = useRoomContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const incomingChunksRef = useRef<Record<string, { total: number; chunks: string[] }>>({});

  // Carrega mensagens salvas e remove as expiradas (>3min)
  const loadAndCleanMessages = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ChatMessage[] = JSON.parse(stored);
        const now = Date.now();
        const valid = parsed.filter((m) => now - m.timestamp < EXPIRE_TIME_MS);
        setMessages(valid);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      }
    } catch (e) {
      console.error('Erro ao carregar mensagens do localStorage:', e);
    }
  }, []);

  const saveMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadAndCleanMessages();
    const interval = setInterval(() => {
      loadAndCleanMessages();
    }, 5000); // Limpeza a cada 5s

    return () => clearInterval(interval);
  }, [loadAndCleanMessages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Função centralizada para adicionar mensagens com desduplicação rígida por ID e conteúdo
  const addMessageToState = useCallback(
    (incomingMsg: ChatMessage) => {
      setMessages((prev) => {
        // Desduplicação por ID exato ou por conteúdo + remetente nos últimos 3 segundos
        const isDuplicate = prev.some(
          (m) =>
            m.id === incomingMsg.id ||
            (m.senderId === incomingMsg.senderId &&
              m.text === incomingMsg.text &&
              Math.abs(m.timestamp - incomingMsg.timestamp) < 3000)
        );

        if (isDuplicate) return prev;

        const now = Date.now();
        const updated = [...prev, incomingMsg].filter((m) => now - m.timestamp < EXPIRE_TIME_MS);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }

        if (onNewMessage) {
          onNewMessage();
        }

        return updated;
      });
    },
    [onNewMessage]
  );

  // Escuta dados recebidos de outros participantes via LiveKit DataChannel
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: { identity: string; name?: string }
    ) => {
      try {
        const decoder = new TextDecoder();
        const strData = decoder.decode(payload);

        let parsedData;
        try {
          parsedData = JSON.parse(strData);
        } catch {
          // Se for mensagem em texto simples
          if (strData && typeof strData === 'string') {
            const senderName = participant?.name || participant?.identity || 'Participante';
            const senderId = participant?.identity || 'outros';
            addMessageToState({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              senderName,
              senderId,
              text: strData,
              timestamp: Date.now(),
            });
          }
          return;
        }

        // Pacote fragmentado (chunking de imagem)
        if (parsedData && parsedData.chunkId && parsedData.chunkData) {
          const { chunkId, index, total, chunkData } = parsedData;

          if (!incomingChunksRef.current[chunkId]) {
            incomingChunksRef.current[chunkId] = { total, chunks: new Array(total).fill('') };
          }

          incomingChunksRef.current[chunkId].chunks[index] = chunkData;

          const allArrived = incomingChunksRef.current[chunkId].chunks.every((c) => c !== '');
          if (allArrived) {
            const fullJsonStr = incomingChunksRef.current[chunkId].chunks.join('');
            delete incomingChunksRef.current[chunkId];

            const incomingMsg: ChatMessage = JSON.parse(fullJsonStr);
            addMessageToState(incomingMsg);
          }
          return;
        }

        // Mensagem formatada
        if (parsedData && (parsedData.text !== undefined || parsedData.imageUrl || parsedData.id)) {
          const senderName = parsedData.senderName || participant?.name || participant?.identity || 'Participante';
          const senderId = parsedData.senderId || participant?.identity || 'outros';

          const formattedMsg: ChatMessage = {
            id: parsedData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            senderName,
            senderId,
            text: parsedData.text || '',
            imageUrl: parsedData.imageUrl,
            timestamp: parsedData.timestamp || Date.now(),
          };

          addMessageToState(formattedMsg);
        }
      } catch (err) {
        console.error('Erro ao processar mensagem do DataChannel:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, addMessageToState]);

  // Processa e compacta imagem para Base64 leve (max 400px)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione apenas arquivos de imagem (PNG, JPG, GIF, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setSelectedImage(compressedBase64);
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || isSending || !room) return;

    setIsSending(true);

    const localParticipant = room.localParticipant;
    const senderName = localParticipant.name || localParticipant.identity || 'Eu';
    const senderId = localParticipant.identity;
    const textToSend = inputText.trim();

    const newMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderName,
      senderId,
      text: textToSend,
      imageUrl: selectedImage || undefined,
      timestamp: Date.now(),
    };

    try {
      const fullJsonStr = JSON.stringify(newMsg);
      const encoder = new TextEncoder();

      // Transmite via DataChannel confiável para todos os membros da sala
      if (fullJsonStr.length <= CHUNK_SIZE) {
        const payload = encoder.encode(fullJsonStr);
        await localParticipant.publishData(payload, {
          reliable: true,
        });
      } else {
        const chunkId = newMsg.id;
        const totalChunks = Math.ceil(fullJsonStr.length / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
          const chunkData = fullJsonStr.substr(i * CHUNK_SIZE, CHUNK_SIZE);
          const packet = JSON.stringify({
            chunkId,
            index: i,
            total: totalChunks,
            chunkData,
          });

          const payload = encoder.encode(packet);
          await localParticipant.publishData(payload, {
            reliable: true,
          });
        }
      }

      // Adiciona localmente apenas UMA vez para o remetente
      addMessageToState(newMsg);

      setInputText('');
      setSelectedImage(null);
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Formata URLs em links clicáveis
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
              Envie mensagens, links ou imagens. Elas ficam armazenadas por <strong>3 minutos</strong> e expiram automaticamente!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === room?.localParticipant.identity;
            const senderName = msg.senderName || 'Participante';
            const initial = senderName.slice(0, 2).toUpperCase();
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.id} className="flex items-start gap-2.5 group">
                {/* Avatar com Inicial */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-md ${
                    isMe ? 'bg-[#5865F2]' : 'bg-[#23a55a]'
                  }`}
                >
                  {initial}
                </div>

                {/* Conteúdo da Mensagem */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white truncate">{senderName}</span>
                    <span className="text-[10px] text-[#949ba4]">{timeStr}</span>
                  </div>

                  <div className="text-xs text-[#dbdee1] bg-[#1e1f22] p-2.5 rounded-lg border border-[#313338] break-words font-normal leading-relaxed space-y-2">
                    {msg.text && <div>{renderFormattedText(msg.text)}</div>}

                    {/* Imagem em anexo */}
                    {msg.imageUrl && (
                      <div className="mt-1 rounded-md overflow-hidden border border-[#383a40] bg-black max-w-full cursor-pointer">
                        <img
                          src={msg.imageUrl}
                          alt="Imagem compartilhada"
                          onClick={() => setPreviewImageModal(msg.imageUrl || null)}
                          className="max-h-48 w-auto object-cover hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview de imagem pronta para enviar */}
      {selectedImage && (
        <div className="p-2 bg-[#1e1f22] border-t border-[#313338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded border border-[#5865F2]" />
            <span className="text-xs text-[#dbdee1] font-semibold">Imagem pronta para envio</span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 text-[#f23f43] hover:bg-[#f23f43]/10 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulário de Envio de Mensagem */}
      <form onSubmit={handleSend} className="p-3 bg-[#1e1f22] border-t border-[#313338]">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageFileSelect}
          accept="image/*"
          className="hidden"
        />

        <div className="relative flex items-center gap-2">
          {/* Botão Anexar Imagem */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-[#949ba4] hover:text-white border border-[#383a40] transition-colors cursor-pointer shrink-0"
            title="Anexar imagem (PNG, JPG, GIF)"
          >
            <ImageIcon className="w-4 h-4 text-[#5865F2]" />
          </button>

          {/* Campo de Texto */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Conversar... (links e imagens)"
            disabled={isSending}
            maxLength={1000}
            className="flex-1 pl-3 pr-10 py-2.5 rounded-lg bg-[#2b2d31] border border-[#383a40] text-white placeholder-[#80848e] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent transition-all"
          />

          {/* Botão Enviar */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isSending}
            className="absolute right-1.5 p-1.5 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-white disabled:opacity-30 disabled:hover:bg-[#5865F2] transition-all cursor-pointer"
            title="Enviar mensagem"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Modal de Zoom de Imagem Ampliada */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImageModal} alt="Ampliada" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-[#f23f43] font-bold text-sm flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Fechar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
