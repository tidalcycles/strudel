/*
shader.mjs - implements the `loadShader` helper and `shader` pattern function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { PicoGL } from "picogl";
import { register, logger } from '@strudel/core';

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

${code}

void main(void) {
  mainImage(oColor, gl_FragCoord.xy);
}
`
}

// Modulation helpers.
const hardModulation = () => {
  let val = 0;
  return {
    get: () => val,
    set: (v) => { val = v },
  }
}

const decayModulation = (decay) => {
  let val = 0;
  let desired = 0
  return {
    get: (ts) => {
      val += (desired - val) / decay
      return val
    },
    set: (v) => { desired = val + v },
  }
}

// Set an uniform value (from a pattern).
function setUniform(instance, name, value, position) {
  const uniform = instance.uniforms[name]
  if (uniform) {
    if (uniform.count == 0) {
      // This is a single value
      uniform.mod.set(value)
    } else {
      // This is an array
      const idx = position % uniform.mod.length
      uniform.mod[idx].set(value)
    }
  } else {
    logger('[shader] unknown uniform: ' + name)
  }

  // Ensure the instance is drawn
  instance.age = 0
  if (!instance.drawing) {
    instance.drawing = requestAnimationFrame(instance.update)
  }
}

// Update the uniforms for a given drawFrame call.
function updateUniforms(drawFrame, elapsed, uniforms) {
  Object.values(uniforms).forEach((uniform) => {
    const value = uniform.count == 0
          ? uniform.mod.get(elapsed)
          : uniform.value.map((_, i) => uniform.mod[i].get(elapsed))
    // Send the value to the GPU
    drawFrame.uniform(uniform.name, value)
  })
}

// Setup the instance's uniform after shader compilation.
function setupUniforms(uniforms, program) {
  Object.entries(program.uniforms).forEach(([name, uniform]) => {
    if (name != "iTime" && name != "iResolution") {
      // remove array suffix
      const uname = name.replace("[0]", "")
      const count = uniform.count | 0
      if (!uniforms[uname] || uniforms[uname].count != count) {
        // TODO: keep the previous value when the count change...
        uniforms[uname] = {
          name,
          count,
          value: count == 0 ? 0 : new Float32Array(count),
          mod: count == 0 ? decayModulation(50) : new Array(count).fill().map(() => decayModulation(50))
        }
      }
    }
  })
  // TODO: remove previous uniform that are no longer used...
  return uniforms
}

// Setup the canvas and return the WebGL context.
function setupCanvas(name) {
  // TODO: support custom size
  const width = 400; const height = 300;
  const canvas = document.createElement('canvas');
  canvas.id = "cnv-" + name
  canvas.width = width
  canvas.height = height
  const top = 60 + Object.keys(_instances).length * height
  canvas.style = `pointer-events:none;width:${width}px;height:${height}px;position:fixed;top:${top}px;right:23px`;
  document.body.append(canvas)
  return canvas.getContext("webgl2")
}

// Setup the shader instance
async function initializeShaderInstance(name, code) {
  // Setup PicoGL app
  const ctx = setupCanvas(name)
  console.log(ctx)
  const app = PicoGL.createApp(ctx);
  app.resize(400, 300)

  // Setup buffers
  const resolution = new Float32Array([ctx.canvas.width, ctx.canvas.height])

  // Two triangle to cover the whole canvas
  const positionBuffer = app.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
    -1, -1, -1,  1,  1,  1,
     1,  1,  1, -1, -1, -1,
  ]))

  // Setup the arrays
  const arrays = app.createVertexArray().vertexAttributeBuffer(0, positionBuffer);

  return app.createPrograms([vertexShader, code]).then(([program]) => {
    const drawFrame = app.createDrawCall(program, arrays)
    const instance = {app, code, program, arrays, drawFrame, uniforms: setupUniforms({}, program)}

    // Render frame logic
    let prev = performance.now() / 1000;
    instance.age = 0
    instance.update = () => {
      const now = performance.now() / 1000;
      const elapsed = now - prev
      prev = now
      // console.log("drawing!")
      app.clear()
      instance.drawFrame
        .uniform("iResolution", resolution)
        .uniform("iTime", now)

      updateUniforms(instance.drawFrame, elapsed, instance.uniforms)

      instance.drawFrame.draw()
      if (instance.age++ < 100)
        requestAnimationFrame(instance.update)
      else
        instance.drawing = false
    }
    return instance
  }).catch((err) => {
    ctx.canvas.remove()
    throw err
  })
}

// Update the instance program
async function reloadShaderInstanceCode(instance, code) {
  return instance.app.createPrograms([vertexShader, code]).then(([program]) => {
    instance.program.delete()
    instance.program = program
    instance.uniforms = setupUniforms(instance.uniforms, program)
    instance.draw = instance.app.createDrawCall(program, instance.arrays)
  })
}

// Keep track of the running shader instances
let _instances = {}
export async function loadShader(code = '', name = 'default') {
  if (code) {
    code = mkFragmentShader(code)
  }
  if (!_instances[name]) {
    _instances[name] = await initializeShaderInstance(name, code)
    logger('[shader] ready')
  } else if (_instances[name].code != code) {
    await reloadShaderInstanceCode(_instances[name], code)
    logger('[shader] reloaded')
  }
}

export const shader = register('shader', (options, pat) => {
  // Keep track of the pitches value: Map String Int
  const pitches = {_count: 0};

  return pat.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    const instance = _instances[options.instance || "default"]
    if (!instance) {
      logger('[shader] not loaded yet', 'warning')
      return
    }

    const value = options.gain || 1.0;
    if (options.pitch !== undefined) {
      const note = hap.value.note || hap.value.s;
      if (pitches[note] === undefined) {
        // Assign new value, the first note gets 0, then 1, then 2, ...
        pitches[note] = Object.keys(pitches).length
      }
      setUniform(instance, options.pitch, value, pitches[note])
    } else if (options.seq !== undefined) {
      setUniform(instance, options.seq, value, pitches._count++)
    } else if (options.uniform !== undefined) {
      setUniform(instance, options.uniform, value)
    } else {
      console.error("Unknown shader options, need either pitch or uniform", options)
    }
  }, false)
})
