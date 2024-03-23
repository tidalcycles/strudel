import { Pattern } from '@strudel/core';

// polar coords -> xy
function fromPolar(angle, radius, cx, cy) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [cx + Math.cos(radians) * radius, cy + Math.sin(radians) * radius];
}

const xyOnSpiral = (angle, margin, cx, cy, rotate = 0) => fromPolar((angle + rotate) * 360, margin * angle, cx, cy); // TODO: logSpiral

// draw spiral / segment of spiral
function spiralSegment(options) {
  let {
    ctx,
    from = 0,
    to = 3,
    margin = 50,
    cx = 100,
    cy = 100,
    rotate = 0,
    thickness = margin / 2,
    color = '#0000ff30',
    cap = 'round',
    stretch = 1,
    fromOpacity = 1,
    toOpacity = 1,
  } = options;
  from *= stretch;
  to *= stretch;
  rotate *= stretch;
  ctx.lineWidth = thickness;
  ctx.lineCap = cap;
  ctx.strokeStyle = color;
  ctx.globalAlpha = fromOpacity;

  ctx.beginPath();
  let [sx, sy] = xyOnSpiral(from, margin, cx, cy, rotate);
  ctx.moveTo(sx, sy);

  const increment = 1 / 60;
  let angle = from;
  while (angle <= to) {
    const [x, y] = xyOnSpiral(angle, margin, cx, cy, rotate);
    //ctx.lineWidth = angle*thickness;
    ctx.globalAlpha = ((angle - from) / (to - from)) * toOpacity;
    ctx.lineTo(x, y);
    angle += increment;
  }
  ctx.stroke();
}

function drawSpiral(options) {
  let {
    stretch = 1,
    size = 80,
    thickness = size / 2,
    cap = 'butt', // round butt squar,
    inset = 3, // start angl,
    playheadColor = '#ffffff',
    playheadLength = 0.02,
    playheadThickness = thickness,
    padding = 0,
    steady = 1,
    inactiveColor = '#ffffff20',
    colorizeInactive = 0,
    fade = true,
    // logSpiral = true,
    ctx,
    time,
    haps,
    drawTime,
    id,
  } = options;

  if (id) {
    haps = haps.filter((hap) => hap.context.id === id);
  }

  const [w, h] = [ctx.canvas.width, ctx.canvas.height];
  ctx.clearRect(0, 0, w * 2, h * 2);
  const [cx, cy] = [w / 2, h / 2];
  const settings = {
    margin: size / stretch,
    cx,
    cy,
    stretch,
    cap,
    thickness,
  };

  const playhead = {
    ...settings,
    thickness: playheadThickness,
    from: inset - playheadLength,
    to: inset,
    color: playheadColor,
  };

  const [min] = drawTime;
  const rotate = steady * time;
  haps.forEach((hap) => {
    const isActive = hap.whole.begin <= time && hap.endClipped > time;
    const from = hap.whole.begin - time + inset;
    const to = hap.endClipped - time + inset - padding;
    const { color } = hap.context;
    const opacity = fade ? 1 - Math.abs((hap.whole.begin - time) / min) : 1;
    spiralSegment({
      ctx,
      ...settings,
      from,
      to,
      rotate,
      color: colorizeInactive || isActive ? color : inactiveColor,
      fromOpacity: opacity,
      toOpacity: opacity,
    });
  });
  spiralSegment({
    ctx,
    ...playhead,
    rotate,
  });
}

Pattern.prototype.spiral = function (options = {}) {
  return this.onPaint((ctx, time, haps, drawTime) => drawSpiral({ ctx, time, haps, drawTime, ...options }));
};
