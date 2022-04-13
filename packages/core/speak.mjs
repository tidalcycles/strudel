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
