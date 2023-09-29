use std::time::{ Duration, SystemTime, UNIX_EPOCH };
use rusty_link::{ AblLink, SessionState };
use std::sync::Arc;
use tokio::sync::Mutex;
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

pub fn init(_logger: Logger, abelink_to_js: AbeLinkToJs, abelink: Arc<Mutex<AbeLinkState>>) {
  tauri::async_runtime::spawn(async move {
    /* ...........................................................
                        Initialize Ableton link
    ............................................................*/

    let mut prev_is_playing = false;
    let mut prev_bpm = 120.0;

    loop {
      let mut state = abelink.lock().await;
      if state.link.is_enabled() == false {
        state.link.enable(true);
        state.link.enable_start_stop_sync(true);
      }

      let link_time_stamp = state.link.clock_micros();
      let bpm = state.session_state.tempo();
      let started = state.session_state.is_playing();
      let quantum = state.quantum;
      let beat = state.session_state.beat_at_time(link_time_stamp, quantum);
      let phase = state.session_state.phase_at_time(link_time_stamp, quantum);

      let time_at_next_cycle = state.session_state.time_at_beat(beat + (quantum - phase), quantum);

      let time_offset = Duration::from_micros((time_at_next_cycle - link_time_stamp) as u64);
      let current_unix_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
      let message_timestamp = (current_unix_time + time_offset).as_millis() - 140;

      state.capture_app_state();

      if bpm != prev_bpm || started != prev_is_playing {
        let payload = LinkMsg {
          bpm,
          play: started,
          timestamp: message_timestamp as u64,
        };
        abelink_to_js.send(payload);
        prev_is_playing = started;
        prev_bpm = bpm;
      }

      drop(state);
      sleep(Duration::from_millis(10));
    }
  });
}

// Called from JS
#[tauri::command]
pub async fn sendabelinkmsg(linkmsg: LinkMsg, state: tauri::State<'_, AsyncInputTransmit>) -> Result<(), String> {
  println!("bpm {} play {}", linkmsg.bpm, linkmsg.play);
  let mut abelink = state.abelink.lock().await;
  let started = abelink.session_state.is_playing();
  let time_stamp = abelink.link.clock_micros();
  let quantum = abelink.quantum;

  if linkmsg.play != started {
    abelink.session_state.set_is_playing_and_request_beat_at_time(linkmsg.play, time_stamp as u64, 0.0, quantum);
  }
  if linkmsg.bpm != abelink.session_state.tempo() {
    abelink.session_state.set_tempo(linkmsg.bpm, time_stamp);
  }
  abelink.commit_app_state();
  drop(abelink);
  Ok(())
}
