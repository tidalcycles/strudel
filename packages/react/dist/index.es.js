import y, { useCallback as T, useState as w, useEffect as q, useMemo as R, useRef as I, useLayoutEffect as j } from "react";
import Y from "@uiw/react-codemirror";
import { Decoration as A, EditorView as K } from "@codemirror/view";
import { StateEffect as U, StateField as Q } from "@codemirror/state";
import { javascript as Z } from "@codemirror/lang-javascript";
import { tags as m } from "@lezer/highlight";
import { createTheme as ee } from "@uiw/codemirror-themes";
import { useInView as te } from "react-hook-inview";
import { evaluate as G } from "@strudel.cycles/eval";
import { Tone as M } from "@strudel.cycles/tone";
import { TimeSpan as oe, State as re } from "@strudel.cycles/core";
import { webaudioOutputTrigger as ne } from "@strudel.cycles/webaudio";
import { WebMidi as N, enableWebMidi as se } from "@strudel.cycles/midi";
const ae = ee({
  theme: "dark",
  settings: {
    background: "#222",
    foreground: "#75baff",
    caret: "#ffcc00",
    selection: "rgba(128, 203, 196, 0.5)",
    selectionMatch: "#036dd626",
    lineHighlight: "#8a91991a",
    gutterBackground: "transparent",
    gutterForeground: "#676e95"
  },
  styles: [
    { tag: m.keyword, color: "#c792ea" },
    { tag: m.operator, color: "#89ddff" },
    { tag: m.special(m.variableName), color: "#eeffff" },
    { tag: m.typeName, color: "#f07178" },
    { tag: m.atom, color: "#f78c6c" },
    { tag: m.number, color: "#ff5370" },
    { tag: m.definition(m.variableName), color: "#82aaff" },
    { tag: m.string, color: "#c3e88d" },
    { tag: m.special(m.string), color: "#f07178" },
    { tag: m.comment, color: "#7d8799" },
    { tag: m.variableName, color: "#f07178" },
    { tag: m.tagName, color: "#ff5370" },
    { tag: m.bracket, color: "#a2a1a4" },
    { tag: m.meta, color: "#ffcb6b" },
    { tag: m.attributeName, color: "#c792ea" },
    { tag: m.propertyName, color: "#c792ea" },
    { tag: m.className, color: "#decb6b" },
    { tag: m.invalid, color: "#ffffff" }
  ]
});
const z = U.define(), ce = Q.define({
  create() {
    return A.none;
  },
  update(e, o) {
    try {
      for (let r of o.effects)
        if (r.is(z))
          if (r.value) {
            const n = A.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = A.set([n.range(0, o.newDoc.length)]);
          } else
            e = A.set([]);
      return e;
    } catch (r) {
      return console.warn("flash error", r), e;
    }
  },
  provide: (e) => K.decorations.from(e)
}), ie = (e) => {
  e.dispatch({ effects: z.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: z.of(!1) });
  }, 200);
}, O = U.define(), le = Q.define({
  create() {
    return A.none;
  },
  update(e, o) {
    try {
      for (let r of o.effects)
        if (r.is(O)) {
          const n = r.value.map(
            (s) => (s.context.locations || []).map(({ start: i, end: a }) => {
              const t = s.context.color || "#FFCA28";
              let l = o.newDoc.line(i.line).from + i.column, c = o.newDoc.line(a.line).from + a.column;
              const f = o.newDoc.length;
              return l > f || c > f ? void 0 : A.mark({ attributes: { style: `outline: 1.5px solid ${t};` } }).range(l, c);
            })
          ).flat().filter(Boolean) || [];
          e = A.set(n, !0);
        }
      return e;
    } catch {
      return A.set([]);
    }
  },
  provide: (e) => K.decorations.from(e)
}), ue = [Z(), ae, le, ce];
function de({ value: e, onChange: o, onViewChanged: r, onSelectionChange: n, options: s, editorDidMount: i }) {
  const a = T(
    (c) => {
      o?.(c);
    },
    [o]
  ), t = T(
    (c) => {
      r?.(c);
    },
    [r]
  ), l = T(
    (c) => {
      c.selectionSet && n && n?.(c.state.selection);
    },
    [n]
  );
  return /* @__PURE__ */ y.createElement(y.Fragment, null, /* @__PURE__ */ y.createElement(Y, {
    value: e,
    onChange: a,
    onCreateEditor: t,
    onUpdate: l,
    extensions: ue
  }));
}
function fe(e) {
  const { onEvent: o, onQuery: r, onSchedule: n, ready: s = !0, onDraw: i } = e, [a, t] = w(!1), l = 1, c = () => Math.floor(M.getTransport().seconds / l), f = (g = c()) => {
    const C = new oe(g, g + 1), v = r?.(new re(C)) || [];
    n?.(v, g);
    const h = C.begin.valueOf();
    M.getTransport().cancel(h);
    const D = (g + 1) * l - 0.5, _ = Math.max(M.getTransport().seconds, D) + 0.1;
    M.getTransport().schedule(() => {
      f(g + 1);
    }, _), v?.filter((E) => E.part.begin.equals(E.whole?.begin)).forEach((E) => {
      M.getTransport().schedule((L) => {
        o(L, E, M.getContext().currentTime), M.Draw.schedule(() => {
          i?.(L, E);
        }, L);
      }, E.part.begin.valueOf());
    });
  };
  q(() => {
    s && f();
  }, [o, n, r, i, s]);
  const p = async () => {
    t(!0), await M.start(), M.getTransport().start("+0.1");
  }, d = () => {
    M.getTransport().pause(), t(!1);
  };
  return {
    start: p,
    stop: d,
    onEvent: o,
    started: a,
    setStarted: t,
    toggle: () => a ? d() : p(),
    query: f,
    activeCycle: c
  };
}
function ge(e) {
  return q(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), T((o) => window.postMessage(o, "*"), []);
}
let he = () => Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
const me = (e) => encodeURIComponent(btoa(e));
function pe({ tune: e, autolink: o = !0, onEvent: r, onDraw: n }) {
  const s = R(() => he(), []), [i, a] = w(e), [t, l] = w(), [c, f] = w(""), [p, d] = w(), [k, g] = w(!1), [C, v] = w(""), [h, D] = w(), _ = R(() => i !== t || p, [i, t, p]), E = T((b) => f((u) => u + `${u ? `

` : ""}${b}`), []), L = R(() => {
    if (t && !t.includes("strudel disable-highlighting"))
      return (b, u) => n?.(b, u, t);
  }, [t, n]), H = R(() => t && t.includes("strudel hide-header"), [t]), x = R(() => t && t.includes("strudel hide-console"), [t]), P = fe({
    onDraw: L,
    onEvent: T(
      (b, u, X) => {
        try {
          r?.(u), u.context.logs?.length && u.context.logs.forEach(E);
          const { onTrigger: S = ne } = u.context;
          S(b, u, X, 1);
        } catch (S) {
          console.warn(S), S.message = "unplayable event: " + S?.message, E(S.message);
        }
      },
      [r, E]
    ),
    onQuery: T(
      (b) => {
        try {
          return h?.query(b) || [];
        } catch (u) {
          return console.warn(u), u.message = "query error: " + u.message, d(u), [];
        }
      },
      [h]
    ),
    onSchedule: T((b, u) => J(b), []),
    ready: !!h && !!t
  }), B = ge(({ data: { from: b, type: u } }) => {
    u === "start" && b !== s && (P.setStarted(!1), l(void 0));
  }), V = T(
    async (b = i) => {
      if (t && !_) {
        d(void 0), P.start();
        return;
      }
      try {
        g(!0);
        const u = await G(b);
        P.start(), B({ type: "start", from: s }), D(() => u.pattern), o && (window.location.hash = "#" + encodeURIComponent(btoa(i))), v(me(i)), d(void 0), l(b), g(!1);
      } catch (u) {
        u.message = "evaluation error: " + u.message, console.warn(u), d(u);
      }
    },
    [t, _, i, P, o, s, B]
  ), J = (b, u) => {
    b.length;
  };
  return {
    hideHeader: H,
    hideConsole: x,
    pending: k,
    code: i,
    setCode: a,
    pattern: h,
    error: p,
    cycle: P,
    setPattern: D,
    dirty: _,
    log: c,
    togglePlay: () => {
      P.started ? P.stop() : V();
    },
    setActiveCode: l,
    activateCode: V,
    activeCode: t,
    pushLog: E,
    hash: C
  };
}
function $(...e) {
  return e.filter(Boolean).join(" ");
}
function ye({ view: e, pattern: o, active: r, getTime: n }) {
  const s = I([]), i = I();
  q(() => {
    if (e)
      if (o && r) {
        let t = function() {
          try {
            const l = n(), f = [Math.max(i.current || l, l - 1 / 10), l + 1 / 60];
            i.current = l + 1 / 60, s.current = s.current.filter((d) => d.whole.end > l);
            const p = o.queryArc(...f).filter((d) => d.hasOnset());
            s.current = s.current.concat(p), e.dispatch({ effects: O.of(s.current) });
          } catch {
            e.dispatch({ effects: O.of([]) });
          }
          a = requestAnimationFrame(t);
        }, a = requestAnimationFrame(t);
        return () => {
          cancelAnimationFrame(a);
        };
      } else
        s.current = [], e.dispatch({ effects: O.of([]) });
  }, [o, r, e]);
}
const be = "_container_3i85k_1", we = "_header_3i85k_5", ve = "_buttons_3i85k_9", Ee = "_button_3i85k_9", ke = "_buttonDisabled_3i85k_17", Ce = "_error_3i85k_21", Me = "_body_3i85k_25", F = {
  container: be,
  header: we,
  buttons: ve,
  button: Ee,
  buttonDisabled: ke,
  error: Ce,
  body: Me
};
function W({ type: e }) {
  return /* @__PURE__ */ y.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "sc-h-5 sc-w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, {
    refresh: /* @__PURE__ */ y.createElement("path", {
      fillRule: "evenodd",
      d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z",
      clipRule: "evenodd"
    }),
    play: /* @__PURE__ */ y.createElement("path", {
      fillRule: "evenodd",
      d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z",
      clipRule: "evenodd"
    }),
    pause: /* @__PURE__ */ y.createElement("path", {
      fillRule: "evenodd",
      d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z",
      clipRule: "evenodd"
    })
  }[e]);
}
function Be({ tune: e, hideOutsideView: o = !1, init: r, onEvent: n, enableKeyboard: s }) {
  const { code: i, setCode: a, pattern: t, activeCode: l, activateCode: c, evaluateOnly: f, error: p, cycle: d, dirty: k, togglePlay: g, stop: C } = pe({
    tune: e,
    autolink: !1,
    onEvent: n
  });
  q(() => {
    r && f();
  }, [e, r]);
  const [v, h] = w(), [D, _] = te({
    threshold: 0.01
  }), E = I(), L = R(() => ((_ || !o) && (E.current = !0), _ || E.current), [_, o]);
  return ye({
    view: v,
    pattern: t,
    active: d.started && !l?.includes("strudel disable-highlighting"),
    getTime: () => M.getTransport().seconds
  }), j(() => {
    if (s) {
      const H = async (x) => {
        (x.ctrlKey || x.altKey) && (x.code === "Enter" ? (x.preventDefault(), ie(v), await c()) : x.code === "Period" && (d.stop(), x.preventDefault()));
      };
      return window.addEventListener("keydown", H, !0), () => window.removeEventListener("keydown", H, !0);
    }
  }, [s, t, i, c, d, v]), /* @__PURE__ */ y.createElement("div", {
    className: F.container,
    ref: D
  }, /* @__PURE__ */ y.createElement("div", {
    className: F.header
  }, /* @__PURE__ */ y.createElement("div", {
    className: F.buttons
  }, /* @__PURE__ */ y.createElement("button", {
    className: $(F.button, d.started ? "sc-animate-pulse" : ""),
    onClick: () => g()
  }, /* @__PURE__ */ y.createElement(W, {
    type: d.started ? "pause" : "play"
  })), /* @__PURE__ */ y.createElement("button", {
    className: $(k ? F.button : F.buttonDisabled),
    onClick: () => c()
  }, /* @__PURE__ */ y.createElement(W, {
    type: "refresh"
  }))), p && /* @__PURE__ */ y.createElement("div", {
    className: F.error
  }, p.message)), /* @__PURE__ */ y.createElement("div", {
    className: F.body
  }, L && /* @__PURE__ */ y.createElement(de, {
    value: i,
    onChange: a,
    onViewChanged: h
  })));
}
function Te(e, o, r = 0.05, n = 0.1, s = 0.1) {
  let i = 0, a = 0, t = 10 ** 4, l = 0.01;
  const c = (h) => r = h(r);
  s = s || n / 2;
  const f = () => {
    const h = e(), D = h + n + s;
    for (a === 0 && (a = h + l); a < D; )
      a = Math.round(a * t) / t, a >= h && o(a, r, i), a < h && console.log("TOO LATE", a), a += r, i++;
  };
  let p;
  const d = () => {
    f(), p = setInterval(f, n * 1e3);
  }, k = () => clearInterval(p);
  return { setDuration: c, start: d, stop: () => {
    i = 0, a = 0, k();
  }, pause: () => k(), duration: r, getPhase: () => a };
}
class _e {
  worker;
  pattern;
  started = !1;
  cps = 1;
  getTime;
  phase = 0;
  constructor({ interval: o, onTrigger: r, onError: n, getTime: s, latency: i = 0.1 }) {
    this.getTime = s;
    const a = (t) => Math.round(t * 1e3) / 1e3;
    this.clock = Te(
      s,
      (t, l, c) => {
        c === 0 && (this.origin = t);
        const f = a(t - this.origin);
        this.phase = f - i;
        const p = a(f + l), d = s();
        try {
          this.pattern.queryArc(f, p).forEach((g) => {
            if (g.part.begin.equals(g.whole.begin)) {
              const C = g.whole.begin + this.origin - d + i, v = g.duration * 1;
              r?.(g, C, v);
            }
          });
        } catch (k) {
          console.warn("scheduler error", k), n?.(k);
        }
      },
      o
    );
  }
  getPhase() {
    return this.phase;
  }
  start() {
    if (!this.pattern)
      throw new Error("Scheduler: no pattern set! call .setPattern first.");
    this.clock.start(), this.started = !0;
  }
  pause() {
    this.clock.stop(), delete this.origin, this.started = !1;
  }
  stop() {
    delete this.origin, this.clock.stop(), this.started = !1;
  }
  setPattern(o) {
    this.pattern = o;
  }
  setCps(o = 1) {
    this.cps = o;
  }
  log(o, r, n) {
    const s = n.filter((i) => i.hasOnset());
    console.log(`${o.toFixed(4)} - ${r.toFixed(4)} ${Array(s.length).fill("I").join("")}`);
  }
}
function Ve({ defaultOutput: e, interval: o, getTime: r, code: n, evalOnMount: s = !1 }) {
  const [i, a] = w(), [t, l] = w(), [c, f] = w(n), [p, d] = w(), k = n !== c, g = R(
    () => new _e({ interval: o, onTrigger: e, onError: a, getTime: r }),
    [e, o]
  ), C = T(async () => {
    if (!n) {
      console.log("no code..");
      return;
    }
    try {
      const { pattern: h } = await G(n);
      f(n), g?.setPattern(h), d(h), l();
    } catch (h) {
      l(h), console.warn("eval error", h);
    }
  }, [n, g]), v = I();
  return q(() => {
    !v.current && s && (v.current = !0, C());
  }, [C, s]), { schedulerError: i, scheduler: g, evalError: t, evaluate: C, activeCode: c, isDirty: k, pattern: p };
}
const $e = (e) => j(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
function We(e) {
  const { ready: o, connected: r, disconnected: n } = e, [s, i] = w(!0), [a, t] = w(N?.outputs || []);
  return q(() => {
    se().then(() => {
      N.addListener("connected", (c) => {
        t([...N.outputs]), r?.(N, c);
      }), N.addListener("disconnected", (c) => {
        t([...N.outputs]), n?.(N, c);
      }), o?.(N), i(!1);
    }).catch((c) => {
      if (c) {
        console.error(c), console.warn("Web Midi could not be enabled..");
        return;
      }
    });
  }, [o, r, n, a]), { loading: s, outputs: a, outputByName: (c) => N.getOutputByName(c) };
}
export {
  de as CodeMirror,
  Be as MiniRepl,
  $ as cx,
  ie as flash,
  fe as useCycle,
  ye as useHighlighting,
  $e as useKeydown,
  ge as usePostMessage,
  pe as useRepl,
  Ve as useStrudel,
  We as useWebMidi
};
