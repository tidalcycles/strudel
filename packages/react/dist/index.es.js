import n, { useCallback as N, useRef as x, useEffect as R, useState as y, useMemo as q, useLayoutEffect as I } from "react";
import J from "@uiw/react-codemirror";
import { Decoration as E, EditorView as K } from "@codemirror/view";
import { StateEffect as O, StateField as j } from "@codemirror/state";
import { javascript as Q } from "@codemirror/lang-javascript";
import { tags as r } from "@lezer/highlight";
import { createTheme as W } from "@uiw/codemirror-themes";
import { useInView as X } from "react-hook-inview";
import { webaudioOutput as Y, getAudioContext as Z } from "@strudel.cycles/webaudio";
import { repl as ee } from "@strudel.cycles/core";
import { transpiler as te } from "@strudel.cycles/transpiler";
const re = W({
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
const L = O.define(), oe = j.define({
  create() {
    return E.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(L))
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
  provide: (e) => K.decorations.from(e)
}), ne = (e) => {
  e.dispatch({ effects: L.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: L.of(!1) });
  }, 200);
}, A = O.define(), ae = j.define({
  create() {
    return E.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(A)) {
          const a = o.value.map(
            (s) => (s.context.locations || []).map(({ start: u, end: l }) => {
              const d = s.context.color || "#FFCA28";
              let c = t.newDoc.line(u.line).from + u.column, i = t.newDoc.line(l.line).from + l.column;
              const f = t.newDoc.length;
              return c > f || i > f ? void 0 : E.mark({ attributes: { style: `outline: 1.5px solid ${d};` } }).range(c, i);
            })
          ).flat().filter(Boolean) || [];
          e = E.set(a, !0);
        }
      return e;
    } catch {
      return E.set([]);
    }
  },
  provide: (e) => K.decorations.from(e)
}), se = [Q(), re, ae, oe];
function ce({ value: e, onChange: t, onViewChanged: o, onSelectionChange: a, options: s, editorDidMount: u }) {
  const l = N(
    (i) => {
      t?.(i);
    },
    [t]
  ), d = N(
    (i) => {
      o?.(i);
    },
    [o]
  ), c = N(
    (i) => {
      i.selectionSet && a && a?.(i.state.selection);
    },
    [a]
  );
  return /* @__PURE__ */ n.createElement(n.Fragment, null, /* @__PURE__ */ n.createElement(J, {
    value: e,
    onChange: l,
    onCreateEditor: d,
    onUpdate: c,
    extensions: se
  }));
}
function S(...e) {
  return e.filter(Boolean).join(" ");
}
function ie({ view: e, pattern: t, active: o, getTime: a }) {
  const s = x([]), u = x();
  R(() => {
    if (e)
      if (t && o) {
        let d = function() {
          try {
            const c = a(), f = [Math.max(u.current || c, c - 1 / 10, 0), c + 1 / 60];
            u.current = f[1], s.current = s.current.filter((m) => m.whole.end > c);
            const v = t.queryArc(...f).filter((m) => m.hasOnset());
            s.current = s.current.concat(v), e.dispatch({ effects: A.of(s.current) });
          } catch {
            e.dispatch({ effects: A.of([]) });
          }
          l = requestAnimationFrame(d);
        }, l = requestAnimationFrame(d);
        return () => {
          cancelAnimationFrame(l);
        };
      } else
        s.current = [], e.dispatch({ effects: A.of([]) });
  }, [t, o, e]);
}
const le = "_container_3i85k_1", de = "_header_3i85k_5", ue = "_buttons_3i85k_9", fe = "_button_3i85k_9", me = "_buttonDisabled_3i85k_17", ge = "_error_3i85k_21", pe = "_body_3i85k_25", b = {
  container: le,
  header: de,
  buttons: ue,
  button: fe,
  buttonDisabled: me,
  error: ge,
  body: pe
};
function B({ type: e }) {
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
function he({
  defaultOutput: e,
  interval: t,
  getTime: o,
  evalOnMount: a = !1,
  initialCode: s = "",
  autolink: u = !1,
  beforeEval: l,
  afterEval: d,
  onEvalError: c
}) {
  const [i, f] = y(), [v, m] = y(), [h, D] = y(s), [_, C] = y(h), [P, z] = y(), [k, F] = y(!1), H = h !== _, { scheduler: w, evaluate: g, start: U, stop: $, pause: G } = q(
    () => ee({
      interval: t,
      defaultOutput: e,
      onSchedulerError: f,
      onEvalError: (p) => {
        m(p), c?.(p);
      },
      getTime: o,
      transpiler: te,
      beforeEval: ({ code: p }) => {
        D(p), l?.();
      },
      afterEval: ({ pattern: p, code: V }) => {
        C(V), z(p), m(), f(), u && (window.location.hash = "#" + encodeURIComponent(btoa(V))), d?.();
      },
      onToggle: (p) => F(p)
    }),
    [e, t, o]
  ), M = N(async (p = !0) => g(h, p), [g, h]), T = x();
  return R(() => {
    !T.current && a && h && (T.current = !0, M());
  }, [M, a, h]), R(() => () => {
    w.stop();
  }, [w]), {
    code: h,
    setCode: D,
    error: i || v,
    schedulerError: i,
    scheduler: w,
    evalError: v,
    evaluate: g,
    activateCode: M,
    activeCode: _,
    isDirty: H,
    pattern: P,
    started: k,
    start: U,
    stop: $,
    pause: G,
    togglePlay: async () => {
      k ? w.pause() : await M();
    }
  };
}
const ve = () => Z().currentTime;
function Re({ tune: e, hideOutsideView: t = !1, init: o, enableKeyboard: a }) {
  const {
    code: s,
    setCode: u,
    evaluate: l,
    activateCode: d,
    error: c,
    isDirty: i,
    activeCode: f,
    pattern: v,
    started: m,
    scheduler: h,
    togglePlay: D,
    stop: _
  } = he({
    initialCode: e,
    defaultOutput: Y,
    getTime: ve
  }), [C, P] = y(), [z, k] = X({
    threshold: 0.01
  }), F = x(), H = q(() => ((k || !t) && (F.current = !0), k || F.current), [k, t]);
  return ie({
    view: C,
    pattern: v,
    active: m && !f?.includes("strudel disable-highlighting"),
    getTime: () => h.getPhase()
  }), I(() => {
    if (a) {
      const w = async (g) => {
        (g.ctrlKey || g.altKey) && (g.code === "Enter" ? (g.preventDefault(), ne(C), await d()) : g.code === "Period" && (_(), g.preventDefault()));
      };
      return window.addEventListener("keydown", w, !0), () => window.removeEventListener("keydown", w, !0);
    }
  }, [a, v, s, l, _, C]), /* @__PURE__ */ n.createElement("div", {
    className: b.container,
    ref: z
  }, /* @__PURE__ */ n.createElement("div", {
    className: b.header
  }, /* @__PURE__ */ n.createElement("div", {
    className: b.buttons
  }, /* @__PURE__ */ n.createElement("button", {
    className: S(b.button, m ? "sc-animate-pulse" : ""),
    onClick: () => D()
  }, /* @__PURE__ */ n.createElement(B, {
    type: m ? "pause" : "play"
  })), /* @__PURE__ */ n.createElement("button", {
    className: S(i ? b.button : b.buttonDisabled),
    onClick: () => d()
  }, /* @__PURE__ */ n.createElement(B, {
    type: "refresh"
  }))), c && /* @__PURE__ */ n.createElement("div", {
    className: b.error
  }, c.message)), /* @__PURE__ */ n.createElement("div", {
    className: b.body
  }, H && /* @__PURE__ */ n.createElement(ce, {
    value: s,
    onChange: u,
    onViewChanged: P
  })));
}
function Pe(e) {
  return R(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), N((t) => window.postMessage(t, "*"), []);
}
const ze = (e) => I(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  ce as CodeMirror,
  Re as MiniRepl,
  S as cx,
  ne as flash,
  ie as useHighlighting,
  ze as useKeydown,
  Pe as usePostMessage,
  he as useStrudel
};
