import n, { useCallback as C, useRef as P, useEffect as z, useState as E, useMemo as q, useLayoutEffect as I } from "react";
import G from "@uiw/react-codemirror";
import { Decoration as b, EditorView as K } from "@codemirror/view";
import { StateEffect as O, StateField as j } from "@codemirror/state";
import { javascript as J } from "@codemirror/lang-javascript";
import { tags as r } from "@lezer/highlight";
import { createTheme as Q } from "@uiw/codemirror-themes";
import { useInView as W } from "react-hook-inview";
import { webaudioOutput as X, getAudioContext as Y } from "@strudel.cycles/webaudio";
import { repl as Z } from "@strudel.cycles/core";
import { transpiler as ee } from "@strudel.cycles/transpiler";
const te = Q({
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
const L = O.define(), re = j.define({
  create() {
    return b.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(L))
          if (o.value) {
            const s = b.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = b.set([s.range(0, t.newDoc.length)]);
          } else
            e = b.set([]);
      return e;
    } catch (o) {
      return console.warn("flash error", o), e;
    }
  },
  provide: (e) => K.decorations.from(e)
}), oe = (e) => {
  e.dispatch({ effects: L.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: L.of(!1) });
  }, 200);
}, R = O.define(), ne = j.define({
  create() {
    return b.none;
  },
  update(e, t) {
    try {
      for (let o of t.effects)
        if (o.is(R)) {
          const s = o.value.map(
            (c) => (c.context.locations || []).map(({ start: f, end: d }) => {
              const u = c.context.color || "#FFCA28";
              let a = t.newDoc.line(f.line).from + f.column, i = t.newDoc.line(d.line).from + d.column;
              const m = t.newDoc.length;
              return a > m || i > m ? void 0 : b.mark({ attributes: { style: `outline: 1.5px solid ${u};` } }).range(a, i);
            })
          ).flat().filter(Boolean) || [];
          e = b.set(s, !0);
        }
      return e;
    } catch {
      return b.set([]);
    }
  },
  provide: (e) => K.decorations.from(e)
}), ae = [J(), te, ne, re];
function se({ value: e, onChange: t, onViewChanged: o, onSelectionChange: s, options: c, editorDidMount: f }) {
  const d = C(
    (i) => {
      t?.(i);
    },
    [t]
  ), u = C(
    (i) => {
      o?.(i);
    },
    [o]
  ), a = C(
    (i) => {
      i.selectionSet && s && s?.(i.state.selection);
    },
    [s]
  );
  return /* @__PURE__ */ n.createElement(n.Fragment, null, /* @__PURE__ */ n.createElement(G, {
    value: e,
    onChange: d,
    onCreateEditor: u,
    onUpdate: a,
    extensions: ae
  }));
}
function S(...e) {
  return e.filter(Boolean).join(" ");
}
function ce({ view: e, pattern: t, active: o, getTime: s }) {
  const c = P([]), f = P();
  z(() => {
    if (e)
      if (t && o) {
        let u = function() {
          try {
            const a = s(), m = [Math.max(f.current || a, a - 1 / 10, 0), a + 1 / 60];
            f.current = m[1], c.current = c.current.filter((l) => l.whole.end > a);
            const p = t.queryArc(...m).filter((l) => l.hasOnset());
            c.current = c.current.concat(p), e.dispatch({ effects: R.of(c.current) });
          } catch {
            e.dispatch({ effects: R.of([]) });
          }
          d = requestAnimationFrame(u);
        }, d = requestAnimationFrame(u);
        return () => {
          cancelAnimationFrame(d);
        };
      } else
        c.current = [], e.dispatch({ effects: R.of([]) });
  }, [t, o, e]);
}
const ie = "_container_3i85k_1", le = "_header_3i85k_5", de = "_buttons_3i85k_9", ue = "_button_3i85k_9", fe = "_buttonDisabled_3i85k_17", me = "_error_3i85k_21", ge = "_body_3i85k_25", v = {
  container: ie,
  header: le,
  buttons: de,
  button: ue,
  buttonDisabled: fe,
  error: me,
  body: ge
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
function pe({
  defaultOutput: e,
  interval: t,
  getTime: o,
  evalOnMount: s = !1,
  initialCode: c = "",
  autolink: f = !1,
  afterEval: d,
  onEvalError: u
}) {
  const [a, i] = E(), [m, p] = E(), [l, N] = E(c), [D, F] = E(l), [k, H] = E(), [M, _] = E(!1), A = l !== D, { scheduler: w, evaluate: y, start: h, stop: U, pause: $ } = q(
    () => Z({
      interval: t,
      defaultOutput: e,
      onSchedulerError: i,
      onEvalError: (g) => {
        p(g), u?.(g);
      },
      getTime: o,
      transpiler: ee,
      beforeEval: ({ code: g }) => {
        N(g);
      },
      afterEval: ({ pattern: g, code: V }) => {
        F(V), H(g), p(), i(), f && (window.location.hash = "#" + encodeURIComponent(btoa(V))), d?.();
      },
      onToggle: (g) => _(g)
    }),
    [e, t, o]
  ), x = C(async (g = !0) => y(l, g), [y, l]), T = P();
  return z(() => {
    !T.current && s && l && (T.current = !0, x());
  }, [x, s, l]), z(() => () => {
    w.stop();
  }, [w]), {
    code: l,
    setCode: N,
    error: a || m,
    schedulerError: a,
    scheduler: w,
    evalError: m,
    evaluate: y,
    activateCode: x,
    activeCode: D,
    isDirty: A,
    pattern: k,
    started: M,
    start: h,
    stop: U,
    pause: $,
    togglePlay: async () => {
      M ? w.pause() : await x();
    }
  };
}
const he = () => Y().currentTime;
function xe({ tune: e, hideOutsideView: t = !1, init: o, enableKeyboard: s }) {
  const {
    code: c,
    setCode: f,
    evaluate: d,
    activateCode: u,
    error: a,
    isDirty: i,
    activeCode: m,
    pattern: p,
    started: l,
    scheduler: N,
    togglePlay: D,
    stop: F
  } = pe({
    initialCode: e,
    defaultOutput: X,
    getTime: he
  }), [k, H] = E(), [M, _] = W({
    threshold: 0.01
  }), A = P(), w = q(() => ((_ || !t) && (A.current = !0), _ || A.current), [_, t]);
  return ce({
    view: k,
    pattern: p,
    active: l && !m?.includes("strudel disable-highlighting"),
    getTime: () => N.getPhase()
  }), I(() => {
    if (s) {
      const y = async (h) => {
        (h.ctrlKey || h.altKey) && (h.code === "Enter" ? (h.preventDefault(), oe(k), await u()) : h.code === "Period" && (F(), h.preventDefault()));
      };
      return window.addEventListener("keydown", y, !0), () => window.removeEventListener("keydown", y, !0);
    }
  }, [s, p, c, d, F, k]), /* @__PURE__ */ n.createElement("div", {
    className: v.container,
    ref: M
  }, /* @__PURE__ */ n.createElement("div", {
    className: v.header
  }, /* @__PURE__ */ n.createElement("div", {
    className: v.buttons
  }, /* @__PURE__ */ n.createElement("button", {
    className: S(v.button, l ? "sc-animate-pulse" : ""),
    onClick: () => D()
  }, /* @__PURE__ */ n.createElement(B, {
    type: l ? "pause" : "play"
  })), /* @__PURE__ */ n.createElement("button", {
    className: S(i ? v.button : v.buttonDisabled),
    onClick: () => u()
  }, /* @__PURE__ */ n.createElement(B, {
    type: "refresh"
  }))), a && /* @__PURE__ */ n.createElement("div", {
    className: v.error
  }, a.message)), /* @__PURE__ */ n.createElement("div", {
    className: v.body
  }, w && /* @__PURE__ */ n.createElement(se, {
    value: c,
    onChange: f,
    onViewChanged: H
  })));
}
function Re(e) {
  return z(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), C((t) => window.postMessage(t, "*"), []);
}
const Pe = (e) => I(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  se as CodeMirror,
  xe as MiniRepl,
  S as cx,
  oe as flash,
  ce as useHighlighting,
  Pe as useKeydown,
  Re as usePostMessage,
  pe as useStrudel
};
