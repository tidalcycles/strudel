import l, { useCallback as M, useRef as E, useEffect as C, useMemo as B, useState as _, useLayoutEffect as W } from "react";
import Y from "@uiw/react-codemirror";
import { Decoration as y, EditorView as $ } from "@codemirror/view";
import { StateEffect as G, StateField as J } from "@codemirror/state";
import { javascript as Z } from "@codemirror/lang-javascript";
import { tags as s } from "@lezer/highlight";
import { createTheme as ee } from "@uiw/codemirror-themes";
import { repl as te, pianoroll as re } from "@strudel.cycles/core";
import { webaudioOutput as oe, getAudioContext as ne } from "@strudel.cycles/webaudio";
import { useInView as ae } from "react-hook-inview";
import { transpiler as se } from "@strudel.cycles/transpiler";
const ce = ee({
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
const O = G.define(), ie = J.define({
  create() {
    return y.none;
  },
  update(e, t) {
    try {
      for (let r of t.effects)
        if (r.is(O))
          if (r.value) {
            const a = y.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = y.set([a.range(0, t.newDoc.length)]);
          } else
            e = y.set([]);
      return e;
    } catch (r) {
      return console.warn("flash error", r), e;
    }
  },
  provide: (e) => $.decorations.from(e)
}), le = (e) => {
  e.dispatch({ effects: O.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: O.of(!1) });
  }, 200);
}, H = G.define(), ue = J.define({
  create() {
    return y.none;
  },
  update(e, t) {
    try {
      for (let r of t.effects)
        if (r.is(H)) {
          const a = r.value.map(
            (n) => (n.context.locations || []).map(({ start: c, end: i }) => {
              const d = n.context.color || "#FFCA28";
              let o = t.newDoc.line(c.line).from + c.column, u = t.newDoc.line(i.line).from + i.column;
              const m = t.newDoc.length;
              return o > m || u > m ? void 0 : y.mark({ attributes: { style: `outline: 1.5px solid ${d};` } }).range(o, u);
            })
          ).flat().filter(Boolean) || [];
          e = y.set(a, !0);
        }
      return e;
    } catch {
      return y.set([]);
    }
  },
  provide: (e) => $.decorations.from(e)
}), de = [Z(), ce, ue, ie];
function fe({ value: e, onChange: t, onViewChanged: r, onSelectionChange: a, options: n, editorDidMount: c }) {
  const i = M(
    (u) => {
      t?.(u);
    },
    [t]
  ), d = M(
    (u) => {
      r?.(u);
    },
    [r]
  ), o = M(
    (u) => {
      u.selectionSet && a && a?.(u.state.selection);
    },
    [a]
  );
  return /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(Y, {
    value: e,
    onChange: i,
    onCreateEditor: d,
    onUpdate: o,
    extensions: de
  }));
}
function I(...e) {
  return e.filter(Boolean).join(" ");
}
function me({ view: e, pattern: t, active: r, getTime: a }) {
  const n = E([]), c = E();
  C(() => {
    if (e)
      if (t && r) {
        let i = requestAnimationFrame(function d() {
          try {
            const o = a(), m = [Math.max(c.current || o, o - 1 / 10, 0), o + 1 / 60];
            c.current = m[1], n.current = n.current.filter((v) => v.whole.end > o);
            const g = t.queryArc(...m).filter((v) => v.hasOnset());
            n.current = n.current.concat(g), e.dispatch({ effects: H.of(n.current) });
          } catch {
            e.dispatch({ effects: H.of([]) });
          }
          i = requestAnimationFrame(d);
        });
        return () => {
          cancelAnimationFrame(i);
        };
      } else
        n.current = [], e.dispatch({ effects: H.of([]) });
  }, [t, r, e]);
}
function ge(e, t = !1) {
  const r = E(), a = E(), n = (d) => {
    if (a.current !== void 0) {
      const o = d - a.current;
      e(d, o);
    }
    a.current = d, r.current = requestAnimationFrame(n);
  }, c = () => {
    r.current = requestAnimationFrame(n);
  }, i = () => {
    r.current && cancelAnimationFrame(r.current), delete r.current;
  };
  return C(() => {
    r.current && (i(), c());
  }, [e]), C(() => (t && c(), i), []), {
    start: c,
    stop: i
  };
}
function pe({ pattern: e, started: t, getTime: r, onDraw: a }) {
  let n = E([]), c = E(null);
  const { start: i, stop: d } = ge(
    M(() => {
      const o = r();
      if (c.current === null) {
        c.current = o;
        return;
      }
      const u = e.queryArc(Math.max(c.current, o - 1 / 10), o), m = 4;
      c.current = o, n.current = (n.current || []).filter((g) => g.whole.end > o - m).concat(u.filter((g) => g.hasOnset())), a(o, n.current);
    }, [e])
  );
  C(() => {
    t ? i() : (n.current = [], d());
  }, [t]);
}
function he(e) {
  return C(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), M((t) => window.postMessage(t, "*"), []);
}
function ve({
  defaultOutput: e,
  interval: t,
  getTime: r,
  evalOnMount: a = !1,
  initialCode: n = "",
  autolink: c = !1,
  beforeEval: i,
  afterEval: d,
  onEvalError: o,
  onToggle: u,
  canvasId: m
}) {
  const g = B(() => be(), []);
  m = m || `canvas-${g}`;
  const [v, F] = _(), [k, A] = _(), [b, D] = _(n), [x, R] = _(), [S, z] = _(), [N, T] = _(!1), L = b !== x, { scheduler: f, evaluate: h, start: V, stop: K, pause: Q } = B(
    () => te({
      interval: t,
      defaultOutput: e,
      onSchedulerError: F,
      onEvalError: (p) => {
        A(p), o?.(p);
      },
      getTime: r,
      transpiler: se,
      beforeEval: ({ code: p }) => {
        D(p), i?.();
      },
      afterEval: ({ pattern: p, code: q }) => {
        R(q), z(p), A(), F(), c && (window.location.hash = "#" + encodeURIComponent(btoa(q))), d?.();
      },
      onToggle: (p) => {
        T(p), u?.(p);
      }
    }),
    [e, t, r]
  ), X = he(({ data: { from: p, type: q } }) => {
    q === "start" && p !== g && K();
  }), P = M(
    async (p = !0) => {
      await h(b, p), X({ type: "start", from: g });
    },
    [h, b]
  ), j = E();
  return C(() => {
    !j.current && a && b && (j.current = !0, P());
  }, [P, a, b]), C(() => () => {
    f.stop();
  }, [f]), {
    id: g,
    canvasId: m,
    code: b,
    setCode: D,
    error: v || k,
    schedulerError: v,
    scheduler: f,
    evalError: k,
    evaluate: h,
    activateCode: P,
    activeCode: x,
    isDirty: L,
    pattern: S,
    started: N,
    start: V,
    stop: K,
    pause: Q,
    togglePlay: async () => {
      N ? f.pause() : await P();
    }
  };
}
function be() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
function U({ type: e }) {
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
const we = "_container_3i85k_1", ye = "_header_3i85k_5", Ee = "_buttons_3i85k_9", ke = "_button_3i85k_9", _e = "_buttonDisabled_3i85k_17", Ce = "_error_3i85k_21", Fe = "_body_3i85k_25", w = {
  container: we,
  header: ye,
  buttons: Ee,
  button: ke,
  buttonDisabled: _e,
  error: Ce,
  body: Fe
}, Ne = () => ne().currentTime;
function Be({
  tune: e,
  hideOutsideView: t = !1,
  init: r,
  enableKeyboard: a,
  withCanvas: n = !1,
  canvasHeight: c = 200
}) {
  const {
    code: i,
    setCode: d,
    evaluate: o,
    activateCode: u,
    error: m,
    isDirty: g,
    activeCode: v,
    pattern: F,
    started: k,
    scheduler: A,
    togglePlay: b,
    stop: D,
    canvasId: x
  } = ve({
    initialCode: e,
    defaultOutput: oe,
    getTime: Ne
  });
  pe({
    pattern: F,
    started: k,
    getTime: () => A.now(),
    onDraw: (f, h) => {
      const V = document.querySelector("#" + x).getContext("2d");
      re({ ctx: V, time: f, haps: h, autorange: 1, fold: 1, playhead: 1 });
    }
  });
  const [R, S] = _(), [z, N] = ae({
    threshold: 0.01
  }), T = E(), L = B(() => ((N || !t) && (T.current = !0), N || T.current), [N, t]);
  return me({
    view: R,
    pattern: F,
    active: k && !v?.includes("strudel disable-highlighting"),
    getTime: () => A.getPhase()
  }), W(() => {
    if (a) {
      const f = async (h) => {
        (h.ctrlKey || h.altKey) && (h.code === "Enter" ? (h.preventDefault(), le(R), await u()) : h.code === "Period" && (D(), h.preventDefault()));
      };
      return window.addEventListener("keydown", f, !0), () => window.removeEventListener("keydown", f, !0);
    }
  }, [a, F, i, o, D, R]), /* @__PURE__ */ l.createElement("div", {
    className: w.container,
    ref: z
  }, /* @__PURE__ */ l.createElement("div", {
    className: w.header
  }, /* @__PURE__ */ l.createElement("div", {
    className: w.buttons
  }, /* @__PURE__ */ l.createElement("button", {
    className: I(w.button, k ? "sc-animate-pulse" : ""),
    onClick: () => b()
  }, /* @__PURE__ */ l.createElement(U, {
    type: k ? "pause" : "play"
  })), /* @__PURE__ */ l.createElement("button", {
    className: I(g ? w.button : w.buttonDisabled),
    onClick: () => u()
  }, /* @__PURE__ */ l.createElement(U, {
    type: "refresh"
  }))), m && /* @__PURE__ */ l.createElement("div", {
    className: w.error
  }, m.message)), /* @__PURE__ */ l.createElement("div", {
    className: w.body
  }, L && /* @__PURE__ */ l.createElement(fe, {
    value: i,
    onChange: d,
    onViewChanged: S
  })), n && /* @__PURE__ */ l.createElement("canvas", {
    id: x,
    className: "w-full pointer-events-none",
    height: c,
    ref: (f) => {
      f && f.width !== f.clientWidth && (f.width = f.clientWidth);
    }
  }));
}
const Oe = (e) => W(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  fe as CodeMirror,
  Be as MiniRepl,
  I as cx,
  le as flash,
  me as useHighlighting,
  Oe as useKeydown,
  he as usePostMessage,
  ve as useStrudel
};
