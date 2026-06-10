import type { Message } from '../lib/types';

interface Props {
  message: Pick<Message, 'role' | 'content'>;
  pending?: boolean;
}

export function MessageBubble({ message, pending = false }: Props) {
  const isUser = message.role === 'user';

  return (
    <div
      data-role={message.role}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={[
          'max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm',
          isUser
            ? 'bg-brand-600 text-white'
            : 'border border-slate-200 bg-white text-slate-800',
        ].join(' ')}
      >
        {message.content}
        {pending && <span className="ml-1 animate-pulse">▋</span>}
      </div>
    </div>
  );
}
