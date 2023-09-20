use std::fs::File;
use web_audio_api::context::{AudioContext, BaseAudioContext};
use web_audio_api::node::{AudioBufferSourceNode, AudioNode, AudioScheduledSourceNode, BiquadFilterNode, BiquadFilterType, GainNode, OscillatorNode, OscillatorType};
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
    pub adsr_on: u8,
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
    let mut chain: Vec<&dyn AudioNode> = Vec::new();

    // Play synth or sample
    match message.waveform.as_str() {
        "sine" | "square" | "triangle" | "saw" => {

            // Create nodes for synth playback
            let osc = context.create_oscillator();
            chain.push(&osc);
            let filters = create_filters(context, message);
            for f in &filters {
                chain.push(f);
            }
            let env = context.create_gain();
            chain.push(&env);

            // Connect nodes and play synth
            connect_nodes(chain, context);
            play_synth(&message, now, osc, filters, &env);
        }
        _ => {
            match File::open(format!("samples/{}/{}.wav", message.bank, message.waveform)) {
                Ok(file) => {

                    // Create nodes for sample playback
                    let audio_buffer = context.decode_audio_data_sync(file).unwrap();
                    let audio_buffer_duration = audio_buffer.duration();
                    let src = context.create_buffer_source();
                    src.set_buffer(audio_buffer);
                    chain.push(&src);
                    let filters = create_filters(context, message);
                    for f in &filters {
                        chain.push(f);
                    }
                    let env = context.create_gain();
                    chain.push(&env);

                    // Connect nodes and play sample
                    connect_nodes(chain, context);
                    src.playback_rate().set_value(message.speed);
                    play_sample(message, now, audio_buffer_duration, src, filters, &env);
                }
                Err(e) => eprintln!("Failed to open file: {:?}", e),
            }
        }
    }
}

fn play_synth(message: &&WebAudioMessage, now: f64, osc: OscillatorNode, filters: Vec<BiquadFilterNode> ,env: &GainNode) {
    osc.set_type(create_osc_type(&message));
    osc.frequency().set_value(message.note);
    osc.start();
    match message.adsr.adsr_on {
        1 => apply_synth_adsr(&env, message, now),
        _ => apply_default_synth_adsr(&env, message, now),
    };
    for f in filters {
        apply_filter_adsr(&f, message, &f.type_(), now);
    }
    osc.stop_at(now + message.duration + message.adsr.release);
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

fn play_sample(message: &WebAudioMessage, now: f64, audio_buffer_duration: f64, src: AudioBufferSourceNode, filters: Vec<BiquadFilterNode>, env: &GainNode) {
    let (start_at, stop_at) = if message.speed < 0.0 {
        (audio_buffer_duration, now + message.duration + 0.2)
    } else {
        (message.begin * audio_buffer_duration, now + message.duration + message.adsr.release)
    };
    if message.looper.is_loop > 0 {
        src.set_loop(true);
        src.set_loop_start(message.looper.loop_start);
        src.set_loop_end(message.looper.loop_end);
        src.start_at_with_offset(
            now,
            src.loop_start(),
        );
        match message.adsr.adsr_on {
            1 => apply_drum_adsr(&env, message, now),
            _ => apply_default_drum_adsr(&env, message, now),
        }
        for f in filters {
            apply_filter_adsr(&f, message, &f.type_(), now);
        }
        src.stop_at(now + message.duration + message.adsr.release);
    } else {
        src.start_at_with_offset(
            now,
            start_at,
        );
        match message.adsr.adsr_on {
            1 => apply_drum_adsr(&env, message, now),
            _ => apply_default_drum_adsr(&env, message, now),
        }
        for f in filters {
            apply_filter_adsr(&f, message, &f.type_(), now);
        };
        src.stop_at(stop_at);
    }
}

fn create_filters(context: &mut AudioContext, message: &WebAudioMessage) -> Vec<BiquadFilterNode> {
    let mut filters = Vec::new();

    if message.bpf.frequency > 0.0 {
        let bpf = context.create_biquad_filter();
        bpf.set_type(Bandpass);
        bpf.frequency().set_value(message.bpf.frequency);
        bpf.q().set_value(message.bpf.resonance);
        filters.push(bpf);
    } else if message.lpf.frequency > 0.0 && message.hpf.frequency > 0.0 {
        let lpf = context.create_biquad_filter();
        let hpf = context.create_biquad_filter();
        lpf.set_type(Lowpass);
        lpf.frequency().set_value(message.lpf.frequency);
        lpf.q().set_value(message.lpf.resonance);
        hpf.set_type(Highpass);
        hpf.frequency().set_value(message.hpf.frequency);
        hpf.q().set_value(message.hpf.resonance);
        lpf.connect(&hpf);
        filters.push(lpf);
        filters.push(hpf);
    } else if message.lpf.frequency > 0.0 {
        let lpf = context.create_biquad_filter();
        lpf.set_type(Lowpass);
        lpf.frequency().set_value(message.lpf.frequency);
        lpf.q().set_value(message.lpf.resonance);
        filters.push(lpf);
    } else if message.hpf.frequency > 0.0 {
        let hpf = context.create_biquad_filter();
        hpf.set_type(Highpass);
        hpf.frequency().set_value(message.hpf.frequency);
        hpf.q().set_value(message.hpf.resonance);
        filters.push(hpf);
    }

    filters
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

//TODO fix envelopes
fn apply_adsr(
    envelope: &GainNode,
    message: &WebAudioMessage,
    now: f64,
    attack: f64,
    sustain: f32,
    decay: f64,
    release: f64,
) {
    envelope
        .gain()
        .set_value_at_time(0., now)
        .linear_ramp_to_value_at_time(message.velocity, now + attack)
        .linear_ramp_to_value_at_time(
            sustain * message.velocity,
            now + attack + decay,
        )
        .set_value_at_time(sustain * message.velocity, now + message.duration)
        .linear_ramp_to_value_at_time(0.0, now + message.duration + release);
}

fn apply_synth_adsr(envelope: &GainNode, message: &WebAudioMessage, now: f64) {
    apply_adsr(
        envelope,
        message,
        now,
        message.adsr.attack,
        message.adsr.sustain,
        message.adsr.decay,
        message.adsr.release,
    );
}

fn apply_default_synth_adsr(envelope: &GainNode, message: &WebAudioMessage, now: f64) {
    apply_adsr(envelope, message, now, 0.001, message.velocity, 0.05, 0.001);
}

fn apply_drum_adsr(envelope: &GainNode, message: &WebAudioMessage, now: f64) {
    apply_adsr(
        envelope,
        message,
        now,
        message.adsr.attack,
        message.adsr.sustain,
        message.adsr.decay,
        message.adsr.release,
    );
}

fn apply_default_drum_adsr(envelope: &GainNode, message: &WebAudioMessage, now: f64) {
    apply_adsr(envelope, message, now, 0.001, message.velocity, 0.05, 0.001);
}

fn connect_nodes<'a>(nodes: Vec<&'a (dyn AudioNode + 'a)>, context: &'a mut AudioContext) -> Vec<&'a (dyn AudioNode)> {
    for i in 0..nodes.len() - 1 {
        nodes[i].connect(nodes[i + 1]);
    }
    if let Some(last_node) = nodes.last() {
        last_node.connect(&context.destination());
    }
    nodes
}