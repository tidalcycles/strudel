import i, { useCallback as N, useRef as E, useEffect as F, useMemo as V, useState as _, useLayoutEffect as U } from "react";
import Y from "@uiw/react-codemirror";
import { Decoration as y, EditorView as W } from "@codemirror/view";
import { StateEffect as $, StateField as G } from "@codemirror/state";
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
const B = $.define(), ie = G.define({
  create() {
    return y.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(B))
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
  provide: (e) => W.decorations.from(e)
}), le = (e) => {
  e.dispatch({ effects: B.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: B.of(!1) });
  }, 200);
}, H = $.define(), ue = G.define({
  create() {
    return y.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(H)) {
          const a = t.value.map(
            (n) => (n.context.locations || []).map(({ start: c, end: l }) => {
              const d = n.context.color || "#FFCA28";
              let o = r.newDoc.line(c.line).from + c.column, u = r.newDoc.line(l.line).from + l.column;
              const f = r.newDoc.length;
              return o > f || u > f ? void 0 : y.mark({ attributes: { style: `outline: 1.5px solid ${d};` } }).range(o, u);
            })
          ).flat().filter(Boolean) || [];
          e = y.set(a, !0);
        }
      return e;
    } catch {
      return y.set([]);
    }
  },
  provide: (e) => W.decorations.from(e)
}), de = [Z(), ce, ue, ie];
function fe({ value: e, onChange: r, onViewChanged: t, onSelectionChange: a, options: n, editorDidMount: c }) {
  const l = N(
    (u) => {
      r?.(u);
    },
    [r]
  ), d = N(
    (u) => {
      t?.(u);
    },
    [t]
  ), o = N(
    (u) => {
      u.selectionSet && a && a?.(u.state.selection);
    },
    [a]
  );
  return /* @__PURE__ */ i.createElement(i.Fragment, null, /* @__PURE__ */ i.createElement(Y, {
    value: e,
    onChange: l,
    onCreateEditor: d,
    onUpdate: o,
    extensions: de
  }));
}
function j(...e) {
  return e.filter(Boolean).join(" ");
}
function me({ view: e, pattern: r, active: t, getTime: a }) {
  const n = E([]), c = E();
  F(() => {
    if (e)
      if (r && t) {
        let l = requestAnimationFrame(function d() {
          try {
            const o = a(), f = [Math.max(c.current || o, o - 1 / 10, 0), o + 1 / 60];
            c.current = f[1], n.current = n.current.filter((v) => v.whole.end > o);
            const m = r.queryArc(...f).filter((v) => v.hasOnset());
            n.current = n.current.concat(m), e.dispatch({ effects: H.of(n.current) });
          } catch {
            e.dispatch({ effects: H.of([]) });
          }
          l = requestAnimationFrame(d);
        });
        return () => {
          cancelAnimationFrame(l);
        };
      } else
        n.current = [], e.dispatch({ effects: H.of([]) });
  }, [r, t, e]);
}
function ge(e, r = !1) {
  const t = E(), a = E(), n = (d) => {
    if (a.current !== void 0) {
      const o = d - a.current;
      e(d, o);
    }
    a.current = d, t.current = requestAnimationFrame(n);
  }, c = () => {
    t.current = requestAnimationFrame(n);
  }, l = () => {
    t.current && cancelAnimationFrame(t.current), delete t.current;
  };
  return F(() => {
    t.current && (l(), c());
  }, [e]), F(() => (r && c(), l), []), {
    start: c,
    stop: l
  };
}
function pe({ pattern: e, started: r, getTime: t, onDraw: a }) {
  let n = E([]), c = E(null);
  const { start: l, stop: d } = ge(
    N(() => {
      const o = t();
      if (c.current === null) {
        c.current = o;
        return;
      }
      const u = e.queryArc(Math.max(c.current, o - 1 / 10), o), f = 4;
      c.current = o, n.current = (n.current || []).filter((m) => m.whole.end > o - f).concat(u.filter((m) => m.hasOnset())), a(o, n.current);
    }, [e])
  );
  F(() => {
    r ? l() : (n.current = [], d());
  }, [r]);
}
function he(e) {
  return F(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), N((r) => window.postMessage(r, "*"), []);
}
function ve({
  defaultOutput: e,
  interval: r,
  getTime: t,
  evalOnMount: a = !1,
  initialCode: n = "",
  autolink: c = !1,
  beforeEval: l,
  afterEval: d,
  onEvalError: o,
  onToggle: u,
  canvasId: f
}) {
  const m = V(() => be(), []);
  f = f || `canvas-${m}`;
  const [v, k] = _(), [M, T] = _(), [b, A] = _(n), [C, S] = _(), [z, D] = _(), [x, L] = _(!1), h = b !== C, { scheduler: g, evaluate: R, start: J, stop: O, pause: Q } = V(
    () => te({
      interval: r,
      defaultOutput: e,
      onSchedulerError: k,
      onEvalError: (p) => {
        T(p), o?.(p);
      },
      getTime: t,
      transpiler: se,
      beforeEval: ({ code: p }) => {
        A(p), l?.();
      },
      afterEval: ({ pattern: p, code: q }) => {
        S(q), D(p), T(), k(), c && (window.location.hash = "#" + encodeURIComponent(btoa(q))), d?.();
      },
      onToggle: (p) => {
        L(p), u?.(p);
      }
    }),
    [e, r, t]
  ), X = he(({ data: { from: p, type: q } }) => {
    q === "start" && p !== m && O();
  }), P = N(
    async (p = !0) => {
      await R(b, p), X({ type: "start", from: m });
    },
    [R, b]
  ), K = E();
  return F(() => {
    !K.current && a && b && (K.current = !0, P());
  }, [P, a, b]), F(() => () => {
    g.stop();
  }, [g]), {
    id: m,
    canvasId: f,
    code: b,
    setCode: A,
    error: v || M,
    schedulerError: v,
    scheduler: g,
    evalError: M,
    evaluate: R,
    activateCode: P,
    activeCode: C,
    isDirty: h,
    pattern: z,
    started: x,
    start: J,
    stop: O,
    pause: Q,
    togglePlay: async () => {
      x ? g.pause() : await P();
    }
  };
}
function be() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
function I({ type: e }) {
  return /* @__PURE__ */ i.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "sc-h-5 sc-w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, {
    refresh: /* @__PURE__ */ i.createElement("path", {
      fillRule: "evenodd",
      d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z",
      clipRule: "evenodd"
    }),
    play: /* @__PURE__ */ i.createElement("path", {
      fillRule: "evenodd",
      d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z",
      clipRule: "evenodd"
    }),
    pause: /* @__PURE__ */ i.createElement("path", {
      fillRule: "evenodd",
      d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z",
      clipRule: "evenodd"
    })
  }[e]);
}
const we = "_container_3i85k_1", ye = "_header_3i85k_5", Ee = "_buttons_3i85k_9", ke = "_button_3i85k_9", _e = "_buttonDisabled_3i85k_17", Fe = "_error_3i85k_21", Ce = "_body_3i85k_25", w = {
  container: we,
  header: ye,
  buttons: Ee,
  button: ke,
  buttonDisabled: _e,
  error: Fe,
  body: Ce
}, Ne = () => ne().currentTime;
function Be({ tune: e, hideOutsideView: r = !1, enableKeyboard: t, withCanvas: a = !1, canvasHeight: n = 200 }) {
  const {
    code: c,
    setCode: l,
    evaluate: d,
    activateCode: o,
    error: u,
    isDirty: f,
    activeCode: m,
    pattern: v,
    started: k,
    scheduler: M,
    togglePlay: T,
    stop: b,
    canvasId: A
  } = ve({
    initialCode: e,
    defaultOutput: oe,
    getTime: Ne
  });
  pe({
    pattern: v,
    started: a && k,
    getTime: () => M.now(),
    onDraw: (h, g) => {
      const R = document.querySelector("#" + A).getContext("2d");
      re({ ctx: R, time: h, haps: g, autorange: 1, fold: 1, playhead: 1 });
    }
  });
  const [C, S] = _(), [z, D] = ae({
    threshold: 0.01
  }), x = E(), L = V(() => ((D || !r) && (x.current = !0), D || x.current), [D, r]);
  return me({
    view: C,
    pattern: v,
    active: k && !m?.includes("strudel disable-highlighting"),
    getTime: () => M.getPhase()
  }), U(() => {
    if (t) {
      const h = async (g) => {
        (g.ctrlKey || g.altKey) && (g.code === "Enter" ? (g.preventDefault(), le(C), await o()) : g.code === "Period" && (b(), g.preventDefault()));
      };
      return window.addEventListener("keydown", h, !0), () => window.removeEventListener("keydown", h, !0);
    }
  }, [t, v, c, d, b, C]), /* @__PURE__ */ i.createElement("div", {
    className: w.container,
    ref: z
  }, /* @__PURE__ */ i.createElement("div", {
    className: w.header
  }, /* @__PURE__ */ i.createElement("div", {
    className: w.buttons
  }, /* @__PURE__ */ i.createElement("button", {
    className: j(w.button, k ? "sc-animate-pulse" : ""),
    onClick: () => T()
  }, /* @__PURE__ */ i.createElement(I, {
    type: k ? "pause" : "play"
  })), /* @__PURE__ */ i.createElement("button", {
    className: j(f ? w.button : w.buttonDisabled),
    onClick: () => o()
  }, /* @__PURE__ */ i.createElement(I, {
    type: "refresh"
  }))), u && /* @__PURE__ */ i.createElement("div", {
    className: w.error
  }, u.message)), /* @__PURE__ */ i.createElement("div", {
    className: w.body
  }, L && /* @__PURE__ */ i.createElement(fe, {
    value: c,
    onChange: l,
    onViewChanged: S
  })), a && /* @__PURE__ */ i.createElement("canvas", {
    id: A,
    className: "w-full pointer-events-none",
    height: n,
    ref: (h) => {
      h && h.width !== h.clientWidth && (h.width = h.clientWidth);
    }
  }));
}
const Oe = (e) => U(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  fe as CodeMirror,
  Be as MiniRepl,
  j as cx,
  le as flash,
  me as useHighlighting,
  Oe as useKeydown,
  he as usePostMessage,
  ve as useStrudel
};
