import { useState } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

export function shuffleArray(array) {
  array = [...array];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
let _shuffled;

export function Showcase() {
  const [videos, setVideos] = useState(_shuffled);
  return (
    <>
      <div className="flex space-x-2">
        <button className="bg-lineHighlight p-2 rounded-md" onClick={() => setVideos(shuffleArray(_videos))}>
          <span>shuffle videos</span>
        </button>
        <button className="bg-lineHighlight p-2 rounded-md" onClick={() => setVideos(_videos)}>
          <span>newest first</span>
        </button>
      </div>
      {videos.map((video, i) => (
        <div key={i}>
          <h2>{video.title}</h2>
          <LiteYouTubeEmbed {...video} />
          {video.description && <p>{video.description}</p>}
        </div>
      ))}
    </>
  );
}

let _videos = [
  { title: 'Coding Music With Strudel Workhop by Dan Gorelick and Viola He', id: 'oqyAJ4WeKoU' },
  { title: 'Hexe - playing w strudel live coding music', id: '03m3F5xVOMg' },
  { title: 'DJ_Dave - Array [Lil Data Edit]', id: 'KUujFuTcuKc' },
  { title: 'DJ_Dave - Bitrot [v10101a Edit]', id: 'z_cJMdBp67Q' },
  { title: 'you will not steve reich your way out of it', id: 'xpILnXcWyuo' },
  { title: 'dough dream #1 - strudel jam 12/03/23', id: 'p0J7XrT9JEs' },
  { title: 'eddyflux & superdirtspatz at the dough cathedral', id: 'GrkwKMQ7_Ys' },
  // solstice 2023
  { title: 'Jade Rose @ solstice stream 2023', id: 'wg0vW5Ac7L0' },
  {
    title: 'eddyflux @ solstice stream 2023',
    id: 'DX8E99kC7q0',
    description:
      'A from-scratch session, starting with sample loops, later transitioning to more electronic territory.',
  },
  {
    title: 'CCC @ solstice stream 2023',
    id: '3uLTIDQa_Lc',
    params: 'start=24',
  },
  { title: 'letSeaTstrudeL @ solstice stream 2023', id: 'fTiX6dVtdWQ' },
  { title: 'totalgee (Glen F) @ solstice stream 2023', id: 'IvI6uaE3nLU' },
  { title: 'Dan Gorelick @ solstice stream 2023', id: 'qMJEljJyPi0' },
  //
  /* { // not sure if this is copyrighted ...
    title: 'Creative Coding @ Chalmers University of Technology, video by svt.se',
    id: '4zgHeNpG4wU',
  }, */
  { title: 'Switch Angel - Morrow', id: 'qiatPuJpxLs' },
  {
    title: 'Jade Rose - Into your spell',
    id: 'lxQgBeLQBgk',
    description:
      'Jade Rose performing with various synths via MIDI, superdirt via OSC and the native strudel superdough engine + vocal parts!',
  },
  // algo afro futures
  {
    title: 'Emma Osman @ (Algo|Afro) Futures 2023',
    id: 'zUoZvkZ3J7Q',
    params: 'start=1278',
  },
  {
    title: 'Zach B-B @ (Algo|Afro) Futures 2023',
    id: 'zUoZvkZ3J7Q',
    params: 'start=2547',
  },
  {
    title: 'Jamal Lloyd Davis @ (Algo|Afro) Futures 2023',
    id: 'zUoZvkZ3J7Q',
    params: 'start=3883',
  },
  {
    title: 'Jim Osman @ (Algo|Afro) Futures 2023',
    id: 'zUoZvkZ3J7Q',
    params: 'start=5155',
  },
  {
    title: 'φ @ (Algo|Afro) Futures 2023',
    id: 'zUoZvkZ3J7Q',
    params: 'start=7809',
  },
  {
    title: 'Tomilola Olumide @ (Algo|Afro) Futures 2023',
    id: 'zUoZvkZ3J7Q',
    params: 'start=9224',
  },
  {
    title: 'Tyga Blue @ (Algo|Afro) Futures 2023',
    id: 'zUoZvkZ3J7Q',
    params: 'start=10909',
  },
  //
  {
    title: 'boggo - Live Coding Metal Djents',
    id: 'n0rhn9-PRwE',
    description: 'A rare sight: live coded Metal Djents, where strudel is sending MIDI to bespoke synth!',
  },
  {
    title: 'froos @ Solstice Night Stream December 2022',
    id: 'P1DDsOvcyco',
    params: 'start=19',
  },
  { title: 'froos @ WAC 2022 Day', id: 'KWIotFWVOi4' },
  {
    title: 'yaxu & olivia - Algorithmic Pattern Live Stream',
    id: 'Jvs7Q4cdLy4',
    description:
      'A first foray into combining (an early version) strudel and hydra, using flok for collaborative coding.',
  },
  { title: 'froos @ Algorave 10th Birthday stream', id: 'IcMSocdKwvw' },
];

_shuffled = shuffleArray(_videos);
