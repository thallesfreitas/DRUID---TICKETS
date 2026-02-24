import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { LegalView } from '@/components/views/LegalView';

describe('LegalView', () => {
  it('renders title and plain text content', () => {
    render(
      <LegalView
        title="Ajuda"
        content={`Linha 1
Linha 2`}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Ajuda' })).toBeInTheDocument();
    expect(screen.getByText('Linha 1')).toBeInTheDocument();
    expect(screen.getByText('Linha 2')).toBeInTheDocument();
  });

  it('renders ReactNode content', () => {
    const content = <div data-testid="node-content">Conteúdo rico</div> as ReactNode;

    render(<LegalView title="Privacidade" content={content} onBack={vi.fn()} />);

    expect(screen.getByTestId('node-content')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<LegalView title="Termos" content="Texto" onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /voltar ao início/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
