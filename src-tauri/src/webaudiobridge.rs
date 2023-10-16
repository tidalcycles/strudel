use std::{
    sync::Arc,
    time::Duration,
    fs::File,
    path::Path,
    time::Instant,
};
use mini_moka::sync::Cache;
use reqwest::Url;
use tokio::{
    fs,
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
use crate::superdough::{ADSR, apply_filter_adsr, BPF, Delay, FilterADSR, HPF, Loop, LPF, Sampler, Synth, WebAudioInstrument};


#[derive(Debug, Clone)]
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
        let compressor = audio_context.create_dynamics_compressor();
        compressor.threshold().set_value(-50.0);
        compressor.connect(&audio_context.destination());
        let delay = audio_context.create_delay(1.);
        let output = audio_context.create_gain();
        output.connect(&compressor);
        delay.connect(&output);
        let feedback = audio_context.create_gain();
        feedback.connect(&delay);
        delay.connect(&feedback);
        let pre_gain = audio_context.create_gain();
        pre_gain.connect(&feedback);
        let input = audio_context.create_gain();
        input.connect(&pre_gain);
        let cache: Cache<String, AudioBuffer> = Cache::builder()
            .max_capacity(31 * 1024 * 1024)
            .time_to_idle(Duration::from_secs(40))
            .build();
        loop {
            match receiver.recv() {
                Ok(message) => {
                    match message.waveform.as_str() {
                        "sine" | "square" | "triangle" | "saw" | "sawtooth" => {
                            let t = audio_context.current_time();
                            delay.delay_time().set_value(message.delay.delay_time);
                            feedback.gain().set_value(message.delay.feedback);
                            pre_gain.gain().set_value_at_time(message.delay.wet, t + message.delay.delay_time as f64);

                            let mut synth = Synth::new(&mut audio_context);
                            synth.set_frequency(&message.note);
                            synth.set_waveform(&message.waveform);
                            let filters = synth.set_filters(&mut audio_context, &message);
                            if message.delay.wet > 0.0 {
                                synth.envelope.connect(&input);
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
                            let url = Url::parse(&*message.sampleurl).expect("failed to parse url");
                            let filename = url.path_segments()
                                .and_then(Iterator::last)
                                .and_then(|name| if name.is_empty() { None } else { Some(name) })
                                .unwrap_or("tmp.ben");
                            let file_path = format!("samples/{}{}", message.dirname, filename);
                            let file_path_clone = file_path.clone();

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

                            if let Some(audio_buffer) = cache.get(&file_path_clone) {
                                let t = audio_context.current_time();
                                delay.delay_time().set_value(message.delay.delay_time);
                                feedback.gain().set_value(message.delay.feedback);
                                pre_gain.gain().set_value_at_time(message.delay.wet, t + message.delay.delay_time as f64);
                                let audio_buffer_duration = audio_buffer.duration();
                                let mut sampler = Sampler::new(&mut audio_context, audio_buffer);
                                match message.unit {
                                    Some(_) => {
                                        sampler.sample.playback_rate().set_value(message.speed * audio_buffer_duration as f32 * 1.0);
                                    }
                                    _ => {
                                        sampler.sample.playback_rate().set_value(message.speed * message.playbackrate);
                                    }
                                }
                                sampler.set_adsr(t, &message.adsr, message.velocity, message.duration);
                                let filters = sampler.set_filters(&mut audio_context, &message);
                                if is_filter_envelope_on(&message.lpenv) || is_filter_envelope_on(&message.hpenv) || is_filter_envelope_on(&message.bpenv) {
                                    for f in &filters {
                                        apply_filter_adsr(f, &message, &f.type_(), t);
                                    }
                                }
                                if message.delay.wet > 0.0 {
                                    sampler.envelope.connect(&input);
                                };
                                sampler.envelope.connect(&compressor);
                                sampler.play(t, &message, audio_buffer_duration);
                            } else if let Ok(file) = File::open(&file_path_clone) {
                                let audio_buffer = audio_context.decode_audio_data_sync(file)
                                    .unwrap_or_else(|_| panic!("Failed to decode audio data"));
                                cache.insert(file_path_clone.clone(), audio_buffer);
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
    delay: (f32, f32, f32),
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
            dirname: m.dirname,
            unit: m.unit,
            playbackrate: m.playbackrate,
        };
        messages_to_process.push(message_to_process);
    }

    async_proc_input_tx.send(messages_to_process).await.map_err(|e| e.to_string())
}

async fn create_file_and_dirs(path: &Path) -> fs::File {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).await.unwrap();
    }
    let file = fs::File::create(path).await.unwrap();
    file
}

fn is_filter_envelope_on(adsr: &FilterADSR) -> bool {
    adsr.env.is_some() || adsr.attack.is_some() || adsr.decay.is_some() || adsr.sustain.is_some() || adsr.release.is_some()
}