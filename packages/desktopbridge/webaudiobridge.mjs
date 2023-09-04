import { Invoke } from './utils.mjs';
import {isNote, midiToFreq, noteToMidi, Pattern} from '@strudel.cycles/core';
import {getAudioContext} from "@strudel.cycles/webaudio";

export const desktopAudio = async (value, deadline, hapDuration) => {
    const ac = getAudioContext();
    if (typeof value !== 'object') {
        throw new Error(
            `expected hap.value to be an object, but got "${value}". Hint: append .note() or .s() to the end`,
            'error',
        );
    }

    let t = ac.currentTime + deadline;

    let {
        note,
        s = 'triangle',
        bank,
        source,
        gain = 0.8,
        // low pass
        cutoff,
        resonance = 1,
        // high pass
        hcutoff,
        hresonance = 1,
        // band pass
        bandf,
        bandq = 1,
        //
        coarse,
        crush,
        shape,
        pan,
        vowel,
        delay = 0,
        delayfeedback = 0.5,
        delaytime = 0.25,
        orbit = 1,
        room,
        size = 2,
        velocity = 1,
        analyze, // analyser wet
        fft = 8, // fftSize 0 - 10
    } = value;

    if (isNote(note)) {
        note = noteToMidi(note);
    }
    const offset = (t - getAudioContext().currentTime) * 1000;
    const roundedOffset = Math.round(offset);
    const messagesfromjs = [];

    messagesfromjs.push({
        note: midiToFreq(note),
        offset: roundedOffset,
        waveform: s,
    });

    if (messagesfromjs.length) {
        setTimeout(() => {
            Invoke('sendwebaudio', { messagesfromjs });
        });
    }
}
const hap2value = (hap) => {
    hap.ensureObjectValue();
    return { ...hap.value, velocity: hap.context.velocity };
};
export const webaudioDesktopOutputTrigger = (t, hap, ct, cps) => desktopAudio(hap2value(hap), t - ct, hap.duration / cps, cps);
export const webaudioDesktopOutput = (hap, deadline, hapDuration) => desktopAudio(hap2value(hap), deadline, hapDuration);

Pattern.prototype.webaudio = function () {
    return this.onTrigger(webaudioDesktopOutputTrigger);
};






