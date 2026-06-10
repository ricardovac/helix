import { useState, type KeyboardEvent } from 'react';

interface Props {
  disabled?: boolean;
  onSend: (content: string) => void;
}

export function Composer({ disabled = false, onSend }: Props) {
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Escreva uma mensagem… (Enter envia, Shift+Enter quebra linha)"
          aria-label="Mensagem"
          className="max-h-40 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          onClick={submit}
          disabled={disabled || value.trim().length === 0}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
