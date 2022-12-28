import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function readTextFiles(folder) {
  const absolutePath = path.resolve(__dirname, folder);

  // Use `fs.promises.readdir()` to get a list of all the files in the folder
  const files = await fs.promises.readdir(absolutePath);

  // Filter the list of files to only include those with a `.txt` extension
  const textFiles = files.filter((file) => file.endsWith('.txt'));
  // Initialize an empty object to store the file contents
  const fileContents = {};

  // Use `fs.promises.readFile()` to read the contents of each text file
  for (const file of textFiles) {
    const filePath = `${absolutePath}/${file}`;
    const data = await fs.promises.readFile(filePath, 'utf8');
    fileContents[file] = data;
  }
  // Return the object with the filenames as keys and the file contents as values
  return fileContents;
}

export function getMyPatterns() {
  return readTextFiles('../../../../my-patterns');
}

export async function get({ params, request }) {
  const all = await getMyPatterns();
  return {
    body: JSON.stringify(all),
  };
}
