use std::{
    sync::Arc,
    time::Duration,
    fs::File,
    path::Path,
    time::Instant,
};
use std::collections::HashMap;
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
use web_audio_api::context::OfflineAudioContext;
use web_audio_api::node::{DynamicsCompressorNode};
use crate::reverbgen::{create_impulse_response, generate_coefficients_lp, write_to_buffer};
use crate::superdough::{ADSRMessage, apply_filter_adsr, BPFMessage, DelayMessage, Delay, FilterADSRMessage, HPFMessage, LoopMessage, LPFMessage, Sampler, Synth, WebAudioInstrument, ReverbMessage, Reverb};

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
                                delays.entry(message.orbit).or_insert({
                                    Delay::new(&audio_context, &compressor)
                                });
                                let delay = delays.get(&message.orbit).unwrap();
                                synth.envelope.connect(&delay.input);
                                delay.delay.delay_time().set_value(message.delay.delay_time.unwrap_or(0.25));
                                delay.feedback.gain().set_value(message.delay.feedback.unwrap_or(0.5));
                                delay.pre_gain.gain().set_value_at_time(message.delay.wet.unwrap_or(0.25), t + message.delay.delay_time.unwrap_or(0.5) as f64);
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
                            // CREATE FILEPATHS
                            let (url, file_path, file_path_clone) = create_filepath(&message);

                            // DOWNLOAD FILE IS IT DOESN'T EXIST
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

                            // IF BUFFER IS CACHED - PLAY IT
                            if let Some(audio_buffer) = cache.get(&file_path_clone) {
                                let audio_buffer_duration = audio_buffer.duration();
                                let mut sampler = Sampler::new(&mut audio_context, audio_buffer);

                                // PLAYBACK SPEED
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

                                // FILTERS
                                let filters = sampler.set_filters(&mut audio_context, &message);
                                if is_filter_envelope_on(&message.lpenv) || is_filter_envelope_on(&message.hpenv) || is_filter_envelope_on(&message.bpenv) {
                                    for f in &filters {
                                        apply_filter_adsr(f, &message, &f.type_(), t);
                                    }
                                }

                                // DELAY
                                if message.delay.wet.is_some() {
                                    apply_delay(&mut audio_context, &mut delays, &compressor, &message, t, &mut sampler);
                                };

                                if message.reverb.room.is_some() && message.reverb.room.unwrap() > 0.0 {
                                    apply_reverb(&audio_context, &compressor, &ir_cache, &message, &mut sampler, &mut reverbs);
                                }

                                // CONNECT SAMPLER TO OUTPUT AND PLAY
                                sampler.envelope.connect(&compressor);
                                sampler.play(t, &message, message.adsr.release.unwrap_or(0.001));

                                // IF FILE EXIST - DECODE IT
                            } else if let Ok(file) = File::open(&file_path_clone) {
                                let cache_clone = cache.clone();
                                tokio::spawn(async move {
                                    let context = OfflineAudioContext::new(2, 88200, 44100.0);
                                    let audio_buffer = context.decode_audio_data_sync(file).expect("OOOPS!");
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

fn apply_delay(audio_context: &mut AudioContext, delays: &mut HashMap<usize, Delay>, compressor: &DynamicsCompressorNode, message: &WebAudioMessage, t: f64, mut sampler: &mut Sampler) {
    delays.entry(message.orbit).or_insert({
        Delay::new(&audio_context, &compressor)
    });
    let delay = delays.get(&message.orbit).unwrap();
    sampler.envelope.connect(&delay.input);
    delay.delay.delay_time().set_value(message.delay.delay_time.unwrap_or(0.25));
    delay.feedback.gain().set_value(message.delay.feedback.unwrap_or(0.5));
    delay.pre_gain.gain().set_value_at_time(message.delay.wet.unwrap_or(0.25), t + message.delay.delay_time.unwrap_or(0.5) as f64);
}

fn apply_reverb(mut audio_context: &AudioContext, compressor: &DynamicsCompressorNode, cache: &Cache<String, AudioBuffer>, message: &WebAudioMessage, mut sampler: &mut Sampler, reverbs: &mut HashMap<usize, Reverb>) {


    if message.reverb.ir.is_none() {

        let key = format!("reverb: {}{}{}{}{}", message.reverb.room.unwrap_or(0.0), message.reverb.size.unwrap_or(1.0), message.reverb.roomlp.unwrap_or(0.0), message.reverb.roomfade.unwrap_or(0.0), message.reverb.roomdim.unwrap_or(0.0));

        if let Some(ir) = cache.get(&key) {

            let reverb = reverbs.entry(message.orbit).or_insert({
                let mut reverb = Reverb::new(&audio_context, message.reverb.room, message.reverb.size, message.reverb.roomlp, message.reverb.roomfade, message.reverb.roomdim, &compressor);
                reverb.convolver.set_buffer(ir.clone());
                sampler.envelope.connect(&reverb.convolver);
                reverb
            });

            if reverb.room.unwrap_or(0.0) != message.reverb.room.unwrap_or(0.0)
                || reverb.roomlp.unwrap_or(0.0) != message.reverb.roomlp.unwrap_or(0.0)
                || reverb.roomfade.unwrap_or(0.0) != message.reverb.roomfade.unwrap_or(0.0)
                || reverb.roomdim.unwrap_or(0.3) != message.reverb.roomdim.unwrap_or(0.0)
                || reverb.roomsize.unwrap_or(0.0) != message.reverb.size.unwrap_or(0.0)
                || reverb.roomfade.unwrap_or(0.0) != message.reverb.roomfade.unwrap_or(0.0) {
                reverb.room = message.reverb.room;
                reverb.roomlp = message.reverb.roomlp;
                reverb.roomfade = message.reverb.roomfade;
                reverb.roomdim = message.reverb.roomdim;
                reverb.roomsize = message.reverb.size;

                let len = (audio_context.sample_rate() * message.reverb.size.unwrap_or(1.0)) as usize;
                let decay = 4.0;
                let num_coeffs = 101;
                let fade = 2.4;
                let cutoff = 500.0 / audio_context.sample_rate();
                let cache_cache = cache.clone();
                let mut buffer = audio_context.create_buffer(2, len, 44100.0);
                tokio::spawn(async move {
                    // GENERATE IR
                    let fir = generate_coefficients_lp(num_coeffs, cutoff);
                    let ir = create_impulse_response(len, decay, &fir, 44100.0, fade);
                    write_to_buffer(&mut buffer, &ir);
                    cache_cache.insert(key, buffer);
                });
            }
            reverb.convolver.set_buffer(ir);
            sampler.envelope.connect(&reverb.convolver);

            // IF BUFFER IS NOT CACHED - GENERATE NEW BUFFER
        } else {
            let len = (audio_context.sample_rate() * message.reverb.size.unwrap_or(1.0)) as usize;
            let decay = 4.0;
            let num_coeffs = 101;
            let fade = 2.4;
            let cutoff = 500.0 / audio_context.sample_rate();
            let cache_cache = cache.clone();
            let mut buffer = audio_context.create_buffer(2, len, 44100.0);
            tokio::spawn(async move {
                // GENERATE IR
                let fir = generate_coefficients_lp(num_coeffs, cutoff);
                let ir = create_impulse_response(len, decay, &fir, 44100.0, fade);
                write_to_buffer(&mut buffer, &ir);
                cache_cache.insert(key, buffer);
            });
        }
    } else if message.reverb.ir.is_some() {
        let (ir_url, ir_file_path, ir_file_path_clone) = create_ir_filepath(&message);
        let ir_cache_clone = cache.clone();
        let requested_size = message.reverb.size.unwrap_or(2.0).clone();
        if let Some(ir_buffer) = cache.get(&ir_file_path_clone) {
            let reverb = reverbs.entry(message.orbit).or_insert({
                let mut reverb = Reverb::new(&audio_context, message.reverb.room, message.reverb.size, message.reverb.roomlp, message.reverb.roomfade, message.reverb.roomdim, &compressor);
                reverb.convolver.set_buffer(ir_buffer.clone());
                sampler.envelope.connect(&reverb.convolver);
                reverb
            });

            if reverb.roomsize.unwrap_or(0.0) != message.reverb.size.unwrap_or(0.0) {
                adjust_length(&mut audio_context, cache, message, ir_file_path_clone, requested_size, reverb);
            }

            reverb.convolver.set_buffer(ir_buffer);
            sampler.envelope.connect(&reverb.convolver);
        } else {
            tokio::spawn(async move {
                if let Ok(file1) = File::open(&ir_file_path) {
                    create_new_ir_buffer_from_file(&ir_file_path, ir_cache_clone, requested_size, file1);
                } else if tokio::fs::metadata(&ir_file_path.clone()).await.is_err() {
                    download_file(ir_url, &ir_file_path).await;
                }
            });
        }
    }
}

async fn download_file(ir_url: Url, ir_file_path: &String) {
    let response = reqwest::get(ir_url)
        .await
        .unwrap_or_else(|_| panic!("Failed to send GET request"));
    let bytes = response.bytes().await.unwrap();
    let path = Path::new(&ir_file_path);
    let mut file = create_file_and_dirs(path).await;
    file.write_all(&bytes)
        .await
        .unwrap_or_else(|_| panic!("Failed to write to file"));
}

fn create_new_ir_buffer_from_file(ir_file_path: &String, ir_cache_clone: Cache<String, AudioBuffer>, requested_size: f32, file1: File) {
    let context = OfflineAudioContext::new(2, 400, 44100.0);
    let ir_buffer = context.decode_audio_data_sync(file1).expect("IR OOOOPS");
    let new_length = ir_buffer.sample_rate() * requested_size;
    let mut new_buffer = context.create_buffer(ir_buffer.number_of_channels(), new_length as usize, ir_buffer.sample_rate());
    for ch in 0..ir_buffer.number_of_channels() {
        let old_data = ir_buffer.get_channel_data(ch);
        let new_data = new_buffer.get_channel_data_mut(ch);

        for i in 0..new_length as usize {
            if i < old_data.len() {
                new_data[i] = old_data[i];
            } else {
                new_data[i] = 0.0;
            }
        }
    }
    ir_cache_clone.insert(ir_file_path.clone(), new_buffer);
}

fn adjust_length(audio_context: &mut &AudioContext, cache: &Cache<String, AudioBuffer>, message: &WebAudioMessage, ir_file_path_clone: String, requested_size: f32, reverb: &mut Reverb) {
    let buf = reverb.convolver.buffer().unwrap();
    reverb.roomsize = message.reverb.size;
    let new_length = buf.sample_rate() * requested_size;
    let mut new_buffer = audio_context.create_buffer(buf.number_of_channels(), new_length as usize, buf.sample_rate());

    for ch in 0..buf.number_of_channels() {
        let old_data = buf.get_channel_data(ch);
        let new_data = new_buffer.get_channel_data_mut(ch);

        for i in 0..new_length as usize {
            if i < old_data.len() {
                new_data[i] = old_data[i];
            } else {
                new_data[i] = 0.0;
            }
        }
    }

    reverb.convolver.set_buffer(new_buffer.clone());
    cache.insert(ir_file_path_clone.clone(), new_buffer);
}


async fn generate_buffer_and_update_cache(audio_context: &AudioContext, size: f32, key: String, cache: Cache<String, AudioBuffer>) {
    let len = (audio_context.sample_rate() * size) as usize;
    let decay = 4.0;
    let num_coeffs = 101;
    let fade = 2.4;
    let cutoff = 500.0 / audio_context.sample_rate();

    let mut buffer = audio_context.create_buffer(2, len, 44100.0);

    let fir = generate_coefficients_lp(num_coeffs, cutoff);
    let ir = create_impulse_response(len, decay, &fir, 44100.0, fade);
    write_to_buffer(&mut buffer, &ir);

    cache.insert(key, buffer);
}


fn create_filepath(message: &WebAudioMessage) -> (Url, String, String) {
    let url = Url::parse(&*message.sampleurl).expect("failed to parse url");
    let filename = url.path_segments()
        .and_then(Iterator::last)
        .and_then(|name| if name.is_empty() { None } else { Some(name) })
        .unwrap_or("tmp.ben");
    let file_path = format!("/Users/vasiliymilovidov/samples/{}{}", message.dirname, filename);
    let file_path_clone = file_path.clone();
    (url, file_path, file_path_clone)
}

fn create_ir_filepath(message: &WebAudioMessage) -> (Url, String, String) {
    let url = Url::parse(&message.reverb.url.clone().unwrap()).expect("failed to parse url");
    let filename = url.path_segments()
        .and_then(Iterator::last)
        .and_then(|name| if name.is_empty() { None } else { Some(name) })
        .unwrap_or("tmp.ben");
    let file_path = format!("/Users/vasiliymilovidov/samples/{}{}", message.dirname, filename);
    let file_path_clone = file_path.clone();
    (url, file_path, file_path_clone)
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

async fn create_file_and_dirs(path: &Path) -> fs::File {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).await.unwrap();
    }
    let file = fs::File::create(path).await.unwrap();
    file
}

fn is_filter_envelope_on(adsr: &FilterADSRMessage) -> bool {
    adsr.env.is_some() || adsr.attack.is_some() || adsr.decay.is_some() || adsr.sustain.is_some() || adsr.release.is_some()
}