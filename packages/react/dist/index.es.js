import d, { useCallback as E, useRef as A, useEffect as k, useMemo as Q, useState as _, useLayoutEffect as te } from "react";
import ue from "@uiw/react-codemirror";
import { Decoration as M, EditorView as re } from "@codemirror/view";
import { StateEffect as ne, StateField as oe } from "@codemirror/state";
import { javascript as de } from "@codemirror/lang-javascript";
import { tags as u } from "@lezer/highlight";
import { createTheme as fe } from "@uiw/codemirror-themes";
import { webaudioOutput as me, getAudioContext as he } from "@strudel.cycles/webaudio";
import { useInView as ge } from "react-hook-inview";
import { repl as pe, logger as ve } from "@strudel.cycles/core";
import { transpiler as be } from "@strudel.cycles/transpiler";
const Ee = fe({
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
const X = ne.define(), ye = oe.define({
  create() {
    return M.none;
  },
  update(e, t) {
    try {
      for (let r of t.effects)
        if (r.is(X))
          if (r.value) {
            const n = M.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = M.set([n.range(0, t.newDoc.length)]);
          } else
            e = M.set([]);
      return e;
    } catch (r) {
      return console.warn("flash error", r), e;
    }
  },
  provide: (e) => re.decorations.from(e)
}), we = (e) => {
  e.dispatch({ effects: X.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: X.of(!1) });
  }, 200);
}, B = ne.define(), ke = oe.define({
  create() {
    return M.none;
  },
  update(e, t) {
    try {
      for (let r of t.effects)
        if (r.is(B)) {
          const n = r.value.map(
            (l) => (l.context.locations || []).map(({ start: m, end: f }) => {
              const c = l.context.color || "#FFCA28";
              let s = t.newDoc.line(m.line).from + m.column, g = t.newDoc.line(f.line).from + f.column;
              const b = t.newDoc.length;
              return s > b || g > b ? void 0 : M.mark({ attributes: { style: `outline: 1.5px solid ${c};` } }).range(s, g);
            })
          ).flat().filter(Boolean) || [];
          e = M.set(n, !0);
        }
      return e;
    } catch {
      return M.set([]);
    }
  },
  provide: (e) => re.decorations.from(e)
}), Fe = [de(), Ee, ke, ye];
function _e({ value: e, onChange: t, onViewChanged: r, onSelectionChange: n, options: l, editorDidMount: m }) {
  const f = E(
    (g) => {
      t?.(g);
    },
    [t]
  ), c = E(
    (g) => {
      r?.(g);
    },
    [r]
  ), s = E(
    (g) => {
      g.selectionSet && n && n?.(g.state.selection);
    },
    [n]
  );
  return /* @__PURE__ */ d.createElement(d.Fragment, null, /* @__PURE__ */ d.createElement(ue, {
    value: e,
    onChange: f,
    onCreateEditor: c,
    onUpdate: s,
    extensions: Fe
  }));
}
function T(...e) {
  return e.filter(Boolean).join(" ");
}
function Me({ view: e, pattern: t, active: r, getTime: n }) {
  const l = A([]), m = A(0);
  k(() => {
    if (e)
      if (t && r) {
        m.current = 0;
        let f = requestAnimationFrame(function c() {
          try {
            const s = n(), b = [Math.max(m.current ?? s, s - 1 / 10, -0.01), s + 1 / 60];
            m.current = b[1], l.current = l.current.filter((h) => h.whole.end > s);
            const i = t.queryArc(...b).filter((h) => h.hasOnset());
            l.current = l.current.concat(i), e.dispatch({ effects: B.of(l.current) });
          } catch {
            e.dispatch({ effects: B.of([]) });
          }
          f = requestAnimationFrame(c);
        });
        return () => {
          cancelAnimationFrame(f);
        };
      } else
        l.current = [], e.dispatch({ effects: B.of([]) });
  }, [t, r, e]);
}
function Ae(e, t = !1) {
  const r = A(), n = A(), l = (c) => {
    if (n.current !== void 0) {
      const s = c - n.current;
      e(c, s);
    }
    n.current = c, r.current = requestAnimationFrame(l);
  }, m = () => {
    r.current = requestAnimationFrame(l);
  }, f = () => {
    r.current && cancelAnimationFrame(r.current), delete r.current;
  };
  return k(() => {
    r.current && (f(), m());
  }, [e]), k(() => (t && m(), f), []), {
    start: m,
    stop: f
  };
}
function Ne({ pattern: e, started: t, getTime: r, onDraw: n, drawTime: l = [-2, 2] }) {
  let [m, f] = l;
  m = Math.abs(m);
  let c = A([]), s = A(null);
  k(() => {
    if (e && t) {
      const i = r(), h = e.queryArc(Math.max(i, 0), i + f + 0.1);
      c.current = c.current.filter((p) => p.whole.begin < i), c.current = c.current.concat(h);
    }
  }, [e, t]);
  const { start: g, stop: b } = Ae(
    E(() => {
      const i = r() + f;
      if (s.current === null) {
        s.current = i;
        return;
      }
      const h = e.queryArc(Math.max(s.current, i - 1 / 10), i);
      s.current = i, c.current = (c.current || []).filter((p) => p.whole.end >= i - m - f).concat(h.filter((p) => p.hasOnset())), n(e, i - f, c.current, l);
    }, [e])
  );
  return k(() => {
    t ? g() : (c.current = [], b());
  }, [t]), {
    clear: () => {
      c.current = [];
    }
  };
}
function Ce(e) {
  return k(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), E((t) => window.postMessage(t, "*"), []);
}
function De({
  defaultOutput: e,
  interval: t,
  getTime: r,
  evalOnMount: n = !1,
  initialCode: l = "",
  autolink: m = !1,
  beforeEval: f,
  afterEval: c,
  editPattern: s,
  onEvalError: g,
  onToggle: b,
  canvasId: i,
  drawContext: h,
  drawTime: p = [-2, 2]
}) {
  const D = Q(() => Re(), []);
  i = i || `canvas-${D}`;
  const [P, R] = _(), [z, H] = _(), [y, S] = _(l), [V, q] = _(), [x, I] = _(), [N, O] = _(!1), K = y !== V, L = E((a) => !!(a?.context?.onPaint && h), [h]), { scheduler: C, evaluate: o, start: v, stop: j, pause: U } = Q(
    () => pe({
      interval: t,
      defaultOutput: e,
      onSchedulerError: R,
      onEvalError: (a) => {
        H(a), g?.(a);
      },
      getTime: r,
      drawContext: h,
      transpiler: be,
      editPattern: s,
      beforeEval: ({ code: a }) => {
        S(a), f?.();
      },
      afterEval: ({ pattern: a, code: w }) => {
        q(w), I(a), H(), R(), m && (window.location.hash = "#" + encodeURIComponent(btoa(w))), c?.();
      },
      onToggle: (a) => {
        O(a), b?.(a);
      }
    }),
    [e, t, r]
  ), ce = Ce(({ data: { from: a, type: w } }) => {
    w === "start" && a !== D && j();
  }), Y = E(
    async (a = !0) => {
      const w = await o(y, a);
      return ce({ type: "start", from: D }), w;
    },
    [o, y]
  ), W = E(
    (a, w, G, J) => {
      const { onPaint: ie } = a.context || {}, le = typeof h == "function" ? h(i) : h;
      ie?.(le, w, G, J);
    },
    [h, i]
  ), $ = E(
    (a) => {
      if (L(a)) {
        const [w, G] = p, J = a.queryArc(0, G);
        W(a, -1e-3, J, p);
      }
    },
    [p, W, L]
  ), Z = A();
  k(() => {
    !Z.current && n && y && (Z.current = !0, o(y, !1).then((a) => $(a)));
  }, [n, y, o, $]), k(() => () => {
    C.stop();
  }, [C]);
  const ae = async () => {
    N ? (C.stop(), $(x)) : await Y();
  }, se = P || z;
  return Ne({
    pattern: x,
    started: L(x) && N,
    getTime: () => C.now(),
    drawTime: p,
    onDraw: W
  }), {
    id: D,
    canvasId: i,
    code: y,
    setCode: S,
    error: se,
    schedulerError: P,
    scheduler: C,
    evalError: z,
    evaluate: o,
    activateCode: Y,
    activeCode: V,
    isDirty: K,
    pattern: x,
    started: N,
    start: v,
    stop: j,
    pause: U,
    togglePlay: ae
  };
}
function Re() {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
}
function ee({ type: e }) {
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
const xe = "_container_3i85k_1", Le = "_header_3i85k_5", Pe = "_buttons_3i85k_9", qe = "_button_3i85k_9", ze = "_buttonDisabled_3i85k_17", He = "_error_3i85k_21", Se = "_body_3i85k_25", F = {
  container: xe,
  header: Le,
  buttons: Pe,
  button: qe,
  buttonDisabled: ze,
  error: He,
  body: Se
}, Ve = () => he().currentTime;
function Ze({ tune: e, hideOutsideView: t = !1, enableKeyboard: r, drawTime: n, punchcard: l, canvasHeight: m = 200 }) {
  n = n || (l ? [0, 4] : void 0);
  const f = !!n, c = E(
    n ? (o) => document.querySelector("#" + o)?.getContext("2d") : null,
    [n]
  ), {
    code: s,
    setCode: g,
    evaluate: b,
    activateCode: i,
    error: h,
    isDirty: p,
    activeCode: D,
    pattern: P,
    started: R,
    scheduler: z,
    togglePlay: H,
    stop: y,
    canvasId: S,
    id: V
  } = De({
    initialCode: e,
    defaultOutput: me,
    editPattern: (o) => l ? o.punchcard() : o,
    getTime: Ve,
    evalOnMount: f,
    drawContext: c,
    drawTime: n
  }), [q, x] = _(), [I, N] = ge({
    threshold: 0.01
  }), O = A(), K = Q(() => ((N || !t) && (O.current = !0), N || O.current), [N, t]);
  Me({
    view: q,
    pattern: P,
    active: R && !D?.includes("strudel disable-highlighting"),
    getTime: () => z.now()
  }), te(() => {
    if (r) {
      const o = async (v) => {
        (v.ctrlKey || v.altKey) && (v.code === "Enter" ? (v.preventDefault(), we(q), await i()) : v.code === "Period" && (y(), v.preventDefault()));
      };
      return window.addEventListener("keydown", o, !0), () => window.removeEventListener("keydown", o, !0);
    }
  }, [r, P, s, b, y, q]);
  const [L, C] = _([]);
  return Oe(
    E((o) => {
      const { data: v } = o.detail;
      v?.hap?.context?.id === V && C((U) => U.concat([o.detail]).slice(-10));
    }, [])
  ), /* @__PURE__ */ d.createElement("div", {
    className: F.container,
    ref: I
  }, /* @__PURE__ */ d.createElement("div", {
    className: F.header
  }, /* @__PURE__ */ d.createElement("div", {
    className: F.buttons
  }, /* @__PURE__ */ d.createElement("button", {
    className: T(F.button, R ? "sc-animate-pulse" : ""),
    onClick: () => H()
  }, /* @__PURE__ */ d.createElement(ee, {
    type: R ? "stop" : "play"
  })), /* @__PURE__ */ d.createElement("button", {
    className: T(p ? F.button : F.buttonDisabled),
    onClick: () => i()
  }, /* @__PURE__ */ d.createElement(ee, {
    type: "refresh"
  }))), h && /* @__PURE__ */ d.createElement("div", {
    className: F.error
  }, h.message)), /* @__PURE__ */ d.createElement("div", {
    className: F.body
  }, K && /* @__PURE__ */ d.createElement(_e, {
    value: s,
    onChange: g,
    onViewChanged: x
  })), n && /* @__PURE__ */ d.createElement("canvas", {
    id: S,
    className: "w-full pointer-events-none",
    height: m,
    ref: (o) => {
      o && o.width !== o.clientWidth && (o.width = o.clientWidth);
    }
  }), !!L.length && /* @__PURE__ */ d.createElement("div", {
    className: "sc-bg-gray-800 sc-rounded-md sc-p-2"
  }, L.map(({ message: o }, v) => /* @__PURE__ */ d.createElement("div", {
    key: v
  }, o))));
}
function Oe(e) {
  Be(ve.key, e);
}
function Be(e, t, r = !1) {
  k(() => (document.addEventListener(e, t, r), () => {
    document.removeEventListener(e, t, r);
  }), [t]);
}
const Te = (e) => te(() => (window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0)), [e]);
export {
  _e as CodeMirror,
  Ze as MiniRepl,
  T as cx,
  we as flash,
  Me as useHighlighting,
  Te as useKeydown,
  Ce as usePostMessage,
  De as useStrudel
};
