/*
  Live Coding Functions
  Author: Steven Yi
*/ 

instr S1
  ifreq = p4
  iamp = p5
endin

instr P1
  ibeat = p4
endin

;; TIME

gk_tempo init 120 


/** Set tempo of global clock to itempo value in beats per minute. */
opcode set_tempo,0,i
  itempo xin
  gk_tempo init itempo
endop

/** Returns tempo of global clock in beats per minute. */
opcode get_tempo,i,0
  xout i(gk_tempo)
endop

/** Adjust tempo of global clock towards by inewtempo by incr amount. */
opcode go_tempo, 0, ii
  inewtempo, incr xin

  icurtempo = i(gk_tempo)
  itemp init icurtempo 

  if(inewtempo > icurtempo) ithen
    itemp = min:i(inewtempo, icurtempo + abs(incr))
    gk_tempo init itemp 
  elseif (inewtempo < icurtempo) ithen
    itemp = max:i(inewtempo, icurtempo - abs(incr))
    gk_tempo init itemp 
  endif
endop

instr Perform
  ibeat = p4

  schedule("P1", 0, p3, ibeat) 
endin


gk_clock_internal init 0
gk_clock_tick init 0
gk_now init 0

/** Returns value of now beat time
   (Code used from Thorin Kerr's LivecodeLib.csd) */
opcode now, i, 0
  xout i(gk_now)
endop

/** Returns current clock tick at init time */
opcode now_tick, i, 0
  xout i(gk_clock_tick)
endop

/** Returns duration of time in given number of beats (quarter notes) */
opcode beats, i, i
  inumbeats xin
  ibeatdur = divz(60, i(gk_tempo), -1)
  xout ibeatdur * inumbeats
endop

/** Returns duration of time in given number of measures (4 quarter notes) */
opcode measures, i, i
  inummeasures xin
  xout beats(inummeasures * 4)
endop

/** Returns duration of time in given number of ticks (16th notes) */
opcode ticks, i, i
  inumbeats xin
  ibeatdur = divz(60, i(gk_tempo), -1)
  ibeatdur = ibeatdur / 4
  xout ibeatdur * inumbeats
endop

/** Returns time from now for next beat, rounding to align
    on beat boundary. 
   (Code used from Thorin Kerr's LivecodeLib.csd) */
opcode next_beat, i, p
  ibeatcount xin
  inow = now()
  ibc = frac(ibeatcount)
  inudge = int(ibeatcount)
  iresult = inudge + ibc + (round(divz(inow, ibc, inow)) * (ibc == 0 ? 1 : ibc)) - inow
  xout beats(iresult)
endop

/** Returns time from now for next measure, rounding to align to measure  
    boundary. */
opcode next_measure, i,0
  inow = now() % 4
  ival = 4 - inow 
  if(ival < 0.25) then
    ival += 4
  endif
  inext = beats(ival)
  xout inext
endop

/** Reset clock so that next tick starts at 0 */
opcode reset_clock, 0, 0
  gk_clock_internal init 0 
  gk_clock_tick init -1 
  gk_now init -(ksmps / sr)
endop

/** Adjust clock by iadjust number of beats.
    Value may be positive or negative. */
opcode adjust_clock, 0, i 
  iadjust xin
  gk_now init i(gk_now) + iadjust 
endop


instr Clock ;; our clock  
  ;; tick at 1/16th note
  kfreq = (4 * gk_tempo) / 60     ;; frequency of 16th note
  kdur = 1 / kfreq                ;; duration of 16th note in seconds 
  kstep = (gk_tempo / 60) / kr    ;; step size in quarter notes per buffer
  kstep16th = kfreq / kr          ;; step size in 16th notes per buffer
  gk_now += kstep                 ;; advance beat clock
  gk_clock_internal += kstep16th  ;; advance 16th note clock

  // checks if next buffer will be one where clock will
  // trigger.  If so, then schedule event for time 0 
  // which will get processed next buffer. 
  if(gk_clock_internal + kstep16th >= 1.0 ) then
    gk_clock_internal -= 1.0 
    gk_clock_tick += 1 
    event("i", "Perform", 0, kdur, gk_clock_tick)
  endif
endin

;; Randomization

/** Given a random chance value between 0 and 1, calculates a random value and
returns 1 if value is less than chance value. For example, giving a value of 0.7,
it can read as "70 percent of time, return 1; else 0" */
opcode choose, i, i
  iamount xin
  ival = 0

  if(random(0,1) < limit:i(iamount, 0, 1)) then
    ival = 1 
  endif
  xout ival
endop

;; Array Functions

/** Cycles through karray using index. */
opcode cycle, i, ik[]
  indx, kvals[] xin
  ival = i(kvals, indx % lenarray(kvals))
  xout ival
endop


/** Checks to see if item exists within array. Returns 1 if
  true and 0 if false. */
opcode contains, i, ii[]
  ival, iarr[] xin
  indx = 0
  iret = 0
  while (indx < lenarray:i(iarr)) do
    if (iarr[indx] == ival) then
      iret = 1
      igoto end
    endif
    indx += 1
  od
end:
  xout iret
endop 

/** Checks to see if item exists within array. Returns 1 if
  true and 0 if false. */
opcode contains, i, ik[]
  ival, karr[] xin
  indx = 0
  iret = 0
  while (indx < lenarray:i(karr)) do
    if (i(karr,indx) == ival) then
      iret = 1
      igoto end
    endif
    indx += 1
  od
end:
  xout iret
endop 

/** Create a new array by removing all instances of a
given number from an existing array. */ 
opcode remove, k[], ik[]
  ival, karr[] xin
 
  ifound = 0
  indx = 0
  while (indx < lenarray:i(karr)) do
  	if(i(karr, indx) == ival) then
      ifound += 1
    endif
    indx += 1
  od

  kout[] init (lenarray:i(karr) - ifound)
    
  indx = 0
  iwriteIndx = 0
  
  while (indx < lenarray:i(karr)) do
    iv = i(karr, indx)
    if(iv != ival) then
      kout[iwriteIndx] init iv
      iwriteIndx += 1
    endif
    indx += 1
  od
    
  xout kout
endop

/** Returns random item from karray. */
opcode rand, i, k[]
  kvals[] xin
  indx = int(random(0, lenarray(kvals)))
  ival = i(kvals, indx)
  xout ival
endop

/** Returns random item from String array. */
opcode rand, S, S[]
  Svals[] xin
  indx = int(random(0, lenarray(Svals)))
  Sval = Svals[indx]
  xout Sval
endop

/** Returns random item from karray. */
opcode randk, k, k[]
  kvals[] xin
  kndx = int(random:k(0, lenarray:k(kvals)))
  kval = kvals[kndx]
  xout kval
endop

/** Returns random item from karray. */
opcode randk, S, S[]
  Svals[] xin
  kndx = int(random:k(0, lenarray:k(Svals)))
  Sval = Svals[kndx]
  xout Sval
endop


;; Event

/** Wrapper opcode that calls schedule only if iamp > 0 and ifreq > 0. */
opcode cause, 0, Siiii
  Sinstr, istart, idur, ifreq, iamp xin
  if(ifreq > 0 && iamp > 0) then
    schedule(Sinstr, istart, idur, ifreq, iamp)
  endif
endop

;; Beats

/** Given a hexadecimal beat string pattern and optional
itick (defaults to current now_tick()), returns value 1 if
the given tick matches a hit in the hexadecimal beat, or 
returns 0 otherwise. */
opcode hexbeat, i, So
  Spat, itick xin

  if(itick <= 0) then
    itick = now_tick()
  endif

  istrlen = strlen(Spat)

  iout = 0

  if (istrlen > 0) then
    ;; 4 bits/beats per hex value
    ipatlen = strlen(Spat) * 4
    ;; get beat within pattern length
    itick = itick % ipatlen
    ;; figure which hex value to use from string
    ipatidx = int(itick / 4)
    ;; figure out which bit from hex to use
    ibitidx = itick % 4 
    
    ;; convert individual hex from string to decimal/binary
    ibeatPat = strtol(strcat("0x", strsub(Spat, ipatidx, ipatidx + 1))) 

    ;; bit shift/mask to check onset from hex's bits
    iout = (ibeatPat >> (3 - ibitidx)) & 1 
  endif

  xout iout

endop


/** Given hex beat pattern, use given itick to fire 
  events for given instrument, duration, frequency, and
  amplitude */
opcode hexplay, 0, SiSiip
  Spat, itick, Sinstr, idur, ifreq, iamp xin

  if(ifreq > 0 && iamp > 0 && strlen(Sinstr) > 0 && hexbeat(Spat, itick) == 1) then
    schedule(Sinstr, 0, idur, ifreq, iamp )
  endif
endop

/** Given hex beat pattern, use global clock to fire 
  events for given instrument, duration, frequency, and
  amplitude */
opcode hexplay, 0, SSiip
  Spat, Sinstr, idur, ifreq, iamp xin

  itick = i(gk_clock_tick)

  if(ifreq > 0 && iamp > 0 && strlen(Sinstr) > 0 && hexbeat(Spat, itick) == 1) then
    schedule(Sinstr, 0, idur, ifreq, iamp )
  endif
endop


/** Given an octal beat string pattern and optional
itick (defaults to current now_tick()), returns value 1 if
the given tick matches a hit in the octal beat, or 
returns 0 otherwise. */
opcode octalbeat, i, Si
  Spat, itick xin

  ;; 3 bits/beats per octal value
  ipatlen = strlen(Spat) * 4
  ;; get beat within pattern length
  itick = itick % ipatlen
  ;; figure which octal value to use from string
  ipatidx = int(itick / 3)
  ;; figure out which bit from octal to use
  ibitidx = itick % 3 
  
  ;; convert individual octal from string to decimal/binary
  ibeatPat = strtol(strcat("0", strsub(Spat, ipatidx, ipatidx + 1))) 

  ;; bit shift/mask to check onset from hex's bits
  xout (ibeatPat >> (2 - ibitidx)) & 1 

endop

opcode octalplay, 0, SiSiip
  Spat, ibeat, Sinstr, idur, ifreq, iamp xin

  if(octalbeat(Spat, ibeat) == 1) then
    schedule(Sinstr, 0, idur, ifreq, iamp )
  endif
endop

opcode octalplay, 0, SSiip
  Spat, Sinstr, idur, ifreq, iamp xin

  itick = i(gk_clock_tick)

  if(octalbeat(Spat, itick) == 1) then
    schedule(Sinstr, 0, idur, ifreq, iamp )
  endif
endop

;; Phase Functions

/** Given count and period, return phase value in range [0-1) */
opcode phs, i, ii
  icount, iperiod xin
  xout (icount % iperiod) / iperiod 
endop

/** Given period in ticks, return current phase of global
  clock in range [0-1) */
opcode phs, i, i
  iticks xin
  xout (i(gk_clock_tick) % iticks) / iticks
endop

/** Given period in beats, return current phase of global
  clock in range [0-1) */
opcode phsb, i, i
  ibeats xin
  iticks = ibeats * 4
  xout (i(gk_clock_tick) % iticks) / iticks
endop

/** Given period in measures, return current phase of global
  clock in range [0-1) */
opcode phsm, i, i
  imeasures xin
  iticks = imeasures * 4 * 4
  xout (i(gk_clock_tick) % iticks) / iticks
endop


;; Iterative Euclidean Beat Generator
;; Returns string of 1 and 0's
opcode euclid_str, S, ii
  ihits, isteps xin

  Sleft = "1"
  Sright = "0"

  ileft = ihits
  iright = isteps - ileft

  while iright > 1 do
    if (iright > ileft) then
      iright = iright - ileft 
      Sleft = strcat(Sleft, Sright)
    else
      itemp = iright
      iright = ileft - iright
      ileft = itemp 
      Stemp = Sleft
      Sleft = strcat(Sleft, Sright)
      Sright = Stemp
    endif
  od

  Sout = ""
  indx = 0 
  while (indx < ileft) do
    Sout = strcat(Sout, Sleft)
    indx += 1
  od
  indx = 0 
  while (indx < iright) do
    Sout = strcat(Sout, Sright)
    indx += 1
  od

  xout Sout
endop


/** Given number of ihits for a period of isteps and an optional
itick (defaults to current now_tick()), returns value 1 if
the given tick matches a hit in the euclidean rhythm, or 
returns 0 otherwise. */
opcode euclid, i, iio
  ihits, isteps, itick  xin

  if(itick <= 0) then
    itick = now_tick()
  endif

  Sval = euclid_str(ihits, isteps)
  indx = itick % strlen(Sval)
  xout strtol(strsub(Sval, indx, indx + 1))
endop

opcode euclidplay, 0, iiiSiip
  ihits, isteps, itick, Sinstr, idur, ifreq, iamp xin

  if(euclid(ihits, isteps, itick) == 1) then
    schedule(Sinstr, 0, idur, ifreq, iamp)
  endif
endop


opcode euclidplay, 0, iiSiip
  ihits, isteps, Sinstr, idur, ifreq, iamp xin

  itick = i(gk_clock_tick)

  if(euclid(ihits, isteps, itick) == 1) then
    schedule(Sinstr, 0, idur, ifreq, iamp)
  endif
endop

;; Phase-based Oscillators 

/** Returns cosine of given phase (0-1.0) */
opcode xcos, i,i
  iphase  xin
  xout cos(2 * $M_PI * iphase)
endop

/** Range version of xcos, similar to Impromptu's cosr */
opcode xcos, i,iii
  iphase, ioffset, irange  xin
  xout ioffset + (cos(2 * $M_PI * iphase) * irange)
endop

/** Returns sine of given phase (0-1.0) */
opcode xsin, i,i
  iphase  xin
  xout sin(2 * $M_PI * iphase)
endop

/** Range version of xsin, similar to Impromptu's sinr */
opcode xsin, i,iii
  iphase, ioffset, irange  xin
  xout ioffset + (sin(2 * $M_PI * iphase) * irange)
endop

/** Non-interpolating oscillator. Given phase in range 0-1, 
returns value within the give k-array table. */
opcode xosc, i, ik[]
  iphase, kvals[]  xin
  indx = int(lenarray:i(kvals) * (iphase % 1))  
  xout i(kvals, indx)
endop


/** Non-interpolating oscillator. Given phase duration in beats, 
returns value within the give k-array table. (shorthand for xosc(phsb(ibeats), karr) )*/
opcode xoscb, i,ik[]
  ibeats, kvals[] xin
  xout xosc(phsb(ibeats), kvals)
endop

/** Non-interpolating oscillator. Given phase duration in measures, 
returns value within the give k-array table. (shorthand for xosc(phsm(ibeats), karr) )*/
opcode xoscm, i, ik[]
  ibeats, kvals[] xin
  xout xosc(phsm(ibeats), kvals)
endop


/** Linearly-interpolating oscillator. Given phase in range 0-1, 
returns value intepolated within the two closest points of phase within k-array
table. */
opcode xosci, i, ik[]
  iphase, kvals[]  xin
  ilen = lenarray:i(kvals)
  indx = ilen * (iphase % 1)
  ibase = int(indx)  
  ifrac = indx - ibase 

  iv0 = i(kvals, ibase)  
  iv1 = i(kvals, (ibase + 1) % ilen) 
  xout iv0 + (iv1 - iv0) * ifrac
endop


/** Linearly-interpolating oscillator. Given phase duration in beats, 
returns value intepolated within the two closest points of phase within k-array
table. (shorthand for xosci(phsb(ibeats), karr) )*/
opcode xoscib, i,ik[]
  ibeats, kvals[] xin
  xout xosci(phsb(ibeats), kvals)
endop

/** Linearly-interpolating oscillator. Given phase duration in measures, 
returns value intepolated within the two closest points of phase within k-array
table. (shorthand for xosci(phsm(ibeats), karr) )*/
opcode xoscim, i,ik[]
  ibeats, kvals[] xin
  xout xosci(phsm(ibeats), kvals)
endop

/** Line (Ramp) oscillator. Given phase in range 0-1, return interpolated value between given istart and iend. */
opcode xlin, i, iii
  iphase, istart, iend xin
  xout istart + (iend - istart) * iphase
endop

;; Duration Sequences

/** Given a tick value and array of durations, returns new duration value for tick. */
opcode xoscd, i, ik[]
  itick, kdurs[] xin
  indx = 0
  isum = 0
  ilen = lenarray:i(kdurs)
  ival = 0

  while (indx < ilen) do
    isum += i(kdurs, indx)
    indx += 1
  od

  itick = itick % isum
  indx = 0
  ival = 0
  icur = 0

  while (indx < ilen) do
    itemp = i(kdurs, indx) 

    if(itick < icur + itemp) then
      ival = itemp 
      indx += ilen
    else
      icur += abs(itemp)
    endif
    
    indx += 1
  od

  xout ival 

 endop 


/** Given an array of durations, returns new duration value for current clock tick. Useful with mod division and cycle for additive/subtractive rhythms. */
opcode xoscd, i, k[]
  kdurs[] xin
  xout xoscd(now_tick(), kdurs)
endop


/** Given a tick value and array of durations, returns new duration or 0 depending upon whether tick hits a new duration value. Values
may be positive or negative, but not zero. Negative values can be interpreted as rest durations. */
opcode dur_seq, i, ik[]
  itick, kdurs[] xin
  ival = 0
  icur = 0
  ilen = lenarray:i(kdurs)
  itotal = 0

  indx = 0
  while (indx < ilen) do
    itotal += abs:i(i(kdurs, indx))
    indx += 1
  od

  ;print itotal

  indx = 0
  itick = itick % itotal

  while (indx < ilen) do
    itemp = i(kdurs, indx) 
    if(icur == itick) then
      ival = itemp 
      indx += ilen
    elseif (icur > itick) then
      indx += ilen 
    else
      icur += abs(itemp)
    endif
    
    indx += 1
  od
  xout ival 
endop


/** Given an array of durations, returns new duration or 0 depending upon
 * whether current clock tick hits a new duration value. Values
may be positive or negative, but not zero. Negative values can be interpreted
as rest durations. */
opcode dur_seq, i, k[]
  kdurs[] xin
  xout dur_seq(now_tick(), kdurs)
endop

/** Experimental opcode for generating melodic lines given array of durations, pitches, and amplitudes. Durations follow dur_seq practice that negative values are rests. Pitch and amp array indexing wraps according to their array lengths given index of non-rest duration value currently fired. */ 
opcode melodic, iii, ik[]k[]k[]
  itick, kdurs[], kpchs[], kamps[] xin

  idur = dur_seq(itick, kdurs)
  ipch = 0
  iamp = 0

  indx = 0
  itotal = 0
  ilen = lenarray:i(kdurs)

  while (indx < ilen) do
    itotal += abs:i(i(kdurs, indx))
    indx += 1
  od

  itick = itick % itotal

  if(idur > 0) then
    indx = 0
    icur = 0
    ivalindx = 0

    while (indx < ilen) do
      itemp = i(kdurs, indx) 

      if(icur == itick) then
        indx += ilen
      elseif (icur > itick) then
        indx += ilen 
      else
        if (itemp > 0) then
          ivalindx += 1 
        endif

        icur += abs(itemp)
      endif
      
      indx += 1
    od

    ipch = i(kpchs, ivalindx % lenarray:i(kpchs))
    iamp = i(kamps, ivalindx % lenarray:i(kamps))
  endif

  xout idur, ipch, iamp
endop

/** Experimental opcode for generating melodic lines given array of durations, pitches, and amplitudes. Durations follow dur_seq practice that negative values are rests. Pitch and amp array indexing wraps according to their array lengths given index of non-rest duration value currently fired. */ 
opcode melodic, iii, k[]k[]k[]
  kdurs[], kpchs[], kamps[] xin
  idur, ipch, iamp = melodic(now_tick(), kdurs, kpchs, kamps)
  xout idur, ipch, iamp
endop

;; String functions

/** 
  rotate - Rotates string by irot number of values.  
  (Inspired by rotate from Charlie Roberts' Gibber.)
*/
opcode rotate, S, Si
  Sval, irot xin

  ilen = strlen(Sval)
  irot = irot % ilen
  Sout = strcat(strsub(Sval, irot, ilen), strsub(Sval, 0, irot))
  xout Sout
endop


/** Repeats a given String x number of times. For example, `Sval = strrep("ab6a", 2)` will produce the value of "ab6aab6a". Useful in working with Hex beat strings.  */
opcode strrep, S, Si
  Sval, inum xin
    
  Sout = Sval
  indx = 1
  while (indx < inum) do
    Sout = strcat(Sout, Sval) 
    indx += 1
  od

  xout Sout
endop


;; Channel Helper

/** Sets i-rate value into channel and sets initialization to true. Works together 
  with xchan */
opcode xchnset, 0, Si
  SchanName, ival xin
  Sinit = sprintf("%s_initialized", SchanName)
  chnset(1, Sinit)
  chnset(ival, SchanName)
endop

/** xchan 
  Initializes a channel with initial value if channel has default value of 0 and
  then returns the current value from the channel. Useful in live coding to define
  a dynamic point that will be automated or set outside of the instrument that is
  using the channel. 

  Opcode is overloaded to return i- or k- value. Be sure to use xchan:i or xchan:k
  to specify which value to use. 
*/
opcode xchan, i,Si
  SchanName, initVal xin
   
  Sinit = sprintf("%s_initialized", SchanName)
  if(chnget:i(Sinit) == 0) then
    chnset(1, Sinit)
    chnset(initVal, SchanName)
  endif
  xout chnget:i(SchanName)
endop

/** xchan 
  Initializes a channel with initial value if channel has default value of 0 and
  then returns the current value from the channel. Useful in live coding to define
  a dynamic point that will be automated or set outside of the instrument that is
  using the channel. 

  Opcode is overloaded to return i- or k- value. Be sure to use xchan:i or xchan:k
  to specify which value to use. 
*/
opcode xchan, k,Si
  SchanName, initVal xin
    
  Sinit = sprintf("%s_initialized", SchanName)
  if(chnget:i(SchanName) == 0) then
    chnset(1, Sinit)
    chnset(initVal, SchanName)
  endif
  xout chnget:k(SchanName)
endop

;; SCALE/HARMONY (experimental)

gi_scale_major[] = array(0, 2, 4, 5, 7, 9, 11) 
gi_scale_minor[] = array(0, 2, 3, 5, 7, 8, 10)

gi_cur_scale[] = gi_scale_minor
gi_scale_base = 60
gi_chord_offset = 0

/** Set root note of scale in MIDI note number. */
opcode set_root, 0,i 
  iscale_root xin
  gi_scale_base = iscale_root
endop

/** Calculate frequency from root note of scale, using 
octave and pitch class. */
opcode from_root, i, ii
  ioct, ipc xin
  ival = gi_scale_base + (ioct * 12) + ipc
  xout cpsmidinn(ival)
endop

/** Set the global scale.  Currently supports "maj" for major and "min" for minor scales. */
opcode set_scale, 0,S
  Scale xin
  if(strcmp("maj", Scale) == 0) then
    gi_cur_scale = gi_scale_major
  else
    gi_cur_scale = gi_scale_minor
  endif
endop

/** Calculate frequency from root note of scale, using 
octave and scale degree. */
opcode in_scale, i, ii
  ioct, idegree xin

  ibase = gi_scale_base + (ioct * 12)

  idegrees = lenarray(gi_cur_scale)

  ioct = int(idegree / idegrees)
  indx = idegree % idegrees

  if(indx < 0) then
    ioct -= 1
    indx += idegrees
  endif

  xout cpsmidinn(ibase + (ioct * 12) + gi_cur_scale[int(indx)]) 
endop

/** Calculate frequency from root note of scale, using 
octave and scale degree. (k-rate version of opcode) */
opcode in_scale, k, kk 
  koct, kdegree xin

  kbase = gi_scale_base + (koct * 12)

  idegrees = lenarray(gi_cur_scale)

  koct = int(kdegree / idegrees)
  kndx = kdegree % idegrees

  if(kndx < 0) then
    koct -= 1
    kndx += idegrees
  endif

  xout cpsmidinn(kbase + (koct * 12) + gi_cur_scale[int(kndx)]) 
endop

/** Quantizes given MIDI note number to the given scale 
    (Base on pc:quantize from Extempore) */
opcode pc_quantize, i, ii[]
  ipitch_in, iscale[] xin
  inotenum = round:i(ipitch_in)
  ipc = inotenum % 12
  iout = inotenum
  
  
  indx = 0
  while (indx < 7) do
    if(contains(ipc + indx, iscale) == 1) then
      iout = inotenum + indx
      goto end
    elseif (contains(ipc - indx, iscale) == 1) then
      iout = inotenum - indx
      goto end
    endif
    indx += 1
  od
  end:
  xout iout
endop

/** Quantizes given MIDI note number to the current active scale 
    (Base on pc:quantize from Extempore) */
opcode pc_quantize, i, i
  ipitch_in xin
  ival = pc_quantize(ipitch_in, gi_cur_scale)
  xout ival
endop  

/* BELOW CHORD SYSTEM IS EXPERIMENTAL */

gi_chord_base = 0 
gi_chord_maj[] = array(0,4,7)
gi_chord_maj7[] = array(0,4,7,11)
gi_chord_min[] = array(0,3,7)
gi_chord_min7[] = array(0,3,7,10)
gi_chord_dim[] = array(0,3,6)
gi_chord_dim7[] = array(0,3,6,9)
gi_chord_aug[] = array(0,4,8)
gi_chord_current[] = gi_chord_maj 

opcode set_chord, 0, ii[]
  ichord_root, ichord_intervals[] xin
  gi_chord_base = ichord_root
  gi_chord_current = ichord_intervals
endop

opcode set_chord, 0, S 
  Schord xin
endop

opcode in_chord, i, ii
  ioct, idegree xin

  ibase = gi_scale_base + (ioct * 12) + gi_chord_base

  idegrees = lenarray(gi_chord_current)

  ioct = int(idegree / idegrees)
  indx = idegree % idegrees

  if(indx < 0) then
    ioct -= 1
    indx += idegrees
  endif

  xout cpsmidinn(ibase + (ioct * 12) + gi_chord_current[indx]) 
endop

;; AUDIO

/** Utility opcode for declicking an audio signal. Should only be used in instruments that have positive p3 duration. */
opcode declick, a, a
  ain xin
  aenv = linseg:a(0, 0.01, 1, p3 - 0.02, 1, 0.01, 0, 0.01, 0)
  xout ain * aenv
endop

/** Custom non-interpolating oscil that takes in kfrequency and array to use as oscillator table
data. Outputs k-rate signal. */
opcode oscil, k, kk[]
  kfreq, kin[] xin
  ilen = lenarray(kin)
  kphs = phasor:k(kfreq)
  kout = kin[int(kphs * ilen) % ilen]
  xout kout
endop


;; KILLING INSTANCES

instr KillImpl
  Sinstr = p4 
  if (nstrnum(Sinstr) > 0) then
    turnoff2(Sinstr, 0, 0)
  endif
  turnoff
endin

/** Turns off running instances of named instruments.  Useful when livecoding
  audio and control signal process instruments. May not be effective if for
  temporal recursion instruments as they may be non-running but scheduled in the
  event system. In those situations, try using clear_instr to overwrite the
  instrument definition. */
opcode kill, 0,S
  Sinstr xin
  schedule("KillImpl", 0, 0.01, Sinstr)
endop

/** Redefines instr to empty body. Useful for killing
  temporal recursion or clock callback functions */
opcode clear_instr, 0,S
  Sinstr xin
  Sinstr_body = sprintf("instr %s\nendin\n", Sinstr)
  ires = compilestr(Sinstr_body)
  prints(sprintf("Cleared instrument definition: %s\n", 
          Sinstr))
endop

/** Starts running a named instrument for indefinite time using p2=0 and p3=-1. 
  Will first turnoff any instances of existing named instrument first.  Useful
  when livecoding always-on audio and control signal process instruments. */
opcode start, 0,S
  Sinstr xin

  if (nstrnum(Sinstr) > 0) then
    kill(Sinstr)
    schedule(Sinstr, ksmps / sr,-1)
  endif
endop

/** Stops a running named instrument, allowing for release segments to operate. */
opcode stop, 0,S
  Sinstr xin

  if (nstrnum(Sinstr) > 0) then
    schedule(-nstrnum(Sinstr), 0, 0)
  endif
endop

instr CodeEval
  Scode = p4
  ires = compilestr(Scode)
endin

/** Evaluate code at a given time */
opcode eval_at_time, 0, Si 
  Scode, istart xin
  iblock init ksmps / sr
  ;; adjust one block of time difference since this is
  ;; will need to be added as an event back on to the scheduler
  schedule("CodeEval", max:i(0, istart - iblock), 0, Scode)
endop


;; Fades 

gi_fade_range init -30


/** Sets the range in db to fade over. By default, range is -30 (i.e., fades from -30dbfs to 0dbfs) */
opcode set_fade_range, 0, i
  irange xin
  gi_fade_range init irange
endop

/** Given a fade channel identifier (number) and number of ticks to fade over time, advances from current fade channel value towards 0dbfs (1.0) using the globally set fade range. (By default starts fading in from -30dBfs and stops at 0dbfs.) */
opcode fade_in, i, ii
  ident, inumticks xin
  Schan = sprintf("fade_chan_%d", ident)
  ival = chnget:i(Schan)
  if(ival < 1.0) then
    ival = limit:i(ival + (1 / inumticks), 0, 1.0) 
    chnset(ival, Schan)
    iret = ampdbfs((1- ival) * gi_fade_range)
  else
    iret = ival
  endif

  xout iret 
endop

/** Given a fade channel identifier (number) and number of ticks to fade over time, advances from current fade channel value towards 0 using the globally set fade range. (By default starts fading out from 0dBfs and stops at -30dbfs.) */
opcode fade_out, i, ii
  ident, inumticks xin
  Schan = sprintf("fade_chan_%d", ident)

  ival = chnget:i(Schan)
  iret init 0

  if(ival > 0.0) then
    ival = limit:i(ival - (1 / inumticks), 0, 1.0) 
    chnset(ival, Schan)
    iret = ampdbfs((1- ival) * gi_fade_range)
  else
    iret = ival
  endif

  xout iret 
endop

/** Read value from fade channel. Useful if copy/pasting then wanting to just read from fade and control in the original code. */
opcode fade_read, i, i
  ident xin
  Schan = sprintf("fade_chan_%d", ident)
  iret = chnget:i(Schan)
  xout iret 
endop

/**  Set value for fade channel to given value. Should be in range 0-1.0.  (Typically one sets to either 0 or 1.) */
opcode set_fade, 0,ii
  ident, ival xin
  Schan = sprintf("fade_chan_%d", ident)
  ival = limit:i(ival, 0, 1.0) 
  chnset(ival, Schan)
endop

;; Stereo Audio Bus

ga_sbus[] init 16, 2

/** Write two audio signals into stereo bus at given index */
opcode sbus_write, 0,iaa
  ibus, al, ar xin
  ga_sbus[ibus][0] = al
  ga_sbus[ibus][1] = ar
endop

/** Mix two audio signals into stereo bus at given index */
opcode sbus_mix, 0,iaa
  ibus, al, ar xin
  ga_sbus[ibus][0] = ga_sbus[ibus][0] + al
  ga_sbus[ibus][1] = ga_sbus[ibus][1] + ar
endop

/** Clear audio signals from bus channel */
opcode sbus_clear, 0, i
  ibus xin
  aclear init 0
  ga_sbus[ibus][0] = aclear
  ga_sbus[ibus][1] = aclear
endop

/** Read audio signals from bus channel */
opcode sbus_read, aa, i
  ibus xin
  aclear init 0
  al = ga_sbus[ibus][0] 
  ar = ga_sbus[ibus][1] 
  xout al, ar
endop

;; MIXER

gi_reverb_mixer_on init 0

/** Always-on Mixer instrument with Reverb send channel. Use start("ReverbMixer") to run. Designed 
    for use with pan_verb_mix to simplify signal-based live coding. */
instr ReverbMixer

  gi_reverb_mixer_on init 1

  ;; dry and reverb send signals
  a1, a2 sbus_read 0
  a3, a4 sbus_read 1
  
  al, ar reverbsc a3, a4, xchan:k("Reverb.fb", 0.7), xchan:k("Reverb.cut", 12000)
  
  kamp = xchan:k("Mix.amp", 1.0)
  
  a1 = tanh(a1 + al) * kamp
  a2 = tanh(a2 + ar) * kamp
  
  out(a1, a2)
  
  sbus_clear(0)
  sbus_clear(1)
endin


/** Always-on Mixer instrument with Reverb send channel and feedback delay. Use start("FBReverbMixer") to run. Designed 
    for use with pan_verb_mix to simplify signal-based live coding. */
instr FBReverbMixer 
  al, ar sbus_read 0
  
  afb0 init 0
  afb1 init 0

  gi_reverb_mixer_on init 1

  ;; dry and reverb send signals
  a1, a2 sbus_read 0
  a3, a4 sbus_read 1
  
  al, ar reverbsc a3, a4, xchan:k("Reverb.fb", 0.7), xchan:k("Reverb.cut", 12000)

  a1 = tanh(a1 + al + afb0) 
  a2 = tanh(a2 + ar + afb1)
 
  kfb_amt = xchan:k("FB.amt", 0.9)
  kfb_dur = xchan:k("FB.dur", 4.2) * 1000 ;; time in ms

  afb0 = vdelay(a1 * kfb_amt, kfb_dur, 10000)
  afb1 = vdelay(a2 * kfb_amt, kfb_dur, 10000)

  kamp = xchan:k("Mix.amp", 1.0)
  a1 *= kamp
  a2 *= kamp
  
  out(a1, a2)
  
  sbus_clear(0)
  sbus_clear(1)

endin

/** Utility opcode to pan signal, send dry to mixer, and send amount 
    of signal to reverb. If ReverbMixer is not on, will output just 
    panned signal using out opcode. */
opcode pan_verb_mix, 0,akk
  asig, kpan, krvb xin
   ;; Panning and send to mixer
  al, ar pan2 asig, kpan
 
  if(gi_reverb_mixer_on == 1) then
    sbus_mix(0, al, ar)
    sbus_mix(1, al * krvb, ar * krvb)
  else 
    out(al, ar)
  endif
endop

/** Utility opcode to send dry stereo to mixer and send amount 
    of stereo signal to reverb. If ReverbMixer is not on, will output just 
    panned signal using out opcode. */
opcode reverb_mix, 0, aak
  al, ar, krvb xin
 
  if(gi_reverb_mixer_on == 1) then
    sbus_mix(0, al, ar)
    sbus_mix(1, al * krvb, ar * krvb)
  else 
    out(al, ar)
  endif
endop

;; Automation

/** Set a channel value at a given time. p4=ChannelName, p5=value*/ 
instr ChnSet
  Schan = p4
  ival = p5
  chnset(ival, Schan)
endin

/** Automation instrument for channels. Takes in "ChannelName", start value, end value, and automation type (0=linear, else exponential). */ 
instr Auto 
  Schan = p4
  istart = p5
  iend = p6
  itype = p7
  kauto init 0

  if(itype == 0) then
    kauto = line:k(istart, p3, iend)
  else
    kauto = expon:k(istart, p3, iend)
  endif

  chnset(kauto, Schan)
endin

/** Automate channel value over time. Takes in "ChannelName", duration, start value, end value, and automation type (0=linear, else exponential). For exponential, signs of istart and end must match and neither can be zero. */ 
opcode automate, 0, Siiii
  Schan, idur, istart, iend, itype xin
  schedule("Auto", 0, idur, Schan, istart, iend, itype)
endop

instr FadeOutMix
  kauto = ampdbfs:k(line:k(0, p3, -60))
  chnset(kauto, "Mix.amp")
endin

/** Utility opcode for end of performances to fade out Mixer over given idur time. idur defaults to 30 seconds. **/
opcode fade_out_mix, 0, o
  idur xin
  idur = (idur <= 0 ? 30 : idur)
  schedule("FadeOutMix", 0, idur) 
  schedule("ChnSet", idur + 0.1, 0, "Mix.amp", 0)
endop

;; DSP

/** Saturation using tanh */
opcode saturate, a, ak
  asig, ksat xin
  xout tanh(asig * ksat) / tanh(ksat)
endop

;; SYNTHS

xchnset("rvb.default", 0.1)
xchnset("drums.rvb.default", 0.1)

/** Substractive Synth, 3osc */
instr Sub1
  asig = vco2(ampdbfs(-12), p4)
  asig += vco2(ampdbfs(-12), p4 * 1.01, 10)
  asig += vco2(ampdbfs(-12), p4 * 2, 10)
  asig = zdf_ladder(asig, expon(10000, p3, 400), 5)
  asig = declick(asig) * p5
  pan_verb_mix(asig, xchan:i("Sub1.pan", 0.5), xchan:i("Sub1.rvb", chnget:i("rvb.default")))
endin


/** Subtractive Synth, two saws, fifth freq apart */
instr Sub2
  icut = xchan:i("Sub2.cut", sr / 3)
  asig = vco2(ampdbfs(-12), p4) 
  asig += vco2(ampdbfs(-12), p4 * 1.5) 
  asig = zdf_ladder(asig, expon(icut, p3, 400), 5)
  asig = declick(asig) * p5
  pan_verb_mix(asig, xchan:i("Sub2.pan", 0.5), xchan:i("Sub2.rvb", chnget:i("rvb.default")))
endin


/** Subtractive Synth, three detuned saws, swells in */
instr Sub3 
  asig = vco2(p5, p4)
  asig += vco2(p5, p4 * 1.01)
  asig += vco2(p5, p4 * 0.995)
  asig *= 0.33 
  asig = zdf_ladder(asig, expon(100, p3, 22000), 12) 
  asig = declick(asig)
  pan_verb_mix(asig, xchan:i("Sub3.pan", 0.5), xchan:i("Sub3.rvb", chnget:i("rvb.default")))
endin

/** Subtractive Synth, detuned square/saw, stabby. 
   Nice as a lead in octave 2, nicely grungy in octave -2, -1
*/
instr Sub4 
  asig = vco2(0.5, p4 * 2)
  asig += vco2(0.5, p4 * 2.01, 10)
  asig += vco2(1, p4, 10)
  asig += vco2(1, p4 * 0.99)
  itarget = p4 * 2
  asig = zdf_ladder(asig, expseg(20000, 0.15, itarget, 0.1, itarget), 5)
  asig = declick(asig) * p5 * 0.15
  pan_verb_mix(asig, xchan:i("Sub4.pan", 0.5), xchan:i("Sub4.rvb", chnget:i("rvb.default")))
endin


/** Subtractive Synth, detuned square/triangle */
instr Sub5
  asig = vco2(0.5, p4, 10)
  asig += vco2(0.25, p4 * 2.0001, 12)
  asig = zdf_ladder(asig, expseg(10000, 0.1, 500, 0.1, 500), 2)
  asig = declick(asig) * p5 * 0.75
  pan_verb_mix(asig, xchan:i("Sub5.pan", 0.5), xchan:i("Sub5.rvb", chnget:i("rvb.default")))
endin

/** Subtractive Synth, saw, K35 filters */
instr Sub6
  asig = vco2(p5, p4)

  asig = K35_hpf(asig, limit:i(p4, 30, 16000), 1)
  asig = K35_lpf(asig, expseg:k(12000, p3, limit:i(p4 * 8, 30, 12000)), 2.5)
  
  asig = saturate(asig, 4.5)
  asig *= p5 * 0.5
  
  asig = declick(asig)
  
  pan_verb_mix(asig, xchan:i("Sub6.pan", 0.5), xchan:i("Sub6.rvb", chnget:i("rvb.default")))
endin

/** Subtractive Synth, saw + tri, K35 filters */
instr Sub7
  asig = vco2(p5, p4)
  asig += vco2(p5, p4 * 2, 4, 0.5)

  asig = K35_hpf(asig, limit:i(p4, 30, 16000), 1)
  asig = K35_lpf(asig, expseg:k(12000, p3, limit:i(p4 * 8, 30, 12000)), 2.5)
  
  asig = saturate(asig, 4.5)
  asig *= p5 * 0.3
  
  asig = declick(asig)
  
  pan_verb_mix(asig, xchan:i("Sub7.pan", 0.5), xchan:i("Sub7.rvb", chnget:i("rvb.default")))
endin

/** Subtractive Synth, square + saw + tri, diode ladder filter */
instr Sub8
  asig = vco2(p5, p4, 10)
  asig += vco2(p5 * 0.5, p4 * 2)
  asig += vco2(p5 * 0.15, p4 * 3.5, 12)  
  
  aenv = expon:a(1, 0.15, 0.001)
  asig = saturate(asig, 10)
  asig = diode_ladder(asig, 4000 + aenv * 4000, 12)
  asig = zdf_2pole(asig, p5, 0.25, 1)
  asig *= linen:a(1, 0, p3, .001) * 0.5
  pan_verb_mix(asig, xchan:i("Sub8.pan", 0.5), xchan:i("Sub8.rvb", chnget:i("rvb.default")))
endin

/** SynthBrass subtractive synth */ 
instr SynBrass
  ipch = p4

  asig = vco2(0.25, ipch)
  asig += vco2(0.25, ipch * 2.00)
  asig = zdf_ladder(asig, expseg(12000, 0.25, 500, 0.05, 500), 4)
  asig = declick(asig * p5)

  pan_verb_mix(asig, xchan:i("SynBrass.pan", 0.5), xchan:i("SynBrass.rvb", chnget:i("rvb.default")))
endin

/** Synth Harp subtracitve Synth */
instr SynHarp
  
  asig = vco2(p5, p4)
  asig += vco2(p5, p4 * 0.9993423423)
  asig += vco2(p5, p4 * 1.00093029423048) 
  
  ioct = octcps(p4)
  
  asig = zdf_ladder(asig, cpsoct(limit(linseg:a(ioct + 4, 0.015, ioct + 2, 0.2, ioct), 4.25, 14)), 0.5)
  asig = zdf_2pole(asig, p4 * 0.5, 0.5, 1)    
  
  asig *= linen:a(1, 0.012, p3, 0.01)
  
  pan_verb_mix(asig, xchan:i("SynHarp.pan", 0.5), xchan:i("SynHarp.rvb", chnget:i("rvb.default")))
endin
 
/** SuperSaw sound using 9 bandlimited saws (3 sets of detuned saws at octaves)*/
instr SSaw
  asig = vco2(1, p4)
  asig += vco2(1, p4 * cent(9.04234))
  asig += vco2(1, p4 * cent(-7.214342))
  
  asig += vco2(1, p4 * cent(1206.294143))
  asig += vco2(1, p4 * cent(1193.732))
  asig += vco2(1, p4 * cent(1200))
  
  asig += vco2(1, p4 * cent(2406.294143))
  asig += vco2(1, p4 * cent(2393.732))
  asig += vco2(1, p4 * cent(2400))
  
  asig *= 0.1
  icut = xchan:i("SSaw.cut", 16000)
  asig = zdf_ladder(asig, expseg(icut, p3 - 0.05, icut, 0.05, 200), 0.5)
  asig *= p5 
  asig = declick(asig)

  pan_verb_mix(asig, xchan:i("SSaw.pan", 0.5), xchan:i("SSaw.rvb", chnget:i("rvb.default")))
endin

/** Modal Synthesis Instrument: Percussive/organ-y sound */
instr Mode1
  asig = mpulse(p5, 0)

  asig1 = mode(asig, p4, p4 * 0.5)
  asig1 += mode(asig, p4 * 2, p4 * 0.25)
  asig1 += mode(asig, p4 * 4, p4 * 0.125)

  asig = declick(asig1) 

  pan_verb_mix(asig, xchan:i("Mode1.pan", 0.5), xchan:i("Mode1.rvb", chnget:i("rvb.default")))
endin

/** Pluck sound using impulses, noise, and waveguides*/
instr Plk 
  asig = mpulse(p5, 1 / p4)
  asig += random:a(-0.1, 0.1) * expseg(p5, 0.02, 0.001, p3, 0.001)
  
  aout wguide1 asig, 1/ p4, 10000, 0.8
  aout += wguide1(asig, 1/ (2 * p4), 12000, 0.6)

  aout = K35_hpf(aout, p4, 0.5)
  aout = zdf_ladder(aout, expon(10000, p3, 100), 3)
  aout = dcblock2(aout)
  
  asig = declick(aout) 
  
  pan_verb_mix(asig, xchan:i("Plk.pan", 0.5), xchan:i("Plk.rvb", chnget:i("rvb.default")))
endin

gi_organ1 = ftgen(0, 0, 65536, 10, 1, 0.5, 0.3, 0.2, 0.05, 0.015)
/** Wavetable Organ sound using additive synthesis */
instr Organ1
  asig = oscili(p5, p4, gi_organ1)
  asig *= 0.5
  asig = declick(asig)

  pan_verb_mix(asig, xchan:i("Organ1.pan", 0.5), xchan:i("Organ1.rvb", chnget:i("rvb.default")))
endin

/** Organ sound based on M1 Organ 2 patch */
instr Organ2
  asig = vco2(1, p4, 4, 0.25)
  asig += vco2(0.8, p4 * 2, 12)
  asig += vco2(0.3, p4 * 3, 10)
     
  icutStart = limit:i(xchan:i("Organ2.cut", 2000), 40, sr * 1/2)
  icutEnd = limit:i(xchan:i("Organ2.cutEnd", 500), 40, sr * 1/2)
  asig = zdf_ladder(asig, expseg(icutStart, 0.08, icutEnd, p3, icutEnd), 2)
  
  asig *= p5 * 0.67
  asig = declick(asig)
  
  pan_verb_mix(asig, xchan:i("Organ2.pan", 0.5), xchan:i("Organ2.rvb", chnget:i("rvb.default")))
endin

giorgan_claribel_flute = ftgen(0, 0, 65536, 10, 1, ampdbfs(-30), ampdbfs(-35), ampdbfs(-40), ampdbfs(-32), ampdbfs(-40), ampdbfs(-42))

/** Wavetable Organ using Flute 8' and Flute 4', wavetable based on Claribel Flute 
    http://www.pykett.org.uk/the_tonal_structure_of_organ_flutes.htm */
instr Organ3 
  asig = oscili(p5, p4, giorgan_claribel_flute)
  asig += oscili(p5, p4 * 2, giorgan_claribel_flute)  
  ;asig += oscili(p5, p4 * 0.5)
  
  asig *= linen:a(1, .02, p3, .01)

  pan_verb_mix(asig, xchan:i("Organ3.pan", 0.5), xchan:i("Organ3.rvb", chnget:i("rvb.default")))
endin

/** Subtractive Bass sound */

instr Bass

  asig = vco2(p5, p4, 10)
  asig += vco2(p5 * 0.25, p4 * 0.9992342342, 10)  
  asig += vco2(p5 * 0.5, p4 * 2.000234234)
  aenv = linseg:a(1, 0.2, 0.1, p3 - 0.2, 0) * 6
  asig = zdf_ladder(asig, cpsoct(5 + aenv), 4 )
  
  asig *= linen:a(0.7, 0, p3, 0.01)
  
  pan_verb_mix(asig, xchan:i("Bass.pan", 0.5), xchan:i("Bass.rvb", chnget:i("rvb.default")))

endin

/** MS20-style Bass Sound */

instr ms20_bass 
  ipch = p4 
  iamp = p5 
  aenv = expseg(1000, 0.1, ipch * 2, p3 - .05, ipch * 2)

  asig = vco2(1.0, ipch)
  asig = K35_hpf(asig, ipch, 5, 0, 1)
  asig = K35_lpf(asig, aenv, 8, 0, 1)

  asig *= expon:a(iamp, p3, 0.0001) 

  pan_verb_mix(asig, xchan:i("ms20_bass.pan", 0.5), xchan:i("ms20_bass.rvb", chnget:i("rvb.default")))
endin


/** VoxHumana Patch */

instr VoxHumana 
  ipch = p4 
  iamp = p5 
  aenv = transegr:a(0, 0.453, 1, 1.0, 2.242, -1, 0)

  klfo_pulse_width = lfo(0.125, 5.72, 1)
  klfo_saw = lfo(0.021, 5.04, 1)
  klfo_pulse = lfo(0.013, 3.5, 1)

  asaw = vco2(iamp, ipch * (1 + klfo_saw))
  apulse = vco2(iamp, ipch * (1.00004 + klfo_pulse), 2, 0.625 + klfo_pulse_width)

  aout = sum(asaw, apulse) * 0.0625 * aenv

  ikeyfollow = 1 + exp( (ipch - 50) / 10000)

  aout = butterlp(aout, 1986 * ikeyfollow)

  pan_verb_mix(aout, xchan:i("VoxHumana.pan", 0.5), xchan:i("VoxHumana.rvb", chnget:i("rvb.default")))
endin

/** FM 3:1 C:M ratio, 2->0.025 index, nice for bass */
instr FM1 
  icar = xchan("FM1.car", 1)
  imod = xchan("FM1.mod", 3)
  asig = foscili(p5, p4, icar, imod, expon(2, 0.2, 0.025))
  asig = declick(asig) * 0.5
  pan_verb_mix(asig, xchan:i("FM1.pan", 0.5), xchan:i("FM1.rvb", chnget:i("rvb.default")))
endin

/** Filtered noise, exponential envelope */
instr Noi 
  p3 = max:i(p3, 0.4) 
  asig = pinker() * p5 * expon(1, p3, 0.001) * 0.1

  a1 = mode(asig, p4, 80)
  a2 = mode(asig, p4 * 2, 40)
  a3 = mode(asig, p4 * 3, 30)
  a4 = mode(asig, p4 * 4, 20)

  asig sum a1, a2, a3, a4

  asig = declick(asig) * 0.25

  pan_verb_mix(asig, xchan:i("Noi.pan", 0.5), xchan:i("Noi.rvb", chnget:i("rvb.default")))
endin


/** Wobble patched based on Jacob Joaquin's "Tempo-Synced Wobble Bass" */
instr Wobble
  /*p3 = max:i(p3, 0.4) */

  itri = chnget:i("Wobble.triangle")
  if(itri == 0) then
    ;; unipolar triangle
    itri = ftgen(0, 0, 8192, -7, 0, 4096, 1, 4096, 0)
    chnset(itri, "Wobble.triangle")
  endif

  ;; dur in ticks (16ths) for wobble lfo 
  iticks = xchan("Wobble.ticks", 2)
  ;; modulation max
  imod = p4 * 8 

  klfo = oscili:k(1, 1 / ticks(iticks), itri)

  asig = vco2(p5, p4 * 2.018)
  asig += vco2(p5, p4, 10)
  asig = zdf_ladder(asig, min:k(p4 + (imod * klfo), 22000), 12) 
  asig *= expon(1, beats(16), 0.001)
  asig = declick(asig)
  pan_verb_mix(asig, xchan:i("Wobble.pan", 0.5), xchan:i("Wobble.rvb", chnget:i("rvb.default")))

endin

/** Simple Sine-wave instrument with exponential envelope */
instr Sine
  asig = oscili(p5, p4)
  asig *= expseg:a(0.1, 0.001, 1, 0.1, 0.001, p3, 0.001)
  pan_verb_mix(asig, xchan:i("Sine.pan", 0.5), xchan:i("Sine.rvb", chnget:i("rvb.default")))
endin

/** Simple Square-wave instrument with exponential envelope */
instr Square
  asig = vco2(p5, p4, 10)
  asig *= expseg:a(0.1, 0.005, 1, 0.1, 0.001, p3, 0.001)
  pan_verb_mix(asig, xchan:i("Square.pan", 0.5), xchan:i("Square.rvb", chnget:i("rvb.default")))
endin

/** Simple Sawtooth-wave instrument with exponential envelope */
instr Saw
  asig = vco2(p5, p4)
  asig *= expseg:a(0.1, 0.005, 1, 0.1, 0.001, p3, 0.001)
  pan_verb_mix(asig, xchan:i("Saw.pan", 0.5), xchan:i("Saw.rvb", chnget:i("rvb.default")))
endin


;; SQUINE WAVE SYNTHS

/** Squinewave Synth, 2 osc */
instr Squine1
  asig squinewave a(p4), expon:a(.8, p3, .1), expon:a(.9, p3, .5), 0, 4
  a2 squinewave a(p4 * 1.0019234234), expseg:a(.8, p3, .6), a(0), 0, 4

  asig = (asig + a2 * 0.05) * p5 * 0.5
  asig = butterhp(asig, p4)
  asig *= linen:a(1, .015, p3, .02) 
  asig = dcblock2(asig)

  pan_verb_mix(asig, xchan:i("Squine1.pan", 0.5), xchan:i("Squine1.rvb", chnget:i("rvb.default")))
  
endin

gi_lc_sine = ftgen(0, 0, 65536, 10, 1)

/** Formant Synth, buzz source, soprano ah formants */
instr Form1 
  iamp = p5
  ifreq = p4
  asig = buzz(1, ifreq * (1 + lfo(.003, 4)), (sr / 2) / ifreq, gi_lc_sine)
  
  a1 = butterbp(asig, 800, 80)
  a2 = butterbp(asig * ampdbfs(-6), 1150, 90)
  a3 = butterbp(asig * ampdbfs(-32), 2900 , 120)
  a4 = butterbp(asig * ampdbfs(-20), 3900, 130)
  a5 = butterbp(asig * ampdbfs(-50), 4950, 140)

  asig = a1 + a2 + a3 + a4 + a5
  asig *= 35 * iamp * adsr(0.05, 0, 1, 0.01)
  
  pan_verb_mix(asig, xchan:i("Form1.pan", 0.5), xchan:i("Form1.rvb", chnget:i("rvb.default")))
endin

;; MONOPHONIC SYNTHS

/** Monophone synth using sawtooth wave and 4pole lpf. Use "start("Mono") to run the monosynth, then use MonoNote instrument to play the instrument. */
instr Mono
  asig = vco2(xchan:k("Mono.amp", 0.0), portk(xchan:k("Mono.freq", 60), xchan:k("Mono.glide", 0.02)))
  asig = zdf_ladder(asig, xchan:k("Mono.cut", 4000), xchan:k("Mono.Q", 10))
  
  kpan = xchan:k("Mono.pan", 0.5)
  aL,aR pan2  asig,kpan             

  pan_verb_mix(asig, xchan:k("Mono.pan", 0.5), xchan:k("Mono.rvb", chnget:i("rvb.default")))
endin
maxalloc("Mono", 1)

/** Note playing instrument for Mono synth. Be careful to use this
and not try to create multiple Mono instruments! */
instr MonoNote
  chnset(expon(p5, p3, 0.001), "Mono.amp")
  chnset(p4, "Mono.freq")
endin


;; DRUMS

/** Bandpass-filtered impulse glitchy click sound. p4 = center frequency (e.g., 3000, 6000) */
instr Click 
  asig = mpulse(1, 0)
  asig = zdf_2pole(asig, p4, 3, 3)
  
  asig *= p5 * 4      ;; adjust amp 
  asig *= linen:a(1, 0, p3, 0.01)
  
  pan_verb_mix(asig, xchan:i("Click.pan", 0.5), xchan:i("Click.rvb", chnget:i("rvb.default")))
endin

/** Highpass-filtered noise+saw sound. Use NoiSaw.cut channel to adjust cutoff. */
instr NoiSaw 
  asig = random:a(-1, 1)
  asig += vco2(1, 100)
  asig = zdf_2pole(asig, xchan:i("NoiSaw.cut", 3000), 1, 3)
  
  asig *= p5 * 0.5
  asig *= expseg:a(1, 0.1, 0.001, p3, 0.0001)
  
  asig *= linen:a(1, 0, p3, 0.01)
  
  pan_verb_mix(asig, xchan:i("NoiSaw.pan", 0.5), xchan:i("NoiSaw.rvb", chnget:i("rvb.default")))
endin

/** Modified clap instrument by Istvan Varga (clap1.orc) */
instr Clap
  ifreq = p4 ;; ignore
  iamp = p5

  ibpfrq  =  1046.5       /* bandpass filter frequency */
  kbpbwd =  port:k(ibpfrq*0.25, 0.03, ibpfrq*4.0)   /* bandpass filter bandwidth */
  idec  =  0.5          /* decay time        */

  a1  =  1.0
  a1_ delay1 a1
  a1  =  a1 - a1_
  a2  delay a1, 0.011
  a3  delay a1, 0.023
  a4  delay a1, 0.031

  a1  tone a1, 60.0
  a2  tone a2, 60.0
  a3  tone a3, 60.0
  a4  tone a4, 1.0 / idec

  aenv1 =  a1 + a2 + a3 + a4*60.0*idec

  a_  unirand 2.0
  a_  =  aenv1 * (a_ - 1.0)
  a_  butterbp a_, ibpfrq, kbpbwd

  aout = a_ * 80 * iamp ;; 
  pan_verb_mix(aout, xchan:k("Clap.pan", 0.7), xchan:k("Clap.rvb", chnget:i("drums.rvb.default")))
endin



gi_808_sine  ftgen 0,0,1024,10,1   ;A SINE WAVE
gi_808_cos ftgen 0,0,65536,9,1,1,90  ;A COSINE WAVE 

/** Bass Drum - From Iain McCurdy's TR-808.csd */
instr BD  ;BASS DRUM
  p3  = 2 * xchan("BD.decay", 0.5)              ;NOTE DURATION. SCALED USING GUI 'Decay' KNOB

  ilevel = xchan("BD.level", 1) * 2
  itune = xchan("BD.tune", 0)

  ;SUSTAIN AND BODY OF THE SOUND
  kmul = transeg(0.2,p3*0.5,-15,0.01, p3*0.5,0,0)         ;PARTIAL STRENGTHS MULTIPLIER USED BY GBUZZ. DECAYS FROM A SOUND WITH OVERTONES TO A SINE TONE.
  kbend = transeg(0.5,1.2,-4, 0,1,0,0)            ;SLIGHT PITCH BEND AT THE START OF THE NOTE 
  asig = gbuzz(0.5,50*octave(itune)*semitone(kbend),20,1,kmul,gi_808_cos)   ;GBUZZ TONE
  aenv = transeg:a(1,p3-0.004,-6,0)             ;AMPLITUDE ENVELOPE FOR SUSTAIN OF THE SOUND
  aatt = linseg:a(0,0.004,1, .01, 1)              ;SOFT ATTACK
  asig= asig*aenv*aatt

  ;HARD, SHORT ATTACK OF THE SOUND
  aenv  = linseg:a(1,0.07,0, .01, 0)              ;AMPLITUDE ENVELOPE (FAST DECAY)            
  acps = expsega(400,0.07,0.001,1,0.001)            ;FREQUENCY OF THE ATTACK SOUND. QUICKLY GLISSES FROM 400 Hz TO SUB-AUDIO
  aimp = oscili(aenv,acps*octave(itune*0.25),gi_808_sine)       ;CREATE ATTACK SOUND
  
  amix  = ((asig*0.5)+(aimp*0.35))*ilevel*p5      ;MIX SUSTAIN AND ATTACK SOUND ELEMENTS AND SCALE USING GUI 'Level' KNOB
  
  pan_verb_mix(amix, xchan:k("BD.pan", 0.5), xchan:k("BD.rvb", chnget:i("drums.rvb.default")))
endin


/** Snare Drum - From Iain McCurdy's TR-808.csd */
instr SD  ;SNARE DRUM
  
  ;SOUND CONSISTS OF TWO SINE TONES, AN OCTAVE APART AND A NOISE SIGNAL
  idur = xchan("SD.decay", 1.0) 
  ilevel = xchan("SD.level", 1) 
  itune = xchan("SD.tune", 0)

  ifrq    = 342   ;FREQUENCY OF THE TONES
  iNseDur = 0.3 * idur  ;DURATION OF THE NOISE COMPONENT
  iPchDur = 0.1 * idur  ;DURATION OF THE SINE TONES COMPONENT
  p3  = iNseDur   ;p3 DURATION TAKEN FROM NOISE COMPONENT DURATION (ALWATS THE LONGEST COMPONENT)
  
  ;SINE TONES COMPONENT
  aenv1 = expseg(1, iPchDur, 0.0001, p3-iPchDur, 0.0001)    ;AMPLITUDE ENVELOPE
  apitch1 = oscili(1, ifrq * octave(itune), gi_808_sine)      ;SINE TONE 1
  apitch2 = oscili(0.25, ifrq * 0.5 * octave(itune), gi_808_sine)   ;SINE TONE 2 (AN OCTAVE LOWER)
  apitch  = (apitch1+apitch2)*0.75        ;MIX THE TWO SINE TONES

  ;NOISE COMPONENT
  aenv2 = expon(1,p3,0.0005)          ;AMPLITUDE ENVELOPE
  anoise = noise(0.75, 0)           ;CREATE SOME NOISE
  anoise = butbp(anoise, 10000*octave(itune), 10000)    ;BANDPASS FILTER THE NOISE SIGNAL
  anoise = buthp(anoise, 1000)          ;HIGHPASS FILTER THE NOISE SIGNAL
  kcf = expseg(5000, 0.1, 3000, p3-0.2, 3000)     ;CUTOFF FREQUENCY FOR A LOWPASS FILTER
  anoise = butlp(anoise,kcf)                      ;LOWPASS FILTER THE NOISE SIGNAL
  amix  = ((apitch*aenv1)+(anoise*aenv2))*ilevel*p5 ;MIX AUDIO SIGNALS AND SCALE ACCORDING TO GUI 'Level' CONTROL

  pan_verb_mix(amix, xchan:k("SD.pan", 0.5), xchan:k("SD.rvb", chnget:i("drums.rvb.default")))
endin


/** Open High Hat - From Iain McCurdy's TR-808.csd */
instr OHH ;OPEN HIGH HAT

  idur = xchan("OHH.decay", 1.0)  
  ilevel = xchan("OHH.level", 1) 
  itune = xchan("OHH.tune", 0)
  ioct = octave:i(itune)


  kFrq1 = 296*ioct  ;FREQUENCIES OF THE 6 OSCILLATORS
  kFrq2 = 285*ioct  
  kFrq3 = 365*ioct  
  kFrq4 = 348*ioct  
  kFrq5 = 420*ioct  
  kFrq6 = 835*ioct  
  p3  = 0.5*idur    ;DURATION OF THE NOTE
  
  ;SOUND CONSISTS OF 6 PULSE OSCILLATORS MIXED WITH A NOISE COMPONENT
  ;PITCHED ELEMENT
  aenv  linseg  1,p3-0.05,0.1,0.05,0    ;AMPLITUDE ENVELOPE FOR THE PULSE OSCILLATORS
  ipw = 0.25        ;PULSE WIDTH
  a1  vco2  0.5,kFrq1,2,ipw     ;PULSE OSCILLATORS...
  a2  vco2  0.5,kFrq2,2,ipw
  a3  vco2  0.5,kFrq3,2,ipw
  a4  vco2  0.5,kFrq4,2,ipw
  a5  vco2  0.5,kFrq5,2,ipw
  a6  vco2  0.5,kFrq6,2,ipw
  amix  sum a1,a2,a3,a4,a5,a6   ;MIX THE PULSE OSCILLATORS
  amix  reson amix,5000*ioct,5000,1 ;BANDPASS FILTER THE MIXTURE
  amix  buthp amix,5000     ;HIGHPASS FILTER THE SOUND...
  amix  buthp amix,5000     ;...AND AGAIN
  amix  = amix*aenv     ;APPLY THE AMPLITUDE ENVELOPE
  
  ;NOISE ELEMENT
  anoise  noise 0.8,0       ;GENERATE SOME WHITE NOISE
  aenv  linseg  1,p3-0.05,0.1,0.05,0    ;CREATE AN AMPLITUDE ENVELOPE
  kcf expseg  20000,0.7,9000,p3-0.1,9000  ;CREATE A CUTOFF FREQ. ENVELOPE
  anoise  butlp anoise,kcf      ;LOWPASS FILTER THE NOISE SIGNAL
  anoise  buthp anoise,8000     ;HIGHPASS FILTER THE NOISE SIGNAL
  anoise  = anoise*aenv     ;APPLY THE AMPLITUDE ENVELOPE
  
  ;MIX PULSE OSCILLATOR AND NOISE COMPONENTS
  amix  = (amix+anoise)*ilevel*p5*0.55

  pan_verb_mix(amix, xchan:k("OHH.pan", 0.5), xchan:k("OHH.rvb", chnget:i("drums.rvb.default")))
endin


/** Closed High Hat - From Iain McCurdy's TR-808.csd */
instr CHH ;CLOSED HIGH HAT
  idur = xchan("CHH.decay", 1.0)  
  ilevel = xchan("CHH.level", 1) 
  itune = xchan("CHH.tune", 0)
  ioct = octave:i(itune)

  kFrq1 = 296*ioct  ;FREQUENCIES OF THE 6 OSCILLATORS
  kFrq2 = 285*ioct  
  kFrq3 = 365*ioct  
  kFrq4 = 348*ioct  
  kFrq5 = 420*ioct  
  kFrq6 = 835*ioct  
  idur  = 0.088*idur    ;DURATION OF THE NOTE
  p3  limit idur,0.1,10   ;LIMIT THE MINIMUM DURATION OF THE NOTE (VERY SHORT NOTES CAN RESULT IN THE INDICATOR LIGHT ON-OFF NOTE BEING TO0 SHORT)

  iohh = nstrnum("OHH")
  iactive = active(iohh)      ;SENSE ACTIVITY OF PREVIOUS INSTRUMENT (OPEN HIGH HAT) 
  if iactive>0 then     ;IF 'OPEN HIGH HAT' IS ACTIVE...
   turnoff2 iohh,0,0    ;TURN IT OFF (CLOSED HIGH HAT TAKES PRESIDENCE)
  endif

  ;PITCHED ELEMENT
  aenv  expsega 1,idur,0.001,1,0.001    ;AMPLITUDE ENVELOPE FOR THE PULSE OSCILLATORS
  ipw = 0.25        ;PULSE WIDTH
  a1  vco2  0.5,kFrq1,2,ipw     ;PULSE OSCILLATORS...     
  a2  vco2  0.5,kFrq2,2,ipw
  a3  vco2  0.5,kFrq3,2,ipw
  a4  vco2  0.5,kFrq4,2,ipw
  a5  vco2  0.5,kFrq5,2,ipw
  a6  vco2  0.5,kFrq6,2,ipw
  amix  sum a1,a2,a3,a4,a5,a6   ;MIX THE PULSE OSCILLATORS
  amix  reson amix,5000*ioct,5000,1 ;BANDPASS FILTER THE MIXTURE
  amix  buthp amix,5000     ;HIGHPASS FILTER THE SOUND...
  amix  buthp amix,5000     ;...AND AGAIN
  amix  = amix*aenv     ;APPLY THE AMPLITUDE ENVELOPE
  
  ;NOISE ELEMENT
  anoise  noise 0.8,0       ;GENERATE SOME WHITE NOISE
  aenv  expsega 1,idur,0.001,1,0.001    ;CREATE AN AMPLITUDE ENVELOPE
  kcf expseg  20000,0.7,9000,idur-0.1,9000  ;CREATE A CUTOFF FREQ. ENVELOPE
  anoise  butlp anoise,kcf      ;LOWPASS FILTER THE NOISE SIGNAL
  anoise  buthp anoise,8000     ;HIGHPASS FILTER THE NOISE SIGNAL
  anoise  = anoise*aenv     ;APPLY THE AMPLITUDE ENVELOPE
  
  ;MIX PULSE OSCILLATOR AND NOISE COMPONENTS
  amix  = (amix+anoise)*ilevel*p5*0.55

  pan_verb_mix(amix, xchan:k("CHH.pan", 0.5), xchan:k("CHH.rvb", chnget:i("drums.rvb.default")))
endin

/** High Tom - From Iain McCurdy's TR-808.csd */
instr HiTom ;HIGH TOM
  idur = xchan("HiTom.decay", 1.0)  
  ilevel = xchan("HiTom.level", 1) 
  itune = xchan("HiTom.tune", 0)
  ioct = octave:i(itune)

  ifrq      = 200 * ioct  ;FREQUENCY
  p3      = 0.5 * idur      ;DURATION OF THIS NOTE

  ;SINE TONE SIGNAL
  aAmpEnv transeg 1,p3,-10,0.001        ;AMPLITUDE ENVELOPE FOR SINE TONE SIGNAL
  afmod expsega 5,0.125/ifrq,1,1,1      ;FREQUENCY MODULATION ENVELOPE. GIVES THE TONE MORE OF AN ATTACK.
  asig  oscili  -aAmpEnv*0.6,ifrq*afmod,gi_808_sine   ;SINE TONE SIGNAL

  ;NOISE SIGNAL
  aEnvNse transeg 1,p3,-6,0.001       ;AMPLITUDE ENVELOPE FOR NOISE SIGNAL
  anoise  dust2 0.4, 8000       ;GENERATE NOISE SIGNAL
  anoise  reson anoise,400*ioct,800,1 ;BANDPASS FILTER THE NOISE SIGNAL
  anoise  buthp anoise,100*ioct   ;HIGHPASS FILTER THE NOSIE SIGNAL
  anoise  butlp anoise,1000*ioct    ;LOWPASS FILTER THE NOISE SIGNAL
  anoise  = anoise * aEnvNse      ;SCALE NOISE SIGNAL WITH AMPLITUDE ENVELOPE
  
  ;MIX THE TWO SOUND COMPONENTS
  amix  = (asig + anoise)*ilevel*p5

  pan_verb_mix(amix, xchan:k("HiTom.pan", 0.5), xchan:k("HiTom.rvb", chnget:i("drums.rvb.default")))
endin

/** Mid Tom - From Iain McCurdy's TR-808.csd */
instr MidTom ;MID TOM
  idur = xchan("MidTom.decay", 1.0) 
  ilevel = xchan("MidTom.level", 1) 
  itune = xchan("MidTom.tune", 0)
  ioct = octave:i(itune)

  ifrq      = 133*ioct    ;FREQUENCY
  p3      = 0.6 * idur      ;DURATION OF THIS NOTE

  ;SINE TONE SIGNAL
  aAmpEnv transeg 1,p3,-10,0.001        ;AMPLITUDE ENVELOPE FOR SINE TONE SIGNAL
  afmod expsega 5,0.125/ifrq,1,1,1      ;FREQUENCY MODULATION ENVELOPE. GIVES THE TONE MORE OF AN ATTACK.
  asig  oscili  -aAmpEnv*0.6,ifrq*afmod,gi_808_sine   ;SINE TONE SIGNAL

  ;NOISE SIGNAL
  aEnvNse transeg 1,p3,-6,0.001       ;AMPLITUDE ENVELOPE FOR NOISE SIGNAL
  anoise  dust2 0.4, 8000       ;GENERATE NOISE SIGNAL
  anoise  reson anoise, 400*ioct,800,1  ;BANDPASS FILTER THE NOISE SIGNAL
  anoise  buthp anoise,100*ioct   ;HIGHPASS FILTER THE NOSIE SIGNAL
  anoise  butlp anoise,600*ioct   ;LOWPASS FILTER THE NOISE SIGNAL
  anoise  = anoise * aEnvNse      ;SCALE NOISE SIGNAL WITH AMPLITUDE ENVELOPE
  
  ;MIX THE TWO SOUND COMPONENTS
  amix  = (asig + anoise)*ilevel*p5

  pan_verb_mix(amix, xchan:k("MidTom.pan", 0.5), xchan:k("MidTom.rvb", chnget:i("drums.rvb.default")))
endin

/** Low Tom - From Iain McCurdy's TR-808.csd */
instr LowTom  ;LOW TOM
  idur = xchan("LowTom.decay", 1.0) 
  ilevel = xchan("LowTom.level", 1) 
  itune = xchan("LowTom.tune", 0)
  ioct = octave:i(itune)

  ifrq      = 90 * ioct ;FREQUENCY
  p3    = 0.7*idur    ;DURATION OF THIS NOTE

  ;SINE TONE SIGNAL
  aAmpEnv transeg 1,p3,-10,0.001        ;AMPLITUDE ENVELOPE FOR SINE TONE SIGNAL
  afmod expsega 5,0.125/ifrq,1,1,1      ;FREQUENCY MODULATION ENVELOPE. GIVES THE TONE MORE OF AN ATTACK.
  asig  oscili  -aAmpEnv*0.6,ifrq*afmod,gi_808_sine   ;SINE TONE SIGNAL

  ;NOISE SIGNAL
  aEnvNse transeg 1,p3,-6,0.001       ;AMPLITUDE ENVELOPE FOR NOISE SIGNAL
  anoise  dust2 0.4, 8000       ;GENERATE NOISE SIGNAL
  anoise  reson anoise,40*ioct,800,1    ;BANDPASS FILTER THE NOISE SIGNAL
  anoise  buthp anoise,100*ioct   ;HIGHPASS FILTER THE NOSIE SIGNAL
  anoise  butlp anoise,600*ioct   ;LOWPASS FILTER THE NOISE SIGNAL
  anoise  = anoise * aEnvNse      ;SCALE NOISE SIGNAL WITH AMPLITUDE ENVELOPE
  
  ;MIX THE TWO SOUND COMPONENTS
  amix  = (asig + anoise)*ilevel*p5

  pan_verb_mix(amix, xchan:k("LowTom.pan", 0.5), xchan:k("LowTom.rvb", chnget:i("drums.rvb.default")))
endin



/** Cymbal - From Iain McCurdy's TR-808.csd */
instr Cymbal  ;CYMBAL
  idur = xchan("Cymbal.decay", 1.0) 
  ilevel = xchan("Cymbal.level", 1) 
  itune = xchan("Cymbal.tune", 0)
  ioct = octave:i(itune)

  iFrq1 = 296*ioct  ;FREQUENCIES OF THE 6 OSCILLATORS
  iFrq2 = 285*ioct
  iFrq3 = 365*ioct
  iFrq4 = 348*ioct     
  iFrq5 = 420*ioct
  iFrq6 = 835*ioct
  p3  = 2*idur  ;DURATION OF THE NOTE

  ;SOUND CONSISTS OF 6 PULSE OSCILLATORS MIXED WITH A NOISE COMPONENT
  ;PITCHED ELEMENT
  aenv  expon 1,p3,0.0001   ;AMPLITUDE ENVELOPE FOR THE PULSE OSCILLATORS 
  ipw = 0.25      ;PULSE WIDTH      
  a1  vco2  0.5,iFrq1,2,ipw   ;PULSE OSCILLATORS...  
  a2  vco2  0.5,iFrq2,2,ipw
  a3  vco2  0.5,iFrq3,2,ipw
  a4  vco2  0.5,iFrq4,2,ipw
  a5  vco2  0.5,iFrq5,2,ipw 
  a6  vco2  0.5,iFrq6,2,ipw

  amix  sum a1,a2,a3,a4,a5,a6   ;MIX THE PULSE OSCILLATORS
  amix  reson amix,5000 * ioct,5000,1 ;BANDPASS FILTER THE MIXTURE
  amix  buthp amix,10000      ;HIGHPASS FILTER THE SOUND
  amix  butlp amix,12000      ;LOWPASS FILTER THE SOUND...
  amix  butlp amix,12000      ;AND AGAIN...
  amix  = amix*aenv     ;APPLY THE AMPLITUDE ENVELOPE
  
  ;NOISE ELEMENT
  anoise  noise 0.8,0       ;GENERATE SOME WHITE NOISE
  aenv  expsega 1,0.3,0.07,p3-0.1,0.00001 ;CREATE AN AMPLITUDE ENVELOPE
  kcf expseg  14000,0.7,7000,p3-0.1,5000  ;CREATE A CUTOFF FREQ. ENVELOPE
  anoise  butlp anoise,kcf      ;LOWPASS FILTER THE NOISE SIGNAL
  anoise  buthp anoise,8000     ;HIGHPASS FILTER THE NOISE SIGNAL
  anoise  = anoise*aenv     ;APPLY THE AMPLITUDE ENVELOPE            

  ;MIX PULSE OSCILLATOR AND NOISE COMPONENTS
  amix  = (amix+anoise)*ilevel*p5*0.85

  pan_verb_mix(amix, xchan:k("Cymbal.pan", 0.5), xchan:k("Cymbal.rvb", chnget:i("drums.rvb.default")))
endin

;WAVEFORM FOR TR808 RIMSHOT
giTR808RimShot  ftgen 0,0,1024,10, 0.971,0.269,0.041,0.054,0.011,0.013,0.08,0.0065,0.005,0.004,0.003,0.003,0.002,0.002,0.002,0.002,0.002,0.001,0.001,0.001,0.001,0.001,0.002,0.001,0.001  

/** Rimshot - From Iain McCurdy's TR-808.csd */
instr Rimshot ;RIM SHOT

  idur = xchan("Rimshot.decay", 1.0)  
  ilevel = xchan("Rimshot.level", 1) 
  itune = xchan("Rimshot.tune", 0)

  idur  = 0.027*idur    ;NOTE DURATION
  p3  limit idur,0.1,10     ;LIMIT THE MINIMUM DURATION OF THE NOTE (VERY SHORT NOTES CAN RESULT IN THE INDICATOR LIGHT ON-OFF NOTE BEING TO0 SHORT)

  ;RING
  aenv1 expsega 1,idur,0.001,1,0.001    ;AMPLITUDE ENVELOPE FOR SUSTAIN ELEMENT OF SOUND
  ifrq1 = 1700*octave(itune)    ;FREQUENCY OF SUSTAIN ELEMENT OF SOUND
  aring oscili  1,ifrq1,giTR808RimShot,0    ;CREATE SUSTAIN ELEMENT OF SOUND  
  aring butbp aring,ifrq1,ifrq1*8 
  aring = aring*(aenv1-0.001)*0.5     ;APPLY AMPLITUDE ENVELOPE

  ;NOISE
  anoise  noise 1,0         ;CREATE A NOISE SIGNAL
  aenv2 expsega 1, 0.002, 0.8, 0.005, 0.5, idur-0.002-0.005, 0.0001, 1, 0.0001  ;CREATE AMPLITUDE ENVELOPE
  anoise  buthp anoise,800      ;HIGHPASS FILTER THE NOISE SOUND
  kcf expseg  4000,idur,20        ;CUTOFF FREQUENCY FUNCTION FOR LOWPASS FILTER
  anoise  butlp anoise,kcf      ;LOWPASS FILTER THE SOUND
  anoise  = anoise*(aenv2-0.001)  ;APPLY ENVELOPE TO NOISE SIGNAL

  ;MIX
  amix  = (aring+anoise)*ilevel*p5*0.8

  pan_verb_mix(amix, xchan:k("Rimshot.pan", 0.5), xchan:k("Rimshot.rvb", chnget:i("drums.rvb.default")))
endin


/** Claves - From Iain McCurdy's TR-808.csd */
instr Claves  
  idur = xchan("Claves.decay", 1.0) 
  ilevel = xchan("Claves.level", 1) 
  itune = xchan("Claves.tune", 0)

  ifrq  = 2500*octave(itune)  ;FREQUENCY OF OSCILLATOR
  idur  = 0.045   * idur    ;DURATION OF THE NOTE
  p3  limit idur,0.1,10     ;LIMIT THE MINIMUM DURATION OF THE NOTE (VERY SHORT NOTES CAN RESULT IN THE INDICATOR LIGHT ON-OFF NOTE BEING TO0 SHORT)      
  aenv  expsega 1,idur,0.001,1,0.001    ;AMPLITUDE ENVELOPE
  afmod expsega 3,0.00005,1,1,1     ;FREQUENCY MODULATION ENVELOPE. GIVES THE SOUND A LITTLE MORE ATTACK.
  asig  oscili  -(aenv-0.001),ifrq*afmod,gi_808_sine,0  ;AUDIO OSCILLATOR
  asig  = asig * 0.4 * ilevel * p5    ;RESCALE AMPLITUDE

  pan_verb_mix(asig, xchan:k("Claves.pan", 0.5), xchan:k("Claves.rvb", chnget:i("drums.rvb.default")))
endin


/** Cowbell - From Iain McCurdy's TR-808.csd */
instr Cowbell 
  idur = xchan("Cowbell.decay", 1.0)  
  ilevel = xchan("Cowbell.level", 1) 
  itune = xchan("Cowbell.tune", 0)

  ifrq1 = 562 * octave(itune) ;FREQUENCIES OF THE TWO OSCILLATORS
  ifrq2 = 845 * octave(itune) ;
  ipw   = 0.5         ;PULSE WIDTH OF THE OSCILLATOR  
  ishp  = -30   
  idur  = 0.7         ;NOTE DURATION
  p3  = 0.7*idur      ;LIMIT THE MINIMUM DURATION OF THE NOTE (VERY SHORT NOTES CAN RESULT IN THE INDICATOR LIGHT ON-OFF NOTE BEING TO0 SHORT)
  ishape  = -30       ;SHAPE OF THE CURVES IN THE AMPLITUDE ENVELOPE
  kenv1 transeg 1,p3*0.3,ishape,0.2, p3*0.7,ishape,0.2  ;FIRST AMPLITUDE ENVELOPE - PRINCIPALLY THE ATTACK OF THE NOTE
  kenv2 expon 1,p3,0.0005       ;SECOND AMPLITUDE ENVELOPE - THE SUSTAIN PORTION OF THE NOTE
  kenv  = kenv1*kenv2     ;COMBINE THE TWO ENVELOPES
  itype = 2       ;WAVEFORM FOR VCO2 (2=PULSE)
  a1  vco2  0.65,ifrq1,itype,ipw    ;CREATE THE TWO OSCILLATORS
  a2  vco2  0.65,ifrq2,itype,ipw
  amix  = a1+a2       ;MIX THE TWO OSCILLATORS 
  iLPF2 = 10000       ;LOWPASS FILTER RESTING FREQUENCY
  kcf expseg  12000,0.07,iLPF2,1,iLPF2  ;LOWPASS FILTER CUTOFF FREQUENCY ENVELOPE
  alpf  butlp amix,kcf      ;LOWPASS FILTER THE MIX OF THE TWO OSCILLATORS (CREATE A NEW SIGNAL)
  abpf  reson amix, ifrq2, 25     ;BANDPASS FILTER THE MIX OF THE TWO OSCILLATORS (CREATE A NEW SIGNAL)
  amix  dcblock2  (abpf*0.06*kenv1)+(alpf*0.5)+(amix*0.9) ;MIX ALL SIGNALS AND BLOCK DC OFFSET
  amix  buthp amix,700      ;HIGHPASS FILTER THE MIX OF ALL SIGNALS
  amix  = amix * 0.07 * kenv * p5 * ilevel  ;RESCALE AMPLITUDE

  pan_verb_mix(amix, xchan:k("Cowbell.pan", 0.5), xchan:k("Cowbell.rvb", chnget:i("drums.rvb.default")))
endin

/** Maraca - from Iain McCurdy's TR-808.csd */ 
instr Maraca  ;MARACA
  idur = xchan("Maraca.decay", 1.0) 
  ilevel = xchan("Maraca.level", 1) 
  itune = xchan("Maraca.tune", 0)
  ioct = octave:i(itune)

  idur  = 0.07*idur       ;DURATION 3
  p3  limit idur,0.1,10       ;LIMIT THE MINIMUM DURATION OF THE NOTE (VERY SHORT NOTES CAN RESULT IN THE INDICATOR LIGHT ON-OFF NOTE BEING TO0 SHORT)
  iHPF  limit 6000*ioct,20,sr/2 ;HIGHPASS FILTER FREQUENCY  
  iLPF  limit 12000*ioct,20,sr/3  ;LOWPASS FILTER FREQUENCY. (LIMIT MAXIMUM TO PREVENT OUT OF RANGE VALUES)
  ;AMPLITUDE ENVELOPE
  iBP1  = 0.4         ;BREAK-POINT 1
  iDur1 = 0.014*idur      ;DURATION 1
  iBP2  = 1         ;BREAKPOINT 2
  iDur2 = 0.01 *idur      ;DURATION 2
  iBP3  = 0.05          ;BREAKPOINT 3
  p3  limit idur,0.1,10       ;LIMIT THE MINIMUM DURATION OF THE NOTE (VERY SHORT NOTES CAN RESULT IN THE INDICATOR LIGHT ON-OFF NOTE BEING TO0 SHORT)
  aenv  expsega iBP1,iDur1,iBP2,iDur2,iBP3    ;CREATE AMPLITUDE ENVELOPE
  anoise  noise 0.75,0          ;CREATE A NOISE SIGNAL
  anoise  buthp anoise,iHPF       ;HIGHPASS FILTER THE SOUND
  anoise  butlp anoise,iLPF       ;LOWPASS FILTER THE SOUND
  anoise  = anoise*aenv*p5*ilevel ;SCALE THE AMPLITUDE

  pan_verb_mix(anoise, xchan:k("Maraca.pan", 0.5), xchan:k("Maraca.rvb", chnget:i("drums.rvb.default")))
endin

/** High Conga - From Iain McCurdy's TR-808.csd */
instr HiConga ;HIGH CONGA
  idur = xchan("HiConga.decay", 1.0)  
  ilevel = xchan("HiConga.level", 1) 
  itune = xchan("HiConga.tune", 0)
  ioct = octave:i(itune)

  ifrq    = 420*ioct    ;FREQUENCY OF NOTE
  p3    = 0.22*idur     ;DURATION OF NOTE
  aenv  transeg 0.7,1/ifrq,1,1,p3,-6,0.001  ;AMPLITUDE ENVELOPE
  afrq  expsega ifrq*3,0.25/ifrq,ifrq,1,ifrq  ;FREQUENCY ENVELOPE (CREATE A SHARPER ATTACK)
  asig  oscili  -aenv*0.25,afrq,gi_808_sine   ;CREATE THE AUDIO OSCILLATOR
  asig  = asig*p5*ilevel  ;SCALE THE AMPLITUDE
  
  pan_verb_mix(asig, xchan:k("HiConga.pan", 0.5), xchan:k("HiConga.rvb", chnget:i("drums.rvb.default")))
endin

/** Mid Conga - From Iain McCurdy's TR-808.csd */
instr MidConga  ;MID CONGA
  idur = xchan("MidConga.decay", 1.0) 
  ilevel = xchan("MidConga.level", 1) 
  itune = xchan("MidConga.tune", 0)
  ioct = octave:i(itune)

  ifrq    = 310*ioct    ;FREQUENCY OF NOTE
  p3    = 0.33*idur     ;DURATION OF NOTE
  aenv  transeg 0.7,1/ifrq,1,1,p3,-6,0.001  ;AMPLITUDE ENVELOPE 
  afrq  expsega ifrq*3,0.25/ifrq,ifrq,1,ifrq  ;FREQUENCY ENVELOPE (CREATE A SHARPER ATTACK)
  asig  oscili  -aenv*0.25,afrq,gi_808_sine   ;CREATE THE AUDIO OSCILLATOR
  asig  = asig*p5*ilevel    ;SCALE THE AMPLITUDE

  pan_verb_mix(asig, xchan:k("MidConga.pan", 0.5), xchan:k("MidConga.rvb", chnget:i("drums.rvb.default")))
endin

/** Low Conga - From Iain McCurdy's TR-808.csd */
instr LowConga  ;LOW CONGA
  idur = xchan("LowConga.decay", 1.0) 
  ilevel = xchan("LowConga.level", 1) 
  itune = xchan("LowConga.tune", 0)
  ioct = octave:i(itune)

  ifrq    = 227*ioct    ;FREQUENCY OF NOTE
  p3    = 0.41*idur     ;DURATION OF NOTE   
  aenv  transeg 0.7,1/ifrq,1,1,p3,-6,0.001  ;AMPLITUDE ENVELOPE 
  afrq  expsega ifrq*3,0.25/ifrq,ifrq,1,ifrq  ;FREQUENCY ENVELOPE (CREATE A SHARPER ATTACK)
  asig  oscili  -aenv*0.25,afrq,gi_808_sine   ;CREATE THE AUDIO OSCILLATOR
  asig  = asig*p5*ilevel  ;SCALE THE AMPLITUDE

  pan_verb_mix(asig, xchan:k("LowConga.pan", 0.5), xchan:k("LowConga.rvb", chnget:i("drums.rvb.default")))
endin

;; INITIALIZATION OF SYSTEM

start("Clock")
