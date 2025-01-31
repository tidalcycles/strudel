# @strudel/motion

This package adds device motion sensing functionality to strudel Patterns.

## Install

```sh
npm i @strudel/motion --save
```

## Usage

| Motion  | Long Names & Aliases | Description |
|----------------------------|-----------------------------------------------------------|------------------------------------------|
| Acceleration | accelerationX (accX), accelerationY (accY), accelerationZ (accZ) | X, Y, Z-axis acceleration values |
| Gravity | gravityX (gravX), gravityY (gravY), gravityZ (gravZ) | X, Y, Z-axis gravity values |
| Rotation | rotationAlpha (rotA, rotZ), rotationBeta (rotB, rotX), rotationGamma (rotG, rotY) | Rotation around alpha, beta, gamma axes and mapped to X, Y, Z  |
| Orientation | orientationAlpha (oriA, oriZ), orientationBeta (oriB, oriX), orientationGamma (oriG, oriY) | Orientation alpha, beta, gamma values and mapped to X, Y, Z  |
| Absolute Orientation | absoluteOrientationAlpha (absOriA, absOriZ), absoluteOrientationBeta (absOriB, absOriX), absoluteOrientationGamma (absOriG, absOriY) | Absolute orientation alpha, beta, gamma values and mapped to X, Y, Z |

## Example

```js
enableMotion() //enable DeviceMotion 

setcpm(200/4)

$_: accX.segment(16).gain().log()

$:n("0 1 3 1 5 4")
  .scale("Bb:lydian")
  .sometimesBy(0.5,sub(note(12)))
  .lpf(gravityY.range(20,1000))
  .lpq(gravityZ.range(1,30))
  .lpenv(gravityX.range(2,2))
  .gain(oriX.range(0.2,0.8))
  .room(oriZ.range(0,0.5))
  .attack(oriY.range(0,0.3))
  .delay(rotG.range(0,1))
  .decay(rotA.range(0,1))
  .attack(rotB.range(0,0.1))
  .sound("sawtooth")
```

## Setup SSL for Local Development

`DeviceMotionEvent` only works with HTTPS, so you'll need to enable SSL for local development.
Try installing an SSL plugin for Vite.

```sh
cd website
pnpm install -D @vitejs/plugin-basic-ssl
```

add the basicSsl plugin to the defineConfig block in `strudel/website/astro.config.mjs`

```js
vite: {
  plugins: [basicSsl()],
  server: {
    host: '0.0.0.0', // Ensures it binds to all network interfaces
    // https: { 
    //   key: '../../key.pem', //
    //   cert: '../../cert.pem',
    // },
  },
},
```

generate an SSL certificate to avoid security warnings.

`openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -keyout key.pem -out cert.pem`
