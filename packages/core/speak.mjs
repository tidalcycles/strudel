/*
speak.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/speak.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, patternify2 } from './index.mjs';

const synth = window?.speechSynthesis;
let allVoices = synth?.getVoices();
// console.log('voices', allVoices);

function speak(words, lang, voice) {
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(words);
  utterance.lang = lang;
  allVoices = synth.getVoices();
  const voices = allVoices.filter((v) => v.lang.includes(lang));
  if (typeof voice === 'number') {
    utterance.voice = voices[voice % voices.length];
  } else if (typeof voice === 'string') {
    utterance.voice = voices.find((voice) => voice.name === voice);
  }
  // console.log(utterance.voice?.name, utterance.voice?.lang);
  speechSynthesis.speak(utterance);
}

Pattern.prototype._speak = function (lang, voice) {
  return this._withEvent((event) => {
    const onTrigger = (time, event) => {
      speak(event.value, lang, voice);
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};

Pattern.prototype.speak = function (lang, voice) {
  return patternify2(Pattern.prototype._speak)(reify(lang), reify(voice), this);
};
