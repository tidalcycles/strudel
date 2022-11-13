import n, { useCallback as N, useRef as x, useEffect as R, useState as w, useMemo as I, useLayoutEffect as K } from "react";
import Q from "@uiw/react-codemirror";
import { Decoration as E, EditorView as O } from "@codemirror/view";
import { StateEffect as j, StateField as U } from "@codemirror/state";
import { javascript as W } from "@codemirror/lang-javascript";
import { tags as r } from "@lezer/highlight";
import { createTheme as X } from "@uiw/codemirror-themes";
import { useInView as Y } from "react-hook-inview";
import { webaudioOutput as Z, getAudioContext as ee } from "@strudel.cycles/webaudio";
import { repl as te } from "@strudel.cycles/core";
import { transpiler as re } from "@strudel.cycles/transpiler";
const oe = X({
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
const T = j.define(), ne = U.define({
  create() {
    return E.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(T))
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
  provide: (e) => O.decorations.from(e)
}), ae = (e) => {
  e.dispatch({ effects: T.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: T.of(!1) });
  }, 200);
}, A = j.define(), se = U.define({
  create() {
    return E.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(A)) {
          const a = o.value.map(
            (s) => (s.context.locations || []).map(({ start: m, end: l }) => {
              const d = s.context.color || "#FFCA28";
              let c = t.newDoc.line(m.line).from + m.column, i = t.newDoc.line(l.line).from + l.column;
              const g = t.newDoc.length;
              return c > g || i > g ? void 0 : E.mark({ attributes: { style: `outline: 1.5px solid ${d};` } }).range(c, i);
            })
          ).flat().filter(Boolean) || [];
          e = E.set(a, !0);
        }
      return e;
    } catch {
      return E.set([]);
    }
  },
  provide: (e) => O.decorations.from(e)
}), ce = [W(), oe, se, ne];
function ie({ value: e, onChange: t, onViewChanged: o, onSelectionChange: a, options: s, editorDidMount: m }) {
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
  return /* @__PURE__ */ n.createElement(n.Fragment, null, /* @__PURE__ */ n.createElement(Q, {
    value: e,
    onChange: l,
    onCreateEditor: d,
    onUpdate: c,
    extensions: ce
  }));
}
function B(...e) {
  return e.filter(Boolean).join(" ");
}
function le({ view: e, pattern: t, active: o, getTime: a }) {
  const s = x([]), m = x();
  R(() => {
    if (e)
      if (t && o) {
        let d = function() {
          try {
            const c = a(), g = [Math.max(m.current || c, c - 1 / 10, 0), c + 1 / 60];
            m.current = g[1], s.current = s.current.filter((p) => p.whole.end > c);
            const v = t.queryArc(...g).filter((p) => p.hasOnset());
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
const de = "_container_3i85k_1", ue = "_header_3i85k_5", fe = "_buttons_3i85k_9", me = "_button_3i85k_9", ge = "_buttonDisabled_3i85k_17", pe = "_error_3i85k_21", he = "_body_3i85k_25", b = {
  container: de,
  header: ue,
  buttons: fe,
  button: me,
  buttonDisabled: ge,
  error: pe,
  body: he
};
function q({ type: e }) {
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
function ve({
  defaultOutput: e,
  interval: t,
  getTime: o,
  evalOnMount: a = !1,
  initialCode: s = "",
  autolink: m = !1,
  beforeEval: l,
  afterEval: d,
  onEvalError: c,
  onToggle: i
}) {
  const [g, v] = w(), [p, D] = w(), [h, k] = w(s), [y, P] = w(h), [z, _] = w(), [C, H] = w(!1), F = h !== y, { scheduler: u, evaluate: L, start: $, stop: G, pause: J } = I(
    () => te({
      interval: t,
      defaultOutput: e,
      onSchedulerError: v,
      onEvalError: (f) => {
        D(f), c?.(f);
      },
      getTime: o,
      transpiler: re,
      beforeEval: ({ code: f }) => {
        k(f), l?.();
      },
      afterEval: ({ pattern: f, code: S }) => {
        P(S), _(f), D(), v(), m && (window.location.hash = "#" + encodeURIComponent(btoa(S))), d?.();
      },
      onToggle: (f) => {
        H(f), i?.(f);
      }
    }),
    [e, t, o]
  ), M = N(async (f = !0) => L(h, f), [L, h]), V = x();
  return R(() => {
    !V.current && a && h && (V.current = !0, M());
  }, [M, a, h]), R(() => () => {
    u.stop();
  }, [u]), {
    code: h,
    setCode: k,
    error: g || p,
    schedulerError: g,
    scheduler: u,
    evalError: p,
    evaluate: L,
    activateCode: M,
    activeCode: y,
    isDirty: F,
    pattern: z,
    started: C,
    start: $,
    stop: G,
    pause: J,
    togglePlay: async () => {
      C ? u.pause() : await M();
    }
  };
}
const be = () => ee().currentTime;
function Pe({ tune: e, hideOutsideView: t = !1, init: o, enableKeyboard: a }) {
  const {
    code: s,
    setCode: m,
    evaluate: l,
    activateCode: d,
    error: c,
    isDirty: i,
    activeCode: g,
    pattern: v,
    started: p,
    scheduler: D,
    togglePlay: h,
    stop: k
  } = ve({
    initialCode: e,
    defaultOutput: Z,
    getTime: be
  }), [y, P] = w(), [z, _] = Y({
    threshold: 0.01
  }), C = x(), H = I(() => ((_ || !t) && (C.current = !0), _ || C.current), [_, t]);
  return le({
    view: y,
    pattern: v,
    active: p && !g?.includes("strudel disable-highlighting"),
    getTime: () => D.getPhase()
  }), K(() => {
    if (a) {
      const F = async (u) => {
        (u.ctrlKey || u.altKey) && (u.code === "Enter" ? (u.preventDefault(), ae(y), await d()) : u.code === "Period" && (k(), u.preventDefault()));
      };
      return window.addEventListener("keydown", F, !0), () => window.removeEventListener("keydown", F, !0);
    }
  }, [a, v, s, l, k, y]), /* @__PURE__ */ n.createElement("div", {
    className: b.container,
    ref: z
  }, /* @__PURE__ */ n.createElement("div", {
    className: b.header
  }, /* @__PURE__ */ n.createElement("div", {
    className: b.buttons
  }, /* @__PURE__ */ n.createElement("button", {
    className: B(b.button, p ? "sc-animate-pulse" : ""),
    onClick: () => h()
  }, /* @__PURE__ */ n.createElement(q, {
    type: p ? "pause" : "play"
  })), /* @__PURE__ */ n.createElement("button", {
    className: B(i ? b.button : b.buttonDisabled),
    onClick: () => d()
  }, /* @__PURE__ */ n.createElement(q, {
    type: "refresh"
  }))), c && /* @__PURE__ */ n.createElement("div", {
    className: b.error
  }, c.message)), /* @__PURE__ */ n.createElement("div", {
    className: b.body
  }, H && /* @__PURE__ */ n.createElement(ie, {
    value: s,
    onChange: m,
    onViewChanged: P
  })));
}
function ze(e) {
  return R(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), N((t) => window.postMessage(t, "*"), []);
}
const He = (e) => K(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  ie as CodeMirror,
  Pe as MiniRepl,
  B as cx,
  ae as flash,
  le as useHighlighting,
  He as useKeydown,
  ze as usePostMessage,
  ve as useStrudel
};
