import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CodeMirror as CodeMirror$1 } from 'react-codemirror6';
import { EditorView, Decoration } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { HighlightStyle, tags } from '@codemirror/highlight';
import { useInView } from 'react-hook-inview';
import { evaluate } from '@strudel.cycles/eval';
import { getPlayableNoteValue } from '@strudel.cycles/core/util.mjs';
import { Tone } from '@strudel.cycles/tone';
import { TimeSpan, State } from '@strudel.cycles/core';
import { WebMidi, enableWebMidi } from '@strudel.cycles/midi';

/*
  Credits for color palette:

  Author:     Mattia Astorino (http://github.com/equinusocio)
  Website:    https://material-theme.site/
*/

const ivory = '#abb2bf',
  stone = '#7d8799', // Brightened compared to original to increase contrast
  invalid = '#ffffff',
  darkBackground = '#21252b',
  highlightBackground = 'rgba(0, 0, 0, 0.5)',
  // background = '#292d3e',
  background = 'transparent',
  tooltipBackground = '#353a42',
  selection = 'rgba(128, 203, 196, 0.5)',
  cursor = '#ffcc00';

/// The editor theme styles for Material Palenight.
const materialPalenightTheme = EditorView.theme(
  {
    // done
    '&': {
      color: '#ffffff',
      backgroundColor: background,
      fontSize: '15px',
      'z-index': 11,
    },

    // done
    '.cm-content': {
      caretColor: cursor,
      lineHeight: '22px',
    },
    '.cm-line': {
      background: '#2C323699',
    },
    // done
    '&.cm-focused .cm-cursor': {
      backgroundColor: cursor,
      width: '3px',
    },

    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: selection,
    },

    '.cm-panels': { backgroundColor: darkBackground, color: '#ffffff' },
    '.cm-panels.cm-panels-top': { borderBottom: '2px solid black' },
    '.cm-panels.cm-panels-bottom': { borderTop: '2px solid black' },

    // done, use onedarktheme
    '.cm-searchMatch': {
      backgroundColor: '#72a1ff59',
      outline: '1px solid #457dff',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#6199ff2f',
    },

    '.cm-activeLine': { backgroundColor: highlightBackground },
    '.cm-selectionMatch': { backgroundColor: '#aafe661a' },

    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: '#bad0f847',
      outline: '1px solid #515a6b',
    },

    // done
    '.cm-gutters': {
      background: 'transparent',
      color: '#676e95',
      border: 'none',
    },

    '.cm-activeLineGutter': {
      backgroundColor: highlightBackground,
    },

    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#ddd',
    },

    '.cm-tooltip': {
      border: 'none',
      backgroundColor: tooltipBackground,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: tooltipBackground,
      borderBottomColor: tooltipBackground,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: highlightBackground,
        color: ivory,
      },
    },
  },
  { dark: true },
);

/// The highlighting style for code in the Material Palenight theme.
const materialPalenightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c792ea' },
  { tag: tags.operator, color: '#89ddff' },
  { tag: tags.special(tags.variableName), color: '#eeffff' },
  { tag: tags.typeName, color: '#f07178' },
  { tag: tags.atom, color: '#f78c6c' },
  { tag: tags.number, color: '#ff5370' },
  { tag: tags.definition(tags.variableName), color: '#82aaff' },
  { tag: tags.string, color: '#c3e88d' },
  { tag: tags.special(tags.string), color: '#f07178' },
  { tag: tags.comment, color: stone },
  { tag: tags.variableName, color: '#f07178' },
  { tag: tags.tagName, color: '#ff5370' },
  { tag: tags.bracket, color: '#a2a1a4' },
  { tag: tags.meta, color: '#ffcb6b' },
  { tag: tags.attributeName, color: '#c792ea' },
  { tag: tags.propertyName, color: '#c792ea' },
  { tag: tags.className, color: '#decb6b' },
  { tag: tags.invalid, color: invalid },
]);

/// Extension to enable the Material Palenight theme (both the editor theme and
/// the highlight style).
// : Extension
const materialPalenight = [materialPalenightTheme, materialPalenightHighlightStyle];

const setHighlights = StateEffect.define();
const highlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(highlights, tr) {
    try {
      for (let e of tr.effects) {
        if (e.is(setHighlights)) {
          highlights = Decoration.set(e.value.flatMap((hap) => (hap.context.locations || []).map(({ start, end }) => {
            const color = hap.context.color || "#FFCA28";
            let from = tr.newDoc.line(start.line).from + start.column;
            let to = tr.newDoc.line(end.line).from + end.column;
            const l = tr.newDoc.length;
            if (from > l || to > l) {
              return;
            }
            const mark = Decoration.mark({ attributes: { style: `outline: 1px solid ${color}` } });
            return mark.range(from, to);
          })).filter(Boolean), true);
        }
      }
      return highlights;
    } catch (err) {
      return highlights;
    }
  },
  provide: (f) => EditorView.decorations.from(f)
});
function CodeMirror({ value, onChange, onViewChanged, onCursor, options, editorDidMount }) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(CodeMirror$1, {
    onViewChange: onViewChanged,
    style: {
      display: "flex",
      flexDirection: "column",
      flex: "1 0 auto"
    },
    value,
    onChange,
    extensions: [
      javascript(),
      materialPalenight,
      highlightField
    ]
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
            onTrigger(
              time,
              event,
              currentTime,
              1 /* cps */,
              event.wholeOrPart().begin.valueOf(),
              event.duration.valueOf(),
            );
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
    onSchedule: useCallback((_events, cycle) => logCycle(_events, cycle), []),
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

var style = '';

const container = "_container_10e1g_1";
const header = "_header_10e1g_5";
const buttons = "_buttons_10e1g_9";
const button = "_button_10e1g_9";
const buttonDisabled = "_buttonDisabled_10e1g_17";
const error = "_error_10e1g_21";
const body = "_body_10e1g_25";
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

function MiniRepl({ tune, defaultSynth, hideOutsideView = false }) {
  const { code, setCode, pattern, activateCode, error, cycle, dirty, togglePlay } = useRepl({
    tune,
    defaultSynth,
    autolink: false
  });
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
  useHighlighting({ view, pattern, active: cycle.started });
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

export { CodeMirror, MiniRepl, cx, useCycle, useHighlighting, usePostMessage, useRepl, useWebMidi };
