// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod midibridge;
mod oscbridge;
mod loggerbridge;
mod ablelinkbridge;
use std::sync::Arc;

use ablelinkbridge::AbeLinkToJs;
use ablelinkbridge::State2;
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
  let (async_input_transmitter_abelink, async_input_receiver_abelink) = mpsc::channel(1);
  let (async_output_transmitter_abelink, async_output_receiver_abelink) = mpsc::channel(1);
  tauri::Builder
    ::default()
    .manage(midibridge::AsyncInputTransmit {
      inner: Mutex::new(async_input_transmitter_midi),
    })
    .manage(oscbridge::AsyncInputTransmit {
      inner: Mutex::new(async_input_transmitter_osc),
    })
    .manage(ablelinkbridge::State2 {
      inner: Mutex::new(async_input_transmitter_abelink),
      ablelink_state: Mutex::new(ablelinkbridge::AbleLinkState::new()),
    })
    .invoke_handler(tauri::generate_handler![midibridge::sendmidi, oscbridge::sendosc, ablelinkbridge::sendabelinkmsg])
    .setup(|app| {
      // let mut able_link_state = Arc::new(
      //   Mutex::new(ablelinkbridge::State::new(Mutex::new(async_input_transmitter_abelink)))
      // );
      // app.manage(able_link_state.clone());
      let window = Arc::new(app.get_window("main").unwrap());
      let logger = Logger { window: window.clone() };
      // let state_mutex = app.state::<Mutex<oscbridge::AsyncInputTransmit>>();
      // state_mutex.lock();

      midibridge::init(
        logger.clone(),
        async_input_receiver_midi,
        async_output_receiver_midi,
        async_output_transmitter_midi
      );
      oscbridge::init(
        logger.clone(),
        async_input_receiver_osc,
        async_output_receiver_osc,
        async_output_transmitter_osc
      );

      ablelinkbridge::init(
        AbeLinkToJs { window },
        logger.clone(),
        async_input_receiver_abelink,
        async_output_receiver_abelink,
        async_output_transmitter_abelink
      );

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
