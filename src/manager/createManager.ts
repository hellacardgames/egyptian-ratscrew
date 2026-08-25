import { createManagerFactory } from "@hellacardgames/lib";
import {
  createGame,
  getClientStateAndClearEvents,
  getEventsAndClearAcknowledged,
  joinGame,
  leaveGame,
  MAX_PLAYERS,
  startGame,
} from "../game/index.js";

export const createManager = createManagerFactory({
  maxPlayers: MAX_PLAYERS,
  createGame,
  getClientStateAndClearEvents,
  getEventsAndClearAcknowledged,
  joinGame,
  leaveGame,
  startGame,
  createCustomActions: () => ({}),
});
