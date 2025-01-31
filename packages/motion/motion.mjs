// motion.mjs

import { signal } from '../core/signal.mjs';

/**
 *  The accelerometer's x-axis value ranges from 0 to 1.
 * @name accelerationX
 * @return {Pattern}
 * @synonyms accX
 * @example
 * n(accelerationX.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The accelerometer's y-axis value ranges from 0 to 1.
 * @name accelerationY
 * @return {Pattern}
 * @synonyms accY
 * @example
 * n(accelerationY.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The accelerometer's z-axis value ranges from 0 to 1.
 * @name accelerationZ
 * @return {Pattern}
 * @synonyms accZ
 * @example
 * n(accelerationZ.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's gravity x-axis value ranges from 0 to 1.
 * @name gravityX
 * @return {Pattern}
 * @synonyms gravX
 * @example
 * n(gravityX.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's gravity y-axis value ranges from 0 to 1.
 * @name gravityY
 * @return {Pattern}
 * @synonyms gravY
 * @example
 * n(gravityY.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's gravity z-axis value ranges from 0 to 1.
 * @name gravityZ
 * @return {Pattern}
 * @synonyms gravZ
 * @example
 * n(gravityZ.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's rotation around the alpha-axis value ranges from 0 to 1.
 * @name rotationAlpha
 * @return {Pattern}
 * @synonyms rotA, rotZ, rotationZ
 * @example
 * n(rotationAlpha.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's rotation around the beta-axis value ranges from 0 to 1.
 * @name rotationBeta
 * @return {Pattern}
 * @synonyms rotB, rotX, rotationX
 * @example
 * n(rotationBeta.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's rotation around the gamma-axis value ranges from 0 to 1.
 * @name rotationGamma
 * @return {Pattern}
 * @synonyms rotG, rotY, rotationY
 * @example
 * n(rotationGamma.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's orientation alpha value ranges from 0 to 1.
 * @name orientationAlpha
 * @return {Pattern}
 * @synonyms oriA, oriZ, orientationZ
 * @example
 * n(orientationAlpha.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's orientation beta value ranges from 0 to 1.
 * @name orientationBeta
 * @return {Pattern}
 * @synonyms oriB, oriX, orientationX
 * @example
 * n(orientationBeta.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's orientation gamma value ranges from 0 to 1.
 * @name orientationGamma
 * @return {Pattern}
 * @synonyms oriG, oriY, orientationY
 * @example
 * n(orientationGamma.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's absolute orientation alpha value ranges from 0 to 1.
 * @name absoluteOrientationAlpha
 * @return {Pattern}
 * @synonyms absOriA, absOriZ, absoluteOrientationZ
 * @example
 * n(absoluteOrientationAlpha.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's absolute orientation beta value ranges from 0 to 1.
 * @name absoluteOrientationBeta
 * @return {Pattern}
 * @synonyms absOriB, absOriX, absoluteOrientationX
 * @example
 * n(absoluteOrientationBeta.segment(4).range(0,7)).scale("C:minor")
 *
 */

/**
 *  The device's absolute orientation gamma value ranges from 0 to 1.
 * @name absoluteOrientationGamma
 * @return {Pattern}
 * @synonyms absOriG, absOriY, absoluteOrientationY
 * @example
 * n(absoluteOrientationGamma.segment(4).range(0,7)).scale("C:minor")
 *
 */

class DeviceMotionHandler {
  constructor() {
    this.GRAVITY = 9.81;

    // Initialize sensor values
    this._acceleration = {
      x: 0,
      y: 0,
      z: 0,
    };

    this._gravity = {
      x: 0,
      y: 0,
      z: 0,
    };

    this._rotation = {
      alpha: 0,
      beta: 0,
      gamma: 0,
    };

    this._orientation = {
      alpha: 0,
      beta: 0,
      gamma: 0,
    };

    this._absoluteOrientation = {
      alpha: 0,
      beta: 0,
      gamma: 0,
    };

    this._permissionStatus = 'unknown';
  }

  async requestPermissions() {
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        // iOS requires explicit permission
        const motionPermission = await DeviceMotionEvent.requestPermission();
        const orientationPermission = await DeviceOrientationEvent.requestPermission();

        this._permissionStatus =
          motionPermission === 'granted' && orientationPermission === 'granted' ? 'granted' : 'denied';
        this.setupEventListeners();
      } catch (error) {
        console.error('Permission request failed:', error);
        this._permissionStatus = 'denied';
      }
    } else {
      this._permissionStatus = 'granted';
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    if (this._permissionStatus === 'granted') {
      // Device Motion handler
      window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this), true);
      window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), true);
      window.addEventListener('deviceorientationabsolute', this.handleAbsoluteDeviceOrientation.bind(this), true);
    }
  }

  handleDeviceMotion(event) {
    //console.log(event);
    if (event.acceleration) {
      // Normalize acceleration values to 0-1 range
      this._acceleration.x = (event.acceleration.x + 1) / 2;
      this._acceleration.y = (event.acceleration.y + 1) / 2;
      this._acceleration.z = (event.acceleration.z + 1) / 2;
    }

    if (event.accelerationIncludingGravity) {
      // Normalize acceleration values to 0-1 range
      this._gravity.x = (event.accelerationIncludingGravity.x + this.GRAVITY) / (2 * this.GRAVITY);
      this._gravity.y = (event.accelerationIncludingGravity.y + this.GRAVITY) / (2 * this.GRAVITY);
      this._gravity.z = (event.accelerationIncludingGravity.z + this.GRAVITY) / (2 * this.GRAVITY);
    }

    if (event.rotationRate) {
      // Normalize rotation values to 0-1 range
      this._rotation.alpha = (event.rotationRate.alpha + 180) / 360;
      this._rotation.beta = (event.rotationRate.beta + 180) / 360;
      this._rotation.gamma = (event.rotationRate.gamma + 180) / 360;
    }
  }

  handleDeviceOrientation(event) {
    this._orientation.alpha = event.alpha / 360; //a(0~360)
    this._orientation.beta = (event.beta + 180) / 360; //b(-180~180)
    this._orientation.gamma = (event.gamma + 90) / 180; //g(-90~90)
  }

  handleAbsoluteDeviceOrientation(event) {
    this._absoluteOrientation.alpha = event.alpha / 360; //a(0~360)
    this._absoluteOrientation.beta = (event.beta + 180) / 360; //b(-180~180)
    this._absoluteOrientation.gamma = (event.gamma + 90) / 180; //g(-90~90)
  }

  // Getter methods for current values
  getAcceleration() {
    return this._acceleration;
  }
  getGravity() {
    return this._gravity;
  }
  getRotation() {
    return this._rotation;
  }
  getOrientation() {
    return this._orientation;
  }
  getAbsoluteOrientation() {
    return this._absoluteOrientation;
  }
}

// Create singleton instance
const deviceMotion = new DeviceMotionHandler();

// Export a function to request permission
export async function enableMotion() {
  return deviceMotion.requestPermissions();
}

// Create signals for acceleration
export const accelerationX = signal(() => deviceMotion.getAcceleration().x);
export const accelerationY = signal(() => deviceMotion.getAcceleration().y);
export const accelerationZ = signal(() => deviceMotion.getAcceleration().z);

// Aliases for shorter names
export const accX = accelerationX;
export const accY = accelerationY;
export const accZ = accelerationZ;

// Create signals for gravity
export const gravityX = signal(() => deviceMotion.getGravity().x);
export const gravityY = signal(() => deviceMotion.getGravity().y);
export const gravityZ = signal(() => deviceMotion.getGravity().z);

// Aliases for shorter names
export const gravX = gravityX;
export const gravY = gravityY;
export const gravZ = gravityZ;

// Create signals for orientation
export const orientationAlpha = signal(() => deviceMotion.getOrientation().alpha);
export const orientationBeta = signal(() => deviceMotion.getOrientation().beta);
export const orientationGamma = signal(() => deviceMotion.getOrientation().gamma);
// Aliases for shorter names
export const orientationA = orientationAlpha;
export const orientationB = orientationBeta;
export const orientationG = orientationGamma;

// Aliases mapping to X,Y,Z coordinates
export const orientationX = orientationBeta;
export const orientationY = orientationGamma;
export const orientationZ = orientationAlpha;

// Short aliases for A,B,G,X,Y,Z

export const oriA = orientationAlpha;
export const oriB = orientationBeta;
export const oriG = orientationGamma;

export const oriX = orientationX;
export const oriY = orientationY;
export const oriZ = orientationZ;

// Create signals for absolute orientation
export const absoluteOrientationAlpha = signal(() => deviceMotion.getAbsoluteOrientation().alpha);
export const absoluteOrientationBeta = signal(() => deviceMotion.getAbsoluteOrientation().beta);
export const absoluteOrientationGamma = signal(() => deviceMotion.getAbsoluteOrientation().gamma);

// Aliases for shorter names
export const absOriA = absoluteOrientationAlpha;
export const absOriB = absoluteOrientationBeta;
export const absOriG = absoluteOrientationGamma;

// Aliases mapping to X,Y,Z coordinates
export const absoluteOrientationX = absoluteOrientationBeta;
export const absoluteOrientationY = absoluteOrientationGamma;
export const absoluteOrientationZ = absoluteOrientationAlpha;

// Short aliases for X,Y,Z
export const absOriX = absoluteOrientationX;
export const absOriY = absoluteOrientationY;
export const absOriZ = absoluteOrientationZ;

// Create signals for rotation
export const rotationAlpha = signal(() => deviceMotion.getRotation().alpha);
export const rotationBeta = signal(() => deviceMotion.getRotation().beta);
export const rotationGamma = signal(() => deviceMotion.getRotation().gamma);
export const rotationX = rotationBeta;
export const rotationY = rotationGamma;
export const rotationZ = rotationAlpha;

// Aliases for shorter names
export const rotA = rotationAlpha;
export const rotB = rotationBeta;
export const rotG = rotationGamma;
export const rotX = rotationX;
export const rotY = rotationY;
export const rotZ = rotationZ;

// // Bipolar versions (ranging from -1 to 1 instead of 0 to 1)
// export const accX2 = accX.toBipolar();
// export const accY2 = accY.toBipolar();
// export const accZ2 = accZ.toBipolar();

// export const rotA2 = rotA.toBipolar();
// export const rotB2 = rotB.toBipolar();
// export const rotG2 = rotG.toBipolar();
