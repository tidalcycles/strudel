import { T as ToneAudioNode, o as optionsFromArguments, P as Param, r as readOnly, g as getContext, _ as __awaiter, O as OfflineContext, s as setContext, c as ToneAudioBuffer, d as Source, e as assert, b as ToneBufferSource, V as Volume, f as isNumber, h as isDefined, j as connect, k as Signal, G as Gain, l as connectSeries, m as SignalOperator, n as Multiply, p as disconnect, q as Oscillator, A as AudioToGain, t as connectSignal, a as ToneAudioBuffers, u as noOp, v as Player, C as Clock, w as intervalToFrequencyRatio, x as assertRange, y as defaultArg, W as WaveShaper, z as ToneConstantSource, B as TransportTimeClass, D as Monophonic, E as Synth, H as omitFromObject, I as OmniOscillator, J as Envelope, K as writable, L as AmplitudeEnvelope, N as deepMerge, Q as FMOscillator, R as Instrument, U as getWorkletGlobalScope, X as workletName, Y as warn, Z as MidiClass, $ as isArray, a0 as ToneWithContext, a1 as StateTimeline, a2 as TicksClass, a3 as isBoolean, a4 as isObject, a5 as isUndef, a6 as clamp, i as isString, a7 as Panner, a8 as gainToDb, a9 as dbToGain, aa as workletName$1, ab as ToneOscillatorNode, ac as theWindow } from './common/index-b6fc655f.js';
export { aL as AMOscillator, L as AmplitudeEnvelope, A as AudioToGain, aB as BaseContext, as as Buffer, au as BufferSource, at as Buffers, aP as Channel, C as Clock, aA as Context, ak as Destination, ao as Draw, aH as Emitter, J as Envelope, Q as FMOscillator, aN as FatOscillator, F as Frequency, aC as FrequencyClass, G as Gain, aI as IntervalTimeline, am as Listener, al as Master, ae as MembraneSynth, M as Midi, Z as MidiClass, n as Multiply, O as OfflineContext, I as OmniOscillator, q as Oscillator, aO as PWMOscillator, aQ as PanVol, a7 as Panner, P as Param, v as Player, aM as PulseOscillator, S as Sampler, k as Signal, aR as Solo, a1 as StateTimeline, E as Synth, aF as Ticks, a2 as TicksClass, aE as Time, aD as TimeClass, aJ as Timeline, c as ToneAudioBuffer, a as ToneAudioBuffers, T as ToneAudioNode, b as ToneBufferSource, ab as ToneOscillatorNode, ai as Transport, aG as TransportTime, B as TransportTimeClass, V as Volume, W as WaveShaper, j as connect, l as connectSeries, t as connectSignal, aq as context, a9 as dbToGain, ax as debug, y as defaultArg, p as disconnect, ay as ftom, a8 as gainToDb, g as getContext, af as getDestination, ap as getDraw, an as getListener, aj as getTransport, ah as immediate, w as intervalToFrequencyRatio, $ as isArray, a3 as isBoolean, h as isDefined, aK as isFunction, ad as isNote, f as isNumber, a4 as isObject, i as isString, a5 as isUndef, ar as loaded, az as mtof, ag as now, o as optionsFromArguments, s as setContext, av as start, aw as supported, aS as version } from './common/index-b6fc655f.js';

/**
 * Wrapper around Web Audio's native [DelayNode](http://webaudio.github.io/web-audio-api/#the-delaynode-interface).
 * @category Core
 * @example
 * return Tone.Offline(() => {
 * 	const delay = new Tone.Delay(0.1).toDestination();
 * 	// connect the signal to both the delay and the destination
 * 	const pulse = new Tone.PulseOscillator().connect(delay).toDestination();
 * 	// start and stop the pulse
 * 	pulse.start(0).stop(0.01);
 * }, 0.5, 1);
 */
class Delay extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Delay.getDefaults(), arguments, ["delayTime", "maxDelay"]));
        this.name = "Delay";
        const options = optionsFromArguments(Delay.getDefaults(), arguments, ["delayTime", "maxDelay"]);
        const maxDelayInSeconds = this.toSeconds(options.maxDelay);
        this._maxDelay = Math.max(maxDelayInSeconds, this.toSeconds(options.delayTime));
        this._delayNode = this.input = this.output = this.context.createDelay(maxDelayInSeconds);
        this.delayTime = new Param({
            context: this.context,
            param: this._delayNode.delayTime,
            units: "time",
            value: options.delayTime,
            minValue: 0,
            maxValue: this.maxDelay,
        });
        readOnly(this, "delayTime");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            delayTime: 0,
            maxDelay: 1,
        });
    }
    /**
     * The maximum delay time. This cannot be changed after
     * the value is passed into the constructor.
     */
    get maxDelay() {
        return this._maxDelay;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._delayNode.disconnect();
        this.delayTime.dispose();
        return this;
    }
}

/**
 * Generate a buffer by rendering all of the Tone.js code within the callback using the OfflineAudioContext.
 * The OfflineAudioContext is capable of rendering much faster than real time in many cases.
 * The callback function also passes in an offline instance of [[Context]] which can be used
 * to schedule events along the Transport.
 * @param  callback  All Tone.js nodes which are created and scheduled within this callback are recorded into the output Buffer.
 * @param  duration     the amount of time to record for.
 * @return  The promise which is invoked with the ToneAudioBuffer of the recorded output.
 * @example
 * // render 2 seconds of the oscillator
 * Tone.Offline(() => {
 * 	// only nodes created in this callback will be recorded
 * 	const oscillator = new Tone.Oscillator().toDestination().start(0);
 * }, 2).then((buffer) => {
 * 	// do something with the output buffer
 * 	console.log(buffer);
 * });
 * @example
 * // can also schedule events along the Transport
 * // using the passed in Offline Transport
 * Tone.Offline(({ transport }) => {
 * 	const osc = new Tone.Oscillator().toDestination();
 * 	transport.schedule(time => {
 * 		osc.start(time).stop(time + 0.1);
 * 	}, 1);
 * 	// make sure to start the transport
 * 	transport.start(0.2);
 * }, 4).then((buffer) => {
 * 	// do something with the output buffer
 * 	console.log(buffer);
 * });
 * @category Core
 */
function Offline(callback, duration, channels = 2, sampleRate = getContext().sampleRate) {
    return __awaiter(this, void 0, void 0, function* () {
        // set the OfflineAudioContext based on the current context
        const originalContext = getContext();
        const context = new OfflineContext(channels, duration, sampleRate);
        setContext(context);
        // invoke the callback/scheduling
        yield callback(context);
        // then render the audio
        const bufferPromise = context.render();
        // return the original AudioContext
        setContext(originalContext);
        // await the rendering
        const buffer = yield bufferPromise;
        // return the audio
        return new ToneAudioBuffer(buffer);
    });
}

var Units = /*#__PURE__*/Object.freeze({
    __proto__: null
});

/**
 * Noise is a noise generator. It uses looped noise buffers to save on performance.
 * Noise supports the noise types: "pink", "white", and "brown". Read more about
 * colors of noise on [Wikipedia](https://en.wikipedia.org/wiki/Colors_of_noise).
 *
 * @example
 * // initialize the noise and start
 * const noise = new Tone.Noise("pink").start();
 * // make an autofilter to shape the noise
 * const autoFilter = new Tone.AutoFilter({
 * 	frequency: "8n",
 * 	baseFrequency: 200,
 * 	octaves: 8
 * }).toDestination().start();
 * // connect the noise
 * noise.connect(autoFilter);
 * // start the autofilter LFO
 * autoFilter.start();
 * @category Source
 */
class Noise extends Source {
    constructor() {
        super(optionsFromArguments(Noise.getDefaults(), arguments, ["type"]));
        this.name = "Noise";
        /**
         * Private reference to the source
         */
        this._source = null;
        const options = optionsFromArguments(Noise.getDefaults(), arguments, ["type"]);
        this._playbackRate = options.playbackRate;
        this.type = options.type;
        this._fadeIn = options.fadeIn;
        this._fadeOut = options.fadeOut;
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            fadeIn: 0,
            fadeOut: 0,
            playbackRate: 1,
            type: "white",
        });
    }
    /**
     * The type of the noise. Can be "white", "brown", or "pink".
     * @example
     * const noise = new Tone.Noise().toDestination().start();
     * noise.type = "brown";
     */
    get type() {
        return this._type;
    }
    set type(type) {
        assert(type in _noiseBuffers, "Noise: invalid type: " + type);
        if (this._type !== type) {
            this._type = type;
            // if it's playing, stop and restart it
            if (this.state === "started") {
                const now = this.now();
                this._stop(now);
                this._start(now);
            }
        }
    }
    /**
     * The playback rate of the noise. Affects
     * the "frequency" of the noise.
     */
    get playbackRate() {
        return this._playbackRate;
    }
    set playbackRate(rate) {
        this._playbackRate = rate;
        if (this._source) {
            this._source.playbackRate.value = rate;
        }
    }
    /**
     * internal start method
     */
    _start(time) {
        const buffer = _noiseBuffers[this._type];
        this._source = new ToneBufferSource({
            url: buffer,
            context: this.context,
            fadeIn: this._fadeIn,
            fadeOut: this._fadeOut,
            loop: true,
            onended: () => this.onstop(this),
            playbackRate: this._playbackRate,
        }).connect(this.output);
        this._source.start(this.toSeconds(time), Math.random() * (buffer.duration - 0.001));
    }
    /**
     * internal stop method
     */
    _stop(time) {
        if (this._source) {
            this._source.stop(this.toSeconds(time));
            this._source = null;
        }
    }
    /**
     * The fadeIn time of the amplitude envelope.
     */
    get fadeIn() {
        return this._fadeIn;
    }
    set fadeIn(time) {
        this._fadeIn = time;
        if (this._source) {
            this._source.fadeIn = this._fadeIn;
        }
    }
    /**
     * The fadeOut time of the amplitude envelope.
     */
    get fadeOut() {
        return this._fadeOut;
    }
    set fadeOut(time) {
        this._fadeOut = time;
        if (this._source) {
            this._source.fadeOut = this._fadeOut;
        }
    }
    _restart(time) {
        // TODO could be optimized by cancelling the buffer source 'stop'
        this._stop(time);
        this._start(time);
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        if (this._source) {
            this._source.disconnect();
        }
        return this;
    }
}
//--------------------
// THE NOISE BUFFERS
//--------------------
// Noise buffer stats
const BUFFER_LENGTH = 44100 * 5;
const NUM_CHANNELS = 2;
/**
 * Cache the noise buffers
 */
const _noiseCache = {
    brown: null,
    pink: null,
    white: null,
};
/**
 * The noise arrays. Generated on initialization.
 * borrowed heavily from https://github.com/zacharydenton/noise.js
 * (c) 2013 Zach Denton (MIT)
 */
const _noiseBuffers = {
    get brown() {
        if (!_noiseCache.brown) {
            const buffer = [];
            for (let channelNum = 0; channelNum < NUM_CHANNELS; channelNum++) {
                const channel = new Float32Array(BUFFER_LENGTH);
                buffer[channelNum] = channel;
                let lastOut = 0.0;
                for (let i = 0; i < BUFFER_LENGTH; i++) {
                    const white = Math.random() * 2 - 1;
                    channel[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = channel[i];
                    channel[i] *= 3.5; // (roughly) compensate for gain
                }
            }
            _noiseCache.brown = new ToneAudioBuffer().fromArray(buffer);
        }
        return _noiseCache.brown;
    },
    get pink() {
        if (!_noiseCache.pink) {
            const buffer = [];
            for (let channelNum = 0; channelNum < NUM_CHANNELS; channelNum++) {
                const channel = new Float32Array(BUFFER_LENGTH);
                buffer[channelNum] = channel;
                let b0, b1, b2, b3, b4, b5, b6;
                b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
                for (let i = 0; i < BUFFER_LENGTH; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    channel[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    channel[i] *= 0.11; // (roughly) compensate for gain
                    b6 = white * 0.115926;
                }
            }
            _noiseCache.pink = new ToneAudioBuffer().fromArray(buffer);
        }
        return _noiseCache.pink;
    },
    get white() {
        if (!_noiseCache.white) {
            const buffer = [];
            for (let channelNum = 0; channelNum < NUM_CHANNELS; channelNum++) {
                const channel = new Float32Array(BUFFER_LENGTH);
                buffer[channelNum] = channel;
                for (let i = 0; i < BUFFER_LENGTH; i++) {
                    channel[i] = Math.random() * 2 - 1;
                }
            }
            _noiseCache.white = new ToneAudioBuffer().fromArray(buffer);
        }
        return _noiseCache.white;
    },
};

/**
 * UserMedia uses MediaDevices.getUserMedia to open up and external microphone or audio input.
 * Check [MediaDevices API Support](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
 * to see which browsers are supported. Access to an external input
 * is limited to secure (HTTPS) connections.
 * @example
 * const meter = new Tone.Meter();
 * const mic = new Tone.UserMedia().connect(meter);
 * mic.open().then(() => {
 * 	// promise resolves when input is available
 * 	console.log("mic open");
 * 	// print the incoming mic levels in decibels
 * 	setInterval(() => console.log(meter.getValue()), 100);
 * }).catch(e => {
 * 	// promise is rejected when the user doesn't have or allow mic access
 * 	console.log("mic not open");
 * });
 * @category Source
 */
class UserMedia extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(UserMedia.getDefaults(), arguments, ["volume"]));
        this.name = "UserMedia";
        const options = optionsFromArguments(UserMedia.getDefaults(), arguments, ["volume"]);
        this._volume = this.output = new Volume({
            context: this.context,
            volume: options.volume,
        });
        this.volume = this._volume.volume;
        readOnly(this, "volume");
        this.mute = options.mute;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mute: false,
            volume: 0
        });
    }
    /**
     * Open the media stream. If a string is passed in, it is assumed
     * to be the label or id of the stream, if a number is passed in,
     * it is the input number of the stream.
     * @param  labelOrId The label or id of the audio input media device.
     *                   With no argument, the default stream is opened.
     * @return The promise is resolved when the stream is open.
     */
    open(labelOrId) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(UserMedia.supported, "UserMedia is not supported");
            // close the previous stream
            if (this.state === "started") {
                this.close();
            }
            const devices = yield UserMedia.enumerateDevices();
            if (isNumber(labelOrId)) {
                this._device = devices[labelOrId];
            }
            else {
                this._device = devices.find((device) => {
                    return device.label === labelOrId || device.deviceId === labelOrId;
                });
                // didn't find a matching device
                if (!this._device && devices.length > 0) {
                    this._device = devices[0];
                }
                assert(isDefined(this._device), `No matching device ${labelOrId}`);
            }
            // do getUserMedia
            const constraints = {
                audio: {
                    echoCancellation: false,
                    sampleRate: this.context.sampleRate,
                    noiseSuppression: false,
                    mozNoiseSuppression: false,
                }
            };
            if (this._device) {
                // @ts-ignore
                constraints.audio.deviceId = this._device.deviceId;
            }
            const stream = yield navigator.mediaDevices.getUserMedia(constraints);
            // start a new source only if the previous one is closed
            if (!this._stream) {
                this._stream = stream;
                // Wrap a MediaStreamSourceNode around the live input stream.
                const mediaStreamNode = this.context.createMediaStreamSource(stream);
                // Connect the MediaStreamSourceNode to a gate gain node
                connect(mediaStreamNode, this.output);
                this._mediaStream = mediaStreamNode;
            }
            return this;
        });
    }
    /**
     * Close the media stream
     */
    close() {
        if (this._stream && this._mediaStream) {
            this._stream.getAudioTracks().forEach((track) => {
                track.stop();
            });
            this._stream = undefined;
            // remove the old media stream
            this._mediaStream.disconnect();
            this._mediaStream = undefined;
        }
        this._device = undefined;
        return this;
    }
    /**
     * Returns a promise which resolves with the list of audio input devices available.
     * @return The promise that is resolved with the devices
     * @example
     * Tone.UserMedia.enumerateDevices().then((devices) => {
     * 	// print the device labels
     * 	console.log(devices.map(device => device.label));
     * });
     */
    static enumerateDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const allDevices = yield navigator.mediaDevices.enumerateDevices();
            return allDevices.filter(device => {
                return device.kind === "audioinput";
            });
        });
    }
    /**
     * Returns the playback state of the source, "started" when the microphone is open
     * and "stopped" when the mic is closed.
     */
    get state() {
        return this._stream && this._stream.active ? "started" : "stopped";
    }
    /**
     * Returns an identifier for the represented device that is
     * persisted across sessions. It is un-guessable by other applications and
     * unique to the origin of the calling application. It is reset when the
     * user clears cookies (for Private Browsing, a different identifier is
     * used that is not persisted across sessions). Returns undefined when the
     * device is not open.
     */
    get deviceId() {
        if (this._device) {
            return this._device.deviceId;
        }
        else {
            return undefined;
        }
    }
    /**
     * Returns a group identifier. Two devices have the
     * same group identifier if they belong to the same physical device.
     * Returns null  when the device is not open.
     */
    get groupId() {
        if (this._device) {
            return this._device.groupId;
        }
        else {
            return undefined;
        }
    }
    /**
     * Returns a label describing this device (for example "Built-in Microphone").
     * Returns undefined when the device is not open or label is not available
     * because of permissions.
     */
    get label() {
        if (this._device) {
            return this._device.label;
        }
        else {
            return undefined;
        }
    }
    /**
     * Mute the output.
     * @example
     * const mic = new Tone.UserMedia();
     * mic.open().then(() => {
     * 	// promise resolves when input is available
     * });
     * // mute the output
     * mic.mute = true;
     */
    get mute() {
        return this._volume.mute;
    }
    set mute(mute) {
        this._volume.mute = mute;
    }
    dispose() {
        super.dispose();
        this.close();
        this._volume.dispose();
        this.volume.dispose();
        return this;
    }
    /**
     * If getUserMedia is supported by the browser.
     */
    static get supported() {
        return isDefined(navigator.mediaDevices) &&
            isDefined(navigator.mediaDevices.getUserMedia);
    }
}

/**
 * Add a signal and a number or two signals. When no value is
 * passed into the constructor, Tone.Add will sum input and `addend`
 * If a value is passed into the constructor, the it will be added to the input.
 *
 * @example
 * return Tone.Offline(() => {
 * 	const add = new Tone.Add(2).toDestination();
 * 	add.addend.setValueAtTime(1, 0.2);
 * 	const signal = new Tone.Signal(2);
 * 	// add a signal and a scalar
 * 	signal.connect(add);
 * 	signal.setValueAtTime(1, 0.1);
 * }, 0.5, 1);
 * @category Signal
 */
class Add extends Signal {
    constructor() {
        super(Object.assign(optionsFromArguments(Add.getDefaults(), arguments, ["value"])));
        this.override = false;
        this.name = "Add";
        /**
         * the summing node
         */
        this._sum = new Gain({ context: this.context });
        this.input = this._sum;
        this.output = this._sum;
        /**
         * The value which is added to the input signal
         */
        this.addend = this._param;
        connectSeries(this._constantSource, this._sum);
    }
    static getDefaults() {
        return Object.assign(Signal.getDefaults(), {
            value: 0,
        });
    }
    dispose() {
        super.dispose();
        this._sum.dispose();
        return this;
    }
}

/**
 * Performs a linear scaling on an input signal.
 * Scales a NormalRange input to between
 * outputMin and outputMax.
 *
 * @example
 * const scale = new Tone.Scale(50, 100);
 * const signal = new Tone.Signal(0.5).connect(scale);
 * // the output of scale equals 75
 * @category Signal
 */
class Scale extends SignalOperator {
    constructor() {
        super(Object.assign(optionsFromArguments(Scale.getDefaults(), arguments, ["min", "max"])));
        this.name = "Scale";
        const options = optionsFromArguments(Scale.getDefaults(), arguments, ["min", "max"]);
        this._mult = this.input = new Multiply({
            context: this.context,
            value: options.max - options.min,
        });
        this._add = this.output = new Add({
            context: this.context,
            value: options.min,
        });
        this._min = options.min;
        this._max = options.max;
        this.input.connect(this.output);
    }
    static getDefaults() {
        return Object.assign(SignalOperator.getDefaults(), {
            max: 1,
            min: 0,
        });
    }
    /**
     * The minimum output value. This number is output when the value input value is 0.
     */
    get min() {
        return this._min;
    }
    set min(min) {
        this._min = min;
        this._setRange();
    }
    /**
     * The maximum output value. This number is output when the value input value is 1.
     */
    get max() {
        return this._max;
    }
    set max(max) {
        this._max = max;
        this._setRange();
    }
    /**
     * set the values
     */
    _setRange() {
        this._add.value = this._min;
        this._mult.value = this._max - this._min;
    }
    dispose() {
        super.dispose();
        this._add.dispose();
        this._mult.dispose();
        return this;
    }
}

/**
 * Tone.Zero outputs 0's at audio-rate. The reason this has to be
 * it's own class is that many browsers optimize out Tone.Signal
 * with a value of 0 and will not process nodes further down the graph.
 * @category Signal
 */
class Zero extends SignalOperator {
    constructor() {
        super(Object.assign(optionsFromArguments(Zero.getDefaults(), arguments)));
        this.name = "Zero";
        /**
         * The gain node which connects the constant source to the output
         */
        this._gain = new Gain({ context: this.context });
        /**
         * Only outputs 0
         */
        this.output = this._gain;
        /**
         * no input node
         */
        this.input = undefined;
        connect(this.context.getConstant(0), this._gain);
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        disconnect(this.context.getConstant(0), this._gain);
        return this;
    }
}

/**
 * LFO stands for low frequency oscillator. LFO produces an output signal
 * which can be attached to an AudioParam or Tone.Signal
 * in order to modulate that parameter with an oscillator. The LFO can
 * also be synced to the transport to start/stop and change when the tempo changes.
 * @example
 * return Tone.Offline(() => {
 * 	const lfo = new Tone.LFO("4n", 400, 4000).start().toDestination();
 * }, 0.5, 1);
 * @category Source
 */
class LFO extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(LFO.getDefaults(), arguments, ["frequency", "min", "max"]));
        this.name = "LFO";
        /**
         * The value that the LFO outputs when it's stopped
         */
        this._stoppedValue = 0;
        /**
         * A private placeholder for the units
         */
        this._units = "number";
        /**
         * If the input value is converted using the [[units]]
         */
        this.convert = true;
        /**
         * Private methods borrowed from Param
         */
        // @ts-ignore
        this._fromType = Param.prototype._fromType;
        // @ts-ignore
        this._toType = Param.prototype._toType;
        // @ts-ignore
        this._is = Param.prototype._is;
        // @ts-ignore
        this._clampValue = Param.prototype._clampValue;
        const options = optionsFromArguments(LFO.getDefaults(), arguments, ["frequency", "min", "max"]);
        this._oscillator = new Oscillator(options);
        this.frequency = this._oscillator.frequency;
        this._amplitudeGain = new Gain({
            context: this.context,
            gain: options.amplitude,
            units: "normalRange",
        });
        this.amplitude = this._amplitudeGain.gain;
        this._stoppedSignal = new Signal({
            context: this.context,
            units: "audioRange",
            value: 0,
        });
        this._zeros = new Zero({ context: this.context });
        this._a2g = new AudioToGain({ context: this.context });
        this._scaler = this.output = new Scale({
            context: this.context,
            max: options.max,
            min: options.min,
        });
        this.units = options.units;
        this.min = options.min;
        this.max = options.max;
        // connect it up
        this._oscillator.chain(this._amplitudeGain, this._a2g, this._scaler);
        this._zeros.connect(this._a2g);
        this._stoppedSignal.connect(this._a2g);
        readOnly(this, ["amplitude", "frequency"]);
        this.phase = options.phase;
    }
    static getDefaults() {
        return Object.assign(Oscillator.getDefaults(), {
            amplitude: 1,
            frequency: "4n",
            max: 1,
            min: 0,
            type: "sine",
            units: "number",
        });
    }
    /**
     * Start the LFO.
     * @param time The time the LFO will start
     */
    start(time) {
        time = this.toSeconds(time);
        this._stoppedSignal.setValueAtTime(0, time);
        this._oscillator.start(time);
        return this;
    }
    /**
     * Stop the LFO.
     * @param  time The time the LFO will stop
     */
    stop(time) {
        time = this.toSeconds(time);
        this._stoppedSignal.setValueAtTime(this._stoppedValue, time);
        this._oscillator.stop(time);
        return this;
    }
    /**
     * Sync the start/stop/pause to the transport
     * and the frequency to the bpm of the transport
     * @example
     * const lfo = new Tone.LFO("8n");
     * lfo.sync().start(0);
     * // the rate of the LFO will always be an eighth note, even as the tempo changes
     */
    sync() {
        this._oscillator.sync();
        this._oscillator.syncFrequency();
        return this;
    }
    /**
     * unsync the LFO from transport control
     */
    unsync() {
        this._oscillator.unsync();
        this._oscillator.unsyncFrequency();
        return this;
    }
    /**
     * After the oscillator waveform is updated, reset the `_stoppedSignal` value to match the updated waveform
     */
    _setStoppedValue() {
        this._stoppedValue = this._oscillator.getInitialValue();
        this._stoppedSignal.value = this._stoppedValue;
    }
    /**
     * The minimum output of the LFO.
     */
    get min() {
        return this._toType(this._scaler.min);
    }
    set min(min) {
        min = this._fromType(min);
        this._scaler.min = min;
    }
    /**
     * The maximum output of the LFO.
     */
    get max() {
        return this._toType(this._scaler.max);
    }
    set max(max) {
        max = this._fromType(max);
        this._scaler.max = max;
    }
    /**
     * The type of the oscillator: See [[Oscillator.type]]
     */
    get type() {
        return this._oscillator.type;
    }
    set type(type) {
        this._oscillator.type = type;
        this._setStoppedValue();
    }
    /**
     * The oscillator's partials array: See [[Oscillator.partials]]
     */
    get partials() {
        return this._oscillator.partials;
    }
    set partials(partials) {
        this._oscillator.partials = partials;
        this._setStoppedValue();
    }
    /**
     * The phase of the LFO.
     */
    get phase() {
        return this._oscillator.phase;
    }
    set phase(phase) {
        this._oscillator.phase = phase;
        this._setStoppedValue();
    }
    /**
     * The output units of the LFO.
     */
    get units() {
        return this._units;
    }
    set units(val) {
        const currentMin = this.min;
        const currentMax = this.max;
        // convert the min and the max
        this._units = val;
        this.min = currentMin;
        this.max = currentMax;
    }
    /**
     * Returns the playback state of the source, either "started" or "stopped".
     */
    get state() {
        return this._oscillator.state;
    }
    /**
     * @param node the destination to connect to
     * @param outputNum the optional output number
     * @param inputNum the input number
     */
    connect(node, outputNum, inputNum) {
        if (node instanceof Param || node instanceof Signal) {
            this.convert = node.convert;
            this.units = node.units;
        }
        connectSignal(this, node, outputNum, inputNum);
        return this;
    }
    dispose() {
        super.dispose();
        this._oscillator.dispose();
        this._stoppedSignal.dispose();
        this._zeros.dispose();
        this._scaler.dispose();
        this._a2g.dispose();
        this._amplitudeGain.dispose();
        this.amplitude.dispose();
        return this;
    }
}

/**
 * Players combines multiple [[Player]] objects.
 * @category Source
 */
class Players extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Players.getDefaults(), arguments, ["urls", "onload"], "urls"));
        this.name = "Players";
        /**
         * Players has no input.
         */
        this.input = undefined;
        /**
         * The container of all of the players
         */
        this._players = new Map();
        const options = optionsFromArguments(Players.getDefaults(), arguments, ["urls", "onload"], "urls");
        /**
         * The output volume node
         */
        this._volume = this.output = new Volume({
            context: this.context,
            volume: options.volume,
        });
        this.volume = this._volume.volume;
        readOnly(this, "volume");
        this._buffers = new ToneAudioBuffers({
            urls: options.urls,
            onload: options.onload,
            baseUrl: options.baseUrl,
            onerror: options.onerror
        });
        // mute initially
        this.mute = options.mute;
        this._fadeIn = options.fadeIn;
        this._fadeOut = options.fadeOut;
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            baseUrl: "",
            fadeIn: 0,
            fadeOut: 0,
            mute: false,
            onload: noOp,
            onerror: noOp,
            urls: {},
            volume: 0,
        });
    }
    /**
     * Mute the output.
     */
    get mute() {
        return this._volume.mute;
    }
    set mute(mute) {
        this._volume.mute = mute;
    }
    /**
     * The fadeIn time of the envelope applied to the source.
     */
    get fadeIn() {
        return this._fadeIn;
    }
    set fadeIn(fadeIn) {
        this._fadeIn = fadeIn;
        this._players.forEach(player => {
            player.fadeIn = fadeIn;
        });
    }
    /**
     * The fadeOut time of the each of the sources.
     */
    get fadeOut() {
        return this._fadeOut;
    }
    set fadeOut(fadeOut) {
        this._fadeOut = fadeOut;
        this._players.forEach(player => {
            player.fadeOut = fadeOut;
        });
    }
    /**
     * The state of the players object. Returns "started" if any of the players are playing.
     */
    get state() {
        const playing = Array.from(this._players).some(([_, player]) => player.state === "started");
        return playing ? "started" : "stopped";
    }
    /**
     * True if the buffers object has a buffer by that name.
     * @param name  The key or index of the buffer.
     */
    has(name) {
        return this._buffers.has(name);
    }
    /**
     * Get a player by name.
     * @param  name  The players name as defined in the constructor object or `add` method.
     */
    player(name) {
        assert(this.has(name), `No Player with the name ${name} exists on this object`);
        if (!this._players.has(name)) {
            const player = new Player({
                context: this.context,
                fadeIn: this._fadeIn,
                fadeOut: this._fadeOut,
                url: this._buffers.get(name),
            }).connect(this.output);
            this._players.set(name, player);
        }
        return this._players.get(name);
    }
    /**
     * If all the buffers are loaded or not
     */
    get loaded() {
        return this._buffers.loaded;
    }
    /**
     * Add a player by name and url to the Players
     * @param  name A unique name to give the player
     * @param  url  Either the url of the bufer or a buffer which will be added with the given name.
     * @param callback  The callback to invoke when the url is loaded.
     */
    add(name, url, callback) {
        assert(!this._buffers.has(name), "A buffer with that name already exists on this object");
        this._buffers.add(name, url, callback);
        return this;
    }
    /**
     * Stop all of the players at the given time
     * @param time The time to stop all of the players.
     */
    stopAll(time) {
        this._players.forEach(player => player.stop(time));
        return this;
    }
    dispose() {
        super.dispose();
        this._volume.dispose();
        this.volume.dispose();
        this._players.forEach(player => player.dispose());
        this._buffers.dispose();
        return this;
    }
}

/**
 * GrainPlayer implements [granular synthesis](https://en.wikipedia.org/wiki/Granular_synthesis).
 * Granular Synthesis enables you to adjust pitch and playback rate independently. The grainSize is the
 * amount of time each small chunk of audio is played for and the overlap is the
 * amount of crossfading transition time between successive grains.
 * @category Source
 */
class GrainPlayer extends Source {
    constructor() {
        super(optionsFromArguments(GrainPlayer.getDefaults(), arguments, ["url", "onload"]));
        this.name = "GrainPlayer";
        /**
         * Internal loopStart value
         */
        this._loopStart = 0;
        /**
         * Internal loopStart value
         */
        this._loopEnd = 0;
        /**
         * All of the currently playing BufferSources
         */
        this._activeSources = [];
        const options = optionsFromArguments(GrainPlayer.getDefaults(), arguments, ["url", "onload"]);
        this.buffer = new ToneAudioBuffer({
            onload: options.onload,
            onerror: options.onerror,
            reverse: options.reverse,
            url: options.url,
        });
        this._clock = new Clock({
            context: this.context,
            callback: this._tick.bind(this),
            frequency: 1 / options.grainSize
        });
        this._playbackRate = options.playbackRate;
        this._grainSize = options.grainSize;
        this._overlap = options.overlap;
        this.detune = options.detune;
        // setup
        this.overlap = options.overlap;
        this.loop = options.loop;
        this.playbackRate = options.playbackRate;
        this.grainSize = options.grainSize;
        this.loopStart = options.loopStart;
        this.loopEnd = options.loopEnd;
        this.reverse = options.reverse;
        this._clock.on("stop", this._onstop.bind(this));
    }
    static getDefaults() {
        return Object.assign(Source.getDefaults(), {
            onload: noOp,
            onerror: noOp,
            overlap: 0.1,
            grainSize: 0.2,
            playbackRate: 1,
            detune: 0,
            loop: false,
            loopStart: 0,
            loopEnd: 0,
            reverse: false
        });
    }
    /**
     * Internal start method
     */
    _start(time, offset, duration) {
        offset = defaultArg(offset, 0);
        offset = this.toSeconds(offset);
        time = this.toSeconds(time);
        const grainSize = 1 / this._clock.frequency.getValueAtTime(time);
        this._clock.start(time, offset / grainSize);
        if (duration) {
            this.stop(time + this.toSeconds(duration));
        }
    }
    /**
     * Stop and then restart the player from the beginning (or offset)
     * @param  time When the player should start.
     * @param  offset The offset from the beginning of the sample to start at.
     * @param  duration How long the sample should play. If no duration is given,
     * 					it will default to the full length of the sample (minus any offset)
     */
    restart(time, offset, duration) {
        super.restart(time, offset, duration);
        return this;
    }
    _restart(time, offset, duration) {
        this._stop(time);
        this._start(time, offset, duration);
    }
    /**
     * Internal stop method
     */
    _stop(time) {
        this._clock.stop(time);
    }
    /**
     * Invoked when the clock is stopped
     */
    _onstop(time) {
        // stop the players
        this._activeSources.forEach((source) => {
            source.fadeOut = 0;
            source.stop(time);
        });
        this.onstop(this);
    }
    /**
     * Invoked on each clock tick. scheduled a new grain at this time.
     */
    _tick(time) {
        // check if it should stop looping
        const ticks = this._clock.getTicksAtTime(time);
        const offset = ticks * this._grainSize;
        this.log("offset", offset);
        if (!this.loop && offset > this.buffer.duration) {
            this.stop(time);
            return;
        }
        // at the beginning of the file, the fade in should be 0
        const fadeIn = offset < this._overlap ? 0 : this._overlap;
        // create a buffer source
        const source = new ToneBufferSource({
            context: this.context,
            url: this.buffer,
            fadeIn: fadeIn,
            fadeOut: this._overlap,
            loop: this.loop,
            loopStart: this._loopStart,
            loopEnd: this._loopEnd,
            // compute the playbackRate based on the detune
            playbackRate: intervalToFrequencyRatio(this.detune / 100)
        }).connect(this.output);
        source.start(time, this._grainSize * ticks);
        source.stop(time + this._grainSize / this.playbackRate);
        // add it to the active sources
        this._activeSources.push(source);
        // remove it when it's done
        source.onended = () => {
            const index = this._activeSources.indexOf(source);
            if (index !== -1) {
                this._activeSources.splice(index, 1);
            }
        };
    }
    /**
     * The playback rate of the sample
     */
    get playbackRate() {
        return this._playbackRate;
    }
    set playbackRate(rate) {
        assertRange(rate, 0.001);
        this._playbackRate = rate;
        this.grainSize = this._grainSize;
    }
    /**
     * The loop start time.
     */
    get loopStart() {
        return this._loopStart;
    }
    set loopStart(time) {
        if (this.buffer.loaded) {
            assertRange(this.toSeconds(time), 0, this.buffer.duration);
        }
        this._loopStart = this.toSeconds(time);
    }
    /**
     * The loop end time.
     */
    get loopEnd() {
        return this._loopEnd;
    }
    set loopEnd(time) {
        if (this.buffer.loaded) {
            assertRange(this.toSeconds(time), 0, this.buffer.duration);
        }
        this._loopEnd = this.toSeconds(time);
    }
    /**
     * The direction the buffer should play in
     */
    get reverse() {
        return this.buffer.reverse;
    }
    set reverse(rev) {
        this.buffer.reverse = rev;
    }
    /**
     * The size of each chunk of audio that the
     * buffer is chopped into and played back at.
     */
    get grainSize() {
        return this._grainSize;
    }
    set grainSize(size) {
        this._grainSize = this.toSeconds(size);
        this._clock.frequency.setValueAtTime(this._playbackRate / this._grainSize, this.now());
    }
    /**
     * The duration of the cross-fade between successive grains.
     */
    get overlap() {
        return this._overlap;
    }
    set overlap(time) {
        const computedTime = this.toSeconds(time);
        assertRange(computedTime, 0);
        this._overlap = computedTime;
    }
    /**
     * If all the buffer is loaded
     */
    get loaded() {
        return this.buffer.loaded;
    }
    dispose() {
        super.dispose();
        this.buffer.dispose();
        this._clock.dispose();
        this._activeSources.forEach((source) => source.dispose());
        return this;
    }
}

/**
 * Return the absolute value of an incoming signal.
 *
 * @example
 * return Tone.Offline(() => {
 * 	const abs = new Tone.Abs().toDestination();
 * 	const signal = new Tone.Signal(1);
 * 	signal.rampTo(-1, 0.5);
 * 	signal.connect(abs);
 * }, 0.5, 1);
 * @category Signal
 */
class Abs extends SignalOperator {
    constructor() {
        super(...arguments);
        this.name = "Abs";
        /**
         * The node which converts the audio ranges
         */
        this._abs = new WaveShaper({
            context: this.context,
            mapping: val => {
                if (Math.abs(val) < 0.001) {
                    return 0;
                }
                else {
                    return Math.abs(val);
                }
            },
        });
        /**
         * The AudioRange input [-1, 1]
         */
        this.input = this._abs;
        /**
         * The output range [0, 1]
         */
        this.output = this._abs;
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._abs.dispose();
        return this;
    }
}

/**
 * GainToAudio converts an input in NormalRange [0,1] to AudioRange [-1,1].
 * See [[AudioToGain]].
 * @category Signal
 */
class GainToAudio extends SignalOperator {
    constructor() {
        super(...arguments);
        this.name = "GainToAudio";
        /**
         * The node which converts the audio ranges
         */
        this._norm = new WaveShaper({
            context: this.context,
            mapping: x => Math.abs(x) * 2 - 1,
        });
        /**
         * The NormalRange input [0, 1]
         */
        this.input = this._norm;
        /**
         * The AudioRange output [-1, 1]
         */
        this.output = this._norm;
    }
    /**
     * clean up
     */
    dispose() {
        super.dispose();
        this._norm.dispose();
        return this;
    }
}

/**
 * Negate the incoming signal. i.e. an input signal of 10 will output -10
 *
 * @example
 * const neg = new Tone.Negate();
 * const sig = new Tone.Signal(-2).connect(neg);
 * // output of neg is positive 2.
 * @category Signal
 */
class Negate extends SignalOperator {
    constructor() {
        super(...arguments);
        this.name = "Negate";
        /**
         * negation is done by multiplying by -1
         */
        this._multiply = new Multiply({
            context: this.context,
            value: -1,
        });
        /**
         * The input and output are equal to the multiply node
         */
        this.input = this._multiply;
        this.output = this._multiply;
    }
    /**
     * clean up
     * @returns {Negate} this
     */
    dispose() {
        super.dispose();
        this._multiply.dispose();
        return this;
    }
}

/**
 * Subtract the signal connected to the input is subtracted from the signal connected
 * The subtrahend.
 *
 * @example
 * // subtract a scalar from a signal
 * const sub = new Tone.Subtract(1);
 * const sig = new Tone.Signal(4).connect(sub);
 * // the output of sub is 3.
 * @example
 * // subtract two signals
 * const sub = new Tone.Subtract();
 * const sigA = new Tone.Signal(10);
 * const sigB = new Tone.Signal(2.5);
 * sigA.connect(sub);
 * sigB.connect(sub.subtrahend);
 * // output of sub is 7.5
 * @category Signal
 */
class Subtract extends Signal {
    constructor() {
        super(Object.assign(optionsFromArguments(Subtract.getDefaults(), arguments, ["value"])));
        this.override = false;
        this.name = "Subtract";
        /**
         * the summing node
         */
        this._sum = new Gain({ context: this.context });
        this.input = this._sum;
        this.output = this._sum;
        /**
         * Negate the input of the second input before connecting it to the summing node.
         */
        this._neg = new Negate({ context: this.context });
        /**
         * The value which is subtracted from the main signal
         */
        this.subtrahend = this._param;
        connectSeries(this._constantSource, this._neg, this._sum);
    }
    static getDefaults() {
        return Object.assign(Signal.getDefaults(), {
            value: 0,
        });
    }
    dispose() {
        super.dispose();
        this._neg.dispose();
        this._sum.dispose();
        return this;
    }
}

/**
 * GreaterThanZero outputs 1 when the input is strictly greater than zero
 * @example
 * return Tone.Offline(() => {
 * 	const gt0 = new Tone.GreaterThanZero().toDestination();
 * 	const sig = new Tone.Signal(0.5).connect(gt0);
 * 	sig.setValueAtTime(-1, 0.05);
 * }, 0.1, 1);
 * @category Signal
 */
class GreaterThanZero extends SignalOperator {
    constructor() {
        super(Object.assign(optionsFromArguments(GreaterThanZero.getDefaults(), arguments)));
        this.name = "GreaterThanZero";
        this._thresh = this.output = new WaveShaper({
            context: this.context,
            length: 127,
            mapping: (val) => {
                if (val <= 0) {
                    return 0;
                }
                else {
                    return 1;
                }
            },
        });
        this._scale = this.input = new Multiply({
            context: this.context,
            value: 10000
        });
        // connections
        this._scale.connect(this._thresh);
    }
    dispose() {
        super.dispose();
        this._scale.dispose();
        this._thresh.dispose();
        return this;
    }
}

/**
 * Output 1 if the signal is greater than the value, otherwise outputs 0.
 * can compare two signals or a signal and a number.
 *
 * @example
 * return Tone.Offline(() => {
 * 	const gt = new Tone.GreaterThan(2).toDestination();
 * 	const sig = new Tone.Signal(4).connect(gt);
 * }, 0.1, 1);
 * @category Signal
 */
class GreaterThan extends Signal {
    constructor() {
        super(Object.assign(optionsFromArguments(GreaterThan.getDefaults(), arguments, ["value"])));
        this.name = "GreaterThan";
        this.override = false;
        const options = optionsFromArguments(GreaterThan.getDefaults(), arguments, ["value"]);
        this._subtract = this.input = new Subtract({
            context: this.context,
            value: options.value
        });
        this._gtz = this.output = new GreaterThanZero({ context: this.context });
        this.comparator = this._param = this._subtract.subtrahend;
        readOnly(this, "comparator");
        // connect
        this._subtract.connect(this._gtz);
    }
    static getDefaults() {
        return Object.assign(Signal.getDefaults(), {
            value: 0,
        });
    }
    dispose() {
        super.dispose();
        this._gtz.dispose();
        this._subtract.dispose();
        this.comparator.dispose();
        return this;
    }
}

/**
 * Pow applies an exponent to the incoming signal. The incoming signal must be AudioRange [-1, 1]
 *
 * @example
 * const pow = new Tone.Pow(2);
 * const sig = new Tone.Signal(0.5).connect(pow);
 * // output of pow is 0.25.
 * @category Signal
 */
class Pow extends SignalOperator {
    constructor() {
        super(Object.assign(optionsFromArguments(Pow.getDefaults(), arguments, ["value"])));
        this.name = "Pow";
        const options = optionsFromArguments(Pow.getDefaults(), arguments, ["value"]);
        this._exponentScaler = this.input = this.output = new WaveShaper({
            context: this.context,
            mapping: this._expFunc(options.value),
            length: 8192,
        });
        this._exponent = options.value;
    }
    static getDefaults() {
        return Object.assign(SignalOperator.getDefaults(), {
            value: 1,
        });
    }
    /**
     * the function which maps the waveshaper
     * @param exponent exponent value
     */
    _expFunc(exponent) {
        return (val) => {
            return Math.pow(Math.abs(val), exponent);
        };
    }
    /**
     * The value of the exponent.
     */
    get value() {
        return this._exponent;
    }
    set value(exponent) {
        this._exponent = exponent;
        this._exponentScaler.setMap(this._expFunc(this._exponent));
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._exponentScaler.dispose();
        return this;
    }
}

/**
 * Performs an exponential scaling on an input signal.
 * Scales a NormalRange value [0,1] exponentially
 * to the output range of outputMin to outputMax.
 * @example
 * const scaleExp = new Tone.ScaleExp(0, 100, 2);
 * const signal = new Tone.Signal(0.5).connect(scaleExp);
 * @category Signal
 */
class ScaleExp extends Scale {
    constructor() {
        super(Object.assign(optionsFromArguments(ScaleExp.getDefaults(), arguments, ["min", "max", "exponent"])));
        this.name = "ScaleExp";
        const options = optionsFromArguments(ScaleExp.getDefaults(), arguments, ["min", "max", "exponent"]);
        this.input = this._exp = new Pow({
            context: this.context,
            value: options.exponent,
        });
        this._exp.connect(this._mult);
    }
    static getDefaults() {
        return Object.assign(Scale.getDefaults(), {
            exponent: 1,
        });
    }
    /**
     * Instead of interpolating linearly between the [[min]] and
     * [[max]] values, setting the exponent will interpolate between
     * the two values with an exponential curve.
     */
    get exponent() {
        return this._exp.value;
    }
    set exponent(exp) {
        this._exp.value = exp;
    }
    dispose() {
        super.dispose();
        this._exp.dispose();
        return this;
    }
}

/**
 * Adds the ability to synchronize the signal to the [[Transport]]
 */
class SyncedSignal extends Signal {
    constructor() {
        super(optionsFromArguments(Signal.getDefaults(), arguments, ["value", "units"]));
        this.name = "SyncedSignal";
        /**
         * Don't override when something is connected to the input
         */
        this.override = false;
        const options = optionsFromArguments(Signal.getDefaults(), arguments, ["value", "units"]);
        this._lastVal = options.value;
        this._synced = this.context.transport.scheduleRepeat(this._onTick.bind(this), "1i");
        this._syncedCallback = this._anchorValue.bind(this);
        this.context.transport.on("start", this._syncedCallback);
        this.context.transport.on("pause", this._syncedCallback);
        this.context.transport.on("stop", this._syncedCallback);
        // disconnect the constant source from the output and replace it with another one
        this._constantSource.disconnect();
        this._constantSource.stop(0);
        // create a new one
        this._constantSource = this.output = new ToneConstantSource({
            context: this.context,
            offset: options.value,
            units: options.units,
        }).start(0);
        this.setValueAtTime(options.value, 0);
    }
    /**
     * Callback which is invoked every tick.
     */
    _onTick(time) {
        const val = super.getValueAtTime(this.context.transport.seconds);
        // approximate ramp curves with linear ramps
        if (this._lastVal !== val) {
            this._lastVal = val;
            this._constantSource.offset.setValueAtTime(val, time);
        }
    }
    /**
     * Anchor the value at the start and stop of the Transport
     */
    _anchorValue(time) {
        const val = super.getValueAtTime(this.context.transport.seconds);
        this._lastVal = val;
        this._constantSource.offset.cancelAndHoldAtTime(time);
        this._constantSource.offset.setValueAtTime(val, time);
    }
    getValueAtTime(time) {
        const computedTime = new TransportTimeClass(this.context, time).toSeconds();
        return super.getValueAtTime(computedTime);
    }
    setValueAtTime(value, time) {
        const computedTime = new TransportTimeClass(this.context, time).toSeconds();
        super.setValueAtTime(value, computedTime);
        return this;
    }
    linearRampToValueAtTime(value, time) {
        const computedTime = new TransportTimeClass(this.context, time).toSeconds();
        super.linearRampToValueAtTime(value, computedTime);
        return this;
    }
    exponentialRampToValueAtTime(value, time) {
        const computedTime = new TransportTimeClass(this.context, time).toSeconds();
        super.exponentialRampToValueAtTime(value, computedTime);
        return this;
    }
    setTargetAtTime(value, startTime, timeConstant) {
        const computedTime = new TransportTimeClass(this.context, startTime).toSeconds();
        super.setTargetAtTime(value, computedTime, timeConstant);
        return this;
    }
    cancelScheduledValues(startTime) {
        const computedTime = new TransportTimeClass(this.context, startTime).toSeconds();
        super.cancelScheduledValues(computedTime);
        return this;
    }
    setValueCurveAtTime(values, startTime, duration, scaling) {
        const computedTime = new TransportTimeClass(this.context, startTime).toSeconds();
        duration = this.toSeconds(duration);
        super.setValueCurveAtTime(values, computedTime, duration, scaling);
        return this;
    }
    cancelAndHoldAtTime(time) {
        const computedTime = new TransportTimeClass(this.context, time).toSeconds();
        super.cancelAndHoldAtTime(computedTime);
        return this;
    }
    setRampPoint(time) {
        const computedTime = new TransportTimeClass(this.context, time).toSeconds();
        super.setRampPoint(computedTime);
        return this;
    }
    exponentialRampTo(value, rampTime, startTime) {
        const computedTime = new TransportTimeClass(this.context, startTime).toSeconds();
        super.exponentialRampTo(value, rampTime, computedTime);
        return this;
    }
    linearRampTo(value, rampTime, startTime) {
        const computedTime = new TransportTimeClass(this.context, startTime).toSeconds();
        super.linearRampTo(value, rampTime, computedTime);
        return this;
    }
    targetRampTo(value, rampTime, startTime) {
        const computedTime = new TransportTimeClass(this.context, startTime).toSeconds();
        super.targetRampTo(value, rampTime, computedTime);
        return this;
    }
    dispose() {
        super.dispose();
        this.context.transport.clear(this._synced);
        this.context.transport.off("start", this._syncedCallback);
        this.context.transport.off("pause", this._syncedCallback);
        this.context.transport.off("stop", this._syncedCallback);
        this._constantSource.dispose();
        return this;
    }
}

/**
 * Base class for both AM and FM synths
 */
class ModulationSynth extends Monophonic {
    constructor() {
        super(optionsFromArguments(ModulationSynth.getDefaults(), arguments));
        this.name = "ModulationSynth";
        const options = optionsFromArguments(ModulationSynth.getDefaults(), arguments);
        this._carrier = new Synth({
            context: this.context,
            oscillator: options.oscillator,
            envelope: options.envelope,
            onsilence: () => this.onsilence(this),
            volume: -10,
        });
        this._modulator = new Synth({
            context: this.context,
            oscillator: options.modulation,
            envelope: options.modulationEnvelope,
            volume: -10,
        });
        this.oscillator = this._carrier.oscillator;
        this.envelope = this._carrier.envelope;
        this.modulation = this._modulator.oscillator;
        this.modulationEnvelope = this._modulator.envelope;
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
        });
        this.detune = new Signal({
            context: this.context,
            value: options.detune,
            units: "cents"
        });
        this.harmonicity = new Multiply({
            context: this.context,
            value: options.harmonicity,
            minValue: 0,
        });
        this._modulationNode = new Gain({
            context: this.context,
            gain: 0,
        });
        readOnly(this, ["frequency", "harmonicity", "oscillator", "envelope", "modulation", "modulationEnvelope", "detune"]);
    }
    static getDefaults() {
        return Object.assign(Monophonic.getDefaults(), {
            harmonicity: 3,
            oscillator: Object.assign(omitFromObject(OmniOscillator.getDefaults(), [
                ...Object.keys(Source.getDefaults()),
                "frequency",
                "detune"
            ]), {
                type: "sine"
            }),
            envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                attack: 0.01,
                decay: 0.01,
                sustain: 1,
                release: 0.5
            }),
            modulation: Object.assign(omitFromObject(OmniOscillator.getDefaults(), [
                ...Object.keys(Source.getDefaults()),
                "frequency",
                "detune"
            ]), {
                type: "square"
            }),
            modulationEnvelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                attack: 0.5,
                decay: 0.0,
                sustain: 1,
                release: 0.5
            })
        });
    }
    /**
     * Trigger the attack portion of the note
     */
    _triggerEnvelopeAttack(time, velocity) {
        // @ts-ignore
        this._carrier._triggerEnvelopeAttack(time, velocity);
        // @ts-ignore
        this._modulator._triggerEnvelopeAttack(time, velocity);
    }
    /**
     * Trigger the release portion of the note
     */
    _triggerEnvelopeRelease(time) {
        // @ts-ignore
        this._carrier._triggerEnvelopeRelease(time);
        // @ts-ignore
        this._modulator._triggerEnvelopeRelease(time);
        return this;
    }
    getLevelAtTime(time) {
        time = this.toSeconds(time);
        return this.envelope.getValueAtTime(time);
    }
    dispose() {
        super.dispose();
        this._carrier.dispose();
        this._modulator.dispose();
        this.frequency.dispose();
        this.detune.dispose();
        this.harmonicity.dispose();
        this._modulationNode.dispose();
        return this;
    }
}

/**
 * AMSynth uses the output of one Tone.Synth to modulate the
 * amplitude of another Tone.Synth. The harmonicity (the ratio between
 * the two signals) affects the timbre of the output signal greatly.
 * Read more about Amplitude Modulation Synthesis on
 * [SoundOnSound](https://web.archive.org/web/20160404103653/http://www.soundonsound.com:80/sos/mar00/articles/synthsecrets.htm).
 *
 * @example
 * const synth = new Tone.AMSynth().toDestination();
 * synth.triggerAttackRelease("C4", "4n");
 *
 * @category Instrument
 */
class AMSynth extends ModulationSynth {
    constructor() {
        super(optionsFromArguments(AMSynth.getDefaults(), arguments));
        this.name = "AMSynth";
        this._modulationScale = new AudioToGain({
            context: this.context,
        });
        // control the two voices frequency
        this.frequency.connect(this._carrier.frequency);
        this.frequency.chain(this.harmonicity, this._modulator.frequency);
        this.detune.fan(this._carrier.detune, this._modulator.detune);
        this._modulator.chain(this._modulationScale, this._modulationNode.gain);
        this._carrier.chain(this._modulationNode, this.output);
    }
    dispose() {
        super.dispose();
        this._modulationScale.dispose();
        return this;
    }
}

/**
 * Thin wrapper around the native Web Audio [BiquadFilterNode](https://webaudio.github.io/web-audio-api/#biquadfilternode).
 * BiquadFilter is similar to [[Filter]] but doesn't have the option to set the "rolloff" value.
 * @category Component
 */
class BiquadFilter extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(BiquadFilter.getDefaults(), arguments, ["frequency", "type"]));
        this.name = "BiquadFilter";
        const options = optionsFromArguments(BiquadFilter.getDefaults(), arguments, ["frequency", "type"]);
        this._filter = this.context.createBiquadFilter();
        this.input = this.output = this._filter;
        this.Q = new Param({
            context: this.context,
            units: "number",
            value: options.Q,
            param: this._filter.Q,
        });
        this.frequency = new Param({
            context: this.context,
            units: "frequency",
            value: options.frequency,
            param: this._filter.frequency,
        });
        this.detune = new Param({
            context: this.context,
            units: "cents",
            value: options.detune,
            param: this._filter.detune,
        });
        this.gain = new Param({
            context: this.context,
            units: "decibels",
            convert: false,
            value: options.gain,
            param: this._filter.gain,
        });
        this.type = options.type;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            Q: 1,
            type: "lowpass",
            frequency: 350,
            detune: 0,
            gain: 0,
        });
    }
    /**
     * The type of this BiquadFilterNode. For a complete list of types and their attributes, see the
     * [Web Audio API](https://webaudio.github.io/web-audio-api/#dom-biquadfiltertype-lowpass)
     */
    get type() {
        return this._filter.type;
    }
    set type(type) {
        const types = ["lowpass", "highpass", "bandpass",
            "lowshelf", "highshelf", "notch", "allpass", "peaking"];
        assert(types.indexOf(type) !== -1, `Invalid filter type: ${type}`);
        this._filter.type = type;
    }
    /**
     * Get the frequency response curve. This curve represents how the filter
     * responses to frequencies between 20hz-20khz.
     * @param  len The number of values to return
     * @return The frequency response curve between 20-20kHz
     */
    getFrequencyResponse(len = 128) {
        // start with all 1s
        const freqValues = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            const norm = Math.pow(i / len, 2);
            const freq = norm * (20000 - 20) + 20;
            freqValues[i] = freq;
        }
        const magValues = new Float32Array(len);
        const phaseValues = new Float32Array(len);
        // clone the filter to remove any connections which may be changing the value
        const filterClone = this.context.createBiquadFilter();
        filterClone.type = this.type;
        filterClone.Q.value = this.Q.value;
        filterClone.frequency.value = this.frequency.value;
        filterClone.gain.value = this.gain.value;
        filterClone.getFrequencyResponse(freqValues, magValues, phaseValues);
        return magValues;
    }
    dispose() {
        super.dispose();
        this._filter.disconnect();
        this.Q.dispose();
        this.frequency.dispose();
        this.gain.dispose();
        this.detune.dispose();
        return this;
    }
}

/**
 * Tone.Filter is a filter which allows for all of the same native methods
 * as the [BiquadFilterNode](http://webaudio.github.io/web-audio-api/#the-biquadfilternode-interface).
 * Tone.Filter has the added ability to set the filter rolloff at -12
 * (default), -24 and -48.
 * @example
 * const filter = new Tone.Filter(1500, "highpass").toDestination();
 * filter.frequency.rampTo(20000, 10);
 * const noise = new Tone.Noise().connect(filter).start();
 * @category Component
 */
class Filter extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Filter.getDefaults(), arguments, ["frequency", "type", "rolloff"]));
        this.name = "Filter";
        this.input = new Gain({ context: this.context });
        this.output = new Gain({ context: this.context });
        this._filters = [];
        const options = optionsFromArguments(Filter.getDefaults(), arguments, ["frequency", "type", "rolloff"]);
        this._filters = [];
        this.Q = new Signal({
            context: this.context,
            units: "positive",
            value: options.Q,
        });
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.frequency,
        });
        this.detune = new Signal({
            context: this.context,
            units: "cents",
            value: options.detune,
        });
        this.gain = new Signal({
            context: this.context,
            units: "decibels",
            convert: false,
            value: options.gain,
        });
        this._type = options.type;
        this.rolloff = options.rolloff;
        readOnly(this, ["detune", "frequency", "gain", "Q"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            Q: 1,
            detune: 0,
            frequency: 350,
            gain: 0,
            rolloff: -12,
            type: "lowpass",
        });
    }
    /**
     * The type of the filter. Types: "lowpass", "highpass",
     * "bandpass", "lowshelf", "highshelf", "notch", "allpass", or "peaking".
     */
    get type() {
        return this._type;
    }
    set type(type) {
        const types = ["lowpass", "highpass", "bandpass",
            "lowshelf", "highshelf", "notch", "allpass", "peaking"];
        assert(types.indexOf(type) !== -1, `Invalid filter type: ${type}`);
        this._type = type;
        this._filters.forEach(filter => filter.type = type);
    }
    /**
     * The rolloff of the filter which is the drop in db
     * per octave. Implemented internally by cascading filters.
     * Only accepts the values -12, -24, -48 and -96.
     */
    get rolloff() {
        return this._rolloff;
    }
    set rolloff(rolloff) {
        const rolloffNum = isNumber(rolloff) ? rolloff : parseInt(rolloff, 10);
        const possibilities = [-12, -24, -48, -96];
        let cascadingCount = possibilities.indexOf(rolloffNum);
        // check the rolloff is valid
        assert(cascadingCount !== -1, `rolloff can only be ${possibilities.join(", ")}`);
        cascadingCount += 1;
        this._rolloff = rolloffNum;
        this.input.disconnect();
        this._filters.forEach(filter => filter.disconnect());
        this._filters = new Array(cascadingCount);
        for (let count = 0; count < cascadingCount; count++) {
            const filter = new BiquadFilter({
                context: this.context,
            });
            filter.type = this._type;
            this.frequency.connect(filter.frequency);
            this.detune.connect(filter.detune);
            this.Q.connect(filter.Q);
            this.gain.connect(filter.gain);
            this._filters[count] = filter;
        }
        this._internalChannels = this._filters;
        connectSeries(this.input, ...this._internalChannels, this.output);
    }
    /**
     * Get the frequency response curve. This curve represents how the filter
     * responses to frequencies between 20hz-20khz.
     * @param  len The number of values to return
     * @return The frequency response curve between 20-20kHz
     */
    getFrequencyResponse(len = 128) {
        const filterClone = new BiquadFilter({
            frequency: this.frequency.value,
            gain: this.gain.value,
            Q: this.Q.value,
            type: this._type,
            detune: this.detune.value,
        });
        // start with all 1s
        const totalResponse = new Float32Array(len).map(() => 1);
        this._filters.forEach(() => {
            const response = filterClone.getFrequencyResponse(len);
            response.forEach((val, i) => totalResponse[i] *= val);
        });
        filterClone.dispose();
        return totalResponse;
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._filters.forEach(filter => {
            filter.dispose();
        });
        writable(this, ["detune", "frequency", "gain", "Q"]);
        this.frequency.dispose();
        this.Q.dispose();
        this.detune.dispose();
        this.gain.dispose();
        return this;
    }
}

/**
 * FrequencyEnvelope is an [[Envelope]] which ramps between [[baseFrequency]]
 * and [[octaves]]. It can also have an optional [[exponent]] to adjust the curve
 * which it ramps.
 * @example
 * const oscillator = new Tone.Oscillator().toDestination().start();
 * const freqEnv = new Tone.FrequencyEnvelope({
 * 	attack: 0.2,
 * 	baseFrequency: "C2",
 * 	octaves: 4
 * });
 * freqEnv.connect(oscillator.frequency);
 * freqEnv.triggerAttack();
 * @category Component
 */
class FrequencyEnvelope extends Envelope {
    constructor() {
        super(optionsFromArguments(FrequencyEnvelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]));
        this.name = "FrequencyEnvelope";
        const options = optionsFromArguments(FrequencyEnvelope.getDefaults(), arguments, ["attack", "decay", "sustain", "release"]);
        this._octaves = options.octaves;
        this._baseFrequency = this.toFrequency(options.baseFrequency);
        this._exponent = this.input = new Pow({
            context: this.context,
            value: options.exponent
        });
        this._scale = this.output = new Scale({
            context: this.context,
            min: this._baseFrequency,
            max: this._baseFrequency * Math.pow(2, this._octaves),
        });
        this._sig.chain(this._exponent, this._scale);
    }
    static getDefaults() {
        return Object.assign(Envelope.getDefaults(), {
            baseFrequency: 200,
            exponent: 1,
            octaves: 4,
        });
    }
    /**
     * The envelope's minimum output value. This is the value which it
     * starts at.
     */
    get baseFrequency() {
        return this._baseFrequency;
    }
    set baseFrequency(min) {
        const freq = this.toFrequency(min);
        assertRange(freq, 0);
        this._baseFrequency = freq;
        this._scale.min = this._baseFrequency;
        // update the max value when the min changes
        this.octaves = this._octaves;
    }
    /**
     * The number of octaves above the baseFrequency that the
     * envelope will scale to.
     */
    get octaves() {
        return this._octaves;
    }
    set octaves(octaves) {
        this._octaves = octaves;
        this._scale.max = this._baseFrequency * Math.pow(2, octaves);
    }
    /**
     * The envelope's exponent value.
     */
    get exponent() {
        return this._exponent.value;
    }
    set exponent(exponent) {
        this._exponent.value = exponent;
    }
    /**
     * Clean up
     */
    dispose() {
        super.dispose();
        this._exponent.dispose();
        this._scale.dispose();
        return this;
    }
}

/**
 * MonoSynth is composed of one `oscillator`, one `filter`, and two `envelopes`.
 * The amplitude of the Oscillator and the cutoff frequency of the
 * Filter are controlled by Envelopes.
 * <img src="https://docs.google.com/drawings/d/1gaY1DF9_Hzkodqf8JI1Cg2VZfwSElpFQfI94IQwad38/pub?w=924&h=240">
 * @example
 * const synth = new Tone.MonoSynth({
 * 	oscillator: {
 * 		type: "square"
 * 	},
 * 	envelope: {
 * 		attack: 0.1
 * 	}
 * }).toDestination();
 * synth.triggerAttackRelease("C4", "8n");
 * @category Instrument
 */
class MonoSynth extends Monophonic {
    constructor() {
        super(optionsFromArguments(MonoSynth.getDefaults(), arguments));
        this.name = "MonoSynth";
        const options = optionsFromArguments(MonoSynth.getDefaults(), arguments);
        this.oscillator = new OmniOscillator(Object.assign(options.oscillator, {
            context: this.context,
            detune: options.detune,
            onstop: () => this.onsilence(this),
        }));
        this.frequency = this.oscillator.frequency;
        this.detune = this.oscillator.detune;
        this.filter = new Filter(Object.assign(options.filter, { context: this.context }));
        this.filterEnvelope = new FrequencyEnvelope(Object.assign(options.filterEnvelope, { context: this.context }));
        this.envelope = new AmplitudeEnvelope(Object.assign(options.envelope, { context: this.context }));
        // connect the oscillators to the output
        this.oscillator.chain(this.filter, this.envelope, this.output);
        // connect the filter envelope
        this.filterEnvelope.connect(this.filter.frequency);
        readOnly(this, ["oscillator", "frequency", "detune", "filter", "filterEnvelope", "envelope"]);
    }
    static getDefaults() {
        return Object.assign(Monophonic.getDefaults(), {
            envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                attack: 0.005,
                decay: 0.1,
                release: 1,
                sustain: 0.9,
            }),
            filter: Object.assign(omitFromObject(Filter.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                Q: 1,
                rolloff: -12,
                type: "lowpass",
            }),
            filterEnvelope: Object.assign(omitFromObject(FrequencyEnvelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                attack: 0.6,
                baseFrequency: 200,
                decay: 0.2,
                exponent: 2,
                octaves: 3,
                release: 2,
                sustain: 0.5,
            }),
            oscillator: Object.assign(omitFromObject(OmniOscillator.getDefaults(), Object.keys(Source.getDefaults())), {
                type: "sawtooth",
            }),
        });
    }
    /**
     * start the attack portion of the envelope
     * @param time the time the attack should start
     * @param velocity the velocity of the note (0-1)
     */
    _triggerEnvelopeAttack(time, velocity = 1) {
        this.envelope.triggerAttack(time, velocity);
        this.filterEnvelope.triggerAttack(time);
        this.oscillator.start(time);
        if (this.envelope.sustain === 0) {
            const computedAttack = this.toSeconds(this.envelope.attack);
            const computedDecay = this.toSeconds(this.envelope.decay);
            this.oscillator.stop(time + computedAttack + computedDecay);
        }
    }
    /**
     * start the release portion of the envelope
     * @param time the time the release should start
     */
    _triggerEnvelopeRelease(time) {
        this.envelope.triggerRelease(time);
        this.filterEnvelope.triggerRelease(time);
        this.oscillator.stop(time + this.toSeconds(this.envelope.release));
    }
    getLevelAtTime(time) {
        time = this.toSeconds(time);
        return this.envelope.getValueAtTime(time);
    }
    dispose() {
        super.dispose();
        this.oscillator.dispose();
        this.envelope.dispose();
        this.filterEnvelope.dispose();
        this.filter.dispose();
        return this;
    }
}

/**
 * DuoSynth is a monophonic synth composed of two [[MonoSynths]] run in parallel with control over the
 * frequency ratio between the two voices and vibrato effect.
 * @example
 * const duoSynth = new Tone.DuoSynth().toDestination();
 * duoSynth.triggerAttackRelease("C4", "2n");
 * @category Instrument
 */
class DuoSynth extends Monophonic {
    constructor() {
        super(optionsFromArguments(DuoSynth.getDefaults(), arguments));
        this.name = "DuoSynth";
        const options = optionsFromArguments(DuoSynth.getDefaults(), arguments);
        this.voice0 = new MonoSynth(Object.assign(options.voice0, {
            context: this.context,
            onsilence: () => this.onsilence(this)
        }));
        this.voice1 = new MonoSynth(Object.assign(options.voice1, {
            context: this.context,
        }));
        this.harmonicity = new Multiply({
            context: this.context,
            units: "positive",
            value: options.harmonicity,
        });
        this._vibrato = new LFO({
            frequency: options.vibratoRate,
            context: this.context,
            min: -50,
            max: 50
        });
        // start the vibrato immediately
        this._vibrato.start();
        this.vibratoRate = this._vibrato.frequency;
        this._vibratoGain = new Gain({
            context: this.context,
            units: "normalRange",
            gain: options.vibratoAmount
        });
        this.vibratoAmount = this._vibratoGain.gain;
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: 440
        });
        this.detune = new Signal({
            context: this.context,
            units: "cents",
            value: options.detune
        });
        // control the two voices frequency
        this.frequency.connect(this.voice0.frequency);
        this.frequency.chain(this.harmonicity, this.voice1.frequency);
        this._vibrato.connect(this._vibratoGain);
        this._vibratoGain.fan(this.voice0.detune, this.voice1.detune);
        this.detune.fan(this.voice0.detune, this.voice1.detune);
        this.voice0.connect(this.output);
        this.voice1.connect(this.output);
        readOnly(this, ["voice0", "voice1", "frequency", "vibratoAmount", "vibratoRate"]);
    }
    getLevelAtTime(time) {
        time = this.toSeconds(time);
        return this.voice0.envelope.getValueAtTime(time) + this.voice1.envelope.getValueAtTime(time);
    }
    static getDefaults() {
        return deepMerge(Monophonic.getDefaults(), {
            vibratoAmount: 0.5,
            vibratoRate: 5,
            harmonicity: 1.5,
            voice0: deepMerge(omitFromObject(MonoSynth.getDefaults(), Object.keys(Monophonic.getDefaults())), {
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                }
            }),
            voice1: deepMerge(omitFromObject(MonoSynth.getDefaults(), Object.keys(Monophonic.getDefaults())), {
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.0,
                    sustain: 1,
                    release: 0.5
                }
            }),
        });
    }
    /**
     * Trigger the attack portion of the note
     */
    _triggerEnvelopeAttack(time, velocity) {
        // @ts-ignore
        this.voice0._triggerEnvelopeAttack(time, velocity);
        // @ts-ignore
        this.voice1._triggerEnvelopeAttack(time, velocity);
    }
    /**
     * Trigger the release portion of the note
     */
    _triggerEnvelopeRelease(time) {
        // @ts-ignore
        this.voice0._triggerEnvelopeRelease(time);
        // @ts-ignore
        this.voice1._triggerEnvelopeRelease(time);
        return this;
    }
    dispose() {
        super.dispose();
        this.voice0.dispose();
        this.voice1.dispose();
        this.frequency.dispose();
        this.detune.dispose();
        this._vibrato.dispose();
        this.vibratoRate.dispose();
        this._vibratoGain.dispose();
        this.harmonicity.dispose();
        return this;
    }
}

/**
 * FMSynth is composed of two Tone.Synths where one Tone.Synth modulates
 * the frequency of a second Tone.Synth. A lot of spectral content
 * can be explored using the modulationIndex parameter. Read more about
 * frequency modulation synthesis on Sound On Sound: [Part 1](https://web.archive.org/web/20160403123704/http://www.soundonsound.com/sos/apr00/articles/synthsecrets.htm), [Part 2](https://web.archive.org/web/20160403115835/http://www.soundonsound.com/sos/may00/articles/synth.htm).
 *
 * @example
 * const fmSynth = new Tone.FMSynth().toDestination();
 * fmSynth.triggerAttackRelease("C5", "4n");
 *
 * @category Instrument
 */
class FMSynth extends ModulationSynth {
    constructor() {
        super(optionsFromArguments(FMSynth.getDefaults(), arguments));
        this.name = "FMSynth";
        const options = optionsFromArguments(FMSynth.getDefaults(), arguments);
        this.modulationIndex = new Multiply({
            context: this.context,
            value: options.modulationIndex,
        });
        // control the two voices frequency
        this.frequency.connect(this._carrier.frequency);
        this.frequency.chain(this.harmonicity, this._modulator.frequency);
        this.frequency.chain(this.modulationIndex, this._modulationNode);
        this.detune.fan(this._carrier.detune, this._modulator.detune);
        this._modulator.connect(this._modulationNode.gain);
        this._modulationNode.connect(this._carrier.frequency);
        this._carrier.connect(this.output);
    }
    static getDefaults() {
        return Object.assign(ModulationSynth.getDefaults(), {
            modulationIndex: 10,
        });
    }
    dispose() {
        super.dispose();
        this.modulationIndex.dispose();
        return this;
    }
}

/**
 * Inharmonic ratio of frequencies based on the Roland TR-808
 * Taken from https://ccrma.stanford.edu/papers/tr-808-cymbal-physically-informed-circuit-bendable-digital-model
 */
const inharmRatios = [1.0, 1.483, 1.932, 2.546, 2.630, 3.897];
/**
 * A highly inharmonic and spectrally complex source with a highpass filter
 * and amplitude envelope which is good for making metallophone sounds.
 * Based on CymbalSynth by [@polyrhythmatic](https://github.com/polyrhythmatic).
 * Inspiration from [Sound on Sound](https://shorturl.at/rSZ12).
 * @category Instrument
 */
class MetalSynth extends Monophonic {
    constructor() {
        super(optionsFromArguments(MetalSynth.getDefaults(), arguments));
        this.name = "MetalSynth";
        /**
         * The array of FMOscillators
         */
        this._oscillators = [];
        /**
         * The frequency multipliers
         */
        this._freqMultipliers = [];
        const options = optionsFromArguments(MetalSynth.getDefaults(), arguments);
        this.detune = new Signal({
            context: this.context,
            units: "cents",
            value: options.detune,
        });
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
        });
        this._amplitude = new Gain({
            context: this.context,
            gain: 0,
        }).connect(this.output);
        this._highpass = new Filter({
            // Q: -3.0102999566398125,
            Q: 0,
            context: this.context,
            type: "highpass",
        }).connect(this._amplitude);
        for (let i = 0; i < inharmRatios.length; i++) {
            const osc = new FMOscillator({
                context: this.context,
                harmonicity: options.harmonicity,
                modulationIndex: options.modulationIndex,
                modulationType: "square",
                onstop: i === 0 ? () => this.onsilence(this) : noOp,
                type: "square",
            });
            osc.connect(this._highpass);
            this._oscillators[i] = osc;
            const mult = new Multiply({
                context: this.context,
                value: inharmRatios[i],
            });
            this._freqMultipliers[i] = mult;
            this.frequency.chain(mult, osc.frequency);
            this.detune.connect(osc.detune);
        }
        this._filterFreqScaler = new Scale({
            context: this.context,
            max: 7000,
            min: this.toFrequency(options.resonance),
        });
        this.envelope = new Envelope({
            attack: options.envelope.attack,
            attackCurve: "linear",
            context: this.context,
            decay: options.envelope.decay,
            release: options.envelope.release,
            sustain: 0,
        });
        this.envelope.chain(this._filterFreqScaler, this._highpass.frequency);
        this.envelope.connect(this._amplitude.gain);
        // set the octaves
        this._octaves = options.octaves;
        this.octaves = options.octaves;
    }
    static getDefaults() {
        return deepMerge(Monophonic.getDefaults(), {
            envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                attack: 0.001,
                decay: 1.4,
                release: 0.2,
            }),
            harmonicity: 5.1,
            modulationIndex: 32,
            octaves: 1.5,
            resonance: 4000,
        });
    }
    /**
     * Trigger the attack.
     * @param time When the attack should be triggered.
     * @param velocity The velocity that the envelope should be triggered at.
     */
    _triggerEnvelopeAttack(time, velocity = 1) {
        this.envelope.triggerAttack(time, velocity);
        this._oscillators.forEach(osc => osc.start(time));
        if (this.envelope.sustain === 0) {
            this._oscillators.forEach(osc => {
                osc.stop(time + this.toSeconds(this.envelope.attack) + this.toSeconds(this.envelope.decay));
            });
        }
        return this;
    }
    /**
     * Trigger the release of the envelope.
     * @param time When the release should be triggered.
     */
    _triggerEnvelopeRelease(time) {
        this.envelope.triggerRelease(time);
        this._oscillators.forEach(osc => osc.stop(time + this.toSeconds(this.envelope.release)));
        return this;
    }
    getLevelAtTime(time) {
        time = this.toSeconds(time);
        return this.envelope.getValueAtTime(time);
    }
    /**
     * The modulationIndex of the oscillators which make up the source.
     * see [[FMOscillator.modulationIndex]]
     * @min 1
     * @max 100
     */
    get modulationIndex() {
        return this._oscillators[0].modulationIndex.value;
    }
    set modulationIndex(val) {
        this._oscillators.forEach(osc => (osc.modulationIndex.value = val));
    }
    /**
     * The harmonicity of the oscillators which make up the source.
     * see Tone.FMOscillator.harmonicity
     * @min 0.1
     * @max 10
     */
    get harmonicity() {
        return this._oscillators[0].harmonicity.value;
    }
    set harmonicity(val) {
        this._oscillators.forEach(osc => (osc.harmonicity.value = val));
    }
    /**
     * The lower level of the highpass filter which is attached to the envelope.
     * This value should be between [0, 7000]
     * @min 0
     * @max 7000
     */
    get resonance() {
        return this._filterFreqScaler.min;
    }
    set resonance(val) {
        this._filterFreqScaler.min = this.toFrequency(val);
        this.octaves = this._octaves;
    }
    /**
     * The number of octaves above the "resonance" frequency
     * that the filter ramps during the attack/decay envelope
     * @min 0
     * @max 8
     */
    get octaves() {
        return this._octaves;
    }
    set octaves(val) {
        this._octaves = val;
        this._filterFreqScaler.max = this._filterFreqScaler.min * Math.pow(2, val);
    }
    dispose() {
        super.dispose();
        this._oscillators.forEach(osc => osc.dispose());
        this._freqMultipliers.forEach(freqMult => freqMult.dispose());
        this.frequency.dispose();
        this.detune.dispose();
        this._filterFreqScaler.dispose();
        this._amplitude.dispose();
        this.envelope.dispose();
        this._highpass.dispose();
        return this;
    }
}

/**
 * Tone.NoiseSynth is composed of [[Noise]] through an [[AmplitudeEnvelope]].
 * ```
 * +-------+   +-------------------+
 * | Noise +>--> AmplitudeEnvelope +>--> Output
 * +-------+   +-------------------+
 * ```
 * @example
 * const noiseSynth = new Tone.NoiseSynth().toDestination();
 * noiseSynth.triggerAttackRelease("8n", 0.05);
 * @category Instrument
 */
class NoiseSynth extends Instrument {
    constructor() {
        super(optionsFromArguments(NoiseSynth.getDefaults(), arguments));
        this.name = "NoiseSynth";
        const options = optionsFromArguments(NoiseSynth.getDefaults(), arguments);
        this.noise = new Noise(Object.assign({
            context: this.context,
        }, options.noise));
        this.envelope = new AmplitudeEnvelope(Object.assign({
            context: this.context,
        }, options.envelope));
        // connect the noise to the output
        this.noise.chain(this.envelope, this.output);
    }
    static getDefaults() {
        return Object.assign(Instrument.getDefaults(), {
            envelope: Object.assign(omitFromObject(Envelope.getDefaults(), Object.keys(ToneAudioNode.getDefaults())), {
                decay: 0.1,
                sustain: 0.0,
            }),
            noise: Object.assign(omitFromObject(Noise.getDefaults(), Object.keys(Source.getDefaults())), {
                type: "white",
            }),
        });
    }
    /**
     * Start the attack portion of the envelopes. Unlike other
     * instruments, Tone.NoiseSynth doesn't have a note.
     * @example
     * const noiseSynth = new Tone.NoiseSynth().toDestination();
     * noiseSynth.triggerAttack();
     */
    triggerAttack(time, velocity = 1) {
        time = this.toSeconds(time);
        // the envelopes
        this.envelope.triggerAttack(time, velocity);
        // start the noise
        this.noise.start(time);
        if (this.envelope.sustain === 0) {
            this.noise.stop(time + this.toSeconds(this.envelope.attack) + this.toSeconds(this.envelope.decay));
        }
        return this;
    }
    /**
     * Start the release portion of the envelopes.
     */
    triggerRelease(time) {
        time = this.toSeconds(time);
        this.envelope.triggerRelease(time);
        this.noise.stop(time + this.toSeconds(this.envelope.release));
        return this;
    }
    sync() {
        if (this._syncState()) {
            this._syncMethod("triggerAttack", 0);
            this._syncMethod("triggerRelease", 0);
        }
        return this;
    }
    triggerAttackRelease(duration, time, velocity = 1) {
        time = this.toSeconds(time);
        duration = this.toSeconds(duration);
        this.triggerAttack(time, velocity);
        this.triggerRelease(time + duration);
        return this;
    }
    dispose() {
        super.dispose();
        this.noise.dispose();
        this.envelope.dispose();
        return this;
    }
}

class ToneAudioWorklet extends ToneAudioNode {
    constructor(options) {
        super(options);
        this.name = "ToneAudioWorklet";
        /**
         * The constructor options for the node
         */
        this.workletOptions = {};
        /**
         * Callback which is invoked when there is an error in the processing
         */
        this.onprocessorerror = noOp;
        const blobUrl = URL.createObjectURL(new Blob([getWorkletGlobalScope()], { type: "text/javascript" }));
        const name = this._audioWorkletName();
        this._dummyGain = this.context.createGain();
        this._dummyParam = this._dummyGain.gain;
        // Register the processor
        this.context.addAudioWorkletModule(blobUrl, name).then(() => {
            // create the worklet when it's read
            if (!this.disposed) {
                this._worklet = this.context.createAudioWorkletNode(name, this.workletOptions);
                this._worklet.onprocessorerror = this.onprocessorerror.bind(this);
                this.onReady(this._worklet);
            }
        });
    }
    dispose() {
        super.dispose();
        this._dummyGain.disconnect();
        if (this._worklet) {
            this._worklet.port.postMessage("dispose");
            this._worklet.disconnect();
        }
        return this;
    }
}

/**
 * Comb filters are basic building blocks for physical modeling. Read more
 * about comb filters on [CCRMA's website](https://ccrma.stanford.edu/~jos/pasp/Feedback_Comb_Filters.html).
 *
 * This comb filter is implemented with the AudioWorkletNode which allows it to have feedback delays less than the
 * Web Audio processing block of 128 samples. There is a polyfill for browsers that don't yet support the
 * AudioWorkletNode, but it will add some latency and have slower performance than the AudioWorkletNode.
 * @category Component
 */
class FeedbackCombFilter extends ToneAudioWorklet {
    constructor() {
        super(optionsFromArguments(FeedbackCombFilter.getDefaults(), arguments, ["delayTime", "resonance"]));
        this.name = "FeedbackCombFilter";
        const options = optionsFromArguments(FeedbackCombFilter.getDefaults(), arguments, ["delayTime", "resonance"]);
        this.input = new Gain({ context: this.context });
        this.output = new Gain({ context: this.context });
        this.delayTime = new Param({
            context: this.context,
            value: options.delayTime,
            units: "time",
            minValue: 0,
            maxValue: 1,
            param: this._dummyParam,
            swappable: true,
        });
        this.resonance = new Param({
            context: this.context,
            value: options.resonance,
            units: "normalRange",
            param: this._dummyParam,
            swappable: true,
        });
        readOnly(this, ["resonance", "delayTime"]);
    }
    _audioWorkletName() {
        return workletName;
    }
    /**
     * The default parameters
     */
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            delayTime: 0.1,
            resonance: 0.5,
        });
    }
    onReady(node) {
        connectSeries(this.input, node, this.output);
        const delayTime = node.parameters.get("delayTime");
        this.delayTime.setParam(delayTime);
        const feedback = node.parameters.get("feedback");
        this.resonance.setParam(feedback);
    }
    dispose() {
        super.dispose();
        this.input.dispose();
        this.output.dispose();
        this.delayTime.dispose();
        this.resonance.dispose();
        return this;
    }
}

/**
 * A one pole filter with 6db-per-octave rolloff. Either "highpass" or "lowpass".
 * Note that changing the type or frequency may result in a discontinuity which
 * can sound like a click or pop.
 * References:
 * * http://www.earlevel.com/main/2012/12/15/a-one-pole-filter/
 * * http://www.dspguide.com/ch19/2.htm
 * * https://github.com/vitaliy-bobrov/js-rocks/blob/master/src/app/audio/effects/one-pole-filters.ts
 * @category Component
 */
class OnePoleFilter extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(OnePoleFilter.getDefaults(), arguments, ["frequency", "type"]));
        this.name = "OnePoleFilter";
        const options = optionsFromArguments(OnePoleFilter.getDefaults(), arguments, ["frequency", "type"]);
        this._frequency = options.frequency;
        this._type = options.type;
        this.input = new Gain({ context: this.context });
        this.output = new Gain({ context: this.context });
        this._createFilter();
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            frequency: 880,
            type: "lowpass"
        });
    }
    /**
     * Create a filter and dispose the old one
     */
    _createFilter() {
        const oldFilter = this._filter;
        const freq = this.toFrequency(this._frequency);
        const t = 1 / (2 * Math.PI * freq);
        if (this._type === "lowpass") {
            const a0 = 1 / (t * this.context.sampleRate);
            const b1 = a0 - 1;
            this._filter = this.context.createIIRFilter([a0, 0], [1, b1]);
        }
        else {
            const b1 = 1 / (t * this.context.sampleRate) - 1;
            this._filter = this.context.createIIRFilter([1, -1], [1, b1]);
        }
        this.input.chain(this._filter, this.output);
        if (oldFilter) {
            // dispose it on the next block
            this.context.setTimeout(() => {
                if (!this.disposed) {
                    this.input.disconnect(oldFilter);
                    oldFilter.disconnect();
                }
            }, this.blockTime);
        }
    }
    /**
     * The frequency value.
     */
    get frequency() {
        return this._frequency;
    }
    set frequency(fq) {
        this._frequency = fq;
        this._createFilter();
    }
    /**
     * The OnePole Filter type, either "highpass" or "lowpass"
     */
    get type() {
        return this._type;
    }
    set type(t) {
        this._type = t;
        this._createFilter();
    }
    /**
     * Get the frequency response curve. This curve represents how the filter
     * responses to frequencies between 20hz-20khz.
     * @param  len The number of values to return
     * @return The frequency response curve between 20-20kHz
     */
    getFrequencyResponse(len = 128) {
        const freqValues = new Float32Array(len);
        for (let i = 0; i < len; i++) {
            const norm = Math.pow(i / len, 2);
            const freq = norm * (20000 - 20) + 20;
            freqValues[i] = freq;
        }
        const magValues = new Float32Array(len);
        const phaseValues = new Float32Array(len);
        this._filter.getFrequencyResponse(freqValues, magValues, phaseValues);
        return magValues;
    }
    dispose() {
        super.dispose();
        this.input.dispose();
        this.output.dispose();
        this._filter.disconnect();
        return this;
    }
}

/**
 * A lowpass feedback comb filter. It is similar to
 * [[FeedbackCombFilter]], but includes a lowpass filter.
 * @category Component
 */
class LowpassCombFilter extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(LowpassCombFilter.getDefaults(), arguments, ["delayTime", "resonance", "dampening"]));
        this.name = "LowpassCombFilter";
        const options = optionsFromArguments(LowpassCombFilter.getDefaults(), arguments, ["delayTime", "resonance", "dampening"]);
        this._combFilter = this.output = new FeedbackCombFilter({
            context: this.context,
            delayTime: options.delayTime,
            resonance: options.resonance,
        });
        this.delayTime = this._combFilter.delayTime;
        this.resonance = this._combFilter.resonance;
        this._lowpass = this.input = new OnePoleFilter({
            context: this.context,
            frequency: options.dampening,
            type: "lowpass",
        });
        // connections
        this._lowpass.connect(this._combFilter);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            dampening: 3000,
            delayTime: 0.1,
            resonance: 0.5,
        });
    }
    /**
     * The dampening control of the feedback
     */
    get dampening() {
        return this._lowpass.frequency;
    }
    set dampening(fq) {
        this._lowpass.frequency = fq;
    }
    dispose() {
        super.dispose();
        this._combFilter.dispose();
        this._lowpass.dispose();
        return this;
    }
}

/**
 * Karplus-String string synthesis.
 * @example
 * const plucky = new Tone.PluckSynth().toDestination();
 * plucky.triggerAttack("C4", "+0.5");
 * plucky.triggerAttack("C3", "+1");
 * plucky.triggerAttack("C2", "+1.5");
 * plucky.triggerAttack("C1", "+2");
 * @category Instrument
 */
class PluckSynth extends Instrument {
    constructor() {
        super(optionsFromArguments(PluckSynth.getDefaults(), arguments));
        this.name = "PluckSynth";
        const options = optionsFromArguments(PluckSynth.getDefaults(), arguments);
        this._noise = new Noise({
            context: this.context,
            type: "pink"
        });
        this.attackNoise = options.attackNoise;
        this._lfcf = new LowpassCombFilter({
            context: this.context,
            dampening: options.dampening,
            resonance: options.resonance,
        });
        this.resonance = options.resonance;
        this.release = options.release;
        this._noise.connect(this._lfcf);
        this._lfcf.connect(this.output);
    }
    static getDefaults() {
        return deepMerge(Instrument.getDefaults(), {
            attackNoise: 1,
            dampening: 4000,
            resonance: 0.7,
            release: 1,
        });
    }
    /**
     * The dampening control. i.e. the lowpass filter frequency of the comb filter
     * @min 0
     * @max 7000
     */
    get dampening() {
        return this._lfcf.dampening;
    }
    set dampening(fq) {
        this._lfcf.dampening = fq;
    }
    triggerAttack(note, time) {
        const freq = this.toFrequency(note);
        time = this.toSeconds(time);
        const delayAmount = 1 / freq;
        this._lfcf.delayTime.setValueAtTime(delayAmount, time);
        this._noise.start(time);
        this._noise.stop(time + delayAmount * this.attackNoise);
        this._lfcf.resonance.cancelScheduledValues(time);
        this._lfcf.resonance.setValueAtTime(this.resonance, time);
        return this;
    }
    /**
     * Ramp down the [[resonance]] to 0 over the duration of the release time.
     */
    triggerRelease(time) {
        this._lfcf.resonance.linearRampTo(0, this.release, time);
        return this;
    }
    dispose() {
        super.dispose();
        this._noise.dispose();
        this._lfcf.dispose();
        return this;
    }
}

/**
 * PolySynth handles voice creation and allocation for any
 * instruments passed in as the second paramter. PolySynth is
 * not a synthesizer by itself, it merely manages voices of
 * one of the other types of synths, allowing any of the
 * monophonic synthesizers to be polyphonic.
 *
 * @example
 * const synth = new Tone.PolySynth().toDestination();
 * // set the attributes across all the voices using 'set'
 * synth.set({ detune: -1200 });
 * // play a chord
 * synth.triggerAttackRelease(["C4", "E4", "A4"], 1);
 * @category Instrument
 */
class PolySynth extends Instrument {
    constructor() {
        super(optionsFromArguments(PolySynth.getDefaults(), arguments, ["voice", "options"]));
        this.name = "PolySynth";
        /**
         * The voices which are not currently in use
         */
        this._availableVoices = [];
        /**
         * The currently active voices
         */
        this._activeVoices = [];
        /**
         * All of the allocated voices for this synth.
         */
        this._voices = [];
        /**
         * The GC timeout. Held so that it could be cancelled when the node is disposed.
         */
        this._gcTimeout = -1;
        /**
         * A moving average of the number of active voices
         */
        this._averageActiveVoices = 0;
        const options = optionsFromArguments(PolySynth.getDefaults(), arguments, ["voice", "options"]);
        // check against the old API (pre 14.3.0)
        assert(!isNumber(options.voice), "DEPRECATED: The polyphony count is no longer the first argument.");
        const defaults = options.voice.getDefaults();
        this.options = Object.assign(defaults, options.options);
        this.voice = options.voice;
        this.maxPolyphony = options.maxPolyphony;
        // create the first voice
        this._dummyVoice = this._getNextAvailableVoice();
        // remove it from the voices list
        const index = this._voices.indexOf(this._dummyVoice);
        this._voices.splice(index, 1);
        // kick off the GC interval
        this._gcTimeout = this.context.setInterval(this._collectGarbage.bind(this), 1);
    }
    static getDefaults() {
        return Object.assign(Instrument.getDefaults(), {
            maxPolyphony: 32,
            options: {},
            voice: Synth,
        });
    }
    /**
     * The number of active voices.
     */
    get activeVoices() {
        return this._activeVoices.length;
    }
    /**
     * Invoked when the source is done making sound, so that it can be
     * readded to the pool of available voices
     */
    _makeVoiceAvailable(voice) {
        this._availableVoices.push(voice);
        // remove the midi note from 'active voices'
        const activeVoiceIndex = this._activeVoices.findIndex((e) => e.voice === voice);
        this._activeVoices.splice(activeVoiceIndex, 1);
    }
    /**
     * Get an available voice from the pool of available voices.
     * If one is not available and the maxPolyphony limit is reached,
     * steal a voice, otherwise return null.
     */
    _getNextAvailableVoice() {
        // if there are available voices, return the first one
        if (this._availableVoices.length) {
            return this._availableVoices.shift();
        }
        else if (this._voices.length < this.maxPolyphony) {
            // otherwise if there is still more maxPolyphony, make a new voice
            const voice = new this.voice(Object.assign(this.options, {
                context: this.context,
                onsilence: this._makeVoiceAvailable.bind(this),
            }));
            voice.connect(this.output);
            this._voices.push(voice);
            return voice;
        }
        else {
            warn("Max polyphony exceeded. Note dropped.");
        }
    }
    /**
     * Occasionally check if there are any allocated voices which can be cleaned up.
     */
    _collectGarbage() {
        this._averageActiveVoices = Math.max(this._averageActiveVoices * 0.95, this.activeVoices);
        if (this._availableVoices.length && this._voices.length > Math.ceil(this._averageActiveVoices + 1)) {
            // take off an available note
            const firstAvail = this._availableVoices.shift();
            const index = this._voices.indexOf(firstAvail);
            this._voices.splice(index, 1);
            if (!this.context.isOffline) {
                firstAvail.dispose();
            }
        }
    }
    /**
     * Internal method which triggers the attack
     */
    _triggerAttack(notes, time, velocity) {
        notes.forEach(note => {
            const midiNote = new MidiClass(this.context, note).toMidi();
            const voice = this._getNextAvailableVoice();
            if (voice) {
                voice.triggerAttack(note, time, velocity);
                this._activeVoices.push({
                    midi: midiNote, voice, released: false,
                });
                this.log("triggerAttack", note, time);
            }
        });
    }
    /**
     * Internal method which triggers the release
     */
    _triggerRelease(notes, time) {
        notes.forEach(note => {
            const midiNote = new MidiClass(this.context, note).toMidi();
            const event = this._activeVoices.find(({ midi, released }) => midi === midiNote && !released);
            if (event) {
                // trigger release on that note
                event.voice.triggerRelease(time);
                // mark it as released
                event.released = true;
                this.log("triggerRelease", note, time);
            }
        });
    }
    /**
     * Schedule the attack/release events. If the time is in the future, then it should set a timeout
     * to wait for just-in-time scheduling
     */
    _scheduleEvent(type, notes, time, velocity) {
        assert(!this.disposed, "Synth was already disposed");
        // if the notes are greater than this amount of time in the future, they should be scheduled with setTimeout
        if (time <= this.now()) {
            // do it immediately
            if (type === "attack") {
                this._triggerAttack(notes, time, velocity);
            }
            else {
                this._triggerRelease(notes, time);
            }
        }
        else {
            // schedule it to start in the future
            this.context.setTimeout(() => {
                this._scheduleEvent(type, notes, time, velocity);
            }, time - this.now());
        }
    }
    /**
     * Trigger the attack portion of the note
     * @param  notes The notes to play. Accepts a single Frequency or an array of frequencies.
     * @param  time  The start time of the note.
     * @param velocity The velocity of the note.
     * @example
     * const synth = new Tone.PolySynth(Tone.FMSynth).toDestination();
     * // trigger a chord immediately with a velocity of 0.2
     * synth.triggerAttack(["Ab3", "C4", "F5"], Tone.now(), 0.2);
     */
    triggerAttack(notes, time, velocity) {
        if (!Array.isArray(notes)) {
            notes = [notes];
        }
        const computedTime = this.toSeconds(time);
        this._scheduleEvent("attack", notes, computedTime, velocity);
        return this;
    }
    /**
     * Trigger the release of the note. Unlike monophonic instruments,
     * a note (or array of notes) needs to be passed in as the first argument.
     * @param  notes The notes to play. Accepts a single Frequency or an array of frequencies.
     * @param  time  When the release will be triggered.
     * @example
     * @example
     * const poly = new Tone.PolySynth(Tone.AMSynth).toDestination();
     * poly.triggerAttack(["Ab3", "C4", "F5"]);
     * // trigger the release of the given notes.
     * poly.triggerRelease(["Ab3", "C4"], "+1");
     * poly.triggerRelease("F5", "+3");
     */
    triggerRelease(notes, time) {
        if (!Array.isArray(notes)) {
            notes = [notes];
        }
        const computedTime = this.toSeconds(time);
        this._scheduleEvent("release", notes, computedTime);
        return this;
    }
    /**
     * Trigger the attack and release after the specified duration
     * @param  notes The notes to play. Accepts a single  Frequency or an array of frequencies.
     * @param  duration the duration of the note
     * @param  time  if no time is given, defaults to now
     * @param  velocity the velocity of the attack (0-1)
     * @example
     * const poly = new Tone.PolySynth(Tone.AMSynth).toDestination();
     * // can pass in an array of durations as well
     * poly.triggerAttackRelease(["Eb3", "G4", "Bb4", "D5"], [4, 3, 2, 1]);
     */
    triggerAttackRelease(notes, duration, time, velocity) {
        const computedTime = this.toSeconds(time);
        this.triggerAttack(notes, computedTime, velocity);
        if (isArray(duration)) {
            assert(isArray(notes), "If the duration is an array, the notes must also be an array");
            notes = notes;
            for (let i = 0; i < notes.length; i++) {
                const d = duration[Math.min(i, duration.length - 1)];
                const durationSeconds = this.toSeconds(d);
                assert(durationSeconds > 0, "The duration must be greater than 0");
                this.triggerRelease(notes[i], computedTime + durationSeconds);
            }
        }
        else {
            const durationSeconds = this.toSeconds(duration);
            assert(durationSeconds > 0, "The duration must be greater than 0");
            this.triggerRelease(notes, computedTime + durationSeconds);
        }
        return this;
    }
    sync() {
        if (this._syncState()) {
            this._syncMethod("triggerAttack", 1);
            this._syncMethod("triggerRelease", 1);
        }
        return this;
    }
    /**
     * Set a member/attribute of the voices
     * @example
     * const poly = new Tone.PolySynth().toDestination();
     * // set all of the voices using an options object for the synth type
     * poly.set({
     * 	envelope: {
     * 		attack: 0.25
     * 	}
     * });
     * poly.triggerAttackRelease("Bb3", 0.2);
     */
    set(options) {
        // remove options which are controlled by the PolySynth
        const sanitizedOptions = omitFromObject(options, ["onsilence", "context"]);
        // store all of the options
        this.options = deepMerge(this.options, sanitizedOptions);
        this._voices.forEach(voice => voice.set(sanitizedOptions));
        this._dummyVoice.set(sanitizedOptions);
        return this;
    }
    get() {
        return this._dummyVoice.get();
    }
    /**
     * Trigger the release portion of all the currently active voices immediately.
     * Useful for silencing the synth.
     */
    releaseAll(time) {
        const computedTime = this.toSeconds(time);
        this._activeVoices.forEach(({ voice }) => {
            voice.triggerRelease(computedTime);
        });
        return this;
    }
    dispose() {
        super.dispose();
        this._dummyVoice.dispose();
        this._voices.forEach(v => v.dispose());
        this._activeVoices = [];
        this._availableVoices = [];
        this.context.clearInterval(this._gcTimeout);
        return this;
    }
}

/**
 * ToneEvent abstracts away this.context.transport.schedule and provides a schedulable
 * callback for a single or repeatable events along the timeline.
 *
 * @example
 * const synth = new Tone.PolySynth().toDestination();
 * const chordEvent = new Tone.ToneEvent(((time, chord) => {
 * 	// the chord as well as the exact time of the event
 * 	// are passed in as arguments to the callback function
 * 	synth.triggerAttackRelease(chord, 0.5, time);
 * }), ["D4", "E4", "F4"]);
 * // start the chord at the beginning of the transport timeline
 * chordEvent.start();
 * // loop it every measure for 8 measures
 * chordEvent.loop = 8;
 * chordEvent.loopEnd = "1m";
 * @category Event
 */
class ToneEvent extends ToneWithContext {
    constructor() {
        super(optionsFromArguments(ToneEvent.getDefaults(), arguments, ["callback", "value"]));
        this.name = "ToneEvent";
        /**
         * Tracks the scheduled events
         */
        this._state = new StateTimeline("stopped");
        /**
         * A delay time from when the event is scheduled to start
         */
        this._startOffset = 0;
        const options = optionsFromArguments(ToneEvent.getDefaults(), arguments, ["callback", "value"]);
        this._loop = options.loop;
        this.callback = options.callback;
        this.value = options.value;
        this._loopStart = this.toTicks(options.loopStart);
        this._loopEnd = this.toTicks(options.loopEnd);
        this._playbackRate = options.playbackRate;
        this._probability = options.probability;
        this._humanize = options.humanize;
        this.mute = options.mute;
        this._playbackRate = options.playbackRate;
        this._state.increasing = true;
        // schedule the events for the first time
        this._rescheduleEvents();
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            callback: noOp,
            humanize: false,
            loop: false,
            loopEnd: "1m",
            loopStart: 0,
            mute: false,
            playbackRate: 1,
            probability: 1,
            value: null,
        });
    }
    /**
     * Reschedule all of the events along the timeline
     * with the updated values.
     * @param after Only reschedules events after the given time.
     */
    _rescheduleEvents(after = -1) {
        // if no argument is given, schedules all of the events
        this._state.forEachFrom(after, event => {
            let duration;
            if (event.state === "started") {
                if (event.id !== -1) {
                    this.context.transport.clear(event.id);
                }
                const startTick = event.time + Math.round(this.startOffset / this._playbackRate);
                if (this._loop === true || isNumber(this._loop) && this._loop > 1) {
                    duration = Infinity;
                    if (isNumber(this._loop)) {
                        duration = (this._loop) * this._getLoopDuration();
                    }
                    const nextEvent = this._state.getAfter(startTick);
                    if (nextEvent !== null) {
                        duration = Math.min(duration, nextEvent.time - startTick);
                    }
                    if (duration !== Infinity) {
                        // schedule a stop since it's finite duration
                        this._state.setStateAtTime("stopped", startTick + duration + 1, { id: -1 });
                        duration = new TicksClass(this.context, duration);
                    }
                    const interval = new TicksClass(this.context, this._getLoopDuration());
                    event.id = this.context.transport.scheduleRepeat(this._tick.bind(this), interval, new TicksClass(this.context, startTick), duration);
                }
                else {
                    event.id = this.context.transport.schedule(this._tick.bind(this), new TicksClass(this.context, startTick));
                }
            }
        });
    }
    /**
     * Returns the playback state of the note, either "started" or "stopped".
     */
    get state() {
        return this._state.getValueAtTime(this.context.transport.ticks);
    }
    /**
     * The start from the scheduled start time.
     */
    get startOffset() {
        return this._startOffset;
    }
    set startOffset(offset) {
        this._startOffset = offset;
    }
    /**
     * The probability of the notes being triggered.
     */
    get probability() {
        return this._probability;
    }
    set probability(prob) {
        this._probability = prob;
    }
    /**
     * If set to true, will apply small random variation
     * to the callback time. If the value is given as a time, it will randomize
     * by that amount.
     * @example
     * const event = new Tone.ToneEvent();
     * event.humanize = true;
     */
    get humanize() {
        return this._humanize;
    }
    set humanize(variation) {
        this._humanize = variation;
    }
    /**
     * Start the note at the given time.
     * @param  time  When the event should start.
     */
    start(time) {
        const ticks = this.toTicks(time);
        if (this._state.getValueAtTime(ticks) === "stopped") {
            this._state.add({
                id: -1,
                state: "started",
                time: ticks,
            });
            this._rescheduleEvents(ticks);
        }
        return this;
    }
    /**
     * Stop the Event at the given time.
     * @param  time  When the event should stop.
     */
    stop(time) {
        this.cancel(time);
        const ticks = this.toTicks(time);
        if (this._state.getValueAtTime(ticks) === "started") {
            this._state.setStateAtTime("stopped", ticks, { id: -1 });
            const previousEvent = this._state.getBefore(ticks);
            let reschedulTime = ticks;
            if (previousEvent !== null) {
                reschedulTime = previousEvent.time;
            }
            this._rescheduleEvents(reschedulTime);
        }
        return this;
    }
    /**
     * Cancel all scheduled events greater than or equal to the given time
     * @param  time  The time after which events will be cancel.
     */
    cancel(time) {
        time = defaultArg(time, -Infinity);
        const ticks = this.toTicks(time);
        this._state.forEachFrom(ticks, event => {
            this.context.transport.clear(event.id);
        });
        this._state.cancel(ticks);
        return this;
    }
    /**
     * The callback function invoker. Also
     * checks if the Event is done playing
     * @param  time  The time of the event in seconds
     */
    _tick(time) {
        const ticks = this.context.transport.getTicksAtTime(time);
        if (!this.mute && this._state.getValueAtTime(ticks) === "started") {
            if (this.probability < 1 && Math.random() > this.probability) {
                return;
            }
            if (this.humanize) {
                let variation = 0.02;
                if (!isBoolean(this.humanize)) {
                    variation = this.toSeconds(this.humanize);
                }
                time += (Math.random() * 2 - 1) * variation;
            }
            this.callback(time, this.value);
        }
    }
    /**
     * Get the duration of the loop.
     */
    _getLoopDuration() {
        return Math.round((this._loopEnd - this._loopStart) / this._playbackRate);
    }
    /**
     * If the note should loop or not
     * between ToneEvent.loopStart and
     * ToneEvent.loopEnd. If set to true,
     * the event will loop indefinitely,
     * if set to a number greater than 1
     * it will play a specific number of
     * times, if set to false, 0 or 1, the
     * part will only play once.
     */
    get loop() {
        return this._loop;
    }
    set loop(loop) {
        this._loop = loop;
        this._rescheduleEvents();
    }
    /**
     * The playback rate of the note. Defaults to 1.
     * @example
     * const note = new Tone.ToneEvent();
     * note.loop = true;
     * // repeat the note twice as fast
     * note.playbackRate = 2;
     */
    get playbackRate() {
        return this._playbackRate;
    }
    set playbackRate(rate) {
        this._playbackRate = rate;
        this._rescheduleEvents();
    }
    /**
     * The loopEnd point is the time the event will loop
     * if ToneEvent.loop is true.
     */
    get loopEnd() {
        return new TicksClass(this.context, this._loopEnd).toSeconds();
    }
    set loopEnd(loopEnd) {
        this._loopEnd = this.toTicks(loopEnd);
        if (this._loop) {
            this._rescheduleEvents();
        }
    }
    /**
     * The time when the loop should start.
     */
    get loopStart() {
        return new TicksClass(this.context, this._loopStart).toSeconds();
    }
    set loopStart(loopStart) {
        this._loopStart = this.toTicks(loopStart);
        if (this._loop) {
            this._rescheduleEvents();
        }
    }
    /**
     * The current progress of the loop interval.
     * Returns 0 if the event is not started yet or
     * it is not set to loop.
     */
    get progress() {
        if (this._loop) {
            const ticks = this.context.transport.ticks;
            const lastEvent = this._state.get(ticks);
            if (lastEvent !== null && lastEvent.state === "started") {
                const loopDuration = this._getLoopDuration();
                const progress = (ticks - lastEvent.time) % loopDuration;
                return progress / loopDuration;
            }
            else {
                return 0;
            }
        }
        else {
            return 0;
        }
    }
    dispose() {
        super.dispose();
        this.cancel();
        this._state.dispose();
        return this;
    }
}

/**
 * Loop creates a looped callback at the
 * specified interval. The callback can be
 * started, stopped and scheduled along
 * the Transport's timeline.
 * @example
 * const loop = new Tone.Loop((time) => {
 * 	// triggered every eighth note.
 * 	console.log(time);
 * }, "8n").start(0);
 * Tone.Transport.start();
 * @category Event
 */
class Loop extends ToneWithContext {
    constructor() {
        super(optionsFromArguments(Loop.getDefaults(), arguments, ["callback", "interval"]));
        this.name = "Loop";
        const options = optionsFromArguments(Loop.getDefaults(), arguments, ["callback", "interval"]);
        this._event = new ToneEvent({
            context: this.context,
            callback: this._tick.bind(this),
            loop: true,
            loopEnd: options.interval,
            playbackRate: options.playbackRate,
            probability: options.probability
        });
        this.callback = options.callback;
        // set the iterations
        this.iterations = options.iterations;
    }
    static getDefaults() {
        return Object.assign(ToneWithContext.getDefaults(), {
            interval: "4n",
            callback: noOp,
            playbackRate: 1,
            iterations: Infinity,
            probability: 1,
            mute: false,
            humanize: false
        });
    }
    /**
     * Start the loop at the specified time along the Transport's timeline.
     * @param  time  When to start the Loop.
     */
    start(time) {
        this._event.start(time);
        return this;
    }
    /**
     * Stop the loop at the given time.
     * @param  time  When to stop the Loop.
     */
    stop(time) {
        this._event.stop(time);
        return this;
    }
    /**
     * Cancel all scheduled events greater than or equal to the given time
     * @param  time  The time after which events will be cancel.
     */
    cancel(time) {
        this._event.cancel(time);
        return this;
    }
    /**
     * Internal function called when the notes should be called
     * @param time  The time the event occurs
     */
    _tick(time) {
        this.callback(time);
    }
    /**
     * The state of the Loop, either started or stopped.
     */
    get state() {
        return this._event.state;
    }
    /**
     * The progress of the loop as a value between 0-1. 0, when the loop is stopped or done iterating.
     */
    get progress() {
        return this._event.progress;
    }
    /**
     * The time between successive callbacks.
     * @example
     * const loop = new Tone.Loop();
     * loop.interval = "8n"; // loop every 8n
     */
    get interval() {
        return this._event.loopEnd;
    }
    set interval(interval) {
        this._event.loopEnd = interval;
    }
    /**
     * The playback rate of the loop. The normal playback rate is 1 (no change).
     * A `playbackRate` of 2 would be twice as fast.
     */
    get playbackRate() {
        return this._event.playbackRate;
    }
    set playbackRate(rate) {
        this._event.playbackRate = rate;
    }
    /**
     * Random variation +/-0.01s to the scheduled time.
     * Or give it a time value which it will randomize by.
     */
    get humanize() {
        return this._event.humanize;
    }
    set humanize(variation) {
        this._event.humanize = variation;
    }
    /**
     * The probably of the callback being invoked.
     */
    get probability() {
        return this._event.probability;
    }
    set probability(prob) {
        this._event.probability = prob;
    }
    /**
     * Muting the Loop means that no callbacks are invoked.
     */
    get mute() {
        return this._event.mute;
    }
    set mute(mute) {
        this._event.mute = mute;
    }
    /**
     * The number of iterations of the loop. The default value is `Infinity` (loop forever).
     */
    get iterations() {
        if (this._event.loop === true) {
            return Infinity;
        }
        else {
            return this._event.loop;
        }
    }
    set iterations(iters) {
        if (iters === Infinity) {
            this._event.loop = true;
        }
        else {
            this._event.loop = iters;
        }
    }
    dispose() {
        super.dispose();
        this._event.dispose();
        return this;
    }
}

/**
 * Part is a collection ToneEvents which can be started/stopped and looped as a single unit.
 *
 * @example
 * const synth = new Tone.Synth().toDestination();
 * const part = new Tone.Part(((time, note) => {
 * 	// the notes given as the second element in the array
 * 	// will be passed in as the second argument
 * 	synth.triggerAttackRelease(note, "8n", time);
 * }), [[0, "C2"], ["0:2", "C3"], ["0:3:2", "G2"]]);
 * Tone.Transport.start();
 * @example
 * const synth = new Tone.Synth().toDestination();
 * // use an array of objects as long as the object has a "time" attribute
 * const part = new Tone.Part(((time, value) => {
 * 	// the value is an object which contains both the note and the velocity
 * 	synth.triggerAttackRelease(value.note, "8n", time, value.velocity);
 * }), [{ time: 0, note: "C3", velocity: 0.9 },
 * 	{ time: "0:2", note: "C4", velocity: 0.5 }
 * ]).start(0);
 * Tone.Transport.start();
 * @category Event
 */
class Part extends ToneEvent {
    constructor() {
        super(optionsFromArguments(Part.getDefaults(), arguments, ["callback", "events"]));
        this.name = "Part";
        /**
         * Tracks the scheduled events
         */
        this._state = new StateTimeline("stopped");
        /**
         * The events that belong to this part
         */
        this._events = new Set();
        const options = optionsFromArguments(Part.getDefaults(), arguments, ["callback", "events"]);
        // make sure things are assigned in the right order
        this._state.increasing = true;
        // add the events
        options.events.forEach(event => {
            if (isArray(event)) {
                this.add(event[0], event[1]);
            }
            else {
                this.add(event);
            }
        });
    }
    static getDefaults() {
        return Object.assign(ToneEvent.getDefaults(), {
            events: [],
        });
    }
    /**
     * Start the part at the given time.
     * @param  time    When to start the part.
     * @param  offset  The offset from the start of the part to begin playing at.
     */
    start(time, offset) {
        const ticks = this.toTicks(time);
        if (this._state.getValueAtTime(ticks) !== "started") {
            offset = defaultArg(offset, this._loop ? this._loopStart : 0);
            if (this._loop) {
                offset = defaultArg(offset, this._loopStart);
            }
            else {
                offset = defaultArg(offset, 0);
            }
            const computedOffset = this.toTicks(offset);
            this._state.add({
                id: -1,
                offset: computedOffset,
                state: "started",
                time: ticks,
            });
            this._forEach(event => {
                this._startNote(event, ticks, computedOffset);
            });
        }
        return this;
    }
    /**
     * Start the event in the given event at the correct time given
     * the ticks and offset and looping.
     * @param  event
     * @param  ticks
     * @param  offset
     */
    _startNote(event, ticks, offset) {
        ticks -= offset;
        if (this._loop) {
            if (event.startOffset >= this._loopStart && event.startOffset < this._loopEnd) {
                if (event.startOffset < offset) {
                    // start it on the next loop
                    ticks += this._getLoopDuration();
                }
                event.start(new TicksClass(this.context, ticks));
            }
            else if (event.startOffset < this._loopStart && event.startOffset >= offset) {
                event.loop = false;
                event.start(new TicksClass(this.context, ticks));
            }
        }
        else if (event.startOffset >= offset) {
            event.start(new TicksClass(this.context, ticks));
        }
    }
    get startOffset() {
        return this._startOffset;
    }
    set startOffset(offset) {
        this._startOffset = offset;
        this._forEach(event => {
            event.startOffset += this._startOffset;
        });
    }
    /**
     * Stop the part at the given time.
     * @param  time  When to stop the part.
     */
    stop(time) {
        const ticks = this.toTicks(time);
        this._state.cancel(ticks);
        this._state.setStateAtTime("stopped", ticks);
        this._forEach(event => {
            event.stop(time);
        });
        return this;
    }
    /**
     * Get/Set an Event's value at the given time.
     * If a value is passed in and no event exists at
     * the given time, one will be created with that value.
     * If two events are at the same time, the first one will
     * be returned.
     * @example
     * const part = new Tone.Part();
     * part.at("1m"); // returns the part at the first measure
     * part.at("2m", "C2"); // set the value at "2m" to C2.
     * // if an event didn't exist at that time, it will be created.
     * @param time The time of the event to get or set.
     * @param value If a value is passed in, the value of the event at the given time will be set to it.
     */
    at(time, value) {
        const timeInTicks = new TransportTimeClass(this.context, time).toTicks();
        const tickTime = new TicksClass(this.context, 1).toSeconds();
        const iterator = this._events.values();
        let result = iterator.next();
        while (!result.done) {
            const event = result.value;
            if (Math.abs(timeInTicks - event.startOffset) < tickTime) {
                if (isDefined(value)) {
                    event.value = value;
                }
                return event;
            }
            result = iterator.next();
        }
        // if there was no event at that time, create one
        if (isDefined(value)) {
            this.add(time, value);
            // return the new event
            return this.at(time);
        }
        else {
            return null;
        }
    }
    add(time, value) {
        // extract the parameters
        if (time instanceof Object && Reflect.has(time, "time")) {
            value = time;
            time = value.time;
        }
        const ticks = this.toTicks(time);
        let event;
        if (value instanceof ToneEvent) {
            event = value;
            event.callback = this._tick.bind(this);
        }
        else {
            event = new ToneEvent({
                callback: this._tick.bind(this),
                context: this.context,
                value,
            });
        }
        // the start offset
        event.startOffset = ticks;
        // initialize the values
        event.set({
            humanize: this.humanize,
            loop: this.loop,
            loopEnd: this.loopEnd,
            loopStart: this.loopStart,
            playbackRate: this.playbackRate,
            probability: this.probability,
        });
        this._events.add(event);
        // start the note if it should be played right now
        this._restartEvent(event);
        return this;
    }
    /**
     * Restart the given event
     */
    _restartEvent(event) {
        this._state.forEach((stateEvent) => {
            if (stateEvent.state === "started") {
                this._startNote(event, stateEvent.time, stateEvent.offset);
            }
            else {
                // stop the note
                event.stop(new TicksClass(this.context, stateEvent.time));
            }
        });
    }
    remove(time, value) {
        // extract the parameters
        if (isObject(time) && time.hasOwnProperty("time")) {
            value = time;
            time = value.time;
        }
        time = this.toTicks(time);
        this._events.forEach(event => {
            if (event.startOffset === time) {
                if (isUndef(value) || (isDefined(value) && event.value === value)) {
                    this._events.delete(event);
                    event.dispose();
                }
            }
        });
        return this;
    }
    /**
     * Remove all of the notes from the group.
     */
    clear() {
        this._forEach(event => event.dispose());
        this._events.clear();
        return this;
    }
    /**
     * Cancel scheduled state change events: i.e. "start" and "stop".
     * @param after The time after which to cancel the scheduled events.
     */
    cancel(after) {
        this._forEach(event => event.cancel(after));
        this._state.cancel(this.toTicks(after));
        return this;
    }
    /**
     * Iterate over all of the events
     */
    _forEach(callback) {
        if (this._events) {
            this._events.forEach(event => {
                if (event instanceof Part) {
                    event._forEach(callback);
                }
                else {
                    callback(event);
                }
            });
        }
        return this;
    }
    /**
     * Set the attribute of all of the events
     * @param  attr  the attribute to set
     * @param  value      The value to set it to
     */
    _setAll(attr, value) {
        this._forEach(event => {
            event[attr] = value;
        });
    }
    /**
     * Internal tick method
     * @param  time  The time of the event in seconds
     */
    _tick(time, value) {
        if (!this.mute) {
            this.callback(time, value);
        }
    }
    /**
     * Determine if the event should be currently looping
     * given the loop boundries of this Part.
     * @param  event  The event to test
     */
    _testLoopBoundries(event) {
        if (this._loop && (event.startOffset < this._loopStart || event.startOffset >= this._loopEnd)) {
            event.cancel(0);
        }
        else if (event.state === "stopped") {
            // reschedule it if it's stopped
            this._restartEvent(event);
        }
    }
    get probability() {
        return this._probability;
    }
    set probability(prob) {
        this._probability = prob;
        this._setAll("probability", prob);
    }
    get humanize() {
        return this._humanize;
    }
    set humanize(variation) {
        this._humanize = variation;
        this._setAll("humanize", variation);
    }
    /**
     * If the part should loop or not
     * between Part.loopStart and
     * Part.loopEnd. If set to true,
     * the part will loop indefinitely,
     * if set to a number greater than 1
     * it will play a specific number of
     * times, if set to false, 0 or 1, the
     * part will only play once.
     * @example
     * const part = new Tone.Part();
     * // loop the part 8 times
     * part.loop = 8;
     */
    get loop() {
        return this._loop;
    }
    set loop(loop) {
        this._loop = loop;
        this._forEach(event => {
            event.loopStart = this.loopStart;
            event.loopEnd = this.loopEnd;
            event.loop = loop;
            this._testLoopBoundries(event);
        });
    }
    /**
     * The loopEnd point determines when it will
     * loop if Part.loop is true.
     */
    get loopEnd() {
        return new TicksClass(this.context, this._loopEnd).toSeconds();
    }
    set loopEnd(loopEnd) {
        this._loopEnd = this.toTicks(loopEnd);
        if (this._loop) {
            this._forEach(event => {
                event.loopEnd = loopEnd;
                this._testLoopBoundries(event);
            });
        }
    }
    /**
     * The loopStart point determines when it will
     * loop if Part.loop is true.
     */
    get loopStart() {
        return new TicksClass(this.context, this._loopStart).toSeconds();
    }
    set loopStart(loopStart) {
        this._loopStart = this.toTicks(loopStart);
        if (this._loop) {
            this._forEach(event => {
                event.loopStart = this.loopStart;
                this._testLoopBoundries(event);
            });
        }
    }
    /**
     * The playback rate of the part
     */
    get playbackRate() {
        return this._playbackRate;
    }
    set playbackRate(rate) {
        this._playbackRate = rate;
        this._setAll("playbackRate", rate);
    }
    /**
     * The number of scheduled notes in the part.
     */
    get length() {
        return this._events.size;
    }
    dispose() {
        super.dispose();
        this.clear();
        return this;
    }
}

/**
 * Start at the first value and go up to the last
 */
function* upPatternGen(values) {
    let index = 0;
    while (index < values.length) {
        index = clampToArraySize(index, values);
        yield values[index];
        index++;
    }
}
/**
 * Start at the last value and go down to 0
 */
function* downPatternGen(values) {
    let index = values.length - 1;
    while (index >= 0) {
        index = clampToArraySize(index, values);
        yield values[index];
        index--;
    }
}
/**
 * Infinitely yield the generator
 */
function* infiniteGen(values, gen) {
    while (true) {
        yield* gen(values);
    }
}
/**
 * Make sure that the index is in the given range
 */
function clampToArraySize(index, values) {
    return clamp(index, 0, values.length - 1);
}
/**
 * Alternate between two generators
 */
function* alternatingGenerator(values, directionUp) {
    let index = directionUp ? 0 : values.length - 1;
    while (true) {
        index = clampToArraySize(index, values);
        yield values[index];
        if (directionUp) {
            index++;
            if (index >= values.length - 1) {
                directionUp = false;
            }
        }
        else {
            index--;
            if (index <= 0) {
                directionUp = true;
            }
        }
    }
}
/**
 * Starting from the bottom move up 2, down 1
 */
function* jumpUp(values) {
    let index = 0;
    let stepIndex = 0;
    while (index < values.length) {
        index = clampToArraySize(index, values);
        yield values[index];
        stepIndex++;
        index += (stepIndex % 2 ? 2 : -1);
    }
}
/**
 * Starting from the top move down 2, up 1
 */
function* jumpDown(values) {
    let index = values.length - 1;
    let stepIndex = 0;
    while (index >= 0) {
        index = clampToArraySize(index, values);
        yield values[index];
        stepIndex++;
        index += (stepIndex % 2 ? -2 : 1);
    }
}
/**
 * Choose a random index each time
 */
function* randomGen(values) {
    while (true) {
        const randomIndex = Math.floor(Math.random() * values.length);
        yield values[randomIndex];
    }
}
/**
 * Randomly go through all of the values once before choosing a new random order
 */
function* randomOnce(values) {
    // create an array of indices
    const copy = [];
    for (let i = 0; i < values.length; i++) {
        copy.push(i);
    }
    while (copy.length > 0) {
        // random choose an index, and then remove it so it's not chosen again
        const randVal = copy.splice(Math.floor(copy.length * Math.random()), 1);
        const index = clampToArraySize(randVal[0], values);
        yield values[index];
    }
}
/**
 * Randomly choose to walk up or down 1 index in the values array
 */
function* randomWalk(values) {
    // randomly choose a starting index in the values array
    let index = Math.floor(Math.random() * values.length);
    while (true) {
        if (index === 0) {
            index++; // at bottom of array, so force upward step
        }
        else if (index === values.length - 1) {
            index--; // at top of array, so force downward step
        }
        else if (Math.random() < 0.5) { // else choose random downward or upward step
            index--;
        }
        else {
            index++;
        }
        yield values[index];
    }
}
/**
 * PatternGenerator returns a generator which will iterate over the given array
 * of values and yield the items according to the passed in pattern
 * @param values An array of values to iterate over
 * @param pattern The name of the pattern use when iterating over
 * @param index Where to start in the offset of the values array
 */
function* PatternGenerator(values, pattern = "up", index = 0) {
    // safeguards
    assert(values.length > 0, "The array must have more than one value in it");
    switch (pattern) {
        case "up":
            yield* infiniteGen(values, upPatternGen);
        case "down":
            yield* infiniteGen(values, downPatternGen);
        case "upDown":
            yield* alternatingGenerator(values, true);
        case "downUp":
            yield* alternatingGenerator(values, false);
        case "alternateUp":
            yield* infiniteGen(values, jumpUp);
        case "alternateDown":
            yield* infiniteGen(values, jumpDown);
        case "random":
            yield* randomGen(values);
        case "randomOnce":
            yield* infiniteGen(values, randomOnce);
        case "randomWalk":
            yield* randomWalk(values);
    }
}

/**
 * Pattern arpeggiates between the given notes
 * in a number of patterns.
 * @example
 * const pattern = new Tone.Pattern((time, note) => {
 * 	// the order of the notes passed in depends on the pattern
 * }, ["C2", "D4", "E5", "A6"], "upDown");
 * @category Event
 */
class Pattern extends Loop {
    constructor() {
        super(optionsFromArguments(Pattern.getDefaults(), arguments, ["callback", "values", "pattern"]));
        this.name = "Pattern";
        const options = optionsFromArguments(Pattern.getDefaults(), arguments, ["callback", "values", "pattern"]);
        this.callback = options.callback;
        this._values = options.values;
        this._pattern = PatternGenerator(options.values, options.pattern);
        this._type = options.pattern;
    }
    static getDefaults() {
        return Object.assign(Loop.getDefaults(), {
            pattern: "up",
            values: [],
            callback: noOp,
        });
    }
    /**
     * Internal function called when the notes should be called
     */
    _tick(time) {
        const value = this._pattern.next();
        this._value = value.value;
        this.callback(time, this._value);
    }
    /**
     * The array of events.
     */
    get values() {
        return this._values;
    }
    set values(val) {
        this._values = val;
        // reset the pattern
        this.pattern = this._type;
    }
    /**
     * The current value of the pattern.
     */
    get value() {
        return this._value;
    }
    /**
     * The pattern type. See Tone.CtrlPattern for the full list of patterns.
     */
    get pattern() {
        return this._type;
    }
    set pattern(pattern) {
        this._type = pattern;
        this._pattern = PatternGenerator(this._values, this._type);
    }
}

/**
 * A sequence is an alternate notation of a part. Instead
 * of passing in an array of [time, event] pairs, pass
 * in an array of events which will be spaced at the
 * given subdivision. Sub-arrays will subdivide that beat
 * by the number of items are in the array.
 * Sequence notation inspiration from [Tidal](http://yaxu.org/tidal/)
 * @example
 * const synth = new Tone.Synth().toDestination();
 * const seq = new Tone.Sequence((time, note) => {
 * 	synth.triggerAttackRelease(note, 0.1, time);
 * 	// subdivisions are given as subarrays
 * }, ["C4", ["E4", "D4", "E4"], "G4", ["A4", "G4"]]).start(0);
 * Tone.Transport.start();
 * @category Event
 */
class Sequence extends ToneEvent {
    constructor() {
        super(optionsFromArguments(Sequence.getDefaults(), arguments, ["callback", "events", "subdivision"]));
        this.name = "Sequence";
        /**
         * The object responsible for scheduling all of the events
         */
        this._part = new Part({
            callback: this._seqCallback.bind(this),
            context: this.context,
        });
        /**
         * private reference to all of the sequence proxies
         */
        this._events = [];
        /**
         * The proxied array
         */
        this._eventsArray = [];
        const options = optionsFromArguments(Sequence.getDefaults(), arguments, ["callback", "events", "subdivision"]);
        this._subdivision = this.toTicks(options.subdivision);
        this.events = options.events;
        // set all of the values
        this.loop = options.loop;
        this.loopStart = options.loopStart;
        this.loopEnd = options.loopEnd;
        this.playbackRate = options.playbackRate;
        this.probability = options.probability;
        this.humanize = options.humanize;
        this.mute = options.mute;
        this.playbackRate = options.playbackRate;
    }
    static getDefaults() {
        return Object.assign(omitFromObject(ToneEvent.getDefaults(), ["value"]), {
            events: [],
            loop: true,
            loopEnd: 0,
            loopStart: 0,
            subdivision: "8n",
        });
    }
    /**
     * The internal callback for when an event is invoked
     */
    _seqCallback(time, value) {
        if (value !== null) {
            this.callback(time, value);
        }
    }
    /**
     * The sequence
     */
    get events() {
        return this._events;
    }
    set events(s) {
        this.clear();
        this._eventsArray = s;
        this._events = this._createSequence(this._eventsArray);
        this._eventsUpdated();
    }
    /**
     * Start the part at the given time.
     * @param  time    When to start the part.
     * @param  offset  The offset index to start at
     */
    start(time, offset) {
        this._part.start(time, offset ? this._indexTime(offset) : offset);
        return this;
    }
    /**
     * Stop the part at the given time.
     * @param  time  When to stop the part.
     */
    stop(time) {
        this._part.stop(time);
        return this;
    }
    /**
     * The subdivision of the sequence. This can only be
     * set in the constructor. The subdivision is the
     * interval between successive steps.
     */
    get subdivision() {
        return new TicksClass(this.context, this._subdivision).toSeconds();
    }
    /**
     * Create a sequence proxy which can be monitored to create subsequences
     */
    _createSequence(array) {
        return new Proxy(array, {
            get: (target, property) => {
                // property is index in this case
                return target[property];
            },
            set: (target, property, value) => {
                if (isString(property) && isFinite(parseInt(property, 10))) {
                    if (isArray(value)) {
                        target[property] = this._createSequence(value);
                    }
                    else {
                        target[property] = value;
                    }
                }
                else {
                    target[property] = value;
                }
                this._eventsUpdated();
                // return true to accept the changes
                return true;
            },
        });
    }
    /**
     * When the sequence has changed, all of the events need to be recreated
     */
    _eventsUpdated() {
        this._part.clear();
        this._rescheduleSequence(this._eventsArray, this._subdivision, this.startOffset);
        // update the loopEnd
        this.loopEnd = this.loopEnd;
    }
    /**
     * reschedule all of the events that need to be rescheduled
     */
    _rescheduleSequence(sequence, subdivision, startOffset) {
        sequence.forEach((value, index) => {
            const eventOffset = index * (subdivision) + startOffset;
            if (isArray(value)) {
                this._rescheduleSequence(value, subdivision / value.length, eventOffset);
            }
            else {
                const startTime = new TicksClass(this.context, eventOffset, "i").toSeconds();
                this._part.add(startTime, value);
            }
        });
    }
    /**
     * Get the time of the index given the Sequence's subdivision
     * @param  index
     * @return The time of that index
     */
    _indexTime(index) {
        return new TicksClass(this.context, index * (this._subdivision) + this.startOffset).toSeconds();
    }
    /**
     * Clear all of the events
     */
    clear() {
        this._part.clear();
        return this;
    }
    dispose() {
        super.dispose();
        this._part.dispose();
        return this;
    }
    //-------------------------------------
    // PROXY CALLS
    //-------------------------------------
    get loop() {
        return this._part.loop;
    }
    set loop(l) {
        this._part.loop = l;
    }
    /**
     * The index at which the sequence should start looping
     */
    get loopStart() {
        return this._loopStart;
    }
    set loopStart(index) {
        this._loopStart = index;
        this._part.loopStart = this._indexTime(index);
    }
    /**
     * The index at which the sequence should end looping
     */
    get loopEnd() {
        return this._loopEnd;
    }
    set loopEnd(index) {
        this._loopEnd = index;
        if (index === 0) {
            this._part.loopEnd = this._indexTime(this._eventsArray.length);
        }
        else {
            this._part.loopEnd = this._indexTime(index);
        }
    }
    get startOffset() {
        return this._part.startOffset;
    }
    set startOffset(start) {
        this._part.startOffset = start;
    }
    get playbackRate() {
        return this._part.playbackRate;
    }
    set playbackRate(rate) {
        this._part.playbackRate = rate;
    }
    get probability() {
        return this._part.probability;
    }
    set probability(prob) {
        this._part.probability = prob;
    }
    get progress() {
        return this._part.progress;
    }
    get humanize() {
        return this._part.humanize;
    }
    set humanize(variation) {
        this._part.humanize = variation;
    }
    /**
     * The number of scheduled events
     */
    get length() {
        return this._part.length;
    }
}

/**
 * Tone.Crossfade provides equal power fading between two inputs.
 * More on crossfading technique [here](https://en.wikipedia.org/wiki/Fade_(audio_engineering)#Crossfading).
 * ```
 *                                             +---------+
 *                                            +> input a +>--+
 * +-----------+   +---------------------+     |         |   |
 * | 1s signal +>--> stereoPannerNode  L +>----> gain    |   |
 * +-----------+   |                     |     +---------+   |
 *               +-> pan               R +>-+                |   +--------+
 *               | +---------------------+  |                +---> output +>
 *  +------+     |                          |  +---------+   |   +--------+
 *  | fade +>----+                          | +> input b +>--+
 *  +------+                                |  |         |
 *                                          +--> gain    |
 *                                             +---------+
 * ```
 * @example
 * const crossFade = new Tone.CrossFade().toDestination();
 * // connect two inputs Tone.to a/b
 * const inputA = new Tone.Oscillator(440, "square").connect(crossFade.a).start();
 * const inputB = new Tone.Oscillator(440, "sine").connect(crossFade.b).start();
 * // use the fade to control the mix between the two
 * crossFade.fade.value = 0.5;
 * @category Component
 */
class CrossFade extends ToneAudioNode {
    constructor() {
        super(Object.assign(optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"])));
        this.name = "CrossFade";
        /**
         * The crossfading is done by a StereoPannerNode
         */
        this._panner = this.context.createStereoPanner();
        /**
         * Split the output of the panner node into two values used to control the gains.
         */
        this._split = this.context.createChannelSplitter(2);
        /**
         * Convert the fade value into an audio range value so it can be connected
         * to the panner.pan AudioParam
         */
        this._g2a = new GainToAudio({ context: this.context });
        /**
         * The input which is at full level when fade = 0
         */
        this.a = new Gain({
            context: this.context,
            gain: 0,
        });
        /**
         * The input which is at full level when fade = 1
         */
        this.b = new Gain({
            context: this.context,
            gain: 0,
        });
        /**
         * The output is a mix between `a` and `b` at the ratio of `fade`
         */
        this.output = new Gain({ context: this.context });
        this._internalChannels = [this.a, this.b];
        const options = optionsFromArguments(CrossFade.getDefaults(), arguments, ["fade"]);
        this.fade = new Signal({
            context: this.context,
            units: "normalRange",
            value: options.fade,
        });
        readOnly(this, "fade");
        this.context.getConstant(1).connect(this._panner);
        this._panner.connect(this._split);
        // this is necessary for standardized-audio-context
        // doesn't make any difference for the native AudioContext
        // https://github.com/chrisguttandin/standardized-audio-context/issues/647
        this._panner.channelCount = 1;
        this._panner.channelCountMode = "explicit";
        connect(this._split, this.a.gain, 0);
        connect(this._split, this.b.gain, 1);
        this.fade.chain(this._g2a, this._panner.pan);
        this.a.connect(this.output);
        this.b.connect(this.output);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            fade: 0.5,
        });
    }
    dispose() {
        super.dispose();
        this.a.dispose();
        this.b.dispose();
        this.output.dispose();
        this.fade.dispose();
        this._g2a.dispose();
        this._panner.disconnect();
        this._split.disconnect();
        return this;
    }
}

/**
 * Effect is the base class for effects. Connect the effect between
 * the effectSend and effectReturn GainNodes, then control the amount of
 * effect which goes to the output using the wet control.
 */
class Effect extends ToneAudioNode {
    constructor(options) {
        super(options);
        this.name = "Effect";
        /**
         * the drywet knob to control the amount of effect
         */
        this._dryWet = new CrossFade({ context: this.context });
        /**
         * The wet control is how much of the effected
         * will pass through to the output. 1 = 100% effected
         * signal, 0 = 100% dry signal.
         */
        this.wet = this._dryWet.fade;
        /**
         * connect the effectSend to the input of hte effect
         */
        this.effectSend = new Gain({ context: this.context });
        /**
         * connect the output of the effect to the effectReturn
         */
        this.effectReturn = new Gain({ context: this.context });
        /**
         * The effect input node
         */
        this.input = new Gain({ context: this.context });
        /**
         * The effect output
         */
        this.output = this._dryWet;
        // connections
        this.input.fan(this._dryWet.a, this.effectSend);
        this.effectReturn.connect(this._dryWet.b);
        this.wet.setValueAtTime(options.wet, 0);
        this._internalChannels = [this.effectReturn, this.effectSend];
        readOnly(this, "wet");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            wet: 1,
        });
    }
    /**
     * chains the effect in between the effectSend and effectReturn
     */
    connectEffect(effect) {
        // add it to the internal channels
        this._internalChannels.push(effect);
        this.effectSend.chain(effect, this.effectReturn);
        return this;
    }
    dispose() {
        super.dispose();
        this._dryWet.dispose();
        this.effectSend.dispose();
        this.effectReturn.dispose();
        this.wet.dispose();
        return this;
    }
}

/**
 * Base class for LFO-based effects.
 */
class LFOEffect extends Effect {
    constructor(options) {
        super(options);
        this.name = "LFOEffect";
        this._lfo = new LFO({
            context: this.context,
            frequency: options.frequency,
            amplitude: options.depth,
        });
        this.depth = this._lfo.amplitude;
        this.frequency = this._lfo.frequency;
        this.type = options.type;
        readOnly(this, ["frequency", "depth"]);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            frequency: 1,
            type: "sine",
            depth: 1,
        });
    }
    /**
     * Start the effect.
     */
    start(time) {
        this._lfo.start(time);
        return this;
    }
    /**
     * Stop the lfo
     */
    stop(time) {
        this._lfo.stop(time);
        return this;
    }
    /**
     * Sync the filter to the transport. See [[LFO.sync]]
     */
    sync() {
        this._lfo.sync();
        return this;
    }
    /**
     * Unsync the filter from the transport.
     */
    unsync() {
        this._lfo.unsync();
        return this;
    }
    /**
     * The type of the LFO's oscillator: See [[Oscillator.type]]
     * @example
     * const autoFilter = new Tone.AutoFilter().start().toDestination();
     * const noise = new Tone.Noise().start().connect(autoFilter);
     * autoFilter.type = "square";
     */
    get type() {
        return this._lfo.type;
    }
    set type(type) {
        this._lfo.type = type;
    }
    dispose() {
        super.dispose();
        this._lfo.dispose();
        this.frequency.dispose();
        this.depth.dispose();
        return this;
    }
}

/**
 * AutoFilter is a Tone.Filter with a Tone.LFO connected to the filter cutoff frequency.
 * Setting the LFO rate and depth allows for control over the filter modulation rate
 * and depth.
 *
 * @example
 * // create an autofilter and start it's LFO
 * const autoFilter = new Tone.AutoFilter("4n").toDestination().start();
 * // route an oscillator through the filter and start it
 * const oscillator = new Tone.Oscillator().connect(autoFilter).start();
 * @category Effect
 */
class AutoFilter extends LFOEffect {
    constructor() {
        super(optionsFromArguments(AutoFilter.getDefaults(), arguments, ["frequency", "baseFrequency", "octaves"]));
        this.name = "AutoFilter";
        const options = optionsFromArguments(AutoFilter.getDefaults(), arguments, ["frequency", "baseFrequency", "octaves"]);
        this.filter = new Filter(Object.assign(options.filter, {
            context: this.context,
        }));
        // connections
        this.connectEffect(this.filter);
        this._lfo.connect(this.filter.frequency);
        this.octaves = options.octaves;
        this.baseFrequency = options.baseFrequency;
    }
    static getDefaults() {
        return Object.assign(LFOEffect.getDefaults(), {
            baseFrequency: 200,
            octaves: 2.6,
            filter: {
                type: "lowpass",
                rolloff: -12,
                Q: 1,
            }
        });
    }
    /**
     * The minimum value of the filter's cutoff frequency.
     */
    get baseFrequency() {
        return this._lfo.min;
    }
    set baseFrequency(freq) {
        this._lfo.min = this.toFrequency(freq);
        // and set the max
        this.octaves = this._octaves;
    }
    /**
     * The maximum value of the filter's cutoff frequency.
     */
    get octaves() {
        return this._octaves;
    }
    set octaves(oct) {
        this._octaves = oct;
        this._lfo.max = this._lfo.min * Math.pow(2, oct);
    }
    dispose() {
        super.dispose();
        this.filter.dispose();
        return this;
    }
}

/**
 * AutoPanner is a [[Panner]] with an [[LFO]] connected to the pan amount.
 * [Related Reading](https://www.ableton.com/en/blog/autopan-chopper-effect-and-more-liveschool/).
 *
 * @example
 * // create an autopanner and start it
 * const autoPanner = new Tone.AutoPanner("4n").toDestination().start();
 * // route an oscillator through the panner and start it
 * const oscillator = new Tone.Oscillator().connect(autoPanner).start();
 * @category Effect
 */
class AutoPanner extends LFOEffect {
    constructor() {
        super(optionsFromArguments(AutoPanner.getDefaults(), arguments, ["frequency"]));
        this.name = "AutoPanner";
        const options = optionsFromArguments(AutoPanner.getDefaults(), arguments, ["frequency"]);
        this._panner = new Panner({
            context: this.context,
            channelCount: options.channelCount
        });
        // connections
        this.connectEffect(this._panner);
        this._lfo.connect(this._panner.pan);
        this._lfo.min = -1;
        this._lfo.max = 1;
    }
    static getDefaults() {
        return Object.assign(LFOEffect.getDefaults(), {
            channelCount: 1
        });
    }
    dispose() {
        super.dispose();
        this._panner.dispose();
        return this;
    }
}

/**
 * Follower is a simple envelope follower.
 * It's implemented by applying a lowpass filter to the absolute value of the incoming signal.
 * ```
 *          +-----+    +---------------+
 * Input +--> Abs +----> OnePoleFilter +--> Output
 *          +-----+    +---------------+
 * ```
 * @category Component
 */
class Follower extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Follower.getDefaults(), arguments, ["smoothing"]));
        this.name = "Follower";
        const options = optionsFromArguments(Follower.getDefaults(), arguments, ["smoothing"]);
        this._abs = this.input = new Abs({ context: this.context });
        this._lowpass = this.output = new OnePoleFilter({
            context: this.context,
            frequency: 1 / this.toSeconds(options.smoothing),
            type: "lowpass"
        });
        this._abs.connect(this._lowpass);
        this._smoothing = options.smoothing;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            smoothing: 0.05
        });
    }
    /**
     * The amount of time it takes a value change to arrive at the updated value.
     */
    get smoothing() {
        return this._smoothing;
    }
    set smoothing(smoothing) {
        this._smoothing = smoothing;
        this._lowpass.frequency = 1 / this.toSeconds(this.smoothing);
    }
    dispose() {
        super.dispose();
        this._abs.dispose();
        this._lowpass.dispose();
        return this;
    }
}

/**
 * AutoWah connects a [[Follower]] to a [[Filter]].
 * The frequency of the filter, follows the input amplitude curve.
 * Inspiration from [Tuna.js](https://github.com/Dinahmoe/tuna).
 *
 * @example
 * const autoWah = new Tone.AutoWah(50, 6, -30).toDestination();
 * // initialize the synth and connect to autowah
 * const synth = new Tone.Synth().connect(autoWah);
 * // Q value influences the effect of the wah - default is 2
 * autoWah.Q.value = 6;
 * // more audible on higher notes
 * synth.triggerAttackRelease("C4", "8n");
 * @category Effect
 */
class AutoWah extends Effect {
    constructor() {
        super(optionsFromArguments(AutoWah.getDefaults(), arguments, ["baseFrequency", "octaves", "sensitivity"]));
        this.name = "AutoWah";
        const options = optionsFromArguments(AutoWah.getDefaults(), arguments, ["baseFrequency", "octaves", "sensitivity"]);
        this._follower = new Follower({
            context: this.context,
            smoothing: options.follower,
        });
        this._sweepRange = new ScaleExp({
            context: this.context,
            min: 0,
            max: 1,
            exponent: 0.5,
        });
        this._baseFrequency = this.toFrequency(options.baseFrequency);
        this._octaves = options.octaves;
        this._inputBoost = new Gain({ context: this.context });
        this._bandpass = new Filter({
            context: this.context,
            rolloff: -48,
            frequency: 0,
            Q: options.Q,
        });
        this._peaking = new Filter({
            context: this.context,
            type: "peaking"
        });
        this._peaking.gain.value = options.gain;
        this.gain = this._peaking.gain;
        this.Q = this._bandpass.Q;
        // the control signal path
        this.effectSend.chain(this._inputBoost, this._follower, this._sweepRange);
        this._sweepRange.connect(this._bandpass.frequency);
        this._sweepRange.connect(this._peaking.frequency);
        // the filtered path
        this.effectSend.chain(this._bandpass, this._peaking, this.effectReturn);
        // set the initial value
        this._setSweepRange();
        this.sensitivity = options.sensitivity;
        readOnly(this, ["gain", "Q"]);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            baseFrequency: 100,
            octaves: 6,
            sensitivity: 0,
            Q: 2,
            gain: 2,
            follower: 0.2,
        });
    }
    /**
     * The number of octaves that the filter will sweep above the baseFrequency.
     */
    get octaves() {
        return this._octaves;
    }
    set octaves(octaves) {
        this._octaves = octaves;
        this._setSweepRange();
    }
    /**
     * The follower's smoothing time
     */
    get follower() {
        return this._follower.smoothing;
    }
    set follower(follower) {
        this._follower.smoothing = follower;
    }
    /**
     * The base frequency from which the sweep will start from.
     */
    get baseFrequency() {
        return this._baseFrequency;
    }
    set baseFrequency(baseFreq) {
        this._baseFrequency = this.toFrequency(baseFreq);
        this._setSweepRange();
    }
    /**
     * The sensitivity to control how responsive to the input signal the filter is.
     */
    get sensitivity() {
        return gainToDb(1 / this._inputBoost.gain.value);
    }
    set sensitivity(sensitivity) {
        this._inputBoost.gain.value = 1 / dbToGain(sensitivity);
    }
    /**
     * sets the sweep range of the scaler
     */
    _setSweepRange() {
        this._sweepRange.min = this._baseFrequency;
        this._sweepRange.max = Math.min(this._baseFrequency * Math.pow(2, this._octaves), this.context.sampleRate / 2);
    }
    dispose() {
        super.dispose();
        this._follower.dispose();
        this._sweepRange.dispose();
        this._bandpass.dispose();
        this._peaking.dispose();
        this._inputBoost.dispose();
        return this;
    }
}

/**
 * BitCrusher down-samples the incoming signal to a different bit depth.
 * Lowering the bit depth of the signal creates distortion. Read more about BitCrushing
 * on [Wikipedia](https://en.wikipedia.org/wiki/Bitcrusher).
 * @example
 * // initialize crusher and route a synth through it
 * const crusher = new Tone.BitCrusher(4).toDestination();
 * const synth = new Tone.Synth().connect(crusher);
 * synth.triggerAttackRelease("C2", 2);
 *
 * @category Effect
 */
class BitCrusher extends Effect {
    constructor() {
        super(optionsFromArguments(BitCrusher.getDefaults(), arguments, ["bits"]));
        this.name = "BitCrusher";
        const options = optionsFromArguments(BitCrusher.getDefaults(), arguments, ["bits"]);
        this._bitCrusherWorklet = new BitCrusherWorklet({
            context: this.context,
            bits: options.bits,
        });
        // connect it up
        this.connectEffect(this._bitCrusherWorklet);
        this.bits = this._bitCrusherWorklet.bits;
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            bits: 4,
        });
    }
    dispose() {
        super.dispose();
        this._bitCrusherWorklet.dispose();
        return this;
    }
}
/**
 * Internal class which creates an AudioWorklet to do the bit crushing
 */
class BitCrusherWorklet extends ToneAudioWorklet {
    constructor() {
        super(optionsFromArguments(BitCrusherWorklet.getDefaults(), arguments));
        this.name = "BitCrusherWorklet";
        const options = optionsFromArguments(BitCrusherWorklet.getDefaults(), arguments);
        this.input = new Gain({ context: this.context });
        this.output = new Gain({ context: this.context });
        this.bits = new Param({
            context: this.context,
            value: options.bits,
            units: "positive",
            minValue: 1,
            maxValue: 16,
            param: this._dummyParam,
            swappable: true,
        });
    }
    static getDefaults() {
        return Object.assign(ToneAudioWorklet.getDefaults(), {
            bits: 12,
        });
    }
    _audioWorkletName() {
        return workletName$1;
    }
    onReady(node) {
        connectSeries(this.input, node, this.output);
        const bits = node.parameters.get("bits");
        this.bits.setParam(bits);
    }
    dispose() {
        super.dispose();
        this.input.dispose();
        this.output.dispose();
        this.bits.dispose();
        return this;
    }
}

/**
 * Chebyshev is a waveshaper which is good
 * for making different types of distortion sounds.
 * Note that odd orders sound very different from even ones,
 * and order = 1 is no change.
 * Read more at [music.columbia.edu](http://music.columbia.edu/cmc/musicandcomputers/chapter4/04_06.php).
 * @example
 * // create a new cheby
 * const cheby = new Tone.Chebyshev(50).toDestination();
 * // create a monosynth connected to our cheby
 * const synth = new Tone.MonoSynth().connect(cheby);
 * synth.triggerAttackRelease("C2", 0.4);
 * @category Effect
 */
class Chebyshev extends Effect {
    constructor() {
        super(optionsFromArguments(Chebyshev.getDefaults(), arguments, ["order"]));
        this.name = "Chebyshev";
        const options = optionsFromArguments(Chebyshev.getDefaults(), arguments, ["order"]);
        this._shaper = new WaveShaper({
            context: this.context,
            length: 4096
        });
        this._order = options.order;
        this.connectEffect(this._shaper);
        this.order = options.order;
        this.oversample = options.oversample;
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            order: 1,
            oversample: "none"
        });
    }
    /**
     * get the coefficient for that degree
     * @param  x the x value
     * @param  degree
     * @param  memo memoize the computed value. this speeds up computation greatly.
     */
    _getCoefficient(x, degree, memo) {
        if (memo.has(degree)) {
            return memo.get(degree);
        }
        else if (degree === 0) {
            memo.set(degree, 0);
        }
        else if (degree === 1) {
            memo.set(degree, x);
        }
        else {
            memo.set(degree, 2 * x * this._getCoefficient(x, degree - 1, memo) - this._getCoefficient(x, degree - 2, memo));
        }
        return memo.get(degree);
    }
    /**
     * The order of the Chebyshev polynomial which creates the equation which is applied to the incoming
     * signal through a Tone.WaveShaper. The equations are in the form:
     * ```
     * order 2: 2x^2 + 1
     * order 3: 4x^3 + 3x
     * ```
     * @min 1
     * @max 100
     */
    get order() {
        return this._order;
    }
    set order(order) {
        this._order = order;
        this._shaper.setMap((x => {
            return this._getCoefficient(x, order, new Map());
        }));
    }
    /**
     * The oversampling of the effect. Can either be "none", "2x" or "4x".
     */
    get oversample() {
        return this._shaper.oversample;
    }
    set oversample(oversampling) {
        this._shaper.oversample = oversampling;
    }
    dispose() {
        super.dispose();
        this._shaper.dispose();
        return this;
    }
}

/**
 * Split splits an incoming signal into the number of given channels.
 *
 * @example
 * const split = new Tone.Split();
 * // stereoSignal.connect(split);
 * @category Component
 */
class Split extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Split.getDefaults(), arguments, ["channels"]));
        this.name = "Split";
        const options = optionsFromArguments(Split.getDefaults(), arguments, ["channels"]);
        this._splitter = this.input = this.output = this.context.createChannelSplitter(options.channels);
        this._internalChannels = [this._splitter];
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            channels: 2,
        });
    }
    dispose() {
        super.dispose();
        this._splitter.disconnect();
        return this;
    }
}

/**
 * Merge brings multiple mono input channels into a single multichannel output channel.
 *
 * @example
 * const merge = new Tone.Merge().toDestination();
 * // routing a sine tone in the left channel
 * const osc = new Tone.Oscillator().connect(merge, 0, 0).start();
 * // and noise in the right channel
 * const noise = new Tone.Noise().connect(merge, 0, 1).start();;
 * @category Component
 */
class Merge extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Merge.getDefaults(), arguments, ["channels"]));
        this.name = "Merge";
        const options = optionsFromArguments(Merge.getDefaults(), arguments, ["channels"]);
        this._merger = this.output = this.input = this.context.createChannelMerger(options.channels);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            channels: 2,
        });
    }
    dispose() {
        super.dispose();
        this._merger.disconnect();
        return this;
    }
}

/**
 * Base class for Stereo effects.
 */
class StereoEffect extends ToneAudioNode {
    constructor(options) {
        super(options);
        this.name = "StereoEffect";
        this.input = new Gain({ context: this.context });
        // force mono sources to be stereo
        this.input.channelCount = 2;
        this.input.channelCountMode = "explicit";
        this._dryWet = this.output = new CrossFade({
            context: this.context,
            fade: options.wet
        });
        this.wet = this._dryWet.fade;
        this._split = new Split({ context: this.context, channels: 2 });
        this._merge = new Merge({ context: this.context, channels: 2 });
        // connections
        this.input.connect(this._split);
        // dry wet connections
        this.input.connect(this._dryWet.a);
        this._merge.connect(this._dryWet.b);
        readOnly(this, ["wet"]);
    }
    /**
     * Connect the left part of the effect
     */
    connectEffectLeft(...nodes) {
        this._split.connect(nodes[0], 0, 0);
        connectSeries(...nodes);
        connect(nodes[nodes.length - 1], this._merge, 0, 0);
    }
    /**
     * Connect the right part of the effect
     */
    connectEffectRight(...nodes) {
        this._split.connect(nodes[0], 1, 0);
        connectSeries(...nodes);
        connect(nodes[nodes.length - 1], this._merge, 0, 1);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            wet: 1,
        });
    }
    dispose() {
        super.dispose();
        this._dryWet.dispose();
        this._split.dispose();
        this._merge.dispose();
        return this;
    }
}

/**
 * Base class for stereo feedback effects where the effectReturn is fed back into the same channel.
 */
class StereoFeedbackEffect extends StereoEffect {
    constructor(options) {
        super(options);
        this.feedback = new Signal({
            context: this.context,
            value: options.feedback,
            units: "normalRange"
        });
        this._feedbackL = new Gain({ context: this.context });
        this._feedbackR = new Gain({ context: this.context });
        this._feedbackSplit = new Split({ context: this.context, channels: 2 });
        this._feedbackMerge = new Merge({ context: this.context, channels: 2 });
        this._merge.connect(this._feedbackSplit);
        this._feedbackMerge.connect(this._split);
        // the left output connected to the left input
        this._feedbackSplit.connect(this._feedbackL, 0, 0);
        this._feedbackL.connect(this._feedbackMerge, 0, 0);
        // the right output connected to the right input
        this._feedbackSplit.connect(this._feedbackR, 1, 0);
        this._feedbackR.connect(this._feedbackMerge, 0, 1);
        // the feedback control
        this.feedback.fan(this._feedbackL.gain, this._feedbackR.gain);
        readOnly(this, ["feedback"]);
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            feedback: 0.5,
        });
    }
    dispose() {
        super.dispose();
        this.feedback.dispose();
        this._feedbackL.dispose();
        this._feedbackR.dispose();
        this._feedbackSplit.dispose();
        this._feedbackMerge.dispose();
        return this;
    }
}

/**
 * Chorus is a stereo chorus effect composed of a left and right delay with an [[LFO]] applied to the delayTime of each channel.
 * When [[feedback]] is set to a value larger than 0, you also get Flanger-type effects.
 * Inspiration from [Tuna.js](https://github.com/Dinahmoe/tuna/blob/master/tuna.js).
 * Read more on the chorus effect on [SoundOnSound](http://www.soundonsound.com/sos/jun04/articles/synthsecrets.htm).
 *
 * @example
 * const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start();
 * const synth = new Tone.PolySynth().connect(chorus);
 * synth.triggerAttackRelease(["C3", "E3", "G3"], "8n");
 *
 * @category Effect
 */
class Chorus extends StereoFeedbackEffect {
    constructor() {
        super(optionsFromArguments(Chorus.getDefaults(), arguments, ["frequency", "delayTime", "depth"]));
        this.name = "Chorus";
        const options = optionsFromArguments(Chorus.getDefaults(), arguments, ["frequency", "delayTime", "depth"]);
        this._depth = options.depth;
        this._delayTime = options.delayTime / 1000;
        this._lfoL = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: 0,
            max: 1,
        });
        this._lfoR = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: 0,
            max: 1,
            phase: 180
        });
        this._delayNodeL = new Delay({ context: this.context });
        this._delayNodeR = new Delay({ context: this.context });
        this.frequency = this._lfoL.frequency;
        readOnly(this, ["frequency"]);
        // have one LFO frequency control the other
        this._lfoL.frequency.connect(this._lfoR.frequency);
        // connections
        this.connectEffectLeft(this._delayNodeL);
        this.connectEffectRight(this._delayNodeR);
        // lfo setup
        this._lfoL.connect(this._delayNodeL.delayTime);
        this._lfoR.connect(this._delayNodeR.delayTime);
        // set the initial values
        this.depth = this._depth;
        this.type = options.type;
        this.spread = options.spread;
    }
    static getDefaults() {
        return Object.assign(StereoFeedbackEffect.getDefaults(), {
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.7,
            type: "sine",
            spread: 180,
            feedback: 0,
            wet: 0.5,
        });
    }
    /**
     * The depth of the effect. A depth of 1 makes the delayTime
     * modulate between 0 and 2*delayTime (centered around the delayTime).
     */
    get depth() {
        return this._depth;
    }
    set depth(depth) {
        this._depth = depth;
        const deviation = this._delayTime * depth;
        this._lfoL.min = Math.max(this._delayTime - deviation, 0);
        this._lfoL.max = this._delayTime + deviation;
        this._lfoR.min = Math.max(this._delayTime - deviation, 0);
        this._lfoR.max = this._delayTime + deviation;
    }
    /**
     * The delayTime in milliseconds of the chorus. A larger delayTime
     * will give a more pronounced effect. Nominal range a delayTime
     * is between 2 and 20ms.
     */
    get delayTime() {
        return this._delayTime * 1000;
    }
    set delayTime(delayTime) {
        this._delayTime = delayTime / 1000;
        this.depth = this._depth;
    }
    /**
     * The oscillator type of the LFO.
     */
    get type() {
        return this._lfoL.type;
    }
    set type(type) {
        this._lfoL.type = type;
        this._lfoR.type = type;
    }
    /**
     * Amount of stereo spread. When set to 0, both LFO's will be panned centrally.
     * When set to 180, LFO's will be panned hard left and right respectively.
     */
    get spread() {
        return this._lfoR.phase - this._lfoL.phase;
    }
    set spread(spread) {
        this._lfoL.phase = 90 - (spread / 2);
        this._lfoR.phase = (spread / 2) + 90;
    }
    /**
     * Start the effect.
     */
    start(time) {
        this._lfoL.start(time);
        this._lfoR.start(time);
        return this;
    }
    /**
     * Stop the lfo
     */
    stop(time) {
        this._lfoL.stop(time);
        this._lfoR.stop(time);
        return this;
    }
    /**
     * Sync the filter to the transport. See [[LFO.sync]]
     */
    sync() {
        this._lfoL.sync();
        this._lfoR.sync();
        return this;
    }
    /**
     * Unsync the filter from the transport.
     */
    unsync() {
        this._lfoL.unsync();
        this._lfoR.unsync();
        return this;
    }
    dispose() {
        super.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        this._delayNodeL.dispose();
        this._delayNodeR.dispose();
        this.frequency.dispose();
        return this;
    }
}

/**
 * A simple distortion effect using Tone.WaveShaper.
 * Algorithm from [this stackoverflow answer](http://stackoverflow.com/a/22313408).
 *
 * @example
 * const dist = new Tone.Distortion(0.8).toDestination();
 * const fm = new Tone.FMSynth().connect(dist);
 * fm.triggerAttackRelease("A1", "8n");
 * @category Effect
 */
class Distortion extends Effect {
    constructor() {
        super(optionsFromArguments(Distortion.getDefaults(), arguments, ["distortion"]));
        this.name = "Distortion";
        const options = optionsFromArguments(Distortion.getDefaults(), arguments, ["distortion"]);
        this._shaper = new WaveShaper({
            context: this.context,
            length: 4096,
        });
        this._distortion = options.distortion;
        this.connectEffect(this._shaper);
        this.distortion = options.distortion;
        this.oversample = options.oversample;
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            distortion: 0.4,
            oversample: "none",
        });
    }
    /**
     * The amount of distortion. Nominal range is between 0 and 1.
     */
    get distortion() {
        return this._distortion;
    }
    set distortion(amount) {
        this._distortion = amount;
        const k = amount * 100;
        const deg = Math.PI / 180;
        this._shaper.setMap((x) => {
            if (Math.abs(x) < 0.001) {
                // should output 0 when input is 0
                return 0;
            }
            else {
                return (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
            }
        });
    }
    /**
     * The oversampling of the effect. Can either be "none", "2x" or "4x".
     */
    get oversample() {
        return this._shaper.oversample;
    }
    set oversample(oversampling) {
        this._shaper.oversample = oversampling;
    }
    dispose() {
        super.dispose();
        this._shaper.dispose();
        return this;
    }
}

/**
 * FeedbackEffect provides a loop between an audio source and its own output.
 * This is a base-class for feedback effects.
 */
class FeedbackEffect extends Effect {
    constructor(options) {
        super(options);
        this.name = "FeedbackEffect";
        this._feedbackGain = new Gain({
            context: this.context,
            gain: options.feedback,
            units: "normalRange",
        });
        this.feedback = this._feedbackGain.gain;
        readOnly(this, "feedback");
        // the feedback loop
        this.effectReturn.chain(this._feedbackGain, this.effectSend);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            feedback: 0.125,
        });
    }
    dispose() {
        super.dispose();
        this._feedbackGain.dispose();
        this.feedback.dispose();
        return this;
    }
}

/**
 * FeedbackDelay is a DelayNode in which part of output signal is fed back into the delay.
 *
 * @param delayTime The delay applied to the incoming signal.
 * @param feedback The amount of the effected signal which is fed back through the delay.
 * @example
 * const feedbackDelay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
 * const tom = new Tone.MembraneSynth({
 * 	octaves: 4,
 * 	pitchDecay: 0.1
 * }).connect(feedbackDelay);
 * tom.triggerAttackRelease("A2", "32n");
 * @category Effect
 */
class FeedbackDelay extends FeedbackEffect {
    constructor() {
        super(optionsFromArguments(FeedbackDelay.getDefaults(), arguments, ["delayTime", "feedback"]));
        this.name = "FeedbackDelay";
        const options = optionsFromArguments(FeedbackDelay.getDefaults(), arguments, ["delayTime", "feedback"]);
        this._delayNode = new Delay({
            context: this.context,
            delayTime: options.delayTime,
            maxDelay: options.maxDelay,
        });
        this.delayTime = this._delayNode.delayTime;
        // connect it up
        this.connectEffect(this._delayNode);
        readOnly(this, "delayTime");
    }
    static getDefaults() {
        return Object.assign(FeedbackEffect.getDefaults(), {
            delayTime: 0.25,
            maxDelay: 1,
        });
    }
    dispose() {
        super.dispose();
        this._delayNode.dispose();
        this.delayTime.dispose();
        return this;
    }
}

/**
 * PhaseShiftAllpass is an very efficient implementation of a Hilbert Transform
 * using two Allpass filter banks whose outputs have a phase difference of 90°.
 * Here the `offset90` phase is offset by +90° in relation to `output`.
 * Coefficients and structure was developed by Olli Niemitalo.
 * For more details see: http://yehar.com/blog/?p=368
 * @category Component
 */
class PhaseShiftAllpass extends ToneAudioNode {
    constructor(options) {
        super(options);
        this.name = "PhaseShiftAllpass";
        this.input = new Gain({ context: this.context });
        /**
         * The phase shifted output
         */
        this.output = new Gain({ context: this.context });
        /**
         * The PhaseShifted allpass output
         */
        this.offset90 = new Gain({ context: this.context });
        const allpassBank1Values = [0.6923878, 0.9360654322959, 0.9882295226860, 0.9987488452737];
        const allpassBank2Values = [0.4021921162426, 0.8561710882420, 0.9722909545651, 0.9952884791278];
        this._bank0 = this._createAllPassFilterBank(allpassBank1Values);
        this._bank1 = this._createAllPassFilterBank(allpassBank2Values);
        this._oneSampleDelay = this.context.createIIRFilter([0.0, 1.0], [1.0, 0.0]);
        // connect Allpass filter banks
        connectSeries(this.input, ...this._bank0, this._oneSampleDelay, this.output);
        connectSeries(this.input, ...this._bank1, this.offset90);
    }
    /**
     * Create all of the IIR filters from an array of values using the coefficient calculation.
     */
    _createAllPassFilterBank(bankValues) {
        const nodes = bankValues.map(value => {
            const coefficients = [[value * value, 0, -1], [1, 0, -(value * value)]];
            return this.context.createIIRFilter(coefficients[0], coefficients[1]);
        });
        return nodes;
    }
    dispose() {
        super.dispose();
        this.input.dispose();
        this.output.dispose();
        this.offset90.dispose();
        this._bank0.forEach(f => f.disconnect());
        this._bank1.forEach(f => f.disconnect());
        this._oneSampleDelay.disconnect();
        return this;
    }
}

/**
 * FrequencyShifter can be used to shift all frequencies of a signal by a fixed amount.
 * The amount can be changed at audio rate and the effect is applied in real time.
 * The frequency shifting is implemented with a technique called single side band modulation using a ring modulator.
 * Note: Contrary to pitch shifting, all frequencies are shifted by the same amount,
 * destroying the harmonic relationship between them. This leads to the classic ring modulator timbre distortion.
 * The algorithm will produces some aliasing towards the high end, especially if your source material
 * contains a lot of high frequencies. Unfortunatelly the webaudio API does not support resampling
 * buffers in real time, so it is not possible to fix it properly. Depending on the use case it might
 * be an option to low pass filter your input before frequency shifting it to get ride of the aliasing.
 * You can find a very detailed description of the algorithm here: https://larzeitlin.github.io/RMFS/
 *
 * @example
 * const input = new Tone.Oscillator(230, "sawtooth").start();
 * const shift = new Tone.FrequencyShifter(42).toDestination();
 * input.connect(shift);
 * @category Effect
 */
class FrequencyShifter extends Effect {
    constructor() {
        super(optionsFromArguments(FrequencyShifter.getDefaults(), arguments, ["frequency"]));
        this.name = "FrequencyShifter";
        const options = optionsFromArguments(FrequencyShifter.getDefaults(), arguments, ["frequency"]);
        this.frequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.frequency,
            minValue: -this.context.sampleRate / 2,
            maxValue: this.context.sampleRate / 2,
        });
        this._sine = new ToneOscillatorNode({
            context: this.context,
            type: "sine",
        });
        this._cosine = new Oscillator({
            context: this.context,
            phase: -90,
            type: "sine",
        });
        this._sineMultiply = new Multiply({ context: this.context });
        this._cosineMultiply = new Multiply({ context: this.context });
        this._negate = new Negate({ context: this.context });
        this._add = new Add({ context: this.context });
        this._phaseShifter = new PhaseShiftAllpass({ context: this.context });
        this.effectSend.connect(this._phaseShifter);
        // connect the carrier frequency signal to the two oscillators
        this.frequency.fan(this._sine.frequency, this._cosine.frequency);
        this._phaseShifter.offset90.connect(this._cosineMultiply);
        this._cosine.connect(this._cosineMultiply.factor);
        this._phaseShifter.connect(this._sineMultiply);
        this._sine.connect(this._sineMultiply.factor);
        this._sineMultiply.connect(this._negate);
        this._cosineMultiply.connect(this._add);
        this._negate.connect(this._add.addend);
        this._add.connect(this.effectReturn);
        // start the oscillators at the same time
        const now = this.immediate();
        this._sine.start(now);
        this._cosine.start(now);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            frequency: 0,
        });
    }
    dispose() {
        super.dispose();
        this.frequency.dispose();
        this._add.dispose();
        this._cosine.dispose();
        this._cosineMultiply.dispose();
        this._negate.dispose();
        this._phaseShifter.dispose();
        this._sine.dispose();
        this._sineMultiply.dispose();
        return this;
    }
}

/**
 * An array of comb filter delay values from Freeverb implementation
 */
const combFilterTunings = [1557 / 44100, 1617 / 44100, 1491 / 44100, 1422 / 44100, 1277 / 44100, 1356 / 44100, 1188 / 44100, 1116 / 44100];
/**
 * An array of allpass filter frequency values from Freeverb implementation
 */
const allpassFilterFrequencies = [225, 556, 441, 341];
/**
 * Freeverb is a reverb based on [Freeverb](https://ccrma.stanford.edu/~jos/pasp/Freeverb.html).
 * Read more on reverb on [Sound On Sound](https://web.archive.org/web/20160404083902/http://www.soundonsound.com:80/sos/feb01/articles/synthsecrets.asp).
 * Freeverb is now implemented with an AudioWorkletNode which may result on performance degradation on some platforms. Consider using [[Reverb]].
 * @example
 * const freeverb = new Tone.Freeverb().toDestination();
 * freeverb.dampening = 1000;
 * // routing synth through the reverb
 * const synth = new Tone.NoiseSynth().connect(freeverb);
 * synth.triggerAttackRelease(0.05);
 * @category Effect
 */
class Freeverb extends StereoEffect {
    constructor() {
        super(optionsFromArguments(Freeverb.getDefaults(), arguments, ["roomSize", "dampening"]));
        this.name = "Freeverb";
        /**
         * the comb filters
         */
        this._combFilters = [];
        /**
         * the allpass filters on the left
         */
        this._allpassFiltersL = [];
        /**
         * the allpass filters on the right
         */
        this._allpassFiltersR = [];
        const options = optionsFromArguments(Freeverb.getDefaults(), arguments, ["roomSize", "dampening"]);
        this.roomSize = new Signal({
            context: this.context,
            value: options.roomSize,
            units: "normalRange",
        });
        // make the allpass filters on the right
        this._allpassFiltersL = allpassFilterFrequencies.map(freq => {
            const allpassL = this.context.createBiquadFilter();
            allpassL.type = "allpass";
            allpassL.frequency.value = freq;
            return allpassL;
        });
        // make the allpass filters on the left
        this._allpassFiltersR = allpassFilterFrequencies.map(freq => {
            const allpassR = this.context.createBiquadFilter();
            allpassR.type = "allpass";
            allpassR.frequency.value = freq;
            return allpassR;
        });
        // make the comb filters
        this._combFilters = combFilterTunings.map((delayTime, index) => {
            const lfpf = new LowpassCombFilter({
                context: this.context,
                dampening: options.dampening,
                delayTime,
            });
            if (index < combFilterTunings.length / 2) {
                this.connectEffectLeft(lfpf, ...this._allpassFiltersL);
            }
            else {
                this.connectEffectRight(lfpf, ...this._allpassFiltersR);
            }
            this.roomSize.connect(lfpf.resonance);
            return lfpf;
        });
        readOnly(this, ["roomSize"]);
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            roomSize: 0.7,
            dampening: 3000
        });
    }
    /**
     * The amount of dampening of the reverberant signal.
     */
    get dampening() {
        return this._combFilters[0].dampening;
    }
    set dampening(d) {
        this._combFilters.forEach(c => c.dampening = d);
    }
    dispose() {
        super.dispose();
        this._allpassFiltersL.forEach(al => al.disconnect());
        this._allpassFiltersR.forEach(ar => ar.disconnect());
        this._combFilters.forEach(cf => cf.dispose());
        this.roomSize.dispose();
        return this;
    }
}

/**
 * an array of the comb filter delay time values
 */
const combFilterDelayTimes = [1687 / 25000, 1601 / 25000, 2053 / 25000, 2251 / 25000];
/**
 * the resonances of each of the comb filters
 */
const combFilterResonances = [0.773, 0.802, 0.753, 0.733];
/**
 * the allpass filter frequencies
 */
const allpassFilterFreqs = [347, 113, 37];
/**
 * JCReverb is a simple [Schroeder Reverberator](https://ccrma.stanford.edu/~jos/pasp/Schroeder_Reverberators.html)
 * tuned by John Chowning in 1970.
 * It is made up of three allpass filters and four [[FeedbackCombFilter]].
 * JCReverb is now implemented with an AudioWorkletNode which may result on performance degradation on some platforms. Consider using [[Reverb]].
 * @example
 * const reverb = new Tone.JCReverb(0.4).toDestination();
 * const delay = new Tone.FeedbackDelay(0.5);
 * // connecting the synth to reverb through delay
 * const synth = new Tone.DuoSynth().chain(delay, reverb);
 * synth.triggerAttackRelease("A4", "8n");
 *
 * @category Effect
 */
class JCReverb extends StereoEffect {
    constructor() {
        super(optionsFromArguments(JCReverb.getDefaults(), arguments, ["roomSize"]));
        this.name = "JCReverb";
        /**
         * a series of allpass filters
         */
        this._allpassFilters = [];
        /**
         * parallel feedback comb filters
         */
        this._feedbackCombFilters = [];
        const options = optionsFromArguments(JCReverb.getDefaults(), arguments, ["roomSize"]);
        this.roomSize = new Signal({
            context: this.context,
            value: options.roomSize,
            units: "normalRange",
        });
        this._scaleRoomSize = new Scale({
            context: this.context,
            min: -0.733,
            max: 0.197,
        });
        // make the allpass filters
        this._allpassFilters = allpassFilterFreqs.map(freq => {
            const allpass = this.context.createBiquadFilter();
            allpass.type = "allpass";
            allpass.frequency.value = freq;
            return allpass;
        });
        // and the comb filters
        this._feedbackCombFilters = combFilterDelayTimes.map((delayTime, index) => {
            const fbcf = new FeedbackCombFilter({
                context: this.context,
                delayTime,
            });
            this._scaleRoomSize.connect(fbcf.resonance);
            fbcf.resonance.value = combFilterResonances[index];
            if (index < combFilterDelayTimes.length / 2) {
                this.connectEffectLeft(...this._allpassFilters, fbcf);
            }
            else {
                this.connectEffectRight(...this._allpassFilters, fbcf);
            }
            return fbcf;
        });
        // chain the allpass filters together
        this.roomSize.connect(this._scaleRoomSize);
        readOnly(this, ["roomSize"]);
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            roomSize: 0.5,
        });
    }
    dispose() {
        super.dispose();
        this._allpassFilters.forEach(apf => apf.disconnect());
        this._feedbackCombFilters.forEach(fbcf => fbcf.dispose());
        this.roomSize.dispose();
        this._scaleRoomSize.dispose();
        return this;
    }
}

/**
 * Just like a [[StereoFeedbackEffect]], but the feedback is routed from left to right
 * and right to left instead of on the same channel.
 * ```
 * +--------------------------------+ feedbackL <-----------------------------------+
 * |                                                                                |
 * +-->                          +----->        +---->                          +-----+
 *      feedbackMerge +--> split        (EFFECT)       merge +--> feedbackSplit     | |
 * +-->                          +----->        +---->                          +---+ |
 * |                                                                                  |
 * +--------------------------------+ feedbackR <-------------------------------------+
 * ```
 */
class StereoXFeedbackEffect extends StereoFeedbackEffect {
    constructor(options) {
        super(options);
        // the left output connected to the right input
        this._feedbackL.disconnect();
        this._feedbackL.connect(this._feedbackMerge, 0, 1);
        // the left output connected to the right input
        this._feedbackR.disconnect();
        this._feedbackR.connect(this._feedbackMerge, 0, 0);
        readOnly(this, ["feedback"]);
    }
}

/**
 * PingPongDelay is a feedback delay effect where the echo is heard
 * first in one channel and next in the opposite channel. In a stereo
 * system these are the right and left channels.
 * PingPongDelay in more simplified terms is two Tone.FeedbackDelays
 * with independent delay values. Each delay is routed to one channel
 * (left or right), and the channel triggered second will always
 * trigger at the same interval after the first.
 * @example
 * const pingPong = new Tone.PingPongDelay("4n", 0.2).toDestination();
 * const drum = new Tone.MembraneSynth().connect(pingPong);
 * drum.triggerAttackRelease("C4", "32n");
 * @category Effect
 */
class PingPongDelay extends StereoXFeedbackEffect {
    constructor() {
        super(optionsFromArguments(PingPongDelay.getDefaults(), arguments, ["delayTime", "feedback"]));
        this.name = "PingPongDelay";
        const options = optionsFromArguments(PingPongDelay.getDefaults(), arguments, ["delayTime", "feedback"]);
        this._leftDelay = new Delay({
            context: this.context,
            maxDelay: options.maxDelay,
        });
        this._rightDelay = new Delay({
            context: this.context,
            maxDelay: options.maxDelay
        });
        this._rightPreDelay = new Delay({
            context: this.context,
            maxDelay: options.maxDelay
        });
        this.delayTime = new Signal({
            context: this.context,
            units: "time",
            value: options.delayTime,
        });
        // connect it up
        this.connectEffectLeft(this._leftDelay);
        this.connectEffectRight(this._rightPreDelay, this._rightDelay);
        this.delayTime.fan(this._leftDelay.delayTime, this._rightDelay.delayTime, this._rightPreDelay.delayTime);
        // rearranged the feedback to be after the rightPreDelay
        this._feedbackL.disconnect();
        this._feedbackL.connect(this._rightDelay);
        readOnly(this, ["delayTime"]);
    }
    static getDefaults() {
        return Object.assign(StereoXFeedbackEffect.getDefaults(), {
            delayTime: 0.25,
            maxDelay: 1
        });
    }
    dispose() {
        super.dispose();
        this._leftDelay.dispose();
        this._rightDelay.dispose();
        this._rightPreDelay.dispose();
        this.delayTime.dispose();
        return this;
    }
}

/**
 * PitchShift does near-realtime pitch shifting to the incoming signal.
 * The effect is achieved by speeding up or slowing down the delayTime
 * of a DelayNode using a sawtooth wave.
 * Algorithm found in [this pdf](http://dsp-book.narod.ru/soundproc.pdf).
 * Additional reference by [Miller Pucket](http://msp.ucsd.edu/techniques/v0.11/book-html/node115.html).
 * @category Effect
 */
class PitchShift extends FeedbackEffect {
    constructor() {
        super(optionsFromArguments(PitchShift.getDefaults(), arguments, ["pitch"]));
        this.name = "PitchShift";
        const options = optionsFromArguments(PitchShift.getDefaults(), arguments, ["pitch"]);
        this._frequency = new Signal({ context: this.context });
        this._delayA = new Delay({
            maxDelay: 1,
            context: this.context
        });
        this._lfoA = new LFO({
            context: this.context,
            min: 0,
            max: 0.1,
            type: "sawtooth"
        }).connect(this._delayA.delayTime);
        this._delayB = new Delay({
            maxDelay: 1,
            context: this.context
        });
        this._lfoB = new LFO({
            context: this.context,
            min: 0,
            max: 0.1,
            type: "sawtooth",
            phase: 180
        }).connect(this._delayB.delayTime);
        this._crossFade = new CrossFade({ context: this.context });
        this._crossFadeLFO = new LFO({
            context: this.context,
            min: 0,
            max: 1,
            type: "triangle",
            phase: 90
        }).connect(this._crossFade.fade);
        this._feedbackDelay = new Delay({
            delayTime: options.delayTime,
            context: this.context,
        });
        this.delayTime = this._feedbackDelay.delayTime;
        readOnly(this, "delayTime");
        this._pitch = options.pitch;
        this._windowSize = options.windowSize;
        // connect the two delay lines up
        this._delayA.connect(this._crossFade.a);
        this._delayB.connect(this._crossFade.b);
        // connect the frequency
        this._frequency.fan(this._lfoA.frequency, this._lfoB.frequency, this._crossFadeLFO.frequency);
        // route the input
        this.effectSend.fan(this._delayA, this._delayB);
        this._crossFade.chain(this._feedbackDelay, this.effectReturn);
        // start the LFOs at the same time
        const now = this.now();
        this._lfoA.start(now);
        this._lfoB.start(now);
        this._crossFadeLFO.start(now);
        // set the initial value
        this.windowSize = this._windowSize;
    }
    static getDefaults() {
        return Object.assign(FeedbackEffect.getDefaults(), {
            pitch: 0,
            windowSize: 0.1,
            delayTime: 0,
            feedback: 0
        });
    }
    /**
     * Repitch the incoming signal by some interval (measured in semi-tones).
     * @example
     * const pitchShift = new Tone.PitchShift().toDestination();
     * const osc = new Tone.Oscillator().connect(pitchShift).start().toDestination();
     * pitchShift.pitch = -12; // down one octave
     * pitchShift.pitch = 7; // up a fifth
     */
    get pitch() {
        return this._pitch;
    }
    set pitch(interval) {
        this._pitch = interval;
        let factor = 0;
        if (interval < 0) {
            this._lfoA.min = 0;
            this._lfoA.max = this._windowSize;
            this._lfoB.min = 0;
            this._lfoB.max = this._windowSize;
            factor = intervalToFrequencyRatio(interval - 1) + 1;
        }
        else {
            this._lfoA.min = this._windowSize;
            this._lfoA.max = 0;
            this._lfoB.min = this._windowSize;
            this._lfoB.max = 0;
            factor = intervalToFrequencyRatio(interval) - 1;
        }
        this._frequency.value = factor * (1.2 / this._windowSize);
    }
    /**
     * The window size corresponds roughly to the sample length in a looping sampler.
     * Smaller values are desirable for a less noticeable delay time of the pitch shifted
     * signal, but larger values will result in smoother pitch shifting for larger intervals.
     * A nominal range of 0.03 to 0.1 is recommended.
     */
    get windowSize() {
        return this._windowSize;
    }
    set windowSize(size) {
        this._windowSize = this.toSeconds(size);
        this.pitch = this._pitch;
    }
    dispose() {
        super.dispose();
        this._frequency.dispose();
        this._delayA.dispose();
        this._delayB.dispose();
        this._lfoA.dispose();
        this._lfoB.dispose();
        this._crossFade.dispose();
        this._crossFadeLFO.dispose();
        this._feedbackDelay.dispose();
        return this;
    }
}

/**
 * Phaser is a phaser effect. Phasers work by changing the phase
 * of different frequency components of an incoming signal. Read more on
 * [Wikipedia](https://en.wikipedia.org/wiki/Phaser_(effect)).
 * Inspiration for this phaser comes from [Tuna.js](https://github.com/Dinahmoe/tuna/).
 * @example
 * const phaser = new Tone.Phaser({
 * 	frequency: 15,
 * 	octaves: 5,
 * 	baseFrequency: 1000
 * }).toDestination();
 * const synth = new Tone.FMSynth().connect(phaser);
 * synth.triggerAttackRelease("E3", "2n");
 * @category Effect
 */
class Phaser extends StereoEffect {
    constructor() {
        super(optionsFromArguments(Phaser.getDefaults(), arguments, ["frequency", "octaves", "baseFrequency"]));
        this.name = "Phaser";
        const options = optionsFromArguments(Phaser.getDefaults(), arguments, ["frequency", "octaves", "baseFrequency"]);
        this._lfoL = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: 0,
            max: 1
        });
        this._lfoR = new LFO({
            context: this.context,
            frequency: options.frequency,
            min: 0,
            max: 1,
            phase: 180,
        });
        this._baseFrequency = this.toFrequency(options.baseFrequency);
        this._octaves = options.octaves;
        this.Q = new Signal({
            context: this.context,
            value: options.Q,
            units: "positive",
        });
        this._filtersL = this._makeFilters(options.stages, this._lfoL);
        this._filtersR = this._makeFilters(options.stages, this._lfoR);
        this.frequency = this._lfoL.frequency;
        this.frequency.value = options.frequency;
        // connect them up
        this.connectEffectLeft(...this._filtersL);
        this.connectEffectRight(...this._filtersR);
        // control the frequency with one LFO
        this._lfoL.frequency.connect(this._lfoR.frequency);
        // set the options
        this.baseFrequency = options.baseFrequency;
        this.octaves = options.octaves;
        // start the lfo
        this._lfoL.start();
        this._lfoR.start();
        readOnly(this, ["frequency", "Q"]);
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            frequency: 0.5,
            octaves: 3,
            stages: 10,
            Q: 10,
            baseFrequency: 350,
        });
    }
    _makeFilters(stages, connectToFreq) {
        const filters = [];
        // make all the filters
        for (let i = 0; i < stages; i++) {
            const filter = this.context.createBiquadFilter();
            filter.type = "allpass";
            this.Q.connect(filter.Q);
            connectToFreq.connect(filter.frequency);
            filters.push(filter);
        }
        return filters;
    }
    /**
     * The number of octaves the phase goes above the baseFrequency
     */
    get octaves() {
        return this._octaves;
    }
    set octaves(octaves) {
        this._octaves = octaves;
        const max = this._baseFrequency * Math.pow(2, octaves);
        this._lfoL.max = max;
        this._lfoR.max = max;
    }
    /**
     * The the base frequency of the filters.
     */
    get baseFrequency() {
        return this._baseFrequency;
    }
    set baseFrequency(freq) {
        this._baseFrequency = this.toFrequency(freq);
        this._lfoL.min = this._baseFrequency;
        this._lfoR.min = this._baseFrequency;
        this.octaves = this._octaves;
    }
    dispose() {
        super.dispose();
        this.Q.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        this._filtersL.forEach(f => f.disconnect());
        this._filtersR.forEach(f => f.disconnect());
        this.frequency.dispose();
        return this;
    }
}

/**
 * Simple convolution created with decaying noise.
 * Generates an Impulse Response Buffer
 * with Tone.Offline then feeds the IR into ConvolverNode.
 * The impulse response generation is async, so you have
 * to wait until [[ready]] resolves before it will make a sound.
 *
 * Inspiration from [ReverbGen](https://github.com/adelespinasse/reverbGen).
 * Copyright (c) 2014 Alan deLespinasse Apache 2.0 License.
 *
 * @category Effect
 */
class Reverb extends Effect {
    constructor() {
        super(optionsFromArguments(Reverb.getDefaults(), arguments, ["decay"]));
        this.name = "Reverb";
        /**
         * Convolver node
         */
        this._convolver = this.context.createConvolver();
        /**
         * Resolves when the reverb buffer is generated. Whenever either [[decay]]
         * or [[preDelay]] are set, you have to wait until [[ready]] resolves
         * before the IR is generated with the latest values.
         */
        this.ready = Promise.resolve();
        const options = optionsFromArguments(Reverb.getDefaults(), arguments, ["decay"]);
        this._decay = options.decay;
        this._preDelay = options.preDelay;
        this.generate();
        this.connectEffect(this._convolver);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            decay: 1.5,
            preDelay: 0.01,
        });
    }
    /**
     * The duration of the reverb.
     */
    get decay() {
        return this._decay;
    }
    set decay(time) {
        time = this.toSeconds(time);
        assertRange(time, 0.001);
        this._decay = time;
        this.generate();
    }
    /**
     * The amount of time before the reverb is fully ramped in.
     */
    get preDelay() {
        return this._preDelay;
    }
    set preDelay(time) {
        time = this.toSeconds(time);
        assertRange(time, 0);
        this._preDelay = time;
        this.generate();
    }
    /**
     * Generate the Impulse Response. Returns a promise while the IR is being generated.
     * @return Promise which returns this object.
     */
    generate() {
        return __awaiter(this, void 0, void 0, function* () {
            const previousReady = this.ready;
            // create a noise burst which decays over the duration in each channel
            const context = new OfflineContext(2, this._decay + this._preDelay, this.context.sampleRate);
            const noiseL = new Noise({ context });
            const noiseR = new Noise({ context });
            const merge = new Merge({ context });
            noiseL.connect(merge, 0, 0);
            noiseR.connect(merge, 0, 1);
            const gainNode = new Gain({ context }).toDestination();
            merge.connect(gainNode);
            noiseL.start(0);
            noiseR.start(0);
            // predelay
            gainNode.gain.setValueAtTime(0, 0);
            gainNode.gain.setValueAtTime(1, this._preDelay);
            // decay
            gainNode.gain.exponentialApproachValueAtTime(0, this._preDelay, this.decay);
            // render the buffer
            const renderPromise = context.render();
            this.ready = renderPromise.then(noOp);
            // wait for the previous `ready` to resolve
            yield previousReady;
            // set the buffer
            this._convolver.buffer = (yield renderPromise).get();
            return this;
        });
    }
    dispose() {
        super.dispose();
        this._convolver.disconnect();
        return this;
    }
}

/**
 * Mid/Side processing separates the the 'mid' signal (which comes out of both the left and the right channel)
 * and the 'side' (which only comes out of the the side channels).
 * ```
 * Mid = (Left+Right)/sqrt(2);   // obtain mid-signal from left and right
 * Side = (Left-Right)/sqrt(2);   // obtain side-signal from left and right
 * ```
 * @category Component
 */
class MidSideSplit extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(MidSideSplit.getDefaults(), arguments));
        this.name = "MidSideSplit";
        this._split = this.input = new Split({
            channels: 2,
            context: this.context
        });
        this._midAdd = new Add({ context: this.context });
        this.mid = new Multiply({
            context: this.context,
            value: Math.SQRT1_2,
        });
        this._sideSubtract = new Subtract({ context: this.context });
        this.side = new Multiply({
            context: this.context,
            value: Math.SQRT1_2,
        });
        this._split.connect(this._midAdd, 0);
        this._split.connect(this._midAdd.addend, 1);
        this._split.connect(this._sideSubtract, 0);
        this._split.connect(this._sideSubtract.subtrahend, 1);
        this._midAdd.connect(this.mid);
        this._sideSubtract.connect(this.side);
    }
    dispose() {
        super.dispose();
        this.mid.dispose();
        this.side.dispose();
        this._midAdd.dispose();
        this._sideSubtract.dispose();
        this._split.dispose();
        return this;
    }
}

/**
 * MidSideMerge merges the mid and side signal after they've been separated by [[MidSideSplit]]
 * ```
 * Mid = (Left+Right)/sqrt(2);   // obtain mid-signal from left and right
 * Side = (Left-Right)/sqrt(2);   // obtain side-signal from left and right
 * ```
 * @category Component
 */
class MidSideMerge extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(MidSideMerge.getDefaults(), arguments));
        this.name = "MidSideMerge";
        this.mid = new Gain({ context: this.context });
        this.side = new Gain({ context: this.context });
        this._left = new Add({ context: this.context });
        this._leftMult = new Multiply({
            context: this.context,
            value: Math.SQRT1_2
        });
        this._right = new Subtract({ context: this.context });
        this._rightMult = new Multiply({
            context: this.context,
            value: Math.SQRT1_2
        });
        this._merge = this.output = new Merge({ context: this.context });
        this.mid.fan(this._left);
        this.side.connect(this._left.addend);
        this.mid.connect(this._right);
        this.side.connect(this._right.subtrahend);
        this._left.connect(this._leftMult);
        this._right.connect(this._rightMult);
        this._leftMult.connect(this._merge, 0, 0);
        this._rightMult.connect(this._merge, 0, 1);
    }
    dispose() {
        super.dispose();
        this.mid.dispose();
        this.side.dispose();
        this._leftMult.dispose();
        this._rightMult.dispose();
        this._left.dispose();
        this._right.dispose();
        return this;
    }
}

/**
 * Mid/Side processing separates the the 'mid' signal
 * (which comes out of both the left and the right channel)
 * and the 'side' (which only comes out of the the side channels)
 * and effects them separately before being recombined.
 * Applies a Mid/Side seperation and recombination.
 * Algorithm found in [kvraudio forums](http://www.kvraudio.com/forum/viewtopic.php?t=212587).
 * This is a base-class for Mid/Side Effects.
 * @category Effect
 */
class MidSideEffect extends Effect {
    constructor(options) {
        super(options);
        this.name = "MidSideEffect";
        this._midSideMerge = new MidSideMerge({ context: this.context });
        this._midSideSplit = new MidSideSplit({ context: this.context });
        this._midSend = this._midSideSplit.mid;
        this._sideSend = this._midSideSplit.side;
        this._midReturn = this._midSideMerge.mid;
        this._sideReturn = this._midSideMerge.side;
        // the connections
        this.effectSend.connect(this._midSideSplit);
        this._midSideMerge.connect(this.effectReturn);
    }
    /**
     * Connect the mid chain of the effect
     */
    connectEffectMid(...nodes) {
        this._midSend.chain(...nodes, this._midReturn);
    }
    /**
     * Connect the side chain of the effect
     */
    connectEffectSide(...nodes) {
        this._sideSend.chain(...nodes, this._sideReturn);
    }
    dispose() {
        super.dispose();
        this._midSideSplit.dispose();
        this._midSideMerge.dispose();
        this._midSend.dispose();
        this._sideSend.dispose();
        this._midReturn.dispose();
        this._sideReturn.dispose();
        return this;
    }
}

/**
 * Applies a width factor to the mid/side seperation.
 * 0 is all mid and 1 is all side.
 * Algorithm found in [kvraudio forums](http://www.kvraudio.com/forum/viewtopic.php?t=212587).
 * ```
 * Mid *= 2*(1-width)<br>
 * Side *= 2*width
 * ```
 * @category Effect
 */
class StereoWidener extends MidSideEffect {
    constructor() {
        super(optionsFromArguments(StereoWidener.getDefaults(), arguments, ["width"]));
        this.name = "StereoWidener";
        const options = optionsFromArguments(StereoWidener.getDefaults(), arguments, ["width"]);
        this.width = new Signal({
            context: this.context,
            value: options.width,
            units: "normalRange",
        });
        readOnly(this, ["width"]);
        this._twoTimesWidthMid = new Multiply({
            context: this.context,
            value: 2,
        });
        this._twoTimesWidthSide = new Multiply({
            context: this.context,
            value: 2,
        });
        this._midMult = new Multiply({ context: this.context });
        this._twoTimesWidthMid.connect(this._midMult.factor);
        this.connectEffectMid(this._midMult);
        this._oneMinusWidth = new Subtract({ context: this.context });
        this._oneMinusWidth.connect(this._twoTimesWidthMid);
        connect(this.context.getConstant(1), this._oneMinusWidth);
        this.width.connect(this._oneMinusWidth.subtrahend);
        this._sideMult = new Multiply({ context: this.context });
        this.width.connect(this._twoTimesWidthSide);
        this._twoTimesWidthSide.connect(this._sideMult.factor);
        this.connectEffectSide(this._sideMult);
    }
    static getDefaults() {
        return Object.assign(MidSideEffect.getDefaults(), {
            width: 0.5,
        });
    }
    dispose() {
        super.dispose();
        this.width.dispose();
        this._midMult.dispose();
        this._sideMult.dispose();
        this._twoTimesWidthMid.dispose();
        this._twoTimesWidthSide.dispose();
        this._oneMinusWidth.dispose();
        return this;
    }
}

/**
 * Tremolo modulates the amplitude of an incoming signal using an [[LFO]].
 * The effect is a stereo effect where the modulation phase is inverted in each channel.
 *
 * @example
 * // create a tremolo and start it's LFO
 * const tremolo = new Tone.Tremolo(9, 0.75).toDestination().start();
 * // route an oscillator through the tremolo and start it
 * const oscillator = new Tone.Oscillator().connect(tremolo).start();
 *
 * @category Effect
 */
class Tremolo extends StereoEffect {
    constructor() {
        super(optionsFromArguments(Tremolo.getDefaults(), arguments, ["frequency", "depth"]));
        this.name = "Tremolo";
        const options = optionsFromArguments(Tremolo.getDefaults(), arguments, ["frequency", "depth"]);
        this._lfoL = new LFO({
            context: this.context,
            type: options.type,
            min: 1,
            max: 0,
        });
        this._lfoR = new LFO({
            context: this.context,
            type: options.type,
            min: 1,
            max: 0,
        });
        this._amplitudeL = new Gain({ context: this.context });
        this._amplitudeR = new Gain({ context: this.context });
        this.frequency = new Signal({
            context: this.context,
            value: options.frequency,
            units: "frequency",
        });
        this.depth = new Signal({
            context: this.context,
            value: options.depth,
            units: "normalRange",
        });
        readOnly(this, ["frequency", "depth"]);
        this.connectEffectLeft(this._amplitudeL);
        this.connectEffectRight(this._amplitudeR);
        this._lfoL.connect(this._amplitudeL.gain);
        this._lfoR.connect(this._amplitudeR.gain);
        this.frequency.fan(this._lfoL.frequency, this._lfoR.frequency);
        this.depth.fan(this._lfoR.amplitude, this._lfoL.amplitude);
        this.spread = options.spread;
    }
    static getDefaults() {
        return Object.assign(StereoEffect.getDefaults(), {
            frequency: 10,
            type: "sine",
            depth: 0.5,
            spread: 180,
        });
    }
    /**
     * Start the tremolo.
     */
    start(time) {
        this._lfoL.start(time);
        this._lfoR.start(time);
        return this;
    }
    /**
     * Stop the tremolo.
     */
    stop(time) {
        this._lfoL.stop(time);
        this._lfoR.stop(time);
        return this;
    }
    /**
     * Sync the effect to the transport.
     */
    sync() {
        this._lfoL.sync();
        this._lfoR.sync();
        this.context.transport.syncSignal(this.frequency);
        return this;
    }
    /**
     * Unsync the filter from the transport
     */
    unsync() {
        this._lfoL.unsync();
        this._lfoR.unsync();
        this.context.transport.unsyncSignal(this.frequency);
        return this;
    }
    /**
     * The oscillator type.
     */
    get type() {
        return this._lfoL.type;
    }
    set type(type) {
        this._lfoL.type = type;
        this._lfoR.type = type;
    }
    /**
     * Amount of stereo spread. When set to 0, both LFO's will be panned centrally.
     * When set to 180, LFO's will be panned hard left and right respectively.
     */
    get spread() {
        return this._lfoR.phase - this._lfoL.phase; // 180
    }
    set spread(spread) {
        this._lfoL.phase = 90 - (spread / 2);
        this._lfoR.phase = (spread / 2) + 90;
    }
    dispose() {
        super.dispose();
        this._lfoL.dispose();
        this._lfoR.dispose();
        this._amplitudeL.dispose();
        this._amplitudeR.dispose();
        this.frequency.dispose();
        this.depth.dispose();
        return this;
    }
}

/**
 * A Vibrato effect composed of a Tone.Delay and a Tone.LFO. The LFO
 * modulates the delayTime of the delay, causing the pitch to rise and fall.
 * @category Effect
 */
class Vibrato extends Effect {
    constructor() {
        super(optionsFromArguments(Vibrato.getDefaults(), arguments, ["frequency", "depth"]));
        this.name = "Vibrato";
        const options = optionsFromArguments(Vibrato.getDefaults(), arguments, ["frequency", "depth"]);
        this._delayNode = new Delay({
            context: this.context,
            delayTime: 0,
            maxDelay: options.maxDelay,
        });
        this._lfo = new LFO({
            context: this.context,
            type: options.type,
            min: 0,
            max: options.maxDelay,
            frequency: options.frequency,
            phase: -90 // offse the phase so the resting position is in the center
        }).start().connect(this._delayNode.delayTime);
        this.frequency = this._lfo.frequency;
        this.depth = this._lfo.amplitude;
        this.depth.value = options.depth;
        readOnly(this, ["frequency", "depth"]);
        this.effectSend.chain(this._delayNode, this.effectReturn);
    }
    static getDefaults() {
        return Object.assign(Effect.getDefaults(), {
            maxDelay: 0.005,
            frequency: 5,
            depth: 0.1,
            type: "sine"
        });
    }
    /**
     * Type of oscillator attached to the Vibrato.
     */
    get type() {
        return this._lfo.type;
    }
    set type(type) {
        this._lfo.type = type;
    }
    dispose() {
        super.dispose();
        this._delayNode.dispose();
        this._lfo.dispose();
        this.frequency.dispose();
        this.depth.dispose();
        return this;
    }
}

/**
 * Wrapper around the native Web Audio's [AnalyserNode](http://webaudio.github.io/web-audio-api/#idl-def-AnalyserNode).
 * Extracts FFT or Waveform data from the incoming signal.
 * @category Component
 */
class Analyser extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Analyser.getDefaults(), arguments, ["type", "size"]));
        this.name = "Analyser";
        /**
         * The analyser node.
         */
        this._analysers = [];
        /**
         * The buffer that the FFT data is written to
         */
        this._buffers = [];
        const options = optionsFromArguments(Analyser.getDefaults(), arguments, ["type", "size"]);
        this.input = this.output = this._gain = new Gain({ context: this.context });
        this._split = new Split({
            context: this.context,
            channels: options.channels,
        });
        this.input.connect(this._split);
        assertRange(options.channels, 1);
        // create the analysers
        for (let channel = 0; channel < options.channels; channel++) {
            this._analysers[channel] = this.context.createAnalyser();
            this._split.connect(this._analysers[channel], channel, 0);
        }
        // set the values initially
        this.size = options.size;
        this.type = options.type;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            size: 1024,
            smoothing: 0.8,
            type: "fft",
            channels: 1,
        });
    }
    /**
     * Run the analysis given the current settings. If [[channels]] = 1,
     * it will return a Float32Array. If [[channels]] > 1, it will
     * return an array of Float32Arrays where each index in the array
     * represents the analysis done on a channel.
     */
    getValue() {
        this._analysers.forEach((analyser, index) => {
            const buffer = this._buffers[index];
            if (this._type === "fft") {
                analyser.getFloatFrequencyData(buffer);
            }
            else if (this._type === "waveform") {
                analyser.getFloatTimeDomainData(buffer);
            }
        });
        if (this.channels === 1) {
            return this._buffers[0];
        }
        else {
            return this._buffers;
        }
    }
    /**
     * The size of analysis. This must be a power of two in the range 16 to 16384.
     */
    get size() {
        return this._analysers[0].frequencyBinCount;
    }
    set size(size) {
        this._analysers.forEach((analyser, index) => {
            analyser.fftSize = size * 2;
            this._buffers[index] = new Float32Array(size);
        });
    }
    /**
     * The number of channels the analyser does the analysis on. Channel
     * separation is done using [[Split]]
     */
    get channels() {
        return this._analysers.length;
    }
    /**
     * The analysis function returned by analyser.getValue(), either "fft" or "waveform".
     */
    get type() {
        return this._type;
    }
    set type(type) {
        assert(type === "waveform" || type === "fft", `Analyser: invalid type: ${type}`);
        this._type = type;
    }
    /**
     * 0 represents no time averaging with the last analysis frame.
     */
    get smoothing() {
        return this._analysers[0].smoothingTimeConstant;
    }
    set smoothing(val) {
        this._analysers.forEach(a => a.smoothingTimeConstant = val);
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        this._analysers.forEach(a => a.disconnect());
        this._split.dispose();
        this._gain.dispose();
        return this;
    }
}

/**
 * The base class for Metering classes.
 */
class MeterBase extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(MeterBase.getDefaults(), arguments));
        this.name = "MeterBase";
        this.input = this.output = this._analyser = new Analyser({
            context: this.context,
            size: 256,
            type: "waveform",
        });
    }
    dispose() {
        super.dispose();
        this._analyser.dispose();
        return this;
    }
}

/**
 * Meter gets the [RMS](https://en.wikipedia.org/wiki/Root_mean_square)
 * of an input signal. It can also get the raw value of the input signal.
 *
 * @example
 * const meter = new Tone.Meter();
 * const mic = new Tone.UserMedia();
 * mic.open();
 * // connect mic to the meter
 * mic.connect(meter);
 * // the current level of the mic
 * setInterval(() => console.log(meter.getValue()), 100);
 * @category Component
 */
class Meter extends MeterBase {
    constructor() {
        super(optionsFromArguments(Meter.getDefaults(), arguments, ["smoothing"]));
        this.name = "Meter";
        /**
         * The previous frame's value
         */
        this._rms = 0;
        const options = optionsFromArguments(Meter.getDefaults(), arguments, ["smoothing"]);
        this.input = this.output = this._analyser = new Analyser({
            context: this.context,
            size: 256,
            type: "waveform",
            channels: options.channels,
        });
        this.smoothing = options.smoothing,
            this.normalRange = options.normalRange;
    }
    static getDefaults() {
        return Object.assign(MeterBase.getDefaults(), {
            smoothing: 0.8,
            normalRange: false,
            channels: 1,
        });
    }
    /**
     * Use [[getValue]] instead. For the previous getValue behavior, use DCMeter.
     * @deprecated
     */
    getLevel() {
        warn("'getLevel' has been changed to 'getValue'");
        return this.getValue();
    }
    /**
     * Get the current value of the incoming signal.
     * Output is in decibels when [[normalRange]] is `false`.
     * If [[channels]] = 1, then the output is a single number
     * representing the value of the input signal. When [[channels]] > 1,
     * then each channel is returned as a value in a number array.
     */
    getValue() {
        const aValues = this._analyser.getValue();
        const channelValues = this.channels === 1 ? [aValues] : aValues;
        const vals = channelValues.map(values => {
            const totalSquared = values.reduce((total, current) => total + current * current, 0);
            const rms = Math.sqrt(totalSquared / values.length);
            // the rms can only fall at the rate of the smoothing
            // but can jump up instantly
            this._rms = Math.max(rms, this._rms * this.smoothing);
            return this.normalRange ? this._rms : gainToDb(this._rms);
        });
        if (this.channels === 1) {
            return vals[0];
        }
        else {
            return vals;
        }
    }
    /**
     * The number of channels of analysis.
     */
    get channels() {
        return this._analyser.channels;
    }
    dispose() {
        super.dispose();
        this._analyser.dispose();
        return this;
    }
}

/**
 * Get the current frequency data of the connected audio source using a fast Fourier transform.
 * @category Component
 */
class FFT extends MeterBase {
    constructor() {
        super(optionsFromArguments(FFT.getDefaults(), arguments, ["size"]));
        this.name = "FFT";
        const options = optionsFromArguments(FFT.getDefaults(), arguments, ["size"]);
        this.normalRange = options.normalRange;
        this._analyser.type = "fft";
        this.size = options.size;
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            normalRange: false,
            size: 1024,
            smoothing: 0.8,
        });
    }
    /**
     * Gets the current frequency data from the connected audio source.
     * Returns the frequency data of length [[size]] as a Float32Array of decibel values.
     */
    getValue() {
        const values = this._analyser.getValue();
        return values.map(v => this.normalRange ? dbToGain(v) : v);
    }
    /**
     * The size of analysis. This must be a power of two in the range 16 to 16384.
     * Determines the size of the array returned by [[getValue]] (i.e. the number of
     * frequency bins). Large FFT sizes may be costly to compute.
     */
    get size() {
        return this._analyser.size;
    }
    set size(size) {
        this._analyser.size = size;
    }
    /**
     * 0 represents no time averaging with the last analysis frame.
     */
    get smoothing() {
        return this._analyser.smoothing;
    }
    set smoothing(val) {
        this._analyser.smoothing = val;
    }
    /**
     * Returns the frequency value in hertz of each of the indices of the FFT's [[getValue]] response.
     * @example
     * const fft = new Tone.FFT(32);
     * console.log([0, 1, 2, 3, 4].map(index => fft.getFrequencyOfIndex(index)));
     */
    getFrequencyOfIndex(index) {
        assert(0 <= index && index < this.size, `index must be greater than or equal to 0 and less than ${this.size}`);
        return index * this.context.sampleRate / (this.size * 2);
    }
}

/**
 * DCMeter gets the raw value of the input signal at the current time.
 *
 * @example
 * const meter = new Tone.DCMeter();
 * const mic = new Tone.UserMedia();
 * mic.open();
 * // connect mic to the meter
 * mic.connect(meter);
 * // the current level of the mic
 * const level = meter.getValue();
 * @category Component
 */
class DCMeter extends MeterBase {
    constructor() {
        super(optionsFromArguments(DCMeter.getDefaults(), arguments));
        this.name = "DCMeter";
        this._analyser.type = "waveform";
        this._analyser.size = 256;
    }
    /**
     * Get the signal value of the incoming signal
     */
    getValue() {
        const value = this._analyser.getValue();
        return value[0];
    }
}

/**
 * Get the current waveform data of the connected audio source.
 * @category Component
 */
class Waveform extends MeterBase {
    constructor() {
        super(optionsFromArguments(Waveform.getDefaults(), arguments, ["size"]));
        this.name = "Waveform";
        const options = optionsFromArguments(Waveform.getDefaults(), arguments, ["size"]);
        this._analyser.type = "waveform";
        this.size = options.size;
    }
    static getDefaults() {
        return Object.assign(MeterBase.getDefaults(), {
            size: 1024,
        });
    }
    /**
     * Return the waveform for the current time as a Float32Array where each value in the array
     * represents a sample in the waveform.
     */
    getValue() {
        return this._analyser.getValue();
    }
    /**
     * The size of analysis. This must be a power of two in the range 16 to 16384.
     * Determines the size of the array returned by [[getValue]].
     */
    get size() {
        return this._analyser.size;
    }
    set size(size) {
        this._analyser.size = size;
    }
}

/**
 * Mono coerces the incoming mono or stereo signal into a mono signal
 * where both left and right channels have the same value. This can be useful
 * for [stereo imaging](https://en.wikipedia.org/wiki/Stereo_imaging).
 * @category Component
 */
class Mono extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Mono.getDefaults(), arguments));
        this.name = "Mono";
        this.input = new Gain({ context: this.context });
        this._merge = this.output = new Merge({
            channels: 2,
            context: this.context,
        });
        this.input.connect(this._merge, 0, 0);
        this.input.connect(this._merge, 0, 1);
    }
    dispose() {
        super.dispose();
        this._merge.dispose();
        this.input.dispose();
        return this;
    }
}

/**
 * Split the incoming signal into three bands (low, mid, high)
 * with two crossover frequency controls.
 * ```
 *            +----------------------+
 *          +-> input < lowFrequency +------------------> low
 *          | +----------------------+
 *          |
 *          | +--------------------------------------+
 * input ---+-> lowFrequency < input < highFrequency +--> mid
 *          | +--------------------------------------+
 *          |
 *          | +-----------------------+
 *          +-> highFrequency < input +-----------------> high
 *            +-----------------------+
 * ```
 * @category Component
 */
class MultibandSplit extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(MultibandSplit.getDefaults(), arguments, ["lowFrequency", "highFrequency"]));
        this.name = "MultibandSplit";
        /**
         * the input
         */
        this.input = new Gain({ context: this.context });
        /**
         * no output node, use either low, mid or high outputs
         */
        this.output = undefined;
        /**
         * The low band.
         */
        this.low = new Filter({
            context: this.context,
            frequency: 0,
            type: "lowpass",
        });
        /**
         * the lower filter of the mid band
         */
        this._lowMidFilter = new Filter({
            context: this.context,
            frequency: 0,
            type: "highpass",
        });
        /**
         * The mid band output.
         */
        this.mid = new Filter({
            context: this.context,
            frequency: 0,
            type: "lowpass",
        });
        /**
         * The high band output.
         */
        this.high = new Filter({
            context: this.context,
            frequency: 0,
            type: "highpass",
        });
        this._internalChannels = [this.low, this.mid, this.high];
        const options = optionsFromArguments(MultibandSplit.getDefaults(), arguments, ["lowFrequency", "highFrequency"]);
        this.lowFrequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.lowFrequency,
        });
        this.highFrequency = new Signal({
            context: this.context,
            units: "frequency",
            value: options.highFrequency,
        });
        this.Q = new Signal({
            context: this.context,
            units: "positive",
            value: options.Q,
        });
        this.input.fan(this.low, this.high);
        this.input.chain(this._lowMidFilter, this.mid);
        // the frequency control signal
        this.lowFrequency.fan(this.low.frequency, this._lowMidFilter.frequency);
        this.highFrequency.fan(this.mid.frequency, this.high.frequency);
        // the Q value
        this.Q.connect(this.low.Q);
        this.Q.connect(this._lowMidFilter.Q);
        this.Q.connect(this.mid.Q);
        this.Q.connect(this.high.Q);
        readOnly(this, ["high", "mid", "low", "highFrequency", "lowFrequency"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            Q: 1,
            highFrequency: 2500,
            lowFrequency: 400,
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        writable(this, ["high", "mid", "low", "highFrequency", "lowFrequency"]);
        this.low.dispose();
        this._lowMidFilter.dispose();
        this.mid.dispose();
        this.high.dispose();
        this.lowFrequency.dispose();
        this.highFrequency.dispose();
        this.Q.dispose();
        return this;
    }
}

/**
 * A spatialized panner node which supports equalpower or HRTF panning.
 * @category Component
 */
class Panner3D extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Panner3D.getDefaults(), arguments, ["positionX", "positionY", "positionZ"]));
        this.name = "Panner3D";
        const options = optionsFromArguments(Panner3D.getDefaults(), arguments, ["positionX", "positionY", "positionZ"]);
        this._panner = this.input = this.output = this.context.createPanner();
        // set some values
        this.panningModel = options.panningModel;
        this.maxDistance = options.maxDistance;
        this.distanceModel = options.distanceModel;
        this.coneOuterGain = options.coneOuterGain;
        this.coneOuterAngle = options.coneOuterAngle;
        this.coneInnerAngle = options.coneInnerAngle;
        this.refDistance = options.refDistance;
        this.rolloffFactor = options.rolloffFactor;
        this.positionX = new Param({
            context: this.context,
            param: this._panner.positionX,
            value: options.positionX,
        });
        this.positionY = new Param({
            context: this.context,
            param: this._panner.positionY,
            value: options.positionY,
        });
        this.positionZ = new Param({
            context: this.context,
            param: this._panner.positionZ,
            value: options.positionZ,
        });
        this.orientationX = new Param({
            context: this.context,
            param: this._panner.orientationX,
            value: options.orientationX,
        });
        this.orientationY = new Param({
            context: this.context,
            param: this._panner.orientationY,
            value: options.orientationY,
        });
        this.orientationZ = new Param({
            context: this.context,
            param: this._panner.orientationZ,
            value: options.orientationZ,
        });
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            coneInnerAngle: 360,
            coneOuterAngle: 360,
            coneOuterGain: 0,
            distanceModel: "inverse",
            maxDistance: 10000,
            orientationX: 0,
            orientationY: 0,
            orientationZ: 0,
            panningModel: "equalpower",
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            refDistance: 1,
            rolloffFactor: 1,
        });
    }
    /**
     * Sets the position of the source in 3d space.
     */
    setPosition(x, y, z) {
        this.positionX.value = x;
        this.positionY.value = y;
        this.positionZ.value = z;
        return this;
    }
    /**
     * Sets the orientation of the source in 3d space.
     */
    setOrientation(x, y, z) {
        this.orientationX.value = x;
        this.orientationY.value = y;
        this.orientationZ.value = z;
        return this;
    }
    /**
     * The panning model. Either "equalpower" or "HRTF".
     */
    get panningModel() {
        return this._panner.panningModel;
    }
    set panningModel(val) {
        this._panner.panningModel = val;
    }
    /**
     * A reference distance for reducing volume as source move further from the listener
     */
    get refDistance() {
        return this._panner.refDistance;
    }
    set refDistance(val) {
        this._panner.refDistance = val;
    }
    /**
     * Describes how quickly the volume is reduced as source moves away from listener.
     */
    get rolloffFactor() {
        return this._panner.rolloffFactor;
    }
    set rolloffFactor(val) {
        this._panner.rolloffFactor = val;
    }
    /**
     * The distance model used by,  "linear", "inverse", or "exponential".
     */
    get distanceModel() {
        return this._panner.distanceModel;
    }
    set distanceModel(val) {
        this._panner.distanceModel = val;
    }
    /**
     * The angle, in degrees, inside of which there will be no volume reduction
     */
    get coneInnerAngle() {
        return this._panner.coneInnerAngle;
    }
    set coneInnerAngle(val) {
        this._panner.coneInnerAngle = val;
    }
    /**
     * The angle, in degrees, outside of which the volume will be reduced
     * to a constant value of coneOuterGain
     */
    get coneOuterAngle() {
        return this._panner.coneOuterAngle;
    }
    set coneOuterAngle(val) {
        this._panner.coneOuterAngle = val;
    }
    /**
     * The gain outside of the coneOuterAngle
     */
    get coneOuterGain() {
        return this._panner.coneOuterGain;
    }
    set coneOuterGain(val) {
        this._panner.coneOuterGain = val;
    }
    /**
     * The maximum distance between source and listener,
     * after which the volume will not be reduced any further.
     */
    get maxDistance() {
        return this._panner.maxDistance;
    }
    set maxDistance(val) {
        this._panner.maxDistance = val;
    }
    dispose() {
        super.dispose();
        this._panner.disconnect();
        this.orientationX.dispose();
        this.orientationY.dispose();
        this.orientationZ.dispose();
        this.positionX.dispose();
        this.positionY.dispose();
        this.positionZ.dispose();
        return this;
    }
}

/**
 * A wrapper around the MediaRecorder API. Unlike the rest of Tone.js, this module does not offer
 * any sample-accurate scheduling because it is not a feature of the MediaRecorder API.
 * This is only natively supported in Chrome and Firefox.
 * For a cross-browser shim, install (audio-recorder-polyfill)[https://www.npmjs.com/package/audio-recorder-polyfill].
 * @example
 * const recorder = new Tone.Recorder();
 * const synth = new Tone.Synth().connect(recorder);
 * // start recording
 * recorder.start();
 * // generate a few notes
 * synth.triggerAttackRelease("C3", 0.5);
 * synth.triggerAttackRelease("C4", 0.5, "+1");
 * synth.triggerAttackRelease("C5", 0.5, "+2");
 * // wait for the notes to end and stop the recording
 * setTimeout(async () => {
 * 	// the recorded audio is returned as a blob
 * 	const recording = await recorder.stop();
 * 	// download the recording by creating an anchor element and blob url
 * 	const url = URL.createObjectURL(recording);
 * 	const anchor = document.createElement("a");
 * 	anchor.download = "recording.webm";
 * 	anchor.href = url;
 * 	anchor.click();
 * }, 4000);
 * @category Component
 */
class Recorder extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Recorder.getDefaults(), arguments));
        this.name = "Recorder";
        const options = optionsFromArguments(Recorder.getDefaults(), arguments);
        this.input = new Gain({
            context: this.context
        });
        assert(Recorder.supported, "Media Recorder API is not available");
        this._stream = this.context.createMediaStreamDestination();
        this.input.connect(this._stream);
        this._recorder = new MediaRecorder(this._stream.stream, {
            mimeType: options.mimeType
        });
    }
    static getDefaults() {
        return ToneAudioNode.getDefaults();
    }
    /**
     * The mime type is the format that the audio is encoded in. For Chrome
     * that is typically webm encoded as "vorbis".
     */
    get mimeType() {
        return this._recorder.mimeType;
    }
    /**
     * Test if your platform supports the Media Recorder API. If it's not available,
     * try installing this (polyfill)[https://www.npmjs.com/package/audio-recorder-polyfill].
     */
    static get supported() {
        return theWindow !== null && Reflect.has(theWindow, "MediaRecorder");
    }
    /**
     * Get the playback state of the Recorder, either "started", "stopped" or "paused"
     */
    get state() {
        if (this._recorder.state === "inactive") {
            return "stopped";
        }
        else if (this._recorder.state === "paused") {
            return "paused";
        }
        else {
            return "started";
        }
    }
    /**
     * Start the Recorder. Returns a promise which resolves
     * when the recorder has started.
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            assert(this.state !== "started", "Recorder is already started");
            const startPromise = new Promise(done => {
                const handleStart = () => {
                    this._recorder.removeEventListener("start", handleStart, false);
                    done();
                };
                this._recorder.addEventListener("start", handleStart, false);
            });
            this._recorder.start();
            return yield startPromise;
        });
    }
    /**
     * Stop the recorder. Returns a promise with the recorded content until this point
     * encoded as [[mimeType]]
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            assert(this.state !== "stopped", "Recorder is not started");
            const dataPromise = new Promise(done => {
                const handleData = (e) => {
                    this._recorder.removeEventListener("dataavailable", handleData, false);
                    done(e.data);
                };
                this._recorder.addEventListener("dataavailable", handleData, false);
            });
            this._recorder.stop();
            return yield dataPromise;
        });
    }
    /**
     * Pause the recorder
     */
    pause() {
        assert(this.state === "started", "Recorder must be started");
        this._recorder.pause();
        return this;
    }
    dispose() {
        super.dispose();
        this.input.dispose();
        this._stream.disconnect();
        return this;
    }
}

/**
 * Compressor is a thin wrapper around the Web Audio
 * [DynamicsCompressorNode](http://webaudio.github.io/web-audio-api/#the-dynamicscompressornode-interface).
 * Compression reduces the volume of loud sounds or amplifies quiet sounds
 * by narrowing or "compressing" an audio signal's dynamic range.
 * Read more on [Wikipedia](https://en.wikipedia.org/wiki/Dynamic_range_compression).
 * @example
 * const comp = new Tone.Compressor(-30, 3);
 * @category Component
 */
class Compressor extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Compressor.getDefaults(), arguments, ["threshold", "ratio"]));
        this.name = "Compressor";
        /**
         * the compressor node
         */
        this._compressor = this.context.createDynamicsCompressor();
        this.input = this._compressor;
        this.output = this._compressor;
        const options = optionsFromArguments(Compressor.getDefaults(), arguments, ["threshold", "ratio"]);
        this.threshold = new Param({
            minValue: this._compressor.threshold.minValue,
            maxValue: this._compressor.threshold.maxValue,
            context: this.context,
            convert: false,
            param: this._compressor.threshold,
            units: "decibels",
            value: options.threshold,
        });
        this.attack = new Param({
            minValue: this._compressor.attack.minValue,
            maxValue: this._compressor.attack.maxValue,
            context: this.context,
            param: this._compressor.attack,
            units: "time",
            value: options.attack,
        });
        this.release = new Param({
            minValue: this._compressor.release.minValue,
            maxValue: this._compressor.release.maxValue,
            context: this.context,
            param: this._compressor.release,
            units: "time",
            value: options.release,
        });
        this.knee = new Param({
            minValue: this._compressor.knee.minValue,
            maxValue: this._compressor.knee.maxValue,
            context: this.context,
            convert: false,
            param: this._compressor.knee,
            units: "decibels",
            value: options.knee,
        });
        this.ratio = new Param({
            minValue: this._compressor.ratio.minValue,
            maxValue: this._compressor.ratio.maxValue,
            context: this.context,
            convert: false,
            param: this._compressor.ratio,
            units: "positive",
            value: options.ratio,
        });
        // set the defaults
        readOnly(this, ["knee", "release", "attack", "ratio", "threshold"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            attack: 0.003,
            knee: 30,
            ratio: 12,
            release: 0.25,
            threshold: -24,
        });
    }
    /**
     * A read-only decibel value for metering purposes, representing the current amount of gain
     * reduction that the compressor is applying to the signal. If fed no signal the value will be 0 (no gain reduction).
     */
    get reduction() {
        return this._compressor.reduction;
    }
    dispose() {
        super.dispose();
        this._compressor.disconnect();
        this.attack.dispose();
        this.release.dispose();
        this.threshold.dispose();
        this.ratio.dispose();
        this.knee.dispose();
        return this;
    }
}

/**
 * Gate only passes a signal through when the incoming
 * signal exceeds a specified threshold. It uses [[Follower]] to follow the ampltiude
 * of the incoming signal and compares it to the [[threshold]] value using [[GreaterThan]].
 *
 * @example
 * const gate = new Tone.Gate(-30, 0.2).toDestination();
 * const mic = new Tone.UserMedia().connect(gate);
 * // the gate will only pass through the incoming
 * // signal when it's louder than -30db
 * @category Component
 */
class Gate extends ToneAudioNode {
    constructor() {
        super(Object.assign(optionsFromArguments(Gate.getDefaults(), arguments, ["threshold", "smoothing"])));
        this.name = "Gate";
        const options = optionsFromArguments(Gate.getDefaults(), arguments, ["threshold", "smoothing"]);
        this._follower = new Follower({
            context: this.context,
            smoothing: options.smoothing,
        });
        this._gt = new GreaterThan({
            context: this.context,
            value: dbToGain(options.threshold),
        });
        this.input = new Gain({ context: this.context });
        this._gate = this.output = new Gain({ context: this.context });
        // connections
        this.input.connect(this._gate);
        // the control signal
        this.input.chain(this._follower, this._gt, this._gate.gain);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            smoothing: 0.1,
            threshold: -40
        });
    }
    /**
     * The threshold of the gate in decibels
     */
    get threshold() {
        return gainToDb(this._gt.value);
    }
    set threshold(thresh) {
        this._gt.value = dbToGain(thresh);
    }
    /**
     * The attack/decay speed of the gate. See [[Follower.smoothing]]
     */
    get smoothing() {
        return this._follower.smoothing;
    }
    set smoothing(smoothingTime) {
        this._follower.smoothing = smoothingTime;
    }
    dispose() {
        super.dispose();
        this.input.dispose();
        this._follower.dispose();
        this._gt.dispose();
        this._gate.dispose();
        return this;
    }
}

/**
 * Limiter will limit the loudness of an incoming signal.
 * Under the hood it's composed of a [[Compressor]] with a fast attack
 * and release and max compression ratio.
 *
 * @example
 * const limiter = new Tone.Limiter(-20).toDestination();
 * const oscillator = new Tone.Oscillator().connect(limiter);
 * oscillator.start();
 * @category Component
 */
class Limiter extends ToneAudioNode {
    constructor() {
        super(Object.assign(optionsFromArguments(Limiter.getDefaults(), arguments, ["threshold"])));
        this.name = "Limiter";
        const options = optionsFromArguments(Limiter.getDefaults(), arguments, ["threshold"]);
        this._compressor = this.input = this.output = new Compressor({
            context: this.context,
            ratio: 20,
            attack: 0.003,
            release: 0.01,
            threshold: options.threshold
        });
        this.threshold = this._compressor.threshold;
        readOnly(this, "threshold");
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            threshold: -12
        });
    }
    /**
     * A read-only decibel value for metering purposes, representing the current amount of gain
     * reduction that the compressor is applying to the signal.
     */
    get reduction() {
        return this._compressor.reduction;
    }
    dispose() {
        super.dispose();
        this._compressor.dispose();
        this.threshold.dispose();
        return this;
    }
}

/**
 * MidSideCompressor applies two different compressors to the [[mid]]
 * and [[side]] signal components of the input. See [[MidSideSplit]] and [[MidSideMerge]].
 * @category Component
 */
class MidSideCompressor extends ToneAudioNode {
    constructor() {
        super(Object.assign(optionsFromArguments(MidSideCompressor.getDefaults(), arguments)));
        this.name = "MidSideCompressor";
        const options = optionsFromArguments(MidSideCompressor.getDefaults(), arguments);
        this._midSideSplit = this.input = new MidSideSplit({ context: this.context });
        this._midSideMerge = this.output = new MidSideMerge({ context: this.context });
        this.mid = new Compressor(Object.assign(options.mid, { context: this.context }));
        this.side = new Compressor(Object.assign(options.side, { context: this.context }));
        this._midSideSplit.mid.chain(this.mid, this._midSideMerge.mid);
        this._midSideSplit.side.chain(this.side, this._midSideMerge.side);
        readOnly(this, ["mid", "side"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            mid: {
                ratio: 3,
                threshold: -24,
                release: 0.03,
                attack: 0.02,
                knee: 16
            },
            side: {
                ratio: 6,
                threshold: -30,
                release: 0.25,
                attack: 0.03,
                knee: 10
            }
        });
    }
    dispose() {
        super.dispose();
        this.mid.dispose();
        this.side.dispose();
        this._midSideSplit.dispose();
        this._midSideMerge.dispose();
        return this;
    }
}

/**
 * A compressor with separate controls over low/mid/high dynamics. See [[Compressor]] and [[MultibandSplit]]
 *
 * @example
 * const multiband = new Tone.MultibandCompressor({
 * 	lowFrequency: 200,
 * 	highFrequency: 1300,
 * 	low: {
 * 		threshold: -12
 * 	}
 * });
 * @category Component
 */
class MultibandCompressor extends ToneAudioNode {
    constructor() {
        super(Object.assign(optionsFromArguments(MultibandCompressor.getDefaults(), arguments)));
        this.name = "MultibandCompressor";
        const options = optionsFromArguments(MultibandCompressor.getDefaults(), arguments);
        this._splitter = this.input = new MultibandSplit({
            context: this.context,
            lowFrequency: options.lowFrequency,
            highFrequency: options.highFrequency
        });
        this.lowFrequency = this._splitter.lowFrequency;
        this.highFrequency = this._splitter.highFrequency;
        this.output = new Gain({ context: this.context });
        this.low = new Compressor(Object.assign(options.low, { context: this.context }));
        this.mid = new Compressor(Object.assign(options.mid, { context: this.context }));
        this.high = new Compressor(Object.assign(options.high, { context: this.context }));
        // connect the compressor
        this._splitter.low.chain(this.low, this.output);
        this._splitter.mid.chain(this.mid, this.output);
        this._splitter.high.chain(this.high, this.output);
        readOnly(this, ["high", "mid", "low", "highFrequency", "lowFrequency"]);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            lowFrequency: 250,
            highFrequency: 2000,
            low: {
                ratio: 6,
                threshold: -30,
                release: 0.25,
                attack: 0.03,
                knee: 10
            },
            mid: {
                ratio: 3,
                threshold: -24,
                release: 0.03,
                attack: 0.02,
                knee: 16
            },
            high: {
                ratio: 3,
                threshold: -24,
                release: 0.03,
                attack: 0.02,
                knee: 16
            },
        });
    }
    dispose() {
        super.dispose();
        this._splitter.dispose();
        this.low.dispose();
        this.mid.dispose();
        this.high.dispose();
        this.output.dispose();
        return this;
    }
}

/**
 * EQ3 provides 3 equalizer bins: Low/Mid/High.
 * @category Component
 */
class EQ3 extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(EQ3.getDefaults(), arguments, ["low", "mid", "high"]));
        this.name = "EQ3";
        /**
         * the output
         */
        this.output = new Gain({ context: this.context });
        this._internalChannels = [];
        const options = optionsFromArguments(EQ3.getDefaults(), arguments, ["low", "mid", "high"]);
        this.input = this._multibandSplit = new MultibandSplit({
            context: this.context,
            highFrequency: options.highFrequency,
            lowFrequency: options.lowFrequency,
        });
        this._lowGain = new Gain({
            context: this.context,
            gain: options.low,
            units: "decibels",
        });
        this._midGain = new Gain({
            context: this.context,
            gain: options.mid,
            units: "decibels",
        });
        this._highGain = new Gain({
            context: this.context,
            gain: options.high,
            units: "decibels",
        });
        this.low = this._lowGain.gain;
        this.mid = this._midGain.gain;
        this.high = this._highGain.gain;
        this.Q = this._multibandSplit.Q;
        this.lowFrequency = this._multibandSplit.lowFrequency;
        this.highFrequency = this._multibandSplit.highFrequency;
        // the frequency bands
        this._multibandSplit.low.chain(this._lowGain, this.output);
        this._multibandSplit.mid.chain(this._midGain, this.output);
        this._multibandSplit.high.chain(this._highGain, this.output);
        readOnly(this, ["low", "mid", "high", "lowFrequency", "highFrequency"]);
        this._internalChannels = [this._multibandSplit];
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            high: 0,
            highFrequency: 2500,
            low: 0,
            lowFrequency: 400,
            mid: 0,
        });
    }
    /**
     * Clean up.
     */
    dispose() {
        super.dispose();
        writable(this, ["low", "mid", "high", "lowFrequency", "highFrequency"]);
        this._multibandSplit.dispose();
        this.lowFrequency.dispose();
        this.highFrequency.dispose();
        this._lowGain.dispose();
        this._midGain.dispose();
        this._highGain.dispose();
        this.low.dispose();
        this.mid.dispose();
        this.high.dispose();
        this.Q.dispose();
        return this;
    }
}

/**
 * Convolver is a wrapper around the Native Web Audio
 * [ConvolverNode](http://webaudio.github.io/web-audio-api/#the-convolvernode-interface).
 * Convolution is useful for reverb and filter emulation. Read more about convolution reverb on
 * [Wikipedia](https://en.wikipedia.org/wiki/Convolution_reverb).
 *
 * @example
 * // initializing the convolver with an impulse response
 * const convolver = new Tone.Convolver("./path/to/ir.wav").toDestination();
 * @category Component
 */
class Convolver extends ToneAudioNode {
    constructor() {
        super(optionsFromArguments(Convolver.getDefaults(), arguments, ["url", "onload"]));
        this.name = "Convolver";
        /**
         * The native ConvolverNode
         */
        this._convolver = this.context.createConvolver();
        const options = optionsFromArguments(Convolver.getDefaults(), arguments, ["url", "onload"]);
        this._buffer = new ToneAudioBuffer(options.url, buffer => {
            this.buffer = buffer;
            options.onload();
        });
        this.input = new Gain({ context: this.context });
        this.output = new Gain({ context: this.context });
        // set if it's already loaded, set it immediately
        if (this._buffer.loaded) {
            this.buffer = this._buffer;
        }
        // initially set normalization
        this.normalize = options.normalize;
        // connect it up
        this.input.chain(this._convolver, this.output);
    }
    static getDefaults() {
        return Object.assign(ToneAudioNode.getDefaults(), {
            normalize: true,
            onload: noOp,
        });
    }
    /**
     * Load an impulse response url as an audio buffer.
     * Decodes the audio asynchronously and invokes
     * the callback once the audio buffer loads.
     * @param url The url of the buffer to load. filetype support depends on the browser.
     */
    load(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.buffer = yield this._buffer.load(url);
        });
    }
    /**
     * The convolver's buffer
     */
    get buffer() {
        if (this._buffer.length) {
            return this._buffer;
        }
        else {
            return null;
        }
    }
    set buffer(buffer) {
        if (buffer) {
            this._buffer.set(buffer);
        }
        // if it's already got a buffer, create a new one
        if (this._convolver.buffer) {
            // disconnect the old one
            this.input.disconnect();
            this._convolver.disconnect();
            // create and connect a new one
            this._convolver = this.context.createConvolver();
            this.input.chain(this._convolver, this.output);
        }
        const buff = this._buffer.get();
        this._convolver.buffer = buff ? buff : null;
    }
    /**
     * The normalize property of the ConvolverNode interface is a boolean that
     * controls whether the impulse response from the buffer will be scaled by
     * an equal-power normalization when the buffer attribute is set, or not.
     */
    get normalize() {
        return this._convolver.normalize;
    }
    set normalize(norm) {
        this._convolver.normalize = norm;
    }
    dispose() {
        super.dispose();
        this._buffer.dispose();
        this._convolver.disconnect();
        return this;
    }
}

export { AMSynth, Abs, Add, Analyser, AutoFilter, AutoPanner, AutoWah, BiquadFilter, BitCrusher, Chebyshev, Chorus, Compressor, Convolver, CrossFade, DCMeter, Delay, Distortion, DuoSynth, EQ3, FFT, FMSynth, FeedbackCombFilter, FeedbackDelay, Filter, Follower, Freeverb, FrequencyEnvelope, FrequencyShifter, GainToAudio, Gate, GrainPlayer, GreaterThan, GreaterThanZero, JCReverb, LFO, Limiter, Loop, LowpassCombFilter, Merge, MetalSynth, Meter, MidSideCompressor, MidSideMerge, MidSideSplit, Mono, MonoSynth, MultibandCompressor, MultibandSplit, Negate, Noise, NoiseSynth, Offline, OnePoleFilter, Panner3D, Part, Pattern, Phaser, PingPongDelay, PitchShift, Players, PluckSynth, PolySynth, Pow, Recorder, Reverb, Scale, ScaleExp, Sequence, Split, StereoWidener, Subtract, SyncedSignal, ToneEvent, Tremolo, Units as Unit, UserMedia, Vibrato, Waveform, Zero };
