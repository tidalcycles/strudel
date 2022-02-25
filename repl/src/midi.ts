import { useEffect, useState } from 'react';
import { isNote } from 'tone';
import _WebMidi from 'webmidi';
import { Pattern as _Pattern } from '../../strudel.mjs';
import * as Tone from 'tone';

const WebMidi: any = _WebMidi;
const Pattern = _Pattern as any;

export default function enableWebMidi() {
  return new Promise((resolve, reject) => {
    if (WebMidi.enabled) {
      // if already enabled, just resolve WebMidi
      resolve(WebMidi);
      return;
    }
    WebMidi.enable((err: any) => {
      if (err) {
        reject(err);
      }
      resolve(WebMidi);
    });
  });
}
const outputByName = (name: string) => WebMidi.getOutputByName(name);

Pattern.prototype.midi = function (output: string, channel = 1) {
  if (output?.constructor?.name === 'Pattern') {
    throw new Error(
      `.midi does not accept Pattern input. Make sure to pass device name with single quotes. Example: .midi('${
        WebMidi.outputs?.[0]?.name || 'IAC Driver Bus 1'
      }')`
    );
  }
  return this.fmap((value: any) => ({
    ...value,
    onTrigger: (time: number, event: any) => {
      value = value.value || value;
      if (!isNote(value)) {
        throw new Error('not a note: ' + value);
      }
      if (!WebMidi.enabled) {
        throw new Error(`🎹 WebMidi is not enabled. Supported Browsers: https://caniuse.com/?search=webmidi`);
      }
      if (!WebMidi.outputs.length) {
        throw new Error(`🔌 No MIDI devices found. Connect a device or enable IAC Driver.`);
      }
      const device = output ? outputByName(output) : WebMidi.outputs[0];
      if (!device) {
        throw new Error(
          `🔌 MIDI device '${output ? output : ''}' not found. Use one of ${WebMidi.outputs
            .map((o: any) => `'${o.name}'`)
            .join(' | ')}`
        );
      }
      // console.log('midi', value, output);
      const timingOffset = WebMidi.time - Tone.context.currentTime * 1000;
      time = time * 1000 + timingOffset;
      // const inMs = '+' + (time - Tone.context.currentTime) * 1000;
      // await enableWebMidi()
      device.playNote(value, channel, {
        time,
        duration: event.duration * 1000 - 5,
        // velocity: velocity ?? 0.5,
        velocity: 0.9,
      });
    },
  }));
};

export function useWebMidi(props?: any) {
  const { ready, connected, disconnected } = props;
  const [loading, setLoading] = useState(true);
  const [outputs, setOutputs] = useState<any[]>(WebMidi?.outputs || []);
  useEffect(() => {
    enableWebMidi()
      .then(() => {
        // Reacting when a new device becomes available
        WebMidi.addListener('connected', (e: any) => {
          setOutputs([...WebMidi.outputs]);
          connected?.(WebMidi, e);
        });
        // Reacting when a device becomes unavailable
        WebMidi.addListener('disconnected', (e: any) => {
          setOutputs([...WebMidi.outputs]);
          disconnected?.(WebMidi, e);
        });
        ready?.(WebMidi);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err) {
          //throw new Error("Web Midi could not be enabled...");
          console.warn('Web Midi could not be enabled..');
          return;
        }
      });
  }, [ready, connected, disconnected, outputs]);
  const outputByName = (name: string) => WebMidi.getOutputByName(name);
  return { loading, outputs, outputByName };
}
