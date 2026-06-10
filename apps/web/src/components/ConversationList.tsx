import type { Conversation } from '../lib/types';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew }: Props) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h1 className="text-lg font-semibold text-slate-900">Helix</h1>
        <p className="text-xs text-slate-500">NestJS · React · Azure OpenAI</p>
      </div>

      <button
        onClick={onNew}
        className="m-3 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        + Nova conversa
      </button>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={[
              'w-full truncate rounded-lg px-3 py-2 text-left text-sm transition',
              c.id === activeId
                ? 'bg-brand-50 font-medium text-brand-700'
                : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            <span className="block truncate">{c.title}</span>
            <span className="text-xs text-slate-400">
              {c.model} · {c.messageCount} msgs
            </span>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="px-3 py-2 text-sm text-slate-400">Nenhuma conversa ainda.</p>
        )}
      </nav>
    </aside>
  );
}
