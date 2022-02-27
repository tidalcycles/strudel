import {useCallback, useState, useMemo} from "../_snowpack/pkg/react.js";
import {isNote} from "../_snowpack/pkg/tone.js";
import {evaluate} from "./evaluate.js";
import useCycle from "./useCycle.js";
import usePostMessage from "./usePostMessage.js";
let s4 = () => {
  return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
};
function useRepl({tune, defaultSynth, autolink = true, onEvent, onDraw}) {
  const id = useMemo(() => s4(), []);
  const [code, setCode] = useState(tune);
  const [activeCode, setActiveCode] = useState();
  const [log, setLog] = useState("");
  const [error, setError] = useState();
  const [hash, setHash] = useState("");
  const [pattern, setPattern] = useState();
  const dirty = code !== activeCode || error;
  const generateHash = () => encodeURIComponent(btoa(code));
  const activateCode = (_code = code) => {
    !cycle.started && cycle.start();
    broadcast({type: "start", from: id});
    if (activeCode && !dirty) {
      setError(void 0);
      return;
    }
    try {
      const parsed = evaluate(_code);
      setPattern(() => parsed.pattern);
      if (autolink) {
        window.location.hash = "#" + encodeURIComponent(btoa(code));
      }
      setHash(generateHash());
      setError(void 0);
      setActiveCode(_code);
    } catch (err) {
      err.message = "evaluation error: " + err.message;
      console.warn(err);
      setError(err);
    }
  };
  const pushLog = (message) => setLog((log2) => log2 + `${log2 ? "\n\n" : ""}${message}`);
  const logCycle = (_events, cycle2) => {
    if (_events.length) {
    }
  };
  const cycle = useCycle({
    onDraw,
    onEvent: useCallback((time, event) => {
      try {
        onEvent?.(event);
        if (!event.value?.onTrigger) {
          const note = event.value?.value || event.value;
          if (!isNote(note)) {
            throw new Error("not a note: " + note);
          }
          if (defaultSynth) {
            defaultSynth.triggerAttackRelease(note, event.duration, time);
          } else {
            throw new Error("no defaultSynth passed to useRepl.");
          }
        } else {
          const {onTrigger} = event.value;
          onTrigger(time, event);
        }
      } catch (err) {
        console.warn(err);
        err.message = "unplayable event: " + err?.message;
        pushLog(err.message);
      }
    }, [onEvent]),
    onQuery: useCallback((span) => {
      try {
        return pattern?.query(span) || [];
      } catch (err) {
        console.warn(err);
        err.message = "query error: " + err.message;
        setError(err);
        return [];
      }
    }, [pattern]),
    onSchedule: useCallback((_events, cycle2) => logCycle(_events, cycle2), [pattern]),
    ready: !!pattern
  });
  const broadcast = usePostMessage(({data: {from, type}}) => {
    if (type === "start" && from !== id) {
      cycle.setStarted(false);
      setActiveCode(void 0);
    }
  });
  const togglePlay = () => {
    if (!cycle.started) {
      activateCode();
    } else {
      cycle.stop();
    }
  };
  return {
    code,
    setCode,
    pattern,
    error,
    cycle,
    setPattern,
    dirty,
    log,
    togglePlay,
    activateCode,
    activeCode,
    pushLog,
    hash
  };
}
export default useRepl;
