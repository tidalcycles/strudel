export const bumpStreet = `// froos - "22 bump street", licensed with CC BY-NC-SA 4.0
await samples('github:felixroos/samples/main')
await samples('https://strudel.tidalcycles.org/tidal-drum-machines.json', 'github:ritchse/tidal-drum-machines/main/machines/')

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
