use std::fs::File;
use web_audio_api::context::{AudioContext, BaseAudioContext};
use web_audio_api::node::{AudioNode, AudioScheduledSourceNode, BiquadFilterNode, BiquadFilterType, GainNode, OscillatorType};
use web_audio_api::node::BiquadFilterType::{Bandpass, Highpass, Lowpass};
use crate::webaudiobridge::WebAudioMessage;

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

pub fn superdough(message: &WebAudioMessage, context: &mut AudioContext) {
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
                    connect_filters_to_envelope(
                        &env,
                        message,
                        filters.get(1).unwrap(),
                        filters.get(2).unwrap(),
                    );
                    src.playback_rate().set_value(message.speed);

                    if message.looper.is_loop > 0 {
                        src.set_loop(true);
                        src.set_loop_start(message.looper.loop_start);
                        src.set_loop_end(message.looper.loop_end);
                        src.start_at_with_offset_and_duration(
                            now,
                            src.loop_start(),
                            audio_buffer_duration / message.speed as f64,
                        );
                        apply_adsr(&env, message, now);
                        for f in filters {
                            apply_filter_adsr(&f, message, &f.type_(), now);
                        }
                        src.stop_at(now + message.duration + message.adsr.release);
                    } else {
                        src.start_at_with_offset_and_duration(
                            now,
                            message.begin * audio_buffer_duration,
                            audio_buffer_duration / message.speed as f64,
                        );
                        apply_adsr(&env, message, now);
                        for f in filters {
                            apply_filter_adsr(&f, message, &f.type_(), now);
                        }
                        src.stop_at(now + message.duration + 0.2);
                    }
                }
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
        .linear_ramp_to_value_at_time(
            message.adsr.sustain * message.velocity,
            now + message.adsr.attack + message.adsr.decay
        )
        .linear_ramp_to_value_at_time(0.0, now + message.duration + message.adsr.release);
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

    filter_node.frequency().set_value_at_time(min, now);
    filter_node.frequency().linear_ramp_to_value_at_time(peak, now + env.attack);
    filter_node.frequency().linear_ramp_to_value_at_time(sustain_level, now + env.attack + env.decay);
    filter_node.frequency().set_value_at_time(sustain_level, now + message.duration);
    filter_node.frequency().linear_ramp_to_value_at_time(min, now + message.duration + env.release.max(0.1));
}

