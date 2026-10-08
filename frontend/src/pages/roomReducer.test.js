import { describe, expect, it } from 'vitest';

import { initialRoomState, roomReducer } from './roomReducer';

const ana = { id: 1, username: 'ana', score: 0 };
const bob = { id: 2, username: 'bob', score: 0 };

const reduce = (events, state = initialRoomState) => events.reduce(roomReducer, state);

describe('roomReducer', () => {
  it('replaces the roster with the server snapshot', () => {
    const state = reduce([{ type: 'EXISTING_PLAYERS', payload: [ana, bob] }]);

    expect(state.players).toEqual([ana, bob]);
  });

  it('adds joining players only once', () => {
    const state = reduce([
      { type: 'EXISTING_PLAYERS', payload: [ana] },
      { type: 'PLAYER_JOIN', payload: bob },
      { type: 'PLAYER_JOIN', payload: bob },
    ]);

    expect(state.players).toEqual([ana, bob]);
  });

  it('removes players who leave', () => {
    const state = reduce([
      { type: 'EXISTING_PLAYERS', payload: [ana, bob] },
      { type: 'PLAYER_LEAVE', payload: { id: ana.id } },
    ]);

    expect(state.players).toEqual([bob]);
  });

  it('appends chat messages in order', () => {
    const state = reduce([
      { type: 'CHAT', payload: { user: 'ana', message: 'hi' } },
      { type: 'CHAT', payload: { user: 'bob', message: 'hello' } },
    ]);

    expect(state.messages.map((m) => m.message)).toEqual(['hi', 'hello']);
  });

  it('walks through a round of the game', () => {
    const themed = reduce([{ type: 'SHOW_THEME', payload: { theme: 'a cat' } }]);
    expect(themed).toMatchObject({ gameStarted: true, theme: 'a cat', drawingPhase: false });

    const drawing = roomReducer(themed, { type: 'ROUND_START', payload: { duration: 60, round: 1, maxRounds: 3 } });
    expect(drawing).toMatchObject({ drawingPhase: true, roundDuration: 60, currentRound: 1, maxRounds: 3 });

    const ended = roomReducer(drawing, { type: 'ROUND_END', payload: { round: 1 } });
    expect(ended).toMatchObject({ gameStarted: true, drawingPhase: false, theme: '' });

    const over = roomReducer(ended, { type: 'GAME_END' });
    expect(over.gameStarted).toBe(false);
  });

  it('ignores events that do not affect room state', () => {
    const state = reduce([{ type: 'EXISTING_PLAYERS', payload: [ana] }]);

    expect(roomReducer(state, { type: 'DRAW', payload: {} })).toBe(state);
  });
});
