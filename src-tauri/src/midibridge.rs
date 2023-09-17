use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use midir::MidiOutput;

use tokio::sync::{ mpsc, Mutex };
use tokio::time::Instant;
use serde::Deserialize;
use std::thread::sleep;

use crate::loggerbridge::Logger;
pub struct MidiMessage {
  pub message: Vec<u8>,
  pub instant: Instant,
  pub offset: u64,
  pub requestedport: String,
}

pub struct AsyncInputTransmit {
  pub inner: Mutex<mpsc::Sender<Vec<MidiMessage>>>,
}

pub fn init(
  logger: Logger,
  async_input_receiver: mpsc::Receiver<Vec<MidiMessage>>,
  mut async_output_receiver: mpsc::Receiver<Vec<MidiMessage>>,
  async_output_transmitter: mpsc::Sender<Vec<MidiMessage>>
) {
  tauri::async_runtime::spawn(async move { async_process_model(async_input_receiver, async_output_transmitter).await });
  let message_queue: Arc<Mutex<Vec<MidiMessage>>> = Arc::new(Mutex::new(Vec::new()));
  /* ...........................................................
         Listen For incoming messages and add to queue
  ............................................................*/
  let message_queue_clone = Arc::clone(&message_queue);
  tauri::async_runtime::spawn(async move {
    loop {
      if let Some(package) = async_output_receiver.recv().await {
        let mut message_queue = message_queue_clone.lock().await;
        let messages = package;
        for message in messages {
          (*message_queue).push(message);
        }
      }
    }
  });

  let message_queue_clone = Arc::clone(&message_queue);
  tauri::async_runtime::spawn(async move {
    /* ...........................................................
                        Open Midi Ports
    ............................................................*/
    let midiout = MidiOutput::new("strudel").unwrap();
    let out_ports = midiout.ports();
    let mut port_names = Vec::new();
    //TODO: Send these print messages to the UI logger instead of the rust console so the user can see them
    if out_ports.len() == 0 {
      logger.log(
        " No MIDI devices found. Connect a device or enable IAC Driver to enable midi.".to_string(),
        "".to_string()
      );
      // logger(window, " No MIDI devices found. Connect a device or enable IAC Driver.".to_string(), None);
      return;
    }
    // give the frontend couple seconds to load on start, or the log messages will get lost
    sleep(Duration::from_secs(3));
    logger.log(format!("Found {} midi devices!", out_ports.len()), "".to_string());

    // the user could reference any port at anytime during runtime,
    // so let's go ahead and open them all (same behavior as web app)
    let mut output_connections = HashMap::new();
    for i in 0..=out_ports.len().saturating_sub(1) {
      let midiout = MidiOutput::new("strudel").unwrap();
      let ports = midiout.ports();
      let port = ports.get(i).unwrap();
      let port_name = midiout.port_name(port).unwrap();
      logger.log(port_name.clone(), "".to_string());
      let out_con = midiout.connect(port, &port_name).unwrap();
      port_names.insert(i, port_name.clone());
      output_connections.insert(port_name, out_con);
    }
    /* ...........................................................
                        Process queued messages 
    ............................................................*/

    loop {
      let mut message_queue = message_queue_clone.lock().await;

      //iterate over each message, play and remove messages when they are ready
      message_queue.retain(|message| {
        if message.instant.elapsed().as_millis() < message.offset.into() {
          return true;
        }
        let mut out_con = output_connections.get_mut(&message.requestedport);

        // WebMidi supports getting a connection by part of its name
        // ex: 'bus 1' instead of 'IAC Driver bus 1' so let's emulate that behavior
        if out_con.is_none() {
          let key = port_names.iter().find(|port_name| {
            return port_name.contains(&message.requestedport);
          });
          if key.is_some() {
            out_con = output_connections.get_mut(key.unwrap());
          }
        }

        if out_con.is_some() {
          // process the message
          if let Err(err) = (&mut out_con.unwrap()).send(&message.message) {
            logger.log(format!("Midi message send error: {}", err), "error".to_string());
          }
        } else {
          logger.log(format!("failed to find midi device: {}", message.requestedport), "error".to_string());
        }
        return false;
      });

      sleep(Duration::from_millis(1));
    }
  });
}

pub async fn async_process_model(
  mut input_reciever: mpsc::Receiver<Vec<MidiMessage>>,
  output_transmitter: mpsc::Sender<Vec<MidiMessage>>
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  while let Some(input) = input_reciever.recv().await {
    let output = input;
    output_transmitter.send(output).await?;
  }
  Ok(())
}
#[derive(Deserialize)]
pub struct MessageFromJS {
  message: Vec<u8>,
  offset: u64,
  requestedport: String,
}
// Called from JS
#[tauri::command]
pub async fn sendmidi(
  messagesfromjs: Vec<MessageFromJS>,
  state: tauri::State<'_, AsyncInputTransmit>
) -> Result<(), String> {
  let async_proc_input_tx = state.inner.lock().await;
  let mut messages_to_process: Vec<MidiMessage> = Vec::new();

  for m in messagesfromjs {
    let message_to_process = MidiMessage {
      instant: Instant::now(),
      message: m.message,
      offset: m.offset,
      requestedport: m.requestedport,
    };
    messages_to_process.push(message_to_process);
  }

  async_proc_input_tx.send(messages_to_process).await.map_err(|e| e.to_string())
}
