import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  createConversation,
  getConversation,
  listConversations,
} from '../lib/api';
import { createChatSocket } from '../lib/socket';
import { getToken } from '../lib/token';
import type { Conversation, Message } from '../lib/types';

interface TokenPayload {
  token: string;
}
interface DonePayload {
  message: Message;
}
interface ErrorPayload {
  message: string;
}

export interface UseChat {
  conversations: Conversation[];
  activeId: string | null;
  messages: Message[];
  streaming: string;
  isStreaming: boolean;
  error: string | null;
  selectConversation: (id: string) => Promise<void>;
  startConversation: (input?: { title?: string; systemPrompt?: string }) => Promise<void>;
  sendMessage: (content: string) => void;
}

export function useChat(): UseChat {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const refreshConversations = useCallback(async () => {
    const list = await listConversations();
    setConversations(list);
    return list;
  }, []);

  const selectConversation = useCallback(async (id: string) => {
    const data = await getConversation(id);
    setActiveId(id);
    setMessages(data.messages);
    setStreaming('');
    setError(null);
  }, []);

  const startConversation = useCallback(
    async (input?: { title?: string; systemPrompt?: string }) => {
      const conv = await createConversation(input ?? {});
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
      setStreaming('');
      setError(null);
    },
    [],
  );

  // Bootstrap: carrega conversas; cria uma se não houver nenhuma.
  useEffect(() => {
    void (async () => {
      try {
        const list = await refreshConversations();
        if (list.length > 0) {
          await selectConversation(list[0].id);
        } else {
          await startConversation({ title: 'Primeira conversa' });
        }
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [refreshConversations, selectConversation, startConversation]);

  // Socket de streaming (autenticado com o token JWT).
  useEffect(() => {
    const socket = createChatSocket(getToken() ?? '');
    socketRef.current = socket;

    socket.on('token', ({ token }: TokenPayload) => {
      setStreaming((prev) => prev + token);
    });
    socket.on('done', ({ message }: DonePayload) => {
      setMessages((prev) => [...prev, message]);
      setStreaming('');
      setIsStreaming(false);
      void refreshConversations();
    });
    socket.on('error', ({ message }: ErrorPayload) => {
      setError(message);
      setStreaming('');
      setIsStreaming(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [refreshConversations]);

  const sendMessage = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text || !activeId || isStreaming) return;

      const userMessage: Message = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: text,
      };
      setMessages((prev) => [...prev, userMessage]);
      setStreaming('');
      setIsStreaming(true);
      setError(null);
      socketRef.current?.emit('message', { conversationId: activeId, content: text });
    },
    [activeId, isStreaming],
  );

  return {
    conversations,
    activeId,
    messages,
    streaming,
    isStreaming,
    error,
    selectConversation,
    startConversation,
    sendMessage,
  };
}
