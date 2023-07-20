import { registerVoicings } from './voicings.mjs';

// these voicings have been reverse engineered from ireal pro midi data
// using this script:
// https://codesandbox.io/s/ireal-midi-scraper-meng0t?file=/src/index.js

registerVoicings('ireal', {
  2: ['5P 8P 9M 12P', '1P 5P 8P 9M', '1P 5P 8P 9M 12P'],
  5: ['5P 8P 12P 15P', '1P 5P 8P 12P'],
  6: ['5P 8P 10M 12P 13M', '3M 5P 8P 10M 13M', '1P 5P 8P 10M 13M', '1P 5P 6M 8P 10M'],
  7: [
    '3M 7m 10M 12P 15P',
    '7m 10M 12P 14m 15P',
    '3M 7m 8P 10M 14m',
    '3M 7m 8P 10M 12P',
    '1P 7m 8P 10M 12P',
    '1P 5P 7m 8P 10M',
    '7m 10M 12P 15P 17M',
  ],
  9: [
    '3M 7m 8P 12P 16M',
    '7m 10M 12P 15P 16M',
    '3M 7m 8P 9M 12P',
    '1P 7m 9M 10M 12P',
    '1P 5P 7m 9M 10M',
    '7m 9M 10M 14m 15P',
  ],
  11: ['7m 8P 9M 11P 12P', '7m 8P 11P 12P 16M', '5P 7m 8P 9M 11P', '1P 5P 7m 9M 11P'],
  13: ['7m 8P 9M 10M 13M', '3M 7m 8P 9M 13M', '1P 6M 7m 9M 10M', '1P 7m 9M 10M 13M', '7m 9M 10M 13M 15P'],
  69: ['5P 8P 9M 10M 13M', '3M 5P 8P 9M 13M', '1P 5P 9M 10M 13M', '1P 5P 6M 9M 10M'],
  add9: ['3M 8P 9M 12P 15P', '3M 8P 9M 10M 12P', '1P 5P 9M 10M 12P', '1P 5P 8P 9M 10M', '5P 8P 9M 12P 17M'],
  '+': [
    '3M 8P 10M 13m 15P',
    '3M 6m 8P 10M 13m',
    '1P 6m 8P 10M 13m',
    '1P 3M 6m 8P 10M',
    '6m 10M 13m 15P 17M',
    '6m 8P 10M 13m 15P',
  ],
  o: ['5d 8P 10m 12d 15P', '3m 8P 10m 12d 15P', '1P 5d 8P 10m 12d'],
  h: [
    '5d 7m 8P 10m 14m',
    '3m 7m 8P 12d 14m',
    '3m 7m 8P 10m 12d',
    '1P 7m 10m 12d',
    '3m 5d 7m 8P 10m',
    '7m 10m 12d 14m 15P',
    '5d 8P 10m 14m 17m',
    '5d 8P 10m 12d 14m',
  ],
  sus: ['5P 8P 11P 12P 15P', '5P 8P 11P 12P', '1P 4P 5P 8P', '1P 4P 5P 8P 11P'],
  '^': ['5P 8P 10M 12P 14M', '3M 8P 10M 12P 14M', '1P 10M 12P 14M', '1P 5P 7M 10M 12P', '5P 8P 10M 14M 17M'],
  '-': ['5P 8P 10m 12P 15P', '3m 5P 8P 10m 12P', '1P 3m 5P 8P 10m', '1P 5P 8P 10m 12P'],
  '^7': ['5P 8P 10M 12P 14M', '3M 8P 10M 12P 14M', '1P 5P 7M 10M 12P', '1P 10M 12P 14M', '5P 8P 10M 14M 17M'],
  '-7': [
    '5P 7m 8P 10m 14m',
    '3m 7m 8P 10m 14m',
    '3m 7m 8P 10m 12P',
    '1P 5P 7m 10m 12P',
    '1P 3m 5P 7m 10m',
    '7m 10m 12P 15P 17m',
    '7m 10m 12P 14m 15P',
    '5P 8P 10m 14m 17m',
  ],
  '7sus': ['5P 8P 11P 12P 14m', '7m 8P 11P 12P 14m', '1P 5P 7m 8P 11P', '7m 11P 12P 14m 18P'],
  h7: [
    '5d 7m 8P 10m 14m',
    '3m 7m 8P 12d 14m',
    '3m 7m 8P 10m 12d',
    '3m 5d 7m 8P 10m',
    '7m 10m 12d 14m 15P',
    '5d 8P 10m 12d 14m',
    '5d 8P 10m 14m 17m',
  ],
  o7: [
    '5d 10m 12d 13M 15P',
    '3m 8P 12d 13M 15P',
    '1P 6M 10m 12d 13M',
    '3m 8P 10m 12d 13M',
    '1P 6M 8P 10m 12d',
    '6M 12d 15P 17m 19d',
    '6M 12d 13M 15P 17m',
    '5d 10m 13M 15P 17m',
  ],
  'o^7': ['5P 8P 10M 12P 14M', '5P 8P 10M 14M 17M', '3M 8P 10M 12P 14M', '1P 10M 12P 14M', '1P 5P 7M 10M 12P'],
  '^9': [
    '3M 7M 8P 12P 16M',
    '3M 7M 8P 9M 12P',
    '1P 5P 7M 9M 10M',
    '1P 7M 9M 10M 12P',
    '7M 8P 10M 12P 16M',
    '5P 8P 10M 14M 16M',
  ],
  '^13': ['3M 7M 8P 13M 16M', '3M 7M 8P 9M 13M', '7M 8P 10M 13M 16M', '1P 7M 9M 10M 13M', '1P 6M 7M 9M 10M'],
  '^7#11': ['5P 8P 10M 12d 14M', '3M 7M 8P 12d 14M', '3M 7M 8P 10M 12d', '1P 5P 7M 10M 12d'],
  '^9#11': ['3M 8P 9M 12d 14M', '1P 3M 5d 7M 9M', '3M 7M 8P 9M 12d', '1P 7M 9M 10M 12d'],
  '^7#5': ['6m 7M 8P 10M 13m', '3M 7M 8P 10M 13m', '1P 6m 7M 10M 13m'],
  '-6': [
    '5P 8P 10m 13M 15P',
    '5P 8P 10m 12P 13M',
    '3m 5P 8P 10m 13M',
    '1P 5P 8P 10m 13M',
    '3m 5P 6M 8P 10m',
    '1P 5P 6M 8P 10m',
    '1P 3m 5P 6M 8P',
  ],
  '-69': [
    '5P 8P 9M 10m 13M',
    '5P 8P 10m 13M 16M',
    '3m 5P 8P 9M 13M',
    '3m 6M 9M 10m 12P',
    '1P 5P 9M 10m 13M',
    '3m 5P 6M 8P 9M',
    '1P 3m 5P 6M 9M',
  ],
  '-^7': ['5P 7M 8P 10m 14M', '3m 7M 8P 10m 12P', '1P 3m 5P 7M 10m', '1P 5P 7M 10m 12P', '5P 8P 10m 14M 17m'],
  '-^9': ['5P 8P 9M 10m 14M', '3m 7M 8P 9M 12P', '1P 7M 9M 10m 12P', '1P 3m 5P 7M 9M'],
  '-9': [
    '5P 8P 9M 10m 14m',
    '7m 10m 12P 15P 16M',
    '3m 7m 9M 12P 15P',
    '3m 7m 8P 9M 12P',
    '3m 5P 7m 8P 9M',
    '1P 3m 5P 7m 9M',
  ],
  '-add9': ['5P 8P 9M 10m 12P', '3m 5P 8P 9M 12P', '1P 3m 5P 9M', '1P 2M 3m 5P 8P'],
  '-11': [
    '5P 8P 11P 14m',
    '3m 7m 9M 11P 15P',
    '3m 7m 8P 9M 11P',
    '1P 4P 7m 10m 12P',
    '1P 3m 7m 9M 11P',
    '7m 10m 12P 15P 18P',
    '5P 8P 11P 14m 16M',
  ],
  '-7b5': [
    '5d 7m 8P 10m 14m',
    '3m 7m 8P 12d 14m',
    '3m 7m 8P 10m 12d',
    '3m 5d 7m 8P 10m',
    '7m 10m 12d 14m 15P',
    '1P 5d 7m 10m 12d',
    '5d 8P 10m 14m 17m',
  ],
  h9: ['5d 8P 9M 10m 14m', '3m 7m 8P 9M 12d', '1P 7m 9M 10m 12d', '7m 10m 12d 15P 16M'],
  '-b6': ['5P 8P 10m 13m 15P', '5P 8P 10m 13m', '3m 5P 8P 10m 13m', '1P 5P 8P 10m 13m', '1P 5P 6m 8P 10m'],
  '-#5': ['6m 8P 10m 13m 15P', '3m 6m 8P 10m 13m', '1P 6m 8P 10m 13m'],
  '7b9': ['3M 7m 8P 9m 14m', '1P 3M 7m 9m 10M', '3M 7m 8P 9m 10M', '7m 9m 10M 14m 15P'],
  '7#9': ['3M 7m 8P 10m 14m', '1P 3M 7m 10m', '7m 10m 10M 14m 15P'],
  '7#11': ['7m 10M 12d 14m 15P', '3M 7m 8P 10M 12d', '1P 3M 7m 10M 12d'],
  '7b5': ['7m 10M 12d 14m 15P', '3M 7m 8P 10M 12d', '1P 3M 7m 10M 12d'],
  '7#5': ['3M 7m 8P 13m 14m', '7m 10M 13m 14m 15P', '3M 7m 8P 10M 13m', '1P 3M 7m 10M 13m'],
  '9#11': ['7m 10M 12d 15P 16M', '3M 7m 8P 9M 12d', '1P 7m 9M 10M 12d'],
  '9b5': ['7m 10M 12d 15P 16M', '3M 7m 8P 9M 12d', '1P 7m 9M 10M 12d'],
  '9#5': ['3M 7m 9M 13m 14m', '3M 7m 9M 10M 13m', '1P 7m 9M 10M 13m', '7m 10M 13m 16M 17M', '7m 10M 13m 14m 16M'],
  '7b13': ['3M 7m 8P 13m 14m', '7m 10M 13m 14m 15P', '3M 7m 8P 10M 13m', '1P 3M 7m 10M 13m'],
  '7#9#5': ['3M 7m 10m 13m 15P', '1P 3M 7m 10m 13m', '7m 10M 13m 15P 17m'],
  '7#9b5': ['3M 7m 10m 12d 15P', '7m 10M 12d 15P 17m', '1P 3M 7m 10m 12d'],
  '7#9#11': ['3M 7m 10m 12d 15P', '7m 10M 12d 15P 17m', '1P 3M 7m 10m 12d'],
  '7b9#11': ['7m 8P 10M 12d 16m', '3M 7m 8P 9m 12d', '1P 7m 9m 10M 12d'],
  '7b9b5': ['7m 8P 10M 12d 16m', '3M 7m 8P 9m 12d', '1P 7m 9m 10M 12d'],
  '7b9#5': ['7m 9m 10M 13m 15P', '3M 7m 8P 9m 13m', '1P 7m 9m 10M 13m'],
  '7b9#9': ['7m 8P 10M 16m 17m', '3M 7m 8P 9m 10m', '1P 3M 7m 9m 10m'],
  '7b9b13': ['7m 9m 10M 13m 15P', '3M 7m 8P 9m 13m', '1P 7m 9m 10M 13m'],
  '7alt': [
    '3M 7m 9m 12d 15P',
    '3M 7m 10m 13m 15P',
    '3M 7m 8P 10m 13m',
    '3M 7m 8P 9m 12d',
    '1P 7m 10m 10M 13m',
    '7m 10M 12d 15P 17m',
  ],
  '13#11': ['3M 7m 9M 12d 13M', '1P 6M 7m 10M 12d', '7m 10M 12d 13M 16M'],
  '13b9': ['3M 7m 10M 13M 16m', '1P 3M 6M 7m 9m', '3M 7m 9m 10M 13M', '1P 6M 7m 9m 10M', '7m 10M 13M 16m 17M'],
  '13#9': ['3M 7m 8P 10m 13M', '1P 3M 6M 7m 10m', '7m 10M 13M 14m 17m'],
  '7b9sus': ['7m 8P 11P 14m 16m', '5P 7m 8P 9m 11P', '1P 5P 7m 9m 11P'],
  '7susadd3': ['5P 8P 10M 11P 14m', '1P 4P 5P 7m 10M', '7m 11P 12P 15P 17M'],
  '9sus': ['7m 8P 9M 11P 12P', '5P 7m 8P 9M 11P', '1P 5P 7m 9M 11P', '7m 8P 11P 12P 16M'],
  '13sus': ['5P 7m 9M 11P 13M', '1P 4P 6M 7m 9M', '1P 7m 9M 11P 13M', '7m 9M 11P 13M 15P'],
  '7b13sus': ['5P 7m 8P 11P 13m', '1P 5P 7m 11P 13m', '7m 11P 13m 14m 15P'],
});

registerVoicings('ireal-ext', {
  2: ['5P 8P 9M 12P 15P', '5P 8P 9M 12P 13M', '1P 5P 6M 8P 9M', '1P 5P 8P 9M 12P'],
  5: ['5P 8P 12P 15P', '1P 5P 8P 12P', '1P 5P 8P 9M 12P', '5P 8P 12P 15P 16M'],
  6: ['3M 6M 9M 12P 15P', '3M 5P 9M 10M 13M', '5P 8P 9M 10M 13M', '1P 5P 9M 10M 13M', '1P 5P 6M 9M 10M'],
  7: [
    '3M 7m 10M 12P 15P',
    '3M 7m 8P 10M 14m',
    '3M 7m 8P 10M 12P',
    '1P 7m 8P 10M 12P',
    '7m 10M 14m 17M 19P',
    '7m 10M 12P 15P 17M',
    '7m 10M 12P 14m 15P',
  ],
  9: [
    '3M 7m 9M 12P 15P',
    '3M 7m 9M 10M 13M',
    '3M 7m 9M 10M 12P',
    '1P 7m 9M 10M 13M',
    '7m 10M 13M 16M 19P',
    '1P 6M 7m 9M 10M',
    '7m 10M 13M 16M 17M',
    '7m 10M 12P 13M 16M',
  ],
  11: ['5P 8P 9M 11P 14m', '4P 6M 7m 9M 11P', '1P 5P 7m 9M 11P', '7m 11P 12P 14m 18P', '7m 9M 11P 13M 15P'],
  13: [
    '3M 7m 10M 13M 16M',
    '3M 7m 9M 13M 15P',
    '3M 7m 9M 10M 13M',
    '7m 10M 13M 16M 19P',
    '7m 10M 13M 16M 17M',
    '7m 10M 12P 13M 16M',
  ],
  69: ['3M 6M 9M 12P 15P', '3M 5P 9M 10M 13M', '1P 5P 9M 10M 13M', '1P 5P 6M 9M 10M'],
  add9: [
    '5P 8P 9M 10M 15P',
    '3M 8P 9M 12P 15P',
    '1P 5P 9M 10M 12P',
    '3M 8P 9M 10M 12P',
    '1P 5P 8P 9M 10M',
    '5P 8P 9M 12P 17M',
  ],
  '+': [
    '3M 8P 10M 13m 15P',
    '3M 8P 9M 10M 13m',
    '1P 6m 8P 9M 10M',
    '1P 6m 8P 10M 13m',
    '6m 10M 13m 15P 17M',
    '6m 10M 13m 15P 16M',
  ],
  o: [
    '5d 10m 12d 13M 15P',
    '3m 8P 12d 13M 15P',
    '1P 6M 10m 12d 13M',
    '3m 8P 10m 12d 13M',
    '1P 6M 8P 10m 12d',
    '6M 12d 15P 17m 19d',
    '6M 12d 13M 15P 17m',
    '5d 10m 13M 15P 17m',
  ],
  h: [
    '5d 8P 10m 14m 17m',
    '5d 8P 10m 11P 14m',
    '3m 7m 8P 12d 14m',
    '5d 7m 8P 10m 11P',
    '3m 5d 7m 8P 11P',
    '1P 7m 10m 12d',
    '1P 5d 7m 10m 11P',
    '7m 10m 12d 14m 15P',
  ],
  sus: [
    '5P 8P 11P 13M 15P',
    '1P 4P 5P 8P 9M',
    '5P 8P 11P 12P 13M',
    '5P 8P 9M 11P 12P',
    '1P 5P 8P 9M 11P',
    '1P 4P 5P 8P 11P',
  ],
  '^': [
    '3M 7M 10M 13M 16M',
    '3M 7M 9M 13M 14M',
    '3M 7M 9M 10M 13M',
    '3M 7M 9M 10M 12P',
    '3M 7M 9M 12P 13M',
    '1P 7M 9M 10M 13M',
    '7M 10M 13M 16M 19P',
    '1P 6M 7M 9M 10M',
    '7M 10M 13M 16M 17M',
    '7M 10M 13M 14M 16M',
  ],
  '-': [
    '5P 8P 10m 12P 15P',
    '5P 8P 9M 10m 11P',
    '3m 5P 8P 10m 12P',
    '3m 5P 8P 9M 11P',
    '1P 5P 9M 10m 12P',
    '1P 3m 5P 9M 11P',
    '1P 3m 5P 8P 10m',
  ],
  '^7': [
    '3M 7M 10M 13M 16M',
    '3M 7M 9M 13M 14M',
    '3M 7M 9M 10M 13M',
    '3M 7M 9M 10M 12P',
    '3M 7M 9M 12P 13M',
    '1P 7M 9M 10M 13M',
    '7M 10M 13M 16M 19P',
    '1P 6M 7M 9M 10M',
    '7M 10M 13M 16M 17M',
    '7M 10M 13M 14M 16M',
  ],
  '-7': [
    '5P 7m 9M 10m 14m',
    '3m 7m 8P 10m 14m',
    '3m 7m 9M 10m 12P',
    '3m 7m 8P 10m 11P',
    '1P 5P 7m 10m 12P',
    '1P 5P 7m 10m 11P',
    '1P 3m 5P 7m 9M',
    '1P 3m 5P 7m 10m',
    '7m 10m 12P 15P 16M',
    '5P 8P 11P 14m 17m',
  ],
  '7sus': [
    '5P 8P 9M 11P 14m',
    '1P 4P 6M 7m 9M',
    '4P 6M 7m 9M 11P',
    '1P 5P 7m 9M 11P',
    '7m 11P 12P 14m 18P',
    '7m 9M 11P 13M 15P',
  ],
  h7: [
    '5d 8P 10m 14m 17m',
    '5d 8P 10m 11P 14m',
    '3m 7m 8P 12d 14m',
    '5d 7m 8P 10m 11P',
    '3m 5d 7m 8P 11P',
    '1P 7m 10m 12d',
    '1P 5d 7m 10m 11P',
    '7m 10m 12d 14m 15P',
  ],
  o7: [
    '5d 10m 12d 13M 15P',
    '3m 8P 12d 13M 15P',
    '3m 8P 10m 12d 13M',
    '1P 6M 10m 12d 13M',
    '1P 6M 8P 10m 12d',
    '6M 12d 15P 17m 19d',
    '6M 12d 13M 15P 17m',
    '5d 10m 13M 15P 17m',
  ],
  'o^7': [
    '3M 7M 10M 13M 16M',
    '3M 7M 9M 13M 14M',
    '3M 7M 9M 10M 13M',
    '3M 7M 9M 10M 12P',
    '1P 7M 9M 10M 13M',
    '7M 10M 13M 16M 19P',
    '1P 6M 7M 9M 10M',
    '7M 10M 13M 16M 17M',
    '7M 10M 13M 14M 16M',
  ],
  '^9': [
    '3M 7M 10M 13M 16M',
    '3M 7M 9M 13M 14M',
    '3M 7M 9M 12P 13M',
    '3M 7M 9M 10M 13M',
    '1P 7M 9M 10M 13M',
    '7M 10M 13M 16M 19P',
    '1P 6M 7M 9M 10M',
    '7M 10M 13M 16M 17M',
    '7M 10M 13M 14M 16M',
  ],
  '^13': [
    '3M 7M 10M 13M 16M',
    '3M 7M 9M 13M 14M',
    '3M 7M 9M 10M 13M',
    '1P 7M 9M 10M 13M',
    '7M 10M 13M 16M 19P',
    '1P 6M 7M 9M 10M',
    '7M 10M 13M 16M 17M',
    '7M 10M 13M 14M 16M',
  ],
  '^7#11': [
    '3M 7M 10M 12d 14M',
    '3M 7M 9M 12d 13M',
    '3M 7M 9M 10M 12d',
    '1P 7M 9M 10M 12d',
    '7M 10M 12d 14M 17M',
    '7M 10M 12d 13M 16M',
    '7M 10M 12d 13M 14M',
  ],
  '^9#11': [
    '3M 7M 9M 12d 14M',
    '3M 7M 9M 12d 13M',
    '3M 7M 9M 10M 12d',
    '1P 7M 9M 10M 12d',
    '1P 3M 5d 7M 9M',
    '7M 10M 12d 13M 16M',
  ],
  '^7#5': ['3M 7M 10M 13m 14M', '3M 7M 9M 10M 13m', '1P 6m 7M 10M 13m', '7M 10M 13m 14M 17M', '7M 10M 13m 14M 16M'],
  '-6': [
    '5P 8P 10m 11P 13M',
    '3m 5P 8P 9M 13M',
    '3m 5P 6M 8P 11P',
    '3m 5P 6M 8P 9M',
    '1P 3m 5P 6M 9M',
    '5P 8P 10m 13M 16M',
  ],
  '-69': [
    '5P 8P 9M 10m 13M',
    '3m 5P 8P 9M 13M',
    '3m 6M 9M 10m 12P',
    '1P 5P 9M 10m 13M',
    '3m 5P 6M 8P 9M',
    '1P 3m 5P 6M 9M',
    '5P 8P 10m 13M 16M',
  ],
  '-^7': [
    '3m 7M 9M 12P 14M',
    '7M 10m 11P 12P 14M',
    '3m 7M 9M 10m 11P',
    '3m 7M 9M 10m 12P',
    '1P 5P 7M 10m 11P',
    '7M 10m 12P 14M 16M',
    '1P 3m 5P 7M 9M',
  ],
  '-^9': [
    '3m 7M 9M 12P 14M',
    '7M 10m 11P 12P 14M',
    '3m 7M 9M 10m 12P',
    '3m 7M 9M 10m 11P',
    '1P 5P 7M 10m 11P',
    '1P 3m 5P 7M 9M',
    '7M 10m 12P 14M 16M',
  ],
  '-9': [
    '3m 7m 9M 12P 15P',
    '3m 7m 9M 10m 14m',
    '3m 7m 9M 10m 12P',
    '3m 7m 9M 10m 11P',
    '1P 3m 7m 9M 11P',
    '7m 10m 12P 16M 18P',
    '7m 10m 11P 14m 16M',
  ],
  '-add9': ['5P 8P 9M 10m 12P', '3m 5P 8P 9M 12P', '1P 2M 3m 5P 8P', '1P 3m 5P 9M'],
  '-11': [
    '5P 8P 11P 14m',
    '7m 9M 10m 11P',
    '3m 7m 9M 11P 14m',
    '3m 7m 9M 11P 12P',
    '3m 5P 7m 9M 11P',
    '1P 4P 7m 10m 12P',
    '7m 10m 11P 16M 21m',
    '7m 10m 12P 16M 18P',
    '5P 8P 11P 14m 16M',
    '7m 9M 10m 11P 12P',
  ],
  '-7b5': [
    '5d 8P 10m 14m 17m',
    '5d 8P 10m 11P 14m',
    '3m 7m 8P 12d 14m',
    '5d 7m 8P 10m 11P',
    '3m 5d 7m 8P 11P',
    '1P 7m 10m 12d',
    '1P 5d 7m 10m 11P',
    '7m 10m 12d 14m 15P',
  ],
  h9: [
    '5d 8P 9M 10m 14m',
    '3m 7m 9M 12d 14m',
    '3m 5d 7m 9M 11P',
    '1P 7m 9M 10m 12d',
    '7m 10m 12d 14m 16M',
    '7m 10m 11P 12d 14m',
  ],
  '-b6': ['5P 8P 10m 11P 13m', '1P 3m 5P 6m 8P', '3m 5P 8P 11P 13m'],
  '-#5': ['6m 8P 10m 13m 15P', '3m 6m 8P 11P 13m', '1P 6m 8P 10m 13m'],
  '7b9': ['3M 7m 8P 9m 14m', '7m 9m 10M 14m 15P', '3M 7m 8P 9m 10M', '1P 3M 7m 9m 10M'],
  '7#9': ['3M 7m 10m 12P 14m', '3M 7m 10m 10M 12P', '1P 3M 7m 10m', '7m 10M 12P 14m 17m'],
  '7#11': ['3M 7m 9M 12d 13M', '1P 3M 7m 9M 12d', '7m 10M 12d 13M 16M'],
  '7b5': ['3M 7m 9M 12d 13M', '7m 10M 12d 13M 16M', '1P 3M 7m 9M 12d'],
  '7#5': ['3M 7m 8P 13m 14m', '3M 7m 8P 10M 13m', '1P 3M 7m 10M 13m', '7m 10M 13m 14m 17M', '7m 10M 13m 14m 15P'],
  '9#11': ['7m 10M 12d 15P 16M', '3M 7m 8P 9M 12d', '1P 7m 9M 10M 12d'],
  '9b5': ['7m 10M 12d 15P 16M', '3M 7m 8P 9M 12d', '1P 7m 9M 10M 12d'],
  '9#5': ['3M 7m 9M 13m 14m', '3M 7m 9M 10M 13m', '1P 7m 9M 10M 13m', '7m 10M 13m 14m 16M', '7m 10M 13m 16M 17M'],
  '7b13': ['3M 7m 8P 13m 14m', '7m 10M 13m 14m 17M', '3M 7m 8P 10M 13m', '1P 3M 7m 10M 13m', '7m 10M 13m 14m 15P'],
  '7#9#5': ['3M 7m 10m 13m 14m', '3M 7m 10m 10M 13m', '7m 10M 13m 14m 17m'],
  '7#9b5': ['3M 7m 10m 12d 14m', '3M 7m 10m 10M 12d', '7m 10M 12d 14m 17m'],
  '7#9#11': ['3M 7m 10m 12d 14m', '3M 7m 10m 10M 12d', '7m 10M 12d 14m 17m'],
  '7b9#11': ['3M 7m 9m 12d 14m', '3M 7m 9m 10M 12d', '7m 10M 12d 14m 16m', '7m 8P 10M 12d 16m'],
  '7b9b5': ['3M 7m 9m 12d 14m', '3M 7m 9m 10M 12d', '7m 8P 10M 12d 16m', '7m 10M 12d 14m 16m'],
  '7b9#5': ['3M 7m 10M 13m 16m', '3M 7m 9m 10M 13m', '7m 10M 13m 14m 16m', '1P 7m 9m 10M 13m', '7m 10M 13m 16m 17M'],
  '7b9#9': ['3M 7m 10m 13m 16m', '1P 3M 7m 9m 10m', '7m 10M 13m 16m 17m'],
  '7b9b13': ['3M 7m 10M 13m 16m', '3M 7m 9m 10M 13m', '7m 10M 13m 14m 16m', '1P 7m 9m 10M 13m', '7m 10M 13m 16m 17M'],
  '7alt': [
    '3M 7m 10m 13m 15P',
    '3M 7m 9m 12d 14m',
    '3M 7m 8P 10m 13m',
    '3M 7m 9m 10m 13m',
    '7m 10M 13m 16m 19d',
    '7m 10M 13m 15P 17m',
    '7m 10M 12d 14m 16m',
  ],
  '13#11': ['3M 7m 9M 12d 13M', '7m 10M 12d 13M 16M'],
  '13b9': ['3M 7m 10M 13M 16m', '7m 10M 13M 16m 17M', '3M 7m 9m 10M 13M'],
  '13#9': ['3M 7m 10m 10M 13M', '7m 10M 13M 14m 17m'],
  '7b9sus': ['7m 8P 11P 14m 16m', '5P 7m 8P 9m 11P', '1P 5P 7m 9m 11P'],
  '7susadd3': ['5P 8P 10M 11P 14m', '1P 4P 5P 7m 10M', '7m 11P 12P 15P 17M'],
  '9sus': [
    '5P 8P 9M 11P 14m',
    '4P 6M 7m 9M 11P',
    '7m 11P 12P 14m 18P',
    '1P 5P 7m 9M 11P',
    '7m 9M 11P 13M 15P',
    '1P 4P 6M 7m 9M',
  ],
  '13sus': ['4P 7m 9M 11P 13M', '1P 7m 9M 11P 13M', '7m 11P 13M 16M 18P', '7m 11P 13M 14m 16M', '7m 9M 11P 13M 15P'],
  '7b13sus': ['5P 7m 8P 11P 13m', '7m 11P 13m 14m 15P', '1P 5P 7m 11P 13m'],
});

// handtranscribed voicings
/* 
addVoicings('ireal', {
  '^7': [
    '1P 5P 7M 10M 12P', // 1 5 7 3 5 // x
    // '3M 7M 9M 10M 13M', // 3 7 9 3 6 // Eb^7 aus autumn leaves
    '3M 8P 10M 12P 14M', // 3 1 3 5 7 // x
    '5P 8P 10M 12M 14M', // 5 1 3 5 7 // x
    '3M 7M 10M 12P 15P', // 3 7 3 5 1 // x ????
    '5P 8P 10M 14M 17M', // 5 1 3 7 3 // x
    // '7M 10M 13M 14M 16M', // 7 3 6 7 9 // Bb^7 aus autumn leaves
    // '7M 10M 13M 16M 17M', // 7 3 6 9 3 // Ab^7 aus twinbay
    //
    // C,B : 5 1 3 5 7
    // Db, D, Eb: 3 1 3 5 7
    // E: 3 7 1 3 5
    // F,Gb,G: 1 5 7 3 5
    // Ab,A,Bb: 5 1 3 7 3
  ],
  m7: [
    '1P 3m 5P 7m 10m', // 1 3 5 7 3 // x
    // '1P 5P 7m 10m 11P', // 1 5 7 3 4  // Gm7 autumn leaves
    '1P 5P 7m 10m 12P', // 1 5 7 3 5  // x
    '3m 7m 8P 10m 12P', // 3 7 1 3 5  // x
    '3m 7m 8P 10m 14m', // 3 7 1 3 7 // x
    '5P 7m 8P 10m 14m', // 5 7 1 3 7 // x
    //'5P 7m 9M 10m 14m', // 5 7 9 3 7
    //'5P 8P 11P 14m 17m', // 5 1 4 7 3
    '7m 10m 12P 14m 15P', // 7 3 5 7 1 // ?
    '5P 8P 10m 14m 17m', // 5 1 3 7 3 // x
    '7m 10m 12P 15P 17m', // 7 3 5 1 3 // x
    // [C,D,Eb]:[3 7 1 3 7] Db
    // [E,F]:[3 7 1 3 5] C
    // [Db]:[5 7 1 3 7] B
    // [Gb]:[1 5 7 3 5] Db
    // [G,Ab]:[1 3 5 7 3] Bb
    // [A]:[7 3 5 1 3]
    // [Bb,B]:[5 1 3 7 3]
  ],
  m6: [
    '3m 5P 6M 8P 9M', // 3 5 6 1 9 // Gm6 autumn leaves
    '1P 3m 5P 6M 9M', // 1 5 6 3 4  // Gm6 autumn leaves
    '3m 5P 6M 8P 9M', // 3 5 6 1 9 // Gm6 autumn leaves
    '3m 5P 6M 8P 11P', // 3 5 6 1 11 // Gm6 autumn leaves
    '1P 5P 6M 10m 11P', // 1 5 6 3 4  // Gm6 autumn leaves
    '5P 8P 10m 13M 15P', // 5 1 3 6 1 // Cm6 solar
    '1P 3m 5P 6M 8P', // 1 3 5 6 1 // Cm6 solar
  ],
  6: [
    '5P 8P 10M 12P 13M', // 5 1 3 5 6
    // '3M 5P 9M 10M 13M', // 3 5 9 3 6 Eb6 aus twinbay
    // C: 5 1 3 5 6
  ],
  7: [
    // ohne Erweiterungen
    '1P 5P 7m 8P 10M', // 1 5 7 1 3
    '3M 7m 8P 10M 12P', // 3 7 1 3 5
    '1P 7m 8P 10M 12P', // 1 7 1 3 5
    '3M 7m 8P 10M 14m', // 3 7 1 3 7
    '7m 10M 12P 14m 15P', // 7 3 5 7 1
    '3M 7m 10M 12P 15P', // 3 7 3 5 1
    '7m 10M 12P 15P 17M', // 7 3 5 1 3
    // [C, D, Eb, E, F]:[3 7 1 3 5]
    // [Db, Gb]:[3 7 3 5 1]
    // [G]:[1 5 7 1 3]
    // [Ab]:[7 3 5 1 3]
    // [A, Bb, B]:[7 3 5 7 1]
  ],
  '^7#11': [
    // manchmal / 3
    '3M 7M 8P 10M 11A', // 3 7 1 3 11
    '1P 5P 7M 10M 11A', // 1 5 7 3 11
    '3M 7M 8P 11A 14M', // 3 7 1 11 7
    '5P 8P 10M 11A 14M', // 5 1 3 11 7
  ],
  '7#11': [
    '3M 7m 9M 11A 13M', // 3 7 9 11 6
    '7m 10M 11A 13M 16M', // 7 3 #11 6 9 // Db7#11 aus twinbay
  ],
  m7b5: [
    '5d 8P 10m 14m 17m', // 5 1 3 7 3
    '3m 7m 8P 10m 12d', // 3 7 1 3 5
    '5d 7m 8P 10m 14m', // 5 7 1 3 7 // x
    // '7m 10m 11P 12d 14m', // 7 3 4 5 7 // Am7b5 autumn leaves
    '7m 10m 12d 14m 15P', // 7 3 5 7 1 // Am7b5 autumn leaves
    // C: 5 7 1 3 7
  ],
  '': [
    '5P 8P 10M 12P 15P', // 5 1 3 5 1
    // C: 5 1 3 5 1
  ],
  '-': [
    '5P 8P 10m 12P 15P', // 5 1 3 5 1
    // C: 5 1 3 5 1
  ],
  '7b9': [
    '7m 9m 10M 14m 15P', // 7 b9 3 7 1
    '1P 3M 7m 9m 10M', // 1 3 7 9 3 // G7b9 twinbay
    '3M 7m 8P 9m 14m', // 3 7 1 9 7 // x
    // C: 3 7 1 9 7
  ],
  '7b13': [
    '3M 7m 8P 13m 14m', // 3 7 1 13 7 // D7b13 autumn leaves
  ],
});

addVoicings('ireal-notension', {
  '^7': [
    '1P 5P 7M 10M 12P', // 1 5 7 3 5 // x
    '3M 8P 10M 12P 14M', // 3 1 3 5 7 // x
    '5P 8P 10M 12M 14M', // 5 1 3 5 7 // x
    '3M 7M 10M 12P 15P', // 3 7 3 5 1 // x
    '5P 8P 10M 14M 17M', // 5 1 3 7 3 // x
    //
    // C,B : 5 1 3 5 7
    // Db, D, Eb: 3 1 3 5 7
    // E: 3 7 1 3 5
    // F,Gb,G: 1 5 7 3 5
    // Ab,A,Bb: 5 1 3 7 3
  ],
  m7: [
    '1P 3m 5P 7m 10m', // 1 3 5 7 3 // x
    '1P 5P 7m 10m 12P', // 1 5 7 3 5  // x
    '3m 7m 8P 10m 12P', // 3 7 1 3 5  // x
    '3m 7m 8P 10m 14m', // 3 7 1 3 7 // x
    '5P 7m 8P 10m 14m', // 5 7 1 3 7 // x
    // '7m 10m 12P 14m 15P', // 7 3 5 7 1 // ?
    '5P 8P 10m 14m 17m', // 5 1 3 7 3 // x
    '7m 10m 12P 15P 17m', // 7 3 5 1 3 // x
    // C,D,Eb: 3 7 1 3 7 Db
    // E,F: 3 7 1 3 5 C
    // Db: 5 7 1 3 7 B
    // Gb: 1 5 7 3 5 Db
    // G,Ab: 1 3 5 7 3 Bb
    // A: 7 3 5 1 3
    // Bb,B: 5 1 3 7 3
  ],
  6: [
    '5P 8P 10M 12P 13M', // 5 1 3 5 6
    '3M 5P 8P 10M 13M', // 3 5 1 3 6
    // C, Db: 5 1 3 5 6
    // D, Eb: 3 5 1 3 6
  ],
  7: [
    // ohne Erweiterungen
    '1P 5P 7m 8P 10M', // 1 5 7 1 3
    '3M 7m 8P 10M 12P', // 3 7 1 3 5
    // '1P 7m 8P 10M 12P', // 1 7 1 3 5 ?
    //'3M 7m 8P 10M 14m', // 3 7 1 3 7 ?
    '7m 10M 12P 14m 15P', // 7 3 5 7 1
    '3M 7m 10M 12P 15P', // 3 7 3 5 1
    '7m 10M 12P 15P 17M', // 7 3 5 1 3
    // [C, D, Eb, E, F]:[3 7 1 3 5]
    // [Db, Gb]:[3 7 3 5 1]
    // [G]:[1 5 7 1 3]
    // [Ab]:[7 3 5 1 3]
    // [A, Bb, B]:[7 3 5 7 1]
  ],
  '^7#11': [
    '5P 8P 10M 11A 14M', // 5 1 3 4 7
    '3M 7M 8P 11A 14M', // 3 7 1 4 7
    // C: 5 1 3 4 7
    // Db,D: 3 7 1 4 7
  ],
  '7#11': [
    '7m 10M 11A 14m 15P', // 7 3 11 7 1
    '3M 7m 8P 10M 11A', // 3 7 1 3 11
    // C: 7 3 11 7 1
    // Db,D: 3 7 1 3 11
  ],
  9: [
    '3M 7m 8P 12P 16M', // 3 7 1 5 9
    '3M 7m 8P 9M 12P', // 3 7 1 9 5
    // C,Db: 3 7 1 5 9
    // D,Eb: 3 7 1 9 5
  ],
  '7#9': [
    '3M 7m 8P 9A 14m', // 3 7 1 9 7
    // C,Db,D,Eb: 3 7 1 9 7
  ],
  13: [
    '7m 8P 9M 10M 13M', //7 1 9 3 13
    '3M 7m 8P 9M 13M', // 3 7 1 9 6
    // C,Db: 7 1 9 3 13
    // D,Eb: 3 7 1 9 6
  ],
  m7b5: [
    '5d 7m 8P 10m 14m', // 5 7 1 3 7
    '3m 7m 8P 5d 7m', // 3 7 1 5 7
    // C,Db: 5 7 1 3 7
    // D,Eb: 3 7 1 5 7
  ],
  '-9': [
    '3m 7m 8P 9M 12P', // 3 7 1 9 5
    '5P 8P 9M 10m 14m', // 5 1 9 3 7
    '3m 7m 9M 12P 15P', // 3 7 9 5 1
    // C,Db: 5 1 9 3 7
    // D: 3 7 9 5 1
    // Eb: 3 7 1 9 5
  ],
  o7: [
    '5d 10m 12d 13M 15P', // b5 b3 b5 6 1
    '3m 8P 12d 13M 15P', // 3 1 b5 6 1
    // C: b5 b3 b5 6 1
    // D: 3 1 b5 6 1
  ],
  '7sus': [
    '5P 8P 11P 12P 14m', // 5 1 4 5 7
    //C,Db,D: 5 1 4 5 7
  ],
  '': [
    '3M 5P 8P 10M 12P', // 3 5 1 3 5
    '5P 8P 10M 12P 15P', // 5 1 3 5 1
    '3M 8P 10M 12P 15P', // 3 1 3 5 1
    // C: 5 1 3 5 1
    // Db,D: 3 1 3 5 1
    // Eb: 3 5 1 3 5
  ],
  '-': [
    '3m 5P 8P 10m 12P', // 3 5 1 3 5
    '5P 8P 10m 12P 15P', // 5 1 3 5 1
    // C,Db: 5 1 3 5 1
    // D: 3 5 1 3 5
    // Eb: 3 5 1 3 5
  ],
  '-11': [
    '5P 8P 11P 14m',
    '3m 7m 9M 15P',
    // C,Db: 5 1 4 7
    // D: 3 7 9 11 1
  ],
  '-^7': [
    '3m 7M 8P 10m 12P',
    '5P 7M 8P 10m 14M',
    // C,Db: 5 7 1 3 7
    // D: 3 7 1 3 5
  ],
  '7b13': [
    '3M 7m 8P 13m 14m',
    // C,Db,D: 3 7 1 6 7
  ],
  '7b9': [
    '3M 7m 8P 9m 14m', // 3 7 1 9 7 // x
    // C,Db,D,Eb: 3 7 1 9 7
  ],
}); */
