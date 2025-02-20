#!/usr/bin/env node

import cowsay from 'cowsay';
import { createReadStream, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import http from 'http';
import { join, sep } from 'path';
import os from 'os';

// eslint-disable-next-line
const LOG = !!process.env.LOG || false;

console.log(
  cowsay.say({
    text: 'welcome to @strudel/sampler',
    e: 'oO',
    T: 'U ',
  }),
);

async function getFilesInDirectory(directory) {
  let files = [];
  const dirents = await readdir(directory, { withFileTypes: true });
  for (const dirent of dirents) {
    const fullPath = join(directory, dirent.name);
    if (dirent.isDirectory()) {
      if (dirent.name.startsWith('.')) {
        LOG && console.warn(`ignore hidden folder: ${fullPath}`);
        continue;
      }
      try {
        const subFiles = (await getFilesInDirectory(fullPath)).filter((f) =>
          ['wav', 'mp3', 'ogg'].includes(f.split('.').slice(-1)[0].toLowerCase()),
        );
        files = files.concat(subFiles);
        LOG && console.log(`${dirent.name} (${subFiles.length})`);
      } catch (err) {
        LOG && console.warn(`skipped due to error: ${fullPath}`);
      }
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function getBanks(directory) {
  let files = await getFilesInDirectory(directory);
  let banks = {};
  directory = directory.split(sep).join('/');
  files = files.map((path) => {
    path = path.split(sep).join('/');
    const [bank] = path.split('/').slice(-2);
    banks[bank] = banks[bank] || [];
    const relativeUrl = path.replace(directory, '');
    banks[bank].push(relativeUrl);
    return relativeUrl;
  });
  banks._base = `http://localhost:5432`;
  return { banks, files };
}

// eslint-disable-next-line
const directory = process.cwd();
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { banks, files } = await getBanks(directory);
  if (req.url === '/') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(banks));
  }
  let subpath = decodeURIComponent(req.url);
  const filePath = join(directory, subpath.split('/').join(sep));

  //console.log('GET:', filePath);
  const isFound = existsSync(filePath);
  if (!isFound) {
    res.statusCode = 404;
    res.end('File not found');
    return;
  }
  const readStream = createReadStream(filePath);
  readStream.on('error', (err) => {
    res.statusCode = 500;
    res.end('Internal server error');
    console.error(err);
  });
  readStream.pipe(res);
});

// eslint-disable-next-line
const PORT = process.env.PORT || 5432;
const IP_ADDRESS = '0.0.0.0';
let IP;
const networkInterfaces = os.networkInterfaces();

Object.keys(networkInterfaces).forEach((key) => {
  networkInterfaces[key].forEach((networkInterface) => {
    if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
      IP = networkInterface.address;
    }
  });
});

server.listen(PORT, IP_ADDRESS, () => {
  console.log(`@strudel/sampler is now serving audio files from:
 ${directory}

To use them in the Strudel REPL, run:
 samples('http://localhost:${PORT}')

Or on a machine in the same network:
 ${IP ? `samples('http://${IP}:${PORT}')` : `Unable to determine server's IP address.`}
`);
});
