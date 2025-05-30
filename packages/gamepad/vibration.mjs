// Gamepad Vibration Controls

import { registerControl, register, logger, isPattern } from '@strudel/core';
import { Pattern } from '@strudel/core';

/**
 * Controls the strong motor intensity for gamepad vibration.
 *
 * @name vibStrong
 * @param {number | Pattern} intensity between 0 and 1
 * @synonyms vibS
 * @example
 * s("bd hh sd hh").vibStrong("1 0 0.5 0").vibrate(0)
 */
export const { vibStrong, vibS } = registerControl('vibStrong', 'vibS');

/**
 * Controls the weak motor intensity for gamepad vibration.
 *
 * @name vibWeak
 * @param {number | Pattern} intensity between 0 and 1
 * @synonyms vibW
 * @example
 * s("bd hh sd hh").vibWeak("0.5 0 0.8 0").vibrate(0)
 */
export const { vibWeak, vibW } = registerControl('vibWeak', 'vibW');

/**
 * Controls the duration of gamepad vibration in milliseconds.
 *
 * @name vibDuration
 * @param {number | Pattern} duration in milliseconds
 * @synonyms vibDur
 * @example
 * s("bd hh sd hh").vibDuration("200 0 100 0").vibrate(0)
 */
export const { vibDuration, vibDur } = registerControl('vibDuration', 'vibDur');

/**
 * Enables or disables gamepad vibration for individual events.
 *
 * @name vibEnable
 * @param {number | Pattern} enable 1 to enable, 0 to disable
 * @synonyms vibE
 * @example
 * s("bd hh sd hh").vibEnable("1 0 1 0").vibrate(0)
 */
export const { vibEnable, vibEn } = registerControl('vibEnable', 'vibEn');

/**
 * Sets the gamepad index for vibration events.
 *
 * @name vibGamepadIndex
 * @param {number | Pattern} index gamepad index (0-3)
 * @synonyms vibGpId, vibGamepadIndex, vibGamepadId
 * @example
 * s("bd hh sd hh").vibGamepadIndex("0 1 0 1").vibrate()
 */
export const { vibGamepadIndex, vibGpId, vibGamepadId } = registerControl('vibGamepadIndex', 'vibGpId', 'vibGamepadId');

/**
 * Sets both strong and weak vibration intensity at once.
 *
 * @name vibIntensity
 * @param {number | Pattern} intensity between 0 and 1, applied to both motors
 * @example
 * s("bd*4").vibIntensity(sine.slow(2).range(0, 1)).vibrate(0)
 */
export const vibIntensity = register('vibIntensity', (intensity, pat) => {
  return pat.vibStrong(intensity).vibWeak(intensity);
});

export const vibrationSupported = (index) => {
  const gamepad = navigator.getGamepads()[index];
  return gamepad?.vibrationActuator?.type === 'dual-rumble';
};

export const getGamepadVibrationActuator = (index) => {
  const gamepad = navigator.getGamepads()[index];
  if (!gamepad) {
    throw new Error(`[gamepad] gamepad at index ${index} not found`);
  }
  if (!gamepad.vibrationActuator) {
    throw new Error(`[gamepad] gamepad at index ${index} does not support vibration`);
  }
  return gamepad.vibrationActuator;
};

// Default vibration latency in milliseconds
const DEFAULT_VIBRATION_LATENCY = 10;

/**
 * Parses vibration string format "id:strong:weak:duration"
 * @param {string} vibString - The vibration string to parse
 * @returns {object} Parsed vibration parameters
 */
function parseVibrationString(vibString) {
  if (typeof vibString !== 'string') {
    return null;
  }

  const parts = vibString.split(':');
  if (parts.length < 1) {
    return null;
  }

  const [id, strong, weak, duration] = parts;

  return {
    vibGamepadIndex: parseInt(id) || 0,
    vibStrong: parseFloat(strong) || 0.8,
    vibWeak: parseFloat(weak) || 0.4,
    vibDuration: parseInt(duration) || 100,
    vibEnable: 1,
  };
}

/**
 * Sends vibration commands to a gamepad based on pattern events.
 *
 * @name vibrate
 * @memberof Pattern
 * @param {number | string | Pattern} gamepadIndex - Index of the gamepad to vibrate (0-3), can be patterned, or vibration string
 * @param {object} options - Default vibration options
 * @param {number} options.strong - Default strong motor intensity (0-1)
 * @param {number} options.weak - Default weak motor intensity (0-1)
 * @param {number} options.duration - Default duration in milliseconds
 * @param {number} options.latency - Latency compensation in milliseconds
 * @returns {Pattern}
 * @example
 * // Basic vibration on beat
 * s("bd hh sd hh").vibrate(0)
 *
 * @example
 * // Using hap values for vibration control
 * s("<bd hh sd hh>").vibStrong("<1 0.1 0.5 0>").vibWeak("<0.5 0 0.8 0>").vibrate(0)
 *
 * @example
 * // With default options
 * s("bd*4").vibrate(0, { strong: 1, weak: 0.5, duration: 100 })
 *
 * @example
 * // Using gamepad input to control vibration
 * let gp = gamepad(0);
 * note("c a f e").gain(gp.a).vibrate(0, { strong: gp.x1, duration: 200 })
 *
 * @example
 * // Patternable gamepad index - alternate between gamepads
 * s("bd hh sd hh").vibrate("<0 1 0 1>")
 *
 * @example
 * // Complex gamepad switching pattern
 * s("bd*8").vibrate("0 1 0 [1 0] 1 0 1 0")
 *
 * @example
 * // Using control parameter for gamepad index
 * s("bd hh sd hh").vibGamepad("<0 1 0 1>").vibrate()
 *
 * @example
 * // Assignable vibration syntax: "id:strong:weak:duration"
 * s("bd hh sd hh").vibrate("0:1:0.5:200 1:0.8:0.3:150")
 *
 * @example
 * // Complex assignable patterns
 * s("bd*8").vibrate("0:0.2:0.4:100 0:0.2:1:100 1:1:0.5:200 1:0.5:1:150")
 */

export const { vibrate } = registerControl(['vibGamepad', 'vibStrong', 'vibWeak', 'vibDuration']);

Pattern.prototype.vibrate = function (gamepadIndex, options = {}) {
  // Default options
  const defaultOptions = {
    strong: 0.8,
    weak: 0.4,
    duration: 100,
    latency: DEFAULT_VIBRATION_LATENCY,
    ...options,
  };

  // If gamepadIndex is a pattern, handle it based on its content
  if (isPattern(gamepadIndex)) {
    return this.set(
      gamepadIndex.fmap((value) => {
        // Simple gamepad index pattern
        return { vibGamepadIndex: value };
      }),
    ).onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
      return vibrateHandler(hap, currentTime, cps, targetTime, defaultOptions);
    }, false);
  }

  // If gamepadIndex is provided as static value, use it directly
  // If undefined, will be handled in vibrateHandler (using vibGamepad control or default 0)
  return this.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    return vibrateHandler(hap, currentTime, cps, targetTime, defaultOptions, gamepadIndex);
  }, false);
};

// Helper function to handle the actual vibration logic
function vibrateHandler(hap, currentTime, cps, targetTime, defaultOptions, staticGamepadIndex = null) {
  try {
    // Determine gamepad index - from hap value or static parameter
    let gamepadIndex;
    if (staticGamepadIndex !== null && staticGamepadIndex !== undefined) {
      gamepadIndex = staticGamepadIndex;
    } else if (typeof hap.value === 'object' && ('vibGamepadIndex' in hap.value || 'vibGamepad' in hap.value)) {
      const vibGamepadValue = hap.value.vibGamepadIndex;
      gamepadIndex = Array.isArray(vibGamepadValue) ? vibGamepadValue[0] : vibGamepadValue;
    } else {
      gamepadIndex = 0; // fallback default
    }

    // Validate gamepad index
    gamepadIndex = Math.max(0, Math.min(3, Math.floor(Number(gamepadIndex) || 0)));

    // Check if vibration is supported
    if (!vibrationSupported(gamepadIndex)) {
      logger(`[gamepad] vibration not supported on gamepad ${gamepadIndex}`, 'warning');
      return;
    }

    const vibrationActuator = getGamepadVibrationActuator(gamepadIndex);

    // Extract vibration parameters from hap value or use defaults
    let vibStrong, vibWeak, vibDuration, vibEnable;

    if (typeof hap.value === 'object') {
      const vibGamepadValue = hap.value.vibGamepadIndex;

      // Handle array format: [index, strong, weak, duration]
      if (Array.isArray(vibGamepadValue)) {
        vibStrong = vibGamepadValue[1] !== undefined ? vibGamepadValue[1] : defaultOptions.strong;
        vibWeak = vibGamepadValue[2] !== undefined ? vibGamepadValue[2] : defaultOptions.weak;
        vibDuration = vibGamepadValue[3] !== undefined ? vibGamepadValue[3] : defaultOptions.duration;
        vibEnable = 1;
      } else {
        // Regular object destructuring for non-array values
        ({
          vibStrong = defaultOptions.strong,
          vibWeak = defaultOptions.weak,
          vibDuration = defaultOptions.duration,
          vibEnable = 1,
        } = hap.value);
      }
    } else {
      // If hap.value is a primitive, use it as vibEnable (0 = off, 1 = on)
      vibEnable = hap.value;
      vibStrong = defaultOptions.strong;
      vibWeak = defaultOptions.weak;
      vibDuration = defaultOptions.duration;
    }

    // Skip vibration if disabled
    if (!vibEnable || vibEnable === 0) {
      return;
    }

    // Validate parameters
    vibStrong = Math.max(0, Math.min(1, Number(vibStrong) || 0));
    vibWeak = Math.max(0, Math.min(1, Number(vibWeak) || 0));
    vibDuration = Math.max(0, Number(vibDuration) || defaultOptions.duration);

    // Calculate timing offset
    const offset = (targetTime - currentTime + defaultOptions.latency / 1000) * 1000;

    // Schedule vibration
    window.setTimeout(
      () => {
        try {
          vibrationActuator
            .playEffect('dual-rumble', {
              duration: vibDuration,
              strongMagnitude: vibStrong,
              weakMagnitude: vibWeak,
            })
            .catch((err) => {
              logger(`[gamepad] vibration failed: ${err.message}`, 'warning');
            });
        } catch (err) {
          logger(`[gamepad] vibration error: ${err.message}`, 'warning');
        }
      },
      Math.max(0, offset),
    );
  } catch (err) {
    logger(`[gamepad] vibration setup failed: ${err.message}`, 'warning');
  }
}
