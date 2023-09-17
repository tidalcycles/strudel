// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod midibridge;
mod oscbridge;
mod loggerbridge;
use std::sync::Arc;

use loggerbridge::Logger;
use tauri::Manager;
use tokio::sync::mpsc;
use tokio::sync::Mutex;
// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
  message_type: String,
}
fn main() {
  let (async_input_transmitter_midi, async_input_receiver_midi) = mpsc::channel(1);
  let (async_output_transmitter_midi, async_output_receiver_midi) = mpsc::channel(1);
  let (async_input_transmitter_osc, async_input_receiver_osc) = mpsc::channel(1);
  let (async_output_transmitter_osc, async_output_receiver_osc) = mpsc::channel(1);
  tauri::Builder
    ::default()
    .manage(midibridge::AsyncInputTransmit {
      inner: Mutex::new(async_input_transmitter_midi),
    })
    .manage(oscbridge::AsyncInputTransmit {
      inner: Mutex::new(async_input_transmitter_osc),
    })
    .invoke_handler(tauri::generate_handler![midibridge::sendmidi, oscbridge::sendosc])
    .setup(|app| {
      let window = Arc::new(app.get_window("main").unwrap());
      let logger = Logger { window };
      midibridge::init(
        logger.clone(),
        async_input_receiver_midi,
        async_output_receiver_midi,
        async_output_transmitter_midi
      );
      oscbridge::init(logger, async_input_receiver_osc, async_output_receiver_osc, async_output_transmitter_osc);
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
