import { createServerFactory } from "@hellacardgames/lib";
import { createManager } from "../manager/index.js";

export const createServer = createServerFactory(createManager, {});
