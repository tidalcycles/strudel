import d, { useCallback as C, useState as b, useEffect as S, useMemo as L, useRef as X, useLayoutEffect as Y } from "react";
import Z from "@uiw/react-codemirror";
import { Decoration as x, EditorView as j } from "@codemirror/view";
import { StateEffect as K, StateField as Q } from "@codemirror/state";
import { javascript as ee } from "@codemirror/lang-javascript";
import { tags as i } from "@lezer/highlight";
import { createTheme as te } from "@uiw/codemirror-themes";
import { useInView as oe } from "react-hook-inview";
import { evaluate as ne } from "@strudel.cycles/eval";
import { Tone as h } from "@strudel.cycles/tone";
import { TimeSpan as re, State as ae } from "@strudel.cycles/core";
import { webaudioOutputTrigger as se } from "@strudel.cycles/webaudio";
import { WebMidi as k, enableWebMidi as ce } from "@strudel.cycles/midi";
const ie = te({
  theme: "dark",
  settings: {
    background: "#222",
    foreground: "#75baff",
    caret: "#ffcc00",
    selection: "rgba(128, 203, 196, 0.5)",
    selectionMatch: "#036dd626",
    lineHighlight: "#8a91991a",
    gutterBackground: "transparent",
    gutterForeground: "#676e95"
  },
  styles: [
    { tag: i.keyword, color: "#c792ea" },
    { tag: i.operator, color: "#89ddff" },
    { tag: i.special(i.variableName), color: "#eeffff" },
    { tag: i.typeName, color: "#f07178" },
    { tag: i.atom, color: "#f78c6c" },
    { tag: i.number, color: "#ff5370" },
    { tag: i.definition(i.variableName), color: "#82aaff" },
    { tag: i.string, color: "#c3e88d" },
    { tag: i.special(i.string), color: "#f07178" },
    { tag: i.comment, color: "#7d8799" },
    { tag: i.variableName, color: "#f07178" },
    { tag: i.tagName, color: "#ff5370" },
    { tag: i.bracket, color: "#a2a1a4" },
    { tag: i.meta, color: "#ffcb6b" },
    { tag: i.attributeName, color: "#c792ea" },
    { tag: i.propertyName, color: "#c792ea" },
    { tag: i.className, color: "#decb6b" },
    { tag: i.invalid, color: "#ffffff" }
  ]
});
const P = K.define(), le = Q.define({
  create() {
    return x.none;
  },
  update(e, n) {
    try {
      for (let r of n.effects)
        if (r.is(P))
          if (r.value) {
            const c = x.mark({ attributes: { style: "background-color: #FFCA2880" } });
            e = x.set([c.range(0, n.newDoc.length)]);
          } else
            e = x.set([]);
      return e;
    } catch (r) {
      return console.warn("flash error", r), e;
    }
  },
  provide: (e) => j.decorations.from(e)
}), de = (e) => {
  e.dispatch({ effects: P.of(!0) }), setTimeout(() => {
    e.dispatch({ effects: P.of(!1) });
  }, 200);
}, B = K.define(), ue = Q.define({
  create() {
    return x.none;
  },
  update(e, n) {
    try {
      for (let r of n.effects)
        if (r.is(B)) {
          const c = r.value.map(
            (l) => (l.context.locations || []).map(({ start: a, end: m }) => {
              const t = l.context.color || "#FFCA28";
              let u = n.newDoc.line(a.line).from + a.column, o = n.newDoc.line(m.line).from + m.column;
              const y = n.newDoc.length;
              return u > y || o > y ? void 0 : x.mark({ attributes: { style: `outline: 1.5px solid ${t};` } }).range(u, o);
            })
          ).flat().filter(Boolean) || [];
          e = x.set(c, !0);
        }
      return e;
    } catch {
      return x.set([]);
    }
  },
  provide: (e) => j.decorations.from(e)
}), fe = [ee(), ie, ue, le];
function me({ value: e, onChange: n, onViewChanged: r, onSelectionChange: c, options: l, editorDidMount: a }) {
  const m = C(
    (o) => {
      n?.(o);
    },
    [n]
  ), t = C(
    (o) => {
      r?.(o);
    },
    [r]
  ), u = C(
    (o) => {
      o.selectionSet && c && c?.(o.state.selection);
    },
    [c]
  );
  return /* @__PURE__ */ d.createElement(d.Fragment, null, /* @__PURE__ */ d.createElement(Z, {
    value: e,
    onChange: m,
    onCreateEditor: t,
    onUpdate: u,
    extensions: fe
  }));
}
function ge(e) {
  const { onEvent: n, onQuery: r, onSchedule: c, ready: l = !0, onDraw: a } = e, [m, t] = b(!1), u = 1, o = () => Math.floor(h.getTransport().seconds / u), y = (v = o()) => {
    const O = new re(v, v + 1), M = r?.(new ae(O)) || [];
    c?.(M, v);
    const _ = O.begin.valueOf();
    h.getTransport().cancel(_);
    const R = (v + 1) * u - 0.5, E = Math.max(h.getTransport().seconds, R) + 0.1;
    h.getTransport().schedule(() => {
      y(v + 1);
    }, E), M?.filter((g) => g.part.begin.equals(g.whole?.begin)).forEach((g) => {
      h.getTransport().schedule((D) => {
        n(D, g, h.getContext().currentTime), h.Draw.schedule(() => {
          a?.(D, g);
        }, D);
      }, g.part.begin.valueOf());
    });
  };
  S(() => {
    l && y();
  }, [n, c, r, a, l]);
  const w = async () => {
    t(!0), await h.start(), h.getTransport().start("+0.1");
  }, p = () => {
    h.getTransport().pause(), t(!1);
  };
  return {
    start: w,
    stop: p,
    onEvent: n,
    started: m,
    setStarted: t,
    toggle: () => m ? p() : w(),
    query: y,
    activeCycle: o
  };
}
function pe(e) {
  return S(() => (window.addEventListener("message", e), () => window.removeEventListener("message", e)), [e]), C((n) => window.postMessage(n, "*"), []);
}
let he = () => Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
const be = (e) => encodeURIComponent(btoa(e));
function ye({ tune: e, autolink: n = !0, onEvent: r, onDraw: c }) {
  const l = L(() => he(), []), [a, m] = b(e), [t, u] = b(), [o, y] = b(""), [w, p] = b(), [q, v] = b(!1), [O, M] = b(""), [_, R] = b(), E = L(() => a !== t || w, [a, t, w]), g = C((f) => y((s) => s + `${s ? `

` : ""}${f}`), []), D = L(() => {
    if (t && !t.includes("strudel disable-highlighting"))
      return (f, s) => c?.(f, s, t);
  }, [t, c]), z = L(() => t && t.includes("strudel hide-header"), [t]), N = L(() => t && t.includes("strudel hide-console"), [t]), F = ge({
    onDraw: D,
    onEvent: C(
      (f, s, J) => {
        try {
          r?.(s), s.context.logs?.length && s.context.logs.forEach(g);
          const { onTrigger: A = se } = s.context;
          A(f, s, J, 1);
        } catch (A) {
          console.warn(A), A.message = "unplayable event: " + A?.message, g(A.message);
        }
      },
      [r, g]
    ),
    onQuery: C(
      (f) => {
        try {
          return _?.query(f) || [];
        } catch (s) {
          return console.warn(s), s.message = "query error: " + s.message, p(s), [];
        }
      },
      [_]
    ),
    onSchedule: C((f, s) => G(f), []),
    ready: !!_ && !!t
  }), V = pe(({ data: { from: f, type: s } }) => {
    s === "start" && f !== l && (F.setStarted(!1), u(void 0));
  }), I = C(
    async (f = a) => {
      if (t && !E) {
        p(void 0), F.start();
        return;
      }
      try {
        v(!0);
        const s = await ne(f);
        F.start(), V({ type: "start", from: l }), R(() => s.pattern), n && (window.location.hash = "#" + encodeURIComponent(btoa(a))), M(be(a)), p(void 0), u(f), v(!1);
      } catch (s) {
        s.message = "evaluation error: " + s.message, console.warn(s), p(s);
      }
    },
    [t, E, a, F, n, l, V]
  ), G = (f, s) => {
    f.length;
  };
  return {
    hideHeader: z,
    hideConsole: N,
    pending: q,
    code: a,
    setCode: m,
    pattern: _,
    error: w,
    cycle: F,
    setPattern: R,
    dirty: E,
    log: o,
    togglePlay: () => {
      F.started ? F.stop() : I();
    },
    setActiveCode: u,
    activateCode: I,
    activeCode: t,
    pushLog: g,
    hash: O
  };
}
function W(...e) {
  return e.filter(Boolean).join(" ");
}
let H = [], U;
function we({ view: e, pattern: n, active: r }) {
  S(() => {
    if (e)
      if (n && r) {
        let l = function() {
          try {
            const a = h.getTransport().seconds, t = [Math.max(U || a, a - 1 / 10), a + 1 / 60];
            U = a + 1 / 60, H = H.filter((o) => o.whole.end > a);
            const u = n.queryArc(...t).filter((o) => o.hasOnset());
            H = H.concat(u), e.dispatch({ effects: B.of(H) });
          } catch {
            e.dispatch({ effects: B.of([]) });
          }
          c = requestAnimationFrame(l);
        }, c = requestAnimationFrame(l);
        return () => {
          cancelAnimationFrame(c);
        };
      } else
        H = [], e.dispatch({ effects: B.of([]) });
  }, [n, r, e]);
}
const ve = "_container_3i85k_1", Ee = "_header_3i85k_5", ke = "_buttons_3i85k_9", Ce = "_button_3i85k_9", Me = "_buttonDisabled_3i85k_17", _e = "_error_3i85k_21", Ne = "_body_3i85k_25", T = {
  container: ve,
  header: Ee,
  buttons: ke,
  button: Ce,
  buttonDisabled: Me,
  error: _e,
  body: Ne
};
function $({ type: e }) {
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
    })
  }[e]);
}
function Ve({ tune: e, hideOutsideView: n = !1, init: r, onEvent: c, enableKeyboard: l }) {
  const { code: a, setCode: m, pattern: t, activeCode: u, activateCode: o, evaluateOnly: y, error: w, cycle: p, dirty: q, togglePlay: v, stop: O } = ye({
    tune: e,
    autolink: !1,
    onEvent: c
  });
  S(() => {
    r && y();
  }, [e, r]);
  const [M, _] = b(), [R, E] = oe({
    threshold: 0.01
  }), g = X(), D = L(() => ((E || !n) && (g.current = !0), E || g.current), [E, n]);
  return we({ view: M, pattern: t, active: p.started && !u?.includes("strudel disable-highlighting") }), Y(() => {
    if (l) {
      const z = async (N) => {
        (N.ctrlKey || N.altKey) && (N.code === "Enter" ? (N.preventDefault(), de(M), await o()) : N.code === "Period" && (p.stop(), N.preventDefault()));
      };
      return window.addEventListener("keydown", z, !0), () => window.removeEventListener("keydown", z, !0);
    }
  }, [l, t, a, o, p, M]), /* @__PURE__ */ d.createElement("div", {
    className: T.container,
    ref: R
  }, /* @__PURE__ */ d.createElement("div", {
    className: T.header
  }, /* @__PURE__ */ d.createElement("div", {
    className: T.buttons
  }, /* @__PURE__ */ d.createElement("button", {
    className: W(T.button, p.started ? "sc-animate-pulse" : ""),
    onClick: () => v()
  }, /* @__PURE__ */ d.createElement($, {
    type: p.started ? "pause" : "play"
  })), /* @__PURE__ */ d.createElement("button", {
    className: W(q ? T.button : T.buttonDisabled),
    onClick: () => o()
  }, /* @__PURE__ */ d.createElement($, {
    type: "refresh"
  }))), w && /* @__PURE__ */ d.createElement("div", {
    className: T.error
  }, w.message)), /* @__PURE__ */ d.createElement("div", {
    className: T.body
  }, D && /* @__PURE__ */ d.createElement(me, {
    value: a,
    onChange: m,
    onViewChanged: _
  })));
}
function Ie(e) {
  const { ready: n, connected: r, disconnected: c } = e, [l, a] = b(!0), [m, t] = b(k?.outputs || []);
  return S(() => {
    ce().then(() => {
      k.addListener("connected", (o) => {
        t([...k.outputs]), r?.(k, o);
      }), k.addListener("disconnected", (o) => {
        t([...k.outputs]), c?.(k, o);
      }), n?.(k), a(!1);
    }).catch((o) => {
      if (o) {
        console.error(o), console.warn("Web Midi could not be enabled..");
        return;
      }
    });
  }, [n, r, c, m]), { loading: l, outputs: m, outputByName: (o) => k.getOutputByName(o) };
}
export {
  me as CodeMirror,
  Ve as MiniRepl,
  W as cx,
  de as flash,
  ge as useCycle,
  we as useHighlighting,
  pe as usePostMessage,
  ye as useRepl,
  Ie as useWebMidi
};
