import { Pattern } from '@strudel.cycles/core/strudel.mjs';

const _name = (name, pat) => pat.withValue(x => ({ [name]: x }));

export const s = pat => _name("s", pat);
Pattern.prototype.s = function (pat) { return (this.union(s(pat))) };
export const snd = s;
Pattern.prototype.snd = Pattern.prototype.s;
export const sound = s;
Pattern.prototype.sound = Pattern.prototype.s;
export const n = pat => _name("n", pat);
Pattern.prototype.n = function (pat) { return (this.union(n(pat))) };
export const num = n;
Pattern.prototype.num = Pattern.prototype.n;
export const number = n;
Pattern.prototype.number = Pattern.prototype.n;
export const room = pat => _name("room", pat);
Pattern.prototype.room = function (pat) { return (this.union(room(pat))) };
export const size = pat => _name("size", pat);
Pattern.prototype.size = function (pat) { return (this.union(size(pat))) };
export const speed = pat => _name("speed", pat);
Pattern.prototype.speed = function (pat) { return (this.union(speed(pat))) };

