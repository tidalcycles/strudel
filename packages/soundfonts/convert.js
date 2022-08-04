// this script converts a soundfont into a json file, it has not been not used yet
import fetch from 'node-fetch';

const name = '0000_JCLive';

const js = await fetch(`https://felixroos.github.io/webaudiofontdata/sound/${name}_sf2_file.js`).then((res) =>
  res.text(),
);
// console.log(js);

let [_, data] = js.split('_sf2_file=');
data = eval(data);
console.log(JSON.stringify(data));
