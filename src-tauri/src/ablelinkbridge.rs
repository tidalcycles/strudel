use std::time::Duration;
use rusty_link::{ AblLink, SessionState };
use std::sync::Arc;
use tokio::sync::{ mpsc, Mutex };
use serde::Deserialize;
use std::thread::sleep;

use crate::loggerbridge::Logger;

use tauri::{ Window, App, Manager };

#[derive(Deserialize, Clone, serde::Serialize)]
pub struct LinkMsg {
  pub play: bool,
  pub bpm: f64,
}

#[derive(Clone)]
pub struct AbeLinkToJs {
  pub window: Arc<Window>,
}

impl AbeLinkToJs {
  pub fn send(&self, payload: LinkMsg) {
    let _ = self.window.emit("abelink-event", payload);
  }
}

pub struct State2 {
  pub inner: Mutex<mpsc::Sender<LinkMsg>>,
  pub ablelink_state: Mutex<AbleLinkState>,
}
// #[derive(Sync)]
pub struct AbleLinkState {
  pub link: AblLink,
  pub session_state: SessionState,
  pub running: bool,
  pub quantum: f64,
}

impl AbleLinkState {
  pub fn new() -> Self {
    Self {
      link: AblLink::new(120.0),
      session_state: SessionState::new(),
      running: true,
      quantum: 4.0,
    }
  }

  pub fn capture_app_state(&mut self) {
    self.link.capture_app_session_state(&mut self.session_state);
  }

  pub fn commit_app_state(&mut self) {
    self.link.commit_app_session_state(&self.session_state);
  }
}

pub async fn init(
  abelink_to_js: AbeLinkToJs,
  _logger: Logger,
  async_input_receiver: mpsc::Receiver<LinkMsg>,
  mut async_output_receiver: mpsc::Receiver<LinkMsg>,
  async_output_transmitter: mpsc::Sender<LinkMsg>
) {
  println!("init");
  tauri::async_runtime::spawn(async move { async_process_model(async_input_receiver, async_output_transmitter).await });

  let message_queue: Arc<Mutex<Vec<LinkMsg>>> = Arc::new(Mutex::new(Vec::new()));
  //let s = app.state::<State2>().ablelink_state.lock().await;
  // tauri::async_runtime::spawn(async move {
  //   abelink_to_js.send(LinkMsg { play: true, bpm: 100.0 });

  //   //let mut s = a.state::<State2>().ablelink_state.lock().await;
  //   // s.capture_app_state();
  // });

  // let state = unlocked_state.ablelink_state.try_lock().unwrap();

  /* ...........................................................
         Listen For incoming messages and add to queue
  ............................................................*/
  let message_queue_clone = Arc::clone(&message_queue);
  tauri::async_runtime::spawn(async move {
    loop {
      if let Some(message) = async_output_receiver.recv().await {
        let mut message_queue = message_queue_clone.lock().await;
        (*message_queue).push(message);
      }
    }
  });

  let message_queue_clone = Arc::clone(&message_queue);
  // tauri::async_runtime::spawn(async move {
  //   let a = app.lock().await;
  //   let mut state = a.state::<State2>().ablelink_state.lock().await;

  //   /* ...........................................................
  //                       Initialize Ableton link
  //   ............................................................*/
  //   //let mut state = State::new();
  //   state.link.enable(true);
  //   state.link.enable_start_stop_sync(true);

  //   let mut prev_is_playing = state.session_state.is_playing();
  //   let mut prev_bpm = state.session_state.tempo();

  //   /* ...........................................................
  //                       Process queued messages
  //   ............................................................*/

  //   loop {
  //     let mut message_queue = message_queue_clone.lock().await;

  //     state.capture_app_state();
  //     let time_stamp = state.link.clock_micros();
  //     let bpm = state.session_state.tempo();
  //     let play = state.session_state.is_playing();
  //     let quantum = state.quantum;
  //     println!("quant: {}", quantum);

  //     if bpm != prev_bpm || play != prev_is_playing {
  //       //let cycle = state.session_state.time_at_beat(beat, quantum)
  //       let payload = LinkMsg {
  //         bpm,
  //         play,
  //       };
  //       abelink_to_js.send(payload);
  //       prev_is_playing = play;
  //       prev_bpm = bpm;
  //     }

  //     message_queue.retain(|message| {
  //       let is_playing = message.play;
  //       println!("is playing {}", is_playing);
  //       if is_playing != prev_is_playing {
  //         if is_playing == false {
  //           state.session_state.set_is_playing(false, time_stamp as u64);
  //         } else {
  //           state.session_state.set_is_playing_and_request_beat_at_time(true, time_stamp as u64, 0.0, quantum);
  //         }
  //         state.commit_app_state();
  //       }
  //       return false;
  //     });

  //     sleep(Duration::from_millis(10));
  //   }
  // });
}

pub async fn async_process_model(
  mut input_reciever: mpsc::Receiver<LinkMsg>,
  output_transmitter: mpsc::Sender<LinkMsg>
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  while let Some(input) = input_reciever.recv().await {
    let output = input;
    output_transmitter.send(output).await?;
  }
  Ok(())
}

// Called from JS
#[tauri::command]
pub async fn sendabelinkmsg(linkmsg: LinkMsg, state: tauri::State<'_, State2>) -> Result<(), String> {
  println!("bpm {} play {}", linkmsg.bpm, linkmsg.play);
  let async_proc_input_tx = state.inner.lock().await;
  async_proc_input_tx.send(linkmsg).await.map_err(|e| e.to_string())
}
