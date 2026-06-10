import { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import type { AuthUser } from '../lib/types';
import { Composer } from './Composer';
import { ConversationList } from './ConversationList';
import { MessageBubble } from './MessageBubble';

interface Props {
  user: AuthUser;
  onSignOut: () => void;
}

export function ChatApp({ user, onSignOut }: Props) {
  const {
    conversations,
    activeId,
    messages,
    streaming,
    isStreaming,
    error,
    selectConversation,
    startConversation,
    sendMessage,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex h-screen">
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => void selectConversation(id)}
        onNew={() => void startConversation()}
      />

      <main className="flex flex-1 flex-col bg-slate-50">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <span className="text-sm text-slate-500">
            Logado como <strong className="text-slate-700">{user.displayName}</strong>
          </span>
          <button
            onClick={onSignOut}
            className="rounded-lg px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Sair
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {isEmpty && (
              <div className="mt-20 text-center text-slate-400">
                <p className="text-lg">Comece a conversar 👋</p>
                <p className="text-sm">As respostas chegam em streaming, token a token.</p>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {isStreaming && (
              <MessageBubble
                message={{ role: 'assistant', content: streaming || '…' }}
                pending
              />
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <Composer disabled={isStreaming || !activeId} onSend={sendMessage} />
      </main>
    </div>
  );
}
