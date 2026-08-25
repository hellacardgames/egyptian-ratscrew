import { createManagerFactory } from "@hellacardgames/lib";
import {
  createGame,
  getClientStateAndClearEvents,
  joinGame,
  leaveGame,
  MAX_PLAYERS,
  startGame,
} from "../game/index.js";

export const createManager = createManagerFactory({
  maxPlayers: MAX_PLAYERS,
  createGame,
  getClientStateAndClearEvents,
  joinGame,
  leaveGame,
  startGame,
  createCustomActions: () => ({}),
});
