export const lightflower = `Pattern.prototype.nest = function(n, cycles) {
  n = reify(n)
  return this.echo(n, pure(cycles).div(n), 1)
}

Pattern.prototype.deepimpose = function(func, times) {
  if(times===0) return this;
  return this.superimpose(x=>func(x).deepimpose(func, times-1))
}

angle(saw)
  .fill('#aaffee12')
  .r(.18)
  .w(.06)
  .h(.06)
  .deepimpose(x=>x.mul(r(2).w(2).h(2)).late(1/12), 3)
  .nest(6, 1)
  .s('ellipse')
  .mul(w(sine).h(sine).range(.5,1.25))
  .off(.5, x=>x.fill('#ffeeaa12').rev().div(r(1.2)))
  .slow(16)
  .smear(0.6)
  .animate({smear:0})
`;

// https://strudel.cc/?C31_NrcMfZEO
export const spiralflower = `let {innerWidth:ww,innerHeight:wh} = window;
ww*=window.devicePixelRatio;
wh*=window.devicePixelRatio;
const ctx = getDrawContext()
const piDiv180 = Math.PI / 180;
function fromPolar(angle, radius, cx, cy) {
  const radians = (angle-90) * piDiv180
  return [cx + Math.cos(radians) * radius, cy + Math.sin(radians) * radius]
}
const [w, h] = [200,200]
const [cx,cy] = [ww/2,wh/2];
function drawSpiralSegment(ctx, {angle,b,r, density = 2, color = 'darkseagreen', thick = 2, long = 1}) {
  let i = angle;
  ctx.beginPath();
  while(i < b){
    const radius = Math.max(Math.min(r - i*.2,1000),20);
    const [x1,y1] = fromPolar(i, radius, cx, cy)
    const [x2,y2] = fromPolar(i, radius+long, cx, cy)
    ctx.lineWidth = thick;
    ctx.moveTo(x1,y1);
    ctx.strokeStyle= color
    ctx.lineTo(x2,y2);
    ctx.stroke()
    i+=300/density;
  }
}
const { r, angle, b, color, density,thick} = 
  createParams('r', 'angle', 'b', 'color','density','thick','long');


const pattern = 
  r(sine.range(200,800).slow(4))
  .angle(cosine.range(0, 45).slow(3))
  .b(perlin.range(1000, 4000).slow(5))
  .thick(sine.range(2,50).slow(2))
  .long(perlin.range(1,100).slow(3))
  .off(1, x=>x.color('white'))
  .off(2, x=>x.color('salmon'))
  .off(4, x=>x.color('purple'))
  .slow(4)//.mask("x(5,8)")


function onDraw(f) {  
  ctx.beginPath();
  drawSpiralSegment(ctx, f.value);
}


// generic draw logic
window.frame && cancelAnimationFrame(window.frame);

function render(t) {
  t = Math.round(t)
  const frame = pattern.slow(1000).queryArc(t, t)
  ctx.fillStyle='#20001005'
  ctx.fillRect(0,0,ww,wh)
  //ctx.clearRect(0,0,ww,wh)
  ctx.stroke()
  frame.forEach(onDraw)
  window.frame = requestAnimationFrame(render);
};

window.frame = requestAnimationFrame(render);

silence
`;

export const syncexample = `"<0 1 2 3>/2"
.off(1/2, add(4))
.off(1, add(2))
.scale(cat('C minor','C major').slow(8))
.layer(
  x=>x.note().piano(),
  p=>stack(
    p
    .angle(p.sub('c3').div(12))
    .r(.5)
    .s('ellipse')
    .w(.1)
    .h(.1),
    p.x(p.sub('c3').div(12))
    .y(.9)
    .w(1/12)
    .h(.1)
    .s('rect')
  ).animate({sync:true,smear:0.9})
)
`;

export const moveRescaleZoom = `
const rescale = register('rescale', function (f, pat) {
  return pat.mul(x(f).w(f).y(f).h(f));
})

const move = register('move', function (dx, dy, pat) {
  return pat.add(x(dx).y(dy));
})

const zoom = register('zoom', function (f, pat) {
  const d = pure(1).sub(f).div(2);
  return pat.rescale(f).move(d, d);
})

x(.5).y(.5).w(1).h(1)
  .zoom(saw.slow(3))
  .move(sine.range(-.1,.1),0)
  .fill("#ffeeaa10")
  .s('rect')
  .echo(6,.5,1)
  .animate({smear:0.5})`;

export const strudelS = `
const rescale = register('rescale', function (f, pat) {
  return pat.mul(x(f).w(f).y(f).h(f));
})

const move = register('move', function (dx, dy, pat) {
  return pat.add(x(dx).y(dy));
})

const flipY = register('flipY', function (pat) {
  return pat.fmap(v => ({...v, y:1-v.y}))
})

const zoom = register('zoom', function (f, pat) {
  const d = pure(1).sub(f).div(2);
  return pat.rescale(f).move(d, d);
})

Pattern.prototype.nest = function(n, cycles) {
  n = reify(n)
  return this.echo(n, pure(cycles).div(n), 1)
}

x(sine.div(1)).y(cosine.range(0,.5))
  .w(.1).h(.1)
  .mul(w(square).h(square).slow(8))
  .zoom(saw.slow(8))
  .layer(
    id,
    _=>_.flipY().move(0,0).rev()
  )
  .mask("0 1@2").rev()
  .nest(16,9)
  .s('rect')
  .fill("royalblue steelblue".fast(14))
  .slow(8)
  .animate({smear:.99})`;
