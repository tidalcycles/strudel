; returns value of given key in given "string map"
; keymap("freq", "note/c3/freq/220/gain/0.5")
; yields "220"
opcode keymap, S, SS
  Skey, Smap xin
  idelimiter = strindex(Smap, strcat(Skey, "/"))
  ifrom = idelimiter + strlen(Skey) + 1
  Svalue = strsub(Smap, ifrom, strlen(Smap))
  Svalue = strsub(Svalue, 0, strindex(Svalue, "/"))
  xout Svalue
endop

; TODO add incredibly dope synths
instr organ
    iduration = p3
    ifreq = p4
    igain = p5
    ioct = octcps(ifreq)

    asig = vco2(igain, ifreq, 12, .5) ; my edit
    kpwm = oscili(.1, 5)
    asig = vco2(igain, ifreq, 4, .5 + kpwm)
    asig += vco2(igain/4, ifreq * 2)

    ; filter
    ; idepth = 2
    ; acut = transegr:a(0, .005, 0, idepth, .06, -4.2, 0.001, .01, -4.2, 0) ; filter envelope
    ; asig = zdf_2pole(asig, cpsoct(ioct + acut), 0.5)

    ; amp envelope
    iattack = .001
    irelease = .05
    asig *= linsegr:a(0, iattack, 1, iduration, 1, irelease, 0)

    out(asig, asig)

endin

instr triangle
  iduration = p3
  ifreq = p4
  igain = p5
  ioct = octcps(ifreq)
  
  asig = vco2(igain, ifreq, 12, .5)
  
  ; amp envelope
  iattack = .001
  irelease = .05
  asig *= linsegr:a(0, iattack, 1, iduration, 1, irelease, 0)
  
  out(asig, asig)
endin

instr pad
    iduration = p3
    ifreq = p4
    igain = p5
    ioct = octcps(ifreq)

    asig = vco2(igain, ifreq, 0)

    ; amp envelope
    iattack = .5
    irelease = .1
    asig *= linsegr:a(0, iattack, 1, iduration, 1, irelease, 0)
    
    idepth = 2
    acut = transegr:a(0, .005, 0, idepth, .06, -4.2, 0.001, .01, -4.2, 0)
    asig = zdf_2pole(asig, 1000, 2)

    out(asig, asig)
endin


gisine	ftgen	0, 0, 4096, 10, 1

instr bow
    kpres = 2
    krat = 0.16
    kvibf = 6.12723
    
    kvib  linseg 0, 0.5, 0, 1, 1, p3-0.5, 1	
    kvamp = kvib * 0.01
    asig  wgbow .7, p4, kpres, krat, kvibf, kvamp, gisine
    asig = asig*p5
    outs asig, asig
endin


instr Meta
    Smap = strget(p6)
    Sinstrument = keymap("s", Smap)
    schedule(Sinstrument, 0, p3, p4, p5)
    ; TODO find a way to pipe Sinstrument through effects
endin