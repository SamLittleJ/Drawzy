import { describe, expect, it } from 'vitest';

import { initialRoomState, roomReducer } from './roomReducer';

const ana = { id: 1, username: 'ana', score: 0 };
const bob = { id: 2, username: 'bob', score: 0 };

const reduce = (events, state = initialRoomState) => events.reduce(roomReducer, state);
const inRoom = reduce([
  { type: 'WELCOME', payload: { id: ana.id, username: 'ana' } },
  { type: 'EXISTING_PLAYERS', payload: [ana, bob] },
]);

const turnStart = (overrides = {}) => ({
  type: 'TURN_START',
  payload: {
    round: 1,
    maxRounds: 3,
    drawer: { id: bob.id, username: 'bob' },
    duration: 60,
    timeLeft: 60,
    hint: '_______',
    guessed: [],
    scores: [],
    ...overrides,
  },
});

const notices = (state) => state.messages.filter((m) => m.system).map((m) => m.text);

describe('room presence and chat', () => {
  it('remembers who this player is and the roster', () => {
    expect(inRoom.self).toEqual({ id: ana.id, username: 'ana' });
    expect(inRoom.players).toEqual([ana, bob]);
  });

  it('adds joining players once and removes leaving ones', () => {
    const cid = { id: 3, username: 'cid' };
    const state = reduce(
      [
        { type: 'PLAYER_JOIN', payload: cid },
        { type: 'PLAYER_JOIN', payload: cid },
        { type: 'PLAYER_LEAVE', payload: { id: ana.id } },
      ],
      inRoom
    );

    expect(state.players).toEqual([bob, { ...cid, score: 0 }]);
  });

  it('keeps chat lines and shows errors as notices', () => {
    const state = reduce(
      [
        { type: 'CHAT', payload: { user: 'bob', message: 'hi' } },
        { type: 'ERROR', payload: { message: 'At least 2 players are needed to start a game.' } },
      ],
      inRoom
    );

    expect(state.messages).toEqual([
      { user: 'bob', message: 'hi' },
      { system: true, tone: 'error', text: 'At least 2 players are needed to start a game.' },
    ]);
  });
});

describe('a turn', () => {
  it('starts the game and hides the word from guessers', () => {
    const state = roomReducer(inRoom, turnStart());

    expect(state).toMatchObject({ gameStarted: true, phase: 'drawing', round: 1, maxRounds: 3, word: '', hint: '_______' });
    expect(state.drawer).toEqual({ id: bob.id, username: 'bob' });
    expect(notices(state)).toEqual(['bob is drawing now.']);
  });

  it('gives the word to the drawer', () => {
    const state = roomReducer(inRoom, turnStart({ drawer: { id: ana.id, username: 'ana' }, word: 'volcano' }));

    expect(state.word).toBe('volcano');
    expect(notices(state)).toEqual(['Your turn to draw!']);
  });

  it('numbers every turn so the canvas and timer can reset', () => {
    const state = reduce([turnStart(), turnStart()], inRoom);

    expect(state.turnId).toBe(inRoom.turnId + 2);
  });

  it('records correct guesses and updates the scores', () => {
    const state = reduce(
      [
        turnStart(),
        {
          type: 'CORRECT_GUESS',
          payload: {
            player: { id: ana.id, username: 'ana' },
            points: 18,
            scores: [
              { id: ana.id, score: 18 },
              { id: bob.id, score: 5 },
            ],
          },
        },
        { type: 'WORD', payload: { word: 'volcano' } },
      ],
      inRoom
    );

    expect(state.guessedIds).toEqual([ana.id]);
    expect(state.word).toBe('volcano');
    expect(state.players.map((p) => p.score)).toEqual([18, 5]);
    expect(notices(state)).toContain('ana guessed the word! +18');
  });

  it('reveals the word when the turn ends', () => {
    const state = reduce([turnStart(), { type: 'TURN_END', payload: { word: 'volcano', scores: [] } }], inRoom);

    expect(state).toMatchObject({ phase: 'turnEnd', word: 'volcano' });
    expect(notices(state)).toContain('The word was "volcano".');
  });
});

describe('the end of the game', () => {
  const leaderboard = [
    { ...bob, score: 25 },
    { ...ana, score: 18 },
  ];
  const finished = reduce([turnStart(), { type: 'GAME_END', payload: { leaderboard, winners: [bob.id] } }], inRoom);

  it('shows the results', () => {
    expect(finished).toMatchObject({ phase: 'gameOver', leaderboard, winnerIds: [bob.id] });
    expect(finished.players.map((p) => p.score)).toEqual([18, 25]);
  });

  it('goes back to the waiting room when the results are closed', () => {
    expect(roomReducer(finished, { type: 'CLOSE_RESULTS' })).toMatchObject({ gameStarted: false, phase: 'idle' });
  });
});

it('ignores events that only concern the canvas', () => {
  expect(roomReducer(inRoom, { type: 'DRAW', payload: {} })).toBe(inRoom);
});
