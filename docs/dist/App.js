import React, {useCallback, useLayoutEffect, useRef, useState} from "../_snowpack/pkg/react.js";
import * as Tone from "../_snowpack/pkg/tone.js";
import CodeMirror, {markEvent} from "./CodeMirror.js";
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
Tone.setContext(new Tone.Context({latencyHint: "playback", lookAhead: 0.5}));
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
  const {setCode, setPattern, error, code, cycle, dirty, log, togglePlay, activateCode, pattern, pushLog} = useRepl({
    tune: decoded || randomTune,
    defaultSynth,
    onDraw: useCallback(markEvent(editor), [editor])
  });
  const logBox = useRef();
  useLayoutEffect(() => {
    logBox.current.scrollTop = logBox.current?.scrollHeight;
  }, [log]);
  useLayoutEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.altKey) {
        switch (e.code) {
          case "Enter":
            activateCode();
            !cycle.started && cycle.start();
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
    className: "min-h-screen bg-[#2A3236] flex flex-col"
  }, /* @__PURE__ */ React.createElement("header", {
    className: "flex-none w-full h-16 px-2 flex border-b border-gray-200 bg-white justify-between"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "flex items-center space-x-2"
  }, /* @__PURE__ */ React.createElement("img", {
    src: logo,
    className: "Tidal-logo w-16 h-16",
    alt: "logo"
  }), /* @__PURE__ */ React.createElement("h1", {
    className: "text-2xl"
  }, "Strudel REPL")), /* @__PURE__ */ React.createElement("div", {
    className: "flex space-x-4"
  }, /* @__PURE__ */ React.createElement("button", {
    onClick: () => {
      const _code = getRandomTune();
      console.log("tune", _code);
      setCode(_code);
      const parsed = evaluate(_code);
      setPattern(parsed.pattern);
    }
  }, "🎲 random tune"), /* @__PURE__ */ React.createElement("button", null, /* @__PURE__ */ React.createElement("a", {
    href: "./tutorial"
  }, "📚 tutorial")))), /* @__PURE__ */ React.createElement("section", {
    className: "grow flex flex-col text-gray-100"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grow relative"
  }, /* @__PURE__ */ React.createElement("div", {
    className: cx("h-full  bg-[#2A3236]", error ? "focus:ring-red-500" : "focus:ring-slate-800")
  }, /* @__PURE__ */ React.createElement(CodeMirror, {
    value: code,
    editorDidMount: setEditor,
    options: {
      mode: "javascript",
      theme: "material",
      lineNumbers: true,
      styleSelectedText: true,
      cursorBlinkRate: 0
    },
    onChange: (_2, __, value) => setCode(value)
  }), /* @__PURE__ */ React.createElement("span", {
    className: "p-4 absolute top-0 right-0 text-xs whitespace-pre text-right"
  }, !cycle.started ? `press ctrl+enter to play
` : dirty ? `ctrl+enter to update
` : "no changes\n")), error && /* @__PURE__ */ React.createElement("div", {
    className: cx("absolute right-2 bottom-2 px-2", "text-red-500")
  }, error?.message || "unknown error")), /* @__PURE__ */ React.createElement("button", {
    className: "flex-none w-full border border-gray-700 p-2 bg-slate-700 hover:bg-slate-500",
    onClick: () => togglePlay()
  }, cycle.started ? "pause" : "play"), /* @__PURE__ */ React.createElement("textarea", {
    className: "grow bg-[#283237] border-0 text-xs min-h-[200px]",
    value: log,
    readOnly: true,
    ref: logBox,
    style: {fontFamily: "monospace"}
  })));
}
export default App;
