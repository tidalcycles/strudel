import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from "../_snowpack/pkg/react.js";
import logo from "./logo.svg.proxy.js";
import * as strudel from "../_snowpack/link/strudel.js";
import cx from "./cx.js";
import * as Tone from "../_snowpack/pkg/tone.js";
import useCycle from "./useCycle.js";
import * as tunes from "./tunes.js";
import * as krill from "./parse.js";
import CodeMirror from "./CodeMirror.js";
const {tetris, tetrisMini, tetrisHaskell} = tunes;
const {sequence, pure, reify, slowcat, fastcat, cat, stack, silence} = strudel;
const {mini, h} = krill;
const parse = (code) => eval(code);
const synth = new Tone.PolySynth().toDestination();
synth.set({
  oscillator: {type: "triangle"},
  envelope: {
    release: 0.01
  }
});
function App() {
  const [mode, setMode] = useState("javascript");
  const [code, setCode] = useState(tetrisHaskell);
  const [log, setLog] = useState("");
  const logBox = useRef();
  const [error, setError] = useState();
  const [pattern, setPattern] = useState();
  const logCycle = (_events, cycle2) => {
    if (_events.length) {
      setLog((log2) => log2 + `${log2 ? "\n\n" : ""}# cycle ${cycle2}
` + _events.map((e) => e.show()).join("\n"));
    }
  };
  const cycle = useCycle({
    onEvent: useCallback((time, event) => {
      synth.triggerAttackRelease(event.value, event.duration, time);
    }, []),
    onQuery: useCallback((span) => {
      try {
        return pattern?.query(span) || [];
      } catch (err) {
        setError(err);
        return [];
      }
    }, [pattern]),
    onSchedule: useCallback((_events, cycle2) => {
      logCycle(_events, cycle2);
    }, [pattern]),
    ready: !!pattern
  });
  useEffect(() => {
    try {
      let _pattern;
      try {
        _pattern = h(code);
        setMode("pegjs");
      } catch (err) {
        setMode("javascript");
        _pattern = parse(code);
      }
      setPattern(_pattern);
      setError(void 0);
    } catch (err) {
      console.warn(err);
      setError(err);
    }
  }, [code]);
  useLayoutEffect(() => {
    logBox.current.scrollTop = logBox.current?.scrollHeight;
  }, [log]);
  return /* @__PURE__ */ React.createElement("div", {
    className: "h-screen bg-slate-900 flex flex-col"
  }, /* @__PURE__ */ React.createElement("header", {
    className: "flex-none w-full h-16 px-2 flex items-center space-x-2 border-b border-gray-200 bg-white"
  }, /* @__PURE__ */ React.createElement("img", {
    src: logo,
    className: "Tidal-logo w-16 h-16",
    alt: "logo"
  }), /* @__PURE__ */ React.createElement("h1", {
    className: "text-2xl"
  }, "Strudel REPL")), /* @__PURE__ */ React.createElement("section", {
    className: "grow flex flex-col p-2 text-gray-100"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grow relative"
  }, /* @__PURE__ */ React.createElement("div", {
    className: cx("h-full bg-slate-600", error ? "focus:ring-red-500" : "focus:ring-slate-800")
  }, /* @__PURE__ */ React.createElement(CodeMirror, {
    value: code,
    options: {
      mode,
      theme: "material",
      lineNumbers: true
    },
    onChange: (_, __, value) => {
      setLog((log2) => log2 + `${log2 ? "\n\n" : ""}✏️ edit
${code}
${value}`);
      setCode(value);
    }
  })), error && /* @__PURE__ */ React.createElement("div", {
    className: "absolute right-2 bottom-2 text-red-500"
  }, error?.message || "unknown error")), /* @__PURE__ */ React.createElement("button", {
    className: "flex-none w-full border border-gray-700 p-2 bg-slate-700 hover:bg-slate-500",
    onClick: () => cycle.toggle()
  }, cycle.started ? "pause" : "play"), /* @__PURE__ */ React.createElement("textarea", {
    className: "grow bg-[#283237] border-0",
    value: log,
    readOnly: true,
    ref: logBox,
    style: {fontFamily: "monospace"}
  })));
}
export default App;
