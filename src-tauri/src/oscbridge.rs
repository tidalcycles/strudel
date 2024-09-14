use rosc::{encoder, OscTime};
use rosc::{OscBundle, OscMessage, OscPacket, OscType};

use std::net::UdpSocket;

use serde::Deserialize;
use std::sync::Arc;
use std::thread::sleep;
use std::time::{Duration};
use tokio::sync::{mpsc, Mutex};

use crate::loggerbridge::Logger;
pub struct OscMsg {
    pub msg_buf: Vec<u8>,
    pub timestamp: f64,
}

pub struct AsyncInputTransmit {
    pub inner: Mutex<mpsc::Sender<Vec<OscMsg>>>,
}

const UNIX_OFFSET: u64 = 2_208_988_800; // 70 years in seconds
const TWO_POW_32: f64 = (u32::MAX as f64) + 1.0; // Number of bits in a `u32`
const NANOS_PER_SECOND: f64 = 1.0e9;
const SECONDS_PER_NANO: f64 = 1.0 / NANOS_PER_SECOND;

pub fn init(
    logger: Logger,
    async_input_receiver: mpsc::Receiver<Vec<OscMsg>>,
    mut async_output_receiver: mpsc::Receiver<Vec<OscMsg>>,
    async_output_transmitter: mpsc::Sender<Vec<OscMsg>>,
) {
    tauri::async_runtime::spawn(async move {
        async_process_model(async_input_receiver, async_output_transmitter).await
    });
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
                for message in messages {
                    (*message_queue).push(message);
                }
            }
        }
    });

    let message_queue_clone = Arc::clone(&message_queue);
    tauri::async_runtime::spawn(async move {
        /* ...........................................................
                            Open OSC Ports
        ............................................................*/
        let sock = UdpSocket::bind("127.0.0.1:57122").unwrap();
        let to_addr = String::from("127.0.0.1:57120");
        sock.set_nonblocking(true).unwrap();
        sock.connect(to_addr)
            .expect("could not connect to OSC address");

        /* ...........................................................
                            Process queued messages
        ............................................................*/

        loop {
            let mut message_queue = message_queue_clone.lock().await;

            message_queue.retain(|message| {
                let result = sock.send(&message.msg_buf);
                if result.is_err() {
                    logger.log(
                        format!(
                            "OSC Message failed to send, the server might no longer be available"
                        ),
                        "error".to_string(),
                    );
                }
                return false;
            });

            sleep(Duration::from_millis(1));
        }
    });
}

pub async fn async_process_model(
    mut input_reciever: mpsc::Receiver<Vec<OscMsg>>,
    output_transmitter: mpsc::Sender<Vec<OscMsg>>,
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
    timestamp: f64,
    target: String,
}
// Called from JS
#[tauri::command]
pub async fn sendosc(
    messagesfromjs: Vec<MessageFromJS>,
    state: tauri::State<'_, AsyncInputTransmit>,
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
        // let start = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();

        let time_delay = Duration::from_secs_f64(m.timestamp);
        let duration_since_epoch =
        time_delay + Duration::new(UNIX_OFFSET, 0);

        let seconds = u32::try_from(duration_since_epoch.as_secs())
            .map_err(|_| "bit conversion failed for osc message timetag")?;

        let nanos = duration_since_epoch.subsec_nanos() as f64;
        let fractional = (nanos * SECONDS_PER_NANO * TWO_POW_32).round() as u32;

        let timetag = OscTime::from((seconds, fractional));

        let packet = OscPacket::Message(OscMessage {
            addr: m.target,
            args,
        });

        let bundle = OscBundle {
            content: vec![packet],
            timetag,
        };

        let msg_buf = encoder::encode(&OscPacket::Bundle(bundle)).unwrap();

        let message_to_process = OscMsg {
            msg_buf,
            timestamp: m.timestamp,
        };
        messages_to_process.push(message_to_process);
    }

    async_proc_input_tx
        .send(messages_to_process)
        .await
        .map_err(|e| e.to_string())
}
