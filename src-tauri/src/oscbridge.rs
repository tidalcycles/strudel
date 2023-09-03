use rosc::encoder;
use rosc::{ OscMessage, OscPacket, OscType };
use std::net::{ SocketAddrV4, UdpSocket };
use std::str::FromStr;
use std::time::Duration;
use std::{ env, f32 };
use std::sync::Arc;
use tokio::sync::{ mpsc, Mutex };
use tokio::time::Instant;
use serde::Deserialize;
use std::thread::sleep;
pub struct OscMsg {
  pub msg_buf: Vec<u8>,
  pub instant: Instant,
  pub offset: u64,
}

pub struct AsyncInputTransmit {
  pub inner: Mutex<mpsc::Sender<Vec<OscMsg>>>,
}
fn get_addr_from_arg(arg: &str) -> SocketAddrV4 {
  SocketAddrV4::from_str(arg).unwrap()
}
pub fn init(
  async_input_receiver: mpsc::Receiver<Vec<OscMsg>>,
  mut async_output_receiver: mpsc::Receiver<Vec<OscMsg>>,
  async_output_transmitter: mpsc::Sender<Vec<OscMsg>>
) {
  tauri::async_runtime::spawn(async move { async_process_model(async_input_receiver, async_output_transmitter).await });
  let message_queue: Arc<Mutex<Vec<OscMsg>>> = Arc::new(Mutex::new(Vec::new()));
  /* ...........................................................
         Listen For incoming messages and add to queue
  ............................................................*/
  let message_queue_clone = Arc::clone(&message_queue);
  tauri::async_runtime::spawn(async move {
    loop {
      if let Some(package) = async_output_receiver.recv().await {
        let mut message_queue = message_queue_clone.lock().await;
        let messages = package;
        //println!("received message");
        for message in messages {
          (*message_queue).push(message);
        }
      }
    }
  });
  println!("cloning message queue");

  let message_queue_clone = Arc::clone(&message_queue);
  tauri::async_runtime::spawn(async move {
    println!("opening osc port");
    /* ...........................................................
                        Open OSC Ports
    ............................................................*/

    let sock = UdpSocket::bind("localhost:57121").unwrap();
    let to_addr = String::from("localhost:57120");

    /* ...........................................................
                        Process queued messages 
    ............................................................*/

    loop {
      let mut message_queue = message_queue_clone.lock().await;
      println!("num messages {}", message_queue.len());

      //iterate over each message, play and remove messages when they are ready
      message_queue.retain(|message| {
        if message.instant.elapsed().as_millis() < message.offset.into() {
          return true;
        }
        sock.send_to(&message.msg_buf, to_addr.clone()).unwrap();
        return false;
      });

      sleep(Duration::from_millis(1));
    }
  });
}

pub async fn async_process_model(
  mut input_reciever: mpsc::Receiver<Vec<OscMsg>>,
  output_transmitter: mpsc::Sender<Vec<OscMsg>>
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  while let Some(input) = input_reciever.recv().await {
    let output = input;
    output_transmitter.send(output).await?;
  }
  Ok(())
}

#[derive(Deserialize)]
pub struct Param {
  name: String,
  value: String,
  valueisnumber: bool,
}
#[derive(Deserialize)]
pub struct MessageFromJS {
  params: Vec<Param>,
  offset: u64,
  target: String,
}
// Called from JS
#[tauri::command]
pub async fn sendosc(
  messagesfromjs: Vec<MessageFromJS>,
  state: tauri::State<'_, AsyncInputTransmit>
) -> Result<(), String> {
  let async_proc_input_tx = state.inner.lock().await;
  let mut messages_to_process: Vec<OscMsg> = Vec::new();

  for m in messagesfromjs {
    let mut args = Vec::new();
    for p in m.params {
      args.push(OscType::String(p.name));

      if p.valueisnumber {
        args.push(OscType::Float(p.value.parse().unwrap()));
      } else {
        args.push(OscType::String(p.value));
      }
    }

    let msg_buf = encoder
      ::encode(
        &OscPacket::Message(OscMessage {
          addr: m.target,
          args,
        })
      )
      .unwrap();

    let message_to_process = OscMsg {
      instant: Instant::now(),
      msg_buf,
      offset: m.offset,
    };
    messages_to_process.push(message_to_process);
  }

  async_proc_input_tx.send(messages_to_process).await.map_err(|e| e.to_string())
}
