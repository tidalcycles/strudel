;; based on https://kunstmusik.github.io/icsc2022-csound-web/tutorial2-interacting-with-csound/
<CsoundSynthesizer>
<CsOptions>
-o dac --port=10000
</CsOptions>
<CsInstruments>
sr=48000
ksmps=64
nchnls=2
0dbfs=1

instr 1
    ioct = octcps(p4)
    kpwm = oscili(.1, 5)
    asig = vco2(p5, p4, 4, .5 + kpwm)
    asig += vco2(p5, p4 * 2)

    idepth = 3
    acut = transegr:a(0, .005, 0, idepth, .06, -4.2, 0.001, .01, -4.2, 0)
    asig = zdf_2pole(asig, cpsoct(ioct + acut), 0.125)

    asig *= linsegr:a(1, p3, 1, .125, 0)

    out(asig, asig)

endin

opcode next_time, i, i
  inext xin

  itime = times:i()
  iticks = round(itime / inext)
  iticks += 1

  iout = (iticks * inext) - itime
  xout iout
endop


</CsInstruments>
</CsoundSynthesizer>