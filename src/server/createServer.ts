import { createServerFactory } from "@hellacardgames/lib";
import { createManager } from "../manager/index.js";

export type Server = ReturnType<typeof createServer>;

export const createServer = createServerFactory(createManager, {});
