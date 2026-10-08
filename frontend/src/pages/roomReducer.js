// Room state driven entirely by server events received over the WebSocket.

export const initialRoomState = {
  players: [],
  messages: [],
  gameStarted: false,
  theme: '',
  drawingPhase: false,
  roundDuration: 0,
  currentRound: 0,
  maxRounds: 0,
};

export function roomReducer(state, { type, payload }) {
  switch (type) {
    case 'EXISTING_PLAYERS':
      return { ...state, players: payload };
    case 'PLAYER_JOIN':
      if (state.players.some((p) => p.id === payload.id)) return state;
      return { ...state, players: [...state.players, payload] };
    case 'PLAYER_LEAVE':
      return { ...state, players: state.players.filter((p) => p.id !== payload.id) };
    case 'CHAT':
      return { ...state, messages: [...state.messages, payload] };
    case 'SHOW_THEME':
      return { ...state, gameStarted: true, theme: payload.theme, drawingPhase: false };
    case 'ROUND_START':
      return {
        ...state,
        drawingPhase: true,
        roundDuration: payload.duration,
        currentRound: payload.round,
        maxRounds: payload.maxRounds,
      };
    case 'ROUND_END':
      return { ...state, drawingPhase: false, theme: '' };
    case 'GAME_END':
      return { ...state, gameStarted: false, drawingPhase: false, theme: '' };
    default:
      // DRAW events go straight to the canvas and never touch React state.
      return state;
  }
}
