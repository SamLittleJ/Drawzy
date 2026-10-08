import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import GameRoom from './GameRoom';

const ana = { id: 1, username: 'ana' };
const bob = { id: 2, username: 'bob' };

function renderGameRoom(props = {}) {
  const handlers = { onDraw: vi.fn(), onSendChat: vi.fn(), onCloseResults: vi.fn() };
  render(
    <MemoryRouter>
      <GameRoom
        self={ana}
        players={[
          { ...ana, score: 10 },
          { ...bob, score: 5 },
        ]}
        messages={[]}
        phase="drawing"
        round={1}
        maxRounds={3}
        drawer={bob}
        word=""
        hint="_______"
        turnId={1}
        timeLeft={60}
        guessedIds={[]}
        leaderboard={[]}
        winnerIds={[]}
        {...handlers}
        {...props}
      />
    </MemoryRouter>
  );
  return handlers;
}

describe('GameRoom', () => {
  it('shows guessers the hint and no drawing tools', () => {
    renderGameRoom();

    expect(screen.getByText('_______')).toBeInTheDocument();
    expect(screen.getByText(/bob is drawing/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Brush' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your guess...')).toBeInTheDocument();
  });

  it('shows the drawer the word and the tools', () => {
    renderGameRoom({ drawer: ana, word: 'volcano' });

    expect(screen.getByText('volcano')).toBeInTheDocument();
    expect(screen.getByText(/You are drawing/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Brush' })).toBeInTheDocument();
  });

  it('marks the drawer and the players who guessed', () => {
    renderGameRoom({ guessedIds: [ana.id] });

    expect(screen.getByTitle('Drawing').closest('li')).toHaveTextContent('bob');
    expect(screen.getByTitle('Guessed the word').closest('li')).toHaveTextContent('ana (you)');
  });

  it('sends guesses through the chat', async () => {
    const { onSendChat } = renderGameRoom();

    await userEvent.type(screen.getByRole('textbox', { name: 'Chat message' }), 'volcano{Enter}');

    expect(onSendChat).toHaveBeenCalledWith('volcano');
  });

  it('announces the winner and returns to the waiting room', async () => {
    const leaderboard = [
      { ...bob, score: 25 },
      { ...ana, score: 18 },
    ];
    const { onCloseResults } = renderGameRoom({ phase: 'gameOver', word: 'volcano', leaderboard, winnerIds: [bob.id] });

    const results = screen.getByRole('dialog', { name: 'Game results' });
    expect(within(results).getByText('bob wins!')).toBeInTheDocument();
    expect(screen.getByText(/Game over$/, { selector: 'div' })).toBeInTheDocument();
    expect(within(results).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['bob25', 'ana18']);

    await userEvent.click(within(results).getByRole('button', { name: 'Back to waiting room' }));
    expect(onCloseResults).toHaveBeenCalledOnce();
  });

  it('calls a tie a tie', () => {
    const leaderboard = [
      { ...ana, score: 20 },
      { ...bob, score: 20 },
    ];
    renderGameRoom({ phase: 'gameOver', leaderboard, winnerIds: [ana.id, bob.id] });

    expect(screen.getByText("It's a tie between ana and bob!")).toBeInTheDocument();
  });
});
