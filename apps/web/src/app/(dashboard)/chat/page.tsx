'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Send, Plus, Search, User, Wifi, WifiOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/RoleBadge';

function getSocketBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return apiUrl.replace(/\/api(\/v1)?\/?$/, '');
}

function ChatContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialConvId = searchParams?.get('c') || '';

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialConvId);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const loadConversations = async (q?: string) => {
    try {
      const res = await api.get('/chat/conversations', { params: q ? { q } : {} });
      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(initialConvId || list[0].id);
      }
    } catch {
      showToast('Erro ao carregar conversas.', 'error');
    }
  };

  const loadMessages = async (convId: string) => {
    if (!convId) return;
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
      await api.post(`/chat/conversations/${convId}/read`);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      showToast('Sem permissão ou erro ao carregar histórico.', 'error');
    }
  };

  useEffect(() => {
    loadConversations();
    api
      .get('/profiles/members', { params: { limit: 50 } })
      .then((res) => setMembers(res.data?.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket = io(getSocketBaseUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (selectedId) {
        socket.emit('join_conversation', selectedId);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      loadConversations(search);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_conversation', selectedId);
    }
  }, [selectedId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !text.trim()) return;
    const payload = { conversationId: selectedId, content: text.trim() };

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', payload, async (ack: any) => {
        if (ack?.ok) {
          setText('');
        } else {
          showToast(ack?.error || 'Erro ao enviar mensagem.', 'error');
        }
      });
    } else {
      try {
        const res = await api.post(`/chat/conversations/${selectedId}/messages`, {
          content: payload.content,
        });
        setMessages((prev) => [...prev, res.data]);
        setText('');
      } catch (err: any) {
        showToast(err.response?.data?.error || 'Erro ao enviar mensagem.', 'error');
      }
    }
  };

  const handleCreateConversation = async (targetProfileId: string) => {
    try {
      const res = await api.post('/chat/conversations', {
        profileIds: [targetProfileId],
        isGroup: false,
      });
      setNewChatOpen(false);
      await loadConversations();
      setSelectedId(res.data.id);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Erro ao iniciar conversa.', 'error');
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const otherMember = selectedConv?.members?.find((m: any) => m.profileId !== user?.profile?.id)?.profile;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <MessageSquare className="text-royal-gold" size={24} /> Chat Privado
          </h1>
          <p className="text-xs text-white/50 mt-1 inline-flex items-center gap-2">
            {connected ? (
              <>
                <Wifi size={12} className="text-emerald-400" /> Conectado em tempo real (Socket.IO)
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-amber-400" /> Modo REST / reconectando...
              </>
            )}
          </p>
        </div>
        <Button size="sm" onClick={() => setNewChatOpen(true)}>
          <Plus size={14} /> Nova Conversa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[540px]">
        <aside className="bg-graphite border border-white/5 rounded-sm flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  loadConversations(e.target.value);
                }}
                className="w-full bg-obsidian border border-white/10 rounded-sm pl-9 pr-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {conversations.length === 0 ? (
              <p className="p-6 text-xs text-white/40 text-center">Nenhuma conversa iniciada.</p>
            ) : (
              conversations.map((conv) => {
                const peer = conv.members?.find((m: any) => m.profileId !== user?.profile?.id)?.profile;
                const active = conv.id === selectedId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-colors ${
                      active ? 'bg-royal-gold/10 border-l-2 border-l-royal-gold' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {conv.name || peer?.name || 'Conversa'}
                      </p>
                      <p className="text-[11px] text-white/40 truncate">
                        {conv.messages?.[0]?.content || 'Sem mensagens ainda'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-royal-gold text-obsidian rounded-full text-[10px] font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="lg:col-span-2 bg-graphite border border-white/5 rounded-sm flex flex-col min-h-[500px]">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-xs text-white/40">
              Selecione ou inicie uma conversa privada.
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-obsidian border border-white/10 flex items-center justify-center overflow-hidden">
                    {otherMember?.avatar ? (
                      <img src={otherMember.avatar} alt={otherMember.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-royal-gold/50" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {selectedConv?.name || otherMember?.name || 'Conversa'}
                    </p>
                    {otherMember?.user?.role && <RoleBadge role={otherMember.user.role} />}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[420px]">
                {messages.map((m) => {
                  const mine = m.senderId === user?.profile?.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[80%] p-3 rounded-sm text-xs space-y-1 ${
                          mine
                            ? 'bg-royal-gold/15 border border-royal-gold/30 text-ivory'
                            : 'bg-obsidian border border-white/10 text-white/80'
                        }`}
                      >
                        <p className="font-bold text-[10px] text-royal-gold">
                          {m.sender?.name} •{' '}
                          {new Date(m.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-3">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite sua mensagem privada..."
                  className="flex-1 bg-obsidian border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:outline-none focus:border-royal-gold/40"
                />
                <Button type="submit" disabled={!text.trim()}>
                  <Send size={14} />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      <Modal open={newChatOpen} onClose={() => setNewChatOpen(false)} title="Nova Conversa Privada">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {members
            .filter((m) => m.id !== user?.profile?.id)
            .map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleCreateConversation(m.id)}
                className="w-full text-left p-3 bg-obsidian border border-white/10 hover:border-royal-gold/40 rounded-sm flex items-center justify-between text-xs"
              >
                <span className="font-bold text-white">
                  {m.name} (#{m.user.passport})
                </span>
                <RoleBadge role={m.user.role} />
              </button>
            ))}
        </div>
      </Modal>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-96 bg-graphite/50 rounded-sm animate-pulse" />}>
      <ChatContent />
    </Suspense>
  );
}
