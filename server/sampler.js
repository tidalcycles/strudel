import fs from 'fs';

export const loadSample = (context, path) => {
  console.log(`load sample: ${path}`);
  return new Promise((resolve, reject) => {
    fs.readFile(new URL(path, import.meta.url), function (err, buffer) {
      if (err) reject(err);
      context.decodeAudioData(buffer, resolve);
    });
  });
};

export async function prepareSamples(context, path, ignore = ['.DS_Store', 'Thumbs.db']) {
  const ignored = (filename) => !ignore.includes(filename);
  const folders = fs.readdirSync(path).filter(ignored);
  return Object.fromEntries(
    await Promise.all(
      folders.map(async (folder) => {
        return [
          folder,
          await Promise.all(
            fs
              .readdirSync(path + folder)
              .filter(ignored)
              .map((filename) => path + folder + '/' + filename)
              .map((filepath) => loadSample(context, filepath)),
          ),
        ];
      }, []),
    ),
  );
}

export const playBuffer = (context, audioBuffer, start = 0) => {
  const bufferNode = context.createBufferSource();
  bufferNode.connect(context.destination);
  bufferNode.buffer = audioBuffer;
  bufferNode.loop = false;
  bufferNode.start(start);
  bufferNode.stop(start + audioBuffer.length / audioBuffer.sampleRate);
};
