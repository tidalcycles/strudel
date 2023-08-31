import { invoke } from '@tauri-apps/api/tauri';

export const Invoke = invoke;
export const isTauri = () => window.__TAURI_IPC__ != null;
