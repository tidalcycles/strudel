import l, { useCallback as y, useRef as N, useEffect as k, useMemo as J, useState as M, useLayoutEffect as te } from "react";
import le from "@uiw/react-codemirror";
import { Decoration as A, EditorView as re } from "@codemirror/view";
import { StateEffect as ne, StateField as oe } from "@codemirror/state";
import { javascript as ue } from "@codemirror/lang-javascript";
import { tags as i } from "@lezer/highlight";
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
    { tag: i.keyword, color: "#c792ea" },
    { tag: i.operator, color: "#89ddff" },
    { tag: i.special(i.variableName), color: "#eeffff" },
    { tag: i.typeName, color: "#c3e88d" },
    { tag: i.atom, color: "#f78c6c" },
    { tag: i.number, color: "#c3e88d" },
    { tag: i.definition(i.variableName), color: "#82aaff" },
    { tag: i.string, color: "#c3e88d" },
    { tag: i.special(i.string), color: "#c3e88d" },
    { tag: i.comment, color: "#7d8799" },
    { tag: i.variableName, color: "#c792ea" },
    { tag: i.tagName, color: "#c3e88d" },
    { tag: i.bracket, color: "#525154" },
    { tag: i.meta, color: "#ffcb6b" },
    { tag: i.attributeName, color: "#c792ea" },
    { tag: i.propertyName, color: "#c792ea" },
    { tag: i.className, color: "#decb6b" },
    { tag: i.invalid, color: "#ffffff" }
  ]
});
const Q = ne.define(), Ee = oe.define({
  create() {
    return A.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(Q))
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
  provide: (e) => re.decorations.from(e)
}), ye = (e) => {
  e.dispatch({ effects: Q.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: Q.of(!1) });
  }, 200);
}, I = ne.define(), we = oe.define({
  create() {
    return A.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(I)) {
          const n = t.value.map(
            (s) => (s.context.locations || []).map(({ start: m, end: u }) => {
              const o = s.context.color || "#FFCA28";
              let c = r.newDoc.line(m.line).from + m.column, g = r.newDoc.line(u.line).from + u.column;
              const b = r.newDoc.length;
              return c > b || g > b ? void 0 : A.mark({ attributes: { style: `outline: 1.5px solid ${o};` } }).range(c, g);
            })
          ).flat().filter(Boolean) || [];
          e = A.set(n, !0);
        }
      return e;
    } catch {
      return A.set([]);
    }
  },
  provide: (e) => re.decorations.from(e)
}), ke = [ue(), be, we, Ee];
function Fe({ value: e, onChange: r, onViewChanged: t, onSelectionChange: n, options: s, editorDidMount: m }) {
  const u = y(
    (g) => {
      r?.(g);
    },
    [r]
  ), o = y(
    (g) => {
      t?.(g);
    },
    [t]
  ), c = y(
    (g) => {
      g.selectionSet && n && n?.(g.state.selection);
    },
    [n]
  );
  return /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(le, {
    value: e,
    onChange: u,
    onCreateEditor: o,
    onUpdate: c,
    extensions: ke
  }));
}
function T(...e) {
  return e.filter(Boolean).join(" ");
}
function _e({ view: e, pattern: r, active: t, getTime: n }) {
  const s = N([]), m = N(0);
  k(() => {
    if (e)
      if (r && t) {
        m.current = 0;
        let u = requestAnimationFrame(function o() {
          try {
            const c = n(), b = [Math.max(m.current ?? c, c - 1 / 10, -0.01), c + 1 / 60];
            m.current = b[1], s.current = s.current.filter((h) => h.whole.end > c);
            const a = r.queryArc(...b).filter((h) => h.hasOnset());
            s.current = s.current.concat(a), e.dispatch({ effects: I.of(s.current) });
          } catch {
            e.dispatch({ effects: I.of([]) });
          }
          u = requestAnimationFrame(o);
        });
        return () => {
          cancelAnimationFrame(u);
        };
      } else
        s.current = [], e.dispatch({ effects: I.of([]) });
  }, [r, t, e]);
}
function Me(e, r = !1) {
  const t = N(), n = N(), s = (o) => {
    if (n.current !== void 0) {
      const c = o - n.current;
      e(o, c);
    }
    n.current = o, t.current = requestAnimationFrame(s);
  }, m = () => {
    t.current = requestAnimationFrame(s);
  }, u = () => {
    t.current && cancelAnimationFrame(t.current), delete t.current;
  };
  return k(() => {
    t.current && (u(), m());
  }, [e]), k(() => (r && m(), u), []), {
    start: m,
    stop: u
  };
}
function Ae({ pattern: e, started: r, getTime: t, onDraw: n, drawTime: s = [-2, 2] }) {
  let [m, u] = s;
  m = Math.abs(m);
  let o = N([]), c = N(null);
  k(() => {
    if (e) {
      const a = t(), h = e.queryArc(Math.max(a, 0), a + u + 0.1);
      o.current = o.current.filter((v) => v.whole.begin < a), o.current = o.current.concat(h);
    }
  }, [e]);
  const { start: g, stop: b } = Me(
    y(() => {
      const a = t() + u;
      if (c.current === null) {
        c.current = a;
        return;
      }
      const h = e.queryArc(Math.max(c.current, a - 1 / 10), a);
      c.current = a, o.current = (o.current || []).filter((v) => v.whole.end >= a - m - u).concat(h.filter((v) => v.hasOnset())), n(e, a - u, o.current, s);
    }, [e])
  );
  return k(() => {
    r ? g() : (o.current = [], b());
  }, [r]), {
    clear: () => {
      o.current = [];
    }
  };
}
function Ne(e) {
  return k(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), y((r) => window.postMessage(r, "*"), []);
}
function De({
  defaultOutput: e,
  interval: r,
  getTime: t,
  evalOnMount: n = !1,
  initialCode: s = "",
  autolink: m = !1,
  beforeEval: u,
  afterEval: o,
  editPattern: c,
  onEvalError: g,
  onToggle: b,
  canvasId: a,
  drawContext: h,
  drawTime: v = [-2, 2]
}) {
  const R = J(() => Ce(), []);
  a = a || `canvas-${R}`;
  const [L, x] = M(), [H, P] = M(), [E, S] = M(s), [V, q] = M(), [z, K] = M(), [D, O] = M(!1), j = E !== V, { scheduler: F, evaluate: C, start: d, stop: p, pause: X } = J(
    () => ge({
      interval: r,
      defaultOutput: e,
      onSchedulerError: x,
      onEvalError: (f) => {
        P(f), g?.(f);
      },
      getTime: t,
      drawContext: h,
      transpiler: ve,
      editPattern: c,
      beforeEval: ({ code: f }) => {
        S(f), u?.();
      },
      afterEval: ({ pattern: f, code: w }) => {
        q(w), K(f), P(), x(), m && (window.location.hash = "#" + encodeURIComponent(btoa(w))), o?.();
      },
      onToggle: (f) => {
        O(f), b?.(f);
      }
    }),
    [e, r, t]
  ), U = Ne(({ data: { from: f, type: w } }) => {
    w === "start" && f !== R && p();
  }), Y = y(
    async (f = !0) => {
      const w = await C(E, f);
      return U({ type: "start", from: R }), w;
    },
    [C, E]
  ), B = y(
    (f, w, $, G) => {
      const { onPaint: se } = f.context || {}, ie = typeof h == "function" ? h(a) : h;
      se?.(ie, w, $, G);
    },
    [h, a]
  ), W = y(
    (f) => {
      if (h && B) {
        const [w, $] = v, G = f.queryArc(0, $);
        B(f, -1e-3, G, v);
      }
    },
    [h, v, B]
  ), Z = N();
  k(() => {
    !Z.current && n && E && (Z.current = !0, C(E, !1).then((f) => W(f)));
  }, [n, E, C, W]), k(() => () => {
    F.stop();
  }, [F]);
  const ce = async () => {
    D ? (F.stop(), W(z)) : await Y();
  }, ae = L || H;
  return Ae({
    pattern: z,
    started: h && D,
    getTime: () => F.now(),
    drawTime: v,
    onDraw: B
  }), {
    id: R,
    canvasId: a,
    code: E,
    setCode: S,
    error: ae,
    schedulerError: L,
    scheduler: F,
    evalError: H,
    evaluate: C,
    activateCode: Y,
    activeCode: V,
    isDirty: j,
    pattern: z,
    started: D,
    start: d,
    stop: p,
    pause: X,
    togglePlay: ce
  };
}
function Ce() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
function ee({ type: e }) {
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
    }),
    stop: /* @__PURE__ */ l.createElement("path", {
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
function Ye({ tune: e, hideOutsideView: r = !1, enableKeyboard: t, drawTime: n, punchcard: s, canvasHeight: m = 200 }) {
  n = n || (s ? [0, 4] : void 0);
  const u = !!n, o = y(
    n ? (d) => document.querySelector("#" + d)?.getContext("2d") : null,
    [n]
  ), {
    code: c,
    setCode: g,
    evaluate: b,
    activateCode: a,
    error: h,
    isDirty: v,
    activeCode: R,
    pattern: L,
    started: x,
    scheduler: H,
    togglePlay: P,
    stop: E,
    canvasId: S,
    id: V
  } = De({
    initialCode: e,
    defaultOutput: fe,
    editPattern: (d) => s ? d.punchcard() : d,
    getTime: Se,
    evalOnMount: u,
    drawContext: o,
    drawTime: n
  }), [q, z] = M(), [K, D] = he({
    threshold: 0.01
  }), O = N(), j = J(() => ((D || !r) && (O.current = !0), D || O.current), [D, r]);
  _e({
    view: q,
    pattern: L,
    active: x && !R?.includes("strudel disable-highlighting"),
    getTime: () => H.now()
  }), te(() => {
    if (t) {
      const d = async (p) => {
        (p.ctrlKey || p.altKey) && (p.code === "Enter" ? (p.preventDefault(), ye(q), await a()) : p.code === "Period" && (E(), p.preventDefault()));
      };
      return window.addEventListener("keydown", d, !0), () => window.removeEventListener("keydown", d, !0);
    }
  }, [t, L, c, b, E, q]);
  const [F, C] = M([]);
  return Ve(
    y((d) => {
      const { data: p } = d.detail;
      p?.hap?.context?.id === V && C((U) => U.concat([d.detail]).slice(-10));
    }, [])
  ), /* @__PURE__ */ l.createElement("div", {
    className: _.container,
    ref: K
  }, /* @__PURE__ */ l.createElement("div", {
    className: _.header
  }, /* @__PURE__ */ l.createElement("div", {
    className: _.buttons
  }, /* @__PURE__ */ l.createElement("button", {
    className: T(_.button, x ? "sc-animate-pulse" : ""),
    onClick: () => P()
  }, /* @__PURE__ */ l.createElement(ee, {
    type: x ? "stop" : "play"
  })), /* @__PURE__ */ l.createElement("button", {
    className: T(v ? _.button : _.buttonDisabled),
    onClick: () => a()
  }, /* @__PURE__ */ l.createElement(ee, {
    type: "refresh"
  }))), h && /* @__PURE__ */ l.createElement("div", {
    className: _.error
  }, h.message)), /* @__PURE__ */ l.createElement("div", {
    className: _.body
  }, j && /* @__PURE__ */ l.createElement(Fe, {
    value: c,
    onChange: g,
    onViewChanged: z
  })), n && /* @__PURE__ */ l.createElement("canvas", {
    id: S,
    className: "w-full pointer-events-none",
    height: m,
    ref: (d) => {
      d && d.width !== d.clientWidth && (d.width = d.clientWidth);
    }
  }), !!F.length && /* @__PURE__ */ l.createElement("div", {
    className: "sc-bg-gray-800 sc-rounded-md sc-p-2"
  }, F.map(({ message: d }, p) => /* @__PURE__ */ l.createElement("div", {
    key: p
  }, d))));
}
function Ve(e) {
  Oe(pe.key, e);
}
function Oe(e, r, t = !1) {
  k(() => (document.addEventListener(e, r, t), () => {
    document.removeEventListener(e, r, t);
  }), [r]);
}
const Ze = (e) => te(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  Fe as CodeMirror,
  Ye as MiniRepl,
  T as cx,
  ye as flash,
  _e as useHighlighting,
  Ze as useKeydown,
  Ne as usePostMessage,
  De as useStrudel
};
