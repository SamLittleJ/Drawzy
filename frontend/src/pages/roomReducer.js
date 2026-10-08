// Room state driven entirely by server events received over the WebSocket.

export const initialRoomState = {
  self: null, // { id, username } of this browser's player
  players: [], // [{ id, username, score }]
  messages: [], // chat lines { user, message } and game notices { system: true, tone, text }
  gameStarted: false,
  phase: 'idle', // 'idle' | 'drawing' | 'turnEnd' | 'gameOver'
  round: 0,
  maxRounds: 0,
  drawer: null,
  word: '', // known to the drawer, to players who guessed it, and to everyone once the turn ends
  hint: '',
  turnId: 0, // bumps on every new turn
  timeLeft: 0,
  guessedIds: [],
  leaderboard: [],
  winnerIds: [],
};

const notice = (text, tone = 'info') => ({ system: true, tone, text });

function withScores(players, scores = []) {
  const byId = new Map(scores.map((entry) => [entry.id, entry.score]));
  return players.map((p) => (byId.has(p.id) ? { ...p, score: byId.get(p.id) } : p));
}

export function roomReducer(state, { type, payload }) {
  switch (type) {
    case 'WELCOME':
      return { ...state, self: payload };
    case 'EXISTING_PLAYERS':
      return { ...state, players: payload };
    case 'PLAYER_JOIN':
      if (state.players.some((p) => p.id === payload.id)) return state;
      return { ...state, players: [...state.players, { score: 0, ...payload }] };
    case 'PLAYER_LEAVE':
      return { ...state, players: state.players.filter((p) => p.id !== payload.id) };
    case 'CHAT':
      return { ...state, messages: [...state.messages, payload] };
    case 'ERROR':
      return { ...state, messages: [...state.messages, notice(payload.message, 'error')] };

    case 'TURN_START': {
      const myTurn = payload.drawer.id === state.self?.id;
      return {
        ...state,
        gameStarted: true,
        phase: 'drawing',
        round: payload.round,
        maxRounds: payload.maxRounds,
        drawer: payload.drawer,
        word: payload.word ?? '',
        hint: payload.hint,
        turnId: state.turnId + 1,
        timeLeft: payload.timeLeft,
        guessedIds: payload.guessed,
        leaderboard: [],
        winnerIds: [],
        players: withScores(state.players, payload.scores),
        messages: [
          ...state.messages,
          notice(myTurn ? 'Your turn to draw!' : `${payload.drawer.username} is drawing now.`),
        ],
      };
    }
    case 'WORD':
      return { ...state, word: payload.word };
    case 'CORRECT_GUESS':
      return {
        ...state,
        guessedIds: [...state.guessedIds, payload.player.id],
        players: withScores(state.players, payload.scores),
        messages: [
          ...state.messages,
          notice(`${payload.player.username} guessed the word! +${payload.points}`, 'success'),
        ],
      };
    case 'TURN_END':
      return {
        ...state,
        phase: 'turnEnd',
        word: payload.word,
        players: withScores(state.players, payload.scores),
        messages: [...state.messages, notice(`The word was "${payload.word}".`)],
      };
    case 'GAME_END':
      return {
        ...state,
        phase: 'gameOver',
        leaderboard: payload.leaderboard,
        winnerIds: payload.winners,
        players: withScores(state.players, payload.leaderboard),
      };

    // Local action: the player dismissed the results screen.
    case 'CLOSE_RESULTS':
      return { ...state, gameStarted: false, phase: 'idle' };
    default:
      // DRAW and CANVAS_STATE go straight to the canvas and never touch React state.
      return state;
  }
}
