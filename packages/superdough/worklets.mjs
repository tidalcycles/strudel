// LICENSE GNU General Public License v3.0 see https://github.com/dktr0/WebDirt/blob/main/LICENSE
// all the credit goes to dktr0's webdirt: https://github.com/dktr0/WebDirt/blob/5ce3d698362c54d6e1b68acc47eb2955ac62c793/dist/AudioWorklets.js
// <3

class CoarseProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'coarse', defaultValue: 1 }];
  }

  constructor() {
    super();
    this.notStarted = true;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const coarse = parameters.coarse;
    const blockSize = 128;
    const hasInput = !(input[0] === undefined);
    if (hasInput) {
      this.notStarted = false;
      output[0][0] = input[0][0];
      for (let n = 1; n < blockSize; n++) {
        for (let o = 0; o < output.length; o++) {
          output[o][n] = n % coarse == 0 ? input[0][n] : output[o][n - 1];
        }
      }
    }
    return this.notStarted || hasInput;
  }
}

registerProcessor('coarse-processor', CoarseProcessor);

class CrushProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'crush', defaultValue: 0 }];
  }

  constructor() {
    super();
    this.notStarted = true;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const crush = parameters.crush;
    const blockSize = 128;
    const hasInput = !(input[0] === undefined);
    if (hasInput) {
      this.notStarted = false;
      if (crush.length === 1) {
        const x = Math.pow(2, crush[0] - 1);
        for (let n = 0; n < blockSize; n++) {
          const value = Math.round(input[0][n] * x) / x;
          for (let o = 0; o < output.length; o++) {
            output[o][n] = value;
          }
        }
      } else {
        for (let n = 0; n < blockSize; n++) {
          let x = Math.pow(2, crush[n] - 1);
          const value = Math.round(input[0][n] * x) / x;
          for (let o = 0; o < output.length; o++) {
            output[o][n] = value;
          }
        }
      }
    }
    return this.notStarted || hasInput;
  }
}
registerProcessor('crush-processor', CrushProcessor);

class ShapeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'shape', defaultValue: 0 }];
  }

  constructor() {
    super();
    this.notStarted = true;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const shape0 = parameters.shape[0];
    const shape1 = shape0 < 1 ? shape0 : 1.0 - 4e-10;
    const shape = (2.0 * shape1) / (1.0 - shape1);
    const blockSize = 128;
    const hasInput = !(input[0] === undefined);
    if (hasInput) {
      this.notStarted = false;
      for (let n = 0; n < blockSize; n++) {
        const value = ((1 + shape) * input[0][n]) / (1 + shape * Math.abs(input[0][n]));
        for (let o = 0; o < output.length; o++) {
          output[o][n] = value;
        }
      }
    }
    return this.notStarted || hasInput;
  }
}

registerProcessor('shape-processor', ShapeProcessor);

// class PhaseProcessor extends AudioWorkletProcessor {
//   static get parameterDescriptors() {
//     return [{ name: 'phaser', defaultValue: 0 }];
//   }

//   constructor() {
//     super();
//     this.notStarted = true;
//   }

//   process(inputs, outputs, parameters) {
//     const input = inputs[0];
//     const output = outputs[0];
//     const phaser0 = parameters.phaser[0];
//     const phaser1 = phaser0 < 1 ? phaser0 : 1.0 - 4e-10;
//     const phaser = (2.0 * phaser1) / (1.0 - phaser1);
//     const blockSize = 128;
//     const hasInput = !(input[0] === undefined);
//     if (hasInput) {
//       this.notStarted = false;
//       for (let n = 0; n < blockSize; n++) {
//         const value = ((1 + phaser) * input[0][n]) / (1 + phaser * Math.abs(input[0][n]));
//         for (let o = 0; o < output.length; o++) {
//           output[o][n] = value;
//         }
//       }
//     }
//     return this.notStarted || hasInput;
//   }
// }

// registerProcessor('phaser-processor', PhaseProcessor);
