use std::time::{ Duration, SystemTime, UNIX_EPOCH };
use rusty_link::{ AblLink, SessionState };
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::Deserialize;
use std::thread::sleep;

use crate::loggerbridge::Logger;

use tauri::Window;

fn bpm_to_cps(bpm: f64) -> f64 {
  let cpm = bpm / 4.0;
  return cpm / 60.0;
}

fn cps_to_bpm(cps: f64) -> f64 {
  let cpm = cps * 60.0;
  return cpm * 4.0;
}

fn current_unix_time() -> Duration {
  let current_unix_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
  return current_unix_time;
}

#[derive(Deserialize, Clone, serde::Serialize)]
pub struct LinkMsg {
  pub started: bool,
  pub cps: f64,
  pub timestamp: u64,
  pub phase: f64,
}

pub struct AbeLinkStateContainer {
  pub abelink: Arc<Mutex<AbeLinkState>>,
}
pub struct AbeLinkState {
  pub link: AblLink,
  pub session_state: SessionState,
  pub running: bool,
  pub quantum: f64,
  pub window: Arc<Window>,
}

impl AbeLinkState {
  pub fn new(window: Arc<Window>) -> Self {
    Self {
      link: AblLink::new(120.0),
      session_state: SessionState::new(),
      running: true,
      quantum: 4.0,
      window,
    }
  }

  pub fn unix_time_at_next_phase(&self) -> u64 {
    let link_time_stamp = self.link.clock_micros();
    let quantum = self.quantum;
    let beat = self.session_state.beat_at_time(link_time_stamp, quantum);
    let phase = self.session_state.phase_at_time(link_time_stamp, quantum);
    let internal_time_at_next_phase = self.session_state.time_at_beat(beat + (quantum - phase), quantum);
    let time_offset = Duration::from_micros((internal_time_at_next_phase - link_time_stamp) as u64);
    let current_unix_time = current_unix_time();
    let unix_time_at_next_phase = (current_unix_time + time_offset).as_millis();
    return unix_time_at_next_phase as u64;
  }

  pub fn cps(&self) -> f64 {
    let bpm = self.session_state.tempo();
    let cps = bpm_to_cps(bpm);
    return cps;
  }

  pub fn capture_app_state(&mut self) {
    self.link.capture_app_session_state(&mut self.session_state);
  }

  pub fn commit_app_state(&mut self) {
    self.link.commit_app_session_state(&self.session_state);
  }

  pub fn send(&self, payload: LinkMsg) {
    let _ = self.window.emit("abelink-event", payload);
  }

  pub fn send_started(&self) {
    let cps = self.cps();
    let started = self.session_state.is_playing();
    let payload = LinkMsg {
      cps,
      started,
      timestamp: self.unix_time_at_next_phase(),
      phase: 0.0,
    };
    self.send(payload);
  }

  pub fn send_cps(&self) {
    let cps = self.cps();
    let started = self.session_state.is_playing();
    let phase = self.session_state.phase_at_time(self.link.clock_micros(), self.quantum);
    let payload = LinkMsg {
      cps,
      started,
      timestamp: current_unix_time().as_millis() as u64,
      phase,
    };
    self.send(payload);
  }

  pub fn send_phase(&self) {
    self.send_started();
  }
}

pub fn init(_logger: Logger, abelink: Arc<Mutex<AbeLinkState>>) {
  tauri::async_runtime::spawn(async move {
    let mut prev_is_started = false;
    let mut prev_cps = 0.0;

    let mut time_since_last_phase_send = 0;
    let sleep_time = 10;
    /* .......................................................................
        Evaluate Abelink State and send messages back to JS side when needed.
    ........................................................................*/
    loop {
      let mut state = abelink.lock().await;
      state.capture_app_state();
      if state.link.is_enabled() == false {
        state.link.enable(true);
        state.link.enable_start_stop_sync(true);
      }

      let started = state.session_state.is_playing();

      if started != prev_is_started {
        state.send_started();
        prev_is_started = started;
      } else if state.cps() != prev_cps && state.cps() != 0.0 {
        state.send_cps();
        prev_cps = state.cps();
        // a phase sync message needs to be sent to strudel every 30 seconds to keep clock drift at bay
      } else if time_since_last_phase_send > 30000 {
        state.send_phase();
        time_since_last_phase_send = 0;
      }

      drop(state);
      sleep(Duration::from_millis(sleep_time));
      time_since_last_phase_send = time_since_last_phase_send + sleep_time;
    }
  });
}

// Called from JS
#[tauri::command]
pub async fn sendabelinkmsg(linkmsg: LinkMsg, state: tauri::State<'_, AbeLinkStateContainer>) -> Result<(), String> {
  let mut abelink = state.abelink.lock().await;
  abelink.capture_app_state();
  let started = abelink.session_state.is_playing();
  let time_stamp = abelink.link.clock_micros();
  let quantum = abelink.quantum;
  let linkmsg_bpm = cps_to_bpm(linkmsg.cps);

  if linkmsg.started != started {
    abelink.session_state.set_is_playing_and_request_beat_at_time(linkmsg.started, time_stamp as u64, 0.0, quantum);
  }
  if linkmsg_bpm != abelink.session_state.tempo() && linkmsg_bpm != 0.0 {
    abelink.session_state.set_tempo(linkmsg_bpm, time_stamp);
  }
  abelink.commit_app_state();
  drop(abelink);
  Ok(())
}
