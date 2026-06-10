import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('renderiza o conteúdo da mensagem', () => {
    render(<MessageBubble message={{ role: 'assistant', content: 'Olá, mundo' }} />);
    expect(screen.getByText('Olá, mundo')).toBeInTheDocument();
  });

  it('alinha mensagens do usuário à direita', () => {
    const { container } = render(
      <MessageBubble message={{ role: 'user', content: 'oi' }} />,
    );
    const wrapper = container.querySelector('[data-role="user"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.className).toContain('justify-end');
  });

  it('mostra o cursor quando pending', () => {
    render(<MessageBubble message={{ role: 'assistant', content: 'digitando' }} pending />);
    expect(screen.getByText('▋')).toBeInTheDocument();
  });
});
