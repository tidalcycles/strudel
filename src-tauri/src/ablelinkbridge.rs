use std::time::{ Duration, SystemTime, UNIX_EPOCH };
use rusty_link::{ AblLink, SessionState };
use std::sync::Arc;
use tokio::sync::{ mpsc, Mutex };
use serde::Deserialize;
use std::thread::sleep;

use crate::loggerbridge::Logger;

use tauri::Window;

#[derive(Deserialize, Clone, serde::Serialize)]
pub struct LinkMsg {
  pub play: bool,
  pub bpm: f64,
  pub timestamp: u64,
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

pub struct AsyncInputTransmit {
  pub inner: Mutex<mpsc::Sender<LinkMsg>>,
  pub abelink: Arc<Mutex<AbeLinkState>>,
}
pub struct AbeLinkState {
  pub link: AblLink,
  pub session_state: SessionState,
  pub running: bool,
  pub quantum: f64,
}

impl AbeLinkState {
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

pub fn init(
  _logger: Logger,
  abelink_to_js: AbeLinkToJs,
  abelink: Arc<Mutex<AbeLinkState>>,
  async_input_receiver: mpsc::Receiver<LinkMsg>,
  mut async_output_receiver: mpsc::Receiver<LinkMsg>,
  async_output_transmitter: mpsc::Sender<LinkMsg>
) {
  tauri::async_runtime::spawn(async move { async_process_model(async_input_receiver, async_output_transmitter).await });
  let message_queue: Arc<Mutex<Vec<LinkMsg>>> = Arc::new(Mutex::new(Vec::new()));
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
  tauri::async_runtime::spawn(async move {
    /* ...........................................................
                        Initialize Ableton link
    ............................................................*/
    //let mut state = AbeLinkState::new();

    let mut prev_is_playing = false;
    let mut prev_bpm = 120.0;

    /* ...........................................................
                        Process queued messages 
    ............................................................*/

    loop {
      let mut state = abelink.lock().await;
      if state.link.is_enabled() == false {
        state.link.enable(true);
        state.link.enable_start_stop_sync(true);
      }

      let mut message_queue = message_queue_clone.lock().await;
      let time_stamp = state.link.clock_micros();
      let bpm = state.session_state.tempo();
      let play = state.session_state.is_playing();
      let quantum = state.quantum;
      state.capture_app_state();

      if bpm != prev_bpm || play != prev_is_playing {
        //let cycle = state.session_state.time_at_beat(beat, quantum)
        let payload = LinkMsg {
          bpm,
          play,
          timestamp: 1,
        };
        abelink_to_js.send(payload);
        prev_is_playing = play;
        prev_bpm = bpm;
      }

      message_queue.retain(|message| {
        let is_playing = message.play;
        println!("is playing {}", is_playing);
        if is_playing != prev_is_playing {
          if is_playing == false {
            state.session_state.set_is_playing(false, time_stamp as u64);
          } else {
            state.session_state.set_is_playing_and_request_beat_at_time(true, time_stamp as u64, 0.0, quantum);
          }
          state.commit_app_state();
        }
        return false;
      });
      drop(state);
      sleep(Duration::from_millis(10));
    }
  });
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
pub async fn sendabelinkmsg(linkmsg: LinkMsg, state: tauri::State<'_, AsyncInputTransmit>) -> Result<LinkMsg, String> {
  println!("bpm {} play {}", linkmsg.bpm, linkmsg.play);
  let async_proc_input_tx = state.inner.lock().await;
  let mut abelink = state.abelink.lock().await;
  let quantum = abelink.quantum;
  let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
  // abelink.session_state.phase_at_time(time, quantum)
  //let x = abelink.session_state.request_beat_at_start_playing_time(1.0, quantum);

  let x = Duration::from_millis(abelink.session_state.time_at_beat(0.0, quantum) as u64);
  let link_clock = Duration::from_millis(abelink.link.clock_micros() as u64);

  let timestamp = current_time.as_millis();
  let phase = abelink.session_state.phase_at_time(abelink.link.clock_micros(), quantum);
  let bpm = abelink.session_state.tempo();
  let beat = abelink.session_state.beat_at_time(abelink.link.clock_micros(), quantum);

  let bps = 60.0 / bpm;
  let phase_offset = quantum - phase;
  let seconds_offset = phase_offset * bps;
  let milliseconds_offset = seconds_offset * 1000.0;
  let transport_offset = (milliseconds_offset as u64) + (current_time.as_millis() as u64);

  // let d = Duration::from_millis(x as u64);
  // let d2 = Duration::from_secs(0);
  // let d3 = d + d2;

  let x2 = Duration::from_millis(abelink.session_state.time_for_is_playing());

  println!("quantum {}, phase {}, bpm {}, beat {}, seconds offset {}", quantum, phase, bpm, beat, seconds_offset);
  let ret_message = LinkMsg {
    bpm: linkmsg.bpm.clone(),
    play: linkmsg.play.clone(),
    timestamp: transport_offset,
  };

  async_proc_input_tx.send(linkmsg).await.unwrap();

  drop(abelink);
  Ok(ret_message)
}
