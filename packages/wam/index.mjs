import { register, Pattern, toMidi, valueToMidi  } from '@strudel.cycles/core';
import { getAudioContext } from '@strudel.cycles/webaudio';
import {initializeWamHost} from '@webaudiomodules/sdk'

// this is a map of all loaded WebAudioModules
let wams = {};

// this is a map of all WebAudioModule instances (possibly more than one per WAM)
let instances = {};

// has the WAM host been initialized?
let initialized = false

// host groups of WAMs can interact with one another, but not directly across groups
const hostGroupId = "strudel"

export const loadWAM = async function (name, url, what) {
    if (!initialized) {
        await initializeWamHost(getAudioContext(), hostGroupId)
        initialized = true
    }

    if (!!instances[name]) {
        return instances[name]
    }
    
    if (!wams[url]) {
        const { default: WAM } = await import(
            /* @vite-ignore */
            url);

        wams[url] = WAM
    }
    
    const instance = new wams[url](hostGroupId, getAudioContext());
    
    await instance.initialize()

    instance.audioNode.connect(getAudioContext().destination);

    instances[name] = instance

    return instance
}

export const loadwam = loadWAM;
export const loadWam = loadWAM;

export const wam = register('wam', function (name, pat) {
    return pat.onTrigger((time, hap) => {
        let i = instances[name]

        if (!i) {
            return
        }

        let note = toMidi(hap.value.note);
        let velocity = hap.context?.velocity ?? 0.75;
        let endTime = time + hap.duration.valueOf();

        i.audioNode.scheduleEvents({
            type: "wam-midi",
            data: {bytes: [0x90, note, velocity]},
            time: time,
        })

        i.audioNode.scheduleEvents({
            type: "wam-midi",
            data: {bytes: [0x80, note, 0]},
            time: endTime
        })
    });
  });

export const param = register('param', function(wam, param, value, pat) {
    return pat.onTrigger((time, hap) => {        
        let i = instances[wam]

        if (!i) {
            return
        }

        debugger
        
        i.audioNode.scheduleEvents({
            time: time,
            type: "wam-automation",
            data: {
                id: param,
                normalized: false,
                value: value
            },
        })
    })
})