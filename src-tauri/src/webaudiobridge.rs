use std::{
    sync::Arc,
    time::Duration,
    fs::File,
    path::Path,
    time::Instant,
};
use std::collections::HashMap;
use mini_moka::sync::Cache;
use tokio::{
    sync::{mpsc, Mutex},
    io::AsyncWriteExt,
};
use serde::Deserialize;
use web_audio_api::{
    context::BaseAudioContext,
    AudioBuffer,
    context::{AudioContext, AudioContextLatencyCategory, AudioContextOptions},
    node::AudioNode,
};
use web_audio_api::context::OfflineAudioContext;
use crate::webaudio::*;

#[derive(Debug, Clone)]
pub struct WebAudioMessage {
    pub note: f32,
    pub instant: Instant,
    pub offset: f64,
    pub waveform: String,
    pub lpf: LPFMessage,
    pub hpf: HPFMessage,
    pub bpf: BPFMessage,
    pub duration: f64,
    pub velocity: f32,
    pub delay: DelayMessage,
    pub reverb: ReverbMessage,
    pub orbit: usize,
    pub speed: f32,
    pub begin: f64,
    pub end: f64,
    pub looper: LoopMessage,
    pub adsr: ADSRMessage,
    pub lpenv: FilterADSRMessage,
    pub hpenv: FilterADSRMessage,
    pub bpenv: FilterADSRMessage,
    pub n: usize,
    pub sampleurl: String,
    pub dirname: String,
    pub unit: Option<String>,
    pub playbackrate: f32,
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
    let (sender, receiver) = std::sync::mpsc::channel();

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
                            Process queued messages
        ............................................................*/
        loop {
            let mut message_queue = message_queue_clone.lock().await;

            // Iterate over each message, play and remove messages when they are ready
            message_queue.retain(|message| {
                if message.instant.elapsed().as_millis() < message.offset as u128 {
                    return true;
                };

                match sender.send(message.clone()) {
                    Ok(_) => {}
                    Err(_) => {}
                };

                return false;
            });
            tokio::time::sleep(Duration::from_millis(1)).await;
        }
    });

    /* ...........................................................
                          Create and setup WebAudio
       ............................................................*/
    tauri::async_runtime::spawn(async move {
        let latency_hint = match std::env::var("WEB_AUDIO_LATENCY").as_deref() {
            Ok("playback") => AudioContextLatencyCategory::Playback,
            _ => AudioContextLatencyCategory::default(),
        };
        let mut audio_context = AudioContext::new(AudioContextOptions {
            latency_hint,
            ..AudioContextOptions::default()
        });
        let _ = audio_context.create_buffer_source();
        let mut delays: HashMap<usize, Delay> = HashMap::new();
        let mut reverbs: HashMap<usize, Reverb> = HashMap::new();

        let compressor = audio_context.create_dynamics_compressor();
        compressor.threshold().set_value(-50.0);
        compressor.connect(&audio_context.destination());

        let cache: Cache<String, AudioBuffer> = Cache::builder()
            .max_capacity(31 * 1024 * 1024)
            .time_to_idle(Duration::from_secs(40))
            .build();
        let ir_cache: Cache<String, AudioBuffer> = Cache::builder().max_capacity(31 * 1024 * 1024).build();

        loop {
            match receiver.recv() {
                Ok(message) => {
                    match message.waveform.as_str() {
                        "sine" | "square" | "triangle" | "saw" | "sawtooth" => {
                            let t = audio_context.current_time();
                            let mut synth = Synth::new(&mut audio_context);
                            synth.set_frequency(&message.note);
                            synth.set_waveform(&message.waveform);
                            let filters = synth.set_filters(&mut audio_context, &message);
                            if message.delay.wet.is_some() {
                                apply_delay(&mut audio_context, &mut delays, &compressor, &message, t, &mut synth);
                            }
                            if message.reverb.room.is_some() && message.reverb.room.unwrap() > 0.0 {
                                apply_reverb(&audio_context, &compressor, &ir_cache, &message, &mut synth, &mut reverbs);
                            }
                            synth.envelope.connect(&compressor);
                            synth.play(t, &message, message.adsr.release.unwrap_or(0.001));
                            synth.set_adsr(t, &message.adsr, message.velocity, message.duration);
                            if is_filter_envelope_on(&message.lpenv) || is_filter_envelope_on(&message.hpenv) || is_filter_envelope_on(&message.bpenv) {
                                for f in &filters {
                                    apply_filter_adsr(f, &message, &f.type_(), t);
                                }
                            }
                        }
                        _ => {
                            let t = audio_context.current_time();

                            // Create filepaths
                            let message_url = &message.sampleurl.clone();
                            let (url, file_path, file_path_clone) = create_filepath_generic(message_url, &message.dirname);

                            // Download file if it doesn't exist
                            tokio::spawn(async move {
                                if tokio::fs::metadata(&file_path.clone()).await.is_err() {
                                    let response = reqwest::get(url)
                                        .await
                                        .unwrap_or_else(|_| panic!("Failed to send GET request"));

                                    let bytes = response.bytes().await.unwrap();
                                    let path = Path::new(&file_path);
                                    let mut file = create_file_and_dirs(path).await;
                                    file.write_all(&bytes)
                                        .await
                                        .unwrap_or_else(|_| panic!("Failed to write to file"));
                                }
                            });

                            // Play the buffer, if exists
                            if let Some(audio_buffer) = cache.get(&file_path_clone) {
                                let audio_buffer_duration = audio_buffer.duration();
                                let mut sampler = Sampler::new(&mut audio_context, audio_buffer);

                                // Playback speed
                                match message.unit {
                                    Some(_) => {
                                        sampler.sample.playback_rate().set_value(message.speed * audio_buffer_duration as f32 * 1.0);
                                    }
                                    _ => {
                                        sampler.sample.playback_rate().set_value(message.speed * message.playbackrate);
                                    }
                                }

                                // ADSR
                                sampler.set_adsr(t, &message.adsr, message.velocity, message.duration);

                                // Filters
                                let filters = sampler.set_filters(&mut audio_context, &message);
                                if is_filter_envelope_on(&message.lpenv) || is_filter_envelope_on(&message.hpenv) || is_filter_envelope_on(&message.bpenv) {
                                    for f in &filters {
                                        apply_filter_adsr(f, &message, &f.type_(), t);
                                    }
                                }

                                // Delay
                                if message.delay.wet.is_some() {
                                    apply_delay(&mut audio_context, &mut delays, &compressor, &message, t, &mut sampler);
                                };

                                // Reverb
                                if message.reverb.room.is_some() && message.reverb.room.unwrap() > 0.0 {
                                    apply_reverb(&audio_context, &compressor, &ir_cache, &message, &mut sampler, &mut reverbs);
                                }

                                // Connect to output
                                sampler.envelope.connect(&compressor);
                                sampler.play(t, &message, message.adsr.release.unwrap_or(0.001));

                                // Decode file, if it exists
                            } else if let Ok(file) = File::open(&file_path_clone) {
                                let cache_clone = cache.clone();
                                tokio::spawn(async move {
                                    let context = OfflineAudioContext::new(2, 88200, 44100.0);
                                    let audio_buffer = context.decode_audio_data_sync(file).expect("Failed to decode file");
                                    cache_clone.insert(file_path_clone.clone(), audio_buffer);
                                });
                            }
                        }
                    }
                }
                Err(_) => {}
            }
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
    delay: (Option<f32>, Option<f32>, Option<f32>),
    reverb: (Option<f32>, Option<f32>, Option<f32>, Option<f32>, Option<f32>, Option<String>, Option<String>),
    orbit: usize,
    speed: f32,
    begin: f64,
    end: f64,
    looper: (u8, f64, f64),
    adsr: (Option<f64>, Option<f64>, Option<f32>, Option<f64>),
    lpenv: (Option<f64>, Option<f64>, Option<f64>, Option<f64>, Option<f64>),
    hpenv: (Option<f64>, Option<f64>, Option<f64>, Option<f64>, Option<f64>),
    bpenv: (Option<f64>, Option<f64>, Option<f64>, Option<f64>, Option<f64>),
    n: usize,
    sampleurl: String,
    dirname: String,
    unit: Option<String>,
    playbackrate: f32,
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
            lpf: LPFMessage {
                frequency: m.lpf.0,
                resonance: m.lpf.1,
            },
            hpf: HPFMessage {
                frequency: m.hpf.0,
                resonance: m.hpf.1,
            },
            bpf: BPFMessage {
                frequency: m.bpf.0,
                resonance: m.bpf.1,
            },
            duration: m.duration,
            velocity: m.velocity,
            delay: DelayMessage {
                wet: m.delay.0,
                delay_time: m.delay.1,
                feedback: m.delay.2,
            },
            reverb: ReverbMessage {
                room: m.reverb.0,
                size: m.reverb.1,
                roomfade: m.reverb.2,
                roomlp: m.reverb.3,
                roomdim: m.reverb.4,
                ir: m.reverb.5,
                url: m.reverb.6,
            },
            orbit: m.orbit,
            speed: m.speed,
            begin: m.begin,
            end: m.end,
            looper: LoopMessage {
                is_loop: m.looper.0,
                loop_start: m.looper.1,
                loop_end: m.looper.2,
            },
            adsr: ADSRMessage {
                attack: m.adsr.0,
                decay: m.adsr.1,
                sustain: m.adsr.2,
                release: m.adsr.3,
            },
            lpenv: FilterADSRMessage {
                attack: m.lpenv.0,
                decay: m.lpenv.1,
                sustain: m.lpenv.2,
                release: m.lpenv.3,
                env: m.lpenv.4,
            },
            hpenv: FilterADSRMessage {
                attack: m.hpenv.0,
                decay: m.hpenv.1,
                sustain: m.hpenv.2,
                release: m.hpenv.3,
                env: m.hpenv.4,
            },
            bpenv: FilterADSRMessage {
                attack: m.bpenv.0,
                decay: m.bpenv.1,
                sustain: m.bpenv.2,
                release: m.bpenv.3,
                env: m.bpenv.4,
            },
            n: m.n,
            sampleurl: m.sampleurl,
            dirname: m.dirname,
            unit: m.unit,
            playbackrate: m.playbackrate,
        };
        messages_to_process.push(message_to_process);
    }

    async_proc_input_tx.send(messages_to_process).await.map_err(|e| e.to_string())
}

