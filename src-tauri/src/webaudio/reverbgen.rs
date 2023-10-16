use std::collections::HashMap;
use std::fs::File;
use mini_moka::sync::Cache;
use rand_distr::{Distribution, Normal};
use web_audio_api::AudioBuffer;
use web_audio_api::context::{AudioContext, BaseAudioContext, OfflineAudioContext};
use web_audio_api::node::{AudioNode, DynamicsCompressorNode};
use crate::webaudio::{create_filepath_generic, download_file, Reverb, Sampler, WebAudioInstrument};
use crate::webaudiobridge::WebAudioMessage;

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
    let normal = Normal::new(0.0, 1.0).unwrap();
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

pub fn write_to_buffer(buffer: &mut AudioBuffer, data: &[f32]) {
    let num_chans = buffer.number_of_channels();

    for i in 0..num_chans {
        let chan = buffer.get_channel_data_mut(i);
        for j in 0..chan.len() {
            chan[j] = data[j];
        }
    }
}

pub fn apply_reverb<T: WebAudioInstrument>(mut audio_context: &AudioContext, compressor: &DynamicsCompressorNode, cache: &Cache<String, AudioBuffer>, message: &WebAudioMessage, instrument: &mut T, reverbs: &mut HashMap<usize, Reverb>) {
    if message.reverb.ir.is_none() {
        let key = format!("reverb: {}{}{}{}{}", message.reverb.room.unwrap_or(0.0), message.reverb.size.unwrap_or(1.0), message.reverb.roomlp.unwrap_or(0.0), message.reverb.roomfade.unwrap_or(0.0), message.reverb.roomdim.unwrap_or(0.0));
        if let Some(ir) = cache.get(&key) {
            let reverb = reverbs.entry(message.orbit).or_insert({
                let mut reverb = Reverb::new(&audio_context, message.reverb.room, message.reverb.size, message.reverb.roomlp, message.reverb.roomfade, message.reverb.roomdim, &compressor);
                reverb.convolver.set_buffer(ir.clone());
                instrument.connect_reverb(&reverb.convolver);
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

                let len = (audio_context.sample_rate() * message.reverb.size.unwrap_or(0.6)) as usize;
                let decay = message.reverb.roomdim.unwrap_or(2.0);
                let num_coeffs = 101;
                let fade = message.reverb.roomfade.unwrap_or(0.01);
                let cutoff = message.reverb.roomlp.unwrap_or(1000.0) / audio_context.sample_rate();
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
            instrument.connect_reverb(&reverb.convolver);

            // Generate new IR buffer if it doesn't exist
        } else {
            let len = (audio_context.sample_rate() * message.reverb.size.unwrap_or(1.0)) as usize;
            let decay = 4.0;
            let num_coeffs = 101;
            let fade = 2.4;
            let cutoff = 500.0 / audio_context.sample_rate();
            let cache_cache = cache.clone();
            let mut buffer = audio_context.create_buffer(2, len, 44100.0);
            tokio::spawn(async move {
                // Generate IR and write to buffer
                let fir = generate_coefficients_lp(num_coeffs, cutoff);
                let ir = create_impulse_response(len, decay, &fir, 44100.0, fade);
                write_to_buffer(&mut buffer, &ir);
                cache_cache.insert(key, buffer);
            });
        }
    } else if message.reverb.ir.is_some() {
        let message_url = &match message.reverb.url.clone() {
            Some(url) => url,
            None => "todo".to_string(),
        };
        let (ir_url, ir_file_path, ir_file_path_clone) = create_filepath_generic(message_url, &message.dirname);
        let ir_cache_clone = cache.clone();
        let requested_size = message.reverb.size.unwrap_or(2.0).clone();
        if let Some(ir_buffer) = cache.get(&ir_file_path_clone) {
            let reverb = reverbs.entry(message.orbit).or_insert({
                let mut reverb = Reverb::new(&audio_context, message.reverb.room, message.reverb.size, message.reverb.roomlp, message.reverb.roomfade, message.reverb.roomdim, &compressor);
                reverb.convolver.set_buffer(ir_buffer.clone());
                instrument.connect_reverb(&reverb.convolver);
                reverb
            });

            if reverb.roomsize.unwrap_or(0.0) != message.reverb.size.unwrap_or(0.0) {
                adjust_length(&mut audio_context, cache, message, ir_file_path_clone, requested_size, reverb);
            }

            reverb.convolver.set_buffer(ir_buffer);
            instrument.connect_reverb(&reverb.convolver);
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

fn create_new_ir_buffer_from_file(ir_file_path: &String, ir_cache_clone: Cache<String, AudioBuffer>, requested_size: f32, file1: File) {
    let context = OfflineAudioContext::new(2, 400, 44100.0);
    let ir_buffer = context.decode_audio_data_sync(file1).expect("Failed to decode file.");
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



