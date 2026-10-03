import type { ClientState, GameEvent } from "../client/index.js";

export function applyEvent(
  previousState: ClientState,
  event: GameEvent,
): ClientState {
  switch (event.type) {
    case "adminChanged":
      return {
        ...previousState,
        adminUsername: event.username,
      };
    case "chat":
      return {
        ...previousState,
        chatMessages: [...previousState.chatMessages, event.message],
      };
    case "expirationUpdated":
      return { ...previousState, expiresAt: event.expiresAt };
    case "gameCompleted":
      return { ...previousState, status: "completed" };
    case "gameForfeited":
      return { ...previousState, status: "forfeited" };
    case "gameStarted":
      return { ...previousState, status: "started" };
    case "playerJoined":
      return {
        ...previousState,
        players: [
          ...previousState.players,
          {
            username: event.username,
          },
        ],
      };
    case "playerLeft":
      return {
        ...previousState,
        players: [
          ...previousState.players.filter((p) => p.username !== event.username),
        ],
      };
    case "turnChanged":
      return {
        ...previousState,
        currentPlayerUsername: event.currentPlayerUsername,
      };
  }
}
