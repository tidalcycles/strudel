import d, { useCallback as w, useRef as N, useEffect as k, useMemo as G, useState as M, useLayoutEffect as T } from "react";
import le from "@uiw/react-codemirror";
import { Decoration as A, EditorView as ee } from "@codemirror/view";
import { StateEffect as te, StateField as re } from "@codemirror/state";
import { javascript as ue } from "@codemirror/lang-javascript";
import { tags as u } from "@lezer/highlight";
import { createTheme as de } from "@uiw/codemirror-themes";
import { webaudioOutput as fe, getAudioContext as me } from "@strudel.cycles/webaudio";
import { useInView as he } from "react-hook-inview";
import { repl as ge, logger as pe } from "@strudel.cycles/core";
import { transpiler as ve } from "@strudel.cycles/transpiler";
const be = de({
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
    { tag: u.keyword, color: "#c792ea" },
    { tag: u.operator, color: "#89ddff" },
    { tag: u.special(u.variableName), color: "#eeffff" },
    { tag: u.typeName, color: "#c3e88d" },
    { tag: u.atom, color: "#f78c6c" },
    { tag: u.number, color: "#c3e88d" },
    { tag: u.definition(u.variableName), color: "#82aaff" },
    { tag: u.string, color: "#c3e88d" },
    { tag: u.special(u.string), color: "#c3e88d" },
    { tag: u.comment, color: "#7d8799" },
    { tag: u.variableName, color: "#c792ea" },
    { tag: u.tagName, color: "#c3e88d" },
    { tag: u.bracket, color: "#525154" },
    { tag: u.meta, color: "#ffcb6b" },
    { tag: u.attributeName, color: "#c792ea" },
    { tag: u.propertyName, color: "#c792ea" },
    { tag: u.className, color: "#decb6b" },
    { tag: u.invalid, color: "#ffffff" }
  ]
});
const J = te.define(), Ee = re.define({
  create() {
    return A.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(J))
          if (t.value) {
            const n = A.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = A.set([n.range(0, r.newDoc.length)]);
          } else
            e = A.set([]);
      return e;
    } catch (t) {
      return console.warn("flash error", t), e;
    }
  },
  provide: (e) => ee.decorations.from(e)
}), ye = (e) => {
  e.dispatch({ effects: J.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: J.of(!1) });
  }, 200);
}, B = te.define(), we = re.define({
  create() {
    return A.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(B)) {
          const n = t.value.map(
            (c) => (c.context.locations || []).map(({ start: m, end: s }) => {
              const a = c.context.color || "#FFCA28";
              let i = r.newDoc.line(m.line).from + m.column, g = r.newDoc.line(s.line).from + s.column;
              const b = r.newDoc.length;
              return i > b || g > b ? void 0 : A.mark({ attributes: { style: `outline: 1.5px solid ${a};` } }).range(i, g);
            })
          ).flat().filter(Boolean) || [];
          e = A.set(n, !0);
        }
      return e;
    } catch {
      return A.set([]);
    }
  },
  provide: (e) => ee.decorations.from(e)
}), ke = [ue(), be, we, Ee];
function Fe({ value: e, onChange: r, onViewChanged: t, onSelectionChange: n, options: c, editorDidMount: m }) {
  const s = w(
    (g) => {
      r?.(g);
    },
    [r]
  ), a = w(
    (g) => {
      t?.(g);
    },
    [t]
  ), i = w(
    (g) => {
      g.selectionSet && n && n?.(g.state.selection);
    },
    [n]
  );
  return /* @__PURE__ */ d.createElement(d.Fragment, null, /* @__PURE__ */ d.createElement(le, {
    value: e,
    onChange: s,
    onCreateEditor: a,
    onUpdate: i,
    extensions: ke
  }));
}
function Y(...e) {
  return e.filter(Boolean).join(" ");
}
function _e({ view: e, pattern: r, active: t, getTime: n }) {
  const c = N([]), m = N(0);
  k(() => {
    if (e)
      if (r && t) {
        m.current = 0;
        let s = requestAnimationFrame(function a() {
          try {
            const i = n(), b = [Math.max(m.current ?? i, i - 1 / 10, -0.01), i + 1 / 60];
            m.current = b[1], c.current = c.current.filter((h) => h.whole.end > i);
            const l = r.queryArc(...b).filter((h) => h.hasOnset());
            c.current = c.current.concat(l), e.dispatch({ effects: B.of(c.current) });
          } catch {
            e.dispatch({ effects: B.of([]) });
          }
          s = requestAnimationFrame(a);
        });
        return () => {
          cancelAnimationFrame(s);
        };
      } else
        c.current = [], e.dispatch({ effects: B.of([]) });
  }, [r, t, e]);
}
function Me(e, r = !1) {
  const t = N(), n = N(), c = (a) => {
    if (n.current !== void 0) {
      const i = a - n.current;
      e(a, i);
    }
    n.current = a, t.current = requestAnimationFrame(c);
  }, m = () => {
    t.current = requestAnimationFrame(c);
  }, s = () => {
    t.current && cancelAnimationFrame(t.current), delete t.current;
  };
  return k(() => {
    t.current && (s(), m());
  }, [e]), k(() => (r && m(), s), []), {
    start: m,
    stop: s
  };
}
function Ae({ pattern: e, started: r, getTime: t, onDraw: n, drawTime: c = [-2, 2] }) {
  let [m, s] = c;
  m = Math.abs(m);
  let a = N([]), i = N(null);
  k(() => {
    if (e) {
      const l = t(), h = e.queryArc(Math.max(l, 0), l + s + 0.1);
      a.current = a.current.filter((v) => v.whole.begin < l), a.current = a.current.concat(h);
    }
  }, [e]);
  const { start: g, stop: b } = Me(
    w(() => {
      const l = t() + s;
      if (i.current === null) {
        i.current = l;
        return;
      }
      const h = e.queryArc(Math.max(i.current, l - 1 / 10), l);
      i.current = l, a.current = (a.current || []).filter((v) => v.whole.end >= l - m - s).concat(h.filter((v) => v.hasOnset())), n(e, l - s, a.current, c);
    }, [e])
  );
  return k(() => {
    r ? g() : (a.current = [], b());
  }, [r]), {
    clear: () => {
      a.current = [];
    }
  };
}
function Ne(e) {
  return k(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), w((r) => window.postMessage(r, "*"), []);
}
function De({
  defaultOutput: e,
  interval: r,
  getTime: t,
  evalOnMount: n = !1,
  initialCode: c = "",
  autolink: m = !1,
  beforeEval: s,
  editPattern: a,
  afterEval: i,
  onEvalError: g,
  onToggle: b,
  canvasId: l,
  drawContext: h,
  drawTime: v = [-2, 2]
}) {
  const F = G(() => Ce(), []);
  l = l || `canvas-${F}`;
  const [q, z] = M(), [R, H] = M(), [E, C] = M(c), [P, I] = M(), [D, S] = M(), [x, V] = M(!1), K = E !== P, { scheduler: o, evaluate: p, start: Q, stop: O, pause: ne } = G(
    () => ge({
      interval: r,
      defaultOutput: e,
      onSchedulerError: z,
      onEvalError: (f) => {
        H(f), g?.(f);
      },
      getTime: t,
      drawContext: h,
      transpiler: ve,
      editPattern: a,
      beforeEval: ({ code: f }) => {
        C(f), s?.();
      },
      afterEval: ({ pattern: f, code: y }) => {
        I(y), S(f), H(), z(), m && (window.location.hash = "#" + encodeURIComponent(btoa(y))), i?.();
      },
      onToggle: (f) => {
        V(f), b?.(f);
      }
    }),
    [e, r, t]
  ), oe = Ne(({ data: { from: f, type: y } }) => {
    y === "start" && f !== F && O();
  }), j = w(
    async (f = !0) => {
      const y = await p(E, f);
      return oe({ type: "start", from: F }), y;
    },
    [p, E]
  ), L = w(
    (f, y, W, $) => {
      const { onPaint: se } = f.context || {}, ie = typeof h == "function" ? h(l) : h;
      se?.(ie, y, W, $);
    },
    [h, l]
  ), U = w(
    (f) => {
      if (h && L) {
        const [y, W] = v, $ = f.queryArc(0, W);
        L(f, -1e-3, $, v);
      }
    },
    [v, L]
  ), X = N();
  k(() => {
    !X.current && h && L && n && E && (X.current = !0, p(E, !1).then((f) => U(f)));
  }, [j, n, E, U]), k(() => () => {
    o.stop();
  }, [o]);
  const ae = async () => {
    x ? (o.stop(), U(D)) : await j();
  }, ce = q || R;
  return Ae({
    pattern: D,
    started: h && x,
    getTime: () => o.now(),
    drawTime: v,
    onDraw: L
  }), {
    id: F,
    canvasId: l,
    code: E,
    setCode: C,
    error: ce,
    schedulerError: q,
    scheduler: o,
    evalError: R,
    evaluate: p,
    activateCode: j,
    activeCode: P,
    isDirty: K,
    pattern: D,
    started: x,
    start: Q,
    stop: O,
    pause: ne,
    togglePlay: ae
  };
}
function Ce() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
function Z({ type: e }) {
  return /* @__PURE__ */ d.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "sc-h-5 sc-w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, {
    refresh: /* @__PURE__ */ d.createElement("path", {
      fillRule: "evenodd",
      d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z",
      clipRule: "evenodd"
    }),
    play: /* @__PURE__ */ d.createElement("path", {
      fillRule: "evenodd",
      d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z",
      clipRule: "evenodd"
    }),
    pause: /* @__PURE__ */ d.createElement("path", {
      fillRule: "evenodd",
      d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z",
      clipRule: "evenodd"
    }),
    stop: /* @__PURE__ */ d.createElement("path", {
      fillRule: "evenodd",
      d: "M2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.25A.75.75 0 017.75 7h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z",
      clipRule: "evenodd"
    })
  }[e]);
}
const Re = "_container_3i85k_1", xe = "_header_3i85k_5", Le = "_buttons_3i85k_9", qe = "_button_3i85k_9", ze = "_buttonDisabled_3i85k_17", He = "_error_3i85k_21", Pe = "_body_3i85k_25", _ = {
  container: Re,
  header: xe,
  buttons: Le,
  button: qe,
  buttonDisabled: ze,
  error: He,
  body: Pe
}, Se = () => me().currentTime;
function Ye({ tune: e, hideOutsideView: r = !1, enableKeyboard: t, drawTime: n, punchcard: c, canvasHeight: m = 200 }) {
  n = n || (c ? [0, 4] : void 0);
  const {
    code: s,
    setCode: a,
    evaluate: i,
    activateCode: g,
    error: b,
    isDirty: l,
    activeCode: h,
    pattern: v,
    started: F,
    scheduler: q,
    togglePlay: z,
    stop: R,
    canvasId: H,
    id: E
  } = De({
    initialCode: e,
    defaultOutput: fe,
    editPattern: (o) => c ? o.punchcard() : o,
    getTime: Se,
    evalOnMount: !!n,
    drawContext: n ? (o) => document.querySelector("#" + o)?.getContext("2d") : null,
    drawTime: n
  }), [C, P] = M(), [I, D] = he({
    threshold: 0.01
  }), S = N(), x = G(() => ((D || !r) && (S.current = !0), D || S.current), [D, r]);
  _e({
    view: C,
    pattern: v,
    active: F && !h?.includes("strudel disable-highlighting"),
    getTime: () => q.now()
  }), T(() => {
    if (t) {
      const o = async (p) => {
        (p.ctrlKey || p.altKey) && (p.code === "Enter" ? (p.preventDefault(), ye(C), await g()) : p.code === "Period" && (R(), p.preventDefault()));
      };
      return window.addEventListener("keydown", o, !0), () => window.removeEventListener("keydown", o, !0);
    }
  }, [t, v, s, i, R, C]);
  const [V, K] = M([]);
  return Ve(
    w((o) => {
      const { data: p } = o.detail;
      p?.hap?.context?.id === E && K((O) => O.concat([o.detail]).slice(-10));
    }, [])
  ), /* @__PURE__ */ d.createElement("div", {
    className: _.container,
    ref: I
  }, /* @__PURE__ */ d.createElement("div", {
    className: _.header
  }, /* @__PURE__ */ d.createElement("div", {
    className: _.buttons
  }, /* @__PURE__ */ d.createElement("button", {
    className: Y(_.button, F ? "sc-animate-pulse" : ""),
    onClick: () => z()
  }, /* @__PURE__ */ d.createElement(Z, {
    type: F ? "stop" : "play"
  })), /* @__PURE__ */ d.createElement("button", {
    className: Y(l ? _.button : _.buttonDisabled),
    onClick: () => g()
  }, /* @__PURE__ */ d.createElement(Z, {
    type: "refresh"
  }))), b && /* @__PURE__ */ d.createElement("div", {
    className: _.error
  }, b.message)), /* @__PURE__ */ d.createElement("div", {
    className: _.body
  }, x && /* @__PURE__ */ d.createElement(Fe, {
    value: s,
    onChange: a,
    onViewChanged: P
  })), n && /* @__PURE__ */ d.createElement("canvas", {
    id: H,
    className: "w-full pointer-events-none",
    height: m,
    ref: (o) => {
      o && o.width !== o.clientWidth && (o.width = o.clientWidth);
    }
  }), !!V.length && /* @__PURE__ */ d.createElement("div", {
    className: "sc-bg-gray-800 sc-rounded-md sc-p-2"
  }, V.map(({ message: o }, p) => /* @__PURE__ */ d.createElement("div", {
    key: p
  }, o))));
}
function Ve(e) {
  Oe(pe.key, e);
}
function Oe(e, r, t = !1) {
  k(() => (document.addEventListener(e, r, t), () => {
    document.removeEventListener(e, r, t);
  }), [r]);
}
const Ze = (e) => T(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  Fe as CodeMirror,
  Ye as MiniRepl,
  Y as cx,
  ye as flash,
  _e as useHighlighting,
  Ze as useKeydown,
  Ne as usePostMessage,
  De as useStrudel
};
