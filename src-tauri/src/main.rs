// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod midibridge;
use tokio::sync::mpsc;
use tokio::sync::Mutex;

fn main() {
  let (async_input_transmitter, async_input_receiver) = mpsc::channel(1);
  let (async_output_transmitter, async_output_receiver) = mpsc::channel(1);
  tauri::Builder
    ::default()
    .manage(midibridge::AsyncInputTransmit {
      inner: Mutex::new(async_input_transmitter),
    })
    .invoke_handler(tauri::generate_handler![midibridge::sendmidi])
    .setup(|_app| {
      midibridge::init(async_input_receiver, async_output_receiver, async_output_transmitter);
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
