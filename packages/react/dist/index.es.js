import l, { useCallback as N, useRef as k, useEffect as _, useMemo as K, useState as w, useLayoutEffect as G } from "react";
import Z from "@uiw/react-codemirror";
import { Decoration as y, EditorView as J } from "@codemirror/view";
import { StateEffect as Q, StateField as X } from "@codemirror/state";
import { javascript as ee } from "@codemirror/lang-javascript";
import { tags as s } from "@lezer/highlight";
import { createTheme as te } from "@uiw/codemirror-themes";
import { repl as re, logger as ne, pianoroll as oe } from "@strudel.cycles/core";
import { webaudioOutput as ae, getAudioContext as ce } from "@strudel.cycles/webaudio";
import { useInView as se } from "react-hook-inview";
import { transpiler as ie } from "@strudel.cycles/transpiler";
const le = te({
  theme: "dark",
  settings: {
    background: "#222",
    foreground: "#75baff",
    caret: "#ffcc00",
    selection: "rgba(128, 203, 196, 0.5)",
    selectionMatch: "#036dd626",
    lineHighlight: "#00000050",
    gutterBackground: "transparent",
    gutterForeground: "#8a919966"
  },
  styles: [
    { tag: s.keyword, color: "#c792ea" },
    { tag: s.operator, color: "#89ddff" },
    { tag: s.special(s.variableName), color: "#eeffff" },
    { tag: s.typeName, color: "#c3e88d" },
    { tag: s.atom, color: "#f78c6c" },
    { tag: s.number, color: "#c3e88d" },
    { tag: s.definition(s.variableName), color: "#82aaff" },
    { tag: s.string, color: "#c3e88d" },
    { tag: s.special(s.string), color: "#c3e88d" },
    { tag: s.comment, color: "#7d8799" },
    { tag: s.variableName, color: "#c792ea" },
    { tag: s.tagName, color: "#c3e88d" },
    { tag: s.bracket, color: "#525154" },
    { tag: s.meta, color: "#ffcb6b" },
    { tag: s.attributeName, color: "#c792ea" },
    { tag: s.propertyName, color: "#c792ea" },
    { tag: s.className, color: "#decb6b" },
    { tag: s.invalid, color: "#ffffff" }
  ]
});
const j = Q.define(), ue = X.define({
  create() {
    return y.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(j))
          if (t.value) {
            const a = y.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = y.set([a.range(0, r.newDoc.length)]);
          } else
            e = y.set([]);
      return e;
    } catch (t) {
      return console.warn("flash error", t), e;
    }
  },
  provide: (e) => J.decorations.from(e)
}), de = (e) => {
  e.dispatch({ effects: j.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: j.of(!1) });
  }, 200);
}, z = Q.define(), fe = X.define({
  create() {
    return y.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(z)) {
          const a = t.value.map(
            (o) => (o.context.locations || []).map(({ start: i, end: u }) => {
              const m = o.context.color || "#FFCA28";
              let n = r.newDoc.line(i.line).from + i.column, d = r.newDoc.line(u.line).from + u.column;
              const v = r.newDoc.length;
              return n > v || d > v ? void 0 : y.mark({ attributes: { style: `outline: 1.5px solid ${m};` } }).range(n, d);
            })
          ).flat().filter(Boolean) || [];
          e = y.set(a, !0);
        }
      return e;
    } catch {
      return y.set([]);
    }
  },
  provide: (e) => J.decorations.from(e)
}), me = [ee(), le, fe, ue];
function ge({ value: e, onChange: r, onViewChanged: t, onSelectionChange: a, options: o, editorDidMount: i }) {
  const u = N(
    (d) => {
      r?.(d);
    },
    [r]
  ), m = N(
    (d) => {
      t?.(d);
    },
    [t]
  ), n = N(
    (d) => {
      d.selectionSet && a && a?.(d.state.selection);
    },
    [a]
  );
  return /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(Z, {
    value: e,
    onChange: u,
    onCreateEditor: m,
    onUpdate: n,
    extensions: me
  }));
}
function W(...e) {
  return e.filter(Boolean).join(" ");
}
function pe({ view: e, pattern: r, active: t, getTime: a }) {
  const o = k([]), i = k();
  _(() => {
    if (e)
      if (r && t) {
        let u = requestAnimationFrame(function m() {
          try {
            const n = a(), v = [Math.max(i.current || n, n - 1 / 10, 0), n + 1 / 60];
            i.current = v[1], o.current = o.current.filter((p) => p.whole.end > n);
            const h = r.queryArc(...v).filter((p) => p.hasOnset());
            o.current = o.current.concat(h), e.dispatch({ effects: z.of(o.current) });
          } catch {
            e.dispatch({ effects: z.of([]) });
          }
          u = requestAnimationFrame(m);
        });
        return () => {
          cancelAnimationFrame(u);
        };
      } else
        o.current = [], e.dispatch({ effects: z.of([]) });
  }, [r, t, e]);
}
function he(e, r = !1) {
  const t = k(), a = k(), o = (m) => {
    if (a.current !== void 0) {
      const n = m - a.current;
      e(m, n);
    }
    a.current = m, t.current = requestAnimationFrame(o);
  }, i = () => {
    t.current = requestAnimationFrame(o);
  }, u = () => {
    t.current && cancelAnimationFrame(t.current), delete t.current;
  };
  return _(() => {
    t.current && (u(), i());
  }, [e]), _(() => (r && i(), u), []), {
    start: i,
    stop: u
  };
}
function ve({ pattern: e, started: r, getTime: t, onDraw: a }) {
  let o = k([]), i = k(null);
  const { start: u, stop: m } = he(
    N(() => {
      const n = t();
      if (i.current === null) {
        i.current = n;
        return;
      }
      const d = e.queryArc(Math.max(i.current, n - 1 / 10), n), v = 4;
      i.current = n, o.current = (o.current || []).filter((h) => h.whole.end > n - v).concat(d.filter((h) => h.hasOnset())), a(n, o.current);
    }, [e])
  );
  _(() => {
    r ? u() : (o.current = [], m());
  }, [r]);
}
function be(e) {
  return _(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), N((r) => window.postMessage(r, "*"), []);
}
function Ee({
  defaultOutput: e,
  interval: r,
  getTime: t,
  evalOnMount: a = !1,
  initialCode: o = "",
  autolink: i = !1,
  beforeEval: u,
  afterEval: m,
  editPattern: n,
  onEvalError: d,
  onToggle: v,
  canvasId: h
}) {
  const p = K(() => we(), []);
  h = h || `canvas-${p}`;
  const [F, A] = w(), [P, D] = w(), [b, q] = w(o), [x, V] = w(), [I, R] = w(), [L, B] = w(!1), H = b !== x, { scheduler: M, evaluate: c, start: f, stop: C, pause: O } = K(
    () => re({
      interval: r,
      defaultOutput: e,
      onSchedulerError: A,
      onEvalError: (g) => {
        D(g), d?.(g);
      },
      getTime: t,
      transpiler: ie,
      beforeEval: ({ code: g }) => {
        q(g), u?.();
      },
      editPattern: n ? (g) => n(g, p) : void 0,
      afterEval: ({ pattern: g, code: T }) => {
        V(T), R(g), D(), A(), i && (window.location.hash = "#" + encodeURIComponent(btoa(T))), m?.();
      },
      onToggle: (g) => {
        B(g), v?.(g);
      }
    }),
    [e, r, t]
  ), Y = be(({ data: { from: g, type: T } }) => {
    T === "start" && g !== p && C();
  }), S = N(
    async (g = !0) => {
      await c(b, g), Y({ type: "start", from: p });
    },
    [c, b]
  ), U = k();
  return _(() => {
    !U.current && a && b && (U.current = !0, S());
  }, [S, a, b]), _(() => () => {
    M.stop();
  }, [M]), {
    id: p,
    canvasId: h,
    code: b,
    setCode: q,
    error: F || P,
    schedulerError: F,
    scheduler: M,
    evalError: P,
    evaluate: c,
    activateCode: S,
    activeCode: x,
    isDirty: H,
    pattern: I,
    started: L,
    start: f,
    stop: C,
    pause: O,
    togglePlay: async () => {
      L ? M.pause() : await S();
    }
  };
}
function we() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
function $({ type: e }) {
  return /* @__PURE__ */ l.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "sc-h-5 sc-w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, {
    refresh: /* @__PURE__ */ l.createElement("path", {
      fillRule: "evenodd",
      d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z",
      clipRule: "evenodd"
    }),
    play: /* @__PURE__ */ l.createElement("path", {
      fillRule: "evenodd",
      d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z",
      clipRule: "evenodd"
    }),
    pause: /* @__PURE__ */ l.createElement("path", {
      fillRule: "evenodd",
      d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z",
      clipRule: "evenodd"
    })
  }[e]);
}
const ye = "_container_3i85k_1", ke = "_header_3i85k_5", _e = "_buttons_3i85k_9", Fe = "_button_3i85k_9", Ce = "_buttonDisabled_3i85k_17", Ne = "_error_3i85k_21", xe = "_body_3i85k_25", E = {
  container: ye,
  header: ke,
  buttons: _e,
  button: Fe,
  buttonDisabled: Ce,
  error: Ne,
  body: xe
}, Me = () => ce().currentTime;
function je({ tune: e, hideOutsideView: r = !1, enableKeyboard: t, withCanvas: a = !1, canvasHeight: o = 200 }) {
  const {
    code: i,
    setCode: u,
    evaluate: m,
    activateCode: n,
    error: d,
    isDirty: v,
    activeCode: h,
    pattern: p,
    started: F,
    scheduler: A,
    togglePlay: P,
    stop: D,
    canvasId: b,
    id: q
  } = Ee({
    initialCode: e,
    defaultOutput: ae,
    getTime: Me,
    editPattern: (c, f) => c.withContext((C) => ({ ...C, id: f }))
  });
  ve({
    pattern: p,
    started: a && F,
    getTime: () => A.now(),
    onDraw: (c, f) => {
      const C = document.querySelector("#" + b).getContext("2d");
      oe({ ctx: C, time: c, haps: f, autorange: 1, fold: 1, playhead: 1 });
    }
  });
  const [x, V] = w(), [I, R] = se({
    threshold: 0.01
  }), L = k(), B = K(() => ((R || !r) && (L.current = !0), R || L.current), [R, r]);
  pe({
    view: x,
    pattern: p,
    active: F && !h?.includes("strudel disable-highlighting"),
    getTime: () => A.getPhase()
  }), G(() => {
    if (t) {
      const c = async (f) => {
        (f.ctrlKey || f.altKey) && (f.code === "Enter" ? (f.preventDefault(), de(x), await n()) : f.code === "Period" && (D(), f.preventDefault()));
      };
      return window.addEventListener("keydown", c, !0), () => window.removeEventListener("keydown", c, !0);
    }
  }, [t, p, i, m, D, x]);
  const [H, M] = w([]);
  return Ae(
    N((c) => {
      const { data: f } = c.detail;
      f?.hap?.context?.id === q && M((O) => O.concat([c.detail]).slice(-10));
    }, [])
  ), /* @__PURE__ */ l.createElement("div", {
    className: E.container,
    ref: I
  }, /* @__PURE__ */ l.createElement("div", {
    className: E.header
  }, /* @__PURE__ */ l.createElement("div", {
    className: E.buttons
  }, /* @__PURE__ */ l.createElement("button", {
    className: W(E.button, F ? "sc-animate-pulse" : ""),
    onClick: () => P()
  }, /* @__PURE__ */ l.createElement($, {
    type: F ? "pause" : "play"
  })), /* @__PURE__ */ l.createElement("button", {
    className: W(v ? E.button : E.buttonDisabled),
    onClick: () => n()
  }, /* @__PURE__ */ l.createElement($, {
    type: "refresh"
  }))), d && /* @__PURE__ */ l.createElement("div", {
    className: E.error
  }, d.message)), /* @__PURE__ */ l.createElement("div", {
    className: E.body
  }, B && /* @__PURE__ */ l.createElement(ge, {
    value: i,
    onChange: u,
    onViewChanged: V
  })), a && /* @__PURE__ */ l.createElement("canvas", {
    id: b,
    className: "w-full pointer-events-none",
    height: o,
    ref: (c) => {
      c && c.width !== c.clientWidth && (c.width = c.clientWidth);
    }
  }), !!H.length && /* @__PURE__ */ l.createElement("div", {
    className: "sc-bg-gray-800 sc-rounded-md sc-p-2"
  }, H.map(({ message: c }, f) => /* @__PURE__ */ l.createElement("div", {
    key: f
  }, c))));
}
function Ae(e) {
  De(ne.key, e);
}
function De(e, r, t = !1) {
  _(() => (document.addEventListener(e, r, t), () => {
    document.removeEventListener(e, r, t);
  }), [r]);
}
const Ue = (e) => G(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  ge as CodeMirror,
  je as MiniRepl,
  W as cx,
  de as flash,
  pe as useHighlighting,
  Ue as useKeydown,
  be as usePostMessage,
  Ee as useStrudel
};
