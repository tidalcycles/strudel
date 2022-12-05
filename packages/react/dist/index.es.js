import n, { useCallback as _, useRef as H, useEffect as L, useMemo as V, useState as w, useLayoutEffect as j } from "react";
import X from "@uiw/react-codemirror";
import { Decoration as E, EditorView as U } from "@codemirror/view";
import { StateEffect as $, StateField as G } from "@codemirror/state";
import { javascript as Y } from "@codemirror/lang-javascript";
import { tags as r } from "@lezer/highlight";
import { createTheme as Z } from "@uiw/codemirror-themes";
import { useInView as ee } from "react-hook-inview";
import { webaudioOutput as te, getAudioContext as re } from "@strudel.cycles/webaudio";
import oe from "@strudel.cycles/core";
import { transpiler as ne } from "@strudel.cycles/transpiler";
const ae = Z({
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
    { tag: r.keyword, color: "#c792ea" },
    { tag: r.operator, color: "#89ddff" },
    { tag: r.special(r.variableName), color: "#eeffff" },
    { tag: r.typeName, color: "#c3e88d" },
    { tag: r.atom, color: "#f78c6c" },
    { tag: r.number, color: "#c3e88d" },
    { tag: r.definition(r.variableName), color: "#82aaff" },
    { tag: r.string, color: "#c3e88d" },
    { tag: r.special(r.string), color: "#c3e88d" },
    { tag: r.comment, color: "#7d8799" },
    { tag: r.variableName, color: "#c792ea" },
    { tag: r.tagName, color: "#c3e88d" },
    { tag: r.bracket, color: "#525154" },
    { tag: r.meta, color: "#ffcb6b" },
    { tag: r.attributeName, color: "#c792ea" },
    { tag: r.propertyName, color: "#c792ea" },
    { tag: r.className, color: "#decb6b" },
    { tag: r.invalid, color: "#ffffff" }
  ]
});
const B = $.define(), se = G.define({
  create() {
    return E.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(B))
          if (o.value) {
            const a = E.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = E.set([a.range(0, t.newDoc.length)]);
          } else
            e = E.set([]);
      return e;
    } catch (o) {
      return console.warn("flash error", o), e;
    }
  },
  provide: (e) => U.decorations.from(e)
}), ce = (e) => {
  e.dispatch({ effects: B.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: B.of(!1) });
  }, 200);
}, z = $.define(), ie = G.define({
  create() {
    return E.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(z)) {
          const a = o.value.map(
            (s) => (s.context.locations || []).map(({ start: u, end: d }) => {
              const f = s.context.color || "#FFCA28";
              let c = t.newDoc.line(u.line).from + u.column, i = t.newDoc.line(d.line).from + d.column;
              const m = t.newDoc.length;
              return c > m || i > m ? void 0 : E.mark({ attributes: { style: `outline: 1.5px solid ${f};` } }).range(c, i);
            })
          ).flat().filter(Boolean) || [];
          e = E.set(a, !0);
        }
      return e;
    } catch {
      return E.set([]);
    }
  },
  provide: (e) => U.decorations.from(e)
}), le = [Y(), ae, ie, se];
function de({ value: e, onChange: t, onViewChanged: o, onSelectionChange: a, options: s, editorDidMount: u }) {
  const d = _(
    (i) => {
      t?.(i);
    },
    [t]
  ), f = _(
    (i) => {
      o?.(i);
    },
    [o]
  ), c = _(
    (i) => {
      i.selectionSet && a && a?.(i.state.selection);
    },
    [a]
  );
  return /* @__PURE__ */ n.createElement(n.Fragment, null, /* @__PURE__ */ n.createElement(X, {
    value: e,
    onChange: d,
    onCreateEditor: f,
    onUpdate: c,
    extensions: le
  }));
}
function K(...e) {
  return e.filter(Boolean).join(" ");
}
function ue({ view: e, pattern: t, active: o, getTime: a }) {
  const s = H([]), u = H();
  L(() => {
    if (e)
      if (t && o) {
        let d = requestAnimationFrame(function f() {
          try {
            const c = a(), m = [Math.max(u.current || c, c - 1 / 10, 0), c + 1 / 60];
            u.current = m[1], s.current = s.current.filter((g) => g.whole.end > c);
            const h = t.queryArc(...m).filter((g) => g.hasOnset());
            s.current = s.current.concat(h), e.dispatch({ effects: z.of(s.current) });
          } catch {
            e.dispatch({ effects: z.of([]) });
          }
          d = requestAnimationFrame(f);
        });
        return () => {
          cancelAnimationFrame(d);
        };
      } else
        s.current = [], e.dispatch({ effects: z.of([]) });
  }, [t, o, e]);
}
const fe = "_container_3i85k_1", me = "_header_3i85k_5", ge = "_buttons_3i85k_9", pe = "_button_3i85k_9", he = "_buttonDisabled_3i85k_17", be = "_error_3i85k_21", ve = "_body_3i85k_25", v = {
  container: fe,
  header: me,
  buttons: ge,
  button: pe,
  buttonDisabled: he,
  error: be,
  body: ve
};
function O({ type: e }) {
  return /* @__PURE__ */ n.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "sc-h-5 sc-w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, {
    refresh: /* @__PURE__ */ n.createElement("path", {
      fillRule: "evenodd",
      d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z",
      clipRule: "evenodd"
    }),
    play: /* @__PURE__ */ n.createElement("path", {
      fillRule: "evenodd",
      d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z",
      clipRule: "evenodd"
    }),
    pause: /* @__PURE__ */ n.createElement("path", {
      fillRule: "evenodd",
      d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z",
      clipRule: "evenodd"
    })
  }[e]);
}
function Ee(e) {
  return L(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), _((t) => window.postMessage(t, "*"), []);
}
const we = oe.repl;
function ye({
  defaultOutput: e,
  interval: t,
  getTime: o,
  evalOnMount: a = !1,
  initialCode: s = "",
  autolink: u = !1,
  beforeEval: d,
  afterEval: f,
  onEvalError: c,
  onToggle: i
}) {
  const m = V(() => ke(), []), [h, g] = w(), [C, N] = w(), [p, y] = w(s), [M, S] = w(), [k, D] = w(), [F, x] = w(!1), b = p !== M, { scheduler: A, evaluate: T, start: J, stop: q, pause: Q } = V(
    () => we({
      interval: t,
      defaultOutput: e,
      onSchedulerError: g,
      onEvalError: (l) => {
        N(l), c?.(l);
      },
      getTime: o,
      transpiler: ne,
      beforeEval: ({ code: l }) => {
        y(l), d?.();
      },
      afterEval: ({ pattern: l, code: P }) => {
        S(P), D(l), N(), g(), u && (window.location.hash = "#" + encodeURIComponent(btoa(P))), f?.();
      },
      onToggle: (l) => {
        x(l), i?.(l);
      }
    }),
    [e, t, o]
  ), W = Ee(({ data: { from: l, type: P } }) => {
    P === "start" && l !== m && q();
  }), R = _(
    async (l = !0) => {
      await T(p, l), W({ type: "start", from: m });
    },
    [T, p]
  ), I = H();
  return L(() => {
    !I.current && a && p && (I.current = !0, R());
  }, [R, a, p]), L(() => () => {
    A.stop();
  }, [A]), {
    code: p,
    setCode: y,
    error: h || C,
    schedulerError: h,
    scheduler: A,
    evalError: C,
    evaluate: T,
    activateCode: R,
    activeCode: M,
    isDirty: b,
    pattern: k,
    started: F,
    start: J,
    stop: q,
    pause: Q,
    togglePlay: async () => {
      F ? A.pause() : await R();
    }
  };
}
function ke() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
const _e = () => re().currentTime;
function Te({ tune: e, hideOutsideView: t = !1, init: o, enableKeyboard: a }) {
  const {
    code: s,
    setCode: u,
    evaluate: d,
    activateCode: f,
    error: c,
    isDirty: i,
    activeCode: m,
    pattern: h,
    started: g,
    scheduler: C,
    togglePlay: N,
    stop: p
  } = ye({
    initialCode: e,
    defaultOutput: te,
    getTime: _e
  }), [y, M] = w(), [S, k] = ee({
    threshold: 0.01
  }), D = H(), F = V(() => ((k || !t) && (D.current = !0), k || D.current), [k, t]);
  return ue({
    view: y,
    pattern: h,
    active: g && !m?.includes("strudel disable-highlighting"),
    getTime: () => C.getPhase()
  }), j(() => {
    if (a) {
      const x = async (b) => {
        (b.ctrlKey || b.altKey) && (b.code === "Enter" ? (b.preventDefault(), ce(y), await f()) : b.code === "Period" && (p(), b.preventDefault()));
      };
      return window.addEventListener("keydown", x, !0), () => window.removeEventListener("keydown", x, !0);
    }
  }, [a, h, s, d, p, y]), /* @__PURE__ */ n.createElement("div", {
    className: v.container,
    ref: S
  }, /* @__PURE__ */ n.createElement("div", {
    className: v.header
  }, /* @__PURE__ */ n.createElement("div", {
    className: v.buttons
  }, /* @__PURE__ */ n.createElement("button", {
    className: K(v.button, g ? "sc-animate-pulse" : ""),
    onClick: () => N()
  }, /* @__PURE__ */ n.createElement(O, {
    type: g ? "pause" : "play"
  })), /* @__PURE__ */ n.createElement("button", {
    className: K(i ? v.button : v.buttonDisabled),
    onClick: () => f()
  }, /* @__PURE__ */ n.createElement(O, {
    type: "refresh"
  }))), c && /* @__PURE__ */ n.createElement("div", {
    className: v.error
  }, c.message)), /* @__PURE__ */ n.createElement("div", {
    className: v.body
  }, F && /* @__PURE__ */ n.createElement(de, {
    value: s,
    onChange: u,
    onViewChanged: M
  })));
}
const Ve = (e) => j(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  de as CodeMirror,
  Te as MiniRepl,
  K as cx,
  ce as flash,
  ue as useHighlighting,
  Ve as useKeydown,
  Ee as usePostMessage,
  ye as useStrudel
};
