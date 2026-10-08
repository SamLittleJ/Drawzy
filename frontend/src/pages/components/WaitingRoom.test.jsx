import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import WaitingRoom from './WaitingRoom';

function renderWaitingRoom(props = {}) {
  const handlers = { onStart: vi.fn(), onSendChat: vi.fn() };
  render(
    <MemoryRouter>
      <WaitingRoom
        roomCode="ABC123"
        players={[{ id: 1, username: 'ana' }, { id: 2, username: 'bob' }]}
        messages={[{ user: 'ana', message: 'ready?' }]}
        {...handlers}
        {...props}
      />
    </MemoryRouter>
  );
  return handlers;
}

describe('WaitingRoom', () => {
  it('shows the room code, players and chat history', () => {
    renderWaitingRoom();

    expect(screen.getByText('Room Code: ABC123')).toBeInTheDocument();
    expect(screen.getByText('Players ready: 2')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('ready?')).toBeInTheDocument();
  });

  it('starts the game', async () => {
    const { onStart } = renderWaitingRoom();

    await userEvent.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(onStart).toHaveBeenCalledOnce();
  });

  it('sends trimmed chat messages on Enter and clears the input', async () => {
    const { onSendChat } = renderWaitingRoom();
    const input = screen.getByRole('textbox', { name: 'Chat message' });

    await userEvent.type(input, '  hello there  {Enter}');

    expect(onSendChat).toHaveBeenCalledWith('hello there');
    expect(input).toHaveValue('');
  });

  it('does not send blank messages', async () => {
    const { onSendChat } = renderWaitingRoom();

    await userEvent.type(screen.getByRole('textbox', { name: 'Chat message' }), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSendChat).not.toHaveBeenCalled();
  });
});
