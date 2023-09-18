use std::fs::File;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{ mpsc, Mutex };
use tokio::time::Instant;
use serde::Deserialize;
use std::thread::sleep;
use web_audio_api::context::{AudioContext, AudioContextLatencyCategory, AudioContextOptions, BaseAudioContext};
use web_audio_api::node::{AudioNode, AudioScheduledSourceNode, BiquadFilterNode, GainNode, OscillatorType};
use web_audio_api::node::BiquadFilterType::{Bandpass, Highpass, Lowpass};

#[derive(Clone, Copy, Debug)]
pub struct Delay {
    pub wet: f64,
    pub delay_time: f64,
    pub feedback: f64,
}

#[derive(Debug)]
pub struct WebAudioMessage {
    pub note: f32,
    pub instant: Instant,
    pub offset: f64,
    pub waveform: String,
    pub bank: String,
    pub cutoff: f32,
    pub resonance: f32,
    pub hcutoff: f32,
    pub hresonance: f32,
    pub bandf: f32,
    pub bandq: f32,
    pub duration: f64,
    pub velocity: f32,
    pub delay: Delay,
    pub speed: f32,
    pub begin: f64,
    pub end: f64,
    pub loop_packaged: (u8, f64, f64),
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
    bank: String,
    cutoff: f32,
    resonance: f32,
    hcutoff: f32,
    hresonance: f32,
    bandf: f32,
    bandq: f32,
    duration: f64,
    velocity: f32,
    delay: Vec<f64>,
    speed: f32,
    begin: f64,
    end: f64,
    loop_packaged: (u8, f64, f64),
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
            cutoff: m.cutoff,
            resonance: m.resonance,
            hcutoff: m.hcutoff,
            hresonance: m.hresonance,
            bandf: m.bandf,
            bandq: m.bandq,
            duration: m.duration,
            velocity: m.velocity,
            delay: Delay {
                wet: m.delay[0],
                delay_time: m.delay[1],
                feedback: m.delay[2],
            },
            speed: m.speed,
            begin: m.begin,
            end: m.end,
            loop_packaged: m.loop_packaged,
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
    let (lpf, hpf, bandpass) = create_filters(context, message);

    match message.waveform.as_str() {
        "sine" | "square" | "triangle" | "saw" => {
            let osc = context.create_oscillator();
            osc.set_type(create_osc_type(&message));
            osc.frequency().set_value(message.note);

            osc.connect(&lpf);
            connect_filters_to_envelope(&env, message, &hpf, &bandpass, now);
            osc.start_at(now);
            osc.stop_at(now + 2.0);
        }
        _ => {
            match File::open(format!("samples/{}/{}.wav", message.bank, message.waveform)) {
                Ok(file) => {
                    let audio_buffer = context.decode_audio_data_sync(file).unwrap();
                    let audio_buffer_duration = audio_buffer.duration();
                    let src = context.create_buffer_source();
                    src.set_buffer(audio_buffer);
                    src.connect(&lpf);
                    connect_filters_to_envelope(&env, message, &hpf, &bandpass, now);
                    src.playback_rate().set_value(message.speed);
                    if message.loop_packaged.0 == 1 {
                        src.set_loop(true);
                        src.set_loop_start(message.loop_packaged.1);
                        src.set_loop_end(message.loop_packaged.2);
                        src.start_at_with_offset_and_duration(now, src.loop_start(), audio_buffer_duration / message.speed as f64);
                    };
                    // println!("{}", message.is_loop);
                    // src.start_at_with_offset_and_duration(now, message.begin * audio_buffer_duration, audio_buffer_duration / message.speed as f64);
                    src.stop_at(now + 2.0);
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

fn create_filters(context: &mut AudioContext, message: &WebAudioMessage) -> (BiquadFilterNode, BiquadFilterNode, BiquadFilterNode) {
    let lpf = context.create_biquad_filter();
    lpf.set_type(Lowpass);
    lpf.frequency().set_value(message.cutoff);
    lpf.q().set_value(message.resonance);

    let hpf = context.create_biquad_filter();
    hpf.set_type(Highpass);
    hpf.frequency().set_value(message.hcutoff);
    hpf.q().set_value(message.hresonance);

    let bandpass = context.create_biquad_filter();
    bandpass.set_type(Bandpass);

    lpf.connect(&hpf);

    (lpf, hpf, bandpass)
}

fn connect_filters_to_envelope(envelope: &GainNode, message: &WebAudioMessage, hpf: &BiquadFilterNode, bandpass: &BiquadFilterNode, now: f64) {
    if message.bandf > 0.0 {
        bandpass.frequency().set_value(message.bandf);
        bandpass.q().set_value(message.bandq);
        hpf.connect(bandpass);
        bandpass.connect(envelope);
    } else {
        hpf.connect(envelope);
    }

    envelope.gain()
        .set_value_at_time(0., now)
        .linear_ramp_to_value_at_time(message.velocity, now + 0.001)
        .exponential_ramp_to_value_at_time(0.0001, now + message.duration * 2.0);
}


