import { listen } from '@tauri-apps/api/event';
import { logger } from '../core/logger.mjs';

// listen for log events from the Tauri backend and log in the UI
await listen('log-event', (e) => {
  if (e.payload == null) {
    return;
  }
  const { message, message_type } = e.payload;
  logger(message, message_type);
});
