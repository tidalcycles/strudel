use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use midir::MidiOutput;
use tokio::sync::{ mpsc, Mutex };
use tokio::time::Instant;
use serde::Deserialize;
use std::thread::sleep;
use web_audio_api::context::{AudioContext, AudioContextLatencyCategory, AudioContextOptions, BaseAudioContext};
use web_audio_api::node::{AudioNode, AudioScheduledSourceNode, OscillatorType};

pub struct WebAudioMessage {
    pub note: f32,
    pub instant: Instant,
    pub offset: f64,
    pub waveform: String,
}

pub struct AsyncInputTransmitWebAudio {
    pub inner: Mutex<mpsc::Sender<Vec<WebAudioMessage>>>,
}

pub fn init(
    async_input_receiver: mpsc::Receiver<Vec<WebAudioMessage>>,
    mut async_output_receiver: mpsc::Receiver<Vec<WebAudioMessage>>,
    async_output_transmitter: mpsc::Sender<Vec<WebAudioMessage>>
) {
    tauri::async_runtime::spawn(async move { async_process_model(async_input_receiver, async_output_transmitter).await });
    let message_queue: Arc<Mutex<Vec<WebAudioMessage>>> = Arc::new(Mutex::new(Vec::new()));
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
                            Prepare audio context
        ............................................................*/
        let latency_hint = match std::env::var("WEB_AUDIO_LATENCY").as_deref() {
            Ok("playback") => AudioContextLatencyCategory::Playback,
            _ => AudioContextLatencyCategory::default(),
        };

        let audio_context = AudioContext::new(AudioContextOptions {
            latency_hint,
            ..AudioContextOptions::default()
        });

        /* ...........................................................
                            Process queued messages
        ............................................................*/

        loop {
            let mut message_queue = message_queue_clone.lock().await;

            //iterate over each message, play and remove messages when they are ready
            message_queue.retain(|message| {
                if message.instant.elapsed().as_millis() < message.offset as u128 {
                    return true;
                };

                trigger_osc(&audio_context, message.note, message.waveform.clone());

                return false;
            });

            sleep(Duration::from_millis(1));
        }
    });
}

pub async fn async_process_model(
    mut input_reciever: mpsc::Receiver<Vec<WebAudioMessage>>,
    output_transmitter: mpsc::Sender<Vec<WebAudioMessage>>
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_reciever.recv().await {
        let output = input;
        output_transmitter.send(output).await?;
    }
    Ok(())
}
#[derive(Deserialize)]
pub struct MessageFromJS {
    note: f32,
    offset: f64,
    waveform: String,
}
// Called from JS
#[tauri::command]
pub async fn sendwebaudio(
    messagesfromjs: Vec<MessageFromJS>,
    state: tauri::State<'_, AsyncInputTransmitWebAudio>
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    let mut messages_to_process: Vec<WebAudioMessage> = Vec::new();

    for m in messagesfromjs {
        let message_to_process = WebAudioMessage {
            note: m.note,
            instant: Instant::now(),
            offset: m.offset,
            waveform: m.waveform,
        };
        messages_to_process.push(message_to_process);
    }

    async_proc_input_tx.send(messages_to_process).await.map_err(|e| e.to_string())
}

fn trigger_osc(audio_context: &AudioContext, freq: f32, osc_type: String) {
    let env = audio_context.create_gain();
    env.gain().set_value(0.);
    env.connect(&audio_context.destination());

    let osc = audio_context.create_oscillator();

    match osc_type.as_str() {
        "sine" => osc.set_type(OscillatorType::Sine),
        "square" => osc.set_type(OscillatorType::Square),
        "triangle" => osc.set_type(OscillatorType::Triangle),
        "saw" => osc.set_type(OscillatorType::Sawtooth),
        _ => osc.set_type(OscillatorType::Sine),
    }

    osc.connect(&env);

    let now = audio_context.current_time();

    let freq = freq;
    osc.frequency().set_value(freq);

    env.gain()
        .set_value_at_time(0., now)
        .linear_ramp_to_value_at_time(0.1, now + 0.01)
        .exponential_ramp_to_value_at_time(0.0001, now + 2.);

    osc.start_at(now);
    osc.stop_at(now + 2.);
}