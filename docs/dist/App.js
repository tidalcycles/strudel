import React, {useCallback, useLayoutEffect, useRef, useState} from "../_snowpack/pkg/react.js";
import * as Tone from "../_snowpack/pkg/tone.js";
import CodeMirror, {markEvent, markParens} from "./CodeMirror.js";
import cx from "./cx.js";
import {evaluate} from "./evaluate.js";
import logo from "./logo.svg.proxy.js";
import {useWebMidi} from "./midi.js";
import * as tunes from "./tunes.js";
import useRepl from "./useRepl.js";
const [_, codeParam] = window.location.href.split("#");
let decoded;
try {
  decoded = atob(decodeURIComponent(codeParam || ""));
} catch (err) {
  console.warn("failed to decode", err);
}
const defaultSynth = new Tone.PolySynth().chain(new Tone.Gain(0.5), Tone.getDestination());
defaultSynth.set({
  oscillator: {type: "triangle"},
  envelope: {
    release: 0.01
  }
});
function getRandomTune() {
  const allTunes = Object.values(tunes);
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return randomItem(allTunes);
}
const randomTune = getRandomTune();
function App() {
  const [editor, setEditor] = useState();
  const {setCode, setPattern, error, code, cycle, dirty, log, togglePlay, activateCode, pattern, pushLog, pending} = useRepl({
    tune: decoded || randomTune,
    defaultSynth,
    onDraw: useCallback(markEvent(editor), [editor])
  });
  const [uiHidden, setUiHidden] = useState(false);
  const logBox = useRef();
  useLayoutEffect(() => {
    logBox.current.scrollTop = logBox.current?.scrollHeight;
  }, [log]);
  useLayoutEffect(() => {
    const handleKeyPress = async (e) => {
      if (e.ctrlKey || e.altKey) {
        switch (e.code) {
          case "Enter":
            await activateCode();
            break;
          case "Period":
            cycle.stop();
        }
      }
    };
    document.addEventListener("keypress", handleKeyPress);
    return () => document.removeEventListener("keypress", handleKeyPress);
  }, [pattern, code]);
  useWebMidi({
    ready: useCallback(({outputs}) => {
      pushLog(`WebMidi ready! Just add .midi(${outputs.map((o) => `'${o.name}'`).join(" | ")}) to the pattern. `);
    }, []),
    connected: useCallback(({outputs}) => {
      pushLog(`Midi device connected! Available: ${outputs.map((o) => `'${o.name}'`).join(", ")}`);
    }, []),
    disconnected: useCallback(({outputs}) => {
      pushLog(`Midi device disconnected! Available: ${outputs.map((o) => `'${o.name}'`).join(", ")}`);
    }, [])
  });
  return /* @__PURE__ */ React.createElement("div", {
    className: "min-h-screen flex flex-col"
  }, /* @__PURE__ */ React.createElement("header", {
    id: "header",
    className: cx("flex-none w-full h-14 px-2 flex border-b border-gray-200  justify-between z-[10]", uiHidden ? "bg-transparent text-white" : "bg-white")
  }, /* @__PURE__ */ React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /* @__PURE__ */ React.createElement("img", {
    src: logo,
    className: "Tidal-logo w-12 h-12",
    alt: "logo"
  }), /* @__PURE__ */ React.createElement("h1", {
    className: "text-2xl"
  }, "Strudel REPL")), /* @__PURE__ */ React.createElement("div", {
    className: "flex space-x-4"
  }, /* @__PURE__ */ React.createElement("button", {
    onClick: () => togglePlay()
  }, !pending ? /* @__PURE__ */ React.createElement("span", {
    className: "flex items-center w-16"
  }, cycle.started ? /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-5 w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z",
    clipRule: "evenodd"
  })) : /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-5 w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z",
    clipRule: "evenodd"
  })), cycle.started ? "pause" : "play") : /* @__PURE__ */ React.createElement(React.Fragment, null, "loading...")), /* @__PURE__ */ React.createElement("button", {
    onClick: async () => {
      const _code = getRandomTune();
      console.log("tune", _code);
      setCode(_code);
      const parsed = await evaluate(_code);
      setPattern(parsed.pattern);
    }
  }, "🎲 random"), /* @__PURE__ */ React.createElement("button", null, /* @__PURE__ */ React.createElement("a", {
    href: "./tutorial"
  }, "📚 tutorial")), /* @__PURE__ */ React.createElement("button", {
    onClick: () => setUiHidden((c) => !c)
  }, "👀 ", uiHidden ? "show ui" : "hide ui"))), /* @__PURE__ */ React.createElement("section", {
    className: "grow flex flex-col text-gray-100"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grow relative",
    id: "code"
  }, /* @__PURE__ */ React.createElement("div", {
    className: cx("h-full transition-opacity", error ? "focus:ring-red-500" : "focus:ring-slate-800", uiHidden ? "opacity-0" : "opacity-100")
  }, /* @__PURE__ */ React.createElement(CodeMirror, {
    value: code,
    editorDidMount: setEditor,
    options: {
      mode: "javascript",
      theme: "material",
      lineNumbers: false,
      styleSelectedText: true,
      cursorBlinkRate: 0
    },
    onCursor: markParens,
    onChange: (_2, __, value) => setCode(value)
  }), /* @__PURE__ */ React.createElement("span", {
    className: "p-4 absolute top-0 right-0 text-xs whitespace-pre text-right pointer-events-none"
  }, !cycle.started ? `press ctrl+enter to play
` : dirty ? `ctrl+enter to update
` : "no changes\n")), error && /* @__PURE__ */ React.createElement("div", {
    className: cx("absolute right-2 bottom-2 px-2", "text-red-500")
  }, error?.message || "unknown error")), /* @__PURE__ */ React.createElement("textarea", {
    className: "z-[10] h-16 border-0 text-xs bg-[transparent] border-t border-slate-600 resize-none",
    value: log,
    readOnly: true,
    ref: logBox,
    style: {fontFamily: "monospace"}
  })));
}
export default App;
