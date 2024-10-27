/*
shader.mjs - implements the `loadShader` function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { PicoGL } from 'picogl';
import { logger } from '@strudel/core';

// The standard fullscreen vertex shader.
const vertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec2 position;
void main() {
  gl_Position = vec4(position, 1, 1);
}
`;

// Make the fragment source, similar to the one from shadertoy.
function mkFragmentShader(code) {
  return `#version 300 es
precision highp float;
out vec4 oColor;
uniform float iTime;
uniform vec2 iResolution;

#define STRUDEL 1

${code}

void main(void) {
  mainImage(oColor, gl_FragCoord.xy);
}
`;
}

// Helper class to handle uniform updates
class UniformValue {
  constructor(name, count, draw) {
    this.name = name;
    this.draw = draw;
    this.isArray = count > 0;
    this.value = new Array(Math.max(1, count)).fill(0);
    this.frameModifier = new Array(Math.max(1, count)).fill(null);
  }

  incr(value, pos = 0) {
    const idx = pos % this.value.length;
    this.value[idx] += value;
    this.frameModifier[idx] = null;
    this.draw();
  }

  set(value, pos = 0) {
    const idx = pos % this.value.length;
    if (typeof value === 'function') {
      this.frameModifier[idx] = value;
    } else {
      this.value[idx] = value;
      this.frameModifier[idx] = null;
    }
    this.draw();
  }

  get(pos = 0) {
    return this.value[pos % this.value.length];
  }

  _frameUpdate(elapsed) {
    this.value = this.value.map((value, idx) =>
      this.frameModifier[idx] ? this.frameModifier[idx](value, elapsed) : value,
    );
    return this.isArray ? this.value : this.value[0];
  }

  _resize(count) {
    if (count != this.count) {
      this.isArray = count > 0;
      count = Math.max(1, count);
      resizeArray(this.value, count, 0);
      resizeArray(this.frameModifier, count, null);
    }
  }
}

// Shrink or extend an array
function resizeArray(arr, size, defval) {
  if (arr.length > size) arr.length = size;
  else arr.push(...new Array(size - arr.length).fill(defval));
}

// Get the size of an uniform
function uniformSize(funcName) {
  if (funcName == 'uniform3fv') return 3;
  else if (funcName == 'uniform4fv') return 4;
  return 1;
}

// Setup the instance's uniform after shader compilation.
function setupUniforms(instance, resetDraw = false) {
  const newUniforms = new Set();
  const draw = () => {
    // Start the drawing loop
    instance.age = 0;
    if (!instance.drawing) {
      instance.drawing = requestAnimationFrame(instance.update);
    }
  };
  Object.entries(instance.program.uniforms).forEach(([name, uniform]) => {
    if (name != 'iTime' && name != 'iResolution') {
      // remove array suffix
      const uname = name.replace('[0]', '');
      newUniforms.add(uname);
      const count = (uniform.count | 0) * uniformSize(uniform.glFuncName);
      if (!instance.uniforms[uname]) instance.uniforms[uname] = new UniformValue(name, count, draw);
      else instance.uniforms[uname]._resize(count);
      if (resetDraw) instance.uniforms[uname].draw = draw;
    }
  });

  // Remove deleted uniforms
  Object.keys(instance.uniforms).forEach((name) => {
    if (!newUniforms.has(name)) delete instance.uniforms[name];
  });
}

// Update the uniforms for a given drawFrame call.
function updateUniforms(drawFrame, elapsed, uniforms) {
  Object.values(uniforms).forEach((uniform) => {
    const value = uniform._frameUpdate(elapsed);

    // Send the value to the GPU
    // console.log('updateUniforms:', uniform.name, value);
    drawFrame.uniform(uniform.name, value);
  });
}

// Setup the canvas and return the WebGL context.
function setupCanvas(name) {
  // TODO: support custom size
  const width = 400;
  const height = 300;
  const canvas = document.createElement('canvas');
  canvas.id = 'cnv-' + name;
  canvas.width = width;
  canvas.height = height;
  const top = 60 + Object.keys(_instances).length * height;
  canvas.style = `pointer-events:none;width:${width}px;height:${height}px;position:fixed;top:${top}px;right:23px`;
  document.body.append(canvas);
  return canvas.getContext('webgl2');
}

// Setup the shader instance
async function initializeShaderInstance(name, code) {
  // Setup PicoGL app
  const ctx = setupCanvas(name);
  const app = PicoGL.createApp(ctx);

  // Setup buffers
  const resolution = new Float32Array([ctx.canvas.width, ctx.canvas.height]);

  // Two triangle to cover the whole canvas
  const positionBuffer = app.createVertexBuffer(
    PicoGL.FLOAT,
    2,
    new Float32Array([-1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1]),
  );

  // Setup the arrays
  const arrays = app.createVertexArray().vertexAttributeBuffer(0, positionBuffer);

  return app
    .createPrograms([vertexShader, code])
    .then(([program]) => {
      const drawFrame = app.createDrawCall(program, arrays);
      const instance = { app, code, program, arrays, drawFrame, uniforms: {} };
      setupUniforms(instance);
      // Render frame logic
      let prev = performance.now() / 1000;
      instance.age = 0;
      instance.update = () => {
        const now = performance.now() / 1000;
        const elapsed = instance.age == 0 ? 1 / 60 : now - prev;
        prev = now;
        // console.log("drawing!")
        app.clear();
        instance.drawFrame.uniform('iResolution', resolution).uniform('iTime', now);

        updateUniforms(instance.drawFrame, elapsed, instance.uniforms);

        instance.drawFrame.draw();
        // After sometime, if no update happened, stop the animation loop
        if (instance.age++ < 100) requestAnimationFrame(instance.update);
        else instance.drawing = false;
      };
      return instance;
    })
    .catch((err) => {
      ctx.canvas.remove();
      throw err;
    });
}

// Update the instance program
async function reloadShaderInstanceCode(instance, code) {
  return instance.app.createPrograms([vertexShader, code]).then(([program]) => {
    instance.program.delete();
    instance.program = program;
    instance.drawFrame = instance.app.createDrawCall(program, instance.arrays);
    setupUniforms(instance, true);
  });
}

// Keep track of the running shader instances
let _instances = {};
export async function loadShader(code = '', name = 'default') {
  if (code) {
    code = mkFragmentShader(code);
  }
  if (!_instances[name]) {
    _instances[name] = await initializeShaderInstance(name, code);
    logger('[shader] ready');
  } else if (_instances[name].code != code) {
    await reloadShaderInstanceCode(_instances[name], code);
    logger('[shader] reloaded');
  }
  return _instances[name];
}
