import { readdir } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getFilesInDirectory(directory) {
  let files = [];
  const dirents = await readdir(directory, { withFileTypes: true });
  for (const dirent of dirents) {
    const fullPath = join(directory, dirent.name);
    if (dirent.isDirectory()) {
      const subFiles = await getFilesInDirectory(fullPath);
      files = files.concat(subFiles);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export async function GET() {
  let dir;
  if (import.meta.env.MODE === 'production') {
    // in prod (pnpm build), the path is "/website/dist/chunks/pages"
    dir = '../../../public/samples';
  } else {
    // in dev (pnpm dev), the path is "/website/src/pages"
    dir = '../../public/samples';
  }
  const directory = resolve(__dirname, dir);
  const files = await getFilesInDirectory(directory);
  let banks = {};
  files
    .filter((f) => ['wav', 'mp3', 'ogg'].includes(f.split('.').slice(-1)[0].toLowerCase()))
    .forEach((url) => {
      const [bank] = url.split('/').slice(-2);
      banks[bank] = banks[bank] || [];
      const rel = url.split('/public/samples/')[1];
      banks[bank].push(rel);
    });
  banks._base = '/samples/';
  return new Response(JSON.stringify(banks));
}
