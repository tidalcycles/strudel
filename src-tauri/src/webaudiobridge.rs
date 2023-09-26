use std::{
    sync::Arc,
    time::Duration,
    thread::sleep,
};
use std::fs::File;
use mini_moka::sync::Cache;
use reqwest::Url;

use tokio::{
    sync::{mpsc, Mutex},
    time::Instant,
};
use serde::Deserialize;
// use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use web_audio_api::{AudioBuffer, context::{AudioContext, AudioContextLatencyCategory, AudioContextOptions}, node::AudioNode};
use web_audio_api::context::BaseAudioContext;
use crate::superdough::{ADSR, BPF, Delay, FilterADSR, HPF, Loop, LPF, sample, superdough, superdough_synth};


#[derive(Debug)]
pub struct WebAudioMessage {
    pub note: f32,
    pub instant: Instant,
    pub offset: f64,
    pub waveform: String,
    pub lpf: LPF,
    pub hpf: HPF,
    pub bpf: BPF,
    pub duration: f64,
    pub velocity: f32,
    pub delay: Delay,
    pub orbit: usize,
    pub speed: f32,
    pub begin: f64,
    pub end: f64,
    pub looper: Loop,
    pub adsr: ADSR,
    pub lpenv: FilterADSR,
    pub hpenv: FilterADSR,
    pub bpenv: FilterADSR,
    pub n: usize,
    pub sampleurl: String,
}

pub struct AsyncInputTransmitWebAudio {
    pub inner: Mutex<mpsc::Sender<Vec<WebAudioMessage>>>,
}

pub fn init(
    async_input_receiver: mpsc::Receiver<Vec<WebAudioMessage>>,
    mut async_output_receiver: mpsc::Receiver<Vec<WebAudioMessage>>,
    async_output_transmitter: mpsc::Sender<Vec<WebAudioMessage>>,
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

    // Create audio context
    let latency_hint = match std::env::var("WEB_AUDIO_LATENCY").as_deref() {
        Ok("playback") => AudioContextLatencyCategory::Playback,
        _ => AudioContextLatencyCategory::default(),
    };
    let mut audio_context = AudioContext::new(AudioContextOptions {
        latency_hint,
        ..AudioContextOptions::default()
    });
    // Create audio context

    tauri::async_runtime::spawn(async move {
        /* ...........................................................
                            Prepare audio context
        ............................................................*/
        let cache:Cache<String, AudioBuffer>  = Cache::new(10_000);
        /* ...........................................................
                            Process queued messages
        ............................................................*/
        loop {
            let mut message_queue = message_queue_clone.lock().await;

            // Iterate over each message, play and remove messages when they are ready
            message_queue.retain(|message| {
                if message.instant.elapsed().as_millis() < message.offset as u128 {
                    return true;
                };

                match message.waveform.as_str() {
                    "sine" | "square" | "triangle" | "saw" => {
                        // superdough(message.clone(), &mut audio_context);
                        superdough_synth(message.clone(), &mut audio_context);
                    }
                    _ => {
                        let url = Url::parse(&*message.sampleurl).unwrap();
                        let fname = url.path_segments().and_then(Iterator::last).and_then(|name| if name.is_empty() { None } else { Some(name) }).unwrap_or("tmp.ben");
                        let file_path = "/Users/vasiliymilovidov/samples/".to_owned() + fname;
                        let url_copy = url.clone();
                        let file_path_copy = file_path.clone();

                        match cache.get(&file_path_copy) {
                            Some(buff) => {
                                sample(message.clone(), &mut audio_context, buff.clone());
                                return false;
                            }
                            None => {
                                match File::open(file_path_copy.clone()) {
                                    Ok(file) => {
                                        let buff = audio_context.decode_audio_data_sync(file).unwrap();
                                        cache.insert(file_path_copy.clone(), buff.clone());
                                    }
                                    Err(_) => {}
                                }
                            }
                        }
                        tokio::spawn(async move {
                            match tokio::fs::metadata(&file_path).await {
                                Ok(_) => {}
                                Err(_) => {
                                    let resp = reqwest::get(url_copy).await.unwrap();
                                    let bytes = resp.bytes().await.unwrap();
                                    let mut out = tokio::fs::File::create(file_path).await.unwrap();
                                    out.write_all(&bytes).await.unwrap();
                                }
                            }
                        });

                    }
                }
                return false;
            });
            tokio::time::sleep(Duration::from_millis(1)).await;
        }
    });
}

pub async fn async_process_model(
    mut input_receiver: mpsc::Receiver<Vec<WebAudioMessage>>,
    output_transmitter: mpsc::Sender<Vec<WebAudioMessage>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    while let Some(input) = input_receiver.recv().await {
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
    lpf: (f32, f32),
    hpf: (f32, f32),
    bpf: (f32, f32),
    duration: f64,
    velocity: f32,
    delay: (f32, f32, f32),
    orbit: usize,
    speed: f32,
    begin: f64,
    end: f64,
    looper: (u8, f64, f64),
    adsr: (f64, f64, f32, f64, u8),
    lpenv: (f64, f64, f64, f64, f64),
    hpenv: (f64, f64, f64, f64, f64),
    bpenv: (f64, f64, f64, f64, f64),
    n: usize,
    sampleurl: String,
}

// Called from JS
#[tauri::command]
pub async fn sendwebaudio(
    messagesfromjs: Vec<MessageFromJS>,
    state: tauri::State<'_, AsyncInputTransmitWebAudio>,
) -> Result<(), String> {
    let async_proc_input_tx = state.inner.lock().await;
    let mut messages_to_process: Vec<WebAudioMessage> = Vec::new();

    for m in messagesfromjs {
        let message_to_process = WebAudioMessage {
            note: m.note,
            instant: Instant::now(),
            offset: m.offset,
            waveform: m.waveform,
            lpf: LPF {
                frequency: m.lpf.0,
                resonance: m.lpf.1,
            },
            hpf: HPF {
                frequency: m.hpf.0,
                resonance: m.hpf.1,
            },
            bpf: BPF {
                frequency: m.bpf.0,
                resonance: m.bpf.1,
            },
            duration: m.duration,
            velocity: m.velocity,
            delay: Delay {
                wet: m.delay.0,
                delay_time: m.delay.1,
                feedback: m.delay.2,
            },
            orbit: m.orbit,
            speed: m.speed,
            begin: m.begin,
            end: m.end,
            looper: Loop {
                is_loop: m.looper.0,
                loop_start: m.looper.1,
                loop_end: m.looper.2,
            },
            adsr: ADSR {
                attack: m.adsr.0,
                decay: m.adsr.1,
                sustain: m.adsr.2,
                release: m.adsr.3,
                adsr_on: m.adsr.4,
            },
            lpenv: FilterADSR {
                attack: m.lpenv.0,
                decay: m.lpenv.1,
                sustain: m.lpenv.2,
                release: m.lpenv.3,
                env: m.lpenv.4,
            },
            hpenv: FilterADSR {
                attack: m.hpenv.0,
                decay: m.hpenv.1,
                sustain: m.hpenv.2,
                release: m.hpenv.3,
                env: m.hpenv.4,
            },
            bpenv: FilterADSR {
                attack: m.bpenv.0,
                decay: m.bpenv.1,
                sustain: m.bpenv.2,
                release: m.bpenv.3,
                env: m.bpenv.4,
            },
            n: m.n,
            sampleurl: m.sampleurl,
        };
        messages_to_process.push(message_to_process);
    }

    async_proc_input_tx.send(messages_to_process).await.map_err(|e| e.to_string())
}