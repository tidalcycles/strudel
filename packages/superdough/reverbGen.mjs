// Copyright 2014 Alan deLespinasse
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var reverbGen = {};

/** Generates a reverb impulse response.

 @param {!Object} params TODO: Document the properties.
 @param {!function(!AudioBuffer)} callback Function to call when
  the impulse response has been generated. The impulse response
  is passed to this function as its parameter. May be called
  immediately within the current execution context, or later. */
reverbGen.generateReverb = function (params, callback) {
  var audioContext = params.audioContext || new AudioContext();
  var sampleRate = params.sampleRate || 44100;
  var numChannels = params.numChannels || 2;
  // params.decayTime is the -60dB fade time. We let it go 50% longer to get to -90dB.
  var totalTime = params.decayTime * 1.5;
  var decaySampleFrames = Math.round(params.decayTime * sampleRate);
  var numSampleFrames = Math.round(totalTime * sampleRate);
  var fadeInSampleFrames = Math.round((params.fadeInTime || 0) * sampleRate);
  // 60dB is a factor of 1 million in power, or 1000 in amplitude.
  var decayBase = Math.pow(1 / 1000, 1 / decaySampleFrames);
  var reverbIR = audioContext.createBuffer(numChannels, numSampleFrames, sampleRate);
  for (var i = 0; i < numChannels; i++) {
    var chan = reverbIR.getChannelData(i);
    for (var j = 0; j < numSampleFrames; j++) {
      chan[j] = randomSample() * Math.pow(decayBase, j);
    }
    for (var j = 0; j < fadeInSampleFrames; j++) {
      chan[j] *= j / fadeInSampleFrames;
    }
  }

  applyGradualLowpass(reverbIR, params.lpFreqStart || 0, params.lpFreqEnd || 0, params.decayTime, callback);
};

/** Creates a canvas element showing a graph of the given data.

 @param {!Float32Array} data An array of numbers, or a Float32Array.
 @param {number} width Width in pixels of the canvas.
 @param {number} height Height in pixels of the canvas.
 @param {number} min Minimum value of data for the graph (lower edge).
 @param {number} max Maximum value of data in the graph (upper edge).
 @return {!CanvasElement} The generated canvas element. */
reverbGen.generateGraph = function (data, width, height, min, max) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var gc = canvas.getContext('2d');
  gc.fillStyle = '#000';
  gc.fillRect(0, 0, canvas.width, canvas.height);
  gc.fillStyle = '#fff';
  var xscale = width / data.length;
  var yscale = height / (max - min);
  for (var i = 0; i < data.length; i++) {
    gc.fillRect(i * xscale, height - (data[i] - min) * yscale, 1, 1);
  }
  return canvas;
};

/** Saves an AudioBuffer as a 16-bit WAV file on the client's host
 file system. Normalizes it to peak at +-32767, and optionally
 truncates it if there's a lot of "silence" at the end.

 @param {!AudioBuffer} buffer The buffer to save.
 @param {string} name Name of file to create.
 @param {number?} opt_minTail Defines what counts as "silence" for
  auto-truncating the buffer. If there is a point past which every
  value of every channel is less than opt_minTail, then the buffer
  is truncated at that point. This is expressed as an integer,
  applying to the post-normalized and integer-converted
  buffer. The default is 0, meaning don't truncate. */
reverbGen.saveWavFile = function (buffer, name, opt_minTail) {
  var bitsPerSample = 16;
  var bytesPerSample = 2;
  var sampleRate = buffer.sampleRate;
  var numChannels = buffer.numberOfChannels;
  var channels = getAllChannelData(buffer);
  var numSampleFrames = channels[0].length;
  var scale = 32767;
  // Find normalization constant.
  var max = 0;
  for (var i = 0; i < numChannels; i++) {
    for (var j = 0; j < numSampleFrames; j++) {
      max = Math.max(max, Math.abs(channels[i][j]));
    }
  }
  if (max) {
    scale = 32767 / max;
  }
  // Find truncation point.
  if (opt_minTail) {
    var truncateAt = 0;
    for (var i = 0; i < numChannels; i++) {
      for (var j = 0; j < numSampleFrames; j++) {
        var absSample = Math.abs(Math.round(scale * channels[i][j]));
        if (absSample > opt_minTail) {
          truncateAt = j;
        }
      }
    }
    numSampleFrames = truncateAt + 1;
  }
  var sampleDataBytes = bytesPerSample * numChannels * numSampleFrames;
  var fileBytes = sampleDataBytes + 44;
  var arrayBuffer = new ArrayBuffer(fileBytes);
  var dataView = new DataView(arrayBuffer);
  dataView.setUint32(0, 1179011410, true); // "RIFF"
  dataView.setUint32(4, fileBytes - 8, true); // file length
  dataView.setUint32(8, 1163280727, true); // "WAVE"
  dataView.setUint32(12, 544501094, true); // "fmt "
  dataView.setUint32(16, 16, true); // fmt chunk length
  dataView.setUint16(20, 1, true); // PCM format
  dataView.setUint16(22, numChannels, true); // NumChannels
  dataView.setUint32(24, sampleRate, true); // SampleRate
  var bytesPerSampleFrame = numChannels * bytesPerSample;
  dataView.setUint32(28, sampleRate * bytesPerSampleFrame, true); // ByteRate
  dataView.setUint16(32, bytesPerSampleFrame, true); // BlockAlign
  dataView.setUint16(34, bitsPerSample, true); // BitsPerSample
  dataView.setUint32(36, 1635017060, true); // "data"
  dataView.setUint32(40, sampleDataBytes, true);
  for (var j = 0; j < numSampleFrames; j++) {
    for (var i = 0; i < numChannels; i++) {
      dataView.setInt16(44 + j * bytesPerSampleFrame + i * bytesPerSample, Math.round(scale * channels[i][j]), true);
    }
  }
  var blob = new Blob([arrayBuffer], { type: 'audio/wav' });
  var url = window.URL.createObjectURL(blob);
  var linkEl = document.createElement('a');
  linkEl.href = url;
  linkEl.download = name;
  linkEl.style.display = 'none';
  document.body.appendChild(linkEl);
  linkEl.click();
};

/** Applies a constantly changing lowpass filter to the given sound.

 @private
 @param {!AudioBuffer} input
 @param {number} lpFreqStart
 @param {number} lpFreqEnd
 @param {number} lpFreqEndAt
 @param {!function(!AudioBuffer)} callback May be called
  immediately within the current execution context, or later.*/
var applyGradualLowpass = function (input, lpFreqStart, lpFreqEnd, lpFreqEndAt, callback) {
  if (lpFreqStart == 0) {
    callback(input);
    return;
  }
  var channelData = getAllChannelData(input);
  var context = new OfflineAudioContext(input.numberOfChannels, channelData[0].length, input.sampleRate);
  var player = context.createBufferSource();
  player.buffer = input;
  var filter = context.createBiquadFilter();

  lpFreqStart = Math.min(lpFreqStart, input.sampleRate / 2);
  lpFreqEnd = Math.min(lpFreqEnd, input.sampleRate / 2);

  filter.type = 'lowpass';
  filter.Q.value = 0.0001;
  filter.frequency.setValueAtTime(lpFreqStart, 0);
  filter.frequency.linearRampToValueAtTime(lpFreqEnd, lpFreqEndAt);

  player.connect(filter);
  filter.connect(context.destination);
  player.start();
  context.oncomplete = function (event) {
    callback(event.renderedBuffer);
  };
  context.startRendering();

  window.filterNode = filter;
};

/** @private
 @param {!AudioBuffer} buffer
 @return {!Array.<!Float32Array>} An array containing the Float32Array of each channel's samples. */
var getAllChannelData = function (buffer) {
  var channels = [];
  for (var i = 0; i < buffer.numberOfChannels; i++) {
    channels[i] = buffer.getChannelData(i);
  }
  return channels;
};

/** @private
 @return {number} A random number from -1 to 1. */
var randomSample = function () {
  return Math.random() * 2 - 1;
};

export default reverbGen;
