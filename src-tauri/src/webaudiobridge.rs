use std::fs::File;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{ mpsc, Mutex };
use tokio::time::Instant;
use serde::Deserialize;
use std::thread::sleep;
use web_audio_api::context::{AudioContext, AudioContextLatencyCategory, AudioContextOptions, BaseAudioContext};
use web_audio_api::node::{AudioNode, AudioScheduledSourceNode, BiquadFilterNode, BiquadFilterType, GainNode, OscillatorType};
use web_audio_api::node::BiquadFilterType::{Bandpass, Highpass, Lowpass};

#[derive(Clone, Copy, Debug)]
pub struct Delay {
    pub wet: f64,
    pub delay_time: f64,
    pub feedback: f64,
}

#[derive(Clone, Copy, Debug)]
pub struct Loop {
    pub is_loop: u8,
    pub loop_start: f64,
    pub loop_end: f64,
}

#[derive(Clone, Copy, Debug)]
pub struct LPF {
    pub frequency: f32,
    pub resonance: f32,
}

#[derive(Clone, Copy, Debug)]
pub struct HPF {
    pub frequency: f32,
    pub resonance: f32,
}

#[derive(Clone, Copy, Debug)]
pub struct BPF {
    pub frequency: f32,
    pub resonance: f32,
}

#[derive(Debug, Copy, Clone)]
pub struct ADSR {
    pub attack: f64,
    pub decay: f64,
    pub sustain: f32,
    pub release: f64,
}

#[derive(Debug, Copy, Clone)]
pub struct FilterADSR {
    pub attack: f64,
    pub decay: f64,
    pub sustain: f64,
    pub release: f64,
    pub env: f64,
}

#[derive(Debug)]
pub struct WebAudioMessage {
    pub note: f32,
    pub instant: Instant,
    pub offset: f64,
    pub waveform: String,
    pub bank: String,
    pub lpf: LPF,
    pub hpf: HPF,
    pub bpf: BPF,
    pub duration: f64,
    pub velocity: f32,
    pub delay: Delay,
    pub speed: f32,
    pub begin: f64,
    pub end: f64,
    pub looper: Loop,
    pub adsr: ADSR,
    pub lpenv: FilterADSR,
    pub hpenv: FilterADSR,
    pub bpenv: FilterADSR,
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

        let mut audio_context = AudioContext::new(AudioContextOptions {
            latency_hint,
            ..AudioContextOptions::default()
        });

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

                superdough(message.clone(), &mut audio_context);

                return false;
            });
            sleep(Duration::from_millis(1));
        }
    });
}

pub async fn async_process_model(
    mut input_receiver: mpsc::Receiver<Vec<WebAudioMessage>>,
    output_transmitter: mpsc::Sender<Vec<WebAudioMessage>>
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
    bank: String,
    lpf: (f32, f32),
    hpf: (f32, f32),
    bpf: (f32, f32),
    duration: f64,
    velocity: f32,
    delay: (f64, f64, f64),
    speed: f32,
    begin: f64,
    end: f64,
    looper: (u8, f64, f64),
    adsr: (f64, f64, f32, f64),
    lpenv: (f64, f64, f64, f64, f64),
    hpenv: (f64, f64, f64, f64, f64),
    bpenv: (f64, f64, f64, f64, f64),
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
            bank: m.bank,
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
        };
        messages_to_process.push(message_to_process);
    }

    async_proc_input_tx.send(messages_to_process).await.map_err(|e| e.to_string())
}

fn superdough(message: &WebAudioMessage, context: &mut AudioContext) {
    let now = context.current_time();
    let env = context.create_gain();
    env.gain().set_value(0.);
    env.connect(&context.destination());
    // let (lpf, hpf, bandpass) = create_filters(context, message);
    let filters = create_filters(context, message);

    match message.waveform.as_str() {
        "sine" | "square" | "triangle" | "saw" => {
            let osc = context.create_oscillator();
            osc.set_type(create_osc_type(&message));
            osc.frequency().set_value(message.note);
            osc.connect(filters.get(0).unwrap());
            connect_filters_to_envelope(&env, message, filters.get(1).unwrap(), filters.get(2).unwrap());
            osc.start_at(now);
            apply_adsr(&env, message, now);
            for f in filters {
                apply_filter_adsr(&f, message, &f.type_(), now);
            }
            osc.stop_at(now + message.duration + message.adsr.release);
        }
        _ => {
            match File::open(format!("samples/{}/{}.wav", message.bank, message.waveform)) {
                Ok(file) => {
                    let audio_buffer = context.decode_audio_data_sync(file).unwrap();
                    let audio_buffer_duration = audio_buffer.duration();
                    let src = context.create_buffer_source();
                    src.set_buffer(audio_buffer);
                    src.connect(filters.get(0).unwrap());
                    connect_filters_to_envelope(&env, message, filters.get(1).unwrap(), filters.get(2).unwrap());
                    src.playback_rate().set_value(message.speed);

                    if message.looper.is_loop > 0 {
                        src.set_loop(true);
                        src.set_loop_start(message.looper.loop_start);
                        src.set_loop_end(message.looper.loop_end);
                        src.start_at_with_offset_and_duration(now, src.loop_start(), audio_buffer_duration / message.speed as f64);
                        apply_adsr(&env, message, now);
                        for f in filters {
                            apply_filter_adsr(&f, message, &f.type_(), now);
                        }
                        src.stop_at(now + message.duration + message.adsr.release);
                    } else {
                        src.start_at_with_offset_and_duration(now, message.begin * audio_buffer_duration, audio_buffer_duration / message.speed as f64);
                    apply_adsr(&env, message, now);
                        for f in filters {
                        apply_filter_adsr(&f, message, &f.type_(), now);
                    }
                        src.stop_at(now + message.duration + 0.2);
                    }
                },
                Err(e) => eprintln!("Failed to open file: {:?}", e),
            }
        }
    }
}

fn create_osc_type(message: &WebAudioMessage) -> OscillatorType {
    match message.waveform.as_str() {
        "sine" => OscillatorType::Sine,
        "square" => OscillatorType::Square,
        "triangle" => OscillatorType::Triangle,
        "saw" => OscillatorType::Sawtooth,
        _ => panic!("Invalid oscillator type"),
    }
}

fn create_filters(context: &mut AudioContext, message: &WebAudioMessage) -> [BiquadFilterNode; 3] {
    let lpf = context.create_biquad_filter();
    lpf.set_type(Lowpass);

    lpf.q().set_value(message.lpf.resonance);

    let hpf = context.create_biquad_filter();
    hpf.set_type(Highpass);
    hpf.frequency().set_value(message.hpf.frequency);
    hpf.q().set_value(message.hpf.resonance);

    let bpf = context.create_biquad_filter();
    bpf.set_type(Bandpass);

    lpf.connect(&hpf);

    [lpf, hpf, bpf]
}

fn connect_filters_to_envelope(envelope: &GainNode, message: &WebAudioMessage, hpf: &BiquadFilterNode, bpf: &BiquadFilterNode) {
    if message.bpf.frequency > 0.0 {
        bpf.frequency().set_value(message.bpf.frequency);
        bpf.q().set_value(message.bpf.resonance);
        hpf.connect(bpf);
        bpf.connect(envelope);
    } else {
        hpf.connect(envelope);
    }
}

fn apply_adsr(envelope: &GainNode, message: &WebAudioMessage, now: f64) {
    envelope.gain()
        .set_value_at_time(0., now)
        .linear_ramp_to_value_at_time(message.velocity, now + message.adsr.attack)
        .linear_ramp_to_value_at_time(message.adsr.sustain, now + message.adsr.attack + message.adsr.decay)
        .exponential_ramp_to_value_at_time(0.0001, now + message.duration + message.adsr.release);
}

fn apply_filter_adsr(filter_node: &BiquadFilterNode, message: &WebAudioMessage, filter: &BiquadFilterType, now: f64) {
    let env = match filter {
        Lowpass => message.lpenv,
        Highpass => message.hpenv,
        Bandpass => message.bpenv,
        _ => message.lpenv,
    };

    let freq = match filter {
        Lowpass => message.lpf.frequency,
        Highpass => message.hpf.frequency,
        Bandpass => message.bpf.frequency,
        _ => 8000.0,
    };

    let offset = env.env * 0.5;
    let min = (2f32.powf(-offset as f32) * freq).clamp(0.0, 20000.0);
    let max = (2f32.powf((env.env - offset) as f32) * freq).clamp(0.0, 20000.0);
    let range = max - min;
    let peak = min + range;
    let sustain_level = min + env.sustain as f32 * range;

    filter_node.frequency().set_value_at_time(min as f32, now);
    filter_node.frequency().linear_ramp_to_value_at_time(peak as f32, now + env.attack);
    filter_node.frequency().linear_ramp_to_value_at_time(sustain_level as f32, now + env.attack + env.decay);
    filter_node.frequency().set_value_at_time(sustain_level as f32, now + message.duration);
    filter_node.frequency().linear_ramp_to_value_at_time(min as f32, now + message.duration + env.release.max(0.1));
}
