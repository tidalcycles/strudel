import { Pattern, sequence } from '@strudel.cycles/core/strudel.mjs';

const _name = (name, ...pats) => sequence(...pats).withValue((x) => ({ [name]: x }));

const _unionise = (func) =>
  function (...pats) {
    return this.union(func(...pats));
  };

export const s = (...pats) => _name('s', ...pats);
Pattern.prototype.s = _unionise(s);
export const sound = s;
Pattern.prototype.sound = Pattern.prototype.s;

export const n = (pat) => _name('n', pat);
Pattern.prototype.n = _unionise(n);
export const number = n;
Pattern.prototype.number = Pattern.prototype.n;

export const room = (pat) => _name('room', pat);
Pattern.prototype.room = _unionise(room);

export const size = (pat) => _name('size', pat);
Pattern.prototype.size = _unionise(size);

export const speed = (pat) => _name('speed', pat);
Pattern.prototype.speed = _unionise(speed);

export const squiz = (pat) => _name('squiz', pat);
Pattern.prototype.squiz = _unionise(squiz);

// currently overwritten by tone package
export const gain = (pat) => _name('gain', pat);
Pattern.prototype.gain = _unionise(gain);

export const vowel = (pat) => _name('vowel', pat);
Pattern.prototype.vowel = _unionise(vowel);