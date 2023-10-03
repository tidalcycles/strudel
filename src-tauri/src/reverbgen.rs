use web_audio_api::AudioBuffer;
use web_audio_api::context::{AudioContext, BaseAudioContext};

pub fn generate_reverb(context: &AudioContext) {
   let sample_rate = 44100.0;
    let num_channels = 2.0;
    let total_time = 2.0 * 1.5;
    let decay_samples = (2.0_f64 * sample_rate).round() as usize;
    let num_samples = (total_time * sample_rate).round() as usize;
    let fade_samples = 0.0;
    let decay_base = (1.0_f64 / 1000.0_f64).powf(1.0 / decay_samples as f64) as f32;
    let mut reverb_ir = context.create_buffer(2, num_samples, 44100.0);

    for i in 0..num_channels as usize {
        let mut chan = reverb_ir.get_channel_data_mut(i);
        for j in 0..num_samples {
            chan[j] = -0.3 * decay_base.powf(j as f32);
        }
    }
    println!("{:?}", reverb_ir);
}

