
/*test for issue 302 support alternative solmization types */
import { midi2note } from '../util.mjs';

console.log(midi2note(60, 'letters')); /* should be C4*/
console.log(midi2note(60, 'solfeggio')); /* should be Do4*/
console.log(midi2note(60, 'indian')); /* should be Sa4*/
console.log(midi2note(60, 'german')); /* should be C4*/
console.log(midi2note(60, 'byzantine')); /* should be Ni4*/
console.log(midi2note(60, 'japanese')); /* should be I4*/

console.log(midi2note(70, 'letters')); /* should be Bb4*/
console.log(midi2note(70, 'solfeggio')); /* should be Sib4*/
console.log(midi2note(70, 'indian')); /* should be Ni4*/
console.log(midi2note(70, 'german')); /* should be Hb4*/
console.log(midi2note(70, 'byzantine')); /* should be Zob4*/
console.log(midi2note(70, 'japanese')); /* should be To4*/
