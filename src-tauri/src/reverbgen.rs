use rand_distr::{Distribution, Normal};
use web_audio_api::AudioBuffer;

fn apply_decay(input: &mut [f32], decay_factor: f32) {
    let len = input.len();

    for i in 0..len {
        // Multiply each sample by an exponentially decreasing factor
        let decay_amt = (-(i as f32) / (len as f32) * decay_factor).exp();
        input[i] *= decay_amt;
    }
}

fn apply_fir_filter(input: &mut [f32], coefficients: &[f32]) {
    let num_coeffs = coefficients.len();
    let len = input.len();

    let input_copy = input.to_vec();

    for i in num_coeffs..len {
        let mut acc = 0.0;
        for j in 0..num_coeffs {
            acc += input_copy[i - j] * coefficients[j];
        }
        input[i] = acc;
    }
}

fn sinc(x: f32, fc: f32) -> f32 {
    let pi = std::f32::consts::PI;
    if x == 0.0 {
        2.0 * fc
    } else {
        let arg = 2.0 * pi * fc * x;
        arg.sin() / arg
    }
}

fn hamming(n: usize, size: usize) -> f32 {
    0.54 - 0.46 * ((2. * std::f32::consts::PI * n as f32) / ((size - 1) as f32)).cos()
}

pub fn generate_coefficients_lp(size: usize, fc: f32) -> Vec<f32> {
    let mut h = vec![0.0; size];
    let m = (size - 1) / 2;

    for n in 0..size {
        h[n] = sinc((n as f32 - m as f32), fc);
        h[n] *= hamming(n, size);
    }

    let sum: f32 = h.iter().sum();
    for n in 0..size {
        h[n] /= sum;
    }

    h
}

pub fn create_impulse_response(
    len: usize,
    decay_factor: f32,
    fir_coeffs: &[f32],
    sample_rate: f32,
    fade: f32,
) -> Vec<f32> {
    let mut rng = rand::thread_rng();
    let mut normal = Normal::new(0.0, 1.0).unwrap();
    let fade_in_samples = (fade * sample_rate) as usize; // Compute the number of samples for the fade-in duration

    let mut impulse_response: Vec<f32> = (0..len)
        .map(|_| normal.sample(&mut rng) as f32)
        .map(|v| v.max(-1.0).min(1.0))  // Clamp values to the -1.0 to 1.0 range
        .collect();

    // Apply fade-in to the starting samples
    for i in 0..fade_in_samples.min(len) {
        impulse_response[i] *= i as f32 / fade_in_samples as f32;
    }

    apply_decay(&mut impulse_response, decay_factor);
    apply_fir_filter(&mut impulse_response, fir_coeffs);

    impulse_response
}

pub fn write_to_wav(filename: &str, data: &[f32]) {
    let spec = hound::WavSpec {
        channels: 1,
        sample_rate: 44100,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut writer = hound::WavWriter::create(filename, spec).unwrap();
    for &sample_float in data {
        // Assuming 16-bit audio
        let amplitude_scale = i16::MAX as f32;
        let sample = (sample_float * amplitude_scale).round() as i16;
        writer.write_sample(sample).unwrap();
    }
    writer.finalize().unwrap();
}

pub fn write_to_buffer(buffer: &mut AudioBuffer, data: &[f32]) {
    let num_chans = buffer.number_of_channels();

    for i in 0..num_chans {
        let chan = buffer.get_channel_data_mut(i);
        for j in 0..chan.len() {
            chan[j] = data[j];
        }
    }
}



