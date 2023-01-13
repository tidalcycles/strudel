import l, { useCallback as w, useRef as A, useEffect as k, useMemo as $, useState as _, useLayoutEffect as Y } from "react";
import ie from "@uiw/react-codemirror";
import { Decoration as M, EditorView as Z } from "@codemirror/view";
import { StateEffect as ee, StateField as te } from "@codemirror/state";
import { javascript as le } from "@codemirror/lang-javascript";
import { tags as i } from "@lezer/highlight";
import { createTheme as ue } from "@uiw/codemirror-themes";
import { webaudioOutput as de, getAudioContext as fe } from "@strudel.cycles/webaudio";
import { useInView as me } from "react-hook-inview";
import { repl as he, logger as ge } from "@strudel.cycles/core";
import { transpiler as pe } from "@strudel.cycles/transpiler";
const ve = ue({
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
const G = ee.define(), be = te.define({
  create() {
    return M.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(G))
          if (t.value) {
            const o = M.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = M.set([o.range(0, r.newDoc.length)]);
          } else
            e = M.set([]);
      return e;
    } catch (t) {
      return console.warn("flash error", t), e;
    }
  },
  provide: (e) => Z.decorations.from(e)
}), Ee = (e) => {
  e.dispatch({ effects: G.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: G.of(!1) });
  }, 200);
}, O = ee.define(), ye = te.define({
  create() {
    return M.none;
  },
  update(e, r) {
    try {
      for (let t of r.effects)
        if (t.is(O)) {
          const o = t.value.map(
            (u) => (u.context.locations || []).map(({ start: m, end: d }) => {
              const a = u.context.color || "#FFCA28";
              let c = r.newDoc.line(m.line).from + m.column, h = r.newDoc.line(d.line).from + d.column;
              const g = r.newDoc.length;
              return c > g || h > g ? void 0 : M.mark({ attributes: { style: `outline: 1.5px solid ${a};` } }).range(c, h);
            })
          ).flat().filter(Boolean) || [];
          e = M.set(o, !0);
        }
      return e;
    } catch {
      return M.set([]);
    }
  },
  provide: (e) => Z.decorations.from(e)
}), we = [le(), ve, ye, be];
function ke({ value: e, onChange: r, onViewChanged: t, onSelectionChange: o, options: u, editorDidMount: m }) {
  const d = w(
    (h) => {
      r?.(h);
    },
    [r]
  ), a = w(
    (h) => {
      t?.(h);
    },
    [t]
  ), c = w(
    (h) => {
      h.selectionSet && o && o?.(h.state.selection);
    },
    [o]
  );
  return /* @__PURE__ */ l.createElement(l.Fragment, null, /* @__PURE__ */ l.createElement(ie, {
    value: e,
    onChange: d,
    onCreateEditor: a,
    onUpdate: c,
    extensions: we
  }));
}
function T(...e) {
  return e.filter(Boolean).join(" ");
}
function Fe({ view: e, pattern: r, active: t, getTime: o }) {
  const u = A([]), m = A();
  k(() => {
    if (e)
      if (r && t) {
        let d = requestAnimationFrame(function a() {
          try {
            const c = o(), g = [Math.max(m.current || c, c - 1 / 10, 0), c + 1 / 60];
            m.current = g[1], u.current = u.current.filter((p) => p.whole.end > c);
            const n = r.queryArc(...g).filter((p) => p.hasOnset());
            u.current = u.current.concat(n), e.dispatch({ effects: O.of(u.current) });
          } catch {
            e.dispatch({ effects: O.of([]) });
          }
          d = requestAnimationFrame(a);
        });
        return () => {
          cancelAnimationFrame(d);
        };
      } else
        u.current = [], e.dispatch({ effects: O.of([]) });
  }, [r, t, e]);
}
function _e(e, r = !1) {
  const t = A(), o = A(), u = (a) => {
    if (o.current !== void 0) {
      const c = a - o.current;
      e(a, c);
    }
    o.current = a, t.current = requestAnimationFrame(u);
  }, m = () => {
    t.current = requestAnimationFrame(u);
  }, d = () => {
    t.current && cancelAnimationFrame(t.current), delete t.current;
  };
  return k(() => {
    t.current && (d(), m());
  }, [e]), k(() => (r && m(), d), []), {
    start: m,
    stop: d
  };
}
function Me({ pattern: e, started: r, getTime: t, onDraw: o, drawTime: u = [-2, 2] }) {
  let [m, d] = u;
  m = Math.abs(m);
  let a = A([]), c = A(null);
  k(() => {
    if (e) {
      const n = t(), p = e.queryArc(n, n + d);
      a.current = a.current.filter((b) => b.whole.begin < n), a.current = a.current.concat(p);
    }
  }, [e]);
  const { start: h, stop: g } = _e(
    w(() => {
      const n = t() + d;
      if (c.current === null) {
        c.current = n;
        return;
      }
      const p = e.queryArc(Math.max(c.current, n - 1 / 10), n);
      c.current = n, a.current = (a.current || []).filter((b) => b.whole.end >= n - m - d).concat(p.filter((b) => b.hasOnset())), o(e, n - d, a.current, u);
    }, [e])
  );
  return k(() => {
    r ? h() : (a.current = [], g());
  }, [r]), {
    clear: () => {
      a.current = [];
    }
  };
}
function Ae(e) {
  return k(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), w((r) => window.postMessage(r, "*"), []);
}
function Ne({
  defaultOutput: e,
  interval: r,
  getTime: t,
  evalOnMount: o = !1,
  initialCode: u = "",
  autolink: m = !1,
  beforeEval: d,
  afterEval: a,
  onEvalError: c,
  onToggle: h,
  canvasId: g,
  drawContext: n,
  drawTime: p = [-2, 2]
}) {
  const b = $(() => De(), []);
  g = g || `canvas-${b}`;
  const [q, x] = _(), [C, z] = _(), [E, D] = _(u), [H, B] = _(), [N, P] = _(), [R, S] = _(!1), I = E !== H, { scheduler: s, evaluate: v, start: J, stop: V, pause: re } = $(
    () => he({
      interval: r,
      defaultOutput: e,
      onSchedulerError: x,
      onEvalError: (f) => {
        z(f), c?.(f);
      },
      getTime: t,
      drawContext: n,
      transpiler: pe,
      beforeEval: ({ code: f }) => {
        D(f), d?.();
      },
      afterEval: ({ pattern: f, code: y }) => {
        B(y), P(f), z(), x(), m && (window.location.hash = "#" + encodeURIComponent(btoa(y))), a?.();
      },
      onToggle: (f) => {
        S(f), h?.(f);
      }
    }),
    [e, r, t]
  ), ne = Ae(({ data: { from: f, type: y } }) => {
    y === "start" && f !== b && V();
  }), K = w(
    async (f = !0) => {
      const y = await v(E, f);
      return ne({ type: "start", from: b }), y;
    },
    [v, E]
  ), L = w(
    (f, y, U, W) => {
      const { onPaint: ce } = f.context || {}, se = typeof n == "function" ? n(g) : n;
      ce?.(se, y, U, W);
    },
    [n, g]
  ), j = w(
    (f) => {
      if (n && L) {
        const [y, U] = p, W = f.queryArc(0, U);
        L(f, 0, W, p);
      }
    },
    [p, L]
  ), Q = A();
  k(() => {
    !Q.current && n && L && o && E && (Q.current = !0, v(E, !1).then((f) => j(f)));
  }, [K, o, E, j]), k(() => () => {
    s.stop();
  }, [s]);
  const oe = async () => {
    R ? (s.stop(), j(N)) : await K();
  }, ae = q || C;
  return Me({
    pattern: N,
    started: n && R,
    getTime: () => s.now(),
    drawTime: p,
    onDraw: L
  }), {
    id: b,
    canvasId: g,
    code: E,
    setCode: D,
    error: ae,
    schedulerError: q,
    scheduler: s,
    evalError: C,
    evaluate: v,
    activateCode: K,
    activeCode: H,
    isDirty: I,
    pattern: N,
    started: R,
    start: J,
    stop: V,
    pause: re,
    togglePlay: oe
  };
}
function De() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
function X({ type: e }) {
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
const Ce = "_container_3i85k_1", Re = "_header_3i85k_5", Le = "_buttons_3i85k_9", qe = "_button_3i85k_9", xe = "_buttonDisabled_3i85k_17", ze = "_error_3i85k_21", He = "_body_3i85k_25", F = {
  container: Ce,
  header: Re,
  buttons: Le,
  button: qe,
  buttonDisabled: xe,
  error: ze,
  body: He
}, Pe = () => fe().currentTime;
function Te({ tune: e, hideOutsideView: r = !1, enableKeyboard: t, drawTime: o, canvasHeight: u = 200 }) {
  const {
    code: m,
    setCode: d,
    evaluate: a,
    activateCode: c,
    error: h,
    isDirty: g,
    activeCode: n,
    pattern: p,
    started: b,
    scheduler: q,
    togglePlay: x,
    stop: C,
    canvasId: z,
    id: E
  } = Ne({
    initialCode: e,
    defaultOutput: de,
    getTime: Pe,
    evalOnMount: !!o,
    drawContext: o ? (s) => document.querySelector("#" + s)?.getContext("2d") : null,
    drawTime: o
  }), [D, H] = _(), [B, N] = me({
    threshold: 0.01
  }), P = A(), R = $(() => ((N || !r) && (P.current = !0), N || P.current), [N, r]);
  Fe({
    view: D,
    pattern: p,
    active: b && !n?.includes("strudel disable-highlighting"),
    getTime: () => q.now()
  }), Y(() => {
    if (t) {
      const s = async (v) => {
        (v.ctrlKey || v.altKey) && (v.code === "Enter" ? (v.preventDefault(), Ee(D), await c()) : v.code === "Period" && (C(), v.preventDefault()));
      };
      return window.addEventListener("keydown", s, !0), () => window.removeEventListener("keydown", s, !0);
    }
  }, [t, p, m, a, C, D]);
  const [S, I] = _([]);
  return Se(
    w((s) => {
      const { data: v } = s.detail;
      v?.hap?.context?.id === E && I((V) => V.concat([s.detail]).slice(-10));
    }, [])
  ), /* @__PURE__ */ l.createElement("div", {
    className: F.container,
    ref: B
  }, /* @__PURE__ */ l.createElement("div", {
    className: F.header
  }, /* @__PURE__ */ l.createElement("div", {
    className: F.buttons
  }, /* @__PURE__ */ l.createElement("button", {
    className: T(F.button, b ? "sc-animate-pulse" : ""),
    onClick: () => x()
  }, /* @__PURE__ */ l.createElement(X, {
    type: b ? "stop" : "play"
  })), /* @__PURE__ */ l.createElement("button", {
    className: T(g ? F.button : F.buttonDisabled),
    onClick: () => c()
  }, /* @__PURE__ */ l.createElement(X, {
    type: "refresh"
  }))), h && /* @__PURE__ */ l.createElement("div", {
    className: F.error
  }, h.message)), /* @__PURE__ */ l.createElement("div", {
    className: F.body
  }, R && /* @__PURE__ */ l.createElement(ke, {
    value: m,
    onChange: d,
    onViewChanged: H
  })), o && /* @__PURE__ */ l.createElement("canvas", {
    id: z,
    className: "w-full pointer-events-none",
    height: u,
    ref: (s) => {
      s && s.width !== s.clientWidth && (s.width = s.clientWidth);
    }
  }), !!S.length && /* @__PURE__ */ l.createElement("div", {
    className: "sc-bg-gray-800 sc-rounded-md sc-p-2"
  }, S.map(({ message: s }, v) => /* @__PURE__ */ l.createElement("div", {
    key: v
  }, s))));
}
function Se(e) {
  Ve(ge.key, e);
}
function Ve(e, r, t = !1) {
  k(() => (document.addEventListener(e, r, t), () => {
    document.removeEventListener(e, r, t);
  }), [r]);
}
const Xe = (e) => Y(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  ke as CodeMirror,
  Te as MiniRepl,
  T as cx,
  Ee as flash,
  Fe as useHighlighting,
  Xe as useKeydown,
  Ae as usePostMessage,
  Ne as useStrudel
};
