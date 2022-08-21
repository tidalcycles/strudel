import React, { useCallback, useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import _CodeMirror from '@uiw/react-codemirror';
import { Decoration, EditorView } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { tags } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';
import { useInView } from 'react-hook-inview';
import { evaluate } from '@strudel.cycles/eval';
import { getPlayableNoteValue } from '@strudel.cycles/core/util.mjs';
import { Tone } from '@strudel.cycles/tone';
import { TimeSpan, State, Scheduler } from '@strudel.cycles/core';
import { WebMidi, enableWebMidi } from '@strudel.cycles/midi';

var strudelTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#222',
    foreground: '#75baff', // whats that?
    caret: '#ffcc00',
    selection: 'rgba(128, 203, 196, 0.5)',
    selectionMatch: '#036dd626',
    lineHighlight: '#8a91991a',
    gutterBackground: 'transparent',
    // gutterForeground: '#8a919966',
    gutterForeground: '#676e95',
  },
  styles: [
    { tag: tags.keyword, color: '#c792ea' },
    { tag: tags.operator, color: '#89ddff' },
    { tag: tags.special(tags.variableName), color: '#eeffff' },
    { tag: tags.typeName, color: '#f07178' },
    { tag: tags.atom, color: '#f78c6c' },
    { tag: tags.number, color: '#ff5370' },
    { tag: tags.definition(tags.variableName), color: '#82aaff' },
    { tag: tags.string, color: '#c3e88d' },
    { tag: tags.special(tags.string), color: '#f07178' },
    { tag: tags.comment, color: '#7d8799' },
    { tag: tags.variableName, color: '#f07178' },
    { tag: tags.tagName, color: '#ff5370' },
    { tag: tags.bracket, color: '#a2a1a4' },
    { tag: tags.meta, color: '#ffcb6b' },
    { tag: tags.attributeName, color: '#c792ea' },
    { tag: tags.propertyName, color: '#c792ea' },
    { tag: tags.className, color: '#decb6b' },
    { tag: tags.invalid, color: '#ffffff' },
  ],
});

var style = '';

const setFlash = StateEffect.define();
const flashField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(flash2, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setFlash)) {
          if (e.value) {
            const mark = Decoration.mark({ attributes: { style: `background-color: #FFCA2880` } });
            flash2 = Decoration.set([mark.range(0, tr.newDoc.length)]);
          } else {
            flash2 = Decoration.set([]);
          }
        }
      }
      return flash2;
    } catch (err) {
      console.warn("flash error", err);
      return flash2;
    }
  },
  provide: (f) => EditorView.decorations.from(f)
});
const flash = (view) => {
  view.dispatch({ effects: setFlash.of(true) });
  setTimeout(() => {
    view.dispatch({ effects: setFlash.of(false) });
  }, 200);
};
const setHighlights = StateEffect.define();
const highlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setHighlights)) {
          const marks = e.value.map(
            (hap) => (hap.context.locations || []).map(({ start, end }) => {
              const color = hap.context.color || "#FFCA28";
              let from = tr.newDoc.line(start.line).from + start.column;
              let to = tr.newDoc.line(end.line).from + end.column;
              const l = tr.newDoc.length;
              if (from > l || to > l) {
                return;
              }
              const mark = Decoration.mark({ attributes: { style: `outline: 1.5px solid ${color};` } });
              return mark.range(from, to);
            })
          ).flat().filter(Boolean) || [];
          highlights = Decoration.set(marks, true);
        }
      }
      return highlights;
    } catch (err) {
      return Decoration.set([]);
    }
  },
  provide: (f) => EditorView.decorations.from(f)
});
const extensions = [javascript(), strudelTheme, highlightField, flashField];
function CodeMirror({ value, onChange, onViewChanged, onSelectionChange, options, editorDidMount }) {
  const handleOnChange = useCallback(
    (value2) => {
      onChange?.(value2);
    },
    [onChange]
  );
  const handleOnCreateEditor = useCallback(
    (view) => {
      onViewChanged?.(view);
    },
    [onViewChanged]
  );
  const handleOnUpdate = useCallback(
    (viewUpdate) => {
      if (viewUpdate.selectionSet && onSelectionChange) {
        onSelectionChange?.(viewUpdate.state.selection);
      }
    },
    [onSelectionChange]
  );
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(_CodeMirror, {
    value,
    onChange: handleOnChange,
    onCreateEditor: handleOnCreateEditor,
    onUpdate: handleOnUpdate,
    extensions
  }));
}

/*
useCycle.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/useCycle.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* export declare interface UseCycleProps {
  onEvent: ToneEventCallback<any>;
  onQuery?: (state: State) => Hap[];
  onSchedule?: (events: Hap[], cycle: number) => void;
  onDraw?: ToneEventCallback<any>;
  ready?: boolean; // if false, query will not be called on change props
} */

// function useCycle(props: UseCycleProps) {
function useCycle(props) {
  // onX must use useCallback!
  const { onEvent, onQuery, onSchedule, ready = true, onDraw } = props;
  const [started, setStarted] = useState(false);
  const cycleDuration = 1;
  const activeCycle = () => Math.floor(Tone.getTransport().seconds / cycleDuration);

  // pull events with onQuery + count up to next cycle
  const query = (cycle = activeCycle()) => {
    const timespan = new TimeSpan(cycle, cycle + 1);
    const events = onQuery?.(new State(timespan)) || [];
    onSchedule?.(events, cycle);
    // cancel events after current query. makes sure no old events are player for rescheduled cycles
    // console.log('schedule', cycle);
    // query next cycle in the middle of the current
    const cancelFrom = timespan.begin.valueOf();
    Tone.getTransport().cancel(cancelFrom);
    // const queryNextTime = (cycle + 1) * cycleDuration - 0.1;
    const queryNextTime = (cycle + 1) * cycleDuration - 0.5;

    // if queryNextTime would be before current time, execute directly (+0.1 for safety that it won't miss)
    const t = Math.max(Tone.getTransport().seconds, queryNextTime) + 0.1;
    Tone.getTransport().schedule(() => {
      query(cycle + 1);
    }, t);

    // schedule events for next cycle
    events
      ?.filter((event) => event.part.begin.equals(event.whole?.begin))
      .forEach((event) => {
        Tone.getTransport().schedule((time) => {
          onEvent(time, event, Tone.getContext().currentTime);
          Tone.Draw.schedule(() => {
            // do drawing or DOM manipulation here
            onDraw?.(time, event);
          }, time);
        }, event.part.begin.valueOf());
      });
  };

  useEffect(() => {
    ready && query();
  }, [onEvent, onSchedule, onQuery, onDraw, ready]);

  const start = async () => {
    setStarted(true);
    await Tone.start();
    Tone.getTransport().start('+0.1');
  };
  const stop = () => {
    Tone.getTransport().pause();
    setStarted(false);
  };
  const toggle = () => (started ? stop() : start());
  return {
    start,
    stop,
    onEvent,
    started,
    setStarted,
    toggle,
    query,
    activeCycle,
  };
}

/*
usePostMessage.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/usePostMessage.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

function usePostMessage(listener) {
  useEffect(() => {
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [listener]);
  return useCallback((data) => window.postMessage(data, '*'), []);
}

/*
useRepl.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/useRepl.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

let s4 = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};
const generateHash = (code) => encodeURIComponent(btoa(code));

function useRepl({ tune, defaultSynth, autolink = true, onEvent, onDraw: onDrawProp }) {
  const id = useMemo(() => s4(), []);
  const [code, setCode] = useState(tune);
  const [activeCode, setActiveCode] = useState();
  const [log, setLog] = useState('');
  const [error, setError] = useState();
  const [pending, setPending] = useState(false);
  const [hash, setHash] = useState('');
  const [pattern, setPattern] = useState();
  const dirty = useMemo(() => code !== activeCode || error, [code, activeCode, error]);
  const pushLog = useCallback((message) => setLog((log) => log + `${log ? '\n\n' : ''}${message}`), []);

  // below block allows disabling the highlighting by including "strudel disable-highlighting" in the code (as comment)
  const onDraw = useMemo(() => {
    if (activeCode && !activeCode.includes('strudel disable-highlighting')) {
      return (time, event) => onDrawProp?.(time, event, activeCode);
    }
  }, [activeCode, onDrawProp]);

  const hideHeader = useMemo(() => activeCode && activeCode.includes('strudel hide-header'), [activeCode]);
  const hideConsole = useMemo(() => activeCode && activeCode.includes('strudel hide-console'), [activeCode]);
  // cycle hook to control scheduling
  const cycle = useCycle({
    onDraw,
    onEvent: useCallback(
      (time, event, currentTime) => {
        try {
          onEvent?.(event);
          if (event.context.logs?.length) {
            event.context.logs.forEach(pushLog);
          }
          const { onTrigger, velocity } = event.context;
          if (!onTrigger) {
            if (defaultSynth) {
              const note = getPlayableNoteValue(event);
              defaultSynth.triggerAttackRelease(note, event.duration.valueOf(), time, velocity);
            } else {
              throw new Error('no defaultSynth passed to useRepl.');
            }
            /* console.warn('no instrument chosen', event);
          throw new Error(`no instrument chosen for ${JSON.stringify(event)}`); */
          } else {
            onTrigger(time, event, currentTime, 1 /* cps */);
          }
        } catch (err) {
          console.warn(err);
          err.message = 'unplayable event: ' + err?.message;
          pushLog(err.message); // not with setError, because then we would have to setError(undefined) on next playable event
        }
      },
      [onEvent, pushLog, defaultSynth],
    ),
    onQuery: useCallback(
      (state) => {
        try {
          return pattern?.query(state) || [];
        } catch (err) {
          console.warn(err);
          err.message = 'query error: ' + err.message;
          setError(err);
          return [];
        }
      },
      [pattern],
    ),
    onSchedule: useCallback((_events, cycle) => logCycle(_events), []),
    ready: !!pattern && !!activeCode,
  });

  const broadcast = usePostMessage(({ data: { from, type } }) => {
    if (type === 'start' && from !== id) {
      // console.log('message', from, type);
      cycle.setStarted(false);
      setActiveCode(undefined);
    }
  });

  const activateCode = useCallback(
    async (_code = code) => {
      if (activeCode && !dirty) {
        setError(undefined);
        cycle.start();
        return;
      }
      try {
        setPending(true);
        const parsed = await evaluate(_code);
        cycle.start();
        broadcast({ type: 'start', from: id });
        setPattern(() => parsed.pattern);
        if (autolink) {
          window.location.hash = '#' + encodeURIComponent(btoa(code));
        }
        setHash(generateHash(code));
        setError(undefined);
        setActiveCode(_code);
        setPending(false);
      } catch (err) {
        err.message = 'evaluation error: ' + err.message;
        console.warn(err);
        setError(err);
      }
    },
    [activeCode, dirty, code, cycle, autolink, id, broadcast],
  );
  // logs events of cycle
  const logCycle = (_events, cycle) => {
    if (_events.length) ;
  };

  const togglePlay = () => {
    if (!cycle.started) {
      activateCode();
    } else {
      cycle.stop();
    }
  };

  return {
    hideHeader,
    hideConsole,
    pending,
    code,
    setCode,
    pattern,
    error,
    cycle,
    setPattern,
    dirty,
    log,
    togglePlay,
    setActiveCode,
    activateCode,
    activeCode,
    pushLog,
    hash,
  };
}

/*
cx.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/cx.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

function cx(...classes) {
  // : Array<string | undefined>
  return classes.filter(Boolean).join(' ');
}

let highlights = []; // actively highlighted events
let lastEnd;

function useHighlighting({ view, pattern, active }) {
  useEffect(() => {
    if (view) {
      if (pattern && active) {
        let frame = requestAnimationFrame(updateHighlights);

        function updateHighlights() {
          try {
            const audioTime = Tone.getTransport().seconds;
            // force min framerate of 10 fps => fixes crash on tab refocus, where lastEnd could be far away
            // see https://github.com/tidalcycles/strudel/issues/108
            const begin = Math.max(lastEnd || audioTime, audioTime - 1 / 10);
            const span = [begin, audioTime + 1 / 60];
            lastEnd = audioTime + 1 / 60;
            highlights = highlights.filter((hap) => hap.whole.end > audioTime); // keep only highlights that are still active
            const haps = pattern.queryArc(...span).filter((hap) => hap.hasOnset());
            highlights = highlights.concat(haps); // add potential new onsets
            view.dispatch({ effects: setHighlights.of(highlights) }); // highlight all still active + new active haps
          } catch (err) {
            // console.log('error in updateHighlights', err);
            view.dispatch({ effects: setHighlights.of([]) });
          }
          frame = requestAnimationFrame(updateHighlights);
        }

        return () => {
          cancelAnimationFrame(frame);
        };
      } else {
        highlights = [];
        view.dispatch({ effects: setHighlights.of([]) });
      }
    }
  }, [pattern, active, view]);
}

var tailwind = '';

const container = "_container_3i85k_1";
const header = "_header_3i85k_5";
const buttons = "_buttons_3i85k_9";
const button = "_button_3i85k_9";
const buttonDisabled = "_buttonDisabled_3i85k_17";
const error = "_error_3i85k_21";
const body = "_body_3i85k_25";
var styles = {
	container: container,
	header: header,
	buttons: buttons,
	button: button,
	buttonDisabled: buttonDisabled,
	error: error,
	body: body
};

function Icon({ type }) {
  return /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "sc-h-5 sc-w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, {
    refresh: /* @__PURE__ */ React.createElement("path", {
      fillRule: "evenodd",
      d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z",
      clipRule: "evenodd"
    }),
    play: /* @__PURE__ */ React.createElement("path", {
      fillRule: "evenodd",
      d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z",
      clipRule: "evenodd"
    }),
    pause: /* @__PURE__ */ React.createElement("path", {
      fillRule: "evenodd",
      d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z",
      clipRule: "evenodd"
    })
  }[type]);
}

function MiniRepl({ tune, defaultSynth, hideOutsideView = false, theme, init, onEvent, enableKeyboard }) {
  const { code, setCode, pattern, activeCode, activateCode, evaluateOnly, error, cycle, dirty, togglePlay, stop } = useRepl({
    tune,
    defaultSynth,
    autolink: false,
    onEvent
  });
  useEffect(() => {
    init && evaluateOnly();
  }, [tune, init]);
  const [view, setView] = useState();
  const [ref, isVisible] = useInView({
    threshold: 0.01
  });
  const wasVisible = useRef();
  const show = useMemo(() => {
    if (isVisible || !hideOutsideView) {
      wasVisible.current = true;
    }
    return isVisible || wasVisible.current;
  }, [isVisible, hideOutsideView]);
  useHighlighting({ view, pattern, active: cycle.started && !activeCode?.includes("strudel disable-highlighting") });
  useLayoutEffect(() => {
    if (enableKeyboard) {
      const handleKeyPress = async (e) => {
        if (e.ctrlKey || e.altKey) {
          if (e.code === "Enter") {
            e.preventDefault();
            flash(view);
            await activateCode();
          } else if (e.code === "Period") {
            cycle.stop();
            e.preventDefault();
          }
        }
      };
      window.addEventListener("keydown", handleKeyPress, true);
      return () => window.removeEventListener("keydown", handleKeyPress, true);
    }
  }, [enableKeyboard, pattern, code, activateCode, cycle, view]);
  return /* @__PURE__ */ React.createElement("div", {
    className: styles.container,
    ref
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.header
  }, /* @__PURE__ */ React.createElement("div", {
    className: styles.buttons
  }, /* @__PURE__ */ React.createElement("button", {
    className: cx(styles.button, cycle.started ? "sc-animate-pulse" : ""),
    onClick: () => togglePlay()
  }, /* @__PURE__ */ React.createElement(Icon, {
    type: cycle.started ? "pause" : "play"
  })), /* @__PURE__ */ React.createElement("button", {
    className: cx(dirty ? styles.button : styles.buttonDisabled),
    onClick: () => activateCode()
  }, /* @__PURE__ */ React.createElement(Icon, {
    type: "refresh"
  }))), error && /* @__PURE__ */ React.createElement("div", {
    className: styles.error
  }, error.message)), /* @__PURE__ */ React.createElement("div", {
    className: styles.body
  }, show && /* @__PURE__ */ React.createElement(CodeMirror, {
    value: code,
    onChange: setCode,
    onViewChanged: setView
  })));
}

function useStrudel({ defaultOutput, interval, getTime, code, evalOnMount = true }) {
  // scheduler
  const [schedulerError, setSchedulerError] = useState();
  const [evalError, setEvalError] = useState();
  const [activeCode, setActiveCode] = useState(code);
  const isDirty = code !== activeCode;
  // TODO: how / when to remove schedulerError?
  const scheduler = useMemo(
    () => new Scheduler({ interval, onTrigger: defaultOutput, onError: setSchedulerError, getTime }),
    [defaultOutput, interval],
  );
  const evaluate$1 = useCallback(async () => {
    if (!code) {
      console.log('no code..');
      return;
    }
    try {
      // TODO: let user inject custom eval function?
      const { pattern } = await evaluate(code);
      setActiveCode(code);
      scheduler?.setPattern(pattern);
      setEvalError();
    } catch (err) {
      setEvalError(err);
      console.warn('eval error', err);
    }
  }, [code, scheduler]);

  const inited = useRef();
  useEffect(() => {
    if (!inited.current && evalOnMount) {
      inited.current = true;
      evaluate$1();
    }
  }, [evaluate$1, evalOnMount]);

  return { schedulerError, scheduler, evalError, evaluate: evaluate$1, activeCode, isDirty };
}

// set active pattern on ctrl+enter
const useKeydown = (callback) =>
  useLayoutEffect(() => {
    window.addEventListener('keydown', callback, true);
    return () => window.removeEventListener('keydown', callback, true);
  }, [callback]);

/*
useWebMidi.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/useWebMidi.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

function useWebMidi(props) {
  const { ready, connected, disconnected } = props;
  const [loading, setLoading] = useState(true);
  const [outputs, setOutputs] = useState(WebMidi?.outputs || []);
  useEffect(() => {
    enableWebMidi()
      .then(() => {
        // Reacting when a new device becomes available
        WebMidi.addListener('connected', (e) => {
          setOutputs([...WebMidi.outputs]);
          connected?.(WebMidi, e);
        });
        // Reacting when a device becomes unavailable
        WebMidi.addListener('disconnected', (e) => {
          setOutputs([...WebMidi.outputs]);
          disconnected?.(WebMidi, e);
        });
        ready?.(WebMidi);
        setLoading(false);
      })
      .catch((err) => {
        if (err) {
          console.error(err);
          //throw new Error("Web Midi could not be enabled...");
          console.warn('Web Midi could not be enabled..');
          return;
        }
      });
  }, [ready, connected, disconnected, outputs]);
  const outputByName = (name) => WebMidi.getOutputByName(name);
  return { loading, outputs, outputByName };
}

export { CodeMirror, MiniRepl, cx, flash, useCycle, useHighlighting, useKeydown, usePostMessage, useRepl, useStrudel, useWebMidi };
