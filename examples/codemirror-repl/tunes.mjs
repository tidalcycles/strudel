export const bumpStreet = `// froos - "22 bump street", licensed with CC BY-NC-SA 4.0
samples('github:felixroos/samples')
samples('https://strudel.cc/tidal-drum-machines.json', 'github:ritchse/tidal-drum-machines/main/machines/')

"<[0,<6 7 9>,13,<17 20 22 26>]!2>/2"
  // make it 22 edo
  .fmap(v => Math.pow(2,v/22))
  // mess with the base frequency
  .mul("<300 [300@3 200]>/8").freq()
  .layer(
    // chords
    x=>x.div(freq(2)).s("flute").euclidLegato("<3 2>",8)
      .shape(.4).lpf(sine.range(800,4000).slow(8)),
    // adlibs
    x=>x.arp("{0 3 2 [1 3]}%1.5")
      .s('xylo').mul(freq(2))
      .delay(.5).delayfeedback(.4).juxBy(.5, rev)
      .hpf(sine.range(200,3000).slow(8)),
    // bass
    x=>x.arp("[0 [2 1?]](5,8)").s('sawtooth').div(freq(4))
      .lpf(sine.range(400,2000).slow(8)).lpq(8).shape(.4)
      .off(1/8, x=>x.mul(freq(2)).degradeBy(.5)).gain(.3)
  ).clip(1).release(.2)
.stack(
  // drums
  s("bd sd:<2 1>, [~ hh]*2, [~ rim]").bank('RolandTR909')
  .off(1/8, x=>x.speed(2).gain(.4)).sometimes(ply(2)).gain(.8)
  .mask("<0@4 1@12>/4")
  .reset("<x@15 [x(3,8) x*[4 8]]>")
  // wait for it...
).fast(2/3)
  //.crush(6) // remove "//" if you dare`;

export const trafficFlam = `// froos - "traffic flam", licensed with CC BY-NC-SA 4.0

samples('github:felixroos/samples')
samples('https://strudel.cc/tidal-drum-machines.json', 'github:ritchse/tidal-drum-machines/main/machines/')

addVoicings('hip', {
  m11: ['2M 3m 4P 7m'],
  '^7#11': ['3M 4A 5P 7M'],
}, ['C4', 'C6'])

stack(
  stack(
    "<Bbm11 A^7#11>/2".voicings('hip').note()
    .s("gm_epiano1:2")
    .arp("[<[0 1 2 3] [3 2 1 0]> ~@5]/2")
    .release(2).late(.25).lpf(2000),
    "<Bb1 A1>/2".note().s('gm_acoustic_bass'),
    n("<0 2 3>(3,8)".off(1/8, add(4)))
    .scale("<Bb4:minor A4:lydian>/2")
    .s('gm_electric_guitar_jazz')
    .decay(sine.range(.05, .2).slow(32)).sustain(0)
    .delay(.5).lpf(sine.range(100,5000).slow(64))
    .gain(.7).room(.5).pan(sine.range(0,1).slow(11))
  ).add(perlin.range(0,.25).note()),
  stack(
    s("bd:1(3,8) rim").bank('RolandTR707').slow(2).room("<0 <.1 .6>>")
    .when("<0@7 1>",x=>x.echoWith(3, .0625, (x,i) => x.speed(1+i*.24))),
    s("rim*4").end(.05).bank('RolandTR808').speed(.8).room(.2)
  )
)
  .late("[0 .05]*2").late(12)

`;

export const funk42 = `// froos - how to funk in 42 lines of code
// adapted from "how to funk in two minutes" by marc rebillet https://www.youtube.com/watch?v=3vBwRfQbXkg
// thanks to peach for the transcription: https://www.youtube.com/watch?v=8eiPXvIgda4

samples('github:felixroos/samples')
samples('https://strudel.cc/tidal-drum-machines.json', 'github:ritchse/tidal-drum-machines/main/machines/')

setcps(.5)

let drums = stack(
  s("bd*2, ~ sd").bank('RolandTR707').room("0 .1"),
  s("hh*4").begin(.2).release(.02).end(.25).release(.02)
  .gain(.3).bank('RolandTR707').late(.02).room(.5),
  //s("shaker_small").struct("[x x*2]*2").speed(".8,.9").release(.02)
).fast(2)

let wurli = note(\`<
[[a2,g3,[b3 c4],e4] ~ [g3,c4,e4](3,8)@4 ~@2]!3 
[[e2,e3,a3,b3,e4]@3 [e2,e3,ab3,b3,e4]@5]>\`)
  .s("gm_epiano1:5").decay(.2).sustain("<[1 0@7]!3 1>")
  .gain("<[.8@2 .4@14]!3 .7>").room(.3)

let organ = note("<[~@3 [a3,d4,f#4]@2 [[a3,c4,e4]@2 ~] ~@2]!3 ~>".add(12))
    .s("gm_percussive_organ:2").gain(.6).lpf(1800).pan(.2).room(.3);

let clav = note(\`<
[~@3 a2 [g3,[b3 c4],e4]@2 ~ a2 [g3,b3,e4] ~@2 [g3,c4,e4] ~@4]!3
[~@3 e3 [[a3 b3],c3,e3]@2 ~ e2 [e3,a3]@3 [b3,e3] ~@2 [b3,e3]@2]>\`)
  .s("gm_clavinet:1").decay("<.25!3 [.25 .4]>").sustain(0)
  .gain(.7).pan(.8).room(.2);

let bass = note(\`<
[a1 [~ [g2 a2]] [g1 g#1] [a1 [g2 a2]]] 
[a1 [~ [g2 a2]] [e3 d3] [c3 [g3 a3]]] 
[a1 [~ [g2 a2]] [g1 g#1] [a1 [g2 a2]]] 
[e2@6 e1@5 e1 [[d2 e3] g1]@4]
>\`).s("gm_electric_bass_pick:1").release(.1)

stack(
  drums
  ,wurli
  ,organ
  ,clav
  ,bass
)`;
