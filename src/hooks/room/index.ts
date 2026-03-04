/**
 * Room hooks — Focused modules extracted from the monolithic useRoom.ts.
 *
 * Each module handles a single responsibility with clean interfaces.
 */

export { useProcessingGuard } from "./useProcessingGuard";
export { useNotifications } from "./useNotifications";
export type { GameNotification } from "./useNotifications";
export { usePresence } from "./usePresence";
export { useHostCleanup } from "./useHostCleanup";
export { useBeforeUnload } from "./useBeforeUnload";
export { useHostWatchdog } from "./useHostWatchdog";
export { useClientResync } from "./useClientResync";
export { ROOM_CONSTANTS } from "./types";
export type { ProcessingGuard, NotificationControls, RoundEndLock, RoundEndTimingContext } from "./types";
