import { emitEvent } from "../lib/emitEvent.js";
import { EXPIRY_EXTENSION_MS, MIN_PLAYERS } from "../constants.js";
import type { Game, StartedGame } from "../types/Game.js";

export function startGame(game: Game, playerId: string) {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: "playerNotFound" } as const;
  }
  if (game.players.indexOf(player) !== 0) {
    return { success: false, error: "playerNotAdmin" } as const;
  }
  if (game.status !== "created") {
    return { success: false, error: "invalidStatus" } as const;
  }
  if (game.players.length < MIN_PLAYERS) {
    return { success: false, error: "minPlayersNotReached" } as const;
  }

  const startedGame: StartedGame = {
    ...game,
    status: "started",
    expiresAt: Date.now() + EXPIRY_EXTENSION_MS,
  };
  emitEvent(startedGame, { type: "gameStarted" });
  emitEvent(startedGame, {
    type: "expirationUpdated",
    expiresAt: startedGame.expiresAt,
  });
  return { success: true, game: startedGame } as const;
}
