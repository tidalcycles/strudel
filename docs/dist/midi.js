import {useEffect, useState} from "../_snowpack/pkg/react.js";
import {isNote} from "../_snowpack/pkg/tone.js";
import _WebMidi from "../_snowpack/pkg/webmidi.js";
import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
import * as Tone from "../_snowpack/pkg/tone.js";
const WebMidi = _WebMidi;
const Pattern = _Pattern;
export default function enableWebMidi() {
  return new Promise((resolve, reject) => {
    if (WebMidi.enabled) {
      resolve(WebMidi);
      return;
    }
    WebMidi.enable((err) => {
      if (err) {
        reject(err);
      }
      resolve(WebMidi);
    });
  });
}
const outputByName = (name) => WebMidi.getOutputByName(name);
Pattern.prototype.midi = function(output, channel = 1) {
  return this.fmap((value) => ({
    ...value,
    onTrigger: (time, event) => {
      value = value.value || value;
      if (!isNote(value)) {
        throw new Error("not a note: " + value);
      }
      if (!WebMidi.enabled) {
        throw new Error(`🎹 WebMidi is not enabled. Supported Browsers: https://caniuse.com/?search=webmidi`);
      }
      if (!WebMidi.outputs.length) {
        throw new Error(`🔌 No MIDI devices found. Connect a device or enable IAC Driver.`);
      }
      const device = output ? outputByName(output) : WebMidi.outputs[0];
      if (!device) {
        throw new Error(`🔌 MIDI device ${output ? output : ""} not found. Use one of ${WebMidi.outputs.map((o) => `"${o.name}"`).join(" | ")}`);
      }
      const timingOffset = WebMidi.time - Tone.context.currentTime * 1e3;
      time = time * 1e3 + timingOffset;
      device.playNote(value, channel, {
        time,
        duration: event.duration * 1e3 - 5,
        velocity: 0.9
      });
    }
  }));
};
export function useWebMidi(props) {
  const {ready, connected, disconnected} = props;
  const [loading, setLoading] = useState(true);
  const [outputs, setOutputs] = useState(WebMidi?.outputs || []);
  useEffect(() => {
    enableWebMidi().then(() => {
      WebMidi.addListener("connected", (e) => {
        setOutputs([...WebMidi.outputs]);
        connected?.(WebMidi, e);
      });
      WebMidi.addListener("disconnected", (e) => {
        setOutputs([...WebMidi.outputs]);
        disconnected?.(WebMidi, e);
      });
      ready?.(WebMidi);
      setLoading(false);
    }).catch((err) => {
      if (err) {
        console.warn("Web Midi could not be enabled..");
        return;
      }
    });
  }, [ready, connected, disconnected, outputs]);
  const outputByName2 = (name) => WebMidi.getOutputByName(name);
  return {loading, outputs, outputByName: outputByName2};
}
